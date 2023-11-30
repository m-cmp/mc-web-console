$(function () {
  $(".btn_apply").on("click", function () {
    console.log("apply button clicked");
    applyMonitoringConfig();
  });

  getMonitoringConfigPolicy();
});

function getMonitoringConfigPolicy() {
  console.log("getMonitoringConfigPolicy");

  
  var caller = "monitoringconfigpolicymng";
  var controllerKeyName = "MonitoringConfigPolicyData"
  var optionParamMap = new Map();
  //optionParamMap.set("option", "status");
  mcpjs["util/pathfinder"].getCommonData(caller, controllerKeyName, optionParamMap, mcpjs["policies/monitoringconfigpolicymng"].getMonitoringConfigPolicyCallbackSuccess );
  
  // var url = "/operations/policy/monitoringconfig/mngform";
  // axios
  //   .get(url, {
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   })
  //   .then((result) => {
  //     console.log("getMonitoringConfigPolicy result : ", result);
  //     var data = result.data;
  //     if (data.status == 200 || data.status == 201) {
  //       var resultData = data.MonitoringConfig;
  //       $("#agentInterval").val(resultData.agent_interval);
  //       $("#collectorInterval").val(resultData.collector_interval);
  //       $("#maxHostCount").val(resultData.max_host_count);
  //       $("#monitoringPolicy").val(resultData.monitoring_policy);
  //     } else {
  //       mcpjs["util/util"].commonAlert(data.message);
  //     }
  //   })
  //   .catch((error) => {
  //     console.warn(error);
  //     console.log(error.response);
  //     var errorMessage = error.response.data.error;
  //     var statusCode = error.response.status;
  //     mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
  //   });
}

export function getMonitoringConfigPolicyCallbackSuccess(caller, result){
  console.log(result);
  var data = result.data;
  if (data.status == 200 || data.status == 201) {
    var resultData = data.MonitoringConfig;
    //$("#agentInterval").val(resultData.agent_interval);
    //$("#collectorInterval").val(resultData.collector_interval);
    $("#mcisAgentInterval").val(resultData.mcis_agent_interval);
    $("#mcisCollectorInterval").val(resultData.mcis_collector_interval);
    $("#mck8sAgentInterval").val(resultData.mck8s_agent_interval);
    $("#mck8sCollectorInterval").val(resultData.mck8s_collector_interval);
    $("#pullerInterval").val(resultData.puller_interval);
    $("#pullerAggregateInterval").val(resultData.puller_aggregate_interval);
    
    $("#maxHostCount").val(resultData.max_host_count);
    $("#monitoringPolicy").val(resultData.monitoring_policy);

    $("#defaultPolicy").val(resultData.default_policy);
    $("#aggregateType").val(resultData.aggregate_type);
    $("#deployType").val(resultData.deploy_type);

  } else {
    mcpjs["util/util"].commonAlert(data.message);
  }
}

function applyMonitoringConfig() {
  var mcisAgentItv = $("#mcisAgentInterval").val();
  var mcisColItv = $("#mcisCollectorInterval").val();
  var maxhostcnt = $("#maxHostCount").val();
  console.log(mcisAgentItv + ", " + mcisColItv + ", " + maxhostcnt);
  var message =
    "Set monitoring config.<br><br>MCIS Agent Interval : " +
    mcisAgentItv +
    "<br>MCIS Collector Interval : " +
    mcisColItv +
    "<br>Max Host Count : " +
    maxhostcnt +
    "<br><br>Are you sure?";
  console.log(message);
  if (validateMonitoringConfigPolicy()) {
    mcpjs["util/util"].commonConfirmMsgOpen(
      "monitoringConfigPolicyConfig",
      message
    );
  }
}

