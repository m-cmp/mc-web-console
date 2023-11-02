$(function () {

    // 조회후 선택된 mcis가 없으면 첫번째를 자동 선택.
    //mcpjs['util/pathfinder'].getCommonMcisList("mcismonitoringmng", true, '', "id")
    //mcpjs["util/pathfinder"].getCommonMcisList("mcismonitoringmng", "id", getMcisListCallbackSuccess);
    
    // mcis 상태 조회
    var optionParamMap = new Map();
    optionParamMap.set("option", "status");
    mcpjs["util/pathfinder"].getCommonData(
        "mcismonitoringmng",
        "McisList",
        optionParamMap,
        mcpjs["monitoringmng/mcismonitoringmng"].getMcisListCallbackSuccess
    );

    //HealthCheck
    var optionParamMap = new Map();
    optionParamMap.set("framework", "SPIDER");
    mcpjs["util/pathfinder"].getCommonData("mcismonitoringmng", "FrameworkHealthCheck", optionParamMap)
    optionParamMap.set("framework", "TUMBLEBUG");
    mcpjs["util/pathfinder"].getCommonData("mcismonitoringmng", "FrameworkHealthCheck", optionParamMap)
    optionParamMap.set("framework", "DRAGONFLY");
    mcpjs["util/pathfinder"].getCommonData("mcismonitoringmng", "FrameworkHealthCheck", optionParamMap)
    
    resizeContent();

    $('.view_ipbox .mt_1 .selectbox').change(function () { 
        console.log("selectbox " , this.id)
        if (this.value == '2') {
            $("#m_hidden_div").hide();
        } else {
            $("#m_hidden_div").show();
        }
    });

    $('.monitoring_ip .mt_1 .selectbox').change(function () {
        console.log("selectbox2 " , this.id)
        if (this.value == '2') {
            $("#hidden_div").hide();
        } else {
            $("#hidden_div").show();
        }
    });

    $("#mcisList").change( function() {
        console.log("select mcisList ", this.value)
        if( this.value != ""){
            selectedMcisData(this.value)
        }
    });

    
});

//Selected MCIS selectbox(CPUs,Memory,DiskIO,Network) width 반응형 적용
function resizeContent() {
    $(".g_list .gbox .sel").each(function(){
        var $list =  $(this),
                $label =  $list.find('label'),
                $labelWidth = $label.width(),
                $gboxWidth = $list.width(),
                $selectbox =  $list.find('.selectbox');
        $list.each(function(){
            $selectbox.css({'width':($gboxWidth-$labelWidth-20)+'px'});
        });
    });
}

// <option value="{ {$item.ID} }"  selected>{ {$item.Name} }|{ {$item.Status} }|{ {$item.Description} }-->
// MCIS 목록 조회 후 화면에 Set
// 설정된 mcis가 없으면 mcisList의 첫번쨰를 조회한다.
export function getMcisListCallbackSuccess(caller, result){
//export function getMcisListCallbackSuccess(caller, mcisList){
    var mcisList = result.data.McisList;
    // MCIS Status
    var addMcis = "";
    addMcis += '<option value="">Choose a Target MCIS for Monitoring</option>';
    if(!mcpjs["util/util"].isEmpty(mcisList) && mcisList.length > 0 ){
        var initMcis = $("#mcis_id").val();
        var mcisExist = false;// monitoring할 mcis가 없을 수도 있음.
        console.log(mcisList)
        for(var i in mcisList){            
            addMcis +='<option value="'+mcisList[i].id+'">'+mcisList[i].name + '</option>';
            if( initMcis == mcisList[i]){
                mcisExist = true;
            }
        }
        $("#mcisList").empty()
        $("#mcisList").append(addMcis)
        if (initMcis && mcisExist) {
            console.log("initMcis = " + initMcis)
        }else{
            console.log("initMcis does not exists");
            initMcis = mcisList[0]// 설정된 mcis가 없으면 mcisList의 첫번쨰를 조회한다.
        }
        console.log("initMcis", initMcis)
        $("#mcisList").val(initMcis).prop("selected", true).change();

    }else{
        var addMcis = "";

        // $("#mcisList").append(addMcis);
    }
}

