$(function(){
    // node 추가시에는 controlPlane는 사용하지 않음. -> 화면에서 보이지 않도록
    $("#mcks_controlPlane_area").css("display", "none");

})


// region 변경시 region 에 해당하는 resource 조회
export function changeMcksWorkerRegion(index){   
    
    var providerId = $("#workerProvider_" + index + "  option:selected" ).val();
    var regionName = $("#workerRegion_" + index + "  option:selected" ).val();
    
    if( providerId == "")return;
    if( regionName == "")return;    

    var targetId = "worker"
    var actionName=""
    var optionParam = ""
    var urlParamMap = new Map();    
    var filterKeyValMap =  new Map();
    var mconParamMap = new Map();   
    mconParamMap.set("is_cb", "N")
    mconParamMap.set("providerId", providerId)
    mconParamMap.set("regionName", regionName)
   
    // VmSpec 조회
    actionName="VmSpecListByProviderRegionZone"
    mcpjs['util/pathfinder'].getCommonResourceList(targetId + "SpecId_" + index, actionName, mcpjs['mcksmng/mcksnodecreate'].getVMSpecListCallbackSuccess, mcpjs['util/util'].commonErrorAlert, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    
    console.log("selectRegion")
}

// vm spec 목록 조회 결과 
export function getVMSpecListCallbackSuccess(targetId, result){
    console.log(result)
    // if( caller == "mciscreatesimple"){
        var html = ""        
        var data = result.VmSpecList;
        console.log(data)
        
        html += '<option selected>Select Spec</option>';
        for (var i in data) {
            html += '<option value="' + data[i].cspSpecName + '" item="' + data[i].name + '">' + data[i].name + '</option>';
           // html += '<option value="' + data[i] + '" item="' + data[i] + '">' + data[i] + '</option>';        
        }        
        $("#" + targetId).empty()
        $("#" + targetId).append(html)
    // }
}
