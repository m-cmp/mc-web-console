import { TabulatorFull as Tabulator } from "tabulator-tables";
//import { selectedMcisObj } from "./mcis";
//document.addEventListener("DOMContentLoaded", initMcisCreate) // page가 아닌 partials에서는 제거

// create page 가 load 될 때 실행해야 할 것들 정의
export function initMcisCreate() {
	console.log("initMcisCreate")

	// partial init functions

	webconsolejs["partials/operation/manage/serverrecommendation"].initServerRecommendation(webconsolejs["partials/operation/manage/mciscreate"].callbackServerRecommendation);// recommend popup에서 사용하는 table 정의.
}

// callback PopupData
export async function callbackServerRecommendation(vmSpec) {
	console.log("callbackServerRecommendation")

	$("#ep_provider").val(vmSpec.provider)
	$("#ep_connectionName").val(vmSpec.connectionName)
	$("#ep_specId").val(vmSpec.specName)
	$("#ep_imageId").val(vmSpec.imageName)
	$("#ep_commonSpecId").val(vmSpec.commonSpecId)

	var diskResp = await webconsolejs["common/api/services/disk_api"].getCommonLookupDiskInfo(vmSpec.provider, vmSpec.connectionName)
	getCommonLookupDiskInfoSuccess(vmSpec.provider, diskResp)
}

var DISK_SIZE = [];
function getCommonLookupDiskInfoSuccess(provider, data) {

	console.log("getCommonLookupDiskInfoSuccess", data);
	var providerId = provider.toUpperCase()
	var root_disk_type = [];
	var res_item = data;
	res_item.forEach(item => {
		console.log("item provider: ", item.providerId);
		var temp_provider = item.providerId
		if (temp_provider == providerId) {
			root_disk_type = item.rootdisktype
			DISK_SIZE = item.disksize
		}
	})
	// var temp_provider = res_item.providerId
	// if(temp_provider == provider){
	// 	root_disk_type = res_item.rootdisktype
	// 	DISK_SIZE = res_item.disksize
	// }

	console.log("DISK_SIZE", DISK_SIZE)
	var html = '<option value="">Select Root Disk Type</option>'
	console.log("root_disk_type : ", root_disk_type);
	root_disk_type.forEach(item => {
		html += '<option value="' + item + '">' + item + '</option>'
	})
	//if(caller == "vmexpress"){
	$("#ep_root_disk_type").empty();
	$("#ep_root_disk_type").append(html);
	//}else if(caller == "vmsimple"){
	// $("#ss_root_disk_type").empty();
	// $("#ss_root_disk_type").append(html);
	//}else if(caller == "vmexpert"){
	// $("#tab_others_root_disk_type").empty()
	// $("#tab_others_root_disk_type").append(html)
	//}
	console.log("const valie DISK_SIZE : ", DISK_SIZE)

	webconsolejs["partials/layout/modal"].modalHide('spec-search')

}

export async function setProviderList(providerList) {
	// TODO: simple form

	// expert form
	// 모든 provider들을 대문자로 변환
	myProviderList = providerList.map(str => str.toUpperCase());
	// 알파벳 순으로 정렬
	myProviderList.sort()
	console.log("myProviderList", myProviderList); // 변환된 배열 출력

	var html = '<option value="">Select Provider</option>'
	myProviderList.forEach(item => {
		html += '<option value="' + item + '">' + item + '</option>'
	})

	$("#expert_provider").empty();
	$("#expert_provider").append(html);

}

// region 목록 SET
export async function setRegionList(regionList) {
	// TODO: simple form

	// expert form
	if (Array.isArray(regionList) && typeof regionList[0] === 'string') {
		var html = '<option value="">Select Region</option>'
		myRegionList.forEach(item => {
			html += '<option value="' + item + '">' + item + '</option>'
		})

		$("#expert_region").empty();
		$("#expert_region").append(html);
	} else if (Array.isArray(regionList)) {
		// object에서 [providerName] + regionName 형태로 배열 생성
		regionList.forEach(region => {
			var providerName = region.ProviderName
			var regionName = region.RegionName

			var myRegionName = `[${providerName}] ${regionName}`

			myRegionList.push(myRegionName)
		})

		var html = '<option value="">Select Region</option>'
		myRegionList.forEach(item => {
			html += '<option value="' + item + '">' + item + '</option>'
		})

		$("#expert_region").empty();
		$("#expert_region").append(html);
	}
}

