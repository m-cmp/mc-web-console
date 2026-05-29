// 전체 메뉴 리소스 목록 조회 (flat 배열, parentId 기반)
export async function listMenusTree() {
    const controller = "/api/mc-iam-manager/Getmenuresources";
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

export async function listRoles() {
    const controller = "/api/mc-iam-manager/Getrolelist";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {});
    return response.data.responseData;
}

// 역할 메뉴 권한 변경 후 사이드바를 즉시 갱신하기 위해 호출.
// GetAllAvailableMenus를 재조회하여 localStorage를 갱신하고
// refresh-sidebar 이벤트를 dispatch하면 sidebar.js가 updatemenu()를 재호출한다.
export async function refreshAvailableMenus() {
    const response = await webconsolejs["common/api/http"].commonAPIPost(
        "/api/mc-iam-manager/GetAllAvailableMenus"
    );
    const menuList = response?.data?.responseData;
    if (!menuList) return;

    const menuMap = new Map();
    menuList.forEach(menu => menuMap.set(menu.id, { ...menu, menus: [] }));
    const rootMenus = [];
    menuList.forEach(menu => {
        const node = menuMap.get(menu.id);
        if (menu.parentId === 'home' || !menu.parentId) {
            rootMenus.push(node);
        } else {
            const parent = menuMap.get(menu.parentId);
            if (parent) parent.menus.push(node);
        }
    });
    const sortMenus = (menus) => {
        menus.sort((a, b) =>
            a.priority !== b.priority ? a.priority - b.priority : a.menuNumber - b.menuNumber
        );
        menus.forEach(m => { if (m.menus?.length > 0) sortMenus(m.menus); });
    };
    sortMenus(rootMenus);

    webconsolejs["common/storage/localstorage"].setMenuLocalStorage(rootMenus);
    document.dispatchEvent(new CustomEvent('refresh-sidebar'));
}
