
// -- simple mode
// Provider 선택 시 > region 목록, root disk 목록
// Region 선택 시 > vpc 목록, spec 목록, image 목록
// VPC 선택 시 > security group 목록
// Image Toogle 버튼 > myImage 목록
import "bootstrap";
import { REGION_MAP, VMSPEC_MAP, VMIMAGE_MAP, VPC_MAP, SECURITYGROUP_MAP, SSHKEY_MAP } from "../util/util";
import {client} from '/assets/js/util/util'

// 상수 정의 : provider, region으로 가져온 결과를 map에 추가. 사용할 때 해당 provider, region이 있으면 사용. 없으면 조회해서 map에 추가

$(function () {

    // namespace 공통으로 사용하는 resource는 한번에 가져온 후 필요시 갱신, 필요시 filter해 사용

    // 생성 완료 시 List화면으로 page이동
    //$('#alertResultArea').addEventListener('hidden.bs.modal', function () {// bootstrap 5
    //    console.log("test");
    //    let targetUrl = "/operation/manages/mcismng/mngform"// TODO : path finder 또는 getWebToolUrl 등으로 변경할 것
    //    mcpjs['util/util'].changePage(targetUrl)
    //});

    // vm 추가 form
    $('.server_add').on('click', function () {
        console.log(".server_add")
        displayNewServerForm()
    });

    $('.btn_deploy').on('click', function () {
        console.log(".btn_deploy")
        deployMcis()
    }); 
});

// 가져올 resource가 많으면 좀... 그런데... 이거 그냥 쓸까?
function getNamespaceResource(resourceType){
    
    var actionName=""
    var optionParam = ""
    var urlParamMap = new Map();    
    var filterKeyValMap =  new Map();
    var mconParamMap = new Map();   
    mconParamMap.set("is_cb", "N")

    if ( resourceType == "vpc" ){
        //actionName="VpcListByProviderRegionZone"
        actionName="VpcListByRegion";
        mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getVPCListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)
    //}else if( resourceType == "securitygroup" ){// security group은 vpc dependency가 있음.
        //actionName = "SecurityGroupListByProviderRegionZone"
    //    actionName="SecurityGroupListByRegion";
    //    mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getSecurityGroupListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)
    }else if( resourceType == "vmimage" ){
        //actionName="VmImageListByProviderRegionZone"
        actionName="VmImageListByRegion"
        mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getVMImageListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)
    }else if( resourceType == "sshkey" ){
        //actionName="SshKeyListByProviderRegionZone"
        actionName="SshKeyListByRegion"
        mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getSshKeyListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)
    }

}

// 서버 더하기버튼 클릭시 서버정보 입력area 보이기/숨기기
// isExpert의 체크 여부에 따라 바뀜.
// newServers 와 simpleServers가 있음.
export function displayNewServerForm(IsImport) {

    var deploymentAlgo = $("#placement_algo").val();
    var simpleServerConfig = $("#simpleServerConfig");
    var expertServerConfig = $("#expertServerConfig");
    var importServerConfig = $("#importServerConfig");
    var expressServerConfig = $("#expressServerConfig");
    console.log("is import = " + IsImport + " , deploymentAlgo " + deploymentAlgo)
    // if ($("#isImport").is(":checked")) {
    if (IsImport) {
        simpleServerConfig.removeClass("active");
        expertServerConfig.removeClass("active");
        importServerConfig.addClass("active");
        expressServerConfig.removeClass("active");
    } else if (deploymentAlgo == "expert") {
        simpleServerConfig.removeClass("active");
        expertServerConfig.toggleClass("active");//
        importServerConfig.removeClass("active");
        expressServerConfig.removeClass("active");
    } else if (deploymentAlgo == "simple") {
        simpleServerConfig.toggleClass("active");//
        expertServerConfig.removeClass("active");
        importServerConfig.removeClass("active");
        expressServerConfig.removeClass("active");
    } else {      
        console.log("exp")
        simpleServerConfig.removeClass("active");
        expertServerConfig.removeClass("active");
        importServerConfig.removeClass("active");
        expressServerConfig.toggleClass("active");//        
    }
}

// 모드가 바뀌면 Form을 Clear 한다.
export function closeNewServerForm() {    
    var expressServerConfig = $("#expressServerConfig");
    var simpleServerConfig = $("#simpleServerConfig");    
    var expertServerConfig = $("#expertServerConfig");
    var importServerConfig = $("#importServerConfig");

    expressServerConfig.removeClass("active");
    simpleServerConfig.removeClass("active");
    expertServerConfig.removeClass("active");
    importServerConfig.removeClass("active");
}

