export async function listMenusTree() {
    const controller = "/api/mc-iam-manager/Listmenustree";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {});
    return response.data.responseData;
}

export async function createMenu(data) {
    const controller = "/api/mc-iam-manager/Createmenu";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, { request: data });
    return response.data.responseData;
}

export async function getMenuByID(menuId) {
    const controller = "/api/mc-iam-manager/Getmenubyid";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {
        pathParams: { menuId: menuId }
    });
    return response.data.responseData;
}

export async function updateMenu(menuId, data) {
    const controller = "/api/mc-iam-manager/Updatemenu";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {
        pathParams: { menuId: menuId },
        request: data
    });
    return response.data.responseData;
}

export async function deleteMenu(menuId) {
    const controller = "/api/mc-iam-manager/Deletemenu";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {
        pathParams: { menuId: menuId }
    });
    return response.data.responseData;
}
