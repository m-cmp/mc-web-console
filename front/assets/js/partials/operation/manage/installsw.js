/**
 * Install SW 팝업 — mc-application-manager(AM) 설치 화면을 모달 iframe으로 띄운다.
 *
 * 흐름 (AM iframe 연동 규약):
 *   1. iframe src = {AM}/web/softwareCatalog/install?targetType=NODE&infraId&nodeGroupId[&nodeId]&requestId
 *   2. AM → MCMP_AM_INSTALL_EVENT { status: IFRAME_READY } 수신 후에만 token·workspace·project 전달
 *   3. DEPLOY_SUCCEEDED / DEPLOY_FAILED / FORM_ERROR / CANCELLED 처리
 *
 * namespace·access token 은 URL 에 넣지 않는다 — postMessage(targetOrigin=AM origin)로만 전달.
 */
import { GetApiHosts } from "../../../common/iframe/iframe.js";
import { generateRequestId } from "../../../common/api/requestId.js";
import { showToast, TOAST_TYPES } from "../../../common/utils/toast.js";

const MODAL_ID = "installsw-modal";
const CONTAINER_ID = "installsw-iframe-container";
const AM_FE_SERVICE = "mc-application-manager-fe";
const AM_API_SERVICE = "mc-application-manager";
const INSTALL_PATH = "/web/softwareCatalog/install";
const EVENT_TYPE = "MCMP_AM_INSTALL_EVENT";

// 현재 열린 팝업 세션 (한 번에 하나)
let session = null;
// 모달을 열 때·닫을 때 증가 — host 조회(await) 중에 닫히면 늦게 도착한 iframe 을 붙이지 않는다
let openSeq = 0;

/**
 * 설치 대상 → iframe URL 쿼리 파라미터.
 * 콘솔 용어(Infra/NodeGroup/Node) 기준 — AM 파라미터명이 달라지면 이 함수만 고친다.
 */
export function buildInstallParams(target, requestId) {
  const params = new URLSearchParams();
  params.set("targetType", "NODE");
  params.set("infraId", target.infraId);
  params.set("nodeGroupId", target.nodeGroupId);
  if (target.nodeId) {
    params.set("nodeId", target.nodeId);
  }
  params.set("requestId", requestId);
  return params;
}

/** AM BaseURL(path 포함 가능) + 설치 화면 path + 쿼리 */
function buildInstallUrl(baseUrl, params) {
  const u = new URL(baseUrl);
  const basePath = u.pathname.replace(/\/$/, "");
  return u.origin + basePath + INSTALL_PATH + "?" + params.toString();
}

// 세션 토큰은 로그인 화면을 거친 탭에서만 채워진다 — 새 탭 등으로 비어 있으면 인증 쿠키를 쓴다
function getAccessToken() {
  const sessionToken = webconsolejs["common/storage/sessionstorage"].getSessionCurrentUserToken();
  if (sessionToken) return sessionToken;
  const cookie = document.cookie.split("; ").find(c => c.startsWith("Authorization="));
  return cookie ? decodeURIComponent(cookie.substring("Authorization=".length)) : null;
}

function buildContextMessage(requestId, apiBaseUrl) {
  const workspaceApi = webconsolejs["common/api/services/workspace_api"];
  const currentWorkspace = workspaceApi.getCurrentWorkspace();
  const currentProject = workspaceApi.getCurrentProject();
  const message = {
    accessToken: getAccessToken(),
    workspaceInfo: {
      id: currentWorkspace?.Id,
      name: currentWorkspace?.Name,
    },
    projectInfo: {
      id: currentProject?.Id,
      name: currentProject?.Name,
      ns_id: currentProject?.NsId,
    },
    operationId: requestId,
  };
  // 기존 SW Catalogs iframe 과 동일하게 AM API 주소도 함께 전달 (규약 외 키, AM 은 무시 가능)
  if (apiBaseUrl) {
    message.apiBaseUrl = apiBaseUrl;
  }
  return message;
}

function showNotice(container, message) {
  container.innerHTML = "";
  const div = document.createElement("div");
  div.className = "alert alert-warning m-3";
  div.textContent = message;
  container.appendChild(div);
}

function hideModal() {
  const el = document.getElementById(MODAL_ID);
  bootstrap.Modal.getInstance(el)?.hide();
}

