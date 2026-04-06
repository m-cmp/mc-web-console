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
  return res?.data?.responseData?.connectionConfig || [];
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
 * SecurityGroup / sshKey / DataDisk 일괄 등록 (Connection 단위)
 * POST /registerCspResources?option=securityGroup&option=sshKey&...
 * @param {string} nsId
 * @param {string} connectionName
 * @param {string[]} options  e.g. ['securityGroup'], ['sshKey'], ['dataDisk']
 */
export async function registerCspNativeResources(nsId, connectionName, options) {
  const res = await call('RegisterCspNativeResources', {
    queryParams: { option: options },
    request: { nsId, connectionName },
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
  const res = await call('PostRegisterCSPNativeVM', {
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

/** vNet 등록 해제 - DELETE /ns/{nsId}/deregisterResource/vNet/{vNetId} */
export async function deregisterVNet(nsId, vNetId) {
  return call('DeleteDeregisterVNet', { pathParams: { nsId, vNetId } });
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
  return call('DeregisterMciVm', { pathParams: { nsId, mciId, vmId } });
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
