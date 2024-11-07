import { TabulatorFull as Tabulator } from "tabulator-tables";
import TomSelect from 'tom-select';

var checked_array = [];
var checked_projects_array = [];
var checked_roles_array = [];
var checked_rolePermissions_array = [];
var checked_rolePermissionsDetail_array = [];
var checked_userRolemapping_array = [];
var listData;
var workspaceListInfoSummary = {workspaceCount:0, projectsCount:0, groupCount:0, memberCount:0}
var workspacesListTable;
var workspacesProjectsInfo;
var workspacesUserInfo;
var workspacesRolesInfo;
var workspacesRolesPermissionInfo;
var workspacesRolesDetailInfo;
var currentClickedWorkspaceId;

var projectModalSeletor;
var userAddModalSelector;
var projectModalEditSeletor;
var rolesModalEditSeletor;

// before DOMContentLoaded area start
initWorkspacesTable()
function initWorkspacesTable() {
    var tableObjParams = {};
    var columns = [
      {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        titleFormatterParams : {rowRange : "active"},
        vertAlign: "middle",
        hozAlign: "center",
        headerHozAlign: "center",
        headerSort: false,
        width: 60,
      },
      {
        title: "Name",
        field: "name",
        visible: true,
        width: 200,
      },
      {
        title: "Id",
        field: "id",
        visible: false
      },
      {
        title: "Description",
        field: "description",
        visible: true
      },
      {
        title: "Created At",
        field: "created_at",
        formatter: datetimeFormatter,
        visible: true
      },
      {
        title: "Updated At",
        field: "updated_at",
        formatter: datetimeFormatter,
        visible: false
      },
      {
        title: "User count",
        field: "userCount",
        visible: true
      },
      {
        title: "Role Count",
        field: "roleCount",
        visible: true
      }
    ];
    workspacesListTable = setWorkspacesTabulator("Workspaceslist-table", tableObjParams, columns, true);

    workspacesListTable.on("rowClick", function (e, row) {
      var tempcurWorkspaceId = currentClickedWorkspaceId
      currentClickedWorkspaceId = row.getCell("id").getValue()
      if (tempcurWorkspaceId === currentClickedWorkspaceId) {
        webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("workspace-info-card"))
        currentClickedWorkspaceId = ""
        this.deselectRow();
        return
      } else {
        webconsolejs["partials/layout/navigatePages"].activeElement(document.getElementById("workspace-info-card"))
        this.deselectRow();
        this.selectRow(currentClickedWorkspaceId);
        getSelectedWorkspaceInfocardInit(currentClickedWorkspaceId)
        return
      }
    });
  
    workspacesListTable.on("rowSelectionChanged", function (data, rows) {
      checked_array = data
    });
}

initWorkspacesProjectsInfoTable()
function initWorkspacesProjectsInfoTable() {
    var tableObjParams = {};
    var columns = [
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
            title: "Name",
            field: "name",
            visible: true,
            width: 200,
        },
        {
            title: "Id",
            field: "id",
            visible: false
        },
        {
            title: "nsId",
            field: "nsid",
            visible: false
        },
        {
            title: "Description",
            field: "description",
            visible: true
        },
        {
            title: "Created At",
            field: "created_at",
            visible: true
        },
        {
            title: "Updated At",
            field: "updated_at",
            visible: false
        },
    ];
    workspacesProjectsInfo = setWorkspacesProjectsInfoTabulator("WorkspacesProjectsInfo-table", tableObjParams, columns, true);

    workspacesProjectsInfo.on("rowClick", function (e, row) {

    });
  
    workspacesProjectsInfo.on("rowSelectionChanged", function (data, rows) {
      checked_projects_array = data
    });
}

initWorkspacesUsersInfoTable()
function initWorkspacesUsersInfoTable() {
    var tableObjParams = {};
    var columns = [
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
            field: "username",
            visible: true,
        },
        {
          title: "Name",
          field: "name",
          formatter:userNameFormatter,
          visible: true,
        },
        {
            title: "Email",
            field: "email",
            visible: true,
        },
        {
            title: "Description",
            field: "attributes.description",
            visible: true,
        },
        {
            title: "Role",
            field: "role",
            visible: true
        },
        {
            title: "Approved",
            field: "enabled",
            formatter:userEnabledFormatter,
            visible: true
        },
        {
            title: "Department",
            field: "department",
            visible: true
        },
        {
          title: "Company",
          field: "attributes.company",
          visible: true
        },
        {
          title: "UUID",
          field: "id",
          visible: true
        },
    ];
    workspacesUserInfo = setWorkspacesUsersInfoTabulator("WorkspacesUserInfo-table", tableObjParams, columns, true);

    // workspacesProjectsInfo.on("rowClick", function (e, row) {
    //   var WorkspacesID = row.getCell("id").getValue();
    //   getSelectedWorkspacesData(WorkspacesID)
    // });
  
    workspacesUserInfo.on("rowSelectionChanged", function (data, rows) {
      checked_userRolemapping_array = data
    });
}
function userEnabledFormatter(data) {
  var userinfo = data.getData()
  var html = ""
  if (userinfo.enabled) {
      html = `<td><span class="badge bg-success me-1"></span> Approved</td>`
  } else {
      html = `<td><span class="badge bg-secondary me-1"></span> Not Approved</td>`
  }
  return html;
}
function userNameFormatter(data) {
  var userinfo = data.getData()
  return userinfo.firstName + " "+ userinfo.lastName;
}

