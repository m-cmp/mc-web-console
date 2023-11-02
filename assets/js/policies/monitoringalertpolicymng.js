import { Modal } from "bootstrap";
var table;
var monitoringEventAlertTable;
$(function () {

    initTable();

    initMonitoringEventAlertTable(); // create에서 사용

    getMonitoringAlertPolicyList("alertName");
});

// Table 초기값 설정
function initTable() {
    var tableObjParams = {};
  
    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        //{title:"Id", field:"id", visible: false},// id 값이 없음
        {title:"Event Duration", field:"event_duration", visible: false},
        {title:"Metric", field:"metric", visible: false},
        {title:"Alert Math Expression", field:"alert_math_expression", visible: false},
        {title:"Alert Threshold", field:"alert_threshold", visible: false},
        {title:"Warn Event Count", field:"warn_event_cnt", visible: false},
        {title:"Critical Event Count", field:"critic_event_cnt", visible: false},

        {title:"Name", field:"name", vertAlign: "middle"},
        {title:"Measurement", field:"measurement", vertAlign: "middle"},
        {title:"Target Type", field:"target_type", vertAlign: "middle"},
        {title:"Target ID", field:"target_id", vertAlign: "middle"},
        {title:"Alert Event Type", field:"alert_event_type", vertAlign: "middle"},
        {title:"Alert Event Name", field:"alert_event_name", vertAlign: "middle", hozAlign: "center", headerSort:false},
    ]

    table = mcpjs["util/util"].setTabulator("alertList", tableObjParams, columns);
  
    table.on("rowClick", function (e, row) {
      //showMonitoringAlertPolicyInfo(row.getCell("id").getValue());
      showMonitoringAlertPolicyInfo(row.getCell("name").getValue());// df가 key로 name을 쓰고 있음
    });
  
    table.on("rowSelectionChanged", function (data, rows) {      
    });
  
    mcpjs["util/util"].displayColumn(table);
  }

function initMonitoringEventAlertTable(){
    var tableObjParams = {};
  
    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"Id", field:"id", visible: false},
        {title:"Name", field:"name", vertAlign: "middle"},
        {title:"Channel", field:"options.channel", vertAlign: "middle"},
        {title:"Url", field:"options.url", vertAlign: "middle"},
        {title:"Type", field:"type", vertAlign: "middle"},
    ]
    var isMultiSelect = false;
    monitoringEventAlertTable = mcpjs["util/util"].setTabulator("monitoringAlertEventHandlerList", tableObjParams, columns, isMultiSelect);
  
    monitoringEventAlertTable.on("rowClick", function (e, row) {              
      //showMonitoringAlertPolicyInfo(row.getCell("name").getValue());// df가 key로 name을 쓰고 있음
    });
  
    monitoringEventAlertTable.on("rowSelectionChanged", function (data, rows) {      
    });
  
    mcpjs["util/util"].displayColumn(table);

}
export function addMonitoringAlertPolicy(){
    console.log("##########AddMonitoringAlertPolicy")
    $(".dashboard.register_cont").toggleClass("active");
    $(".dashboard.detail_box").removeClass("view");
    $(".dashboard .status_list tbody tr").removeClass("on");
    
    //ok 위치이동
    //var offset = $("#CreateBox").offset();
    //$("#wrap").animate({scrollTop : offset.top}, 300);        
    
    // 등록 폼 초기화
    $("#regMonitoringAlertName").val('');				 
    $("#regMonitoringAlertMeasure").val('');            
    $("#regMonitoringAlertTargetType").val('');         
    $("#regMonitoringAlertTargetID").val('');           
    $("#regMonitoringAlertEventDuration").val('');      
    $("#regMonitoringAlertMetric").val('');             
    $("#regMonitoringAlertAlertMathExpression").val('');
    $("#regMonitoringAlertAlertThreshold").val('');     
    $("#regMonitoringAlertWarnEventCount").val('');     
    $("#regMonitoringAlertCriticEventCount").val('');  

  // mcpjs["util/common"].setTableHeightForScroll('maEventHandlerList', 300)
}

