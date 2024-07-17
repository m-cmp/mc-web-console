console.log("mcis_dashboard.js");

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
  console.log("select-current-project change project ", project)
  var respMcisList = await webconsolejs["common/api/services/mcis_api"].getMcisList(project.NsId);

  getMcisListCallbackSuccess(respMcisList);
})

var totalMcisListObj = new Object();
var totalMcisStatusMap = new Map();
var totalVmStatusMap = new Map();
var nsid = ""
var returnFunction;

// 페이지 로드 시 prj 값 받아와 getMcisList 호출
// partial의 변경내용을 parent로 알려주기 위해 callbackStatusChangedFunction 정의
export async function initMcisDashboard(callbackfunction, workspaceProject) {
  console.log("initMcisDashboard ")
  console.log("workspaceProject ", workspaceProject)
  returnFunction = callbackfunction

  if (workspaceProject.projectId != "") {
    var selectedProjectId = workspaceProject.projectId;
    var selectedNsId = workspaceProject.nsId;
    var respMcisList = await webconsolejs["common/api/services/mcis_api"].getMcisList(selectedNsId);

    getMcisListCallbackSuccess("", respMcisList);
  } else {
    // workspace, project 선택 popup
  }
}

// mcisList 조회 성공시 화면에 Set
function getMcisListCallbackSuccess(caller, mcisList) {
  console.log("getMcisListCallbackSuccess");
  
  totalMcisListObj = mcisList.mcis;

  var returnMcisListObj = new Object();

  // TODO : why return 이 '0' 일까 ?????????????????????????????????????????????????????????????????????????????
  returnMcisListObj.totalMcisStatusMap = setToTalMcisStatus(totalMcisListObj);
  returnMcisListObj.totalVmStatusMap = setTotalVmStatus(totalMcisListObj);

  console.log("before callback ", returnMcisListObj)
  // 조회가 되면 parent로 변경내용을 알려 줌.
  eval(returnFunction)("mcischanged", returnMcisListObj);

  displayMcisDashboard();

  // TODO : map표시
  //     // setMap();// MCIS를 가져와서 화면에 뿌려지면 vm정보가 있으므로 Map그리기

}

// 모든 mcis의 상태값 map에 set
function setToTalMcisStatus(totalMcisListObj) {
  console.log("setToTalMcisStatus");
  //var totalMcisStatusMap = new Map();
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
  //displayMcisStatusArea(totalMcisStatusMap);
  return totalMcisStatusMap;
}

// Mcis 목록에서 vmStatus만 처리 : 화면표시는 display function에서
function setTotalVmStatus(totalMcisListObj) {
  //var totalVmStatusMap = new Map();
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
  //displayVmStatusArea(totalVmStatusMap);
  return totalVmStatusMap;
}

// dashboard card 표시
function displayMcisDashboard() {
  console.log("displayMcisDashboard");
  if (!webconsolejs["common/util"].isEmpty(totalMcisListObj) && totalMcisListObj.length > 0) {
    //totalMcisCnt = mcisList.length;
    var addMcis = "";
    for (var mcisIndex in totalMcisListObj) {
      var aMcis = totalMcisListObj[mcisIndex];
      console.log("aMcis.id : ", aMcis.id)
      if (aMcis.id != "") {
        addMcis += setMcisListTableRow(aMcis, mcisIndex);
      }
    } // end of mcis loop
    $("#mcisList").empty();
    $("#mcisList").append(addMcis);
    //console.log("after add", addMcis)
  } else {
    var addMcis = "";
    addMcis += "<tr>";
    addMcis += '<td class="overlay hidden" data-th="" colspan="8">No Data</td>';
    addMcis += "</tr>";
    $("#mcisList").empty();
    $("#mcisList").append(addMcis);
  }
}

