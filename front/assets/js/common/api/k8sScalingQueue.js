// ===================================================================
// K8s 다단계 작업 대기열 (NodeGroup 생성 / Edit Scaling)
// ===================================================================
// 두 작업 모두 "요청 하나로 끝나지 않는다".
//   - NodeGroup 생성: tumblebug 응답이 건당 40초~2분. 여러 건이면 순차로 보내야 한다.
//   - Edit Scaling: CSP 에 따라 Set → (CSP 수렴 대기) → Change 2단계가 필요하다.
// 예전에는 이 체인이 화면 모듈 안에서만 살아 있어서, 도중에 페이지를 떠나면 남은 요청이
// 조용히 사라졌다(서버 로그에는 broken pipe 만 남는다).
//
// 그래서 진행 상태를 sessionStorage 에 적어 두고, 이 모듈을 application.html 에서
// **모든 페이지**에 로드한다. 어느 화면에 있든 응답을 받는 즉시 다음 호출이 나가고,
// 브라우저를 완전히 닫았을 때만 다음 접속에서 이어서 실행된다.
// ===================================================================

import { getRules } from "../utils/k8sScalingRules.js";

const PENDING_NODEGROUP_KEY = "mcmp_pending_k8s_nodegroup_creates";
const PENDING_SCALING_KEY = "mcmp_pending_k8s_scaling_jobs";
const NODEGROUP_CONTROLLER = "/api/mc-infra-manager/PostK8sNodeGroup";
const POLL_DEFAULTS = { intervalMs: 5000, timeoutMs: 180000 };

// 같은 탭에서 같은 작업이 두 번 도는 것을 막는다
const activeKeys = new Set();
let nodeGroupQueueRunning = false;

// ── 저장소 ──────────────────────────────────────────────────────────────────
function readJobs(key) {
  try {
    const raw = sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read pending K8s jobs:", error);
    return [];
  }
}

function writeJobs(key, jobs) {
  try {
    if (!jobs || jobs.length === 0) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(jobs));
  } catch (error) {
    console.error("Failed to persist pending K8s jobs:", error);
  }
}

function jobKey(job) {
  return job.nsId + "/" + job.clusterId + "/" + job.nodeGroupName;
}

function upsertJob(key, job) {
  const jobs = readJobs(key).filter((j) => jobKey(j) !== jobKey(job));
  jobs.push(job);
  writeJobs(key, jobs);
}

function dropJob(key, job) {
  writeJobs(key, readJobs(key).filter((j) => jobKey(j) !== jobKey(job)));
}

// ── 화면 연동 (있을 때만) ───────────────────────────────────────────────────
function toast(message, type) {
  webconsolejs["common/util"]?.showToast(message, type);
}

function refreshK8sList() {
  const page = webconsolejs["pages/operation/manage/k8sworkloads"];
  if (page && typeof page.refreshPmkList === "function") page.refreshPmkList();
}

function trackedOptions(operationId, label) {
  const helper = webconsolejs["common/api/requestId"];
  if (!helper || typeof helper.beginTrackedRequest !== "function") {
    return { loaderType: "none" };
  }
  return helper.beginTrackedRequest(operationId, label).httpOptions;
}

async function post(controller, data, options) {
  return await webconsolejs["common/api/http"].commonAPIPost(controller, data, false, options);
}

function okStatus(response) {
  return !!response && (response.status === 200 || response.status === 201);
}

// ── 조회 (진행 판정용) ──────────────────────────────────────────────────────
async function fetchNodeGroups(job) {
  const response = await post("/api/mc-infra-manager/GetK8sCluster", {
    pathParams: { nsId: job.nsId, k8sClusterId: job.clusterId },
  }, { loaderType: "none" });
  return (response && response.data && response.data.responseData
    && response.data.responseData.k8sNodeGroupList) || [];
}

