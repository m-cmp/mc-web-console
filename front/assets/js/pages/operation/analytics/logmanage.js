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
      field: "tag",
      formatter: tagNsIdFormatter,
      vertAlign: "middle"
    },
    {
      title: "MCI",
      field: "tag",
      formatter: tagMciIdFormatter,
      vertAlign: "middle"
    },
    {
      title: "Target",
      field: "tag",
      formatter: tagTargetIdFormatter,
      vertAlign: "middle"
    },
    {
      title: "Host",
      field: "tail",
      formatter: tailHostFormatter,
      vertAlign: "middle"
    },
    {
      title: "PID",
      field: "tail",
      formatter: tailPidFormatter,
      vertAlign: "middle"
    },
    {
      title: "Program",
      field: "tail",
      formatter: tailprogramFormatter,
      vertAlign: "middle"
    },
    {
      title: "Timestamp",
      field: "tail",
      formatter: tailTimestampFormatter,
      vertAlign: "middle"
    },
    {
      title: "Message",
      field: "tail",
      formatter: tailMessageFormatter,
      vertAlign: "middle"
    },
  ];

  // {
  //   "@timestamp": "2024-10-18T08:41:22.820224306Z",
  //   measurement_name: "tail",
  //   tag: {
  //     host: "2ebc9c59f973",
  //     mci_id: "mc-o11y",
  //     ns_id: "",
  //     path: "/var/log/syslog",
  //     target_id: "mc-o11y"
  //   },
  //   tail: {
  //     host: "o11y",
  //     message: "[httpd] 40.82.137.29 - mc-agent [18/Oct/2024:08:41:22 +0000] \"POST /write?db=mc-observability&rp=autogen HTTP/1.1 \" 204 0 \"-\" \"Telegraf/1.29.5 Go/1.22.0\" c103937f-8d2c-11ef-8867-0242ac130009 11023",
  //     pid: "886",
  //     program: "mc-o11y-influx",
  //     timestamp: "Oct 18 08:41:22"
  //   }
  // }
  logListTable = setLogTabulator("loglist-table", tableObjParams, columns, true);

  // 행 클릭 시
  logListTable.on("rowClick", function (e, row) {

    var selectedLogData = row.getData()
    // 표에서 선택된 selectedLogData
    getSelectedLogData(selectedLogData)

  });
}

// tag와 tail에 모두 host가 있어 function name에 prefix를 줌.
function tagHostFormatter(cell) {
  var row = cell.getData()
  return row.tag.host;
}
function tagNsIdFormatter(cell) {
  var row = cell.getData()
  return row.tag.ns_id;
}
function tagMciIdFormatter(cell) {
  var row = cell.getData()
  return row.tag.mci_id;
}
function tagTargetIdFormatter(cell) {
  var row = cell.getData()
  return row.tag.target_id;
}
function tagPathFormatter(cell) {
  var row = cell.getData()
  return row.tag.path;
}

function tailHostFormatter(cell) {
  var row = cell.getData()
  return row.tail.host;
}
function tailPidFormatter(cell) {
  var row = cell.getData()
  return row.tail.pid;
}
function tailprogramFormatter(cell) {
  var row = cell.getData()
  return row.tail.program;
}
function tailTimestampFormatter(cell) {
  var row = cell.getData()
  return row.tail.timestamp;
}
function tailMessageFormatter(cell) {
  var row = cell.getData()
  return row.tail.message;
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

  // 실제 API 호출 (현재는 주석 처리되어 있음)
  // try{ 
  //   var response = await webconsolejs["common/api/services/monitoring_api"].getMonitoringLog(selectedNsId, selectedMciId, selectedVmId, keyword);
  //   getLogListCallbackSuccess(response.data.responseData)
  // }catch(e){
  
  // 임시 데이터 (실제 API 연동 시 제거)
  const dataObject = {
    data: [
      {
        "@timestamp": "2024-11-06T08:41:22.820224306Z",
        measurement_name: "tail",
        tag: {
          host: "2ebc9c59f973",
          mci_id: selectedMciId,
          ns_id: selectedNsId,
          path: "/var/log/syslog",
          target_id: selectedVmId
        },
        tail: {
          host: "o11y",
          message: keyword ? `[Filtered by keyword: ${keyword}] [httpd] 40.82.137.29 - mc-agent [18/Oct/2024:08:41:22 +0000] "POST /write?db=mc-observability&rp=autogen HTTP/1.1 " 204 0 "-" "Telegraf/1.29.5 Go/1.22.0" c103937f-8d2c-11ef-8867-0242ac130009 11023` : "[httpd] 40.82.137.29 - mc-agent [18/Oct/2024:08:41:22 +0000] \"POST /write?db=mc-observability&rp=autogen HTTP/1.1 \" 204 0 \"-\" \"Telegraf/1.29.5 Go/1.22.0\" c103937f-8d2c-11ef-8867-0242ac130009 11023",
          pid: "886",
          program: "mc-o11y-influx",
          timestamp: "Nov 06 08:41:22"
        }
      }
    ]
  };
  getLogListCallbackSuccess(dataObject.data)
  // }
}

function getLogListCallbackSuccess(logList) {
  logListTable.setData(logList);

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