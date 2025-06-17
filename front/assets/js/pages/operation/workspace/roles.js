import { TabulatorFull as Tabulator } from "tabulator-tables";
import jstree from "jstree";

// DOMContentLoaded 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", initRoles);

// 초기화 함수
async function initRoles() {
  console.log("initRoles");
  
  try {
    // 1. 워크스페이스/프로젝트 초기화
    selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
    webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject);
    
    // 2. 역할 목록 가져오기
    await getRoleList();
    
    // 3. 테이블 초기화
    initRolesTable();
    
    // 4. 메뉴 트리 초기화
    initPlatformMenuTree();
    initCspRoleMappingTree();
    
    // 5. 이벤트 리스너 설정
    setupEventListeners();
    
  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
  }
}
// roles_api 호출
async function getRoleList() {
  try {
    console.log("getRoleList");
    const roleList = await webconsolejs["common/api/services/roles_api"].getRoleList();
    console.log('roleList:', roleList);
    return roleList;
  } catch (error) {
    console.error('Error fetching roleList:', error);
    throw error;
  }
}


var checked_array = [];
var currentClickedRoleId = "";
var rolesTable;
var platformMenuTable;

// 역할별 메뉴 권한 정의
const rolePermissions = {
  "1": {  // admin
    workspaces: {
      projects: { view: true, edit: true },
      members: { view: true, edit: true },
      roles: { view: true, edit: true },
      projectboard: { view: true, edit: true }
    },
    workloads: {
      mciworkloads: { view: true, edit: true },
      pmkworkloads: { view: true, edit: true }
    },
    monitorings: {
      mcismonitoring: { view: true, edit: true },
      "3rdpartymonitoring": { view: true, edit: true },
      monitoringconfig: { view: true, edit: true }
    }
  },
  "2": {  // operator
    workspaces: {
      projects: { view: true, edit: true },
      members: { view: true, edit: true },
      roles: { view: true, edit: false },
      projectboard: { view: true, edit: true }
    },
    workloads: {
      mciworkloads: { view: true, edit: true },
      pmkworkloads: { view: true, edit: true }
    },
    monitorings: {
      mcismonitoring: { view: true, edit: true },
      "3rdpartymonitoring": { view: true, edit: true },
      monitoringconfig: { view: true, edit: true }
    }
  },
  "3": {  // viewer
    workspaces: {
      projects: { view: true, edit: false },
      members: { view: true, edit: false },
      roles: { view: true, edit: false },
      projectboard: { view: true, edit: false }
    },
    workloads: {
      mciworkloads: { view: true, edit: false },
      pmkworkloads: { view: true, edit: false }
    },
    monitorings: {
      mcismonitoring: { view: true, edit: false },
      "3rdpartymonitoring": { view: true, edit: false },
      monitoringconfig: { view: true, edit: false }
    }
  },
  "4": {  // billadmin
    workspaces: {
      projects: { view: true, edit: false },
      members: { view: true, edit: false },
      roles: { view: true, edit: false },
      projectboard: { view: true, edit: false }
    },
    workloads: {
      mciworkloads: { view: true, edit: false },
      pmkworkloads: { view: true, edit: false }
    },
    monitorings: {
      mcismonitoring: { view: true, edit: false },
      "3rdpartymonitoring": { view: true, edit: false },
      monitoringconfig: { view: true, edit: false }
    }
  },
  "5": {  // billviewer
    workspaces: {
      projects: { view: true, edit: false },
      members: { view: true, edit: false },
      roles: { view: true, edit: false },
      projectboard: { view: true, edit: false }
    },
    workloads: {
      mciworkloads: { view: true, edit: false },
      pmkworkloads: { view: true, edit: false }
    },
    monitorings: {
      mcismonitoring: { view: true, edit: false },
      "3rdpartymonitoring": { view: true, edit: false },
      monitoringconfig: { view: true, edit: false }
    }
  }
};

// DOM 요소 캐싱
const DOM = {
  createRoleCard: document.getElementById("create_role"),
  platformMenu: document.getElementById("platform-menu"),
  workspaceMenu: document.getElementById("workspace-menu"),
  cspRoleMapping: document.getElementById("csp-role-mapping")
};

// 카드 상태 관리 함수
function toggleCards(showPlatform = false, showWorkspace = false, showCsp = false) {
  if (DOM.platformMenu) {
    DOM.platformMenu.classList.toggle('show', showPlatform);
  }
  if (DOM.workspaceMenu) {
    DOM.workspaceMenu.classList.toggle('show', showWorkspace);
  }
  if (DOM.cspRoleMapping) {
    DOM.cspRoleMapping.classList.toggle('show', showCsp);
  }
}

