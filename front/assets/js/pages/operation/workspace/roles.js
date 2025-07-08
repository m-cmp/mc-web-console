import { TabulatorFull as Tabulator } from "tabulator-tables";
import 'jstree';

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
  .ti-chevron-down, .ti-chevron-up {
    transition: transform 0.2s ease-in-out;
  }
  
  .ti-chevron-up {
    transform: rotate(180deg);
  }
  
  .btn-link {
    color: #6c757d;
    text-decoration: none;
  }
  
  .btn-link:hover {
    color: #495057;
  }
`;
document.head.appendChild(style);

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
  cspRoleNameInput: document.getElementById('csp-role-name-input'),
  addCspRoleBtn: document.getElementById('add-csp-role-btn'),
  createCspRoleMappingTable: document.getElementById('create-csp-role-mapping-table'),
  // View-mode 토글 버튼들
  platformToggleBtn: document.getElementById('platform-toggle-btn'),
  platformArrow: document.getElementById('platform-arrow'),
  workspaceToggleBtn: document.getElementById('workspace-toggle-btn'),
  workspaceArrow: document.getElementById('workspace-arrow'),
  cspToggleBtn: document.getElementById('csp-toggle-btn'),
  cspArrow: document.getElementById('csp-arrow'),
  // Workspace 카드 내부의 토글들
  workspaceToggleViewInner: document.getElementById('workspace-toggle-view'),
  workspaceToggleCreateInner: document.getElementById('workspace-toggle-create-inner'),
  // Create-mode 토글 버튼들
  platformToggleBtnCreate: document.getElementById('platform-toggle-btn-create'),
  platformArrowCreate: document.getElementById('platform-arrow-create'),
  workspaceToggleBtnCreate: document.getElementById('workspace-toggle-btn-create'),
  workspaceArrowCreate: document.getElementById('workspace-arrow-create'),
  cspToggleBtnCreate: document.getElementById('csp-toggle-btn-create'),
  cspArrowCreate: document.getElementById('csp-arrow-create'),
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
  platformToggleBtnEdit: document.getElementById('platform-toggle-btn-edit'),
  platformArrowEdit: document.getElementById('platform-arrow-edit'),
  workspaceToggleBtnEdit: document.getElementById('workspace-toggle-btn-edit'),
  workspaceArrowEdit: document.getElementById('workspace-arrow-edit'),
  workspaceToggleEditInner: document.getElementById('workspace-toggle-edit-inner'),
  cspToggleBtnEdit: document.getElementById('csp-toggle-btn-edit'),
  cspArrowEdit: document.getElementById('csp-arrow-edit'),
  // Edit-mode 카드 바디들
  platformMenuEditBody: document.getElementById('platform-menu-edit-body'),
  workspaceMenuEditBody: document.getElementById('workspace-menu-edit-body'),
  cspRoleMappingEditBody: document.getElementById('csp-role-mapping-edit-body'),
  // Edit-mode CSP 관련
  cspRoleMappingEditTable: document.getElementById('csp-role-mapping-edit-table'),
  cspRoleMappingEditEmpty: document.getElementById('csp-role-mapping-edit-empty'),
  editCspProviderSelect: document.getElementById('edit-csp-provider-select'),
  editCspRoleNameInput: document.getElementById('edit-csp-role-name-input'),
  addCspMappingBtn: document.getElementById('add-csp-mapping-btn'),
  // Edit-mode 버튼들
  saveEditRoleBtn: document.getElementById('save-edit-role-btn'),
  cancelEditRoleBtn: document.getElementById('cancel-edit-role-btn'),
  platformHeader: document.getElementById('platform-header'),
  workspaceHeader: document.getElementById('workspace-header'),
  cspHeader: document.getElementById('csp-header'),
  platformHeaderCreate: document.getElementById('platform-header-create'),
  workspaceHeaderCreate: document.getElementById('workspace-header-create'),
  cspHeaderCreate: document.getElementById('csp-header-create'),
  platformHeaderEdit: document.getElementById('platform-header-edit'),
  workspaceHeaderEdit: document.getElementById('workspace-header-edit'),
  cspHeaderEdit: document.getElementById('csp-header-edit')
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
      roleName: ''
    }
  },
  
  // CSP Role Mapping 상태
  cspRoleMappings: {
    create: [], // Create 모드에서 추가된 CSP Role 목록
    edit: []    // Edit 모드에서 추가된 CSP Role 목록
  },
  
  // 테이블 인스턴스들
  tables: {
    rolesTable: null,
    platformMenuTable: null,
    cspRoleMappingTable: null,
    createCspRoleMappingTable: null
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
    if (roleData.cspSelection && roleData.cspSelection.cspRoles && roleData.cspSelection.cspRoles.length > 0) {
      // CSP Role이 있으면 검증
      roleData.cspSelection.cspRoles.forEach((cspRole, index) => {
        if (!cspRole.csp_type || !cspRole.name) {
          errors.push(`CSP Role ${index + 1}: CSP Provider와 Role Name이 모두 필요합니다.`);
        }
      });
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
    if (cspSelection && cspSelection.cspRoles && cspSelection.cspRoles.length > 0) {
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
    
    let cardBody, arrowElement;
    
    switch (cardType) {
      case 'platform':
        cardBody = DOM.platformMenuEditBody;
        arrowElement = DOM.platformArrowEdit;
        break;
      case 'workspace':
        cardBody = DOM.workspaceMenuEditBody;
        arrowElement = DOM.workspaceArrowEdit;
        break;
      case 'csp':
        cardBody = DOM.cspRoleMappingEditBody;
        arrowElement = DOM.cspArrowEdit;
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
    
    if (arrowElement) {
      if (expand) {
        arrowElement.classList.remove('ti-chevron-down');
        arrowElement.classList.add('ti-chevron-up');
      } else {
        arrowElement.classList.remove('ti-chevron-up');
        arrowElement.classList.add('ti-chevron-down');
      }
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
    if (DOM.platformArrowEdit) {
      DOM.platformArrowEdit.classList.remove('ti-chevron-up');
      DOM.platformArrowEdit.classList.add('ti-chevron-down');
    }
    if (DOM.workspaceArrowEdit) {
      DOM.workspaceArrowEdit.classList.remove('ti-chevron-up');
      DOM.workspaceArrowEdit.classList.add('ti-chevron-down');
    }
    if (DOM.cspArrowEdit) {
      DOM.cspArrowEdit.classList.remove('ti-chevron-up');
      DOM.cspArrowEdit.classList.add('ti-chevron-down');
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
    if (DOM.editCspRoleNameInput) {
      DOM.editCspRoleNameInput.value = '';
    }
    selectedEditCspProvider = '';
    selectedEditCspRoleName = '';
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
    // 모든 access available 상태 숨기기
    this.hideAllAccessAvailable();
  },

  // 카드 토글 버튼 표시/숨김 설정
  setCardToggleVisibility(platformVisible, workspaceVisible, cspVisible) {
    // Platform 토글
    if (DOM.platformToggleBtn) {
      DOM.platformToggleBtn.style.display = platformVisible ? 'block' : 'none';
    }
    if (DOM.platformHeader) {
      if (!platformVisible) {
        DOM.platformHeader.setAttribute('tabIndex', '-1');
        DOM.platformHeader.setAttribute('aria-disabled', 'true');
        DOM.platformHeader.style.cursor = 'default';
      } else {
        DOM.platformHeader.removeAttribute('tabIndex');
        DOM.platformHeader.removeAttribute('aria-disabled');
        DOM.platformHeader.style.cursor = 'pointer';
      }
    }
    // Workspace 토글
    if (DOM.workspaceToggleBtn) {
      DOM.workspaceToggleBtn.style.display = workspaceVisible ? 'block' : 'none';
    }
    if (DOM.workspaceHeader) {
      if (!workspaceVisible) {
        DOM.workspaceHeader.setAttribute('tabIndex', '-1');
        DOM.workspaceHeader.setAttribute('aria-disabled', 'true');
        DOM.workspaceHeader.style.cursor = 'default';
      } else {
        DOM.workspaceHeader.removeAttribute('tabIndex');
        DOM.workspaceHeader.removeAttribute('aria-disabled');
        DOM.workspaceHeader.style.cursor = 'pointer';
      }
    }
    // CSP 토글
    if (DOM.cspToggleBtn) {
      DOM.cspToggleBtn.style.display = cspVisible ? 'block' : 'none';
    }
    if (DOM.cspHeader) {
      if (!cspVisible) {
        DOM.cspHeader.setAttribute('tabIndex', '-1');
        DOM.cspHeader.setAttribute('aria-disabled', 'true');
        DOM.cspHeader.style.cursor = 'default';
      } else {
        DOM.cspHeader.removeAttribute('tabIndex');
        DOM.cspHeader.removeAttribute('aria-disabled');
        DOM.cspHeader.style.cursor = 'pointer';
      }
    }
  },

  // 카드 펼침/접힘 처리
  toggleCard(cardType, expand) {
    const cardState = AppState.ui.cardStates[cardType];
    if (!cardState) return;

    cardState.expanded = expand;
    
    let cardBody, arrowElement;
    
    switch (cardType) {
      case 'platform':
        cardBody = DOM.platformMenuBody;
        arrowElement = DOM.platformArrow;
        break;
      case 'workspace':
        cardBody = DOM.workspaceMenuBody;
        arrowElement = DOM.workspaceArrow;
        break;
      case 'csp':
        cardBody = DOM.cspRoleMappingBody;
        arrowElement = DOM.cspArrow;
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
    
    if (arrowElement) {
      if (expand) {
        arrowElement.classList.remove('ti-chevron-down');
        arrowElement.classList.add('ti-chevron-up');
      } else {
        arrowElement.classList.remove('ti-chevron-up');
        arrowElement.classList.add('ti-chevron-down');
      }
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
      // 모든 access available 상태 숨기기
      this.hideAllAccessAvailable();
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
    
    // 역할의 권한에 따라 access available 상태 설정
    this.setAccessAvailableStates(hasPlatform, hasWorkspace, hasCsp);
  },

  // 모든 토글 버튼을 OFF로 초기화
  resetAllToggles() {
    if (DOM.platformArrow) {
      DOM.platformArrow.classList.remove('ti-chevron-up');
      DOM.platformArrow.classList.add('ti-chevron-down');
    }
    if (DOM.workspaceArrow) {
      DOM.workspaceArrow.classList.remove('ti-chevron-up');
      DOM.workspaceArrow.classList.add('ti-chevron-down');
    }
    if (DOM.cspArrow) {
      DOM.cspArrow.classList.remove('ti-chevron-up');
      DOM.cspArrow.classList.add('ti-chevron-down');
    }
  },

  // 모든 access available 상태 숨기기
  hideAllAccessAvailable() {
    if (DOM.platformMenuStatus) {
      DOM.platformMenuStatus.style.display = 'none';
    }
    const workspaceStatusElement = document.getElementById('workspace-menu-status');
    if (workspaceStatusElement) {
      workspaceStatusElement.style.display = 'none';
    }
    const cspStatusElement = document.getElementById('csp-menu-status');
    if (cspStatusElement) {
      cspStatusElement.style.display = 'none';
    }
  },

  // 역할의 권한에 따라 access available 상태 설정
  setAccessAvailableStates(hasPlatform, hasWorkspace, hasCsp) {
    // Platform access available
    if (DOM.platformMenuStatus) {
      DOM.platformMenuStatus.style.display = hasPlatform ? 'inline' : 'none';
    }
    
    // Workspace access available
    const workspaceStatusElement = document.getElementById('workspace-menu-status');
    if (workspaceStatusElement) {
      workspaceStatusElement.style.display = hasWorkspace ? 'inline' : 'none';
    }
    
    // CSP Role access available
    const cspStatusElement = document.getElementById('csp-menu-status');
    if (cspStatusElement) {
      cspStatusElement.style.display = hasCsp ? 'inline' : 'none';
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
      } else {
        DOM.platformMenuBody.classList.remove('show');
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
  
  // CSP Role Mapping 상태 초기화
  AppState.cspRoleMappings.create = [];
  if (AppState.tables.createCspRoleMappingTable) {
    AppState.tables.createCspRoleMappingTable.clearData();
  }
  
  // Create-mode 카드 상태 초기화
  UIManager.initializeCreateCardStates();
  UIManager.collapseAllCreateCards();
  },

  // CSP 선택 초기화
  clearCspSelection() {
    if (DOM.cspProviderSelect) {
      DOM.cspProviderSelect.value = '';
    }
    if (DOM.cspRoleNameInput) {
      DOM.cspRoleNameInput.value = '';
    }
    selectedCspProvider = '';
    selectedCspRoleName = '';
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
    
    let cardBody, arrowElement;
    
    switch (cardType) {
      case 'platform':
        cardBody = DOM.platformMenuCreateBody;
        arrowElement = DOM.platformArrowCreate;
        break;
      case 'workspace':
        cardBody = DOM.workspaceMenuCreateBody;
        arrowElement = DOM.workspaceArrowCreate;
        break;
      case 'csp':
        cardBody = DOM.cspRoleMappingCreateBody;
        arrowElement = DOM.cspArrowCreate;
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
    
    if (arrowElement) {
      if (expand) {
        arrowElement.classList.remove('ti-chevron-down');
        arrowElement.classList.add('ti-chevron-up');
      } else {
        arrowElement.classList.remove('ti-chevron-up');
        arrowElement.classList.add('ti-chevron-down');
      }
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
    if (DOM.platformArrowCreate) {
      DOM.platformArrowCreate.classList.remove('ti-chevron-up');
      DOM.platformArrowCreate.classList.add('ti-chevron-down');
    }
    if (DOM.workspaceArrowCreate) {
      DOM.workspaceArrowCreate.classList.remove('ti-chevron-up');
      DOM.workspaceArrowCreate.classList.add('ti-chevron-down');
    }
    if (DOM.cspArrowCreate) {
      DOM.cspArrowCreate.classList.remove('ti-chevron-up');
      DOM.cspArrowCreate.classList.add('ti-chevron-down');
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
      
      // Role Types 업데이트 (제거됨 - Role Detail에서 Role Types 컬럼 삭제)
      const roleSubs = selectedRole.role_subs || [];
      const hasPlatform = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.PLATFORM);
      const hasWorkspace = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.WORKSPACE);
      const hasCsp = Utils.hasRoleType(roleSubs, CONSTANTS.ROLE_TYPES.CSP);
      
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
        
        // 트리 초기화 완료 - 권한 업데이트는 handleRoleRowClick에서 처리됨
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
        "checkbox": {
          "keep_selected_style": true,
          "three_state": true,
          "cascade": "up"
        },
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
          "check_callback": false,
          "multiple": true
        },
        "plugins": ["types", "checkbox"],
        "checkbox": {
          "keep_selected_style": true,
          "three_state": true,
          "cascade": "up"
        },
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
        
        // 체크박스 이벤트 핸들러 추가
        $('#platform-menu-edit-tree').on('check_node.jstree uncheck_node.jstree', function (e, data) {
          // 변경사항 표시
          updateAppState('editingRole.hasChanges', true);
        });
        
        // 트리 초기화 시 모든 체크박스 해제
        $('#platform-menu-edit-tree').jstree(true).uncheck_all();
        
        // 현재 선택된 역할이 있으면 권한 업데이트 실행
        if (AppState.roles.selectedRole && AppState.roles.selectedRole.id) {
          setTimeout(() => {
            updateEditMenuPermissions(AppState.roles.selectedRole.id);
          }, 100);
        }
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

  // 헤더 클릭 이벤트 리스너 설정
  setupHeaderClickEvents();

  // CSP Role Mapping 폼 초기화
  initCspRoleMappingForm();
  
  // Edit CSP Role Mapping 폼 초기화
  initEditCspRoleMappingForm().catch(error => {
    console.error('Edit CSP Role Mapping 폼 초기화 실패:', error);
  });
  
  // Role Name 입력 시 CSP Role Name 자동 업데이트
  const roleNameInput = DOM.roleNameInput;
  if (roleNameInput) {
    roleNameInput.addEventListener('input', function() {
      // CSP 카드가 열려있으면 CSP Role Name 자동 업데이트
      if (AppState.ui.createCardStates.csp.expanded) {
        updateCspRoleName();
      }
    });
  }
}

// 카드 토글 버튼 이벤트 리스너 설정 (View-mode용)
function setupCardToggleEventListeners() {
  // Platform 토글
  if (DOM.platformToggleBtn) {
    DOM.platformToggleBtn.removeEventListener("click", handlePlatformToggle);
    DOM.platformToggleBtn.addEventListener("click", handlePlatformToggle);
  }

  // Workspace 토글
  if (DOM.workspaceToggleBtn) {
    DOM.workspaceToggleBtn.removeEventListener("click", handleWorkspaceToggle);
    DOM.workspaceToggleBtn.addEventListener("click", handleWorkspaceToggle);
  }

  // CSP 토글
  if (DOM.cspToggleBtn) {
    DOM.cspToggleBtn.removeEventListener("click", handleCspToggle);
    DOM.cspToggleBtn.addEventListener("click", handleCspToggle);
  }
}

// View-mode 카드 토글 핸들러들
function handlePlatformToggle(e) {
  if (!AppState.ui.cardStates.platform.visible) return;
  const isExpanded = DOM.platformMenuBody.classList.contains('show');
  UIManager.toggleCard('platform', !isExpanded);
}

function handleWorkspaceToggle(e) {
  if (!AppState.ui.cardStates.workspace.visible) return;
  const isExpanded = DOM.workspaceMenuBody.classList.contains('show');
  UIManager.toggleCard('workspace', !isExpanded);
}

function handleCspToggle(e) {
  if (!AppState.ui.cardStates.csp.visible) return;
  const isExpanded = DOM.cspRoleMappingBody.classList.contains('show');
  UIManager.toggleCard('csp', !isExpanded);
}

// Create-mode 카드 토글 버튼 이벤트 리스너 설정
function setupCreateCardToggleEventListeners() {
  // Platform 토글
  if (DOM.platformToggleBtnCreate) {
    DOM.platformToggleBtnCreate.removeEventListener("click", handlePlatformToggleCreate);
    DOM.platformToggleBtnCreate.addEventListener("click", handlePlatformToggleCreate);
  }

  // Workspace 토글
  if (DOM.workspaceToggleBtnCreate) {
    DOM.workspaceToggleBtnCreate.removeEventListener("click", handleWorkspaceToggleCreate);
    DOM.workspaceToggleBtnCreate.addEventListener("click", handleWorkspaceToggleCreate);
  }

  // CSP 토글
  if (DOM.cspToggleBtnCreate) {
    DOM.cspToggleBtnCreate.removeEventListener("click", handleCspToggleCreate);
    DOM.cspToggleBtnCreate.addEventListener("click", handleCspToggleCreate);
  }
}

// Create-mode 카드 토글 핸들러들
function handlePlatformToggleCreate(e) {
  const isExpanded = DOM.platformMenuCreateBody.classList.contains('show');
  console.log("Create Platform 토글 변경:", !isExpanded);
  UIManager.toggleCreateCard('platform', !isExpanded);
}

function handleWorkspaceToggleCreate(e) {
  const isExpanded = DOM.workspaceMenuCreateBody.classList.contains('show');
  console.log("Create Workspace 토글 변경:", !isExpanded);
  UIManager.toggleCreateCard('workspace', !isExpanded);
}

function handleCspToggleCreate(e) {
  const isExpanded = DOM.cspRoleMappingCreateBody.classList.contains('show');
  console.log("Create CSP 토글 변경:", !isExpanded);
  
  if (!isExpanded) {
    // Role Name이 입력되지 않았으면 토글을 비활성화
    const roleName = DOM.roleNameInput ? DOM.roleNameInput.value : '';
    if (!roleName || !roleName.trim()) {
      Utils.showAlert('CSP Role Mapping을 사용하려면 먼저 Role Name을 입력해주세요.');
      return;
    }
    
    // CSP Role Name 자동 설정
    updateCspRoleName();
  }
  
  UIManager.toggleCreateCard('csp', !isExpanded);
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
  // edit-mode-cards 숨기기 (Edit 모드에서 Add 버튼 클릭 시)
  if (DOM.editModeCards) {
    DOM.editModeCards.classList.remove('show');
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
  updateAppState('ui.editMode', false);
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
    
    // 트리가 없으면 생성 (지연 초기화)
    if (!$("#platform-menu-edit-tree").jstree(true)) {
      await initPlatformMenuEditTree();
    }
    
    // getMappedMenusByRoleList API 호출
    const response = await webconsolejs["common/api/services/roles_api"].getMappedMenusByRoleList(roleId);
    
    // response가 null, undefined, 빈 배열인 경우 처리
    if (!response || (Array.isArray(response) && response.length === 0)) {
      // 모든 체크박스 해제
      $('#platform-menu-edit-tree').jstree(true).uncheck_all();
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
    $('#platform-menu-edit-tree').jstree(true).uncheck_all();

    // 실제 체크된 노드 확인
    const uncheckedNodes = $('#platform-menu-edit-tree').jstree(true).get_checked();

    // 권한이 있는 메뉴들만 체크
    let checkedCount = 0;
    authorizedMenuIds.forEach(menuId => {
      const node = $('#platform-menu-edit-tree').jstree(true).get_node(menuId);
      if (node && node.id !== '#') {
        $('#platform-menu-edit-tree').jstree(true).check_node(node);
        checkedCount++;
      }
    });
        
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
      // View 모드: Actions 컬럼 없이 생성
      const cspRoleMappingTable = new Tabulator("#csp-role-mapping-table", {
        data: [],
        layout: "fitDataFill",
        height: "300px",
        pagination: true,
        paginationSize: 7,
        paginationSizeSelector: [7, 14, 21],
        reactiveData: true,
        columns: [
          {
            title: "CSP",
            field: "csp_type",
            headerSort: false,
            width: "40%",
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
            width: "60%"
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
        layout: "fitDataFill",
        height: "300px",
        pagination: true,
        paginationSize: 7,
        paginationSizeSelector: [7, 14, 21],
        reactiveData: true,
        columns: [
          {
            title: "CSP",
            field: "csp_type",
            headerSort: false,
            width: "30%",
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
            width: "50%"
          },
          {
            title: "Actions",
            headerSort: false,
            width: "20%",
            formatter: function (cell) {
              return '<button class="btn btn-sm btn-outline-danger" onclick="deleteCspMapping(' + cell.getRow().getData().id + ')">Delete</button>';
            }
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
    
    // API 응답이 null이거나 undefined인 경우 빈 테이블 표시
    if (!response) {
      console.log("Edit CSP 역할 매핑 데이터가 없습니다. (API 응답: null)");
      if (table) {
        table.setData([]);
      }
      showCspContent(true, false);
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
        showCspContent(true, false);
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
        showCspContent(true, false);
      }
    } else {
      // cspRoles 속성이 없는 경우 빈 테이블 표시
      console.log("Edit CSP 역할 매핑 데이터가 없습니다. (cspRoles 속성 없음)");
      if (table) {
        table.setData([]);
      }
      showCspContent(true, false);
    }
    
    console.log("Edit CSP 역할 매핑 데이터 로드 완료");
    
  } catch (error) {
    console.error("Edit CSP 역할 매핑 데이터 로드 중 오류 발생:", error);
    // 오류가 발생해도 테이블을 빈 배열로 설정하고 테이블 표시
    if (table) {
      table.setData([]);
    }
    if (DOM.cspRoleMappingEditTable) {
      DOM.cspRoleMappingEditTable.style.display = 'block';
    }
    if (DOM.cspRoleMappingEditEmpty) {
      DOM.cspRoleMappingEditEmpty.style.display = 'none';
    }
  }
}

// CSP Role Mapping 관련 변수
let selectedCspProvider = '';
let selectedCspRoleName = '';

// Edit CSP Role Mapping 관련 변수
let selectedEditCspProvider = '';
let selectedEditCspRoleName = '';

// CSP Role Mapping 폼 초기화
async function initCspRoleMappingForm() {
  // CSP Provider 드롭다운 초기화
  await initCspProviderDropdown();
  
  // CSP Provider 선택 이벤트
  const cspProviderSelect = DOM.cspProviderSelect;
  if (cspProviderSelect) {
    cspProviderSelect.addEventListener('change', function() {
      selectedCspProvider = this.value;
    });
  }
  
  // CSP Role Name 입력 이벤트
  const cspRoleNameInput = DOM.cspRoleNameInput;
  if (cspRoleNameInput) {
    cspRoleNameInput.addEventListener('input', function() {
      selectedCspRoleName = this.value;
    });
  }
  
  // Add 버튼 이벤트
  const addCspRoleBtn = DOM.addCspRoleBtn;
  if (addCspRoleBtn) {
    addCspRoleBtn.addEventListener('click', handleAddCspRole);
  }
  
  // Create CSP Role Mapping 테이블 초기화
  await initCreateCspRoleMappingTable();
}

// CSP Provider 드롭다운 초기화
async function initCspProviderDropdown() {
  try {
    const providers = await webconsolejs["common/api/services/roles_api"].getCspProviderList();
    const cspProviderSelect = DOM.cspProviderSelect;
    
    if (cspProviderSelect && providers && Array.isArray(providers)) {
      // 기존 옵션 제거
      cspProviderSelect.innerHTML = '<option value="">Select CSP Provider</option>';
      
      // 새 옵션 추가
      providers.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider;
        option.textContent = provider.toUpperCase();
        cspProviderSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('CSP Provider 드롭다운 초기화 실패:', error);
  }
}

// Edit CSP Provider 드롭다운 초기화
async function initEditCspProviderDropdown() {
  try {
    const providers = await webconsolejs["common/api/services/roles_api"].getCspProviderList();
    const editCspProviderSelect = DOM.editCspProviderSelect;
    
    if (editCspProviderSelect && providers && Array.isArray(providers)) {
      // 기존 옵션 제거
      editCspProviderSelect.innerHTML = '<option value="">Select CSP Provider</option>';
      
      // 새 옵션 추가
      providers.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider;
        option.textContent = provider.toUpperCase();
        editCspProviderSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Edit CSP Provider 드롭다운 초기화 실패:', error);
  }
}

// Create CSP Role Mapping 테이블 초기화
async function initCreateCspRoleMappingTable() {
  return new Promise((resolve, reject) => {
    console.log("Create CSP Role Mapping 테이블 초기화 시작");

    // 테이블 요소 확인
    const tableElement = DOM.createCspRoleMappingTable;
    if (!tableElement) {
      console.error("create-csp-role-mapping-table 요소를 찾을 수 없습니다.");
      reject(new Error("Table element not found"));
      return;
    }

    try {
      const createCspRoleMappingTable = new Tabulator("#create-csp-role-mapping-table", {
        data: [],
        layout: "fitDataFill",
        height: "200px",
        pagination: false,
        reactiveData: true,
        columns: [
          {
            title: "CSP",
            field: "csp_type",
            headerSort: false,
            width: "30%",
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
            width: "50%"
          },
          {
            title: "Actions",
            headerSort: false,
            width: "20%",
            formatter: function (cell) {
              return '<button class="btn btn-sm btn-outline-danger" onclick="deleteCreateCspMapping(' + cell.getRow().getData().id + ')">Delete</button>';
            }
          }
        ]
      });

      // 테이블 초기화 완료 후 이벤트 리스너 설정
      createCspRoleMappingTable.on("tableBuilt", function () {
        console.log("Create CSP Role Mapping 테이블 초기화 완료");
        resolve();
      });

      // AppState에 테이블 인스턴스 저장
      AppState.tables.createCspRoleMappingTable = createCspRoleMappingTable;

    } catch (error) {
      console.error("Create CSP Role Mapping 테이블 초기화 중 오류 발생:", error);
      reject(error);
    }
  });
}

// CSP Role 추가 핸들러
function handleAddCspRole() {
  const cspProvider = selectedCspProvider;
  const cspRoleName = selectedCspRoleName;
  
  // 입력값 검증
  if (!cspProvider) {
    Utils.showAlert('CSP Provider를 선택해주세요.');
    return;
  }
  
  if (!cspRoleName || !cspRoleName.trim()) {
    Utils.showAlert('CSP Role Name을 입력해주세요.');
    return;
  }
  
  // 중복 검사 - CSP Provider와 Role Name 조합으로 검증
  const existingMapping = AppState.cspRoleMappings.create.find(
    mapping => mapping.csp_type === cspProvider && mapping.name === cspRoleName.trim()
  );
  
  if (existingMapping) {
    Utils.showAlert(`이미 추가된 CSP Role입니다.\nCSP: ${cspProvider.toUpperCase()}, Role Name: ${cspRoleName.trim()}`);
    return;
  }
  
  // CSP Provider만 중복인 경우도 검증
  const existingCspProvider = AppState.cspRoleMappings.create.find(
    mapping => mapping.csp_type === cspProvider
  );
  
  if (existingCspProvider) {
    Utils.showAlert(`이미 ${cspProvider.toUpperCase()} CSP Provider가 추가되어 있습니다.\n하나의 역할에는 하나의 CSP Provider만 추가할 수 있습니다.`);
    return;
  }
  
  // 새 CSP Role 추가
  const newCspRole = {
    id: Date.now(), // 임시 ID
    csp_type: cspProvider,
    name: cspRoleName.trim()
  };
  
  AppState.cspRoleMappings.create.push(newCspRole);
  
  // 테이블에 추가
  if (AppState.tables.createCspRoleMappingTable) {
    AppState.tables.createCspRoleMappingTable.addData(newCspRole);
  }
  
  // 입력 필드 초기화
  if (DOM.cspProviderSelect) {
    DOM.cspProviderSelect.value = '';
  }
  if (DOM.cspRoleNameInput) {
    // Role Name이 있으면 MCIAM_ 접두사로 초기화, 없으면 빈 값
    const roleName = DOM.roleNameInput ? DOM.roleNameInput.value : '';
    if (roleName && roleName.trim()) {
      const cspRoleName = `MCIAM_${roleName.trim()}`;
      DOM.cspRoleNameInput.value = cspRoleName;
      selectedCspRoleName = cspRoleName;
    } else {
      DOM.cspRoleNameInput.value = '';
      selectedCspRoleName = '';
    }
  }
  selectedCspProvider = '';
  
  console.log('CSP Role 추가됨:', newCspRole);
}

// Create CSP Role 삭제 함수 (전역 함수)
window.deleteCreateCspMapping = function(id) {
  // AppState에서 제거
  AppState.cspRoleMappings.create = AppState.cspRoleMappings.create.filter(
    mapping => mapping.id !== id
  );
  
  // 테이블에서 제거
  if (AppState.tables.createCspRoleMappingTable) {
    AppState.tables.createCspRoleMappingTable.deleteRow(id);
  }
  
  console.log('CSP Role 삭제됨:', id);
};

// CSP Role Name 자동 설정 함수
function updateCspRoleName() {
  const roleName = DOM.roleNameInput ? DOM.roleNameInput.value : '';
  const cspRoleNameInput = DOM.cspRoleNameInput;
  
  if (cspRoleNameInput && roleName) {
    const cspRoleName = `MCIAM_${roleName}`;
    cspRoleNameInput.value = cspRoleName;
    selectedCspRoleName = cspRoleName;
  }
}

// CSP 선택 정보 반환 (저장 시 사용)
function getCspSelection() {
  return {
    cspRoles: AppState.cspRoleMappings.create
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
      cspRoles: formData.cspSelection && formData.cspSelection.cspRoles && formData.cspSelection.cspRoles.length > 0 ? 
        formData.cspSelection.cspRoles.map(cspRole => ({
          roleName: cspRole.name,
          cspType: cspRole.csp_type,
          idpIdentifier: "", // 향후 확장 가능
          iamIdentifier: "", // 향후 확장 가능
          iamRoleId: cspRole.name,
          tags: [{"key": "mciam-role", "value": "csp-role"}]
        })) : []
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
      
      // 페이지를 맨 위로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
  if (DOM.platformToggleBtnEdit) {
    DOM.platformToggleBtnEdit.removeEventListener("click", handlePlatformToggleEdit);
    DOM.platformToggleBtnEdit.addEventListener("click", handlePlatformToggleEdit);
  }

  // Workspace 토글
  if (DOM.workspaceToggleBtnEdit) {
    DOM.workspaceToggleBtnEdit.removeEventListener("click", handleWorkspaceToggleEdit);
    DOM.workspaceToggleBtnEdit.addEventListener("click", handleWorkspaceToggleEdit);
  }

  // CSP 토글
  if (DOM.cspToggleBtnEdit) {
    DOM.cspToggleBtnEdit.removeEventListener("click", handleCspToggleEdit);
    DOM.cspToggleBtnEdit.addEventListener("click", handleCspToggleEdit);
  }
}

// Edit-mode 카드 토글 핸들러들
function handlePlatformToggleEdit(e) {
  const isExpanded = DOM.platformMenuEditBody.classList.contains('show');
  console.log("Edit Platform 토글 변경:", !isExpanded);
  UIManager.toggleEditCard('platform', !isExpanded);
}

function handleWorkspaceToggleEdit(e) {
  const isExpanded = DOM.workspaceMenuEditBody.classList.contains('show');
  console.log("Edit Workspace 토글 변경:", !isExpanded);
  UIManager.toggleEditCard('workspace', !isExpanded);
}

function handleCspToggleEdit(e) {
  const isExpanded = DOM.cspRoleMappingEditBody.classList.contains('show');
  console.log("Edit CSP 토글 변경:", !isExpanded);
  UIManager.toggleEditCard('csp', !isExpanded);
  
  // 카드가 펼쳐질 때 CSP Role 매핑 테이블 초기화 및 CSP Role Name 자동 설정
  if (!isExpanded && AppState.roles.selectedRole) {
    initCspRoleMappingEditTable(AppState.roles.selectedRole.id);
    
    // CSP Role Name 자동 설정
    if (DOM.editCspRoleNameInput && AppState.roles.selectedRole.name) {
      const cspRoleName = `MCIAM_${AppState.roles.selectedRole.name}`;
      DOM.editCspRoleNameInput.value = cspRoleName;
      selectedEditCspRoleName = cspRoleName;
    }
  }
}

// Edit 버튼 클릭 핸들러
async function handleEditButtonClick(e) {
  e.preventDefault();

  if (!AppState.roles.selectedRole) {
    Utils.showAlert('편집할 역할을 선택해주세요.');
    return;
  }

  // Edit 모드 활성화
  await showEditMode(AppState.roles.selectedRole);
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
async function showEditMode(role) {
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
  await populateEditForm(role);

  // Edit-mode 카드 상태 설정
  setupEditCardStates(role);
}

// Edit 폼에 데이터 채우기
async function populateEditForm(role) {
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
    // 메뉴 트리 초기화 (권한 업데이트는 ready.jstree 이벤트에서 처리)
    await initPlatformMenuEditTree();
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
    // CSP Role Name 입력 박스에 기본값 설정
    if (DOM.editCspRoleNameInput && role.name) {
      const cspRoleName = `MCIAM_${role.name}`;
      DOM.editCspRoleNameInput.value = cspRoleName;
      selectedEditCspRoleName = cspRoleName;
    }
  }
  
  // CSP 매핑 테이블은 권한과 관계없이 항상 초기화 (Edit 모드에서 CSP Role 카드를 사용할 수 있도록)
  initCspRoleMappingEditTable(role.id);
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
async function initEditCspRoleMappingForm() {
  // Edit CSP Provider 드롭다운 초기화
  await initEditCspProviderDropdown();
  
  // Edit CSP Provider 선택 이벤트
  const editCspProviderSelect = DOM.editCspProviderSelect;
  if (editCspProviderSelect) {
    editCspProviderSelect.addEventListener('change', function() {
      selectedEditCspProvider = this.value;
    });
  }
  
  // Edit CSP Role Name 입력 이벤트
  const editCspRoleNameInput = DOM.editCspRoleNameInput;
  if (editCspRoleNameInput) {
    editCspRoleNameInput.addEventListener('input', function() {
      selectedEditCspRoleName = this.value;
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
    cspRoles: AppState.cspRoleMappings.edit
  };
}

// CSP 매핑 추가 핸들러
function handleAddCspMapping() {
  const cspProvider = selectedEditCspProvider;
  const cspRoleName = selectedEditCspRoleName;
  
  // 입력값 검증
  if (!cspProvider) {
    Utils.showAlert('CSP Provider를 선택해주세요.');
    return;
  }
  
  if (!cspRoleName || !cspRoleName.trim()) {
    Utils.showAlert('CSP Role Name을 입력해주세요.');
    return;
  }
  
  // 중복 검사 - CSP Provider와 Role Name 조합으로 검증
  if (AppState.tables.cspRoleMappingEditTable) {
    const currentData = AppState.tables.cspRoleMappingEditTable.getData();
    const existingMapping = currentData.find(
      mapping => mapping.csp_type === cspProvider && mapping.name === cspRoleName.trim()
    );
    
    if (existingMapping) {
      Utils.showAlert(`이미 추가된 CSP Role입니다.\nCSP: ${cspProvider.toUpperCase()}, Role Name: ${cspRoleName.trim()}`);
      return;
    }
    
    // CSP Provider만 중복인 경우도 검증
    const existingCspProvider = currentData.find(
      mapping => mapping.csp_type === cspProvider
    );
    
    if (existingCspProvider) {
      Utils.showAlert(`이미 ${cspProvider.toUpperCase()} CSP Provider가 추가되어 있습니다.\n하나의 역할에는 하나의 CSP Provider만 추가할 수 있습니다.`);
      return;
    }
  }
  
  // 새로운 CSP 매핑을 테이블에 추가
  const newMapping = {
    id: Date.now(), // 임시 ID
    csp_type: cspProvider,
    name: cspRoleName.trim()
  };

  if (AppState.tables.cspRoleMappingEditTable) {
    AppState.tables.cspRoleMappingEditTable.addData(newMapping);
  }

  // 폼 초기화
  UIManager.clearEditCspSelection();
  
  // CSP Role Name 입력 필드에 기본값 다시 설정
  if (DOM.editCspRoleNameInput && AppState.roles.selectedRole && AppState.roles.selectedRole.name) {
    const cspRoleName = `MCIAM_${AppState.roles.selectedRole.name}`;
    DOM.editCspRoleNameInput.value = cspRoleName;
    selectedEditCspRoleName = cspRoleName;
  }
  
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
      
      // 페이지를 맨 위로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
  } catch (error) {
    // ErrorHandler.wrapAsync가 이미 에러를 처리하므로 여기서는 추가 처리하지 않음
    console.error('역할 수정 중 예상치 못한 오류:', error);
  }
}

// 전역 deleteRole 함수 (모달에서 호출)
export async function deleteRole() {
  try {
    // 선택된 역할이 있는지 확인
    if (!AppState.roles.selectedRole) {
      Utils.showAlert('삭제할 역할을 선택해주세요.');
      return;
    }

    const roleId = AppState.roles.selectedRole.id;
    const roleName = AppState.roles.selectedRole.name;

    // 역할 삭제 API 호출
    const response = await RoleManager.deleteRole(roleId);
    
    if (response) {
      // 성공 시 UI 상태 초기화
      UIManager.hideAllModes();
      updateAppState('roles.selectedRole', null);
      
      // 역할 목록 새로고침
      await initRoles();
      
      // 페이지를 맨 위로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      Utils.showAlert(`역할 "${roleName}"이(가) 성공적으로 삭제되었습니다.`);
    }
  } catch (error) {
    console.error('역할 삭제 중 오류 발생:', error);
    Utils.showAlert('역할 삭제 중 오류가 발생했습니다.');
  }
}

// 카드 헤더 전체 클릭 이벤트 연결
function setupHeaderClickEvents() {
  // View 모드
  if (DOM.platformHeader) {
    DOM.platformHeader.addEventListener('click', function(e) {
      if (e.target.closest('#platform-toggle-btn')) return;
      handlePlatformToggle(e);
    });
  }
  if (DOM.workspaceHeader) {
    DOM.workspaceHeader.addEventListener('click', function(e) {
      if (e.target.closest('#workspace-toggle-btn')) return;
      handleWorkspaceToggle(e);
    });
  }
  if (DOM.cspHeader) {
    DOM.cspHeader.addEventListener('click', function(e) {
      if (e.target.closest('#csp-toggle-btn')) return;
      handleCspToggle(e);
    });
  }
  // Create 모드
  if (DOM.platformHeaderCreate) {
    DOM.platformHeaderCreate.addEventListener('click', function(e) {
      if (e.target.closest('#platform-toggle-btn-create')) return;
      handlePlatformToggleCreate(e);
    });
  }
  if (DOM.workspaceHeaderCreate) {
    DOM.workspaceHeaderCreate.addEventListener('click', function(e) {
      if (e.target.closest('#workspace-toggle-btn-create')) return;
      handleWorkspaceToggleCreate(e);
    });
  }
  if (DOM.cspHeaderCreate) {
    DOM.cspHeaderCreate.addEventListener('click', function(e) {
      if (e.target.closest('#csp-toggle-btn-create')) return;
      handleCspToggleCreate(e);
    });
  }
  // Edit 모드
  if (DOM.platformHeaderEdit) {
    DOM.platformHeaderEdit.addEventListener('click', function(e) {
      if (e.target.closest('#platform-toggle-btn-edit')) return;
      handlePlatformToggleEdit(e);
    });
  }
  if (DOM.workspaceHeaderEdit) {
    DOM.workspaceHeaderEdit.addEventListener('click', function(e) {
      if (e.target.closest('#workspace-toggle-btn-edit')) return;
      handleWorkspaceToggleEdit(e);
    });
  }
  if (DOM.cspHeaderEdit) {
    DOM.cspHeaderEdit.addEventListener('click', function(e) {
      if (e.target.closest('#csp-toggle-btn-edit')) return;
      handleCspToggleEdit(e);
    });
  }
}