export function updateMonitoringAlertPolicy(){
    console.log("##########updateMonitoringAlertPolicy")
    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a Threshold!!");
        return;
    }

    //var selSpecId = "";
    selectedRows.forEach(function (row) {
        //selSpecId = row.getCell("id").getValue();

        $("#edtThresholdName").val(row.getCell("name").getValue());				 
        $("#edtMonitoringAlertMeasure").val(row.getCell("measurement").getValue());
        $("#edtMonitoringAlertTargetType").val(row.getCell("target_type").getValue());
        $("#edtMonitoringAlertTargetID").val(row.getCell("target_id").getValue());
        $("#edtMonitoringAlertEventDuration").val(row.getCell("event_duration").getValue());
        $("#edtMonitoringAlertMetric").val(row.getCell("metric").getValue());
        $("#edtMonitoringAlertAlertMathExpression").val(row.getCell("alert_math_expression").getValue());
        $("#edtMonitoringAlertAlertThreshold").val(row.getCell("alert_threshold").getValue());
        $("#edtMonitoringAlertWarnEventCount").val(row.getCell("warn_event_cnt").getValue());
        $("#edtMonitoringAlertCriticEventCount").val(row.getCell("critic_event_cnt").getValue());
    });
    // $(".dashboard.update_cont").toggleClass("active");
    // $(".dashboard.register_cont").removeClass("view");
    // $(".dashboard.detail_box").removeClass("view");
    // $(".dashboard .status_list tbody tr").removeClass("on");
    
    // //var offset = $("#monitoringAlertEditBox").offset();
    // //$("#wrap").animate({scrollTop : offset.top}, 300);        
    
    // // 수정 폼 설정 : 등록 폼의 값으로 set
    // $("#edtThresholdName").val($("#regMonitoringAlertName").val());				 
    // //$("#edtMonitoringAlertName").val($("#regMonitoringAlertName").val());

    // $("#edtMonitoringAlertMeasure").val($("#regMonitoringAlertMeasure").val());
    // $("#edtMonitoringAlertTargetType").val($("#regMonitoringAlertTargetType").val());
    // $("#edtMonitoringAlertTargetID").val($("#regMonitoringAlertTargetID").val());
    // $("#edtMonitoringAlertEventDuration").val($("#regMonitoringAlertEventDuration").val());
    // $("#edtMonitoringAlertMetric").val($("#regMonitoringAlertMetric").val());
    // $("#edtMonitoringAlertAlertMathExpression").val($("#regMonitoringAlertAlertMathExpression").val());
    // $("#edtMonitoringAlertAlertThreshold").val($("#regMonitoringAlertAlertThreshold").val());
    // $("#edtMonitoringAlertWarnEventCount").val($("#regMonitoringAlertWarnEventCount").val());
    // $("#edtMonitoringAlertCriticEventCount").val($("#regMonitoringAlertCriticEventCount").val());

}

export function deleteMonitoringAlertPolicy(){
    console.log("##########DeleteMonitoringAlertPolicy")

    var monitoringAlertId = "";
    // var count = 0;

    // $( "input[name='chk']:checked" ).each( function () {
    //     count++;
    //     monitoringAlertId = monitoringAlertId + $(this).val()+",";
    // });

    // monitoringAlertId = monitoringAlertId.substring(0,monitoringAlertId.lastIndexOf( ","));
    
    // console.log("monitoringAlertId : ", monitoringAlertId);
    // console.log("count : ", count);

    // if(monitoringAlertId == ''){
    //   mcpjs["util/util"].commonAlert("삭제할 대상을 선택하세요.");
    //     return false;
    // }

    // if(count != 1){
    //   mcpjs["util/util"].commonAlert("삭제할 대상을 하나만 선택하세요.");
    //     return false;
    // }

    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a VM Spec!!");
        return;
    }

    var selMonitoringAlertId = "";
    selectedRows.forEach(function (row) {
        selMonitoringAlertId = row.getCell("name").getValue();// df는 id가없이 name을 사용하며 task_name으로 전달
    });

    var caller = "monitoringalertpolicymng";
    var controllerKeyName = "MonitoringAlertPolicyDel";
    var optionParamMap = new Map();
    optionParamMap.set("{monitoringAlertId}", selMonitoringAlertId);
    var obj = { }    
    mcpjs["util/pathfinder"].deleteCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs["policies/monitoringalertpolicymng"].monitoringAlertPolicyDelCallbackSuccess );

    // var url = "/operations/monitoringalertpolicy/id/" + monitoringAlertId
    // console.log("del monitoringAlertPolicy url : ", url);

    // client.delete(url, {
    //     headers: {
    //         // 'Authorization': "{{ .apiInfo}}",
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     var data = result.data;
    //     console.log(data);
    //     if (result.status == 200 || result.status == 201) {
    //      mcpjs["util/util"].commonAlert("Success Delete Threshold")
    //        displayMonitoringAlertPolicyInfo("DEL_SUCCESS")
    //     }else{
    //       mcpjs["util/util"].commonAlert(data)
    //     }
    // }).catch(function(error){
    //   mcpjs["util/util"].commonAlert(error)
    //     console.log("Threshold delete error : ",error);        
    // });
}

export function monitoringAlertPolicyDelCallbackSuccess(caller, result){
    var data = result.data;
    console.log(data);
    if (result.status == 200 || result.status == 201) {
        mcpjs["util/util"].commonAlert("Success Delete Threshold")
        displayMonitoringAlertPolicyInfo("DEL_SUCCESS")
    }else{
        mcpjs["util/util"].commonAlert(data)
    }    
}


