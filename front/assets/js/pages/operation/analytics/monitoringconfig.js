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
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  if (this.value == "") return;
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)
  
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

//DOMContentLoaded 는 Page에서 1개만.
// init + 파일명 () : ex) initMci() 를 호출하도록 한다.
document.addEventListener("DOMContentLoaded", initMonitorConfig);

// 해당 화면에서 최초 설정하는 function
//로드 시 prj 값 받아와 getMciList 호출
async function initMonitorConfig() {
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
  
  // init modal event listeners
  initModalEventListeners();
}

// workload 목록 조회 ( mci + pmk )
async function getWorkloadList(nsId){
  var respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(nsId);
  var res_item = respMciList.mci
  
  // HTML option 리스트 초기값
  var html = '<option value="">Select</option>'; 
  if (Array.isArray(res_item)) {
    res_item.forEach(item => {
      html += '<option value="' + item.id + '">' + item.name + '</option>';
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
    for (var vmIndex in aMci.vm) {
      var aVm = aMci.vm[vmIndex]
      aVm.workloadType = "MCI"; // [MCI/PMK]
      aVm.workloadName = currentWorkloadName;
      aVm.monitoringAgentStatus = "Not Installed";
      aVm.logAgentStatus = "Not Installed";
      vmMap.set(aVm.id, aVm);
    }
    // 2. mci에 agent 설치된 목록 조회
    var monitorTargetList = await webconsolejs["common/api/services/monitoring_api"].getVMByNsMci(currentNsId, currentWorkloadId)
    for (var i in monitorTargetList.data) {
      //   [
      //     {
      //       "description": "Created via CB-Tumblebug",
      //       "log_agent_status": "SUCCESS",
      //       "mci_id": "mci01",
      //       "monitoring_agent_status": "SUCCESS",
      //       "name": "vm-1",
      //       "ns_id": "test01",
      //       "vm_id": "vm-1"
      //     }
      // ]
      var findVm = vmMap.get(monitorTargetList.data[i].vm_id)
      if(findVm){
        // monitoringAgentStatus가 null인 경우 FAILED로 처리
        var monitoringAgentStatus = monitorTargetList.data[i].monitoring_agent_status;
        if(monitoringAgentStatus === null || monitoringAgentStatus === undefined) {
            monitoringAgentStatus = "FAILED";
        }
        findVm.monitoringAgentStatus = monitoringAgentStatus; // [INSTALLING/SERVICE_INACTIVE/SUCCESS/FAILED]

        // logAgentStatus가 null인 경우 FAILED로 처리
        var logAgentStatus = monitorTargetList.data[i].log_agent_status;
        if(logAgentStatus === null || logAgentStatus === undefined) {
            logAgentStatus = "FAILED";
        }
        findVm.logAgentStatus = logAgentStatus; // [INSTALLING/SERVICE_INACTIVE/SUCCESS/FAILED]
      }
    }
  }catch(e){
    console.error(e)
  }

  // 3. mci에 log 설정??

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
      width: 80,
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
      title: "Monitoring Agent Status",
      field: "monitoringAgentStatus",
      vertAlign: "middle",
      hozAlign: "center",
      width: 180,
    },
    {
      title: "Log Agent Status",
      field: "logAgentStatus",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      width: 160,
    }
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
      this.deselectRow();
      return
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
    if(field == "monitoringAgentStatus" || field == "logAgentStatus"){
      var agentStatus = cell.getValue();
      if(agentStatus != "SUCCESS" && agentStatus != "INSTALLING"){
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
  var response = webconsolejs["common/api/services/monitoring_api"].InstallMonitoringAgent(currentNsId, currentWorkloadId, vmId);
  
  // 설치 완료 후 토글 상태 업데이트
  response.then(() => {
    // 선택된 서버 노드의 상태 업데이트
    if (selectedServerNode && selectedServerNode.id === vmId) {
      selectedServerNode.monitoringAgentStatus = "INSTALLING";
      selectedServerNode.logAgentStatus = "INSTALLING";

      // UI 업데이트
      setMonitorConfigInfoData();
      
      // 테이블 데이터도 업데이트
      var tableData = monitorConfigListTable.getData();
      var updatedData = tableData.map(row => {
        if (row.id === vmId) {
          row.monitoringAgentStatus = "INSTALLING";
          row.logAgentStatus = "INSTALLING";
        }
        return row;
      });
      monitorConfigListTable.setData(updatedData);
    }
  }).catch(error => {
    console.error("Failed to install monitoring agent:", error);
  });
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
      field: "vmId",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Plugin seq",
      field: "pluginSeq",
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center"
    },
    {
      title: "Plugin name",
      field: "pluginName",
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
  monitorConfigListTable.on("rowClick", function (e, row) {
  });

  monitorMetricsTable.on("cellClick", function(e, cell){
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
    // selectedServerNode = row.getData(); 
    // var tempServernodeId = currentServernodeId;    
    // currentServernodeId = row.getCell("id").getValue();
    // console.log("row ", row.getData())
    // console.log("currentServernodeId ", currentServernodeId)
  });

  editMetricsModalTable.on("cellClick", function(e, cell){
    // var field = cell.getField();
    // if(field == "monitoringAgentStatus" || field == "logAgentStatus"){
    //   var agentStatus = cell.getValue();
    //   console.log("agentStatus", agentStatus)
    //   if(agentStatus != "SUCCESS" && agentStatus != "INSTALLING"){
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

// 클릭한 monitor config info 가져오기
// 표에서 선택된 MonitorConfigId 받아옴
function getSelectedMonitorConfigData(servernodeId) {
  if (servernodeId == undefined || servernodeId == "") {
    return;
  }
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
    $('span[name="selectedMonTargetVM"]').each(function() {
        $(this).html(selectedServerNode.label["sys.id"]);
    });

    $('input[name="selectedMonTargetVM"]').each(function() {
        $(this).val(selectedServerNode.label["sys.id"]);
    });
  
    $(htmlCardIdPrefix+"name").text(selectedServerNode.name+" / "+selectedServerNode.id)
    $(htmlCardIdPrefix+"desc").text(selectedServerNode.description)
    $(htmlCardIdPrefix+"workload").text(selectedServerNode.workloadType+" / "+selectedServerNode.workloadName)
    $(htmlCardIdPrefix+"monitor").html(generateOnOffIndicator(selectedServerNode.monitoringAgentStatus === "SUCCESS" && selectedServerNode.logAgentStatus === "SUCCESS" ? true : false))
    $(htmlCardIdPrefix+"monitoring_agent_status").html(generateStatusIndicator(selectedServerNode.logAgentStatus === "SUCCESS" ? "success" : "danger", selectedServerNode.monitoringAgentStatus))
    $(htmlCardIdPrefix+"log_agent_status").html(generateStatusIndicator(selectedServerNode.logAgentStatus === "SUCCESS" ? "success" : "danger", selectedServerNode.monitoringAgentStatus))

    // 토글 박스 이벤트 리스너 추가
    $(htmlCardIdPrefix+"monitor input[type='checkbox']").off('change').on('change', function() {
      var isChecked = $(this).is(':checked');
      var currentMonitoringAgentStatus = selectedServerNode.monitoringAgentStatus;
      var currentLogAgentStatus = selectedServerNode.logAgentStatus;
      
      // 토글 ON 시: 에이전트가 설치되지 않은 경우 설치 모달 표시
      if (isChecked && currentMonitoringAgentStatus !== "SUCCESS" && currentMonitoringAgentStatus !== "INSTALLING" &&
          currentLogAgentStatus !== "SUCCESS" && currentLogAgentStatus !== "INSTALLING") {
        var targetVmId = selectedServerNode.id;
        var targetModal = "commonDefaultModal";
        var modalTitle = "MonitoringAgentInstall";
        var modalContent = "Would you like to install the monitoring agent?";
        var modalFunc = "pages/operation/analytics/monitoringconfig.installMonitoringAgent";
        webconsolejs['partials/layout/modal'].commonConfirmModal(targetModal, modalTitle, modalContent, modalFunc, targetVmId);
        
        // 모달 확인 후 토글 상태를 원래대로 되돌림 (설치 완료 후 다시 토글)
        $(this).prop('checked', false);
      }
      // 토글 OFF 시: 에이전트가 활성화된 경우 비활성화 확인 (선택사항)
      else if (!isChecked && currentAgentStatus === "ACTIVE") {
        // 필요시 에이전트 비활성화 로직 추가 가능
      }
    });

  } catch (e) {
    console.error(e);
  }

}

// 클릭한 mci의 info값 세팅
async function setMonitorMetricsTable() {
  try {
    var currentNsId = selectedWorkspaceProject.nsId;
    var response = await webconsolejs["common/api/services/monitoring_api"].GetMetricitems(currentNsId, selectedServerNode.workloadName, selectedServerNode.id);
    monitorMetricsTable.setData(response.data);
  } catch (e) {
    console.error(e);
  }
}

// ============================================
// Modal Event Listeners
// ============================================

/**
 * Modal 이벤트 리스너 초기화
 * Modal이 열릴 때 필요한 데이터를 로드합니다.
 */
function initModalEventListeners() {
  // Prediction Modal
  $('#setMonitoringPredictionModal').on('show.bs.modal', async function () {
    await loadPredictionModalData();
  });

  // Anomaly Detection Modal
  $('#setAnormalyDetectionModal').on('show.bs.modal', async function () {
    await loadDetectionModalData();
  });

  // Edit Metrics Modal
  $('#editMetricsModal').on('show.bs.modal', async function () {
    await loadEditMetricsModalData();
  });
}

/**
 * Prediction Modal 데이터 로드
 * monitoring.js의 setMonitoringMesurement 함수 재사용
 */
async function loadPredictionModalData() {
  try {
    // monitoring.js의 export된 함수 재사용
    await webconsolejs["pages/operation/manage/monitoring"].setMonitoringMesurement("prediction_measurement");
  } catch (error) {
    console.error("Failed to load prediction modal data:", error);
  }
}

/**
 * Anomaly Detection Modal 데이터 로드
 */
async function loadDetectionModalData() {
  try {
    // Measurement 로드 (monitoring.js 함수 재사용)
    await webconsolejs["pages/operation/manage/monitoring"].setMonitoringMesurement("detection_measurement");
    
    // Interval 옵션 로드
    loadIntervalOptions("detection_interval");
  } catch (error) {
    console.error("Failed to load detection modal data:", error);
  }
}

/**
 * Edit Metrics Modal 데이터 로드
 */
async function loadEditMetricsModalData() {
  try {
    // Plugin 목록 조회
    var respPlugins = await webconsolejs["common/api/services/monitoring_api"].getPlugIns();
    
    // 응답 데이터 정규화
    var data;
    if (respPlugins && respPlugins.responseData && respPlugins.responseData.data) {
      data = respPlugins.responseData.data;
    } else if (respPlugins && respPlugins.data) {
      data = respPlugins.data;
    } else if (respPlugins && Array.isArray(respPlugins)) {
      data = respPlugins;
    } else {
      console.error("Unexpected API response structure:", respPlugins);
      data = [];
    }

    // 테이블에 데이터 설정
    editMetricsModalTable.setData(data);
  } catch (error) {
    console.error("Failed to load edit metrics modal data:", error);
  }
}

/**
 * Interval 옵션 로드
 * @param {string} selectId - selectbox의 ID
 */
function loadIntervalOptions(selectId) {
  // Interval 옵션 (10m ~ 12h)
  var intervals = [
    { value: "10m", text: "10 minutes" },
    { value: "30m", text: "30 minutes" },
    { value: "1h", text: "1 hour" },
    { value: "3h", text: "3 hours" },
    { value: "6h", text: "6 hours" },
    { value: "12h", text: "12 hours" }
  ];

  var selectElement = document.getElementById(selectId);
  
  if (!selectElement) {
    console.error(`${selectId} element not found.`);
    return;
  }

  selectElement.innerHTML = "";

  // 기본 옵션 추가
  var defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select";
  selectElement.appendChild(defaultOption);

  // Interval 옵션 추가
  intervals.forEach(function (item) {
    var option = document.createElement("option");
    option.value = item.value;
    option.text = item.text;
    selectElement.appendChild(option);
  });
}



