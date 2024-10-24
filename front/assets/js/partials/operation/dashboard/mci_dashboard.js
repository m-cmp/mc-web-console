console.log("mci_dashboard.js");

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
  console.log("select-current-project change project ", project)
  var respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(project.NsId);

  getMciListCallbackSuccess(respMciList);
})

var totalMciListObj = new Object();
var totalMciStatusMap = new Map();
var totalVmStatusMap = new Map();
var nsid = ""
var returnFunction;

// 페이지 로드 시 prj 값 받아와 getMciList 호출
// partial의 변경내용을 parent로 알려주기 위해 callbackStatusChangedFunction 정의
export async function initMciDashboard(callbackfunction, workspaceProject) {
  console.log("initMciDashboard ")
  console.log("workspaceProject ", workspaceProject)
  returnFunction = callbackfunction

  if (workspaceProject.projectId != "") {
    var selectedProjectId = workspaceProject.projectId;
    var selectedNsId = workspaceProject.nsId;
    var respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(selectedNsId);

    getMciListCallbackSuccess("", respMciList);
  } else {
    // workspace, project 선택 popup
  }
}

// mciList 조회 성공시 화면에 Set
function getMciListCallbackSuccess(caller, mciList) {
  console.log("getMciListCallbackSuccess");
  
  // totalMciListObj = mciList.mci;
  totalMciListObj = mciList.mci;

  var returnMciListObj = new Object();

  // TODO : why return 이 '0' 일까 ?????????????????????????????????????????????????????????????????????????????
  returnMciListObj.totalMciStatusMap = setToTalMciStatus(totalMciListObj);
  returnMciListObj.totalVmStatusMap = setTotalVmStatus(totalMciListObj);

  console.log("before callback ", returnMciListObj)
  // 조회가 되면 parent로 변경내용을 알려 줌.
  eval(returnFunction)("mcichanged", returnMciListObj);

  displayMciDashboard();

  // TODO : map표시
  //     // setMap();// MCIS를 가져와서 화면에 뿌려지면 vm정보가 있으므로 Map그리기

}

// 모든 mci의 상태값 map에 set
function setToTalMciStatus(totalMciListObj) {
  console.log("setToTalMciStatus");
  //var totalMciStatusMap = new Map();
  try {
    for (var mciIndex in totalMciListObj) {
      var aMci = totalMciListObj[mciIndex];

      var aMciStatusCountMap = webconsolejs["common/api/services/mci_api"].calculateMciStatusCount(aMci);
      console.log("aMci.id : ", aMci.id);
      console.log("mciStatusMap ::: ", aMciStatusCountMap);
      totalMciStatusMap.set(aMci.id, aMciStatusCountMap);
    }
  } catch (e) {
    console.log("mci status error", e);
  }
  //displayMciStatusArea(totalMciStatusMap);
  return totalMciStatusMap;
}

// Mci 목록에서 vmStatus만 처리 : 화면표시는 display function에서
function setTotalVmStatus(totalMciListObj) {
  //var totalVmStatusMap = new Map();
  try {
    for (var mciIndex in totalMciListObj) {
      var aMci = totalMciListObj[mciIndex];
      console.log("aMci : ", aMci);
      var vmStatusCountMap = webconsolejs["common/api/services/mci_api"].calculateVmStatusCount(aMci);
      totalVmStatusMap.set(aMci.id, vmStatusCountMap);
    }
  } catch (e) {
    console.log("mci status error");
  }
  //displayVmStatusArea(totalVmStatusMap);
  return totalVmStatusMap;
}

// dashboard card 표시
function displayMciDashboard() {
  console.log("displayMciDashboard");
  if (!webconsolejs["common/util"].isEmpty(totalMciListObj) && totalMciListObj.length > 0) {
    //totalMciCnt = mciList.length;
    var addMci = "";
    for (var mciIndex in totalMciListObj) {
      var aMci = totalMciListObj[mciIndex];
      console.log("aMci.id : ", aMci.id)
      if (aMci.id != "") {
        addMci += setMciListTableRow(aMci, mciIndex);
      }
    } // end of mci loop
    $("#mciList").empty();
    $("#mciList").append(addMci);
    //console.log("after add", addMci)
  } else {
    var addMci = "";
    addMci += "<tr>";
    addMci += '<td class="overlay hidden" data-th="" colspan="8">No Data</td>';
    addMci += "</tr>";
    $("#mciList").empty();
    $("#mciList").append(addMci);
  }
}

