import { TabulatorFull as Tabulator } from "tabulator-tables";

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
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
  ////////////////////// partials init functions///////////////////////////////////////

  ////////////////////// partials init functions end ///////////////////////////////////////


  ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

  // workspace selection check
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject)
  ////////////////////// set workspace list, project list at Navbar end //////////////////////////////////

  if (selectedWorkspaceProject.projectId != "") {
    var selectedProjectId = selectedWorkspaceProject.projectId;
    var selectedNsId = selectedWorkspaceProject.nsId;
    
    // MCI 목록 로드
    var respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(selectedNsId);
    getMciListCallbackSuccess(selectedProjectId, respMciList);
  }
  
  // 이벤트 리스너 설정
  setupEventListeners();
}

// MCI 목록 로드 성공 시 콜백
function getMciListCallbackSuccess(nsId, mciList) {
  setMciList(mciList);
}

// MCI 목록을 셀렉트 박스에 설정
function setMciList(mciList) {
  var res_item = mciList.mci;

  // res_item이 배열인지 확인
  if (Array.isArray(res_item)) {
    // HTML option 리스트 초기값
    var html = '<option value="">Select</option>';

    // res_item 배열을 순회하면서 각 MCI의 name을 option 태그로 변환
    res_item.forEach(item => {
      html += '<option value="' + item.id + '">' + item.name + '</option>';
    });

    // log_mcilist 셀렉트 박스에 옵션 추가
    $("#log_mcilist").empty();
    $("#log_mcilist").append(html);
  } else {
    console.error("res_item is not an array");
  }
}

// MCI 선택 시 서버 목록 업데이트
async function displayLogMci(nsId, mciId) {
  var respMci = await webconsolejs["common/api/services/mci_api"].getMci(nsId, mciId);

  var vmList = respMci.responseData.vm;
  if (Array.isArray(vmList) && vmList.length > 0) {
    displayServerStatusList(mciId, respMci.responseData.vm);
  } else {
    alert("There is no VM List !!");
  }
}

// 서버 목록을 셀렉트 박스에 설정
function displayServerStatusList(mciId, vmList) {
  var res_item = vmList;

  if (Array.isArray(res_item)) {
    var html = '<option value="">Select</option>';

    res_item.forEach(item => {
      html += '<option value="' + item.id + '">' + item.name + '</option>';
    });

    // log_targetlist 셀렉트 박스에 옵션 추가
    $("#log_targetlist").empty();
    $("#log_targetlist").append(html);
  } else {
    console.error("res_item is not an array");
  }
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // MCI 선택 시 서버 목록 업데이트
  $("#log_mcilist").on('change', async function () {
    var selectedMci = $("#log_mcilist").val();
    
    if (selectedMci) {
      selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
      var selectedNsId = selectedWorkspaceProject.nsId;
      
      displayLogMci(selectedNsId, selectedMci);
    } else {
      // MCI가 선택되지 않으면 서버 목록 초기화
      $("#log_targetlist").empty().append('<option value="">Select</option>');
    }
  });
}

// // getLogList 호출 성공 시
// function getLogListCallbackSuccess(caller) {
//   console.log("getLogListCallbackSuccess");

// }

// // 클릭한 log의 info값 세팅
// function setLogInfoData(logData) {
//   console.log("setLogInfoData", logData)
//   try {


//   } catch (e) {
//     console.error(e);
//   }  
// }


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
      title: "NS",
      field: "labels",
      formatter: labelsNsIdFormatter,
      vertAlign: "middle"
    },
    {
      title: "MCI",
      field: "labels",
      formatter: labelsMciIdFormatter,
      vertAlign: "middle"
    },
    {
      title: "VM",
      field: "labels",
      formatter: labelsVMIdFormatter,
      vertAlign: "middle"
    },
    {
      title: "Host",
      field: "labels",
      formatter: labelsHostFormatter,
      vertAlign: "middle"
    },
    {
      title: "Timestamp",
      field: "timestamp",
      vertAlign: "middle"
    },
    {
      title: "Value",
      field: "value",
      vertAlign: "middle"
    }
  ];

  //  {
  //    "labels": {
  //      "MCI_ID": "mci01",
  //      "NS_ID": "test01",
  //      "VM_ID": "vm-1",
  //      "host": "d4127tlb7ccc738sedbg",
  //      "level": "UNKNOWN",
  //      "service": "systemd",
  //      "source": "syslog"
  //    },
  //    "timestamp": 1.761802223E18,
  //    "value": "{\"level\":\"UNKNOWN\",\"pid\":\"1\",\"filename\":\"syslog\",\"source\":\"syslog\",\"host\":\"d4127tlb7ccc738sedbg\",\"time\":\"Oct 30 14:30:23\",\"message\":\"Finished system activity accounting tool.\",\"service\":\"systemd\"}"
  //  }
  logListTable = setLogTabulator("loglist-table", tableObjParams, columns, true);

  // 행 클릭 시
  logListTable.on("rowClick", function (e, row) {

    var selectedLogData = row.getData()
    // 표에서 선택된 selectedLogData
    getSelectedLogData(selectedLogData)

  });
}

