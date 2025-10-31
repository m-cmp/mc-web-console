import { TabulatorFull as Tabulator } from "tabulator-tables";
//import { selectedMciObj } from "./mci";
//document.addEventListener("DOMContentLoaded", initMciCreate) // page가 아닌 partials에서는 제거

// 새로운 MCI API 인터페이스에 맞는 데이터 변환 헬퍼 함수
function transformServerConfigToSubGroups(serverConfigArr) {
  return serverConfigArr.map(config => ({
    specId: config.commonSpec,
    imageId: config.commonImage,
    name: config.name,
    subGroupSize: config.subGroupSize,
    connectionName: config.connectionName,
    description: config.description,
    rootDiskSize: config.rootDiskSize,
    rootDiskType: config.rootDiskType,
    command: config.command
  }));
}

// create page 가 load 될 때 실행해야 할 것들 정의
export function initMciCreate() {
	// MCI Create 초기화

	// partial init functions

	webconsolejs["partials/operation/manage/serverrecommendation"].initServerRecommendation(webconsolejs["partials/operation/manage/mcicreate"].callbackServerRecommendation);// recommend popup에서 사용하는 table 정의.
	
	webconsolejs["partials/operation/manage/imagerecommendation"].initImageModal(); // 이미지 추천 모달 초기화
	
	// 이미지 선택 콜백 함수 설정
	webconsolejs["partials/operation/manage/imagerecommendation"].setImageSelectionCallback(webconsolejs["partials/operation/manage/mcicreate"].callbackImageRecommendation);
}

// callback PopupData
export async function callbackServerRecommendation(vmSpec) {
	// MCI Server Recommendation 콜백 함수

	$("#ep_provider").val(vmSpec.provider)
	$("#ep_connectionName").val(vmSpec.connectionName)
	$("#ep_specId").val(vmSpec.specName)
	$("#ep_commonSpecId").val(vmSpec.commonSpecId)
	
	// policy_ep_* 필드들도 함께 설정 (mciworkloads.html용)
	$("#policy_ep_provider").val(vmSpec.provider)
	$("#policy_ep_connectionName").val(vmSpec.connectionName)
	$("#policy_ep_specId").val(vmSpec.specName)
	$("#policy_ep_commonSpecId").val(vmSpec.commonSpecId)
	
	// spec 정보를 전역 변수에 저장 (이미지 선택 시 사용)
	window.selectedSpecInfo = {
		provider: vmSpec.provider,
		connectionName: vmSpec.connectionName,
		regionName: vmSpec.regionName || vmSpec.connectionName.replace(vmSpec.provider + "-", ""),
		osArchitecture: vmSpec.osArchitecture || "x86_64", // 기본값 설정
		specName: vmSpec.specName,
		commonSpecId: vmSpec.commonSpecId
	};
	
	// 이미지 모달의 필드들을 즉시 세팅 (PMK와 동일한 방식)
	$("#image-provider").val(window.selectedSpecInfo.provider);
	$("#image-region").val(window.selectedSpecInfo.regionName);
	$("#image-os-architecture").val(window.selectedSpecInfo.osArchitecture);

	var diskResp = await webconsolejs["common/api/services/disk_api"].getCommonLookupDiskInfo(vmSpec.provider, vmSpec.connectionName)
	getCommonLookupDiskInfoSuccess(vmSpec.provider, diskResp)
	

}

// 이미지 선택 콜백 함수
export function callbackImageRecommendation(selectedImage) {
	// MCI 이미지 선택 콜백 함수
	
	// 부모 폼의 input 필드에 이미지 정보 설정
	$("#ep_imageId_input").val(selectedImage.name || selectedImage.cspImageName || "");
	$("#ep_imageId").val(selectedImage.id || selectedImage.name || "");
	$("#ep_commonImageId").val(selectedImage.id || selectedImage.name || "");
	
	// policy_ep_* 필드들도 함께 설정 (mciworkloads.html용)
	$("#policy_ep_imageId_input").val(selectedImage.name || selectedImage.cspImageName || "");
	$("#policy_ep_commonImageId").val(selectedImage.id || selectedImage.name || "");
	

}

