import { TabulatorFull as Tabulator } from "tabulator-tables";
import TomSelect from 'tom-select';

var checked_array = [];
var listData;
var workspaceListInfoSummary = {workspaceCount:0, projectsCount:0, groupCount:0, memberCount:0}
var workspacesListTable;
var workspacesProjectsInfo;
var workspacesUserInfo;
var currentClickedWorkspace;

var projectModalSeletor;
var projectModalEditSeletor;

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
        visible: true
      },
      {
        title: "Updated At",
        field: "updated_at",
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
      getSelectedWorkspaceInfocardInit(row.getCell("id").getValue())
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

    // workspacesProjectsInfo.on("rowClick", function (e, row) {
    //   var WorkspacesID = row.getCell("id").getValue();
    //   getSelectedWorkspacesData(WorkspacesID)
    // });
  
    // workspacesProjectsInfo.on("rowSelectionChanged", function (data, rows) {
    //   checked_array = data
    // });
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
  
    // workspacesProjectsInfo.on("rowSelectionChanged", function (data, rows) {
    //   checked_array = data
    // });
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
// before DOMContentLoaded area end


// DOMContentLoaded area start
document.addEventListener("DOMContentLoaded", initWorkspace);
async function initWorkspace() {
    console.log("initWorkspace")
    await updateInitData()
    updateSummary()
    initProjectModalSeletor()
    await setWokrspaceTableData()
}

async function updateInitData(){
  var respWorkspaceList = await webconsolejs["common/api/services/workspace_api"].getAllWorksaceList();
  var respUsersList = await webconsolejs["common/api/services/workspace_api"].getUsers();
  var respProjectList = await webconsolejs["common/api/services/workspace_api"].getProjectList();
  workspaceListInfoSummary.workspaceCount = respWorkspaceList.length
  workspaceListInfoSummary.memberCount = respUsersList.length
  workspaceListInfoSummary.projectsCount = respProjectList.length
  listData = {wsList:respWorkspaceList, userList:respUsersList, prjList:respProjectList}
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
  listData.prjList.forEach(prj => {
    let option = document.createElement('option');
    option.value = prj.id;
    option.text = prj.name;
    selectElement.add(option);
  });
  if (selectElement) {
    projectModalSeletor = new TomSelect(selectElement);
  }
}

function initProjectModalEditSeletor(){
  var selectElement = document.getElementById('workspace-modal-edit-multiproject');
  listData.prjList.forEach(prj => {
    let option = document.createElement('option');
    option.value = prj.id;
    option.text = prj.name;
    selectElement.add(option);
  });
  if (selectElement) {
    projectModalEditSeletor = new TomSelect(selectElement);
  }
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
  const checked_array_ids = checked_array.map(item => item.id);
  if (!checked_array_ids.includes(workspacesID)){
    webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("workspace-info-card"))
    return
  } else {
    webconsolejs["partials/layout/navigatePages"].activeElement(document.getElementById("workspace-info-card"))
  }

  // Details Tab
  var respWorkspaceInfo = await webconsolejs["common/api/services/workspace_api"].getWPmappingListByWorkspaceId(workspacesID);
  document.getElementById("workspace-details-name").innerText = respWorkspaceInfo.workspace.name
  document.getElementById("workspace-details-description").innerText = respWorkspaceInfo.workspace.description
  document.getElementById("workspace-details-systemId").innerText = respWorkspaceInfo.workspace.id
  document.getElementById("workspace-details-created").innerText = respWorkspaceInfo.workspace.created_at
  document.getElementById("workspace-details-updated").innerText = respWorkspaceInfo.workspace.updated_at
  document.getElementById("workspace-details-presentation").innerText = respWorkspaceInfo.workspace.name + " Info"

  // Projects Tab
  setWokrspaceProjectsTableData(respWorkspaceInfo.projects)

  // Users Tab
  await setWokrspaceUserTableData(workspacesID)
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
// info card area end


// tableaction area start
export async function creatworkspaceProject(){
  let wsName = document.getElementById("workspace-modal-add-name").value
  let wsDesc = document.getElementById("workspace-modal-add-description").value
  const createdWorkspace = await webconsolejs["common/api/services/workspace_api"].createWorkspace(wsName, wsDesc);
  if  (document.getElementById('workspace-modal-add-withprojects').checked){
    let multiprojectSelect = document.getElementById('workspace-modal-add-multiproject');
    let multiprojects = Array.from(multiprojectSelect.selectedOptions, option => option.value);
    const createdWPmapping = await webconsolejs["common/api/services/workspace_api"].createWPmapping(createdWorkspace.id, multiprojects);
  }
}

export async function deleteWorkspaces(){
  if (checked_array.length === 0){
    webconsolejs['partials/layout/modal'].commonShowDefaultModal("Delete Workspaces", "No Checked Workspace")
  }
  checked_array.forEach(async function(checkedWorkspace){
    await webconsolejs["common/api/services/workspace_api"].deleteWorkspaceById(checkedWorkspace.id);
  })
}

export async function editeWorkspaceModalInit(){
  if (checked_array.length === 0 || checked_array.length > 1){
    webconsolejs['partials/layout/modal'].commonShowDefaultModal("Edit Workspaces", "No workspaces checked or more than one.")
    return
  }
  document.getElementById("workspace-modal-edit-id").value = checked_array[0].id
  document.getElementById("workspace-modal-edit-name").value = checked_array[0].name
  document.getElementById("workspace-modal-edit-description").value = checked_array[0].description
  var respWorkspacesInfo = await webconsolejs["common/api/services/workspace_api"].getWPmappingListOrderbyWorkspace();
  // var respWorkspaceInfo = await webconsolejs["common/api/services/workspace_api"].getWPmappingListByWorkspaceId(checked_array[0].id);
  console.log(respWorkspacesInfo)
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
  otherProjectIds.forEach(prjid => {
    projectModalEditSeletor.removeOption(prjid);
  });
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
      selectableRows: isMultiSelect == false ? 1 : true,
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
    selectableRows: isMultiSelect == false ? 1 : true,
  });

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
      selectableRows: isMultiSelect == false ? 1 : true,
    });
  
    return tabulatorTable;
}
// tableSetup area end