async function fetchScalingState(job) {
  const list = await fetchNodeGroups(job);
  const ng = list.find((item) => item && (item.name === job.nodeGroupName
    || item.cspResourceId === job.nodeGroupName
    || item.cspResourceName === job.nodeGroupName));
  if (!ng) return null;
  const sv = ng.spiderViewK8sNodeGroupDetail || {};
  const num = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; };
  const nodeCount = Array.isArray(sv.Nodes) ? sv.Nodes.length : 0;
  // tumblebug 과 cb-spider 는 상태를 Active/Creating 으로 정규화하면서 CSP 원본 상태를 잃는다.
  // NHN 은 원본을 keyValueList 에 남긴다(Status=UPDATE_IN_PROGRESS 등) — 대기 판정에 필요하다.
  const kvList = Array.isArray(ng.keyValueList) ? ng.keyValueList : [];
  const kv = (name) => {
    const hit = kvList.find((x) => String(x?.key ?? x?.Key ?? "").toLowerCase() === name);
    return hit ? String(hit.value ?? hit.Value ?? "") : "";
  };
  return {
    on: String(sv.OnAutoScaling ?? ng.onAutoScaling) === "true",
    desired: num(sv.DesiredNodeSize ?? ng.desiredNodeSize),
    min: num(sv.MinNodeSize ?? ng.minNodeSize),
    max: num(sv.MaxNodeSize ?? ng.maxNodeSize),
    nodeCount,
    status: String(sv.Status ?? ng.status ?? ""),
    cspStatus: kv("status"),
  };
}

// ── NodeGroup 생성 큐 ───────────────────────────────────────────────────────
export function enqueueNodeGroupCreates(nsId, clusterId, configs) {
  const jobs = configs.map((config) => ({
    nsId, clusterId, nodeGroupName: config.name, config, sentAt: null,
  }));
  const existing = readJobs(PENDING_NODEGROUP_KEY);
  const keys = new Set(existing.map(jobKey));
  writeJobs(PENDING_NODEGROUP_KEY, existing.concat(jobs.filter((j) => !keys.has(jobKey(j)))));
  runNodeGroupQueue();
}

async function nodeGroupExists(job) {
  try {
    const list = await fetchNodeGroups(job);
    return list.some((ng) => ng && ng.name === job.nodeGroupName);
  } catch (error) {
    console.error("Failed to check existing NodeGroups:", error);
    return false;
  }
}

async function runNodeGroupQueue() {
  if (nodeGroupQueueRunning) return;
  nodeGroupQueueRunning = true;

  const created = [];
  const failed = [];
  try {
    for (;;) {
      const job = readJobs(PENDING_NODEGROUP_KEY).find((j) => !activeKeys.has(jobKey(j)));
      if (!job) break;

      const key = jobKey(job);
      activeKeys.add(key);
      try {
        // 이전 시도가 서버에서는 끝났을 수 있다 — 다시 보내면 중복 생성이 된다
        if (job.sentAt && await nodeGroupExists(job)) {
          created.push(job.nodeGroupName);
          continue;
        }
        upsertJob(PENDING_NODEGROUP_KEY, Object.assign({}, job, { sentAt: Date.now() }));

        const response = await post(NODEGROUP_CONTROLLER, {
          pathParams: { nsId: job.nsId, k8sClusterId: job.clusterId },
          request: job.config,
        }, trackedOptions("PostK8sNodeGroup", "K8s NG create: " + job.nodeGroupName));

        if (okStatus(response)) created.push(job.nodeGroupName);
        else { console.error("NodeGroup creation failed:", job.nodeGroupName, response); failed.push(job.nodeGroupName); }
      } catch (error) {
        console.error("NodeGroup creation error:", job.nodeGroupName, error);
        failed.push(job.nodeGroupName);
      } finally {
        activeKeys.delete(key);
        dropJob(PENDING_NODEGROUP_KEY, job);
      }
    }
  } finally {
    nodeGroupQueueRunning = false;
  }

  if (created.length === 0 && failed.length === 0) return;
  if (failed.length === 0) toast("NodeGroup creation completed (" + created.length + ")", "success");
  else toast("Failed to create NodeGroup: " + failed.join(", "), "error");
  refreshK8sList();
}

// ── Edit Scaling 큐 ─────────────────────────────────────────────────────────
export function enqueueScalingJob(job) {
  const stored = Object.assign({ cursor: 0 }, job);
  upsertJob(PENDING_SCALING_KEY, stored);
  return runScalingJob(stored);
}

export function isScalingJobPending(nsId, clusterId, nodeGroupName) {
  const key = nsId + "/" + clusterId + "/" + nodeGroupName;
  return readJobs(PENDING_SCALING_KEY).some((j) => jobKey(j) === key);
}

function stepError(step, message) {
  const error = new Error(message);
  error.step = step;
  return error;
}

function serverMessage(response) {
  return response?.data?.responseData?.message
    || response?.data?.status?.message
    || response?.data?.error
    || response?.statusText
    || "Request failed";
}

