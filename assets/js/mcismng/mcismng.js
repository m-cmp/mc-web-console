import { client } from "/assets/js/util/util";
var selectedMcis = ""; // 선택 된 mcisId :// 다른 화면 등에서 mcisID를 넘겨주는 경우 사용
var table;
var checked_array = [];
$(function () {
  // 상세 Tab 선택시 tab=monitoring일 때 monitoring 조회
  $('[data-toggle="tab"]').on("click", function (e) {
    var target = $(e.target).attr("href"); // activated tab
    if (target == "#McisMonitoring") {
      var selectedMcisID = $("#selected_mcis_id").val();
      var selectedVmID = $("#selected_vm_id").val();
      showVmMonitoring(selectedMcisID, selectedVmID);
    } else if (target == "#McisConnection") {
      // 지도 표시
      var pointInfo = new Object();
      pointInfo.id = "1";
      pointInfo.name = $("#server_connection_view_region").val();
      pointInfo.cloudType = $("#server_connection_view_csp").val(); //
      pointInfo.latitude = $("#server_location_latitude").val(); //
      pointInfo.longitude = $("#server_location_longitude").val(); //
      pointInfo.markerIndex = 1;
      setMap(pointInfo);
    }
  });

  $(".btn_datadisk_assist").on("click", function (e) {
    displayAttachDisk();
  });

  initTable();

  // mcis 상태 조회
  var optionParamMap = new Map();
  optionParamMap.set("option", "status");
  mcpjs["util/pathfinder"].getCommonData(
    "mcismngready",
    "McisList",
    optionParamMap,
    mcpjs["mcismng/mcismng"].getMcisListCallbackSuccess
  );
});

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

  table = mcpjs["util/util"].setTabulator("mcisList", tableObjParams, columns);

  table.on("rowClick", function (e, row) {
    clickListOfMcis(row.getCell("id").getValue());
  });

  table.on("rowSelectionChanged", function (data, rows) {
    checked_array = data;
  });

  mcpjs["util/util"].displayColumn(table);
  //mcpjs["util/pathfinder"].getCommonMcisList("mcismngready", "status", mcpjs['mcismng/mcismng'].getMcisListCallbackSuccess)
}
// 상태값을 table에서 표시하기 위해 감싸기
function statusFormatter(cell) {
  var mcisDispStatus = mcpjs["util/common"].getMcisStatusDisp(
    cell.getData().status
  ); // 화면 표시용 status
  var mcisStatusCell =
    '<img title="' +
    cell.getData().status +
    '" src="/assets/images/contents/icon_' +
    mcisDispStatus +
    '.png" class="icon" alt="">';

  return mcisStatusCell;
}

// provider를 table에서 표시하기 위해 감싸기
function providerFormatter(cell) {
  var vmCloudConnectionMap = mcpjs["util/util"].calculateConnectionCount(
    cell.getData().vm
  );
  var mcisProviderCell = "";
  vmCloudConnectionMap.forEach((value, key) => {
    mcisProviderCell +=
      '<img class="provider_icon" src="/assets/images/contents/img_logo_' +
      key +
      '.png" alt="' +
      key +
      '"/>';
  });

  return mcisProviderCell;
}

export function mcisTotalListExport() {
  var namespace = $("#topboxDefaultNameSpaceName").text();
  table.download("csv", namespace.toUpperCase() + "-MCIS.csv", {
    delimiter: ",",
  });
}

// server info 영역 보이기/숨기기
function showServerInfoArea() {
  // $status = $(".detail_box")// mcis의 server 목록
  // var $detail = $(".server_info");// server 상세정보  -> 여기에서는 바로 보여줄 필요 없는데....
  // // mcis list table에 선택한 mcis tr을 active, 다른 것들은 active 제거
  // $sel_list.addClass("active");
  // $sel_list.siblings().removeClass("active");
  //
  // // server info
  // $status.addClass("view");
  // $sel_list.off("click").click(function () {
  //     if ($(this).hasClass("active")) {
  //         $sel_list.removeClass("active");
  //         $detail.removeClass("active");
  //         $status.removeClass("view");
  //     } else {
  //         $sel_list.addClass("active");
  //         $sel_list.siblings().removeClass("active");
  //         // $detail.addClass("active");
  //         // $detail.siblings().removeClass("active");
  //         $status.addClass("view");
  //     }
  // });
}

var TotalCloudConnectionList = new Array();
////////// 화면 Load 시 가져온 값들을 set하는 function들

// MCIS 목록 조회 후 화면에 Set
export function getMcisListCallbackSuccess(caller, result) {
  //export function getMcisListCallbackSuccess(caller, mcisList) {
  console.log("getMcisListCallbackSuccess");
  console.log(result);
  if (result.data.McisList == null) {
    return;
  }
  //totalMcisListObj = mcisList;
  totalMcisListObj = result.data.McisList;

  console.log("total mcis:", totalMcisListObj);
  setToTalMcisStatus(); // mcis상태 표시 를 위해 필요
  setTotalVmStatus(); // mcis 의 vm들 상태표시 를 위해 필요
  setTotalConnection(); // Mcis의 provider별 connection 표시를 위해 필요

  //table.setData(mcisList)
  table.setData(totalMcisListObj);
  // console.log("caller = " + caller)
  if (caller == "mcismngready") {
    var selectedMcisID = $("#selected_mcis_id").val();
    console.log(" selectedMcisID for filter " + selectedMcisID);
  }
}

// 조회 실패시. : TODO : 실패시 no data 표시
export function getMcisListCallbackFail(caller, error) {
  // List table에 no data 표시? 또는 조회 오류를 표시?
  var addMcis = "";
  addMcis += "<tr>";
  addMcis += '<td class="overlay hidden" data-th="" colspan="8">No Data</td>';
  addMcis += "</tr>";
  $("#mcisList").empty();
  $("#mcisList").append(addMcis);
}

function setMcisData(mcisInfo, mcisIndex) {
  var mcisStatus = mcisInfo.status;
  var mcisTargetStatus = mcisInfo.targetStatus;
  var mcisTargetAction = mcisInfo.targetAction;
  var mcisProviderNames = ""; //MCIS에 사용 된 provider
  var totalVmCountOfMcis = 0; //MCIS의 VM 갯 수
  var mcisDispStatus = mcpjs["util/common"].getMcisStatusDisp(mcisStatus); // 화면 표시용 status
  var mcisStatusImg = "/assets/images/contents/icon_" + mcisDispStatus + ".png";

  var totalServerCnt = 0;
  var totalVmStatusCountMap = new Map();
  totalVmStatusCountMap.set("running", 0);
  totalVmStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  totalVmStatusCountMap.set("terminate", 0);

  var vmListOfMcis = mcisInfo.vm; // array

  var vmStatusCountMap = new Map();
  vmStatusCountMap.set("running", 0);
  vmStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  vmStatusCountMap.set("terminate", 0);

  var vmCloudConnectionMap = new Map();
  console.log(vmListOfMcis);
  if (typeof vmListOfMcis !== "undefined" && vmListOfMcis.length > 0) {
    for (var vmIndex in vmListOfMcis) {
      var aVm = vmListOfMcis[vmIndex];
      var vmDispStatus = mcpjs["util/common"].getVmStatusDisp(aVm.status);
      totalVmCountOfMcis++;
      console.log(vmDispStatus);
      if (vmStatusCountMap.has(vmDispStatus)) {
        vmStatusCountMap.set(
          vmDispStatus,
          vmStatusCountMap.get(vmDispStatus) + 1
        ); // mcis내 count
        totalVmStatusCountMap.set(
          vmDispStatus,
          totalVmStatusCountMap.get(vmDispStatus) + 1
        ); // 전체 count
      }
      totalServerCnt++;

      // connections
      var location = aVm.location;
      if (!isEmpty(location)) {
        var cloudType = location.cloudType;
        if (vmCloudConnectionMap.has(cloudType)) {
          vmCloudConnectionMap.set(
            cloudType,
            vmCloudConnectionMap.get(cloudType) + 1
          );
        } else {
          vmCloudConnectionMap.set(cloudType, 0);
        }
      }
    }
  } // end of vm list

  vmCloudConnectionMap.forEach((value, key) => {
    mcisProviderNames += key + " ";
  });
  console.log("mcisProviderNames=" + mcisProviderNames);
  // table
  $("#mcisInfo_mcisStatus_icon_" + mcisIndex).attr("src", mcisStatusImg);
  $("#mcisInfo_mcisName_" + mcisIndex).text(mcisInfo.name);
  $("#mcisInfo_mcisProviderNames_" + mcisIndex).text(mcisProviderNames);
  $("#mcisInfo_totalVmCountOfMcis_" + mcisIndex).text(totalVmCountOfMcis);

  $("#mcisInfo_vmstatus_running_" + mcisIndex + "_" + vmIndex).text(
    vmStatusCountMap.get("running")
  );
  $("#mcisInfo_vmstatus_stop_" + mcisIndex + "_" + vmIndex).text(
    vmStatusCountMap.get("stop")
  );
  $("#mcisInfo_vmstatus_terminate_" + mcisIndex + "_" + vmIndex).text(
    vmStatusCountMap.get("terminate")
  );

  $("#mcisInfo_mcisDescription_" + mcisIndex).text(mcisInfo.description);

  $("#mcisID" + mcisIndex).text(mcisInfo.id);
  $("#mcisName" + mcisIndex).text(mcisInfo.name);
  $("#mcisStatus" + mcisIndex).text(mcisStatus);
  $("#mcisTargetStatus" + mcisIndex).text(mcisTargetStatus);
  $("#mcisTargetAction" + mcisIndex).text(mcisTargetAction);
  $("#mcisDescription" + mcisIndex).text(mcisInfo.description);
  $("#mcisCloudConnections" + mcisIndex).text(mcisProviderNames);
  $("#mcisVmTotalCount" + mcisIndex).text(totalServerCnt);
  console.log("all set " + mcisStatusImg);

  setMcisServerInfoBox(mcisIndex, vmIndex);
}
///////////// MCIS Handling //////////////

// 등록 form으로 이동
function createNewMcis() {
  // Manage_MCIS_Life_Cycle_popup.html
  var targetUrl = "McisReg";
  mcpjs["util/util"].changePage(targetUrl);
}
// lifeCycleAction :: changeLifeCycle('McisLifeCycleReboot') ...
export function changeLifeCycle(lifeCycleAction) {
  if (checked_array.length > 1) {
    mcpjs["util/util"].commonAlert("Please Select One MCIS at a time");
    return;
  }

  if (checked_array.length == 0) {
    mcpjs["util/util"].commonAlert("Please Select MCIS!!");
    return;
  }

  if (checked_array[0].systemLabel.indexOf("mcks") > -1) {
    mcpjs["util/util"].commonAlert("MCKS life cycle cannot be changed");
    return;
  }

  mcpjs["util/util"].commonConfirmOpen(lifeCycleAction);
}
// MCIS 제어 : 선택한 VM의 상태 변경
// changeLifeCycle -> callMcisLifeCycle -> util.callMcisLifeCycle -> callbackMcisLifeCycle 순으로 호출 됨
export function callMcisLifeCycle(action) {
  var namespaceId = $('#topboxDefaultNameSpaceID').val();

  var selectedRows = table.getSelectedRows();
  if (selectedRows.length == 0) {
    mcpjs["util/util"].commonAlert("Please Select MCIS!!");
    return;
  }

  selectedRows.forEach(function (row) {
    var systemLabel = row.getCell("systemLabel").getValue();
    var name = row.getCell("name").getValue();
    if (systemLabel == "mcks") {
      mcpjs["util/util"].commonAlert(name + " MCKS can not change lifeCycle!!");
      return;
    }
  });

  selectedRows.forEach(function (row) {
    var optionParamMap = new Map();
    var mcisId = row.getCell("id").getValue();

    var obj = {
      namespaceID: namespaceId,
      McisID: mcisId,
      Action: action,
      Force: "false",
    };
    false;

    var caller = "mcismng";
    var controllerKeyName = "McisLifeCycle";
    var optionParamMap = new Map();
    mcpjs["util/pathfinder"].postCommonData(
      caller,
      controllerKeyName,
      optionParamMap,
      obj,
      mcpjs["mcismng/mcismng"].mcisLifeCycleCallbackSuccess
    );
  });
}

