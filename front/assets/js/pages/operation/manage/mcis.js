import { TabulatorFull as Tabulator } from "tabulator-tables";

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
  console.log("select-current-project changed ")
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
  console.log("select-current-project on change ", project)
  var respMcisList = await webconsolejs["common/api/services/mcis_api"].getMcisList(project.NsId);
  getMcisListCallbackSuccess(project.NsId, respMcisList);
})

////
// 모달 콜백 예제
export function commoncallbac(val) {
  alert(val);
}
////

var totalMcisListObj = new Object();
var selectedWorkspaceProject = new Object();
export var selectedMcisObj = new Object();
export var nsid = "";
var totalMcisStatusMap = new Map();
var totalVmStatusMap = new Map();
// var totalCloudConnectionMap = new Map();
var selectedVmId = "";
var currentMcisId = "";

var mcisListTable;
var checked_array = [];
var selectedMcisID = ""
initMcisTable(); // init tabulator

//DOMContentLoaded 는 Page에서 1개만.
// init + 파일명 () : ex) initMcis() 를 호출하도록 한다.
document.addEventListener("DOMContentLoaded", initMcis);

// 해당 화면에서 최초 설정하는 function
//로드 시 prj 값 받아와 getMcisList 호출
async function initMcis() {
  console.log("initMcis")
  ////////////////////// partials init functions///////////////////////////////////////
  try {
    webconsolejs["partials/operation/manage/mciscreate"].initMcisCreate();//McisCreate을 Partial로 가지고 있음. 
  } catch (e) {
    console.log(e);
  }
  ////////////////////// partials init functions end ///////////////////////////////////////


  ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

  // workspace selection check
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject)
  ////////////////////// set workspace list, project list at Navbar end //////////////////////////////////



  if (selectedWorkspaceProject.projectId != "") {
    console.log("workspaceProject ", selectedWorkspaceProject)
    var selectedProjectId = selectedWorkspaceProject.projectId;
    var selectedNsId = selectedWorkspaceProject.nsId;
    console.log('in initMcis selectedNsId:', selectedNsId);

    //getMcisList();// project가 선택되어 있으면 mcis목록을 조회한다.
    var respMcisList = await webconsolejs["common/api/services/mcis_api"].getMcisList(selectedNsId);
    getMcisListCallbackSuccess(selectedProjectId, respMcisList);


    ////////////////////// 받은 mcisId가 있으면 해당 mcisId를 set하고 조회한다. ////////////////
    // 외부(dashboard)에서 받아온 mcisID가 있으면 MCIS INFO 이동
    // 현재 브라우저의 URL
    const url = window.location.href;
    const urlObj = new URL(url);
    // URLSearchParams 객체 생성
    const params = new URLSearchParams(urlObj.search);
    // mcisID 파라미터 값 추출
    selectedMcisID = params.get('mcisID');

    console.log('selectedMcisID:', selectedMcisID);  // 출력: mcisID의 값 (예: com)
    if (selectedMcisID != undefined) {
      toggleRowSelection(selectedMcisID)
      getSelectedMcisData(selectedMcisID)
    }
    ////////////////////  mcisId를 set하고 조회 완료. ////////////////
  }
}

// getMcisList 호출 성공 시
function getMcisListCallbackSuccess(caller, mcisList) {
  console.log("getMcisListCallbackSuccess");

  totalMcisListObj = mcisList.mcis;
  console.log("total mcis : ", totalMcisListObj);
  mcisListTable.setData(totalMcisListObj);
  setToTalMcisStatus(); // mcis상태 표시
  setTotalVmStatus(); // mcis 의 vm들 상태표시
  //     setTotalConnection();// Mcis의 provider별 connection 표시

  // displayMcisDashboard();

}

