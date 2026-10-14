import 'jstree';

// 중앙화된 상태 관리
const AppState = {
    groups: {
        tree: [],
        list: [],
        selectedGroup: null,
        platformRoles: [],
        memberCount: 0
    },
    users: { all: [] },
    roles: { all: [] },
    ui: {
        viewMode: false
    }
};

// 그룹 API 호출 및 데이터 처리
const GroupManager = {
    async loadTree() {
        try {
            const treeData = await webconsolejs["common/api/services/groups_api"].getGroupTree();
            AppState.groups.tree = treeData || [];
            UIManager.renderTree(AppState.groups.tree);
        } catch (error) {
            console.error("Error loading group tree:", error);
            AppState.groups.tree = [];
            UIManager.renderTree([]);
            if (webconsolejs && webconsolejs['common/util'] && webconsolejs['common/util'].showToast) {
                const d = error.response && error.response.data;
                const msg = (d && (d.status && d.status.message)) || (d && d.message) || error.message || 'Group tree load failed.';
                webconsolejs['common/util'].showToast('Group tree query error: ' + msg, 'error');
            }
        }
    },

    async loadList() {
        try {
            const list = await webconsolejs["common/api/services/groups_api"].getGroupList();
            AppState.groups.list = list || [];
        } catch (error) {
            console.error("Error loading group list:", error);
            AppState.groups.list = [];
            if (webconsolejs && webconsolejs['common/util'] && webconsolejs['common/util'].showToast) {
                const d = error.response && error.response.data;
                const msg = (d && (d.status && d.status.message)) || (d && d.message) || error.message || 'Group list load failed.';
                webconsolejs['common/util'].showToast('Group list query error: ' + msg, 'error');
            }
        }
    },

    async loadGroupUsers(id) {
        try {
            const users = await webconsolejs["common/api/services/groups_api"].getGroupUsers(id);
            AppState.groups.memberCount = (users || []).length;
            UIManager.showGroupUsers(users || []);
        } catch (error) {
            console.error("Error loading group users:", error);
            AppState.groups.memberCount = 0;
            UIManager.showGroupUsers([]);
        }
        UIManager.updateInheritNotice();
    },

    async loadGroupPlatformRoles(id) {
        try {
            const roles = await webconsolejs["common/api/services/groups_api"].getGroupPlatformRoles(id);
            AppState.groups.platformRoles = roles || [];
            UIManager.showGroupPlatformRoles(AppState.groups.platformRoles);
        } catch (error) {
            console.error("Error loading group platform roles:", error);
            AppState.groups.platformRoles = [];
            UIManager.showGroupPlatformRoles([]);
            if (webconsolejs && webconsolejs['common/util'] && webconsolejs['common/util'].showToast) {
                const d = error.response && error.response.data;
                const rd = d && d.responseData;
                const msg = (rd && (rd.error || rd.message))
                    || (d && d.message)
                    || (d && d.status && d.status.message)
                    || error.message
                    || 'Platform role load failed.';
                webconsolejs['common/util'].showToast('Platform role query error: ' + msg, 'error');
            }
        }
    },

    async assignPlatformRole(groupId, roleId) {
        try {
            await webconsolejs["common/api/services/groups_api"].assignGroupPlatformRole(groupId, roleId);
            const count = AppState.groups.memberCount;
            alert(count > 0
                ? `Platform role assigned. ${count} member(s) of this group now inherit this role.`
                : "Platform role assigned. It will apply to any user added to this group.");
            await GroupManager.loadGroupPlatformRoles(groupId);
        } catch (error) {
            console.error("Error assigning platform role:", error);
            const status = error.response && error.response.status;
            const d = error.response && error.response.data;
            // BFF(proxy.go)는 status.message에 HTTP 상태문구("Internal Server Error")를 붙이고
            // 백엔드 원본 에러는 responseData.error에 담는다. 일반 문구가 구체적 원인을
            // 덮지 않도록 responseData.error를 먼저 본다.
            const rd = d && d.responseData;
            const msg = (rd && (rd.error || rd.message))
                || (d && d.error)
                || (d && d.message)
                || (d && d.status && d.status.message)
                || error.message
                || "Unknown error";
            if (status === 409) {
                alert("This role is already assigned to the group.");
            } else if (status === 404) {
                alert("Failed to assign platform role: group or role not found.");
            } else {
                alert("Failed to assign platform role: " + msg);
            }
        }
    },

    async create(data) {
        try {
            await webconsolejs["common/api/services/groups_api"].createGroup(data);
            alert("Group created successfully.");
            await GroupManager.loadTree();
            await GroupManager.loadList();
        } catch (error) {
            console.error("Error creating group:", error);
            // BUG-E4: 존재하지 않는 parent_id → 500
            if (error.response && error.response.status === 500) {
                alert("Failed to create group: Parent group not found.");
            } else {
                alert("Failed to create group: " + (error.message || "Unknown error"));
            }
        }
    },

    async update(id, data) {
        try {
            await webconsolejs["common/api/services/groups_api"].updateGroup(id, data);
            alert("Group updated successfully.");
            await GroupManager.loadTree();
            await GroupManager.loadList();
            AppState.groups.selectedGroup = null;
            UIManager.clearDetailPanel();
        } catch (error) {
            console.error("Error updating group:", error);
            alert("Failed to update group: " + (error.message || "Unknown error"));
        }
    },

    async delete(id) {
        try {
            await webconsolejs["common/api/services/groups_api"].deleteGroup(id);
            alert("Group deleted successfully.");
            AppState.groups.selectedGroup = null;
            UIManager.clearDetailPanel();
            await GroupManager.loadTree();
            await GroupManager.loadList();
        } catch (error) {
            console.error("Error deleting group:", error);
            const msg = error.response && error.response.data && error.response.data.error
                ? error.response.data.error
                : (error.message || "");
            if (msg.includes("sub-group") || msg.includes("sub-organization")) {
                alert("Cannot delete: Please remove child groups first.");
            } else if (msg.includes("assigned user")) {
                alert("Cannot delete: Please remove assigned users first.");
            } else {
                alert("Failed to delete group: " + msg);
            }
        }
    }
};

