// CredentialHolder API 서비스 (mc-infra-manager v0.12)

function unwrapResponse(response) {
    if (!response) {
        throw new Error('Invalid response from server');
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
            || 'Request failed';
        const err = new Error(msg);
        err.response = response;
        throw err;
    }
    return response.data.responseData;
}

/**
 * CredentialHolder 목록 조회
 * GET /credentialHolder
 */
export async function getCredentialHolderList() {
    const controller = "/api/mc-infra-manager/GetCredentialHolderList";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {});
    return unwrapResponse(response);
}

/**
 * CredentialHolder 단건 조회
 * GET /credentialHolder/{holderId}
 */
export async function getCredentialHolder(holderId) {
    const controller = "/api/mc-infra-manager/GetCredentialHolder";
    const data = { pathParams: { holderId: String(holderId) } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

/**
 * Credential 등록 (평문 전달 — 암호화는 Go API 서버에서 처리)
 * POST /credential (hybrid encryption: RSA-OAEP + AES-256-GCM)
 *
 * @param {object} params
 * @param {string} params.credentialHolder - holder 이름 (예: "admin", "role01")
 * @param {string} params.providerName - CSP 이름 (예: "aws", "gcp", "azure")
 * @param {Array<{key: string, value: string}>} params.credentialKeyValueList - 자격증명 key-value 목록
 */
export async function registerCredential({ credentialHolder, providerName, credentialKeyValueList }) {
    const controller = "/api/mc-infra-manager/RegisterCredential";
    const data = {
        request: {
            credentialHolder,
            providerName,
            credentialKeyValueList,
        },
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}
