// Framework Readyz / Init API 서비스

export const READYZ_FRAMEWORK_LIST = [
    {
        name: 'mc-iam-manager',
        subsystem: 'mc-iam-manager',
        operationId: 'GetIamReadyz',
        initOperationId: null,
    },
    {
        name: 'mc-infra-manager',
        subsystem: 'mc-infra-manager',
        operationId: 'GetInfraReadyz',
        initOperationId: 'GetInfraReadyzInit',
    },
    {
        name: 'mc-observability',
        subsystem: 'mc-observability',
        operationId: 'GetObsReadyz',
        initOperationId: null,
    },
    {
        name: 'mc-application-manager',
        subsystem: 'mc-application-manager',
        operationId: 'GetAppMgrReadyz',
        initOperationId: null,
    },
    {
        name: 'mc-workflow-manager',
        subsystem: 'mc-workflow-manager',
        operationId: 'GetWorkflowReadyz',
        initOperationId: null,
    },
    {
        name: 'mc-cost-optimizer',
        subsystem: 'mc-cost-optimizer',
        operationId: 'GetCostReadyz',
        initOperationId: null,
    },
    {
        name: 'mc-data-manager',
        subsystem: 'mc-data-manager',
        operationId: 'GetDataMgrReadyz',
        initOperationId: null,
    },
];

/**
 * 프레임워크 readyz 호출
 * @param {string} subsystem - api.yaml subsystem 명
 * @param {string} operationId - api.yaml operationId
 * @returns {Promise} axios response
 */
export async function callReadyz(subsystem, operationId) {
    const url = `/api/${subsystem}/${operationId}`;
    return await webconsolejs["common/api/http"].commonAPIPost(url, {});
}

/**
 * 프레임워크 init 호출
 * @param {string} subsystem
 * @param {string} operationId
 * @returns {Promise} axios response
 */
export async function callInit(subsystem, operationId) {
    const url = `/api/${subsystem}/${operationId}`;
    return await webconsolejs["common/api/http"].commonAPIPost(url, {});
}

/**
 * mc-iam-manager에서 전체 프레임워크 서비스 목록(BaseURL) 조회
 * @returns {Promise<Object>} { "mc-infra-manager": { Version, BaseURL, Auth }, ... }
 */
export async function listFrameworkServices() {
    const url = `/api/mc-iam-manager/ListMcmpApisServices`;
    const res = await webconsolejs["common/api/http"].commonAPIPost(url, {}, undefined, { loaderType: 'none' });
    const d = res && res.data ? (res.data.responseData || res.data) : {};
    return d.Services || {};
}

/**
 * mc-iam-manager에서 특정 프레임워크 서비스의 BaseURL 수정
 * @param {string} serviceName - 서비스명 (예: "mc-observability")
 * @param {string} baseUrl - 새 BaseURL (예: "http://1.2.3.4:18080")
 * @returns {Promise} axios response
 */
export async function updateFrameworkServiceUrl(serviceName, baseUrl) {
    const url = `/api/mc-iam-manager/UpdateFrameworkService`;
    return await webconsolejs["common/api/http"].commonAPIPost(url, {
        pathParams: { serviceName },
        request: { BaseURL: baseUrl },
    }, undefined, { loaderType: 'none' });
}

/**
 * readyz 응답에서 상태 파싱
 * ready 필드가 있으면 그 값을 사용, 없으면 HTTP 200 = ok
 * message 필드가 있으면 표시용으로 사용
 * @param {object} response - axios response
 * @returns {{ ready: boolean, message: string }}
 */
export function parseReadyzResponse(response) {
    if (!response || response.status >= 400) {
        return { ready: false, message: 'Error' };
    }
    const data = response.data || {};
    const rd = data.responseData || data;
    if (typeof rd.ready !== 'undefined') {
        return {
            ready: rd.ready === true,
            message: rd.message || '',
        };
    }
    // 기타 프레임워크: HTTP 200이면 ok
    return { ready: true, message: rd.message || '' };
}
