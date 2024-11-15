import { TabulatorFull as Tabulator } from "tabulator-tables";

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
  console.log("select-current-project changed ")
  // TODO : 왜 NsId를 select의 text값을 쓸까??
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  if (this.value == "") return;
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
  console.log("select-current-project on change ", project)

  currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId

  var respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(project.NsId);
  getMciListCallbackSuccess(project.NsId, respMciList);
})

////
// 모달 콜백 예제
export function commoncallbac(val) {
  alert(val);
}
//// 선택한 값이 object면 selectedXXX
//// 선택한 값이 id면 currentㅌㅌㅌ

var totalMciListObj = new Object();
var selectedWorkspaceProject = new Object();
export var selectedMciObj = new Object();

var totalMciStatusMap = new Map();
var totalVmStatusMap = new Map();

var currentNsId = "";
var currentMciId = "";
var currentVmId = "";

var mciListTable;
var checked_array = [];


initMciTable(); // init tabulator

//DOMContentLoaded 는 Page에서 1개만.
// init + 파일명 () : ex) initMci() 를 호출하도록 한다.
document.addEventListener("DOMContentLoaded", initMci);

// 해당 화면에서 최초 설정하는 function
//로드 시 prj 값 받아와 getMciList 호출
async function initMci() {

  console.log("initMci")
  ////////////////////// partials init functions///////////////////////////////////////
  try {
    webconsolejs["partials/operation/manage/mcicreate"].initMciCreate();//MciCreate을 Partial로 가지고 있음. 

    var targetSection = "mcicreate"
    var createBtnName = "Add Mci";
    //var onclickEvent = "webconsolejs['partials/operation/manage/mcicreate'].addNewMci()";

    webconsolejs['partials/layout/navigatePages'].addPageHeaderButton(targetSection, createBtnName);

  } catch (e) {
    console.log(e);
  }
  ////////////////////// partials init functions end ///////////////////////////////////////


  ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

  // workspace selection check
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject)

  // 현재 project set.
  currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId

  ////////////////////// set workspace list, project list at Navbar end //////////////////////////////////

  ////////////////////// 받은 mciId가 있으면 해당 mciId를 set하고 조회한다. ////////////////
  // 외부(dashboard)에서 받아온 mciID가 있으면 MCIS INFO 이동
  // 현재 브라우저의 URL
  const url = window.location.href;
  const urlObj = new URL(url);
  // URLSearchParams 객체 생성
  const params = new URLSearchParams(urlObj.search);
  // mciID 파라미터 값 추출
  var selectedMciID = params.get('mciID');

  console.log('selectedMciID:', selectedMciID);  // 출력: mciID의 값 (예: com)
  //if (selectedMciID != undefined) {
  if (selectedMciID) {
    currentMciId = selectedMciID
    toggleRowSelection(selectedMciID)
  }
  ////////////////////  mciId를 set하고 조회 완료. ////////////////

  refreshMciList();
}



// Mci 전체 목록 조회
export async function refreshMciList() {
  if (selectedWorkspaceProject.projectId != "") {
    console.log("workspaceProject ", selectedWorkspaceProject)

    //getMciList();// project가 선택되어 있으면 mci목록을 조회한다.
    var respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(currentNsId);
    console.log("respMciListrespMciListrespMciList", respMciList)
    getMciListCallbackSuccess(selectedWorkspaceProject.projectId, respMciList);

  }
}


// getMciList 호출 성공 시
function getMciListCallbackSuccess(caller, mciList) {
  console.log("getMciListCallbackSuccess");

  totalMciListObj = mciList.mci;
  console.log("total mci : ", totalMciListObj);

  // displayMciDashboard();

  if (currentMciId) {
    console.log("getMciListCallbackSuccess current mci ", currentMciId)
    getSelectedMciData();//선택한 mci가 있으면 처리
  }

  refreshDisplay();
}

