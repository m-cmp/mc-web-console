// 역할 목록 조회
export async function getRoleList() {
    const controller = "/api/mc-iam-manager/GetRoleList";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    console.log("getRoles response", response);
    // const menuList = await getAllMenuTree();
    // console.log("menuList", menuList);
    return response.data.responseData;
}

export async function getAllMenuResources() {
    const controller = "/api/mc-iam-manager/Getmenuresources";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    console.log("getAllMenuResources response", response);
    return response.data.responseData;
}

export async function getAllAvailableMenus() {
    const controller = "/api/mc-iam-manager/GetAllAvailableMenus";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller);
    console.log("getAllAvailableMenus response", response);
    return response.data.responseData;
}

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
    console.log("getMappedMenusByRoleList response", response);
    return response.data.responseData;
}

export async function getMenusResources() {
    const controller = "/api/mc-iam-manager/Getmenuresources";

    const response = await webconsolejs["common/api/http"].commonAPIPost(
        controller
    );
    console.log("getMenusResources response", response);
    return response.data.responseData;
}