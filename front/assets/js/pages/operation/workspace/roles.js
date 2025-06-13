import { TabulatorFull as Tabulator } from "tabulator-tables";

var checked_array = [];
var currentClickedRoleId = "";
var rolesTable;
var platformMenuTable;

// 역할별 메뉴 권한 정의
const rolePermissions = {
  RM001: {  // Viewer
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
  RM002: {  // Admin
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
  }
};

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
    $j('#platform-menu-tree').jstree({
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
        field: "roleMasterId",
        headerSort: false
      },
      {
        title: "Role Master Name",
        field: "roleMasterName",
        headerSort: false
      },
      {
        title: "Platform",
        field: "platformYn",
        headerSort: false,
        formatter: function(cell) {
          return cell.getValue() === "Y" ? "Y" : "N";
        }
      },
      {
        title: "Workspace",
        field: "workspaceYn",
        headerSort: false,
        formatter: function(cell) {
          return cell.getValue() === "Y" ? "Y" : "N";
        }
      },
      {
        title: "CSP",
        field: "cspYn",
        headerSort: false,
        formatter: function(cell) {
          return cell.getValue() === "Y" ? "Y" : "N";
        }
      }
    ]
  });

  // 행 클릭 이벤트 추가
  rolesTable.on("rowClick", function (e, row) {
    var tempcurRoleId = currentClickedRoleId;
    currentClickedRoleId = row.getCell("roleMasterId").getValue();
    
    if (tempcurRoleId === currentClickedRoleId) {
      // 같은 행을 다시 클릭한 경우
      row.deselect();
      currentClickedRoleId = "";
      
      // 모든 카드 초기화 (닫기)
      const platformMenu = document.getElementById("platform-menu");
      const workspaceMenu = document.getElementById("workspace-menu");
      const cspRoleMapping = document.getElementById("csp-role-mapping");

      if (platformMenu) {
        platformMenu.classList.remove('show');
      }
      if (workspaceMenu) {
        workspaceMenu.classList.remove('show');
      }
      if (cspRoleMapping) {
        cspRoleMapping.classList.remove('show');
      }
    } else {
      // 다른 행을 클릭한 경우
      rolesTable.deselectRow();
      row.select();
      
      const rowData = row.getData();

      // 모든 카드 초기화 (닫기)
      const platformMenu = document.getElementById("platform-menu");
      const workspaceMenu = document.getElementById("workspace-menu");
      const cspRoleMapping = document.getElementById("csp-role-mapping");

      // 모든 카드 닫기
      if (platformMenu) {
        platformMenu.classList.remove('show');
      }
      if (workspaceMenu) {
        workspaceMenu.classList.remove('show');
      }
      if (cspRoleMapping) {
        cspRoleMapping.classList.remove('show');
      }

      // Y인 경우에만 해당 카드 열기
      if (rowData.platformYn === "Y") {
        platformMenu.classList.add('show');
      }

      if (rowData.workspaceYn === "Y") {
        workspaceMenu.classList.add('show');
      }

      if (rowData.cspYn === "Y") {
        cspRoleMapping.classList.add('show');
      }
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
    $j('#csp-role-mapping-tree').jstree({
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
  
  // Mock Data
  const rolesData = [
    {
      id: 1,
      roleMasterId: "RM001",
      roleMasterName: "Viewer",
      platformYn: "Y",    // Platform 권한 있음
      workspaceYn: "N",   // Workspace 권한 없음
      cspYn: "N",         // CSP 권한 없음
      menuPermissions: {
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
    },
    {
      id: 2,
      roleMasterId: "RM002",
      roleMasterName: "Admin",
      platformYn: "Y",    // Platform 권한 있음
      workspaceYn: "Y",   // Workspace 권한 있음
      cspYn: "Y",         // CSP 권한 있음
      menuPermissions: {
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
      }
    }
  ];

  try {
    console.log("Roles 테이블 초기화 시작");
    initRolesTable();
    
    // Platform 메뉴 트리만 초기화
    initPlatformMenuTree();
    initCspRoleMappingTree();
    
    rolesTable.on("tableBuilt", function() {
      console.log("Roles 테이블 빌드 완료");
      rolesTable.setData(rolesData);
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
        
        // Create Role 카드 토글
        const createRoleCard = document.getElementById("create_role");
        const bsCreateRoleCollapse = new bootstrap.Collapse(createRoleCard);
        bsCreateRoleCollapse.toggle();

        // 다른 카드들 접기
        const platformMenu = document.getElementById("platform-menu");
        const workspaceMenu = document.getElementById("workspace-menu");
        const cspRoleMapping = document.getElementById("csp-role-mapping");

        if (platformMenu) {
          const bsPlatformCollapse = bootstrap.Collapse.getInstance(platformMenu) || new bootstrap.Collapse(platformMenu);
          bsPlatformCollapse.hide();
        }

        if (workspaceMenu) {
          const bsWorkspaceCollapse = bootstrap.Collapse.getInstance(workspaceMenu) || new bootstrap.Collapse(workspaceMenu);
          bsWorkspaceCollapse.hide();
        }

        if (cspRoleMapping) {
          cspRoleMapping.style.display = "none";
        }
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
  $j('#platform-menu-tree').jstree(true).get_json('#', { flat: true }).forEach(node => {
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

      const element = $j('#platform-menu-tree').find(`#${node.id}`);
      
      if (currentPermissions.view) {
        element.css('color', '#206bc4');  // 사용 가능한 메뉴는 파란색
        $j('#platform-menu-tree').jstree(true).check_node(node.id);
      } else {
        element.css('color', '#626976');  // 사용 불가능한 메뉴는 회색
        $j('#platform-menu-tree').jstree(true).uncheck_node(node.id);
      }
    }
  });
}