export function createMonitoringAlertPolicy(){
    console.log("##########CreateMonitoringAlertPolicy")

    var monitoringAlertEventHandlerType = "";
    var monitoringAlertEventHandlerName = "";
    var count = 0;

    // $( "input[name='chk']:checked" ).each( function () {
    //     count++;
    //     var selectedIndex = $(this).attr('id').split("_")[1]; // raw_1  [0] = raw, [1] = 1
    //     monitoringAlertEventHandlerType = $("#monitoringAlertEventHandlerType_info_" + selectedIndex).val();
    //     monitoringAlertEventHandlerName = $("#monitoringAlertEventHandlerName_info_" + selectedIndex).val();
    // });

    //
    var selectedRows = monitoringEventAlertTable.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a Event Handler!!");
        return;
    }

    selectedRows.forEach(function (row) {
        monitoringAlertEventHandlerType = row.getCell("type").getValue();
        monitoringAlertEventHandlerName = row.getCell("name").getValue();
    });

   
    console.log("count : ", count);

    // if(monitoringAlertEventHandlerType == ''){
    //   mcpjs["util/util"].commonAlert("입력할 대상을 선택하세요.");
    //     return false;
    // }

    // if(count != 1){
    //   mcpjs["util/util"].commonAlert("입력할 대상을 하나만 선택하세요.");
    //     return false;
    // }

    var monitoringAlertName = $("#regMonitoringAlertName").val();				 
    var monitoringAlertMeasure = $("#regMonitoringAlertMeasure").val();            
    var monitoringAlertTargetType = $("#regMonitoringAlertTargetType").val();         
    var monitoringAlertTargetID = $("#regMonitoringAlertTargetID").val();           
    var monitoringAlertEventDuration = $("#regMonitoringAlertEventDuration").val();      
    var monitoringAlertMetric = $("#regMonitoringAlertMetric").val();             
    var monitoringAlertAlertMathExpression = $("#regMonitoringAlertAlertMathExpression").val();
    var monitoringAlertAlertThreshold = $("#regMonitoringAlertAlertThreshold").val();     
    var monitoringAlertWarnEventCount = $("#regMonitoringAlertWarnEventCount").val();     
    var monitoringAlertCriticEventCount = $("#regMonitoringAlertCriticEventCount").val(); 
    var monitoringAlertEventMessage = $("#regMonitoringAlertEventMessage").val(); 

    if(!monitoringAlertName) {
      mcpjs["util/util"].commonAlert("Input New Threshold Name")
        $("#regMonitoringAlertName").focus()
        return;
    }

    if(monitoringAlertMeasure == "") {
      mcpjs["util/util"].commonAlert("Select New Measurement")
        return;
    }

    if(monitoringAlertTargetType == "") {
      mcpjs["util/util"].commonAlert("Select New Target Type")
        return;
    }

    if(!monitoringAlertTargetID) {
      mcpjs["util/util"].commonAlert("Input New Target ID")
        $("#regMonitoringAlertTargetID").focus()
        return;
    }

    if(!monitoringAlertEventDuration) {
      mcpjs["util/util"].commonAlert("Input New Event Duration")
        $("#regMonitoringAlertEventDuration").focus()
        return;
    }

    if(!monitoringAlertMetric) {
      mcpjs["util/util"].commonAlert("Input New Metric")
        $("#regMonitoringAlertMetric").focus()
        return;
    }
    
    if(monitoringAlertAlertMathExpression == "") {
      mcpjs["util/util"].commonAlert("Select New Alert Math Expression")
        return;
    }

    if(!monitoringAlertAlertThreshold) {
      mcpjs["util/util"].commonAlert("Input New Alert Threshold")
        $("#regMonitoringAlertAlertThreshold").focus()
        return;
    }
    
    if(!monitoringAlertWarnEventCount) {
      mcpjs["util/util"].commonAlert("Input Warn Event Count")
        $("#regMonitoringAlertWarnEventCount").focus()
        return;
    }

    if(!monitoringAlertCriticEventCount) {
      mcpjs["util/util"].commonAlert("Input New Critic Event Count")
        $("#regMonitoringAlertCriticEventCount").focus()
        return;
    }
    
    if(!monitoringAlertEventMessage) {
      mcpjs["util/util"].commonAlert("Input New Monitoring Alert Event Message")
        $("#regMonitoringAlertEventMessage").focus()
        return;
    }

    // var url = "/operations/monitoringalertpolicy"
    // console.log("Threshold Reg URL : ", url)
    var obj = {
        name                    : monitoringAlertName,				 
        measurement             : monitoringAlertMeasure,            
        target_type             : monitoringAlertTargetType,         
        target_id               : monitoringAlertTargetID,         
        event_duration          : monitoringAlertEventDuration,      
        metric                  : monitoringAlertMetric,             
        alert_math_expression   : monitoringAlertAlertMathExpression,
        alert_threshold         : Number(monitoringAlertAlertThreshold),     
        warn_event_cnt          : Number(monitoringAlertWarnEventCount),     
        critic_event_cnt        : Number(monitoringAlertCriticEventCount),
        alert_event_type        : monitoringAlertEventHandlerType,
        alert_event_name        : monitoringAlertEventHandlerName,
        alert_event_message     : monitoringAlertEventMessage
    }

    console.log("info Threshold obj Data : ", obj);

    if(monitoringAlertName) {
        var caller = "monitoringalertpolicymng";
        var controllerKeyName = "MonitoringAlertPolicyReg";
        var optionParamMap = new Map();
        mcpjs['util/pathfinder'].postCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs['policies/monitoringalertpolicymng'].monitoringAlertPolicyRegCallbackSuccess);

        // client.post(url, obj, {
        //     headers: {
        //         'Content-type': 'application/json',
        //     }
        // }).then(result => {
        //     console.log("result Threshold : ", result);
        //     var data = result.data;
        //     console.log(data);

        //     if (data.status == 200 || data.status == 201) {
        //       mcpjs["util/util"].commonAlert("Success Create Threshold!!")
                
        //         displayMonitoringAlertPolicyInfo("REG_SUCCESS")
        //     } else {
        //       mcpjs["util/util"].commonAlert("Fail Create Threshold " + data.message)
        //     }
        // }).catch(function(error){
        //     var data = error.data;
        //     console.log(data);
        //     console.log(error);        
        //   mcpjs["util/util"].commonAlert("Threshold create error : ",error)            
        // });
    } else {
      mcpjs["util/util"].commonAlert("Input Threshold Name")
        $("#regMonitoringAlertName").focus()
        return;
    }
}