initWorkspacesRolesInfoTable()
function initWorkspacesRolesInfoTable() {
    var tableObjParams = {};
    var columns = [
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
          title: "Name",
          field: "name",
          visible: true,
      },
      {
          title: "Description",
          field: "description",
          visible: true
      },
      {
          title: "Enable",
          field: "enable",
          formatter:roleEnabledFormatter,
          visible: true
      },
      {
          title: "User Count",
          field: "userCount",
          visible: true
      },
      {
          title: "Workspace Count",
          field: "workspaceCount",
          visible: true
      },
      {
        title: "Company",
        field: "company",
        visible: true
      },
      {
        title: "UUID",
        field: "id",
        visible: true
      },
      {
        title: "policy",
        field: "policy",
        visible: false
      },
    ];
    workspacesRolesInfo = setWorkspaceRolesTabulator("WorkspacesRolesInfo-table", tableObjParams, columns, true);

    workspacesRolesInfo.on("rowClick", function (e, row) {
      var roleData = row.getData()
      initRoleDetailModal(roleData)
    });
  
    workspacesRolesInfo.on("rowSelectionChanged", function (data, rows) {
      checked_roles_array = data
    });
}
function roleEnabledFormatter(data) {
  var roleinfo = data.getData()
  var html = ""
  if (roleinfo.enable) {
      html = `<td><span class="badge bg-success me-1"></span> Y</td>`
  } else {
      html = `<td><span class="badge bg-secondary me-1"></span> N</td>`
  }
  return html;
}

initWorkspacesRolesPermissionInfoTable()
function initWorkspacesRolesPermissionInfoTable() {
  var tableObjParams = {};
  var columns = [
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
      title: "name",
      field: "name",
      visible: false,
    },
    {
      title: "Framework",
      field: "framework",
      visible: true,
      width: 300,
    },
    {
      title: "OperationId",
      field: "operationId",
      visible: true,
      width: 400,
    },
    {
      title: "Description",
      field: "description",
      visible: true,
      width: 600,
    },
  ];
  workspacesRolesPermissionInfo = setWorkspaceRolesPermissionsTabulator("role-modal-add-accessPolicy-table", tableObjParams, columns, true);

  // workspacesRolesPermissionInfo.on("rowClick", function (e, row) {
  //   var roleData = row.getData()
  // });

  workspacesRolesPermissionInfo.on("rowSelectionChanged", function (data, rows) {
    checked_rolePermissions_array = data
  });
}

initWorkspacesRolesDetailInfoTable()
function initWorkspacesRolesDetailInfoTable() {
  var tableObjParams = {};
  var columns = [
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
      title: "name",
      field: "name",
      visible: false,
    },
    {
      title: "Framework",
      field: "framework",
      visible: true,
      width: 300,
    },
    {
      title: "OperationId",
      field: "operationId",
      visible: true,
      width: 400,
    },
    {
      title: "Description",
      field: "description",
      visible: true,
      width: 600,
    },
  ];
  workspacesRolesDetailInfo = setWorkspaceRolesDetailTabulator("role-modal-detail-accessPolicy-table", tableObjParams, columns, true);

  // workspacesRolesDetailInfo.on("rowClick", function (e, row) {
  //   var roleData = row.getData()
  // });

  workspacesRolesDetailInfo.on("rowSelectionChanged", function (data, rows) {
    checked_rolePermissionsDetail_array = data
  });
}

// before DOMContentLoaded area end


// DOMContentLoaded area start
document.addEventListener("DOMContentLoaded", initWorkspace);
async function initWorkspace() {
    console.log("initWorkspace")
    await updateInitData()
    updateSummary()
    initProjectModalSeletor()
    await setWokrspaceTableData()

    // workspace add button
    var targetSection = "workspace-modal-add"//workspace-modal-add
    var createBtnName ="Add Workspace";
    //var onclickEvent = "";
    var onclickEvent = "webconsolejs['partials/layout/modal'].commonTargetModal('" + targetSection + "')";
    
    webconsolejs['partials/layout/navigatePages'].addPageHeaderButton(targetSection, createBtnName, onclickEvent);

}

async function updateInitData(){
  var respWorkspaceList = await webconsolejs["common/api/services/workspace_api"].getAllWorksaceList();
  var respUsersList = await webconsolejs["common/api/services/workspace_api"].getUsers();
  var respProjectList = await webconsolejs["common/api/services/workspace_api"].getProjectList();
  var respgetPermissionsList = await webconsolejs["common/api/services/workspace_api"].getPermissions();
  workspaceListInfoSummary.workspaceCount = respWorkspaceList.length
  workspaceListInfoSummary.memberCount = respUsersList.length
  workspaceListInfoSummary.projectsCount = respProjectList.length
  listData = {wsList:respWorkspaceList, userList:respUsersList, prjList:respProjectList, permissionList:respgetPermissionsList.message}
}

