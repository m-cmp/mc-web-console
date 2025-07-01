import { TabulatorFull as Tabulator } from "tabulator-tables";
import 'jstree';

// DOM 요소 캐싱 (최적화)
const DOM = {
  viewModeCards: document.getElementById("view-mode-cards"),
  createModeCards: document.getElementById("create-mode-cards"),
  editModeCards: document.getElementById("edit-mode-cards"),
  platformMenuBody: document.getElementById("platform-menu-body"),
  workspaceMenuBody: document.getElementById("workspace-menu-body"),
  cspRoleMappingBody: document.getElementById("csp-role-mapping-body"),
  roleDetailRolename: document.getElementById('role-detail-rolename'),
  roleDetailRolenameText: document.getElementById('role-detail-rolename-text'),
  roleDetailNameView: document.getElementById('role-detail-name-view'),
  roleDetailDescView: document.getElementById('role-detail-desc-view'),
  roleDetailTypesView: document.getElementById('role-detail-types-view'),
  workspaceStatusView: document.getElementById('workspace-status-view'),
  platformMenuStatus: document.getElementById('platform-menu-status'),
  saveCreateRoleBtn: document.getElementById('save-create-role-btn'),
  cancelCreateRoleBtn: document.getElementById('cancel-create-role-btn'),
  addButton: document.querySelector('a[href="#create_role"]'),
  editButton: document.querySelector('a[href="#edit_role"]'),
  rolesTable: document.getElementById('roles-table'),
  cspRoleMappingTable: document.getElementById('csp-role-mapping-table'),
  cspRoleMappingEmpty: document.getElementById('csp-role-mapping-empty'),
  platformMenuCreateTree: document.getElementById('platform-menu-create-tree'),
  platformMenuTree: document.getElementById('platform-menu-tree'),
  roleNameInput: document.getElementById('role-name-input'),
  roleDescriptionInput: document.getElementById('role-description-input'),
  cspProviderSelect: document.getElementById('csp-provider-select'),
  cspProtocolSelect: document.getElementById('csp-protocol-select'),
  // View-mode 토글 버튼들
  platformToggleContainer: document.getElementById('platform-toggle-container'),
  platformToggleView: document.getElementById('platform-toggle-view'),
  workspaceToggleContainer: document.getElementById('workspace-toggle-container'),
  workspaceToggleHeader: document.getElementById('workspace-toggle-header'),
  cspToggleContainer: document.getElementById('csp-toggle-container'),
  cspToggleView: document.getElementById('csp-toggle-view'),
  // Workspace 카드 내부의 토글들
  workspaceToggleViewInner: document.getElementById('workspace-toggle-view'),
  workspaceToggleCreateInner: document.getElementById('workspace-toggle-create-inner'),
  // Create-mode 토글 버튼들
  platformToggleContainerCreate: document.getElementById('platform-toggle-container-create'),
  platformToggleCreate: document.getElementById('platform-toggle-create'),
  workspaceToggleContainerCreate: document.getElementById('workspace-toggle-container-create'),
  workspaceToggleCreate: document.getElementById('workspace-toggle-create'),
  cspToggleContainerCreate: document.getElementById('csp-toggle-container-create'),
  cspToggleCreate: document.getElementById('csp-toggle-create'),
  // Create-mode 카드 바디들
  platformMenuCreateBody: document.getElementById('platform-menu-create-body'),
  workspaceMenuCreateBody: document.getElementById('workspace-menu-create-body'),
  cspRoleMappingCreateBody: document.getElementById('csp-role-mapping-create-body'),
  // Edit-mode 요소들
  editRoleNameDisplay: document.getElementById('edit-role-name-display'),
  editRoleNameText: document.getElementById('edit-role-name-text'),
  editRoleNameInput: document.getElementById('edit-role-name-input'),
  editRoleDescriptionInput: document.getElementById('edit-role-description-input'),
  // Edit-mode 토글 버튼들
  platformToggleContainerEdit: document.getElementById('platform-toggle-container-edit'),
  platformToggleEdit: document.getElementById('platform-toggle-edit'),
  workspaceToggleContainerEdit: document.getElementById('workspace-toggle-container-edit'),
  workspaceToggleEdit: document.getElementById('workspace-toggle-edit'),
  workspaceToggleEditInner: document.getElementById('workspace-toggle-edit-inner'),
  cspToggleContainerEdit: document.getElementById('csp-toggle-container-edit'),
  cspToggleEdit: document.getElementById('csp-toggle-edit'),
  // Edit-mode 카드 바디들
  platformMenuEditBody: document.getElementById('platform-menu-edit-body'),
  workspaceMenuEditBody: document.getElementById('workspace-menu-edit-body'),
  cspRoleMappingEditBody: document.getElementById('csp-role-mapping-edit-body'),
  // Edit-mode CSP 관련
  cspRoleMappingEditTable: document.getElementById('csp-role-mapping-edit-table'),
  cspRoleMappingEditEmpty: document.getElementById('csp-role-mapping-edit-empty'),
  editCspProviderSelect: document.getElementById('edit-csp-provider-select'),
  editCspProtocolSelect: document.getElementById('edit-csp-protocol-select'),
  addCspMappingBtn: document.getElementById('add-csp-mapping-btn'),
  // Edit-mode 버튼들
  saveEditRoleBtn: document.getElementById('save-edit-role-btn'),
  cancelEditRoleBtn: document.getElementById('cancel-edit-role-btn')
};

// 중앙화된 상태 관리 객체
const AppState = {
  // 역할 관련 상태
  roles: {
    list: [],
    selectedRole: null,
    isLoading: false,
    error: null
  },
  
  // UI 상태
  ui: {
    createMode: false,
    viewMode: false,
    editMode: false,
    selectedRows: [],
    loadingStates: {
      roles: false,
      permissions: false,
      cspMapping: false
    },
    // 카드 토글 상태 관리
    cardStates: {
      platform: { visible: false, expanded: false },
      workspace: { visible: false, expanded: false },
      csp: { visible: false, expanded: false }
    },
    // Create-mode 카드 토글 상태 관리
    createCardStates: {
      platform: { expanded: false },
      workspace: { expanded: false },
      csp: { expanded: false }
    },
    // Edit-mode 카드 토글 상태 관리
    editCardStates: {
      platform: { expanded: false },
      workspace: { expanded: false },
      csp: { expanded: false }
    }
  },
  
  // 편집 중인 역할 정보
  editingRole: {
    originalRole: null,
    modifiedRole: null,
    hasChanges: false
  },
  
  // 폼 상태
  form: {
    roleName: '',
    roleDescription: '',
    platformPermissions: [],
    workspaceAccess: false,
    cspMapping: {
      provider: '',
      protocol: ''
    }
  },
  
  // 테이블 인스턴스들
  tables: {
    rolesTable: null,
    platformMenuTable: null,
    cspRoleMappingTable: null
  }
};

// 상수 정의
const CONSTANTS = {
  PAGINATION_SIZE: 7,
  PAGINATION_SIZES: [7, 14, 21],
  TABLE_HEIGHT: '350px',
  CSP_TABLE_HEIGHT: '300px',
  TREE_MAX_HEIGHT: '300px',
  ANIMATION_DURATION: 200,
  API_ENDPOINTS: {
    ROLES: '/api/roles',
    MENUS: '/api/menus',
    CSP_ROLES: '/api/csp-roles'
  },
  ROLE_TYPES: {
    PLATFORM: 'platform',
    WORKSPACE: 'workspace',
    CSP: 'csp'
  },
  CSP_PROVIDERS: {
    AWS: 'aws',
    GCP: 'gcp',
    AZURE: 'azure'
  },
  PROTOCOLS: {
    OIDC: 'oidc'
  }
};

// 설정 객체
const CONFIG = {
  TABLE: {
    HEIGHT: CONSTANTS.TABLE_HEIGHT,
    PAGINATION_SIZE: CONSTANTS.PAGINATION_SIZE,
    PAGINATION_SIZES: CONSTANTS.PAGINATION_SIZES,
    LAYOUT: 'fitColumns',
    REACTIVE_DATA: true
  },
  TREE: {
    MAX_HEIGHT: CONSTANTS.TREE_MAX_HEIGHT,
    ANIMATION_DURATION: CONSTANTS.ANIMATION_DURATION,
    THEMES: {
      RESPONSIVE: true
    }
  },
  UI: {
    CARD_SHADOW: '0 1px 3px rgba(0, 0, 0, 0.1)',
    CARD_HEADER_BG: '#f8f9fa'
  }
};

// 유틸리티 함수들
const Utils = {
  // 알림 표시
  showAlert(message, type = 'info') {
    alert(message);
  },

  // 폼 검증
  validateRoleForm(roleName, roleDescription) {
    const errors = [];
    
    if (!roleName || !roleName.trim()) {
      errors.push('Role Name은 필수 입력 항목입니다.');
    } else if (roleName.trim().length < 2) {
      errors.push('Role Name은 2자 이상이어야 합니다.');
    } else if (roleName.trim().length > 50) {
      errors.push('Role Name은 50자 이하여야 합니다.');
    }
    
    return errors;
  },

  // 데이터 포맷팅
  formatRoleData(rawData) {
    return {
      id: rawData.id,
      name: rawData.name || '',
      description: rawData.description || '',
      role_subs: rawData.role_subs || []
    };
  },

  // 역할 타입 확인
  hasRoleType(roleSubs, roleType) {
    return roleSubs && roleSubs.some(sub => sub.role_type === roleType);
  },

  // DOM 요소 존재 확인
  elementExists(elementId) {
    return document.getElementById(elementId) !== null;
  },

  // 배열 안전 접근
  safeArrayAccess(array, index, defaultValue = null) {
    return array && Array.isArray(array) && array[index] !== undefined 
      ? array[index] 
      : defaultValue;
  }
};

// 에러 처리 통합
const ErrorHandler = {
  handle(error, context) {
    console.error(`Error in ${context}:`, error);
    Utils.showAlert(`오류가 발생했습니다: ${context}`);
  },

  async wrapAsync(fn, context) {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      throw error;
    }
  }
};