// 조회 실패시.
function getMcisListCallbackFail(caller, error){
    // List table에 no data 표시? 또는 조회 오류를 표시?
}

export function selectedMcisData(mcisId){
    $("#mcis_id").val(mcisId);

    console.log("getMcisVmList", mcisId)
    //getCommonMcisData("mcismonitoringmng", mcisId)
    //mcpjs["util/pathfinder"].getCommonMcisData("mcismonitoringmng", mcisId, mcpjs['mcismonitoring/mcismonitoringmng'].getCommonMcisDataCallbackSuccess);
    var caller = "mcismonitoringmng";
    var actionName = "McisGet";
    var optionParamMap = new Map();
    optionParamMap.set("{mcisId}", mcisId)
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['monitoringmng/mcismonitoringmng'].getCommonMcisDataCallbackSuccess)

    
}

export function getCommonMcisDataCallbackSuccess(caller, result){
//export function getCommonMcisDataCallbackSuccess(caller, mcisInfo){
    var mcisInfo = result.data.McisInfo;
    console.log(mcisInfo)
    var mcisId = mcisInfo.id
    var vms = mcisInfo.vm
    console.log(vms)
    var vm_badge ="";
    var vm_options = "";

    if(vms){
        // var init_vm = vms[0].id
        var vm_len = vms.length
        for(var o in vms){
            var vm_status = vms[o].status
            vm_options +='<option value="'+vms[o].id+'">'+vms[o].name+'|'+vms[o].status+'|'+vms[o].description

            var vmStatusIcon = "bgbox_b";
            if(vm_status == "Running"){
                vmStatusIcon = "bgbox_b";
            }else if(vm_status == "include" ){
                vmStatusIcon = "bgbox_g";
            }else if(vm_status == "Suspended"){
                vmStatusIcon = "bgbox_g";
            }else if(vm_status == "Terminated"){
                vmStatusIcon = "bgbox_r";
            }else{
                vmStatusIcon = "bgbox_g";
            }
            vm_badge += '<li class="sel_cr ' + vmStatusIcon + '" ><a href="javascript:void(0);" onclick="mcpjs[\'monitoringmng/mcismonitoringmng\'].selectVm(\''+mcisId+'\',\''+vms[o].id+'\')" ><span class="txt">'+vms[o].name+'</span></a></li>';
            console.log("vm_status : ", vm_status)

        }
        var sta = mcisInfo.status
        var sl = sta.split("-");
        var status = sl[0].toLowerCase()
        var mcis_badge = '';
        var mcisStatusIcon = "icon_running_db.png";
        if(status == "running"){
            mcisStatusIcon = 'icon_running_db.png'
        }else if(status == "include" ){
            mcisStatusIcon = 'icon_stop_db.png'
        }else if(status == "suspended"){
            mcisStatusIcon = 'icon_stop_db.png'
        }else if(status == "terminate"){
            mcisStatusIcon = 'icon_terminate_db.png'
        }else{
            mcisStatusIcon = 'icon_stop_db.png'
        }
        mcis_badge = '<img src="/assets/images/contents/' + mcisStatusIcon + '" alt="' + status + '"/> '

        $("#mcis_info_txt").text("[ "+mcisInfo.name+"("+mcisInfo.id+")"+" ]");
        $("#monitoring_mcis_status_img").empty()
        $("#monitoring_mcis_status_img").append(mcis_badge)
        $("#vmArrList").empty();
        $("#vmArrList").append(vm_badge);

        // vm list options
        $("#vmList").empty()
        $("#vmList").append(vm_options)

        $(".ds_cont_mbox .mtbox .g_list .listbox li.sel_cr").each(function(){
            var $sel_list = $(this),
                $detail_view = $(".monitoring_view");
            $sel_list.off("click").click(function(){
                $sel_list.addClass("active");
                $sel_list.siblings().removeClass("active");
                $detail_view.addClass("active");
                $detail_view.siblings().removeClass("active");

                $sel_list.off("click").click(function(){
                    if( $(this).hasClass("active") ) {
                        $sel_list.removeClass("active");
                        $detail_view.removeClass("active");
                    } else {
                        $sel_list.addClass("active");
                        $sel_list.siblings().removeClass("active");
                        $detail_view.addClass("active");
                        $detail_view.siblings().removeClass("active");
                    }
                });
            });
        });

    }// end of vms if
}