async function setWokrspaceTableData(){
  var tableListData = [];
  for (const workspace of listData.wsList) {
      var respWorkspaceRoleMappingList = await webconsolejs["common/api/services/workspace_api"].getWorkspaceUserRoleMappingListByWorkspaceId(workspace.id);
      var userCount = 0
      var roleCountArr = new Set();
      if (respWorkspaceRoleMappingList.userinfo){
          respWorkspaceRoleMappingList.userinfo.forEach(function(wsmapping){
            userCount++
            roleCountArr.add(wsmapping.role.name)
          })
      }
      tableListData.push({
          name:workspace.name,
          id:workspace.id,
          description:workspace.description,
          created_at:workspace.created_at,
          updated_at:workspace.updated_at,
          userCount:userCount,
          roleCount:roleCountArr.size
      })
  };
  workspacesListTable.setData(tableListData)
}

function initProjectModalSeletor(){
  var selectElement = document.getElementById('workspace-modal-add-multiproject');
  if (selectElement.tomselect) {
    selectElement.tomselect.destroy();
  }
  selectElement.innerHTML = '';

  listData.prjList.forEach(prj => {
    let option = document.createElement('option');
    option.value = prj.id;
    option.text = prj.name;
    selectElement.add(option);
  });
  projectModalSeletor = new TomSelect(selectElement,{render:{
    copyClassesToDropdown: false,
    dropdownParent: 'body',
    controlInput: '<input>',
    item: function(data,escape) {
      if( data.customProperties ){
        return '<div><span class="dropdown-item-indicator">' + data.customProperties + '</span>' + escape(data.text) + '</div>';
      }
      return '<div>' + escape(data.text) + '</div>';
    },
    option: function(data,escape){
      if( data.customProperties ){
        return '<div><span class="dropdown-item-indicator">' + data.customProperties + '</span>' + escape(data.text) + '</div>';
      }
      return '<div>' + escape(data.text) + '</div>';
    },
  },});
}

function initProjectModalEditSeletor(){
  var selectElement = document.getElementById('workspace-modal-edit-multiproject');
  if (selectElement.tomselect) {
    selectElement.tomselect.destroy();
  }
  selectElement.innerHTML = '';

  listData.prjList.forEach(prj => {
    let option = document.createElement('option');
    option.value = prj.id;
    option.text = prj.name;
    selectElement.add(option);
  });
  if (selectElement.tomselect) {
    selectElement.tomselect.destroy();
  }
  projectModalEditSeletor = new TomSelect(selectElement,{render:{
    item: function(data,escape) {
      if( data.customProperties ){
        return '<div><span class="dropdown-item-indicator">' + data.customProperties + '</span>' + escape(data.text) + '</div>';
      }
      return '<div>' + escape(data.text) + '</div>';
    },
    option: function(data,escape){
      if( data.customProperties ){
        return '<div><span class="dropdown-item-indicator">' + data.customProperties + '</span>' + escape(data.text) + '</div>';
      }
      return '<div>' + escape(data.text) + '</div>';
    },
  },});
}

function initUserAddSeletor(users){
  var selectElement = document.getElementById('user-modal-add-userselector');
  if (selectElement.tomselect) {
    selectElement.tomselect.destroy();
  }
  selectElement.innerHTML = '';

  users.forEach(user => {
    let option = document.createElement('option');
    option.value = user;
    option.text = user;
    selectElement.add(option);
  });

  userAddModalSelector = new TomSelect(selectElement,{render:{
    item: function(data,escape) {
      if( data.customProperties ){
        return '<div><span class="dropdown-item-indicator">' + data.customProperties + '</span>' + escape(data.text) + '</div>';
      }
      return '<div>' + escape(data.text) + '</div>';
    },
    option: function(data,escape){
      if( data.customProperties ){
        return '<div><span class="dropdown-item-indicator">' + data.customProperties + '</span>' + escape(data.text) + '</div>';
      }
      return '<div>' + escape(data.text) + '</div>';
    },
  },});
}

function initUserAddRoleSeletor(roles){
  var selectElement = document.getElementById('user-modal-add-roleselector');
  if (selectElement.tomselect) {
    selectElement.tomselect.destroy();
  }
  selectElement.innerHTML = '';
  let option = document.createElement('option');
  option.value = "";
  option.text = "select Role";
  selectElement.add(option);
  roles.forEach(role => {
    let option = document.createElement('option');
    option.value = role.id;
    option.text = role.name;
    selectElement.add(option);
  });
}

function updateSummary(){
  document.getElementById('workspaces_count').textContent = workspaceListInfoSummary.workspaceCount;
  document.getElementById('projects_count').textContent = workspaceListInfoSummary.projectsCount;
  document.getElementById('groupMembers_count').textContent = workspaceListInfoSummary.groupCount +" / "+workspaceListInfoSummary.memberCount;
}
// DOMContentLoaded area end



