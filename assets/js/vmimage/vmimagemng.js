import { Modal } from "bootstrap";
//import { VmImageListComp } from "../component/list";
//import { client } from "/assets/js/util/util";

var table;
$(() => {
  // mcpjs["util/common"].setTableHeightForScroll('serverImageList', 300)
  //mcpjs['util/pathfinder'].getCommonCloudProviderList("vmspecselectbox", "", "", "regProvider")
  
  $(".btn_assist").on("click", function () {
    // lookupVmImageList()
    showImageAssistPopup();
  });

  initTable();

  getVirtualMachineImageList("");
});

function initTable() {
  var tableObjParams = {}

  var columns = [
      {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
      {title:"Id", field:"id", visible: false},
      {title:"Connection", field:"connectionName", visible: false},
      {title:"Name", field:"name", vertAlign: "middle"},
      {title:"CSP Image Name", field:"cspImageName", vertAlign: "middle"},
      {title: "Description", field:"description", vertAlign: "middle", hozAlign: "center", headerSort:false},
  ]
  

  table = mcpjs["util/util"].setTabulator("vmImageList", tableObjParams, columns)
  
  table.on("rowClick", function(e, row){
      getVmImageData(row.getCell("id").getValue(), 'info')
  });

  table.on("rowSelectionChanged", function(data, rows){
  });

  mcpjs['util/util'].displayColumn(table)    
}

// 등록/상세 area 보이기 숨기기
export function displayVirtualMachineImageInfo(targetAction) {
  if (targetAction == "REG") {
    $("#virtualMachineImageCreateBox").toggleClass("active");
    $("#virtualMachineImageInfoBox").removeClass("view");
    $("#virtualMachineImageListTable").removeClass("on");
    var offset = $("#virtualMachineImageCreateBox").offset();
    // var offset = $("#" + target+"").offset();
    $("#TopWrap").animate({ scrollTop: offset.top }, 300);

    // form 초기화
    $("#regImageName").val("");
    $("#regCspImgId").val("");
    $("#regCspImgName").val("");
    $("#regGuestOS").val("");
    $("#regDescription").val("");

    $("#assistVmImage").css("display", "block");
    mcpjs["util/common"].goFocus("virtualMachineImageCreateBox");
  } else if (targetAction == "REG_SUCCESS") {
    $("#virtualMachineImageCreateBox").removeClass("active");
    $("#virtualMachineImageInfoBox").removeClass("view");
    $("#virtualMachineImageListTable").addClass("on");

    // form 초기화
    $("#regImageName").val("");
    $("#regCspImgId").val("");
    $("#regCspImgName").val("");
    $("#regGuestOS").val("");
    $("#regProvider").val("");
    $("#regConnectionName").val("");
    $("#regDescription").val("");

    var offset = $("#virtualMachineImageCreateBox").offset();
    $("#TopWrap").animate({ scrollTop: offset.top }, 0);

    getVirtualMachineImageList("name");
  } else if (targetAction == "DEL") {
    $("#virtualMachineImageCreateBox").removeClass("active");
    $("#virtualMachineImageInfoBox").addClass("view");
    $("#virtualMachineImageListTable").removeClass("on");

    var offset = $("#virtualMachineImageInfoBox").offset();
    $("#TopWrap").animate({ scrollTop: offset.top }, 300);
  } else if (targetAction == "DEL_SUCCESS") {
    $("#virtualMachineImageCreateBox").removeClass("active");
    $("#virtualMachineImageInfoBox").removeClass("view");
    $("#virtualMachineImageListTable").addClass("on");

    var offset = $("#virtualMachineImageInfoBox").offset();
    $("#TopWrap").animate({ scrollTop: offset.top }, 0);

    getVirtualMachineImageList("name");
  } else if (targetAction == "CLOSE") {
    $("#virtualMachineImageCreateBox").removeClass("active");
    $("#virtualMachineImageInfoBox").removeClass("view");
    $("#virtualMachineImageListTable").addClass("on");

    var offset = $("#virtualMachineImageInfoBox").offset();
    $("#TopWrap").animate({ scrollTop: offset.top }, 0);
  }
}

export function deleteVirtualMachineImage() {
  var imageId = "";
  var count = 0;

  var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a VM Image!!");
        return;
    }

    var selImageId = "";
    selectedRows.forEach(function (row) {
      selImageId = row.getCell("id").getValue();
    });

    var caller = "vmimagemng";
    var controllerKeyName = "VmImageDel";
    var optionParamMap = new Map();
    optionParamMap.set("{vmImageId}", selImageId);    
    var obj = {}
    mcpjs["util/pathfinder"].deleteCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs["vmimage/vmimagemng"].vmImageDelCallbackSuccess );

  // $("input[name='chk']:checked").each(function () {
  //   count++;
  //   imageId = imageId + $(this).val() + ",";
  // });
  // imageId = imageId.substring(0, imageId.lastIndexOf(","));

  // console.log("imageId : ", imageId);
  // console.log("count : ", count);

  // if (imageId == "") {
  //   mcpjs["util/util"].commonAlert("삭제할 대상을 선택하세요.");
  //   return false;
  // }

  // if (count != 1) {
  //   mcpjs["util/util"].commonAlert("삭제할 대상을 하나만 선택하세요.");
  //   return false;
  // }

  // // var url = CommonURL + "/ns/" + NAMESPACE + "/resources/image/" + imageId;
  // //var u = SpiderURL + "/vmimage/" + imageId;
  // var url = "/settings/resources" + "/vmimage/id/" + imageId;

  // client
  //   .delete(url, {
  //     headers: {
  //       // 'Authorization': "{{ .apiInfo}}",
  //       "Content-Type": "application/json",
  //     },
  //   })
  //   .then((result) => {
  //     var data = result.data;
  //     console.log(data);
  //     if (result.status == 200 || result.status == 201) {
  //       // commonAlert("Success Delete Image.");
  //       mcpjs["util/util"].commonAlert(data.message);
  //       displayVirtualMachineImageInfo("DEL_SUCCESS");
  //       // location.reload(true);
  //     } else {
  //       mcpjs["util/util"].commonAlert(data.error);
  //     }
  //     // }).catch(function(error){
  //     //     console.log("image delete error : ",error);
  //     // });
  //   })
  //   .catch((error) => {
  //     console.warn(error);
  //     console.log(error.response);
  //     var errorMessage = error.response.data.error;
  //     var statusCode = error.response.status;
  //     mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
  //   });
}