// 클릭한 mcis info 가져오기
// 표에서 선택된 McisId 받아옴
async function getSelectedMcisData(mcisID) {

  console.log('selectedMcisID:', mcisID);  // 출력: mcisID의 값 (예: com)
  if (mcisID != undefined && mcisID != "") {
    var selectedNsId = selectedWorkspaceProject.nsId;
    currentMcisId = mcisID
    var mcisResp = await webconsolejs["common/api/services/mcis_api"].getMcis(selectedNsId, mcisID)
    console.log("mcisResp ", mcisResp)
    if (mcisResp.status.code != 200) {
      console.log("resp status ", mcisResp.status)
      // failed.  // TODO : Error Popup 처리
      return;
    }
    // SET MCIS Info page
    setMcisInfoData(mcisResp.responseData)

    // Toggle MCIS Info
    var div = document.getElementById("mcis_info");
    console.log("mcisInfo ", div)
    webconsolejs["partials/layout/navigatePages"].toggleElement(div)
  }
}

// 클릭한 mcis의 info값 세팅
function setMcisInfoData(mcisData) {
  console.log("setMcisInfoData", mcisData)
  try {
    var mcisID = mcisData.id;
    var mcisName = mcisData.name;
    var mcisDescription = mcisData.description;
    var mcisStatus = mcisData.status;
    console.log("setMcisInfoData ", mcisStatus)
    var mcisDispStatus = webconsolejs["common/api/services/mcis_api"].getMcisStatusFormatter(mcisStatus);
    var mcisStatusIcon = webconsolejs["common/api/services/mcis_api"].getMcisStatusIconFormatter(mcisDispStatus);
    var mcisProviderNames = webconsolejs["common/api/services/mcis_api"].getMcisInfoProviderNames(mcisData); //MCIS에 사용 된 provider
    var totalvmCount = mcisData.vm.length; //mcis의 vm개수

    console.log("totalvmCount", totalvmCount)

    $("#mcis_info_text").text(" [ " + mcisName + " ]")
    $("#mcis_server_info_status").empty();
    $("#mcis_server_info_status").text(" [ " + mcisName + " ]")
    $("#mcis_server_info_count").text(" Server(" + totalvmCount + ")")


    $("#mcis_info_status_img").attr("src", "/assets/images/common/" + mcisStatusIcon)
    $("#mcis_info_name").text(mcisName + " / " + mcisID)
    $("#mcis_info_description").text(mcisDescription)
    $("#mcis_info_status").text(mcisStatus)
    $("#mcis_info_cloud_connection").empty()
    $("#mcis_info_cloud_connection").append(mcisProviderNames)

  } catch (e) {
    console.error(e);
  }

  // TODO : mcis info로 cursor 이동
  // vm상태별로 icon 표시한다
  displayServerStatusList(mcisID, mcisData.vm)

}

// mcis life cycle 변경
export function changeMcisLifeCycle(type) {

  var selectedNsId = selectedWorkspaceProject.nsId;
  webconsolejs["common/api/services/mcis_api"].mcisLifeCycle(type, checked_array, selectedNsId)
}

// vm life cycle 변경
export function changeVmLifeCycle(type) {
  var selectedNsId = selectedWorkspaceProject.nsId;

  webconsolejs["common/api/services/mcis_api"].vmLifeCycle(type, currentMcisId, selectedNsId, selectedVmId)
}

// vm 상태별 icon으로 표시
// Server List / Status VM리스트
function displayServerStatusList(mcisID, vmList) {
  console.log("displayServerStatusList")

  var mcisName = mcisID;
  var vmLi = "";
  vmList.sort();
  for (var vmIndex in vmList) {
    var aVm = vmList[vmIndex]

    var vmID = aVm.id;
    var vmName = aVm.name;
    var vmStatus = aVm.status;
    var vmDispStatus = webconsolejs["common/api/services/mcis_api"].getVmStatusFormatter(vmStatus); // vmStatus set
    var vmStatusClass = webconsolejs["common/api/services/mcis_api"].getVmStatusStyleClass(vmDispStatus) // vmStatus 별로 상태 색상 set

    vmLi += '<li id="server_status_icon_' + vmID + '" class="card ' + vmStatusClass + '" onclick="webconsolejs[\'pages/operation/manage/mcis\'].vmDetailInfo(\'' + mcisID + '\',\'' + mcisName + '\',\'' + vmID + '\')"><span class="text-dark-fg">' + vmName + '</span></li>';

  }// end of mcis loop

  $("#mcis_server_info_box").empty();
  $("#mcis_server_info_box").append(vmLi);
}

