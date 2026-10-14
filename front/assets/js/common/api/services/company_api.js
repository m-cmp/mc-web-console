// Company(플랫폼 싱글톤) API 서비스 — mc-iam-manager /api/company

function unwrapResponse(response) {
  if (!response) {
    throw new Error('Invalid response from server');
  }
  // commonAPIPost는 404/403 등에서 axios error 객체를 그대로 반환
  if (response.response) {
    const status = response.response.status;
    const body = response.response.data || {};
    const msg = (body.status && body.status.message)
      || body.message
      || body.error
      || (body.responseData && body.responseData.error)
      || response.message
      || 'Request failed';
    const err = new Error(msg);
    err.status = status;
    err.response = response.response;
    throw err;
  }
  if (response.status === 204) {
    return null;
  }
  if (!response.data) {
    throw new Error('Invalid response from server');
  }
  if (response.status >= 400) {
    const msg = (response.data.status && response.data.status.message)
      || response.data.message
      || response.data.error
      || (response.data.responseData && response.data.responseData.error)
      || 'Request failed';
    const err = new Error(msg);
    err.status = response.status;
    err.response = response;
    throw err;
  }
  return response.data.responseData;
}

export async function getCompany() {
  const controller = '/api/mc-iam-manager/getCompany';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller);
  return unwrapResponse(response);
}

export async function createCompany(companyData) {
  const controller = '/api/mc-iam-manager/createCompany';
  const data = { request: companyData };
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, data);
  return unwrapResponse(response);
}

export async function updateCompany(companyData) {
  const controller = '/api/mc-iam-manager/updateCompany';
  const data = { request: companyData };
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, data);
  return unwrapResponse(response);
}

export async function deactivateCompany() {
  const controller = '/api/mc-iam-manager/deactivateCompany';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller);
  return unwrapResponse(response);
}

export async function activateCompany() {
  const controller = '/api/mc-iam-manager/activateCompany';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller);
  return unwrapResponse(response);
}
