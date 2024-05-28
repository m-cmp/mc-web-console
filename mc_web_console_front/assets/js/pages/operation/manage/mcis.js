import { TabulatorFull as Tabulator } from "tabulator-tables";


////
// 모달 콜백 예제
export function commoncallbac(val) {
  alert(val);
}

////

var table;
var checked_array = [];
var selectedMcis = "";

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
      //ajaxURL:"http://localhost:3000/operations/mcismng?option=status",
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
// Table 초기값 설정
function initTable() {
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
	  { title: "Id", field: "id", visible: false },
	  { title: "System Label", field: "systemLabel", visible: false },
	  { title: "Name", field: "name", vertAlign: "middle" },
	  {
		title: "Provider",
		field: "provider",
		formatter: providerFormatter,
		vertAlign: "middle",
		hozAlign: "center",
		headerSort: false,
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
  
	table = setTabulator("mcislist-table", tableObjParams, columns);
  
	table.on("rowClick", function (e, row) {
	  clickListOfMcis(row.getCell("id").getValue());
	});
  
	table.on("rowSelectionChanged", function (data, rows) {
	  checked_array = data;
	});
  
	displayColumn(table);
	//webconsolejs["util/pathfinder"].getCommonMcisList("mcismngready", "status", webconsolejs['mcismng/mcismng'].getMcisListCallbackSuccess)
  }
  function displayColumn(table) {
	$(".display-column").on("click", function () {
	  if ($(this).children("input:checkbox").is(":checked")) {
		$(this).children(".material-icons").text("visibility");
		table.showColumn($(this).data("column"));
	  } else {
		$(this).children(".material-icons").text("visibility_off");
		table.hideColumn($(this).data("column"));
	  }
	});
}
// 상태값을 table에서 표시하기 위해 감싸기
function statusFormatter(cell) {
  var mcisDispStatus = getMcisStatusDisp(
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
function providerFormatter(cell) {
	console.log("cell.getData().vm", cell.getData().vm)
	var vmCloudConnectionMap = webconsolejs["common/util"].calculateConnectionCount(
	  cell.getData().vm
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



// List Of MCIS 클릭 시
// mcis 테이블의 선택한 row 강조( on )
// 해당 MCIS의 VM 상태목록 보여주는 함수 호출
function clickListOfMcis(mcisID) {
	console.log("click view mcis id :", mcisID);
	if (mcisID != "") {
	  // MCIS Info 에 mcis id 표시
	  $("#mcis_id").val(mcisID);
	  $("#selected_mcis_id").val(mcisID);
	  // $("#selected_mcis_index").val(mcisIndex);
  
	  //클릭 시 mcisinfo로 포커스 이동
  
	  // webconsolejs["util/pathfinder"].getCommonMcisData(
	  //   "refreshmcisdata",
	  //   mcisID,
	  //   webconsolejs["mcismng/mcismng"].getCommonMcisDataCallbackSuccess
	  // );
  
	  var caller = "mcismng";
	  var actionName = "McisGet";
	  var optionParamMap = new Map();
	  optionParamMap.set("mcisId", mcisID)
	  webconsolejs['common/util'].getCommonData(caller, actionName, optionParamMap, getCommonMcisDataCallbackSuccess)
  
	  // MCIS Info area set
	  //showServerListAndStatusArea(mcisID,mcisIndex);
	  //displayMcisInfoArea(totalMcisListObj[mcisIndex]);
  
	  //makeMcisScript(index);// export를 위한 script 준비 -> Export 실행할 때 가져오는 것으로 변경( MCIS정보는 option=simple로 가져오므로)
	}
}

function getCommonMcisDataCallbackSuccess(caller, data, mcisID) {
    if (caller == "mcisexport") {

        var mcisIndex = 0;
        // console.log("mcisScriptExport start " + mcisID)
        // console.log(data);
        $("[id^='mcisID']").each(function () {
            if (mcisID == $(this).val()) {
                mcisIndex = $(this).attr("id").replace("mcisID", "")
                return false;
            }
        });
        //
        // var mcisNameVal = $("#m_mcisName_" + mcisIndex).val();
        var mcisCreateScript = JSON.stringify(data)
        console.log(mcisCreateScript)
        // $("#m_exportFileName_" + mcisIndex).val(mcisNameVal);
        // $("#m_mcisExportScript_" + mcisIndex).val(mcisCreateScript);
        $("#exportFileName").val(data.id);
        $("#exportScript").val(mcisCreateScript);

        saveToMcisAsJsonFile(mcisIndex);
    } else if (caller == "refreshmcisdata") {
        console.log(" gogo ")
        // var mcisID = $("#selected_mcis_id").val();
        // var mcisIndex = $("#selected_mcis_index").val();
        // console.log("setMcisData " + mcisIndex)
        // setMcisData(data, mcisIndex);
        // console.log("clock List of Mcis ")
        // clickListOfMcis(mcisID,mcisIndex);

        updateMcisData(data, mcisID);
    }
}











initTable();

var totalMcisListObj = new Object();
var totalMcisStatusMap = new Map();
var totalVmStatusMap = new Map();

document.addEventListener("DOMContentLoaded", life_cycle);

// async function life_cycle() {
//     const data ={
//         "request":{}
//     };
//     const response = await webconsolejs["common/api/http"].commonAPIPostNoToken('getmcislist', data)
//}

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
  console.log("total mcis : ", totalMcisListObj);
  table.setData(totalMcisListObj);
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
      if (aMcis.id != "") {
        addMcis += setMcisListTableRow(aMcis, mcisIndex);
      }
    } // end of mcis loop
    $("#mcisList").empty();
    $("#mcisList").append(addMcis);
  } else {
    var addMcis = "";
    addMcis += "<tr>";
    addMcis += '<td class="overlay hidden" data-th="" colspan="8">No Data</td>';
    addMcis += "</tr>";
    $("#mcisList").empty();
    $("#mcisList").append(addMcis);
  }
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

function setMcisListTableRow(aMcisData, mcisIndex) {
  var mcisTableRow = "";
  var mcisStatus = aMcisData.status;
  var mcisDispStatus = getMcisStatusDisp(mcisStatus); // 화면 표시용 status

  var vmStatusCountMap = totalVmStatusMap.get(aMcisData.id);
  var totalVmCountOfMcis =
    vmStatusCountMap.get("running") +
    vmStatusCountMap.get("stop") +
    vmStatusCountMap.get("terminate");

  // List of Mcis table
  try {
    // vm항목 미리 생성 후 mcis 생성할 때 붙임
    var addVm = "";
    var vmListOfMcis = aMcisData.vm;
    if (typeof vmListOfMcis !== "undefined" && vmListOfMcis.length > 0) {
      for (var vmIndex in vmListOfMcis) {
        var aVm = vmListOfMcis[vmIndex];
        var vmDispStatus = getVmStatusDisp(aVm.status);
        var sumVmCountRunning = vmStatusCountMap.get("running");
        var sumVmCountStop = vmStatusCountMap.get("stop");
        var sumVmCountTerminate = vmStatusCountMap.get("terminate");
        var sumVmCount =
          sumVmCountRunning + sumVmCountStop + sumVmCountTerminate;
        // connections
        var location = aVm.location;
        if (!isEmpty(location)) {
          var vmLongitude = location.longitude;
          var vmLatitude = location.latitude;
        }

        addVm += '<div class="shot bgbox_' + vmDispStatus + '">';
        addVm +=
          '    <a href="javascript:void(0);"><span>' +
          (Number(vmIndex) + 1).toString() +
          "</span></a>";
        // for map : 원래는 vmId, Name등의 정보가 보여져야하나, mcis를 simple로 가져오면 해당 정보가 비어있어 화면상의 mcis이름 과 vm index를 보여주게 함
        // addVm += '        <input type="hidden" name="vmID" id="vmID_' + vmIndex + '" value="' + aVm.vmID + '"/>'
        // addVm += '        <input type="hidden" name="vmName" id="vmName_' + vmIndex + '" value="' + aVm.vmName + '"/>'
        addVm +=
          '        <input type="hidden" name="mapPinIndex" id="mapPinIndex_' +
          mcisIndex +
          "_" +
          vmIndex +
          '" value="' +
          mcisIndex +
          '"/>';
        addVm +=
          '        <input type="hidden" name="vmID" id="vmID_' +
          mcisIndex +
          "_" +
          vmIndex +
          '" value="' +
          aMcisData.name +
          '"/>';
        addVm +=
          '        <input type="hidden" name="vmName" id="vmName_' +
          mcisIndex +
          "_" +
          vmIndex +
          '" value="' +
          (Number(vmIndex) + 1).toString() +
          '"/>';
        addVm +=
          '        <input type="hidden" name="vmStatus" id="vmStatus_' +
          mcisIndex +
          "_" +
          vmIndex +
          '" value="' +
          vmDispStatus +
          '"/>';
        addVm +=
          '        <input type="hidden" name="longitude" id="longitude_' +
          mcisIndex +
          "_" +
          vmIndex +
          '" value="' +
          location.longitude +
          '"/>';
        addVm +=
          '        <input type="hidden" name="latitude" id="latitude_' +
          mcisIndex +
          "_" +
          vmIndex +
          '" value="' +
          location.latitude +
          '"/>';
        addVm += "</div>";
      }
    }

    // mcis
    mcisTableRow +=
      '    <div class="areabox dbinfo cursor" id="mcis_areabox_' +
      mcisIndex +
      '" onclick="selectMcis(\'' +
      aMcisData.id +
      "','" +
      aMcisData.name +
      "','mcis_areabox_" +
      mcisIndex +
      "', this)\">";
    mcisTableRow += '        <div class="box">';
    mcisTableRow += '            <div class="top">';
    mcisTableRow += '                <div class="txtbox">';
    mcisTableRow +=
      '                    <div class="tit">' + aMcisData.name + "</div>";
    mcisTableRow +=
      '                    <div class="txt"><span class="bgbox_b"></span>Available 01</div>';
    mcisTableRow += "                </div>";

    mcisTableRow +=
      '                <div class="state color_' + mcisDispStatus + '"></div>';
    mcisTableRow += "            </div>";

    mcisTableRow += '            <div class="numbox">';
    mcisTableRow +=
      '                infra <strong class="color_b">' +
      totalVmCountOfMcis +
      "</strong>";
    mcisTableRow +=
      '                <span class="line">(</span> <span class="num color_b">' +
      sumVmCountRunning +
      "</span>";
    mcisTableRow +=
      '                <span class="line">/</span> <span class="num color_y">' +
      sumVmCountStop +
      "</span>";
    mcisTableRow +=
      '                <span class="line">/</span> <span class="num color_r">' +
      sumVmCountTerminate +
      "</span>";
    mcisTableRow += '                <span class="line">)</span>';
    mcisTableRow += "            </div>";

    // 이 항목은 크게 의미가 없는데??
    mcisTableRow += '            <div class="numinfo">';
    mcisTableRow +=
      '                <div class="num">server ' + sumVmCount + "</div>";
    mcisTableRow += "            </div>";

    mcisTableRow += '            <div class="shotbox">';

    mcisTableRow += addVm; // 각 vm 의 항목들

    mcisTableRow += "            </div>";

    mcisTableRow += "        </div>";
    mcisTableRow += "    </div>";
  } catch (e) {
    console.log("list of mcis error");
    console.log(e);

    mcisTableRow = "<tr>";
    mcisTableRow +=
      '<td class="overlay hidden" data-th="" colspan="8">No Data</td>';
    mcisTableRow += "</tr>";
  }
  return mcisTableRow;
}

// VM 상태를 UI에서 표현하는 방식으로 변경
function getVmStatusDisp(vmFullStatus) {
  console.log("getVmStatusDisp " + vmFullStatus);
  var returnVmStatus = vmFullStatus.toLowerCase(); // 소문자로 변환

  const VM_STATUS_RUNNING = "running";
  const VM_STATUS_STOPPED = "stop";
  const VM_STATUS_RESUMING = "resuming";
  const VM_STATUS_INCLUDE = "include";
  const VM_STATUS_SUSPENDED = "suspended";
  const VM_STATUS_TERMINATED = "terminated";
  const VM_STATUS_FAILED = "failed";

  if (returnVmStatus == VM_STATUS_RUNNING) {
    returnVmStatus = "running";
  } else if (returnVmStatus == VM_STATUS_TERMINATED) {
    returnVmStatus = "terminate";
  } else if (returnVmStatus == VM_STATUS_FAILED) {
    returnVmStatus = "terminate";
  } else {
    returnVmStatus = "stop";
  }
  return returnVmStatus;
}

// MCIS List table의 1개 Row Update
function updateMcisListTableRow(aMcisData, mcisIndex) {

    var mcisStatus = aMcisData.status
    var mcisProviderNames = getProviderNamesOfMcis(aMcisData.id);//MCIS에 사용 된 provider
    var mcisDispStatus = getMcisStatusDisp(mcisStatus);// 화면 표시용 status

	var row = table.getRow(mcisIndex);
	
	if(row){
		row.update({status: mcisStatus});
	}

}

/////////////////////////////////////////////////////////////////////////////////////////////////
// changeLifeCycle -> callMcisLifeCycle -> util.callMcisLifeCycle -> callbackMcisLifeCycle 순으로 호출 됨
// LifeCycle

function changeLifeCycle(type) {
  var checked_nothing = 0;
  var mcisIndex = 0;
  var isMcks = false;
  $("[id^='td_ch_']").each(function () {

      if ($(this).is(":checked")) {
          checked_nothing++;
          aMcisData = totalMcisListObj[mcisIndex];
          console.log("aMcisDataaMcisDataaMcisDataaMcisData", aMcisData);
          var systemLabel = aMcisData.systemLabel;
          if (systemLabel) {
              systemLabel = systemLabel.toLowerCase();
              if (systemLabel.indexOf("mcks") > -1) {
                  isMcks = true;
                  return false;
              }
          }
      } else {
          console.log("checked nothing")
      }
      mcisIndex++;
  })
  if (isMcks) {
      commonAlert("MCKS life cycle cannot be changed");
      return;
  }

  console.log("checked_nothing " + checked_nothing)
  if (checked_nothing == 0) {
      commonAlert("Please Select MCIS!!")
      return;
  }
  commonConfirmOpen(type);
}

function callMcisLifeCycle(type) { // 'reboot'
  var checked_nothing = 0;
  $("[id^='td_ch_']").each(function () {

      if ($(this).is(":checked")) {
          checked_nothing++;
          console.log("checked")
          var mcisID = $(this).val();
          mcisLifeCycle(mcisID, type);
      } else {
          console.log("checked nothing")

      }
  })
  if (checked_nothing == 0) {
      commonAlert("Please Select MCIS!!")
      return;
  }
}

// confirm modal창에서 ok버튼 클릭시 수행할 method 지정
function commonConfirmOk() {
  //modalArea
  var targetAction = $('#confirmOkAction').val();
  var caller = $('#confirmCaller').val();
  if (targetAction == "Logout") {
      // Logout처리하고 index화면으로 간다. Logout ==> cookie expire
      // location.href="/logout"
      var targetUrl = "/logout"
      changePage(targetUrl)

  } else if (targetAction == "MoveToConnection") {
      var targetUrl = "/setting/connections/cloudconnectionconfig/mngform"
      changePage(targetUrl)
  } else if (targetAction == "ChangeConnection") { // recommendvm에서 다른 connection 선택 시
      changeCloudConnection()
  } else if (targetAction == "DeleteCloudConnection") {
      deleteCloudConnection();
  } else if (targetAction == "Config") {
      //id="Config"
      console.log("commonConfirmOk " + targetAction);
  } else if (targetAction == "SDK") {
      //id="SDK"
      console.log("commonConfirmOk " + targetAction);
  } else if (targetAction == "DeleteCredential") {
      deleteCredential();
  } else if (targetAction == "DeleteDriver") {
      deleteDriver();
  } else if (targetAction == "DeleteRegion") {
      deleteRegion();

  } else if (targetAction == "Credential") {
      //id="Credential"
      console.log("commonConfirmOk " + targetAction);
  } else if (targetAction == "Region") {
      //id="Region"
      console.log("commonConfirmOk " + targetAction);
  } else if (targetAction == "Provider") {
      //id="Provider"
      console.log("commonConfirmOk " + targetAction);
  } else if (targetAction == "required") {//-- IdPassRequired
      console.log("commonConfirmOk " + targetAction);
  } else if (targetAction == "idpwLost") {//-- 
      console.log("commonConfirmOk " + targetAction);
  } else if (targetAction == "ManageNS") {//-- ManageNS
      var targetUrl = "/setting/namespaces/namespace/mngform"
      changePage(targetUrl)
  } else if (targetAction == "NewNS") {//-- NewNS
      var targetUrl = "/setting/namespaces/namespace/mngform"
      changePage(targetUrl)
  } else if (targetAction == "ChangeNameSpace") {//-- ChangeNameSpace
      var changeNameSpaceID = $("#tempSelectedNameSpaceID").val();
      setDefaultNameSpace(changeNameSpaceID)
  } else if (targetAction == "AddNewNameSpace") {//-- AddNewNameSpace
      displayNameSpaceInfo("REG")
      goFocus('ns_reg');// 해당 영역으로 scroll
  } else if (targetAction == "DeleteNameSpace") {
      deleteNameSpace()
  } else if (targetAction == "AddNewVpc") {
      displayVNetInfo("REG")
      goFocus('vnetCreateBox');
  } else if (targetAction == "DeleteVpc") {
      deleteVPC()
  } else if (targetAction == "AddNewSecurityGroup") {
      displaySecurityGroupInfo("REG")
      goFocus('securityGroupCreateBox');
  } else if (targetAction == "DeleteSecurityGroup") {
      deleteSecurityGroup()
  } else if (targetAction == "AddNewSshKey") {
      displaySshKeyInfo("REG")
      goFocus('sshKeyCreateBox');
  } else if (targetAction == "DeleteSshKey") {
      deleteSshKey()
  } else if (targetAction == "AddNewVirtualMachineImage") {
      displayVirtualMachineImageInfo("REG")
      goFocus('virtualMachineImageCreateBox');
  } else if (targetAction == "DeleteVirtualMachineImage") {
      deleteVirtualMachineImage()
  } else if (targetAction == "FetchImages") {
      getCommonFetchImages();
  } else if (targetAction == "AddNewVmSpec") {
      displayVmSpecInfo("REG")
      goFocus('vmSpecCreateBox');
  } else if (targetAction == "ExportVmScriptOfMcis") {
      vmScriptExport();
  } else if (targetAction == "DeleteVmSpec") {
      deleteVmSpec();
  } else if (targetAction == "FetchSpecs") {
      var connectionName = $("#regConnectionName").val();
      putFetchSpecs(connectionName);
  } else if (targetAction == "GotoMonitoringPerformance") {
      // alert("모니터링으로 이동 GotoMonitoringPerformance")
      // location.href ="";//../operation/Monitoring_Mcis.html
      var targetUrl = "/operation/monitorings/mcismng/mngform"
      changePage(targetUrl)
  } else if (targetAction == "GotoMonitoringFault") {
      // alert("모니터링으로 이동 GotoMonitoringFault")
      // location.href ="";//../operation/Monitoring_Mcis.html
      var targetUrl = "/operation/monitorings/mcismng/mngform"
      changePage(targetUrl)
  } else if (targetAction == "GotoMonitoringCost") {
      // alert("모니터링으로 이동 GotoMonitoringCost")
      // location.href ="";//../operation/Monitoring_Mcis.html
      var targetUrl = "/operation/monitorings/mcismng/mngform"
      changePage(targetUrl)
  } else if (targetAction == "GotoMonitoringUtilize") {
      // alert("모니터링으로 이동 GotoMonitoringUtilize")
      // location.href ="";//../operation/Monitoring_Mcis.html    
      var targetUrl = "/operation/monitorings/mcismng/mngform"
      changePage(targetUrl)
  } else if (targetAction == "McisLifeCycleReboot") {
      callMcisLifeCycle('reboot')
  } else if (targetAction == "McisLifeCycleSuspend") {
      callMcisLifeCycle('suspend')
  } else if (targetAction == "McisLifeCycleResume") {
      callMcisLifeCycle('resume')
  } else if (targetAction == "McisLifeCycleTerminate") {
      callMcisLifeCycle('terminate')
  } else if (targetAction == "McisManagement") {
      alert("수행할 function 정의되지 않음");
  } else if (targetAction == "MoveToMcisManagementFromDashboard") {
      var mcisID = $("#mcis_id").val();
      var targetUrl = "/operation/manages/mcismng/mngform?mcisid=" + mcisID;
      changePage(targetUrl)
  } else if (targetAction == "MoveToMcisManagement") {
      var targetUrl = "/operation/manages/mcismng/mngform";
      changePage(targetUrl)
  } else if (targetAction == "AddNewMcis") {
      // $('#loadingContainer').show();
      // location.href ="/operation/manages/mcis/regform/";
      var targetUrl = "/operation/manages/mcismng/regform";
      changePage(targetUrl)
  } else if (targetAction == "DeleteMcis") {
      deleteMCIS();
  } else if (targetAction == "DeployServer") {
      btn_deploy();
  } else if (targetAction == "ImportScriptOfMcis") {
      mcisScriptImport();
  } else if (targetAction == "ExportScriptOfMcis") {
      mcisScriptExport();
  } else if (targetAction == "ShowMonitoring") {
      var mcisID = $("#mcis_id").val();
      var targetUrl = "/operation/monitorings/mcismonitoring/mngform?mcisId=" + mcisID;
      changePage(targetUrl)
  } else if (targetAction == "VmLifeCycle") {
      alert("수행할 function 정의되지 않음");
  } else if (targetAction == "VmLifeCycleReboot") {
      vmLifeCycle('reboot')
  } else if (targetAction == "VmLifeCycleSuspend") {
      vmLifeCycle('suspend')
  } else if (targetAction == "VmLifeCycleResume") {
      vmLifeCycle('resume')
  } else if (targetAction == "VmLifeCycleTerminate") {
      vmLifeCycle('terminate')
  } else if (targetAction == "VmManagement") {
      alert("수행할 function 정의되지 않음");
  } else if (targetAction == "AddNewVm") {
      addNewVirtualMachine()
  } else if (targetAction == "AddNewVmOfMcis") {
      addNewVirtualMachine()
  } else if (targetAction == "ExportVmScriptOfMcis") {
      vmScriptExport();
  } else if (targetAction == "--") {
      addNewVirtualMachine()
  } else if (targetAction == "monitoringConfigPolicyConfig") {
      regMonitoringConfigPolicy()
  } else if (targetAction == "DifferentConnection") {
      setAndClearByDifferentConnectionName(caller);
  } else if (targetAction == "DifferentConnectionAtSecurityGroup") {
      uncheckDifferentConnectionAtSecurityGroup();
  } else if (targetAction == "DifferentConnectionAtAssistPopup") {
      // connection이 다른데도 set 한다고 하면 이전에 설정한 값들을 초기화 한 후 set한다.
      applyAssistValues(caller);
  } else if (targetAction == "AddMonitoringAlertPolicy") {
      addMonitoringAlertPolicy();
  } else if (targetAction == "DeleteMonitoringAlertPolicy") {
      deleteMonitoringAlertPolicy();
  } else if (targetAction == "AddNewMcks") {
      var targetUrl = "/operation/manages/mcksmng/regform";
      changePage(targetUrl)
  } else if (targetAction == "AddNewNodeOfMcks") {
      addNewNode();
  } else if (targetAction == "DeleteNodeOfMcks") {
      deleteNodeOfMcks();
  } else if (targetAction == "AddMonitoringAlertEventHandler") {
      addMonitoringAlertEventHandler();
  } else if (targetAction == "deleteMonitoringAlertEventHandler") {
      deleteMonitoringAlertEventHandler();
  } else if (targetAction == "DeleteMcks") {
      deleteMCKS();
  } else if (targetAction == "RegisterRecommendSpec") {
      commonPromptOpen("RegisterRecommendSpec")
  } else if (targetAction == "AddNewMcisDynamic") {
      createMcisDynamic()
  } else if (targetAction == "DeleteDataDisk") {
      deleteDataDisk();

  } else if (targetAction == "DeleteMyImage") {
      deleteMyImageDisk();

  } else if (targetAction == "CreateSnapshot") {
      commonPromptOk
      createSnapshot();

  } else if (targetAction == "DeleteNlb") {
      deleteNlb();
  } else if (targetAction == "AddNewPmks") {
      changePage("PmksClusterRegForm");
  } else if (targetAction == "DeletePmks") {
      deleteCluster();
  } else if (targetAction == "AddNewNodeGroupOfPmks") {
      changePage("PmksNodeGroupRegForm");
  } else if (targetAction == "DeleteNodeGroupOfPmks") {
      deleteNodeGroupOfPmks();
  } else {
      alert("수행할 function 정의되지 않음 " + targetAction);
  }
  console.log("commonConfirmOk " + targetAction);
  commonConfirmClose();
}

// McisLifeCycle을 호출 한 뒤 return값 처리
function callbackMcisLifeCycle(resultStatus, resultData, type) {
  var message = "MCIS " + type + " complete!."
  if (resultStatus == 200 || resultStatus == 201) {
    // commonAlert(message);
    console.log("callbackMcisLifeCycle" + message);
    commonResultAlert(message);
    //location.reload();//완료 후 페이지를 reload -> 해당 mcis만 reload

    // 해당 mcis 조회
    // 상태 count 재설정
  } else {
      commonAlert("MCIS " + type + " failed!");
  }
}

// confirm modal창 보이기 modal창이 열릴 때 해당 창의 text 지정, close될 때 action 지정
export function commonConfirmOpen(targetAction, caller) {
  console.log("commonConfirmOpen : " + targetAction)

  //  [ id , 문구]
  let confirmModalTextMap = new Map(
      [
          ["CreateSnapshot", "Would you like to Create Snapshot?"],
          ["DeleteDataDisk", "Would you like to Delete Disk?"],
          ["DeleteMyImage", "Would you like to Delete MyImage?"],
          ["Logout", "Would you like to logout?"],
          ["Config", "Would you like to set Cloud config ?"],
          ["SDK", "Would you like to set Cloud Driver SDK ?"],
          ["Credential", "Would you like to set Credential ?"],
          ["Region", "Would you like to set Region ?"],
          ["Provider", "Would you like to set Cloud Provider ?"],

          ["MoveToConnection", "Would you like to set Cloud config ?"],
          ["ChangeConnection", "Would you like to change Cloud connection ?"],
          ["DeleteCloudConnection", "Would you like to delete <br /> the Cloud connection? "],

          ["DeleteCredential", "Would you like to delete <br /> the Credential? "],
          ["DeleteDriver", "Would you like to delete <br /> the Driver? "],
          ["DeleteRegion", "Would you like to delete <br /> the Region? "],


          // ["IdPassRequired", "ID/Password required !"],    --. 이거는 confirm이 아니잖아
          ["idpwLost", "Illegal account / password 다시 입력 하시겠습니까?"],
          ["ManageNS", "Would you like to manage <br />Name Space?"],
          ["NewNS", "Would you like to add a new Name Space?"],
          ["AddNewNameSpace", "Would you like to register NameSpace <br />Resource ?"],
          ["NameSpace", "Would you like to move <br />selected NameSpace?"],
          ["ChangeNameSpace", "Would you like to move <br />selected NameSpace?"],
          ["DeleteNameSpace", "Would you like to delete <br />selected NameSpace?"],

          ["AddNewVpc", "Would you like to create a new Network <br />Resource ?"],
          ["DeleteVpc", "Are you sure to delete this Network <br />Resource ?"],

          ["AddNewSecurityGroup", "Would you like to create a new Security <br />Resource ?"],
          ["DeleteSecurityGroup", "Would you like to delete Security <br />Resource ?"],

          ["AddNewSshKey", "Would you like to create a new SSH key <br />Resource ?"],
          ["DeleteSshKey", "Would you like to delete SSH key <br />Resource ?"],

          ["AddNewVirtualMachineImage", "Would you like to register Image <br />Resource ?"],
          ["DeleteVirtualMachineImage", "Would you like to un-register Image <br />Resource ?"],
          ["FetchImages", "Would you like to fetch images <br /> to this NameSpace ?"],

          ["AddNewVmSpec", "Would you like to register Spec <br />Resource ?"],
          ["DeleteVmSpec", "Would you like to un-register Spec <br />Resource ?"],
          ["FetchSpecs", "Would you like to fetch Spec <br /> to this NameSpace ?"],

          ["GotoMonitoringPerformance", "Would you like to view performance <br />for MCIS ?"],
          ["GotoMonitoringFault", "Would you like to view fault <br />for MCIS ?"],
          ["GotoMonitoringCost", "Would you like to view cost <br />for MCIS ?"],
          ["GotoMonitoringUtilize", "Would you like to view utilize <br />for MCIS ?"],

          ["McisLifeCycleReboot", "Would you like to reboot MCIS ?"],// mcis_life_cycle('reboot')
          ["McisLifeCycleSuspend", "Would you like to suspend MCIS ?"],//onclick="mcis_life_cycle('suspend')
          ["McisLifeCycleResume", "Would you like to resume MCIS ?"],//onclick="mcis_life_cycle('resume')"
          ["McisLifeCycleTerminate", "Would you like to terminate MCIS ?"],//onclick="mcis_life_cycle('terminate')
          ["McisManagement", "Would you like to manage MCIS ?"],// 해당 function 없음...
          ["MoveToMcisManagement", "Would you like to manage MCIS ?"],
          ["MoveToMcisManagementFromDashboard", "Would you like to manage MCIS ?"],

          ["AddNewMcis", "Would you like to create MCIS ?"],
          ["AddNewMcisDynamic", "Would you like to create MCIS ?"],
          ["DeleteMcis", "Are you sure to delete this MCIS? "],
          ["ImportScriptOfMcis", "Would you like to import MCIS script? "],
          ["ExportScriptOfMcis", "Would you like to export MCIS script? "],
          ["ShowMonitoring", "Would you like to go to the Monitoring page?"],

          ["AddNewVmOfMcis", "Would you like to add a new VM to this MCIS ?"],
          ["DeployServer", "Would you like to deploy?"],

          ["VmLifeCycle", "Would you like to view Server ?"],
          ["VmLifeCycleReboot", "Would you like to reboot VM ?"], //onclick="vm_life_cycle('reboot')"
          ["VmLifeCycleSuspend", "Would you like to suspend VM ?"], // onclick="vm_life_cycle('suspend')"
          ["VmLifeCycleResume", "Would you like to resume VM ?"], // onclick="vm_life_cycle('resume')"
          ["VmLifeCycleTerminate", "Would you like to terminate VM ?"], // onclick="vm_life_cycle('terminate')"
          ["VmManagement", "Would you like to manage VM ?"], // 해당 function 없음
          ["AddNewVm", "Would you like to add VM ?"], //onclick="vm_add()"
          ["ExportVmScriptOfMcis", "Would you like to export VM script ?"], //onclick="vm_add()"


          ["DifferentConnection", "Do you want to set different connectionName?"],
          ["DifferentConnectionAtSecurityGroup", "Do you want to set different connectionName?"],
          ["DifferentConnectionAtAssistPopup", "Do you want to set different connectionName?"],

          ["AddMonitoringAlertPolicy", "Would you like to register Threshold ?"],
          ["DeleteMonitoringAlertPolicy", "Are you sure to delete this Threshold ?"],
          ["AddNewMcks", "Would you like to create MCKS ?"],
          ["DeleteMcks", "Are you sure to delete this MCKS? "],
          ["AddNewNodeOfMcks", "Would you like to add a new Node to this MCKS ?"],
          ["DeleteNodeOfMcks", "Would you like to delete a Node of this MCKS ?"],


          ["AddMonitoringAlertEventHandler", "Would you like to add<br />Monitoring Alert Event-Handler ?"],
          ["deleteMonitoringAlertEventHandler", "Are you sure to delete<br />this Monitoring Alert Event-Handler?"],

          ["RegisterRecommendSpec", "현재 해당 connection에서 사용가능한 spec 이 없습니다. 등록 하시겠습니까?"],

          ["DeleteNlb", "Would you like to delete NLB ?"],

          ["AddNewPmks", "Would you like to create PMKS ?"],
          ["DeletePmks", "Are you sure to delete this PMKS? "],
          ["AddNewNodeGroupOfPmks", "Would you like to add a new NodeGroup to this PMKS ?"],
          ["DeleteNodeGroupOfPmks", "Would you like to delete a NodeGroup of this PMKS ?"],
      ]
  );
  console.log(confirmModalTextMap.get(targetAction));
  try {
      // $('#modalText').text(targetText);// text아니면 html로 해볼까? 태그있는 문구가 있어서
      //$('#modalText').text(confirmModalTextMap.get(targetAction));
      $('#confirmText').html(confirmModalTextMap.get(targetAction));
      $('#confirmOkAction').val(targetAction);
      console.log("caller : ", caller);
      $('#confirmCaller').val(caller);

      if (targetAction == "Region") {
          // button에 target 지정
          // data-target="#Add_Region_Register"
          // TODO : confirm 으로 물어본 뒤 OK버튼 클릭 시 targetDIV 지정하도록
      }
      // bootstrap('#confirmArea').modal({


//      });
      var myModal = new bootstrap.Modal(document.getElementById('#confirmArea'));
      myModal.show();
      document.getElementById('show-modal-button').addEventListener('click', showModal);
  } catch (e) {
      console.log(e);
      alert(e);
  }
}

// MCIS 제어 : 선택한 MCIS내 vm들의 상태 변경 
// Dashboard 와 MCIS Manage 에서 같이 쓰므로
// callAAA -> mcisLifeCycle 호출 -> callBackAAA로 결과값전달
function mcisLifeCycle(mcisID, type) {
  const data = {
    pathParams: {
      nsId: "testns01",
      mcisId: mcisID,
    },
    queryParams: {
      "action":type
  }
  };
  //var controller = "targetController=getmcislist"
  var controller = "/api/" + "controllifecycle";  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  var message = response.responseData.message;
  var status = response.status
  var namespaceID = $('#topboxDefaultNameSpaceID').val();
  callbackMcisLifeCycle(status, data, type)
  axios.post(url, {
      headers: {},
      namespaceID: namespaceID,
      mcisID: mcisID,
      queryParams: ["action=" + type, "force=false"]
  }).then(result => {
      console.log("mcisLifeCycle result : ", result);
      var status = result.status
      var data = result.data
      callbackMcisLifeCycle(status, data, type)
      // console.log("life cycle result : ",result)
      // console.log("result Message : ",data.message)
      // if(status == 200 || status == 201){

      //     alert(message);
      //     location.reload();
      //     //show_mcis(mcis_url,"");
      // }else{
      //     alert(status)
      //     return;
      // }
      // }).catch(function(error){
      //     // console.log(" display error : ",error);
      //     console.log(error.response.data);
      //     console.log(error.response.status);
      //     // console.log(error.response.headers); 
      //     var status = error.response.status;
      //     var data =  error.response.data

      //     callbackMcisLifeCycle(status, data, type)
      // });
  }).catch((error) => {
      console.warn(error);
      console.log(error.response)
      // var errorMessage = error.response.data.error;
      // commonErrorAlert(statusCode, errorMessage) 
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      commonErrorAlert(statusCode, errorMessage);
  });
}