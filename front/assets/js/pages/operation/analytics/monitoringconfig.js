import { TabulatorFull as Tabulator } from "tabulator-tables";

////////////////////////////////////////////////////// TABULATOR Start /////////////////////////////////////////////////
// tabulator 행, 열, 기본값 설정
// table이 n개 가능하므로 개별 tabulator 정의 : 원리 util 안에 setTabulator있음.
function setTabulator(
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
////////////////////////////////////////////////////// END TABULATOR ///////////////////////////////////////////////////

// navBar에 있는 object인데 직접 handling(onchange)
$("#select-current-project").on('change', async function () {
  console.log("select-current-project changed ")
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  if (this.value == "") return;
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)
  console.log("select-current-project on change ", project)
  
})

export var nsid = "";
export var selectedWorkloads = new Array();// multi 선택 가능함

// workspace -> project -> workload -> servernode
// selectXXX => object, currentXXX => id와 같은 string 값
var selectedWorkspaceProject = new Object();

var selectedServerNode = new Object();
var currentWorkloadId = "";
var currentServernodeId = "-1";

// tables
var monitorConfigListTable;
var monitorMetricsTable;
var editMetricsModalTable;
var monitorLogTraceTable;
var editLogCollectorModalTable;
var monitorStoragesTable;
var editStorageModalTable;

//DOMContentLoaded 는 Page에서 1개만.
// init + 파일명 () : ex) initMci() 를 호출하도록 한다.
document.addEventListener("DOMContentLoaded", initMonitorConfig);

// 해당 화면에서 최초 설정하는 function
//로드 시 prj 값 받아와 getMciList 호출
async function initMonitorConfig() {
  console.log("initMonitorConfig")
  ////////////////////// partials init functions start ///////////////////////////////////////
  
  ////////////////////// partials init functions end   ///////////////////////////////////////


  ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

  // workspace selection check
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject)
  ////////////////////// set workspace list, project list at Navbar end //////////////////////////////////


  if (selectedWorkspaceProject.projectId != "") {
    var currentNsId = selectedWorkspaceProject.nsId;
    getWorkloadList(currentNsId)    
  }

  // init tabulator ALL
  initMonitorConfigTable();
  initMonitorMetricsTable();
  initEditMetricsModalTable();
  initmonitorLogTraceTable();
  initEditLogCollectorModalTable();
  initMonitorStoragesTable();
  initEditStorageModalTable();
}

// workload 목록 조회 ( mci + pmk )
async function getWorkloadList(nsId){
  var respMciList = await webconsolejs["common/api/services/mci_api"].getMciIdList(nsId);
  console.log("respMciList" , respMciList)
  var res_item = respMciList.output;
  
  // HTML option 리스트 초기값
  var html = '<option value="">Select</option>'; 
  if (Array.isArray(res_item)) {
    res_item.forEach(item => {
      html += '<option value="' + item + '">' + item + '</option>';
    });
  } else {
    console.error("res_item is not an array");
  }
  // workloadlist 셀렉트 박스에 옵션 추가
  $("#workloadlist").empty();
  $("#workloadlist").append(html);
}

// workload(mci,pmk) 선택했을 때 monitoring 정보 조회 
$("#workloadlist").on('change', async function () {
  // 현재 mci만 monitoring 하므로 mci/pmk 구분없이 mci 호출
  var currentNsId = selectedWorkspaceProject.nsId;
  currentWorkloadId = $("#workloadlist").val()
  var currentWorkloadName = $("#workloadlist option:selected").text();

  var vmMap = new Map();
  
  // 1. mci의 vm 목록 조회(install 여부를 위해 필요.)
  try {
    var response = await webconsolejs["common/api/services/mci_api"].getMci(currentNsId, currentWorkloadId);
    var aMci = response.responseData
    console.log("aMci ", aMci)
    for (var vmIndex in aMci.vm) {
      var aVm = aMci.vm[vmIndex]
      aVm.workloadType = "MCI"; // [MCI/PMK]
      aVm.workloadName = currentWorkloadName;
      aVm.monAgentStatus = "Not Installed";
      vmMap.set(aVm.id, aVm);
    }
    // 2. mci에 agent 설치된 목록 조회
    var monitorTargetList = await webconsolejs["common/api/services/monitoring_api"].getTargetsNsMci(currentNsId, currentWorkloadId)
    console.log("monitorTargetList :",monitorTargetList)
    for (var i in monitorTargetList.data) {
      console.log("monitorTargetList.data[i].id", i, monitorTargetList.data[i].id)
      //   [
      //     {
      //         "alias_name": null,
      //         "description": "dm0x",
      //         "id": "vm-1",
      //         "mci_id": "mci01",
      //         "name": null,
      //         "ns_id": "ns01",
      //         "state": "ACTIVE"
      //     }
      // ]
      var findVm = vmMap.get(monitorTargetList.data[i].id)
      if(findVm){
        findVm.monAgentStatus = monitorTargetList.data[i].state; // [ACTIVE/INACTIVE]
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ monitorTargetList.data[i].state", monitorTargetList.data[i])
        vmMap.set(findVm.id, findVm);
      }
    }
  }catch(e){
    console.log(e)
  }

  // 3. mci에 log 설정??
  console.log("vmMap", Array.from(vmMap.values()))

  // 4. table에 필요한 data set
  monitorConfigListTable.setData(Array.from(vmMap.values()));
})