function validateMonitoringConfigPolicy() {
  var agentItv = $("#mcisAgentInterval").val();
  var colItv = $("#mcisCollectorInterval").val();
  var maxhostcnt = $("#maxHostCount").val();

  try {
    var agentItvNum = parseFloat(agentItv);
    var colItvNum = parseFloat(colItv);
    var maxhostcntNum = parseFloat(maxhostcnt);

    if (isNaN(agentItvNum)) {
      mcpjs["util/util"].commonAlert("Agent Interval is not a number");
      return false;
    }
    if (isNaN(colItvNum)) {
      mcpjs["util/util"].commonAlert("Collector Interval is not a number");
      return false;
    }
    if (isNaN(maxhostcntNum)) {
      mcpjs["util/util"].commonAlert("Max Host Count is not a number");
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}

export function putMonitoringConfigPolicy() {
  console.log("putMonitoringConfigPolicy");
  try {

    //var url = "/operations/monitoringconfigpolicy";
    //console.log("Monitoring Policy Reg URL : ", url);
    // var agentItv = $("#agentInterval").val();
    // var colItv = $("#collectorInterval").val();

    var mcisAgentInterval = $("#mcisAgentInterval").val();
    var mcisCollectorInterval = $("#mcisCollectorInterval").val();
    var mck8sAgentInterval = $("#mck8sAgentInterval").val();
    var mck8sCollectorInterval = $("#mck8sCollectorInterval").val();
    var maxhostcnt = $("#maxHostCount").val();

    var pullerInterval = $("#pullerInterval").val();
    var pullerAggregateInterval = $("#pullerAggregateInterval").val();
    
    var obj = {
      //agent_interval: Number(agentItv),
      //collector_interval: Number(colItv),

      mcis_agent_interval: Number(mcisAgentInterval),
      mcis_collector_interval: Number(mcisCollectorInterval),
      mck8s_agent_interval: Number(mck8sAgentInterval),
      mck8s_collector_interval: Number(mck8sCollectorInterval),
      max_host_count: Number(maxhostcnt),
      puller_interval: Number(pullerInterval),
      puller_aggregate_interval: Number(pullerAggregateInterval),
      monitoring_policy: "agentCount" ,
      default_policy: "push",
      aggregate_type: "avg",
      deploy_type: "compose"
    };
    console.log("info Monitoring Policy obj Data : ", obj);

    if (mcisAgentInterval) {
      var caller = "monitoringconfigpolicymng";
      var controllerKeyName = "MonitoringConfigPolicyUpdate"
      var optionParamMap = new Map();    
      //optionParamMap.set("option", "status");      
      mcpjs["util/pathfinder"].putCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs["policies/monitoringconfigpolicymng"].putMonitoringConfigPolicyCallbackSuccess );

      
      // axios
      //   .put(url, obj, {
      //     headers: {
      //       "Content-type": "application/json",
      //     },
      //   })
      //   .then((result) => {
      //     console.log("result Monitoring Policy : ", result);

      //     if (result.status == 200 || result.status == 201) {
      //       mcpjs["util/util"].commonAlert(
      //         "Success Setting Monitoring Policy!!"
      //       );
      //       var resultData = result.MonitoringConfig;
      //       $("#agentInterval").val(resultData.agent_interval);
      //       $("#collectorInterval").val(resultData.collector_interval);
      //       $("#maxHostCount").val(resultData.max_host_count);
      //     } else {
      //       mcpjs["util/util"].commonAlert(
      //         "Fail Set Monitoring Policy" + result.message
      //       );
      //     }
      //   })
      //   .catch((error) => {
      //     console.log(error.response);
      //     var errorMessage = error.response.data.error;
      //     var statusCode = error.response.status;
      //     mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
      //   });
    } else {
      mcpjs["util/util"].commonAlert("Input Monitoring Policy Data");
      $("#agentInterval").focus();
      return;
    }
  } catch (e) {
    console.log(e);
    mcpjs["util/util"].commonAlert(e);
  }
}

export function putMonitoringConfigPolicyCallbackSuccess(caller, result){
  if (result.status == 200 || result.status == 201) {
    mcpjs["util/util"].commonAlert(
      "Success Setting Monitoring Policy!!"
    );
    var resultData = result.data.MonitoringConfig;
    $("#agentInterval").val(resultData.agent_interval);
    $("#collectorInterval").val(resultData.collector_interval);
    $("#maxHostCount").val(resultData.max_host_count);
  } else {
    mcpjs["util/util"].commonAlert(
      "Fail Set Monitoring Policy" + result.message
    );
  }
}