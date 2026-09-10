import { TabulatorFull as Tabulator } from "tabulator-tables";
//import { selectedMciObj } from "./mci";
//document.addEventListener("DOMContentLoaded", iniClusterkCreate) // page가 아닌 partials에서는 제거

// create page 가 load 될 때 실행해야 할 것들 정의
export function iniClusterkCreate() {

	// partial init functions

	webconsolejs["partials/operation/manage/clusterrecommendation"].initClusterRecommendation(webconsolejs["partials/operation/manage/clustercreate"].callbackClusterRecommendation);// recommend popup에서 사용하는 table 정의.
	
	// Desired Node Size +/- 버튼 이벤트 리스너 설정
	setupDesiredNodeSizeButtons();
}

// Desired Node Size +/- 버튼 이벤트 리스너 설정
function setupDesiredNodeSizeButtons() {
	// 기존 이벤트 핸들러 제거 (중복 방지)
	$(document).off('click', '#nodegroup_configuration .input-number-decrement');
	$(document).off('click', '#nodegroup_configuration .input-number-increment');
	$(document).off('change', '#node_autoscaling');
	$(document).off('change', '#node_minnodesize');
	$(document).off('change', '#node_maxnodesize');

	// Decrement 버튼 (-) 이벤트 핸들러
	$(document).on('click', '#nodegroup_configuration .input-number-decrement', function (e) {
		e.preventDefault();
		e.stopPropagation();

		const input = $(this).siblings('.input-number');
		const currentValue = parseInt(input.val()) || 1;
		const minNodeSize = parseInt($('#node_minnodesize').val()) || 1;

		// minNodeSize 이상으로 유지
		if (currentValue > minNodeSize) {
			input.val(currentValue - 1);
		}
	});

	// Increment 버튼 (+) 이벤트 핸들러
	$(document).on('click', '#nodegroup_configuration .input-number-increment', function (e) {
		e.preventDefault();
		e.stopPropagation();

		const input = $(this).siblings('.input-number');
		const currentValue = parseInt(input.val()) || 1;
		const maxNodeSize = parseInt($('#node_maxnodesize').val()) || 5;

		// maxNodeSize 이하로 유지
		if (currentValue < maxNodeSize) {
			input.val(currentValue + 1);
		}
	});

	// AutoScaling 변경 시 min/max 활성화 제어
	$(document).on('change', '#node_autoscaling', function () {
		const val = $(this).val();
		if (val === 'true') {
			$('#node_minnodesize, #node_maxnodesize').prop('disabled', false);
		} else {
			$('#node_minnodesize, #node_maxnodesize').val('').prop('disabled', true);
		}
	});

	// minNodeSize 변경 시 Desired Node Size 자동 조정
	$(document).on('change', '#node_minnodesize', function () {
		const minNodeSize = parseInt($(this).val()) || 1;
		const desiredInput = $('#node_desirednodesize');
		const currentDesired = parseInt(desiredInput.val()) || 1;

		// Desired Node Size가 minNodeSize보다 작으면 minNodeSize로 설정
		if (currentDesired < minNodeSize) {
			desiredInput.val(minNodeSize);
		}
	});

	// maxNodeSize 변경 시 Desired Node Size 자동 조정
	$(document).on('change', '#node_maxnodesize', function () {
		const maxNodeSize = parseInt($(this).val()) || 5;
		const desiredInput = $('#node_desirednodesize');
		const currentDesired = parseInt(desiredInput.val()) || 1;

		// Desired Node Size가 maxNodeSize보다 크면 maxNodeSize로 설정
		if (currentDesired > maxNodeSize) {
			desiredInput.val(maxNodeSize);
		}
	});
}

// callback PopupData
export async function callbackClusterRecommendation(vmSpec) {

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

	$("#cluster_provider").empty();
	$("#cluster_provider").append(html);

}

// Region 목록 SET — Connection에서 파생시킨다.
// RetrieveRegionListFromCsp는 zone 단위 항목까지 내려주는데(전체의 약 76%) 그 대부분은
// 대응하는 Connection이 없어, 그런 Region을 고르면 Connection 목록이 빈 채로 남았다.
// Connection에서 파생하면 목록에 뜨는 Region은 항상 Connection을 하나 갖는다.
export async function setRegionList(provider) {
	const regionOptions = webconsolejs["common/api/services/k8s_api"]
		.listRegionOptions(myCloudConnection, provider);
	webconsolejs["common/api/services/k8s_api"]
		.fillSelectOptions("#cluster_region", "Select Region", regionOptions);
}

// Connection 목록 SET — provider(+region)로 좁힌다.
// region은 regionZoneInfoName 정확 일치로 비교한다(startsWith 금지 — "azure-eastus"가
// "azure-eastus2"를, "gcp-europe-west1"이 "...west10/12"를 끌고 온다).
export async function setCloudConnection(provider, regionZoneInfoName) {
	const names = webconsolejs["common/api/services/k8s_api"]
		.listConnectionNames(myCloudConnection, provider, regionZoneInfoName);
	webconsolejs["common/api/services/k8s_api"]
		.fillSelectOptions("#cluster_cloudconnection", "Select Connection", names, true);
}

export async function checkAvailableK8sClusterVersion(providerName, regionName){
	try {
        var availableVersions = await webconsolejs["common/api/services/k8s_api"].getAvailableK8sClusterVersion(providerName, regionName);

        // k8s 생성 가능
        if (availableVersions && Array.isArray(availableVersions)) {

            let html = '<option value="">Select Version</option>';
            availableVersions.forEach(version => {
                html += `<option value="${version.id}">${version.id}</option>`;
            });

            $("#cluster_version").empty();
            $("#cluster_version").append(html);
        } else {
            // 데이터가 없거나 응답이 올바르지 않은 경우
            webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Failed to retrieve Kubernetes cluster versions. Please try again.');
        }

    } catch (error) {
        console.error("Failed to retrieve Kubernetes cluster versions. Please try again.", error);

        if (error.response && error.response.status === 500) {
            webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Failed to retrieve available Kubernetes cluster versions due to server error. Please try again.');
        } else {
            webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'An unexpected error occurred. Please try again.');
        }
    }
}

// for filterRegion func
// set된 값들
var myProviderList = []
// ConnConfig 객체 배열 — Provider/Region/Connection 목록의 정본
var myCloudConnection = []

// provider / region / connection 필터링
// (#cluster_connection 은 존재하지 않는 id다 — 실제 id는 #cluster_cloudconnection)
var providerSelect = document.getElementById('cluster_provider');
var regionSelect = document.getElementById('cluster_region');
providerSelect.addEventListener('change', updateConfigurationFilltering);
regionSelect.addEventListener('change', updateConfigurationFilltering);