// data 표시 
function refreshDisplay() {
  setToTalMciStatus(); // mci상태 표시
  setTotalVmStatus(); // mci 의 vm들 상태표시
  mciListTable.setData(totalMciListObj);

  if (currentMciId) {
    for (var mciIndex in totalMciListObj) {
      var aMci = totalMciListObj[mciIndex];

      if (currentMciId == aMci.id) {
        console.log(aMci)
        displayServerStatusList(currentMciId, aMci.vm)
        break;
      }
    }
  }
}
// table의 특정 row만 갱신
function refreshRowData(rowId, newData) {
  const selectedRows = mciListTable.getSelectedData().map(row => row.id);
  console.log("selectedRows ", selectedRows)
  console.log("rowId ", rowId)
  //mciListTable.updateData(totalMciListObj);
  mciListTable.updateData([{ id: rowId, ...newData }])
    .then(() => {
      console.log("table updateData ", newData)
      // 갱신 후 선택 상태 복원
      mciListTable.deselectRow(); // 기존 선택 해제
      mciListTable.selectRow(selectedRows); // 이전 선택 상태 복원
    })
    .catch(error => {
      console.error("Error updating row data:", error);
    });

  displayServerStatusList(rowId, newData.vm)
  console.log("displayServerStatusList at refreshRowData")
}
// 클릭한 mci info 가져오기
// 표에서 선택된 MciId 받아옴
export async function getSelectedMciData() {

  console.log('getSelectedMciData currentMciId:', currentMciId);  // 출력: mciID의 값 (예: com)
  if (currentMciId != undefined && currentMciId != "") {

    var mciResp = await webconsolejs["common/api/services/mci_api"].getMci(currentNsId, currentMciId)
    console.log("mciResp ", mciResp)
    if (mciResp.status.code != 200) {
      console.log("resp status ", mciResp.status)
      // failed.  // TODO : Error Popup 처리
      return;
    }

    var mciData = mciResp.responseData;
    // 전체를 관리하는 obj 갱신
    for (var mciIndex in totalMciListObj) {
      var aMci = totalMciListObj[mciIndex];

      if (aMci.id == mciData.id) {
        totalMciListObj[mciIndex] = mciData
        // Set MciTable()
        refreshRowData(mciData.id, mciData);
        break;
      }
    }

    // SET MCIS Info page
    setMciInfoData(mciData)



    // // Toggle MCIS Info
    // var div = document.getElementById("mci_info");
    // console.log("mciInfo ", div)
    // webconsolejs["partials/layout/navigatePages"].toggleElement(div)
  }
}

