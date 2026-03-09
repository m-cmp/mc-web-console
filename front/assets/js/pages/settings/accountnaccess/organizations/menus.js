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
    }
};

// 트리 데이터를 jstree 형식으로 변환
function convertToJstreeFormat(nodes) {
    return (nodes || []).map(node => ({
        id: node.id,
        text: node.displayName || node.id,
        icon: node.isAction ? "ti ti-file-text" : "ti ti-folder",
        state: { opened: true },
        children: convertToJstreeFormat(node.children),
        data: node
    }));
}

// 트리를 flat 배열로 변환 (ParentID select용)
function flattenTree(nodes, result = []) {
    (nodes || []).forEach(node => {
        result.push(node);
        if (node.children && node.children.length > 0) {
            flattenTree(node.children, result);
        }
    });
    return result;
}

// 메뉴 관리 모듈
const MenuManager = {
    async loadTree() {
        try {
            const treeData = await webconsolejs["common/api/services/menus_api"].listMenusTree();
            AppState.menus.tree = treeData || [];
            AppState.menus.flatList = flattenTree(AppState.menus.tree);
            UIManager.renderTree(AppState.menus.tree);
        } catch (error) {
            console.error("Error loading menu tree:", error);
            alert("Failed to load menu tree.");
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
            // 업데이트 후 선택 복원
            if (AppState.menus.selectedMenu) {
                const updated = AppState.menus.flatList.find(m => m.id === id);
                if (updated) {
                    AppState.menus.selectedMenu = updated;
                    UIManager.showDetailPanel(updated);
                }
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
    renderTree(treeData) {
        const $tree = $('#menu-tree');

        // 기존 트리 제거
        if ($tree.jstree(true)) {
            $tree.jstree("destroy");
        }

        const jstreeData = convertToJstreeFormat(treeData);

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

    const data = {
        id: id,
        displayName: displayName,
        parentId: document.getElementById('create-menu-parentid').value,
        resType: "menu",
        isAction: document.getElementById('create-menu-isaction').checked,
        priority: parseInt(document.getElementById('create-menu-priority').value) || 2,
        menuNumber: parseInt(document.getElementById('create-menu-menunumber').value) || 0
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
        priority: parseInt(document.getElementById('edit-menu-priority').value) || 2,
        menuNumber: parseInt(document.getElementById('edit-menu-menunumber').value) || 0
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
    await MenuManager.loadTree();
});
