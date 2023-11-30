import "bootstrap";
import "jquery.scrollbar";
//import { SecurityGroupListComp } from "../component/list";
//import { client } from "/assets/js/util/util";
var table;
$(function () {
  // mcpjs['util/pathfinder'].getCommonCloudProviderList("securitygroupselectbox", "", "", "regProviderName")
  $(".scrollbar-inner").scrollbar();

  initTable();

  getSecurityGroupList("");
});


function initTable() {
  var tableObjParams = {}

  var columns = [
      {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
      {title:"Id", field:"id", visible: false},
      {title:"Security Group Name", field:"name", vertAlign: "middle"},      
      {title: "Description", field:"description", vertAlign: "middle", hozAlign: "center", headerSort:false},
  ]
  
  table = mcpjs["util/util"].setTabulator("securityGroupList", tableObjParams, columns)
  
  table.on("rowClick", function(e, row){
    displaySecurityGroupInfo("INFO", row.getElement())
    getSecurityGroupData(row.getCell("id").getValue(), 'info')
  });

  table.on("rowSelectionChanged", function(data, rows){
  });

  //mcpjs['util/util'].displayColumn(table)    
}

// add/delete 시 area 표시
export function displaySecurityGroupInfo(targetAction) {
  if (targetAction == "REG") {
    $("#securityGroupCreateBox").toggleClass("active");
    $("#securityGroupInfoBox").removeClass("view");
    $("#securityGroupListTable").removeClass("on");
    var offset = $("#securityGroupCreateBox").offset();
    // var offset = $("#" + target+"").offset();
    $("#TopWrap").animate({ scrollTop: offset.top }, 300);

    // form 초기화
    $("#regVpcName").val("");
    $("#regDescription").val("");
    $("#regCidrBlock").val("");
    $("#regSubnet").val("");
    mcpjs["util/common"].goFocus("securityGroupCreateBox");
  } else if (targetAction == "REG_SUCCESS") {
    $("#securityGroupCreateBox").removeClass("active");
    $("#securityGroupInfoBox").removeClass("view");
    $("#securityGroupListTable").addClass("on");

    var offset = $("#securityGroupCreateBox").offset();
    $("#TopWrap").animate({ scrollTop: offset.top }, 0);

    // form 초기화
    $("#regCspSecurityGroupName").val("");
    $("#regDescription").val("");
    $("#regProvider").val("");
    $("#regConnectionName").val("");

    $("#regVNetId").val("");
    $("#regInbound").val("");
    $("#regOutbound").val("");

    getSecurityGroupList("name");
  } else if (targetAction == "DEL") {
    $("#securityGroupCreateBox").removeClass("active");
    $("#securityGroupInfoBox").addClass("view");
    $("#securityGroupListTable").removeClass("on");

    var offset = $("#securityGroupInfoBox").offset();
    $("#TopWrap").animate({ scrollTop: offset.top }, 300);
  } else if (targetAction == "DEL_SUCCESS") {
    $("#securityGroupCreateBox").removeClass("active");
    $("#securityGroupInfoBox").removeClass("view");
    $("#securityGroupListTable").addClass("on");

    var offset = $("#securityGroupInfoBox").offset();
    $("#TopWrap").animate({ scrollTop: offset.top }, 0);

    getSecurityGroupList("name");
  } else if (targetAction == "CLOSE") {
    $("#securityGroupCreateBox").removeClass("active");
    $("#securityGroupInfoBox").removeClass("view");
    $("#securityGroupListTable").addClass("on");

    var offset = $("#securityGroupInfoBox").offset();
    $("#TopWrap").animate({ scrollTop: offset.top }, 0);
  }
}

export function deleteSecurityGroup() {
  var sgId = "";
  var count = 0;

  var securityGroupId = "";
  var selectedRows = table.getSelectedRows();
  selectedRows.forEach(function(row) {
    count++;
    securityGroupId = row.getCell("id").getValue();      
  });

  if( count == 0){
    mcpjs["util/util"].commonAlert("삭제할 대상을 선택하세요.");
    return false;
  }
  if (count > 1) {
    mcpjs["util/util"].commonAlert("삭제할 대상을 하나만 선택하세요.");
    return false;
  }

  var caller = "securitygroupmng"
  var controllerKeyName = "SecurityGroupDel";
  var optionParamMap = new Map();
  optionParamMap.set("{securityGroupId}", securityGroupId);
  var obj = {}
  mcpjs["util/pathfinder"].deleteCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs["securitygroup/securitygroupmng"].securityGroupDelCallbackSuccess );


  // $("input[name='chk']:checked").each(function () {
  //   count++;
  //   sgId = sgId + $(this).val() + ",";
  // });
  // sgId = sgId.substring(0, sgId.lastIndexOf(","));

  // console.log("sgId : ", sgId);
  // console.log("count : ", count);

  // if (sgId == "") {
  //   mcpjs["util/util"].commonAlert("삭제할 대상을 선택하세요.");
  //   return false;
  // }

  // if (count != 1) {
  //   mcpjs["util/util"].commonAlert("삭제할 대상을 하나만 선택하세요.");
  //   return false;
  // }

  // //var url = CommonURL + "/ns/" + NAMESPACE + "/resources/securityGroup/" + sgId;
  // var url = "/settings/resources" + "/securitygroup/del/" + sgId;

  // client
  //   .delete(url, {
  //     headers: {
  //       // 'Authorization': "{{ .apiInfo}}",
  //       "Content-Type": "application/json",
  //     },
  //   })
  //   .then((result) => {
  //     var data = result.data;
  //     console.log(result);
  //     console.log(data);
  //     if (result.status == 200 || result.status == 201) {
  //       mcpjs["util/util"].commonAlert(data.message);
  //       // location.reload(true);
  //       mcpjs["securitygroup/securitygroupmng"].displaySecurityGroupInfo(
  //         "DEL_SUCCESS"
  //       );
  //     } else {
  //       mcpjs["util/util"].commonAlert(data.error);
  //     }
  //     // }).catch(function(error){
  //     //     console.log("sg del error : ",error);
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

// 삭제 완료 
export function securityGroupDelCallbackSuccess(caller, result){
  var data = result.data;
  console.log(result);
  console.log(data);
  if (result.status == 200 || result.status == 201) {
    mcpjs["util/util"].commonAlert(data.message);    
    mcpjs["securitygroup/securitygroupmng"].displaySecurityGroupInfo("DEL_SUCCESS");
  } else {
    mcpjs["util/util"].commonAlert(data.error);
  }
}

// Security Group 목록 조회
function getSecurityGroupList(sortType) {
  //mcpjs["util/pathfinder"].getCommonSecurityGroupList(
  //  "securitygroupmng",
  //  sortType
  //);

  var caller = "securitygroupmng";
  var actionName = "SecurityGroupList";
  var optionParamMap = new Map();
  mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['securitygroup/securitygroupmng'].getSecurityGroupListCallbackSuccess)
}

