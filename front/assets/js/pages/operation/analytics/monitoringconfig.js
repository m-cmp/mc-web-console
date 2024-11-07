import { TabulatorFull as Tabulator } from "tabulator-tables";

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
  console.log("select-current-project changed ")
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  if (this.value == "") return;
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
  console.log("select-current-project on change ", project)
  
})

////
// 모달 콜백 예제
export function commoncallbac(val) {
  alert(val);
}
////
// workspace -> project -> workload -> servernode
// selectXXX => object, currentXXX => id와 같은 string 값
var selectedWorkspaceProject = new Object();
export var nsid = "";
export var selectedWorkloads = new Array();// multi 선택 가능함
var selectedServerNode = new Object();
var currentWorkloadId = "";
var currentServernodeId = "-1";// 

var monitorConfigListTable;
var checked_array = [];

initMonitorConfigTable(); // init tabulator

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
    console.log("workspaceProject ", selectedWorkspaceProject)
    //var selectedProjectId = selectedWorkspaceProject.projectId;
    var currentNsId = selectedWorkspaceProject.nsId;
    console.log('in initMci currentNsId:', currentNsId);

    getWorkloadList(currentNsId)    

  }
}

// workload 목록 조회 ( mci + pmk )
async function getWorkloadList(nsId){
  var respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(nsId);
  //var respPmkList = await webconsolejs["common/api/services/pmk_api"].getPmkList(project.NsId);
  
  console.log("respMciList" , respMciList)
  var res_item = respMciList.mci;
  
  var html = '<option value="">Select</option>';// HTML option 리스트 초기값
  // res_item이 배열인지 확인
  if (Array.isArray(res_item)) {
    // res_item 배열을 순회하면서 각 MCI의 name을 option 태그로 변환
    res_item.forEach(item => {
      html += '<option value="' + item.id + '">' + item.name + '</option>';
    });
  } else {
    console.error("res_item is not an array");
  }

  //console.log("selectbox ", html)
  // workloadlist 셀렉트 박스에 옵션 추가  // 
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
    console.log(vmMap)
    // 2. mci에 agent 설치된 목록 조회
    var monitorTargetList = await webconsolejs["common/api/services/monitoring_api"].getTargetsNsMci(currentNsId, currentWorkloadId)
    console.log("monitorTargetList",monitorTargetList )
    console.log("monitorTargetList",monitorTargetList.data )
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

      // FIXME : 하드코드 for demo
      var findVm = vmMap.get(monitorTargetList.data[i].id)
      if(findVm){
        findVm.monAgentStatus = monitorTargetList.data[i].state;// [ACTIVE/INACTIVE]
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

// getMciList 호출 성공 시
function getMonitorConfigListCallbackSuccess(caller, monitorConfigList) {
  console.log("getMonitorConfigListCallbackSuccess");

  monitorlistTable.setData(monitorConfigList);

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
  
}

// 클릭한 mci의 info값 세팅
async function setMonitorConfigInfoData() {
  
  // var row = monitorConfigListTable.getRow(currentServernodeId);  
  // console.log(row)
  // console.log("setMonitorConfigInfoData", monitorConfigData)
  
  //selectedServerNode 안에 현재 선택한 rowData가 들어있음
  console.log("setMonitorConfigInfoData ", selectedServerNode)



  var htmlCardIdPrefix = "#monitoringconfig_info_"
  try {
    const generateOnOffIndicator = (result, status) => `<label class="form-check form-switch">
      <input class="form-check-input" type="checkbox" checked="${result}">
      <span class="form-check-label">${status}</span>
    </label>`;
    const generateStatusIndicator = (result, status) => `<span class="badge bg-${result} me-1"></span>${status}`;
    console.log("selectedServerNode.label", selectedServerNode.label)
    var response = await webconsolejs["common/api/services/monitoring_api"].getMonitoringLog(
      selectedServerNode.label["sys.namespace"], 
      selectedServerNode.label["sys.mciId"], 
      selectedServerNode.label["sys.id"], 
      "", 
      );
      console.log(response)
    $(htmlCardIdPrefix+"name").text(selectedServerNode.name+" / "+selectedServerNode.id)
    $(htmlCardIdPrefix+"desc").text(selectedServerNode.description)
    $(htmlCardIdPrefix+"workload").text(selectedServerNode.workloadType+" / "+selectedServerNode.workloadName)
    $(htmlCardIdPrefix+"monitor").html(generateOnOffIndicator(selectedServerNode.monAgentStatus === "ACTIVE" ? "true" : "false", selectedServerNode.monAgentStatus === "ACTIVE" ? "On" : "Off"))
    $(htmlCardIdPrefix+"agent_status").html(generateStatusIndicator(selectedServerNode.monAgentStatus === "ACTIVE" ? "success" : "waring", selectedServerNode.monAgentStatus === "ACTIVE" ? "Running" : "Stopped"))
    $(htmlCardIdPrefix+"collect_status").html(generateStatusIndicator(selectedServerNode.monAgentStatus === "ACTIVE" ? "success" : "waring", selectedServerNode.monAgentStatus === "ACTIVE" ? "running" : "waring"))
    // $("#mci_server_info_status").empty();
    // $("#mci_server_info_status").text(" [ " + mciName + " ]")
    // $("#mci_server_info_count").text(" Server(" + totalvmCount + ")")


    // $("#mci_info_status_img").attr("src", "/assets/images/common/" + mciStatusIcon)
    // $("#mci_info_name").text(mciName + " / " + mciID)
    // $("#mci_info_description").text(mciDescription)
    // $("#mci_info_status").text(mciStatus)
    // $("#mci_info_cloud_connection").empty()
    // $("#mci_info_cloud_connection").append(mciProviderNames)

  } catch (e) {
    console.error(e);
  }

}


// Server List / Status VM 리스트에서
// VM 한 개 클릭시 vm의 세부 정보
export async function monitorConfigDetailInfo(mciID, mciName, vmID) {
  // Toggle MCIS Info
  var div = document.getElementById("server_info");
  webconsolejs["partials/layout/navigatePages"].toggleElement(div)

  console.log("vmDetailInfo")
  console.log("mciID : ", mciID)
  console.log("mciName : ", mciName)
  console.log("vmID : ", vmID)

  // get mci 
  currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId
  try {
    var response = await webconsolejs["common/api/services/mci_api"].getMci(currentNsId, mciID);
    var aMci = response.responseData
    clearServerInfo();

    console.log("aMci", aMci);

    if (!aMci || !aMci.vm) {
      console.log("aMci or vmList is not defined");
      return;
    }

    var vmList = aMci.vm;
    console.log("vmList:", vmList);

    var vmExist = false;
    var data = new Object();

    for (var vmIndex in vmList) {
      var aVm = vmList[vmIndex];
      if (vmID == aVm.id) {
        data = aVm;
        vmExist = true;
        console.log("aVm", aVm);
        break;
      }
    }

    if (!vmExist) {
      console.log("vm is not exist");
    }
  } catch (error) {
    console.error("Error occurred: ", error);
  }
  console.log("selected Vm");
  console.log("selected vm data : ", data);
  var vmId = data.id;
  selectedVmId = vmId
  var vmName = data.name;
  var vmStatus = data.status;
  var vmDescription = data.description;
  var vmPublicIp = data.publicIP == undefined ? "" : data.publicIP;
  console.log("vmPublicIp", vmPublicIp)
  var vmSshKeyID = data.sshKeyId;

  try {
    var imageId = data.imageId
    // var operatingSystem = await webconsolejs["common/api/services/vmimage_api"].getCommonVmImageInfo(imageId)
    // var operatingSystem = data.imageId
    var operatingSystem = "Ubuntu"
    $("#server_info_os").text(operatingSystem)
  } catch (e) {
    console.log("e", e)
  }
  var startTime = data.createdTime
  var privateIp = data.privateIP
  var securityGroupID = data.securityGroupIds[0];
  var providerName = data.connectionConfig.providerName
  var vmProviderIcon = ""
  vmProviderIcon +=
    '<img class="img-fluid" class="rounded" width="80" src="/assets/images/common/img_logo_' +
    (providerName==""?"mcmp":providerName) +
    '.png" alt="' +
    providerName +
    '"/>';

  var vmDispStatus = webconsolejs["common/api/services/mci_api"].getMciStatusFormatter(vmStatus);
  var mciStatusIcon = webconsolejs["common/api/services/mci_api"].getMciStatusIconFormatter(vmDispStatus);

  //vm info
  $("#mci_server_info_status_img").attr("src", "/assets/images/common/" + mciStatusIcon)
  $("#mci_server_info_connection").empty()
  $("#mci_server_info_connection").append(vmProviderIcon)


  $("#server_info_text").text(' [ ' + vmName + ' / ' + mciName + ' ]')
  $("#server_info_name").text(vmName + "/" + vmID)
  $("#server_info_desc").text(vmDescription)

  $("#server_info_start_time").text(startTime)
  $("#server_info_private_ip").text(privateIp)
  $("#server_info_cspVMID").text(data.cspResourceName)

  // ip information
  $("#server_info_public_ip").text(vmPublicIp)
  $("#server_detail_info_public_ip_text").text("Public IP : " + vmPublicIp)
  $("#server_info_public_dns").text(data.publicDNS)
  // $("#server_info_private_ip").val(data.privateIP)
  $("#server_info_private_dns").text(data.privateDNS)

  $("#server_detail_view_public_ip").text(vmPublicIp)
  $("#server_detail_view_public_dns").text(data.publicDNS)
  $("#server_detail_view_private_ip").text(data.privateIP)
  $("#server_detail_view_private_dns").text(data.privateDNS)

  // detail tab
  $("#server_detail_info_text").text(' [' + vmName + '/' + mciName + ']')
  $("#server_detail_view_server_id").text(vmId)
  $("#server_detail_view_server_status").text(vmStatus);
  $("#server_detail_view_public_dns").text(data.publicDNS)
  $("#server_detail_view_public_ip").text(vmPublicIp)
  $("#server_detail_view_private_ip").text(data.privateIP)
  $("#server_detail_view_security_group_text").text(securityGroupID)
  $("#server_detail_view_private_dns").text(data.privateDNS)
  $("#server_detail_view_private_ip").text(data.privateIP)
  $("#server_detail_view_image_id").text(imageId)
  $("#server_detail_view_os").text(operatingSystem);
  $("#server_detail_view_user_id_pass").text(data.vmUserAccount + "/ *** ")

  var region = data.region.Region

  var zone = data.region.Zone

  // connection tab
  var connectionName = data.connectionName
  var credentialName = data.connectionConfig.credentialName
  var driverName = data.connectionConfig.driverName
  var locationInfo = data.location;
  var cloudType = locationInfo.cloudType;

  $("#server_connection_view_connection_name").text(connectionName)
  $("#server_connection_view_credential_name").text(credentialName)
  $("#server_connection_view_csp").text(providerName)
  $("#server_connection_view_driver_name").text(driverName)
  $("#server_connection_view_region").text(providerName + " : " + region)
  $("#server_connection_view_zone").text(zone)

  // region zone locate
  $("#server_info_region").text(providerName + ":" + region)
  $("#server_info_zone").text(zone)


  $("#server_detail_view_region").text(providerName + " : " + region)
  $("#server_detail_view_zone").text(zone)

  // connection name
  var connectionName = data.connectionName;
  $("#server_info_connection_name").text(connectionName)

  var vmDetail = data.cspViewVmDetail;
  // var vmDetailKeyValueList = vmDetail.KeyValueList
  var addtionalDetails = data.addtionalDetails
  console.log("addtionalDetails",addtionalDetails)
  var architecture = "";
  var vpcId = ""
  var subnetId = ""

  if (addtionalDetails) {
    for (var i = 0; i < addtionalDetails.length; i++) {
      if (addtionalDetails[i].key === "Architecture") {
        architecture = addtionalDetails[i].value;
        break; 
      }
    }
  }
  var vpcId = data.cspVNetId
  var subnetId = data.cspSubnetId
  var vmSpecName = data.cspSpecName
  var vpcSystemId = data.vNetId
  
  var subnetSystemId = data.subnetId
  var eth = data.networkInterface

  $("#server_info_archi").text(architecture)
  // detail tab
  $("#server_detail_view_archi").text(architecture)
  $("#server_detail_view_vpc_id").text(vpcId + "(" + vpcSystemId + ")")
  $("#server_detail_view_subnet_id").text(subnetId + "(" + subnetSystemId + ")")
  $("#server_detail_view_eth").text(eth)
  $("#server_detail_view_root_device_type").text(data.rootDiskType);
  $("#server_detail_view_root_device").text(data.rootDeviceName);
  $("#server_detail_view_keypair_name").text(data.cspSshKeyId)
  $("#server_detail_view_access_id_pass").text(data.vmUserName + "/ *** ")


  // server spec
  // var vmSecName = data.VmSpecName
  $("#server_info_vmspec_name").text(vmSpecName)
  $("#server_detail_view_server_spec").text(vmSpecName) // detail tab

  webconsolejs["partials/operation/manage/server_monitoring"].monitoringDataInit()
}

// monitor config 세부 정보 초기화
function clearMonitorConfigInfo() {
  console.log("clearServerInfo")

//   $("#server_info_text").text("")
//   $("#server_detail_info_text").text("")
//   $("#server_detail_view_server_status").val("");
//   $("#server_info_name").val("")
//   $("#server_info_desc").val("")

//   // ip information
//   $("#server_info_public_ip").val("")
//   $("#server_detail_info_public_ip_text").text("")
//   $("#server_info_public_dns").val("")
//   $("#server_info_private_ip").val("")
//   $("#server_info_private_dns").val("")

//   $("#server_detail_view_public_ip").val("")
//   $("#server_detail_view_public_dns").val("")
//   $("#server_detail_view_private_ip").val("")
//   $("#server_detail_view_private_dns").val("")

}

// monitor agent 상태값 표시
function displayMonitorAgentStatusArea() {
//   var sumVmCnt = 0;
//   var sumVmRunningCnt = 0;
//   var sumVmStopCnt = 0;
//   var sumVmTerminateCnt = 0;
//   totalVmStatusMap.forEach((value, key) => {
//     var statusRunning = value.get("running");
//     var statusStop = value.get("stop");
//     var statusTerminate = value.get("terminate");
//     sumVmRunningCnt += statusRunning;
//     sumVmStopCnt += statusStop;
//     sumVmTerminateCnt += statusTerminate;
//   });
//   sumVmCnt = sumVmRunningCnt + sumVmStopCnt + sumVmTerminateCnt;
//   $("#total_vm").text(sumVmCnt);
//   $("#vm_status_running").text(sumVmRunningCnt);
//   $("#vm_status_stopped").text(sumVmStopCnt);
//   $("#vm_status_terminated").text(sumVmTerminateCnt);
}


////////////////////////////////////////////////////// TABULATOR Start //////////////////////////////////////////////////////
// tabulator 행, 열, 기본값 설정
// table이 n개 가능하므로 개별 tabulator 정의 : 원리 util 안에 setTabulator있음.
function setMonitorConfigTabulator(
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

  monitorConfigListTable = setMonitorConfigTabulator("monitorconfiglist-table", tableObjParams, columns, true);

  // 행 클릭 시
  monitorConfigListTable.on("rowClick", function (e, row) {
    selectedServerNode = row.getData(); 
    //var workloadType = row.getCell("workloadType").getValue();    
    var tempServernodeId = currentServernodeId;    
    currentServernodeId = row.getCell("id").getValue();
    console.log("row ", row.getData())
    console.log("currentServernodeId ", currentServernodeId)

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
    if( field == "monAgentStatus"){
      var agentStatus = cell.getValue();
      console.log("agentStatus", agentStatus)
      if( agentStatus != "ACTIVE" && agentStatus != "INACTIVE"){
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
    
    // console.log("Clicked cell value:", cell.getValue());  // Get cell value
    // console.log("Clicked field:", cell.getField());       // Get field name (e.g., "name" or "age")
    // console.log("Row data:", cell.getRow().getData());
  });

  // TODO : 선택된 여러개 row에 대해 처리
  monitorConfigListTable.on("rowSelectionChanged", function (data, rows) {
    // checked_array = data
    // console.log("checked_array", checked_array)
    // console.log("rowsrows", data)
    // selectedServernode = data
  });
  // displayColumn(table);
}

export function installMonitoringAgent(vmId){
  var currentNsId = selectedWorkspaceProject.nsId;
  console.log("currentWorkloadId", currentWorkloadId);
  console.log("vmId", vmId)

  var response = webconsolejs["common/api/services/monitoring_api"].InstallMonitoringAgent(currentNsId, currentWorkloadId, vmId);
  console.log(response);
  
}

/////////////////////////Tabulator Filter start/////////////////////////
//Define variables for input elements
var fieldEl = document.getElementById("filter-field");
var typeEl = document.getElementById("filter-type");
var valueEl = document.getElementById("filter-value");

// table rovider filtering / equel 고정
function providerFilter(data) {

  // case type like, equal, not eual
  // equal only
  if (typeEl.value == "=") {
    var vmCloudConnectionMap = webconsolejs["common/api/services/mci_api"].calculateConnectionCount(
      data.vm
    );
    var valueElValue = valueEl.value;
    if (valueElValue != "") {
      if (vmCloudConnectionMap.has(valueElValue)) {
        return true;
      } else {
        return false;
      }
    }

  } else {
    return true;
  }

  return true
}

// Trigger setFilter function with correct parameters
function updateFilter() {
  var filterVal = fieldEl.options[fieldEl.selectedIndex].value;
  var typeVal = typeEl.options[typeEl.selectedIndex].value;

  var filter = filterVal == "provider" ? providerFilter : filterVal;

  if (filterVal == "provider") {
    typeEl.value = "=";
    typeEl.disabled = true;
  } else {
    typeEl.disabled = false;
  }

  if (filterVal) {
    table.setFilter(filter, typeVal, valueEl.value);
  }
}

// Update filters on value change
// document.getElementById("filter-field").addEventListener("change", updateFilter);
// document.getElementById("filter-type").addEventListener("change", updateFilter);
// document.getElementById("filter-value").addEventListener("keyup", updateFilter);

// Clear filters on "Clear Filters" button click
document.getElementById("filter-clear").addEventListener("click", function () {
  fieldEl.value = "";
  typeEl.value = "=";
  valueEl.value = "";

  table.clearFilter();

});
/////////////////////////Tabulator Filter END/////////////////////////

////////////////////////////////////////////////////// END TABULATOR ///////////////////////////////////////////////////