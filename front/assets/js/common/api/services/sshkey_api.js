export async function list(ns) {
  const controller = '/api/mc-infra-manager/GetAllSshKey';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns }
  });
  return response?.data?.responseData;
}

export async function create(ns, body) {
  const controller = '/api/mc-infra-manager/PostSshKey';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns },
    request: body
  });
  return response?.data;
}

// options는 commonAPIPost로 그대로 전달 (예: private key가 콘솔에 남지 않도록 { sensitive: true })
export async function get(ns, name, options = {}) {
  const controller = '/api/mc-infra-manager/GetSshKey';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, sshKeyId: name }
  }, undefined, options);
  return response?.data?.responseData;
}

// options는 commonAPIPost로 그대로 전달 (예: 호출부가 실패 사유를 직접 표시할 때 { suppressErrorToast: true })
export async function del(ns, name, options = {}) {
  const controller = '/api/mc-infra-manager/DelSshKey';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, sshKeyId: name }
  }, undefined, options);
  return response?.data;
}
