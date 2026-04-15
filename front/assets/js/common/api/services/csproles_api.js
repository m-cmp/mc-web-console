// CSP Roles API Service
// mc-iam-manager API를 통한 CSP Roles 관리

// CSP Roles 목록 조회
export async function getCspRoleList(provider = null, limit = 50, offset = 0) {
    const controller = "/api/mc-iam-manager/listCSPRoles";
    const data = {
        Request: {
            provider: provider,
            limit: limit,
            offset: offset
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// 특정 CSP Role 조회
export async function getCspRoleById(roleId) {
    const controller = "/api/mc-iam-manager/GetCspRoleById";
    const data = {
        pathParams: {
            roleId: roleId.toString()
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// CSP Role 생성
export async function createCspRole(roleData) {
    const controller = "/api/mc-iam-manager/CreateCspRole";
    const data = {
        Request: {
            cspRoleName: roleData.cspRoleName,
            description: roleData.description,
            cspType: roleData.cspType,
            idpIdentifier: roleData.idpIdentifier,
            iamIdentifier: roleData.iamIdentifier,
            iamRoleId: roleData.iamRoleId,
            path: roleData.path,
            tags: roleData.tags || []
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    // commonAPIPost returns axios error object (not throws) on non-2xx responses
    if (response?.response) {
        const errData = response.response.data;
        const errMsg = errData?.responseData?.error || errData?.status?.message || 'Failed to create CSP Role';
        throw new Error(errMsg);
    }
    return response.data.responseData;
}

// CSP Role 삭제
export async function deleteCspRole(roleId) {
    const controller = "/api/mc-iam-manager/DeleteCspRole";
    const data = {
        pathParams: {
            roleId: roleId.toString()
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// ===== CSP Policies API Functions =====

// CSP Policies 목록 조회
export async function getCspPolicyList(provider = null, limit = 50, offset = 0) {
    const controller = "/api/mc-iam-manager/listCspPolicies";
    const data = {
        Request: {
            provider: provider,
            limit: limit,
            offset: offset
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// 특정 CSP Policy 조회
export async function getCspPolicyById(policyId) {
    const controller = "/api/mc-iam-manager/GetCspPolicyById";
    const data = {
        pathParams: {
            policyId: policyId.toString()
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// CSP Policy 생성
export async function createCspPolicy(policyData) {
    const controller = "/api/mc-iam-manager/CreateCspPolicy";
    const data = {
        Request: {
            name: policyData.name,
            description: policyData.description,
            document: policyData.document
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// CSP Policy 수정
export async function updateCspPolicy(policyId, policyData) {
    const controller = "/api/mc-iam-manager/UpdateCspPolicy";
    const data = {
        pathParams: {
            policyId: policyId.toString()
        },
        Request: {
            name: policyData.name,
            description: policyData.description,
            document: policyData.document
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// CSP Policy 삭제
export async function deleteCspPolicy(policyId) {
    const controller = "/api/mc-iam-manager/DeleteCspPolicy";
    const data = {
        pathParams: {
            policyId: policyId.toString()
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// ===== Role-Policy Binding API Functions =====

// 특정 Role에 바인딩된 Policies 조회
export async function getPoliciesByRoleId(roleId, provider = null) {
    const controller = "/api/mc-iam-manager/GetPoliciesByRoleId";
    const data = {
        pathParams: {
            roleId: roleId.toString()
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// Role에 Policy 연결 (attach)
export async function bindPolicyToRole(roleId, policyId) {
    const controller = "/api/mc-iam-manager/AttachPolicyToRole";
    const data = {
        Request: {
            roleId: roleId,
            policyId: policyId
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// Role에서 Policy 해제 (detach)
export async function unbindPolicyFromRole(roleId, policyId) {
    const controller = "/api/mc-iam-manager/DetachPolicyFromRole";
    const data = {
        Request: {
            roleId: roleId,
            policyId: policyId
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

// ===== Provider Management =====

// 사용 가능한 CSP Providers 목록 조회
export async function getCspProviders() {
    const controller = "/api/mc-iam-manager/getTempCredentialProviders";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    return response.data.responseData;
}

// ===== 동기화 API Functions =====

// CSP Role 동기화 (keycloak sync)
export async function syncCspRoles(provider = null) {
    const controller = "/api/mc-iam-manager/Syncrolelistwithkeycloak";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    return response.data.responseData;
}

// CSP Policy 동기화
export async function syncPolicies(roleId = null) {
    const controller = "/api/mc-iam-manager/SyncCspPolicies";
    const data = {
        Request: {
            roleId: roleId
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}
