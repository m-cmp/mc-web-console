// Cloud Driver API 서비스 (읽기 전용)
// cb-spider의 driver 조회를 mc-infra-manager(cb-tumblebug)의 ForwardAnyReqToAny로 대리 호출한다.
// forward는 GET만 지원하므로 등록/해제는 여기서 제공하지 않는다 — CSP Definitions 화면 참조.

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

// path는 CB-Spider 경로에서 /spider/ 접두사를 제외한 값이다.
// request는 빈 객체라도 반드시 보내야 한다 (tumblebug이 body를 JSON 파싱함).
async function forwardToSpider(path) {
    const controller = "/api/mc-infra-manager/ForwardAnyReqToAny";
    const data = { pathParams: { path }, request: {} };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function listCloudDrivers() {
    const data = await forwardToSpider("driver");
    return (data && data.driver) ? data.driver : [];
}

export async function getCloudDriver(driverName) {
    return await forwardToSpider(`driver/${driverName}`);
}

export async function listCloudOS() {
    const controller = "/api/mc-infra-manager/GetProviderList";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {});
    const data = unwrapResponse(response);
    return (data && data.output) ? data.output : [];
}
