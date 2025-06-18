import { TabulatorFull as Tabulator } from "tabulator-tables";
import 'jstree';

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
  console.log("initRoles 시작");
  try {
    // 1. 워크스페이스/프로젝트 초기화
    var selectedWorkspaceProject = {
      workspaceId: "ws01",
      workspaceName: "ws01",
      projectId: "Default",
      projectName: "Default",
      nsId: "Default"
    };
    webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject);

    // 2. 역할 목록 가져오기
    console.log("역할 목록 가져오기 시작");
    const roleList = await getRoleList();
    console.log('가져온 역할 목록:', roleList);

    // 3. 테이블 초기화 및 데이터 설정
    console.log("테이블 초기화 시작");
    await initRolesTable();

    if (roleList && roleList.length > 0) {
      rolesTable.setData(roleList);
    } else {
      console.log("역할 목록이 없어 더미 데이터 사용");
      const dummyData = [
        {
          id: 1,
          name: "admin",
          description: "Administrator role",
          role_subs: [
            { role_type: "platform" },
            { role_type: "workspace" },
            { role_type: "csp" }
          ]
        },
        {
          id: 2,
          name: "operator",
          description: "Operator role",
          role_subs: [
            { role_type: "platform" },
            { role_type: "workspace" }
          ]
        }
      ];
      rolesTable.setData(dummyData);
    }

    // 4. 메뉴 트리 초기화
    console.log("메뉴 트리 초기화 시작");
    await initPlatformMenuTree();
    await initCspRoleMappingTree();

    // 5. 이벤트 리스너 설정
    console.log("이벤트 리스너 설정 시작");
    setupEventListeners();

    console.log("초기화 완료");
  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
    throw error;
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
    console.error("Error fetching role list:", error);
    return [];
  }
}

async function getAllMenuResources() {
  try {
    // 로컬 스토리지에서 메뉴 데이터 가져오기
    const menuData = webconsolejs["common/storage/localstorage"].getMenuLocalStorage();
    console.log("로컬 스토리지에서 가져온 메뉴 데이터:", menuData);
    return { responseData: menuData };
  } catch (error) {
    console.error('Error fetching menuList from localStorage:', error);
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

function convertToJstreeFormat(menuData, parentId = "#") {
  let result = [];
  if (!Array.isArray(menuData)) return result;

  menuData.forEach(menu => {
    // jstree 노드 객체 생성
    const node = {
      id: menu.id,
      text: menu.displayName || menu.text || menu.id,
      parent: parentId,
      state: { opened: true },
      data: {
        menunumber: menu.menunumber,
        isAction: menu.isAction,
        priority: menu.priority
      }
    };
    result.push(node);

    // 하위 메뉴가 있으면 재귀적으로 변환
    if (Array.isArray(menu.menus) && menu.menus.length > 0) {
      result = result.concat(convertToJstreeFormat(menu.menus, menu.id));
    }
  });

  return result;
}

async function initPlatformMenuTree() {
  try {
    const response = await getAllMenuResources();
    console.log('Platform 메뉴 트리 API 응답:', response);

    if (response && response.responseData) {

      const treeData = convertToJstreeFormat(response.responseData);

      // 기존 트리 제거
      if ($("#platform-menu-tree").jstree(true)) {
        $("#platform-menu-tree").jstree("destroy");
      }
      // 트리 생성
      $('#platform-menu-tree').jstree({
        "core": {
          "themes": {
            "responsive": true
          },
          "data": treeData,
          //"check_callback":true --check_callback 허용시 dnd로 트리 내부 인사이동 가능
        },
        "types": {
          "default": {

            "icon": "ti ti-menu"
          },
          "file": {
            "icon": '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-folder"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" /></svg>'
          }
        },
        "plugins": ["types", "dnd"]//추가
      });
      // 트리 초기화 완료 후 이벤트 바인딩
      $("#platform-menu-tree").on("ready.jstree", function () {
        console.log("Platform 메뉴 트리 초기화 완료");
      });

    } else {
      console.error("메뉴 트리 데이터가 없습니다.");
    }
  } catch (error) {
    console.error("Platform 메뉴 트리 초기화 중 오류 발생:", error);
  }
}

function initRolesTable() {
  return new Promise((resolve, reject) => {
    console.log("Roles 테이블 초기화 시작");

    // 테이블이 이미 존재하는 경우 제거
    if (rolesTable) {
      rolesTable.destroy();
    }

    // 테이블 요소 확인
    const tableElement = document.getElementById("roles-table");
    if (!tableElement) {
      console.error("roles-table 요소를 찾을 수 없습니다.");
      reject(new Error("Table element not found"));
      return;
    }

    try {
      rolesTable = new Tabulator("#roles-table", {
        data: [],
        layout: "fitColumns",
        height: "400px",
        reactiveData: true,
        columns: [
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
            formatter: function (cell) {
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
            formatter: function (cell) {
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
            formatter: function (cell) {
              const rowData = cell.getRow().getData();
              const roleSubs = rowData.role_subs || [];
              const hasCsp = roleSubs.some(sub => sub.role_type === "csp");
              return hasCsp ? "Y" : "N";
            }
          }
        ]
      });

      // 테이블 초기화 완료 후 이벤트 리스너 설정
      rolesTable.on("tableBuilt", function () {
        console.log("테이블 초기화 완료");
        resolve();
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

    } catch (error) {
      console.error("테이블 초기화 중 오류 발생:", error);
      reject(error);
    }
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
  switch (role.type) {
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
    // 기존 트리 제거
    if ($('#csp-role-mapping-tree').jstree(true)) {
      $('#csp-role-mapping-tree').jstree('destroy');
    }

    // 새로운 트리 초기화
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
    });

    // 이벤트 리스너를 별도로 등록
    $('#csp-role-mapping-tree').on('ready.jstree', function () {
      console.log('CSP Role Mapping 트리가 초기화되었습니다.');
    });

  } catch (error) {
    console.error('CSP Role Mapping 트리 초기화 중 오류 발생:', error);
  }
}

// 이벤트 리스너 설정 함수 추가
function setupEventListeners() {
  console.log("이벤트 리스너 설정 시작");

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
    addButton.addEventListener("click", function (e) {
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
}

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

