import { TabulatorFull as Tabulator } from "tabulator-tables";
//import { selectedMciObj } from "./mci";
//document.addEventListener("DOMContentLoaded", iniClusterkCreate) // page가 아닌 partials에서는 제거

// create page 가 load 될 때 실행해야 할 것들 정의
export function iniClusterkCreate() {
	console.log("initClusterCreate")

	// partial init functions

	webconsolejs["partials/operation/manage/clusterrecommendation"].initClusterRecommendation(webconsolejs["partials/operation/manage/clustercreate"].callbackClusterRecommendation);// recommend popup에서 사용하는 table 정의.
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

export async function checkAvailableK8sClusterVersion(providerName, regionName){
	try {
        var availableVersions = await webconsolejs["common/api/services/pmk_api"].getAvailableK8sClusterVersion(providerName, regionName);

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
            alert("Failed to retrieve Kubernetes cluster versions. Please try again.");
        }

    } catch (error) {
        console.error("Failed to retrieve Kubernetes cluster versions. Please try again.", error);

        if (error.response && error.response.status === 500) {
            alert("Failed to retrieve available Kubernetes cluster versions due to server error. Please try again.");
        } else {
            alert("An unexpected error occurred. Please try again.");
        }
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

		checkAvailableK8sClusterVersion(selectedProvider, selectedRegion);
	}

}

var createMciListObj = new Object();
var isNodeGroup = false // mci 생성(false) / vm 추가(true)
var Create_Cluster_Config_Arr = new Array();
var Create_Node_Config_Arr = new Array();
var nodeGroup_data_cnt = 0