// TODO : changePage 호출하도록 변경할 것 mcpjs["util/util"].changePage(targetUrl);
export function goSchedule() {
  if (checked_array.length == 0) {
    mcpjs["util/util"].commonAlert("Please Select MCIS!!");
    return;
  }
  var mcisId = checked_array[0].id;
  var mcisName = checked_array[0].name;
  var targetUrl = "/operations/scheduling/mngform/id/";
  targetUrl += mcisId;
  targetUrl += "/name/" + mcisName;
  console.log("shedule path : ", targetUrl);
  location.href = targetUrl;
}

// McisLifeCycle을 호출 한 뒤 return값 처리
export function mcisLifeCycleCallbackSuccess(caller, result) {
  var action = result.data.action;
  var message = "MCIS " + action + " requested!";
  if (result.status == 200 || result.status == 201) {
    console.log("callbackMcisLifeCycle" + message);
    mcpjs["util/util"].commonResultAlert(message);

    // 해당 mcis 조회
    // 상태 count 재설정
  } else {
    mcpjs["util/util"].commonAlert("MCIS " + action + " failed!");
  }
} // mcis삭제 전 mcks 포함여부 체크

export function deleteCheckMCIS(type) {
  var isMcks = false;
  checked_array.forEach((mcis) => {
    if (mcis.systemLabel.indexOf("mcks") > -1) {
      isMcks = true;
    }
  });

  if (isMcks) {
    mcpjs["util/util"].commonAlert("MCKS cannot be deleted");
    return;
  }
  mcpjs["util/util"].commonConfirmOpen(type);
}
// list에 선택된 MCIS 제거. 1개씩
export function deleteMCIS() {
  var mcisID = checked_array[0].id;
  var csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute("content");

  if (checked_array.length == 0) {
    mcpjs["util/util"].commonAlert("Please Select MCIS!!");
    return;
  } else if (checked_array.length > 1) {
    mcpjs["util/util"].commonAlert("Please Select One MCIS at a time");
    return;
  }

  var controllerKeyName = "McisDel";
  var optionParamMap = new Map();
  optionParamMap.set("{mcisId}", mcisID);
  optionParamMap.set("option", "force");
  var obj = {}
  mcpjs["util/pathfinder"].deleteCommonData("mcismng", controllerKeyName, optionParamMap, obj, mcpjs["mcismng/mcismng"].mcisDelCallbackSuccess );
  //mcpjs["util/pathfinder"].deleteCommonData("mcismng", controllerKeyName, optionParamMap, mcpjs["mcismng/mcismng"].mcisDelCallbackSuccess );
  // var url = "/operations/mcismng/id/" + mcisID + "?option=force";
  // client
  //   .delete(url, {
  //     headers: {
  //       "Content-Type": "application/json",
  //       "x-csrf-token": csrfToken,
  //     },
  //   })
  //   .then((result) => {
  //     console.log("get  Data : ", result.data);

  //     var statusCode = result.data.status;
  //     var message = result.data.message;

  //     if (statusCode != 200 && statusCode != 201) {
  //       mcpjs["util/util"].commonAlert(message + "(" + statusCode + ")");
  //       return;
  //     } else {
  //       // mcpjs['util/util'].commonAlert(message);
  //       // TODO : MCIS List 조회
  //       // location.reload();
  //       mcpjs["util/util"].commonResultAlert(message);
  //     }
  //   })
  //   .catch((error) => {
  //     console.warn(error);
  //     console.log(error.response);
  //     var errorMessage = error.response.statusText;
  //     var statusCode = error.response.status;
  //     mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
  //   });
}

export function mcisDelCallbackSuccess(caller, result){
  console.log(result);
  var statusCode = result.data.status;
  var message = result.data.message;

  if (statusCode != 200 && statusCode != 201) {
    mcpjs["util/util"].commonAlert(message + "(" + statusCode + ")");
    return;
  } else {
    // TODO : MCIS List 조회
    // location.reload();
    mcpjs["util/util"].commonResultAlert(message);
  }
}
////////////// MCIS Handling end ////////////////

////////////// VM Handling ///////////
export function addNewVirtualMachine() {
  var mcisID = $("#mcis_id").val();
  var mcisName = $("#mcis_name").val();

  //console.log(mcis_id + " : " + mcis_name)
  //location.href = "/operations/mcismng/regform/" + mcisID + "/" + mcisName;

  var targetUrl = "McisVmRegForm"
  var optionParamMap = new Map();
  optionParamMap.set("{mcisId}", mcisID);
  optionParamMap.set("{mcisName}", mcisName);
  mcpjs["util/util"].changePage(targetUrl, optionParamMap);
}

export function vmLifeCycle(type) {
  var mcisID = $("#mcis_id").val();
  var vmID = $("#vm_id").val();
  //var mcisID = $("#selected_mcis_id").val();
  //var vmID = $("#selected_vm_id").val();
  var vmName = $("#vm_name").val();

  // MCIS에서 MCKS관련 리소스는 handling하지 않음.
  var aMcis = new Object();
  var isMcks = false;
  for (var mcisIndex in totalMcisListObj) {
    var tempMcis = totalMcisListObj[mcisIndex];
    if (mcisID == tempMcis.id) {
      aMcis = tempMcis;
      var systemLabel = tempMcis.systemLabel;
      if (systemLabel) {
        systemLabel = systemLabel.toLowerCase();
        if (systemLabel.indexOf("mcks")) {
          // mcpjs['util/util'].commonAlert("MCKS life cycle cannot be changed")
          // return;
          isMcks = true;
          break;
        }
      }
    }
  } // end of mcis loop

  // var checked =""
  // $("[id^='td_ch_'").each(function(){
  //     if($(this).is(":checked")){
  //         var checked_value = $(this).val();
  //         console.log("checked value : ",checked_value)
  //     }else{
  //         console.log("체크된게 없어!!")
  //     }
  // })
  // return;
  if (!mcisID) {
    mcpjs["util/util"].commonAlert("Please Select MCIS!!");
    return;
  }
  if (!vmID) {
    mcpjs["util/util"].commonAlert("Please Select VM!!");
    return;
  }
  if (isMcks) {
  }

  // var nameSpace = NAMESPACE;
  console.log("Start LifeCycle method!!!");

  //var url = "/operations/mcismng/proc/vmlifecycle";
  //console.log("life cycle3 url : ", url);

  // var message = vmName + " " + type + " requested!.";
  var obj = {
    McisID: mcisID,
    VmID: vmID,
    Action: type,
    //LifeCycleType: type,
  };

  var controllerKeyName = "McisVmLifeCycle";
  var optionParamMap = new Map();
  mcpjs["util/pathfinder"].postCommonData(
    "mciscreate",
    controllerKeyName,
    optionParamMap,
    obj,
    mcpjs["mcismng/mcismng"].mcisVmLifeCycleCallbackSuccess
  );

  // client.post(url, obj, {

  // }).then(result => {
  //     var status = result.status

  //     console.log("life cycle result : ", result)
  //     var data = result.data
  //     console.log("result Message : ", data.message)
  //     if (status == 200 || status == 201) {
  //         mcpjs['util/util'].commonResultAlert(message);
  //         // mcpjs['util/util'].commonAlert(message);
  //         // location.reload();// TODO 일단은 Reaoad : 해당 영역(MCIS의 VM들 status 조회)를 refresh할 수 있는 기능 필요
  //         //show_mcis(mcis_url,"");
  //     }
  // })
}

// lifeCycle 변경 callback
export function mcisVmLifeCycleCallbackSuccess(caller, result) {
  var status = result.status;

  console.log("life cycle result : ", result);
  var data = result.data;
  var message = data.message;
  console.log("result Message : ", message);
  if (status == 200 || status == 201) {
    mcpjs["util/util"].commonResultAlert(message);
    // location.reload();// TODO 일단은 Reaoad : 해당 영역(MCIS의 VM들 status 조회)를 refresh할 수 있는 기능 필요
  }
}

///////////// VM Handling end ///////////

const config_arr = new Array();

// refresh : mcis 및 vm정보조회
// 각 mcis 별 vmstatus 목록

// List Of MCIS 클릭 시
// mcis 테이블의 선택한 row 강조( on )
// 해당 MCIS의 VM 상태목록 보여주는 함수 호출
export function clickListOfMcis(mcisID) {
  console.log("click view mcis id :", mcisID);
  if (mcisID != "") {
    // MCIS Info 에 mcis id 표시
    $("#mcis_id").val(mcisID);
    $("#selected_mcis_id").val(mcisID);
    // $("#selected_mcis_index").val(mcisIndex);

    //클릭 시 mcisinfo로 포커스 이동

    // mcpjs["util/pathfinder"].getCommonMcisData(
    //   "refreshmcisdata",
    //   mcisID,
    //   mcpjs["mcismng/mcismng"].getCommonMcisDataCallbackSuccess
    // );

    var caller = "mcismng";
    var actionName = "McisGet";
    var optionParamMap = new Map();
    optionParamMap.set("mcisId", mcisID)
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['mcismng/mcismng'].getCommonMcisDataCallbackSuccess)

    // MCIS Info area set
    //showServerListAndStatusArea(mcisID,mcisIndex);
    //displayMcisInfoArea(totalMcisListObj[mcisIndex]);

    //makeMcisScript(index);// export를 위한 script 준비 -> Export 실행할 때 가져오는 것으로 변경( MCIS정보는 option=simple로 가져오므로)
  }
}

const mcisInfoDataList = new Array(); // test_arr : mcisInfo 1개 전체, pageLoad될 때, refresh 할때 data를 set. mcis클릭시 상세내용 보여주기용 조회

