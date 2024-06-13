import { TabulatorFull as Tabulator } from "tabulator-tables";

////
// 모달 콜백 예제 : confirm 버튼을 눌렀을 때 호출될 callback 함수로 사용할 용도
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
      title: "Id",
      field: "id",
      visible: false
    },
    {
      title: "Name",
      field: "name",
      vertAlign: "middle"
    }    
  ];

  table = setTabulator("workspacelist-table", tableObjParams, columns);

  // 행 클릭 시
  table.on("rowClick", function (e, row) {

    var workspaceID = row.getCell("id").getValue();
    console.log("workspaceID", workspaceID)
    // console.log("eeeee",e)
    //clickListOfMcis(row.getCell("id").getValue());

    getSelectedWorkspaceData(workspaceID)

  });

  //  선택된 여러개 row에 대해 처리
  table.on("rowSelectionChanged", function (data, rows) {
    checked_array = data
    console.log("checked_array", checked_array)
    console.log("rowsrows", data)
  });
}

// 클릭한 workspace info 가져오기
async function getSelectedWorkspaceData(workspaceID) {
  const data = {
    pathParams: {
      workspace: workspaceID
    }
  }

  var controller = "/api/" + "getworkspace";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  console.log("response", response)
  var workspaceData = response.data.responseData;
  console.log("mcisdata", mcisData)

  // SET MCIS Info 
  setWorkspaceInfoData(mcisData)

  // Toggle MCIS Info
  var div = document.getElementById("mcis_info");
  webconsolejs["partials/layout/navigatePages"].toggleElement(div)

}

// 클릭한 mcis info 세팅
function setWorkspaceInfoData(workspaceData) {
  console.log("setWorkspaceInfoData", workspaceData)
  try {
    // var mcisID = mcisData.id;
    // var mcisName = mcisData.name;
    // var mcisDescription = mcisData.description;
    
    // console.log("totalvmCount", totalvmCount)

    // $("#mcis_info_text").text(" [ " + mcisName + " ]")
    // $("#mcis_server_info_status").empty();
    // $("#mcis_server_info_status").text(" [ " + mcisName + " ]")
    // $("#mcis_server_info_count").text(" Server(" + totalvmCount + ")")


    // $("#mcis_info_status_img").attr("src", "/assets/images/common/" + mcisStatusIcon)
    // $("#mcis_info_name").text(mcisName + " / " + mcisID)
    // $("#mcis_info_description").text(mcisDescription)
    // $("#mcis_info_status").text(mcisStatus)
    // $("#mcis_info_cloud_connection").empty()
    // $("#mcis_info_cloud_connection").append(mcisProviderNames)

  } catch (e) {
    console.error(e);
  }

 

}


export async function workspaceDetailInfo(workspaceID) {
  // Toggle MCIS Info
  var div = document.getElementById("server_info");
  webconsolejs["partials/layout/navigatePages"].toggleElement(div)
  
  // 기존 값들 초기화
  //clearServerInfo();

  var data = new Object();
  
  //
  //vm info
  // $("#mcis_server_info_status_img").attr("src", "/assets/images/common/" + mcisStatusIcon)
  // $("#mcis_server_info_connection").empty()
  // $("#mcis_server_info_connection").append(vmProviderIcon)


  // $("#server_info_text").text(' [ ' + vmName + ' / ' + mcisName + ' ]')
  // $("#server_info_name").text(vmName + "/" + vmID)
  // $("#server_info_desc").text(vmDescription)
  // $("#server_info_os").text(operatingSystem)
  // $("#server_info_start_time").text(startTime)
  // $("#server_info_private_ip").text(privateIp)
  // $("#server_info_cspVMID").text(data.cspViewVmDetail.IId.NameId)

}


function clearWorkspaceInfo() {
  console.log("clearWorkspaceInfo")


  // $("#server_info_text").text("")
  // $("#server_detail_info_text").text("")

  // $("#server_detail_view_server_status").val("");

  // $("#server_info_status_icon_img").attr("src", "");

}

//Tabulator Filter
//Define variables for input elements
var fieldEl = document.getElementById("filter-field");
var typeEl = document.getElementById("filter-type");
var valueEl = document.getElementById("filter-value");

// provider filtering / equel 고정
function providerFilter(data) {

  // case type like, equal, not eual
  // equal only
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

////////////////////////////////////////////////////// END TABULATOR ///////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", getWorkspaceList);

async function getWorkspaceList() {
  console.log("getWorkspaceList")
  // var namespace = webconsolejs["common/util"].getCurrentProject()
  // nsid = namespace.Name

  const data = {
    pathParams: {
//      nsId: nsid,
    },
  };
  //var controller = "targetController=getmcislist"
  var controller = "/api/" + "getworkspacelist";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  // var mcisList = response.data.responseData;
  // console.log("mcisList : ", mcisList);
  // getWorkspaceListCallbackSuccess(nsid, mcisList);
}

// MCIS 목록 조회 후 화면에 Set

function getWorkspaceListCallbackSuccess(caller, mcisList) {
  console.log("getWorkspaceListCallbackSuccess");
}

// 해당 mcis에서 상태값들을 count : 1개 mcis의 상태는 1개만 있으므로 running, stop, terminate 중 1개만 1, 나머지는 0
// dashboard, mcis 에서 사용

/////////////////////////////////////////////////////////////////////////////////////////////////


/////////////// Workspace Handling /////////////////
export function deleteWorkspace() {

  // for (const mcis of checked_array) {
  //   console.log(mcis.id)
  //   let data = {
  //     pathParams: {
  //       nsId: nsid,
  //       mcisId: mcis.id,
  //     }
  //   };
  //   let controller = "/api/" + "delmcis";
  //   let response = webconsolejs["common/api/http"].commonAPIPost(
  //     controller,
  //     data
  //   );
  //   console.log(response)
  // }
}

export function addNewWorkspace() {
  console.log("add workspace")
}