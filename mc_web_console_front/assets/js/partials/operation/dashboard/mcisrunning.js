console.log("mcisrunning.js");

var totalMcisListObj = new Object();
var totalMcisStatusMap = new Map();
var totalVmStatusMap = new Map();

// for the test
document.addEventListener("DOMContentLoaded", life_cycle);

async function life_cycle() {
  const data = {
    pathParams: {
      nsId: "testns01",
    },
  };
  //var controller = "targetController=getmcislist"
  var controller = "/api/" + "getmcislist";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  var mcisList = response.data.responseData;
  console.log("mcisList : ", mcisList);
  getMcisListCallbackSuccess("testns01", mcisList);
}

// MCIS 목록 조회 후 화면에 Set

function getMcisListCallbackSuccess(caller, mcisList) {
  console.log("getMcisListCallbackSuccess");

  totalMcisListObj = mcisList.mcis;

  setToTalMcisStatus(); // mcis상태 표시 를 위해 필요
  setTotalVmStatus(); // mcis 의 vm들 상태표시 를 위해 필요
  //     setTotalConnection();// Mcis의 provider별 connection 표시를 위해 필요

  displayMcisDashboard();

  //     // setMap();// MCIS를 가져와서 화면에 뿌려지면 vm정보가 있으므로 Map그리기

  //     AjaxLoadingShow(false);
}

