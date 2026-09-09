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

export async function get(ns, name) {
  const controller = '/api/mc-infra-manager/GetSshKey';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, sshKeyId: name }
  });
  return response?.data?.responseData;
}

export async function del(ns, name) {
  const controller = '/api/mc-infra-manager/DelSshKey';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, sshKeyId: name }
  });
  return response?.data;
}