function closeCreateRoleCard() {
  if (DOM.createRoleCard) {
    DOM.createRoleCard.classList.remove('show');
  }
}

function initPlatformMenuTree() {
  console.log("Platform 메뉴 트리 초기화 시작");
  
  const menuData = [
    {
      id: "workspaces",
      text: "Workspaces",
      icon: "icon-tabler-layout-dashboard",
      state: { opened: true },
      children: [
        {
          id: "projects",
          text: "Projects",
          icon: "icon-tabler-folder"
        },
        {
          id: "members",
          text: "Members",
          icon: "icon-tabler-folder"
        },
        {
          id: "roles",
          text: "Roles",
          icon: "icon-tabler-folder"
        },
        {
          id: "projectboard",
          text: "Project board",
          icon: "icon-tabler-folder"
        }
      ]
    },
    {
      id: "workloads",
      text: "Workloads",
      icon: "icon-tabler-layout-dashboard",
      state: { opened: true },
      children: [
        {
          id: "mciworkloads",
          text: "MCI Workloads",
          icon: "icon-tabler-folder"
        },
        {
          id: "pmkworkloads",
          text: "PMK Workloads",
          icon: "icon-tabler-folder"
        }
      ]
    },
    {
      id: "monitorings",
      text: "Monitorings",
      icon: "icon-tabler-layout-dashboard",
      state: { opened: true },
      children: [
        {
          id: "mcismonitoring",
          text: "MCIs Monitoring",
          icon: "icon-tabler-folder"
        },
        {
          id: "3rdpartymonitoring",
          text: "3rd party Monitoring",
          icon: "icon-tabler-folder"
        },
        {
          id: "monitoringconfig",
          text: "Monitoring Config",
          icon: "icon-tabler-folder"
        }
      ]
    }
  ];

  try {
    $('#platform-menu-tree').jstree({
      'core': {
        'data': menuData,
        'themes': {
          'name': 'default',
          'responsive': true
        }
      },
      'plugins': ['types'],
      'types': {
        'default': {
          'icon': 'icon-tabler-layout-dashboard'
        },
        'folder': {
          'icon': 'icon-tabler-folder'
        }
      }
    }).on('ready.jstree', function() {
      console.log('Platform 메뉴 트리가 초기화되었습니다.');
    });
  } catch (error) {
    console.error('Platform 메뉴 트리 초기화 중 오류 발생:', error);
  }
}

function initRolesTable() {
  console.log("Roles 테이블 초기화 시작");
  rolesTable = new Tabulator("#roles-table", {
    data: [],
    layout: "fitColumns",
    columns: [
      {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        titleFormatterParams: {rowRange: "active"},
        vertAlign: "middle",
        hozAlign: "center",
        headerHozAlign: "center",
        headerSort: false,
        width: 60,
      },
      {
        title: "Role Master ID",
        field: "id",
        headerSort: false
      },
      {
        title: "Role Master Name",
        field: "name",
        headerSort: false
      },
      {
        title: "Platform",
        field: "platformYn",
        headerSort: false,
        formatter: function(cell) {
          const rowData = cell.getRow().getData();
          const roleSubs = rowData.role_subs || [];
          const hasPlatform = roleSubs.some(sub => sub.role_type === "platform");
          return hasPlatform ? "Y" : "N";
        }
      },
      {
        title: "Workspace",
        field: "workspaceYn",
        headerSort: false,
        formatter: function(cell) {
          const rowData = cell.getRow().getData();
          const roleSubs = rowData.role_subs || [];
          const hasWorkspace = roleSubs.some(sub => sub.role_type === "workspace");
          return hasWorkspace ? "Y" : "N";
        }
      },
      {
        title: "CSP",
        field: "cspYn",
        headerSort: false,
        formatter: function(cell) {
          const rowData = cell.getRow().getData();
          const roleSubs = rowData.role_subs || [];
          const hasWorkspace = roleSubs.some(sub => sub.role_type === "csp");
          return hasWorkspace ? "Y" : "N";
        }
      }
    ]
  });

  // 행 클릭 이벤트 추가
  rolesTable.on("rowClick", function (e, row) {
    var tempcurRoleId = currentClickedRoleId;
    currentClickedRoleId = row.getCell("id").getValue();
    
    // Create New Role 카드 닫기
    closeCreateRoleCard();
    
    if (tempcurRoleId === currentClickedRoleId) {
      // 같은 행을 다시 클릭한 경우
      row.deselect();
      currentClickedRoleId = "";
      toggleCards(false, false, false);
    } else {
      // 다른 행을 클릭한 경우
      rolesTable.deselectRow();
      row.select();
      
      const rowData = row.getData();
      const roleSubs = rowData.role_subs || [];
      const hasPlatform = roleSubs.some(sub => sub.role_type === "platform");
      const hasWorkspace = roleSubs.some(sub => sub.role_type === "workspace");
      const hasCsp = roleSubs.some(sub => sub.role_type === "csp");
      
      toggleCards(hasPlatform, hasWorkspace, hasCsp);
    }
  });

  // 행 선택 변경 이벤트 추가
  rolesTable.on("rowSelectionChanged", function (data, rows) {
    checked_array = data;
  });
}