export function getSecurityGroupListCallbackFail(error) {
  var errorMessage = error.response.data.error;
  var statusCode = error.response.status;
  mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
}

//export function getSecurityGroupListCallbackSuccess(data, sortType) {
export function getSecurityGroupListCallbackSuccess(caller, result) {
  console.log(result);
  // var data = result.data.vNet;
  var data = result.data.SecurityGroupList;
  console.log(data);

  table.setData(data);

  // var html = "";
  // console.log("Data : ", data);

  // if (data == null) {
  //   html +=
  //     '<tr><td class="overlay hidden" data-th="" colspan="5">No Data</td></tr>';

  //   $("#sgList").empty();
  //   $("#sgList").append(html);

  //   ModalDetail();
  // } else {
  //   new SecurityGroupListComp(document.getElementById("sgList"), data);
  //   ModalDetail();
  // }
}

export function getSecurityGroupData(securityGroupId, mode){
  $('#securityGroupMode').val(mode)

  var caller = "securityGroupMng";
  var actionName = "SecurityGroupGet";
  var optionParamMap = new Map();
  optionParamMap.set("{securityGroupId}", securityGroupId)
  //mcpjs['util/pathfinder'].getCommonData("vpcmng", "VpcData", optionParamMap, mcpjs['network/vnetmng'].getVpcDataCallbackSuccess)
  mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['securitygroup/securitygroupmng'].getSecurityGroupCallbackSuccess)
  
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

