// list: FilterSpecsByRange with empty body → returns all specs in namespace
export async function list(ns) {
  const controller = '/api/mc-infra-manager/FilterSpecsByRange';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns },
    request: {}
  });
  return response?.data?.responseData;
}

export async function register(ns, body) {
  const controller = '/api/mc-infra-manager/Postspec';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns },
    request: body
  });
  return response?.data;
}

export async function get(ns, name) {
  const controller = '/api/mc-infra-manager/Getspec';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, specId: name }
  });
  return response?.data?.responseData;
}

export async function del(ns, name) {
  const controller = '/api/mc-infra-manager/Delspec';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, specId: name }
  });
  return response?.data;
}

// fetchSpecs: fetch specs from CSP connections into namespace
export async function fetchSpecs(ns, connectionName = '') {
  const controller = '/api/mc-infra-manager/Fetchspecs';
  const body = connectionName ? { connectionName } : {};
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns },
    request: body
  });
  return response?.data?.responseData;
}

export async function lookupList(connectionName) {
  const controller = '/api/mc-infra-manager/ForwardAnyReqToAny';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { path: 'spider/vmspecs' },
    queryParams: { ConnectionName: connectionName }
  });
  return response?.data?.responseData;
}