function showRoleDetail(role) {
    // 모든 detail 화면 숨기기
    document.querySelectorAll('.role-detail').forEach(detail => {
        detail.style.display = 'none';
    });

    // detail 섹션 보이기
    document.getElementById('role-detail-section').style.display = 'block';

    // 선택된 role의 type에 따라 해당하는 detail 화면 보이기
    const detailElement = document.getElementById(`role-detail-${role.type}`);
    if (detailElement) {
        detailElement.style.display = 'block';
    }

    // 공통 필드 설정
    document.getElementById('role-detail-name').textContent = role.name;
    document.getElementById('role-detail-description').textContent = role.description;
    document.getElementById('role-detail-type').textContent = role.type;

    // Type별 특화 필드 설정
    switch(role.type) {
        case 'type1':
            document.getElementById('role-detail-type1-field1').textContent = role.type1Field1 || '';
            document.getElementById('role-detail-type1-field2').textContent = role.type1Field2 || '';
            break;
        case 'type2':
            document.getElementById('role-detail-type2-field1').textContent = role.type2Field1 || '';
            document.getElementById('role-detail-type2-field2').textContent = role.type2Field2 || '';
            break;
        case 'type3':
            document.getElementById('role-detail-type3-field1').textContent = role.type3Field1 || '';
            document.getElementById('role-detail-type3-field2').textContent = role.type3Field2 || '';
            break;
    }
}

function initCspRoleMappingTree() {
  console.log("CSP Role Mapping 트리 초기화 시작");
  
  const cspData = [
    {
      id: "aws",
      text: "AWS",
      icon: "icon-tabler-brand-aws",
      state: { opened: true },
      children: [
        {
          id: "aws-mciam-viewer",
          text: "MCIAM-Viewer",
          icon: "icon-tabler-user",
          data: { role: "MCIAM-Viewer" }
        }
      ]
    },
    {
      id: "gcp",
      text: "GCP",
      icon: "icon-tabler-brand-google",
      state: { opened: true },
      children: [
        {
          id: "gcp-mciam-viewer",
          text: "MCIAM-Viewer",
          icon: "icon-tabler-user",
          data: { role: "MCIAM-Viewer" }
        }
      ]
    },
    {
      id: "azure",
      text: "Azure",
      icon: "icon-tabler-brand-azure",
      state: { opened: true },
      children: [
        {
          id: "azure-mciam-viewer",
          text: "MCIAM-Viewer",
          icon: "icon-tabler-user",
          data: { role: "MCIAM-Viewer" }
        }
      ]
    }
  ];

  try {
    $('#csp-role-mapping-tree').jstree({
      'core': {
        'data': cspData,
        'themes': {
          'name': 'default',
          'responsive': true
        }
      },
      'plugins': ['types'],
      'types': {
        'default': {
          'icon': 'icon-tabler-brand-aws'
        },
        'folder': {
          'icon': 'icon-tabler-folder'
        }
      }
    }).on('ready.jstree', function() {
      console.log('CSP Role Mapping 트리가 초기화되었습니다.');
    });
  } catch (error) {
    console.error('CSP Role Mapping 트리 초기화 중 오류 발생:', error);
  }
}