// info card area start
async function getSelectedWorkspaceInfocardInit(workspacesID){
  // active info card
  // const checked_array_ids = checked_array.map(item => item.id);
  // if (!checked_array_ids.includes(workspacesID)){
  //   webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("workspace-info-card"))
  //   return
  // } else {
  //   webconsolejs["partials/layout/navigatePages"].activeElement(document.getElementById("workspace-info-card"))
  // }

  
  

  var respWorkspaceInfo = await webconsolejs["common/api/services/workspace_api"].getWPmappingListByWorkspaceId(workspacesID);
  
  // Details Tab
  await setWokrspaceDetailsData(respWorkspaceInfo)

  // Projects Tab
  setWokrspaceProjectsTableData(respWorkspaceInfo.projects)

  // Users Tab
  await setWokrspaceUserTableData(workspacesID)

  // Roles Tab
  await setWokrspaceRolesTableData(workspacesID)
}

async function setWokrspaceDetailsData(respWorkspaceInfo){
  document.getElementById("workspace-details-name").innerText = respWorkspaceInfo.workspace.name
  document.getElementById("workspace-details-description").innerText = respWorkspaceInfo.workspace.description
  document.getElementById("workspace-details-systemId").innerText = respWorkspaceInfo.workspace.id
  document.getElementById("workspace-details-created").innerText = respWorkspaceInfo.workspace.created_at
  document.getElementById("workspace-details-updated").innerText = respWorkspaceInfo.workspace.updated_at
  document.getElementById("workspace-details-presentation").innerText = respWorkspaceInfo.workspace.name + " Info"
}

function setWokrspaceProjectsTableData(projects){
  workspacesProjectsInfo.setData(projects)
}

async function setWokrspaceUserTableData(wsId){
  var userRoleMappingList = await webconsolejs["common/api/services/workspace_api"].getWorkspaceUserRoleMappingListByWorkspaceId(wsId);
  var userTableData = []
  for (const userInfo of userRoleMappingList.userinfo || []) {
    var getUsersByIdresp = await webconsolejs["common/api/services/workspace_api"].getUsersById(userInfo.userid);
    const targetUserInfo = getUsersByIdresp.find(item => item.username === userInfo.userid);
    targetUserInfo.department = "department example" // TODO : 아직 부서명까지 준비되지 않음.. 
    targetUserInfo.role = userInfo.role.name
    userTableData.push(targetUserInfo)
  }
  workspacesUserInfo.setData(userTableData)
}

async function setWokrspaceRolesTableData(wsId){
  const getRoleListresp = await webconsolejs["common/api/services/workspace_api"].getRoleList();
  const getWURMappinResp = await webconsolejs["common/api/services/workspace_api"].getWorkspaceUserRoleMappingListOrderbyWorkspace();
  var data = [];
  getRoleListresp.forEach(async function(role){
    data.push({
      name:role.name,
      description:role.description,
      enable:doesRoleExistInWorkspaceById(getWURMappinResp, wsId, role.id), // TODO : role 에는 활성 비활성 개념이 없음. 현재 워크스페이스에 존재하는가로 대체
      userCount:countRoleOccurrencesInWorkspaces(getWURMappinResp, role.id), // 전체워크스페이스에서 해당 롤이 적용된 유저 명수 
      workspaceCount:countWorkspacesWithRole(getWURMappinResp, role.id), // 전체워크스페이스에서 해당 롤이 적용된 워크스페이스 개수
      company:"-",// TODO : role 에는 Company 개념이 없음. 
      id:role.id,
      policy:role.policy,
    })
  });
  workspacesRolesInfo.setData(data)
}
function doesRoleExistInWorkspaceById(workspaces, workspaceId, targetRoleId) {
  var workspace = (workspaces && Array.isArray(workspaces)) ? workspaces.find(function (ws) {
    return ws.workspace.id === workspaceId;
  }) : null;
  if (workspace) {
    return workspace.userinfo.some(user => user.role.id === targetRoleId);
  }
  return false;
}
function countRoleOccurrencesInWorkspaces(workspaces, targetRoleId) {
  var count = 0;
  if (workspaces && Array.isArray(workspaces)) {
    workspaces.forEach(function (workspace) {
      if (workspace.userinfo && Array.isArray(workspace.userinfo)) {
        workspace.userinfo.forEach(function (user) {
          if (user.role && user.role.id === targetRoleId) {
            count++;
          }
        });
      } else {
        console.error("userinfo is null or not an array in workspace:", workspace);
      }
    });
  } else {
    console.error("workspaces is null or not an array.");
  }
  return count;
}
function countWorkspacesWithRole(workspaces, targetRoleId) {
  var count = 0;
  if (workspaces && Array.isArray(workspaces)) {
    workspaces.forEach(function (workspace) {
      if (workspace.userinfo && Array.isArray(workspace.userinfo)) {
        var hasTargetId = workspace.userinfo.some(function (user) {
          return user.role && user.role.id === targetRoleId;
        });

        if (hasTargetId) {
          count++;
        }
      } else {
        console.error("userinfo is null or not an array in workspace:", workspace);
      }
    });
  } else {
    console.error("workspaces is null or not an array.");
  }

  return count;
}

function setWorkspacesRolesPermissionInfoTable(){
  var data = [];
  listData.permissionList.forEach(function(permission){
    data.push({
      id:permission.id,
      name:permission.name,
      framework:permission.name.split(':')[0],
      operationId:permission.name.split(':')[1],
      description:permission.description,
    })
  })
  workspacesRolesPermissionInfo.setData(data)
}

