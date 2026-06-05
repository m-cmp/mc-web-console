import { TabulatorFull as Tabulator } from "tabulator-tables";

// DOM 요소 캐싱
const DOM = {
  usersTable: document.getElementById('users-table'),
  viewModeCards: document.getElementById('view-mode-cards'),
  userInfoUsername: document.getElementById('user-info-username'),
  userInfoUsernameText: document.getElementById('user-info-username-text'),
  userInfoFirstname: document.getElementById('user-info-firstname'),
  userInfoLastname: document.getElementById('user-info-lastname'),
  userInfoEmail: document.getElementById('user-info-email'),
  userInfoEnabled: document.getElementById('user-info-enabled'),
  platformRolesList: document.getElementById('platform-roles-list'),
  workspaceRolesList: document.getElementById('workspace-roles-list'),
  cspRolesList: document.getElementById('csp-roles-list'),
  addUserModal: document.getElementById('add-user-modal'),
  addRoleMappingModal: document.getElementById('add-role-mapping-modal'),
  roleMappingType: document.getElementById('role-mapping-type'),
  roleMappingRole: document.getElementById('role-mapping-role')
};

// 중앙화된 상태 관리 객체
const AppState = {
  users: {
    list: [],
    selectedUser: null,
    isLoading: false,
    error: null
  },
  
  ui: {
    viewMode: false,
    selectedRows: [],
    loadingStates: {
      users: false,
      userDetails: false,
      roleMapping: false
    }
  },
  
  tables: {
    usersTable: null
  }
};

// 선택된 행들을 관리하는 배열 (roles.js와 동일한 패턴)
var checked_array = [];

// 유틸리티 함수들
const Utils = {
  showAlert(message, type = 'info') {
    // Bootstrap alert 또는 toast 메시지 표시
  },
  
  formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  },
  
  formatStatus(enabled) {
    return enabled ? 
      '<span class="badge bg-success">Enabled</span>' : 
      '<span class="badge bg-danger">Disabled</span>';
  },
  
  formatRoles(roles) {
    if (!roles || roles.length === 0) return '-';
    return roles.map(role => role.name).join(', ');
  }
};

// 에러 핸들러
const ErrorHandler = {
  handle(error, context = '') {
    console.error(`Error in ${context}:`, error);
    Utils.showAlert(`Error: ${error.message}`, 'error');
  },
  
  wrapAsync(asyncFn, context) {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        this.handle(error, context);
        throw error;
      }
    };
  }
};

