// CSP Roles API Service
// mc-iam-manager API를 통한 CSP Roles 관리 (Mock 모드)

import { handleMockAPIRequest } from './csproles_mock_data.js';

// ===== Mock API Post Function =====

// Mock API 호출 함수 (commonAPIPost와 동일한 인터페이스)
// 나중에 mc-iam-manager API 준비되면 이 함수를 commonAPIPost로 교체
async function mockAPIPost(controller, data = null) {
    console.log("#### mockAPIPost");
    console.log("Request URL :", controller);
    console.log("Request Data :", JSON.stringify(data));
    console.log("-----------------------");
    
    try {
        const response = await handleMockAPIRequest(controller, data);
        console.log("#### mockAPIPost Response");
        console.log("Response from :", controller, response.data);
        console.log("----------------------------");
        return response;
    } catch (error) {
        console.log("#### mockAPIPost Error");
        console.log("Error :", error);
        console.log("----------------------------");
        throw error;
    }
}

// CSP Roles 목록 조회
export async function getCspRoleList(provider = null, limit = 50, offset = 0) {
    const controller = "/api/mc-iam-manager/GetCspRoleList";
    const data = {
        Request: {
            provider: provider,
            limit: limit,
            offset: offset
        }
    };
    const response = await mockAPIPost(controller, data);
    // Mock API에서 { data: [...], total: ... } 형태로 반환하므로 data 부분만 추출
    return response.data.responseData.data;
}

// 특정 CSP Role 조회
export async function getCspRoleById(roleId) {
    const controller = "/api/mc-iam-manager/GetCspRoleById";
    const data = {
        pathParams: {
            roleId: roleId.toString()
        }
    };
    const response = await mockAPIPost(controller, data);
    return response.data.responseData;
}

// CSP Role 생성
export async function createCspRole(roleData) {
    const controller = "/api/mc-iam-manager/CreateCspRole";
    const data = {
        Request: {
            name: roleData.name,
            description: roleData.description,
            provider: roleData.provider,
            trust_policy: roleData.trust_policy
        }
    };
    const response = await mockAPIPost(controller, data);
    return response.data.responseData;
}

// CSP Role 수정
export async function updateCspRole(roleId, roleData) {
    const controller = "/api/mc-iam-manager/UpdateCspRole";
    const data = {
        pathParams: {
            roleId: roleId.toString()
        },
        Request: {
            name: roleData.name,
            description: roleData.description,
            trust_policy: roleData.trust_policy
        }
    };
    const response = await mockAPIPost(controller, data);
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
    const response = await mockAPIPost(controller, data);
    return response.data.responseData;
}

// ===== CSP Policies API Functions =====

// CSP Policies 목록 조회
export async function getCspPolicyList(provider = null, limit = 50, offset = 0) {
    const controller = "/api/mc-iam-manager/GetCspPolicyList";
    const data = {
        Request: {
            provider: provider,
            limit: limit,
            offset: offset
        }
    };
    const response = await mockAPIPost(controller, data);
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
    const response = await mockAPIPost(controller, data);
    return response.data.responseData;
}

// CSP Policy 생성
export async function createCspPolicy(policyData) {
    const controller = "/api/mc-iam-manager/CreateCspPolicy";
    const data = {
        Request: {
            name: policyData.name,
            description: policyData.description,
            provider: policyData.provider,
            document: policyData.document
        }
    };
    const response = await mockAPIPost(controller, data);
    return response.data.responseData;
}

// ===== Role-Policy Binding API Functions =====

// 특정 Role에 바인딩된 Policies 조회
export async function getPoliciesByRoleId(roleId) {
    const controller = "/api/mc-iam-manager/GetPoliciesByRoleId";
    const data = {
        pathParams: {
            roleId: roleId.toString()
        }
    };
    const response = await mockAPIPost(controller, data);
    return response.data.responseData;
}

// Role에 Policy 바인딩
export async function bindPolicyToRole(roleId, policyId) {
    const controller = "/api/mc-iam-manager/BindPolicyToRole";
    const data = {
        Request: {
            roleId: roleId,
            policyId: policyId
        }
    };
    const response = await mockAPIPost(controller, data);
    return response.data.responseData;
}

// Role에서 Policy 언바인딩
export async function unbindPolicyFromRole(roleId, policyId) {
    const controller = "/api/mc-iam-manager/UnbindPolicyFromRole";
    const data = {
        Request: {
            roleId: roleId,
            policyId: policyId
        }
    };
    const response = await mockAPIPost(controller, data);
    return response.data.responseData;
}

// ===== Provider Management =====

// 사용 가능한 CSP Providers 목록 조회
export async function getCspProviders() {
    const controller = "/api/mc-iam-manager/GetCspProviders";
    const response = await mockAPIPost(controller);
    return response.data.responseData;
}