function setMcisListTableRow(aMcisData, mcisIndex) {
  var mcisTableRow = "";
  var mcisStatus = aMcisData.status
  var mcisDispStatus = webconsolejs["common/api/services/mcis_api"].getMcisStatusFormatter(mcisStatus);// 화면 표시용 status

  var vmStatusCountMap = totalVmStatusMap.get(aMcisData.id);
  var totalVmCountOfMcis = vmStatusCountMap.get('running') + vmStatusCountMap.get('stop') + vmStatusCountMap.get('terminate');
  console.log("totalVmStatusMap", totalVmStatusMap)
  // List of Mcis table
  try {

    // vm항목 미리 생성 후 mcis 생성할 때 붙임
    var addVm = "";
    var vmListOfMcis = aMcisData.vm;
    var vmLength = 9;
    if (typeof vmListOfMcis !== 'undefined' && vmListOfMcis.length > 0) {
      for (var vmIndex in vmListOfMcis) {
        var aVm = vmListOfMcis[vmIndex];

        var vmName = ""
        var vmNamelength = aVm.name
        console.log("vmNamelength", vmNamelength)
        if (vmNamelength.length > vmLength) {
          var vmName = vmNamelength.substring(0, vmLength - 3) + "...";
          console.log("vmNameString", vmName)
          console.log("vmNamelength.length", vmNamelength.length)
        } else {
          vmName = vmNamelength;
          console.log("vmName", vmName)
        }


        var vmDispStatus = webconsolejs["common/api/services/mcis_api"].getVmStatusFormatter(aVm.status);
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
        addVm += '        <input type="hidden" name="mapPinIndex" id="mapPinIndex_' + mcisIndex + '_' + vmIndex + '" value="' + mcisIndex + '"/>'
        addVm += '        <input type="hidden" name="vmID" id="vmID_' + mcisIndex + '_' + vmIndex + '" value="' + aMcisData.name + '"/>'
        addVm += '        <input type="hidden" name="vmName" id="vmName_' + mcisIndex + '_' + vmIndex + '" value="' + (Number(vmIndex) + 1).toString() + '"/>'
        addVm += '        <input type="hidden" name="vmStatus" id="vmStatus_' + mcisIndex + '_' + vmIndex + '" value="' + vmDispStatus + '"/>'
        addVm += '        <input type="hidden" name="longitude" id="longitude_' + mcisIndex + '_' + vmIndex + '" value="' + location.longitude + '"/>'
        addVm += '        <input type="hidden" name="latitude" id="latitude_' + mcisIndex + '_' + vmIndex + '" value="' + location.latitude + '"/>'
        addVm += '</li>'
      }
    }

    mcisTableRow += '   <div class="card bg-secondary-lt mcis-list" id="mcis_areabox_' + mcisIndex + ' "onclick="webconsolejs[\'partials/operation/dashboard/mcis_dashboard\'].selectMcis(\'' + aMcisData.id + '\',\'' + aMcisData.name + '\',\'mcis_areabox_' + mcisIndex + '\', this)">'
    mcisTableRow += '     <div hidden id="' + mcisIndex + '"></div>'
    mcisTableRow += '     <div hidden id="' + mcisDispStatus + '"></div>'
    mcisTableRow += '     <div class="card-header">'
    mcisTableRow += '       <span>' + aMcisData.name + '</span>'
    mcisTableRow += '     </div>'
    mcisTableRow += '     <div class="card-body">'
    mcisTableRow += '       infra <span><strong class="text-info">' + totalVmCountOfMcis + '</strong></span>'
    mcisTableRow += '       <span>(</span> <span class="text-info">' + sumVmCountRunning + '</span>'
    mcisTableRow += '       <span>/</span> <span class="text-red">' + sumVmCountStop + '</span>'
    mcisTableRow += '       <span>/</span> <span class="text-secondary">' + sumVmCountTerminate + '<span>)</span> </span>'
    mcisTableRow += '     <div>'
    mcisTableRow += '          <span>server ' + sumVmCount + '</span>'
    mcisTableRow += '     </div>'
    mcisTableRow += '         <ul class="vm-list">'
    mcisTableRow += addVm
    mcisTableRow += '         </ul>'
    mcisTableRow += '     </div>'
    mcisTableRow += '   </div>'

  } catch (e) {
    console.log("list of mcis error")
    console.log(e)
  }
  return mcisTableRow;
}

