// 역할 목록 조회
export async function getRoleList() {
    const controller = "/api/mc-iam-manager/GetRoleList";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    console.log("getRoles response", response);
    // const menuList = await getAllMenuTree();
    // console.log("menuList", menuList);
    return response.data.responseData;
}

// 사용자에게 할당된 메뉴 리스트
export async function getAllAvailableMenus() {
    const controller = "/api/mc-iam-manager/GetAllAvailableMenus";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    console.log("getAllAvailableMenus response", response);
    return response.data.responseData;
}

// 역할에 매핑된 메뉴 리소스 조회
export async function getMappedMenusByRoleList(roleId) {
    const controller = "/api/mc-iam-manager/Getmappedmenusbyrolelist";
    const data = {

        Request: {
            "roleId": [roleId.toString()]
        }
    }
    const response = await webconsolejs["common/api/http"].commonAPIPost(
        controller,
        data
    );
    return response.data.responseData;
}

// 모든 메뉴 리소스 조회
export async function getMenusResources() {
    const controller = "/api/mc-iam-manager/Getmenuresources";

    const response = await webconsolejs["common/api/http"].commonAPIPost(
        controller
    );
    console.log("getMenusResources response", response);
    return response.data.responseData;
}

// 역할 생성
export async function createRole(role) {
    const controller = "/api/mc-iam-manager/Createrole";
    const data = {
        Request: {
            name: role.name,
            description: role.description,
            roleTypes: role.roleTypes || [],
            menuIds: role.menuIds || [],
            cspRoles: role.cspRoles || []
        }
    }
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    console.log("createRole response", response);
    return response.data.responseData;
}

// 역할 수정
export async function updateRole(roleId, role) {
    const controller = "/api/mc-iam-manager/Updaterole";
    const data = {
        pathParams: {
            "roleId": roleId.toString()
        },
        Request: {
            name: role.name,
            description: role.description,
            roleTypes: role.roleTypes || [],
            menuIds: role.menuIds || [],
            cspRoles: role.cspRoles || []
        }
    }
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    console.log("updateRole response", response);
    return response.data.responseData;
}

export async function deleteRole(roleId) {
    const controller = "/api/mc-iam-manager/Deleterolebyid";
    const data = {
        pathParams: {
            "roleId": roleId.toString()
        }
    }
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    console.log("deleteRole response", response);
    return response.data.responseData;
}

// 역할별 CSP 리스트 조회
export async function getCSPRoleListByRoleId(roleId) {
    const controller = "/api/mc-iam-manager/Getrolescsproles";
    const data = {
        pathParams: {
            "roleId": roleId.toString()
        }
    }
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    console.log("getCSPRoleList response", response);
    return response.data.responseData;
}

// CSP Provider 목록 조회
export async function getCspProviderList() {
    const controller = "/api/mc-iam-manager/getTempCredentialProviders";

    const response = await webconsolejs["common/api/http"].commonAPIPost(
        controller
    );
    console.log("getCSPProviderList response", response);
    
    // responseData에서 provider 값들만 추출하여 반환
    if (response.data && response.data.responseData) {
        return response.data.responseData.map(item => item.provider);
    }
    
    return [];
}