// MCIS Info area 안의 Server List / Status 내용 표시
// 해당 MCIS의 모든 VM 표시
// TODO : 클릭했을 때 서버에서 조회하는것으로 변경할 것.
function showServerListAndStatusArea(mcis_id, mcisIndex) {
  var mcisID = $("#mcisID" + mcisIndex).val();
  var mcisName = $("#mcisName" + mcisIndex).val();
  var mcisDescription = $("#mcisDescription" + mcisIndex).val();
  var mcisStatus = $("#mcisStatus" + mcisIndex).val();
  var mcisTargetStatus = $("#mcisTargetStatus" + mcisIndex).val();
  var mcisTargetAction = $("#mcisTargetAction" + mcisIndex).val();
  var mcisDispStatus = mcpjs["util/common"].getMcisStatusDisp(mcisStatus);
  var mcisCloudConnections = $("#mcisCloudConnections" + mcisIndex).val();
  var vmTotalCountOfMcis = $("#mcisVmTotalCount" + mcisIndex).val();
  var vms = $("#mcisVmStatusList" + mcisIndex).val();

  $("#mcis_info_txt").text("[ " + mcisName + " ]");
  $("#mcis_server_info_status").empty();
  $("#mcis_server_info_status").append(
    '<strong>Server List / Status</strong>  <span class="stxt">[ ' +
      mcisName +
      " ]</span>  Server(" +
      vmTotalCountOfMcis +
      ")"
  );

  //
  $("#mcis_info_name").val(mcisName + " / " + mcisID);
  $("#mcis_info_id").val(mcisID);
  $("#mcis_info_description").val(mcisDescription);
  $("#mcis_info_targetStatus").val(mcisTargetStatus);
  $("#mcis_info_targetAction").val(mcisTargetAction);
  $("#mcis_info_cloud_connection").val(mcisCloudConnections); //

  $("#mcis_name").val(mcisName);

  var mcis_badge = "";
  var mcisStatusIcon = getMcisStatusIcon(mcisDispStatus);
  // var mcisStatusIcon = "";
  // if(mcisDispStatus == "running"){ mcisStatusIcon = "icon_running_db.png"
  // }else if(mcisDispStatus == "include" ){ mcisStatusIcon = "icon_stop_db.png"
  // }else if(mcisDispStatus == "suspended"){mcisStatusIcon = "icon_stop_db.png"
  // }else if(mcisDispStatus == "terminate"){mcisStatusIcon = "icon_terminate_db.png"
  // }else{
  //     mcisStatusIcon = "icon_stop_db.png"
  // }

  // server info
  mcis_badge =
    '<img src="/assets/images/contents/' + mcisStatusIcon + '" alt=""/> ';
  $("#service_status_icon").empty();
  $("#service_status_icon").append(mcis_badge);

  setMcisServerInfoBox(mcisIndex, -1);
  // var vm_badge = "";
  // $("[id^='mcisVmID_']").each(function(){
  //     var mcisVm = $(this).attr("id").split("_")
  //     thisMcisIndex = mcisVm[1]
  //     vmIndexOfMcis = mcisVm[2]
  //
  //     if( thisMcisIndex == mcisIndex){
  //
  //         var vmID = $("#mcisVmID_" + mcisIndex + "_" + vmIndexOfMcis).val();
  //         var vmName = $("#mcisVmName_" + mcisIndex + "_" + vmIndexOfMcis).val();
  //         var vmStatus = $("#mcisVmStatus_" + mcisIndex + "_" + vmIndexOfMcis).val();
  //         vmStatus = vmStatus.toLowerCase();
  //         var vmDispStatus = getVmStatusDisp(vmStatus);
  //         var vmStatusIcon ="bgbox_g";
  //         if(vmDispStatus == "running"){
  //             vmStatusIcon ="bgbox_b"
  //         }else if(vmDispStatus == "include" ){
  //             vmStatusIcon ="bgbox_g"
  //         }else if(vmDispStatus == "suspended"){
  //             vmStatusIcon ="bgbox_g"
  //         }else if(vmDispStatus == "terminated"){
  //             vmStatusIcon ="bgbox_r"
  //         }else{
  //             vmStatusIcon ="bgbox_r"
  //         }
  //         vm_badge += '<li class="sel_cr ' + vmStatusIcon + '"><a href="javascript:void(0);" onclick="mcpjs[\'mcismng/mcismng\'].vmDetailInfo(\''+mcisID+'\',\''+mcisName+'\',\''+vmID+'\')"><span class="txt">'+vmName+'</span></a></li>';
  //     }
  // });
  // // console.log(vm_badge);
  // $("#mcis_server_info_box").empty();
  // $("#mcis_server_info_box").append(vm_badge);

  // var sta = mcisStatus;
  // var sl = sta.split("-");
  // var status = sl[0].toLowerCase()
  // var vm_badge = "";

  // var vmList = vms.split("@") // vm목록은 @
  // console.log("vmList " + vmList);
  // // for(var x in vmList){
  // for( var x= 0; x < vmList.length; x++){
  //     var vmInfo = vmList[x].split("|") // 이름과 상태는 "|"로 구분
  //     console.log("x " + x);
  //     console.log("vmInfo " + vmInfo);

  //     vmID = vmInfo[0];
  //     vmName = vmInfo[1];

  //     vmStatus = vmInfo[1].toLowerCase();

  //     var vmStatusIcon ="bgbox_g";

  //     if(vmStatus == "running"){
  //         vmStatusIcon ="bgbox_b"
  //     }else if(vmStatus == "include" ){
  //         vmStatusIcon ="bgbox_g"
  //         // vm_badge += '<li class="sel_cr bgbox_g"><a href="javascript:void(0);" onclick="click_view_vm(\''+mcisID+'\',\''+vmID+'\')"><span class="txt">'+vmName+'</span></a></li>';
  //     }else if(vmStatus == "suspended"){
  //         vmStatusIcon ="bgbox_g"
  //         // vm_badge += '<li class="sel_cr bgbox_g"><a href="javascript:void(0);" onclick="click_view_vm(\''+mcisID+'\',\''+vmID+'\')"><span class="txt">'+vmName+'</span></a></li>';

  //     }else if(vmStatus == "terminated"){
  //         vmStatusIcon ="bgbox_r"
  //         // vm_badge += '<li class="sel_cr bgbox_r"><a href="javascript:void(0);" onclick="click_view_vm(\''+mcisID+'\',\''+vmID+'\')"><span class="txt">'+vmName+'</span></a></li>';

  //     }else{
  //         vmStatusIcon ="bgbox_g"
  //         // vm_badge += '<li class="sel_cr bgbox_g"><a href="javascript:void(0);" onclick="click_view_vm(\''+mcisID+'\',\''+vmID+'\')"><span class="txt">'+vmName+'</span></a></li>';
  //     }
  //     vm_badge += '<li class="sel_cr ' + vmStatusIcon + '"><a href="javascript:void(0);" onclick="mcpjs[\'mcismng/mcismng\'].vmDetailInfo(\''+mcisID+'\',\''+mcisName+'\',\''+vmID+'\')"><span class="txt">'+vmName+'</span></a></li>';
  //     //console.log(vm_badge);
  //     $("#mcis_server_info_box").empty();
  //     $("#mcis_server_info_box").append(vm_badge);
  // }

  //Manage MCIS Server List on/off : table을 클릭하면 해당 Row 에 active style로 보여주기
}

// 현재 mcisIndex와 선택한 vm의 index(미선택은 -1)
function setMcisServerInfoBox(mcisIndex, vmIndex) {
  console.log(" mcisIndex=" + mcisIndex + ", vmIndex=" + vmIndex);
  if (Number(vmIndex) == -1) {
    var mcisID = $("#mcisID" + mcisIndex).val();
    var mcisName = $("#mcisName" + mcisIndex).val();
    var vm_badge = "";
    $("[id^='mcisVmID_']").each(function () {
      var mcisVm = $(this).attr("id").split("_");
      thisMcisIndex = mcisVm[1];
      vmIndexOfMcis = mcisVm[2];

      if (thisMcisIndex == mcisIndex) {
        var vmID = $("#mcisVmID_" + mcisIndex + "_" + vmIndexOfMcis).val();
        var vmName = $("#mcisVmName_" + mcisIndex + "_" + vmIndexOfMcis).val();
        var vmStatus = $(
          "#mcisVmStatus_" + mcisIndex + "_" + vmIndexOfMcis
        ).val();
        vmStatus = vmStatus.toLowerCase();
        var vmDispStatus = mcpjs["util/common"].getVmStatusDisp(vmStatus);
        var vmStatusIcon = mcpjs["util/common"].getVmStatusIcon(vmDispStatus);
        // var vmStatusIcon = "bgbox_g";
        // if (vmDispStatus == "running") {
        //     vmStatusIcon = "bgbox_b"
        // } else if (vmDispStatus == "include") {
        //     vmStatusIcon = "bgbox_g"
        // } else if (vmDispStatus == "suspended") {
        //     vmStatusIcon = "bgbox_g"
        // } else if (vmDispStatus == "terminated") {
        //     vmStatusIcon = "bgbox_r"
        // } else {
        //     vmStatusIcon = "bgbox_r"
        // }
        vm_badge +=
          '<li class="sel_cr ' +
          vmStatusIcon +
          "\" id=\"vmOfMcis_' + mcisIndex + '_' + vmIndex + \"><a href=\"javascript:void(0);\" onclick=\"mcpjs['mcismng/mcismng'].vmDetailInfo('" +
          mcisID +
          "','" +
          mcisName +
          "','" +
          vmID +
          '\')"><span class="txt">' +
          vmName +
          "</span></a></li>";
      }
    });
    // console.log(vm_badge);
    $("#mcis_server_info_box").empty();
    $("#mcis_server_info_box").append(vm_badge);
  } else {
    console.log(" change class");
    var mcisID = $("#mcisID" + mcisIndex).val();
    var mcisName = $("#mcisName" + mcisIndex).val();
    var vmID = $("#mcisVmID_" + mcisIndex + "_" + vmIndex).val();
    var vmName = $("#mcisVmName_" + mcisIndex + "_" + vmIndexOfMcis).val();
    var vmLi = $("#vmOfMcis_" + mcisIndex + "_" + vmIndex);
    var vmStatus = $("#mcisVmStatus_" + mcisIndex + "_" + vmIndex).val();
    var vmDispStatus = mcpjs["util/common"].getVmStatusDisp(vmStatus);
    var vmStatusIcon = mcpjs["util/common"].getVmStatusIcon(vmDispStatus);
    console.log("li attrt class " + vmStatusIcon);
    vmLi.attr("class", "sel_cr " + vmStatusIcon);

    var vm_badge =
      '<li class="sel_cr ' +
      vmStatusIcon +
      "\" id=\"vmOfMcis_' + mcisIndex + '_' + vmIndex + \"><a href=\"javascript:void(0);\" onclick=\"mcpjs['mcismng/mcismng'].vmDetailInfo('" +
      mcisID +
      "','" +
      mcisName +
      "','" +
      vmID +
      '\')"><span class="txt">' +
      vmName +
      "</span></a></li>";
    $("#mcis_server_info_box").empty();
    $("#mcis_server_info_box").append(vm_badge);
  }
}

// 특정 MCIS 만 refresh
// vmList의 refresh버튼 클릭 시
export function refreshMcisStatusData() {
  var mcisID = $("#mcis_id").val();
  console.log("refreshMcisData=" + mcisID);
  if (mcisID) {
    //mcpjs['util/pathfinder'].getCommonMcisStatusData("refreshmcisdata", mcisID, mcpjs['mcismng/mcismng'].getCommonMcisStatusDataCallbackSuccess); //

    var caller = "refreshmcisdata";
    var actionName = "McisGet";
    var optionParamMap = new Map();
    optionParamMap.set("option", "status");
    optionParamMap.set("{mcisId}", mcisID);

    mcpjs["util/pathfinder"].getCommonData(
      caller,
      actionName,
      optionParamMap,
      mcpjs['mcismng/mcismng'].getCommonMcisStatusDataCallbackSuccess
    );    
  }
}


// 1개 MCIS 상태 변경
export function getCommonMcisStatusDataCallbackSuccess(caller, result) {
  console.log("caller ", caller);
  console.log("result ", result);
  var mcisStatusInfo = result.data.McisStatusInfo;
  console.log(mcisStatusInfo);
  var mcisID = mcisStatusInfo.id;

  // 받아온 값이 없는 경우는 mcis삭제이므로 table부터 다시그려야 함.
  if (!mcisID) {
    // mcis목록 조회
    //mcpjs['util/pathfinder'].getCommonMcisList("mcismngready", true, "", "simple")
    mcpjs["util/pathfinder"].getCommonMcisList(
      "mcismngready",
      "simple",
      mcpjs["mcis/mcismng"].getMcisListCallbackSuccess
    );
    $(".detail_box").removeClass("view");
    $(".server_info").removeClass("active");
    return;
  }

  var aMcis = new Object();
  for (var mcisIndex in totalMcisListObj) {
    var tempMcis = totalMcisListObj[mcisIndex];
    if (mcisID == tempMcis.id) {
      aMcis = tempMcis;
      break;
    }
  } // end of mcis loop

  // set mcis
  console.log(aMcis.status + " : " + mcisStatusInfo.status);
  aMcis.status = mcisStatusInfo.status;
  aMcis.targetAction = mcisStatusInfo.targetAction;
  aMcis.targetStatus = mcisStatusInfo.targetStatus;

  // set vm list of mcis
  vmList = aMcis.vm;
  if (vmList) {
    aMcis.vm = mcisStatusInfo.vm;
  } else {
    var vmList = mcisStatusInfo.vm;
    // 가져온 상태값
    vmList.forEach(function (vmItem, vmIndex) {
      var isExist = false;
      // 기존 상태값
      for (var aIndex in mcisStatusInfo.vm) {
        var aVm = aMcis.vm[aIndex];
        if (vmItem.id == aVm.id) {
          aVm.status = vmItem.status;
          aVm.installMonAgent = vmItem.installMonAgent;
          aVm.systemLabel = vmItem.systemLabel;
          aVm.targetAction = vmItem.targetAction;
          aVm.targetStatus = vmItem.targetStatus;
          break;
        }
      }
    });
  }

  updateMcisData(aMcis, mcisID);
}
// MCIS의 상태값만 변경
function refreshMcisStatus(mcisID) {
  //
}

// 특정 Vm의 상태만 변경
function refreshVmStatus(mcisID, vmID) {}

// Mcis Info영역 변경

// Server Info 변경 : 선택된 vm재조회, 상단의  MCIS Info의 해당 vm status변경 반영, 상단의 MCIS List의 요약에서 status 변경
function refreshVmList() {
  var mcisID = $("#selected_mcis_id").val();
  console.log("refreshVmList " + mcisID);
  getCommonMcisData(
    "refreshmcisdata",
    mcisID,
    mcpjs["mcismng/mcisgmng"].getCommonMcisDataCallbackSuccess
  );

  // MCIS Data를 가져와 Set한 이후 MCIS List table에 반영, MCIS Info에 반영
}