// dashboard 의 MCIS 목록에서 mcis 선택 : 색상반전, 선택한 mcis id set -> status변경에 사용
// 1번클릭시 선택
// 2번 클릭 시 해당 MCIS로 이동

var selectedMcisId = ""
var clickCount = 0;

export function selectMcis(id, name, target, obj) {

  // TODO: navbar 통합 후 MCIS INFO이동
  // var moveUrl = "/webconsole/operation/manage/mcis";
  // window.location.href = moveUrl;
  // TODO: navbar 통합 시 선택된 MCIS INFO 열리도록
  console.log("selectMCIS", id, name, target)
  selectedMcisId = id
  console.log("selectedMcisId", selectedMcisId)
  var mcisId = id
  var mcisName = name

  $("#mcis_id").val(mcisId)
  $("#mcis_name").val(mcisName)
  console.log(" mcis_id =" + mcisId + ", mcisName = " + mcisName);

  // active 면 이동한다.
  var urlParamMap = new Map();
  urlParamMap.set("mcisID", mcisId)
  webconsolejs["common/util"].changePage("McisMng", urlParamMap)

  // MCIS List table의 1개 Row Update
  function updateMcisListTableRow(aMcisData, mcisIndex) {

    var mcisStatus = aMcisData.status
    var mcisProviderNames = getProviderNamesOfMcis(aMcisData.id);//MCIS에 사용 된 provider
    var mcisDispStatus = webconsolejs["common/api/services/mcis_api"].getMcisStatusFormatter(mcisStatus);// 화면 표시용 status

    var vmStatusCountMap = totalVmStatusMap.get(aMcisData.id);
    var mcisStatusImg = "/assets/img/contents/icon_" + mcisDispStatus + ".png"

    var sumVmCountRunning = vmStatusCountMap.get("running")
    var sumVmCountStop = vmStatusCountMap.get("stop")
    var sumVmCountTerminate = vmStatusCountMap.get("terminate")
    var sumVmCount = sumVmCountRunning + sumVmCountStop + sumVmCountTerminate

    // id="server_info_tr_" + mcisIndex             // tr   -> 변경없음
    // id="mcisInfo_mcisStatus_icon_" + mcisIndex   // icon
    $("#mcisInfo_mcisStatus_icon_" + mcisIndex).attr("src", mcisStatusImg);

    // id="mcisInfo_mcisstatus_" + mcisIndex
    $("#mcisInfo_mcisstatus_" + mcisIndex).text(mcisStatus)
    // id="mcisInfo_mcisName_" + mcisIndex
    $("#mcisInfo_mcisName_" + mcisIndex).text(aMcisData.name)
    // id="mcisInfo_mcisProviderNames_" + mcisIndex
    $("#mcisInfo_mcisProviderNames_" + mcisIndex).text(mcisProviderNames)
    // id="mcisInfo_totalVmCountOfMcis_" + mcisIndex
    $("#mcisInfo_totalVmCountOfMcis_" + mcisIndex).text(sumVmCount)
    // id="mcisInfo_vmstatus_running_" + mcisIndex
    $("#mcisInfo_vmstatus_running_" + mcisIndex).text(sumVmCountRunning)
    // id="mcisInfo_vmstatus_stop_" + mcisIndex
    $("#mcisInfo_vmstatus_stop_" + mcisIndex).text(sumVmCountStop)
    // id="mcisInfo_vmstatus_terminate_" + mcisIndex
    $("#mcisInfo_vmstatus_terminate_" + mcisIndex).text(sumVmCountTerminate)
    // id="mcisInfo_mcisDescription_" + mcisIndex
    $("#mcisInfo_mcisDescription_" + mcisIndex).text(sumVmCount)
    // id="td_ch_" + mcisIndex                      // checkbox -> 변경없음
  }
}