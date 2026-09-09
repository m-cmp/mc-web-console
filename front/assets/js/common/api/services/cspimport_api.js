/**
 * CSP Import API 서비스
 * RQ-CLOUD-ADMIN-007: 외부 CSP 자원 MCMP 임포트 관리
 *
 * operationId 참조: conf/api.yaml
 */

const BASE = '/api/mc-infra-manager/';

async function call(operationId, opts = {}) {
  return webconsolejs['common/api/http'].commonAPIPost(BASE + operationId, opts);
}

// ── Connection / NS ──────────────────────────────────────────────────────────

/**
 * Connection Config 목록 조회 (드롭다운용)
 * GET /connConfig
 */
export async function getConnConfigList() {
  const res = await call('GetConnConfigList');
  return res?.data?.responseData?.connectionconfig || [];
}

/**
 * NS 전체 목록 조회 (드롭다운용)
 * GET /ns
 */
export async function getAllNs() {
  const res = await call('GetAllNs');
  return res?.data?.responseData?.ns || [];
}

// ── Inspect ──────────────────────────────────────────────────────────────────

/**
 * 단일 Connection × 단일 자원유형 미관리 자원 조회
 * POST /inspectResources
 * @param {string} connectionName
 * @param {'vNet'|'securityGroup'|'sshKey'|'vm'} resourceType
 */
export async function inspectResources(connectionName, resourceType) {
  const res = await call('InspectResources', {
    request: { connectionName, resourceType },
  });
  return res?.data?.responseData;
}

/**
 * 전체 커넥션 자원 현황 요약 조회 (Resource Sync 대시보드용)
 * GET /inspectResourcesOverview
 */
export async function getResourcesOverview() {
  const res = await call('InspectResourcesOverview');
  return res?.data?.responseData;
}

// ── Resource type 메타 ────────────────────────────────────────────────────────

/**
 * cb-tumblebug 이 허용하는 자원유형과 선행 의존성.
 * src/core/infra/utility.go validateReqOptions() 와 1:1 대응한다.
 * 'nlb' 는 응답 overview 에는 있으나 요청 option 으로는 지원되지 않는다.
 */
export const RESOURCE_TYPE_DEPS = {
  dataDisk: ['node'],
  node: ['securityGroup', 'sshKey'],
  securityGroup: ['vNet'],
};

export const RESOURCE_TYPE_LABELS = {
  vNet: 'VNet (VPC)',
  securityGroup: 'SecurityGroup',
  sshKey: 'SSH Key',
  node: 'Node',
  dataDisk: 'DataDisk',
  customImage: 'Custom Image',
  nlb: 'NLB',
};

/**
 * 선택한 자원유형이 요구하는 선행 자원유형 중 미선택된 것을 안내 문장으로 반환.
 * 반환값이 비어 있지 않으면 요청을 보내기 전에 사용자에게 보여준다.
 * @param {string[]} selected
 * @returns {string[]}
 */
export function findMissingResourceTypeDeps(selected) {
  const messages = [];
  for (const [type, deps] of Object.entries(RESOURCE_TYPE_DEPS)) {
    if (!selected.includes(type)) continue;
    const lacking = deps.filter(d => !selected.includes(d));
    if (lacking.length > 0) {
      messages.push(
        `- ${RESOURCE_TYPE_LABELS[type]} also requires ` +
        `${lacking.map(d => RESOURCE_TYPE_LABELS[d]).join(' and ')}.`
      );
    }
  }
  return messages;
}

// ── Register ─────────────────────────────────────────────────────────────────

/**
 * vNet 개별 등록
 * POST /ns/{nsId}/registerCspResource/vNet
 */
export async function registerVNet(nsId, connectionName, cspResourceId, name) {
  const res = await call('PostRegisterVNet', {
    pathParams: { nsId },
    request: { connectionName, cspResourceId, name },
  });
  return res?.data?.responseData;
}

/**
 * CSP 자원 등록 (신규 API: provider/region/zone 기반)
 * POST /registerCspResources?option=vNet&option=securityGroup&...
 * @param {string} nsId
 * @param {{ provider: string, region?: string, zone?: string }} filter
 * @param {string[]} resourceTypes  e.g. ['vNet','securityGroup','sshKey']
 */
export async function registerCspNativeResources(nsId, filter, resourceTypes) {
  // option 은 반드시 콤마로 이어붙인 단일 문자열로 보낸다.
  // cb-tumblebug 핸들러가 c.QueryParam("option") 으로 첫 값만 읽고 ","로 분리하므로,
  // 배열로 넘겨 option=a&option=b 형태가 되면 첫 자원유형만 처리된다.
  const res = await call('RegisterCspNativeResources', {
    queryParams: resourceTypes?.length ? { option: resourceTypes.join(',') } : undefined,
    request: { nsId, ...filter },
  });
  return res?.data?.responseData;
}