async function updateConfigurationFilltering() {

	var selectedProvider = providerSelect.value; // 선택된 provider
	var selectedRegion = regionSelect.value;     // 선택된 region ("[NHN] nhn-kr1")

	// 생성 시점 AutoScaling Off 제약 반영 (Expert 폼 — 비-dynamic 경로라 AWS 만 해당).
	// 여기서 예외가 나면 Region/Connection 필터링 전체가 멈추므로 방어적으로 호출한다.
	const applyOffConstraint =
		webconsolejs["pages/operation/manage/k8sworkloads"]?.applyAutoScalingOffConstraint;
	if (typeof applyOffConstraint === "function") {
		applyOffConstraint("#node_autoscaling", "#node_autoscaling_hint", selectedProvider, "expertCreate");
	}

	// Provider 미선택 — 전체 목록으로 되돌린다
	if (selectedProvider === "") {
		await setRegionList("");
		await setCloudConnection("", "");
		return;
	}

	// Provider가 바뀌면 이전 Region 값이 select에 그대로 남아 있다.
	// 그 값으로 Connection을 거르면 빈 목록이 되고 Region 목록도 옛 provider 것에 고착되므로,
	// provider가 맞지 않는 Region은 미선택으로 취급해 목록부터 다시 만든다.
	var parsed = webconsolejs["common/api/services/k8s_api"].parseRegionOption(selectedRegion);
	var regionBelongsToProvider = selectedRegion !== ""
		&& parsed.provider.toLowerCase() === selectedProvider.toLowerCase();

	if (!regionBelongsToProvider) {
		await setRegionList(selectedProvider);
		await setCloudConnection(selectedProvider, "");
		return;
	}

	// Region까지 선택 — Connection을 그 Region 하나로 확정한다
	await setCloudConnection(selectedProvider, parsed.regionZoneInfoName);

	// GetAvailableK8sVersion은 CSP 원본 region 이름을 받는다.
	// "nhn-kr1"을 그대로 넘기면 NHN이 500("no entry for provider(nhn):region(nhn-kr1)")을 반환한다.
	var cspRegionName = webconsolejs["common/api/services/k8s_api"]
		.toCspRegionName(selectedProvider, parsed.regionZoneInfoName);
	checkAvailableK8sClusterVersion(selectedProvider, cspRegionName);
}

var createMciListObj = new Object();
var isNodeGroup = false // mci 생성(false) / vm 추가(true)
var Create_Cluster_Config_Arr = new Array();
var Create_Node_Config_Arr = new Array();
var nodeGroup_data_cnt = 0
var currentEditingNodeGroupIndex = null; // Edit 모드 추적용 변수


// 서버 더하기버튼 클릭시 서버정보 입력area 보이기/숨기기
// isExpert의 체크 여부에 따라 바뀜.
// newServers 와 simpleServers가 있음.
export async function displayNewNodeForm() {

	// nsId는 상단에 이미 선택돼 있는 project object에 들어 있다. 재조회하지 않는다.
	var selectedNsId = getSelectedNsId();
	
	// Get selected cluster's provider information for SSH Key filtering
	var selectedCluster = webconsolejs["pages/operation/manage/k8sworkloads"].getSelectedClusterContext();
	var clusterProvider = webconsolejs["pages/operation/manage/k8sworkloads"].currentProvider
		|| (selectedCluster && selectedCluster.provider)
		|| null; // e.g., "aws", "azure", "gcp"
	// 신규 클러스터 생성 중에는 선택된 클러스터가 없다 — 폼에서 고른 Connection 을 쓴다.
	// (currentProvider 는 목록에서 클러스터를 선택했을 때 세팅되는 값이라, 생성 흐름에서는
	//  비어 있거나 직전에 보던 클러스터의 값이 남아 있어 신뢰할 수 없다)
	var clusterConnection = (selectedCluster && selectedCluster.connectionName)
		|| $("#cluster_cloudconnection").val()
		|| null;

	// Root Disk Type 옵션을 provider/connection 기준으로 동적 조회 (이미 알려진 값 사용)
	// ssh key 조회보다 먼저 실행해, 이후 블록의 예외와 무관하게 항상 호출되도록 한다
	if (clusterProvider) {
		try {
			const diskResp = await webconsolejs["common/api/services/disk_api"]
				.getCommonLookupDiskInfo(clusterProvider, clusterConnection);
			applyNodeRootDiskTypeOptions(clusterProvider, diskResp);
		} catch (error) {
			console.error("Failed to look up disk types:", error);
		}
	}

	// NodeGroup 폼이 열릴 때 AutoScaling Off 제약을 다시 적용한다.
	// provider 변경 시점에만 적용하면, 그 뒤 폼이 새로 렌더될 때 disabled 상태가 사라진다.
	const applyOff = webconsolejs["pages/operation/manage/k8sworkloads"]?.applyAutoScalingOffConstraint;
	if (typeof applyOff === "function") {
		// isNodeGroup=true 는 기존 클러스터에 NodeGroup 추가(PostK8sNodeGroup) — 이 경로는
		// min=desiredNodeSize(>=1) 를 보내므로 Azure/NHN 이 Off 를 거부한다.
		// false 는 Expert 클러스터 생성(PostK8sCluster) — min=0 이 그대로 가서 통과한다.
		applyOff("#node_autoscaling", "#node_autoscaling_hint",
			clusterProvider || $("#cluster_provider").val(),
			isNodeGroup ? "addNodeGroup" : "expertCreate");
	}

	// SSH Key 는 Connection 기준으로 거른다 — 다른 Connection 의 키를 고르면
	// "VM KeyPair '...' does not exist in connection '...'" 로 생성이 실패한다.
	var sshKeyList = await webconsolejs["common/api/services/k8s_api"]
		.getSshKey(selectedNsId, clusterProvider, clusterConnection);
	var mysshKeyList = sshKeyList.data.responseData.sshKey;
	if (mysshKeyList && mysshKeyList.length > 0) {
		var html = '<option value="">Select sshKey</option>';
		mysshKeyList.forEach(item => {
			html += '<option value="' + item.id + '">' + item.id + '</option>';
		});
		
		$("#node_sshkey").empty();
		$("#node_sshkey").append(html);
	} else {
	}

	//recommendVm으로 k8s spec
	

	// availablek8sclusternodeimage
	// provider값과 region값 내려주기 전까지 임시
	// var selectedCluster = webconsolejs["pages/operation/manage/k8sworkloads"].selectedPmkObj
	// var providerString = selectedCluster[0].provider
	// var {provider, region} = extractProviderRegion(providerString)

	// var availableK8sClusterNodeImageList = await webconsolejs["common/api/services/k8s_api"].getAvailablek8sClusterNodeImage(provider, region)
	// console.log("availableK8sClusterNodeImageList",availableK8sClusterNodeImageList)
	// if (availableK8sClusterNodeImageList && availableK8sClusterNodeImageList.length > 0) {
    //     var html = '<option value="">Select Image</option>';
    //     availableK8sClusterNodeImageList.forEach(item => {
    //         html += '<option value="' + item.id + '">' + item.id + '</option>';
    //     });
    
    //     $("#node_sshkey").empty();
    //     $("#node_sshkey").append(html);
    // } else {
    //     console.log("No SSH keys available");
	// }

	// toggle create nodegroup form
	var div = document.getElementById("nodegroup_configuration");
	webconsolejs["partials/layout/navigatePages"].toggleSubElement(div)
	
	// Spec 모달이 열릴 때 콜백 설정 (기존 폼용)
	// 모달 열기 전에 콜백 설정
	if (webconsolejs["partials/operation/manage/k8s_serverrecommendation"]) {
		webconsolejs["partials/operation/manage/k8s_serverrecommendation"].initServerRecommendationPmk(
			webconsolejs["partials/operation/manage/clustercreate"].callbackNodegroupServerRecommendation
		);
	}

	// Spec 모달 콜백 설정 (jQuery 방식 - 중복 방지용 네임스페이스 사용)
	if (typeof $ !== 'undefined') {
		$("#spec-search-pmk").off('shown.bs.modal.nodegroup').on('shown.bs.modal.nodegroup', function () {
			if (webconsolejs["partials/operation/manage/k8s_serverrecommendation"]) {
				webconsolejs["partials/operation/manage/k8s_serverrecommendation"].initServerRecommendationPmk(
					webconsolejs["partials/operation/manage/clustercreate"].callbackNodegroupServerRecommendation
				);
			}
			// provider 필터는 k8s_serverrecommendation.js의 shown.bs.modal 핸들러가 selectedPmkObj로 처리
		});
	}

}

