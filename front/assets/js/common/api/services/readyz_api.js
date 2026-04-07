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
 * readyz 응답에서 상태 파싱
 * mc-infra-manager: { ready, initialized, message }
 * 기타: HTTP 200 = ok
 * @param {object} response - axios response
 * @returns {{ ready: boolean, initialized: boolean|null, message: string }}
 */
export function parseReadyzResponse(response) {
    if (!response || response.status >= 400) {
        return { ready: false, initialized: null, message: 'Error' };
    }
    const data = response.data || {};
    // mc-infra-manager 응답 형식: { ready, initialized, message }
    if (typeof data.ready !== 'undefined') {
        return {
            ready: data.ready === true,
            initialized: typeof data.initialized !== 'undefined' ? data.initialized : null,
            message: data.message || '',
        };
    }
    // 기타 프레임워크: HTTP 200이면 ok
    return { ready: true, initialized: null, message: '' };
}