export async function setCloudConnection(cloudConnection) {
	// TODO: simple form

	// expert form
	if (Array.isArray(cloudConnection) && typeof cloudConnection[0] === 'string') {
		// 배열이고 첫 번째 요소가 문자열인 경우 / filter에서 사용

		// 알파벳 순으로 정렬
		cloudConnection.sort();
		console.log("cloudConnection", cloudConnection); // 변환된 배열 출력

		var html = '<option value="">Select Connection</option>';
		cloudConnection.forEach(item => {
			html += '<option value="' + item + '">' + item + '</option>';
		});

		$("#expert_cloudconnection").empty();
		$("#expert_cloudconnection").append(html);

	} else if (Array.isArray(cloudConnection)) {
		// array 형태일 때

		myCloudConnection = cloudConnection.map(item => item.configName);
		// 알파벳 순으로 정렬
		myCloudConnection.sort()
		console.log("myCloudConnection", myCloudConnection); // 변환된 배열 출력

		var html = '<option value="">Select Connection</option>'
		myCloudConnection.forEach(item => {
			html += '<option value="' + item + '">' + item + '</option>'
		})

		$("#expert_cloudconnection").empty();
		$("#expert_cloudconnection").append(html);

	} else {
		console.error("Unknown cloudConnection format");
		return;
	}
}
// for filterRegion func
// set된 값들
var myProviderList = []
var myRegionList = []
var myCloudConnection = []

// provider region cloudconnection filtering
var providerSelect = document.getElementById('expert_provider');
var regionSelect = document.getElementById('expert_region');
var connectionSelect = document.getElementById('expert_connection');
providerSelect.addEventListener('change', updateConfigurationFilltering);
regionSelect.addEventListener('change', updateConfigurationFilltering);
// connectionSelect.addEventListener('change', updateConfigurationFilltering);

async function updateConfigurationFilltering() {

	var selectedProvider = providerSelect.value; // 선택된 provider
	var selectedRegion = regionSelect.value; // 선택된 region
	// var selectedConnection = connectionSelect.value; // 선택된 connection

	//초기화 했을 시 
	if (selectedProvider === "") {
		await setRegionList(myRegionList)
		await setCloudConnection(myCloudConnection)

		return
	}

	// providr 선택시 region, connection filtering
	if (selectedProvider !== "" && selectedRegion === "") {

		// region filter
		var filteredRegion = myRegionList.filter(region => {
			return region.startsWith(`[${selectedProvider}]`)
		})

		var html = '<option value="">Select Region</option>'
		filteredRegion.forEach(item => {
			html += '<option value="' + item + '">' + item + '</option>'
		})

		$("#expert_region").empty();
		$("#expert_region").append(html);

		// connection filter

		// 비교를 위해 소문자로 변환
		var lowerSelectedProvider = selectedProvider.toLowerCase();
		var filteredConnection = myCloudConnection.filter(connection => {

			return connection.startsWith(lowerSelectedProvider);
		});

		var nhtml = '<option value="">Select Connection</option>'
		filteredConnection.forEach(item => {
			nhtml += '<option value="' + item + '">' + item + '</option>'
		})

		$("#expert_cloudconnection").empty();
		$("#expert_cloudconnection").append(nhtml);

	}

	// region 선택시 connection filtering
	if (selectedRegion != "") {

		var cspRegex = /^\[(.*?)\]/; // "[CSP]" 형식의 문자열에서 CSP 이름 추출
		var cspMatch = selectedRegion.match(cspRegex);
		var provider = cspMatch ? cspMatch[1].toLowerCase() : null; // CSP 이름 추출 및 소문자 변환

		var filteredConnections = myCloudConnection.filter(connection => {
			return connection.startsWith(`${provider}`);
		});

		var html = '<option value="">Select Connection</option>'
		filteredConnections.forEach(item => {
			html += '<option value="' + item + '">' + item + '</option>'
		})

		$("#expert_cloudconnection").empty();
		$("#expert_cloudconnection").append(html);

	}

}