// 클릭한 mci의 info값 세팅
function setMciInfoData(mciData) {
  console.log("setMciInfoData", mciData)
  try {

    var mciID = mciData.id;
    var mciName = mciData.name;
    var mciDescription = mciData.description;
    var mciStatus = mciData.status;
    // var mciDispStatus = webconsolejs["common/api/services/mci_api"].getMciStatusFormatter(mciStatus);
    // var mciStatusIcon = webconsolejs["common/api/services/mci_api"].getMciStatusIconFormatter(mciDispStatus);
    var mciProviderNames = webconsolejs["common/api/services/mci_api"].getMciInfoProviderNames(mciData); //MCI에 사용 된 provider
    var totalvmCount = mciData.vm.length; //mci의 vm개수

    var mciStatusCell = "";

    // if (mciStatus.includes("Running")) {
    if (mciStatus === "Running") {
      mciStatusCell =
        '<div class="bg-green-lt card" style="border: 0px; display: inline-block; padding: 5px 10px; text-align: left;">' +
        '  <span class="text-green-lt" style="font-size: 12px;">Running</span>' +
        '</div>';
      // } else if (mciStatus.includes("Suspended")) {
    } else if (mciStatus === "Suspended") {
      mciStatusCell =
        '<div class="card bg-red-lt" style="border: 0px; display: inline-block; padding: 5px 10px; text-align: left;">' +
        '  <span class="text-red-lt" style="font-size: 12px;">Stopped</span>' +
        '</div>';
      // } else if (mciStatus.includes("Terminated")) {
    } else if (mciStatus === "Terminated") {
      mciStatusCell =
        '<div class="card bg-muted-lt" style="border: 0px; display: inline-block; padding: 5px 10px; text-align: left;">' +
        '  <span class="text-muted-lt" style="font-size: 12px;">Terminated</span>' +
        '</div>';
      // } else if (mciStatus.includes("Failed")) {
    } else {
      mciStatusCell =
        '<div class="card bg-muted-lt" style="border: 0px; display: inline-block; padding: 5px 10px; text-align: left;">' +
        '  <span class="text-muted-lt" style="font-size: 12px;">' + mciStatus + '</span>' +
        '</div>';
    }
    console.log("totalvmCount", totalvmCount)

    $("#mci_info_text").text(" [ " + mciName + " ]")
    $("#mci_server_info_status").empty();
    $("#mci_server_info_status").text(" [ " + mciName + " ]")
    $("#mci_server_info_count").text(" Server(" + totalvmCount + ")")


    // $("#mci_info_status_img").attr("src", "/assets/images/common/" + mciStatusIcon)
    $("#mci_info_name").text(mciName + " / " + mciID)
    $("#mci_info_description").text(mciDescription)
    // $("#mci_info_status").text(mciStatus)
    $("#mci_info_status").empty()
    $("#mci_info_status").append(mciStatusCell)
    $("#mci_info_cloud_connection").empty()
    $("#mci_info_cloud_connection").append(mciProviderNames)

  } catch (e) {
    console.error(e);
  }

  // refreshDisplay();
}

// mci 삭제
export function deleteMci() {
  console.log("deleteMcideleteMcideleteMci")
  webconsolejs["common/api/services/mci_api"].mciDelete(currentMciId, currentNsId)

}

// vm 삭제
export function deleteVm() {
  webconsolejs["common/api/services/mci_api"].vmDelete(currentMciId, currentNsId, currentVmId)

}

// mci life cycle 변경
export function changeMciLifeCycle(type) {
  webconsolejs["common/api/services/mci_api"].mciLifeCycle(type, currentMciId, currentNsId)
}

// vm life cycle 변경
export function changeVmLifeCycle(type) {
  if (currentVmId == undefined || currentVmId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Please select a VM')
    return;
  }
  selectedVmIds.forEach(vmId => {
    webconsolejs["common/api/services/mci_api"].vmLifeCycle(type, currentMciId, currentNsId, vmId);
  });

  console.log(`Lifecycle action '${type}' applied to selected VMs:`, selectedVmIds);
}
// vm 상태별 icon으로 표시
// Server List / Status VM리스트
// function displayServerStatusList(mciID, vmList) {
//   console.log("displayServerStatusList")

//   var mciName = mciID;
//   var vmLi = "";
//   vmList.sort();
//   for (var vmIndex in vmList) {
//     var aVm = vmList[vmIndex]

//     var vmID = aVm.id;
//     var vmName = aVm.name;
//     var vmStatus = aVm.status;
//     var vmDispStatus = webconsolejs["common/api/services/mci_api"].getVmStatusFormatter(vmStatus); // vmStatus set
//     var vmStatusClass = webconsolejs["common/api/services/mci_api"].getVmStatusStyleClass(vmDispStatus) // vmStatus 별로 상태 색상 set

//     vmLi += '<li id="server_status_icon_' + vmID + '" class="card ' + vmStatusClass + '" onclick="webconsolejs[\'pages/operation/manage/mci\'].vmDetailInfo(\'' + vmID +'\')"><span class="text-dark-fg">' + vmName + '</span></li>';