// 역할 관리 모듈
const RoleManager = {
  // 역할 목록 로드
  async loadRoles() {
    return await ErrorHandler.wrapAsync(
      async () => {
        const roleList = await webconsolejs["common/api/services/roles_api"].getRoleList();
        return roleList || [];
      },
      '역할 목록 로드'
    );
  },

  // 역할 저장
  async saveRole(roleData) {
    return await ErrorHandler.wrapAsync(
      async () => {
        const response = await webconsolejs["common/api/services/roles_api"].createRole(roleData);
        if (response) {
          Utils.showAlert('역할이 성공적으로 생성되었습니다.');
          return response;
        } else {
          throw new Error('역할 생성에 실패했습니다.');
        }
      },
      '역할 생성'
    );
  },

  // 역할 수정
  async updateRole(roleId, roleData) {
    return await ErrorHandler.wrapAsync(
      async () => {
        const response = await webconsolejs["common/api/services/roles_api"].updateRole(roleId, roleData);
        if (response) {
          Utils.showAlert('역할이 성공적으로 수정되었습니다.');
          return response;
        } else {
          throw new Error('역할 수정에 실패했습니다.');
        }
      },
      '역할 수정'
    );
  },

  // 역할 삭제 (향후 확장용)
  async deleteRole(roleId) {
    return await ErrorHandler.wrapAsync(
      async () => {
        const response = await webconsolejs["common/api/services/roles_api"].deleteRole(roleId);
        if (response) {
          Utils.showAlert('역할이 성공적으로 삭제되었습니다.');
          return response;
        } else {
          throw new Error('역할 삭제에 실패했습니다.');
        }
      },
      '역할 삭제'
    );
  },

  // 역할 데이터 검증
  validateRoleData(roleData) {
    const errors = Utils.validateRoleForm(roleData.name, roleData.description);
    
    // CSP 선택 검증
    if (roleData.cspMapping && roleData.cspMapping.provider && !roleData.cspMapping.protocol) {
      errors.push('CSP Provider를 선택했다면 Protocol도 선택해야 합니다.');
    }
    
    return errors;
  },

  // 역할 타입 결정
  determineRoleTypes(platformPermissions, workspaceEnabled, cspSelection) {
    const roleTypes = [];
    if (platformPermissions && platformPermissions.length > 0) {
      roleTypes.push(CONSTANTS.ROLE_TYPES.PLATFORM);
    }
    if (workspaceEnabled) {
      roleTypes.push(CONSTANTS.ROLE_TYPES.WORKSPACE);
    }
    if (cspSelection && cspSelection.cspProvider && cspSelection.cspProtocol) {
      roleTypes.push(CONSTANTS.ROLE_TYPES.CSP);
    }
    return roleTypes;
  }
};

// UI 관리 모듈
const UIManager = {
  // 생성 모드 표시
  showCreateMode() {
    if (DOM.createModeCards) {
      DOM.createModeCards.classList.add('show');
    }
    if (DOM.viewModeCards) {
      DOM.viewModeCards.classList.remove('show');
    }
    AppState.ui.createMode = true;
    AppState.ui.viewMode = false;
  },

  // 보기 모드 표시
  showViewMode() {
    if (DOM.viewModeCards) {
      DOM.viewModeCards.classList.add('show');
    }
    if (DOM.createModeCards) {
      DOM.createModeCards.classList.remove('show');
    }
    AppState.ui.viewMode = true;
    AppState.ui.createMode = false;
  },

  // 모드 숨기기
  hideAllModes() {
    if (DOM.viewModeCards) {
      DOM.viewModeCards.classList.remove('show');
    }
    if (DOM.createModeCards) {
      DOM.createModeCards.classList.remove('show');
    }
    if (DOM.editModeCards) {
      DOM.editModeCards.classList.remove('show');
    }
    // Platform 상태 텍스트 숨기기
    if (DOM.platformMenuStatus) {
      DOM.platformMenuStatus.style.display = 'none';
    }
    // 직접 상태 업데이트 (무한 루프 방지)
    AppState.ui.viewMode = false;
    AppState.ui.createMode = false;
    AppState.ui.editMode = false;
  },

  // 편집 모드 표시
  showEditMode() {
    if (DOM.editModeCards) {
      DOM.editModeCards.classList.add('show');
    }
    if (DOM.viewModeCards) {
      DOM.viewModeCards.classList.remove('show');
    }
    if (DOM.createModeCards) {
      DOM.createModeCards.classList.remove('show');
    }
    AppState.ui.editMode = true;
    AppState.ui.viewMode = false;
    AppState.ui.createMode = false;
  },

  // Edit-mode 카드 토글 상태 초기화
  initializeEditCardStates() {
    AppState.ui.editCardStates = {
      platform: { expanded: false },
      workspace: { expanded: false },
      csp: { expanded: false }
    };
    this.resetAllEditToggles();
  },

  // Edit-mode 카드 펼침/접힘 처리
  toggleEditCard(cardType, expand) {
    const cardState = AppState.ui.editCardStates[cardType];
    if (!cardState) return;

    cardState.expanded = expand;
    
    let cardBody, toggleElement;
    
    switch (cardType) {
      case 'platform':
        cardBody = DOM.platformMenuEditBody;
        toggleElement = DOM.platformToggleEdit;
        break;
      case 'workspace':
        cardBody = DOM.workspaceMenuEditBody;
        toggleElement = DOM.workspaceToggleEdit;
        break;
      case 'csp':
        cardBody = DOM.cspRoleMappingEditBody;
        toggleElement = DOM.cspToggleEdit;
        break;
      default:
        return;
    }
    
    if (cardBody) {
      if (expand) {
        cardBody.classList.remove('collapse');
        cardBody.classList.add('show');
      } else {
        cardBody.classList.add('collapse');
        cardBody.classList.remove('show');
      }
    }
    
    if (toggleElement) {
      toggleElement.checked = expand;
    }
  },

  // 모든 Edit-mode 카드 접기
  collapseAllEditCards() {
    this.toggleEditCard('platform', false);
    this.toggleEditCard('workspace', false);
    this.toggleEditCard('csp', false);
  },

  // 모든 Edit-mode 토글 버튼을 OFF로 초기화
  resetAllEditToggles() {
    if (DOM.platformToggleEdit) {
      DOM.platformToggleEdit.checked = false;
    }
    if (DOM.workspaceToggleEdit) {
      DOM.workspaceToggleEdit.checked = false;
    }
    if (DOM.cspToggleEdit) {
      DOM.cspToggleEdit.checked = false;
    }
  },

  // Edit 폼 초기화
  clearEditForm() {
    if (DOM.editRoleNameInput) {
      DOM.editRoleNameInput.value = '';
    }
    if (DOM.editRoleDescriptionInput) {
      DOM.editRoleDescriptionInput.value = '';
    }
    
    // Platform 트리 초기화
    const tree = $('#platform-menu-edit-tree').jstree(true);
    if (tree) {
      tree.uncheck_all();
    }
    
    // Workspace 토글 초기화
    if (DOM.workspaceToggleEditInner) {
      DOM.workspaceToggleEditInner.checked = false;
    }
    
    // CSP 선택 초기화
    this.clearEditCspSelection();
    
    // Edit-mode 카드 상태 초기화
    this.initializeEditCardStates();
    this.collapseAllEditCards();
  },

  // Edit CSP 선택 초기화
  clearEditCspSelection() {
    if (DOM.editCspProviderSelect) {
      DOM.editCspProviderSelect.value = '';
    }
    if (DOM.editCspProtocolSelect) {
      DOM.editCspProtocolSelect.value = '';
    }
  },

  // 카드 토글 상태 초기화
  initializeCardStates() {
    AppState.ui.cardStates = {
      platform: { visible: false, expanded: false },
      workspace: { visible: false, expanded: false },
      csp: { visible: false, expanded: false }
    };
    // 토글 버튼도 초기화
    this.resetAllToggles();
  },

  // 카드 토글 버튼 표시/숨김 설정
  setCardToggleVisibility(platformVisible, workspaceVisible, cspVisible) {
    // Platform 토글
    if (DOM.platformToggleContainer) {
      DOM.platformToggleContainer.style.display = platformVisible ? 'block' : 'none';
    }
    
    // Workspace 토글
    if (DOM.workspaceToggleContainer) {
      DOM.workspaceToggleContainer.style.display = workspaceVisible ? 'block' : 'none';
    }
    
    // CSP 토글
    if (DOM.cspToggleContainer) {
      DOM.cspToggleContainer.style.display = cspVisible ? 'block' : 'none';
    }
  },

  // 카드 펼침/접힘 처리
  toggleCard(cardType, expand) {
    const cardState = AppState.ui.cardStates[cardType];
    if (!cardState) return;

    cardState.expanded = expand;
    
    let cardBody, toggleElement;
    
    switch (cardType) {
      case 'platform':
        cardBody = DOM.platformMenuBody;
        toggleElement = DOM.platformToggleView;
        break;
      case 'workspace':
        cardBody = DOM.workspaceMenuBody;
        toggleElement = DOM.workspaceToggleHeader;
        break;
      case 'csp':
        cardBody = DOM.cspRoleMappingBody;
        toggleElement = DOM.cspToggleView;
        break;
      default:
        return;
    }
    
    if (cardBody) {
      if (expand) {
        cardBody.classList.remove('collapse');
        cardBody.classList.add('show');
      } else {
        cardBody.classList.add('collapse');
        cardBody.classList.remove('show');
      }
    }
    
    if (toggleElement) {
      toggleElement.checked = expand;
    }
  },

  // 모든 카드 접기
  collapseAllCards() {
    this.toggleCard('platform', false);
    this.toggleCard('workspace', false);
    this.toggleCard('csp', false);
  },

  // 역할 선택 시 카드 상태 설정
  setupCardStatesForRole(role) {
    if (!role) {
      this.initializeCardStates();
      this.setCardToggleVisibility(false, false, false);
      this.collapseAllCards();
      // 모든 토글 버튼을 명시적으로 OFF로 설정
      this.resetAllToggles();
      return;
    }

    const roleSubs = role.role_subs || [];
    const hasPlatform = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.PLATFORM);
    const hasWorkspace = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.WORKSPACE);
    const hasCsp = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.CSP);

    // 카드 상태 업데이트
    AppState.ui.cardStates.platform = { visible: hasPlatform, expanded: false };
    AppState.ui.cardStates.workspace = { visible: hasWorkspace, expanded: false };
    AppState.ui.cardStates.csp = { visible: hasCsp, expanded: false };

    // 토글 버튼 표시/숨김 설정
    this.setCardToggleVisibility(hasPlatform, hasWorkspace, hasCsp);
    
    // 모든 카드 접기
    this.collapseAllCards();
    
    // 모든 토글 버튼을 명시적으로 OFF로 설정
    this.resetAllToggles();
  },

  // 모든 토글 버튼을 OFF로 초기화
  resetAllToggles() {
    if (DOM.platformToggleView) {
      DOM.platformToggleView.checked = false;
    }
    if (DOM.workspaceToggleHeader) {
      DOM.workspaceToggleHeader.checked = false;
    }
    if (DOM.cspToggleView) {
      DOM.cspToggleView.checked = false;
    }
  },

  // 역할 상세 정보 업데이트
  updateRoleDetail(role) {
    if (!role) {
      this.clearRoleDetail();
      return;
    }

    // 기본 정보 업데이트
    if (DOM.roleDetailNameView) {
      DOM.roleDetailNameView.textContent = role.name || "";
    }
    if (DOM.roleDetailDescView) {
      DOM.roleDetailDescView.textContent = role.description || "";
    }

    // Role Detail 제목에 역할 이름 표시
    if (DOM.roleDetailRolename && DOM.roleDetailRolenameText) {
      DOM.roleDetailRolenameText.textContent = role.name || "";
      DOM.roleDetailRolename.style.display = 'inline';
    }
  },

  // 역할 상세 정보 초기화
  clearRoleDetail() {
    if (DOM.roleDetailRolename) {
      DOM.roleDetailRolename.style.display = 'none';
    }
    if (DOM.roleDetailNameView) {
      DOM.roleDetailNameView.textContent = '';
    }
    if (DOM.roleDetailDescView) {
      DOM.roleDetailDescView.textContent = '';
    }
  },

  // 카드 토글 (기존 함수 - 호환성 유지)
  toggleCards(showPlatform = false, showWorkspace = false, showCsp = false) {
    // Platform 카드
    if (DOM.platformMenuBody) {
      if (showPlatform) {
        DOM.platformMenuBody.classList.add('show');
        // Platform 카드가 열릴 때 "Menu permissions available" 텍스트 표시
        if (DOM.platformMenuStatus) {
          DOM.platformMenuStatus.style.display = 'inline';
        }
      } else {
        DOM.platformMenuBody.classList.remove('show');
        // Platform 카드가 닫힐 때 "Menu permissions available" 텍스트 숨김
        if (DOM.platformMenuStatus) {
          DOM.platformMenuStatus.style.display = 'none';
        }
      }
    }

    // Workspace 카드
    if (DOM.workspaceMenuBody) {
      if (showWorkspace) {
        DOM.workspaceMenuBody.classList.add('show');
      } else {
        DOM.workspaceMenuBody.classList.remove('show');
      }
    }

    // CSP Role Mapping 카드
    if (DOM.cspRoleMappingBody) {
      if (showCsp) {
        DOM.cspRoleMappingBody.classList.add('show');
      } else {
        DOM.cspRoleMappingBody.classList.remove('show');
      }
    }
  },

  // 폼 초기화
  clearCreateForm() {
    DOM.roleNameInput.value = '';
    DOM.roleDescriptionInput.value = '';
    
    // Platform 트리 초기화
    const tree = $('#platform-menu-create-tree').jstree(true);
    if (tree) {
      tree.uncheck_all();
    }
    
    // Workspace 토글 초기화
    if (DOM.workspaceToggleCreateInner) {
      DOM.workspaceToggleCreateInner.checked = false;
    }
    
    // CSP 선택 초기화
    UIManager.clearCspSelection();
    
    // Create-mode 카드 상태 초기화
    UIManager.initializeCreateCardStates();
    UIManager.collapseAllCreateCards();
  },

  // CSP 선택 초기화
  clearCspSelection() {
    if (DOM.cspProviderSelect) {
      DOM.cspProviderSelect.value = '';
    }
    if (DOM.cspProtocolSelect) {
      DOM.cspProtocolSelect.value = '';
    }
  },

  // Create-mode 카드 토글 상태 초기화
  initializeCreateCardStates() {
    AppState.ui.createCardStates = {
      platform: { expanded: false },
      workspace: { expanded: false },
      csp: { expanded: false }
    };
    this.resetAllCreateToggles();
  },

  // Create-mode 카드 펼침/접힘 처리
  toggleCreateCard(cardType, expand) {
    const cardState = AppState.ui.createCardStates[cardType];
    if (!cardState) return;

    cardState.expanded = expand;
    
    let cardBody, toggleElement;
    
    switch (cardType) {
      case 'platform':
        cardBody = DOM.platformMenuCreateBody;
        toggleElement = DOM.platformToggleCreate;
        break;
      case 'workspace':
        cardBody = DOM.workspaceMenuCreateBody;
        toggleElement = DOM.workspaceToggleCreate;
        break;
      case 'csp':
        cardBody = DOM.cspRoleMappingCreateBody;
        toggleElement = DOM.cspToggleCreate;
        break;
      default:
        return;
    }
    
    if (cardBody) {
      if (expand) {
        cardBody.classList.remove('collapse');
        cardBody.classList.add('show');
      } else {
        cardBody.classList.add('collapse');
        cardBody.classList.remove('show');
      }
    }
    
    if (toggleElement) {
      toggleElement.checked = expand;
    }
  },

  // 모든 Create-mode 카드 접기
  collapseAllCreateCards() {
    this.toggleCreateCard('platform', false);
    this.toggleCreateCard('workspace', false);
    this.toggleCreateCard('csp', false);
  },

  // 모든 Create-mode 토글 버튼을 OFF로 초기화
  resetAllCreateToggles() {
    if (DOM.platformToggleCreate) {
      DOM.platformToggleCreate.checked = false;
    }
    if (DOM.workspaceToggleCreate) {
      DOM.workspaceToggleCreate.checked = false;
    }
    if (DOM.cspToggleCreate) {
      DOM.cspToggleCreate.checked = false;
    }
  }
};