var DISK_SIZE = [];
function getCommonLookupDiskInfoSuccess(provider, data) {

	var providerId = provider.toUpperCase()
	var root_disk_type = [];
	var res_item = data;
	res_item.forEach(item => {
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

	var html = '<option value="">Select Root Disk Type</option>'
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

	webconsolejs["partials/layout/modal"].modalHide('spec-search')

}

export async function setProviderList(providerList) {
	// TODO: simple form

	// expert form
	// 모든 provider들을 대문자로 변환
	myProviderList = providerList.map(str => str.toUpperCase());
	// 알파벳 순으로 정렬
	myProviderList.sort()

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

var createMciListObj = new Object();
var isVm = false // mci 생성(false) / vm 추가(true)
var Express_Server_Config_Arr = new Array();
var express_data_cnt = 0


// 서버 더하기버튼 클릭시 서버정보 입력area 보이기/숨기기
// isExpert의 체크 여부에 따라 바뀜.
// newServers 와 simpleServers가 있음.
export async function displayNewServerForm() {
	var deploymentAlgo = $("#mci_deploy_algorithm").val();

	if (deploymentAlgo == "express") {
		// 폼을 열기 전에 추가 초기화
		$("#ep_name").val("");
		$("#ep_description").val("");
		$("#ep_imageId_input").val("");
		$("#ep_root_disk_type").val("");
		$("#ep_root_disk_size").val("");
		$("#ep_vm_add_cnt").val("1"); // 기본값 1로 설정
		$("#ep_data_disk").val("");
		$("#ep_command").val("");
		
		// 모달들 초기화
		resetModals();
		
		var div = document.getElementById("server_configuration");
		webconsolejs["partials/layout/navigatePages"].toggleSubElement(div)

	} else if (deploymentAlgo == "simple") {
		// var div = document.getElementById("server_configuration");
		// webconsolejs["partials/layout/navigatePages"].toggleElement(div)

	} else if (deploymentAlgo == "expert") {
		// call getProviderList API
		var providerList = await webconsolejs["common/api/services/mci_api"].getProviderList()
		// provider set
		await setProviderList(providerList)

		// call getRegion API
		var regionList = await webconsolejs["common/api/services/mci_api"].getRegionList()
		// region set
		await setRegionList(regionList)

		// call cloudconnection
		var connectionList = await webconsolejs["common/api/services/mci_api"].getCloudConnection()
		// cloudconnection set
		await setCloudConnection(connectionList)

		// toggle expert form
		var div = document.getElementById("expert_server_configuration");
		webconsolejs["partials/layout/navigatePages"].toggleSubElement(div)

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
	// 1. 필수 필드 검증
	var requiredFields = [
		{ id: '#ep_name', message: 'SubGroup name is required' },
		{ id: '#ep_vm_add_cnt', message: 'VM count is required' },
		{ id: '#ep_commonSpecId', message: 'Spec is required' },
		{ id: '#ep_commonImageId', message: 'Image is required' }
	];
	
	for (var field of requiredFields) {
		if (!$(field.id).val() || $(field.id).val().trim() === '') {
			alert(field.message);
			$(field.id).focus();
			return;
		}
	}
	
	// 2. VM 개수 숫자 검증
	var vmAddCnt = $("#ep_vm_add_cnt").val();
	if (isNaN(vmAddCnt) || parseInt(vmAddCnt) < 1) {
		alert('VM count must be a positive number');
		$("#ep_vm_add_cnt").focus();
		return;
	}
	
	// express 는 common resource를 하므로 별도로 처리(connection, spec만)
	$("#p_provider").val($("#ep_provider").val())
	$("#p_connectionName").val($("#ep_connectionName").val())
	$("#p_name").val($("#ep_name").val())
	$("#p_description").val($("#ep_description").val())
	$("#p_imageId").val($("#ep_imageId").val())
	$("#p_commonImageId").val($("#ep_commonImageId").val())
	$("#ep_imageId_input").val($("#ep_imageId").val()) // 이미지 입력 필드도 업데이트
	$("#p_commonSpecId").val($("#ep_commonSpecId").val())
	$("#p_root_disk_type").val($("#ep_root_disk_type").val())
	$("#p_root_disk_size").val($("#ep_root_disk_size").val())
	$("#p_specId").val($("#ep_specId").val())
	$("#p_command").val($("#ep_command").val())
	// ep_vm_add_cnt가 비어있으면 기본값 1로 설정
	var vmAddCnt = $("#ep_vm_add_cnt").val();
	if (!vmAddCnt || vmAddCnt.trim() === "") {
		vmAddCnt = "1";
	}
	$("#p_subGroupSize").val(vmAddCnt)
	$("#p_vm_cnt").val(vmAddCnt)

	// commonSpec 으로 set 해야하므로 재설정
	var express_form = {}
	express_form["name"] = $("#p_name").val();
	express_form["description"] = $("#p_description").val();
	express_form["subGroupSize"] = $("#p_subGroupSize").val();
	express_form["rootDiskSize"] = $("#p_root_disk_size").val();
	express_form["rootDiskType"] = $("#p_root_disk_type").val();
	express_form["rootDiskType"] = $("#p_root_disk_type").val();
	express_form["commonSpec"] = $("#p_commonSpecId").val();
	express_form["commonImage"] = $("#p_commonImageId").val();
	express_form["command"] = $("#p_command").val();
	
	var server_name = express_form.name;
	var server_cnt = parseInt(express_form.subGroupSize);

	var add_server_html = "";

	Express_Server_Config_Arr.push(express_form);

	var displayServerCnt = '(' + server_cnt + ')';
	add_server_html += '<li class="removebullet btn btn-info" onclick="webconsolejs[\'partials/operation/manage/mcicreate\'].view_express(\'' + express_data_cnt + '\')">'
		+ server_name + displayServerCnt
		+ '</li>';

	var div = document.getElementById("server_configuration");
	webconsolejs["partials/layout/navigatePages"].toggleSubElement(div);

	var vmEleId = "vm";
	if (!isVm) {
		vmEleId = "mci";
	}
	$("#" + vmEleId + "_plusVmIcon").remove();
	$("#" + vmEleId + "_server_list").append(add_server_html);
	$("#" + vmEleId + "_server_list").prepend(getPlusVm(vmEleId));

	express_data_cnt++;
	
	// 폼 초기화 - 모든 입력 필드 초기화
	$("#express_form").each(function () {
		this.reset();
	});
	
	// 숨겨진 필드들 초기화
	$("#ep_provider").val("");
	$("#ep_connectionName").val("");
	$("#ep_imageId").val("");
	$("#ep_commonImageId").val("");
	$("#ep_commonSpecId").val("");
	$("#ep_specId").val("");
	
	// 직접 입력 필드들 초기화
	$("#ep_name").val("");
	$("#ep_description").val("");
	$("#ep_imageId_input").val("");
	$("#ep_root_disk_type").val("");
	$("#ep_root_disk_size").val("");
	$("#ep_vm_add_cnt").val("1"); // 기본값 1로 설정
	$("#ep_data_disk").val("");
	$("#ep_command").val("");
	
	// 모달들 초기화
	resetModals();
}

// 모달들 초기화 함수
function resetModals() {
	// Spec Search 모달 초기화
	if (typeof webconsolejs !== 'undefined' && webconsolejs['partials/operation/manage/serverrecommendation']) {
		// Spec 모달의 테이블 초기화
		if (window.recommendTable) {
			window.recommendTable.clearData();
		}
		// Spec 모달의 선택 상태 초기화
		$("#spec-search input[type='checkbox']").prop('checked', false);
		$("#spec-search .form-control").val("");
		// Cloud Provider Filter 드롭다운 초기화
		$("#spec-provider-filter").val("");
		// Region 드롭다운 초기화
		$("#assistRecommendSpecConnectionName").val("");
	}
	
	// Image Search 모달 초기화
	if (typeof webconsolejs !== 'undefined' && webconsolejs['partials/operation/manage/imagerecommendation']) {
		// Image 모달의 테이블 초기화
		if (window.recommendImageTable) {
			window.recommendImageTable.clearData();
		}
		// Image 모달의 선택 상태 초기화
		$("#image-search input[type='checkbox']").prop('checked', false);
		$("#image-search .form-control").val("");
		$("#assist_os_type").val("");
		$("#gpu_image_value").val("false");
		$("#assist_gpu_image").prop('checked', false);
	}
}

export function view_express(cnt) {
	// var select_form_data = Simple_Server_Config_Arr[cnt]
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

	if (disk_size && Array.isArray(disk_size)) {
		disk_size.forEach(item => {
			// item이 문자열인지 확인 후 split 실행
			if (typeof item === 'string' && item.includes('|')) {
				var temp_size = item.split("|")
				var temp_type = temp_size[0];
				if (temp_type == type) {
					ROOT_DISK_MAX_VALUE = temp_size[1]
					ROOT_DISK_MIN_VALUE = temp_size[2]
				}
			}
		})
	}
	$("#s_rootDiskType").val(type);
	$("#e_rootDiskType").val(type);

}




// plus 버튼을 추가
function getPlusVm(vmElementId) {

	var append = "";
	append = append + '<li class="removebullet btn btn-secondary-lt" id="' + vmElementId + '_plusVmIcon" onClick="webconsolejs[\'partials/operation/manage/mcicreate\'].displayNewServerForm()">';
	append = append + "+ SubGroup"
	append = append + '</li>';
	return append;
}
// 서버정보 입력 area에서 'DONE'버튼 클릭시 array에 담고 form을 초기화

var totalDeployServerCount = 0;
var TotalServerConfigArr = new Array();// 최종 생성할 서버 목록
// deploy 버튼 클릭시 등록한 서버목록을 배포.
// function btn_deploy(){
export function deployMci() {
	createMciDynamic()
	// express 는 express 만, simple + expert + import 는 합쳐서
	// 두개의 mci는 만들어 질 수 없으므로 
	// var deploymentAlgo = $("#placement_algo").val()
	// if (deploymentAlgo == "express") {
	// 	createMciDynamic()
	// }
	// else{
	//     var mci_name = $("#mci_name").val();
	//     if (!mci_name) {
	//         commonAlert("Please Input MCIS Name!!!!!")
	//         return;
	//     }
	//     var mci_desc = $("#mci_desc").val();
	//     var placement_algo = $("#placement_algo").val();
	//     var installMonAgent = $("#installMonAgent").val();

	//     var new_obj = {}

	//     var vm_len = 0;

	//     if (IsImport) {
	//         // ImportedMciScript.name = mci_name;
	//         // ImportedMciScript.description = mci_desc;
	//         // ImportedMciScript.installMonAgent = installMonAgent;
	//         // console.log(ImportedMciScript);
	//         //var theJson = jQuery.parseJSON($(this).val())
	//         //$("#mciImportScriptPretty").val(fmt);	
	//         new_obj = $("#mciImportScriptPretty").val();
	//         new_obj.id = "";// id는 비워준다.
	//     } else {
	//         //         console.log(Simple_Server_Config_Arr)

	//         // mci 생성이므로 mciID가 없음
	//         new_obj['name'] = mci_name
	//         new_obj['description'] = mci_desc
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

	//     var url = getWebToolUrl("MciRegProc")
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
export async function createMciDynamic() {
	// var namespace = webconsolejs["common/api/services/workspace_api"].getCurrentProject()
	// nsid = namespace.Name
	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

	var selectedNsId = selectedWorkspaceProject.nsId;
	var projectId = $("#select-current-project").text()
	var projectName = $('#select-current-project').find('option:selected').text();
	var nsId = projectName;

	var mciName = $("#mci_name").val()
	var mciDesc = $("#mci_desc").val()
	var policyOnPartialFailure = $("#mci_policy_on_partial_failure").val()


	
	if (!mciName) {
		alert("Please Input MCI Name!!!!!")
		return;
	}

	if (!mciDesc) {
		mciDesc = "Made in CB-TB"
	}

	// MCI 생성 전 검증 API 호출
	try {
		const validationResult = await webconsolejs["common/api/services/mci_api"].mciDynamicReview(
			mciName, mciDesc, Express_Server_Config_Arr, selectedNsId
		);
		
		
		if (validationResult && validationResult.status === 200) {
			const reviewData = validationResult.data.responseData;
			
			// 검증 결과에 따른 처리
			if (reviewData.creationViable) {
				if (reviewData.overallStatus === "Ready") {
					// 검증 성공 - 실제 MCI 생성 진행
					webconsolejs["common/api/services/mci_api"].mciDynamic(mciName, mciDesc, Express_Server_Config_Arr, selectedNsId, policyOnPartialFailure);
				} else if (reviewData.overallStatus === "Warning") {
					// 경고가 있지만 생성 가능 - 사용자 확인 후 진행
					const confirmMessage = `경고가 있습니다:\n${reviewData.overallMessage}\n\n예상 비용: ${reviewData.estimatedCost}\n\n계속 진행하시겠습니까?`;
					if (confirm(confirmMessage)) {
						webconsolejs["common/api/services/mci_api"].mciDynamic(mciName, mciDesc, Express_Server_Config_Arr, selectedNsId, policyOnPartialFailure);
					}
				} else {
					// Error 상태
					alert(`MCI 생성 검증 실패:\n${reviewData.overallMessage}`);
				}
			} else {
				// 생성 불가능
				alert(`MCI 생성이 불가능합니다:\n${reviewData.overallMessage}`);
			}
		} else {
			// API 호출 실패
			console.error("검증 API 호출 실패:", validationResult);
			alert("MCI 생성 검증 중 오류가 발생했습니다.");
		}
	} catch (error) {
		console.error("MCI 검증 중 오류:", error);
		alert("MCI 검증 중 오류가 발생했습니다: " + error.message);
	}
}

export async function createVmDynamic() {
    var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
    var selectedNsId = selectedWorkspaceProject.nsId;
    var mciId = window.currentMciId;

    webconsolejs["common/api/services/mci_api"].vmDynamic(mciId, selectedNsId, Express_Server_Config_Arr)

    // response가 있으면 

    alert("VM creation request completed")
    window.location = `/webconsole/operations/manage/workloads/mciworkloads`;

    await webconsolejs["pages/operation/manage/mci"].refreshRowData(mciId, checked_array);

}

export function addNewMci() {
	isVm = false
	Express_Server_Config_Arr = new Array();
}

// ////////////// VM Handling ///////////
export function addNewVirtualMachine() {
	Express_Server_Config_Arr = new Array();

	// window.currentMciId로 직접 접근
	var selectedMciId = window.currentMciId;
	console.log("selectedMciId", selectedMciId);
	
	// MCI 데이터에서 실제 name과 description 가져오기
	var mci_name = selectedMciId; // 기본값으로 ID 사용
	var mci_desc = "";
	
	if (selectedMciId && window.totalMciListObj) {
		var mciData = window.totalMciListObj.find(mci => mci.id === selectedMciId);
		if (mciData) {
			mci_name = mciData.name || selectedMciId;
			mci_desc = mciData.description || "";
		}
	}

	$("#extend_mci_name").val(mci_name)
	$("#extend_mci_desc").val(mci_desc)
	console.log("mci_name:", mci_name, "mci_desc:", mci_desc)

	isVm = true
}

export async function deployVm() {
	// var deploymentAlgo = $("#placement_algo").val()
	// if (deploymentAlgo == "express") {
	await createVmDynamic()
	// }else{

	//     var mci_name = $("#mci_name").val();
	//     var mci_id = $("#mci_id").val();
	//     if (!mci_id) {
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

	//     //var url = "/operation/manages/mcimng/" + mci_id + "/vm/reg/proc"
	//     var urlParamMap = new Map();
	//     urlParamMap.set(":mciID", mci_id)
	//     var url = setUrlByParam("MciVmListRegProc", urlParamMap)
	//     //var url = getWebToolUrl("MciVmRegProc")
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

// SubGroup Size
(function () {
	// ep_vm_add_cnt 처리 (PMK 스타일 input-number-container)
	const input = document.getElementById('ep_vm_add_cnt');
	if (input) {
		const container = input.parentElement; // .input-number-container
		const btnDec = container.querySelector('.input-number-decrement');
		const btnInc = container.querySelector('.input-number-increment');

		const minValue = 1;

		btnDec.addEventListener('click', function (e) {
			e.preventDefault();
			let val = parseInt(input.value, 10) || minValue;
			if (val > minValue) input.value = val - 1;
		});

		btnInc.addEventListener('click', function (e) {
			e.preventDefault();
			let val = parseInt(input.value, 10) || minValue;
			input.value = val + 1; // maxValue 제한 제거
		});
	}

	// policy_ep_vm_add_cnt 처리 (mciworkloads.html용)
	const policyInput = document.getElementById('policy_ep_vm_add_cnt');
	if (policyInput) {
		const policyContainer = policyInput.parentElement; // .d-flex.align-items-center
		const [policyBtnDec, policyBtnInc] = policyContainer.querySelectorAll('button');

		const minValue = 1;
		const maxValue = Number(policyInput.getAttribute('max')) || Infinity;

		policyBtnDec.addEventListener('click', function (e) {
			e.preventDefault();
			let val = parseInt(policyInput.value, 10) || minValue;
			if (val > minValue) policyInput.value = val - 1;
		});

		policyBtnInc.addEventListener('click', function (e) {
			e.preventDefault();
			let val = parseInt(policyInput.value, 10) || minValue;
			if (val < maxValue) policyInput.value = val + 1;
		});
	}
})();

// Clear 버튼 함수 추가
export function clearExpressForm() {
	// 1. 모든 입력 필드 초기화
	$("#express_form")[0].reset();
	
	// 2. 숨겨진 필드들 초기화
	$("#ep_provider").val("");
	$("#ep_connectionName").val("");
	$("#ep_imageId").val("");
	$("#ep_commonImageId").val("");
	$("#ep_commonSpecId").val("");
	$("#ep_specId").val("");
	
	// 3. 직접 입력 필드들 초기화
	$("#ep_name").val("");
	$("#ep_description").val("");
	$("#ep_imageId_input").val("");
	$("#ep_root_disk_type").val("");
	$("#ep_root_disk_size").val("");
	$("#ep_vm_add_cnt").val("1"); // 기본값 1로 설정
	$("#ep_data_disk").val("");
	$("#ep_command").val("");
	
	// 4. 수정 모드 플래그 초기화
	window.currentEditIndex = undefined;
	
	// 5. 폼은 그대로 유지 (토글하지 않음)
}