// //     vmLi += '<div class="form-selectgroup-label d-flex align-items-center p-3">'
// //   '<div class="me-3">'
// //     '<span class="form-selectgroup-check"></span>'
// //   '</div>'

// //   '<div class="form-selectgroup-label-content d-flex align-items-center">'
// //     '<span class="avatar me-3" style="background-image: url(./static/avatars/000m.jpg)"></span>'
// //     '<div>'
// //       '<div class="font-weight-medium">Paweł Kuna</div>'
// //       '<div class="text-secondary">UI Designer</div>'
// //     '</div>'
// //   '</div>'
// // '</div>'
//   }// end of mci loop

//   $("#mci_server_info_box").empty();
//   $("#mci_server_info_box").append(vmLi);

//   // 선택한 vm이 있는 경우 해당 vm의 정보도 갱신한다.
//   if( currentVmId ){
//     vmDetailInfo(currentVmId)
//   }
// }

function displayServerStatusList(mciID, vmList) {
  console.log("displayServerStatusList");

  var mciName = mciID;
  var vmLi = "";
  vmList.sort();

  vmList.forEach((aVm) => {
    var vmID = aVm.id;
    var vmName = aVm.name;
    var vmStatus = aVm.status;
    var vmDispStatus = webconsolejs["common/api/services/mci_api"].getVmStatusFormatter(vmStatus);
    var vmStatusClass = webconsolejs["common/api/services/mci_api"].getVmStatusStyleClass(vmDispStatus);

    vmLi += `
      <li id="server_status_icon_${vmID}" 
          class="card ${vmStatusClass} d-flex align-items-center" 
          style="display: flex; flex-direction: row; align-items: center; justify-content: center; padding: 5px;" 
          onclick="webconsolejs['pages/operation/manage/mci'].toggleCheck('${vmID}')">
        
        <input type="checkbox" 
               id="checkbox_${vmID}" 
               class="vm-checkbox" 
               style="width: 20px; height: 20px; margin-right: 10px; flex-shrink: 0;" 
               onchange="webconsolejs['pages/operation/manage/mci'].handleCheck('${vmID}')" 
               onclick="event.stopPropagation()">
        
        <span class="h3 mb-0 me-2">${vmName}</span>
      </li>
    `;
  });

  $("#mci_server_info_box").empty();
  $("#mci_server_info_box").append(vmLi);

  // 선택한 vm이 있는 경우 해당 vm의 정보도 갱신한다.
  if (currentVmId) {
    webconsolejs['pages/operation/manage/mci'].vmDetailInfo(currentVmId);
  }
}

// 체크박스를 클릭했을 때 선택 상태를 반전시킴
export function toggleCheck(vmID) {
  var checkbox = $(`#checkbox_${vmID}`);
  checkbox.prop("checked", !checkbox.prop("checked"));
  handleCheck(vmID);
}

// 체크박스를 선택하면 선택된 VM ID 업데이트
var selectedVmIds = [];

export function handleCheck(vmID) {
  var checkbox = $(`#checkbox_${vmID}`);
  if (checkbox.prop("checked")) {
    if (!selectedVmIds.includes(vmID)) selectedVmIds.push(vmID);
  } else {
    selectedVmIds = selectedVmIds.filter(id => id !== vmID);
  }

  // 마지막 선택된 VM ID로 설정 및 테두리 업데이트
  if (selectedVmIds.length > 0) {
    currentVmId = selectedVmIds[selectedVmIds.length - 1];
    webconsolejs['pages/operation/manage/mci'].vmDetailInfo(currentVmId);
  } else {
    // 선택된 VM이 없다면 ServerInfo를 접음
    clearServerInfo();
    const div = document.getElementById("server_info");
    if (div.classList.contains("active")) {
      webconsolejs["partials/layout/navigatePages"].toggleElement(div);
    }
  }

  // 마지막 선택된 VM 강조 표시
  highlightSelectedVm();
}

