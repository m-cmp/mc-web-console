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
    console.log(`${type.toUpperCase()}: ${message}`);
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
      console.log("Calling getUserList API...");
      const userList = await webconsolejs["common/api/services/users_api"].getUserList();
      console.log("API response:", userList);
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

  // 유저 생성
  async createUser(userData) {
    try {
      const response = await webconsolejs["common/api/services/users_api"].createUser(userData);
      console.log("User created:", response);
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
      console.log("User updated:", response);
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
      console.log("User deleted:", response);
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
      console.log("User role added:", response);
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
      console.log('Removing role:', roleId);
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
  
  // 개별 역할 row 업데이트
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
          <button class="btn btn-outline-primary btn-sm" onclick="addUserRole('${roleType}')" title="Add ${roleType} role">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M12 5l0 14"></path>
              <path d="M5 12l14 0"></path>
            </svg>
          </button>
        </div>
      `;
    } else {
      // 역할이 있을 때
      namesElement.innerHTML = roles.map(role => `<span class="role-name">${role.name}</span>`).join('<br>');
      descriptionsElement.innerHTML = roles.map(role => `<span class="role-description">${role.description || 'No description'}</span>`).join('<br>');
      
      // Actions 컬럼 (삭제 버튼들 + 추가 버튼)
      const removeButtons = roles.map(role => `
        <button class="btn btn-outline-danger btn-sm" onclick="removeUserRole('${role.id}')" title="Remove role">
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
          <button class="btn btn-outline-primary btn-sm" onclick="addUserRole('${roleType}')" title="Add ${roleType} role">
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
      console.log("Users 테이블 초기화 시작");

      // 테이블이 이미 존재하는 경우 제거
      if (AppState.tables.usersTable) {
        AppState.tables.usersTable.destroy();
      }

      // 테이블 요소 확인
      const tableElement = DOM.usersTable;
      if (!tableElement) {
        console.error("users-table 요소를 찾을 수 없습니다.");
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
          console.log("테이블 초기화 완료");
          resolve();
        });

        // 행 클릭 이벤트 추가 (체크박스 선택과 함께 동작)
        table.on("rowClick", function (e, row) {
          console.log("row clicked", row);
          var userID = row.getCell("id").getValue();
          console.log("userID", userID);
          
          // 행 클릭 시 체크박스도 함께 선택/해제
          row.toggleSelect();
          
          // 선택된 행의 정보 표시
          getSelectedUserData(userID);
        });

        // 행 선택 변경 이벤트 추가 (roles.js와 동일한 패턴)
        table.on("rowSelectionChanged", function (data, rows) {
          checked_array = data;
          console.log("checked_array", checked_array);
          console.log("rows", data);
        });

      } catch (error) {
        console.error("테이블 초기화 중 오류 발생:", error);
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
      console.log("Loading roles for type:", roleType);
      console.log("roles_api object:", webconsolejs["common/api/services/roles_api"]);
      
      let roles = [];
      if (webconsolejs["common/api/services/roles_api"]) {
        switch (roleType) {
          case 'platform':
            roles = await webconsolejs["common/api/services/roles_api"].getRoleList();
            break;
          case 'workspace':
            roles = await webconsolejs["common/api/services/roles_api"].getRoleList();
            break;
          case 'csp':
            roles = await webconsolejs["common/api/services/roles_api"].getRoleList();
            break;
        }
      } else {
        console.error("roles_api service not found");
      }
      
      console.log("Loaded roles:", roles);
      this.populateRoleSelect(roles);
    } catch (error) {
      console.error("역할 목록 로드 실패:", error);
    }
  },

  // 역할 선택 드롭다운 채우기
  populateRoleSelect(roles) {
    if (!DOM.roleMappingRole) return;
    
    DOM.roleMappingRole.innerHTML = '<option value="">Select role</option>';
    roles.forEach(role => {
      const option = document.createElement('option');
      option.value = role.id;
      option.textContent = role.name;
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
  console.log("addNewUser called");
  // MCI 패턴과 동일하게 단순히 초기화만 수행
  // 실제 폼 초기화는 DOMContentLoaded에서 처리
};

window.goBackToUserList = function() {
  console.log("goBackToUserList called");
  window.location.hash = "#index";
};

window.deployUser = async function() {
  console.log("deployUser called");
  
  const formData = {
    firstName: document.getElementById('create-user-firstname').value,
    lastName: document.getElementById('create-user-lastname').value,
    email: document.getElementById('create-user-email').value,
    password: document.getElementById('create-user-password').value,
    enabled: document.getElementById('create-user-enabled').checked
  };

  // 필수 필드 검증
  if (!formData.firstName || !formData.lastName || !formData.email) {
    alert('Please fill in all required fields (First Name, Last Name, Email)');
    return;
  }

  try {
    await UserManager.createUser(formData);
    
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
    password: document.getElementById('add-user-password').value,
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
    console.error('유저 생성 중 오류:', error);
  }
};

window.addUserRole = async function() {
  if (!AppState.users.selectedUser) {
    Utils.showAlert('유저를 선택해주세요.');
    return;
  }

  const roleType = DOM.roleMappingType.value;
  const roleId = DOM.roleMappingRole.value;

  if (!roleType || !roleId) {
    Utils.showAlert('역할 타입과 역할을 선택해주세요.');
    return;
  }

  try {
    await UserManager.addUserRole(AppState.users.selectedUser.id, {
      roleType: roleType,
      roleId: roleId
    });
    
    // 모달 닫기
    const modal = bootstrap.Modal.getInstance(DOM.addRoleMappingModal);
    if (modal) modal.hide();
    
    // 폼 초기화
    document.getElementById('add-role-mapping-form').reset();
    
    // 유저 상세 정보 새로고침
    if (AppState.users.selectedUser) {
      const userDetails = await UserManager.loadUserDetails(AppState.users.selectedUser.id);
      if (userDetails) {
        UIManager.updateRoleLists(
          userDetails.platformRoles || [],
          userDetails.workspaceRoles || [],
          userDetails.cspRoles || []
        );
      }
    }
    
  } catch (error) {
    console.error('역할 추가 중 오류:', error);
  }
};

window.addUserRole = async function(roleType) {
  if (!AppState.users.selectedUser) {
    Utils.showAlert('유저를 선택해주세요.');
    return;
  }

  // 역할 타입 설정
  setRoleType(roleType);
  
  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('add-role-mapping-modal'));
  modal.show();
};

window.removeUserRole = async function(roleId) {
  if (!AppState.users.selectedUser) {
    Utils.showAlert('유저를 선택해주세요.');
    return;
  }

  if (confirm('이 역할을 제거하시겠습니까?')) {
    try {
      await webconsolejs["common/api/services/users_api"].removeUserRole(
        AppState.users.selectedUser.id, 
        roleId
      );
      
      Utils.showAlert('역할이 성공적으로 제거되었습니다.');
      
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
      console.error('역할 제거 중 오류:', error);
    }
  }
};

// 선택된 유저들 삭제 (roles.js의 deleteRole과 동일한 패턴)
window.deleteUsers = async function() {
  console.log("deleteUsers", checked_array);
  
  if (checked_array.length === 0) {
    alert("삭제할 유저를 선택해주세요.");
    return;
  }

  if (confirm(`선택된 ${checked_array.length}명의 유저를 삭제하시겠습니까?`)) {
    try {
      // 선택된 모든 유저 삭제
      for (const user of checked_array) {
        await UserManager.deleteUser(user.id);
      }
      
      alert("선택된 유저들이 성공적으로 삭제되었습니다.");
      
      // 유저 목록 새로고침
      await initUsers();
      
    } catch (error) {
      console.error('유저 삭제 중 오류:', error);
      alert('유저 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  }
};

// 클릭한 유저 정보 가져오기 (리스트 데이터에서 직접 추출)
async function getSelectedUserData(userID) {
  console.log("getSelectedUserData called with userID:", userID);
  
  try {
    // 리스트에서 해당 유저 정보 찾기
    const user = AppState.users.list.find(u => u.id === userID);
    if (!user) {
      console.error("User not found in list");
      return;
    }
    
    console.log("Selected user details:", user);
    
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
  } catch (error) {
    console.error("유저 정보 로드 실패:", error);
  }
}

// 클릭한 유저의 info값 세팅 (roles.js의 setRoleInfoData와 동일한 패턴)
function setUserInfoData(userData) {
  console.log("setUserInfoData", userData);
  try {
    // 선택된 유저를 AppState에 저장
    AppState.users.selectedUser = userData;
    
    console.log("Selected user set:", userData);
  } catch (e) {
    console.error(e);
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
    // 1. 테이블 초기화
    await TableManager.initUsersTable();

    // 2. 유저 목록 가져오기
    const userList = await UserManager.loadUsers();
    console.log("Loaded user list:", userList);

    // 3. 테이블에 데이터 설정
    if (userList && userList.length > 0) {
      AppState.users.list = userList;
      TableManager.setTableData(AppState.tables.usersTable, userList);
    } else {
      // 데이터가 없는 경우 빈 배열로 설정
      AppState.users.list = [];
      TableManager.setTableData(AppState.tables.usersTable, []);
      console.log("No users found or empty response");
    }

    // 4. 이벤트 리스너 설정
    setupEventListeners();

  } catch (error) {
    console.error("Error in initUsers:", error);
  }
}

// MCI 패턴과 동일하게 webconsolejs 등록 없이 전역 함수만 사용

// DOMContentLoaded 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Users DOM 로드됨");
  
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
    console.error("초기화 중 오류 발생:", error);
  }
});