// 테이블 관리 모듈
const TableManager = {
  // 역할 테이블 초기화
  async initRolesTable() {
    return new Promise((resolve, reject) => {
      console.log("Roles 테이블 초기화 시작");

      // 테이블이 이미 존재하는 경우 제거
      if (AppState.tables.rolesTable) {
        AppState.tables.rolesTable.destroy();
      }

      // 테이블 요소 확인
      const tableElement = DOM.rolesTable;
      if (!tableElement) {
        console.error("roles-table 요소를 찾을 수 없습니다.");
        reject(new Error("Table element not found"));
        return;
      }

      try {
        const table = new Tabulator("#roles-table", {
          data: [],
          layout: CONFIG.TABLE.LAYOUT,
          height: CONFIG.TABLE.HEIGHT,
          pagination: true,
          paginationSize: CONFIG.TABLE.PAGINATION_SIZE,
          paginationSizeSelector: CONFIG.TABLE.PAGINATION_SIZES,
          reactiveData: CONFIG.TABLE.REACTIVE_DATA,
          columns: this.getRolesTableColumns()
        });

        // AppState에 테이블 인스턴스 저장
        AppState.tables.rolesTable = table;

        // 테이블 초기화 완료 후 이벤트 리스너 설정
        table.on("tableBuilt", function () {
          console.log("테이블 초기화 완료");
          resolve();
        });

        // 행 클릭 이벤트 추가
        table.on("rowClick", this.handleRoleRowClick.bind(this));

        // 행 선택 변경 이벤트 추가
        table.on("rowSelectionChanged", function (data, rows) {
          checked_array = data;
        });

      } catch (error) {
        console.error("테이블 초기화 중 오류 발생:", error);
        reject(error);
      }
    });
  },

  // 역할 테이블 컬럼 정의
  getRolesTableColumns() {
    return [
      {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        titleFormatterParams: { rowRange: "active" },
        vertAlign: "middle",
        hozAlign: "center",
        headerHozAlign: "center",
        headerSort: false,
        width: 60,
      },
      {
        title: "Role Master ID",
        field: "id",
        headerSort: true,
        sorter: "number"
      },
      {
        title: "Role Master Name",
        field: "name",
        headerSort: true,
        sorter: "string"
      },
      {
        title: "Platform access",
        field: "platformYn",
        headerSort: true,
        sorter: "string",
        formatter: (cell) => {
          const rowData = cell.getRow().getData();
          const roleSubs = rowData.role_subs || [];
          return Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.PLATFORM) ? "Y" : "N";
        }
      },
      {
        title: "Workspace access",
        field: "workspaceYn",
        headerSort: true,
        sorter: "string",
        formatter: (cell) => {
          const rowData = cell.getRow().getData();
          const roleSubs = rowData.role_subs || [];
          return Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.WORKSPACE) ? "Y" : "N";
        }
      },
      {
        title: "CSP Role",
        field: "cspYn",
        headerSort: true,
        sorter: "string",
        formatter: (cell) => {
          const rowData = cell.getRow().getData();
          const roleSubs = rowData.role_subs || [];
          return Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.CSP) ? "Y" : "N";
        }
      },
      {
        title: "Description",
        field: "description",
        headerSort: true,
        sorter: "string",
        visible: false
      }
    ];
  },

  // 역할 행 클릭 핸들러
  handleRoleRowClick(e, row) {
    const tempcurRoleId = AppState.roles.selectedRole ? AppState.roles.selectedRole.id : null;
    const selectedRole = row.getData();
    updateAppState('roles.selectedRole', selectedRole);

    // Create New Role 카드 닫기
    closeCreateRoleCard();

    if (tempcurRoleId === selectedRole.id) {
      // 같은 행을 다시 클릭한 경우
      row.deselect();
      updateAppState('roles.selectedRole', null);
      updateAppState('ui.viewMode', false);
      UIManager.hideAllModes();
      UIManager.clearRoleDetail();
      // 카드 상태 초기화
      UIManager.setupCardStatesForRole(null);
      // Edit 버튼 숨기기
      if (DOM.editButton) {
        DOM.editButton.style.display = 'none';
      }
    } else {
      // 다른 행을 클릭한 경우
      AppState.tables.rolesTable.deselectRow();
      row.select();

      // View Mode 활성화
      UIManager.showViewMode();
      updateAppState('ui.viewMode', true);
      updateAppState('ui.createMode', false);

      // Edit 버튼 표시
      if (DOM.editButton) {
        DOM.editButton.style.display = 'inline-block';
      }

      // 새로운 카드 상태 설정
      UIManager.setupCardStatesForRole(selectedRole);
      UIManager.updateRoleDetail(selectedRole);
      
      // Role Types 업데이트
      const roleSubs = selectedRole.role_subs || [];
      const hasPlatform = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.PLATFORM);
      const hasWorkspace = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.WORKSPACE);
      const hasCsp = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.CSP);
      
      updateRoleTypesDisplay(hasPlatform, hasWorkspace, hasCsp);
      
      // Workspace 토글 상태 업데이트 (기존 로직 유지)
      if (DOM.workspaceToggleViewInner) {
        DOM.workspaceToggleViewInner.checked = hasWorkspace;
      }
      
      // Workspace 상태 표시 업데이트 (기존 로직 유지)
      if (DOM.workspaceStatusView) {
        if (hasWorkspace) {
          DOM.workspaceStatusView.style.display = 'block';
          DOM.workspaceStatusView.innerHTML = '<small class="text-success">(Enabled)</small>';
        } else {
          DOM.workspaceStatusView.style.display = 'none';
        }
      }
      
      // 선택된 역할의 메뉴 권한 업데이트 (비동기 처리)
      if (hasPlatform) {
        // View 모드용 메뉴 트리 초기화 후 권한 업데이트
        initPlatformMenuTree().then(() => {
          return updateMenuPermissions(selectedRole.id);
        }).catch(error => {
          console.error("메뉴 권한 업데이트 실패:", error);
          // 메뉴 권한 업데이트 실패 시에도 view-mode는 계속 유지
        });
      }
          
      // CSP 역할 매핑 정보 업데이트 (비동기 처리)
      if (hasCsp) {
        updateCspRoleMapping(selectedRole.id).catch(error => {
          console.error("CSP 역할 매핑 업데이트 실패:", error);
          // CSP 역할 매핑 업데이트 실패 시에도 view-mode는 계속 유지
          // 테이블을 빈 배열로 설정하여 UI가 깨지지 않도록 함
          if (AppState.tables.cspRoleMappingTable) {
            AppState.tables.cspRoleMappingTable.setData([]);
          }
        });
      }
    }
  },

  // 테이블 데이터 설정
  setTableData(table, data) {
    if (table && data) {
      table.setData(data);
    }
  },

  // 테이블 정리
  destroyTable(table) {
    if (table) {
      table.destroy();
    }
  }
};

// DOMContentLoaded 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM 로드됨");
  try {
    await initRoles();
  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
  }
});

