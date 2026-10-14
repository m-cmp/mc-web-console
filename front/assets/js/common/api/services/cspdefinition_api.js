// CSP Definition API 서비스 (mc-infra-manager / cb-tumblebug — CloudInfo)
// CSP 정의를 등록하면 cb-tumblebug이 cb-spider에 driver와 region/zone을 대신 등록한다.

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

// providerName을 키로 하는 CSPDetail 맵을 반환한다.
export async function getCloudInfo() {
    const controller = "/api/mc-infra-manager/GetCloudInfo";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {});
    const data = unwrapResponse(response);
    return (data && data.csps) ? data.csps : {};
}

// 검증 실패·삭제 거부가 500으로 오고 그 본문에 사용자에게 보여줄 사유가 담기므로,
// 공용 일반 오류 토스트를 억제하고 호출부가 실제 메시지를 노출한다.
const SHOW_SERVER_MESSAGE = { suppressErrorToast: true };

export async function registerCspDefinition(providerName, cspDetail) {
    const controller = "/api/mc-infra-manager/RegisterCspDefinition";
    const data = { pathParams: { providerName }, request: cspDetail };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data, false, SHOW_SERVER_MESSAGE);
    return unwrapResponse(response);
}

export async function unregisterCspDefinition(providerName) {
    const controller = "/api/mc-infra-manager/UnregisterCspDefinition";
    const data = { pathParams: { providerName } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data, false, SHOW_SERVER_MESSAGE);
    return unwrapResponse(response);
}
