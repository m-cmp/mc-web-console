import { TabulatorFull as Tabulator } from "tabulator-tables";

var totalWorkspaceListObj = new Object();
var selectedWorkspaceProject = new Object();

var totalWorkspaceStatusMap = new Map();
var totalVmStatusMap = new Map();

var selectedWorkspaceId = "";
var currentWorkspaceiId = "";

var checked_array = [];
var selectedWorkspaceID = ""


var workspaceListTableData; 
var workspacesListTable;


initWorkspacesTable()

function initWorkspacesTable() {
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
            visible: true
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
            title: "Member And Role",
            field: "memberandrole",
            visible: true
        },
    ];
  
    workspacesListTable = setWorkspacesTabulator("Workspaceslist-table", tableObjParams, columns, true);
  
    // WorkspacesListTable.on("rowClick", function (e, row) {
    //   selectedVmId = ""
    //   var WorkspacesID = row.getCell("id").getValue();
    //   console.log("WorkspacesID", WorkspacesID)
    //   getSelectedWorkspacesData(WorkspacesID)
    // });
  
    // WorkspacesListTable.on("rowSelectionChanged", function (data, rows) {
    //   checked_array = data
    //   console.log("checked_array", checked_array)
    //   console.log("rowsrows", data)
    //   selectedWorkspacesObj = data
    // });
}


document.addEventListener("DOMContentLoaded", initWorkspace);

async function initWorkspace() {
    console.log("initWorkspace")

    var tableListData = [];
    var respWorkspaceList = await webconsolejs["common/api/services/workspace_api"].getAllWorksaceList();
    respWorkspaceList.forEach(async function (workspace) {
        
        var respWorkspaceRoleMappingList = await webconsolejs["common/api/services/workspace_api"].getWorkspaceUserRoleMappingListByWorkspaceId(workspace.id);
        var wsurmappingTableData = [];

        if (respWorkspaceRoleMappingList.userinfo){
            respWorkspaceRoleMappingList.userinfo.forEach(function(wsmapping){
                wsurmappingTableData.push(wsmapping.userid+":"+wsmapping.role.name)
            })
        }

        tableListData.push({
            name:workspace.name,
            id:workspace.id,
            description:workspace.description,
            created_at:workspace.created_at,
            updated_at:workspace.updated_at,
            memberandrole:wsurmappingTableData
        })
    });


    console.log("tableListData", tableListData)
    workspacesListTable.setData(tableListData)
    // ##################### partials init functions #####################
    // ##################### partials init functions end #####################
    // ##################### workspace selection check #####################
    // ##################### set workspace list, project list at Navbar end #####################
}






function getWorksapceListCallbackSuccess(caller, mciList) {
    console.log("getMciListCallbackSuccess");
}

function displayWorkspaceStatusArea() {
    console.log("displayWorkspaceStatusArea");

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
      columns: columnsParams,
      selectableRows: isMultiSelect == false ? 1 : true,
    });
  
    return tabulatorTable;
}