// 초기화 함수
async function initRoles() {
  try {
    // 1. 워크스페이스/프로젝트 초기화
    await initWorkspace();
    
    // 2. 카드 상태 초기화
    UIManager.initializeCardStates();
    UIManager.initializeCreateCardStates();
    UIManager.initializeEditCardStates();
    
    // 3. 역할 목록 가져오기
    const roleList = await RoleManager.loadRoles();

    // 4. 테이블 초기화 및 데이터 설정
    await TableManager.initRolesTable();

    if (roleList && roleList.length > 0) {
      AppState.roles.list = roleList;
      TableManager.setTableData(AppState.tables.rolesTable, roleList);
    } else {
      const dummyData = getDummyRoleData();
      AppState.roles.list = dummyData;
      TableManager.setTableData(AppState.tables.rolesTable, dummyData);
    }

    // 5. 메뉴 트리 초기화
    await initPlatformMenuCreateTree();

    // 6. 이벤트 리스너 설정
    setupEventListeners();

  } catch (error) {
    ErrorHandler.handle(error, "시스템 초기화");
    throw error;
  }
}

// 워크스페이스 초기화
async function initWorkspace() {
  var selectedWorkspaceProject = {
    workspaceId: "ws01",
    workspaceName: "ws01",
    projectId: "Default",
    projectName: "Default",
    nsId: "Default"
  };
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject);
}

// 더미 역할 데이터 생성
function getDummyRoleData() {
  return [
    {
      id: 1,
      name: "admin",
      description: "Administrator role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM },
        { role_type: CONSTANTS.ROLE_TYPES.WORKSPACE },
        { role_type: CONSTANTS.ROLE_TYPES.CSP }
      ]
    },
    {
      id: 2,
      name: "operator",
      description: "Operator role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM },
        { role_type: CONSTANTS.ROLE_TYPES.WORKSPACE }
      ]
    },
    {
      id: 3,
      name: "viewer",
      description: "Viewer role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM }
      ]
    },
    {
      id: 4,
      name: "billadmin",
      description: "Billing Administrator role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM },
        { role_type: CONSTANTS.ROLE_TYPES.CSP }
      ]
    },
    {
      id: 5,
      name: "billviewer",
      description: "Billing Viewer role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM }
      ]
    },
    {
      id: 6,
      name: "developer",
      description: "Developer role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM },
        { role_type: CONSTANTS.ROLE_TYPES.WORKSPACE }
      ]
    },
    {
      id: 7,
      name: "tester",
      description: "Tester role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM }
      ]
    },
    {
      id: 8,
      name: "manager",
      description: "Manager role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM },
        { role_type: CONSTANTS.ROLE_TYPES.WORKSPACE },
        { role_type: CONSTANTS.ROLE_TYPES.CSP }
      ]
    },
    {
      id: 9,
      name: "analyst",
      description: "Analyst role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM },
        { role_type: CONSTANTS.ROLE_TYPES.WORKSPACE }
      ]
    },
    {
      id: 10,
      name: "support",
      description: "Support role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM }
      ]
    },
    {
      id: 11,
      name: "guest",
      description: "Guest role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM }
      ]
    },
    {
      id: 12,
      name: "supervisor",
      description: "Supervisor role",
      role_subs: [
        { role_type: CONSTANTS.ROLE_TYPES.PLATFORM },
        { role_type: CONSTANTS.ROLE_TYPES.WORKSPACE },
        { role_type: CONSTANTS.ROLE_TYPES.CSP }
      ]
    }
  ];
}

var checked_array = [];
var currentClickedRoleId = "";
var rolesTable;

// 상태 업데이트 함수
function updateAppState(path, value) {
  const keys = path.split('.');
  let current = AppState;
  
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  notifyStateChange(path, value);
}

// 상태 변경 알림 함수
function notifyStateChange(path, value) {
  // 무한 루프 방지를 위해 UI 상태 변경은 직접 처리하지 않음
  if (path.startsWith('ui.')) {
    return;
  }
  
  // 상태 변경에 따른 UI 업데이트
  switch (path) {
    case 'roles.selectedRole':
      UIManager.updateRoleDetail(value);
      break;
    case 'form.roleName':
      updateRoleNameDisplay(value);
      break;
    case 'form.workspaceAccess':
      updateWorkspaceToggle(value);
      break;
  }
}

// UI 업데이트 함수들
function updateRoleDetailView(role) {
  UIManager.updateRoleDetail(role);
}

function toggleCreateMode(enabled) {
  if (enabled) {
    UIManager.showCreateMode();
  } else {
    UIManager.hideAllModes();
  }
}

function toggleViewMode(enabled) {
  if (enabled) {
    UIManager.showViewMode();
  } else {
    UIManager.hideAllModes();
  }
}

function updateRoleNameDisplay(roleName) {
  // 역할 이름 변경 시 필요한 UI 업데이트
  console.log('Role name updated:', roleName);
}

function updateWorkspaceToggle(enabled) {
  const workspaceToggleCreate = DOM.workspaceToggleCreate;
  if (workspaceToggleCreate) {
    workspaceToggleCreate.checked = enabled;
  }
}

// 카드 상태 관리 함수
function closeCreateRoleCard() {
  UIManager.hideAllModes();
}

// 카드 상태 관리 함수
function toggleCards(showPlatform = false, showWorkspace = false, showCsp = false) {
  UIManager.toggleCards(showPlatform, showWorkspace, showCsp);
}

// Role Types 표시 업데이트
function updateRoleTypesDisplay(hasPlatform = false, hasWorkspace = false, hasCsp = false) {
  const roleTypesElement = DOM.roleDetailTypesView;
  if (roleTypesElement) {
    const types = [];
    if (hasPlatform) types.push('Platform (Menu Access)');
    if (hasWorkspace) types.push('Workspace (Workspace Access)');
    if (hasCsp) types.push('CSP (Cloud Provider Access)');
    
    const displayText = types.length > 0 ? types.join(', ') : 'None';
    roleTypesElement.textContent = displayText;
  }
}

function convertToJstreeFormat(menuData, parentId = "#", level = 0) {
  let result = [];
  if (!Array.isArray(menuData)) return result;

  // parentId가 "home"인 최상위 노드들만 먼저 처리
  const topLevelMenus = menuData.filter(menu => menu.parentId === "home");
  
  topLevelMenus.forEach(menu => {
    result = result.concat(processMenuNode(menu, menuData, "#", 0));
  });

  return result;
}

function processMenuNode(menu, allMenus, parentId, level) {
  let result = [];
  
  // 계층 단계에 따라 아이콘 결정
  let icon = "ti ti-menu"; // 기본 아이콘
  
  if (level === 0) {
    // 최상위 노드 (Operations, Settings)
    icon = "ti ti-folder";
  } else if (level === 1) {
    // 2차 노드들
    icon = "ti ti-folder-open";
  } else if (level === 2) {
    // 3차 노드들
    icon = "ti ti-layout-grid";
  } else if (level === 3) {
    // 4차 노드들
    icon = "ti ti-settings";
  } else if (level >= 4) {
    // 5차 이상 노드들
    icon = "ti ti-click";
  }

  // jstree 노드 객체 생성
  const node = {
    id: menu.id,
    text: menu.display_name || menu.displayName || menu.text || menu.id,
    parent: parentId,
    state: { opened: false },
    icon: icon,
    data: {
      menunumber: menu.menu_number || menu.menunumber,
      isAction: menu.is_action || menu.isAction,
      priority: menu.priority
    }
  };
  result.push(node);

  // 현재 메뉴의 하위 메뉴들 찾기
  const childMenus = allMenus.filter(m => m.parentId === menu.id);
  
  // 하위 메뉴가 있으면 재귀적으로 처리
  childMenus.forEach(childMenu => {
    result = result.concat(processMenuNode(childMenu, allMenus, menu.id, level + 1));
  });

  return result;
}

async function initPlatformMenuTree() {
  try {
    // 이미 트리가 초기화되어 있으면 재초기화하지 않음
    if (DOM.platformMenuTree && $(DOM.platformMenuTree).jstree(true)) {
      return;
    }
    
    const response = await webconsolejs["common/api/services/roles_api"].getMenusResources();

    if (response) {
      const treeData = convertToJstreeFormat(response);

      // 기존 트리 제거
      if ($("#platform-menu-tree").jstree(true)) {
        $("#platform-menu-tree").jstree("destroy");
      }
      
      // 트리 생성 - View 모드용 설정
      $('#platform-menu-tree').jstree({
        "core": {
          "themes": {
            "responsive": true
          },
          "data": treeData,
          "check_callback": false, // 모든 상호작용 차단
          "multiple": false // 다중 선택 비활성화
        },
        "plugins": ["types", "checkbox"],
        "checkbox": {
          "keep_selected_style": true,
          "three_state": false
        },
        "types": {
          "default": {
            "icon": "ti ti-menu"
          }
        }
      });
      
            // View 모드 체크박스를 readonly로 만들기 위한 CSS 적용
      $("#platform-menu-tree").on("ready.jstree", function () {
        // 모든 노드를 펼쳐놓기
        $('#platform-menu-tree').jstree(true).open_all();
        
        // 체크박스를 readonly로 만들기
        $("#platform-menu-tree .jstree-checkbox").css({
          "pointer-events": "none",
          "opacity": "0.7"
        });
        
        // 노드 텍스트도 클릭 불가능하게 만들기
        $("#platform-menu-tree .jstree-anchor").css({
          "pointer-events": "none"
        });
        
        // 현재 선택된 역할이 있으면 해당 역할의 메뉴 권한 표시
        if (AppState.roles.selectedRole && AppState.roles.selectedRole.id) {
          updateMenuPermissions(AppState.roles.selectedRole.id);
        }
      });

      // 트리 외부에서 모든 상호작용 이벤트 차단
      $("#platform-menu-tree").off('click.jstree check_node.jstree uncheck_node.jstree select_node.jstree deselect_node.jstree');
      
      $("#platform-menu-tree").on('click.jstree', function (e, data) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });

    } else {
      console.error("메뉴 트리 데이터가 없습니다.");
    }
  } catch (error) {
    console.error("Platform 메뉴 트리 초기화 중 오류 발생:", error);
    alert("플랫폼 메뉴 트리를 불러오는데 실패했습니다.");
  }
}

