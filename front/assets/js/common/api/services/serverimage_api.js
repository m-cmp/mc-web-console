export async function list(ns) {
  const controller = '/api/mc-infra-manager/ListImage';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns }
  });
  return response?.data?.responseData;
}

export async function register(ns, body) {
  const controller = '/api/mc-infra-manager/RegisterImage';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns },
    request: body
  });
  return response?.data;
}

export async function get(ns, name) {
  const controller = '/api/mc-infra-manager/GetImage';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, imageId: name }
  });
  return response?.data?.responseData;
}

export async function del(ns, name) {
  const controller = '/api/mc-infra-manager/DeleteImage';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, imageId: name }
  });
  return response?.data;
}

export async function lookupList(connectionName) {
  const controller = '/api/mc-infra-manager/ForwardAnyReqToAny';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { path: 'spider/vmimages' },
    queryParams: { ConnectionName: connectionName }
  });
  return response?.data?.responseData;
}