function setWorkspacesRolesDetailTable(dependentPermissions){
  var data = [];
  listData.permissionList.forEach(function(permission){
    data.push({
      id:permission.id,
      name:permission.name,
      framework:permission.name.split(':')[0],
      operationId:permission.name.split(':')[1],
      description:permission.description,
    })
  })
  workspacesRolesDetailInfo.setData(data)
  for (const permission of dependentPermissions) {
    workspacesRolesDetailInfo.selectRow(permission.id);
  }
}

// info card area end


// table action area start

//// workspace table action 
export async function creatworkspaceProject(){
  let wsName = document.getElementById("workspace-modal-add-name").value
  let wsDesc = document.getElementById("workspace-modal-add-description").value
  const createdWorkspace = await webconsolejs["common/api/services/workspace_api"].createWorkspace(wsName, wsDesc);
  if (!createdWorkspace.success){
    alert(JSON.stringify(createdWorkspace.message))
    return
  }
  if (document.getElementById('workspace-modal-add-withprojects').checked){
    let multiprojectSelect = document.getElementById('workspace-modal-add-multiproject');
    let multiprojects = Array.from(multiprojectSelect.selectedOptions, option => option.value);
    const createdWPmapping = await webconsolejs["common/api/services/workspace_api"].createWPmapping(createdWorkspace.message.id, multiprojects);
    if (!createdWPmapping.success){
      alert(JSON.stringify(createdWorkspace.message))
      return
    }
  }
  location.reload()
}

export async function deleteWorkspaces(){
  if (checked_array.length === 0){
    webconsolejs['partials/layout/modal'].commonShowDefaultModal("Delete Workspaces", "No Checked Workspace")
  }
  checked_array.forEach(async function(checkedWorkspace){
    await webconsolejs["common/api/services/workspace_api"].deleteWorkspaceById(checkedWorkspace.id);
  })
}

//// workspace table Modal 
export async function editeWorkspaceModalInit(){
  if (checked_array.length === 0 || checked_array.length > 1){
    webconsolejs['partials/layout/modal'].commonShowDefaultModal("Edit Workspaces", "No workspaces checked or more than one.")
    return
  }
  document.getElementById("workspace-modal-edit-id").value = checked_array[0].id
  document.getElementById("workspace-modal-edit-name").value = checked_array[0].name
  document.getElementById("workspace-modal-edit-description").value = checked_array[0].description
  var respWorkspacesInfo = await webconsolejs["common/api/services/workspace_api"].getWPmappingListOrderbyWorkspace();
  initProjectModalEditSeletor()
  let otherProjectIds = [];
  let projectsids = [];
  for (const workpaceInfo of respWorkspacesInfo) {
    if (workpaceInfo.workspace.id !== checked_array[0].id) {
          workpaceInfo.projects.forEach(project => {
          otherProjectIds.push(project.id);
        });
    }else {
      projectsids = (workpaceInfo.projects && Array.isArray(workpaceInfo.projects)) ? workpaceInfo.projects.map(item => item.id) : [];
    }
  }
  for (const otherProjectId of otherProjectIds){
    projectModalEditSeletor.removeOption(otherProjectId);
  };
  projectModalEditSeletor.setValue(projectsids)
  var modal = new bootstrap.Modal(document.getElementById('workspace-modal-edit'));
  modal.show();
}

export async function editeWorkspace(){
  let wsid = document.getElementById("workspace-modal-edit-id").value
  let description = document.getElementById("workspace-modal-edit-description").value
  let multiprojectSelect = document.getElementById('workspace-modal-edit-multiproject');
  let multiprojects = Array.from(multiprojectSelect.selectedOptions, option => option.value);
  await webconsolejs["common/api/services/workspace_api"].updateWorkspaceById(wsid, description);
  const updateWPmappingsResp = await webconsolejs["common/api/services/workspace_api"].updateWPmappings(wsid, multiprojects);
  if (!updateWPmappingsResp.success){
    console.log("editeWorkspace Error : ", JSON.stringify(updateWPmappingsResp.message.error))
    webconsolejs['partials/layout/modal'].commonShowDefaultModal("ERROR","중복 할당된 프로젝트가 존재합니다.")
  }else {
    location.reload()
  }
}

//// projects table action 
export async function deleteProjects(){
  if (checked_projects_array.length === 0){
    webconsolejs['partials/layout/modal'].commonShowDefaultModal("Delete Project Mappings", "No Checked Projects")
    return
  }
  checked_projects_array.forEach(async function(checkedProject){
    var deleteWorkspaceProjectMappingByIdResp = await webconsolejs["common/api/services/workspace_api"].deleteWorkspaceProjectMappingById(currentClickedWorkspaceId, checkedProject.id);
    if (!deleteWorkspaceProjectMappingByIdResp.success){
      alert(JSON.stringify(updateWPmappingsResp.message.error))
    }
  })
  location.reload()
}