export function getSecurityGroupCallbackSuccess(caller, result){
  var data = result.data.SecurityGroupInfo;
  console.log("Show Data : ", data);

  var dtlSecurityGroupName = data.name;
  var dtlCspSecurityGroupName = data.cspSecurityGroupName;
  var dtlDescription = data.description;
  //var dtlConnectionName = data.connectionName;
  var dtlProviderId = data.providerId;
  var dtlRegionName = data.regionName;
  var dtlvNetId = data.vNetId;

  var dtlFirewall = data.firewallRules;
  console.log("firefire : ", dtlFirewall);
  var inbounds = "";
  var outbounds = "";
  var cidrs = "";
  for (var i in dtlFirewall) {
    console.log("direc : ", dtlFirewall[i].direction);
    var firewallDirection = dtlFirewall[i].direction.toLowerCase();
    if (firewallDirection == "inbound" || firewallDirection == "ingress") {
      inbounds += dtlFirewall[i].ipProtocol;
      inbounds +=
        " " + dtlFirewall[i].fromPort + "~" + dtlFirewall[i].toPort + " ";
    } else if (
      firewallDirection == "outbound" ||
      firewallDirection == "egress"
    ) {
      outbounds += dtlFirewall[i].ipProtocol;
      outbounds +=
        " " + dtlFirewall[i].fromPort + "~" + dtlFirewall[i].toPort + " ";
    } else {
      // 정의되지 않은 항목은 inbound쪽에 몰아주기
      inbound += dtlFirewall[i].ipProtocol;
      inbounds +=
        " " + dtlFirewall[i].fromPort + "~" + dtlFirewall[i].toPort + " ";
    }
    cidrs += dtlFirewall[i].cidr + " ";
  }
  console.log(cidrs);
  // console.log(dtlvNetId);
  $("#dtlCspSecurityGroupName").empty();
  $("#dtlDescription").empty();
  $("#dtlProvider").empty();
  $("#dtlConnectionName").empty();
  $("#dtlvNetId").empty();
  $("#dtlInbound").empty();
  $("#dtlOutbound").empty();
  $("#dtlCidr").empty();

  $("#dtlCspSecurityGroupName").val(dtlCspSecurityGroupName);
  $("#dtlDescription").val(dtlDescription);
  $("#dtlProvider").val(dtlProviderId);
  $("#dtlRegionName").val(dtlRegionName);
  //$('#dtlConnectionName').val(dtlConnectionName);
  $("#dtlvNetId").val(dtlvNetId);
  $("#dtlInbound").append(inbounds);
  $("#dtlOutbound").append(outbounds);
  $("#dtlCidr").append(cidrs);

  $(".stxt").html(dtlSecurityGroupName);


  //getProviderNameByConnection(dtlConnectionName, 'dtlProvider')// provider는 connection 정보에서 가져옴

  mcpjs["securitygroup/securitygroupmng"].displaySecurityGroupInfo("DEL"); // 상세 area 보여주고 focus이동
}
export function showSecurityGroupInfo(sgName) {
  console.log("sgName showSecurityGroupInfo : ", sgName);
  //var sgName = target;

  $(".stxt").html(sgName);

  // var apiInfo = "{{ .apiInfo}}";

  // var url = CommonURL+"/ns/"+NAMESPACE+"/resources/securityGroup/"+ sgName;
  var url = "/settings/resources" + "/securitygroup/id/" + sgName;
  console.log("security group URL : ", url);

  return axios
    .get(url, {
      headers: {
        // 'Authorization': apiInfo
      },
    })
    .then((result) => {
      //var data = result.data
      console.log(result.data);
      var data = result.data.SecurityGroupInfo;
      console.log("Show Data : ", data);

      var dtlCspSecurityGroupName = data.cspSecurityGroupName;
      var dtlDescription = data.description;
      //var dtlConnectionName = data.connectionName;
      var dtlProviderId = data.providerId;
      var dtlRegionName = data.regionName;
      var dtlvNetId = data.vNetId;

      var dtlFirewall = data.firewallRules;
      console.log("firefire : ", dtlFirewall);
      var inbounds = "";
      var outbounds = "";
      var cidrs = "";
      for (var i in dtlFirewall) {
        console.log("direc : ", dtlFirewall[i].direction);
        var firewallDirection = dtlFirewall[i].direction.toLowerCase();
        if (firewallDirection == "inbound" || firewallDirection == "ingress") {
          inbounds += dtlFirewall[i].ipProtocol;
          inbounds +=
            " " + dtlFirewall[i].fromPort + "~" + dtlFirewall[i].toPort + " ";
        } else if (
          firewallDirection == "outbound" ||
          firewallDirection == "egress"
        ) {
          outbounds += dtlFirewall[i].ipProtocol;
          outbounds +=
            " " + dtlFirewall[i].fromPort + "~" + dtlFirewall[i].toPort + " ";
        } else {
          // 정의되지 않은 항목은 inbound쪽에 몰아주기
          inbound += dtlFirewall[i].ipProtocol;
          inbounds +=
            " " + dtlFirewall[i].fromPort + "~" + dtlFirewall[i].toPort + " ";
        }
        cidrs += dtlFirewall[i].cidr + " ";
      }
      console.log(cidrs);
      // console.log(dtlvNetId);
      $("#dtlCspSecurityGroupName").empty();
      $("#dtlDescription").empty();
      $("#dtlProvider").empty();
      $("#dtlConnectionName").empty();
      $("#dtlvNetId").empty();
      $("#dtlInbound").empty();
      $("#dtlOutbound").empty();
      $("#dtlCidr").empty();

      $("#dtlCspSecurityGroupName").val(dtlCspSecurityGroupName);
      $("#dtlDescription").val(dtlDescription);
      $("#dtlProvider").val(dtlProviderId);
      $("#dtlRegionName").val(dtlRegionName);
      //$('#dtlConnectionName').val(dtlConnectionName);
      $("#dtlvNetId").val(dtlvNetId);
      $("#dtlInbound").append(inbounds);
      $("#dtlOutbound").append(outbounds);
      $("#dtlCidr").append(cidrs);

      //getProviderNameByConnection(dtlConnectionName, 'dtlProvider')// provider는 connection 정보에서 가져옴

      mcpjs["securitygroup/securitygroupmng"].displaySecurityGroupInfo("DEL"); // 상세 area 보여주고 focus이동
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    });
}