function setToTalMcisStatus() {
  console.log("setToTalMcisStatus");
  try {
    for (var mcisIndex in totalMcisListObj) {
      var aMcis = totalMcisListObj[mcisIndex];

      var aMcisStatusCountMap = calculateMcisStatusCount(aMcis);
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
function setTotalVmStatus() {
  try {
    for (var mcisIndex in totalMcisListObj) {
      var aMcis = totalMcisListObj[mcisIndex];
      console.log("aMcis : ", aMcis);
      var vmStatusCountMap = calculateVmStatusCount(aMcis);
      totalVmStatusMap.set(aMcis.id, vmStatusCountMap);
    }
  } catch (e) {
    console.log("mcis status error");
  }
  displayVmStatusArea();
}

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

// 해당 mcis에서 상태값들을 count : 1개 mcis의 상태는 1개만 있으므로 running, stop, terminate 중 1개만 1, 나머지는 0
// dashboard, mcis 에서 사용
function calculateMcisStatusCount(mcisData) {
    //O
  console.log("calculateMcisStatusCount");
  console.log("mcisData : ", mcisData);
  var mcisStatusCountMap = new Map();
  mcisStatusCountMap.set("running", 0);
  mcisStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  mcisStatusCountMap.set("terminate", 0);
  try {
    var mcisStatus = mcisData.status;
    var mcisDispStatus = getMcisStatusDisp(mcisStatus); // 화면 표시용 status

    if (mcisStatus != "") {
      // mcis status 가 없는 경우는 skip
      if (mcisStatusCountMap.has(mcisDispStatus)) {
        mcisStatusCountMap.set(
          mcisDispStatus,
          mcisStatusCountMap.get(mcisDispStatus) + 1
        );
      }
    }
  } catch (e) {
    console.log("mcis status error", e);
  }
  // console.log(mcisStatusCountMap);
  return mcisStatusCountMap;
}

function calculateVmStatusCount(aMcis) {
  // console.log("calculateVmStatusCount")
  // console.log(vmList)
  var sumVmCnt = 0;
  var vmStatusCountMap = new Map();
  vmStatusCountMap.set("running", 0);
  vmStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  vmStatusCountMap.set("terminate", 0);

  try {
    if (aMcis.statusCount) {
      console.log("statusCount part", aMcis);
      var statusCountObj = aMcis.statusCount;
      console.log(statusCountObj);
      var countCreating = statusCountObj.countCreating;
      var countFailed = statusCountObj.countFailed;
      var countRebooting = statusCountObj.countRebooting;
      var countResuming = statusCountObj.countResuming;
      var countRunning = statusCountObj.countRunning;
      var countSuspended = statusCountObj.countSuspended;
      var countSuspending = statusCountObj.countSuspending;
      var countTerminated = statusCountObj.countTerminated;
      var countTerminating = statusCountObj.countTerminating;
      var countTotal = statusCountObj.countTotal;
      var countUndefined = statusCountObj.countUndefined;
      
      var sumEtc =
        Number(countCreating) +
        Number(countFailed) +
        Number(countRebooting) +
        Number(countResuming) +
        Number(countSuspending) +
        Number(countTerminated) +
        Number(countTerminating) +
        Number(countUndefined);
      
      vmStatusCountMap.set("running", Number(countRunning));
      vmStatusCountMap.set("stop", Number(countSuspended)); // partial 도 stop으로 보고있음.
      vmStatusCountMap.set("terminate", sumEtc);
    } else if (aMcis.vm) {
      console.log("statusCount part list part");
      vmList = aMcis.vm;
      for (var vmIndex in vmList) {
        var aVm = vmList[vmIndex];
        var vmStatus = aVm.status;
        var vmDispStatus = getVmStatusDisp(vmStatus);

        if (vmStatus != "") {
          // vm status 가 없는 경우는 skip
          if (vmStatusCountMap.has(vmDispStatus)) {
            vmStatusCountMap.set(
              vmDispStatus,
              vmStatusCountMap.get(vmDispStatus) + 1
            );
          }
        }
      }
    }
  } catch (e) {
    console.log("mcis status error");
  }
  return vmStatusCountMap;
}

function displayMcisDashboard() {
  console.log("displayMcisDashboard");
  if (!isEmpty(totalMcisListObj) && totalMcisListObj.length > 0) {
    //totalMcisCnt = mcisList.length;
    var addMcis = "";
    for (var mcisIndex in totalMcisListObj) {
      var aMcis = totalMcisListObj[mcisIndex];
      console.log("aMcis.id 22: ", aMcis.id)
      if (aMcis.id != "") {
        addMcis += setMcisListTableRow(aMcis, mcisIndex);
      }
    } // end of mcis loop
    $("#mcisList").empty();
    $("#mcisList").append(addMcis);
    console.log("after add", addMcis)
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
    var mcisDispStatus = getMcisStatusDisp(mcisStatus);// 화면 표시용 status

    var vmStatusCountMap = totalVmStatusMap.get(aMcisData.id);
    var totalVmCountOfMcis = vmStatusCountMap.get('running') + vmStatusCountMap.get('stop') + vmStatusCountMap.get('terminate');

    // List of Mcis table
    try {

        // vm항목 미리 생성 후 mcis 생성할 때 붙임
        var addVm = "";
        var vmListOfMcis = aMcisData.vm;
        if (typeof vmListOfMcis !== 'undefined' && vmListOfMcis.length > 0) {
            for (var vmIndex in vmListOfMcis) {
                var aVm = vmListOfMcis[vmIndex];
                var vmDispStatus = getVmStatusDisp(aVm.status);
                var sumVmCountRunning = vmStatusCountMap.get("running")
                var sumVmCountStop = vmStatusCountMap.get("stop")
                var sumVmCountTerminate = vmStatusCountMap.get("terminate")
                var sumVmCount = sumVmCountRunning + sumVmCountStop + sumVmCountTerminate
                // connections
                var location = aVm.location;
                if (!isEmpty(location)) {
                    var vmLongitude = location.longitude;
                    var vmLatitude = location.latitude;

                }
    
     
    

    

                addVm += '<div class="shot bgbox_' + vmDispStatus + '">'
                addVm += '    <a href="javascript:void(0);"><span>' + (Number(vmIndex) + 1).toString() + '</span></a>'
                // for map : 원래는 vmId, Name등의 정보가 보여져야하나, mcis를 simple로 가져오면 해당 정보가 비어있어 화면상의 mcis이름 과 vm index를 보여주게 함
                // addVm += '        <input type="hidden" name="vmID" id="vmID_' + vmIndex + '" value="' + aVm.vmID + '"/>'
                // addVm += '        <input type="hidden" name="vmName" id="vmName_' + vmIndex + '" value="' + aVm.vmName + '"/>'
                addVm += '        <input type="hidden" name="mapPinIndex" id="mapPinIndex_' + mcisIndex + '_' + vmIndex + '" value="' + mcisIndex + '"/>'
                addVm += '        <input type="hidden" name="vmID" id="vmID_' + mcisIndex + '_' + vmIndex + '" value="' + aMcisData.name + '"/>'
                addVm += '        <input type="hidden" name="vmName" id="vmName_' + mcisIndex + '_' + vmIndex + '" value="' + (Number(vmIndex) + 1).toString() + '"/>'
                addVm += '        <input type="hidden" name="vmStatus" id="vmStatus_' + mcisIndex + '_' + vmIndex + '" value="' + vmDispStatus + '"/>'
                addVm += '        <input type="hidden" name="longitude" id="longitude_' + mcisIndex + '_' + vmIndex + '" value="' + location.longitude + '"/>'
                addVm += '        <input type="hidden" name="latitude" id="latitude_' + mcisIndex + '_' + vmIndex + '" value="' + location.latitude + '"/>'
                addVm += '</div>'
            }
        }

        // mcis
       
        mcisTableRow = "";
        mcisTableRow += '<div id=" '+mcisIndex+' "onclick="selectMcis(\'' + aMcisData.id + '\',\'' + aMcisData.name + '\',\'mcis_areabox_' + mcisIndex + '\', this)">'
        mcisTableRow += '   <div class="titlebox">'
        mcisTableRow += '       <div class="title">' + aMcisData.name + '</div>'
        mcisTableRow += '       <div class="txt"><span class="bgbox_b"></span>' + vmDispStatus + '</div>' 
        mcisTableRow += '   </div>'
        mcisTableRow += '  infra'
        mcisTableRow += '   <span class="badge bg-info-lt"><strong>' + totalVmCountOfMcis + '</strong></span>'
        mcisTableRow += '   <span class="line">(</span>'
        mcisTableRow += '   <span class="badge bg-info-lt"><strong>' + sumVmCountRunning + '</strong></span>'
        mcisTableRow += '   <span>/</span>'
        mcisTableRow += '   <span class="badge bg-red-lt"><strong>' + sumVmCountStop + '</strong></span>'
        mcisTableRow += '   <span>/</span>'
        mcisTableRow += '   <span class="badge bg-secondary-lt"><strong>' + sumVmCountTerminate + '</strong></span>'
        mcisTableRow += '   <span>)</span>'
        mcisTableRow += '            <div class="numinfo">'
        mcisTableRow += '                <div class="num">server ' + sumVmCount + '</div>'
        mcisTableRow += '            </div>'

        mcisTableRow += '            <div class="shotbox">'

        mcisTableRow += addVm;// 각 vm 의 항목들

        mcisTableRow += '            </div>'
        mcisTableRow += '</div>'
    


    } catch (e) {
        console.log("list of mcis error")
        console.log(e)

        mcisTableRow = '<tr>'
        mcisTableRow += '<td class="overlay hidden" data-th="" colspan="8">No Data</td>'
        mcisTableRow += '</tr>'
    }
    return mcisTableRow;
}




function getMcisStatusDisp(mcisFullStatus) {
  console.log("getMcisStatus " + mcisFullStatus);
  var statusArr = mcisFullStatus.split("-");
  var returnStatus = statusArr[0].toLowerCase();

  if (mcisFullStatus.toLowerCase().indexOf("running") > -1) {
    returnStatus = "running";
  } else if (mcisFullStatus.toLowerCase().indexOf("suspend") > -1) {
    returnStatus = "stop";
  } else if (mcisFullStatus.toLowerCase().indexOf("terminate") > -1) {
    returnStatus = "terminate";
    // TODO : partial도 있는데... 처리를 어떻게 하지??
  } else {
    returnStatus = "terminate";
  }
  console.log("after status " + returnStatus);
  return returnStatus;
}
function isEmpty(str) {
  if (typeof str == "undefined" || str == null || str == "") return true;
  else return false;
}

// MCIS List table의 1개 Row Update
function updateMcisListTableRow(aMcisData, mcisIndex) {

    var mcisStatus = aMcisData.status
    var mcisProviderNames = getProviderNamesOfMcis(aMcisData.id);//MCIS에 사용 된 provider
    var mcisDispStatus = getMcisStatusDisp(mcisStatus);// 화면 표시용 status

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


// 화면 표시
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



// VM 상태를 UI에서 표현하는 방식으로 변경
function getVmStatusDisp(vmFullStatus) {
	console.log("getVmStatusDisp " + vmFullStatus);
	var returnVmStatus = vmFullStatus.toLowerCase() // 소문자로 변환

	const VM_STATUS_RUNNING = "running"
	const VM_STATUS_STOPPED = "stop"
	const VM_STATUS_RESUMING = "resuming";
	const VM_STATUS_INCLUDE = "include"
	const VM_STATUS_SUSPENDED = "suspended"
	const VM_STATUS_TERMINATED = "terminated"
	const VM_STATUS_FAILED = "failed"

	if (returnVmStatus == VM_STATUS_RUNNING) {
		returnVmStatus = "running"
	} else if (returnVmStatus == VM_STATUS_TERMINATED) {
		returnVmStatus = "terminate"
	} else if (returnVmStatus == VM_STATUS_FAILED) {
		returnVmStatus = "terminate"
	} else {
		returnVmStatus = "stop"
	}
	return returnVmStatus
}

