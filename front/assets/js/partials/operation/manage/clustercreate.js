import { TabulatorFull as Tabulator } from "tabulator-tables";
//import { selectedMciObj } from "./mci";
//document.addEventListener("DOMContentLoaded", initMciCreate) // page가 아닌 partials에서는 제거

// create page 가 load 될 때 실행해야 할 것들 정의
export function iniClusterkCreate() {
	console.log("initClusterCreate")

	// partial init functions

	webconsolejs["partials/operation/manage/clusterecommendation"].initClusterRecommendation(webconsolejs["partials/operation/manage/clustercreate"].callbackClusterRecommendation);// recommend popup에서 사용하는 table 정의.
}

// callback PopupData
export async function callbackClusterRecommendation(vmSpec) {
	console.log("callbackClusterRecommendation")

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

	$("#cluster_provider").empty();
	$("#cluster_provider").append(html);

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

		$("#cluster_region").empty();
		$("#cluster_region").append(html);
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

		$("#cluster_cloudconnection").empty();
		$("#cluster_cloudconnection").append(html);

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

		$("#cluster_cloudconnection").empty();
		$("#cluster_cloudconnection").append(html);

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
var providerSelect = document.getElementById('cluster_provider');
var regionSelect = document.getElementById('cluster_region');
var connectionSelect = document.getElementById('cluster_connection');
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

		$("#cluster_region").empty();
		$("#cluster_region").append(html);

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

		$("#cluster_cloudconnection").empty();
		$("#cluster_cloudconnection").append(nhtml);

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

		$("#cluster_cloudconnection").empty();
		$("#cluster_cloudconnection").append(html);

	}

}

var createMciListObj = new Object();
var isVm = false // mci 생성(false) / vm 추가(true)
var Express_Server_Config_Arr = new Array();
var express_data_cnt = 0


// 서버 더하기버튼 클릭시 서버정보 입력area 보이기/숨기기
// isExpert의 체크 여부에 따라 바뀜.
// newServers 와 simpleServers가 있음.
export async function displayNewNodeForm() {
	
		// var providerList = await webconsolejs["common/api/services/pmk_api"].getProviderList()
		// // provider set
		// await setProviderList(providerList)

		// // call getRegion API
		// var regionList = await webconsolejs["common/api/services/pmk_api"].getRegionList()
		// // region set
		// await setRegionList(regionList)

		// // call cloudconnection
		// var connectionList = await webconsolejs["common/api/services/pmk_api"].getCloudConnection()
		// // cloudconnection set
		// await setCloudConnection(connectionList)

		// toggle create nodegroup form
		var div = document.getElementById("nodegroup_configuration");
		webconsolejs["partials/layout/navigatePages"].toggleElement(div)
}

export async function validateCreateClusterForm() {

}

// plus 버튼을 추가
function getPlusVm(vmElementId) {

	var append = "";
	append = append + '<li class="removebullet btn btn-secondary-lt" id="' + vmElementId + '_plusVmIcon" onClick="webconsolejs[\'partials/operation/manage/mcicreate\'].displayNewServerForm()">';
	append = append + "+"
	append = append + '</li>';
	return append;
}
// 서버정보 입력 area에서 'DONE'버튼 클릭시 array에 담고 form을 초기화

var totalDeployServerCount = 0;
var TotalServerConfigArr = new Array();// 최종 생성할 서버 목록
// deploy 버튼 클릭시 등록한 서버목록을 배포.
// function btn_deploy(){
export function deployPmk() {
	console.log("deployPmk")
	createCluster()
}

export async function addNewPmk() {
	isVm = false

	var providerList = await webconsolejs["common/api/services/pmk_api"].getProviderList()
	// provider set
	await setProviderList(providerList)

	// call getRegion API
	var regionList = await webconsolejs["common/api/services/pmk_api"].getRegionList()
	// region set
	await setRegionList(regionList)

	// call cloudconnection
	var connectionList = await webconsolejs["common/api/services/pmk_api"].getCloudConnection()
	// cloudconnection set
	await setCloudConnection(connectionList)

	Express_Server_Config_Arr = new Array();
}

export async function createCluster() {
	console.log("createCluster")
	// var namespace = webconsolejs["common/api/services/workspace_api"].getCurrentProject()
	// nsid = namespace.Name
	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

	var selectedNsId = selectedWorkspaceProject.nsId;
	var projectId = $("#select-current-project").text()
	var projectName = $('#select-current-project').find('option:selected').text();
	var nsId = projectName;

	var clusterName = $("#cluster_name").val()
	var selectedConnection = $("#cluster_cloudconnection").val()
	var clusterVersion = $("#cluster_version").val()
	var selectedVpc = $("#cluster_vpc").val()
	var selectedSubnet = $("#cluster_subnet").val()
	var selectedSecurityGroup = $("#cluster_sg").val()

	console.log("clusterName", clusterName)
	console.log("selectedConnection", selectedConnection)
	console.log("clusterVersion", clusterVersion)
	console.log("selectedVpc", selectedVpc)
	console.log("selectedSubnet", selectedSubnet)
	console.log("selectedSecurityGroup", selectedSecurityGroup)

	console.log("Express_Server_Config_Arr", Express_Server_Config_Arr)

	if (!clusterName) {
		commonAlert("Please Input Cluster Name!!!!!")
		return;
	}
	if (!selectedConnection) {
		commonAlert("Please Select Connection!!!!!")
		return;
	}
	if (!clusterVersion) {
		commonAlert("Please Select Cluster Version!!!!!")
		return;
	}
	if (!selectedVpc) {
		commonAlert("Please Select VPC!!!!!")
		return;
	}
	if (!selectedSubnet) {
		commonAlert("Please Select Subnet!!!!!")
		return;
	}
	if (!selectedSecurityGroup) {
		commonAlert("Please Select Security Group!!!!!")
		return;
	}

	webconsolejs["common/api/services/pmk_api"].postCreateCluster(clusterName, selectedConnection, clusterVersion, selectedVpc, selectedSubnet, selectedSecurityGroup, Express_Server_Config_Arr, selectedNsId)
}