function setMciListTableRow(aMciData, mciIndex) {
  var mciTableRow = "";
  var mciStatus = aMciData.status
  var mciDispStatus = webconsolejs["common/api/services/mci_api"].getMciStatusFormatter(mciStatus);// 화면 표시용 status

  var vmStatusCountMap = totalVmStatusMap.get(aMciData.id);
  var totalVmCountOfMci = vmStatusCountMap.get('running') + vmStatusCountMap.get('stop') + vmStatusCountMap.get('terminate');
  // List of Mci table
  try {

    // vm항목 미리 생성 후 mci 생성할 때 붙임
    var addVm = "";
    var vmListOfMci = aMciData.vm;
    var vmLength = 9;
    if (typeof vmListOfMci !== 'undefined' && vmListOfMci.length > 0) {
      for (var vmIndex in vmListOfMci) {
        var aVm = vmListOfMci[vmIndex];

        var vmName = ""
        // var vmNamelength = aVm.name
        var vmNamelength = aVm.id

        if (vmNamelength.length > vmLength) {
          var vmName = vmNamelength.substring(0, vmLength - 3) + "...";
        } else {
          vmName = vmNamelength;
        }


        var vmDispStatus = webconsolejs["common/api/services/mci_api"].getVmStatusFormatter(aVm.status);
        var sumVmCountRunning = vmStatusCountMap.get("running")
        var sumVmCountStop = vmStatusCountMap.get("stop")
        var sumVmCountTerminate = vmStatusCountMap.get("terminate")
        var sumVmCount = sumVmCountRunning + sumVmCountStop + sumVmCountTerminate
        // connections
        var location = aVm.location;
        if (!webconsolejs["common/util"].isEmpty(location)) {
          var vmLongitude = location.longitude;
          var vmLatitude = location.latitude;

        }

        // vmStatus별 vm 색 설정
        if (vmDispStatus == "running") {

          addVm += '<li class="vm-item bg-info"' + vmDispStatus + '">'
        }
        if (vmDispStatus == "suspend") {
          addVm += '<li class="vm-item bg-red"' + vmDispStatus + '">'
        }
        if (vmDispStatus == "terminate") {
          addVm += '<li class="vm-item bg-secondary"' + vmDispStatus + '">'
        }

        addVm += '    <a href="javascript:void(0);"><span class="text-white">' + vmName + '</span></a>'
        addVm += '        <input type="hidden" name="mapPinIndex" id="mapPinIndex_' + mciIndex + '_' + vmIndex + '" value="' + mciIndex + '"/>'
        addVm += '        <input type="hidden" name="vmID" id="vmID_' + mciIndex + '_' + vmIndex + '" value="' + aMciData.name + '"/>'
        addVm += '        <input type="hidden" name="vmName" id="vmName_' + mciIndex + '_' + vmIndex + '" value="' + (Number(vmIndex) + 1).toString() + '"/>'
        addVm += '        <input type="hidden" name="vmStatus" id="vmStatus_' + mciIndex + '_' + vmIndex + '" value="' + vmDispStatus + '"/>'
        addVm += '        <input type="hidden" name="longitude" id="longitude_' + mciIndex + '_' + vmIndex + '" value="' + location.longitude + '"/>'
        addVm += '        <input type="hidden" name="latitude" id="latitude_' + mciIndex + '_' + vmIndex + '" value="' + location.latitude + '"/>'
        addVm += '</li>'
      }
    }

    mciTableRow += '   <div class="card bg-secondary-lt mci-list" id="mci_areabox_' + mciIndex + ' "onclick="webconsolejs[\'partials/operation/dashboard/mci_dashboard\'].selectMci(\'' + aMciData.id + '\',\'' + aMciData.name + '\',\'mci_areabox_' + mciIndex + '\', this)">'
    mciTableRow += '     <div hidden id="' + mciIndex + '"></div>'
    mciTableRow += '     <div hidden id="' + mciDispStatus + '"></div>'
    mciTableRow += '     <div class="card-header">'
    mciTableRow += '       <span>' + aMciData.name + '</span>'
    mciTableRow += '     </div>'
    mciTableRow += '     <div class="card-body">'
    mciTableRow += '       infra <span><strong class="text-info">' + totalVmCountOfMci + '</strong></span>'
    mciTableRow += '       <span>(</span> <span class="text-info">' + sumVmCountRunning + '</span>'
    mciTableRow += '       <span>/</span> <span class="text-red">' + sumVmCountStop + '</span>'
    mciTableRow += '       <span>/</span> <span class="text-secondary">' + sumVmCountTerminate + '<span>)</span> </span>'
    mciTableRow += '     <div>'
    mciTableRow += '          <span>server ' + sumVmCount + '</span>'
    mciTableRow += '     </div>'
    mciTableRow += '         <ul class="vm-list">'
    mciTableRow += addVm
    mciTableRow += '         </ul>'
    mciTableRow += '     </div>'
    mciTableRow += '   </div>'

  } catch (e) {
    console.log("list of mci error")
    console.log(e)
  }
  return mciTableRow;
}