// DOM 조작
const UIManager = {
    renderTree(treeData) {
        const $tree = $('#group-tree');
        if (!$tree.length) return;

        // 기존 트리 제거
        if ($tree.jstree(true)) {
            $tree.jstree("destroy");
        }

        // GroupTree[]를 jstree 포맷으로 변환
        const nodes = [];
        function collectAll(items) {
            (items || []).forEach(item => {
                nodes.push({
                    id: String(item.id),
                    parent: item.parent_id ? String(item.parent_id) : '#',
                    text: item.name,
                    state: { opened: !item.parent_id },
                    data: item
                });
                if (item.children && item.children.length > 0) {
                    collectAll(item.children);
                }
            });
        }
        collectAll(treeData);

        $tree.jstree({
            core: {
                data: nodes,
                themes: { responsive: true },
                check_callback: false,
                multiple: false
            },
            plugins: ["types"],
            types: {
                default: { icon: "ti ti-building" }
            }
        });

        $tree.on("changed.jstree", function(e, d) {
            if (d.selected && d.selected.length > 0) {
                const nodeData = $tree.jstree(true).get_node(d.selected[0]);
                if (nodeData && nodeData.data) {
                    AppState.groups.selectedGroup = nodeData.data;
                    UIManager.showDetailPanel(nodeData.data);
                    GroupManager.loadGroupUsers(nodeData.data.id);
                    GroupManager.loadGroupPlatformRoles(nodeData.data.id);
                }
            }
        });
    },

    showDetailPanel(group) {
        const panel = document.getElementById('group-detail-panel');
        if (!panel) return;

        document.getElementById('detail-name').textContent = group.name || '-';
        document.getElementById('detail-code').textContent = group.organization_code || '-';
        document.getElementById('detail-level').textContent = group.level !== undefined ? group.level : '-';
        document.getElementById('detail-path').textContent = group.path || '-';
        document.getElementById('detail-description').textContent = group.description || '-';
        document.getElementById('detail-user-count').textContent = group.user_count !== undefined ? group.user_count : '-';

        panel.style.display = 'block';
        const emptyState = document.getElementById('group-empty-state');
        if (emptyState) emptyState.style.display = 'none';

        // 액션 버튼 활성화
        document.getElementById('btn-add-child').disabled = false;
        document.getElementById('btn-edit').disabled = false;
        document.getElementById('btn-delete').disabled = false;
        document.getElementById('btn-invite-member').disabled = false;
        const btnAssignRole = document.getElementById('btn-assign-platform-role');
        if (btnAssignRole) btnAssignRole.disabled = false;

        // 상속 고지의 인원수는 멤버 조회 완료 후 갱신되므로, 우선 group.user_count로 표기
        AppState.groups.memberCount = group.user_count !== undefined ? group.user_count : 0;
        UIManager.updateInheritNotice();
    },

    clearDetailPanel() {
        const panel = document.getElementById('group-detail-panel');
        if (panel) panel.style.display = 'none';
        const emptyState = document.getElementById('group-empty-state');
        if (emptyState) emptyState.style.display = 'block';

        ['detail-name', 'detail-code', 'detail-level', 'detail-path', 'detail-description', 'detail-user-count'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '-';
        });

        ['btn-add-child', 'btn-edit', 'btn-delete', 'btn-invite-member', 'btn-assign-platform-role'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = true;
        });

        const membersList = document.getElementById('group-members-list');
        if (membersList) membersList.innerHTML = '<p class="text-muted">Select a group to view members.</p>';

        AppState.groups.platformRoles = [];
        AppState.groups.memberCount = 0;
        const rolesList = document.getElementById('group-platform-roles-list');
        if (rolesList) rolesList.innerHTML = '<p class="text-muted">Select a group to view platform roles.</p>';
        const inheritCount = document.getElementById('role-inherit-member-count');
        if (inheritCount) inheritCount.textContent = 'every member';
    },

    // 상속 영향 고지 — 그룹에 배정된 role은 소속 사용자 전원이 상속받는다
    updateInheritNotice() {
        const el = document.getElementById('role-inherit-member-count');
        if (!el) return;
        const count = AppState.groups.memberCount;
        el.textContent = count === 1 ? '1 member' : `all ${count} member(s)`;
    },

    showGroupPlatformRoles(roles) {
        const list = document.getElementById('group-platform-roles-list');
        if (!list) return;
        if (!roles || roles.length === 0) {
            list.innerHTML = '<p class="text-muted">No platform roles assigned to this group.</p>';
            return;
        }
        list.innerHTML = roles.map(r => {
            const name = r.role_name || r.roleName || '-';
            const assignedAt = r.created_at || r.createdAt;
            const assignedText = assignedAt ? new Date(assignedAt).toLocaleDateString() : '';
            return `<div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center">
                    <span class="badge bg-azure-lt me-2">Platform</span>
                    <span class="fw-bold">${name}</span>
                </div>
                ${assignedText ? `<span class="text-muted small">Assigned ${assignedText}</span>` : ''}
            </div>`;
        }).join('');
    },

    populateParentSelect(list, excludeId) {
        const select = document.getElementById('group-parent-select');
        if (!select) return;
        select.innerHTML = '<option value="">None (Top-level)</option>';
        (list || []).forEach(g => {
            if (excludeId && g.id === excludeId) return;
            const option = document.createElement('option');
            option.value = g.id;
            option.textContent = g.name + (g.organization_code ? ` (${g.organization_code})` : '');
            select.appendChild(option);
        });
    },

    populateEditParentSelect(list, currentId, currentParentId) {
        const select = document.getElementById('edit-group-parent-select');
        if (!select) return;
        select.innerHTML = '<option value="">None (Top-level)</option>';
        (list || []).forEach(g => {
            if (g.id === currentId) return; // 자기 자신 제외
            const option = document.createElement('option');
            option.value = g.id;
            option.textContent = g.name + (g.organization_code ? ` (${g.organization_code})` : '');
            if (g.id === currentParentId) option.selected = true;
            select.appendChild(option);
        });
    },

    showGroupUsers(users) {
        const list = document.getElementById('group-members-list');
        if (!list) return;
        if (!users || users.length === 0) {
            list.innerHTML = '<p class="text-muted">No members in this group.</p>';
            return;
        }
        list.innerHTML = users.map(u => {
            const name = `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || u.email || u.username || '-';
            const email = u.email || '';
            return `<div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center">
                    <span class="avatar avatar-sm me-2">${name.charAt(0).toUpperCase()}</span>
                    <div>
                        <div class="fw-bold">${name}</div>
                        <div class="text-muted small">${email}</div>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger"
                        onclick="removeMember('${u.id}')">Remove</button>
            </div>`;
        }).join('');
    },

    renderInviteModal(allUsers, currentMemberIds) {
        const currentIds = new Set(currentMemberIds.map(String));
        const list = document.getElementById('invite-member-list');
        if (!allUsers || allUsers.length === 0) {
            list.innerHTML = '<p class="text-muted">No users found.</p>';
            return;
        }
        list.innerHTML = allUsers.map(u => {
            const name = `${u.firstName||u.first_name||''} ${u.lastName||u.last_name||''}`.trim() || u.username || '-';
            const email = u.email || '';
            const isMember = currentIds.has(String(u.id));
            return `<div class="d-flex align-items-center mb-2 invite-user-row"
                         data-name="${name.toLowerCase()}" data-email="${email.toLowerCase()}">
              <input type="checkbox" class="form-check-input me-2 invite-user-check"
                     value="${u.id}" ${isMember ? 'disabled' : ''} />
              <div class="flex-grow-1">
                <span class="${isMember ? 'text-muted' : ''}">${name}</span>
                <span class="text-muted small ms-2">${email}</span>
              </div>
              ${isMember ? '<span class="badge bg-secondary ms-2">Already a member</span>' : ''}
            </div>`;
        }).join('');
    }
};

// 모달 관리
const ModalManager = {
    openCreate(parentId) {
        // 폼 초기화
        const form = document.getElementById('create-group-form');
        if (form) form.reset();

        UIManager.populateParentSelect(AppState.groups.list);

        if (parentId) {
            const select = document.getElementById('group-parent-select');
            if (select) select.value = String(parentId);
        }

        // 경고 메시지 숨기기
        const warning = document.getElementById('parent-change-warning');
        if (warning) warning.style.display = 'none';

        const modal = new bootstrap.Modal(document.getElementById('create-group-modal'));
        modal.show();
    },

    openEdit(group) {
        if (!group) return;

        document.getElementById('edit-group-id').value = group.id;
        document.getElementById('edit-group-name').value = group.name || '';
        document.getElementById('edit-group-description').value = group.description || '';
        document.getElementById('edit-group-code').value = group.organization_code || '';

        UIManager.populateEditParentSelect(AppState.groups.list, group.id, group.parent_id);

        // 부모 변경 시 경고
        const editParentSelect = document.getElementById('edit-group-parent-select');
        const warning = document.getElementById('edit-parent-change-warning');
        if (editParentSelect && warning) {
            const originalParentId = group.parent_id;
            editParentSelect.addEventListener('change', function() {
                const newVal = this.value ? parseInt(this.value) : null;
                if (newVal !== originalParentId) {
                    warning.style.display = 'block';
                } else {
                    warning.style.display = 'none';
                }
            }, { once: false });
            warning.style.display = 'none';
        }

        const modal = new bootstrap.Modal(document.getElementById('edit-group-modal'));
        modal.show();
    },

    openDelete(group) {
        if (!group) return;
        document.getElementById('delete-group-id').value = group.id;
        document.getElementById('delete-group-name').textContent = group.name || '';
        const modal = new bootstrap.Modal(document.getElementById('delete-group-modal'));
        modal.show();
    },

    // users.js와 동일한 방식: 전체 역할 목록을 가져와 role type으로 필터
    getRoleTypes(role) {
        if (Array.isArray(role.role_types) && role.role_types.length > 0) {
            return role.role_types;
        }
        if (Array.isArray(role.roleTypes) && role.roleTypes.length > 0) {
            return role.roleTypes;
        }
        const roleSubs = role.role_subs || role.roleSubs || [];
        return roleSubs
            .map(sub => sub.role_type || sub.roleType)
            .filter(Boolean);
    },

    filterRolesByType(roles, roleType) {
        if (!roleType) return roles;
        const normalizedType = roleType.toLowerCase();
        return roles.filter(role => {
            const roleTypes = this.getRoleTypes(role);
            return roleTypes.some(type => String(type).toLowerCase() === normalizedType);
        });
    },

    async openAssignPlatformRole(group) {
        if (!group) return;

        document.getElementById('assign-role-group-name').value =
            group.name + (group.organization_code ? ` (${group.organization_code})` : '');

        const select = document.getElementById('assign-role-select');
        const hint = document.getElementById('assign-role-hint');
        const impact = document.getElementById('assign-role-impact');
        const submit = document.getElementById('assign-role-submit');

        select.innerHTML = '<option value="">Loading roles...</option>';
        select.disabled = true;
        hint.textContent = '';
        impact.style.display = 'none';
        submit.disabled = true;

        new bootstrap.Modal(document.getElementById('assign-platform-role-modal')).show();

        try {
            if (!AppState.roles.all.length) {
                const allRoles = await webconsolejs['common/api/services/roles_api'].getRoleList();
                AppState.roles.all = allRoles || [];
            }
            const platformRoles = this.filterRolesByType(AppState.roles.all, 'platform');
            const assignedIds = new Set(
                (AppState.groups.platformRoles || []).map(r => String(r.role_id || r.roleId))
            );
            const selectable = platformRoles.filter(r => !assignedIds.has(String(r.id)));

            select.innerHTML = '<option value="">Select role</option>';
            selectable.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name + (role.description ? ` — ${role.description}` : '');
                select.appendChild(option);
            });
            select.disabled = false;
            submit.disabled = false;

            if (selectable.length === 0) {
                select.innerHTML = '<option value="">No assignable platform role</option>';
                hint.textContent = platformRoles.length === 0
                    ? 'No platform role is defined yet.'
                    : 'All platform roles are already assigned to this group.';
                select.disabled = true;
                submit.disabled = true;
            }
        } catch (error) {
            console.error('Failed to load role list:', error);
            select.innerHTML = '<option value="">Failed to load roles</option>';
            hint.textContent = 'Could not load the platform role list. Please retry.';
        }
    },

    // 상속 영향 고지 — 선택한 role이 몇 명에게 전파되는지 명시
    showAssignImpact() {
        const select = document.getElementById('assign-role-select');
        const impact = document.getElementById('assign-role-impact');
        const text = document.getElementById('assign-role-impact-text');
        if (!select || !impact || !text) return;

        if (!select.value) {
            impact.style.display = 'none';
            return;
        }

        const roleName = select.options[select.selectedIndex].textContent.split(' — ')[0];
        const count = AppState.groups.memberCount;
        const groupName = AppState.groups.selectedGroup ? AppState.groups.selectedGroup.name : 'this group';

        text.innerHTML = count > 0
            ? `<strong>${count}</strong> member(s) of <strong>${groupName}</strong> will inherit <strong>${roleName}</strong> immediately, on top of the roles granted to them directly.`
            : `<strong>${groupName}</strong> has no member yet. <strong>${roleName}</strong> will be inherited by every user added to this group later.`;
        impact.style.display = 'block';
    }
};

// 전역 함수 등록
window.openCreateGroup = function() {
    const parentId = AppState.groups.selectedGroup ? AppState.groups.selectedGroup.id : null;
    ModalManager.openCreate(null);
};

window.openAddChildGroup = function() {
    const parentId = AppState.groups.selectedGroup ? AppState.groups.selectedGroup.id : null;
    if (!parentId) {
        alert("Please select a parent group first.");
        return;
    }
    ModalManager.openCreate(parentId);
};

window.openEditGroup = function() {
    if (!AppState.groups.selectedGroup) {
        alert("Please select a group to edit.");
        return;
    }
    ModalManager.openEdit(AppState.groups.selectedGroup);
};

window.openDeleteGroup = function() {
    if (!AppState.groups.selectedGroup) {
        alert("Please select a group to delete.");
        return;
    }
    ModalManager.openDelete(AppState.groups.selectedGroup);
};

window.submitCreateGroup = async function() {
    const name = document.getElementById('group-name').value.trim();
    if (!name) {
        alert("Name is required.");
        return;
    }
    const description = document.getElementById('group-description').value.trim();
    const parentVal = document.getElementById('group-parent-select').value;
    const code = document.getElementById('group-code').value.trim();

    const data = {
        name,
        description,
        parent_id: parentVal ? parseInt(parentVal) : null,
        organization_code: code || undefined
    };

    const modal = bootstrap.Modal.getInstance(document.getElementById('create-group-modal'));
    if (modal) modal.hide();

    await GroupManager.create(data);
};

window.submitEditGroup = async function() {
    const id = parseInt(document.getElementById('edit-group-id').value);
    const name = document.getElementById('edit-group-name').value.trim();
    if (!name) {
        alert("Name is required.");
        return;
    }
    const description = document.getElementById('edit-group-description').value.trim();
    const parentVal = document.getElementById('edit-group-parent-select').value;
    const code = document.getElementById('edit-group-code').value.trim();

    const data = {
        name,
        description,
        parent_id: parentVal ? parseInt(parentVal) : null,
        organization_code: code || undefined
    };

    const modal = bootstrap.Modal.getInstance(document.getElementById('edit-group-modal'));
    if (modal) modal.hide();

    await GroupManager.update(id, data);
};

window.submitDeleteGroup = async function() {
    const id = parseInt(document.getElementById('delete-group-id').value);
    const modal = bootstrap.Modal.getInstance(document.getElementById('delete-group-modal'));
    if (modal) modal.hide();
    await GroupManager.delete(id);
};

window.refreshGroups = async function() {
    AppState.groups.selectedGroup = null;
    AppState.roles.all = [];
    UIManager.clearDetailPanel();
    await GroupManager.loadTree();
    await GroupManager.loadList();
};

window.openAssignPlatformRole = async function() {
    if (!AppState.groups.selectedGroup) {
        alert("Please select a group first.");
        return;
    }
    await ModalManager.openAssignPlatformRole(AppState.groups.selectedGroup);
};

window.onAssignRoleChanged = function() {
    ModalManager.showAssignImpact();
};

window.submitAssignPlatformRole = async function() {
    const roleId = document.getElementById('assign-role-select').value;
    if (!roleId) {
        alert("Please select a platform role.");
        return;
    }
    if (!AppState.groups.selectedGroup) return;

    const groupId = AppState.groups.selectedGroup.id;
    const groupName = AppState.groups.selectedGroup.name;
    const count = AppState.groups.memberCount;

    // 상속 영향 최종 확인 — 그룹 배정은 소속 사용자 전원의 권한을 올린다
    const confirmMsg = count > 0
        ? `Assign this platform role to "${groupName}"?\n\n${count} member(s) of this group will inherit it immediately.`
        : `Assign this platform role to "${groupName}"?\n\nThis group has no member yet. Any user added later will inherit it.`;
    if (!confirm(confirmMsg)) return;

    const modal = bootstrap.Modal.getInstance(document.getElementById('assign-platform-role-modal'));
    if (modal) modal.hide();

    await GroupManager.assignPlatformRole(groupId, roleId);
};

window.openInviteMember = async function() {
    if (!AppState.groups.selectedGroup) return;
    if (!AppState.users.all.length) {
        AppState.users.all = await webconsolejs["common/api/services/groups_api"].listUsers();
    }
    document.getElementById('invite-member-search').value = '';
    const groupUsers = await webconsolejs["common/api/services/groups_api"].getGroupUsers(AppState.groups.selectedGroup.id);
    const currentIds = (groupUsers || []).map(u => String(u.id));
    UIManager.renderInviteModal(AppState.users.all, currentIds);
    new bootstrap.Modal(document.getElementById('invite-member-modal')).show();
};

window.filterInviteUsers = function() {
    const query = document.getElementById('invite-member-search').value.toLowerCase();
    document.querySelectorAll('.invite-user-row').forEach(row => {
        const name = row.dataset.name || '';
        const email = row.dataset.email || '';
        row.style.display = (name.includes(query) || email.includes(query)) ? '' : 'none';
    });
};

window.submitInviteMembers = async function() {
    const orgId = AppState.groups.selectedGroup.id;
    const checked = [...document.querySelectorAll('.invite-user-check:checked')];
    if (!checked.length) {
        alert("Please select at least one user.");
        return;
    }
    const modal = bootstrap.Modal.getInstance(document.getElementById('invite-member-modal'));
    if (modal) modal.hide();

    let success = 0, fail = 0;
    for (const cb of checked) {
        try {
            await webconsolejs["common/api/services/groups_api"].assignUserGroups(cb.value, [orgId]);
            success++;
        } catch (e) {
            fail++;
        }
    }
    if (fail > 0) alert(`Invited ${success} user(s). ${fail} failed.`);
    AppState.users.all = [];
    await GroupManager.loadGroupUsers(orgId);
};

window.removeMember = async function(userId) {
    if (!AppState.groups.selectedGroup) return;
    if (!confirm("Remove this member from the group?")) return;
    const orgId = AppState.groups.selectedGroup.id;
    try {
        await webconsolejs["common/api/services/groups_api"].removeUserGroup(userId, orgId);
    } catch (e) {
        // BUG-E6: 400도 이미 제거된 것으로 처리
    }
    await GroupManager.loadGroupUsers(orgId);
};

window.expandAllGroups = function() {
    $('#group-tree').jstree('open_all');
};

window.collapseAllGroups = function() {
    $('#group-tree').jstree('close_all');
};

window.exportGroups = async function() {
    const tree = await webconsolejs["common/api/services/groups_api"].getGroupTree();
    const payload = {
        version: "1.0",
        exported_at: new Date().toISOString(),
        groups: tree || []
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const topName = (tree && tree.length > 0 && tree[0].name) ? tree[0].name : 'groups';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `${topName}-OrganizationTree-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

window.importGroups = async function(input) {
    const file = input.files[0];
    if (!file) return;
    input.value = '';

    const text = await file.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        alert("Invalid JSON file.");
        return;
    }

    const groups = data.groups || (Array.isArray(data) ? data : []);

    // 현재 그룹 목록을 organization_code 기준으로 맵 생성
    const currentList = await webconsolejs["common/api/services/groups_api"].getGroupList();
    const codeMap = {};
    (currentList || []).forEach(g => {
        if (g.organization_code) codeMap[g.organization_code] = g;
    });

    let created = 0, updated = 0, skipped = 0, failed = 0;

    async function processRecursive(items, parentId) {
        for (const g of items) {
            const existing = g.organization_code ? codeMap[g.organization_code] : null;
            let groupId = null;

            if (existing) {
                if (existing.name === g.name) {
                    // 코드·이름 동일 → skip
                    skipped++;
                    groupId = existing.id;
                } else {
                    // 코드 동일, 이름 다름 → update
                    try {
                        await webconsolejs["common/api/services/groups_api"].updateGroup(existing.id, {
                            name: g.name,
                            description: g.description !== undefined ? g.description : (existing.description || ''),
                            organization_code: g.organization_code,
                            parent_id: existing.parent_id
                        });
                        updated++;
                        groupId = existing.id;
                        codeMap[g.organization_code] = { ...existing, name: g.name };
                    } catch (e) {
                        failed++;
                        groupId = existing.id;
                    }
                }
            } else {
                // 코드 없음 → create
                try {
                    const result = await webconsolejs["common/api/services/groups_api"].createGroup({
                        name: g.name,
                        description: g.description || '',
                        organization_code: g.organization_code || undefined,
                        parent_id: parentId || null
                    });
                    created++;
                    groupId = result ? result.id : null;
                    if (result && g.organization_code) codeMap[g.organization_code] = result;
                } catch (e) {
                    failed++;
                }
            }

            if (g.children && g.children.length > 0) {
                await processRecursive(g.children, groupId);
            }
        }
    }

    await processRecursive(groups, null);

    const body = document.getElementById('import-result-body');
    body.innerHTML = `<p>Import complete.</p>
      ${created > 0 ? `<p><strong>${created}</strong> group(s) created.</p>` : ''}
      ${updated > 0 ? `<p><strong>${updated}</strong> group(s) updated.</p>` : ''}
      ${skipped > 0 ? `<p class="text-muted"><strong>${skipped}</strong> group(s) skipped (no change).</p>` : ''}
      ${failed > 0 ? `<p class="text-danger"><strong>${failed}</strong> group(s) failed.</p>` : ''}`;
    new bootstrap.Modal(document.getElementById('import-result-modal')).show();

    await GroupManager.loadTree();
    await GroupManager.loadList();
};

// 초기화
document.addEventListener("DOMContentLoaded", async function() {
    // 레이아웃 page-header-btn-list에 버튼 주입
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        btnList.innerHTML = `
          <button class="btn btn-outline-secondary" onclick="refreshGroups()">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"></path>
              <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path>
            </svg>
            Refresh
          </button>
          <button class="btn btn-outline-secondary" onclick="document.getElementById('import-groups-file').click()">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
              <path d="M7 9l5 -5l5 5"></path>
              <path d="M12 4l0 12"></path>
            </svg>
            Import JSON
          </button>
          <input type="file" id="import-groups-file" accept=".json" style="display:none"
                 onchange="importGroups(this)" />
          <button class="btn btn-outline-secondary" onclick="exportGroups()">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
              <path d="M7 11l5 5l5 -5"></path>
              <path d="M12 4l0 12"></path>
            </svg>
            Export JSON
          </button>
          <button class="btn btn-primary" onclick="openCreateGroup()">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M12 5l0 14"></path>
              <path d="M5 12l14 0"></path>
            </svg>
            Create Org
          </button>
        `;
    }

    try {
        UIManager.clearDetailPanel();
        await GroupManager.loadTree();
        await GroupManager.loadList();
    } catch (error) {
        console.error("Error during groups page initialization:", error);
    }
});
