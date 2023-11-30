import "bootstrap";
import "jquery.scrollbar";
import { Modal } from "bootstrap";

var table;
$(()=> {

    $('#imageLookupAssist .btn_apply').on('click', function () {
        applyAssistValidCheck()
    });

    $('#imageLookupAssist .btn_search_image').on('click', function () {
        lookupVmImageList()
    });
    
    initTable();
    
})

export function setVmImageLookupAssist(caller, providerId, regionName){
    $("#parentsVmImageLookupAssist").val(caller)

    if (providerId) {
        $("#regProvider_lookup_assist").val(providerId);
        // $("#assistImageProviderName option[value=" + configName + "]").prop('selected', true).change();
    }
    if(regionName){
        $("#regRegionName_lookup_assist").val(regionName)
    }
}

function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"CSP Name Id", field:"cspNameId", mutator: function(value,data){ return data.iid.nameId;}, visible: false},
        {title:"CSP System Id", field:"cspSystemId", mutator: function(value, data){ return data.iid.systemId;}, visible: false},
        {title:"Name", field:"name", mutator: function(value,data){ return data.iid.nameId;}, vertAlign: "middle"},
        {title:"Status", field:"status", vertAlign: "middle"},
        {title:"GuestOS", field:"guestOS", vertAlign: "middle"},
        
    ];
    
    var isMultiSelect = false;
    table = mcpjs["util/util"].setTabulator("assistLookupVmImageList", tableObjParams, columns, isMultiSelect);
    
    //table.on("rowClick", function(e, row){
    //    getVmImageData(row.getCell("id").getValue(), 'info')
    //});

    table.on("rowSelectionChanged", function(data, rows){
    });

    mcpjs['util/util'].displayColumn(table)    
}

// connection에 등록된 spec목록 조회(공통함수 호출)
export function lookupVmImageList() {
    var providerId = $("#regProvider_lookup_assist").val();
    var regionName = $("#regRegionName_lookup_assist").val();
    if (providerId && regionName) {
    //   mcpjs["util/pathfinder"].getCommonLookupImageList(
    //     "vmimagemng",
    //     providerId,
    //     regionName
    //   );
        var caller = "vmimagelookup";
        var actionName = "LookupCspVirtualMachineImageList";
        var optionParamMap = new Map();
        optionParamMap.set("providerId", providerId);
        optionParamMap.set("regionName", regionName);
        mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['vmimage/vmimagelookup_modal'].lookupVmImageListCallbackSuccess);
    } else {
      alert("Please Select Provider and Region!!");
      return;
    }
  
    // $('.scrollbar-inner').scrollbar();
  }
  // 성공 callback
  export function lookupVmImageListCallbackSuccess(caller, result) {
  //export function lookupVmImageListCallbackSuccess(caller, data) {
    // var html = "";
    // if (data == null) {
    //   html +=
    //     '<tr><td class="overlay hidden" data-th="" colspan="5">No Data</td></tr>';
  
    //   $("#assistLookupVmImageList").empty();
    //   $("#assistLookupVmImageList").append(html);
    // } else {
    //   $.each(data, function (index, item) {
    //     console.log("index:" + index + " / " + "item:" + item);
    //     console.log(item);
    //     var keyValueMap = item.keyValueList;
    //     // console.log(keyValueMap);
    //     var mapValue = "";
    //     var mapName = "";
    //     keyValueMap.map((mapObj, mapIndex) => {
    //       if (mapObj.key == "Name") {
    //         mapName = mapObj.value;
    //         return;
    //       }
    //       // console.log("mapIndex = " + mapIndex);
    //       // console.log(mapObj);
    //       // console.log(mapIndex);
    //       // mapValue += mapObj.Key + " : " + mapObj.Value + " <br/>";
    //     });
  
    //     var imageName = "";
    //     var iid = item.iid;
    //     var iidNameID = "";
    //     var iidSystemID = "";
  
    //     if (item.name == undefined || item.name == "") {
    //       imageName = mapName;
    //     } else {
    //       imageName = item.name;
    //     }
    //     if (iid) {
    //       iidNameID =
    //         iid.nameId == undefined || item.nameId == "" ? "" : iid.nameId;
    //       iidSystemID =
    //         iid.systemId == undefined || item.systemId == "" ? "" : iid.systemId;
    //     }
    //     //cspImageNameID, cspImageName, cspImageGuestOS
    //     html +=
    //       "<tr onclick=\"mcpjs['vmimage/vmimagemng'].setCspVmImageInfo('" +
    //       iidNameID +
    //       "','" +
    //       imageName +
    //       "','" +
    //       item.guestOS +
    //       "');\">" +
    //       '<td class="overlay hidden" data-th="name">' +
    //       imageName +
    //       "</td>" +
    //       '<td class="btn_mtd ovm" data-th="status ">' +
    //       item.status +
    //       '<span class="ov"></span></td>' +
    //       '<td class="btn_mtd ovm" data-th="guestOS ">' +
    //       item.guestOS +
    //       '<span class="ov"></span></td>' +
    //       '<td class="overlay hidden" data-th="iidNameID">' +
    //       iidNameID +
    //       "</td>" +
    //       '<td class="overlay hidden" data-th="iidSystemID">' +
    //       iidSystemID +
    //       "</td>" +
    //       "</tr>";
    //   });
  
    //   $("#assistLookupVmImageList").empty();
    //   $("#assistLookupVmImageList").append(html);
    //   $("#lookupVmImageCount").text(data.length);
    // }
    var data = result.data.VirtualMachineImageList;
    console.log(data);
    table.setData(data);
}
  
  // 조회 실패