// 서버정보 입력 area에서 'DONE'버튼 클릭시 array에 담고 form을 초기화
var TotalServerConfigArr = new Array();
export function deployMcis() {
    var mcis_name = $("#mcis_name").val();
    if (!mcis_name) {
        mcpjs['util/util'].commonAlert("Please Input MCIS Name!!!!!")
        return;
    }
    var mcis_desc = $("#mcis_desc").val();
    var deploymentAlgo = $("#placement_algo").val();
    var installMonAgent = $("#installMonAgent").val();

    var obj = {}

    var vm_len = 0;

    if (deploymentAlgo == "express") {
        createMcisDynamic()
        return;
    }else if (mcpjs['mcismng/vmconfigureimport'].IsImport) {
        obj = $("#mcisImportScriptPretty").val();
        obj.id = "";// mcis생성이므로 id는 비워준다.
    } else {
        // mcis 생성이므로 mcisID가 없음
        obj['name'] = mcis_name
        obj['description'] = mcis_desc
        obj['installMonAgent'] = installMonAgent

        //console.log("simple:", mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr);
        //new_obj['vm'] = mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr;
        if (mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr) {
            vm_len = mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr.length;
            for (var i in mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr) {
                TotalServerConfigArr.push(mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr[i]);
            }
        }
    
        if (mcpjs['mcismng/vmconfigureexpert'].Expert_Server_Config_Arr) {
            vm_len = mcpjs['mcismng/vmconfigureexpert'].Expert_Server_Config_Arr.length;
            for (var i in mcpjs['mcismng/vmconfigureexpert'].Expert_Server_Config_Arr) {
                TotalServerConfigArr.push(mcpjs['mcismng/vmconfigureexpert'].Expert_Server_Config_Arr[i]);
            }
        }
    
        if (TotalServerConfigArr) {
            vm_len = TotalServerConfigArr.length;
            console.log("Server_Config_Arr length: ", vm_len);
            obj['vm'] = TotalServerConfigArr;
            console.log("new obj is : ", obj);
        } else {
            mcpjs['util/util'].commonAlert("Please Input Servers");
            return;
        }
    }
    
    var controllerKeyName = "McisReg";
    var optionParamMap = new Map();
    mcpjs["util/pathfinder"].postCommonData('mciscreate',controllerKeyName,optionParamMap, obj, mcpjs['mcismng/mciscreate'].mcisRegCallbackSuccess)

    // var url = "/operations/mcismng"
    // try {
    //     client.post(url, new_obj, {
           
    //     }).then(result => {
    //         console.log("MCIR Register data : ", result);
    //         console.log("Result Status : ", result.status);
    //         if (result.status == 201 || result.status == 200) {
    //             mcpjs['util/util'].commonResultAlert("Register Requested")
    //         } else {
    //             mcpjs['util/util'].commonAlert("Register Fail")
    //         }
    //     }).catch((error) => {
    //         // console.warn(error);
    //         console.log(error.response)
    //         var errorMessage = error.response.data.error;
    //         var statusCode = error.response.status;
    //        mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)

    //     })
    // } catch (error) {
    //     mcpjs['util/util'].commonAlert(error);
    //     console.log(error);
    // }
}

// mcis 저장 callback
export function mcisRegCallbackSuccess(caller, result){
    console.log("MCIR Register data : ", result);
    console.log("Result Status : ", result.status);
    if (result.status == 201 || result.status == 200) {
        mcpjs['util/util'].commonResultAlert("Register Requested")
    } else {
        mcpjs['util/util'].commonAlert("Register Fail")
    }
}

// 화면의 mcis 이름이 변경되면 적용
export function setMcisValue(mcisObjId, mcisObjValue) {
    if (mcpjs['mcismng/vmconfigureimport'].IsImport) {
        if (mcisObjId == "mcis_name") {
            ImportedMcisScript.name = mcisObjValue;
        } else if (mcisObjId == "mcis_desc") {
            ImportedMcisScript.description = mcisObjValue;
        } else if (mcisObjId == "installMonAgent") {
            ImportedMcisScript.installMonAgent = mcisObjValue;
        }
        mcisTojsonFormatter(ImportedMcisScript)
    }
}

var totalCloudConnectionList = new Array();
export function getCloudConnectionListCallbackSuccess(caller, data, sortType) {
    totalCloudConnectionList = data;
}

// 등록 된 vm search 결과
var totalImageListByNamespace = new Array()
function getImageListCallbackSuccess(caller, data) {
    console.log(data);
    totalImageListByNamespace = data
}


// 현재 namespace에 등록된 모든 spec 목록
export function getSpecListCallbackSuccess(caller, data) {
    console.log("mciscreate spec:", data);
    totalVmSpecListByNamespace = data

    if (caller == "addedspec") {
        changeCloudConnection()
    }
}

var totalNetworkListByNamespace = new Array();
// patchfinder.js에서 호출하기 때문에 임시로 만들어 둠
export function getNetworkListCallbackFail(caller, error) {
    // no data
}

var totalSecurityGroupListByNamespace = new Array();


// pathfinder.js에서 호출하기 때문에 임시로 만들어 둠
function getSecurityGroupListCallbackFail(error) {

}