// function extractProviderRegion(providerString){
// 	var parts = providerString.split('-');
// 	var provider = parts[0];
// 	var region = parts.slice(1, 4).join('-');
	
// 	return {provider, region}
// }

// plus 버튼을 추가
function getPlusVm(vmElementId) {

	var append = "";
	append = append + '<li class="removebullet btn btn-secondary-lt" id="' + vmElementId + '_plusVmIcon" onClick="webconsolejs[\'partials/operation/manage/clustercreate\'].startCreateMode()">';
	append = append + "+ NodeGroup"
	append = append + '</li>';
	return append;
}

// + NodeGroup 클릭 시 Create 모드 시작
export function startCreateMode() {
	currentEditingNodeGroupIndex = null; // Create 모드로 초기화
	console.log("Create mode: Starting new NodeGroup creation");
	
	// NodeGroup Configuration 폼 표시
	var div = document.getElementById("nodegroup_configuration");
	if (div && !div.classList.contains('show')) {
		webconsolejs["partials/layout/navigatePages"].toggleSubElement(div);
	}
}
// 서버정보 입력 area에서 'DONE'버튼 클릭시 array에 담고 form을 초기화

var totalDeployServerCount = 0;
var TotalServerConfigArr = new Array();// 최종 생성할 서버 목록
// deploy 버튼 클릭시 등록한 서버목록을 배포.
// function btn_deploy(){
export function deployPmk() {
	createCluster()
}

export async function deployNode() {
	await createNode()
}

export async function createNode() {

	// nsId는 상단에 이미 선택돼 있는 project object에 들어 있다. 재조회하지 않는다.
	var selectedNsId = getSelectedNsId();
	if (!selectedNsId) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Required', 'Please select a project first.');
		return;
	}
	var selectedPmk = webconsolejs["pages/operation/manage/k8sworkloads"].getSelectedClusterContext();
	if (!selectedPmk) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal(
			'Cluster Selection Required',
			'Please select a cluster first before adding a NodeGroup.'
		);
		return;
	}
	var k8sClusterId = selectedPmk.id;
	var provider = selectedPmk.provider; // CSP별 동시 전송 정책 판단용

	// 스펙 ↔ 클러스터 Connection 정합성 검증.
	// NodeGroup은 클러스터와 같은 Connection이어야 한다 — 스펙 검색이 Provider로만 거르기 때문에
	// 다른 리전 스펙이 선택될 수 있고, 그대로 보내면 cb-tumblebug이 400으로 거부한다.
	var specConnection = $("#node_connectionName").val();
	if (specConnection && selectedPmk.connectionName && specConnection !== selectedPmk.connectionName) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Spec / Connection Mismatch',
			"The selected spec belongs to connection '" + specConnection +
			"' but the cluster uses '" + selectedPmk.connectionName +
			"'. Select a spec from the same connection.");
		return;
	}

	const result = await webconsolejs["common/api/services/k8s_api"].createNode(
		k8sClusterId,
		selectedNsId,
		Create_Node_Config_Arr,
		provider
	);

	// 사전 검증 실패 — 사용자가 값을 고칠 수 있도록 폼을 닫지 않는다
	if (result === false) return;

	// NodeGroup Configuration 폼 닫기
	var nodeGroupConfigDiv = document.getElementById("nodegroup_configuration");
	if (nodeGroupConfigDiv) {
		webconsolejs["partials/layout/navigatePages"].toggleSubElement(nodeGroupConfigDiv);
	}
	
	// Add Node 영역 숨기기
	var addNodeDiv = document.getElementById("addnode");
	if (addNodeDiv && addNodeDiv.classList.contains("active")) {
		webconsolejs["partials/layout/navigatePages"].toggleElement(addNodeDiv);
	}
	
	// Add NodeGroup 폼 초기화
	Create_Node_Config_Arr = new Array();
	nodeGroup_data_cnt = 0;
	
	// addnodegroup_list 초기화 (+ NodeGroup 버튼만 남기기)
	var addNodeGroupList = document.getElementById("addnodegroup_list");
	if (addNodeGroupList) {
		var plusIcon = document.getElementById("addnodegroup_plusIcon");
		addNodeGroupList.innerHTML = '';
		if (plusIcon) {
			addNodeGroupList.appendChild(plusIcon);
		} else {
			// + NodeGroup 버튼이 없으면 다시 생성
			var li = document.createElement('li');
			li.className = 'removebullet btn btn-secondary-lt';
			li.id = 'addnodegroup_plusIcon';
			li.onclick = function() {
				webconsolejs['partials/operation/manage/clustercreate'].displayNewNodeForm();
			};
			li.textContent = '+ NodeGroup';
			addNodeGroupList.appendChild(li);
		}
	}
	
	// PMK 목록 새로고침
	if (webconsolejs["pages/operation/manage/k8sworkloads"] && 
	    typeof webconsolejs["pages/operation/manage/k8sworkloads"].refreshPmkList === 'function') {
		await webconsolejs["pages/operation/manage/k8sworkloads"].refreshPmkList();
	}
	
	console.log("NodeGroup creation request sent and PMK list refreshed");
}

