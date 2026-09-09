// 그룹(Organization) API 서비스

function unwrapResponse(response) {
    if (!response) {
        throw new Error('Invalid response from server');
    }
    if (response.response) {
        const err = new Error(response.message || 'Request failed');
        err.response = response.response;
        throw err;
    }
    // 204 No Content: DELETE 등 body 없는 성공 응답 (다른 *_api.js 서비스 파일과 동일 패턴)
    if (response.status === 204) {
        return null;
    }
    if (!response.data) {
        throw new Error('Invalid response from server');
    }
    if (response.status >= 400) {
        const msg = (response.data.status && response.data.status.message) || response.data.message || 'Request failed';
        const err = new Error(msg);
        err.response = response;
        throw err;
    }
    return response.data.responseData;
}

export async function getGroupTree() {
    const controller = "/api/mc-iam-manager/Getorganizations";
    const data = { queryParams: { tree: "true" } };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function getGroupList() {
    const controller = "/api/mc-iam-manager/Getorganizations";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    return unwrapResponse(response);
}

export async function getGroupById(id) {
    const controller = "/api/mc-iam-manager/Getorganizationbyid";
    const data = {
        pathParams: { organizationId: id.toString() }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function getGroupByCode(code) {
    const controller = "/api/mc-iam-manager/Getorganizationbycode";
    const data = {
        pathParams: { code: code }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function createGroup(groupData) {
    const controller = "/api/mc-iam-manager/Createorganization";
    const data = {
        request: groupData
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function updateGroup(id, groupData) {
    const controller = "/api/mc-iam-manager/Updateorganization";
    const data = {
        pathParams: { organizationId: id.toString() },
        request: groupData
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function deleteGroup(id) {
    const controller = "/api/mc-iam-manager/Deleteorganization";
    const data = {
        pathParams: { organizationId: id.toString() }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function getGroupUsers(id) {
    const controller = "/api/mc-iam-manager/Getorganizationusers";
    const data = {
        pathParams: { organizationId: id.toString() }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function getUserGroups(userId) {
    const controller = "/api/mc-iam-manager/Getuserorganizations";
    const data = {
        pathParams: { userId: userId.toString() }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function assignUserGroups(userId, organizationIds) {
    const controller = "/api/mc-iam-manager/Assignuserorganizations";
    const data = {
        pathParams: { userId: userId.toString() },
        request: { organization_ids: organizationIds }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function removeUserGroup(userId, organizationId) {
    const controller = "/api/mc-iam-manager/Removeuserorganization";
    const data = {
        pathParams: {
            userId: userId.toString(),
            organizationId: organizationId.toString()
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function listUsers() {
    const controller = "/api/mc-iam-manager/Listusers";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    return response.data.responseData || [];
}

// 그룹에 할당된 Platform Role 목록
export async function getGroupPlatformRoles(groupId) {
    const controller = "/api/mc-iam-manager/getGroupPlatformRoles";
    const data = {
        pathParams: { groupId: groupId.toString() }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response) || [];
}

// 그룹에 Platform Role 할당 — 그룹 소속 사용자 전원이 상속받음
export async function assignGroupPlatformRole(groupId, roleId) {
    const controller = "/api/mc-iam-manager/assignGroupPlatformRole";
    const data = {
        pathParams: { groupId: groupId.toString() },
        request: { role_id: parseInt(roleId, 10) }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}
