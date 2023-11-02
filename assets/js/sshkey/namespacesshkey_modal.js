import { Modal } from "bootstrap";
import { SSHKEY_MAP } from "../util/util";

var table;
var checked_array = [];

$(() => {
  // search by enter key
  $("#keywordAssistSshKey").on("keyup", function (key) {
    console.log("#namespaceSshKeyAssist .keywordAssistSshKey keyup");
    if (key.keyCode == 13) {
      searchSshKeyByKeyword("searchSshKeyAssistAtReg");
    }
  });

  // search button
  $("#namespaceSshKeyAssist .btn_search_image").on("click", function () {
    console.log("#namespaceSshKeyAssist .btn_search_image clicked");
    searchSshKeyByKeyword("searchSshKeyAssistAtReg");
  });

  // apply button
  $("#namespaceSshKeyAssist .btn_apply").on("click", function () {
    console.log("#namespaceSshKeyAssist .btn_apply clicked");
    //onclick="applyAssistValidCheck('sshKeyAssist');"
    applyAssistValidCheck("sshKeyAssist");
  });

  // table 초기 세팅
  initTable();
});

// table 설정
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
    { title: "SSHKey Id", field: "id", visible: false },
    { title: "Connection", field: "connectionName", visible: false },
    { title: "Description", field: "description", visible: false },
    { title: "Name", field: "name", headerSort: false },
    { title: "Provider", field: "providerId", headerSort: false },
    { title: "Region", field: "regionName", headerSort: false },
  ];
  var isMultiSelect = false; //한개 Row만 선택가능
  table = mcpjs["util/util"].setTabulator(
    "assistSshKeyList",
    tableObjParams,
    columns,
    isMultiSelect
  );

  //var selectedRows = table.getSelectedRows(); 로 처리가능. 별도의 변수가 필요 없음
  //table.on("rowSelectionChanged", function(data, rows){
  //	checked_array = data
  //});
}

// popup이 호출될 때 set :
export function setNamespaceSshKeyAssist(
  caller,
  providerId,
  regionName,
  connectionName
) {
  console.log("setNamespaceSshKeyAssist", caller);
  console.log("providerId=", providerId);
  console.log("regionName=", regionName);
  console.log("connectionName=", connectionName);

  $("#parentsNamespaceSshKeyAssist").val(caller);
  $("#parentsNamespaceSshKeyConnectionName").val(connectionName);

  if (providerId != "") {
    // region 목록 설정.
    $("#assistSshKeyProviderId").val(providerId);
    mcpjs["util/util"].resetRegionListByProvider(
      providerId,
      "assistSshKeyRegionName",
      regionName
    );
  }

  getSshKeyList(caller);
}

export function getSshKeyList(caller) {
  var connectionName = $("#parentsNamespaceSshKeyConnectionName").val();
  var providerId = $("#assistSshKeyProviderId").val();
  var regionName = $("#assistSshKeyRegionName").val();

  // connectionName이 있으면 해당 conn의 resource로 조회
  if (connectionName != "") {
    console.log("There is no Map. search~ ");
    // var actionName="SshKeyListByProviderRegionZone"
    // var optionParam = ""
    // var urlParamMap = new Map();
    // var filterKeyValMap =  new Map();
    // filterKeyValMap.set("connectionName", connectionName)
    // var mconParamMap = new Map();
    // mconParamMap.set("is_cb", "N")
    // mconParamMap.set("providerId", providerId)
    // mconParamMap.set("regionName", regionName)
    // //mconParamMap.set("connectionName", connectionName)

    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['sshkey/namespacesshkey_modal'].getSshKeyListCallbackSuccess, '', urlParamMap, optionParam, filterKeyValMap, mconParamMap)
    var actionName = "SshKeyListByRegion";
    var optionParamMap = new Map();
    optionParamMap.set("filterKey", "connectionName");
    optionParamMap.set("filterVal", connectionName);
    optionParamMap.set("is_cb", "N");
    optionParamMap.set("providerId", providerId);
    optionParamMap.set("regionName", regionName);

    mcpjs["util/pathfinder"].getCommonData(
      caller,
      actionName,
      optionParamMap,
      mcpjs["sshkey/namespacesshkey_modal"].getSshKeyListCallbackSuccess
    );
  } else if (providerId != "" && regionName != "") {
    // 둘다 있으면 해당 region의 sshkey 목록을 보여준다.
    // 사실상 image, spec이 먼저 선택되어야만 할 것 같은데... 그렇다면 이부분의 provider, region은 쓸모 없을 듯 한데...

    // var actionName="SshKeyListByProviderRegionZone"
    // var optionParam = ""
    // var urlParamMap = new Map();
    // var filterKeyValMap =  new Map();
    // var mconParamMap = new Map();
    // mconParamMap.set("is_cb", "N")
    // mconParamMap.set("providerId", providerId)
    // mconParamMap.set("regionName", regionName)

    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['sshkey/namespacesshkey_modal'].getSshKeyListCallbackSuccess, '', urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // console.log(SSHKEY_MAP)
    // if (SSHKEY_MAP.has(providerId+"|"+regionName)) {
    //     console.log("key", providerId+"|"+regionName)
    //     sshKeyList = mcpjs['util/util'].VPC_MAP.get(providerId+"|"+regionName)
    //     table.setData(sshKeyList)
    // }

    var actionName = "SshKeyListByRegion";
    var optionParamMap = new Map();
    optionParamMap.set("is_cb", "N");
    optionParamMap.set("providerId", providerId);
    optionParamMap.set("regionName", regionName);
    mcpjs["util/pathfinder"].getCommonData(
      caller,
      actionName,
      optionParamMap,
      mcpjs["sshkey/namespacesshkey_modal"].getSshKeyListCallbackSuccess
    );
  }
}