// TODO : spec 등록인데... function 이름이 recommendSpec인 이유를 찾아 적절히 바꿀 것.
// 1. csp의 spec을 가지고 해당 ns에 등록하는 것인가? 그럼 해당 spec이 존재하는 로직이 있는지 확인 필요
// 2. 해당 function이 vmCreate에도 있는 것 같은데 합쳐야 하지 않을까?
function createRecommendSpec(recSpecName) {
    console.log(recSpecName);

    var specId = recSpecName
    var specName = recSpecName
    var connectionName = $("#t_regRecommendConn").val()
    var cspSpecName = $("#t_regRecommendCspSpec").val()

    if (!specName) {
        alert("Input New Spec Name")
        return;
    }

    var url = "/settings/resources" + "/vmspec/reg"
    console.log("URL : ", url)
    var obj = {
        id: specId,
        name: specName,
        connectionName: connectionName,
        cspSpecName: cspSpecName
    }
    console.log("info image obj Data : ", obj)

    if (specName) {
        var controllerKeyName = "VmSpecReg";
        var optionParamMap = new Map();
        mcpjs["util/pathfinder"].postCommonData('specReg',controllerKeyName,optionParamMap, obj, mcpjs['mcismng/mciscreate'].vmSpecRegCallbackSuccess)

        // client.post(url, obj, {
        //     headers: {
        //         'Content-type': 'application/json',
        //         // 'Authorization': apiInfo,
        //     }
        // }).then(result => {
        //     console.log("result spec : ", result);
        //     var statusCode = result.data.status;
        //     if (statusCode == 200 || statusCode == 201) {
        //         $("#t_regConnectionName").val(connectionName)
        //         $("#t_spec").val(specName)
        //         getCommonVirtualMachineSpecList('addedspec')
        //         mcpjs['util/util'].commonAlert("Success Create Spec!!")
        //         $("#connectionAssist").modal("hide")
        //         $("#recommendSpecAssist").modal("hide")

        //     } else {
        //         var message = result.data.message;
        //         mcpjs['util/util'].commonAlert("Fail Create Spec : " + message + "(" + statusCode + ")")
        //     }

        // }).catch((error) => {
        //     console.warn(error)
        //     console.log(error.response)
        //     var errorMessage = error.response.data.error
        //     var statusCode = error.response.status
        //    mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
        // })
    } else {
        mcpjs['util/util'].commonAlert("Input Spec Name")

        return;
    }
}

// createRecommendSpec 에서 spec등록 결과 처리 callback
export function vmSpecRegCallbackSuccess(caller, result){
    console.log("result spec : ", result);
    var statusCode = result.data.status;
    if (statusCode == 200 || statusCode == 201) {
        $("#t_regConnectionName").val(connectionName)
        $("#t_spec").val(specName)
        getCommonVirtualMachineSpecList('addedspec')
        mcpjs['util/util'].commonAlert("Success Create Spec!!")
        $("#connectionAssist").modal("hide")
        $("#recommendSpecAssist").modal("hide")

    } else {
        var message = result.data.message;
        mcpjs['util/util'].commonAlert("Fail Create Spec : " + message + "(" + statusCode + ")")
    }
}

// MCIS 동적생성 : spec, disk 정보
function createMcisDynamic() {
    var specIndex = $("#assistSelectedIndex").val();
    var mcisName = $("#mcis_name").val()
    var mcisDesc = $("#mcis_desc").val()

    if (!mcisName) {
        mcpjs['util/util'].commonAlert("Please Input MCIS Name!!!!!")
        return;
    }
    if (!mcisDesc) {
        mcisDesc = "Made in CB-TB"
    }
    //console.log(mcpjs['mcismng/vmconfigureexpress'].Express_Server_Config_Arr)
    //var url = "/operations/mcismng/proc/mcisdynamic"
    var obj = {}
    obj['name'] = mcisName
    obj['description'] = mcisDesc
    obj['vm'] = mcpjs['mcismng/vmconfigureexpress'].Express_Server_Config_Arr
    console.log(obj)
    try {

        var controllerKeyName = "McisDynamicReg";
        var optionParamMap = new Map();
        mcpjs["util/pathfinder"].postCommonData('mciscreate',controllerKeyName,optionParamMap, obj, mcpjs['mcismng/mciscreate'].mcisDynamicRegCallbackSuccess)

        // client.post(url, obj, {
        //     headers: {
        //         'Content-type': 'application/json',
        //     },
        // }).then(result => {
        //     console.log("MCIR Register data : ", result)
        //     console.log("Result Status : ", result.status)
        //     if (result.status == 201 || result.status == 200) {
        //         mcpjs['util/util'].commonResultAlert("Register Success")
        //     } else {
        //         mcpjs['util/util'].commonAlert("Register Fail")
        //     }
        // }).catch((error) => {
        //     console.log(error.response)
        //     var errorMessage = error.response.data.error;
        //     var statusCode = error.response.status;
        //    mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)

        // })
    } catch (error) {
        mcpjs['util/util'].commonAlert(error);
        console.log(error);
    }
}

// mcisDynamicReg Callback
export function mcisDynamicRegCallbackSuccess(caller, result){
    console.log("MCIR Register data : ", result)
            console.log("Result Status : ", result.status)
            if (result.status == 201 || result.status == 200) {
                mcpjs['util/util'].commonResultAlert("Register Success")
            } else {
                mcpjs['util/util'].commonAlert("Register Fail")
            }
}