// refresh button 클릭 시 해당 vm 정보 조회
function refreshVmDetailInfo() {
  var mcisID = $("#selected_mcis_id").val();
  var vmID = $("#selected_vm_id").val();
  vmDetailInfo(mcisID, "", vmID);
}

// VM 목록에서 VM 클릭시 해당 VM의 상세정보
export function vmDetailInfo(mcisID, mcisName, vmID) {
  // var url = "/operation/manages/mcismng/" + mcisID + "/vm/" + vmID
  // axios.get(url, {})
  //     .then(result => {
  //         console.log("get  Data : ", result.data);

  // var statusCode = result.data.status;
  // var message = result.data.message;
  //
  // if (statusCode != 200 && statusCode != 201) {
  //     mcpjs['util/util'].commonAlert(message + "(" + statusCode + ")");
  //     return;
  // }
  console.log("vmDetailInfo " + vmID);
  var aMcis = new Object();
  for (var mcisIndex in totalMcisListObj) {
    var tempMcis = totalMcisListObj[mcisIndex];
    if (mcisID == tempMcis.id) {
      aMcis = tempMcis;
      break;
    }
  } // end of mcis loop
  console.log(aMcis);
  var vmList = aMcis.vm;
  var vmExist = false;
  var data = new Object();
  for (var vmIndex in vmList) {
    var aVm = vmList[vmIndex];
    if (vmID == aVm.id) {
      //aVm = vmData;
      data = aVm;
      vmExist = true;
      break;
    }
  }
  if (!vmExist) {
    console.log("vm is not exist");
    console.log(vmList);
  }
  // var data = result.data.VmInfo;
  // var connectionConfig = result.data.ConnectionConfigInfo;
  console.log("selected Vm");
  console.log(data);
  var vmId = data.id;
  var vmName = data.name;
  var vmStatus = data.status;
  var vmDescription = data.description;
  var vmPublicIp = data.publicIP == undefined ? "" : data.publicIP;
  var vmSshKeyID = data.sshKeyId;
  //vm info
  $("#vm_id").val(vmId);
  $("#vm_name").val(vmName);
  console.log(
    "vm_id " + vmId + ", vm_name " + vmName + ", vm_SshKeyID " + vmSshKeyID
  );

  $("#manage_mcis_popup_vm_id").val(vmId);
  $("#manage_mcis_popup_mcis_id").val(mcisID);
  $("#manage_mcis_popup_sshkey_name").val(vmSshKeyID);

  $("#server_info_text").text("[" + vmName + "/" + mcisName + "]");
  $("#server_detail_info_text").text("[" + vmName + "/" + mcisName + "]");

  var vmBadge = "";
  var vmDispStatus = mcpjs["util/common"].getVmStatusDisp(vmStatus);
  var vmStatusIcon = mcpjs["util/common"].getVmStatusIcon(vmDispStatus);
  // var vmStatusIcon = "icon_running_db.png";
  // if(vmStatus == "Running"){
  //     vmStatusIcon = "icon_running_db.png";
  // }else if(vmStatus == "include"){
  //     vmStatusIcon = "icon_stop_db.png";
  // }else if(vmStatus == "Suspended"){
  //     vmStatusIcon = "icon_stop_db.png";
  // }else if(vmStatus == "Terminated"){
  //     vmStatusIcon = "icon_terminate_db.png";
  // }else{
  //     vmStatusIcon = "icon_stop_db.png";
  // }
  //var vmBadge = '<img src="/assets/images/contents/' + vmStatusIcon +'" alt="' + vmStatus + '"/>'

  $("#server_detail_view_server_status").val(vmStatus);
  // $("#server_info_status_img").empty()
  // $("#server_info_status_img").append(vmBadge)
  $("#server_info_status_icon_img").attr(
    "src",
    "/assets/images/contents/" + vmStatusIcon
  );

  $("#server_info_name").val(vmName + "/" + vmID);
  $("#server_info_desc").val(vmDescription);

  // ip information
  $("#server_info_public_ip").val(vmPublicIp);
  $("#server_detail_info_public_ip_text").text("Public IP : " + vmPublicIp);
  $("#server_info_public_dns").val(data.publicDNS);
  $("#server_info_private_ip").val(data.privateIP);
  $("#server_info_private_dns").val(data.privateDNS);

  $("#server_detail_view_public_ip").val(vmPublicIp);
  $("#server_detail_view_public_dns").val(data.publicDNS);
  $("#server_detail_view_private_ip").val(data.privateIP);
  $("#server_detail_view_private_dns").val(data.privateDNS);

  $("#manage_mcis_popup_public_ip").val(vmPublicIp);

  // connection tab
  var locationInfo = data.location;
  var providerId = locationInfo.cloudType;
  $("#server_info_csp_icon").empty();
  $("#server_info_csp_icon").append(
    '<img src="/assets/images/contents/img_logo_' +
      providerId +
      '.png" alt=""/>'
  );
  $("#server_connection_view_csp").val(providerId);
  $("#manage_mcis_popup_csp").val(providerId);

  var latitude = locationInfo.latitude;
  var longitude = locationInfo.longitude;
  var briefAddr = locationInfo.briefAddr;
  var nativeRegion = locationInfo.nativeRegion;

  if (locationInfo) {
    $("#server_location_latitude").val(latitude);
    $("#server_location_longitude").val(longitude);

    // // 지도 표시
    // var pointInfo = new Object();
    // pointInfo.id = "1"
    // pointInfo.name = nativeRegion;
    // pointInfo.cloudType = cloudType;//server_connection_view_csp
    // pointInfo.latitude = latitude;//server_location_latitude
    // pointInfo.longitude = longitude//server_location_longitude
    // pointInfo.markerIndex = 1
    // setMap(pointInfo);
  }
  // region zone locate

  //var region = data.region.region
  var regionName = data.region.region;
  // var zone = data.region.zone
  var zone = data.region.zone;
  // console.log(vmDetail.iid);
  $("#server_info_region").val(briefAddr + ":" + regionName);
  $("#server_info_zone").val(zone);
  // $("#server_info_cspVMID").val("cspVMID : " + vmDetail.iid.nameId)// vmDetail에 있는 항목으로 vmDetail에서 처리

  $("#server_detail_view_region").val(briefAddr + " : " + regionName);
  $("#server_detail_view_zone").val(zone);

  $("#server_connection_view_region").val(briefAddr + "(" + regionName + ")");
  $("#server_connection_view_zone").val(zone);

  $("#server_info_provider_id").val(providerId);
  $("#server_info_region_name").val(regionName);

  // connection name
  var connectionName = data.connectionName;
  $("#server_info_connection_name").val(connectionName);
  $("#server_connection_view_connection_name").val(connectionName);

  // credential and driver info : 가져오지 않음으로
  // console.log("connectionConfig : ", connectionConfig)
  // if (connectionConfig) {
  //     var credentialName = connectionConfig.CredentialName
  //     var driverName = connectionConfig.DriverName
  //     $("#server_connection_view_credential_name").val(credentialName)
  //     $("#server_connection_view_driver_name").val(driverName)
  // }
  console.log("conn:", TotalCloudConnectionList);
  for (var cIndex in TotalCloudConnectionList) {
    // TODO : connection의 driver와 connection set.
    var connInfo = TotalCloudConnectionList[cIndex];
    if (connectionName == connInfo.ConfigName) {
      $("#server_connection_view_credential_name").val(connInfo.CredentialName);
      $("#server_connection_view_driver_name").val(connInfo.DriverName);
      break;
    }
  }

  //////vm detail tab////
  var vmDetail = data.cspViewVmDetail;
  if (vmDetail) {
    //    //cspvmdetail
    // var vmDetailKeyValueList = vmDetail.KeyValueList
    var vmDetailKeyValueList = vmDetail.keyValueList;
    var architecture = "";
    if (vmDetailKeyValueList) {
      for (var keyIndex in vmDetailKeyValueList) {
        if (vmDetailKeyValueList[keyIndex].key == "Architecture") {
          // ?? 이게 뭐지?
          architecture = vmDetailKeyValueList[keyIndex].value;
          break;
        }
      }
      // architecture = vmDetailKeyValueList.filter(item => item.Key === "Architecture")
      // console.log("architecture : ",architecture.length)
      // if(architecture.length > 0){
      //     architecture = architecture[0].Value
      //     console.log("architecture2 : ",architecture)
      // }
      // console.log("architecture = " + architecture)
      $("#server_info_archi").val(architecture);
      $("#server_detail_view_archi").val(architecture);
    }
    //    // server spec
    // var vmSecName = data.VmSpecName
    var vmSpecName = vmDetail.vmspecName;
    $("#server_info_vmspec_name").val(vmSpecName);
    $("#server_detail_view_server_spec").text(vmSpecName);
    //var spec_id = data.specId
    var specId = data.specId;
    // set_vmSpecInfo(spec_id);// memory + cpu  : TODO : spec정보는 자주변경되는것이 아닌데.. 매번 통신할 필요있나...

    var startTime = vmDetail.startTime;
    $("#server_info_start_time").val(startTime);

    // server id / system id
    $("#server_detail_view_server_id").val(data.id);
    // systemid 를 사용할 경우 아래 꺼 사용
    $("#server_detail_view_server_id").val(vmDetail.iid.systemId);

    // image id
    var imageIId = vmDetail.imageIId.nameId;
    var imageId = data.imageId;
    mcpjs["util/pathfinder"].getCommonVmImageInfo("mcisvmdetail", imageId); //
    $("#server_detail_view_image_id").text(imageId + "(" + imageIId + ")");

    //vpc subnet
    var vpcId = vmDetail.vpcIID.nameId;
    var vpcSystemId = vmDetail.vpcIID.systemId;
    var subnetId = vmDetail.subnetIID.nameId;
    var subnetSystemId = vmDetail.subnetIID.systemId;
    var eth = vmDetail.networkInterface;
    $("#server_detail_view_vpc_id").text(vpcId + "(" + vpcSystemId + ")");
    // set_vmVPCInfo(vpcId, subnetId);

    $("#server_detail_view_subnet_id").text(
      subnetId + "(" + subnetSystemId + ")"
    );
    $("#server_detail_view_eth").val(eth);

    // user account
    $("#server_detail_view_access_id_pass").val(vmDetail.vmuserId + "/ *** ");
    $("#server_detail_view_user_id_pass").val(data.vmUserAccount + "/ *** ");
    $("#manage_mcis_popup_user_name").val(data.vmUserAccount);

    // security group
    var append_sg = "";

    //var sg_arr = vmDetail.securityGroupIIds// nameId, systemId 로 namespace가 포함된 값임.
    var sg_arr = data.securityGroupIds;
    console.log(sg_arr);
    if (sg_arr) {
      sg_arr.map((item, index) => {
        console.log("item  = " + item);
        console.log("item index = " + index);
        //append_sg += '<a href="javascript:void(0);" onclick="mcpjs[\'mcismng/mcismng\'].getSecurityGroupInfo(\'mcisvm\',\'' + item.nameId + '\');"title="' + item.nameId + '" >' + item.nameId + '</a> '
        //append_sg += '<a href="javascript:void(0);" onclick="mcpjs[\'mcismng/mcismng\'].getSecurityGroupInfo(\'mcisvm\',\'' + item + '\');"title="' + item + '" >' + item + '</a> '
        //append_sg += '<a href="javascript:void(0);" data-toggle="modal" data-target="#firewallRegisterBox" onclick="mcpjs[\'mcismng/mcismng\'].displayFirewall(\'mcisvm\',\'' + item + '\');"title="' + item + '" >' + item + '</a> '
        append_sg +=
          "<a href=\"javascript:void(0);\" data-target=\"#firewallRegisterBox\" onclick=\"mcpjs['mcismng/mcismng'].displayFirewall('mcisvm','" +
          item +
          '\');"title="' +
          item +
          '" >' +
          item +
          "</a> ";
      });
    }
    console.log("append sg : ", append_sg);

    $("#server_detail_view_security_group").empty();
    $("#server_detail_view_security_group").append(append_sg);

    $("#server_detail_view_keypair_name").val(vmDetail.keyPairIId.nameId);

    console.log(vmDetail.iid);
    $("#server_info_cspVMID").val("cspVMID : " + vmDetail.iid.nameId);

    // Disk
    var dataDiskArr = data.dataDiskIds;
    console.log("disk arr : ", dataDiskArr);
    var temp_disk = ""; // TODO : 이름을 뭘로 바꿔야하나
    var attachedDiskCount = 0;
    if (dataDiskArr && dataDiskArr.length > 0) {
      temp_disk = dataDiskArr.join(",");

      dataDiskArr.forEach((item) => {
        if (item == "") {
          return;
        }
        attachedDiskCount++;
        var url = "/settings/resources/datadisk/id/" + item;
        console.log("disk get url by id : ", url);
        $("#block_device_section").empty();

        var html = "";
        axios.get(url).then((result) => {
          var diskInfo = result.data.dataDiskInfo;
          console.log("diskInfo result : ", result);
          console.log("diskInfo : ", diskInfo);
          var diskID = diskInfo.id;
          var diskName = diskInfo.name;
          var diskType = diskInfo.diskType;
          var diskSize = diskInfo.diskSize;
          var t_text = diskName + " ," + diskType + ", " + diskSize + "/GB";
          html +=
            '<input type="text" name="" value="' +
            t_text +
            '" placeholder="" title="" readonly />';

          $("#block_device_section").append(html);
        });
      });
    }

    if (attachedDiskCount == 0) {
      //var temp_btn = '<a href="javascript:void(0);" onclick="mcpjs[\'mcismng/mcismng\'].displayAttachDisk(false);" title="datadisk" >Attach Disk</a>'
      var temp_btn =
        '<a href="javascript:void(0);" data-toggle="modal" data-target="#availableDiskSelectBox" onclick="mcpjs[\'mcismng/mcismng\'].displayAttachDisk(false);" class="btn_datadisk_assist">Assist</a>';

      $("#block_device_section").empty();
      $("#block_device_section").append(temp_btn);
      console.log("temp_btn : empty disk arr ");
    } else {
      var temp_btn =
        '<a href="javascript:void(0);" data-toggle="modal" data-target="#attachDiskSelectBox" onclick="mcpjs[\'mcismng/mcismng\'].displayAttachDisk(true);" class="btn_datadisk_assist">Assist</a>';
      //var temp_btn = '<a href="javascript:void(0);" onclick="mcpjs[\'mcismng/mcismng\'].displayAttachDisk(true);" title="datadisk" >Data Disk Detail</a>'
      $("#block_device_section").append(temp_btn);
    }

    if (temp_disk) {
      $("#server_detail_disk_status").val("attached");
    } else {
      $("#detach_button").hide();
    }
    $("#server_detail_view_root_device_type").val(vmDetail.rootDiskType);
    $("#server_detail_view_root_device").val(vmDetail.rootDeviceName);
    $("#server_detail_disk_id").val(temp_disk);
    $("#server_detail_disk_mcis_id").val(mcisID);
    $("#server_detail_disk_vm_id").val(vmId);

    // ... TODO : 우선 제어명령부터 처리. 나중에 해당항목 mapping하여 확인
  } // end of vm detail
  ////// vm connection tab //////

  $("#selected_mcis_id").val(mcisID);
  $("#selected_vm_id").val(vmID);
  var installMonAgent = data.monAgentStatus;
  console.log("install mon agent : ", installMonAgent);
  if (installMonAgent == "installed") {
    var isWorking = mcpjs["util/pathfinder"].checkDragonFlyMonitoringAgent(
      mcisID,
      vmID
    );
    if (isWorking) {
      $("#mcis_detail_info_check_monitoring").prop("checked", true);
      $("#mcis_detail_info_check_monitoring").attr("disabled", true);
    } else {
      $("#mcis_detail_info_check_monitoring").prop("checked", false);
      $("#mcis_detail_info_check_monitoring").attr("disabled", false);
    }
  } else {
    $("#mcis_detail_info_check_monitoring").prop("checked", false);
    $("#mcis_detail_info_check_monitoring").attr("disabled", false);
  }

  ////// vm mornitoring tab 으로 이동 //////
  // install Mon agent
  // showVmMonitoring(mcisID,vmID)

  // script 생성
  console.log("vmScriptExport start");
  // 위 값으로 mcisIndex, vmIndex 를 찾자
  // var mcisIndex = 0;
  // var vmIndex = 0;
  // $("[id^='mcisVmID_']").each(function(){
  //     if( vmID == $(this).val()){
  //         var mcisVm = $(this).attr("id").split("_")
  //         mcisIndex = mcisVm[1]
  //         vmIndex = mcisVm[2]
  //         return false;
  //     }
  // });

  var vmCreateScript = JSON.stringify(data);
  // $("#m_exportFileName_" + mcisIndex + "_"+ vmIndex).val(vmName);
  // $("#m_vmExportScript_" + mcisIndex + "_"+vmIndex).val(vmCreateScript);
  $("#exportFileName").val(mcisID + "_" + vmID);
  $("#exportScript").val(vmCreateScript);
}