export function lookupVmImageListCallbackFail(error) {
    var errorMessage = error.response.data.error;
    var statusCode = error.response.status;
    mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
}

// assistPopup의 connection 정보가 바뀌면 image정보도 초기화 시킨다.
export function clearAssistImageList(targetTableList) {
    //$("#" + targetTableList).empty();
}
  // assistPopup의 connection 정보가 바뀌면 image정보도 초기화 시킨다.
  export function clearAssistLookupImageList(targetTableList) {
    //$("#" + targetTableList).empty();
}
  
//입력한 keyword 화면에 표시
export function displaySearchImageKeyword() {
    console.log($("#image_keyword").val());
    if ($("#image_keyword").val().trim() !== "") {
      $(".keyword_box").append(
        "<div class='keyword'>" +
          $("#image_keyword").val().trim() +
          "<button class='btn_del_image' onclick='delSearchImageKeyword(event)'></button></div>"
      );
    }
  }
  
  export function displaySearchImageKeywordwithEnter(e) {
    console.log($("#image_keyword").val());
    if ($("#image_keyword").val().trim() !== "" && e.keyCode === 13) {
      $(".keyword_box").append(
        "<div class='keyword'>" +
          $("#image_keyword").val().trim() +
          "<button class='btn_del_image' onclick='delSearchImageKeyword(event)'></button></div>"
      );
    }
  }
  export function displaySearchLookupImageKeywordwithEnter(e) {
    console.log($("#image_keyword").val());
    if ($("#image_keyword").val().trim() !== "" && e.keyCode === 13) {
      $(".keyword_box").append(
        "<div class='keyword'>" +
          $("#image_keyword").val().trim() +
          "<button class='btn_del_image' onclick='delSearchImageKeyword(event)'></button></div>"
      );
    }
  }

export function delSearchImageKeyword(e) {
    console.log("remove keyword");
    $(e.target).parent().remove();
  }
  
  export function delAllKeyword() {
    $(".keyword").each(function (i, item) {
      $(item).remove();
    });
  }

  
// parent로 값을 넘김
export function applyAssistValidCheck() {
    var caller = $("#parentsVmImageLookupAssist").val()
    
    //var selectedIndex = $("#assistVmSpecLookupSelectedIndex").val();// row을 클릭하면 해당 index를 저장
    
    // 선택한 provider, region check : 이미 선택된 provider, region이 있을 때 비교하여 다른 provider, region이면 confirm을 띄우고 OK면 초기화 시키고 set
    //var selectedProviderId = "";
    var selectedProviderId = $("#regProvider_lookup_assist").val();
    var selectedRegionName = $("#regRegionName_lookup_assist").val();
    var selectedCspVmImageName = "";
    var selectedCspGuestOS = ""
    var selectedCspNameId = ""
    var selectedCspSystemId = ""

    //var orgPrefix = "vmspeclookup_";    
    //var selectedProviderId = $("#" + orgPrefix + "providerId_" + selectedIndex).val();
    // var selectedRegionName = $("#" + orgPrefix + "regionName_" + selectedIndex).val();
    // var selectedCspSpecName = $("#" + orgPrefix + "cspSpecName_" + selectedIndex).val();
    // //assistVmSpecLookupSelectedIndex
    
    // var selectedProviderId = $("#regProvider_lookup_assist").val();
    //var selectedRegionName = $("#regRegionName_lookup_assist").val();
    //var selectedCspSpecName = cspSpecName;

    var selectedRows = table.getSelectedRows();
    selectedRows.forEach(function(row) {
        selectedCspVmImageName = row.getCell("name").getValue();      
        //selectedRegionName = row.getCell("region").getValue();
        selectedCspGuestOS = row.getCell("guestOS").getValue();

        selectedCspNameId = row.getCell("cspNameId").getValue();
        selectedCspSystemId = row.getCell("cspSystemId").getValue();
    });

    console.log("select_provider : ",selectedProviderId)
    console.log("selectedRegionName : ",selectedRegionName)
    console.log("selectedCspVmImageName : ",selectedCspVmImageName)

    let vmImageMap = new Map();
    vmImageMap.set("providerId", selectedProviderId);
    vmImageMap.set("regionName", selectedRegionName);
    vmImageMap.set("cspVmImageName", selectedCspVmImageName);
    vmImageMap.set("cspImageGuestOS", selectedCspGuestOS);
    vmImageMap.set("cspVmImageId", selectedCspNameId);
    vmImageMap.set("cspVmImageName", selectedCspSystemId);
    
    mcpjs['vmimage/vmimagemng'].setValuesFromAssist(caller, vmImageMap);

    $("#imageLookupAssist").modal("hide");
}