// tabulator Table 초기값 설정
function initMonitorConfigTable() {

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
      title: "Type",
      field: "workloadType",
      vertAlign: "middle",
      hozAlign: "center",
      headerSort: false,
    },
    {
      title: "Workload",
      field: "workloadName",
      vertAlign: "middle",
      hozAlign: "center",
      headerSort: false,
      width: 100,
      maxWidth: 130,
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
    
    // {
    //   title: "Monitor",
    //   field: "monitor",      
    //   visible: true
    // },
    {
      title: "Agent Statue",
      field: "monAgentStatus",
      vertAlign: "middle",
      hozAlign: "center",
      width: 120,
    },
    {
      title: "Collect Status",
      field: "collectStatus",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      maxWidth: 150,
    },
    {
      title: "Collect datetime",
      field: "collectDatetime",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      maxWidth: 150,
    },
    {
      title: "Log/Treace",
      field: "logTrace",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      maxWidth: 135,
    },
  ];

  monitorConfigListTable = setTabulator("monitorconfiglist-table", tableObjParams, columns, true);

  // 행 클릭 시
  monitorConfigListTable.on("rowClick", function (e, row) {
    selectedServerNode = row.getData(); 
    //var workloadType = row.getCell("workloadType").getValue();    
    var tempServernodeId = currentServernodeId;    
    currentServernodeId = row.getCell("id").getValue();
    // console.log("row ", row.getData())
    // console.log("currentServernodeId ", currentServernodeId)

    // 상세 정보 표시 여부
    if (tempServernodeId === currentServernodeId) {
      webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("monitoring_configuration"))
      this.dese
      returnlectRow();
    } else {
      webconsolejs["partials/layout/navigatePages"].activeElement(document.getElementById("monitoring_configuration"))
      this.deselectRow();
      this.selectRow(currentServernodeId);
      // 표에서 선택된 Servernode
      getSelectedMonitorConfigData(currentServernodeId)
      return
    }
  });

  monitorConfigListTable.on("cellClick", function(e, cell){
    var field = cell.getField();
    if(field == "monAgentStatus"){
      var agentStatus = cell.getValue();
      console.log("agentStatus", agentStatus)
      if(agentStatus != "ACTIVE" && agentStatus != "INACTIVE"){
        console.log("Row data:", cell.getRow().getData());
        console.log("id data:", cell.getRow().getData().id);
        var targetVmId = cell.getRow().getData().id;
        var targetModal = "commonDefaultModal";
        var modalTitle = "MonitoringAgentInstall"
        var modalContent = "Would you like to install the monitoring agent?";
        var modalFunc = "pages/operation/analytics/monitoringconfig.installMonitoringAgent";
        webconsolejs['partials/layout/modal'].commonConfirmModal(targetModal, modalTitle, modalContent, modalFunc, targetVmId);
      }
    }
  });

  // TODO : 선택된 여러개 row에 대해 처리
  monitorConfigListTable.on("rowSelectionChanged", function (data, rows) {
    // checked_array = data
    // console.log("checked_array", checked_array)
    // console.log("rowsrows", data)
    // selectedServernode = data
  });
}
// cell click 시 실행됨
export function installMonitoringAgent(vmId){
  var currentNsId = selectedWorkspaceProject.nsId;
  console.log("(currentNsId, currentWorkloadId, vmId)=", currentNsId, currentWorkloadId, vmId);
  var response = webconsolejs["common/api/services/monitoring_api"].InstallMonitoringAgent(currentNsId, currentWorkloadId, vmId);
  console.log(response);
}