export function monitoringAlertPolicyRegCallbackSuccess(caller, result){
    var data = result.data;
    console.log(data);

    if (data.status == 200 || data.status == 201) {
        mcpjs["util/util"].commonAlert("Success Create Threshold!!")
        
        displayMonitoringAlertPolicyInfo("REG_SUCCESS")
    } else {
        mcpjs["util/util"].commonAlert("Fail Create Threshold " + data.message)
    }
}


export function showMonitoringAlertPolicyInfo(monitoringAlertName) {
    console.log("showMonitoringAlertPolicyInfo : ", monitoringAlertName);

    $('#thresholdName').text(monitoringAlertName)

    //MonitoringAlertPolicyData
    var caller = "monitoringalertpolicymng";
    var actionName = "MonitoringAlertPolicyData";
    var optionParamMap = new Map();
    optionParamMap.set("{monitoringAlertId}", monitoringAlertName);
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['policies/monitoringalertpolicymng'].getMonitoringAlertPolicyCallbackSuccess)


    // var url = "/operations/monitoringalertpolicy/id/" + encodeURIComponent(monitoringAlertName);
    // console.log("Threshold detail URL : ",url)

    // return axios.get(url,{
    //     // headers:{
    //     //     'Authorization': apiInfo
    //     // }
    // }).then(result=>{
    //     console.log(result);
    //     console.log(result.data);
    //     var data = result.data.MonitoringAlertPolicyInfo
    //     console.log("Show Data : ",data);
        
    //     var dtlMonitoringAlertName				   = data.name
    //     var dtlMonitoringAlertMeasure              = data.measurement
    //     var dtlMonitoringAlertTargetType           = data.target_type
    //     var dtlMonitoringAlertTargetID             = data.target_id
    //     var dtlMonitoringAlertEventDuration        = data.event_duration
    //     var dtlMonitoringAlertMetric               = data.metric
    //     var dtlMonitoringAlertAlertMathExpression  = data.alert_math_expression
    //     var dtlMonitoringAlertAlertThreshold       = data.alert_threshold
    //     var dtlMonitoringAlertWarnEventCount       = data.warn_event_cnt
    //     var dtlMonitoringAlertCriticEventCount     = data.critic_event_cnt
    //     var dtlMonitoringAlertEventHandlerModalType = data.alert_event_type
    //     var dtlMonitoringAlertEventHandlerModalName = data.alert_event_name
    //     var dtlMonitoringAlertEventMessage          = data.alert_event_message

    //     $("#dtlMonitoringAlertName").empty();				 
    //     $("#dtlMonitoringAlertMeasure").empty();            
    //     $("#dtlMonitoringAlertTargetType").empty();         
    //     $("#dtlMonitoringAlertTargetID").empty();           
    //     $("#dtlMonitoringAlertEventDuration").empty();      
    //     $("#dtlMonitoringAlertMetric").empty();             
    //     $("#dtlMonitoringAlertAlertMathExpression").empty();
    //     $("#dtlMonitoringAlertAlertThreshold").empty();     
    //     $("#dtlMonitoringAlertWarnEventCount").empty();     
    //     $("#dtlMonitoringAlertCriticEventCount").empty();
    //     $("#dtlMonitoringAlertEventHandlerModalType").empty();
    //     $("#dtlMonitoringAlertEventHandlerModalName").empty();
    //     $("#dtlMonitoringAlertEventMessage").empty();
    //     $("#mAlertEventList").empty();

    //     $("#dtlMonitoringAlertName").val(dtlMonitoringAlertName);				 
    //     $("#dtlMonitoringAlertMeasure").val(dtlMonitoringAlertMeasure);               
    //     $("#dtlMonitoringAlertTargetType").val(dtlMonitoringAlertTargetType);         
    //     $("#dtlMonitoringAlertTargetID").val(dtlMonitoringAlertTargetID);           
    //     $("#dtlMonitoringAlertEventDuration").val(dtlMonitoringAlertEventDuration);      
    //     $("#dtlMonitoringAlertMetric").val(dtlMonitoringAlertMetric);             
    //     $("#dtlMonitoringAlertAlertMathExpression").val(dtlMonitoringAlertAlertMathExpression);
    //     $("#dtlMonitoringAlertAlertThreshold").val(dtlMonitoringAlertAlertThreshold);     
    //     $("#dtlMonitoringAlertWarnEventCount").val(dtlMonitoringAlertWarnEventCount);     
    //     $("#dtlMonitoringAlertCriticEventCount").val(dtlMonitoringAlertCriticEventCount);
    //     $("#dtlMonitoringAlertEventHandlerModalType").val(dtlMonitoringAlertEventHandlerModalType);
    //     $("#dtlMonitoringAlertEventHandlerModalName").val(dtlMonitoringAlertEventHandlerModalName);
    //     $("#dtlMonitoringAlertEventMessage").val(dtlMonitoringAlertEventMessage);

    //     // event 발생이력 표시
    //     var data = result.data.MonitoringAlertLogList;
    //     setAlarmEventLogList(data)
        
    // }) .catch(function(error){
    //     console.log("Threshold detail error : ",error);        
    // });   
}