async function initPlatformMenuCreateTree() {
  try {
    // 이미 트리가 초기화되어 있으면 재초기화하지 않음
    if (DOM.platformMenuCreateTree && $(DOM.platformMenuCreateTree).jstree(true)) {
      return;
    }
    const response = await webconsolejs["common/api/services/roles_api"].getMenusResources();

    // 응답 구조 고정
    let menuData = response;

    if (menuData) {
      const treeData = convertToJstreeFormat(menuData);

      // 기존 트리 제거
      if ($("#platform-menu-create-tree").jstree(true)) {
        $("#platform-menu-create-tree").jstree("destroy");
      }
      // 트리 생성
      $('#platform-menu-create-tree').jstree({
        "core": {
          "themes": {
            "responsive": true
          },
          "data": treeData,
          "check_callback": false
        },
        "plugins": ["types", "checkbox"],
        "types": {
          "default": {
            "icon": "ti ti-menu"
          }
        }
      });
      // 트리 초기화 완료 후 이벤트 바인딩
      $("#platform-menu-create-tree").on("ready.jstree", function () {
        // 모든 노드를 펼쳐놓기
        $('#platform-menu-create-tree').jstree(true).open_all();
        
        // 펼치기/접기 아이콘 숨기기
        $('#platform-menu-create-tree .jstree-ocl').hide();
        
        // 노드 클릭 시 펼치기/접기 방지
        $('#platform-menu-create-tree').on('click.jstree', function (e, data) {
          if (data && data.event && data.event.target && data.event.target.classList.contains('jstree-ocl')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        });
      });

    } else {
      console.error("Create 메뉴 트리 데이터가 없습니다.");
    }
  } catch (error) {
    console.error("Create Platform 메뉴 트리 초기화 중 오류 발생:", error);
    alert("플랫폼 메뉴 트리를 불러오는데 실패했습니다.");
  }
}

async function initPlatformMenuEditTree() {
  try {
    // 이미 트리가 초기화되어 있으면 재초기화하지 않음
    if (DOM.platformMenuEditTree && $(DOM.platformMenuEditTree).jstree(true)) {
      return;
    }
    const response = await webconsolejs["common/api/services/roles_api"].getMenusResources();

    // 응답 구조 고정
    let menuData = response;

    if (menuData) {
      const treeData = convertToJstreeFormat(menuData);

      // 기존 트리 제거
      if ($("#platform-menu-edit-tree").jstree(true)) {
        $("#platform-menu-edit-tree").jstree("destroy");
      }
      // 트리 생성
      $('#platform-menu-edit-tree').jstree({
        "core": {
          "themes": {
            "responsive": true
          },
          "data": treeData,
          "check_callback": false
        },
        "plugins": ["types", "checkbox"],
        "types": {
          "default": {
            "icon": "ti ti-menu"
          }
        }
      });
      // 트리 초기화 완료 후 이벤트 바인딩
      $("#platform-menu-edit-tree").on("ready.jstree", function () {
        // 모든 노드를 펼쳐놓기
        $('#platform-menu-edit-tree').jstree(true).open_all();
        
        // 펼치기/접기 아이콘 숨기기
        $('#platform-menu-edit-tree .jstree-ocl').hide();
        
        // 노드 클릭 시 펼치기/접기 방지
        $('#platform-menu-edit-tree').on('click.jstree', function (e, data) {
          if (data && data.event && data.event.target && data.event.target.classList.contains('jstree-ocl')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        });
      });

    } else {
      console.error("Edit 메뉴 트리 데이터가 없습니다.");
    }
  } catch (error) {
    console.error("Edit Platform 메뉴 트리 초기화 중 오류 발생:", error);
    alert("플랫폼 메뉴 트리를 불러오는데 실패했습니다.");
  }
}

// 이벤트 리스너 설정 함수 추가
function setupEventListeners() {
  console.log("이벤트 리스너 설정 시작");

  // Workspace 토글 이벤트
  const workspaceToggleCreate = DOM.workspaceToggleCreate;
  if (workspaceToggleCreate) {
    workspaceToggleCreate.removeEventListener("change", handleWorkspaceToggleCreate);
    workspaceToggleCreate.addEventListener("change", handleWorkspaceToggleCreate);
  }

  // Add 버튼 클릭 이벤트
  const addButton = DOM.addButton;
  if (addButton) {
    addButton.removeEventListener("click", handleAddButtonClick);
    addButton.addEventListener("click", handleAddButtonClick);
  }

  // Edit 버튼 클릭 이벤트
  const editButton = DOM.editButton;
  if (editButton) {
    editButton.removeEventListener("click", handleEditButtonClick);
    editButton.addEventListener("click", handleEditButtonClick);
  }

  // Cancel 버튼 클릭 이벤트
  const cancelButton = DOM.cancelCreateRoleBtn;
  if (cancelButton) {
    cancelButton.removeEventListener("click", handleCancelButtonClick);
    cancelButton.addEventListener("click", handleCancelButtonClick);
  }

  // Save Role 버튼 클릭 이벤트
  const saveButton = DOM.saveCreateRoleBtn;
  if (saveButton) {
    saveButton.removeEventListener("click", handleSaveRoleClick);
    saveButton.addEventListener("click", handleSaveRoleClick);
  }

  // Edit Cancel 버튼 클릭 이벤트
  const cancelEditButton = DOM.cancelEditRoleBtn;
  if (cancelEditButton) {
    cancelEditButton.removeEventListener("click", handleCancelEditButtonClick);
    cancelEditButton.addEventListener("click", handleCancelEditButtonClick);
  }

  // Edit Save Role 버튼 클릭 이벤트
  const saveEditButton = DOM.saveEditRoleBtn;
  if (saveEditButton) {
    saveEditButton.removeEventListener("click", handleSaveEditRoleClick);
    saveEditButton.addEventListener("click", handleSaveEditRoleClick);
  }

  // 새로운 카드 토글 버튼 이벤트 리스너
  setupCardToggleEventListeners();
  
  // Create-mode 카드 토글 버튼 이벤트 리스너
  setupCreateCardToggleEventListeners();

  // Edit-mode 카드 토글 버튼 이벤트 리스너
  setupEditCardToggleEventListeners();

  // CSP Role Mapping 폼 초기화
  initCspRoleMappingForm();
  
  // Edit CSP Role Mapping 폼 초기화
  initEditCspRoleMappingForm();
}

// 카드 토글 버튼 이벤트 리스너 설정 (View-mode용)
function setupCardToggleEventListeners() {
  // Platform 토글
  if (DOM.platformToggleView) {
    DOM.platformToggleView.removeEventListener("change", handlePlatformToggle);
    DOM.platformToggleView.addEventListener("change", handlePlatformToggle);
  }

  // Workspace 토글
  if (DOM.workspaceToggleHeader) {
    DOM.workspaceToggleHeader.removeEventListener("change", handleWorkspaceToggle);
    DOM.workspaceToggleHeader.addEventListener("change", handleWorkspaceToggle);
  }

  // CSP 토글
  if (DOM.cspToggleView) {
    DOM.cspToggleView.removeEventListener("change", handleCspToggle);
    DOM.cspToggleView.addEventListener("change", handleCspToggle);
  }
}

// View-mode 카드 토글 핸들러들
function handlePlatformToggle(e) {
  const isChecked = e.target.checked;
  UIManager.toggleCard('platform', isChecked);
}

function handleWorkspaceToggle(e) {
  const isChecked = e.target.checked;
  console.log("Workspace 토글 변경:", isChecked);
  UIManager.toggleCard('workspace', isChecked);
}

function handleCspToggle(e) {
  const isChecked = e.target.checked;
  console.log("CSP 토글 변경:", isChecked);
  UIManager.toggleCard('csp', isChecked);
}

// Create-mode 카드 토글 버튼 이벤트 리스너 설정
function setupCreateCardToggleEventListeners() {
  // Platform 토글
  if (DOM.platformToggleCreate) {
    DOM.platformToggleCreate.removeEventListener("change", handlePlatformToggleCreate);
    DOM.platformToggleCreate.addEventListener("change", handlePlatformToggleCreate);
  }

  // Workspace 토글
  if (DOM.workspaceToggleCreate) {
    DOM.workspaceToggleCreate.removeEventListener("change", handleWorkspaceToggleCreate);
    DOM.workspaceToggleCreate.addEventListener("change", handleWorkspaceToggleCreate);
  }

  // CSP 토글
  if (DOM.cspToggleCreate) {
    DOM.cspToggleCreate.removeEventListener("change", handleCspToggleCreate);
    DOM.cspToggleCreate.addEventListener("change", handleCspToggleCreate);
  }
}

// Create-mode 카드 토글 핸들러들
function handlePlatformToggleCreate(e) {
  const isChecked = e.target.checked;
  console.log("Create Platform 토글 변경:", isChecked);
  UIManager.toggleCreateCard('platform', isChecked);
}

function handleWorkspaceToggleCreate(e) {
  const isChecked = e.target.checked;
  console.log("Create Workspace 토글 변경:", isChecked);
  UIManager.toggleCreateCard('workspace', isChecked);
}

function handleCspToggleCreate(e) {
  const isChecked = e.target.checked;
  console.log("Create CSP 토글 변경:", isChecked);
  UIManager.toggleCreateCard('csp', isChecked);
}

// 핸들러 함수 분리
function handleAddButtonClick(e) {
  e.preventDefault();

  // 현재 선택된 행이 있다면 선택 해제 (항상 먼저 실행)
  if (AppState.roles.selectedRole) {
    // Tabulator에서 선택된 행 해제
    if (AppState.tables.rolesTable) {
      AppState.tables.rolesTable.deselectRow();
      // 모든 행의 선택 상태를 명시적으로 해제
      const rows = AppState.tables.rolesTable.getRows();
      rows.forEach((row) => {
        row.deselect();
      });
    }
    updateAppState('roles.selectedRole', null);
  }

  // create-mode-cards가 이미 펼쳐진 상태인지 확인 (className으로도 확인)
  const isCreateModeVisible = DOM.createModeCards && (
    DOM.createModeCards.classList.contains('show') || 
    DOM.createModeCards.className.includes('show') ||
    DOM.createModeCards.classList.contains('collapsing')
  );
  // view-mode-cards 숨기기 (항상 실행)
  if (DOM.viewModeCards) {
    DOM.viewModeCards.classList.remove('show');
  }
  if (isCreateModeVisible) {
    // 이미 펼쳐진 상태라면 닫기 (Cancel 버튼과 동일한 동작)
    if (DOM.createModeCards) {
      DOM.createModeCards.classList.remove('show');
    }
    updateAppState('ui.createMode', false);
    return;
  }
  // 모든 카드 닫기
  toggleCards(false, false, false);
  // 카드 상태 초기화
  UIManager.setupCardStatesForRole(null);
  // Create-mode 카드 상태 초기화
  UIManager.initializeCreateCardStates();
  UIManager.collapseAllCreateCards();
  // Role Detail 제목에서 역할 이름 숨기기
  const roleDetailRolenameElement = DOM.roleDetailRolename;
  if (roleDetailRolenameElement) {
    roleDetailRolenameElement.style.display = 'none';
  }
  // create-mode-cards 보이기
  if (DOM.createModeCards) {
    DOM.createModeCards.classList.add('show');
  }
  updateAppState('ui.createMode', true);
  updateAppState('ui.viewMode', false);
}

function handleCancelButtonClick(e) {
  // create-mode-cards 숨기기
  if (DOM.createModeCards) {
    DOM.createModeCards.classList.remove('show');
  }
  updateAppState('ui.createMode', false);
  // Create Role 폼 초기화
  clearCreateRoleForm();
  // Create-mode 카드 상태 초기화
  UIManager.initializeCreateCardStates();
  UIManager.collapseAllCreateCards();
}

function handleSaveRoleClick(e) {
  saveRole();
}

// 메뉴 권한 업데이트 함수
async function updateMenuPermissions(roleId) {
  try {
    // 트리가 없으면 생성 (지연 초기화)
    if (!$("#platform-menu-tree").jstree(true)) {
      await initPlatformMenuTree();
    }
    
    // getMappedMenusByRoleList API 호출
    const response = await webconsolejs["common/api/services/roles_api"].getMappedMenusByRoleList(roleId);
    
    // response가 null, undefined, 빈 배열인 경우 처리
    if (!response || (Array.isArray(response) && response.length === 0)) {
      // 메뉴 권한 상태 아이콘 숨기기
      const statusElement = DOM.platformMenuStatus;
      if (statusElement) {
        statusElement.style.display = 'none';
      }
      // 모든 체크박스 해제
      $('#platform-menu-tree').jstree(true).uncheck_all();
      return;
    }
    
    // 권한이 있는 메뉴 ID 목록 추출
    let authorizedMenuIds = [];
    if (Array.isArray(response)) {
      authorizedMenuIds = response.map(menu => menu.id || menu.menu_id);
    } else if (response && typeof response === 'object') {
      // response가 객체인 경우, 내부에 배열이 있을 수 있음
      if (response.menus && Array.isArray(response.menus)) {
        authorizedMenuIds = response.menus.map(menu => menu.id || menu.menu_id);
      } else if (response.data && Array.isArray(response.data)) {
        authorizedMenuIds = response.data.map(menu => menu.id || menu.menu_id);
      }
    }
    
    // 모든 노드의 체크박스 해제
    $('#platform-menu-tree').jstree(true).uncheck_all();
    
    // 권한이 있는 메뉴들만 체크
    authorizedMenuIds.forEach(menuId => {
      const node = $('#platform-menu-tree').jstree(true).get_node(menuId);
      if (node && node.id !== '#') {
        $('#platform-menu-tree').jstree(true).check_node(node);
      }
    });
    
    // 메뉴 권한 상태 아이콘 표시/숨김
    const statusElement = DOM.platformMenuStatus;
    if (statusElement) {
      if (authorizedMenuIds.length > 0) {
        statusElement.style.display = 'inline';
      } else {
        statusElement.style.display = 'none';
      }
    }
    
  } catch (error) {
    console.error("메뉴 권한 업데이트 중 오류 발생:", error);
    // 오류 시 메뉴 권한 상태 아이콘 숨기기
    const statusElement = DOM.platformMenuStatus;
    if (statusElement) {
      statusElement.style.display = 'none';
    }
    alert("메뉴 권한 정보를 불러오는데 실패했습니다.");
  }
}

// Edit 모드 메뉴 권한 업데이트 함수
async function updateEditMenuPermissions(roleId) {
  try {
    console.log("Edit 모드 메뉴 권한 업데이트 시작 - 역할:", roleId);
    
    // 트리가 없으면 생성 (지연 초기화)
    if (!$("#platform-menu-edit-tree").jstree(true)) {
      await initPlatformMenuEditTree();
    }
    
    // getMappedMenusByRoleList API 호출
    const response = await webconsolejs["common/api/services/roles_api"].getMappedMenusByRoleList(roleId);
    
    if (!response) {
      console.error("Edit 모드 메뉴 권한 데이터를 가져올 수 없습니다.");
      return;
    }
    
    // 권한이 있는 메뉴 ID 목록 추출
    const authorizedMenuIds = response.map(menu => menu.id || menu.menu_id);
    console.log("Edit 모드 권한이 있는 메뉴 ID 목록:", authorizedMenuIds);
    
    // 모든 노드의 체크박스 해제
    $('#platform-menu-edit-tree').jstree(true).uncheck_all();
    
    // 권한이 있는 메뉴들만 체크
    authorizedMenuIds.forEach(menuId => {
      const node = $('#platform-menu-edit-tree').jstree(true).get_node(menuId);
      if (node && node.id !== '#') {
        $('#platform-menu-edit-tree').jstree(true).check_node(node);
      }
    });
    
    console.log("Edit 모드 메뉴 권한 업데이트 완료");
    
  } catch (error) {
    console.error("Edit 모드 메뉴 권한 업데이트 중 오류 발생:", error);
    alert("Edit 모드 메뉴 권한 정보를 불러오는데 실패했습니다.");
  }
}

// CSP 역할 매핑 정보 업데이트 함수
async function updateCspRoleMapping(roleId) {
  try {
    console.log("CSP 역할 매핑 업데이트 시작 - 역할:", roleId);
    
    // 테이블이 없으면 생성 (지연 초기화)
    if (!AppState.tables.cspRoleMappingTable) {
      console.log("CSP Role Mapping 테이블 생성 중...");
      try {
        await initCspRoleMappingTable();
      } catch (tableError) {
        console.error("CSP Role Mapping 테이블 초기화 실패:", tableError);
        // 테이블 초기화 실패 시에도 계속 진행
        return;
      }
    }
    
    // getCSPRoleListByRoleId API 호출
    const response = await webconsolejs["common/api/services/roles_api"].getCSPRoleListByRoleId(roleId);
    
    console.log("CSP 역할 매핑 API 응답:", response);
    
    // CSP 데이터가 있는지 확인하는 함수
    const hasCspData = (data) => {
      if (!data) return false;
      if (Array.isArray(data)) return data.length > 0;
      if (data.cspRoles && Array.isArray(data.cspRoles)) return data.cspRoles.length > 0;
      return false;
    };
    
    // CSP 데이터 표시/숨김 함수
    const showCspContent = (showTable, showEmpty) => {
      if (DOM.cspRoleMappingTable) {
        DOM.cspRoleMappingTable.style.display = showTable ? 'block' : 'none';
      }
      if (DOM.cspRoleMappingEmpty) {
        DOM.cspRoleMappingEmpty.style.display = showEmpty ? 'block' : 'none';
      }
    };
    
    // API 응답이 null이거나 undefined인 경우 빈 상태 메시지 표시
    if (!response) {
      console.log("CSP 역할 매핑 데이터가 없습니다. (API 응답: null)");
      if (AppState.tables.cspRoleMappingTable) {
        AppState.tables.cspRoleMappingTable.setData([]);
      }
      showCspContent(false, true);
      return;
    }
    
    // response가 배열인 경우 (직접 CSP 역할 배열이 반환되는 경우)
    if (Array.isArray(response)) {
      console.log("CSP 역할 데이터 (배열):", response);
      if (hasCspData(response)) {
        if (AppState.tables.cspRoleMappingTable) {
          AppState.tables.cspRoleMappingTable.setData(response);
        }
        showCspContent(true, false);
      } else {
        if (AppState.tables.cspRoleMappingTable) {
          AppState.tables.cspRoleMappingTable.setData([]);
        }
        showCspContent(false, true);
      }
      return;
    }
    
    // response가 객체이고 cspRoles 속성이 있는 경우
    if (response.cspRoles) {
      if (!Array.isArray(response.cspRoles)) {
        console.log("CSP 역할 매핑 데이터가 배열이 아닙니다:", response.cspRoles);
        if (AppState.tables.cspRoleMappingTable) {
          AppState.tables.cspRoleMappingTable.setData([]);
        }
        showCspContent(false, true);
        return;
      }
      
      // CSP 역할 데이터를 테이블에 설정
      const cspRolesData = response.cspRoles;
      console.log("CSP 역할 데이터:", cspRolesData);
      
      if (hasCspData(cspRolesData)) {
        // auth_method를 각 CSP 역할 객체에 추가
        const processedData = cspRolesData.map(cspRole => ({
          ...cspRole,
          auth_method: response.auth_method || cspRole.auth_method
        }));
        
        if (AppState.tables.cspRoleMappingTable) {
          AppState.tables.cspRoleMappingTable.setData(processedData);
        }
        showCspContent(true, false);
      } else {
        if (AppState.tables.cspRoleMappingTable) {
          AppState.tables.cspRoleMappingTable.setData([]);
        }
        showCspContent(false, true);
      }
    } else {
      // cspRoles 속성이 없는 경우 빈 상태 메시지 표시
      console.log("CSP 역할 매핑 데이터가 없습니다. (cspRoles 속성 없음)");
      if (AppState.tables.cspRoleMappingTable) {
        AppState.tables.cspRoleMappingTable.setData([]);
      }
      showCspContent(false, true);
    }
    
    console.log("CSP 역할 매핑 업데이트 완료");
    
  } catch (error) {
    console.error("CSP 역할 매핑 업데이트 중 오류 발생:", error);
    // 오류가 발생해도 테이블을 빈 배열로 설정하고 빈 상태 메시지 표시
    if (AppState.tables.cspRoleMappingTable) {
      AppState.tables.cspRoleMappingTable.setData([]);
    }
    if (DOM.cspRoleMappingTable) {
      DOM.cspRoleMappingTable.style.display = 'none';
    }
    if (DOM.cspRoleMappingEmpty) {
      DOM.cspRoleMappingEmpty.style.display = 'block';
    }
  }
}

function initCspRoleMappingTable() {
  return new Promise((resolve, reject) => {
    console.log("CSP Role Mapping 테이블 초기화 시작");

    // 테이블이 이미 존재하는 경우 제거
    if (AppState.tables.cspRoleMappingTable) {
      AppState.tables.cspRoleMappingTable.destroy();
    }

    // 테이블 요소 확인
    const tableElement = DOM.cspRoleMappingTable;
    if (!tableElement) {
      console.error("csp-role-mapping-table 요소를 찾을 수 없습니다.");
      reject(new Error("Table element not found"));
      return;
    }

    try {
      const cspRoleMappingTable = new Tabulator("#csp-role-mapping-table", {
        data: [],
        layout: "fitColumns",
        height: "300px",
        pagination: true,
        paginationSize: 7,
        paginationSizeSelector: [7, 14, 21],
        reactiveData: true,
        columns: [
          {
            title: "CSP Type",
            field: "csp_type",
            headerSort: false,
            width: 80,
            formatter: function (cell) {
              const cspType = cell.getValue();
              if (!cspType) return "N/A";
              return cspType.toUpperCase();
            }
          },
          {
            title: "Role Name",
            field: "name",
            headerSort: false,
            width: 120
          },
          {
            title: "IDP Identifier",
            field: "idp_identifier",
            headerSort: false,
            formatter: function (cell) {
              const value = cell.getValue();
              if (!value) return "N/A";
              // 긴 ARN을 줄여서 표시
              if (value.length > 50) {
                return value.substring(0, 47) + "...";
              }
              return value;
            },
            cellClick: function(e, cell) {
              const value = cell.getValue();
              if (value && value.length > 50) {
                alert("IDP Identifier: " + value);
              }
            }
          },
          {
            title: "IAM Identifier",
            field: "iam_identifier",
            headerSort: false,
            formatter: function (cell) {
              const value = cell.getValue();
              if (!value) return "N/A";
              // 긴 ARN을 줄여서 표시
              if (value.length > 50) {
                return value.substring(0, 47) + "...";
              }
              return value;
            },
            cellClick: function(e, cell) {
              const value = cell.getValue();
              if (value && value.length > 50) {
                alert("IAM Identifier: " + value);
              }
            }
          },
          {
            title: "Auth Method",
            field: "auth_method",
            headerSort: false,
            width: 100,
            formatter: function (cell) {
              const authMethod = cell.getValue();
              if (!authMethod) return "N/A";
              return authMethod.toUpperCase();
            }
          },
          {
            title: "ID",
            field: "id",
            headerSort: false,
            visible: false
          }
        ]
      });

      // 테이블 초기화 완료 후 이벤트 리스너 설정
      cspRoleMappingTable.on("tableBuilt", function () {
        console.log("CSP Role Mapping 테이블 초기화 완료");
        resolve();
      });

      // AppState에 테이블 인스턴스 저장
      AppState.tables.cspRoleMappingTable = cspRoleMappingTable;

    } catch (error) {
      console.error("CSP Role Mapping 테이블 초기화 중 오류 발생:", error);
      reject(error);
    }
  });
}

function initCspRoleMappingEditTable(roleId) {
  return new Promise((resolve, reject) => {
    console.log("Edit CSP Role Mapping 테이블 초기화 시작");

    // 테이블 요소 확인
    const tableElement = DOM.cspRoleMappingEditTable;
    if (!tableElement) {
      console.error("csp-role-mapping-edit-table 요소를 찾을 수 없습니다.");
      reject(new Error("Table element not found"));
      return;
    }

    try {
      const cspRoleMappingEditTable = new Tabulator("#csp-role-mapping-edit-table", {
        data: [],
        layout: "fitColumns",
        height: "300px",
        pagination: true,
        paginationSize: 7,
        paginationSizeSelector: [7, 14, 21],
        reactiveData: true,
        columns: [
          {
            title: "CSP Type",
            field: "csp_type",
            headerSort: false,
            width: 80,
            formatter: function (cell) {
              const cspType = cell.getValue();
              if (!cspType) return "N/A";
              return cspType.toUpperCase();
            }
          },
          {
            title: "Role Name",
            field: "name",
            headerSort: false,
            width: 120
          },
          {
            title: "IDP Identifier",
            field: "idp_identifier",
            headerSort: false,
            formatter: function (cell) {
              const value = cell.getValue();
              if (!value) return "N/A";
              // 긴 ARN을 줄여서 표시
              if (value.length > 50) {
                return value.substring(0, 47) + "...";
              }
              return value;
            },
            cellClick: function(e, cell) {
              const value = cell.getValue();
              if (value && value.length > 50) {
                alert("IDP Identifier: " + value);
              }
            }
          },
          {
            title: "IAM Identifier",
            field: "iam_identifier",
            headerSort: false,
            formatter: function (cell) {
              const value = cell.getValue();
              if (!value) return "N/A";
              // 긴 ARN을 줄여서 표시
              if (value.length > 50) {
                return value.substring(0, 47) + "...";
              }
              return value;
            },
            cellClick: function(e, cell) {
              const value = cell.getValue();
              if (value && value.length > 50) {
                alert("IAM Identifier: " + value);
              }
            }
          },
          {
            title: "Auth Method",
            field: "auth_method",
            headerSort: false,
            width: 100,
            formatter: function (cell) {
              const authMethod = cell.getValue();
              if (!authMethod) return "N/A";
              return authMethod.toUpperCase();
            }
          },
          {
            title: "Actions",
            headerSort: false,
            width: 80,
            formatter: function (cell) {
              return '<button class="btn btn-sm btn-outline-danger" onclick="deleteCspMapping(' + cell.getRow().getData().id + ')">Delete</button>';
            }
          },
          {
            title: "ID",
            field: "id",
            headerSort: false,
            visible: false
          }
        ]
      });

      // 테이블 초기화 완료 후 이벤트 리스너 설정
      cspRoleMappingEditTable.on("tableBuilt", function () {
        console.log("Edit CSP Role Mapping 테이블 초기화 완료");
        // CSP 데이터 로드
        loadEditCspRoleMapping(roleId, cspRoleMappingEditTable);
        resolve();
      });

      // AppState에 테이블 인스턴스 저장
      AppState.tables.cspRoleMappingEditTable = cspRoleMappingEditTable;

    } catch (error) {
      console.error("Edit CSP Role Mapping 테이블 초기화 중 오류 발생:", error);
      reject(error);
    }
  });
}

// Edit CSP 역할 매핑 데이터 로드
async function loadEditCspRoleMapping(roleId, table) {
  try {
    console.log("Edit CSP 역할 매핑 데이터 로드 시작 - 역할:", roleId);
    
    // getCSPRoleListByRoleId API 호출
    const response = await webconsolejs["common/api/services/roles_api"].getCSPRoleListByRoleId(roleId);
    
    console.log("Edit CSP 역할 매핑 API 응답:", response);
    
    // CSP 데이터가 있는지 확인하는 함수
    const hasCspData = (data) => {
      if (!data) return false;
      if (Array.isArray(data)) return data.length > 0;
      if (data.cspRoles && Array.isArray(data.cspRoles)) return data.cspRoles.length > 0;
      return false;
    };
    
    // CSP 데이터 표시/숨김 함수
    const showCspContent = (showTable, showEmpty) => {
      if (DOM.cspRoleMappingEditTable) {
        DOM.cspRoleMappingEditTable.style.display = showTable ? 'block' : 'none';
      }
      if (DOM.cspRoleMappingEditEmpty) {
        DOM.cspRoleMappingEditEmpty.style.display = showEmpty ? 'block' : 'none';
      }
    };
    
    // API 응답이 null이거나 undefined인 경우 빈 상태 메시지 표시
    if (!response) {
      console.log("Edit CSP 역할 매핑 데이터가 없습니다. (API 응답: null)");
      if (table) {
        table.setData([]);
      }
      showCspContent(false, true);
      return;
    }
    
    // response가 배열인 경우 (직접 CSP 역할 배열이 반환되는 경우)
    if (Array.isArray(response)) {
      console.log("Edit CSP 역할 데이터 (배열):", response);
      if (hasCspData(response)) {
        if (table) {
          table.setData(response);
        }
        showCspContent(true, false);
      } else {
        if (table) {
          table.setData([]);
        }
        showCspContent(false, true);
      }
      return;
    }
    
    // response가 객체이고 cspRoles 속성이 있는 경우
    if (response.cspRoles) {
      if (!Array.isArray(response.cspRoles)) {
        console.log("Edit CSP 역할 매핑 데이터가 배열이 아닙니다:", response.cspRoles);
        if (table) {
          table.setData([]);
        }
        showCspContent(false, true);
        return;
      }
      
      // CSP 역할 데이터를 테이블에 설정
      const cspRolesData = response.cspRoles;
      console.log("Edit CSP 역할 데이터:", cspRolesData);
      
      if (hasCspData(cspRolesData)) {
        // auth_method를 각 CSP 역할 객체에 추가
        const processedData = cspRolesData.map(cspRole => ({
          ...cspRole,
          auth_method: response.auth_method || cspRole.auth_method
        }));
        
        if (table) {
          table.setData(processedData);
        }
        showCspContent(true, false);
      } else {
        if (table) {
          table.setData([]);
        }
        showCspContent(false, true);
      }
    } else {
      // cspRoles 속성이 없는 경우 빈 상태 메시지 표시
      console.log("Edit CSP 역할 매핑 데이터가 없습니다. (cspRoles 속성 없음)");
      if (table) {
        table.setData([]);
      }
      showCspContent(false, true);
    }
    
    console.log("Edit CSP 역할 매핑 데이터 로드 완료");
    
  } catch (error) {
    console.error("Edit CSP 역할 매핑 데이터 로드 중 오류 발생:", error);
    // 오류가 발생해도 테이블을 빈 배열로 설정하고 빈 상태 메시지 표시
    if (table) {
      table.setData([]);
    }
    if (DOM.cspRoleMappingEditTable) {
      DOM.cspRoleMappingEditTable.style.display = 'none';
    }
    if (DOM.cspRoleMappingEditEmpty) {
      DOM.cspRoleMappingEditEmpty.style.display = 'block';
    }
  }
}

// CSP Role Mapping 관련 변수
let selectedCspProvider = '';
let selectedCspProtocol = '';

// Edit CSP Role Mapping 관련 변수
let selectedEditCspProvider = '';
let selectedEditCspProtocol = '';

// CSP Role Mapping 폼 초기화
function initCspRoleMappingForm() {
  // CSP Provider 선택 이벤트
  const cspProviderSelect = DOM.cspProviderSelect;
  if (cspProviderSelect) {
    cspProviderSelect.addEventListener('change', function() {
      selectedCspProvider = this.value;
    });
  }
  
  // Protocol 선택 이벤트
  const cspProtocolSelect = DOM.cspProtocolSelect;
  if (cspProtocolSelect) {
    cspProtocolSelect.addEventListener('change', function() {
      selectedCspProtocol = this.value;
    });
  }
}

// CSP 선택 정보 반환 (저장 시 사용)
function getCspSelection() {
  return {
    cspProvider: selectedCspProvider,
    cspProtocol: selectedCspProtocol
  };
}

// 역할 저장 함수
async function saveRole() {
  try {
    const roleName = DOM.roleNameInput.value;
    const roleDescription = DOM.roleDescriptionInput.value;
    
    // 토글 상태 확인
    const isPlatformToggleOn = AppState.ui.createCardStates.platform.expanded;
    const isWorkspaceToggleOn = AppState.ui.createCardStates.workspace.expanded;
    const isCspToggleOn = AppState.ui.createCardStates.csp.expanded;
    
    // 폼 데이터 수집 (토글 상태에 따라 필터링)
    const formData = {
      name: roleName,
      description: roleDescription,
      platformPermissions: isPlatformToggleOn ? getPlatformPermissions() : [],
      workspaceEnabled: isWorkspaceToggleOn ? (DOM.workspaceToggleCreateInner ? DOM.workspaceToggleCreateInner.checked : false) : false,
      cspSelection: isCspToggleOn ? getCspSelection() : null
    };
    
    // 폼 검증
    const validationErrors = RoleManager.validateRoleData(formData);
    if (validationErrors.length > 0) {
      Utils.showAlert(validationErrors.join('\n'));
      return;
    }
    
    // 역할 타입 결정 (토글 상태에 따라)
    const roleTypes = RoleManager.determineRoleTypes(
      formData.platformPermissions, 
      formData.workspaceEnabled, 
      formData.cspSelection
    );
    
    // 역할 생성 데이터 구성
    const roleData = {
      name: formData.name,
      description: formData.description,
      roleTypes: roleTypes,
      menuIds: formData.platformPermissions,
      cspRoles: formData.cspSelection && formData.cspSelection.cspProvider && formData.cspSelection.cspProtocol ? [{
        roleName: formData.name,
        cspType: formData.cspSelection.cspProvider,
        idpIdentifier: "", // CSP 설정에서 가져와야 할 수 있음
        iamIdentifier: "", // CSP 설정에서 가져와야 할 수 있음
        iamRoleId: formData.name,
        tags: [{"key": "mciam-role", "value": "csp-role"}]
      }] : []
    };
    
    // API 호출
    const response = await RoleManager.saveRole(roleData);
    
    if (response) {
      // 폼 초기화
      UIManager.clearCreateForm();
      
      // create-mode-cards 숨기기
      UIManager.hideAllModes();
      
      // 역할 목록 새로고침
      await initRoles();
    }
    
  } catch (error) {
    // ErrorHandler.wrapAsync가 이미 에러를 처리하므로 여기서는 추가 처리하지 않음
    console.error('역할 저장 중 예상치 못한 오류:', error);
  }
}

// Platform 권한 가져오기
function getPlatformPermissions() {
  const tree = $('#platform-menu-create-tree').jstree(true);
  if (!tree) {
    return [];
  }
  
  const checkedNodes = tree.get_checked();
  const filteredNodes = checkedNodes.filter(nodeId => nodeId !== '#');
  
  return filteredNodes;
}

// Edit-mode 카드 토글 버튼 이벤트 리스너 설정
function setupEditCardToggleEventListeners() {
  // Platform 토글
  if (DOM.platformToggleEdit) {
    DOM.platformToggleEdit.removeEventListener("change", handlePlatformToggleEdit);
    DOM.platformToggleEdit.addEventListener("change", handlePlatformToggleEdit);
  }

  // Workspace 토글
  if (DOM.workspaceToggleEdit) {
    DOM.workspaceToggleEdit.removeEventListener("change", handleWorkspaceToggleEdit);
    DOM.workspaceToggleEdit.addEventListener("change", handleWorkspaceToggleEdit);
  }

  // CSP 토글
  if (DOM.cspToggleEdit) {
    DOM.cspToggleEdit.removeEventListener("change", handleCspToggleEdit);
    DOM.cspToggleEdit.addEventListener("change", handleCspToggleEdit);
  }
}

// Edit-mode 카드 토글 핸들러들
function handlePlatformToggleEdit(e) {
  const isChecked = e.target.checked;
  console.log("Edit Platform 토글 변경:", isChecked);
  UIManager.toggleEditCard('platform', isChecked);
}

function handleWorkspaceToggleEdit(e) {
  const isChecked = e.target.checked;
  console.log("Edit Workspace 토글 변경:", isChecked);
  UIManager.toggleEditCard('workspace', isChecked);
}

function handleCspToggleEdit(e) {
  const isChecked = e.target.checked;
  console.log("Edit CSP 토글 변경:", isChecked);
  UIManager.toggleEditCard('csp', isChecked);
}

// Edit 버튼 클릭 핸들러
function handleEditButtonClick(e) {
  e.preventDefault();

  if (!AppState.roles.selectedRole) {
    Utils.showAlert('편집할 역할을 선택해주세요.');
    return;
  }

  // Edit 모드 활성화
  showEditMode(AppState.roles.selectedRole);
}

// Edit Cancel 버튼 핸들러
function handleCancelEditButtonClick(e) {
  // 변경사항이 있으면 확인
  if (AppState.editingRole.hasChanges) {
    if (!confirm('저장하지 않은 변경사항이 있습니다. 정말 취소하시겠습니까?')) {
      return;
    }
  }

  // Edit 모드 숨기기
  UIManager.hideAllModes();
  updateAppState('ui.editMode', false);
  updateAppState('editingRole', { originalRole: null, modifiedRole: null, hasChanges: false });
}

// Edit Save Role 버튼 핸들러
function handleSaveEditRoleClick(e) {
  updateRole();
}

// Edit 모드 표시 함수
function showEditMode(role) {
  // Edit 모드 활성화
  UIManager.showEditMode();
  updateAppState('ui.editMode', true);
  updateAppState('ui.viewMode', false);
  updateAppState('ui.createMode', false);

  // 편집 중인 역할 정보 설정
  updateAppState('editingRole.originalRole', role);
  updateAppState('editingRole.modifiedRole', JSON.parse(JSON.stringify(role)));
  updateAppState('editingRole.hasChanges', false);

  // 폼에 기존 데이터 채우기
  populateEditForm(role);

  // Edit-mode 카드 상태 설정
  setupEditCardStates(role);
}

// Edit 폼에 데이터 채우기
function populateEditForm(role) {
  // 기본 정보
  if (DOM.editRoleNameInput) {
    DOM.editRoleNameInput.value = role.name || '';
  }
  if (DOM.editRoleDescriptionInput) {
    DOM.editRoleDescriptionInput.value = role.description || '';
  }
  if (DOM.editRoleNameText) {
    DOM.editRoleNameText.textContent = role.name || '';
  }

  // Platform 권한 설정
  if (role.role_subs && Utils.hasRoleType(role.role_subs, CONSTANTS.ROLE_TYPES.PLATFORM)) {
    UIManager.toggleEditCard('platform', true);
    // 메뉴 트리 초기화 및 기존 권한 체크
    initPlatformMenuEditTree().then(() => {
      updateEditMenuPermissions(role.id);
    });
  }

  // Workspace 권한 설정
  if (role.role_subs && Utils.hasRoleType(role.role_subs, CONSTANTS.ROLE_TYPES.WORKSPACE)) {
    UIManager.toggleEditCard('workspace', true);
    if (DOM.workspaceToggleEditInner) {
      DOM.workspaceToggleEditInner.checked = true;
    }
  }

  // CSP 권한 설정
  if (role.role_subs && Utils.hasRoleType(role.role_subs, CONSTANTS.ROLE_TYPES.CSP)) {
    UIManager.toggleEditCard('csp', true);
    // CSP 매핑 테이블 초기화
    initCspRoleMappingEditTable(role.id);
  }
}

// Edit 카드 상태 설정
function setupEditCardStates(role) {
  if (!role) {
    UIManager.initializeEditCardStates();
    UIManager.collapseAllEditCards();
    return;
  }

  const roleSubs = role.role_subs || [];
  const hasPlatform = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.PLATFORM);
  const hasWorkspace = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.WORKSPACE);
  const hasCsp = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.CSP);

  // Edit 카드 상태 업데이트
  AppState.ui.editCardStates.platform = { expanded: hasPlatform };
  AppState.ui.editCardStates.workspace = { expanded: hasWorkspace };
  AppState.ui.editCardStates.csp = { expanded: hasCsp };

  // 모든 Edit 카드 접기
  UIManager.collapseAllEditCards();
}