// DOM이 로드된 후 초기화
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM 로드됨");
  
  try {
    console.log("Roles 테이블 초기화 시작");
    initRolesTable();
    
    // Platform 메뉴 트리만 초기화
    initPlatformMenuTree();
    initCspRoleMappingTree();
    
    // API 응답 데이터 설정
    const apiResponseData = [
      {
        "id": 1,
        "parent_id": null,
        "name": "admin",
        "description": "",
        "predefined": false,
        "created_at": "2025-06-14T23:28:49.662444Z",
        "updated_at": "2025-06-14T23:28:49.662444Z",
        "role_subs": [
          {
            "id": 1,
            "role_id": 1,
            "role_type": "platform",
            "created_at": "2025-06-14T23:28:49.710788Z"
          },
          {
            "id": 2,
            "role_id": 1,
            "role_type": "workspace",
            "created_at": "2025-06-14T23:28:49.736734Z"
          },
          {
            "id": 3,
            "role_id": 1,
            "role_type": "csp",
            "created_at": "2025-06-14T23:28:49.736734Z"
          }
        ]
      },
      {
        "id": 2,
        "parent_id": null,
        "name": "operator",
        "description": "",
        "predefined": false,
        "created_at": "2025-06-14T23:28:49.817946Z",
        "updated_at": "2025-06-14T23:28:49.817946Z",
        "role_subs": [
          {
            "id": 3,
            "role_id": 2,
            "role_type": "platform",
            "created_at": "2025-06-14T23:28:49.837124Z"
          },
          {
            "id": 4,
            "role_id": 2,
            "role_type": "workspace",
            "created_at": "2025-06-14T23:28:49.853559Z"
          }
        ]
      },
      {
        "id": 3,
        "parent_id": null,
        "name": "viewer",
        "description": "",
        "predefined": false,
        "created_at": "2025-06-14T23:28:49.909563Z",
        "updated_at": "2025-06-14T23:28:49.909563Z",
        "role_subs": [
          {
            "id": 5,
            "role_id": 3,
            "role_type": "platform",
            "created_at": "2025-06-14T23:28:49.930737Z"
          },
          {
            "id": 6,
            "role_id": 3,
            "role_type": "workspace",
            "created_at": "2025-06-14T23:28:49.947701Z"
          }
        ]
      },
      {
        "id": 4,
        "parent_id": null,
        "name": "billadmin",
        "description": "",
        "predefined": false,
        "created_at": "2025-06-14T23:28:50.020066Z",
        "updated_at": "2025-06-14T23:28:50.020066Z",
        "role_subs": [
          {
            "id": 7,
            "role_id": 4,
            "role_type": "platform",
            "created_at": "2025-06-14T23:28:50.041217Z"
          },
          {
            "id": 8,
            "role_id": 4,
            "role_type": "workspace",
            "created_at": "2025-06-14T23:28:50.059737Z"
          }
        ]
      },
      {
        "id": 5,
        "parent_id": null,
        "name": "billviewer",
        "description": "",
        "predefined": false,
        "created_at": "2025-06-14T23:28:50.117364Z",
        "updated_at": "2025-06-14T23:28:50.117364Z",
        "role_subs": [
          {
            "id": 9,
            "role_id": 5,
            "role_type": "platform",
            "created_at": "2025-06-14T23:28:50.136685Z"
          },
          {
            "id": 10,
            "role_id": 5,
            "role_type": "workspace",
            "created_at": "2025-06-14T23:28:50.15496Z"
          }
        ]
      }
    ];

    rolesTable.on("tableBuilt", function() {
      console.log("Roles 테이블 빌드 완료");
      rolesTable.setData(apiResponseData);
    });

    // Workspace 토글 이벤트
    const workspaceToggle = document.getElementById("workspace-toggle");
    const workspaceContent = document.getElementById("workspace-content");

    if (workspaceToggle) {
      workspaceToggle.addEventListener("change", function () {
        workspaceContent.style.display = this.checked ? "block" : "none";
      });
    }

    // Add 버튼 클릭 이벤트
    const addButton = document.querySelector('a[href="#create_role"]');
    if (addButton) {
      addButton.addEventListener("click", function(e) {
        e.preventDefault();
        
        // 현재 선택된 행이 있다면 선택 해제
        if (currentClickedRoleId) {
          rolesTable.deselectRow();
          currentClickedRoleId = "";
        }

        // 모든 카드 닫기
        toggleCards(false, false, false);
        
        // Create Role 카드 토글
        DOM.createRoleCard.classList.toggle('show');
      });
    }

  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
  }
});

// 메뉴 권한 업데이트 함수
function updateMenuPermissions(roleId) {
  console.log("메뉴 권한 업데이트 시작 - 역할:", roleId);
  
  const permissions = rolePermissions[roleId] || {};
  console.log("적용할 권한:", permissions);

  // 각 메뉴 항목에 권한 적용
  $('#platform-menu-tree').jstree(true).get_json('#', { flat: true }).forEach(node => {
    if (node.id !== '#' && node.id !== 'j1_1') {  // 루트 노드 제외
      const menuPath = node.id.split('.');
      let currentPermissions = permissions;
      
      // 메뉴 경로에 따라 권한 찾기
      for (const path of menuPath) {
        if (currentPermissions[path]) {
          currentPermissions = currentPermissions[path];
        } else {
          currentPermissions = { view: false, edit: false };
          break;
        }
      }

      const element = $('#platform-menu-tree').find(`#${node.id}`);
      
      if (currentPermissions.view) {
        element.css('color', '#206bc4');  // 사용 가능한 메뉴는 파란색
        $('#platform-menu-tree').jstree(true).check_node(node.id);
      } else {
        element.css('color', '#626976');  // 사용 불가능한 메뉴는 회색
        $('#platform-menu-tree').jstree(true).uncheck_node(node.id);
      }
    }
  });
}