// attach disk popup의 필요 param set
// attached disk가 있으면 attachedDiskList popup
// attached disk가 없으면 availableDiskList popup
export function displayAttachDisk(attached) {
  var mcisId = $("#selected_mcis_id").val();
  var vmId = $("#selected_vm_id").val();

  var providerId = $("#server_info_provider_id").val().toUpperCase();
  var regionName = $("#server_info_region_name").val();
  var connectionName = $("#server_connection_view_connection_name").val();

  var attachedDisks = $("#server_detail_disk_id").val();

  console.log("providerId", providerId);
  console.log("regionName", regionName);
  console.log("connectionName=", connectionName);
  console.log("attachedDisks=", attachedDisks);
  console.log("attached", attached);

  if (attached) {
    // attach disk가 있으면 상세
    // modal
    mcpjs[
      "datadisk/namespacevmattacheddisk_modal"
    ].setNamespaceVmAttachedDiskAssist(
      "mcismng",
      mcisId,
      vmId,
      connectionName,
      attachedDisks
    );
  } else {
    // attach 된 disk가 없으면 availableVmDisk 목록
    // mcis, vm, connection을 넘겨서 attached가 있으면 해당목록 없으면 available disk목록
    mcpjs[
      "datadisk/namespaceavailabledatadisk_modal"
    ].setNamespaceAvailableDatadiskAssist(
      "mcismng",
      mcisId,
      vmId,
      providerId,
      regionName
    );
  }
}

// 조회 성공 시 Monitoring Tab 표시
var vmChartArr = new Array();
function showVmMonitoring(mcisID, vmID) {
  $("#mcis_detail_info_check_monitoring").prop("checked", true);
  $("#mcis_detail_info_check_monitoring").attr("disabled", true);
  // $("#Monitoring_tab").show();
  //var duration = "5m"
  var duration = "30m";
  var period_type = "m";
  var metric_arr = ["cpu", "memory", "disk", "network"];
  var statisticsCriteria = "last";
  // TODO : Analytics View 는 안보이게
  for (var i in metric_arr) {
    var vmChart;
    vmChart = mcpjs["ui/mcis.chart"].getVmMetric(
      vmChart,
      "canvas_" + i,
      metric_arr[i],
      mcisID,
      vmID,
      metric_arr[i],
      period_type,
      statisticsCriteria,
      duration
    );
    vmChartArr.push(vmChart);
  }
  //$("#Monitoring_tab").hide();
}

// getVMMetric 는 mcis.chart.js로 이동

////////////////

// MCIS script export
function mcisScriptExport() {
  // var mcisID = $("#mcis_id").val();
  var vmID = $("#vm_id").val();
  var vmName = $("#vm_name").val();

  var checkedCount = 0;
  var mcisID = "";
  $("[id^='td_ch_']").each(function () {
    if ($(this).is(":checked")) {
      checkedCount++;
      console.log("checked");
      mcisID = $(this).val();
      // 여러개를 지울 때 호출하는 함수를 만들어 여기에서 호출
    } else {
      console.log("checked nothing");
    }
  });

  if (checkedCount == 0) {
    mcpjs["util/util"].commonAlert("Please Select MCIS!!");
    return;
  } else if (checkedCount > 1) {
    mcpjs["util/util"].commonAlert("Please Select One MCIS at a time");
    return;
  }

  // 위 값으로 mcisIndex, vmIndex 를 찾자
  var mcisIndex = 0;
  var vmIndex = 0;
  //mcisID{{$index}}
  console.log("mcisScriptExport start");
  $("[id^='mcisID']").each(function () {
    if (mcisID == $(this).val()) {
      mcisIndex = $(this).attr("id").replace("mcisID", "");
      return false;
    }
  });

  // MCIS정보를 가져온 뒤 save하자.
  getCommonMcisData(
    "mcisexport",
    mcisID,
    mcpjs["mcismng/mcisgmng"].getCommonMcisDataCallbackSuccess
  );

  // console.log("index " + mcisIndex)
  // if( $("#m_mcisExportScript_" + mcisIndex).val() == ""){
  //     makeMcisScript(mcisIndex);
  // }
  // console.log("mcisscript")
  // console.log($("#m_mcisExportScript_" + mcisIndex).val())
  // saveToMcisAsJsonFile(mcisIndex, vmIndex);
}

// vm script export
function vmScriptExport() {
  var mcisID = $("#mcis_id").val();
  var vmID = $("#vm_id").val();
  var vmName = $("#vm_name").val();
  console.log("vmScriptExport start");
  // 위 값으로 mcisIndex, vmIndex 를 찾자
  var mcisIndex = 0;
  var vmIndex = 0;
  $("[id^='mcisVmID_']").each(function () {
    if (vmID == $(this).val()) {
      var mcisVm = $(this).attr("id").split("_");
      mcisIndex = mcisVm[1];
      vmIndex = mcisVm[2];
      return false;
    }
  });

  if (!mcisID) {
    mcpjs["util/util"].commonAlert("Please Select MCIS!!");
    return;
  }
  if (!vmID) {
    mcpjs["util/util"].commonAlert("Please Select VM!!");
    return;
  }

  // console.log("index " + mcisIndex + " , " + vmIndex)
  // if( $("#m_vmExportScript_" + mcisIndex + "_" + vmIndex).val() == ""){
  //     makeVmScript(mcisIndex, vmIndex);
  // }
  console.log("vmscript " + mcisIndex + " : " + vmIndex);
  console.log($("#m_vmExportScript_" + mcisIndex + "_" + vmIndex).val());
  saveToVmAsJsonFile(mcisIndex, vmIndex);
}

// mcis를 선택하면 해당 mcis를 export할 준비를 함
// lifecycle 의 ExportScriptOfMcis 를 통해 선택한 mcis script를 file로 저장
function makeMcisScript(mcisIndex) {
  var vms = "mcisVmID_" + mcisIndex + "_";
  var vmIndex = 0;
  // // vmScript 먼저 생성
  // console.log("in makeMcisScript " + mcisIndex + " vms : " + vms);
  // $("[id^='" + vms +"']").each(function(){
  //     makeVmScript(mcisIndex, vmIndex);
  //     vmIndex++;
  // });
  console.log(" gogo mcis script");
  var mcisIDVal = $("#m_mcisID_" + mcisIndex).val();
  var mcisNameVal = $("#m_mcisName_" + mcisIndex).val();
  var mcisLabelVal = $("#m_mcisLabel_" + mcisIndex).val();
  var mcisDescriptionVal = $("#m_mcisDescription_" + mcisIndex).val();
  var mcisInstallMonAgentVal = $("#m_mcisInstallMonAgent_" + mcisIndex).val();

  var paramValueAppend = '"';
  var mcisCreateScript = "";
  console.log(" gogo mcis script2 ");
  mcisCreateScript += "{	";
  mcisCreateScript +=
    paramValueAppend +
    "name" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    mcisNameVal +
    paramValueAppend;
  mcisCreateScript +=
    "," +
    paramValueAppend +
    "description" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    mcisDescriptionVal +
    paramValueAppend;
  mcisCreateScript +=
    "," +
    paramValueAppend +
    "label" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    mcisLabelVal +
    paramValueAppend;
  mcisCreateScript +=
    "," +
    paramValueAppend +
    "installMonAgent" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    mcisInstallMonAgentVal +
    paramValueAppend;
  console.log(mcisCreateScript);
  // vmScript 가져오기
  console.log("vm Size =" + vmIndex);
  mcisCreateScript += "," + paramValueAppend + "vm" + paramValueAppend + ":[";
  var addedVmIndex = 0;
  for (var i = 0; i < vmIndex; i++) {
    var vmScript = $("#m_vmExportScript_" + mcisIndex + "_" + i).val(); // 여기에 담겨있음.(위에서 먼저 호출해서 생성 해 둠)

    console.log(i);
    console.log(vmScript);

    if (vmScript == undefined) continue; // VM이 Terminated 된 경우 등에서는 vmScript가 정상적으로 생성되지 않음.

    if (addedVmIndex > 0) mcisCreateScript += ",";

    mcisCreateScript += vmScript;
    addedVmIndex++;
  }
  mcisCreateScript += "]";
  mcisCreateScript += "}";

  $("#m_exportFileName_" + mcisIndex).val(mcisNameVal);
  $("#m_mcisExportScript_" + mcisIndex).val(mcisCreateScript);

  console.log("mcisCreateScript============");
  console.log(mcisCreateScript);
}

