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

export async function del(ns, name) {
  const controller = '/api/mc-infra-manager/DelSecurityGroup';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, securityGroupId: name }
  });
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