// connectionName에서 Region 표시값을 만든다 (표시 전용, disabled select).
// Connection의 configName이 곧 regionZoneInfoName이므로 그대로 쓴다.
// e.g. ("nhn-kr1", "nhn") -> "[NHN] nhn-kr1"
function extractRegionFromConnection(connectionName, provider) {
	if (!connectionName || !provider) return '';
	return webconsolejs["common/api/services/k8s_api"].formatRegionOption(provider, connectionName);
}

export async function addNewNodeGroup() {
	Create_Cluster_Config_Arr = new Array();
	Create_Node_Config_Arr = new Array();
	currentEditingNodeGroupIndex = null; // Create 모드로 초기화

	var selectedCluster = webconsolejs["pages/operation/manage/k8sworkloads"].getSelectedClusterContext();

	// Validation: Check if cluster is selected
	if (!selectedCluster) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal(
			'Cluster Selection Required',
			'Please select a cluster first before adding a NodeGroup.'
		);
		return;
	}

	// Note: Cluster status check is handled by button state management
	// The button is only enabled when cluster status is Active
	// See updateAddNodeGroupButtonState() in pmk.js

	var cluster_name = selectedCluster.name;
	var cluster_desc = selectedCluster.description;
	var cluster_provider = webconsolejs["pages/operation/manage/k8sworkloads"].currentProvider || selectedCluster.provider;
	var cluster_connection = selectedCluster.connectionName;
	var cluster_vpc = selectedCluster.vpc;
	var cluster_subnet = selectedCluster.subnet;
	var cluster_securitygroup = selectedCluster.securitygroup;
	var cluster_version = selectedCluster.version;

	// Extract region from connectionName
	var cluster_region = extractRegionFromConnection(cluster_connection, cluster_provider);

	// Root Disk Type 옵션을 provider/connection 기준으로 동적 조회 (이후 DOM 조작 코드의 예외와 무관하게 먼저 실행)
	if (cluster_provider) {
		try {
			const diskResp = await webconsolejs["common/api/services/disk_api"]
				.getCommonLookupDiskInfo(cluster_provider, cluster_connection);
			applyNodeRootDiskTypeOptions(cluster_provider, diskResp);
		} catch (error) {
			console.error("Failed to look up disk types:", error);
		}
	}

	// Set basic cluster information
	$("#node_cluster_name").val(cluster_name);
	$("#node_cluster_desc").val(cluster_desc);

	// Set Provider (fixed, single option, disabled - display only)
	$("#node_cluster_provider").html(
		'<option value="' + cluster_provider + '" selected>' +
		cluster_provider.toUpperCase() +
		'</option>'
	);
	$("#node_cluster_provider").prop('disabled', true);

	// Set Region (fixed, single option, disabled - display only)
	$("#node_cluster_region").html(
		'<option value="' + cluster_region + '" selected>' +
		cluster_region +
		'</option>'
	);
	$("#node_cluster_region").prop('disabled', true);

	// Set other fields
	$("#node_cluster_cloudconnection").html(
		'<option value="' + cluster_connection + '" selected>' +
		cluster_connection +
		'</option>'
	);
	$("#node_cluster_vpc").html(
		'<option value="' + cluster_vpc + '" selected>' +
		cluster_vpc +
		'</option>'
	);
	$("#node_cluster_subnet").html(
		'<option value="' + cluster_subnet + '" selected>' +
		cluster_subnet +
		'</option>'
	);
	$("#node_cluster_sg").html(
		'<option value="' + cluster_securitygroup + '" selected>' +
		cluster_securitygroup +
		'</option>'
	);
	$("#node_cluster_version").html(
		'<option value="' + cluster_version + '" selected>' +
		cluster_version +
		'</option>'
	);

	// Navigate to Add NodeGroup section (following existing pattern)
	window.location.hash = "#addnode";

	isNodeGroup = true;
}

// provider에 맞는 Root Disk Type 옵션으로 #node_rootdisk 드롭다운을 채운다
function applyNodeRootDiskTypeOptions(provider, diskInfoList) {
	const providerId = (provider || "").toUpperCase();
	const matched = Array.isArray(diskInfoList)
		? diskInfoList.find(item => item.providerId === providerId)
		: null;

	let html = '<option value="">Select Root Disk Type</option><option value="default">default</option>';
	if (matched && Array.isArray(matched.rootdisktype)) {
		matched.rootdisktype.forEach(type => {
			html += '<option value="' + type + '">' + type + '</option>';
		});
	}

	$("#node_rootdisk").empty().append(html);
}

export async function addNewPmk() {
	// isNode = false

	var providerList = await webconsolejs["common/api/services/k8s_api"].getProviderList()
	// provider set
	await setProviderList(providerList)

	// Connection이 Region/Connection 목록의 정본이다 (백그라운드, 로더 없음).
	// RetrieveRegionListFromCsp는 더 이상 호출하지 않는다 — zone 항목까지 수백 건을 받아오는데
	// 그중 Connection이 있는 Region만 쓸 수 있어 결국 Connection에서 파생시키면 된다.
	myCloudConnection = await webconsolejs["common/api/services/k8s_api"].getCloudConnection({ loaderType: 'none' }) || []
	await setRegionList("")
	await setCloudConnection("", "")

	Create_Cluster_Config_Arr = new Array();

	
	// isNodeGroup = true
}

// 현재 선택된 project의 nsId — 세션에 저장된 project object가 정본이다.
// (세션 키는 NsId, workspaceProjectInit() 반환값은 nsId 로 표기가 다르다)
function getSelectedNsId() {
	const project = webconsolejs["common/api/services/workspace_api"].getCurrentProject();
	if (!project) return "";
	return project.NsId || project.nsId || "";
}

export async function changeCloudConnection(connectionName) {
	const selectedNsId = getSelectedNsId();
	if (!selectedNsId) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Required', 'Please select a project first.');
		return;
	}
	await setVpcList(connectionName, selectedNsId)

}