// vm을 선택하면 해당 vm을 export할 준비를 함
function makeVmScript(mcisIndex, vmIndex) {
  console.log("in makeVmScript" + mcisIndex + " : " + vmIndex);
  var connectionNameVal = $(
    "#m_vmConnectionName_" + mcisIndex + "_" + vmIndex
  ).val();
  var descriptionVal = $("#m_vmDescription_" + mcisIndex + "_" + vmIndex).val();
  var imageIdVal = $("#m_vmImageId_" + mcisIndex + "_" + vmIndex).val();
  var labelVal = $("#m_vmLabel_" + mcisIndex + "_" + vmIndex).val();
  var nameVal = $("#m_vmName_" + mcisIndex + "_" + vmIndex).val();
  var securityGroupIdsVal = $(
    "#m_vmSecurityGroupIds_" + mcisIndex + "_" + vmIndex
  ).val();
  var specIdVal = $("#m_vmSpecId_" + mcisIndex + "_" + vmIndex).val();
  var sshKeyIdVal = $("#m_vmSshKeyId_" + mcisIndex + "_" + vmIndex).val();
  var subnetIdVal = $("#m_vmSubnetId_" + mcisIndex + "_" + vmIndex).val();
  var vNetIdVal = $("#m_vmVnetId_" + mcisIndex + "_" + vmIndex).val();
  var vmGroupSizeVal = $("#m_vmGroupSize_" + mcisIndex + "_" + vmIndex).val();
  var vmUserAccountVal = $(
    "#m_vmUserAccount_" + mcisIndex + "_" + vmIndex
  ).val();
  var vmUserPasswordVal = $(
    "#m_vmUserPassword_" + mcisIndex + "_" + vmIndex
  ).val();

  var paramValueAppend = '"';
  var vmCreateScript = "";
  vmCreateScript += "{	";
  vmCreateScript +=
    paramValueAppend +
    "connectionName" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    connectionNameVal +
    paramValueAppend;
  vmCreateScript +=
    "," +
    paramValueAppend +
    "description" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    descriptionVal +
    paramValueAppend;
  vmCreateScript +=
    "," +
    paramValueAppend +
    "imageId" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    imageIdVal +
    paramValueAppend;
  vmCreateScript +=
    "," +
    paramValueAppend +
    "label" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    labelVal +
    paramValueAppend;
  vmCreateScript +=
    "," +
    paramValueAppend +
    "name" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    nameVal +
    paramValueAppend;

  //vmCreateScript += ',' + paramValueAppend + 'securityGroupIds' + paramValueAppend + ' : ' + paramValueAppend + securityGroupIdsVal + paramValueAppend;

  console.log(securityGroupIdsVal);
  var sgVal = securityGroupIdsVal.replace(/\[/gi, "");
  sgVal = sgVal.replace(/\]/gi, "");
  var sgArr = sgVal.split(",");

  vmCreateScript +=
    "," + paramValueAppend + "securityGroupIds" + paramValueAppend + " : [";

  for (var i = 0; i < sgArr.length; i++) {
    if (i > 0) vmCreateScript += ",";
    vmCreateScript += paramValueAppend + sgArr[i] + paramValueAppend;
    console.log("securityGroupIdsVal [" + i + "] =" + sgArr[i]);
  }
  vmCreateScript += "]";

  vmCreateScript +=
    "," +
    paramValueAppend +
    "specId" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    specIdVal +
    paramValueAppend;
  vmCreateScript +=
    "," +
    paramValueAppend +
    "sshKeyId" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    sshKeyIdVal +
    paramValueAppend;
  vmCreateScript +=
    "," +
    paramValueAppend +
    "subnetId" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    subnetIdVal +
    paramValueAppend;
  vmCreateScript +=
    "," +
    paramValueAppend +
    "vNetId" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    vNetIdVal +
    paramValueAppend;
  vmCreateScript +=
    "," +
    paramValueAppend +
    "vmGroupSize" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    vmGroupSizeVal +
    paramValueAppend;
  vmCreateScript +=
    "," +
    paramValueAppend +
    "vmUserAccount" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    vmUserAccountVal +
    paramValueAppend;
  vmCreateScript +=
    "," +
    paramValueAppend +
    "vmUserPassword" +
    paramValueAppend +
    " : " +
    paramValueAppend +
    vmUserPasswordVal +
    paramValueAppend;
  vmCreateScript += "}";

  $("#m_exportFileName_" + mcisIndex + "_" + vmIndex).val(nameVal);
  $("#m_vmExportScript_" + mcisIndex + "_" + vmIndex).val(vmCreateScript);
  console.log("vmCreateScript============" + mcisIndex + ":" + vmIndex);
  console.log(vmCreateScript);
}

// json 파일로 저장
function saveToMcisAsJsonFile(mcisIndex) {
  // var fileName = "MCIS_" + $("#m_exportFileName_" + mcisIndex).val();
  // var exportScript = $("#m_mcisExportScript_" + mcisIndex).val();
  var fileName = $("#exportFileName").val();
  var exportScript = $("#exportScript").val();

  saveFileProcess(fileName, exportScript);
}
function saveToVmAsJsonFile(mcisIndex, vmIndex) {
  // var fileName = "VM_" + $("#m_exportFileName_" + mcisIndex + "_" + vmIndex).val();
  // var exportScript = $("#m_vmExportScript_" + mcisIndex + "_"  + vmIndex).val();
  var fileName = $("#exportFileName").val();
  var exportScript = $("#exportScript").val();

  saveFileProcess(fileName, exportScript);
}

// 파일명, script대로 파일 생성
function saveFileProcess(fileName, exportScript) {
  var element = document.createElement("a");
  // element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(exportScript));
  element.setAttribute(
    "href",
    "data:text/json;charset=utf-8," + encodeURIComponent(exportScript)
  );
  // element.setAttribute('download', fileName);
  element.setAttribute("download", fileName + ".json");

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);

  $("#exportFileName").val("");
  $("#exportScript").val("");
}

// securityGroup 정보 조회
export function getSecurityGroupInfo(caller, securityGroupId) {
  //var urlParamMap = new Map();
  //urlParamMap.set("{securityGroupId}", securityGroupId)
  //var url = mcpjs['util/pathfinder'].getURL('SecuritygroupGet');
  //url = mcpjs['util/pathfinder'].setUrlByParam(url, urlParamMap);
  //console.log("url ", url)

  var optionParamMap = new Map();
  optionParamMap.set("{securityGroupId}", securityGroupId);
  mcpjs["util/pathfinder"].getCommonData(
    "mcismng",
    "SecurityGroupGet",
    optionParamMap,
    mcpjs["mcismng/mcismng"].getSecurityGroupCallbackSuccess
  );
}

// 왜 또 호출하지?? firewall rule이 바뀔 수 있다고 본건가?
export function displayFirewall(caller, securityGroupId) {
  var optionParamMap = new Map();
  optionParamMap.set("{securityGroupId}", securityGroupId);
  mcpjs["util/pathfinder"].getCommonData(
    "mcismng",
    "SecurityGroupGet",
    optionParamMap,
    mcpjs["mcismng/mcismng"].getSecurityGroupCallbackSuccess
  );
}

export function getSecurityGroupCallbackSuccess(caller, result) {
  console.log(result);
  var data = result.data.SecurityGroupInfo;
  var firewallRules = data.firewallRules;
  firewallRules.forEach((element) => {
    element.id = data.id;
  });
  // security group의 firewall rule popup으로
  mcpjs["securitygroup/firewallruleset_modal"].displayFirewallRulePop(
    "mcismng",
    firewallRules
  );

  // //if(firewallRules){
  //     $("#register_box").modal('show')
  //     // todo : tabulator로 변경할 것.
  //     console.log("modal???")
  //     var html = ""
  //     try{
  //         firewallRules.map(item => (html += '<tr>'
  //             + '<td class="btn_mtd" data-th="fromPort">' + item.fromPort + ' <span class="ov off"></span></td>'
  //             + '<td class="overlay hidden" data-th="toPort">' + item.toPort + '</td>'
  //             + '<td class="overlay hidden" data-th="toProtocol">' + item.ipProtocol + '</td>'
  //             + '<td class="overlay hidden " data-th="direction">' + item.direction + '</td>'
  //             + '</tr>'
  //         ))
  //         console.log("add firerule")
  //     }catch(e){
  //         console.log("error ", e)
  //     }
  //     console.log(html)
  //     $("#manage_mcis_popup_sg").empty()
  //     $("#manage_mcis_popup_sg").append(html)
  // //}
}

function getSecurityGroupCallbackFail(error) {}

export function getCommonMcisDataCallbackSuccess(caller, data, mcisID) {
  updateMcisData(data, mcisID);
}

function getMcisDataCallbackFail(error) {}

// 지도에 marker로 region 표시.
// Map 관련 설정
var locationMap = new Object();
function setMap(locationInfo) {
  //show_mcis2(url,JZMap);
  //function show_mcis2(url, map){
  // var JZMap = map;

  if (locationInfo == undefined) {
    var locationInfo = new Object();
    locationInfo.id = "1";
    locationInfo.name = "pin";
    locationInfo.cloudType = "aws";
    locationInfo.latitude = "34.3800";
    locationInfo.longitude = "131.7000";
    locationInfo.markerIndex = 1;
  }

  console.log("setMap");
  //지도 그리기 관련
  var polyArr = new Array();

  var longitudeValue = locationInfo.longitude;
  var latitudeValue = locationInfo.latitude;
  console.log(longitudeValue + " : " + latitudeValue);
  if (longitudeValue && latitudeValue) {
    $("#map").empty();
    var locationMap = mcpjs["ui/mcis.map"].map_init(); // mcis.map.js 파일에 정의되어 있으므로 import 필요.  TODO : map click할 때 feature 에 id가 없어 tooltip 에러나고 있음. 해결필요
    mcpjs["ui/mcis.map"].drawMap(
      locationMap,
      longitudeValue,
      latitudeValue,
      locationInfo
    );
  }
}

// vmImage 정보 조회결과를 server_detail_view의 image 정보에 set.
export function getCommonVmImageInfoCallbackSuccess(caller, result) {
  console.log(result);
  var vmImageInfo = result.data.VirtualMachineImageInfo;
  // var imageInfo = data;
  var html = "";
  console.log("vmImageInfo info : ", vmImageInfo);
  html +=
    '<a href="javascript:void(0);" title="' +
    vmImageInfo.cspImageName +
    '">' +
    vmImageInfo.id +
    "</a>" +
    '<div class="bb_info">Image Name : ' +
    vmImageInfo.name +
    ", GuestOS:" +
    vmImageInfo.guestOS +
    "</div>";

  $("#server_detail_view_image_id").empty();
  $("#server_detail_view_image_id").append(html);
  $("#server_info_os").val(vmImageInfo.guestOS);
  $("#server_detail_view_os").val(vmImageInfo.guestOS);
  bubble_box();
}

function getCommonVmImageInfoCallbackFail(caller, data) {
  // -- fail 나더라도 그냥 넘어감.
}

function bubble_box() {
  $(".bubble_box .box").each(function () {
    var $list = $(this);
    var bubble = $list.find(".bb_info");
    var menuTime;
    $list
      .mouseenter(function () {
        bubble.fadeIn(300);
        clearTimeout(menuTime);
      })
      .mouseleave(function () {
        clearTimeout(menuTime);
        menuTime = setTimeout(mTime, 100);
      });
    function mTime() {
      bubble.stop().fadeOut(100);
    }
  });
}