var createMcisListObj = new Object();
var isVm = false // mcis 생성(false) / vm 추가(true)
var Express_Server_Config_Arr = new Array();
var express_data_cnt = 0


// 서버 더하기버튼 클릭시 서버정보 입력area 보이기/숨기기
// isExpert의 체크 여부에 따라 바뀜.
// newServers 와 simpleServers가 있음.
export async function displayNewServerForm() {
	var deploymentAlgo = $("#mcis_deploy_algorithm").val();

	if (deploymentAlgo == "express") {
		var div = document.getElementById("server_configuration");
		webconsolejs["partials/layout/navigatePages"].toggleElement(div)

	} else if (deploymentAlgo == "simple") {
		// var div = document.getElementById("server_configuration");
		// webconsolejs["partials/layout/navigatePages"].toggleElement(div)

	} else if (deploymentAlgo == "expert") {
		// call getProviderList API
		var providerList = await webconsolejs["common/api/services/mcis_api"].getProviderList()
		// provider set
		await setProviderList(providerList)

		// call getRegion API
		var regionList = await webconsolejs["common/api/services/mcis_api"].getRegionList()
		// region set
		await setRegionList(regionList)

		// call cloudconnection
		var connectionList = await webconsolejs["common/api/services/mcis_api"].getCloudConnection()
		// cloudconnection set
		await setCloudConnection(connectionList)

		// toggle expert form
		var div = document.getElementById("expert_server_configuration");
		webconsolejs["partials/layout/navigatePages"].toggleElement(div)

	} else {
		console.error(e)
	}


	// var expressServerConfig = $("#expressServerConfig");
	// var deploymentAlgo = $("#placement_algo").val();
	// var simpleServerConfig = $("#simpleServerConfig");
	// var expertServerConfig = $("#expertServerConfig");
	// var importServerConfig = $("#importServerConfig");
	// var expressServerConfig = $("#expressServerConfig");
	// console.log("is import = " + IsImport + " , deploymentAlgo " + deploymentAlgo)
	// // if ($("#isImport").is(":checked")) {
	// if (IsImport) {
	//     simpleServerConfig.removeClass("active");
	//     expertServerConfig.removeClass("active");
	//     importServerConfig.addClass("active");
	//     expressServerConfig.removeClass("active");
	// } else if (deploymentAlgo == "expert") {
	//     simpleServerConfig.removeClass("active");
	//     expertServerConfig.toggleClass("active");//
	//     importServerConfig.removeClass("active");
	//     expressServerConfig.removeClass("active");
	// } else if (deploymentAlgo == "simple") {
	//     simpleServerConfig.toggleClass("active");//
	//     expertServerConfig.removeClass("active");
	//     importServerConfig.removeClass("active");
	//     expressServerConfig.removeClass("active");

	// } else {
	//     //simpleServerConfig        
	//     console.log("exp")
	//     simpleServerConfig.removeClass("active");
	//     expertServerConfig.removeClass("active");
	//     importServerConfig.removeClass("active");
	//     expressServerConfig.toggleClass("active");//        
	// }
}