// 해당 connection의 vpcList 조회하여 set
export async function setVpcList(connectionName, nsId) {

	// api 호출	
	var vpcList = await webconsolejs["common/api/services/k8s_api"].getVpcList(connectionName, nsId)
	// select box에 SET
	var vNetList = []
	var res_item = vpcList.vNet

	res_item.forEach(item => {
		if (item.connectionName == connectionName) {
			vNetList.push(item); 
		}
	});

	var html = '<option value="">Select VPC</option>';
	vNetList.forEach(vpc => {
		html += '<option value="' + vpc.id + '">' + vpc.id + '</option>';
	});

	$("#cluster_vpc").empty();
	$("#cluster_vpc").append(html);

	// vpcId 선택 시
	$("#cluster_vpc").on("change", async function () {
		var selectedVpcId = $(this).val();  
		if (selectedVpcId) {
			// get subnetList
			var subnetList = await webconsolejs["common/api/services/k8s_api"].getSubnetList(selectedVpcId, nsId);
			setSubnetList(subnetList)

			// get securityGroupList
			var securityGroupList = await webconsolejs["common/api/services/k8s_api"].getSecurityGroupList(selectedVpcId, nsId);
			setSecurityGroupList(securityGroupList)
		}
	});
}

export async function setSubnetList(subnetList) {

	var html = '<option value="">Select Subnet</option>';

	subnetList.forEach(subnet => {
		html += '<option value="' + subnet.id + '">' + subnet.id + '</option>';
	});

	$("#cluster_subnet").empty();
	$("#cluster_subnet").append(html);

}

export async function setSecurityGroupList(securityGroupList) {
	var html = '<option value="">Select Security Group</option>';
	var securityGroups = securityGroupList.securityGroup
	securityGroups.forEach(securitygroup => {
		html += '<option value="' + securitygroup.id + '">' + securitygroup.id + '</option>';
	});

	$("#cluster_sg").empty();
	$("#cluster_sg").append(html);

}

export async function createCluster() {
	// nsId는 상단에 이미 선택돼 있는 project object에 들어 있다. 재조회하지 않는다.
	// workspaceProjectInit()은 목록을 다시 읽어 셀렉트를 재구성하는 초기화 루틴이라,
	// 세션이 비어 있으면 내부에서 현재 프로젝트를 지워 nsId가 ""로 전송된다(400).
	var selectedNsId = getSelectedNsId();
	if (!selectedNsId) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Required', 'Please select a project first.');
		return;
	}

	var clusterName = $("#cluster_name").val()
	var selectedConnection = $("#cluster_cloudconnection").val()
	var clusterVersion = $("#cluster_version").val()

	// 스펙 ↔ Connection 정합성 검증.
	// 스펙 검색은 Provider로만 거르기 때문에 다른 리전의 스펙이 후보에 섞인다.
	// 선택된 스펙이 자기 connectionName을 들고 있으므로, 클러스터 Connection과
	// 다르면 여기서 잡는다 (예: kr1 스펙 + jp1 Connection → cb-tumblebug 400).
	// SSH Key 는 클러스터 Connection 에 속한 것이어야 한다. 다른 Connection 의 키를 보내면
	// "VM KeyPair '...' does not exist in connection '...'" 로 생성이 실패한다.
	var selectedSshKey = $("#node_sshkey").val()
	if (selectedSshKey && selectedConnection && !selectedSshKey.includes(selectedConnection)) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('SSH Key Mismatch',
			"The selected SSH Key '" + selectedSshKey + "' does not belong to connection '" +
			selectedConnection + "'. Select a key from the same connection.");
		return;
	}

	var specConnection = $("#node_connectionName").val()
	if (specConnection && selectedConnection && specConnection !== selectedConnection) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Spec / Connection Mismatch',
			"The selected spec belongs to connection '" + specConnection +
			"' but the cluster uses '" + selectedConnection +
			"'. Select a spec from the same connection.");
		return;
	}
	var selectedVpc = $("#cluster_vpc").val()
	var selectedSubnet = $("#cluster_subnet").val()
	var selectedSecurityGroup = $("#cluster_sg").val()

	if (!clusterName) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', 'Cluster name is required.')
		return;
	}
	if (!selectedConnection) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', 'Connection is required.')
		return;
	}
	if (!clusterVersion) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', 'Cluster version is required.')
		return;
	}
	if (!selectedVpc) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', 'VPC is required.')
		return;
	}
	if (!selectedSubnet) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', 'Subnet is required.')
		return;
	}
	if (!selectedSecurityGroup) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', 'Security Group is required.')
		return;
	}

	// 생성 요청만 보내고 결과는 기다리지 않는다 — 진행/완료는 asyncRequestTracker가 알린다
	webconsolejs["common/api/services/k8s_api"].CreateCluster(clusterName, selectedConnection, clusterVersion, selectedVpc, selectedSubnet, selectedSecurityGroup, Create_Cluster_Config_Arr, selectedNsId)

	webconsolejs['common/util'].showToast('Cluster creation request has been sent', 'info');

	// 폼 초기화
	$("#cluster_name").val("");
	$("#cluster_desc").val("");
	$("#cluster_cloudconnection").val("");
	$("#cluster_version").val("");
	$("#cluster_vpc").val("");
	$("#cluster_subnet").val("");
	$("#cluster_sg").val("");
	Create_Cluster_Config_Arr = new Array();
	Create_Node_Config_Arr = new Array();

	// CSP에 생성 명령이 전달되는 시간을 고려해 잠시 뒤 목록을 갱신한다
	// (완료 시점 갱신은 pmk.js의 asyncRequestTracker 구독이 처리한다)
	await new Promise(resolve => setTimeout(resolve, 2000));
	if (webconsolejs["pages/operation/manage/k8sworkloads"] &&
		typeof webconsolejs["pages/operation/manage/k8sworkloads"].refreshPmkList === 'function') {
		await webconsolejs["pages/operation/manage/k8sworkloads"].refreshPmkList();
	}

	// #createcluster(Simple)와 #createcluster-original(Expert)는 형제 섹션이고,
	// Expert 전환은 style.display 인라인 스타일로만 토글된다(.active class 무관).
	// 인라인 style이 남은 채로 .active만 지우면 .section.active{display:block} 규칙보다
	// 인라인 style이 우선해 실제로는 숨겨지지 않는다 — 두 폼 모두 정리한다.
	const originalForm = document.getElementById("createcluster-original");
	if (originalForm) {
		originalForm.style.display = "none";
		const expertBtn = document.querySelector('button[onclick*="toggleExpertCreation"]');
		if (expertBtn) {
			expertBtn.classList.remove("btn-primary");
			expertBtn.classList.add("btn-outline-primary");
			expertBtn.textContent = "Expert Creation";
		}
	}

	// 클러스터 생성 섹션 닫기 (이미 pmkworkloads 화면이므로 페이지 이동은 하지 않는다)
	const createClusterSection = document.querySelector('#createcluster');
	if (createClusterSection) {
		createClusterSection.style.removeProperty('display');
		if (createClusterSection.classList.contains('active')) {
			webconsolejs["partials/layout/navigatePages"].toggleElement(createClusterSection);
		}
	}
}