// dashboard 의 MCIS 목록에서 mci 선택 : 색상반전, 선택한 mci id set -> status변경에 사용
// 1번클릭시 선택
// 2번 클릭 시 해당 MCIS로 이동

var selectedMciId = ""
var clickCount = 0;

export function selectMci(id, name, target, obj) {

  // TODO: navbar 통합 후 MCIS INFO이동
  // var moveUrl = "/webconsole/operation/manage/mci";
  // window.location.href = moveUrl;
  // TODO: navbar 통합 시 선택된 MCIS INFO 열리도록
  console.log("selectMCIS", id, name, target)
  selectedMciId = id
  console.log("selectedMciId", selectedMciId)
  var mciId = id
  var mciName = name

  $("#mci_id").val(mciId)
  $("#mci_name").val(mciName)
  console.log(" mci_id =" + mciId + ", mciName = " + mciName);

  // active 면 이동한다.
  var urlParamMap = new Map();
  urlParamMap.set("mciID", mciId)
  // webconsolejs["common/util"].changePage("MciMng", urlParamMap)
  window.location = "/webconsole/operations/manage/workloads/mciworkloads"


  // MCIS List table의 1개 Row Update
  function updateMciListTableRow(aMciData, mciIndex) {

    var mciStatus = aMciData.status
    var mciProviderNames = getProviderNamesOfMci(aMciData.id);//MCIS에 사용 된 provider
    var mciDispStatus = webconsolejs["common/api/services/mci_api"].getMciStatusFormatter(mciStatus);// 화면 표시용 status

    var vmStatusCountMap = totalVmStatusMap.get(aMciData.id);
    var mciStatusImg = "/assets/img/contents/icon_" + mciDispStatus + ".png"

    var sumVmCountRunning = vmStatusCountMap.get("running")
    var sumVmCountStop = vmStatusCountMap.get("stop")
    var sumVmCountTerminate = vmStatusCountMap.get("terminate")
    var sumVmCount = sumVmCountRunning + sumVmCountStop + sumVmCountTerminate

    // id="server_info_tr_" + mciIndex             // tr   -> 변경없음
    // id="mciInfo_mciStatus_icon_" + mciIndex   // icon
    $("#mciInfo_mciStatus_icon_" + mciIndex).attr("src", mciStatusImg);

    // id="mciInfo_mcistatus_" + mciIndex
    $("#mciInfo_mcistatus_" + mciIndex).text(mciStatus)
    // id="mciInfo_mciName_" + mciIndex
    $("#mciInfo_mciName_" + mciIndex).text(aMciData.name)
    // id="mciInfo_mciProviderNames_" + mciIndex
    $("#mciInfo_mciProviderNames_" + mciIndex).text(mciProviderNames)
    // id="mciInfo_totalVmCountOfMci_" + mciIndex
    $("#mciInfo_totalVmCountOfMci_" + mciIndex).text(sumVmCount)
    // id="mciInfo_vmstatus_running_" + mciIndex
    $("#mciInfo_vmstatus_running_" + mciIndex).text(sumVmCountRunning)
    // id="mciInfo_vmstatus_stop_" + mciIndex
    $("#mciInfo_vmstatus_stop_" + mciIndex).text(sumVmCountStop)
    // id="mciInfo_vmstatus_terminate_" + mciIndex
    $("#mciInfo_vmstatus_terminate_" + mciIndex).text(sumVmCountTerminate)
    // id="mciInfo_mciDescription_" + mciIndex
    $("#mciInfo_mciDescription_" + mciIndex).text(sumVmCount)
    // id="td_ch_" + mciIndex                      // checkbox -> 변경없음
  }
}