//// Project tab Modal
export function addWorkspaceProjectModalInit(){ 
  document.getElementById("project-modal-add-workspaceId").value = currentClickedWorkspaceId
  var modal = new bootstrap.Modal(document.getElementById('project-modal-add'));
  modal.show();
}

export async function addWorkspaceProject(){
  var targetWorkspaceId = document.getElementById("project-modal-add-workspaceId").value
  var projectName = document.getElementById("project-modal-add-name").value
  var projectDescription = document.getElementById("project-modal-add-description").value
  const createProjectResp = await webconsolejs["common/api/services/workspace_api"].createProject(projectName, projectDescription);
  if (!createProjectResp.success){
    alert(JSON.stringify(createProjectResp.message))
    return
  }else {
    const createWPmappingResp = await webconsolejs["common/api/services/workspace_api"].createWPmapping(targetWorkspaceId, [createProjectResp.message.id]);
    if (!createWPmappingResp.success){
      alert(JSON.stringify(createWPmappingResp.message))
      return
    } else {
      location.reload()
    }
  }
}

//// Role Tab Modal
export function addRoleModalInit(){ 
  setWorkspacesRolesPermissionInfoTable()
  var modal = new bootstrap.Modal(document.getElementById('role-modal-add'));
  modal.show();
}

export async function addRole(){
  var roleName = document.getElementById("role-modal-add-name").value
  var roleDesc = document.getElementById("role-modal-add-description").value
  const createRoleResp = await webconsolejs["common/api/services/workspace_api"].createRole(roleName, roleDesc);
  if (!createRoleResp.success){
    alert(JSON.stringify(createRoleResp.message))
    return
  }else {
    if (document.getElementById('role-modal-add-witthPolicy').checked){
      console.log(checked_rolePermissions_array)
      checked_rolePermissions_array.forEach(async function(role){
        const appendPolicesResp = await webconsolejs["common/api/services/workspace_api"].appendResourcePermissionPolicesByOperationId(role.framework, role.operationId, role.description, [createRoleResp.message.name]);
        if (!createRoleResp.success){
          console.log(JSON.stringify(appendPolicesResp.message))
        }else{
          console.log(role.framework, role.operationId, [createRoleResp.message.name], "....Success!")
        }
      });
    }
    location.reload()
  }
}

export async function initRoleDetailModal(role){
  document.getElementById("role-modal-detail-name").value=role.name
  document.getElementById("role-modal-detail-id").value=role.id
  document.getElementById("role-modal-detail-policyid").value=role.policy
  document.getElementById("role-modal-detail-description").value=role.description
  const dependentPermissions = await webconsolejs["common/api/services/workspace_api"].getdependentPermissionsByPolicyId(role.policy);
  if (!dependentPermissions.success){
    alert(JSON.stringify(dependentPermissions.message))
    return
  }else {
    setWorkspacesRolesDetailTable(dependentPermissions.message)
    var modal = new bootstrap.Modal(document.getElementById('role-modal-detail'));
    modal.show();
  }
  
}

export async function udpateRole(){
  var roleName = document.getElementById("role-modal-detail-name").value
  var roleDesc = document.getElementById("role-modal-detail-description").value
  var rolePolicyid = document.getElementById("role-modal-detail-policyid").value
  const dependentPermissions = await webconsolejs["common/api/services/workspace_api"].getdependentPermissionsByPolicyId(rolePolicyid);
  var idsArrObj = compareArrays(dependentPermissions.message, checked_rolePermissionsDetail_array)

  idsArrObj.added.forEach(async function(addedPermission){
    var permissionName = addedPermission.name.split(":")
    var resp = await webconsolejs["common/api/services/workspace_api"].appendResourcePermissionPolicesByOperationId(permissionName[0],permissionName[1],roleDesc,[roleName]);
    if (!resp.success){
      console.log(JSON.stringify(resp.message))
    }
  })

  idsArrObj.deleted.forEach(async function(deletedPermission){
    var permissionName = deletedPermission.name.split(":")
    var resp = await webconsolejs["common/api/services/workspace_api"].deleteResourcePermissionPolicesByOperationId(permissionName[0],permissionName[1],roleDesc,[roleName]);
    if (!resp.success){
      console.log(JSON.stringify(resp.message))
    }
  })

  location.reload()

}

function compareArrays(oldArray, newArray) {
  var oldIds = oldArray.map(item => item.id);
  var newIds = newArray.map(item => item.id);
  var deletedItems = oldArray.filter(item => !newIds.includes(item.id));
  var addedItems = newArray.filter(item => !oldIds.includes(item.id));
  return {
      added: addedItems,
      deleted: deletedItems
  };
}

//// Role Tab Action
export async function deleteRoles(){
  checked_roles_array.forEach(async function(role){
    const deleteRoleResp = await webconsolejs["common/api/services/workspace_api"].deleteRoleById(role.id);
    if (!deleteRoleResp.success){
      alert(JSON.stringify(deleteRoleResp.message))
      return
    }else {
      location.reload()
    }
  });
}

