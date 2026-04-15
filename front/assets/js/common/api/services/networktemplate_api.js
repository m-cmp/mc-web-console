// VNet Template API 서비스 (mc-infra-manager → cb-tumblebug)

export async function list(ns, filterKeyword) {
  const controller = '/api/mc-infra-manager/GetAllVNetTemplate';
  const params = { pathParams: { nsId: ns } };
  if (filterKeyword) params.queryParams = { filterKeyword };
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, params);
  return response?.data?.responseData;
}

export async function create(ns, body) {
  const controller = '/api/mc-infra-manager/PostVNetTemplate';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns },
    request: body
  });
  return response?.data?.responseData;
}

export async function get(ns, templateId) {
  const controller = '/api/mc-infra-manager/GetVNetTemplate';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, templateId }
  });
  return response?.data?.responseData;
}

export async function update(ns, templateId, body) {
  const controller = '/api/mc-infra-manager/PutVNetTemplate';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, templateId },
    request: body
  });
  return response?.data?.responseData;
}

export async function deleteAll(ns) {
  const controller = '/api/mc-infra-manager/DeleteAllVNetTemplate';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns }
  });
  return response?.data;
}