function assertStepOk(step, response) {
  if (!okStatus(response)) throw stepError(step, serverMessage(response));
  // tumblebug 은 드라이버가 아무 일도 하지 않아도 200 + result:"false" 를 준다(NCP 등)
  const result = response?.data?.responseData?.result;
  if (step.kind === "set" && String(result ?? "true") === "false") {
    throw stepError(step, "The provider did not apply the autoscaling change.");
  }
}

// 재개 시 "이 단계가 이미 반영됐는지" — 요청은 나갔는데 응답을 못 받은 경우 중복 적용을 막는다
function stepSatisfied(provider, step, state) {
  if (!state) return false;
  if (step.kind === "set") return state.on === step.on;
  if (step.kind !== "change") return false;
  const desiredIgnored = getRules(provider)?.modify?.desiredAppliedViaRange === true;
  const rangeSame = state.min === step.minNodeSize && state.max === step.maxNodeSize;
  return rangeSame && (desiredIgnored || state.desired === step.desiredNodeSize);
}

// CSP가 아직 작업 중임을 뜻하는 상태들. 모두 스스로 Active 로 되돌아간다.
// (cb-spider 공통 enum: NodeGroupCreating / NodeGroupUpdating — Azure 드라이버는
//  VMSS·agentPool 의 ProvisioningState 가 Updating/Upgrading/Scaling 이면 Updating 을 보고한다)
const TRANSITIONAL_STATUSES = new Set(["creating", "updating", "scaling", "upgrading"]);

function isSettled(state) {
  // CSP 원본 상태가 있으면 그쪽이 우선이다. NHN 은 NodeGroup 이 UPDATE_IN_PROGRESS 인 동안에도
  // tumblebug 이 Active 로 보고하는데, 그 사이 autoscale 호출은 400 으로 거부된다
  // (2026-09-16 실측: "status UPDATE_IN_PROGRESS is not supported").
  if (/_IN_PROGRESS$/i.test(state?.cspStatus || "")) return false;
  // 상태를 못 읽으면 판단 근거가 없으므로 막지 않는다(상태를 안 채우는 CSP가 있다)
  if (!state?.status) return true;
  return !TRANSITIONAL_STATUSES.has(state.status.toLowerCase());
}

function untilSatisfied(until, state) {
  if (!state) return false;
  // 값이 목표치에 닿았어도 CSP 작업이 진행 중이면 다음 호출은 거부된다.
  // Azure 는 이 경우 409 OperationNotAllowed(AnotherOperationInProgress)를 돌려준다 —
  // cb-spider 는 agentPool 스펙이 바뀌는 즉시 OnAutoScaling 을 뒤집어 보고하지만
  // Azure 의 nodepool operation 은 그 뒤에야 시작된다.
  if (!isSettled(state)) return false;
  if (typeof until?.on === "boolean" && state.on !== until.on) return false;
  if (Number.isFinite(until?.desired)
    && state.nodeCount !== until.desired && state.desired !== until.desired) return false;
  return true;
}

// tumblebug 의 200 은 CSP 반영 완료가 아니다 — 실제 상태가 바뀔 때까지 기다린다
async function waitForState(job, step) {
  const intervalMs = window.__k8sScalingPollIntervalMs || step.intervalMs || POLL_DEFAULTS.intervalMs;
  const deadline = Date.now() + (step.timeoutMs || POLL_DEFAULTS.timeoutMs);
  // CSP 작업이 아직 시작되지도 않은 순간을 "완료"로 오판하지 않도록 연속 2회 확인한다.
  // (Azure 실측: Set 응답 뒤 약 7초가 지나서야 nodepool operation 이 시작됐다)
  const REQUIRED_CONSECUTIVE = 2;
  let streak = 0;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    let state = null;
    try { state = await fetchScalingState(job); } catch (error) {
      console.error("Failed to poll NodeGroup scaling state:", error);
    }
    streak = untilSatisfied(step.until, state) ? streak + 1 : 0;
    if (streak >= REQUIRED_CONSECUTIVE) return;
  }
  throw stepError(step, "Timed out waiting for the provider to apply the change.");
}

// 적용 결과 판정.
// CSP 가 새 값을 보고하기까지 시간이 걸린다 — AWS EKS 는 ASG 변경이 관리형 NodeGroup 의
// ScalingConfig 에 반영되는 데 약 6분이 걸리는 것을 실측했다(노드 수는 36초 만에 바뀌었다).
// 그래서 보고값이 아직 옛것이어도 **노드 수가 목표와 같으면 적용된 것으로 본다.**
function mismatch(expected, actual) {
  if (!expected || !actual) return false;

  const nodeCountReached = Number.isFinite(expected.desired)
    && actual.nodeCount === expected.desired;

  const actualChecked = actual.on && actual.max > actual.min;
  const stateMatches = expected.checked === actualChecked
    && (!expected.checked || (expected.min === actual.min && expected.max === actual.max));

  return !(stateMatches || nodeCountReached);
}