// express모드 -> Done버튼 클릭 시
export function expressDone_btn() {

	console.log("hi")

	// express 는 common resource를 하므로 별도로 처리(connection, spec만)
	$("#p_provider").val($("#ep_provider").val())
	$("#p_connectionName").val($("#ep_connectionName").val())
	$("#p_name").val($("#ep_name").val())
	$("#p_description").val($("#ep_description").val())
	$("#p_imageId").val($("#ep_imageId").val())

	$("#p_commonImageId").val($("#ep_commonImageId").val())

	$("#p_commonSpecId").val($("#ep_commonSpecId").val())
	$("#p_root_disk_type").val($("#ep_root_disk_type").val())
	$("#p_root_disk_size").val($("#ep_root_disk_size").val())

	$("#p_specId").val($("#ep_specId").val())

	$("#p_subGroupSize").val($("#ep_vm_add_cnt").val() + "")
	$("#p_vm_cnt").val($("#ep_vm_add_cnt").val() + "")

	//var express_form = $("#express_form").serializeObject()
	// commonSpec 으로 set 해야하므로 재설정
	var express_form = {}
	express_form["name"] = $("#p_name").val();
	express_form["connectionName"] = $("#p_connectionName").val();
	express_form["description"] = $("#p_description").val();
	express_form["subGroupSize"] = $("#p_subGroupSize").val();
	express_form["image"] = $("#p_imageId").val();
	express_form["spec"] = $("#p_specId").val();
	express_form["rootDiskSize"] = $("#p_root_disk_size").val();
	express_form["rootDiskType"] = $("#p_root_disk_type").val();

	// dynamic에서 commonImage를 param으로 받기 때문에 해당 값 설정
	express_form["commonImage"] = $("#p_commonImageId").val();
	express_form["commonSpec"] = $("#p_commonSpecId").val();//

	console.log("express_form form : ", express_form);

	var server_name = express_form.name

	var server_cnt = parseInt(express_form.subGroupSize)
	console.log("server_cnt", server_cnt)

	var add_server_html = "";

	Express_Server_Config_Arr.push(express_form)


	var displayServerCnt = '(' + server_cnt + ')'

	add_server_html += '<li class="removebullet btn btn-info" onclick="webconsolejs[\'partials/operation/manage/mciscreate\'].view_express(\'' + express_data_cnt + '\')">'

		+ server_name + displayServerCnt

		+ '</li>';

	// }
	// $(".section").removeClass("active");

	// var div = document.getElementById("server_configuration");
	// webconsolejs["partials/layout/navigatePages"].toggleElement(div)

	var div = document.getElementById("server_configuration");
	webconsolejs["partials/layout/navigatePages"].toggleSubElement(div)

	// $("#mcis_server_list").prepend(add_server_html)
	// $("#plusVmIcon").remove();
	// $("#mcis_server_list").prepend(getPlusVm());


	console.log("add server html");

	var vmEleId = "vm"
	if (!isVm) {
		vmEleId = "mcis"
	}
	console.log("add vm")
	$("#" + vmEleId + "_plusVmIcon").remove();
	$("#" + vmEleId + "_server_list").append(add_server_html)
	$("#" + vmEleId + "_server_list").prepend(getPlusVm(vmEleId));


	console.log("express btn click and express form data : ", express_form)
	console.log("express data array : ", Express_Server_Config_Arr);
	express_data_cnt++;
	$("#express_form").each(function () {
		this.reset();
	})
	$("#ep_data_disk").val("");

}

export function view_express(cnt) {
	console.log('view simple cnt : ', cnt);
	// var select_form_data = Simple_Server_Config_Arr[cnt]
	// console.log('select_form_data : ', select_form_data);
	// $(".express_servers_config").addClass("active")
	// $(".simple_servers_config").removeClass("active")
	// $(".expert_servers_config").removeClass("active")
	// $(".import_servers_config").removeClass("active")

	var div = document.getElementById("server_configuration");
	webconsolejs["partials/layout/navigatePages"].toggleElement(div)


}


// Assist spec 클릭 시
// 공통으로 뺄 것

var ROOT_DISK_MAX_VALUE = 0;
var ROOT_DISK_MIN_VALUE = 0;

// Disk Type 선택 시 Disk Size Min/Max 설정 > 보완할 것
export function changeDiskSize(type) {
	var disk_size = DISK_SIZE;

	if (disk_size) {
		disk_size.forEach(item => {
			var temp_size = item.split("|")
			var temp_type = temp_size[0];
			if (temp_type == type) {
				ROOT_DISK_MAX_VALUE = temp_size[1]
				ROOT_DISK_MIN_VALUE = temp_size[2]
			}
		})
	}
	console.log("ROOT_DISK_MAX_VALUE : ", ROOT_DISK_MAX_VALUE)
	console.log("ROOT_DISK_MIN_VALUE : ", ROOT_DISK_MIN_VALUE)
	$("#s_rootDiskType").val(type);
	$("#e_rootDiskType").val(type);

}