// 유저 관리 모듈
const UserManager = {
  // 유저 목록 로드
  async loadUsers() {
    try {
      const userList = await webconsolejs["common/api/services/users_api"].getUserList();
      return userList || [];
    } catch (error) {
      console.error("Error loading users:", error);
      throw error;
    }
  },

  // 유저 상세 정보 로드 (리스트 데이터에서 직접 추출)
  async loadUserDetails(userId) {
    try {
      // 리스트에서 해당 유저 정보 찾기
      const user = AppState.users.list.find(u => u.id === userId);
      if (!user) {
        throw new Error("User not found in list");
      }
      
      // 리스트 데이터를 그대로 반환 (API 호출 없음)
      return user;
    } catch (error) {
      console.error("Error loading user details:", error);
      throw error;
    }
  },

  // 폼 데이터 수집
  collectFormData() {
    const username = document.getElementById('create-user-username').value.trim();
    const email = document.getElementById('create-user-email').value.trim();
    // const password = document.getElementById('create-user-password').value;
    const data = {
      username,
      email,
      firstName: document.getElementById('create-user-firstname').value,
      lastName: document.getElementById('create-user-lastname').value,
      enabled: document.getElementById('create-user-enabled').checked,
      emailVerified: false // 고정값
    };
    // if (password && password.trim() !== '') {
    //   data.password = password.trim();
    // }
    return data;
  },

  // 유효성 검증
  validateUserData(userData) {
    const errors = [];

    const username = (userData.username || '').trim();
    const email = (userData.email || '').trim();

    if (!username) {
      errors.push('User ID is required');
    } else if (username.includes('@')) {
      errors.push('User ID must not be an email address');
    } else if (email && username === email) {
      errors.push('User ID must differ from email address');
    }

    if (!email) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(email)) {
      errors.push('Invalid email format');
    }
    
    if (!userData.firstName || userData.firstName.trim() === '') {
      errors.push('First name is required');
    }
    
    if (!userData.lastName || userData.lastName.trim() === '') {
      errors.push('Last name is required');
    }

    // if (userData.password && userData.password.length < 8) {
    //   errors.push('Password must be at least 8 characters');
    // }

    return errors;
  },

  // 이메일 유효성 검증
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // 유저 생성
  async createUser(userData) {
    try {
      const response = await webconsolejs["common/api/services/users_api"].createUser(userData);
      return response;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // 유저 수정
  async updateUser(userId, userData) {
    try {
      const response = await webconsolejs["common/api/services/users_api"].updateUser(userId, userData);
      return response;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // 유저 삭제
  async deleteUser(userId) {
    try {
      const response = await webconsolejs["common/api/services/users_api"].deleteUser(userId);
      return response;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // 유저 역할 매핑 추가
  async addUserRole(userId, roleData) {
    try {
      const response = await webconsolejs["common/api/services/users_api"].addUserRole(userId, roleData);
      return response;
    } catch (error) {
      console.error("Error adding user role:", error);
      throw error;
    }
  }
};

// UI 관리 모듈
const UIManager = {
  // View 모드 표시
  showViewMode() {
    if (DOM.viewModeCards) {
      DOM.viewModeCards.classList.add('show');
    }
    AppState.ui.viewMode = true;
  },

  // View 모드 숨기기
  hideViewMode() {
    if (DOM.viewModeCards) {
      DOM.viewModeCards.classList.remove('show');
    }
    AppState.ui.viewMode = false;
  },

  // 모든 모드 숨기기
  hideAllModes() {
    this.hideViewMode();
  },

  // 유저 상세 정보 업데이트
  updateUserDetail(user) {
    if (!user) {
      this.clearUserDetail();
      return;
    }

    // API 응답 구조에 따라 필드명 조정
    const firstName = user.firstName || user.first_name || user.FirstName || "";
    const lastName = user.lastName || user.last_name || user.LastName || "";
    const email = user.email || user.Email || "";
    const enabled = user.enabled !== undefined ? user.enabled : 
                   user.Enabled !== undefined ? user.Enabled : 
                   user.status === 'active' || user.Status === 'active';

    // 기본 정보 업데이트
    if (DOM.userInfoFirstname) {
      DOM.userInfoFirstname.textContent = firstName;
    }
    if (DOM.userInfoLastname) {
      DOM.userInfoLastname.textContent = lastName;
    }
    if (DOM.userInfoEmail) {
      DOM.userInfoEmail.textContent = email;
    }
    if (DOM.userInfoEnabled) {
      DOM.userInfoEnabled.textContent = enabled ? 'Enabled' : 'Disabled';
    }

    // Enable/Disable 토글 버튼 업데이트
    const toggleBtn = document.getElementById('user-status-toggle-btn');
    if (toggleBtn) {
      toggleBtn.style.display = 'inline-block';
      if (enabled) {
        toggleBtn.textContent = 'Disable';
        toggleBtn.className = 'btn btn-sm btn-outline-danger';
      } else {
        toggleBtn.textContent = 'Enable';
        toggleBtn.className = 'btn btn-sm btn-outline-success';
      }
    }

    // User Info 제목에 유저 이름 표시
    if (DOM.userInfoUsername && DOM.userInfoUsernameText) {
      const fullName = `${firstName} ${lastName}`.trim();
      DOM.userInfoUsernameText.textContent = fullName || email;
      DOM.userInfoUsername.style.display = 'inline';
    }
  },

  // 유저 상세 정보 초기화
  clearUserDetail() {
    if (DOM.userInfoFirstname) DOM.userInfoFirstname.textContent = "";
    if (DOM.userInfoLastname) DOM.userInfoLastname.textContent = "";
    if (DOM.userInfoEmail) DOM.userInfoEmail.textContent = "";
    if (DOM.userInfoEnabled) DOM.userInfoEnabled.textContent = "";
    if (DOM.userInfoUsername) DOM.userInfoUsername.style.display = 'none';
    const toggleBtn = document.getElementById('user-status-toggle-btn');
    if (toggleBtn) toggleBtn.style.display = 'none';
    
    // 역할 목록 초기화
    this.clearRoleLists();
  },

  // 역할 목록 초기화
  clearRoleLists() {
    if (DOM.platformRolesList) DOM.platformRolesList.innerHTML = "";
    if (DOM.workspaceRolesList) DOM.workspaceRolesList.innerHTML = "";
    if (DOM.cspRolesList) DOM.cspRolesList.innerHTML = "";
  },

  // 역할 목록 업데이트 (테이블 그리드 형태)
  updateRoleLists(platformRoles = [], workspaceRoles = [], cspRoles = []) {
    // 모든 역할을 하나의 테이블로 통합
    const allRoles = [
      ...platformRoles.map(role => ({ ...role, type: 'Platform' })),
      ...workspaceRoles.map(role => ({ ...role, type: 'Workspace' })),
      ...cspRoles.map(role => ({ ...role, type: 'CSP' }))
    ];
    
    this.updateRoleTable(allRoles);
  },

  // 역할 제거 함수
  removeUserRole(roleId) {
    if (confirm('Are you sure you want to remove this role?')) {
      // TODO: API 호출로 역할 제거 구현
      // users_api.removeUserRole(currentUserId, roleId).then(() => {
      //   loadUserDetails(currentUserId);
      // });
    }
  },

  // 역할 테이블 업데이트 (HTML 템플릿 방식)
  updateRoleTable(roles) {
    // 역할을 타입별로 분류
    const platformRoles = roles.filter(role => role.type === 'Platform');
    const workspaceRoles = roles.filter(role => role.type === 'Workspace');
    const cspRoles = roles.filter(role => role.type === 'CSP');
    
    // Platform Roles 업데이트
    this.updateRoleRow('platform', platformRoles);
    
    // Workspace Roles 업데이트
    this.updateRoleRow('workspace', workspaceRoles);
    
    // CSP Roles 업데이트
    this.updateRoleRow('csp', cspRoles);
  },
  
  // 개별 역할 row 업데이트 (그리드 형태)
  updateRoleRow(roleType, roles) {
    const namesElement = document.getElementById(`${roleType}-roles-names`);
    const descriptionsElement = document.getElementById(`${roleType}-roles-descriptions`);
    const actionsElement = document.getElementById(`${roleType}-roles-actions`);
    
    if (!namesElement || !descriptionsElement || !actionsElement) {
      console.error(`Role elements not found for type: ${roleType}`);
      return;
    }
    
    if (roles.length === 0) {
      // 역할이 없을 때
      namesElement.innerHTML = '<span class="text-muted">-</span>';
      descriptionsElement.innerHTML = '<span class="text-muted">-</span>';
      actionsElement.innerHTML = `
        <div class="btn-list justify-content-center">
          <button class="btn btn-outline-primary btn-sm" onclick="openAddUserRoleModal('${roleType}')" title="Add ${roleType} role">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M12 5l0 14"></path>
              <path d="M5 12l14 0"></path>
            </svg>
          </button>
        </div>
      `;
    } else {
      // 역할이 있을 때 - 그리드 형태에 맞게 스타일 조정
      const roleNames = roles.map(role => `<span class="badge bg-primary me-1 mb-1">${role.name}</span>`).join('');
      namesElement.innerHTML = roleNames || '<span class="text-muted">-</span>';
      
      const roleDescriptions = roles.map(role => `<div class="text-muted small mb-1">${role.description || 'No description'}</div>`).join('');
      descriptionsElement.innerHTML = roleDescriptions || '<span class="text-muted">-</span>';
      
      // Actions 컬럼 (삭제 버튼들 + 추가 버튼)
      const removeButtons = roles.map(role => `
        <button class="btn btn-outline-danger btn-sm me-1" onclick="removeUserRole('${role.id}')" title="Remove ${role.name}">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M4 7l16 0"></path>
            <path d="M10 11l0 6"></path>
            <path d="M14 11l0 6"></path>
            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
          </svg>
        </button>
      `).join('');
      
      actionsElement.innerHTML = `
        <div class="btn-list justify-content-center">
          ${removeButtons}
          <button class="btn btn-outline-primary btn-sm" onclick="openAddUserRoleModal('${roleType}')" title="Add ${roleType} role">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M12 5l0 14"></path>
              <path d="M5 12l14 0"></path>
            </svg>
          </button>
        </div>
      `;
    }
  },
  

};

// 테이블 관리 모듈
const TableManager = {
  // 유저 테이블 초기화
  async initUsersTable() {
    return new Promise((resolve, reject) => {

      // 테이블이 이미 존재하는 경우 제거
      if (AppState.tables.usersTable) {
        AppState.tables.usersTable.destroy();
      }

      // 테이블 요소 확인
      const tableElement = DOM.usersTable;
      if (!tableElement) {
        console.error("users-table element not found");
        reject(new Error("Table element not found"));
        return;
      }

      try {
        const table = new Tabulator("#users-table", {
          data: [],
          layout: "fitColumns",
          height: 400,
          pagination: true,
          paginationSize: 10,
          paginationSizeSelector: [10, 25, 50],
          reactiveData: true,
          columns: this.getUsersTableColumns()
        });

        // AppState에 테이블 인스턴스 저장
        AppState.tables.usersTable = table;

        // 테이블 초기화 완료 후 이벤트 리스너 설정
        table.on("tableBuilt", function () {
          resolve();
        });

        // 행 클릭 이벤트 추가 (체크박스 선택과 함께 동작)
        table.on("rowClick", function (e, row) {
          var userID = row.getCell("id").getValue();
          
          // 행 클릭 시 체크박스도 함께 선택/해제
          row.toggleSelect();
          
          // 선택된 행의 정보 표시
          getSelectedUserData(userID);
        });

        // 행 선택 변경 이벤트 추가 (roles.js와 동일한 패턴)
        table.on("rowSelectionChanged", function (data, rows) {
          checked_array = data;
        });

      } catch (error) {
        console.error("Error occurred while initializing table:", error);
        reject(error);
      }
    });
  },

  // 유저 테이블 컬럼 정의
  getUsersTableColumns() {
    return [
      {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        vertAlign: "middle",
        hozAlign: "center",
        headerHozAlign: "center",
        headerSort: false,
        width: 60,
      },
      {
        title: "Id",
        field: "id",
        visible: false
      },
      {
        title: "Name",
        field: "name",
        sorter: "string",
        formatter: function(cell) {
          const user = cell.getRow().getData();
          // API 응답 구조에 따라 필드명 조정
          const firstName = user.firstName || user.first_name || user.FirstName || '';
          const lastName = user.lastName || user.last_name || user.LastName || '';
          const email = user.email || user.Email || '';
          return `${firstName} ${lastName}`.trim() || email;
        }
      },
      {
        title: "Email",
        field: "email",
        sorter: "string",
        formatter: function(cell) {
          const user = cell.getRow().getData();
          return user.email || user.Email || '';
        }
      },
      {
        title: "Status",
        field: "enabled",
        sorter: "boolean",
        formatter: function(cell) {
          const user = cell.getRow().getData();
          const enabled = user.enabled !== undefined ? user.enabled : 
                         user.Enabled !== undefined ? user.Enabled : 
                         user.status === 'active' || user.Status === 'active';
          return enabled ? 'Enabled' : 'Disabled';
        }
      },
      {
        title: "Platform Roles",
        field: "platformRoles",
        formatter: function(cell) {
          const user = cell.getRow().getData();
          const roles = user.platformRoles || user.platform_roles || user.PlatformRoles || [];
          return roles.length > 0 ? 'Y' : 'N';
        }
      },
      {
        title: "Workspace Roles",
        field: "workspaceRoles",
        formatter: function(cell) {
          const user = cell.getRow().getData();
          const roles = user.workspaceRoles || user.workspace_roles || user.WorkspaceRoles || [];
          return roles.length > 0 ? 'Y' : 'N';
        }
      },
      {
        title: "CSP Roles",
        field: "cspRoles",
        formatter: function(cell) {
          const user = cell.getRow().getData();
          const roles = user.cspRoles || user.csp_roles || user.CSPRoles || [];
          return roles.length > 0 ? 'Y' : 'N';
        }
      }
    ];
  },

  // 테이블 데이터 설정
  setTableData(table, data) {
    if (table && data) {
      table.setData(data);
    }
  }
};

// 모달 관리 모듈
const ModalManager = {
  // 역할 타입 설정
  setRoleType(roleType) {
    if (DOM.roleMappingType) {
      DOM.roleMappingType.value = roleType;
      this.loadRolesByType(roleType);
    }
  },

  // 역할 타입별 역할 목록 로드
  async loadRolesByType(roleType) {
    try {
      if (!webconsolejs['common/api/services/roles_api']) {
        console.error('roles_api service not found');
        return;
      }

      const allRoles = await webconsolejs['common/api/services/roles_api'].getRoleList();
      const roles = this.filterRolesByType(allRoles || [], roleType);
      this.populateRoleSelect(roles);
    } catch (error) {
      console.error('Failed to load role list:', error);
    }
  },

  getRoleTypes(role) {
    if (Array.isArray(role.role_types) && role.role_types.length > 0) {
      return role.role_types;
    }
    if (Array.isArray(role.roleTypes) && role.roleTypes.length > 0) {
      return role.roleTypes;
    }

    const roleSubs = role.role_subs || role.roleSubs || [];
    return roleSubs
      .map((sub) => sub.role_type || sub.roleType)
      .filter(Boolean);
  },

  filterRolesByType(roles, roleType) {
    if (!roleType) {
      return roles;
    }

    const normalizedType = roleType.toLowerCase();
    return roles.filter((role) => {
      const roleTypes = this.getRoleTypes(role);
      return roleTypes.some((type) => String(type).toLowerCase() === normalizedType);
    });
  },

  // 역할 선택 드롭다운 채우기
  populateRoleSelect(roles) {
    if (!DOM.roleMappingRole) return;

    DOM.roleMappingRole.innerHTML = '<option value="">Select role</option>';
    roles.forEach((role) => {
      const roleId = role.id ?? role.roleId ?? role.ID;
      const roleName = role.name ?? role.roleName ?? '';
      if (!roleId) {
        return;
      }

      const option = document.createElement('option');
      option.value = roleId;
      option.textContent = roleName;
      DOM.roleMappingRole.appendChild(option);
    });
  }
};

// 전역 함수들
window.setRoleType = function(roleType) {
  ModalManager.setRoleType(roleType);
};

// 새로운 User 생성 관련 함수들 (MCI 패턴과 동일하게)
window.addNewUser = function() {
  // MCI 패턴과 동일하게 단순히 초기화만 수행
  // 실제 폼 초기화는 DOMContentLoaded에서 처리
};

window.goBackToUserList = function() {
  window.location.hash = "#index";
};

window.deployUser = async function() {
  
  // 폼 데이터 수집 및 검증
  const formData = UserManager.collectFormData();
  const errors = UserManager.validateUserData(formData);
  
  if (errors.length > 0) {
    alert('Validation errors: ' + errors.join(', '));
    return;
  }
  try {
    const response = await UserManager.createUser(formData);
    
    alert("User created successfully!");
    
    // User 목록으로 돌아가기
    window.location.hash = "#index";
    
    // User 목록 새로고침
    await initUsers();
    
  } catch (error) {
    console.error('User creation error:', error);
    alert('Failed to create user: ' + error.message);
  }
};

window.createUser = async function() {
  const formData = {
    firstName: document.getElementById('add-user-firstname').value,
    lastName: document.getElementById('add-user-lastname').value,
    email: document.getElementById('add-user-email').value,
    // password: document.getElementById('add-user-password').value,
    enabled: document.getElementById('add-user-enabled').checked
  };

  try {
    await UserManager.createUser(formData);
    
    // 모달 닫기
    const modal = bootstrap.Modal.getInstance(DOM.addUserModal);
    if (modal) modal.hide();
    
    // 폼 초기화
    document.getElementById('add-user-form').reset();
    
    // 유저 목록 새로고침
    await initUsers();
    
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

window.submitUserRoleMapping = async function() {
  if (!AppState.users.selectedUser) {
    Utils.showAlert('Please select a user.');
    return;
  }

  const roleType = DOM.roleMappingType.value;
  const roleId = DOM.roleMappingRole.value;

  if (!roleType || !roleId) {
    Utils.showAlert('Please select role type and role.');
    return;
  }

  try {
    const workspaceApi = webconsolejs['common/api/services/workspace_api'];
    const currentWorkspace = workspaceApi?.getCurrentWorkspace?.();
    const workspaceId = currentWorkspace?.Id ?? currentWorkspace?.id ?? '1';

    await UserManager.addUserRole(AppState.users.selectedUser.id, {
      roleType: roleType,
      roleId: roleId,
      workspaceId: workspaceId.toString()
    });

    const modal = bootstrap.Modal.getInstance(DOM.addRoleMappingModal);
    if (modal) modal.hide();

    document.getElementById('add-role-mapping-form').reset();

    Utils.showAlert('Role added successfully.');

    const userList = await UserManager.loadUsers();
    AppState.users.list = userList || [];
    const selectedUserId = AppState.users.selectedUser.id;
    const updatedUser = AppState.users.list.find((user) => user.id === selectedUserId);

    if (updatedUser) {
      AppState.users.selectedUser = updatedUser;
      UIManager.updateRoleLists(
        updatedUser.platform_roles || updatedUser.platformRoles || [],
        updatedUser.workspace_roles || updatedUser.workspaceRoles || [],
        updatedUser.csp_roles || updatedUser.cspRoles || []
      );
    }

    if (roleType === 'workspace') {
      try {
        const workspaceData = await webconsolejs['common/api/services/users_api']
          .getUserWorkspacesByUserID(selectedUserId);
        updateWorkspaceInfo(workspaceData);
      } catch (workspaceError) {
        console.error('Failed to refresh workspace information:', workspaceError);
      }
    }

  } catch (error) {
    console.error('Error adding role:', error);
    Utils.showAlert(error.message || 'Failed to add role.');
  }
};

window.openAddUserRoleModal = async function(roleType) {
  if (!AppState.users.selectedUser) {
    Utils.showAlert('Please select a user.');
    return;
  }

  setRoleType(roleType);

  let modal = bootstrap.Modal.getInstance(DOM.addRoleMappingModal);
  if (!modal) {
    modal = new bootstrap.Modal(DOM.addRoleMappingModal);
  }
  modal.show();
};

window.removeUserRole = async function(roleId) {
  if (!AppState.users.selectedUser) {
    Utils.showAlert('Please select a user.');
    return;
  }

  if (confirm('Are you sure you want to remove this role?')) {
    try {
      await webconsolejs["common/api/services/users_api"].removeUserRole(
        AppState.users.selectedUser.id, 
        roleId
      );
      
      Utils.showAlert('Role removed successfully.');
      
      // 유저 상세 정보 새로고침
      const userDetails = await UserManager.loadUserDetails(AppState.users.selectedUser.id);
      if (userDetails) {
        UIManager.updateRoleLists(
          userDetails.platformRoles || [],
          userDetails.workspaceRoles || [],
          userDetails.cspRoles || []
        );
      }
      
    } catch (error) {
      console.error('Error removing role:', error);
    }
  }
};

// Workspace 제거 함수
window.removeUserWorkspace = async function(workspaceId) {
  if (!AppState.users.selectedUser) {
    Utils.showAlert('Please select a user.');
    return;
  }

  if (confirm('Are you sure you want to remove this workspace?')) {
    try {
      // TODO: Workspace 제거 API 호출 (API가 구현되면 추가)
      // await webconsolejs["common/api/services/users_api"].removeUserWorkspace(
      //   AppState.users.selectedUser.id, 
      //   workspaceId
      // );
      
      Utils.showAlert('Workspace removed successfully.');
      
      // Workspace 정보 새로고침
      const workspaceData = await webconsolejs["common/api/services/users_api"].getUserWorkspacesByUserID(AppState.users.selectedUser.id);
      updateWorkspaceInfo(workspaceData);
      
    } catch (error) {
      console.error('Error removing workspace:', error);
      Utils.showAlert('An error occurred while removing workspace.');
    }
  }
};

// 사용자 활성화/비활성화 토글
window.toggleUserStatus = async function() {
  const user = AppState.users.selectedUser;
  if (!user) {
    alert('Please select a user.');
    return;
  }

  const enabled = user.enabled !== undefined ? user.enabled :
                  user.Enabled !== undefined ? user.Enabled :
                  user.status === 'active' || user.Status === 'active';

  if (enabled) {
    alert('Disable is not yet supported.');
    return;
  }

  if (!confirm(`Enable user "${user.userName || user.username || user.id}"?`)) {
    return;
  }

  try {
    const response = await webconsolejs["common/api/services/users_api"].updateUserStatus(user.id, 'approved');
    if (response && (response.status === 204 || response.status === 200)) {
      alert('User enabled successfully.');
      await initUsers();
    } else {
      alert('Failed to enable user.');
    }
  } catch (error) {
    console.error('Error toggling user status:', error);
    alert('An error occurred: ' + error.message);
  }
};

// 선택된 유저들 삭제 (roles.js의 deleteRole과 동일한 패턴)
window.deleteUsers = async function() {
  
  if (checked_array.length === 0) {
    alert("Please select users to delete.");
    return;
  }

  if (confirm(`Are you sure you want to delete ${checked_array.length} selected users?`)) {
    try {
      // 선택된 모든 유저 삭제
      for (const user of checked_array) {
        await UserManager.deleteUser(user.id);
      }
      
      alert("Selected users deleted successfully.");
      
      // 유저 목록 새로고침
      await initUsers();
      
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('An error occurred while deleting users: ' + error.message);
    }
  }
};

// 클릭한 유저 정보 가져오기 (리스트 데이터에서 직접 추출)
async function getSelectedUserData(userID) {
  
  try {
    // 리스트에서 해당 유저 정보 찾기
    const user = AppState.users.list.find(u => u.id === userID);
    if (!user) {
      console.error("User not found in list");
      return;
    }
    // 선택된 유저 정보 설정
    setUserInfoData(user);
    
    // View Mode 활성화
    UIManager.showViewMode();
    UIManager.updateUserDetail(user);
    
    // 유저의 역할 정보 로드 (API 응답 구조에 맞게 필드명 조정)
    UIManager.updateRoleLists(
      user.platform_roles || [],
      user.workspace_roles || [],
      user.csp_roles || []
    );
    
    // Workspace 정보 로드 (getUserWorkspacesByUserID API 호출)
    try {
      const workspaceData = await webconsolejs["common/api/services/users_api"].getUserWorkspacesByUserID(userID);
      
      // Workspace 정보를 테이블에 업데이트
      updateWorkspaceInfo(workspaceData);
    } catch (workspaceError) {
      console.error("Failed to load workspace information:", workspaceError);
      // Workspace 정보 로드 실패 시 빈 배열로 설정
      updateWorkspaceInfo([]);
    }
    // 그룹 정보 로드
    try {
      await loadUserGroups(userID);
    } catch (groupError) {
      console.error("Failed to load group information:", groupError);
    }
  } catch (error) {
    console.error("Failed to load user information:", error);
  }
}

// 클릭한 유저의 info값 세팅 (roles.js의 setRoleInfoData와 동일한 패턴)
function setUserInfoData(userData) {
  try {
    // 선택된 유저를 AppState에 저장
    AppState.users.selectedUser = userData;
  } catch (e) {
    console.error(e);
  }
}

// Workspace 정보를 테이블에 업데이트하는 함수
function updateWorkspaceInfo(workspaceData) {
  const namesElement = document.getElementById('workspace-roles-names');
  const descriptionsElement = document.getElementById('workspace-roles-descriptions');
  const actionsElement = document.getElementById('workspace-roles-actions');
  
  if (!namesElement || !descriptionsElement || !actionsElement) {
    console.error("Workspace role elements not found");
    return;
  }
  
  if (!workspaceData || workspaceData.length === 0) {
    // Workspace 정보가 없을 때
    namesElement.innerHTML = '<span class="text-muted">-</span>';
    descriptionsElement.innerHTML = '<span class="text-muted">-</span>';
    actionsElement.innerHTML = `
      <div class="btn-list justify-content-center">
        <button class="btn btn-outline-primary btn-sm" onclick="openAddUserRoleModal('workspace')" title="Add Workspace role">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M12 5l0 14"></path>
            <path d="M5 12l14 0"></path>
          </svg>
        </button>
      </div>
    `;
  } else {
    // Workspace 정보가 있을 때
    // API 응답 구조에 따라 필드명 조정 (예상: name, description, id 등)
    namesElement.innerHTML = workspaceData.map(workspace => 
      `<span class="role-name">${workspace.name || workspace.workspaceName || workspace.id || 'Unknown'}</span>`
    ).join('<br>');
    
    descriptionsElement.innerHTML = workspaceData.map(workspace => 
      `<span class="role-description">${workspace.description || workspace.workspaceDescription || 'No description'}</span>`
    ).join('<br>');
    
    // Actions 컬럼 (삭제 버튼들 + 추가 버튼)
    const removeButtons = workspaceData.map(workspace => `
      <button class="btn btn-outline-danger btn-sm" onclick="removeUserWorkspace('${workspace.id || workspace.workspaceId}')" title="Remove workspace">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M4 7l16 0"></path>
          <path d="M10 11l0 6"></path>
          <path d="M14 11l0 6"></path>
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
        </svg>
      </button>
    `).join('');
    
    actionsElement.innerHTML = `
      <div class="btn-list justify-content-center">
        ${removeButtons}
        <button class="btn btn-outline-primary btn-sm" onclick="openAddUserRoleModal('workspace')" title="Add Workspace role">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M12 5l0 14"></path>
            <path d="M5 12l14 0"></path>
          </svg>
        </button>
      </div>
    `;
  }
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 역할 타입 변경 이벤트
  if (DOM.roleMappingType) {
    DOM.roleMappingType.addEventListener('change', function() {
      ModalManager.loadRolesByType(this.value);
    });
  }
}

// 초기화 함수
async function initUsers() {
  try {
    // 0. 뷰 상태 초기화 (패널/선택 상태 리셋)
    UIManager.hideViewMode();
    AppState.users.selectedUser = null;

    // 1. 테이블 초기화
    await TableManager.initUsersTable();

    // 2. 유저 목록 가져오기
    const userList = await UserManager.loadUsers();

    // 3. 테이블에 데이터 설정
    if (userList && userList.length > 0) {
      AppState.users.list = userList;
      TableManager.setTableData(AppState.tables.usersTable, userList);
    } else {
      // 데이터가 없는 경우 빈 배열로 설정
      AppState.users.list = [];
      TableManager.setTableData(AppState.tables.usersTable, []);
    }

    // 4. 이벤트 리스너 설정
    setupEventListeners();

  } catch (error) {
    console.error("Error in initUsers:", error);
  }
}

// MCI 패턴과 동일하게 webconsolejs 등록 없이 전역 함수만 사용

// 전역 함수: 사용자 생성 (모달용)
async function createUser() {
  try {
    const userData = UserManager.collectFormData();
    const errors = UserManager.validateUserData(userData);
    
    if (errors.length > 0) {
      alert('Validation errors: ' + errors.join(', '));
      return;
    }
    
    const response = await UserManager.createUser(userData);
    
    if (response.status === 200 || response.status === 201) {
      alert('User created successfully');
      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('add-user-modal'));
      if (modal) {
        modal.hide();
      }
      // 사용자 목록 새로고침
      await initUsers();
    } else {
      alert('Failed to create user: ' + (response.data?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error creating user:', error);
    alert('Error creating user: ' + error.message);
  }
}

// 전역 함수: 사용자 배포 (폼용)
async function deployUser() {
  try {
    const userData = UserManager.collectFormData();
    const errors = UserManager.validateUserData(userData);
    
    if (errors.length > 0) {
      alert('Validation errors: ' + errors.join(', '));
      return;
    }
    
    const response = await UserManager.createUser(userData);
    
    if (response.status === 200 || response.status === 201) {
      alert('User created successfully');
      // 사용자 목록으로 돌아가기
      goBackToUserList();
      // 사용자 목록 새로고침
      await initUsers();
    } else {
      alert('Failed to create user: ' + (response.data?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error creating user:', error);
    alert('Error creating user: ' + error.message);
  }
}

// 전역 함수: 사용자 목록으로 돌아가기
function goBackToUserList() {
  // usercreate 섹션 숨기기
  const createSection = document.getElementById('usercreate');
  if (createSection) {
    createSection.style.display = 'none';
  }
  
  // index 섹션 보이기
  const indexSection = document.getElementById('index');
  if (indexSection) {
    indexSection.style.display = 'block';
  }
}

// 비밀번호 재설정 모달 열기
window.openResetPasswordModal = function() {
  if (!AppState.users.selectedUser) {
    alert('Please select a user.');
    return;
  }
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('reset-password-modal'));
  modal.show();
};

// 비밀번호 재설정 실행
window.resetUserPassword = async function() {
  if (!AppState.users.selectedUser) {
    alert('Please select a user.');
    return;
  }

  const newPassword = document.getElementById('reset-password-new').value;
  const confirmPassword = document.getElementById('reset-password-confirm').value;

  if (!newPassword || newPassword.trim() === '') {
    alert('Please enter a new password.');
    return;
  }

  if (newPassword.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  try {
    const response = await webconsolejs["common/api/services/users_api"].resetUserPassword(
      AppState.users.selectedUser.id,
      newPassword
    );

    if (response && (response.status === 200 || response.status === 204 || response.data?.success)) {
      alert('Password reset successfully.');
      const modal = bootstrap.Modal.getInstance(document.getElementById('reset-password-modal'));
      if (modal) modal.hide();
      document.getElementById('reset-password-form').reset();
    } else {
      alert('Failed to reset password: ' + (response?.data?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    alert('Error resetting password: ' + error.message);
  }
};

// DOMContentLoaded 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", async function () {
  
  try {
    // 페이지 헤더에 Add User 버튼 추가 (MCI 패턴과 동일하게)
    if (typeof webconsolejs !== 'undefined' && webconsolejs['partials/layout/navigatePages']) {
      webconsolejs['partials/layout/navigatePages'].addPageHeaderButton(
        "usercreate", // targetSection - usercreate 섹션으로 이동
        "Add User" // createBtnName
      );
    }
    
    await initUsers();
  } catch (error) {
    console.error("Error occurred during initialization:", error);
  }
});

// ===== 그룹(Organization) 관련 함수 =====

// 사용자의 소속 그룹 목록 로드 및 렌더링
async function loadUserGroups(userId) {
    try {
        const groups = await webconsolejs["common/api/services/groups_api"].getUserGroups(userId);
        renderUserGroupsList(groups || []);
    } catch (error) {
        console.error("Error loading user groups:", error);
        renderUserGroupsList([]);
    }
}

// 사용자 그룹 목록 렌더링
function renderUserGroupsList(groups) {
    const container = document.getElementById('user-groups-list');
    if (!container) return;

    if (!groups || groups.length === 0) {
        container.innerHTML = '<p class="text-muted">No groups assigned.</p>';
        return;
    }

    container.innerHTML = `
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Path</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${groups.map(g => `
                    <tr>
                        <td>${g.name || '-'}</td>
                        <td><code>${g.organization_code || '-'}</code></td>
                        <td class="text-muted small">${g.path || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" onclick="removeUserGroupById(${g.id})">
                                Remove
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// 사용자에게 그룹 할당
window.addUserGroup = async function() {
    if (!AppState.users.selectedUser) {
        alert("Please select a user first.");
        return;
    }

    // 전체 그룹 목록 로드
    let allGroups = [];
    try {
        allGroups = await webconsolejs["common/api/services/groups_api"].getGroupList() || [];
    } catch (error) {
        console.error("Error loading group list:", error);
    }

    // 그룹 선택 모달 채우기
    const select = document.getElementById('assign-group-select');
    if (select) {
        select.innerHTML = '<option value="">Select a group</option>';
        allGroups.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.name + (g.organization_code ? ` (${g.organization_code})` : '');
            select.appendChild(opt);
        });
    }

    const modal = new bootstrap.Modal(document.getElementById('assign-group-modal'));
    modal.show();
};

// 그룹 할당 제출
window.submitAssignGroup = async function() {
    if (!AppState.users.selectedUser) return;

    const select = document.getElementById('assign-group-select');
    if (!select || !select.value) {
        alert("Please select a group.");
        return;
    }

    const orgId = parseInt(select.value);
    try {
        await webconsolejs["common/api/services/groups_api"].assignUserGroups(
            AppState.users.selectedUser.id,
            [orgId]
        );

        const modal = bootstrap.Modal.getInstance(document.getElementById('assign-group-modal'));
        if (modal) modal.hide();

        alert("Group assigned successfully.");
        await loadUserGroups(AppState.users.selectedUser.id);
    } catch (error) {
        console.error("Error assigning group:", error);
        alert("Failed to assign group: " + (error.message || "Unknown error"));
    }
};

// 사용자에서 그룹 제거
window.removeUserGroupById = async function(orgId) {
    if (!AppState.users.selectedUser) return;

    if (!confirm("Are you sure you want to remove this group assignment?")) return;

    try {
        await webconsolejs["common/api/services/groups_api"].removeUserGroup(
            AppState.users.selectedUser.id,
            orgId
        );
        alert("Group removed successfully.");
        await loadUserGroups(AppState.users.selectedUser.id);
    } catch (error) {
        console.error("Error removing group:", error);
        // BUG-E6: 없는 매핑 삭제 → 400, 이미 제거된 것으로 처리
        if (error.response && error.response.status === 400) {
            await loadUserGroups(AppState.users.selectedUser.id);
        } else {
            alert("Failed to remove group: " + (error.message || "Unknown error"));
        }
    }
};
