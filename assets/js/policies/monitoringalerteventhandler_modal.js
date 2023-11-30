import { Modal } from "bootstrap";

export function setMonitoringAlertEventHandlerAssist(caller){
    $("#parentsMonitoringAlertEventHandlerAssist").val(caller);
}

// Save Monitoring Alert Event-Handler 
export function saveNewMonitoringAlertEventHandler() {
    // valid check
    var monitoringAlertEventHandlerModalType = $("#regMonitoringAlertEventHandlerModalType").val();
    var monitoringAlertEventHandlerModalName = $("#regMonitoringAlertEventHandlerModalName").val();
    var monitoringAlertEventHandlerModalUrl = $("#regMonitoringAlertEventHandlerModalUrl").val();
    var monitoringAlertEventHandlerModalChannel = $("#regMonitoringAlertEventHandlerModalChannel").val();

    console.log(monitoringAlertEventHandlerModalType + ", " + monitoringAlertEventHandlerModalName);

    var monitoringAlertEventHandlerInfo = {         
        type: monitoringAlertEventHandlerModalType,
        name: monitoringAlertEventHandlerModalName,
        url: monitoringAlertEventHandlerModalUrl,
        channel: monitoringAlertEventHandlerModalChannel
    }

    console.log(monitoringAlertEventHandlerInfo);
    //
    var caller = "monitoringalerteventhandler_modal";
    var controllerKeyName = "MonitoringAlertEventHandlerReg";
    var optionParamMap = new Map();
    var obj = {
        type: monitoringAlertEventHandlerModalType,
        name: monitoringAlertEventHandlerModalName,
        url: monitoringAlertEventHandlerModalUrl,
        channel: monitoringAlertEventHandlerModalChannel
    }
    mcpjs['util/pathfinder'].postCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs['policies/monitoringalerteventhandler_modal'].monitoringAlertEventHandlerRegCallbackSuccess);


    // var url = "/operations//monitoringalertpolicy/alarmeventhandler";
    // console.log("Monitoring Alert Event-Handler Reg URL : ",url)
    
    // if(monitoringAlertEventHandlerModalType || monitoringAlertEventHandlerModalName) {
    //     client.post(url, monitoringAlertEventHandlerInfo, {
    //         headers: {
    //             'Content-type': 'application/json',
    //             // 'Authorization': apiInfo,
    //         }
    //     }).then(result => {
    //         console.log("result add monitoring alert event handler : ", result);
    //         var data = result.data;
    //         console.log(data);

    //         if (data.status == 200 || data.status == 201) {
    //           mcpjs["util/util"].commonAlert("Success Create Monitoring Alert Event-Handler!!")
                
    //             displayMonitoringAlertEventHandlerInfo("REG_SUCCESS")
    //         } else {
    //           mcpjs["util/util"].commonAlert("Fail Create Monitoring Alert Event-Handler " + data.message)
    //         }
    //     }).catch(function(error){
    //         var data = error.data;
    //         console.log(data);
    //         console.log(error);        
    //       mcpjs["util/util"].commonAlert("Monitoring Alert Event-Handler create error : ",error)            
    //     });
    // } else {
    //   mcpjs["util/util"].commonAlert("Input Monitoring Alert Event-Handler Type or Name");
    //     $("#regMonitoringAlertEventHandlerModalType").focus()
    //     return;
    // }

    // if (monitoringAlertEventHandlerModalType == "smtp") {

    // } else if (monitoringAlertEventHandlerModalType == "slack"){

    // }
}

export function monitoringAlertEventHandlerRegCallbackSuccess(caller, result){
    var data = result.data;
    console.log(data);

    if (data.status == 200 || data.status == 201) {
        mcpjs["util/util"].commonAlert("Success Create Monitoring Alert Event-Handler!!")        
    } else {
        mcpjs["util/util"].commonAlert("Fail Create Monitoring Alert Event-Handler " + data.message)
    }

    setAssistValue()
}

export function setAssistValue() {    
    var parent = $("#parentsMonitoringAlertEventHandlerAssist").val();
    var caller = "monitoringalerteventhandler_modal";
    if( parent == "monitoringalertpolicymng" ){        
        mcpjs['policies/monitoringalertpolicymng'].setValuesFromAssist(caller);
    }
}