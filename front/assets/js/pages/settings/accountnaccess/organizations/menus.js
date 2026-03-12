import 'jstree';

// webconsolejs 네임스페이스 초기화
if (typeof webconsolejs === 'undefined') {
    window.webconsolejs = {};
}
if (typeof webconsolejs['pages/settings/accountnaccess/organizations/menus'] === 'undefined') {
    webconsolejs['pages/settings/accountnaccess/organizations/menus'] = {};
}

// 상태 관리
const AppState = {
    menus: {
        tree: [],
        flatList: [],
        selectedMenu: null
    },
    roles: []
};

// flat 배열(parentId 기반)을 jstree 형식으로 변환
function convertToJstreeFormat(flatMenus) {
    if (!Array.isArray(flatMenus)) return [];
    const topLevel = flatMenus.filter(m => m.parentId === "home");
    let result = [];
    topLevel.forEach(menu => {
        result = result.concat(processMenuNode(menu, flatMenus));
    });
    return result;
}

function processMenuNode(menu, allMenus) {
    const children = allMenus.filter(m => m.parentId === menu.id);
    return [{
        id: menu.id,
        text: menu.displayName || menu.id,
        icon: menu.isAction ? "ti ti-file-text" : "ti ti-folder",
        state: { opened: true },
        children: children.map(child => processMenuNode(child, allMenus)).flat(),
        data: menu
    }];
}

// 메뉴 관리 모듈
const MenuManager = {
    async loadTree() {
        try {
            const flatData = await webconsolejs["common/api/services/menus_api"].listMenusTree();
            AppState.menus.flatList = flatData || [];
            UIManager.renderTree(AppState.menus.flatList);
        } catch (error) {
            console.error("Error loading menu tree:", error);
            alert("Failed to load menu tree.");
        }
    },

    async loadRoles() {
        try {
            const data = await webconsolejs["common/api/services/menus_api"].listRoles();
            AppState.roles = Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Error loading roles:", error);
            AppState.roles = [];
        }
    },

    async create(data) {
        try {
            await webconsolejs["common/api/services/menus_api"].createMenu(data);
            AppState.menus.selectedMenu = null;
            UIManager.hideDetailPanel();
            await this.loadTree();
        } catch (error) {
            console.error("Error creating menu:", error);
            alert("Failed to create menu: " + (error.message || error));
        }
    },

    async update(id, data) {
        try {
            await webconsolejs["common/api/services/menus_api"].updateMenu(id, data);
            await this.loadTree();
            const updated = AppState.menus.flatList.find(m => m.id === id);
            if (updated) {
                AppState.menus.selectedMenu = updated;
                UIManager.showDetailPanel(updated);
            }
        } catch (error) {
            console.error("Error updating menu:", error);
            alert("Failed to update menu: " + (error.message || error));
        }
    },

    async delete(id) {
        try {
            await webconsolejs["common/api/services/menus_api"].deleteMenu(id);
            AppState.menus.selectedMenu = null;
            UIManager.hideDetailPanel();
            await this.loadTree();
        } catch (error) {
            console.error("Error deleting menu:", error);
            alert("Failed to delete menu: " + (error.message || error));
        }
    }
};

// UI 관리 모듈
const UIManager = {
    renderTree(flatMenus) {
        const $tree = $('#menu-tree');

        // 기존 트리 제거
        if ($tree.jstree(true)) {
            $tree.jstree("destroy");
        }

        const jstreeData = convertToJstreeFormat(flatMenus);

        $tree.jstree({
            "core": {
                "themes": { "responsive": true },
                "data": jstreeData,
                "check_callback": false,
                "multiple": false
            },
            "plugins": ["types"],
            "types": {
                "default": { "icon": "ti ti-folder" }
            }
        });

        $tree.on("ready.jstree", function () {
            $tree.jstree(true).open_all();
        });

        $tree.on("changed.jstree", function (e, data) {
            if (data.selected && data.selected.length > 0) {
                const nodeId = data.selected[0];
                const node = data.instance.get_node(nodeId);
                if (node && node.data) {
                    AppState.menus.selectedMenu = node.data;
                    UIManager.showDetailPanel(node.data);
                }
            }
        });
    },

    showDetailPanel(menu) {
        document.getElementById('detail-menu-id').textContent = menu.id || '-';
        document.getElementById('detail-menu-displayname').textContent = menu.displayName || '-';
        document.getElementById('detail-menu-parentid').textContent = menu.parentId || '(root)';
        document.getElementById('detail-menu-isaction').textContent = menu.isAction ? 'Yes' : 'No';
        document.getElementById('detail-menu-priority').textContent = menu.priority != null ? menu.priority : '-';
        document.getElementById('detail-menu-menunumber').textContent = menu.menuNumber != null ? menu.menuNumber : '-';

        const panel = document.getElementById('menu-detail-panel');
        if (panel.classList.contains('d-none')) {
            panel.classList.remove('d-none');
        }
    },

    hideDetailPanel() {
        const panel = document.getElementById('menu-detail-panel');
        if (!panel.classList.contains('d-none')) {
            panel.classList.add('d-none');
        }
    },

    populateParentSelect(selectId, selectedValue) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '<option value="">(root - no parent)</option>';
        AppState.menus.flatList.forEach(menu => {
            const option = document.createElement('option');
            option.value = menu.id;
            option.textContent = `${menu.displayName || menu.id} (${menu.id})`;
            if (menu.id === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    },

    renderRoleCheckboxes(containerId, checkedIds) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        AppState.roles.forEach(role => {
            const isChecked = Array.isArray(checkedIds) && checkedIds.includes(role.id);
            const div = document.createElement('div');
            div.className = 'input-group mb-1';
            div.innerHTML = `
                <span class="input-group-text">
                    <input class="form-check-input m-0" type="checkbox"
                        id="${containerId}-role-${role.id}"
                        value="${role.id}"
                        ${isChecked ? 'checked' : ''}>
                </span>
                <label class="form-control" for="${containerId}-role-${role.id}">
                    ${role.roleName || role.name || role.id}
                </label>`;
            container.appendChild(div);
        });
    },

    getCheckedRoleIds(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];
        return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => parseInt(cb.value, 10));
    }
};

