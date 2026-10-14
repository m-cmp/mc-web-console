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

// mc-iam-manager CspAccount 응답은 snake_case(csp_type/account_info/is_active/created_at) —
// 화면 코드는 camelCase(cspType/accountInfo/isActive/createdAt)를 사용하므로 여기서 정규화한다.
function normalizeCspAccount(raw) {
    if (!raw) return raw;
    return {
        ...raw,
        cspType: raw.cspType ?? raw.csp_type,
        accountInfo: raw.accountInfo ?? raw.account_info,
        isActive: raw.isActive ?? raw.is_active,
        createdAt: raw.createdAt ?? raw.created_at,
        updatedAt: raw.updatedAt ?? raw.updated_at,
    };
}

export async function listCspAccounts(filter = {}) {
    const controller = "/api/mc-iam-manager/listCspAccounts";
    const data = Object.keys(filter).length > 0 ? { request: filter } : {};
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    const list = unwrapResponse(response) || [];
    return list.map(normalizeCspAccount);
}

export async function createCspAccount(accountData) {
    const controller = "/api/mc-iam-manager/createCspAccount";
    // mc-iam-manager CreateCspAccountRequest는 snake_case(csp_type/account_info) 필드를 기대한다.
    const data = {
        request: {
            name: accountData.name,
            csp_type: (accountData.cspType || '').toLowerCase(),
            account_info: accountData.credential,
            description: accountData.description,
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return normalizeCspAccount(unwrapResponse(response));
}

export async function getCspAccountById(accountId) {
    const controller = "/api/mc-iam-manager/getCspAccountByID";
    const data = { pathParams: { accountId: accountId.toString() } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return normalizeCspAccount(unwrapResponse(response));
}

export async function updateCspAccount(accountId, accountData) {
    const controller = "/api/mc-iam-manager/updateCspAccount";
    // UpdateCspAccountRequest도 CreateCspAccountRequest와 동일하게 snake_case 필드를 기대한다.
    const data = {
        pathParams: { accountId: accountId.toString() },
        request: {
            name: accountData.name,
            account_info: accountData.credential ?? accountData.accountInfo,
            is_active: accountData.isActive,
            description: accountData.description,
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return normalizeCspAccount(unwrapResponse(response));
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