export function getMonitoringAlertPolicyCallbackSuccess(caller, result){
    var data = result.data.MonitoringAlertPolicyInfo;
    var dtlMonitoringAlertName				   = data.name
    var dtlMonitoringAlertMeasure              = data.measurement
    var dtlMonitoringAlertTargetType           = data.target_type
    var dtlMonitoringAlertTargetID             = data.target_id
    var dtlMonitoringAlertEventDuration        = data.event_duration
    var dtlMonitoringAlertMetric               = data.metric
    var dtlMonitoringAlertAlertMathExpression  = data.alert_math_expression
    var dtlMonitoringAlertAlertThreshold       = data.alert_threshold
    var dtlMonitoringAlertWarnEventCount       = data.warn_event_cnt
    var dtlMonitoringAlertCriticEventCount     = data.critic_event_cnt
    var dtlMonitoringAlertEventHandlerModalType = data.alert_event_type
    var dtlMonitoringAlertEventHandlerModalName = data.alert_event_name
    var dtlMonitoringAlertEventMessage          = data.alert_event_message

    $("#dtlMonitoringAlertName").empty();				 
    $("#dtlMonitoringAlertMeasure").empty();            
    $("#dtlMonitoringAlertTargetType").empty();         
    $("#dtlMonitoringAlertTargetID").empty();           
    $("#dtlMonitoringAlertEventDuration").empty();      
    $("#dtlMonitoringAlertMetric").empty();             
    $("#dtlMonitoringAlertAlertMathExpression").empty();
    $("#dtlMonitoringAlertAlertThreshold").empty();     
    $("#dtlMonitoringAlertWarnEventCount").empty();     
    $("#dtlMonitoringAlertCriticEventCount").empty();
    $("#dtlMonitoringAlertEventHandlerModalType").empty();
    $("#dtlMonitoringAlertEventHandlerModalName").empty();
    $("#dtlMonitoringAlertEventMessage").empty();
    $("#mAlertEventList").empty();

    $("#dtlMonitoringAlertName").val(dtlMonitoringAlertName);				 
    $("#dtlMonitoringAlertMeasure").val(dtlMonitoringAlertMeasure);               
    $("#dtlMonitoringAlertTargetType").val(dtlMonitoringAlertTargetType);         
    $("#dtlMonitoringAlertTargetID").val(dtlMonitoringAlertTargetID);           
    $("#dtlMonitoringAlertEventDuration").val(dtlMonitoringAlertEventDuration);      
    $("#dtlMonitoringAlertMetric").val(dtlMonitoringAlertMetric);             
    $("#dtlMonitoringAlertAlertMathExpression").val(dtlMonitoringAlertAlertMathExpression);
    $("#dtlMonitoringAlertAlertThreshold").val(dtlMonitoringAlertAlertThreshold);     
    $("#dtlMonitoringAlertWarnEventCount").val(dtlMonitoringAlertWarnEventCount);     
    $("#dtlMonitoringAlertCriticEventCount").val(dtlMonitoringAlertCriticEventCount);
    $("#dtlMonitoringAlertEventHandlerModalType").val(dtlMonitoringAlertEventHandlerModalType);
    $("#dtlMonitoringAlertEventHandlerModalName").val(dtlMonitoringAlertEventHandlerModalName);
    $("#dtlMonitoringAlertEventMessage").val(dtlMonitoringAlertEventMessage);

    // event 발생이력 표시
    //     var data = result.data.MonitoringAlertLogList;
    //     setAlarmEventLogList(data)

    displayMonitoringAlertPolicyInfo("DEL")
}


