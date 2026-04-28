// CSP 계정 관리 API 서비스 (mc-iam-manager)

function unwrapResponse(response) {
    if (!response) {
        throw new Error('Invalid response from server');
    }
    // 204 No Content: DELETE 등 body 없는 성공 응답
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
            || 'Request failed';
        const err = new Error(msg);
        err.response = response;
        throw err;
    }
    return response.data.responseData;
}

export async function listCspAccounts(filter = {}) {
    const controller = "/api/mc-iam-manager/listCspAccounts";
    const data = Object.keys(filter).length > 0 ? { request: filter } : {};
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response) || [];
}

export async function createCspAccount(accountData) {
    const controller = "/api/mc-iam-manager/createCspAccount";
    const data = { request: accountData };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function getCspAccountById(accountId) {
    const controller = "/api/mc-iam-manager/getCspAccountByID";
    const data = { pathParams: { accountId: accountId.toString() } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function updateCspAccount(accountId, accountData) {
    const controller = "/api/mc-iam-manager/updateCspAccount";
    const data = {
        pathParams: { accountId: accountId.toString() },
        request: accountData
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function deleteCspAccount(accountId) {
    const controller = "/api/mc-iam-manager/deleteCspAccount";
    const data = { pathParams: { accountId: accountId.toString() } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function validateCspAccount(accountId) {
    const controller = "/api/mc-iam-manager/validateCspAccount";
    const data = { pathParams: { accountId: accountId.toString() } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function activateCspAccount(accountId) {
    const controller = "/api/mc-iam-manager/activateCspAccount";
    const data = { pathParams: { accountId: accountId.toString() } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function deactivateCspAccount(accountId) {
    const controller = "/api/mc-iam-manager/deactivateCspAccount";
    const data = { pathParams: { accountId: accountId.toString() } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}
