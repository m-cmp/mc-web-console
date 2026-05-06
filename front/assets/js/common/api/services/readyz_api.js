// Framework Readyz / Init API 서비스

/**
 * 서비스명 → readyz/init operationId 매핑
 * mc-iam-manager의 ListMcmpApisServices 응답에서 서비스 목록을 동적으로 가져온 후
 * 이 맵을 참조하여 각 서비스의 readyz/init operationId를 결정한다.
 * 맵에 없는 서비스는 readyz 미지원(operationId: null)으로 처리된다.
 */
export const READYZ_OPERATIONID_MAP = {
    'mc-iam-manager':        { operationId: 'Readyz',            initOperationId: null },
    'mc-infra-manager':      { operationId: 'Getreadyz',         initOperationId: 'GetInfraReadyzInit' },
    'mc-observability':      { operationId: 'GetObsReadyz',      initOperationId: null },
    'mc-application-manager':{ operationId: 'GetAppMgrReadyz',   initOperationId: null },
    'mc-workflow-manager':   { operationId: 'GetWorkflowReadyz', initOperationId: null },
    'mc-cost-optimizer':     { operationId: 'GetCostReadyz',     initOperationId: null },
    'mc-data-manager':       { operationId: 'GetDataMgrReadyz',  initOperationId: null },
};

/**
 * readyz 체크에서 제외할 서비스 목록
 * (mc-iam-manager가 자기 자신과 인프라 커넥터 등을 관리하지만 readyz 대상은 아님)
 */
const READYZ_EXCLUDE = new Set(['mc-web-console', 'mc-infra-connector']);

/**
 * ListMcmpApisServices 응답(services 맵)으로부터 readyz 대상 프레임워크 목록 생성
 * @param {Object} services - { "mc-infra-manager": { BaseURL, Version }, ... }
 * @param {Object} serviceActions - { "mc-infra-manager": { "Getreadyz": { Method, ResourcePath }, ... }, ... }
 * @returns {Array<{ name, subsystem, operationId, initOperationId }>}
 */
export function buildFrameworkList(services, serviceActions = {}) {
    return Object.keys(services)
        .filter(name => !READYZ_EXCLUDE.has(name))
        .sort()
        .map(name => {
            // ServiceActions에서 ResourcePath가 /readyz로 끝나는 action 자동 탐색
            const actions = serviceActions[name] || {};
            const readyzEntry = Object.entries(actions).find(([, spec]) =>
                spec.ResourcePath && spec.ResourcePath.split('?')[0].split('/').pop() === 'readyz'
            );
            const operationId = readyzEntry
                ? readyzEntry[0]
                : (READYZ_OPERATIONID_MAP[name]?.operationId || null);
            const initOperationId = READYZ_OPERATIONID_MAP[name]?.initOperationId || null;
            return { name, subsystem: name, operationId, initOperationId };
        });
}

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
 * mc-iam-manager에서 전체 프레임워크 서비스 목록(BaseURL + ServiceActions) 조회
 * @returns {Promise<{ services: Object, serviceActions: Object }>}
 */
export async function listFrameworkServices() {
    const url = `/api/mc-iam-manager/ListMcmpApisServices`;
    const res = await webconsolejs["common/api/http"].commonAPIPost(url, {}, undefined, { loaderType: 'none' });
    const d = res && res.data ? (res.data.responseData || res.data) : {};
    return { services: d.Services || {}, serviceActions: d.ServiceActions || {} };
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
