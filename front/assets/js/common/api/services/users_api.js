// 유저 목록 조회
export async function getUserList() {
    const controller = "/api/mc-iam-manager/Listusers";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    return response.data.responseData;
}

export async function createUser(userData) {
    const controller = "/api/mc-iam-manager/Createuser";
    
    // 백엔드가 기대하는 데이터 구조로 래핑
    const requestData = {
        request: userData
    };
    
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, requestData);
    return response;
}

// export async function getUserById(userId) {
//     const controller = "/api/mc-iam-manager/Getuserbyid";
//     const data = {
//         pathParams: {
//             "userId": userId.toString()
//         }
//     }
//     const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
//     console.log("getUserById response", response);
//     return response.data.responseData;
// }

export async function getUserByName(username) {
    const controller = "/api/mc-iam-manager/Getuserbyname";
    const data = {
        pathParams: {
            "username": username.toString()
        }
    }
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function resetUserPassword(userId, newPassword) {
    const controller = "/api/mc-iam-manager/ResetUserPassword";
    const data = {
        pathParams: { "userId": userId.toString() },
        request: { newPassword }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response;
}

export async function updateUserStatus(userId, status) {
    const controller = "/api/mc-iam-manager/UpdateUserStatus";
    const data = {
        pathParams: { "userId": userId.toString() },
        request: { status: status }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response;
}

export async function getUserWorkspacesByUserID(userId) {
    const controller = "/api/mc-iam-manager/Getuserworkspacesbyuserid";
    const data = {
        pathParams: {
            "userId": userId.toString()
        },
    }
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response.data.responseData;
}

export async function updateUser(userId, userData) {
    const controller = "/api/mc-iam-manager/Updateuser";
    const data = {
        pathParams: { "userId": userId.toString() },
        request: userData
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response;
}

export async function deleteUser(userId) {
    const controller = "/api/mc-iam-manager/Deleteuser";
    const data = {
        pathParams: { "userId": userId.toString() }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response;
}

export async function addUserRole(userId, roleData) {
    const controller = "/api/mc-iam-manager/assignPlatformRole";
    const data = {
        request: {
            userId: userId.toString(),
            roleId: roleData.roleId ? roleData.roleId.toString() : undefined,
            roleName: roleData.roleName,
            roleType: roleData.roleType || "platform",
            workspaceId: roleData.workspaceId ? roleData.workspaceId.toString() : "1"
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response;
}

export async function removeUserRole(userId, roleId) {
    const controller = "/api/mc-iam-manager/removePlatformRole";
    const data = {
        request: {
            userId: userId.toString(),
            roleId: roleId.toString(),
            roleType: "platform"
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return response;
}