// Server List / Status VM 리스트에서
// VM 한 개 클릭시 vm의 세부 정보
export async function vmDetailInfo(mcisID, mcisName, vmID) {
  // Toggle MCIS Info
  var div = document.getElementById("server_info");
  webconsolejs["partials/layout/navigatePages"].toggleElement(div)

  console.log("vmDetailInfo")
  console.log("mcisID : ", mcisID)
  console.log("mcisName : ", mcisName)
  console.log("vmID : ", vmID)

  clearServerInfo();

  var aMcis = new Object();
  for (var mcisIndex in totalMcisListObj) {
    var tempMcis = totalMcisListObj[mcisIndex]
    if (mcisID == tempMcis.id) {
      aMcis = tempMcis;
      break;
    }
  }// end of mcis loop
  console.log("aMcis", aMcis);
  var vmList = aMcis.vm;
  var vmExist = false
  var data = new Object();
  for (var vmIndex in vmList) {
    var aVm = vmList[vmIndex]
    if (vmID == aVm.id) {
      //aVm = vmData;
      data = aVm;
      vmExist = true
      console.log("aVm", aVm)
      break;
    }
  }
  if (!vmExist) {
    console.log("vm is not exist");
    console.log(vmList)
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
    var operatingSystem = await webconsolejs["common/api/services/vmimage_api"].getCommonVmImageInfo(imageId)
    $("#server_info_os").text(operatingSystem)
  } catch (e) {
    console.log("e", e)
  }
  var startTime = data.cspViewVmDetail.StartTime
  var privateIp = data.privateIP
  var securityGroupID = data.securityGroupIds[0];
  var providerName = data.connectionConfig.providerName
  var vmProviderIcon = ""
  vmProviderIcon +=
    '<img class="img-fluid" class="rounded" width="80" src="/assets/images/common/img_logo_' +
    providerName +
    '.png" alt="' +
    providerName +
    '"/>';

  var vmDispStatus = webconsolejs["common/api/services/mcis_api"].getMcisStatusFormatter(vmStatus);
  var mcisStatusIcon = webconsolejs["common/api/services/mcis_api"].getMcisStatusIconFormatter(vmDispStatus);

  //vm info
  $("#mcis_server_info_status_img").attr("src", "/assets/images/common/" + mcisStatusIcon)
  $("#mcis_server_info_connection").empty()
  $("#mcis_server_info_connection").append(vmProviderIcon)


  $("#server_info_text").text(' [ ' + vmName + ' / ' + mcisName + ' ]')
  $("#server_info_name").text(vmName + "/" + vmID)
  $("#server_info_desc").text(vmDescription)

  $("#server_info_start_time").text(startTime)
  $("#server_info_private_ip").text(privateIp)
  $("#server_info_cspVMID").text(data.cspViewVmDetail.IId.NameId)

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
  $("#server_detail_info_text").text(' [' + vmName + '/' + mcisName + ']')
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
  var vmDetailKeyValueList = vmDetail.KeyValueList
  var architecture = "";

  if (vmDetailKeyValueList) {
    for (var i = 0; i < vmDetailKeyValueList.length; i++) {
      if (vmDetailKeyValueList[i].key === "Architecture") {
        architecture = vmDetailKeyValueList[i].value;
        break; // 찾았으므로 반복문을 종료
      }
    }
  }
  var vmSpecName = vmDetail.VMSpecName
  var vpcId = vmDetail.VpcIID.NameId
  var vpcSystemId = vmDetail.VpcIID.SystemId
  var subnetId = vmDetail.SubnetIID.NameId
  var subnetSystemId = vmDetail.SubnetIID.SystemId
  var eth = vmDetail.NetworkInterface

  $("#server_info_archi").text(architecture)
  // detail tab
  $("#server_detail_view_archi").text(architecture)
  $("#server_detail_view_vpc_id").text(vpcId + "(" + vpcSystemId + ")")
  $("#server_detail_view_subnet_id").text(subnetId + "(" + subnetSystemId + ")")
  $("#server_detail_view_eth").text(eth)
  $("#server_detail_view_root_device_type").text(vmDetail.RootDiskType);
  $("#server_detail_view_root_device").text(vmDetail.RootDeviceName);
  $("#server_detail_view_keypair_name").text(vmDetail.KeyPairIId.NameId)
  $("#server_detail_view_access_id_pass").text(vmDetail.VMUserId + "/ *** ")


  // server spec
  // var vmSecName = data.VmSpecName
  $("#server_info_vmspec_name").text(vmSpecName)
  $("#server_detail_view_server_spec").text(vmSpecName) // detail tab

  webconsolejs["partials/operation/manage/server_monitoring"].monitoringDataInit()
}