//// User Tab Modal
export async function addUserModalInit(){
  const resp = await webconsolejs["common/api/services/workspace_api"].getWorkspaceUserRoleMappingListByWorkspaceId(currentClickedWorkspaceId);
  var wsUser = Array.isArray(resp.userinfo) && resp.userinfo.length > 0 
    ? resp.userinfo.map(item => item.userid) 
    : [];
  var allUserIds = Array.isArray(listData.userList) && listData.userList.length > 0 
    ? listData.userList.map(item => item.username) 
    : [];
  var availUser = allUserIds.filter(item => !wsUser.includes(item))
  initUserAddSeletor(availUser)


  const roleResp = await webconsolejs["common/api/services/workspace_api"].getRoleList();
  initUserAddRoleSeletor(roleResp)

  var modal = new bootstrap.Modal(document.getElementById('user-modal-add'));
  modal.show();
}

export async function assignUser(){
  var usersSelector = document.getElementById('user-modal-add-userselector');
  var roleId = document.getElementById('user-modal-add-roleselector').value;
  var users = Array.from(usersSelector.selectedOptions, option => option.value);
  users.forEach(async function(user){
    const resp = await webconsolejs["common/api/services/workspace_api"].createWorkspaceUserRoleMappingByName(currentClickedWorkspaceId,roleId,user);
  })
  location.reload()
}

export async function deassignUser(){
  checked_userRolemapping_array.forEach(async function name(user) {
    const resp = await webconsolejs["common/api/services/workspace_api"].deleteWorkspaceUserRoleMapping(currentClickedWorkspaceId,user.username);
  })
  location.reload()
}

// tableaction area end


