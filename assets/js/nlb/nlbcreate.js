
$(function () {
  // 생성 완료 시 List화면으로 page이동
  $("#alertResultArea").on("hidden.bs.modal", function () {
    // bootstrap 3 또는 4
    mcpjs["util/util"].changePage("NlbMngForm");
  });

  // $('#nlbCreateBox .btn_mcissubgroup').on('click', function () {
  $(".btn_mcissubgroup").on("click", function () {
    console.log("btn_mcissubgroup clicked");
    var caller = "nlbcreate";
    var vpcId = $("#regVNetId").val();

    //if(vpcId == "" || vpcId == null) {
    //    mcpjs['util/util'].commonAlert("VPC ID를 선택해주세요.");
    //    return;
    //}
    mcpjs["mcismng/subgrouplist_modal"].setSubgroupListAssist(caller, vpcId);
  });

  $(".btn_ok").on("click", function () {
    mcpjs['nlb/nlbcreate'].createNlb()
  });

  $(".btn_cancel").on("click", function () {
    mcpjs['nlb/nlbmng'].displayNlbInfo('CLOSE')
  });

});

export function setAssistSubGroup(mcisId, subGroupId, vmIdList) {
  console.log("setAssistSubGroup");
  console.log("mcisId", mcisId);
  console.log("subGroupId", subGroupId);
  console.log("vmIdList", vmIdList);
  $("#tg_vms").empty();
  $("#tg_mcisId").val(mcisId);

  $("#tg_vms").val(vmIdList);
  $("#tg_subGroupId").val(subGroupId);
}

export function createNlb() {
  console.log("enter createNlb");
  var nlbName = $("#reg_name").val();
  var description = $("#reg_description").val();

  var providerId = $("#regProvider").val();
  var regionName = $("#regRegionName").val();
 // var connectionName = $("#regConnectionName").val();

  // Health Check
  var hcThreshold = $("#hc_threshold").val();
  var hcInterval = $("#hc_interval").val();
  var hcTimeout = $("#hc_timeout").val();

  // Listener
  var lsProtocol = $("#ls_protocol").val();
  var lsPort = $("#ls_port").val();
  
  // Target Group
  var tgVms = $("#tg_vms").val();
  var tgProtocol = $("#tg_protocol").val();
  var tgPort = $("#tg_port").val();
  var tgSubGroupId = $("#tg_subGroupId").val();

  var vNetId = $("#regVNetId").val();
  var mcisId = $("#tg_mcisId").val();
  
  if (!nlbName) {
      mcpjs["util/util"].commonAlert("Input New NLB Name");
      $("#reg_name").focus();
      return;
  }
  if (!providerId) {
      mcpjs["util/util"].commonAlert("Please Select Provider!!");
      $("#regProvider").focus();
      return;
  }
  if (!regionName) {
      mcpjs["util/util"].commonAlert("Please Select RegionName!!");
      $("#regRegionName").focus();
      return;
  }

  // var url = "/operations/service/nlb/";
  // console.log("nlb URL : ", url);

  var healthCheckerObj = {
      threshold: hcThreshold,
      interval: hcInterval,
      timeout: hcTimeout,
  };

  var listenerObj = {
      protocol: lsProtocol,
      port: lsPort
  };

  var targetGroupObj = {
      protocol: tgProtocol,
      port: tgPort,
      //vms: tgVms.split(","),
      subGroupId: tgSubGroupId
  };

  var obj = {
      
      description: description,
      healthChecker: healthCheckerObj,
      listener: listenerObj,
      providerId,
      regionName,
      name: nlbName,
      scope: "REGION",
      targetGroup: targetGroupObj,
      type: "PUBLIC",
      vNetId: vNetId,
  };
  
  console.log("info connectionconfig obj Data : ", obj);
  if (nlbName) {
      var controllerKeyName = "NlbReg";
      var optionParamMap = new Map();     
      optionParamMap.set("mcisId", mcisId)
      optionParamMap.set("option", "register")
      mcpjs["util/pathfinder"].postCommonData('nlbmng',controllerKeyName,optionParamMap, obj, mcpjs['nlb/nlbmng'].nlbRegCallbackSuccess)

      // axios
      //     .post(url, obj, {
      //         // headers: {
      //         //     'Content-type': "application/json",
      //         // },
      //     })
      //     .then((result) => {
      //         console.log(result);
      //         if (result.status == 200 || result.status == 201) {
      //             commonAlert("Success Create Nlb ");
      //             //등록하고 나서 화면을 그냥 고칠 것인가?
      //             displayNlbInfo("REG_SUCCESS");
      //         } else {
      //             commonAlert("Fail Create Nlb ");
      //         }
      //     })
      //     .catch((error) => {
      //         console.warn(error);
      //         console.log(error.response);
      //         var errorMessage = error.response.statusText;
      //         var statusCode = error.response.status;
      //         commonErrorAlert(statusCode, errorMessage);
      //     });
  } else {
      mcpjs["util/util"].commonAlert("Input NLB Name");
      $("#reg_name").focus();
      return;
  }
}

// nlb reg callback
export function nlbRegCallbackSuccess(caller, result){
  console.log(result);
  if (result.status == 200 || result.status == 201) {
      mcpjs["util/util"].commonAlert("Success Create Nlb ");
      //등록하고 나서 화면을 그냥 고칠 것인가?
      displayNlbInfo("REG_SUCCESS");
  } else {
      mcpjs["util/util"].commonAlert("Fail Create Nlb ");
  }
}