// vm 세부 정보 초기화
function clearServerInfo() {
  console.log("clearServerInfo")

  $("#server_info_text").text("")
  $("#server_detail_info_text").text("")
  $("#server_detail_view_server_status").val("");
  $("#server_info_name").val("")
  $("#server_info_desc").val("")

  // ip information
  $("#server_info_public_ip").val("")
  $("#server_detail_info_public_ip_text").text("")
  $("#server_info_public_dns").val("")
  $("#server_info_private_ip").val("")
  $("#server_info_private_dns").val("")

  $("#server_detail_view_public_ip").val("")
  $("#server_detail_view_public_dns").val("")
  $("#server_detail_view_private_ip").val("")
  $("#server_detail_view_private_dns").val("")

  $("#manage_mcis_popup_public_ip").val("")

  // connection tab
  $("#server_info_csp_icon").empty()
  $("#server_connection_view_csp").val("")
  $("#manage_mcis_popup_csp").val("")

  $("#latitude").val("")
  $("#longitude").val("")

  $("#server_info_region").val("")
  $("#server_info_zone").val("")

  $("#server_detail_view_region").val("")
  $("#server_detail_view_zone").val("")

  $("#server_connection_view_region").val("")
  $("#server_connection_view_zone").val("")

  $("#server_info_connection_name").val("")
  $("#server_connection_view_connection_name").val("")

  $("#server_connection_view_credential_name").val("")
  $("#server_connection_view_driver_name").val("")

  $("#server_info_archi").val("")
  $("#server_detail_view_archi").val("")

  $("#server_info_vmspec_name").val("")
  $("#server_detail_view_server_spec").text("")

  $("#server_info_start_time").val("")

  $("#server_detail_view_server_id").val("")

  $("#server_detail_view_image_id").text("")

  $("#server_detail_view_vpc_id").text("")

  $("#server_detail_view_subnet_id").text("")
  $("#server_detail_view_eth").val("")

  // user account
  $("#server_detail_view_access_id_pass").val("")
  $("#server_detail_view_user_id_pass").val("")
  // $("#manage_mcis_popup_user_name").val("")

  $("#block_device_section").empty()
  // $("#attachedDiskList").empty()

  $("#server_detail_view_root_device_type").val("");
  $("#server_detail_view_root_device").val("");
  // $("#server_detail_disk_id").val("");
  // $("#server_detail_disk_mcis_id").val("");
  // $("#server_detail_disk_vm_id").val("");

  $("#server_detail_view_security_group").empty()
  $("#server_detail_view_keypair_name").val("")
  $("#server_info_cspVMID").val("")

  // $("#selected_mcis_id").val("");
  // $("#selected_vm_id").val("");

  // $("#exportFileName").val("");
  // $("#exportScript").val("");
}