export function displayMonitoringAlertPolicyInfo(targetAction) {
    if( targetAction == "REG") {        
        console.log("##########AddMonitoringAlertPolicy")
        $('#monitoringAlertPolicyCreateBox').toggleClass("active");
        $('#monitoringAlertPolicyInfoBox').removeClass("view");
        $('#monitoringAlertPolicyEditBox').removeClass("view");
        $('#monitoringAlertPolicyListTable').removeClass("on");
       
        //ok 위치이동
        //var offset = $("#CreateBox").offset();
        //$("#wrap").animate({scrollTop : offset.top}, 300);        
        
        // 등록 폼 초기화
        $("#regMonitoringAlertName").val('');				 
        $("#regMonitoringAlertMeasure").val('');            
        $("#regMonitoringAlertTargetType").val('');         
        $("#regMonitoringAlertTargetID").val('');           
        $("#regMonitoringAlertEventDuration").val('');      
        $("#regMonitoringAlertMetric").val('');             
        $("#regMonitoringAlertAlertMathExpression").val('');
        $("#regMonitoringAlertAlertThreshold").val('');     
        $("#regMonitoringAlertWarnEventCount").val('');     
        $("#regMonitoringAlertCriticEventCount").val('');  
    
    }
    if( targetAction == "REG_SUCCESS" ) {
        console.log("##########AddMonitoringAlertPolicy REG_SUCCESS")
        $('#monitoringAlertPolicyCreateBox').removeClass("active");
        $('#monitoringAlertPolicyInfoBox').removeClass("view");
        $('#monitoringAlertPolicyEditBox').removeClass("view");
        $('#monitoringAlertPolicyListTable').addClass("on");


        // $(".dashboard.register_cont").removeClass("active");
        // $(".dashboard.edit_box").removeClass("view");
        // $(".dashboard.detail_box").removeClass("view");
        // $(".dashboard .status_list tbody tr").addClass("on");
        
        // var offset = $("#CreateBox").offset();
        // $("#wrap").animate({scrollTop : offset.top}, 0);        
        
        // 등록 폼 초기화
        $("#regMonitoringAlertName").val('');				 
        // $("#regMonitoringAlertMeasure").val('');            
        // $("#regMonitoringAlertTargetType").val('');         
        $("#regMonitoringAlertTargetID").val('');           
        $("#regMonitoringAlertEventDuration").val('');      
        $("#regMonitoringAlertMetric").val('');             
        // $("#regMonitoringAlertAlertMathExpression").val('');
        $("#regMonitoringAlertAlertThreshold").val('');     
        $("#regMonitoringAlertWarnEventCount").val('');     
        $("#regMonitoringAlertCriticEventCount").val('');  
        
        getMonitoringAlertPolicyList("alertName");
    } else if ( targetAction == "DEL_SUCCESS" ) {
        console.log("##########AddMonitoringAlertPolicy DEL_SUCCESS")
        // $(".dashboard.register_cont").removeClass("active");
        // $(".dashboard.edit_box").removeClass("view");
        // $(".dashboard.detail_box").removeClass("view");
        // $(".dashboard .status_list tbody tr").addClass("on");

        $('#monitoringAlertPolicyCreateBox').removeClass("active");
        $('#monitoringAlertPolicyInfoBox').removeClass("view");
        $('#monitoringAlertPolicyEditBox').removeClass("view");
        $('#monitoringAlertPolicyListTable').addClass("on");

        // var offset = $("#CreateBox").offset();
        // $("#wrap").animate({scrollTop : offset.top}, 0);

        getMonitoringAlertPolicyList("alertName");
    } else if ( targetAction == "EDIT") {
        $('#monitoringAlertPolicyCreateBox').removeClass("active");
        $('#monitoringAlertPolicyInfoBox').removeClass("view");
        $('#monitoringAlertPolicyEditBox').addClass("view");
        $('#monitoringAlertPolicyListTable').removeClass("on");
    } else if ( targetAction == "DEL") {
        $('#monitoringAlertPolicyCreateBox').removeClass("active");
        $('#monitoringAlertPolicyInfoBox').addClass("view");
        $('#monitoringAlertPolicyEditBox').removeClass("view");
        $('#monitoringAlertPolicyListTable').removeClass("on");
    } else if (targetAction == "CLOSE") {
        $('#monitoringAlertPolicyCreateBox').removeClass("active");
        $('#monitoringAlertPolicyInfoBox').removeClass("view");
        $('#monitoringAlertPolicyEditBox').removeClass("view");
        $('#monitoringAlertPolicyListTable').addClass("on");
    }

}


function getMonitoringAlertPolicyList(sortType) {
    console.log("#####################getMonitoringAlertPolicyList : ", sortType);

    var caller = "monitoringalertpolicymng";
    var actionName = "MonitoringAlertPolicyList";
    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['policies/monitoringalertpolicymng'].monitoringAlertPolicyListCallbackSuccess)

    // var url = "/operations/monitoringalertpolicy"
    // axios.get(url, {
    //     headers: {
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     console.log("get Threshold List : ", result.data);
    //     var data = result.data.MonitoringAlertPolicyList;
    //     console.log("$$$Alert DATA$$$");
    //     console.log(data);

    //     var html = ""
    //     var cnt = 0;

    //     if (data == null) {
    //         html += '<tr><td class="overlay hidden" data-th="" colspan="3">No Data</td></tr>'

    //         $("#alertList").empty();
    //         $("#alertList").append(html)
    
    //         ModalDetail();
    //     } else {
    //         if (data.length) {
    //             if (sortType) {
    //                 cnt++;
    //                 console.log("check2 : ", sortType);
    //                 data.filter(list => list.Name !== "").sort((a, b) => (a[sortType] < b[sortType] ? - 1 : a[sortType] > b[sortType] ? 1 : 0)).map((item, index) => (
    //                     html += addMonitoringAlertRow(item, index)
    //                 ))
    //             } else {
    //                 console.log("check3 : ", sortType);
    //                 data.filter((list) => list.Name !== "").map((item, index) => (
    //                     html += addMonitoringAlertRow(item, index)
    //                 ))
    //             }
    
    //             $("#alertList").empty();
    //             $("#alertList").append(html)
    
    //             ModalDetail();
    //         }
    //     }
        
    // }).catch(function(error){
    //     console.log("Threshold list error : ", error);        
    // })    
}

export function monitoringAlertPolicyListCallbackSuccess(caller, result){
    var data = result.data.MonitoringAlertPolicyList;
    console.log(data);
    table.setData(data);

    // 
    var eventHandlerData = result.data.MonitoringAlertEventHandlerList
    monitoringEventAlertTable.setData(eventHandlerData)
}