// plus 버튼을 추가
function getPlusVm(vmElementId) {

	var append = "";
	append = append + '<li class="removebullet btn btn-secondary-lt" id="' + vmElementId + '_plusVmIcon" onClick="webconsolejs[\'partials/operation/manage/mciscreate\'].displayNewServerForm()">';
	append = append + "+"
	append = append + '</li>';
	return append;
}
// 서버정보 입력 area에서 'DONE'버튼 클릭시 array에 담고 form을 초기화

var totalDeployServerCount = 0;
var TotalServerConfigArr = new Array();// 최종 생성할 서버 목록
// deploy 버튼 클릭시 등록한 서버목록을 배포.
// function btn_deploy(){
export function deployMcis() {
	console.log("deployMcis")
	createMcisDynamic()
	// express 는 express 만, simple + expert + import 는 합쳐서
	// 두개의 mcis는 만들어 질 수 없으므로 
	// var deploymentAlgo = $("#placement_algo").val()
	// if (deploymentAlgo == "express") {
	// 	createMcisDynamic()
	// }
	// else{
	//     var mcis_name = $("#mcis_name").val();
	//     if (!mcis_name) {
	//         commonAlert("Please Input MCIS Name!!!!!")
	//         return;
	//     }
	//     var mcis_desc = $("#mcis_desc").val();
	//     var placement_algo = $("#placement_algo").val();
	//     var installMonAgent = $("#installMonAgent").val();

	//     var new_obj = {}

	//     var vm_len = 0;

	//     if (IsImport) {
	//         // ImportedMcisScript.name = mcis_name;
	//         // ImportedMcisScript.description = mcis_desc;
	//         // ImportedMcisScript.installMonAgent = installMonAgent;
	//         // console.log(ImportedMcisScript);
	//         //var theJson = jQuery.parseJSON($(this).val())
	//         //$("#mcisImportScriptPretty").val(fmt);	
	//         new_obj = $("#mcisImportScriptPretty").val();
	//         new_obj.id = "";// id는 비워준다.
	//     } else {
	//         //         console.log(Simple_Server_Config_Arr)

	//         // mcis 생성이므로 mcisID가 없음
	//         new_obj['name'] = mcis_name
	//         new_obj['description'] = mcis_desc
	//         new_obj['installMonAgent'] = installMonAgent

	//         // Express_Server_Config_Arr 은 별도처리


	//         if (Simple_Server_Config_Arr) {
	//             vm_len = Simple_Server_Config_Arr.length;
	//             for (var i in Simple_Server_Config_Arr) {
	//                 TotalServerConfigArr.push(Simple_Server_Config_Arr[i]);
	//             }
	//         }

	//         if (Expert_Server_Config_Arr) {
	//             vm_len = Expert_Server_Config_Arr.length;
	//             for (var i in Expert_Server_Config_Arr) {
	//                 TotalServerConfigArr.push(Expert_Server_Config_Arr[i]);
	//             }
	//         }

	//         if (TotalServerConfigArr) {
	//             vm_len = TotalServerConfigArr.length;
	//             console.log("Server_Config_Arr length: ", vm_len);
	//             new_obj['vm'] = TotalServerConfigArr;
	//             console.log("new obj is : ", new_obj);
	//         } else {
	//             commonAlert("Please Input Servers");
	//             $(".simple_servers_config").addClass("active");
	//             $("#s_name").focus();
	//         }
	//     }

	//     var url = getWebToolUrl("McisRegProc")
	//     try {
	//         axios.post(url, new_obj, {
	//             // headers: {
	//             //     'Content-type': "application/json",
	//             // },
	//         }).then(result => {
	//             console.log("MCIR Register data : ", result);
	//             console.log("Result Status : ", result.status);
	//             if (result.status == 201 || result.status == 200) {
	//                 commonResultAlert("Register Requested")
	//             } else {
	//                 commonAlert("Register Fail")
	//             }
	//         }).catch((error) => {
	//             // console.warn(error);
	//             console.log(error.response)
	//             var errorMessage = error.response.data.error;
	//             var statusCode = error.response.status;
	//             commonErrorAlert(statusCode, errorMessage)

	//         })
	//     } catch (error) {
	//         commonAlert(error);
	//         console.log(error);
	//     }
	// }    
}
export async function createMcisDynamic() {
	console.log("createMcisDynamic")
	// var namespace = webconsolejs["common/api/services/workspace_api"].getCurrentProject()
	// nsid = namespace.Name
	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

	var selectedNsId = selectedWorkspaceProject.nsId;
	var projectId = $("#select-current-project").text()
	var projectName = $('#select-current-project').find('option:selected').text();
	var nsId = projectName;
	console.log("create ssss nsId ", projectName)

	var mcisName = $("#mcis_name").val()
	var mcisDesc = $("#mcis_desc").val()


	console.log("mcisName", mcisName)
	console.log("mcisDesc", mcisDesc)
	console.log("Express_Server_Config_Arr", Express_Server_Config_Arr)



	if (!mcisName) {
		commonAlert("Please Input MCIS Name!!!!!")
		return;
	}

	if (!mcisDesc) {
		mcisDesc = "Made in CB-TB"
	}

	webconsolejs["common/api/services/mcis_api"].mcisDynamic(mcisName, mcisDesc, Express_Server_Config_Arr, selectedNsId)
}

