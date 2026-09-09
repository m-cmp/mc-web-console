// search: system ns는 이미지 17만+ 건이라 전체 목록 조회(Getallimage)가 불가 —
// provider/region/osType 조건 + maxResults로 제한 검색한다 (조건 없으면 백엔드가 전체 스캔해 타임아웃).
// 응답: { imageList, imageCount }
export async function search(ns, criteria = {}, maxResults = 200) {
  const controller = '/api/mc-infra-manager/SearchImage';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns },
    request: { ...criteria, maxResults }
  });
  return response?.data?.responseData;
}

export async function register(ns, body) {
  const controller = '/api/mc-infra-manager/PostImage';
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
  const controller = '/api/mc-infra-manager/DelImage';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, imageId: name }
  });
  return response?.data;
}

export async function lookupList(connectionName) {
  const controller = '/api/mc-infra-manager/ForwardAnyReqToAny';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { path: 'vmimage' },
    request: { ConnectionName: connectionName }
  });
  return response?.data?.responseData;
}