// EnterKey입력 시 해당 값, keyword 들이 있는 object id, 구분자(caller)
// export function searchAssistSshKeyByEnter(event, caller) {
// 	if (event.keyCode === 13) {
// 		searchSshKeyByKeyword(caller);
// 	}
// }
//
function searchSshKeyByKeyword(caller) {
  var keyword = "";
  var keywordObjId = "";
  if (caller == "searchSshKeyAssistAtReg") {
    keyword = $("#keywordAssistSshKey").val();
    keywordObjId = "searchAssistSshKeyKeywords";
  }

  //
  //if (!keyword) {
  //	mcpjs['util/util'].commonAlert("At least a keyword required");
  //	return;
  //}
  if (keyword) {
    var addKeyword =
      '<div class="keyword" name="keyword_' +
      caller +
      '">' +
      keyword.trim() +
      "<button class=\"btn_del_image\" onclick=\"mcpjs['util/util'].delSearchKeyword(event, '" +
      caller +
      "')\"></button></div>";
    $("#" + keywordObjId).append(addKeyword);
    var keywords = new Array(); // 기존에 있는 keyword에 받은 keyword 추가하여 filter적용
    $("[name='keyword_" + caller + "']").each(function (idx, ele) {
      keywords.push($(this).text());
    });
  }

  //filterSshKeyList(keywords, caller) // AS-IS : 전체 목록을 가지고 있고 keyword로 filter
  // TO-BE : MAP에서 provider Region목록으로 먼저 뿌려줌
  // 해당 provider, region + keyword로
  getSshKeyList(caller);
}

export function getSshKeyListCallbackSuccess(caller, result) {
  console.log(result);
  var data = result.data.SshKeyList;
  //var data = result.SshKeyList;

  // TODO : SSHKEY_MAP : provider, region으로 목록에 data가 없으면 추가
  //console.log(data)
  table.setData(data);
}

// parent로 값 넘기기
export function applyAssistValidCheck(caller) {
  var selectedIndex = $("#selectedIndexNamespaceSshKeyAssist").val(); //

  var parentProviderID = "";
  var parentRegionName = "";

  // 선택한 provider, region check : 이미 선택된 provider, region이 있을 때 비교하여 다른 provider, region이면 confirm을 띄우고 OK면 초기화 시키고 set

  var selectedProviderId = "";
  var selectedRegionName = "";
  let sshKeyMap = new Map();
  //if (caller == "sshKeyAssist") {
  var selectedRows = table.getSelectedRows();
  selectedRows.forEach(function (row) {
    sshKeyMap.set("id", row.getCell("id").getValue());
    sshKeyMap.set("name", row.getCell("name").getValue());
    sshKeyMap.set("description", row.getCell("description").getValue());
    sshKeyMap.set("connectionName", row.getCell("connectionName").getValue());
    sshKeyMap.set("providerId", row.getCell("providerId").getValue());
    sshKeyMap.set("regionName", row.getCell("regionName").getValue());
  });

  // var orgPrefix = "sshKeyAssist_";// 조회 결과 table의 id
  // selectedProviderId = $("#" + orgPrefix + "providerId_" + selectedIndex).val();
  // selectedRegionName = $("#" + orgPrefix + "regionName_" + selectedIndex).val();
  // var selectedSshKeyId = $("#" + orgPrefix + "id_" + selectedIndex).val();
  // var selectedSshKeyName = $("#" + orgPrefix + "name_" + selectedIndex).val();
  // var selectedSshKeyDescription = $("#" + orgPrefix + "description_" + selectedIndex).val();
  // var selectedConnectionName = $("#" + orgPrefix + "connectionName_" + selectedIndex).val();

  // sshKeyMap.set("id", selectedSshKeyId);
  // sshKeyMap.set("name", selectedSshKeyName);
  // sshKeyMap.set("description", selectedSshKeyDescription);
  // sshKeyMap.set("connectionName", selectedConnectionName);
  // sshKeyMap.set("providerId", $("#" + orgPrefix + "providerId_" + selectedIndex).val());
  // sshKeyMap.set("regionName", $("#" + orgPrefix + "regionName_" + selectedIndex).val());

  console.log(" return values to parents ", sshKeyMap);
  mcpjs["mcismng/vmconfigureexpert"].setValuesFromAssist(
    "NamespaceSshKeyAssist",
    sshKeyMap
  );
  //}

  console.log("caller=" + caller);

  // target이 mcis의 expert mode이면
}