// Threshold목록에 Item 추가
function addMonitoringAlertRow(item, index){
    console.log("addMonitoringAlertRow " + index);
    console.log(item)
    var html = ""
    html += '<tr onclick="mcpjs[\'policies/monitoringalertpolicymng\'].showMonitoringAlertPolicyInfo(\'' + item.name + '\');">'
        + '<td class="overlay hidden column-50px" data-th="">'
        + '<input type="hidden" id="alertpolicy_info_' + index + '" value="' + item.name + '"/>'
        + '<input type="checkbox" name="chk" value="' + item.name + '" id="raw_' + index + '" title="" /><label for="td_ch1"></label> <span class="ov off"></span></td>'
        + '<td class="overlay hidden column-14percent" data-th="Name">' + item.name + '</td>'
        + '<td class="overlay hidden column-16percent" data-th="Measurement">' + item.measurement + '</td>'
        + '<td class="overlay hidden column-15percent" data-th="TargetType">' + item.target_type + '</td>'
        + '<td class="overlay hidden column-15percent" data-th="TargetId">' + item.target_id + '</td>'
        + '<td class="overlay hidden column-15percent" data-th="AlertEventType">' + item.alert_event_type + '</td>'
        + '<td class="overlay hidden" data-th="AlertEventName">' + item.alert_event_name + '</td>'
        // + '<td class="overlay hidden column-60px" data-th=""><a href="javascript:void(0);"><img src="/assets/images/contents/icon_link.png" class="icon" alt=""/></a></td>'
        + '</tr>'	
    return html;
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
                    console.log("reg ok button click")
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


// Add Monitoring Alert Event-Handler (SMTP, SLACK 중 하나 추가)
export function addMonitoringAlertEventHandler() {
    //$("#Add_MonitoringAlertEventHandler_Register").modal(); 
    $("#Add_MonitoringAlertEventHandler_Register").modal("toggle");
    var caller = "monitoringalertpolicymng";
    mcpjs['policies/monitoringalerteventhandler_modal'].setMonitoringAlertEventHandlerAssist(caller);
}


// Delete Monitoring Alert Event-Handler 
export function deleteMonitoringAlertEventHandler() {
    console.log("##########deleteMonitoringAlertEventHandler")

    // var columns = [
    //     {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
    //     //{title:"Id", field:"id", visible: false},// id 값이 없음
        
    //     {title:"Name", field:"name", vertAlign: "middle"},
    //     {title:"Type", field:"type", vertAlign: "middle"},
    // ]

    // monitoringEventAlertTable = mcpjs["util/util"].setTabulator("monitoringAlertEventHandlerList", tableObjParams, columns);

    var selectedRows = monitoringEventAlertTable.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a Alert Event Handler!!");
        return;
    }
    
    var selMonitoringAlertEventHandlerId = "";
    var selMonitoringAlertEventHandlerType = "";
    var selMonitoringAlertEventHandlerName = "";    
    selectedRows.forEach(function(row) {
        var rowData = row.getData(); // 선택한 행의 데이터
        var id = rowData.id; // 행의 ID 값
        console.log("Selected Row ID:", id);
        selMonitoringAlertEventHandlerId = rowData.id;
        selMonitoringAlertEventHandlerName = rowData.name;
        selMonitoringAlertEventHandlerType = rowData.type;
    });    

    //
    var caller = "monitoringalertpolicymng";
    var controllerKeyName = "MonitoringAlertEventHandlerDel";
    var optionParamMap = new Map();
    optionParamMap.set("{handlerType}", selMonitoringAlertEventHandlerType);
    optionParamMap.set("{eventName}", selMonitoringAlertEventHandlerName);
    var obj = { }
    
    mcpjs['util/pathfinder'].deleteCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs['policies/monitoringalertpolicymng'].monitoringAlertEventHandlerDelCallbackSuccess);


    // var selectedIndex = "";
    // var selectedType = "";
    // var selectedName = "";

    // // var chkIdArr = $(this).attr('id').split("_");// 0번째와 2번째를 합치면 id 추출가능  ex) securityGroup_Raw_0
    // //   if( $(this).is(":checked")){
    // $( "input[name='chk']:checked" ).each( function () {
    //     counts++;
    //     selectedIndex = $(this).attr('id').split("_")[1]; // raw_1  [0] = raw, [1] = 1
    //     selectedType = $("#monitoringAlertEventHandlerType_info_" + selectedIndex).val();
    //     selectedName = $("#monitoringAlertEventHandlerName_info_" + selectedIndex).val();
    // });

    // console.log("selectedIndex", selectedIndex)
    // console.log("selectedType : ", selectedType);
    // console.log("selectedName : ", selectedName);
    // console.log("count : ", counts);

    // if(selectedIndex == ''){
    //   mcpjs["util/util"].commonAlert("삭제할 대상을 선택하세요.");
    //     return false;
    // }

    // if(counts != 1){
    //   mcpjs["util/util"].commonAlert("삭제할 대상을 하나만 선택하세요.");
    //     return false;
    // }
    
    // var url = "/operations/monitoringalertpolicy/alerteventhandler/type/" + selectedType + "/event/" + selectedName
    // console.log("del monitoringAlertEventHandler url : ", url);

    // client.delete(url, {
    //     headers: {
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     var data = result.data;
    //     console.log(data);
    //     if (result.status == 200 || result.status == 201) {
    //      mcpjs["util/util"].commonAlert("Success Delete Monitoring Alert Event-Handler");
    //        displayMonitoringAlertEventHandlerInfo("DEL_SUCCESS");
    //     }else{
    //       mcpjs["util/util"].commonAlert(data)
    //     }
    // }).catch(function(error){
    //   mcpjs["util/util"].commonAlert(error)
    //     console.log("Monitoring Alert Event-Handler delete error : ",error);        
    // });
}

export function monitoringAlertEventHandlerDelCallbackSuccess(caller, result){
    var data = result.data;
    console.log(data);
    if (result.status == 200 || result.status == 201) {
        mcpjs["util/util"].commonAlert("Success Delete Monitoring Alert Event-Handler");
        displayMonitoringAlertEventHandlerInfo("DEL_SUCCESS");
    }else{
        mcpjs["util/util"].commonAlert(data)
    }
}

