// Infra Dynamic Template API 서비스 (mc-infra-manager → cb-tumblebug)

export async function list(ns, filterKeyword) {
  const controller = '/api/mc-infra-manager/GetAllInfraDynamicTemplate';
  const params = { pathParams: { nsId: ns } };
  if (filterKeyword) params.queryParams = { filterKeyword };
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, params);
  return response?.data?.responseData;
}

export async function get(ns, templateId) {
  const controller = '/api/mc-infra-manager/GetInfraDynamicTemplate';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, templateId }
  });
  return response?.data?.responseData;
}

export async function create(ns, body) {
  const controller = '/api/mc-infra-manager/PostInfraDynamicTemplate';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns },
    request: body
  });
  return response?.data?.responseData;
}

export async function update(ns, templateId, body) {
  const controller = '/api/mc-infra-manager/PutInfraDynamicTemplate';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, templateId },
    request: body
  });
  return response?.data?.responseData;
}

export async function del(ns, templateId) {
  const controller = '/api/mc-infra-manager/DeleteInfraDynamicTemplate';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, templateId }
  });
  return response?.data;
}

export async function deleteAll(ns) {
  const controller = '/api/mc-infra-manager/DeleteAllInfraDynamicTemplate';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns }
  });
  return response?.data;
}

// 저장된 template 형상 그대로 MCI 생성 (name/description override만 전달)
// options는 commonAPIPost의 loader 옵션 ({ loaderType, progressLabel } 등)
export async function deployFromTemplate(ns, templateId, applyReq, option, options) {
  const controller = '/api/mc-infra-manager/PostInfraDynamicFromTemplate';
  const params = {
    pathParams: { nsId: ns, templateId },
    request: applyReq
  };
  if (option) params.queryParams = { option };

  const labelName = (applyReq && applyReq.name) ? applyReq.name : templateId;
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'PostInfraDynamicFromTemplate',
    'Infra from template: ' + labelName
  );

  const mergedOptions = Object.assign({}, options || {}, {
    loaderType: (options && options.loaderType) || 'none',
    headers: Object.assign(
      {},
      (options && options.headers) || {},
      tracked.headers
    )
  });
  const response = await webconsolejs['common/api/http'].commonAPIPost(
    controller,
    params,
    undefined,
    mergedOptions
  );
  return response;
}

// 기존 MCI에서 InfraDynamicReq 형상 추출 (configCopy)
// 응답은 InfraDynamicReq 객체 그대로 반환됨 (swagger의 "[DEFAULT]" 래핑은 실응답에 없음)
export async function getInfraReqFromInfra(ns, infraId) {
  const controller = '/api/mc-infra-manager/GetInfraReqFromInfra';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId: ns, infraId }
  });
  const data = response?.data?.responseData;
  return data?.['[DEFAULT]'] ?? data;
}