// tableSetup area start
function setWorkspacesProjectsInfoTabulator(
    tableObjId,
    tableObjParamMap,
    columnsParams,
    isMultiSelect
  ) {
    var placeholder = "No Data";
    var pagination = "local";
    var paginationSize = 5;
    var paginationSizeSelector = [5, 10, 15, 20];
    var movableColumns = true;
    var columnHeaderVertAlign = "middle";
    var paginationCounter = "rows";
    var layout = "fitColumns";
    var renderHorizontal = "virtual"
  
    if (tableObjParamMap.hasOwnProperty("placeholder")) {
      placeholder = tableObjParamMap.placeholder;
    }
  
    if (tableObjParamMap.hasOwnProperty("pagination")) {
      pagination = tableObjParamMap.pagination;
    }
  
    if (tableObjParamMap.hasOwnProperty("paginationSize")) {
      paginationSize = tableObjParamMap.paginationSize;
    }
  
    if (tableObjParamMap.hasOwnProperty("paginationSizeSelector")) {
      paginationSizeSelector = tableObjParamMap.paginationSizeSelector;
    }
  
    if (tableObjParamMap.hasOwnProperty("movableColumns")) {
      movableColumns = tableObjParamMap.movableColumns;
    }
  
    if (tableObjParamMap.hasOwnProperty("columnHeaderVertAlign")) {
      columnHeaderVertAlign = tableObjParamMap.columnHeaderVertAlign;
    }
  
    if (tableObjParamMap.hasOwnProperty("paginationCounter")) {
      paginationCounter = tableObjParamMap.paginationCounter;
    }
  
    if (tableObjParamMap.hasOwnProperty("layout")) {
      layout = tableObjParamMap.layout;
    }
  
    var tabulatorTable = new Tabulator("#" + tableObjId, {
      placeholder,
      pagination,
      paginationSize,
      paginationSizeSelector,
      movableColumns,
      columnHeaderVertAlign,
      paginationCounter,
      layout,
      renderHorizontal,
      columns: columnsParams,
    });
  
    return tabulatorTable;
}
function setWorkspacesUsersInfoTabulator(
  tableObjId,
  tableObjParamMap,
  columnsParams,
  isMultiSelect
) {
  var placeholder = "No Data";
  var pagination = "local";
  var paginationSize = 5;
  var paginationSizeSelector = [5, 10, 15, 20];
  var movableColumns = true;
  var columnHeaderVertAlign = "middle";
  var paginationCounter = "rows";
  var layout = "fitDataFill";
  var renderHorizontal = "virtual"

  if (tableObjParamMap.hasOwnProperty("placeholder")) {
    placeholder = tableObjParamMap.placeholder;
  }

  if (tableObjParamMap.hasOwnProperty("pagination")) {
    pagination = tableObjParamMap.pagination;
  }

  if (tableObjParamMap.hasOwnProperty("paginationSize")) {
    paginationSize = tableObjParamMap.paginationSize;
  }

  if (tableObjParamMap.hasOwnProperty("paginationSizeSelector")) {
    paginationSizeSelector = tableObjParamMap.paginationSizeSelector;
  }

  if (tableObjParamMap.hasOwnProperty("movableColumns")) {
    movableColumns = tableObjParamMap.movableColumns;
  }

  if (tableObjParamMap.hasOwnProperty("columnHeaderVertAlign")) {
    columnHeaderVertAlign = tableObjParamMap.columnHeaderVertAlign;
  }

  if (tableObjParamMap.hasOwnProperty("paginationCounter")) {
    paginationCounter = tableObjParamMap.paginationCounter;
  }

  if (tableObjParamMap.hasOwnProperty("layout")) {
    layout = tableObjParamMap.layout;
  }

  var tabulatorTable = new Tabulator("#" + tableObjId, {
    placeholder,
    pagination,
    paginationSize,
    paginationSizeSelector,
    movableColumns,
    columnHeaderVertAlign,
    paginationCounter,
    layout,
    renderHorizontal,
    columns: columnsParams,
  });

  return tabulatorTable;
}
function setWorkspaceRolesTabulator(
  tableObjId,
  tableObjParamMap,
  columnsParams,
  isMultiSelect
) {
  var placeholder = "No Data";
  var pagination = "local";
  var paginationSize = 5;
  var paginationSizeSelector = [5, 10, 15, 20];
  var movableColumns = true;
  var columnHeaderVertAlign = "middle";
  var paginationCounter = "rows";
  var layout = "fitColumns";

  // var renderHorizontal = "virtual"

  if (tableObjParamMap.hasOwnProperty("placeholder")) {
    placeholder = tableObjParamMap.placeholder;
  }

  if (tableObjParamMap.hasOwnProperty("pagination")) {
    pagination = tableObjParamMap.pagination;
  }

  if (tableObjParamMap.hasOwnProperty("paginationSize")) {
    paginationSize = tableObjParamMap.paginationSize;
  }

  if (tableObjParamMap.hasOwnProperty("paginationSizeSelector")) {
    paginationSizeSelector = tableObjParamMap.paginationSizeSelector;
  }

  if (tableObjParamMap.hasOwnProperty("movableColumns")) {
    movableColumns = tableObjParamMap.movableColumns;
  }

  if (tableObjParamMap.hasOwnProperty("columnHeaderVertAlign")) {
    columnHeaderVertAlign = tableObjParamMap.columnHeaderVertAlign;
  }

  if (tableObjParamMap.hasOwnProperty("paginationCounter")) {
    paginationCounter = tableObjParamMap.paginationCounter;
  }

  if (tableObjParamMap.hasOwnProperty("layout")) {
    layout = tableObjParamMap.layout;
  }

  var tabulatorTable = new Tabulator("#" + tableObjId, {
    placeholder,
    pagination,
    paginationSize,
    paginationSizeSelector,
    movableColumns,
    columnHeaderVertAlign,
    paginationCounter,
    layout,
    // renderHorizontal,
    columns: columnsParams,
    initialSort:[
      {column:"name", dir:"asc"}
    ],
  })

  return tabulatorTable;
}
function setWorkspaceRolesPermissionsTabulator(
  tableObjId,
  tableObjParamMap,
  columnsParams,
  isMultiSelect
) {
  var placeholder = "No Data";
  var movableColumns = true;
  var columnHeaderVertAlign = "middle";
  var paginationCounter = "rows";
  var layout = "fitDataFill";

  var tabulatorTable = new Tabulator("#" + tableObjId, {
    height:"350px",
    placeholder,
    movableColumns,
    columnHeaderVertAlign,
    paginationCounter,
    layout,
    columns: columnsParams,
    initialSort:[
      {column:"name", dir:"asc"}
    ],
  })

  return tabulatorTable;
}
function setWorkspaceRolesDetailTabulator(
  tableObjId,
  tableObjParamMap,
  columnsParams,
  isMultiSelect
) {
  var placeholder = "No Data";
  var columnHeaderVertAlign = "middle";
  // var layout = "fitDataFill";

  var tabulatorTable = new Tabulator("#" + tableObjId, {
    height:"350px",
    placeholder,
    columnHeaderVertAlign,
    // layout,
    columns: columnsParams,
    selectableRows: true,
  })

  return tabulatorTable;
}
function setWorkspacesTabulator(
    tableObjId,
    tableObjParamMap,
    columnsParams,
    isMultiSelect
  ) {
    var placeholder = "No Data";
    var pagination = "local";
    var paginationSize = 5;
    var paginationSizeSelector = [5, 10, 15, 20];
    var movableColumns = true;
    var columnHeaderVertAlign = "middle";
    var paginationCounter = "rows";
    var layout = "fitColumns";
    // var renderHorizontal = "virtual"
  
    var tabulatorTable = new Tabulator("#" + tableObjId, {
      placeholder,
      pagination,
      paginationSize,
      paginationSizeSelector,
      movableColumns,
      columnHeaderVertAlign,
      paginationCounter,
      layout,
      // renderHorizontal,
      columns: columnsParams,
      initialSort:[
        {column:"name", dir:"asc"}
      ],
      // selectableRows: true,
    })

    return tabulatorTable;
}
// tableSetup area end

function findRowIndexByColumnValue(table, column, value) {
  var tableData = table.getData();
  var rowIndex = tableData.findIndex(function(row) {
      return row[column] === value;
  });
  return rowIndex;
}

// table date column formatter
function datetimeFormatter(cell, formatterParams) {
  const dateStr = cell.getValue(); // 셀의 값을 가져옴
  if (!dateStr) return ""; // 값이 없으면 빈 문자열 반환


  // if (formatterParams && formatterParams.format === 'YYYY/MM/DD') {
  //   return `${year}/${month}/${day}`;
  // }
  return webconsolejs["common/util"].dateYYYYMMDDHH24MISS(dateStr)  
}