// Inbound / Outbound Modal 표시
export function displayInOutBoundRegModal(isShow) {
  if (isShow) {
    var selectedProviderId = $("#regProvider option:selected").val();
    console.log("provider " + selectedProviderId);
    if (selectedProviderId == "") {
      mcpjs["util/util"].commonAlert("Please select a provider first");
      return;
    }
    // mcpjs["util/common"].setTableHeightForScroll('firewallRSlistTbl', 300);
    console.log("here1");
    console.log($("#firewallRegisterBox"));
    $("#firewallRegisterBox").modal("show");
    console.log("here2");
    // $('.scrollbar-inner').scrollbar();
  } else {
    console.log("here3");
    $("#securityGroupCreateBox").toggleClass("active");
  }
}

var fwrsJsonList = new Array();//firewall rule set 저장할 array. 전역으로 선언
export function createSecurityGroup() {
  var cspSecurityGroupName = $("#regCspSecurityGroupName").val();
  var description = $("#regDescription").val();
  var providerId = $("#regProviderName option:selected").val();
  var regionName = $("#regRegionName option:selected").val();
  //var connectionName = $("#regConnectionName").val();
  var vNetId = $("#regVNetId").val();

  if (!cspSecurityGroupName) {
    mcpjs["util/util"].commonAlert("Input New Security Group Name");
    $("#regCspSshKeyName").focus();
    return;
  }

  // connection 이 GCP인 경우 체크 : inbound/outbund는 1종류만 가능, cidrBlock 필수
  // 여기에서도 check가 필요할 까? fwrsJsonList -> 돌아야 함.

  console.log("cspSecurityGroupName : ", cspSecurityGroupName);
  console.log("description : ", description);
  console.log("provider : ", providerId);
  //console.log("connectionName : ", connectionName);
  console.log("vNetId : ", vNetId);
  console.log("fwrsJsonList : ", fwrsJsonList); // TODO : firewallRuleSet 비어있으면 에러나므로 valid check 필요

  var obj = {
    //connectionName: connectionName,
    description: description,
    firewallRules: fwrsJsonList,
    name: cspSecurityGroupName,
    vNetId: vNetId,

    providerId: providerId,
    regionName: regionName,
  };
  console.log("info connectionconfig obj Data : ", obj);
  if (cspSecurityGroupName) {
    var controllerKeyName = "SecuritygroupReg";
    var optionParamMap = new Map();
    mcpjs["util/pathfinder"].postCommonData(
      "securitygroupmng",
      controllerKeyName,
      optionParamMap,
      obj,
      mcpjs["securitygroup/securitygroupmng"].securityGroupRegCallbackSuccess
    );
  }

  //   client
  //     .post(url, obj, {
  //       headers: {
  //         "Content-type": "application/json",
  //       },
  //     })
  //     .then((result) => {
  //       console.log("result sg : ", result);
  //       if (result.status == 200 || result.status == 201) {
  //         mcpjs["util/util"].commonAlert("Success Create Security Group!!");
  //         //displaySecurityGroupInfo("REG_SUCCESS");
  //         //등록하고 나서 화면을 그냥 고칠 것인가?
  //         mcpjs["securitygroup/securitygroupmng"].displaySecurityGroupInfo(
  //           "REG_SUCCESS"
  //         );
  //         //아니면 화면을 리로딩 시킬것인가?
  //         // location.reload();
  //         // $("#btn_add2").click()
  //         // $("#namespace").val('')
  //         // $("#nsDesc").val('')
  //       } else {
  //         mcpjs["util/util"].commonAlert("Fail Create Security Group");
  //       }
  //       // }).catch(function(error){
  //     })
  //     .catch((error) => {
  //       console.warn(error);
  //       console.log(error.response);

  //       console.log("sg create error : ");

  //       //return c.JSON(http.StatusBadRequest, map[string]interface{}{
  //       // 	"message": respStatus.Message,
  //       // 	"status":  respStatus.StatusCode,
  //       // })
  //       // console.log(error.response.data);
  //       // console.log("Status", error.response.status);// map interface의 status
  //       // console.log("Error", error.response.data.error);// map interface의 message
  //       // console.log('Error', error.message);// [0]번째 param : http.StatusBadRequest

  //       // message는 , 로 나눈 뒤 : 를 기준으로 key,value로 파싱하면 될 것 같음.
  //       // console.log(error.config);
  //     });
  // } else {
  //   mcpjs["util/util"].commonAlert("Input Security Group Name");
  //   $("#regCspSecurityGroupName").focus();
  //   return;
  // }
}