export function vmImageDelCallbackSuccess(caller, result){
  var data = result.data;
  console.log(data);
  if (result.status == 200 || result.status == 201) {
    mcpjs["util/util"].commonAlert(data.message);
    displayVirtualMachineImageInfo("DEL_SUCCESS");

  } else {
    mcpjs["util/util"].commonAlert(data.error);
  }
}

export function getVirtualMachineImageList(sort_type) {
  // console.log("여기 : ", sort_type);
  // var sortType = sort_type;
  // console.log("sortType : ", sortType);

  // mcpjs["util/pathfinder"].getCommonVirtualMachineImageList(
  //   "vmimagemng",
  //   sortType
  // );

  var caller = "vmimagemng";
  var actionName = "VmImageList";
  var optionParamMap = new Map();
  mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['vmimage/vmimagemng'].virtualMachineImageListCallbackSuccess)
}


export function virtualMachineImageListCallbackSuccess(caller, result) {
  var data = result.data.VirtualMachineImageList;
  console.log(data);
  table.setData(data);
}

export function getImageListCallbackFail(error) {
  console.warn(error);
  // console.log(error.response)
  // var errorMessage = error.response.data.error;
  // var statusCode = error.response.status;
  // mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
}

// deprecated
export function setVirtualMachineImageListAtServerImage(data, sortType) {
  var html = "";
  console.log(data); // TODO : no Data 일 때 (ex. 모든 이미지 삭제 등) data.length에서 오류 남.
  console.log("here Set : ", sortType);

  if (data == null) {
    html +=
      '<tr><td class="overlay hidden" data-th="" colspan="5">No Data</td></tr>';

    $("#imgList").empty();
    $("#imgList").append(html);
    //console.log("setVirtualMachineImageListAtServerImage completed");
    ModalDetail();
  } else {
    new VmImageListComp(document.getElementById("imgList"), data);
    ModalDetail();
  }
}

