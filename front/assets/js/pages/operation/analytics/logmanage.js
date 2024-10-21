import { TabulatorFull as Tabulator } from "tabulator-tables";

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
  console.log("select-current-project changed ")
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
  console.log("select-current-project on change ", project)
})


///////////////
// 기능 1 : workload에서 mci를 선택하면 -> mci목록 보여주고 pmk를 선택하면 pmk목록을 보여준다.
// 기능 2 :     mci목록에서 mci를 선택하면 vm목록을 보여주고 pmk목록에서 pmk를 선택하면 nodegroup목록을 보여준다.
// 기능 3 : filter 조건은 range, limit, conditions가 있다.
//      limit : 가져올 row 갯수 
//      range : ??
//      conditions :
//          key:"tag.ns_id", value:""       -> value는 선택된 nsId
//          key:"tag.mci_id", value:""      -> value는 선택된 mciId
//          key:"tag.target_id", value:""   -> value는 선택된 vmId

//          key:"tail.message", value:""    -> value는 filter하고자 하는 keyword
//
//


///////////////
////
// 모달 콜백 예제
export function commoncallbac(val) {
  alert(val);
}
////

var selectedWorkspaceProject = new Object();
export var selectedMciObj = new Object();
export var nsid = "";
var currentMciId = "";
var selectedVmId = "";

var logListTable;
initLogTable(); // init tabulator

document.addEventListener("DOMContentLoaded", initLog);

// 해당 화면에서 최초 설정하는 function
async function initLog() {
  console.log("initLog")
  ////////////////////// partials init functions///////////////////////////////////////

  ////////////////////// partials init functions end ///////////////////////////////////////


  ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

  // workspace selection check
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject)
  ////////////////////// set workspace list, project list at Navbar end //////////////////////////////////

  if (selectedWorkspaceProject.projectId != "") {
    console.log("workspaceProject ", selectedWorkspaceProject)
    //var selectedProjectId = selectedWorkspaceProject.projectId;
    //var selectedNsId = selectedWorkspaceProject.nsId;
    //console.log('in initMci selectedNsId:', selectedNsId);

  }
}

// getLogList 호출 성공 시
function getLogListCallbackSuccess(caller) {
  console.log("getLogListCallbackSuccess");
  
}

// 클릭한 log의 info값 세팅
function setLogInfoData(logData) {
  console.log("setLogInfoData", logData)
  try {
    

  } catch (e) {
    console.error(e);
  }  
}


////////////////////////////////////////////////////// TABULATOR Start //////////////////////////////////////////////////////
// tabulator 행, 열, 기본값 설정
// table이 n개 가능하므로 개별 tabulator 정의 : 원리 util 안에 setTabulator있음.
function setLogTabulator(
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

// tabulator Table 초기값 설정
function initLogTable() {

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
      visible: true
    },
    
    {
      title: "Name",
      field: "name",
      vertAlign: "middle"
    },
    
  ];

  logListTable = setLogTabulator("mcilist-table", tableObjParams, columns, true);

  // 행 클릭 시
  logListTable.on("rowClick", function (e, row) {
    
  });
  
}

// toggleSelectBox of table row
function toggleRowSelection(id) {
  // mciListTable에서 데이터 찾기
  console.log("idid : ", id)
  var row = mciListTable.getRow(id);
  console.log("rowrow", row)
  if (row) {
    row.select();
    console.log("Row with ID " + id + " is selected.");
  } else {
    console.log("Row with ID " + id + " not found.");
  }
}


/////////////////////////Tabulator Filter start/////////////////////////
//Define variables for input elements
var fieldEl = document.getElementById("filter-field");
var typeEl = document.getElementById("filter-type");
var valueEl = document.getElementById("filter-value");



// Trigger setFilter function with correct parameters
function updateFilter() {
  var filterVal = fieldEl.options[fieldEl.selectedIndex].value;
  var typeVal = typeEl.options[typeEl.selectedIndex].value;

//   var filter = filterVal == "provider" ? providerFilter : filterVal;

//   if (filterVal == "provider") {
//     typeEl.value = "=";
//     typeEl.disabled = true;
//   } else {
//     typeEl.disabled = false;
//   }

//   if (filterVal) {
//     table.setFilter(filter, typeVal, valueEl.value);
//   }
}

// Update filters on value change
document.getElementById("filter-field").addEventListener("change", updateFilter);
document.getElementById("filter-type").addEventListener("change", updateFilter);
document.getElementById("filter-value").addEventListener("keyup", updateFilter);

// Clear filters on "Clear Filters" button click
document.getElementById("filter-clear").addEventListener("click", function () {
  fieldEl.value = "";
  typeEl.value = "=";
  valueEl.value = "";

  table.clearFilter();

});
/////////////////////////Tabulator Filter END/////////////////////////

////////////////////////////////////////////////////// END TABULATOR ///////////////////////////////////////////////////