function initMonitorMetricsTable() {

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
      title: "Server Name/Id",
      field: "target_id",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Plugin name",
      field: "plugin_name",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Plugin seq",
      field: "plugin_seq",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Prediction",
      field: "predictionIsEnable",
      formatter: predictionFormatterToggle,
    },
    {
      title: "Detection",
      field: "predictionIsEnable",
      formatter: detectionFormatterToggle,
    },
  ];

  monitorMetricsTable = setTabulator("monitorMetricsTable", tableObjParams, columns, true);

  // 행 클릭 시
  monitorMetricsTable.on("rowClick", function (e, row) {
    console.log("rowClick", row.getData())
  });

  monitorMetricsTable.on("cellClick", function(e, cell){
    console.log("cellClick", cell.getValue())
  });

  // TODO : 선택된 여러개 row에 대해 처리
  monitorMetricsTable.on("rowSelectionChanged", function (data, rows) {

  });
}
// formatter
function predictionFormatterToggle(data) {
  return `<a class="btn btn-outline-primary w-100 mb-3" href="#" data-bs-toggle="modal" data-bs-target="#setAnormalyDetectionModal">
  prediction
  </a>`
}
function detectionFormatterToggle(data) {
  return `<a class="btn btn-outline-primary w-100 mb-3" href="#" data-bs-toggle="modal" data-bs-target="#setMonitoringPredictionModal">
      detection
    </a>`
}

function decodeBase64(data) {
  return atob(data);
}


function initEditMetricsModalTable() {

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
      title: "measurement",
      field: "measurement",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "metrics",
      field: "metrics",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
  ];

  editMetricsModalTable = setTabulator("editMetricsModalTable", tableObjParams, columns, true);

  // 행 클릭 시
  editMetricsModalTable.on("rowClick", function (e, row) {
    console.log("rowClick", row.getData())
    // selectedServerNode = row.getData(); 
    // var tempServernodeId = currentServernodeId;    
    // currentServernodeId = row.getCell("id").getValue();
    // console.log("row ", row.getData())
    // console.log("currentServernodeId ", currentServernodeId)
  });

  editMetricsModalTable.on("cellClick", function(e, cell){
    console.log("cellClick", cell.getValue())
    // var field = cell.getField();
    // if(field == "monAgentStatus"){
    //   var agentStatus = cell.getValue();
    //   console.log("agentStatus", agentStatus)
    //   if(agentStatus != "ACTIVE" && agentStatus != "INACTIVE"){
    //     console.log("Row data:", cell.getRow().getData());
    //     console.log("id data:", cell.getRow().getData().id);
    //     var targetVmId = cell.getRow().getData().id;
    //     var targetModal = "commonDefaultModal";
    //     var modalTitle = "MonitoringAgentInstall"
    //     var modalContent = "Would you like to install the monitoring agent?";
    //     var modalFunc = "pages/operation/analytics/monitoringconfig.installMonitoringAgent";
    //     webconsolejs['partials/layout/modal'].commonConfirmModal(targetModal, modalTitle, modalContent, modalFunc, targetVmId);
    //   }
    // }
  });

  // TODO : 선택된 여러개 row에 대해 처리
  editMetricsModalTable.on("rowSelectionChanged", function (data, rows) {

  });
}

function initmonitorLogTraceTable() {

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
      title: "seq",
      field: "seq",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Server Name/Id",
      field: "Server Name/Id",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Plugin name",
      field: "Plugin name",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Plugin seq",
      field: "Plugin seq",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Plugin Config",
      field: "Plugin Config",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    }
  ];

  monitorLogTraceTable = setTabulator("monitorLogTraceTable", tableObjParams, columns, true);

  // 행 클릭 시
  monitorLogTraceTable.on("rowClick", function (e, row) {
    console.log("rowClick", row.getData())
  });

  monitorLogTraceTable.on("cellClick", function(e, cell){
    console.log("cellClick", cell.getValue())
  });

  // TODO : 선택된 여러개 row에 대해 처리
  monitorLogTraceTable.on("rowSelectionChanged", function (data, rows) {

  });
}

function initEditLogCollectorModalTable() {

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
      title: "Target Item",
      field: "Target Item",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Description",
      field: "Description",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    }
  ];

  editLogCollectorModalTable = setTabulator("editLogCollectorModalTable", tableObjParams, columns, true);

  // 행 클릭 시
  editLogCollectorModalTable.on("rowClick", function (e, row) {
    console.log("rowClick", row.getData())
  });

  editLogCollectorModalTable.on("cellClick", function(e, cell){
    console.log("cellClick", cell.getValue())
  });

  // TODO : 선택된 여러개 row에 대해 처리
  editLogCollectorModalTable.on("rowSelectionChanged", function (data, rows) {

  });
}