// nodegroup configuration done 클릭시
// export function clusterFormDone_btn() {
// 	$("#c_name").val($("#cluster_name").val())
// 	$("#c_desc").val($("#cluster_desc").val())
// 	$("#c_connection").val($("#cluster_connection").val())
// 	$("#c_vpc").val($("#cluster_vpc").val())
// 	$("#c_subnet").val($("#subent").val())
// 	$("#c_sg").val($("#cluster_sg").val())
// 	$("#c_version").val($("#cluster_version").val())

// 	var cluster_form = {}
// 	cluster_form["connectionName"] = $("#c_connection").val(); // Connection Name
//     cluster_form["name"] = $("#c_name").val(); // Cluster Name
//     cluster_form["vNetId"] = $("#c_vpc").val(); // VPC ID
//     cluster_form["subnetIds"] = [$("#c_subnet").val()]; // Subnet IDs (Array)
//     cluster_form["securityGroupIds"] = [$("#c_sg").val()]; // Security Group IDs (Array)
//     cluster_form["version"] = $("#c_version").val(); // K8s Cluster Version
//     cluster_form["description"] = $("#c_desc").val(); // Optional Description

//     // NodeGroupList 추가 (조건부로 추가, 있을 때만 넣음)
//     var nodeGroupName = $("#nodegroup_name").val(); // 예: Node Group Name 필드
//     if (nodeGroupName) {
//         cluster_form["k8sNodeGroupList"] = [
//             {
//                 "desiredNodeSize": $("#node_desirednodesize").val(),
//                 "imageId": $("#node_imageid").val(),
//                 "maxNodeSize": $("#node_maxnodesize").val(),
//                 "minNodeSize": $("#node_minnodesize").val(),
//                 "name": nodeGroupName,
//                 "onAutoScaling": $("#node_autoscaling").val(),
//                 "rootDiskSize": $("#node_rootdisksize").val(),
//                 "rootDiskType": $("#node_rootdisk").val(),
//                 "specId": $("#node_specid").val(),
//                 "sshKeyId": $("#node_sshkey").val()
//             }
//         ];
//     }

//     Create_Cluster_Config_Arr.push(cluster_form)
// 	console.log("express btn click and express form data : ", Create_Cluster_Config_Arr)

// 	var div = document.getElementById("nodegroup_configuration");
// 	webconsolejs["partials/layout/navigatePages"].toggleSubElement(div)

// 	// TODO: + 박스 추가
// }
export function clusterFormDone_btn() {
	// 1. 필수 필드 검증
	const isAutoScalingOn = $('#node_autoscaling').val() === 'true';
	var requiredFields = [
		{ id: '#node_name', message: 'NodeGroup name is required' },
		{ id: '#node_specid', message: 'Spec is required' },
		{ id: '#node_imageid', message: 'Image is required' },
		{ id: '#node_sshkey', message: 'SSH Key is required' },
		{ id: '#node_autoscaling', message: 'AutoScaling option is required' }
	];
	if (isAutoScalingOn) {
		requiredFields.push({ id: '#node_minnodesize', message: 'Min Node Size is required' });
		requiredFields.push({ id: '#node_maxnodesize', message: 'Max Node Size is required' });
	}
	
	for (var field of requiredFields) {
		if (!$(field.id).val() || $(field.id).val().trim() === '') {
			webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', field.message);
			$(field.id).focus();
			return;
		}
	}

    // 2. 클러스터 기본 정보 할당
    const connectionName = $("#cluster_cloudconnection").val();
    const clusterName = $("#cluster_name").val();
    const vNetId = $("#cluster_vpc").val();
    const subnetId = $("#cluster_subnet").val();
    const securityGroupId = $("#cluster_sg").val();
    const version = $("#cluster_version").val();
    const description = $("#cluster_desc").val();

    var cluster_form = {
        connectionName: connectionName || "", 
        name: clusterName || "",
        vNetId: vNetId || "", 
        subnetIds: [subnetId || ""],
        securityGroupIds: [securityGroupId || ""],
        version: version || "", 
        description: description || ""
    };

    // 3. hidden 필드 업데이트
    const nodeGroupName = $("#node_name").val();
    const desiredNodeSize = $("#node_desirednodesize").val();
    const imageId = $("#node_imageid").val();
    const maxNodeSize = $("#node_maxnodesize").val();
    const minNodeSize = $("#node_minnodesize").val();
    const onAutoScaling = $("#node_autoscaling").val();
    const rootDiskSize = $("#node_rootdisksize").val();
    const rootDiskType = $("#node_rootdisk").val();
    // specId는 commonSpecId를 사용 (search로 선택한 경우)
    const specId = $("#node_commonSpecId").val() || $("#node_specid").val();
    const sshKeyId = $("#node_sshkey").val();

	// hidden 필드에 값 설정
	$("#n_name").val(nodeGroupName);
	$("#n_specid").val(specId);
	$("#n_imageid").val(imageId);
	$("#n_minnodesize").val(minNodeSize);
	$("#n_maxnodesize").val(maxNodeSize);
	$("#n_sshkey").val(sshKeyId);
	$("#n_rootdisk").val(rootDiskType);
	$("#n_rootdisksize").val(rootDiskSize);
	$("#n_autoscaling").val(onAutoScaling);
	$("#n_desirednodesize").val(desiredNodeSize || "1");

    // 4. NodeGroup 데이터 객체 생성
    var nodeGroupData = {
        "desiredNodeSize": desiredNodeSize || "",
        "imageId": imageId || "",
        "name": nodeGroupName,
        "onAutoScaling": onAutoScaling || "false",
        "rootDiskSize": rootDiskSize || "",
        "rootDiskType": rootDiskType || "",
        "specId": specId || "",
        "sshKeyId": sshKeyId || ""
    };
    // AutoScaling On일 때만 min/max 포함
    if (onAutoScaling === "true") {
        nodeGroupData["maxNodeSize"] = maxNodeSize || "";
        nodeGroupData["minNodeSize"] = minNodeSize || "";
    }

	
	var nodeGroup_name = nodeGroupName;
	var nodeGroup_cnt = parseInt(desiredNodeSize) || 1;
	var displayNodegroupCnt = '(' + nodeGroup_cnt + ')';
	
	// Edit 모드 vs Create 모드 구분
	if (currentEditingNodeGroupIndex !== null) {
		// **Edit 모드**: 기존 NodeGroup 업데이트
		console.log("Edit mode: Updating NodeGroup at index", currentEditingNodeGroupIndex);
		
		// NodeGroup 만 해당 인덱스를 갱신한다. cluster_form 은 단일이므로 아래에서 일괄 반영.
		Create_Node_Config_Arr[currentEditingNodeGroupIndex] = nodeGroupData;
		
		// HTML 리스트 항목 업데이트 (기존 항목 찾아서 텍스트만 변경)
		var targetLi = $("#nodegroup_list li").eq(currentEditingNodeGroupIndex + 1); // +1은 plusIcon 때문
		if (targetLi.length > 0) {
			targetLi.text(nodeGroup_name + displayNodegroupCnt);
			// onclick 이벤트 다시 설정
			targetLi.attr('onclick', "webconsolejs['partials/operation/manage/clustercreate'].view_ngForm('" + currentEditingNodeGroupIndex + "')");
		}
		
		// Edit 모드 종료
		currentEditingNodeGroupIndex = null;
		
	} else {
		// **Create 모드**: 새 NodeGroup 추가
		console.log("Create mode: Adding new NodeGroup");
		
		// NodeGroup 을 배열에 누적한다 (cluster_form 은 아래에서 단일로 반영)
		Create_Node_Config_Arr.push(nodeGroupData);

		// HTML 생성 (NodeGroup 리스트 항목)
		var add_nodegroup_html = '<li class="removebullet btn btn-info" onclick="webconsolejs[\'partials/operation/manage/clustercreate\'].view_ngForm(\'' + nodeGroup_data_cnt + '\')">'
			+ nodeGroup_name + displayNodegroupCnt
			+ '</li>';

		// 리스트 업데이트 — 기존 + NodeGroup 버튼(#..._plusIcon)은 유지하고 항목만 추가
		// (remove 후 getPlusVm으로 재생성하면 id가 _plusVmIcon으로 바뀌어 다음 Done의
		//  remove가 실패하고, Done마다 + NodeGroup 버튼이 하나씩 증식한다)
		var ngEleId = "nodegroup";
		if (isNodeGroup) {
			ngEleId = "addnodegroup";
		}

		$("#" + ngEleId + "_list").append(add_nodegroup_html);

		// 카운터 증가
		nodeGroup_data_cnt++;
	}

	// cluster_form 은 클러스터 하나에 대한 값이므로 항상 슬롯 0 을 현재 값으로 덮어쓴다.
	// push 하면 Deploy 가 읽는 [0] 이 첫 Done 시점의 낡은 값으로 고정된다.
	// NodeGroup 목록은 지금까지 누적된 전체를 싣는다 — 여러 개 만들어도 모두 전송된다.
	cluster_form["k8sNodeGroupList"] = Create_Node_Config_Arr.slice();
	Create_Cluster_Config_Arr[0] = cluster_form;

	// 폼 토글
    var div = document.getElementById("nodegroup_configuration");
    webconsolejs["partials/layout/navigatePages"].toggleSubElement(div);

	// 9. 폼 초기화
	$("#cluster_form").each(function () {
		this.reset();
	});
	
	// 숨겨진 필드들 초기화
	$("#n_name").val("");
	$("#n_specid").val("");
	$("#n_imageid").val("");
	$("#n_minnodesize").val("");
	$("#n_maxnodesize").val("");
	$("#n_sshkey").val("");
	$("#n_rootdisk").val("");
	$("#n_rootdisksize").val("");
	$("#n_autoscaling").val("");
	$("#n_desirednodesize").val("");

	// 직접 입력 필드들 초기화
	$("#node_name").val("");
	$("#node_specid").val("");
	$("#node_imageid").val("");
	$("#node_minnodesize").val("");
	$("#node_maxnodesize").val("");
	$("#node_sshkey").val("");
	$("#node_rootdisk").val("");
	$("#node_rootdisksize").val("");
	$("#node_autoscaling").val("");
	$("#node_desirednodesize").val("1"); // 기본값 1로 설정
}

