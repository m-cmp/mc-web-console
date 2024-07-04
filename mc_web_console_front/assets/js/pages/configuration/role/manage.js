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
    },
  ];

  table = webconsolejs["common/util"].setTabulator("workspacelist-table", tableObjParams, columns);

  // 행 클릭 시
  table.on("rowClick", function (e, row) {
    console.log(row)
    var roleID = row.getCell("id").getValue();
    console.log("roleID", roleID)

    getSelectedRoleData(roleID)
  });

  //  선택된 여러개 row에 대해 처리
  table.on("rowSelectionChanged", function (data, rows) {
    checked_array = data
    console.log("checked_array", checked_array)
    console.log("rowsrows", data)
  });
}

// 클릭한 role info 가져오기
async function getSelectedRoleData(roleID) {
  const data = {
    pathParams: {
      roleId: roleID
    }
  }

  var controller = "/api/" + "getrolebyid";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  console.log("response", response)
  var roleData = response.data.responseData;
  console.log("roleData", roleData)

  // SET Role Info 
  setRoleInfoData(roleData)

  window.location.hash = "info_role"
}

// 클릭한 mcis info 세팅
function setRoleInfoData(roleData) {
  console.log("setRoleInfoData", roleData)
  try {
    var roleId = roleData.id;
    console.log("roleId ", roleId)

    var name = roleData.name;
    console.log("name ", name)
    var description = roleData.description;
    console.log("description ", description)

    $("#info_id").val("");
    $("#info_name").val("");

    $("#info_id").val(id);
    $("#info_name").val(name);
    $("#info_desc").val(description);

  } catch (e) {
    console.error(e);
  }
}


export async function roleDetailInfo(roleID) {
  // Toggle Info
  var div = document.getElementById("server_info");
  webconsolejs["partials/layout/navigatePages"].toggleElement(div)

  // 기존 값들 초기화
  //clearServerInfo();

  var data = new Object();

}

function clearRoleInfo() {
  console.log("clearRoleInfo")


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
// function providerFilter(data) {


//   return true
// }

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

document.addEventListener("DOMContentLoaded", getRoleList);

// workspace 목록조회
async function getRoleList() {
  console.log("getRoleList")

  const data = {
    pathParams: {},
  };

  var controller = "/api/" + "getrolelist";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  console.log("response ", response)
  var roleList = response.data.responseData;//response 자체가 array임.  

  getRoleListCallbackSuccess(roleList);
}

// MCIS 목록 조회 후 화면에 Set
function getRoleListCallbackSuccess(roleList) {
  console.log("getRoleListCallbackSuccess");
  console.log("roleList : ", roleList);
  table.setData(roleList);
}

// 해당 mcis에서 상태값들을 count : 1개 mcis의 상태는 1개만 있으므로 running, stop, terminate 중 1개만 1, 나머지는 0
// dashboard, mcis 에서 사용

/////////////// Role Handling /////////////////
export async function deleteRole() {
  console.log("deleteRole ", checked_array);

  if (checked_array.length == 0 || checked_array.length > 1) {
    alert(" 1개만 선택 하세요 ")
    return;
  }

  for (const role of checked_array) {
    console.log(role.id)
    let data = {
      pathParams: {
        "roleId": role.id,
      }
    };
    let controller = "/api/" + "deleterolebyid";
    let response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    );
    console.log(response)
    if (response.data.status.code == "200" || response.data.status.code == "201") {
      console.log("successfully deleted")
      // 저장 후 role 목록 조회
      getRoleList()
    }

  }
}

function validRole() {
  var name = $("#create_name").val();
  var desc = $("#create_description").val();

  return true
}
// role 저장 및 Create form 닫기
export async function saveRole() {
  console.log("add workspace")

  if (validRole()) {

    var name = $("#create_name").val();
    var desc = $("#create_description").val();

    const data = {
      request: {
        "name": name,
        "description": desc,
      }
    }

    var controller = "/api/" + "createrole";
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    );
    console.log(response)
    // save success 시 
    if (response.data.status.code == "200" || response.data.status.code == "201") {
      var div = document.getElementById("create_workspace");
      webconsolejs["partials/layout/navigatePages"].toggleElement(div)

      // 저장 후 workspace 목록 조회
      getRoleList()
    }

  }
}

// Info Form 닫기
export function closeInfoForm() {
  console.log(" close form ")

  var div = document.getElementById("info_role");
  webconsolejs["partials/layout/navigatePages"].toggleElement(div)
}