function initMonitorStoragesTable() {

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
      title: "Server Name/Id",
      field: "Server Name/Id",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Plugin Name",
      field: "Plugin Name",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Plugin seq",
      field: "Plugin seq",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Plugin Config",
      field: "Plugin Config",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    }
  ];

  monitorStoragesTable = setTabulator("monitorStoragesTable", tableObjParams, columns, true);

  // 행 클릭 시
  monitorStoragesTable.on("rowClick", function (e, row) {
    console.log("rowClick", row.getData())
  });

  monitorStoragesTable.on("cellClick", function(e, cell){
    console.log("cellClick", cell.getValue())
  });

  // TODO : 선택된 여러개 row에 대해 처리
  monitorStoragesTable.on("rowSelectionChanged", function (data, rows) {

  });
}

function initEditStorageModalTable() {

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
      title: "Storage name",
      field: "Storage name",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Description",
      field: "Description",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    }
  ];

  editStorageModalTable = setTabulator("editStorageModalTable", tableObjParams, columns, true);

  // 행 클릭 시
  editStorageModalTable.on("rowClick", function (e, row) {
    console.log("rowClick", row.getData())
  });

  editStorageModalTable.on("cellClick", function(e, cell){
    console.log("cellClick", cell.getValue())
  });

  // TODO : 선택된 여러개 row에 대해 처리
  editStorageModalTable.on("rowSelectionChanged", function (data, rows) {

  });
}



// 클릭한 monitor config info 가져오기
// 표에서 선택된 MonitorConfigId 받아옴
function getSelectedMonitorConfigData(servernodeId) {
  console.log('selectedMonitorConfigID:', servernodeId);
  if (servernodeId == undefined || servernodeId == "") {
    console.log("return ", servernodeId)
    return;
  }
  console.log("selectedServerNode.id", selectedServerNode.id)
  setMonitorConfigInfoData();
  setMonitorMetricsTable();
}

// 클릭한 mci의 info값 세팅
async function setMonitorConfigInfoData() {
  var htmlCardIdPrefix = "#monitoringconfig_info_"
  try {
    const generateOnOffIndicator = (status) => `<label class="form-check form-switch">
        <input class="form-check-input" type="checkbox" ${status ? 'checked' : ''}>
      </label>
    `;
    const generateStatusIndicator = (result, status) => `<span class="badge bg-${result} me-1"></span>${status}`;
    console.log("selectedServerNode.label", selectedServerNode.label)
    $('span[name="selectedMonTargetVM"]').each(function() {
        $(this).html(selectedServerNode.label["sys.id"]);
    });

    $('input[name="selectedMonTargetVM"]').each(function() {
        $(this).val(selectedServerNode.label["sys.id"]);
    });
  
    $(htmlCardIdPrefix+"name").text(selectedServerNode.name+" / "+selectedServerNode.id)
    $(htmlCardIdPrefix+"desc").text(selectedServerNode.description)
    $(htmlCardIdPrefix+"workload").text(selectedServerNode.workloadType+" / "+selectedServerNode.workloadName)
    $(htmlCardIdPrefix+"monitor").html(generateOnOffIndicator(selectedServerNode.monAgentStatus === "ACTIVE" ? true : false))
    $(htmlCardIdPrefix+"agent_status").html(generateStatusIndicator(selectedServerNode.monAgentStatus === "ACTIVE" ? "success" : "danger", selectedServerNode.monAgentStatus === "ACTIVE" ? "Running" : "Stopped"))
    $(htmlCardIdPrefix+"collect_status").html(generateStatusIndicator(selectedServerNode.monAgentStatus === "ACTIVE" ? "success" : "danger", selectedServerNode.monAgentStatus === "ACTIVE" ? "Running" : "Stopped"))

  } catch (e) {
    console.error(e);
  }

}

// 클릭한 mci의 info값 세팅
async function setMonitorMetricsTable() {
  try {
    var currentNsId = selectedWorkspaceProject.nsId;
    var response = await webconsolejs["common/api/services/monitoring_api"].GetMetricitems(currentNsId, selectedServerNode.workloadName, selectedServerNode.id);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@ ########### ",response)
    monitorMetricsTable.setData(response.data);
  } catch (e) {
    console.error(e);
  }
}