function closeSession() {
  openSeq++;
  if (!session) return;
  window.removeEventListener("message", handleMessage);
  session = null;
  const container = document.getElementById(CONTAINER_ID);
  if (container) container.innerHTML = "";
}

function handleMessage(event) {
  if (!session) return;
  const { iframe, amOrigin, requestId } = session;
  if (event.source !== iframe.contentWindow) return;
  if (event.origin !== amOrigin) return;
  const data = event.data;
  if (data?.type !== EVENT_TYPE) return;
  if (data.requestId !== requestId) return;

  switch (data.status) {
    case "IFRAME_READY":
      // AM iframe 재로딩 시 다시 READY 를 보낼 수 있으므로 매번 전달한다
      iframe.contentWindow.postMessage(
        buildContextMessage(requestId, session.apiBaseUrl),
        amOrigin
      );
      break;
    case "DEPLOY_SUCCEEDED": {
      const onSucceeded = session.onSucceeded;
      showToast(TOAST_TYPES.SUCCESS, "Software deployment request succeeded. Check Apps Status for the running state.");
      hideModal();
      if (typeof onSucceeded === "function") onSucceeded(data);
      break;
    }
    case "DEPLOY_FAILED":
    case "FORM_ERROR":
      showToast(TOAST_TYPES.ERROR, data.message || "Software installation failed.");
      break;
    case "CANCELLED":
      hideModal();
      break;
    default:
      // FORM_READY, DEPLOY_STARTED — 진행 상태는 AM 화면이 표시한다
      break;
  }
}

/**
 * @param {object} target
 * @param {string} target.infraId
 * @param {string} target.nodeGroupId
 * @param {string} [target.nodeId]  없으면 NodeGroup 전체 대상
 * @param {object} [opts]
 * @param {Function} [opts.onSucceeded] DEPLOY_SUCCEEDED 후 호출 (Workload 갱신)
 */
export async function openInstallSwModal(target, opts = {}) {
  if (!target?.infraId || !target?.nodeGroupId) {
    showToast(TOAST_TYPES.WARNING, "Select a NodeGroup or Node first.");
    return;
  }

  const modalEl = document.getElementById(MODAL_ID);
  const container = document.getElementById(CONTAINER_ID);
  if (!modalEl || !container) {
    console.error("[installsw] modal not found:", MODAL_ID);
    return;
  }

  closeSession();
  const seq = openSeq;
  const title = document.getElementById("installsw-modal-title");
  if (title) {
    title.textContent = target.nodeId
      ? `Install SW — Node [ ${target.nodeGroupId} / ${target.nodeId} ]`
      : `Install SW — NodeGroup [ ${target.nodeGroupId} ]`;
  }
  if (!modalEl.dataset.installswBound) {
    modalEl.addEventListener("hidden.bs.modal", closeSession);
    modalEl.dataset.installswBound = "true";
  }
  bootstrap.Modal.getOrCreateInstance(modalEl).show();

  const workspaceApi = webconsolejs["common/api/services/workspace_api"];
  if (!workspaceApi.getCurrentWorkspace()?.Id || !workspaceApi.getCurrentProject()?.Id) {
    showNotice(container, "Please select a Workspace and Project.");
    return;
  }

  let amBaseUrl;
  let apiBaseUrl;
  try {
    amBaseUrl = await GetApiHosts(AM_FE_SERVICE);
    if (amBaseUrl) apiBaseUrl = await GetApiHosts(AM_API_SERVICE);
  } catch (e) {
    console.error("[installsw] getapihosts failed:", e);
  }
  if (seq !== openSeq) return;
  if (!amBaseUrl) {
    showNotice(container, AM_FE_SERVICE + " service URL not found. Please register it in Settings > Environment.");
    return;
  }

  const requestId = generateRequestId();
  let src;
  let amOrigin;
  try {
    src = buildInstallUrl(amBaseUrl, buildInstallParams(target, requestId));
    amOrigin = new URL(src).origin;
  } catch (e) {
    showNotice(container, "Invalid " + AM_FE_SERVICE + " service URL: " + amBaseUrl);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.id = "installsw-iframe";
  iframe.title = "Install SW";
  iframe.style.cssText = "width:100%;height:100%;border:0;";
  iframe.src = src;

  session = {
    iframe,
    amOrigin,
    requestId,
    apiBaseUrl,
    onSucceeded: opts.onSucceeded,
  };
  window.addEventListener("message", handleMessage);

  container.innerHTML = "";
  container.appendChild(iframe);
}
