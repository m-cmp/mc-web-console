// Cloud Driver API 서비스 (mc-infra-manager → cb-spider)

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

export async function listCloudDrivers() {
    const controller = "/api/mc-infra-manager/List-Cloud-Drivers";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {});
    const data = unwrapResponse(response);
    return (data && data.driver) ? data.driver : [];
}

export async function listCloudOS() {
    const controller = "/api/mc-infra-manager/List-Cloudos";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {});
    const data = unwrapResponse(response);
    return (data && data.cloudos) ? data.cloudos : [];
}

export async function registerCloudDriver(driverData) {
    const controller = "/api/mc-infra-manager/Register-Cloud-Driver";
    const data = { request: driverData };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function getCloudDriver(driverName) {
    const controller = "/api/mc-infra-manager/Get-Cloud-Driver";
    const data = { pathParams: { DriverName: driverName } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function unregisterCloudDriver(driverName) {
    const controller = "/api/mc-infra-manager/Unregister-Cloud-Driver";
    const data = { pathParams: { DriverName: driverName } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}