// 모달 관리 모듈
const ModalManager = {
    openCreate(parentId) {
        // 폼 초기화
        document.getElementById('create-menu-id').value = '';
        document.getElementById('create-menu-displayname').value = '';
        document.getElementById('create-menu-isaction').checked = false;
        document.getElementById('create-menu-priority').value = '2';
        document.getElementById('create-menu-menunumber').value = '';

        // ParentID select 채우기
        UIManager.populateParentSelect('create-menu-parentid', parentId || '');

        // 역할 체크박스 렌더링 (초기 선택 없음)
        UIManager.renderRoleCheckboxes('create-menu-roles', []);

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('create-menu-modal'));
        modal.show();
    },

    openEdit(menu) {
        if (!menu) return;

        document.getElementById('edit-menu-id').value = menu.id || '';
        document.getElementById('edit-menu-displayname').value = menu.displayName || '';
        document.getElementById('edit-menu-isaction').checked = !!menu.isAction;
        document.getElementById('edit-menu-priority').value = menu.priority != null ? menu.priority : '';
        document.getElementById('edit-menu-menunumber').value = menu.menuNumber != null ? menu.menuNumber : '';

        UIManager.populateParentSelect('edit-menu-parentid', menu.parentId || '');

        // 역할 체크박스 렌더링 (현재 매핑된 역할 선택)
        const checkedIds = Array.isArray(menu.roleIds) ? menu.roleIds : [];
        UIManager.renderRoleCheckboxes('edit-menu-roles', checkedIds);

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('edit-menu-modal'));
        modal.show();
    },

    openDelete(menu) {
        if (!menu) return;
        document.getElementById('delete-menu-id-display').textContent = menu.id;
        document.getElementById('delete-menu-name-display').textContent = menu.displayName || menu.id;

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('delete-menu-modal'));
        modal.show();
    }
};

// 전역 함수 (onclick 핸들러)
window.openCreateRootMenuModal = function () {
    ModalManager.openCreate('');
};

window.openCreateChildMenuModal = function () {
    const parent = AppState.menus.selectedMenu;
    ModalManager.openCreate(parent ? parent.id : '');
};

window.saveCreateMenu = async function () {
    const id = document.getElementById('create-menu-id').value.trim();
    const displayName = document.getElementById('create-menu-displayname').value.trim();

    if (!id) {
        alert("Menu ID is required.");
        return;
    }
    if (!displayName) {
        alert("Display Name is required.");
        return;
    }

    const parentId = document.getElementById('create-menu-parentid').value;
    const data = {
        id: id,
        displayName: displayName,
        parentId: parentId || null,
        resType: "menu",
        isAction: document.getElementById('create-menu-isaction').checked,
        priority: String(parseInt(document.getElementById('create-menu-priority').value) || 2),
        menuNumber: String(parseInt(document.getElementById('create-menu-menunumber').value) || 0),
        roleIds: UIManager.getCheckedRoleIds('create-menu-roles')
    };

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('create-menu-modal'));
    modal.hide();

    await MenuManager.create(data);
};

window.openEditMenuModal = function () {
    const menu = AppState.menus.selectedMenu;
    if (!menu) {
        alert("Please select a menu first.");
        return;
    }
    ModalManager.openEdit(menu);
};

window.saveEditMenu = async function () {
    const id = document.getElementById('edit-menu-id').value.trim();
    const displayName = document.getElementById('edit-menu-displayname').value.trim();

    if (!displayName) {
        alert("Display Name is required.");
        return;
    }

    const data = {
        displayName: displayName,
        parentId: document.getElementById('edit-menu-parentid').value,
        resType: "menu",
        isAction: document.getElementById('edit-menu-isaction').checked,
        priority: String(parseInt(document.getElementById('edit-menu-priority').value) || 2),
        menuNumber: String(parseInt(document.getElementById('edit-menu-menunumber').value) || 0),
        roleIds: UIManager.getCheckedRoleIds('edit-menu-roles')
    };

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('edit-menu-modal'));
    modal.hide();

    await MenuManager.update(id, data);
};

window.openDeleteMenuModal = function () {
    const menu = AppState.menus.selectedMenu;
    if (!menu) {
        alert("Please select a menu first.");
        return;
    }
    ModalManager.openDelete(menu);
};

window.confirmDeleteMenu = async function () {
    const menu = AppState.menus.selectedMenu;
    if (!menu) return;

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('delete-menu-modal'));
    modal.hide();

    await MenuManager.delete(menu.id);
};

// 페이지 초기화
document.addEventListener("DOMContentLoaded", async function () {
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        btnList.innerHTML = `
            <button type="button" class="btn btn-primary" onclick="openCreateRootMenuModal()">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
                  viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                  <path d="M12 5l0 14"></path>
                  <path d="M5 12l14 0"></path>
                </svg>
                Add Root Menu
            </button>`;
    }

    await Promise.all([
        MenuManager.loadTree(),
        MenuManager.loadRoles()
    ]);
});