export async function createVmDynamic() {
	console.log("createVmDynamic")
	console.log("Express_Server_Config_Arr", Express_Server_Config_Arr)

	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

	var selectedNsId = selectedWorkspaceProject.nsId;
	console.log("selected projectId : ", selectedNsId)

	var mcisid = webconsolejs["pages/operation/manage/mcis"].selectedMcisObj[0].id
	console.log("selected mcisId : ", mcisid)

	// var commonImage = selectedMcisObj[0].vm[0].
	// var mcis_name = selectedMcis[0].name

	// var mcis_name = $("#mcis_name").val();
	// var mcis_id = $("#mcis_id").val();
	// if (!mcis_id) {
	// 	commonAlert("Please Select MCIS !!!!!")
	// 	return;
	// }

	///
	webconsolejs["common/api/services/mcis_api"].vmDynamic(mcisid, selectedNsId, Express_Server_Config_Arr)
}

export function addNewMcis() {
	isVm = false
	Express_Server_Config_Arr = new Array();
}

// ////////////// VM Handling ///////////
export function addNewVirtualMachine() {
	console.log("addNewVirtualMachine")
	Express_Server_Config_Arr = new Array();

	var selectedMcis = webconsolejs["pages/operation/manage/mcis"].selectedMcisObj
	console.log("selectedMcis", selectedMcis)

	var mcis_name = selectedMcis[0].name
	var mcis_desc = selectedMcis[0].description

	$("#extend_mcis_name").val(mcis_name)

	$("#extend_mcis_desc").val(mcis_desc)
	console.log("extend_mcis_desc", mcis_desc)

	isVm = true
}