export function securityGroupRegCallbackSuccess(caller, result) {
  if (result.status == 200 || result.status == 201) {
    mcpjs["util/util"].commonAlert("Success Create Security Group!!");
    
    mcpjs["securitygroup/securitygroupmng"].displaySecurityGroupInfo("REG_SUCCESS");
    //아니면 화면을 리로딩 시킬것인가?
    // location.reload();
    // $("#btn_add2").click()
    // $("#namespace").val('')
    // $("#nsDesc").val('')
  } else {
    mcpjs["util/util"].commonAlert("Fail Create Security Group");
  }
}


// assitPopup에서 값을 설정하여 보내 줌. assistObj가 key, value 형태의 map일 수도 있고 key, array 형태일 수도 있어서 caller에 따라 달리 처리한다.
export function setValuesFromAssist(caller, assistObj){
  console.log("setValuesFromAssist", caller)
  console.log("assistObj", assistObj)

  // 해당 값 set
  if (caller == "FirewallRuleSetAssist"){
    var inbound = "";
    var outbound = "";
    for (var i in assistObj) {
        console.log(assistObj[i]);
        if (assistObj[i].direction == "inbound") {
            inbound += assistObj[i].ipProtocol
                + ' ' + assistObj[i].fromPort + '~' + assistObj[i].toPort + ' '
        } else if (assistObj[i].direction == "outbound") {
            outbound += assistObj[i].ipProtocol
                + ' ' + assistObj[i].fromPort + '~' + assistObj[i].toPort + ' '
        }
    }
    console.log("ininin : ", inbound);
    console.log("outoutout : ", outbound);

    $("#regInbound").empty();
    $("#regOutbound").empty();
    $("#regInbound").append(inbound);
    $("#regOutbound").append(outbound);
    fwrsJsonList = assistObj;
  
  }
}