function highlightSelectedVm() {
  // 모든 li 요소의 테두리 제거
  $("#mci_server_info_box li").css("border", "none");

  // 마지막 선택된 VM ID에 테두리 추가
  if (selectedVmIds.length > 0) {
    const lastSelectedVmID = selectedVmIds[selectedVmIds.length - 1];
    $(`#server_status_icon_${lastSelectedVmID}`).css("border", "2px solid blue"); // 원하는 테두리 스타일 적용
  }
}

// Server List / Status VM 리스트에서
// VM 한 개 클릭시 vm의 세부 정보
export async function vmDetailInfo(vmId) {
  currentVmId = vmId
  // Toggle MCIS Info
  var div = document.getElementById("server_info");
  const hasActiveClass = div.classList.contains("active");
  console.log("vmDetailInfo hasActiveClass", hasActiveClass)
  if (!hasActiveClass) {
    webconsolejs["partials/layout/navigatePages"].toggleElement(div)
  }

  console.log("vmDetailInfo")
  console.log("mciID : ", currentMciId)
  console.log("vmID : ", currentVmId)

  // get mci vm  
  try {
    var response = await webconsolejs["common/api/services/mci_api"].getMciVm(currentNsId, currentMciId, vmId);
    var aVm = response.responseData
    var responseVmId = response.id;
    console.log("vm ", aVm)
    // 전체를 관리하는 obj 갱신
    var aMci = {};
    for (var mciIndex in totalMciListObj) {
      aMci = totalMciListObj[mciIndex];

      if (aMci.id == currentMciId) {
        for (var vmIndex in aMci.vm) {
          var tempVms = aMci.vm
          if (currentVmId == tempVms.id) {
            aMci.vm[vmIndex] = aVm;
            break;
          }
        }
        //aMci = totalMciListObj[mciIndex];
        totalMciListObj[mciIndex] = aMci;

        break;
      }
    }
    clearServerInfo();

    console.log("aMci", aMci);

    if (!aMci || !aMci.vm) {
      console.log("aMci or vmList is not defined");
      return;
    }

    var mciName = aMci.name;
    var vmList = aMci.vm;
    console.log("vmList:", vmList);

    var vmExist = false;
    var data = new Object();

    for (var vmIndex in vmList) {
      var aVm = vmList[vmIndex];
      if (currentVmId == aVm.id) {
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
  var privateIp = data.privateIP;
  //var securityGroupID = data.securityGroupIds[0];
  var securityGroupID = data.securityGroupIds;
  var providerName = data.connectionConfig.providerName
  var vmProviderIcon = ""
  vmProviderIcon +=
    '<img class="img-fluid" class="rounded" width="80" src="/assets/images/common/img_logo_' +
    (providerName == "" ? "mcmp" : providerName) +
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
  $("#server_info_name").text(vmName + "/" + vmId)
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
  console.log("addtionalDetails", addtionalDetails)
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
  $("#server_detail_view_keypair_name").text(data.sshKeyId)
  $("#server_detail_view_access_id_pass").text(data.vmUserName + "/ *** ")


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

  $("#manage_mci_popup_public_ip").val("")

  // connection tab
  $("#server_info_csp_icon").empty()
  $("#server_connection_view_csp").val("")
  $("#manage_mci_popup_csp").val("")

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
  // $("#manage_mci_popup_user_name").val("")

  $("#block_device_section").empty()
  // $("#attachedDiskList").empty()

  $("#server_detail_view_root_device_type").val("");
  $("#server_detail_view_root_device").val("");
  // $("#server_detail_disk_id").val("");
  // $("#server_detail_disk_mci_id").val("");
  // $("#server_detail_disk_vm_id").val("");

  $("#server_detail_view_security_group").empty()
  $("#server_detail_view_keypair_name").val("")
  $("#server_info_cspVMID").val("")

  // $("#selected_mci_id").val("");
  // $("#selected_vm_id").val("");

  // $("#exportFileName").val("");
  // $("#exportScript").val("");
}

// mci 상태 표시
function setToTalMciStatus() {
  console.log("setToTalMciStatus");
  try {
    for (var mciIndex in totalMciListObj) {
      var aMci = totalMciListObj[mciIndex];

      var aMciStatusCountMap = webconsolejs["common/api/services/mci_api"].calculateMciStatusCount(aMci);
      //console.log("aMci.id : ", aMci.id);
      //console.log("mciStatusMap ::: ", aMciStatusCountMap);
      totalMciStatusMap.set(aMci.id, aMciStatusCountMap);
    }
  } catch (e) {
    console.log("mci status error", e);
  }
  displayMciStatusArea();
}

// Mci 목록에서 vmStatus만 처리 : 화면표시는 display function에서
// vm 상태 표시
function setTotalVmStatus() {
  console.log("setTotalVmstatus")
  try {
    for (var mciIndex in totalMciListObj) {
      var aMci = totalMciListObj[mciIndex];
      //console.log("aMci : ", aMci);
      var vmStatusCountMap = webconsolejs["common/api/services/mci_api"].calculateVmStatusCount(aMci);
      totalVmStatusMap.set(aMci.id, vmStatusCountMap);
    }
  } catch (e) {
    console.log("mci status error");
  }
  displayVmStatusArea();
}

// mci status display
function displayMciStatusArea() {
  console.log("displayMciStatusArea");
  var sumMciCnt = 0;
  var sumMciRunningCnt = 0;
  var sumMciStopCnt = 0;
  var sumMciTerminateCnt = 0;
  totalMciStatusMap.forEach((value, key) => {
    var statusRunning = value.get("running");
    var statusStop = value.get("stop");
    var statusTerminate = value.get("terminate");
    sumMciRunningCnt += statusRunning;
    sumMciStopCnt += statusStop;
    sumMciTerminateCnt += statusTerminate;
    //console.log("totalMciStatusMap :: ", key, value);
  });
  sumMciCnt = sumMciRunningCnt + sumMciStopCnt + sumMciTerminateCnt;

  $("#total_mci").text(sumMciCnt);
  $("#mci_status_running").text(sumMciRunningCnt);
  $("#mci_status_stopped").text(sumMciStopCnt);
  $("#mci_status_terminated").text(sumMciTerminateCnt);
  console.log("displayMciStatusArea ");
  console.log("running status count ", $("#mci_status_running").text());
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
function setMciTabulator(
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
function initMciTable() {

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

  //mciListTable = webconsolejs["common/util"].setTabulator("mcilist-table", tableObjParams, columns);// TODO [common/util]에 정의되어 있는데 호출하면 에러남... why?
  mciListTable = setMciTabulator("mcilist-table", tableObjParams, columns, true);

  // 행 클릭 시
  mciListTable.on("rowClick", function (e, row) {
    // vmid 초기화 for vmlifecycle

    // var tempcurmciID = currentClickedmciID
    // currentClickedmciID = row.getCell("id").getValue();
    var tempcurmciID = row.getCell("id").getValue();
    if (tempcurmciID === currentMciId) {
      webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("mci_info"))
      currentMciId = ""
      this.deselectRow();
      return
    } else {
      currentMciId = tempcurmciID;
      webconsolejs["partials/layout/navigatePages"].activeElement(document.getElementById("mci_info"))
      this.deselectRow();
      this.selectRow(currentMciId);
      // 표에서 선택된 MCISInfo 
      getSelectedMciData()
      return
    }
    // currentClickedmciID = 
    // console.log("currentClickedmciID == ", currentClickedmciID)
    // if (tempcurmciID === currentClickedmciID) {
    //   webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("mci_info"))
    //   currentClickedmciID = ""
    //   this.deselectRow();
    //   return
    // } else {
    //   webconsolejs["partials/layout/navigatePages"].activeElement(document.getElementById("mci_info"))
    //   this.deselectRow();
    //   this.selectRow(currentClickedmciID);
    //   // 표에서 선택된 MCISInfo 
    //   getSelectedMciData()
    //   return
    // }
  });

  //  선택된 여러개 row에 대해 처리
  mciListTable.on("rowSelectionChanged", function (data, rows) {
    checked_array = data
    console.log("checked_array", checked_array)
    console.log("rowsrows", data)
    selectedMciObj = data
  });
  // displayColumn(table);
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

// 상태값을 table에서 표시하기 위해 감싸기
function statusFormatter(cell) {
  var mciDispStatus = webconsolejs["common/api/services/mci_api"].getMciStatusFormatter(
    cell.getData().status
  ); // 화면 표시용 status
  console.log("mciDispStatusmciDispStatus", mciDispStatus)
  var mciStatusCell = "";

  if (mciDispStatus === "running") {
    mciStatusCell =
      '<div class="bg-green-lt card" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 80px; height: 25px;">' +
      '  <span class="text-green-lt" style="font-size: 12px;">Running</span>' +
      '</div>';
  } else if (mciDispStatus === "suspended" || mciDispStatus === "stop") {
    mciStatusCell =
      '<div class="card bg-red-lt" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 80px; height: 25px;">' +
      '  <span class="text-red-lt" style="font-size: 12px;">Suspended</span>' +
      '</div>';
  } else if (mciDispStatus === "terminated") {
    mciStatusCell =
      '<div class="card bg-muted-lt" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 80px; height: 25px;">' +
      '  <span class="text-muted-lt" style="font-size: 12px;">Terminated</span>' +
      '</div>';
  } else {
    mciStatusCell =
      '<div class="card bg-muted-lt" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 80px; height: 25px;">' +
      '  <span class="text-muted-lt" style="font-size: 12px;">Partial</span>' +
      '</div>';
  }

  return mciStatusCell;
}

// provider를 table에서 표시하기 위해 감싸기
function providerFormatter(data) {
  console.log("datadata", data)
  console.log("cell.getData().vm", data.getData().vm)
  var vmCloudConnectionMap = webconsolejs["common/api/services/mci_api"].calculateConnectionCount(
    data.getData().vm
  );
  var mciProviderCell = "";
  vmCloudConnectionMap.forEach((value, key) => {
    mciProviderCell +=
      '<img class="img-fluid" class="rounded" width="30" src="/assets/images/common/img_logo_' +
      (key == "" ? "mcmp" : key) +
      '.png" alt="' +
      key +
      '"/>';
  });

  return mciProviderCell;
}

// provider를 string으로 추출
// table에서 provider 이름으로 필터링 하기 위해
function providerFormatterString(data) {

  var vmCloudConnectionMap = webconsolejs["common/api/services/mci_api"].calculateConnectionCount(
    data.getData().vm
  );

  var mciProviderCell = "";
  vmCloudConnectionMap.forEach((value, key) => {
    mciProviderCell += key + ", "
  });

  // Remove the trailing comma and space
  if (mciProviderCell.length > 0) {
    mciProviderCell = mciProviderCell.slice(0, -2);
  }

  return mciProviderCell;
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






/////////////////// TEST TERMINAL MODAL /////////////////////////

export async function initremotecmdModal(){
  const nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject().NsId
  await webconsolejs["common/api/services/remotecmd_api"].initTerminal('xterm-container',nsId,currentMciId,currentVmId) // vmStatus 별로 상태 색상 set
  const modalElement = document.getElementById('cmdtestmodal');
  const modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}


export async function getKeypair(el){
  const sshkeyId = el.innerText
  $("#keypairModal-bodytitle").text(sshkeyId);
  var respSSHkey = await webconsolejs["common/api/services/mci_api"].getsshkey(currentNsId, sshkeyId);
  $("#keypairModal-textarea").val(respSSHkey.privateKey);
}