// mcis 상태 표시
function setToTalMcisStatus() {
  console.log("setToTalMcisStatus");
  try {
    for (var mcisIndex in totalMcisListObj) {
      var aMcis = totalMcisListObj[mcisIndex];

      var aMcisStatusCountMap = webconsolejs["common/api/services/mcis_api"].calculateMcisStatusCount(aMcis);
      console.log("aMcis.id : ", aMcis.id);
      console.log("mcisStatusMap ::: ", aMcisStatusCountMap);
      totalMcisStatusMap.set(aMcis.id, aMcisStatusCountMap);
    }
  } catch (e) {
    console.log("mcis status error", e);
  }
  displayMcisStatusArea();
}

// Mcis 목록에서 vmStatus만 처리 : 화면표시는 display function에서
// vm 상태 표시
function setTotalVmStatus() {
  console.log("setTotalVmstatus")
  try {
    for (var mcisIndex in totalMcisListObj) {
      var aMcis = totalMcisListObj[mcisIndex];
      console.log("aMcis : ", aMcis);
      var vmStatusCountMap = webconsolejs["common/api/services/mcis_api"].calculateVmStatusCount(aMcis);
      totalVmStatusMap.set(aMcis.id, vmStatusCountMap);
    }
  } catch (e) {
    console.log("mcis status error");
  }
  displayVmStatusArea();
}

// mcis status display
function displayMcisStatusArea() {
  console.log("displayMcisStatusArea");
  var sumMcisCnt = 0;
  var sumMcisRunningCnt = 0;
  var sumMcisStopCnt = 0;
  var sumMcisTerminateCnt = 0;
  totalMcisStatusMap.forEach((value, key) => {
    var statusRunning = value.get("running");
    var statusStop = value.get("stop");
    var statusTerminate = value.get("terminate");
    sumMcisRunningCnt += statusRunning;
    sumMcisStopCnt += statusStop;
    sumMcisTerminateCnt += statusTerminate;
    console.log("totalMcisStatusMap :: ", key, value);
  });
  sumMcisCnt = sumMcisRunningCnt + sumMcisStopCnt + sumMcisTerminateCnt;

  $("#total_mcis").text(sumMcisCnt);
  $("#mcis_status_running").text(sumMcisRunningCnt);
  $("#mcis_status_stopped").text(sumMcisStopCnt);
  $("#mcis_status_terminated").text(sumMcisTerminateCnt);
  console.log("displayMcisStatusArea ");
  console.log("running status count ", $("#mcis_status_running").text());
}

// vm 상태값 표시
function displayVmStatusArea() {
  var sumVmCnt = 0;
  var sumVmRunningCnt = 0;
  var sumVmStopCnt = 0;
  var sumVmTerminateCnt = 0;
  totalVmStatusMap.forEach((value, key) => {
    var statusRunning = value.get("running");
    var statusStop = value.get("stop");
    var statusTerminate = value.get("terminate");
    sumVmRunningCnt += statusRunning;
    sumVmStopCnt += statusStop;
    sumVmTerminateCnt += statusTerminate;
  });
  sumVmCnt = sumVmRunningCnt + sumVmStopCnt + sumVmTerminateCnt;
  $("#total_vm").text(sumVmCnt);
  $("#vm_status_running").text(sumVmRunningCnt);
  $("#vm_status_stopped").text(sumVmStopCnt);
  $("#vm_status_terminated").text(sumVmTerminateCnt);
}


