// Connection Config API 서비스 (mc-infra-manager v0.12)

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
 * Credential Holder로 Connection Config 목록 필터링
 * GET /connConfig?filterCredentialHolder={credentialHolder}
 * 빈 문자열 전달 시 전체 목록 반환
 *
 * @param {string} credentialHolder - Credential Holder 이름 (빈 문자열이면 전체)
 * @returns {Array} connectionconfig 배열
 */
export async function filterConnConfigByCredentialHolder(credentialHolder = '') {
    const controller = "/api/mc-infra-manager/FilterConnConfigByCredentialHolder";
    const data = {};
    if (credentialHolder) {
        data.queryParams = { filterCredentialHolder: credentialHolder };
    }
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    const result = unwrapResponse(response);
    if (!result) return [];
    return Array.isArray(result.connectionconfig) ? result.connectionconfig : [];
}

/**
 * Connection Config 단건 조회
 * GET /connConfig/{connConfigName}
 *
 * @param {string} connConfigName - Connection Config 이름
 */
export async function getConnConfig(connConfigName) {
    const controller = "/api/mc-infra-manager/GetConnConfig";
    const data = { pathParams: { connConfigName: String(connConfigName) } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}