function remoteCommandMcis(commandWord) {
  // mcis가 선택되어 있어야 하고
  var checked_nothing = 0;
  $("[id^='td_ch_']").each(function () {
    if ($(this).is(":checked")) {
      checked_nothing++;
      console.log("checked");
      var mcisID = $(this).val();
      postRemoteCommandMcis(mcisID, commandWord);
    } else {
      console.log("checked nothing");
    }
  });
  if (checked_nothing == 0) {
    mcpjs["util/util"].commonAlert("Please Select MCIS!!");
    return;
  }
}

function remoteCommandVmMcis(commandWord) {
  // VM 선택되어 있어야
  var mcisID = $("#mcis_id").val();
  var vmID = $("#vm_id").val();
  var vmName = $("#vm_name").val();
  console.log("remoteCommandVmMcis start");
  // 위 값으로 mcisIndex, vmIndex 를 찾자
  var mcisIndex = 0;
  var vmIndex = 0;
  $("[id^='mcisVmID_']").each(function () {
    if (vmID == $(this).val()) {
      var mcisVm = $(this).attr("id").split("_");
      mcisIndex = mcisVm[1];
      vmIndex = mcisVm[2];
      return false;
    }
  });

  if (!mcisID) {
    mcpjs["util/util"].commonAlert("Please Select MCIS!!");
    return;
  }
  if (!vmID) {
    mcpjs["util/util"].commonAlert("Please Select VM!!");
    return;
  }
  console.log(" commandWord = " + commandWord);
  if (!commandWord) {
    mcpjs["util/util"].commonAlert("Please type command!!");
    return;
  }

  // $("#manage_mcis_popup_sshkey_name").val(vmSshKeyID)
  // $("#server_info_public_ip").val(vmPublicIp)
  // $("#server_detail_view_public_ip").val(vmPublicIp)
  // $("#server_info_connection_name").val(connectionName)

  // $("#server_detail_view_access_id_pass").val(vmDetail.vmuserId +"/ *** ")
  // $("#server_detail_view_user_id_pass").val(data.vmUserAccount +"/ *** ")
  // $("#manage_mcis_popup_user_name").val(data.vmUserAccount)

  // var publicIp = $("#server_info_public_ip").val();
  // var accessId = $("#manage_mcis_popup_user_name").val();
  // var sshKeyId = $("#manage_mcis_popup_sshkey_name").val();

  postRemoteCommandVmOfMcis(mcisID, vmID, commandWord);
}

/////////////  set : data설정, caculate : 연산, display : 화면 표시
var totalMcisListObj = new Object(); // 모든 MCIS정보를 다 넣고 갱신하여 빼 쓰도록
var totalMcisStatusMap = new Map();
function setToTalMcisStatus() {
  try {
    for (var mcisIndex in totalMcisListObj) {
      var aMcis = totalMcisListObj[mcisIndex];
      var aMcisStatusCountMap = calculateMcisStatusCount(aMcis);
      totalMcisStatusMap.set(aMcis.id, aMcisStatusCountMap);
    }
  } catch (e) {
    console.log("mcis status error");
  }
  displayMcisStatusArea();
}

// 화면 표시
function displayMcisStatusArea() {
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
  });
  sumMcisCnt = sumMcisRunningCnt + sumMcisStopCnt + sumMcisTerminateCnt;
  $("#total_mcis").text(sumMcisCnt);
  $("#mcis_status_running").text(sumMcisRunningCnt);
  $("#mcis_status_stopped").text(sumMcisStopCnt);
  $("#mcis_status_terminated").text(sumMcisTerminateCnt);
}
var totalVmStatusMap = new Map();
// Mcis 목록에서 vmStatus만 처리 : 화면표시는 display function에서
function setTotalVmStatus() {
  try {
    for (var mcisIndex in totalMcisListObj) {
      var aMcis = totalMcisListObj[mcisIndex];
      var vmStatusCountMap = mcpjs["util/util"].calculateVmStatusCount(aMcis);
      totalVmStatusMap.set(aMcis.id, vmStatusCountMap);
    }
  } catch (e) {
    console.log("mcis status error");
  }
  //displayVmStatusArea();
}
// mcis의 vm들 상태값 변경
function setVmStatus(mcisIndex, mcisIs) {}

// 1개 mcis 아래의 vm 들의 status만 계산
// function calculateVmStatusCount(vmList){
//     console.log("calculateVmStatusCount")
//     console.log(vmList)
//     var sumVmCnt = 0;
//     var vmStatusCountMap = new Map();
//     vmStatusCountMap.set("running", 0);
//     vmStatusCountMap.set("stop", 0);  // partial 도 stop으로 보고있음.
//     vmStatusCountMap.set("terminate", 0);
//     try{
//         for(var vmIndex in vmList) {
//             var aVm = vmList[vmIndex];
//             var vmStatus = aVm.status;
//             var vmDispStatus = getVmStatusDisp(vmStatus);
//
//             if (vmStatus != "") {// vm status 가 없는 경우는 skip
//                 if (vmStatusCountMap.has(vmDispStatus)) {
//                     vmStatusCountMap.set(vmDispStatus, vmStatusCountMap.get(vmDispStatus) + 1)
//                 }
//             }
//         }
//     }catch(e){
//         console.log("mcis status error")
//     }
//     return vmStatusCountMap;
// }

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
var totalCloudConnectionMap = new Map();
function setTotalConnection() {
  try {
    console.log("setTotalConnection");
    for (var mcisIndex in totalMcisListObj) {
      var aMcis = totalMcisListObj[mcisIndex];
      // var cloudConnectionCountMap = ;
      totalCloudConnectionMap.set(
        aMcis.id,
        mcpjs["util/util"].calculateConnectionCount(aMcis.vm)
      );
    }
  } catch (e) {
    console.log("mcis status error");
  }
  displayConnectionCountArea();
}

function displayConnectionCountArea() {
  // mcis별 합계이므로 total을 구해서 표시해야 함.
  var sumCloudConnectionMap = new Map();
  totalCloudConnectionMap.forEach((value, key) => {});

  // 합계를 화면에 표시
}

// MCIS의 proder들 표시
function getProviderNamesOfMcis(mcisID) {
  var mcisProviderNames = "";
  var vmCloudConnectionMap = totalCloudConnectionMap.get(mcisID);
  if (vmCloudConnectionMap) {
    vmCloudConnectionMap.forEach((value, key) => {
      mcisProviderNames +=
        "<img class='provider_icon' src='/assets/images/contents/img_logo_" +
        key +
        ".png' alt='" +
        key +
        "'/>";
    });
  }
  return mcisProviderNames;
}

function getMCISInfoProviderNames(mcisID) {
  var mcisProviderNames = "";
  var vmCloudConnectionMap = totalCloudConnectionMap.get(mcisID);
  if (vmCloudConnectionMap) {
    vmCloudConnectionMap.forEach((value, key) => {
      mcisProviderNames +=
        "<img class='provider_icon_info' src='/assets/images/contents/img_logo_" +
        key +
        ".png' alt='" +
        key +
        "'/>";
    });
  }
  return mcisProviderNames;
}

