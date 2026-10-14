export async function list(ns) {
  const controller = '/api/mc-infra-manager/GetAllSecurityGroup';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns }
  });
  return response?.data?.responseData;
}

export async function create(ns, body) {
  const controller = '/api/mc-infra-manager/PostSecurityGroup';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns },
    request: body
  });
  return response?.data;
}

export async function get(ns, name) {
  const controller = '/api/mc-infra-manager/GetSecurityGroup';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, securityGroupId: name }
  });
  return response?.data?.responseData;
}

// options는 commonAPIPost로 그대로 전달 (예: 호출부가 실패 사유를 직접 표시할 때 { suppressErrorToast: true })
export async function del(ns, name, options = {}) {
  const controller = '/api/mc-infra-manager/DelSecurityGroup';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, securityGroupId: name }
  }, undefined, options);
  return response?.data;
}

export async function update(ns, name, body) {
  const controller = '/api/mc-infra-manager/PutSecurityGroup';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, securityGroupId: name },
    request: body
  });
  return response?.data;
}