// vmImage 단건 조회
function getVmImageData(vmImageId, mode){
  $('#vmImageMode').val(mode)

  var caller = "vmimagemng";
  var actionName = "VmImageGet";
  var optionParamMap = new Map();
  optionParamMap.set("{vmImageId}", vmImageId);
  mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['vmimage/vmimagemng'].getVmImageCallbackSuccess);

}

export function getVmImageCallbackSuccess(caller, result){
  var data = result.data.VirtualMachineImageInfo;
  console.log("Show Data : ", data);
  var dtlImageName = data.name;
  var dtlConnectionName = data.connectionName;
  var dtlProviderId = data.providerId;
  var dtlRegionName = data.regionName;
  var dtlImageId = data.id;
  var dtlGuestOS = data.guestOS;
  var dtlDescription = data.description;
  var dtlCspImageName = data.cspImageName;
  var dtlCspImageId = data.cspImageId;

  $("#dtlImageName").empty();
  $("#dtlProvider").empty();
  $("#dtlConnectionName").empty();
  $("#dtlImageId").empty();
  $("#dtlGuestOS").empty();
  $("#dtlDescription").empty();
  $("#dtlCspImageName").empty();
  $("#dtlCspImageId").empty();

  $("#dtlImageName").val(dtlImageName);
  //$("#dtlConnectionName").val(dtlConnectionName);
  $("#dtlProvider").val(dtlProviderId);
  $("#dtlRegionName").val(dtlRegionName);
  $("#dtlImageId").val(dtlImageId);
  $("#dtlGuestOS").val(dtlGuestOS);
  $("#dtlDescription").val(dtlDescription);
  $("#dtlCspImageName").val(dtlCspImageName);
  $("#dtlCspImageId").val(dtlCspImageId);

  $(".stxt").html(dtlImageId);

  displayVirtualMachineImageInfo("DEL")
}

function ModalDetail() {
  $(".dashboard .status_list tbody tr").each(function () {
    var $td_list = $(this),
      $status = $(".detail_box"),
      $detail = $(".server_info");
    $td_list.off("click").click(function () {
      $td_list.addClass("on");
      $td_list.siblings().removeClass("on");
      $status.addClass("view");
      $status.siblings().removeClass("on");
      $(".dashboard.register_cont").removeClass("active");
      $(".dashboard.edit_box").removeClass("view");
      $td_list.off("click").click(function () {
        if ($(this).hasClass("on")) {
          console.log("reg ok button click");
          $td_list.removeClass("on");
          $status.removeClass("view");
          $detail.removeClass("active");
        } else {
          $td_list.addClass("on");
          $td_list.siblings().removeClass("on");
          $status.addClass("view");

          $status.siblings().removeClass("view");
          $(".dashboard.register_cont").removeClass("active");
          $(".dashboard.edit_box").removeClass("view");
        }
      });
    });
  });
}