// 서버 더하기버튼 클릭시 서버정보 입력area 보이기/숨기기
// isExpert의 체크 여부에 따라 바뀜.
// newServers 와 simpleServers가 있음.
export async function displayNewNodeForm() {
	
	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
	var selectedNsId = selectedWorkspaceProject.nsId;
	
	// getSSHKEY
	var sshKeyList = await webconsolejs["common/api/services/pmk_api"].getSshKey(selectedNsId)
	console.log("sshKeyList",sshKeyList)
	var mysshKeyList = sshKeyList.data.responseData.sshKey
	console.log("mysshKeyList",mysshKeyList)
	if (mysshKeyList && mysshKeyList.length > 0) {
        var html = '<option value="">Select sshKey</option>';
        mysshKeyList.forEach(item => {
            html += '<option value="' + item.id + '">' + item.id + '</option>';
        });
    
        $("#node_sshkey").empty();
        $("#node_sshkey").append(html);
    } else {
        console.log("No SSH keys available");
	}

	//recommendVm으로 k8s spec
	

	// availablek8sclusternodeimage
	// provider값과 region값 내려주기 전까지 임시
	// var selectedCluster = webconsolejs["pages/operation/manage/pmk"].selectedPmkObj
	// var providerString = selectedCluster[0].provider
	// var {provider, region} = extractProviderRegion(providerString)

	// var availableK8sClusterNodeImageList = await webconsolejs["common/api/services/pmk_api"].getAvailablek8sClusterNodeImage(provider, region)
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
	webconsolejs["partials/layout/navigatePages"].toggleElement(div)

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
	append = append + '<li class="removebullet btn btn-secondary-lt" id="' + vmElementId + '_plusVmIcon" onClick="webconsolejs[\'partials/operation/manage/mcicreate\'].displayNewServerForm()">';
	append = append + "+ NodeGroup"
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

export async function deployNode() {
	console.log("deployNode")
	await createNode()
}

export async function createNode() {
	console.log("createNode")
	console.log("Create_Node_Config_Arr", Create_Node_Config_Arr)

	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
	var selectedNsId = selectedWorkspaceProject.nsId;
	console.log("selected projectId : ", selectedNsId)

	var k8sClusterId = webconsolejs["pages/operation/manage/pmk"].selectedPmkObj[0].id
	console.log("selected clusterId : ", k8sClusterId)

	webconsolejs["common/api/services/pmk_api"].createNode(k8sClusterId, selectedNsId, Create_Node_Config_Arr)

}

export async function addNewNodeGroup() {
	// isNode = false

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


	console.log("addNewNodeGroup")
	Create_Cluster_Config_Arr = new Array();
	Create_Node_Config_Arr = new Array();

	var selectedCluster = webconsolejs["pages/operation/manage/pmk"].selectedPmkObj
	console.log("selectedPmk", selectedCluster)

	var cluster_name = selectedCluster[0].name
	var cluster_desc = selectedCluster[0].description
	var cluster_connection = selectedCluster[0].provider// 임시
	var cluster_vpc = selectedCluster[0].vpc
	var cluster_subnet = selectedCluster[0].subnet
	var cluster_securitygroup = selectedCluster[0].securitygroup
	var cluster_version = selectedCluster[0].version
	console.log("cluster_provider", selectedCluster[0])

	$("#node_cluster_name").val(cluster_name)
	$("#node_cluster_desc").val(cluster_desc)
	// $("#node_cluster_connection").val(cluster_connection)
	$("#node_cluster_cloudconnection").html('<option value="' + cluster_connection + '" selected>' + cluster_connection + '</option>');
	// provider, region, connection, vpc, subnet, sg, cluster version 채워넣어 펼치기
	$("#node_cluster_vpc").html('<option value="' + cluster_vpc + '" selected>' + cluster_vpc + '</option>');
	$("#node_cluster_subnet").html('<option value="' + cluster_subnet + '" selected>' + cluster_subnet + '</option>');
	$("#node_cluster_sg").html('<option value="' + cluster_securitygroup + '" selected>' + cluster_securitygroup + '</option>');
	$("#node_cluster_version").html('<option value="' + cluster_version + '" selected>' + cluster_version + '</option>');


	isNodeGroup = true
}

export async function addNewPmk() {
	// isNode = false

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

	Create_Cluster_Config_Arr = new Array();

	console.log("addNewPmk")
	
	// isNodeGroup = true
}

export async function changeCloudConnection(connectionName) {
	console.log("selected connection : ", connectionName)
	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

	var selectedNsId = selectedWorkspaceProject.nsId;
	console.log("selected projectId : ", selectedNsId)
	await setVpcList(connectionName, selectedNsId)

}

// 해당 connection의 vpcList 조회하여 set
export async function setVpcList(connectionName, nsId) {

	// api 호출	
	var vpcList = await webconsolejs["common/api/services/pmk_api"].getVpcList(connectionName, nsId)
	// select box에 SET
	var vNetList = []
	var res_item = vpcList.vNet

	res_item.forEach(item => {
		console.log("VPC connectionName: ", item.connectionName);
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
			var subnetList = await webconsolejs["common/api/services/pmk_api"].getSubnetList(selectedVpcId, nsId);
			setSubnetList(subnetList)

			// get securityGroupList
			var securityGroupList = await webconsolejs["common/api/services/pmk_api"].getSecurityGroupList(selectedVpcId, nsId);
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
	console.log("securityGroupList",securityGroupList)
	var html = '<option value="">Select Security Group</option>';
	var securityGroups = securityGroupList.securityGroup
	securityGroups.forEach(securitygroup => {
		html += '<option value="' + securitygroup.id + '">' + securitygroup.id + '</option>';
	});

	$("#cluster_sg").empty();
	$("#cluster_sg").append(html);

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

	console.log("Create_Cluster_Config_Arr", Create_Cluster_Config_Arr)

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

	webconsolejs["common/api/services/pmk_api"].CreateCluster(clusterName, selectedConnection, clusterVersion, selectedVpc, selectedSubnet, selectedSecurityGroup, Create_Cluster_Config_Arr, selectedNsId)
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
    // 클러스터 기본 정보 할당
    const connectionName = $("#cluster_connection").val();
    const clusterName = $("#cluster_name").val();
    const vNetId = $("#cluster_vpc").val();
    const subnetId = $("#subnet").val();
    const securityGroupId = $("#cluster_sg").val();
    const version = $("#cluster_version").val();
    const description = $("#cluster_desc").val();

    console.log("Connection Name:", connectionName);
    console.log("Cluster Name:", clusterName);
    console.log("VNet ID:", vNetId);
    console.log("Subnet ID:", subnetId);
    console.log("Security Group ID:", securityGroupId);
    console.log("Version:", version);
    console.log("Description:", description);

    var cluster_form = {
        connectionName: connectionName || "", 
        name: clusterName || "",
        vNetId: vNetId || "", 
        subnetIds: [subnetId || ""],
        securityGroupIds: [securityGroupId || ""],
        version: version || "", 
        description: description || ""
    };

    // NodeGroupList 추가 (조건부로 추가, 있을 때만 넣음)
    const nodeGroupName = $("#node_name").val();
    const desiredNodeSize = $("#node_desirednodesize").val();
    const imageId = $("#node_imageid").val();
    const maxNodeSize = $("#node_maxnodesize").val();
    const minNodeSize = $("#node_minnodesize").val();
    const onAutoScaling = $("#node_autoscaling").val();
    const rootDiskSize = $("#node_rootdisksize").val();
    const rootDiskType = $("#node_rootdisk").val();
    const specId = $("#node_specid").val();
    const sshKeyId = $("#node_sshkey").val();

    console.log("Node Group Name:", nodeGroupName);
    console.log("Desired Node Size:", desiredNodeSize);
    console.log("Image ID:", imageId);
    console.log("Max Node Size:", maxNodeSize);
    console.log("Min Node Size:", minNodeSize);
    console.log("Auto Scaling:", onAutoScaling);
    console.log("Root Disk Size:", rootDiskSize);
    console.log("Root Disk Type:", rootDiskType);
    console.log("Spec ID:", specId);
    console.log("SSH Key ID:", sshKeyId);

    if (nodeGroupName) {
        cluster_form["k8sNodeGroupList"] = [
            {
                "desiredNodeSize": desiredNodeSize || "",
                "imageId": imageId || "",
                "maxNodeSize": maxNodeSize || "",
                "minNodeSize": minNodeSize || "",
                "name": nodeGroupName,
                "onAutoScaling": onAutoScaling || "false",
                "rootDiskSize": rootDiskSize || "",
                "rootDiskType": rootDiskType || "",
                "specId": specId || "",
                "sshKeyId": sshKeyId || ""
            }
        ];
    }
	var nodeGroup_name = cluster_form.name
	// var nodeGroup_cnt = parseInt(cluster_form.k8sNodeGroupListdesiredNodeSize)
	var nodeGroup_cnt = 1
	var add_nodegroup_html = ""
    Create_Cluster_Config_Arr.push(cluster_form);
	if (isNodeGroup) {
		Create_Node_Config_Arr.push(cluster_form["k8sNodeGroupList"][0]);
        console.log("Final node Config:", Create_Node_Config_Arr);
	
	}
    console.log("Final Cluster Config:", Create_Cluster_Config_Arr);
	var displayNodegroupCnt = '(' + nodeGroup_cnt + ')'

	add_nodegroup_html += '<li class="removebullet btn btn-info" onclick="webconsolejs[\'partials/operation/manage/clustercreate\'].view_ngForm(\'' + nodeGroup_data_cnt + '\')">'

		+ nodeGroup_name + displayNodegroupCnt

		+ '</li>';
    var div = document.getElementById("nodegroup_configuration");
    webconsolejs["partials/layout/navigatePages"].toggleSubElement(div);
	var ngEleId = "nodegroup"
	if (isNodeGroup) {
		ngEleId = "addnodegroup"
	}

	
	var element = $("#" + ngEleId + "_plusIcon");
	console.log("Element to remove:", element);  // 선택된 요소 확인
	if (element.length) {
		element.remove();
		console.log("Element removed successfully");
	} else {
		console.log("Element not found");
	}
	
	$("#" + ngEleId + "_plusIcon").remove();
	$("#" + ngEleId + "_list").append(add_nodegroup_html)
	$("#" + ngEleId + "_list").prepend(getPlusVm(ngEleId));
	nodeGroup_data_cnt++
	$("#express_form").each(function () {
		this.reset();
	})
	//
}

export function addNodeFormDone_btn() {

	$("#n_name").val($("#node_name").val())
	$("#n_specid").val($("#node_specid").val())
	$("#n_imageid").val($("#node_imageid").val())
	$("#n_minnodesize").val($("#node_minnodesize").val())
	$("#n_maxnodesize").val($("#node_maxnodesize").val())
	$("#n_sshkey").val($("#node_sshkey").val())
	$("#n_rootdisk").val($("#node_rootdisk").val())
	$("#n_rootdisksize").val($("#node_rootdisksize").val())
	$("#n_autoscaling").val($("#node_autoscaling").val())
	$("#n_desirednodesize").val($("#node_desirednodesize").val())
	
	var node_form = {}
	node_form["desiredNodeSize"] = $("#n_desirednodesize").val();
    node_form["imageId"] = $("#n_imageid").val();
    node_form["maxNodeSize"] = $("#n_maxnodesize").val();
    node_form["minNodeSize"] = $("#n_minnodesize").val();
    node_form["name"] = $("#n_name").val();
    node_form["onAutoScaling"] = $("#n_autoscaling").val();
    node_form["rootDiskSize"] = $("#n_rootdisksize").val();
    node_form["rootDiskType"] = $("#n_rootdisk").val();
    node_form["specId"] = $("#n_specid").val();
    node_form["sshKeyId"] = $("#n_sshkey").val(); 

	var nodeGroup_name = node_form.name
	var nodeGroup_cnt = parseInt(node_form.desiredNodeSize)
	var add_nodegroup_html = ""

    Create_Node_Config_Arr.push(node_form)
	console.log("express btn click and express form data : ", node_form)
	
	var displayNodegroupCnt = '(' + nodeGroup_cnt + ')'

	add_nodegroup_html += '<li class="removebullet btn btn-info" onclick="webconsolejs[\'partials/operation/manage/clustercreate\'].view_ngForm(\'' + nodeGroup_data_cnt + '\')">'

		+ nodeGroup_name + displayNodegroupCnt

		+ '</li>';

	var div = document.getElementById("nodegroup_configuration");
	webconsolejs["partials/layout/navigatePages"].toggleSubElement(div)

	// TODO: + 박스 추가
	var ngEleId = "nodegroup"
	$("#" + ngEleId + "_plusVmIcon").remove();
	$("#" + ngEleId + "_list").append(add_nodegroup_html)
	$("#" + ngEleId + "_list").prepend(getPlusVm(vmEleId));
}

export function view_ngForm(cnt){
	console.log('view simple cnt : ', cnt);
	var div = document.getElementById("nodegroup_configuration");
	webconsolejs["partials/layout/navigatePages"].toggleElement(div)
}