function displayMonitoringAlertEventHandlerInfo(targetAction) {
    if ( targetAction == "REG") {
        
    }
    else if ( targetAction == "DEL_SUCCESS" ) {
        console.log("##########MonitoringAlertEventHandler DEL_SUCCESS")
        
        getMonitoringAlertEventHandlerList();
    } else if ( targetAction == "REG_SUCCESS" ) {
        console.log("##########MonitoringAlertEventHandler REG_SUCCESS")
        
        // $("#regMonitoringAlertEventHandlerModalType").val('');  
        $("#regMonitoringAlertEventHandlerModalName").val('');  

        getMonitoringAlertEventHandlerList();

        $("#Add_MonitoringAlertEventHandler_Register").modal("hide");
    }
  
}

// Monitoring Alert Event-Handler목록 조회
function getMonitoringAlertEventHandlerList() {
    console.log("#####################getMonitoringAlertEventHandlerList : ");
    
    var caller = "monitoringalertpolicymng";
    var actionName = "MonitoringAlertEventHandlerList";
    var optionParamMap = new Map();
    //optionParamMap.set("{monitoringAlertId}", task_name);
    //optionParamMap.set("{level}", level);
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['policies/monitoringalertpolicymng'].monitoringAlertEventHandlerListCallbackSuccess)

    // var url = "/operations/policies/monitoringalerteventhandler/list"
    // axios.get(url, {
    //     headers: {
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     console.log("get Threshold List : ", result.data);
    //     var data = result.data.MonitoringAlertEventHandlerList;
    //     console.log("$$$EventHandler DATA$$$");
    //     console.log(data);

    //     var html = ""
    //     var cnt = 0;

    //     if (data.length) {
    //         data.filter((list) => list.Name !== "").map((item, index) => (
    //             html += addMonitoringAlertEventHandlerRow(item, index)
    //         ))
    //     }

    //     $("#monitoringAlertEventHandlerList").empty();
    //     $("#monitoringAlertEventHandlerList").append(html);

    //     //ModalDetail();
        
    // }).catch(function(error){
    //     console.log("Event-Handler list error : ", error);        
    // })    
}

export function monitoringAlertEventHandlerListCallbackSuccess(caller, result){
    console.log("#####################monitoringAlertEventHandlerListCallbackSuccess : ");
    var data = result.data.MonitoringAlertEventHandlerList;
    console.log(data);
    monitoringEventAlertTable.setData(data);    
}

// Monitoring Alert Event-Handler목록에 Item 추가
function addMonitoringAlertEventHandlerRow(item, index){
    console.log("addMonitoringAlertEventHandlerRow " + index);
    console.log(item)
    var html = ""

    html += '<tr><td class="overlay hidden column-50px" data-th="">'
        + '<input type="hidden" id="monitoringAlertEventHandlerType_info_' + index + '" value="' + item.type + '"/>'
        + '<input type="hidden" id="monitoringAlertEventHandlerName_info_' + index + '" value="' + item.name + '"/>'
        + '<input type="checkbox" name="chk" value="' + item.type +'" id="raw_' + index + '" title="" />'
        + '<label for="td_ch1"></label> <span class="ov off"></span></td>'
        + '<td class="btn_mtd ovm column-30percent" data-th="Type">' + item.type + '<span class="ov"></span>'
        + '<input type="hidden" id="monitoringAlertEventHandler_info_' + index + '" value="' + item.type + '"/>'
        + '<td class="overlay hidden" data-th="Name">' + item.name + '</td></tr>'
	
    return html;
}


// 발생한 알람 이력 조회 : alarm명 , 등급 선택(ok, warning, critical)
export function searchAlertEventLog(alertEvent) {
    var level = $("#" + alertEvent + " option:selected").val();
    var task_name = $("#dtlMonitoringAlertName").val();
    console.log("tast_name : ", task_name, ", level : ", level);
    
    if (level == "") {
        level = "warning";
    }

    var caller = "monitoringalertpolicymng";
    var actionName = "MonitoringAlertLogList";
    var optionParamMap = new Map();
    optionParamMap.set("{monitoringAlertId}", task_name);
    optionParamMap.set("{level}", level);
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['policies/monitoringalertpolicymng'].monitoringAlertLogListCallbackSuccess)

    // var url = "/operations/monitoringalertpolicy/id/" + task_name + "/level/" + level
               
    // axios.get(url, {
    //     headers: {
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     console.log("get Alert Event Log List : ", result.data);
    //     var data = result.data.MonitoringAlertLogList;
    //     // console.log(data);
        
    //     setAlarmEventLogList(data)
        
    // }).catch(function(error){
    //     console.log("Alert Event list error : ", error);        
    // })
}

export function monitoringAlertLogListCallbackSuccess(caller, result){
    console.log("get Alert Event Log List : ", result);
        var data = result.data.MonitoringAlertLogList;
    setAlarmEventLogList(data)
}

// alarm 발생 이력 조회
// 상세 표시할 때 기본은 critical로 조회해 오고
// level을 변경하여 조회한 결과 표시
function setAlarmEventLogList(data){
    var html = ""
    var datalen = data.length;

    if( datalen > 0){
        console.log(data.length);

        // 왜 거꾸로 돌렸지?
        for ( var n = datalen - 1; n >= 0; n-- ) {
            html += moment(data[n].time).format('YYYY-MM-DD, hh:mm:ss a') + "\n"
        }
    }else{
        html += "There is no alert event log"
    }

    $("#mAlertEventList").empty();
    $("#mAlertEventList").append(html)
}

// popup에서 넘기는 Data
export function setValuesFromAssist(caller, assistMap){
    // 

}