function displayMcisListTable() {
  if (
    !mcpjs["util/util"].isEmpty(totalMcisListObj) &&
    totalMcisListObj.length > 0
  ) {
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

function setMcisListTableRow(aMcisData, mcisIndex) {
  var mcisTableRow = "";
  var mcisStatus = aMcisData.status;
  var vmCloudConnectionMap = totalCloudConnectionMap.get(aMcisData.id);
  // var mcisProviderNamesa = getProviderNamesOfMcis(aMcisData.id);//MCIS에 사용 된 provider
  var mcisDispStatus = mcpjs["util/common"].getMcisStatusDisp(mcisStatus); // 화면 표시용 status

  var vmStatusCountMap = totalVmStatusMap.get(aMcisData.id);
  var totalVmCountOfMcis =
    vmStatusCountMap.get("running") +
    vmStatusCountMap.get("stop") +
    vmStatusCountMap.get("terminate");
  console.log(vmStatusCountMap);

  console.log("label = " + aMcisData.systemLabel);
  // List of Mcis table
  try {
    mcisTableRow +=
      "<tr onclick=\"mcpjs['mcismng/mcismng'].clickListOfMcis('" +
      aMcisData.id +
      '\');" id="server_info_tr_' +
      mcisIndex +
      '" item="' +
      aMcisData.id +
      "|" +
      mcisIndex +
      '">';

    mcisTableRow +=
      '<td class="overlay hidden td_left column-20percent" data-th="Status">';
    mcisTableRow +=
      '   <div style="display: flex; align-items: center;"><img id="mcisInfo_mcisStatus_icon_' +
      mcisIndex +
      '" src="/assets/images/contents/icon_' +
      mcisDispStatus +
      '.png" class="icon" alt=""/><span id="mcisInfo_mcisstatus_' +
      mcisIndex +
      '">' +
      mcisStatus +
      '</span><span class="ov off"></span></div>';
    mcisTableRow += "</td>";
    mcisTableRow += '<td class="btn_mtd ovm column-20percent" data-th="Name">';
    mcisTableRow +=
      '   <div style="display: inline-flex; align-items: center;">';

    mcisTableRow +=
      '       <div id="mcisInfo_mcisName_' +
      mcisIndex +
      '">' +
      aMcisData.name +
      "</div>";
    if (aMcisData.systemLabel === "Managed by MCKS") {
      mcisTableRow +=
        '   <img class="mcks-icon" src="/assets/images/contents/icon_kubernetes_gray.png"/>';
    }
    mcisTableRow += '       <span class="ov"></span>';
    mcisTableRow += "   </div>";
    mcisTableRow += "</td>";
    mcisTableRow +=
      '<td class="overlay hidden column-14percent" data-th="Cloud Connection">';
    mcisTableRow +=
      '    <div id="mcisInfo_mcisProviderNames_' + mcisIndex + '">';

    if (vmCloudConnectionMap) {
      vmCloudConnectionMap.forEach((value, key) => {
        // + mcisProviderNames +
        mcisTableRow +=
          '    <img class="provider_icon" src="/assets/images/contents/img_logo_' +
          key +
          '.png" alt="' +
          key +
          '"/>';
      });
    }
    mcisTableRow += "   </div>";
    mcisTableRow += "</td>";

    mcisTableRow +=
      '<td class="overlay hidden column-18percent" data-th="Total Infras"><div id="mcisInfo_totalVmCountOfMcis_' +
      mcisIndex +
      '">' +
      totalVmCountOfMcis +
      "</div></td>";

    mcisTableRow +=
      '<td class="overlay hidden column-18percent" data-th="# of Servers">';
    mcisTableRow +=
      '<span class="bar" ></span> <span title="running" id="mcisInfo_vmstatus_running_' +
      mcisIndex +
      '">' +
      vmStatusCountMap.get("running") +
      "</span>";
    mcisTableRow +=
      '<span class="bar" >/</span> <span title="stop" id="mcisInfo_vmstatus_stop_' +
      mcisIndex +
      '">' +
      vmStatusCountMap.get("stop") +
      "</span>";
    mcisTableRow +=
      '<span class="bar" >/</span> <span title="terminate" id="mcisInfo_vmstatus_terminate_' +
      mcisIndex +
      '">' +
      vmStatusCountMap.get("terminate") +
      "</span>";
    mcisTableRow += "</td>";

    // mcisTableRow += '<td class="overlay hidden" data-th="Description"><div id="mcisInfo_mcisDescription_' + mcisIndex + '">' + aMcisData.description + '</div></td>'

    mcisTableRow += '<td class="overlay hidden column-60px"  data-th="">';
    mcisTableRow +=
      '<input type="checkbox" name="chk" value="' +
      aMcisData.id +
      '" id="td_ch_' +
      mcisIndex +
      '" title="" />';
    mcisTableRow += '<label for="td_ch_' + mcisIndex + '"></label>';
    mcisTableRow += "</td>";

    mcisTableRow += "</tr>";
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

// MCIS List table의 1개 Row Update
function updateMcisListTableRow(aMcisData, mcisIndex) {
  console.log("updateMcisListTableRow " + mcisIndex);
  console.log(aMcisData);

  // table 의 값 변경.


  var mcisStatus = aMcisData.status;
  var mcisProviderNames = getProviderNamesOfMcis(aMcisData.id); //MCIS에 사용 된 provider
  var mcisDispStatus = mcpjs["util/common"].getMcisStatusDisp(mcisStatus); // 화면 표시용 status

  var vmStatusCountMap = totalVmStatusMap.get(aMcisData.id);
  var mcisStatusImg = "/assets/images/contents/icon_" + mcisDispStatus + ".png";

  if (vmStatusCountMap) {
    var sumVmCountRunning = vmStatusCountMap.get("running");
    var sumVmCountStop = vmStatusCountMap.get("stop");
    var sumVmCountTerminate = vmStatusCountMap.get("terminate");
    var sumVmCount = sumVmCountRunning + sumVmCountStop + sumVmCountTerminate;
      
    var row = table.getRow(aMcisData.id);
    if (row) {
      // Row가 존재하면 해당 Row의 값을 업데이트합니다.    
      row.update({ status: mcisStatus, provider: mcisProviderNames});
    }//field: "status",field: "statusCount.countTotal","statusCount.countRunning","statusCount.countSuspended","statusCount.countTerminated",

  }
}

function displayMcisInfoArea(mcisData) {
  var mcisID = mcisData.id;
  var mcisName = mcisData.name;
  var mcisDescription = mcisData.description;
  var mcisStatus = mcisData.status;
  var mcisDispStatus = mcpjs["util/common"].getMcisStatusDisp(mcisStatus);
  var mcisStatusIcon = mcpjs["util/common"].getMcisStatusIcon(mcisDispStatus);
  var mcisTargetStatus = mcisData.targetStatus;
  var mcisTargetAction = mcisData.targetAction;
  var mcisProviderNames = getMCISInfoProviderNames(mcisData.id); //MCIS에 사용 된 provider

  var vmStatusCountMap = totalVmStatusMap.get(mcisData.id);
  if (vmStatusCountMap) {
    var sumVmCountOfMcis =
      vmStatusCountMap.get("running") +
      vmStatusCountMap.get("stop") +
      vmStatusCountMap.get("terminate");

    $("#mcis_info_txt").text("[ " + mcisName + " ]");

    $("#mcis_server_info_status").empty();
    $("#mcis_server_info_status").append(
      '<strong>Server List / Status</strong>  <span class="stxt">[ ' +
        mcisName +
        " ]</span>  Server(" +
        sumVmCountOfMcis +
        ")"
    );

    // mcis info area
    clearMcisInfoAreaData(); // 이전에 set된 data가 있으면 clear시킨다.
    // 이미 보여주고 있으면, 상세정보는 숨긴다.
    console.log(
      "displayMcisInfoArea show " + $(".detail_box").hasClass("view")
    );
    if ($(".detail_box").hasClass("view")) {
      $(".server_info").removeClass("active");
    } else {
      $(".detail_box").addClass("view");
      var offset = $("#mcis_info_box").position();
      console.log("position", offset.top);

      $("#TopWrap").animate({ scrollTop: offset.top * 1.3 }, 300);
    }

    // 초기화 후 set해야하나?

    //$("#server_info_status_icon_img").attr("src", mcisStatusIcon);
    $("#mcis_info_status_icon_img").attr(
      "src",
      "/assets/images/contents/" + mcisStatusIcon
    );
    $("#mcis_info_name").val(mcisName + " / " + mcisID);
    $("#mcis_info_id").val(mcisID);
    $("#mcis_info_description").val(mcisDescription);
    $("#mcis_info_targetStatus").val(mcisTargetStatus);
    $("#mcis_info_targetAction").val(mcisTargetAction);
    $("#mcis_info_cloud_connection").empty();
    $("#mcis_info_cloud_connection").append(mcisProviderNames); //

    $("#mcis_name").val(mcisName);

    // id="mcis_info_txt"   // <span class="stxt" id="mcis_info_txt">[ ]</span>
    // id="service_status_icon"
    // id="service_status_icon_img" // <img src="/assets/images/contents/icon_running_db.png" alt="">
    // id="mcis_info_name"  // input type=text"
    // id="mcis_info_description" // input type="text
    // id="mcis_info_targetStatus" // input type=text"
    // id="mcis_info_targetAction" // input type=text"
    // id="mcis_info_cloud_connection" // input type=text"

    // deply Algorithm

    // id="mcis_server_info_status" // div

    // <ul id="mcis_server_info_box">
    displayServerStatusList(mcisID, mcisData.vm);
  }
}

// Mcis Info Area를 data를 초기화 한다.
function clearMcisInfoAreaData() {
  //$("#server_info_status_icon_img").attr("src", '');
  $("#mcis_info_status_icon_img").attr("src", "");
  $("#mcis_info_name").val("");
  $("#mcis_info_id").val("");
  $("#mcis_info_description").val("");
  $("#mcis_info_targetStatus").val("");
  $("#mcis_info_targetAction").val("");
  $("#mcis_info_cloud_connection").empty();

  $("#mcis_name").val("");
}

// vm 상태별 icon으로 표시
function displayServerStatusList(mcisID, vmList) {
  console.log("displayServerStatusList");
  var mcisName = mcisID; // TODO : vmDetailInfo() 에서 mcisName을 가져올 수 있도록 보완 필요
  var vmLi = "";
  vmList.sort();
  for (var vmIndex in vmList) {
    var aVm = vmList[vmIndex];

    var vmID = aVm.id;
    var vmName = aVm.name;
    var vmStatus = aVm.status;
    var vmDispStatus = mcpjs["util/common"].getVmStatusDisp(vmStatus);
    var vmStatusClass = mcpjs["util/common"].getVmStatusClass(vmDispStatus);

    vmLi +=
      '<li id="server_status_icon_' +
      vmID +
      '" class="sel_cr ' +
      vmStatusClass +
      '"><a href="javascript:void(0);" onclick="mcpjs[\'mcismng/mcismng\'].vmDetailInfo(\'' +
      mcisID +
      "','" +
      mcisName +
      "','" +
      vmID +
      '\')"><span class="txt">' +
      vmName +
      "</span></a></li>";
  } // end of mcis loop
  // console.log(vmLi)
  $("#mcis_server_info_box").empty();
  $("#mcis_server_info_box").append(vmLi);
  //Manage MCIS Server List on/off
  $(".dashboard .ds_cont .area_cont .listbox li.sel_cr").each(function () {
    console.log("sel_cr");
    var $sel_list = $(this),
      $detail = $(".server_info");
    $sel_list.off("click").click(function () {
      $sel_list.addClass("active");
      $sel_list.siblings().removeClass("active");
      $detail.addClass("active");
      $detail.siblings().removeClass("active");
      $sel_list.off("click").click(function () {
        if ($(this).hasClass("active")) {
          $sel_list.removeClass("active");
          $detail.removeClass("active");
        } else {
          $sel_list.addClass("active");
          $sel_list.siblings().removeClass("active");
          $detail.addClass("active");
          $detail.siblings().removeClass("active");
        }
      });
    });
  });
}

// update McisData
function updateMcisData(aMcisData, mcisID) {
  var mcisIndex = -1;
  for (var mIndex in totalMcisListObj) {
    var aMcis = totalMcisListObj[mIndex];
    if (aMcisData.id == aMcis.id) {
      totalMcisListObj[mIndex] = aMcisData;
      mcisIndex = mIndex;
      break;
    }
  }
  if (mcisIndex > -1) {
    totalMcisListObj.push(aMcisData);
  }

  setToTalMcisStatus(); // mcis상태 표시 를 위해 필요
  setTotalVmStatus(); // mcis 의 vm들 상태표시 를 위해 필요
  setTotalConnection(); // Mcis의 provider별 connection 표시를 위해 필요

  updateMcisListTableRow(aMcisData, mcisIndex);

  $("#mcis_id").val(mcisID);
  $("#mcis_name").val(aMcisData.name);

  $("#selected_mcis_id").val(mcisID);
  $("#selected_mcis_index").val(mcisIndex);

  // MCIS Info area set
  //showServerListAndStatusArea(mcisID,mcisIndex);
  displayMcisInfoArea(aMcisData);
}

// update VM Data
function updateVmData(vmData) {
  // server detailInfo area
  // detail tab
  // connection tab
  // monitoring tab
}

// data 조회완료 시 해당 vmData set.
function setServerDetailInfoArea(mcisID, vmID, vmData) {
  // mcisList -> mcis -> vmList -> vm
  var vmList = new Object();
  var mcisName = mcisID;
  for (var mcisIndex in totalMcisListObj) {
    var aMcis = totalMcisListObj[mcisIndex];
    if (mcisID != "" && mcisID == aMcis.id) {
      vmList = aMcis.vm;
      mcisName = aMcis.name;
      break;
    }
  }

  for (var vmIndex in vmList) {
    var aVm = vmList[vmIndex];
    if (vmData.id == aVm.id) {
      //aVm = vmData;
      vmList[vmIndex] = vmData;
      break;
    }
  }

  displayServerDetailInfoArea(mcisID, vmData);
}

// 해당 area가 나타나면서 set된 data표시
function displayServerDetailInfoArea(mcisID, mcisName, vmData) {
  var vmID = vmData.id;
  var vmName = vmData.name;
  var vmStatus = vmData.status;
  var vmDispStatus = mcpjs["util/common"].getVmStatusDisp(vmStatus);
  var vmStatusIcon = mcpjs["util/common"].getVmStatusIcon(vmDispStatus);

  // id="server_detail_info_text" span
  // id="server_detail_info_public_ip_text" div
  // id="mcis_detail_info_check_monitoring" checkbox

  var installMonAgent = vmData.monAgentStatus;
  console.log("install mon agent : ", installMonAgent);
  // if(installMonAgent == "installed"){
  //     // var isWorking = checkDragonFlyMonitoringAgent(mcisID, vmID);
  //     var isWorking = false;
  //     if( isWorking){
  //         $("#mcis_detail_info_check_monitoring").prop("checked",true)
  //         $("#mcis_detail_info_check_monitoring").attr("disabled",true)
  //     }else{
  //         $("#mcis_detail_info_check_monitoring").prop("checked",false)
  //         $("#mcis_detail_info_check_monitoring").attr("disabled",false)
  //     }
  // }else{
  //     $("#mcis_detail_info_check_monitoring").prop("checked",false)
  //     $("#mcis_detail_info_check_monitoring").attr("disabled",false)
  // }

  $("#server_info_text").text("[" + vmName + "/" + mcisName + "]");
  $("#server_info_status_icon_img").attr(
    "src",
    "/assets/images/contents/" + vmStatusIcon
  );

  $("#server_detail_info_text").text("[" + vmName + "/" + mcisName + "]");
  $("#server_detail_info_public_ip_text").text("Public IP : " + vmPublicIp);

  $("#server_detail_view_server_status").val(vmStatus); // detail tab
}

// vm의 snapshot 생성
export function createSnapshot(snapshotName) {
  var mcisId = $("#mcis_id").val();
  var vmId = $("#vm_id").val();
  var obj = {
    name: snapshotName,
  };

  var controllerKeyName = "VmSnapshotReg";
  var optionParamMap = new Map();
  optionParamMap.set("{mcisId}", mcisId);
  optionParamMap.set("{vmId}", vmId);
  mcpjs["util/pathfinder"].postCommonData(
    "mcismng",
    controllerKeyName,
    optionParamMap,
    obj,
    mcpjs["mcismng/mcismng"].vmSnapshotCallbackSuccess
  );

  // var urlParamMap = new Map();
  // urlParamMap.set(":mcisID", mcisId)
  // urlParamMap.set(":vmID", vmId)
  // var url = mcpjs['util/pathfinder'].setUrlByParam(mcpjs['util/pathfinder'].getWebToolUrl("CreateVmSnapshot"), urlParamMap)

  // //var url = "/operations/manages/mcismng/" + mcisID + "/vm/" + vmID + "/snapshot";
  // console.log("snap shot url : ", url);
  // client.post(url, obj).then(result => {
  //     var status = result.status

  //     console.log("create snapshot result : ", result)
  //     var data = result.data
  //     console.log("create snapshot resutl Message : ", data.message)
  //     if (status == 200 || status == 201) {
  //         mcpjs['util/util'].commonResultAlert("Snapshot Creation Requested");

  //     }
  // })
}

// create snapshot callback
export function vmSnapshotCallbackSuccess(caller, result) {
  var status = result.status;

  console.log("create snapshot result : ", result);
  var data = result.data;
  console.log("create snapshot resutl Message : ", data.message);
  if (status == 200 || status == 201) {
    mcpjs["util/util"].commonResultAlert("Snapshot Creation Requested");
  }
}