export async function deployVm() {
	// var deploymentAlgo = $("#placement_algo").val()
	// if (deploymentAlgo == "express") {
	await createVmDynamic()
	// }else{

	//     var mcis_name = $("#mcis_name").val();
	//     var mcis_id = $("#mcis_id").val();
	//     if (!mcis_id) {
	//         commonAlert("Please Select MCIS !!!!!")
	//         return;
	//     }
	//     totalDeployServerCount = 0;// deploy vm 개수 초기화
	//     var new_obj = {}// vm이 담길 변수

	//     // Express 는 별도처리임.

	//     if (Simple_Server_Config_Arr) {
	//         vm_len = Simple_Server_Config_Arr.length;
	//         for (var i in Simple_Server_Config_Arr) {
	//             TotalServerConfigArr.push(Simple_Server_Config_Arr[i]);
	//         }
	//     }

	//     if (Expert_Server_Config_Arr) {
	//         vm_len = Expert_Server_Config_Arr.length;
	//         for (var i in Expert_Server_Config_Arr) {
	//             TotalServerConfigArr.push(Expert_Server_Config_Arr[i]);
	//         }
	//     }

	//     //Import_Server_Config_Arr : import도 같이 추가
	//     if (Import_Server_Config_Arr) {
	//         vm_len = Import_Server_Config_Arr.length;
	//         for (var i in Import_Server_Config_Arr) {
	//             TotalServerConfigArr.push(Import_Server_Config_Arr[i]);
	//         }
	//     }

	//     if (TotalServerConfigArr) {
	//         vm_len = TotalServerConfigArr.length;
	//         console.log("Server_Config_Arr length: ", vm_len);
	//         new_obj['vm'] = TotalServerConfigArr;
	//         console.log("new obj is : ", new_obj);
	//     } else {
	//         commonAlert("Please Input Servers");
	//         $(".simple_servers_config").addClass("active");
	//         $("#s_name").focus();
	//     }

	//     //var url = "/operation/manages/mcismng/" + mcis_id + "/vm/reg/proc"
	//     var urlParamMap = new Map();
	//     urlParamMap.set(":mcisID", mcis_id)
	//     var url = setUrlByParam("McisVmListRegProc", urlParamMap)
	//     //var url = getWebToolUrl("McisVmRegProc")
	//     try {
	//         axios.post(url, new_obj, {
	//             // headers: {
	//             //     'Content-type': "application/json",
	//             // },
	//         }).then(result => {
	//             console.log("VM Register data : ", result);
	//             console.log("Result Status : ", result.status);
	//             if (result.status == 201 || result.status == 200) {
	//                 commonResultAlert("Register Requested")
	//             } else {
	//                 commonAlert("Register Fail")
	//             }
	//         }).catch((error) => {
	//             // console.warn(error);
	//             console.log(error.response)
	//             var errorMessage = error.response.data.error;
	//             var statusCode = error.response.status;
	//             commonErrorAlert(statusCode, errorMessage)

	//         })
	//     } catch (error) {
	//         commonAlert(error);
	//         console.log(error);
	//     }
	// }
}

// {
// 	"commonImage": "ubuntu18.04",
// 	"commonSpec": "aws+ap-northeast-2+t2.small",
// 	"connectionName": "string",
// 	"description": "Description",
// 	"label": "DynamicVM",
// 	"name": "g1-1",
// 	"rootDiskSize": "default, 30, 42, ...",
// 	"rootDiskType": "default, TYPE1, ...",
// 	"subGroupSize": "3",
// 	"vmUserPassword": "string"
//   }



///



// vm 생성 결과 표시
// 여러개의 vm이 생성될 수 있으므로 각각 결과를 표시
var resultVmCreateMap = new Map();

function vmCreateCallback(resultVmKey, resultStatus) {
	resultVmCreateMap.set(resultVmKey, resultStatus)
	var resultText = "";
	var createdServer = 0;
	for (let key of resultVmCreateMap.keys()) {
		console.log("vmCreateresult " + key + " : " + resultVmCreateMap.get(resultVmKey));
		resultText += key + " = " + resultVmCreateMap.get(resultVmKey) + ","
		//totalDeployServerCount--
		createdServer++;
	}

	// $("#serverRegistResult").text(resultText);

	if (resultStatus != "Success") {
		// add된 항목 제거 해야 함.

		// array는 초기화
		Simple_Server_Config_Arr.length = 0;
		simple_data_cnt = 0
		// TODO : expert 추가하면 주석 제거할 것
		Expert_Server_Config_Arr.length = 0;
		expert_data_cnt = 0
		Import_Server_Config_Arr.length = 0;
		import_data_cnt = 0
	}

	if (createdServer === totalDeployServerCount) { //모두 성공
		//getVmList();
		//commonResultAlert($("#serverRegistResult").text());

	} else if (createdServer < totalDeployServerCount) { //일부 성공
		// commonResultAlert($("#serverRegistResult").text());

	} else if (createdServer = 0) { //모두 실패
		//commonResultAlert($("#serverRegistResult").text());
	}
	commonResultAlert("VM creation request completed");
}

// server quantity 
$(document).ready(function () {
	$(".input-number-increment").click(function () {
		var $input = $(this).siblings(".input-number");
		var val = parseInt($input.val(), 10);
		var max = parseInt($input.attr('max'), 10);
		if (val < max) {
			$input.val(val + 1);
		}
	});

	$(".input-number-decrement").click(function () {
		var $input = $(this).siblings(".input-number");
		var val = parseInt($input.val(), 10);
		var min = parseInt($input.attr('min'), 10);
		if (val > min) {
			$input.val(val - 1);
		}
	});
});  