// vm 선택시 해당 vm의 monitoring 조회
export function selectVm(mcisId,vmId){
    $('#vm_id').val(vmId);

    var input_duration = $("#input_duration").val();
    var duration_type = $("#duration_type").val();
    var duration = input_duration+duration_type;//30m
    var periodType = $("#vm_period").val();//m
    var metric = $("#select_metric").val();
    var statisticsCriteria = "last";
    
    //showMonitoring(mcis_id,vm_id,metric,period_type,duration);
    //mcpjs["util/pathfinder"].getCommonVmMonitoringMetric(mcisId, vmId, metric, periodType, statisticsCriteria, duration, mcpjs['mcismonitoring/mcismonitoringmng'].getVmMonitoringMetricCallbackSuccess, mcpjs['mcismonitoring/mcismonitoringmng'].getVmMonitoringMetricCallbackFail)
    
    // mcisMonitoring.McisID, mcisMonitoring.MetricNam

    var caller = "mcismonitoringmng";
    // var controllerKeyName = "McisMonitoringDurationMetric";// TB에 요청
    // var obj = {
    //     mcis_id: mcisId,
    //     vm_id: vmId,
    //     metric_name: metric,
    // };// McisMonitoringDurationMetric 에서 사용.
    var controllerKeyName = "McisVmMonitoring";// -> Dragonfly에 요청
    var obj = {
        McisID: mcisId,
        VmID: vmId,
        Metric: metric,
        PeriodType: periodType,
        StatisticsCriteria: statisticsCriteria,
        Duration: duration,
      };
    var optionParamMap = new Map();
    mcpjs["util/pathfinder"].postCommonData(
        caller,
        controllerKeyName,
        optionParamMap,
        obj,
        mcpjs['monitoringmng/mcismonitoringmng'].getVmMonitoringMetricCallbackSuccess
    );
}

export function getVmMonitoringMetricCallbackSuccess(caller, result){
//export function getVmMonitoringMetricCallbackSuccess(vmMonitoringInfo){
    var data = result.data.VMMonitoringInfo;
    console.log("getVmMonitoringMetricCallbackSuccess", data)
}

export function getVmMonitoringMetricCallbackFail(error){
    console.log("error", error)
    //mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
    // 404라면 해당 vm에서 agent가 설치되어 있지 않아 응답을 하지 않았을 수 있음.
    // 
}

function btn_view_click(){
    var sel_history = $("#sel_history").val();
    var vm_id = $("#vm_id").val();
    var mcis_id =$("#mcis_id").val();

    var input_duration = $("#input_duration").val();
    var duration_type = $("#duration_type").val();
    var duration = input_duration+duration_type
    var period_type = $("#vm_period").val();
    var metric = $("#select_metric").val();

    showMonitoring(mcis_id,vm_id,metric,period_type,duration);
}


function ModalDetail(){
    $(".dashboard .status_list tbody tr").each(function(){
    var $td_list = $(this),
            $status = $(".detail_box"),
            $detail = $(".server_info");
    $td_list.off("click").click(function(){
            $td_list.addClass("on");
            $td_list.siblings().removeClass("on");
            $status.addClass("view");
            $status.siblings().removeClass("on");
            $(".dashboard.register_cont").removeClass("active");
            $(".dashboard.edit_box").removeClass("view");
        $td_list.off("click").click(function(){
                if( $(this).hasClass("on") ) {
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
 