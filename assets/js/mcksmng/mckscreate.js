import "bootstrap";
import {client} from '/assets/js/util/util'

$(function() {

    // 생성 완료 시 List화면으로 page이동
    document.getElementById('alertResultArea').addEventListener('hidden.bs.modal', function () {// bootstrap 3 또는 4
        var targetUrl = "McksMngForm"
        mcpjs['util/util'].changePage(targetUrl);
    })

})

// region 변경시 region 에 해당하는 resource 조회
export function changeMcksControlPlaneRegion(providerObjId, regionObjId){   
    
    var providerId = $("#" + providerObjId + "  option:selected" ).val();
    var regionName = $("#" + regionObjId + "  option:selected" ).val();
    
    if( providerId == "")return;
    if( regionName == "")return;    

    var targetId = "controlPlane"
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
    mcpjs['util/pathfinder'].getCommonResourceList(targetId + "SpecId", actionName, mcpjs['mcksmng/mckscreate'].getVMSpecListCallbackSuccess, mcpjs['util/util'].commonErrorAlert, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // 사용가능한 rootDisk의 Type 조회
    
	mcpjs['util/pathfinder'].getCommonLookupDiskInfo(caller, providerId, regionName, mcpjs['mcksmng/mckscreate'].getCommonLookupDiskInfoSuccess)

    
    console.log("selectRegion")
}

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
    mcpjs['util/pathfinder'].getCommonResourceList(targetId + "SpecId_" + index, actionName, mcpjs['mcksmng/mckscreate'].getVMSpecListCallbackSuccess, mcpjs['util/util'].commonErrorAlert, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    
    console.log("selectRegion")
}

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

// 사용가능한 DiskType 표시 : provider, region에 따라 다름.
export function getCommonLookupDiskInfoSuccess(caller, result){
    console.log(result);
    var diskInfoList = result.data.DiskInfoList;
	// rootdisk 의 disktype
	var html = '<option value="">Select Root Disk Type</option>'
	var root_disk_type = [];
	diskInfoList.forEach(item => {
		console.log("item : ", item);
		root_disk_type = item.rootdisktype
		
	})

	root_disk_type.forEach(item => {
		html += '<option value="' + item + '">' + item + '</option>'
	})		

	$("#controlPlaneRootDiskType").empty();
	$("#controlPlaneRootDiskType").append(html);	
}

export function btn_deploy(){
// function deploy_btn(){
    var mcksName = $("#mcksreg_name").val();
    if( !mcpjs["util/common"].validateCloudbaristaKeyName(mcksName, 11) ){
      mcpjs["util/util"].commonAlert("first letter = small letter <br/> middle letter = small letter, number, hyphen(-) only <br/> last letter = small letter <br/> max length = 11 ");
        return;
    }
    
    var kubernatesEtcd = $("#clusterconfig_kubernates_etcd").val();
    var kubernatesNetworkCni = $("#clusterconfig_kubernates_networkCni").val();
    var kubernatesPodCidr = $("#clusterconfig_kubernates_podCidr").val();
    var kubernatesServiceCidr = $("#clusterconfig_kubernates_serviceCidr").val();
    var kubernatesServiceDnsDomain = $("#clusterconfig_kubernates_serviceDnsDomain").val();
    
    var controlPlaneLength = $("input[name='controlPlaneCount']").length;
    console.log("controlPlaneLength1 " + controlPlaneLength)
    var controlPlaneProviderData = new Array(controlPlaneLength);
    var controlPlaneRegionData = new Array(controlPlaneLength);
    var controlPlaneCountData = new Array(controlPlaneLength);
    var controlPlaneSpecIdData = new Array(controlPlaneLength);
    for(var i=0; i<controlPlaneLength; i++){                          
        controlPlaneProviderData[i] = $("select[name='controlPlaneProvider']")[i].value;
        controlPlaneRegionData[i] = $("select[name='controlPlaneRegion']")[i].value;
        controlPlaneCountData[i] = $("input[name='controlPlaneCount']")[i].value;
        controlPlaneSpecIdData[i] = $("select[name='controlPlaneSpecId']")[i].value;
    }
    console.log(controlPlaneProviderData)
    console.log(controlPlaneRegionData)
    console.log(controlPlaneCountData)
    console.log(controlPlaneSpecIdData)
    
    var workerCountLength = $("input[name='workerCount']").length;
    console.log("workerCountLength1 " + workerCountLength)
    var workerProviderData = new Array();
    var workerRegionData = new Array();
    var workerCountData = new Array();
    var workerSpecIdData = new Array();
    for(var i=0; i<workerCountLength; i++){      
        var workerId = $("input[name='workerCount']").eq(i).attr("id");
        console.log("workerId " + workerId)
        if( workerId.indexOf("hidden_worker") > -1) continue;// 복사를 위한 영역이 있으므로
        workerProviderData.push($("select[name='workerProvider']")[i].value);
        workerRegionData.push($("select[name='workerRegion']")[i].value);
        workerCountData.push($("input[name='workerCount']")[i].value);
        workerSpecIdData.push($("select[name='workerSpecId']")[i].value);
    }
    console.log(workerProviderData)
    console.log(workerRegionData)
    console.log(workerCountData)
    console.log(workerSpecIdData)
    var obj = {}
    // mcis 생성이므로 mcisID가 없음
    obj['name'] = mcksName
    
    var new_mcksConfig = {}
    var new_kubernetes = {}
    new_kubernetes['etcd'] = kubernatesEtcd;
    new_kubernetes['networkCni'] = kubernatesNetworkCni;
    new_kubernetes['podCidr'] = kubernatesPodCidr;
    new_kubernetes['serviceCidr'] = kubernatesServiceCidr;
    new_kubernetes['serviceDnsDomain'] = kubernatesServiceDnsDomain;

    new_mcksConfig['kubernetes'] = new_kubernetes;
    obj['config'] = new_mcksConfig;
    var controlPlanes = new Array(controlPlaneLength);
    console.log("controlPlaneConnectionLength " + controlPlaneLength)
    for(var i=0; i<controlPlaneLength; i++){
        console.log("controlPlane " + i)
        var new_controlPlane = {}
        new_controlPlane['providerId'] = controlPlaneProviderData[i];
        new_controlPlane['regionName'] = controlPlaneRegionData[i];
        new_controlPlane['count'] = Number(controlPlaneCountData[i]);
        new_controlPlane['spec'] = controlPlaneSpecIdData[i]
        controlPlanes[i] = new_controlPlane
    }
    obj['controlPlane'] = controlPlanes;

    var workers = new Array(workerCountData.length);
    for(var i=0; i<workerCountData.length; i++){
        console.log("workerCountLength " + i)
        var new_worker = {}
        new_worker['providerId'] = workerProviderData[i];
        new_worker['regionName'] = workerRegionData[i];
        new_worker['count'] = Number(workerCountData[i]);
        new_worker['spec'] = workerSpecIdData[i]
        workers[i] = new_worker
    }
    obj['worker'] = workers;
//     $("input[name='workerCount']").each(function (i) {
//         var new_worker = {}
//         console.log($("select[name='workerConnectionName']").eq(i));
//         new_worker['connection'] = $("select[name='workerConnectionName']").eq(i).attr("value");
//         new_worker['count'] = $("input[name='workerCount']").eq(i).attr("value")
//         new_worker['spec'] = $("select[name='workerSpecId']").eq(i).attr("value")
//         workers[i] = new_worker
//         console.log( i + "번째  : " );
//         console.log( new_worker);
//    });
   
    console.log(obj);

    try{
        var controllerKeyName = "McksReg";
        var optionParamMap = new Map();
        mcpjs["util/pathfinder"].postCommonData('mckscreate',controllerKeyName,optionParamMap, obj, mcpjs['mcksmng/mckscreate'].mcksRegCallbackSuccess)

        // configurer 는 mcks 선택하고 들어옴. : TODO : MCKS create 와 node create는 버튼 액션을 달리해야
        // var url = "/operations/mcksmng"
        // client.post(url,obj,{
        //     headers :{
        //         },
        // }).then(result=>{
        //     console.log("data : ",result);
        //     console.log("Result Status : ",result.status); 

        //     var statusCode = result.data.status;
        //     var message = result.data.message;
        //     console.log("Result Status : ",statusCode); 
        //     console.log("Result message : ",message); 

        //     if(result.status == 201 || result.status == 200){
        //         mcpjs['util/util'].commonResultAlert("MCKS create request success")
        //         // var targetUrl = "/operation/manages/mcksmng/mngform"
        //         // changePage(targetUrl);
            
        //     }else{
        //        mcpjs['util/util'].commonErrorAlert(statusCode, message) 
        //     }
        // }).catch((error) => {
        //     console.log(error);
        //     console.log(error.response)
        //     var errorMessage = error.response.data.error;
        //     var statusCode = error.response.status;
        //    mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage) 
        // })
    }finally{
        
    }
}

// mcks reg callback
export function mcksRegCallbackSuccess(caller, result){
    console.log("data : ",result);
    console.log("Result Status : ",result.status); 

    var statusCode = result.data.status;
    var message = result.data.message;
    console.log("Result Status : ",statusCode); 
    console.log("Result message : ",message); 

    if(result.status == 201 || result.status == 200){
        mcpjs['util/util'].commonResultAlert("MCKS create request success")
        // var targetUrl = "/operation/manages/mcksmng/mngform"
        // changePage(targetUrl);
    
    }else{
       mcpjs['util/util'].commonErrorAlert(statusCode, message) 
    }    
}