export function createVirtualMachineImage() {
  var imgId = $("#regImageName").val();
  var imgName = $("#regImageName").val();
  var cspImgId = $("#regCspImgId").val();
  var guestOS = $("#regGuestOS").val();
  var providerId = $("#regProviderName").val();
  var regionName = $("#regRegionName").val();
  var description = $("#regDescription").val();

  var cspImgName = "";
  if (!cspImgName) {
    $("#regCspImgName").val();
  }

  console.log(
    "check obj : " +
      imgId +
      ", " +
      imgName +
      ", " +
      cspImgId +
      ", " +
      cspImgName +
      ", " +
      guestOS +
      ", " +
      description
  );

  if (!imgName) {
    mcpjs["util/util"].commonAlert("Input New Image Name");
    $("#regImageName").focus();
    return;
  }

  // var apiInfo = "{{ .apiInfo}}";
  // var url = CommonURL+"/ns/"+NAMESPACE+"/resources/image?action=registerWithInfo"
  var url = "/settings/resources" + "/vmimage";
  console.log("Image Reg URL : ", url);
  var obj = {
    cspImageId: cspImgId,
    cspImageName: cspImgName,
    description: description,
    guestOS: guestOS,
    id: imgId,
    name: imgName,
    providerId: providerId,
    providerName: providerId,
    regionName: regionName,
  };
  console.log("info image obj Data : ", obj);

  if (imgName) {
    var caller = "createVirtualMachineImage";
    var controllerKeyName = "VmImageReg";
    var optionParamMap = new Map();
    mcpjs["util/pathfinder"].postCommonData(
      caller,
      controllerKeyName,
      optionParamMap,
      obj,
      mcpjs["vmimage/vmimagemng"].vmImageRegCallbackSuccess,
      mcpjs["vmimage/vmimagemng"].vmImageRegCallbackFail
    );

    // client
    //   .post(url, obj, {
    //     headers: {
    //       "Content-type": "application/json",
    //       // 'Authorization': apiInfo,
    //     },
    //   })
    //   .then((result) => {
    //     console.log("result image : ", result);
    //     if (result.status == 200 || result.status == 201) {
    //       mcpjs["util/util"].commonAlert("Success Create Image!!");
    //       //등록하고 나서 화면을 그냥 고칠 것인가?
    //       displayVirtualMachineImageInfo("REG_SUCCESS");
    //       //아니면 화면을 리로딩 시킬것인가?
    //       // location.reload();
    //       // $("#btn_add2").click()
    //       // $("#namespace").val('')
    //       // $("#nsDesc").val('')
    //     } else {
    //       mcpjs["util/util"].commonAlert("Fail Create Image)");
    //     }
    //     // }).catch(function(error){
    //     //     console.log("image create error : ",error);
    //     // });
    //   })
    //   .catch((error) => {
    //     console.warn(error);
    //     console.log(error.response);
    //     var errorMessage = error.response.data.error;
    //     var statusCode = error.response.status;
    //     mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    //   });
  } else {
    mcpjs["util/util"].commonAlert("Input Image Name");
    $("#regImageName").focus();
    return;
  }
}

export function vmImageRegCallbackSuccess(caller, result) {
  console.log("result image : ", result);
  if (result.status == 200 || result.status == 201) {
    mcpjs["util/util"].commonAlert("Success Create Image!!");
    //등록하고 나서 화면을 그냥 고칠 것인가?
    displayVirtualMachineImageInfo("REG_SUCCESS");
    //아니면 화면을 리로딩 시킬것인가?
    // location.reload();
    // $("#btn_add2").click()
    // $("#namespace").val('')
    // $("#nsDesc").val('')
  } else {
    mcpjs["util/util"].commonAlert("Fail Create Image)");
  }
  // }).catch(function(error){
  //     console.log("image create error : ",error);
  // });
}

export function vmImageRegCallbackFail(caller, error) {
  console.warn(error);
  console.log(error.response);
  var errorMessage = error.response.data.error;
  var statusCode = error.response.status;
  mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
}

