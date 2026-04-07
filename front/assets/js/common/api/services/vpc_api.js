export async function list(ns) {
  const controller = '/api/mc-infra-manager/ListVNet';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns }
  });
  return response?.data?.responseData;
}

export async function create(ns, body) {
  const controller = '/api/mc-infra-manager/CreateVNet';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns },
    request: body
  });
  return response?.data;
}

export async function get(ns, name) {
  const controller = '/api/mc-infra-manager/GetVNet';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, vNetId: name }
  });
  return response?.data?.responseData;
}

export async function del(ns, name) {
  const controller = '/api/mc-infra-manager/DeleteVNet';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, vNetId: name }
  });
  return response?.data;
}