// Edit CSP Role Mapping 폼 초기화
function initEditCspRoleMappingForm() {
  // Edit CSP Provider 선택 이벤트
  const editCspProviderSelect = DOM.editCspProviderSelect;
  if (editCspProviderSelect) {
    editCspProviderSelect.addEventListener('change', function() {
      selectedEditCspProvider = this.value;
    });
  }
  
  // Edit Protocol 선택 이벤트
  const editCspProtocolSelect = DOM.editCspProtocolSelect;
  if (editCspProtocolSelect) {
    editCspProtocolSelect.addEventListener('change', function() {
      selectedEditCspProtocol = this.value;
    });
  }

  // Add CSP Mapping 버튼 이벤트
  const addCspMappingBtn = DOM.addCspMappingBtn;
  if (addCspMappingBtn) {
    addCspMappingBtn.addEventListener('click', handleAddCspMapping);
  }
}

// Edit CSP 선택 정보 반환 (저장 시 사용)
function getEditCspSelection() {
  return {
    cspProvider: selectedEditCspProvider,
    cspProtocol: selectedEditCspProtocol
  };
}

// CSP 매핑 추가 핸들러
function handleAddCspMapping() {
  const cspSelection = getEditCspSelection();
  
  if (!cspSelection.cspProvider || !cspSelection.cspProtocol) {
    Utils.showAlert('CSP Provider와 Protocol을 모두 선택해주세요.');
    return;
  }

  // 새로운 CSP 매핑을 테이블에 추가
  const newMapping = {
    id: Date.now(), // 임시 ID
    csp_type: cspSelection.cspProvider,
    name: AppState.roles.selectedRole.name,
    idp_identifier: "",
    iam_identifier: "",
    auth_method: cspSelection.cspProtocol.toUpperCase()
  };

  if (AppState.tables.cspRoleMappingEditTable) {
    const currentData = AppState.tables.cspRoleMappingEditTable.getData();
    currentData.push(newMapping);
    AppState.tables.cspRoleMappingEditTable.setData(currentData);
  }

  // 폼 초기화
  UIManager.clearEditCspSelection();
  
  // 변경사항 표시
  updateAppState('editingRole.hasChanges', true);
}