async function runScalingJob(job, options = {}) {
  const key = jobKey(job);
  if (activeKeys.has(key)) return;
  activeKeys.add(key);

  const steps = job.plan.steps;
  const callCount = steps.filter((step) => step.kind !== "wait").length;
  let doneCount = steps.slice(0, job.cursor || 0).filter((step) => step.kind !== "wait").length;
  let verifyFirstCall = options.resumed === true;

  try {
    for (let i = job.cursor || 0; i < steps.length; i += 1) {
      const step = steps[i];
      upsertJob(PENDING_SCALING_KEY, Object.assign({}, job, { cursor: i }));

      if (step.kind === "wait") {
        await waitForState(job, step);
        continue;
      }

      if (verifyFirstCall) {
        verifyFirstCall = false;
        const current = await fetchScalingState(job).catch(() => null);
        if (stepSatisfied(job.provider, step, current)) { doneCount += 1; continue; }
      }

      doneCount += 1;
      toast("Applying scaling changes (" + doneCount + "/" + callCount + "): " + (step.label || ""), "info");

      let response;
      try {
        response = step.kind === "set"
          ? await post("/api/mc-infra-manager/PutSetK8sNodeGroupAutoscaling", {
            pathParams: { nsId: job.nsId, k8sClusterId: job.clusterId, k8sNodeGroupName: job.nodeGroupName },
            request: { onAutoScaling: String(step.on) },
          }, trackedOptions("PutSetK8sNodeGroupAutoscaling", "K8s NG autoscaling: " + job.nodeGroupName))
          : await post("/api/mc-infra-manager/PutChangeK8sNodeGroupAutoscaleSize", {
            pathParams: { nsId: job.nsId, k8sClusterId: job.clusterId, k8sNodeGroupName: job.nodeGroupName },
            request: {
              desiredNodeSize: step.desiredNodeSize,
              minNodeSize: step.minNodeSize,
              maxNodeSize: step.maxNodeSize,
            },
          }, trackedOptions("PutChangeK8sNodeGroupAutoscaleSize", "K8s NG autoscale size: " + job.nodeGroupName));
      } catch (error) {
        throw stepError(step, serverMessage(error?.response) || error?.message);
      }
      assertStepOk(step, response);
    }

    const applied = await fetchScalingState(job).catch(() => null);
    if (mismatch(job.plan.expected, applied)) {
      toast("Scaling request was accepted, but the provider still reports the previous values. "
        + "Some CSPs take several minutes to publish the new scaling config — check again shortly.", "warning");
    } else {
      toast("Scaling updated", "success");
    }
  } catch (error) {
    console.error("Failed to apply the scaling plan:", error);
    const label = error?.step?.label || "scaling change";
    toast('Failed at "' + label + '": ' + (error?.message || "unknown error")
      + ". Nothing was rolled back — check the current values and try again.", "error");
  } finally {
    dropJob(PENDING_SCALING_KEY, job);
    activeKeys.delete(key);
    refreshK8sList();
  }
}

// ── 재개 ────────────────────────────────────────────────────────────────────
// 페이지가 열릴 때(어느 화면이든) 끊긴 작업을 이어서 실행한다.
export function resumePendingK8sJobs() {
  const creates = readJobs(PENDING_NODEGROUP_KEY);
  const scalings = readJobs(PENDING_SCALING_KEY);
  if (creates.length === 0 && scalings.length === 0) return;

  toast("Resuming " + (creates.length + scalings.length) + " unfinished K8s request(s)", "info");
  if (creates.length > 0) runNodeGroupQueue();
  scalings.forEach((job) => { runScalingJob(job, { resumed: true }); });
}

document.addEventListener("DOMContentLoaded", function () {
  try {
    resumePendingK8sJobs();
  } catch (error) {
    console.error("Failed to resume pending K8s jobs:", error);
  }
});

if (typeof webconsolejs !== "undefined") {
  if (typeof webconsolejs["common/api/k8sScalingQueue"] === "undefined") {
    webconsolejs["common/api/k8sScalingQueue"] = {};
  }
  Object.assign(webconsolejs["common/api/k8sScalingQueue"], {
    enqueueNodeGroupCreates,
    enqueueScalingJob,
    isScalingJobPending,
    resumePendingK8sJobs,
  });
}
