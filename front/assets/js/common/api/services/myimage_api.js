/**
 * CustomImage (MyImages) API — mc-infra-manager
 * GetAllCustomImage / GetCustomImage / PostCustomImage / DelCustomImage
 */

export async function list(nsId, query = {}) {
  const option = query.option != null && query.option !== '' ? String(query.option) : undefined;
  const filterKey = Array.isArray(query.filterKey) ? query.filterKey.map(String) : [];
  const filterVal = Array.isArray(query.filterVal) ? query.filterVal.map(String) : [];

  const queryParams = {};
  if (option !== undefined) queryParams.option = option;
  if (filterKey.length > 0) queryParams.filterKey = filterKey.join(',');
  if (filterVal.length > 0) queryParams.filterVal = filterVal.join(',');

  const controller = '/api/mc-infra-manager/GetAllCustomImage';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId },
    queryParams
  });
  return response?.data?.responseData;
}

export async function get(nsId, customImageId) {
  const controller = '/api/mc-infra-manager/GetCustomImage';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, customImageId }
  });
  return response?.data?.responseData;
}

export async function create(nsId, body) {
  const controller = '/api/mc-infra-manager/PostCustomImage';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId },
    queryParams: { option: 'register' },
    request: body
  });
  return response?.data;
}

export async function del(nsId, customImageId) {
  const controller = '/api/mc-infra-manager/DelCustomImage';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, customImageId }
  });
  return response?.data;
}
