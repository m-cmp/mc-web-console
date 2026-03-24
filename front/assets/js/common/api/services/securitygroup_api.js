export async function list(ns) {
  const controller = '/api/mc-infra-manager/ListSecurityGroup';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns }
  });
  return response?.data?.responseData;
}

export async function create(ns, body) {
  const controller = '/api/mc-infra-manager/CreateSecurityGroup';
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

export async function del(ns, name) {
  const controller = '/api/mc-infra-manager/DeleteSecurityGroup';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, securityGroupId: name }
  });
  return response?.data;
}