function labelsHostFormatter(cell) {
  var row = cell.getData()
  return row.labels.host;
}
function labelsNsIdFormatter(cell) {
  var row = cell.getData()
  return row.labels.NS_ID;
}
function labelsMciIdFormatter(cell) {
  var row = cell.getData()
  return row.labels.MCI_ID;
}
function labelsVMIdFormatter(cell) {
  var row = cell.getData()
  return row.labels.VM_ID;
}

// toggleSelectBox of table row
function toggleRowSelection(id) {
  // mciListTable에서 데이터 찾기
  var row = mciListTable.getRow(id);
  if (row) {
    row.select();
  } else {
  }
}


/////////////////////////Tabulator Filter start/////////////////////////
//Define variables for input elements

var valueEl = document.getElementById("filter-value");



// Trigger setFilter function with correct parameters
function updateFilter() {

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


// Log 조회
export async function getCollectedLog() {
  var selectedMciId = $("#log_mcilist").val();
  var selectedVmId = $("#log_targetlist").val();
  var keyword = $("#keyword").val();

  // 선택 검증
  if (!selectedMciId) {
    alert("Please select a Workload");
    return;
  }

  if (!selectedVmId) {
    alert("Please select a Server");
    return;
  }

  // 선택된 워크스페이스 정보 가져오기
  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
  var selectedNsId = selectedWorkspaceProject.nsId;

  try{
    console.log("Fetching log data...", { nsId: selectedNsId, mciId: selectedMciId, vmId: selectedVmId, keyword: keyword });
    var response = await webconsolejs["common/api/services/monitoring_api"].getMonitoringLog(selectedNsId, selectedMciId, selectedVmId, keyword);

    console.log("Full response:", response);
    console.log("Response data:", response.data);
    console.log("Response data.responseData:", response.data?.responseData);

    if (response && response.data && response.data.responseData && response.data.responseData.data && response.data.responseData.data.data) {
      getLogListCallbackSuccess(response.data.responseData.data.data);
    } else {
      console.error("Invalid response structure:", response);
      alert("Failed to load log data: Invalid response structure");
    }
  }catch(e){
    console.error("Error fetching log data:", e);
    alert("Error fetching log data: " + e.message);
  }
}

function getLogListCallbackSuccess(logList) {
  console.log("Setting table data:", logList);
  console.log("Is logList an array?", Array.isArray(logList));
  console.log("logList length:", logList?.length);

  if (!logList) {
    console.error("logList is null or undefined");
    alert("No log data available");
    return;
  }

  if (!Array.isArray(logList)) {
    console.error("logList is not an array:", typeof logList);
    alert("Invalid log data format");
    return;
  }

  logListTable.setData(logList);
  console.log("Table data set successfully");
}

async function getSelectedLogData(selectedLogData) {
  var div = document.getElementById("log_info");
  webconsolejs["partials/layout/navigatePages"].toggleElement(div)
  $('#log_timestamp').text(selectedLogData["@timestamp"]);
  $('#log_measurement_name').text(selectedLogData["measurement_name"]);

  $('#log_message').text(selectedLogData.tail.message);

  $('#log_tag_host').text(selectedLogData.tag.host);
  $('#log_mci_id').text(selectedLogData.tag.mci_id);
  $('#log_ns_id').text(selectedLogData.tag.ns_id);
  $('#log_path').text(selectedLogData.tag.path);
  $('#log_target_id').text(selectedLogData.tag.target_id);

  $('#log_tail_host').text(selectedLogData.tag.host);
  $('#log_pid').text(selectedLogData.tail.pid);
  $('#log_program').text(selectedLogData.tail.program);
  $('#log_tail_timestamp').text(selectedLogData.tail.timestamp);

}