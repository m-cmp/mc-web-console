/**
 * GetAllVNet — path: nsId, query: option, filterKey[], filterVal[]
 * @param {string} nsId - mc-infra namespace id (use selected project NsId)
 * @param {Object} [query]
 * @param {string} [query.option] - e.g. "id" or empty
 * @param {string[]} [query.filterKey] - filter field keys
 * @param {string[]} [query.filterVal] - filter values (parallel to filterKey)
 */
export async function getAllVNet(nsId, query = {}) {
  const option = query.option != null && query.option !== '' ? String(query.option) : undefined;
  const filterKey = Array.isArray(query.filterKey) ? query.filterKey.map(String) : [];
  const filterVal = Array.isArray(query.filterVal) ? query.filterVal.map(String) : [];

  const queryParams = {
    filterKey,
    filterVal
  };
  if (option !== undefined) {
    queryParams.option = option;
  }

  const controller = '/api/mc-infra-manager/GetAllVNet';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId },
    queryParams
  });
  return response?.data?.responseData;
}

export async function create(nsId, body) {
  const controller = '/api/mc-infra-manager/CreateVNet';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: nsId },
    request: body
  });
  return response?.data;
}

export async function get(nsId, name) {
  const controller = '/api/mc-infra-manager/GetVNet';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: nsId, vNetId: name }
  });
  return response?.data?.responseData;
}

export async function del(nsId, name) {
  const controller = '/api/mc-infra-manager/DeleteVNet';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: nsId, vNetId: name }
  });
  return response?.data;
}