////////////////////////////////////////////////////// TABULATOR Start //////////////////////////////////////////////////////
// tabulator 행, 열, 기본값 설정
// table이 n개 가능하므로 개별 tabulator 정의 : 원리 util 안에 setTabulator있음.
function setMcisTabulator(
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
function initMcisTable() {

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
      title: "Status",
      field: "status",
      formatter: statusFormatter,
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      headerSort: false,
      maxWidth: 100,
    },
    {
      title: "Id",
      field: "id",
      visible: true
    },
    {
      title: "System Label",
      field: "systemLabel",
      visible: false
    },
    {
      title: "Name",
      field: "name",
      vertAlign: "middle"
    },
    {
      title: "ProviderImg",
      field: "providerImg",
      formatter: providerFormatter,
      vertAlign: "middle",
      hozAlign: "center",
      headerSort: false,
    },
    {
      title: "Provider",
      field: "provider",
      formatter: providerFormatterString,
      visible: false
    },
    {
      title: "Total Servers",
      field: "statusCount.countTotal",
      vertAlign: "middle",
      hozAlign: "center",
      maxWidth: 150,
    },
    {
      title: "Running",
      field: "statusCount.countRunning",
      formatterParams: { status: "running" },
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      maxWidth: 135,
    },
    {
      title: "Suspended",
      field: "statusCount.countSuspended",
      formatterParams: { status: "stop" },
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      maxWidth: 135,
    },
    {
      title: "Terminated",
      field: "statusCount.countTerminated",
      formatterParams: { status: "terminate" },
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      maxWidth: 135,
    },
  ];

  //mcisListTable = webconsolejs["common/util"].setTabulator("mcislist-table", tableObjParams, columns);// TODO [common/util]에 정의되어 있는데 호출하면 에러남... why?
  mcisListTable = setMcisTabulator("mcislist-table", tableObjParams, columns, true);

  // 행 클릭 시
  mcisListTable.on("rowClick", function (e, row) {
    // vmid 초기화 for vmlifecycle
    selectedVmId = ""
    var mcisID = row.getCell("id").getValue();
    console.log("mcisID", mcisID)

    // 표에서 선택된 MCISInfo 
    getSelectedMcisData(mcisID)

  });

  //  선택된 여러개 row에 대해 처리
  mcisListTable.on("rowSelectionChanged", function (data, rows) {
    checked_array = data
    console.log("checked_array", checked_array)
    console.log("rowsrows", data)
    selectedMcisObj = data
  });
  // displayColumn(table);
}

// toggleSelectBox of table row
function toggleRowSelection(id) {
  // mcisListTable에서 데이터 찾기
  console.log("idid : ", id)
  var row = mcisListTable.getRow(id);
  console.log("rowrow", row)
  if (row) {
    row.select();
    console.log("Row with ID " + id + " is selected.");
  } else {
    console.log("Row with ID " + id + " not found.");
  }
}

// 상태값을 table에서 표시하기 위해 감싸기
function statusFormatter(cell) {
  var mcisDispStatus = webconsolejs["common/api/services/mcis_api"].getMcisStatusFormatter(
    cell.getData().status
  ); // 화면 표시용 status
  var mcisStatusCell =
    '<img title="' +
    cell.getData().status +
    '" src="/assets/images/common/icon_' +
    mcisDispStatus +
    '.svg" class="icon" alt="">';

  return mcisStatusCell;
}

// provider를 table에서 표시하기 위해 감싸기
function providerFormatter(data) {
  console.log("datadata", data)
  console.log("cell.getData().vm", data.getData().vm)
  var vmCloudConnectionMap = webconsolejs["common/api/services/mcis_api"].calculateConnectionCount(
    data.getData().vm
  );
  var mcisProviderCell = "";
  vmCloudConnectionMap.forEach((value, key) => {
    mcisProviderCell +=
      '<img class="img-fluid" class="rounded" width="30" src="/assets/images/common/img_logo_' +
      key +
      '.png" alt="' +
      key +
      '"/>';
  });

  return mcisProviderCell;
}

// provider를 string으로 추출
// table에서 provider 이름으로 필터링 하기 위해
function providerFormatterString(data) {

  var vmCloudConnectionMap = webconsolejs["common/api/services/mcis_api"].calculateConnectionCount(
    data.getData().vm
  );

  var mcisProviderCell = "";
  vmCloudConnectionMap.forEach((value, key) => {
    mcisProviderCell += key + ", "
  });

  // Remove the trailing comma and space
  if (mcisProviderCell.length > 0) {
    mcisProviderCell = mcisProviderCell.slice(0, -2);
  }

  return mcisProviderCell;
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
    var vmCloudConnectionMap = webconsolejs["common/api/services/mcis_api"].calculateConnectionCount(
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