// select에 없는 값이면 option을 만들어 넣는다.
// min/max Node Size 셀렉트는 1~5만 미리 들어 있어, 그보다 큰 값을 그대로 세팅하면 조용히 비워진다.
function ensureSelectOption(selector, value) {
	if (value === undefined || value === null || value === "") return;
	const $sel = $(selector);
	if ($sel.length === 0) return;
	if ($sel.find('option[value="' + value + '"]').length === 0) {
		$sel.append('<option value="' + value + '">' + value + '</option>');
	}
}

// 값이 select에 존재할 때만 세팅한다.
// sshKey/Root Disk Type은 조회 결과로 채워지므로, 없는 값을 억지로 넣기보다
// 비워 두고 사용자가 유효한 값을 고르게 하는 편이 안전하다.
function setSelectIfOptionExists(selector, value) {
	const $sel = $(selector);
	if ($sel.length === 0) return false;
	if (!value || $sel.find('option[value="' + value + '"]').length === 0) {
		$sel.val("");
		return false;
	}
	$sel.val(value);
	return true;
}

// NodeGroup Configuration 폼(#node_*)과 hidden 필드(#n_*)를 하나의 NodeGroup 데이터로 채운다.
// Edit 모드(view_ngForm)와 JSON Import가 공유한다.
// 인자는 model.K8sNodeGroupReq 형태:
//   {name, specId, imageId, sshKeyId, rootDiskType, rootDiskSize,
//    desiredNodeSize, minNodeSize, maxNodeSize, onAutoScaling}
export function prefillNodeGroupForm(nodeGroupData) {
	if (!nodeGroupData) return { sshKeyMatched: false, rootDiskTypeMatched: false };

	$("#node_name").val(nodeGroupData.name || "");
	$("#node_specid").val(nodeGroupData.specId || "");
	$("#node_commonSpecId").val(nodeGroupData.specId || "");
	$("#node_imageid").val(nodeGroupData.imageId || "");

	const autoScalingOn = String(nodeGroupData.onAutoScaling || "false") === "true";
	$("#node_autoscaling").val(autoScalingOn ? "true" : "false");
	if (autoScalingOn) {
		$('#node_minnodesize, #node_maxnodesize').prop('disabled', false);
		ensureSelectOption("#node_minnodesize", nodeGroupData.minNodeSize);
		ensureSelectOption("#node_maxnodesize", nodeGroupData.maxNodeSize);
		$("#node_minnodesize").val(nodeGroupData.minNodeSize || "");
		$("#node_maxnodesize").val(nodeGroupData.maxNodeSize || "");
	} else {
		$('#node_minnodesize, #node_maxnodesize').val('').prop('disabled', true);
	}

	const sshKeyMatched = setSelectIfOptionExists("#node_sshkey", nodeGroupData.sshKeyId);
	const rootDiskTypeMatched = setSelectIfOptionExists("#node_rootdisk", nodeGroupData.rootDiskType);
	$("#node_rootdisksize").val(nodeGroupData.rootDiskSize || "");
	$("#node_desirednodesize").val(nodeGroupData.desiredNodeSize || "1");

	// Hidden 필드에도 설정
	$("#n_name").val(nodeGroupData.name || "");
	$("#n_specid").val(nodeGroupData.specId || "");
	$("#n_imageid").val(nodeGroupData.imageId || "");
	$("#n_minnodesize").val(autoScalingOn ? (nodeGroupData.minNodeSize || "") : "");
	$("#n_maxnodesize").val(autoScalingOn ? (nodeGroupData.maxNodeSize || "") : "");
	$("#n_sshkey").val($("#node_sshkey").val() || "");
	$("#n_rootdisk").val($("#node_rootdisk").val() || "");
	$("#n_rootdisksize").val(nodeGroupData.rootDiskSize || "");
	$("#n_autoscaling").val(autoScalingOn ? "true" : "false");
	$("#n_desirednodesize").val(nodeGroupData.desiredNodeSize || "1");

	return { sshKeyMatched, rootDiskTypeMatched };
}

