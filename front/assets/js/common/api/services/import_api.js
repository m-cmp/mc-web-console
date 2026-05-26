// CSP 자원 임포트 API 서비스
// RQ-CLOUD-ADMIN-007: 외부 CSP 자원 MCMP 임포트 관리

const BASE_INFRA = "/api/mc-infra-manager/";

/**
 * CSP 전체 자원 일괄 동기화 (Cloud Overview Sync 팝업)
 * POST /registerCspResources?option=vNet&option=securityGroup&...
 */
export async function registerCspResources(options, connectionName, nsId) {
    const queryParams = {};
    if (options && options.length > 0) {
        queryParams.option = options;
    }

    const body = { nsId };
    if (connectionName) {
        body.connectionName = connectionName;
    }

    const data = {
        queryParams,
        body,
    };

    const response = await webconsolejs["common/api/http"].commonAPIPost(
        BASE_INFRA + "RegisterCspResourcesInNs",
        data
    );
    return response.data.responseData;
}

/**
 * VNet 개별 임포트
 * POST /ns/{nsId}/registerCspResource/vNet
 */
export async function registerCspVNet(nsId, connectionName, cspResourceId, name) {
    const data = {
        pathParams: { nsId },
        body: { connectionName, cspResourceId, name },
    };

    const response = await webconsolejs["common/api/http"].commonAPIPost(
        BASE_INFRA + "RegisterCspVNet",
        data
    );
    return response.data.responseData;
}

/**
 * Subnet 자동 등록 (VNet 등록 후 연속 호출)
 * POST /ns/{nsId}/registerCspResource/vNet/{vNetId}/subnet
 */
export async function registerCspSubnet(nsId, vNetId, connectionName, cspResourceId) {
    const data = {
        pathParams: { nsId, vNetId },
        body: { connectionName, cspResourceId },
    };

    const response = await webconsolejs["common/api/http"].commonAPIPost(
        BASE_INFRA + "RegisterCspSubnet",
        data
    );
    return response.data.responseData;
}

/**
 * VM 임포트 (신규 MCI 생성)
 * POST /ns/{nsId}/registerCspVm
 * API 내부에서 VPC/SG/SSH Key/Disk 자동 discover & map
 */
export async function registerCspVm(nsId, mciName, vmList) {
    const data = {
        pathParams: { nsId },
        body: {
            name: mciName,
            description: "Imported from CSP",
            vm: vmList.map(vm => ({
                connectionName: vm.connectionName,
                cspResourceId: vm.cspResourceId,
                name: vm.name,
                subGroupSize: "1",
            })),
        },
    };

    const response = await webconsolejs["common/api/http"].commonAPIPost(
        BASE_INFRA + "RegisterCspVm",
        data
    );
    return response.data.responseData;
}

/**
 * 등록된 VNet 목록 조회 (미관리 판별용)
 * GET /ns/{nsId}/resources/vNet
 */
export async function getRegisteredVNets(nsId) {
    const data = {
        pathParams: { nsId },
    };

    try {
        const response = await webconsolejs["common/api/http"].commonAPIPost(
            BASE_INFRA + "GetAllVNet",
            data
        );
        return response.data.responseData?.vNet || [];
    } catch (e) {
        if (e.response?.status === 404) return [];
        throw e;
    }
}

/**
 * 등록된 MCI 목록 조회 (VM Import Target 선택용)
 * GET /ns/{nsId}/mci?option=simple
 */
export async function getMciListSimple(nsId) {
    const data = {
        pathParams: { nsId },
        queryParams: { option: "simple" },
    };

    try {
        const response = await webconsolejs["common/api/http"].commonAPIPost(
            BASE_INFRA + "GetAllInfra",
            data
        );
        return response.data.responseData?.infra || [];
    } catch (e) {
        if (e.response?.status === 404) return [];
        throw e;
    }
}

/**
 * CSP VNet 목록 조회 (ForwardAnyReqToAny → mc-spider)
 * ⚠️ 실제 operationId 및 파라미터는 테스트로 확인 필요
 */
export async function getCspVNets(connectionName) {
    const data = {
        queryParams: {
            connectionName,
            targetUrl: "/spider/vpc",
            method: "GET",
        },
    };

    const response = await webconsolejs["common/api/http"].commonAPIPost(
        BASE_INFRA + "ForwardAnyReqToAny",
        data
    );
    return response.data.responseData?.vpc || [];
}

/**
 * CSP VM 목록 조회 (ForwardAnyReqToAny → mc-spider)
 * ⚠️ 실제 operationId 및 파라미터는 테스트로 확인 필요
 */
export async function getCspVMs(connectionName) {
    const data = {
        queryParams: {
            connectionName,
            targetUrl: "/spider/vm",
            method: "GET",
        },
    };

    const response = await webconsolejs["common/api/http"].commonAPIPost(
        BASE_INFRA + "ForwardAnyReqToAny",
        data
    );
    return response.data.responseData?.vm || [];
}

// webconsolejs 등록
if (typeof webconsolejs === "undefined") { window.webconsolejs = {}; }
webconsolejs["common/api/services/import_api"] = {
    registerCspResources,
    registerCspVNet,
    registerCspSubnet,
    registerCspVm,
    getRegisteredVNets,
    getMciListSimple,
    getCspVNets,
    getCspVMs,
};
