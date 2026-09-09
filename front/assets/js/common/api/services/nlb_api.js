/**
 * NLB API — mc-infra-manager /ns/{nsId}/infra/{infraId}/nlb
 * NLB는 infra(MCI) 하위 리소스로, 모든 호출에 infraId가 필요하다.
 */

export async function getAllNLB(nsId, infraId) {
  const controller = '/api/mc-infra-manager/GetAllNLB';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, infraId }
  });
  return response?.data?.responseData;
}

/** namespace 전체 NLB 목록 (Infra 무관, 각 항목에 infraId 포함) — Infra별 N+1 조회 대체 */
export async function getAllNLBInNs(nsId) {
  const controller = '/api/mc-infra-manager/GetAllNLBInNs';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId }
  });
  return response?.data?.responseData;
}

/** CSP별 healthChecker 커스텀 필드(interval/timeout/threshold) 지원 여부 — cspType 생략 시 전체 */
export async function getNLBSupport(cspType) {
  const controller = '/api/mc-infra-manager/GetNLBSupport';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    queryParams: cspType ? { cspType } : undefined
  });
  return response?.data?.responseData;
}

export async function getNLB(nsId, infraId, nlbId) {
  const controller = '/api/mc-infra-manager/GetNLB';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, infraId, nlbId }
  });
  return response?.data?.responseData;
}

export async function postNLB(nsId, infraId, body) {
  const controller = '/api/mc-infra-manager/PostNLB';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, infraId },
    request: body
  });
  return response?.data;
}

export async function delNLB(nsId, infraId, nlbId) {
  const controller = '/api/mc-infra-manager/DelNLB';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, infraId, nlbId }
  });
  return response?.data;
}

export async function getNLBHealth(nsId, infraId, nlbId) {
  const controller = '/api/mc-infra-manager/GetNLBHealth';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, infraId, nlbId }
  });
  return response?.data?.responseData;
}

/** 기존 NLB 타겟에 노드 추가 (Assign) */
export async function addNLBNodes(nsId, infraId, nlbId, nodes) {
  const controller = '/api/mc-infra-manager/AddNLBNodes';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, infraId, nlbId },
    request: { targetGroup: { nodes } }
  });
  return response?.data;
}

/** NLB 타겟에서 노드 해제 (UnAssign) */
export async function removeNLBNodes(nsId, infraId, nlbId, nodes) {
  const controller = '/api/mc-infra-manager/RemoveNLBNodes';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, infraId, nlbId },
    request: { targetGroup: { nodes } }
  });
  return response?.data;
}

/** infra의 NodeGroup(subGroup) id 목록 — Create NLB 대상 선택용 */
export async function getInfraNodeGroupIds(nsId, infraId) {
  const controller = '/api/mc-infra-manager/GetInfraGroupIds';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, infraId }
  });
  return response?.data?.responseData;
}