export function view_ngForm(cnt){
	// NodeGroup Configuration 폼 표시
	var div = document.getElementById("nodegroup_configuration");
	webconsolejs["partials/layout/navigatePages"].toggleElement(div);
	
	// 배열에서 해당 NodeGroup 데이터 가져오기
	if (cnt !== undefined && Create_Node_Config_Arr[cnt]) {
		// Edit 모드 활성화
		currentEditingNodeGroupIndex = cnt;
		
		var nodeGroupData = Create_Node_Config_Arr[cnt];

		// Form 필드에 기존 데이터 채우기
		prefillNodeGroupForm(nodeGroupData);

		console.log("Edit mode: Loaded NodeGroup data at index", cnt, ":", nodeGroupData);
	} else {
		// Create 모드 (+ NodeGroup 클릭 시)
		currentEditingNodeGroupIndex = null;
		console.log("Create mode: New NodeGroup");
	}
}

// PMK용 Server Recommendation 콜백 함수 (Runtime nodegroup_configuration 폼용)
export function callbackNodegroupServerRecommendation(vmSpec) {
	// 기존 nodegroup_configuration 폼 필드에 spec 정보 설정
	$("#node_specid").val(vmSpec.specName);
	$("#node_provider").val(vmSpec.provider);
	$("#node_connectionName").val(vmSpec.connectionName);
	$("#node_commonSpecId").val(vmSpec.commonSpecId);
	
	// hidden 필드에도 설정
	$("#n_specid").val(vmSpec.commonSpecId); // 실제 사용할 specId
	
	// spec 정보를 전역 변수에 저장 (이미지 검색 시 사용)
	if (vmSpec.osArchitecture) {
		window.selectedPmkSpecInfo = {
			provider: vmSpec.provider,
			connectionName: vmSpec.connectionName,
			regionName: vmSpec.regionName || vmSpec.connectionName.replace(vmSpec.provider + "-", ""),
			osArchitecture: vmSpec.osArchitecture,
			specName: vmSpec.specName,
			commonSpecId: vmSpec.commonSpecId
		};
		
		// PMK Image 모달 필드 미리 설정 (성능 최적화)
		$("#image-provider-pmk").val(vmSpec.provider);
		$("#image-region-pmk").val(vmSpec.regionName || vmSpec.connectionName.replace(vmSpec.provider + "-", ""));
		$("#image-os-architecture-pmk").val(vmSpec.osArchitecture);
	} else {
		console.warn("vmSpec does not have osArchitecture information");
	}
}

// PMK용 Image 모달 검증 및 열기 (기존 nodegroup_configuration 폼용)
// CSP 기본 노드 이미지를 쓴다 — 목록에서 고르지 않고 "default" 를 넣는다.
// 이미지 목록이 CSP마다 수십 건이고 이름이 UUID인 경우(NHN)가 있어 고르기 어렵다.
// cb-tumblebug이 "default" 를 빈 문자열로 바꿔 넘기면 각 CSP 드라이버가 자기 기본값을 고른다.
export function useDefaultImage(event) {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	const defaultId = webconsolejs["partials/operation/manage/k8s_imagerecommendation"].DEFAULT_IMAGE_ID || "default";
	// 모달 콜백(setImageSelectionCallbackPmk)과 동일하게 hidden 미러도 함께 채운다
	$("#node_imageid").val(defaultId);
	$("#n_imageid").val(defaultId);
	return false;
}

export function validateAndOpenImageModal(event) {
	// Spec 입력 필드 값 확인
	var specValue = $("#node_specid").val();
	
	if (!specValue || specValue.trim() === "") {
		console.warn("No PMK spec selected - validation failed");
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', 'Select a node specification first.');
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		return false;
	}
	
	// 전역 변수에서 spec 정보 확인
	if (!window.selectedPmkSpecInfo) {
		console.warn("No PMK spec info in global variable - validation failed");
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', 'Select a node specification first.');
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		return false;
	}
	
	// 이벤트 전파 중단 및 기본 동작 방지
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	
	try {
		// PMK용 이미지 선택 콜백 함수 설정
		if (webconsolejs["partials/operation/manage/k8s_imagerecommendation"]) {
			webconsolejs["partials/operation/manage/k8s_imagerecommendation"].setImageSelectionCallbackPmk(function (selectedImage) {
				// 기존 nodegroup_configuration 폼의 이미지 필드에 설정
				$("#node_imageid").val(selectedImage.name || selectedImage.cspImageName || "");
				$("#n_imageid").val(selectedImage.name || selectedImage.cspImageName || "");
			});
		} else {
			console.error("PMK Image recommendation module not found.");
		}
		
		// 비동기적으로 모달 열기
		setTimeout(function () {
			try {
				// Bootstrap 5 방식으로 모달 열기
				if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
					const imageModalEl = document.getElementById('image-search-pmk');
					if (imageModalEl) {
						const imageModal = new bootstrap.Modal(imageModalEl);
						imageModal.show();
					} else {
						throw new Error("PMK Image modal element not found");
					}
				} else {
					console.error("Bootstrap is not loaded");
					webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Could not open the modal because Bootstrap is not loaded.');
				}
			} catch (error) {
				console.error("failed to open PMK image modal:", error);
				webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Error opening the K8s image recommendation modal. Please try again.');
			}
		}, 100); // 100ms 지연으로 이벤트 처리 완료 후 모달 열기
		
	} catch (error) {
		console.error("failed to validate and open image modal:", error);
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Error opening the image recommendation modal. Please try again.');
		return false;
	}
	
	return true;
}
