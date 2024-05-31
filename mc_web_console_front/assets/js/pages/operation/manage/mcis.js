import { TabulatorFull as Tabulator } from "tabulator-tables";

////
// 모달 콜백 예제
export function commoncallbac(val) {
  alert(val);
}
////

////////// TABULATOR //////////
var table;
var checked_array = [];
initTable();
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
    {
      title: "Id",
      field: "id",
      visible: false
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
      vertAlign: "middle",
      hozAlign: "center",
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

  //  선택된 여러개 row에 대해 처리

  // table.on("rowSelectionChanged", function (data, rows) {
  //   checked_array = data;
  //   console.log("checked_array", checked_array)
  //   console.log("rowsrows", rows)
  //   // console.log(providerFormatterString());
  // });

  displayColumn(table);
 
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
function providerFormatter(data) {
  console.log("datadata", data)
  console.log("cell.getData().vm", data.getData().vm)
  var vmCloudConnectionMap = webconsolejs["common/util"].calculateConnectionCount(
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

function providerFormatterString(data) {
  
  var vmCloudConnectionMap = webconsolejs["common/util"].calculateConnectionCount(
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

//Tabulator Filter
//Define variables for input elements
var fieldEl = document.getElementById("filter-field");
var typeEl = document.getElementById("filter-type");
var valueEl = document.getElementById("filter-value");

// provider filtering
// provider는 equal일 때만
function providerFilter(data) {

  // case type like, equal, not eual
  // like only
  if (typeEl.value == "=") {
    var vmCloudConnectionMap = webconsolejs["common/util"].calculateConnectionCount(
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

//Trigger setFilter function with correct parameters
function updateFilter() {
  var filterVal = fieldEl.options[fieldEl.selectedIndex].value;
  var typeVal = typeEl.options[typeEl.selectedIndex].value;
  // filter-field =="provider"
  // provider string

  var filter = filterVal == "provider" ? providerFilter : filterVal;

  if (filterVal == "provider") {
    typeEl.value = "=";
    typeEl.disabled = true;
  }else{
    typeEl.disabled = false; 
  }

  if (filterVal) {
    table.setFilter(filter, typeVal, valueEl.value);
  }
}

//Update filters on value change
document.getElementById("filter-field").addEventListener("change", updateFilter);
document.getElementById("filter-type").addEventListener("change", updateFilter);
document.getElementById("filter-value").addEventListener("keyup", updateFilter);

//Clear filters on "Clear Filters" button click
document.getElementById("filter-clear").addEventListener("click", function () {
  fieldEl.value = "";
  typeEl.value = "=";
  valueEl.value = "";

  table.clearFilter();

});
// filter end

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

    // MCIS Info 
    //webconsolejs['common/util'].getCommonData(caller, actionName, optionParamMap, getCommonMcisDataCallbackSuccess)

    // MCIS Info area set
    //showServerListAndStatusArea(mcisID,mcisIndex);
    //displayMcisInfoArea(totalMcisListObj[mcisIndex]);

    //makeMcisScript(index);// export를 위한 script 준비 -> Export 실행할 때 가져오는 것으로 변경( MCIS정보는 option=simple로 가져오므로)
  }
}
////////////////////////////////////////////////////// END TABULATOR ///////////////////////////////////////////////////

// function getCommonMcisDataCallbackSuccess(caller, data, mcisID) {
//   if (caller == "mcisexport") {

//     var mcisIndex = 0;
//     // console.log("mcisScriptExport start " + mcisID)
//     // console.log(data);
//     $("[id^='mcisID']").each(function () {
//       if (mcisID == $(this).val()) {
//         mcisIndex = $(this).attr("id").replace("mcisID", "")
//         return false;
//       }
//     });
//     //
//     // var mcisNameVal = $("#m_mcisName_" + mcisIndex).val();
//     var mcisCreateScript = JSON.stringify(data)
//     console.log(mcisCreateScript)
//     // $("#m_exportFileName_" + mcisIndex).val(mcisNameVal);
//     // $("#m_mcisExportScript_" + mcisIndex).val(mcisCreateScript);
//     $("#exportFileName").val(data.id);
//     $("#exportScript").val(mcisCreateScript);

//     saveToMcisAsJsonFile(mcisIndex);
//   } else if (caller == "refreshmcisdata") {
//     console.log(" gogo ")
//     // var mcisID = $("#selected_mcis_id").val();
//     // var mcisIndex = $("#selected_mcis_index").val();
//     // console.log("setMcisData " + mcisIndex)
//     // setMcisData(data, mcisIndex);
//     // console.log("clock List of Mcis ")
//     // clickListOfMcis(mcisID,mcisIndex);

//     updateMcisData(data, mcisID);
//   }
// }

var totalMcisListObj = new Object();
var totalMcisStatusMap = new Map();
var totalVmStatusMap = new Map();

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

// Mcis 목록에서 vmStatus만 처리 : 화면표시는 display function에서
function setTotalVmStatus() {
  console.log("setTotalVmstatus")
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

function calculateVmStatusCount(aMcis) {
  console.log("calculateVmStatusCount")
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

// function displayMcisDashboard() {
//   console.log("displayMcisDashboard");
//   if (!isEmpty(totalMcisListObj) && totalMcisListObj.length > 0) {
//     //totalMcisCnt = mcisList.length;
//     var addMcis = "";
//     for (var mcisIndex in totalMcisListObj) {
//       var aMcis = totalMcisListObj[mcisIndex];
//       if (aMcis.id != "") {
//         addMcis += setMcisListTableRow(aMcis, mcisIndex);
//       }
//     } // end of mcis loop
//     $("#mcisList").empty();
//     $("#mcisList").append(addMcis);
//   } else {
//     var addMcis = "";
//     addMcis += "<tr>";
//     addMcis += '<td class="overlay hidden" data-th="" colspan="8">No Data</td>';
//     addMcis += "</tr>";
//     $("#mcisList").empty();
//     $("#mcisList").append(addMcis);
//   }
// }

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


// // 화면 표시
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

export function mcisLifeCycle(type) {
  /*
  {
    "mcisID":mcis01,
    "type":reboot
  }
  */
  for (const mcis of checked_array) {
    console.log(mcis.id)
    let data = {
      pathParams: {
        nsId: "testns01",
        mcisId: mcis.id,
      },
      queryParams: {
        "action": type
      }
    };
    let controller = "/api/" + "controllifecycle";
    let response = webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    );
    console.log(response)
  }
  // var message = response.responseData.message;
  // var status = response.status
  // var namespaceID = $('#topboxDefaultNameSpaceID').val();
  // callbackMcisLifeCycle(status, data, type)
  // axios.post(url, {
  //     headers: {},
  //     namespaceID: namespaceID,
  //     mcisID: mcisID,
  //     queryParams: ["action=" + type, "force=false"]
  // }).then(result => {
  //     console.log("mcisLifeCycle result : ", result);
  //     var status = result.status
  //     var data = result.data
  //     callbackMcisLifeCycle(status, data, type)
  //     // console.log("life cycle result : ",result)
  //     // console.log("result Message : ",data.message)
  //     // if(status == 200 || status == 201){

  //     //     alert(message);
  //     //     location.reload();
  //     //     //show_mcis(mcis_url,"");
  //     // }else{
  //     //     alert(status)
  //     //     return;
  //     // }
  //     // }).catch(function(error){
  //     //     // console.log(" display error : ",error);
  //     //     console.log(error.response.data);
  //     //     console.log(error.response.status);
  //     //     // console.log(error.response.headers); 
  //     //     var status = error.response.status;
  //     //     var data =  error.response.data

  //     //     callbackMcisLifeCycle(status, data, type)
  //     // });
  // }).catch((error) => {
  //     console.warn(error);
  //     console.log(error.response)
  //     // var errorMessage = error.response.data.error;
  //     // commonErrorAlert(statusCode, errorMessage) 
  //     var errorMessage = error.response.data.error;
  //     var statusCode = error.response.status;
  //     commonErrorAlert(statusCode, errorMessage);
  // });
}
// function isEmpty(str) {
//   if (typeof str == "undefined" || str == null || str == "") return true;
//   else return false;
// }

// function setMcisListTableRow(aMcisData, mcisIndex) {
//   var mcisTableRow = "";
//   var mcisStatus = aMcisData.status;
//   var mcisDispStatus = getMcisStatusDisp(mcisStatus); // 화면 표시용 status

//   var vmStatusCountMap = totalVmStatusMap.get(aMcisData.id);
//   var totalVmCountOfMcis =
//     vmStatusCountMap.get("running") +
//     vmStatusCountMap.get("stop") +
//     vmStatusCountMap.get("terminate");

//   // List of Mcis table
//   try {
//     // vm항목 미리 생성 후 mcis 생성할 때 붙임
//     var addVm = "";
//     var vmListOfMcis = aMcisData.vm;
//     if (typeof vmListOfMcis !== "undefined" && vmListOfMcis.length > 0) {
//       for (var vmIndex in vmListOfMcis) {
//         var aVm = vmListOfMcis[vmIndex];
//         var vmDispStatus = getVmStatusDisp(aVm.status);
//         var sumVmCountRunning = vmStatusCountMap.get("running");
//         var sumVmCountStop = vmStatusCountMap.get("stop");
//         var sumVmCountTerminate = vmStatusCountMap.get("terminate");
//         var sumVmCount =
//           sumVmCountRunning + sumVmCountStop + sumVmCountTerminate;
//         // connections
//         var location = aVm.location;
//         if (!isEmpty(location)) {
//           var vmLongitude = location.longitude;
//           var vmLatitude = location.latitude;
//         }

//         addVm += '<div class="shot bgbox_' + vmDispStatus + '">';
//         addVm +=
//           '    <a href="javascript:void(0);"><span>' +
//           (Number(vmIndex) + 1).toString() +
//           "</span></a>";
//         // for map : 원래는 vmId, Name등의 정보가 보여져야하나, mcis를 simple로 가져오면 해당 정보가 비어있어 화면상의 mcis이름 과 vm index를 보여주게 함
//         // addVm += '        <input type="hidden" name="vmID" id="vmID_' + vmIndex + '" value="' + aVm.vmID + '"/>'
//         // addVm += '        <input type="hidden" name="vmName" id="vmName_' + vmIndex + '" value="' + aVm.vmName + '"/>'
//         addVm +=
//           '        <input type="hidden" name="mapPinIndex" id="mapPinIndex_' +
//           mcisIndex +
//           "_" +
//           vmIndex +
//           '" value="' +
//           mcisIndex +
//           '"/>';
//         addVm +=
//           '        <input type="hidden" name="vmID" id="vmID_' +
//           mcisIndex +
//           "_" +
//           vmIndex +
//           '" value="' +
//           aMcisData.name +
//           '"/>';
//         addVm +=
//           '        <input type="hidden" name="vmName" id="vmName_' +
//           mcisIndex +
//           "_" +
//           vmIndex +
//           '" value="' +
//           (Number(vmIndex) + 1).toString() +
//           '"/>';
//         addVm +=
//           '        <input type="hidden" name="vmStatus" id="vmStatus_' +
//           mcisIndex +
//           "_" +
//           vmIndex +
//           '" value="' +
//           vmDispStatus +
//           '"/>';
//         addVm +=
//           '        <input type="hidden" name="longitude" id="longitude_' +
//           mcisIndex +
//           "_" +
//           vmIndex +
//           '" value="' +
//           location.longitude +
//           '"/>';
//         addVm +=
//           '        <input type="hidden" name="latitude" id="latitude_' +
//           mcisIndex +
//           "_" +
//           vmIndex +
//           '" value="' +
//           location.latitude +
//           '"/>';
//         addVm += "</div>";
//       }
//     }

//     // mcis
//     mcisTableRow +=
//       '    <div class="areabox dbinfo cursor" id="mcis_areabox_' +
//       mcisIndex +
//       '" onclick="selectMcis(\'' +
//       aMcisData.id +
//       "','" +
//       aMcisData.name +
//       "','mcis_areabox_" +
//       mcisIndex +
//       "', this)\">";
//     mcisTableRow += '        <div class="box">';
//     mcisTableRow += '            <div class="top">';
//     mcisTableRow += '                <div class="txtbox">';
//     mcisTableRow +=
//       '                    <div class="tit">' + aMcisData.name + "</div>";
//     mcisTableRow +=
//       '                    <div class="txt"><span class="bgbox_b"></span>Available 01</div>';
//     mcisTableRow += "                </div>";

//     mcisTableRow +=
//       '                <div class="state color_' + mcisDispStatus + '"></div>';
//     mcisTableRow += "            </div>";

//     mcisTableRow += '            <div class="numbox">';
//     mcisTableRow +=
//       '                infra <strong class="color_b">' +
//       totalVmCountOfMcis +
//       "</strong>";
//     mcisTableRow +=
//       '                <span class="line">(</span> <span class="num color_b">' +
//       sumVmCountRunning +
//       "</span>";
//     mcisTableRow +=
//       '                <span class="line">/</span> <span class="num color_y">' +
//       sumVmCountStop +
//       "</span>";
//     mcisTableRow +=
//       '                <span class="line">/</span> <span class="num color_r">' +
//       sumVmCountTerminate +
//       "</span>";
//     mcisTableRow += '                <span class="line">)</span>';
//     mcisTableRow += "            </div>";

//     // 이 항목은 크게 의미가 없는데??
//     mcisTableRow += '            <div class="numinfo">';
//     mcisTableRow +=
//       '                <div class="num">server ' + sumVmCount + "</div>";
//     mcisTableRow += "            </div>";

//     mcisTableRow += '            <div class="shotbox">';

//     mcisTableRow += addVm; // 각 vm 의 항목들

//     mcisTableRow += "            </div>";

//     mcisTableRow += "        </div>";
//     mcisTableRow += "    </div>";
//   } catch (e) {
//     console.log("list of mcis error");
//     console.log(e);

//     mcisTableRow = "<tr>";
//     mcisTableRow +=
//       '<td class="overlay hidden" data-th="" colspan="8">No Data</td>';
//     mcisTableRow += "</tr>";
//   }
//   return mcisTableRow;
// }

// VM 상태를 UI에서 표현하는 방식으로 변경
// function getVmStatusDisp(vmFullStatus) {
//   console.log("getVmStatusDisp " + vmFullStatus);
//   var returnVmStatus = vmFullStatus.toLowerCase(); // 소문자로 변환

//   const VM_STATUS_RUNNING = "running";
//   const VM_STATUS_STOPPED = "stop";
//   const VM_STATUS_RESUMING = "resuming";
//   const VM_STATUS_INCLUDE = "include";
//   const VM_STATUS_SUSPENDED = "suspended";
//   const VM_STATUS_TERMINATED = "terminated";
//   const VM_STATUS_FAILED = "failed";

//   if (returnVmStatus == VM_STATUS_RUNNING) {
//     returnVmStatus = "running";
//   } else if (returnVmStatus == VM_STATUS_TERMINATED) {
//     returnVmStatus = "terminate";
//   } else if (returnVmStatus == VM_STATUS_FAILED) {
//     returnVmStatus = "terminate";
//   } else {
//     returnVmStatus = "stop";
//   }
//   return returnVmStatus;
// }

/////////////////////////////////////////////////////////////////////////////////////////////////
// changeLifeCycle -> callMcisLifeCycle -> util.callMcisLifeCycle -> callbackMcisLifeCycle 순으로 호출 됨
// LifeCycle


// MCIS 제어 : 선택한 MCIS내 vm들의 상태 변경 
// Dashboard 와 MCIS Manage 에서 같이 쓰므로
// callAAA -> mcisLifeCycle 호출 -> callBackAAA로 결과값전달