/**
 * VM 임포트 (신규 MCI 생성)
 * POST /ns/{nsId}/registerCspVm
 * @param {string} nsId
 * @param {string} mciName
 * @param {{ connectionName: string, cspResourceId: string, name: string }[]} vmList
 */
export async function registerCspVm(nsId, mciName, vmList) {
  const res = await call('PostRegisterCSPNativeNode', {
    pathParams: { nsId },
    request: {
      name: mciName,
      description: 'Imported from CSP',
      vm: vmList.map(v => ({
        connectionName: v.connectionName,
        cspResourceId: v.cspResourceId,
        name: v.name,
        subGroupSize: '1',
      })),
    },
  });
  return res?.data?.responseData;
}

// ── Deregister ───────────────────────────────────────────────────────────────

/**
 * vNet 등록 해제 - DELETE /ns/{nsId}/deregisterResource/vNet/{vNetId}
 * 서브넷이 하나라도 남아 있으면 cb-tumblebug 이 withSubnets 없이는 거부한다
 * ("has N subnet(s); set withSubnets=true"). 등록 해제는 CSP 자원을 지우지 않으므로
 * 부모 vNet 을 내릴 때 서브넷도 함께 내리는 것이 기본 동작이다.
 */
export async function deregisterVNet(nsId, vNetId, withSubnets = true) {
  return call('DeleteDeregisterVNet', {
    pathParams: { nsId, vNetId },
    queryParams: { withSubnets: withSubnets ? 'true' : 'false' },
  });
}

/** SecurityGroup 등록 해제 */
export async function deregisterSecurityGroup(nsId, securityGroupId) {
  return call('DeregisterSecurityGroup', { pathParams: { nsId, securityGroupId } });
}

/** SSH Key 등록 해제 */
export async function deregisterSshKey(nsId, sshKeyId) {
  return call('DeregisterSshKey', { pathParams: { nsId, sshKeyId } });
}

/** VM(MCI) 등록 해제 */
export async function deregisterMciVm(nsId, mciId, vmId) {
  return call('DeregisterInfraNode', { pathParams: { nsId, infraId: mciId, nodeId: vmId } });
}

// ── Schedule ─────────────────────────────────────────────────────────────────

/** 스케줄 목록 조회 */
export async function getScheduleList() {
  const res = await call('GetScheduleRegisterCspResourcesList');
  return res?.data?.responseData?.scheduleInfo || res?.data?.responseData || [];
}

/**
 * 스케줄 생성
 * @param {{ jobType, nsId, connectionName, option, intervalSeconds, mciFlag, mciNamePrefix }} body
 */
export async function createSchedule(body) {
  const res = await call('PostScheduleRegisterCspResources', { request: body });
  return res?.data?.responseData;
}

/** 스케줄 일시중지 */
export async function pauseSchedule(jobId) {
  return call('PutScheduleRegisterCspResourcesPause', { pathParams: { jobId } });
}

/** 스케줄 재개 */
export async function resumeSchedule(jobId) {
  return call('PutScheduleRegisterCspResourcesResume', { pathParams: { jobId } });
}

/** 스케줄 삭제 */
export async function deleteSchedule(jobId) {
  return call('DeleteScheduleRegisterCspResources', { pathParams: { jobId } });
}

// ── NS Sync (IAM) ─────────────────────────────────────────────────────────────

const IAM_BASE = '/api/mc-iam-manager/';

async function iamCall(operationId, opts = {}) {
  return webconsolejs['common/api/http'].commonAPIPost(IAM_BASE + operationId, opts);
}

/**
 * Infra NS ↔ IAM Project 동기화 차이 조회
 * GET /api/setup/projects/sync-diff
 */
export async function getProjectSyncDiff() {
  const res = await iamCall('GetProjectSyncDiff');
  return res?.data?.responseData || { missingProjects: [], unassignedProjects: [] };
}

/**
 * NS 동기화 적용 — Project 생성 + Workspace 할당
 * POST /api/setup/projects/sync
 * @param {string} workspaceId
 * @param {string[]} nsIds
 */
export async function applyProjectSync(workspaceId, nsIds) {
  const res = await iamCall('ApplyProjectSync', { request: { workspaceId, nsIds } });
  return res?.data?.responseData || {};
}