// vmImage의 상세정보 표시.
export function showVirtualMachinImageInfo(target) {
  console.log("target showInfo : ", target);
  // var apiInfo = "{{ .apiInfo}}";
  //var imageId = encodeURIComponent(target);
  $(".stxt").html(target);
  $("#assistVmImage").css("display", "none");

  var url = "/settings/resources/vmimage/id/" + target;
  console.log("image detail URL : ", url);

  return axios
    .get(url, {
      headers: {
        // 'Authorization': apiInfo
      },
    })
    .then((result) => {
      var data = result.data.VirtualMachineImageInfo;
      console.log("Show Data : ", data);
      var dtlImageName = data.name;
      var dtlConnectionName = data.connectionName;
      var dtlProviderId = data.providerId;
      var dtlRegionName = data.regionName;
      var dtlImageId = data.id;
      var dtlGuestOS = data.guestOS;
      var dtlDescription = data.description;
      var dtlCspImageName = data.cspImageName;
      var dtlCspImageId = data.cspImageId;

      $("#dtlImageName").empty();
      $("#dtlProvider").empty();
      $("#dtlConnectionName").empty();
      $("#dtlImageId").empty();
      $("#dtlGuestOS").empty();
      $("#dtlDescription").empty();
      $("#dtlCspImageName").empty();
      $("#dtlCspImageId").empty();

      $("#dtlImageName").val(dtlImageName);
      //$("#dtlConnectionName").val(dtlConnectionName);
      $("#dtlProvider").val(dtlProviderId);
      $("#dtlRegionName").val(dtlRegionName);
      $("#dtlImageId").val(dtlImageId);
      $("#dtlGuestOS").val(dtlGuestOS);
      $("#dtlDescription").val(dtlDescription);
      $("#dtlCspImageName").val(dtlCspImageName);
      $("#dtlCspImageId").val(dtlCspImageId);
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    });
}

// Assist Popup
function showImageAssistPopup() {
  var provider = $("#regProviderName").val();
  var regionName = $("#regRegionName").val();

  if (provider) {
    $("#regProvider_lookup_assist").val(provider);
    // $("#assistImageProviderName option[value=" + configName + "]").prop('selected', true).change();
  } else {
    alert("Please Select Provider and Region!!");
    return;
  }

  if (regionName) {
    $("#regRegionName_lookup_assist").val(regionName);
    // console.log("showImageAssistPopup conn " + connectionName)
    // $("#assistImageConnectionName option[value=" + connectionName + "]").prop('selected', true).change();
    $("#imageLookupAssist").modal("toggle");
    //lookupVmImageList(provider, regionName);
  } else {
    alert("Please Select Provider and Region!!");
    return;
  }
}

// popup에서 넘긴 data를 화면에 set.
export function setValuesFromAssist(caller, assistMap){
  console.log("setValuesFromAssist", caller)
  console.log("assistMap", assistMap)
  
  var assistProviderId = assistMap.get("providerId");
  var assistRegionName = assistMap.get("regionName");
  var assistCspVmImageId = assistMap.get("cspVmImageId");
  var assistCspVmImageName = assistMap.get("cspVmImageName");
  var assistCspVmImageGuestOS = assistMap.get("cspImageGuestOS");
  $("#regCspImgId").val(assistCspVmImageId);
  $("#regCspImgName").val(assistCspVmImageName);
  $("#regGuestOS").val(assistCspVmImageGuestOS);
  
  $("#regProvider").val(assistProviderId);
  $("#regRegionName").val(assistRegionName);

}
// deprecated. popup에서 main의 txtbox로 set
export function setCspVmImageInfo(
  cspImageNameID,
  cspImageName,
  cspImageGuestOS
) {
  $("#regCspImgId").val(cspImageNameID);
  $("#regCspImgName").val(cspImageName);
  $("#regGuestOS").val(cspImageGuestOS);
  var providerId = $("#regProvider_lookup_assist").val();
  var regionName = $("#regRegionName_lookup_assist").val();

  $("#regRegionName").val(regionName);
  $("#regProvider").val(providerId);

  $("#imageLookupAssist").modal("hide");
}

// connection 정보가 바뀌면 image 정보도 초기화 시킨다.
export function clearCspImageInfo() {
  $("#regCspImgId").val();
  $("#regCspImgName").val();
  $("#regGuestOS").val();
}