// CSP 매핑 삭제 함수 (전역 함수로 등록)
window.deleteCspMapping = function(mappingId) {
  if (confirm('이 CSP 매핑을 삭제하시겠습니까?')) {
    if (AppState.tables.cspRoleMappingEditTable) {
      const currentData = AppState.tables.cspRoleMappingEditTable.getData();
      const filteredData = currentData.filter(item => item.id !== mappingId);
      AppState.tables.cspRoleMappingEditTable.setData(filteredData);
      
      // 변경사항 표시
      updateAppState('editingRole.hasChanges', true);
    }
  }
};

// Edit Platform 권한 가져오기
function getEditPlatformPermissions() {
  const tree = $('#platform-menu-edit-tree').jstree(true);
  if (!tree) {
    return [];
  }
  
  const checkedNodes = tree.get_checked();
  const filteredNodes = checkedNodes.filter(nodeId => nodeId !== '#');
  
  return filteredNodes;
}

// 역할 업데이트 함수
async function updateRole() {
  try {
    const roleName = DOM.editRoleNameInput.value;
    const roleDescription = DOM.editRoleDescriptionInput.value;
    
    // 토글 상태 확인
    const isPlatformToggleOn = AppState.ui.editCardStates.platform.expanded;
    const isWorkspaceToggleOn = AppState.ui.editCardStates.workspace.expanded;
    const isCspToggleOn = AppState.ui.editCardStates.csp.expanded;
    
    // 폼 데이터 수집 (토글 상태에 따라 필터링)
    const formData = {
      name: roleName,
      description: roleDescription,
      platformPermissions: isPlatformToggleOn ? getEditPlatformPermissions() : [],
      workspaceEnabled: isWorkspaceToggleOn ? (DOM.workspaceToggleEditInner ? DOM.workspaceToggleEditInner.checked : false) : false,
      cspSelection: isCspToggleOn ? getEditCspSelection() : null
    };
    
    // 폼 검증
    const validationErrors = RoleManager.validateRoleData(formData);
    if (validationErrors.length > 0) {
      Utils.showAlert(validationErrors.join('\n'));
      return;
    }
    
    // 역할 타입 결정 (토글 상태에 따라)
    const roleTypes = RoleManager.determineRoleTypes(
      formData.platformPermissions, 
      formData.workspaceEnabled, 
      formData.cspSelection
    );
    
    // CSP 역할 데이터 수집
    let cspRoles = [];
    if (isCspToggleOn && AppState.tables.cspRoleMappingEditTable) {
      const cspData = AppState.tables.cspRoleMappingEditTable.getData();
      cspRoles = cspData.map(cspRole => ({
        roleName: cspRole.name,
        cspType: cspRole.csp_type,
        idpIdentifier: cspRole.idp_identifier || "",
        iamIdentifier: cspRole.iam_identifier || "",
        iamRoleId: cspRole.name,
        tags: [{"key": "mciam-role", "value": "csp-role"}]
      }));
    }
    
    // 역할 수정 데이터 구성
    const roleData = {
      name: formData.name,
      description: formData.description,
      roleTypes: roleTypes,
      menuIds: formData.platformPermissions,
      cspRoles: cspRoles
    };
    
    // API 호출
    const response = await RoleManager.updateRole(AppState.roles.selectedRole.id, roleData);
    
    if (response) {
      // Edit 모드 숨기기
      UIManager.hideAllModes();
      updateAppState('ui.editMode', false);
      updateAppState('editingRole', { originalRole: null, modifiedRole: null, hasChanges: false });
      
      // 역할 목록 새로고침
      await initRoles();
    }
    
  } catch (error) {
    // ErrorHandler.wrapAsync가 이미 에러를 처리하므로 여기서는 추가 처리하지 않음
    console.error('역할 수정 중 예상치 못한 오류:', error);
  }
}

