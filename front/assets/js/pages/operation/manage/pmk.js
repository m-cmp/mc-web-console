import { TabulatorFull as Tabulator } from "tabulator-tables";

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
    let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
    var respPmkList = await webconsolejs["common/api/services/pmk_api"].getClusterList(project.NsId);
    getPmkListCallbackSuccess(project.NsId, respPmkList);
})

////
// 모달 콜백 예제
export function commoncallbac(val) {
    alert(val);
}
////

var totalPmkListObj = new Object();
var selectedWorkspaceProject = new Object();
export var selectedPmkObj = new Object();
export var nsid = "";
var totalPmkStatusMap = new Map();
var totalVmStatusMap = new Map();
var selectedClusterData = new Object();
// var totalCloudConnectionMap = new Map();

var pmkListTable;// div로 선언한 pmk table
var checked_array = [];
var currentPmkId = "";
var currentNodeGroupName = ""
var currentProvider = ""

initPmkTable(); // init tabulator

//DOMContentLoaded 는 Page에서 1개만.
// init + 파일명 () : ex) initPmk() 를 호출하도록 한다.
// document.addEventListener("DOMContentLoaded", initPmk); // 중복 제거

// 해당 화면에서 최초 설정하는 function
//로드 시 prj 값 받아와 getPmkList 호출
async function initPmk() {
    ////////////////////// partials init functions///////////////////////////////////////
    try {
        webconsolejs["partials/operation/manage/clustercreate"].iniClusterkCreate();//PmkCreate을 Partial로 가지고 있음. 
        webconsolejs["partials/operation/manage/clustercreate"].addNewPmk();

        // 새로운 폼 Dynamic 초기화
        await initFormDynamic();

        // 이미지 추천 모달 초기화
        if (webconsolejs["partials/operation/manage/imagerecommendation"]) {
            webconsolejs["partials/operation/manage/imagerecommendation"].initImageModal();
        } else {
            console.warn("Image recommendation module not found");
        }

        // PMK Spec 모달 이벤트 리스너 설정
        setupPmkSpecModalEvents();

    } catch (e) {
        console.error("Error initializing PMK:", e);
        console.error("Error stack:", e.stack);
    }
    ////////////////////// partials init functions end ///////////////////////////////////////


    ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
    selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

    // 기존 Add cluster 버튼 제거 (중복 방지)
    const existingButtons = $("#page-header-btn-list").find('a[href="#createcluster"]');
    existingButtons.remove();

    var targetSection = "createcluster"
    var createBtnName = "Add cluster"
    var onclickEvent = "webconsolejs['partials/operation/manage/clustercreate'].addNewPmk()";

    webconsolejs['partials/layout/navigatePages'].addPageHeaderButton(targetSection, createBtnName);

    // workspace selection check
    webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject)
    ////////////////////// set workspace list, project list at Navbar end //////////////////////////////////

    ////////////////////// 받은 pmkId가 있으면 해당 pmkId를 set하고 조회한다. ////////////////

    // 외부(dashboard)에서 받아온 pmkID가 있으면 pmk INFO 이동
    // 현재 브라우저의 URL
    const url = window.location.href;
    const urlObj = new URL(url);
    // URLSearchParams 객체 생성
    const params = new URLSearchParams(urlObj.search);
    if (params.toString()) {
        var pmkID = params.get('pmkID');// pmkID 파라미터 값 추출
        if (pmkID !== null) {
            currentPmkId = pmkID
        }
    }

    refreshPmkList()
}

// pmk목록 조회. init, refresh 에서 사용
export async function refreshPmkList() {
    if (selectedWorkspaceProject.projectId != "") {
        var selectedProjectId = selectedWorkspaceProject.projectId;
        var selectedNsId = selectedWorkspaceProject.nsId;

        //getPmkList();// project가 선택되어 있으면 pmk목록을 조회한다.
        var respPmkList = await webconsolejs["common/api/services/pmk_api"].getClusterList(selectedNsId);
        getPmkListCallbackSuccess(selectedProjectId, respPmkList);

        if (currentPmkId != undefined) {
            toggleRowSelection(currentPmkId)
            getSelectedPmkData()
        }
        ////////////////////  pmkId를 set하고 조회 완료. ////////////////
    }
}

// getPmkList 호출 성공 시
function getPmkListCallbackSuccess(caller, pmkList) {

    totalPmkListObj = pmkList.K8sClusterInfo;

    const transformedData = mappingTablePmkData(totalPmkListObj);
    pmkListTable.setData(transformedData);

    setToTalPmkStatus(); // pmk상태 표시
    setTotalClusterStatus(); // pmk 의 vm들 상태표시
    //     setTotalConnection();// Pmk의 provider별 connection 표시

    // Cluster Terminal 버튼 상태 설정
    updateClusterRemoteCmdButtonState();

    // displayPmkDashboard();

}

function mappingTablePmkData(totalPmkListObj) {

    return totalPmkListObj.map(item => {
        const keyValueList = item.spiderViewK8sClusterDetail?.KeyValueList || [];
        const network = item.spiderViewK8sClusterDetail?.Network || {};
        const vpc = (network.VpcIID && network.VpcIID.SystemId) || "N/A";
        const subnet = (network.SubnetIIDs && network.SubnetIIDs[0] && network.SubnetIIDs[0].SystemId) || "N/A";
        const securityGroup = (network.SecurityGroupIIDs && network.SecurityGroupIIDs[0] && network.SecurityGroupIIDs[0].SystemId) || "N/A";
        const version = item.spiderViewK8sClusterDetail?.Version || "N/A";
        const nodeGroupCount = item.spiderViewK8sClusterDetail?.NodeGroupList?.length || 0;
        return {
            name: item.name,
            id: item.id,
            resourceType: item.resourceType,
            systemLabel: item.systemLabel || "N/A",
            systemMessage: item.systemMessage || "N/A",
            // TODO : ima, provider api res 변경되면 수정
            providerImg: item.connectionConfig.providerName || "",  // providerImg 값을 추가해야 함 (필요시)
            provider: item.connectionConfig.providerName || "N/A",
            vpc: vpc,
            subnet: subnet,
            securitygroup: securityGroup,
            version: version,
            nodegroup: nodeGroupCount
        };
    });
}

// 클릭한 pmk info 가져오기
// 표에서 선택된 PmkId 받아옴
export async function getSelectedPmkData() {

    if (currentPmkId != undefined && currentPmkId != "") {
        var selectedNsId = selectedWorkspaceProject.nsId;

        var pmkResp = await webconsolejs["common/api/services/pmk_api"].getCluster(selectedNsId, currentPmkId)

        if (pmkResp.status != 200) {
            // failed.  // TODO : Error Popup 처리
            return;
        }
        // SET PMK Info page
        setPmkInfoData(pmkResp.data)

        // Toggle PMK Info
        var div = document.getElementById("cluster_info");
        const hasActiveClass = div.classList.contains("active");
        if (!hasActiveClass) {
            // cluster_info 가 active면 toggle 필요 없음
            webconsolejs["partials/layout/navigatePages"].toggleElement(div)
        }
    }
}

// pmk 삭제
export function deletePmk() {
  // Validation 1: PMK가 선택되었는지 확인
  if (!currentPmkId || currentPmkId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'PMK Selection Check',
      'Please select a PMK to delete.'
    );
    return;
  }

  // Validation 2: Workspace/Project가 선택되었는지 확인
  var selectedNsId = selectedWorkspaceProject.nsId;
  if (!selectedNsId || selectedNsId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Workspace Selection Check',
      'Please select a workspace and project first.'
    );
    return;
  }

  // Validation 통과 후 API 호출
  webconsolejs['common/api/services/pmk_api'].pmkDelete(selectedNsId, currentPmkId);
}

// nodegroup 삭제
export function deleteNodeGroup() {
  // Validation 1: NodeGroup이 선택되었는지 확인
  if (!currentNodeGroupName || currentNodeGroupName === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'NodeGroup Selection Check',
      'Please select a NodeGroup to delete.'
    );
    return;
  }

  // Validation 2: PMK가 선택되었는지 확인
  if (!currentPmkId || currentPmkId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'PMK Selection Check',
      'Please select a PMK first.'
    );
    return;
  }

  // Validation 3: Workspace/Project가 선택되었는지 확인
  var selectedNsId = selectedWorkspaceProject.nsId;
  if (!selectedNsId || selectedNsId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Workspace Selection Check',
      'Please select a workspace and project first.'
    );
    return;
  }

  // Validation 통과 후 API 호출
  webconsolejs['common/api/services/pmk_api'].nodeGroupDelete(
    selectedNsId,
    currentPmkId,
    currentNodeGroupName
  );
}

// 클릭한 pmk의 info값 세팅
function setPmkInfoData(pmkData) {
    var clusterData = pmkData.responseData;
    var clusterDetailData = clusterData.spiderViewK8sClusterDetail;
    var pmkNetwork = clusterDetailData?.Network || {};
    var clusterProvider = clusterData.connectionConfig.providerName
    currentProvider = clusterProvider
    try {

        var pmkName = clusterData.name;
        var pmkID = clusterData.id
        var pmkVersion = clusterDetailData?.Version || "N/A";
        var pmkStatus = clusterDetailData?.Status || "N/A";

        // 네트워크 정보
        var pmkVpc = (pmkNetwork.VpcIID && pmkNetwork.VpcIID.SystemId) || "N/A";
        var pmkSubnet = (pmkNetwork.SubnetIIDs && pmkNetwork.SubnetIIDs[0] && pmkNetwork.SubnetIIDs[0].SystemId) || "N/A";
        var pmkSecurityGroup = (pmkNetwork.SecurityGroupIIDs && pmkNetwork.SecurityGroupIIDs[0] && pmkNetwork.SecurityGroupIIDs[0].SystemId) || "N/A";

        // 추가정보
        var pmkCloudConnection = clusterData.connectionName
        var pmkEndPoint = clusterDetailData?.AccessInfo?.Endpoint || "N/A"
        var pmkKubeConfig = clusterDetailData?.AccessInfo?.Kubeconfig || "N/A" // TODO: 너무 길어서 처리 질문

        // webconsolejs["common/api/services/pmk_api"].getPmkInfoProviderNames(pmkData); // PMK에 사용된 provider
        // var pmkDescription = clusterData.description;
        // var pmkDispStatus = webconsolejs["common/api/services/pmk_api"].getPmkStatusFormatter(pmkStatus);
        // var pmkStatusIcon = webconsolejs["common/api/services/pmk_api"].getPmkStatusIconFormatter(pmkDispStatus);
        // var totalNodeGroupCount = (clusterDetailData.NodeGroupList == null) ? 0 : clusterDetailData.NodeGroupList.length;

        $("#cluster_info_name").text(pmkName);
        // $("#cluster_info_name").text(pmkName + " / " + pmkID);
        $("#cluster_info_version").text(pmkVersion);
        $("#cluster_info_status").text(pmkStatus);

        // 네트워크 정보
        $("#cluster_info_vpc").text(pmkVpc);
        $("#cluster_info_subnet").text(pmkSubnet);
        $("#cluster_info_securitygroup").text(pmkSecurityGroup);

        // 추가정보
        $("#cluster_info_cloudconnection").text(pmkCloudConnection);
        $("#cluster_info_endpoint").text(pmkEndPoint || "N/A");
        // $("#cluster_info_kubeconfig").text(pmkKubeConfig || "N/A");

    } catch (e) {
        console.error(e);
    }

    // TODO: pmk info로 cursor 이동
    var nodeGroupList = clusterDetailData?.NodeGroupList

    // displayNodeGroupStatusList(pmkID, clusterData)
    if (Array.isArray(nodeGroupList) && nodeGroupList.length > 0) {
        displayNodeGroupStatusList(pmkID, clusterProvider, clusterData);
    }
}

// pmk life cycle 변경
export function changePmkLifeCycle(type) {

    var selectedNsId = selectedWorkspaceProject.nsId;
    webconsolejs["common/api/services/pmk_api"].pmkLifeCycle(type, checked_array, selectedNsId)
}

// 체크박스를 클릭했을 때 선택 상태를 반전시킴
export function toggleNodeCheck(pmkID, nodeID) {
    var checkbox = $(`#node_checkbox_${nodeID}`);
    checkbox.prop("checked", !checkbox.prop("checked"));
    handleNodeCheck(pmkID, nodeID);
}

// NodeGroup / Status 리스트
function displayNodeGroupStatusList(pmkID, clusterProvider, clusterData) {
    selectedClusterData = clusterData

    var nodeGroupList = clusterData.spiderViewK8sClusterDetail?.NodeGroupList;
    var pmkName = pmkID;
    var nodeLi = "";
    nodeGroupList.sort();

    nodeGroupList.forEach((aNodeGroup) => {
        var nodeID = aNodeGroup.IId.SystemId;
        var nodeName = aNodeGroup.IId.name;
        var nodeStatus = aNodeGroup.Status;

        if (clusterProvider === "azure") {
            var nodeIDParts = nodeID.split("/");
            nodeID = nodeIDParts[nodeIDParts.length - 1];
        }
        var nodeStatusClass = webconsolejs["common/api/services/pmk_api"].getVmStatusStyleClass(nodeStatus);

        nodeLi += `
        <li id="nodeGroup_status_icon_${nodeID}" 
            class="card ${nodeStatusClass} d-flex align-items-center" 
            style="display: flex; flex-direction: row; alig
            n-items: center; justify-content: center; padding: 5px;" 
            onclick="webconsolejs['pages/operation/manage/pmk'].toggleNodeCheck('${pmkID}', '${nodeID}')">
          
          <input type="checkbox" 
                 id="node_checkbox_${nodeID}" 
                 class="vm-checkbox" 
                 style="width: 20px; height: 20px; margin-right: 10px; flex-shrink: 0;" 
                 onchange="webconsolejs['pages/operation/manage/pmk'].handleNodeCheck('${pmkID}', '${nodeID}')">
          
          <span class="text-dark-fg">${nodeID}</span>
        </li>
      `;

    });

    $("#pmk_nodegroup_info_box").empty();
    $("#pmk_nodegroup_info_box").append(nodeLi);
}

// // 체크박스를 클릭했을 때 선택 상태를 반전시킴
// export function toggleNodeCheck(pmkID, nodeID) {
//     var checkbox = $(`#node_checkbox_${nodeID}`);
//     checkbox.prop("checked", !checkbox.prop("checked"));
//     handleNodeCheck(pmkID, nodeID);
// }

// 체크박스를 선택하면 선택된 Node ID 업데이트
var selectedNodeIds = [];

export function handleNodeCheck(pmkID, nodeID) {
    var checkbox = $(`#node_checkbox_${nodeID}`);
    if (checkbox.prop("checked")) {
        if (!selectedNodeIds.includes(nodeID)) selectedNodeIds.push(nodeID);
    } else {
        selectedNodeIds = selectedNodeIds.filter(id => id !== nodeID);
    }

    // 마지막 선택된 Node ID로 설정 및 테두리 업데이트
    if (selectedNodeIds.length > 0) {
        var lastSelectedNodeID = selectedNodeIds[selectedNodeIds.length - 1];

        // Azure인 경우 SystemId에서 마지막 부분 추출
        var nodeList = selectedClusterData.k8sNodeGroupList.map(node => {
            var systemId = node.cspResourceId;
            if (currentProvider === "azure") {
                var systemIdParts = systemId.split("/");
                systemId = systemIdParts[systemIdParts.length - 1];
            }
            return {
                ...node,
                ParsedSystemId: systemId
            };
        });

        // 마지막 선택된 Node ID와 비교하여 Node를 찾음
        var aNodeObject = JSON.stringify(nodeList.find(node => node.ParsedSystemId === lastSelectedNodeID));

        webconsolejs['pages/operation/manage/pmk'].nodeGroupDetailInfo(pmkID, aNodeObject, lastSelectedNodeID);
    } else {
        // 선택된 Node가 없다면 NodeGroupInfo를 접음
        clearServerInfo();
        const div = document.getElementById("nodeGroup_info");
        if (div.classList.contains("active")) {
            webconsolejs["partials/layout/navigatePages"].toggleElement(div);
        }
    }

    highlightSelectedNodeGroup();
}

// 마지막 선택된 NodeGroup 강조 표시
function highlightSelectedNodeGroup() {
    // 모든 li 요소의 테두리 제거
    $("#pmk_nodegroup_info_box li").css("border", "none");

    // 마지막 선택된 Node ID에 테두리 추가
    if (selectedNodeIds.length > 0) {
        const lastSelectedNodeID = selectedNodeIds[selectedNodeIds.length - 1];
        $(`#nodeGroup_status_icon_${lastSelectedNodeID}`).css("border", "2px solid blue"); // 원하는 테두리 스타일 적용
    }
}
// NodeGroup List / Status 리스트에서
// Node의 한 개 클릭시 Node의 세부 정보
// export async function nodeGroupDetailInfo(pmkID, pmkName, nodeID) {
export async function nodeGroupDetailInfo(pmkID, aNodeObject, nodeID) {
    // Toggle PMK Info
    var div = document.getElementById("nodeGroup_info");
    webconsolejs["partials/layout/navigatePages"].toggleElement(div)

    clearServerInfo();
    var aNode = JSON.parse(aNodeObject);

    // spiderViewK8sNodeGroupDetail에서 실제 데이터 가져오기
    var nodeGroupDetail = aNode.spiderViewK8sNodeGroupDetail;
    displayNodeStatusList(nodeGroupDetail)

    var ngName = nodeGroupDetail.IId.NameId || nodeGroupDetail.IId.SystemId || aNode.cspResourceId
    currentNodeGroupName = ngName
    var ngImage = nodeGroupDetail.ImageIID.NameId || "AL2023_x86_64_STANDARD"
    var ngSpec = nodeGroupDetail.VMSpecName || "t3.medium"

    var ngKeyPair = nodeGroupDetail.KeyPairIID.NameId || "d2rpbhedf1f12d7uev2g"
    var ngDesiredNodeSize = nodeGroupDetail.DesiredNodeSize || aNode.desiredNodeSize
    var ngMinNodeSize = nodeGroupDetail.MinNodeSize || aNode.minNodeSize
    var ngMaxNodeSize = nodeGroupDetail.MaxNodeSize || aNode.maxNodeSize

    var ngAutoScaling = nodeGroupDetail.OnAutoScaling || aNode.onAutoScaling
    var ngRootDiskType = nodeGroupDetail.RootDiskType || ""
    var ngRootDiskSize = nodeGroupDetail.RootDiskSize || aNode.rootDiskSize

    // Info SET
    $("#ng_info_name").text(ngName)
    $("#ng_info_image").text(ngImage)
    $("#ng_info_spec").text(ngSpec)

    $("#ng_info_keypair").text(ngKeyPair)
    $("#ng_info_desirednodesize").text(ngDesiredNodeSize)
    $("#ng_info_nodesize").text(ngMinNodeSize + " / " + ngMaxNodeSize)
    // $("#ng_info_nodesize").text("1 / 2")

    $("#ng_info_autoscaling").text(ngAutoScaling)
    // $("#ng_info_autoscaling").text("true")
    $("#ng_info_rootdisktype").text(ngRootDiskType)
    $("#ng_info_rootdisksize").text(ngRootDiskSize)

    // webconsolejs["partials/operation/manage/server_monitoring"].monitoringDataInit()
}

function displayNodeStatusList(nodeData) {
    var nodeList = nodeData.Nodes
    var nodeLi = "";

    for (var nodeIndex in nodeList) {
        var aNode = nodeList[nodeIndex]
        var nodeId = aNode.SystemId
        var nodeName = aNode.NameId
        var nodeStatus = nodeData.Status
        var nodeStatusClass = webconsolejs["common/api/services/pmk_api"].getVmStatusStyleClass(nodeStatus)

        nodeLi += '<li id="node_status_icon_' + nodeId + '" class="card ' + nodeStatusClass + '"><span class="text-dark-fg">' + nodeName + '</span></li>';

        $("#pmk_node_info_box").empty();
        $("#pmk_node_info_box").append(nodeLi);
    }
}

// vm 세부 정보 초기화
function clearServerInfo() {

    $("#server_info_text").text("")
    $("#server_detail_info_text").text("")
    $("#server_detail_view_server_status").val("");
    $("#server_info_name").val("")
    $("#server_info_desc").val("")

    // ip information
    $("#server_info_public_ip").val("")
    $("#server_detail_info_public_ip_text").text("")
    $("#server_info_public_dns").val("")
    $("#server_info_private_ip").val("")
    $("#server_info_private_dns").val("")

    $("#server_detail_view_public_ip").val("")
    $("#server_detail_view_public_dns").val("")
    $("#server_detail_view_private_ip").val("")
    $("#server_detail_view_private_dns").val("")

    $("#manage_pmk_popup_public_ip").val("")

    // connection tab
    $("#server_info_csp_icon").empty()
    $("#server_connection_view_csp").val("")
    $("#manage_pmk_popup_csp").val("")

    $("#latitude").val("")
    $("#longitude").val("")

    $("#server_info_region").val("")
    $("#server_info_zone").val("")

    $("#server_detail_view_region").val("")
    $("#server_detail_view_zone").val("")

    $("#server_connection_view_region").val("")
    $("#server_connection_view_zone").val("")

    $("#server_info_connection_name").val("")
    $("#server_connection_view_connection_name").val("")

    $("#server_connection_view_credential_name").val("")
    $("#server_connection_view_driver_name").val("")

    $("#server_info_archi").val("")
    $("#server_detail_view_archi").val("")

    $("#server_info_vmspec_name").val("")
    $("#server_detail_view_server_spec").text("")

    $("#server_info_start_time").val("")

    $("#server_detail_view_server_id").val("")

    $("#server_detail_view_image_id").text("")

    $("#server_detail_view_vpc_id").text("")

    $("#server_detail_view_subnet_id").text("")
    $("#server_detail_view_eth").val("")

    // user account
    $("#server_detail_view_access_id_pass").val("")
    $("#server_detail_view_user_id_pass").val("")
    // $("#manage_pmk_popup_user_name").val("")

    $("#block_device_section").empty()
    // $("#attachedDiskList").empty()

    $("#server_detail_view_root_device_type").val("");
    $("#server_detail_view_root_device").val("");
    // $("#server_detail_disk_id").val("");
    // $("#server_detail_disk_pmk_id").val("");
    // $("#server_detail_disk_vm_id").val("");

    $("#server_detail_view_security_group").empty()
    $("#server_detail_view_keypair_name").val("")
    $("#server_info_cspVMID").val("")

    // $("#selected_pmk_id").val("");
    // $("#selected_vm_id").val("");

    // $("#exportFileName").val("");
    // $("#exportScript").val("");
}

// pmk 상태 표시
function setToTalPmkStatus() {
    try {
        for (var pmkIndex in totalPmkListObj) {
            var aPmk = totalPmkListObj[pmkIndex];

            var aPmkStatusCountMap = webconsolejs["common/api/services/pmk_api"].calculatePmkStatusCount(aPmk);
            totalPmkStatusMap.set(aPmk.id, aPmkStatusCountMap);
        }
    } catch (e) {
        console.error("pmk status error", e);
    }
    displayPmkStatusArea();
}

// Pmk 목록에서 vmStatus만 처리 : 화면표시는 display function에서
// vm 상태 표시
function setTotalClusterStatus() {
    try {
        for (var pmkIndex in totalPmkListObj) {
            var aPmk = totalPmkListObj[pmkIndex];
            var vmStatusCountMap = webconsolejs["common/api/services/pmk_api"].calculateVmStatusCount(aPmk);
            totalVmStatusMap.set(aPmk.id, vmStatusCountMap);
        }
    } catch (e) {
    }
    // displayVmStatusArea();
}

// pmk status display
function displayPmkStatusArea() {
    var sumPmkCnt = 0;
    var sumPmkRunningCnt = 0;
    var sumPmkStopCnt = 0;
    var sumPmkTerminateCnt = 0;
    totalPmkStatusMap.forEach((value, key) => {
        var statusRunning = value.get("running");
        var statusStop = value.get("stop");
        var statusTerminate = value.get("terminate");
        sumPmkRunningCnt += statusRunning;
        sumPmkStopCnt += statusStop;
        sumPmkTerminateCnt += statusTerminate;
    });
    sumPmkCnt = sumPmkRunningCnt + sumPmkStopCnt + sumPmkTerminateCnt;

    $("#total_pmk").text(sumPmkCnt);
    $("#pmk_status_running").text(sumPmkRunningCnt);
    $("#pmk_status_stopped").text(sumPmkStopCnt);
    $("#pmk_status_terminated").text(sumPmkTerminateCnt);
}

////////////////////////////////////////////////////// TABULATOR Start //////////////////////////////////////////////////////
// tabulator 행, 열, 기본값 설정
// table이 n개 가능하므로 개별 tabulator 정의 : 원리 util 안에 setTabulator있음.
function setPmkTabulator(
    tableObjId,
    tableObjParamMap,
    columnsParams,
    isMultiSelect
) {
    var placeholder = "No Data";
    var pagination = "local";
    var paginationSize = 5;
    var paginationSizeSelector = [5, 10, 15, 20];
    var movableColumns = true;
    var columnHeaderVertAlign = "middle";
    var paginationCounter = "rows";
    var layout = "fitColumns";

    if (tableObjParamMap.hasOwnProperty("placeholder")) {
        placeholder = tableObjParamMap.placeholder;
    }

    if (tableObjParamMap.hasOwnProperty("pagination")) {
        pagination = tableObjParamMap.pagination;
    }

    if (tableObjParamMap.hasOwnProperty("paginationSize")) {
        paginationSize = tableObjParamMap.paginationSize;
    }

    if (tableObjParamMap.hasOwnProperty("paginationSizeSelector")) {
        paginationSizeSelector = tableObjParamMap.paginationSizeSelector;
    }

    if (tableObjParamMap.hasOwnProperty("movableColumns")) {
        movableColumns = tableObjParamMap.movableColumns;
    }

    if (tableObjParamMap.hasOwnProperty("columnHeaderVertAlign")) {
        columnHeaderVertAlign = tableObjParamMap.columnHeaderVertAlign;
    }

    if (tableObjParamMap.hasOwnProperty("paginationCounter")) {
        paginationCounter = tableObjParamMap.paginationCounter;
    }

    if (tableObjParamMap.hasOwnProperty("layout")) {
        layout = tableObjParamMap.layout;
    }

    var tabulatorTable = new Tabulator("#" + tableObjId, {
        placeholder,
        pagination,
        paginationSize,
        paginationSizeSelector,
        movableColumns,
        columnHeaderVertAlign,
        paginationCounter,
        layout,
        columns: columnsParams,
        selectableRows: isMultiSelect == false ? 1 : true,
    });

    return tabulatorTable;
}

// tabulator Table 초기값 설정
function initPmkTable() {

    var tableObjParams = {};

    var columns = [
        {
            formatter: "rowSelection",
            titleFormatter: "rowSelection",
            vertAlign: "middle",
            hozAlign: "center",
            headerHozAlign: "center",
            headerSort: false,
            width: 60,
        },
        {
            title: "Name",
            field: "name",
            vertAlign: "middle"
        },
        {
            title: "Id",
            field: "id",
            visible: false
        },
        {
            title: "Resource Type",
            field: "resourceType",
            visible: false
        },
        {
            title: "System Label",
            field: "systemLabel",
            visible: false
        },
        {
            title: "System Message",
            field: "systemMessage",
            visible: false
        },
        {
            title: "ProviderImg",
            field: "providerImg",
            formatter: providerFormatter,
            vertAlign: "middle",
            hozAlign: "center",
            headerSort: false,
        },
        {
            title: "Provider",
            field: "provider",
            formatter: providerFormatterString,
            visible: false
        },
        {
            title: "VPC",
            field: "vpc",
            vertAlign: "middle"
        },
        {
            title: "Subnet",
            field: "subnet",
            vertAlign: "middle"
        },
        {
            title: "Security Group",
            field: "securitygroup",
            vertAlign: "middle"
        },
        {
            title: "Version",
            field: "version",
            vertAlign: "middle",
            visible: false,
        },
        {
            title: "Node Group",
            field: "nodegroup",
            vertAlign: "middle",
            hozAlign: "center",
            maxWidth: 150,
        }
    ];

    //pmkListTable = webconsolejs["common/util"].setTabulator("pmklist-table", tableObjParams, columns);// TODO [common/util]에 정의되어 있는데 호출하면 에러남... why?
    pmkListTable = setPmkTabulator("pmklist-table", tableObjParams, columns, true);

    // 행 클릭 시
    pmkListTable.on("rowClick", function (e, row) {
        // vmid 초기화 for vmlifecycle
        // selectedClusterId = ""

        currentPmkId = row.getCell("id").getValue();
        // 표에서 선택된 PmkInfo 
        getSelectedPmkData()

        // Cluster Terminal 버튼 상태 업데이트
        updateClusterRemoteCmdButtonState();

    });

    //  선택된 여러개 row에 대해 처리
    pmkListTable.on("rowSelectionChanged", function (data, rows) {
        checked_array = data
        selectedPmkObj = data
    });
    // displayColumn(table);
}

// toggleSelectBox of table row
function toggleRowSelection(id) {
    // pmkListTable에서 데이터 찾기
    var row = pmkListTable.getRow(id);
    if (row) {
        row.select();
    } else {
    }
}

// 상태값을 table에서 표시하기 위해 감싸기
function statusFormatter(cell) {
    var pmkDispStatus = webconsolejs["common/api/services/pmk_api"].getPmkStatusFormatter(
        cell.getData().status
    ); // 화면 표시용 status
    var pmkStatusCell =
        '<img title="' +
        cell.getData().status +
        '" src="/assets/images/common/icon_' +
        pmkDispStatus +
        '.svg" class="icon" alt="">';

    return pmkStatusCell;
}

// provider를 table에서 표시하기 위해 감싸기
function providerFormatter(data) {
    var providerImg = data.getData().providerImg;

    var pmkProviderCell =
        '<img class="img-fluid" class="rounded" width="30" src="/assets/images/common/img_logo_' +
        (providerImg == "" ? "mcmp" : providerImg) +
        '.png" alt="' +
        providerImg +
        '"/>';

    return pmkProviderCell;
}

// provider를 string으로 추출
// table에서 provider 이름으로 필터링 하기 위해
function providerFormatterString(data) {

    var vmCloudConnectionMap = webconsolejs["common/api/services/pmk_api"].calculateConnectionCount(
        data.getData().vm
    );

    var pmkProviderCell = "";
    vmCloudConnectionMap.forEach((value, key) => {
        pmkProviderCell += key + ", "
    });

    // Remove the trailing comma and space
    if (pmkProviderCell.length > 0) {
        pmkProviderCell = pmkProviderCell.slice(0, -2);
    }

    return pmkProviderCell;
}

/////////////////////////Tabulator Filter start/////////////////////////
//Define variables for input elements
var fieldEl = document.getElementById("filter-field");
var typeEl = document.getElementById("filter-type");
var valueEl = document.getElementById("filter-value");

// table rovider filtering / equel 고정
function providerFilter(data) {

    // case type like, equal, not eual
    // equal only
    if (typeEl.value == "=") {
        var vmCloudConnectionMap = webconsolejs["common/api/services/pmk_api"].calculateConnectionCount(
            data.vm
        );
        var valueElValue = valueEl.value;
        if (valueElValue != "") {
            if (vmCloudConnectionMap.has(valueElValue)) {
                return true;
            } else {
                return false;
            }
        }

    } else {
        return true;
    }

    return true
}

// Trigger setFilter function with correct parameters
function updateFilter() {
    var filterVal = fieldEl.options[fieldEl.selectedIndex].value;
    var typeVal = typeEl.options[typeEl.selectedIndex].value;

    var filter = filterVal == "provider" ? providerFilter : filterVal;

    if (filterVal == "provider") {
        typeEl.value = "=";
        typeEl.disabled = true;
    } else {
        typeEl.disabled = false;
    }

    if (filterVal) {
        table.setFilter(filter, typeVal, valueEl.value);
    }
}

// Update filters on value change
document.getElementById("filter-field").addEventListener("change", updateFilter);
document.getElementById("filter-type").addEventListener("change", updateFilter);
document.getElementById("filter-value").addEventListener("keyup", updateFilter);

// Clear filters on "Clear Filters" button click
document.getElementById("filter-clear").addEventListener("click", function () {
    fieldEl.value = "";
    typeEl.value = "=";
    valueEl.value = "";

    table.clearFilter();

});
/////////////////////////Tabulator Filter END/////////////////////////

////////////////////////////////////////////////////// END TABULATOR ///////////////////////////////////////////////////

// Expert Creation 토글 함수
export function toggleExpertCreation() {
    const newFormDynamic = document.getElementById("createcluster");
    const originalForm = document.getElementById("createcluster-original");
    const expertBtn = document.querySelector('button[onclick*="toggleExpertCreation"]');

    if (originalForm.style.display === "none") {
        // Expert Creation 모드 활성화
        newFormDynamic.style.display = "none";
        originalForm.style.display = "block";

        // 버튼 상태 변경
        if (expertBtn) {
            expertBtn.classList.add("btn-primary");
            expertBtn.classList.remove("btn-outline-primary");
            expertBtn.textContent = "Simple Creation";
        }
    } else {
        // Simple Creation 모드로 복귀
        newFormDynamic.style.display = "block";
        originalForm.style.display = "none";

        // 버튼 상태 변경
        if (expertBtn) {
            expertBtn.classList.remove("btn-primary");
            expertBtn.classList.add("btn-outline-primary");
            expertBtn.textContent = "Expert Creation";
        }
    }
}

// 새로운 Dynamic 폼 초기화 함수
export async function initFormDynamic() {
    // Dynamic 폼용 데이터 직접 로드
    await loadFormDynamicData();

    // Dynamic 폼용 필터 이벤트 리스너 추가
    setupFormDynamicFiltering();

    // Desired Node Size +/- 버튼 이벤트 리스너 추가
    setupDesiredNodeSizeButtons();
}

// Dynamic 폼용 데이터 직접 로드
async function loadFormDynamicData() {
    try {
        // Provider 목록 로드
        const providerList = await webconsolejs["common/api/services/pmk_api"].getProviderList();
        if (providerList && Array.isArray(providerList)) {
            const sortedProviders = providerList.map(str => str.toUpperCase()).sort();

            let html = '<option value="">Select Provider</option>';
            sortedProviders.forEach(item => {
                html += `<option value="${item}">${item}</option>`;
            });

            $("#cluster_provider_dynamic").empty().append(html);
        }

        // Region 목록 로드
        const regionList = await webconsolejs["common/api/services/pmk_api"].getRegionList();
        if (regionList && Array.isArray(regionList)) {
            let html = '<option value="">Select Region</option>';
            regionList.forEach(region => {
                const providerName = region.ProviderName || '';
                const regionName = region.RegionName || '';
                const displayName = `[${providerName}] ${regionName}`;
                html += `<option value="${displayName}">${displayName}</option>`;
            });

            $("#cluster_region_dynamic").empty().append(html);
        }

        // Cloud Connection 목록 로드
        const cloudConnection = await webconsolejs["common/api/services/pmk_api"].getCloudConnection();
        if (cloudConnection && Array.isArray(cloudConnection)) {
            const connectionNames = cloudConnection.map(item => item.configName).sort();

            let html = '<option value="">Select Connection</option>';
            connectionNames.forEach(item => {
                html += `<option value="${item}">${item}</option>`;
            });

            $("#cluster_cloudconnection_dynamic").empty().append(html);
        }

    } catch (error) {
        console.error("Failed to load dynamic form data:", error);
    }
}

// Dynamic 폼용 필터링 설정
function setupFormDynamicFiltering() {
    const providerSelectDynamic = document.getElementById('cluster_provider_dynamic');
    const regionSelectDynamic = document.getElementById('cluster_region_dynamic');
    const connectionSelectDynamic = document.getElementById('cluster_cloudconnection_dynamic');

    if (providerSelectDynamic) {
        providerSelectDynamic.addEventListener('change', updateFormDynamicConfigurationFiltering);
    }
    if (regionSelectDynamic) {
        regionSelectDynamic.addEventListener('change', updateFormDynamicConfigurationFiltering);
    }
}

// B 폼용 필터링 업데이트 함수
async function updateFormDynamicConfigurationFiltering() {
    const selectedProvider = document.getElementById('cluster_provider_dynamic').value;
    const selectedRegion = document.getElementById('cluster_region_dynamic').value;

    // 초기화했을 시
    if (selectedProvider === "") {
        // Dynamic 폼의 전체 데이터를 다시 로드
        await loadFormDynamicData();
        // NodeGroup 폼 숨기기
        hideNodeGroupFormDynamic();
        return;
    }

    // provider 선택시 region, connection filtering
    if (selectedProvider !== "" && selectedRegion === "") {
        try {
            // Region 필터링 - 선택된 Provider의 Region만 표시
            const regionList = await webconsolejs["common/api/services/pmk_api"].getRegionList();
            if (regionList && Array.isArray(regionList)) {
                const filteredRegions = regionList.filter(region =>
                    region.ProviderName && region.ProviderName.toUpperCase() === selectedProvider
                );

                let html = '<option value="">Select Region</option>';
                filteredRegions.forEach(region => {
                    const providerName = region.ProviderName || '';
                    const regionName = region.RegionName || '';
                    const displayName = `[${providerName}] ${regionName}`;
                    html += `<option value="${displayName}">${displayName}</option>`;
                });

                $("#cluster_region_dynamic").empty().append(html);
            }

            // Connection 필터링 - 선택된 Provider의 Connection만 표시
            const cloudConnection = await webconsolejs["common/api/services/pmk_api"].getCloudConnection();
            if (cloudConnection && Array.isArray(cloudConnection)) {
                const lowerSelectedProvider = selectedProvider.toLowerCase();
                const filteredConnections = cloudConnection.filter(connection =>
                    connection.configName && connection.configName.toLowerCase().startsWith(lowerSelectedProvider)
                );

                let html = '<option value="">Select Connection</option>';
                filteredConnections.forEach(connection => {
                    html += `<option value="${connection.configName}">${connection.configName}</option>`;
                });

                $("#cluster_cloudconnection_dynamic").empty().append(html);
            }

            // NodeGroup 폼 표시/숨김 처리
            onProviderChangeDynamic(selectedProvider);
        } catch (error) {
            console.error("Failed to filter dynamic form:", error);
        }
    }

    // region 선택시 connection filtering
    if (selectedRegion !== "") {
        try {
            const cspRegex = /^\[(.*?)\]/;
            const cspMatch = selectedRegion.match(cspRegex);
            const provider = cspMatch ? cspMatch[1] : null;

            // Region 이름 추출 (예: "[AWS] us-east-1" → "us-east-1")
            const regionName = selectedRegion.replace(cspRegex, '').trim();

            if (provider && regionName) {
                const cloudConnection = await webconsolejs["common/api/services/pmk_api"].getCloudConnection();
                if (cloudConnection && Array.isArray(cloudConnection)) {
                    // Provider + Region으로 정확한 Connection 필터링
                    const filteredConnections = cloudConnection.filter(connection => {
                        // "provider-region" 또는 "provider-region-zone" 형태와 매칭
                        return connection.configName && connection.configName.startsWith(regionName);
                    });

                    let html = '<option value="">Select Connection</option>';
                    filteredConnections.forEach(connection => {
                        html += `<option value="${connection.configName}">${connection.configName}</option>`;
                    });

                    $("#cluster_cloudconnection_dynamic").empty().append(html);
                }
            }
        } catch (error) {
            console.error("Failed to filter dynamic form region:", error);
        }
    }
}



// 폼 Dynamic 용 Cloud Connection 변경 이벤트
export async function changeCloudConnectionDynamic(connectionName) {
    // 동적 생성에서는 VPC, Subnet, Security Group 선택이 필요 없음
    // Cloud Connection만 설정하고 추가 API 호출 없이 처리
    if (!connectionName) {
        return;
    }
}

// Dynamic 폼용 Provider 변경 이벤트
export function onProviderChangeDynamic(providerValue) {
    // Azure, GCP, IBM, NHN 중 하나가 선택되었는지 확인
    const supportedProviders = ['azure', 'gcp', 'ibm', 'nhn'];
    const selectedProvider = providerValue.toLowerCase();

    if (supportedProviders.includes(selectedProvider)) {
        // 지원되는 CSP가 선택된 경우 NodeGroup 구성 폼 표시
        showNodeGroupFormDynamic();
    } else {
        // 지원되지 않는 CSP이거나 선택되지 않은 경우 NodeGroup 구성 폼 숨기기
        hideNodeGroupFormDynamic();
    }
}

// Dynamic 폼용 NodeGroup 폼 표시
export function showNodeGroupFormDynamic() {
    // NodeGroup 구성 폼 표시 (애니메이션 효과)
    $("#nodegroup_configuration_dynamic").removeClass('hide').addClass('show').show();

    // Create Cluster 카드의 Deploy 버튼 숨기기
    $("#createcluster .card-footer").hide();
}

// B폼용 NodeGroup 폼 숨기기
export function hideNodeGroupFormDynamic() {
    // NodeGroup 구성 폼 숨기기 (애니메이션 효과)
    $("#nodegroup_configuration_dynamic").removeClass('show').addClass('hide').hide();

    // Create Cluster 카드의 Deploy 버튼 표시
    $("#createcluster .card-footer").show();
}

// 폼 Dynamic 용 Deploy 함수
export async function deployPmkDynamic() {
    // 기본 클러스터 정보 수집
    const clusterData = {
        name: $("#cluster_name_dynamic").val(),
        description: $("#cluster_desc_dynamic").val(),
        provider: $("#cluster_provider_dynamic").val(),
        region: $("#cluster_region_dynamic").val(),
        connection: $("#cluster_cloudconnection_dynamic").val()
    };

    // 필수 필드 검증
    if (!clusterData.name || !clusterData.provider || !clusterData.region || !clusterData.connection) {
        alert("please fill in all required fields");
        return;
    }

    // NodeGroup Configuration 폼이 표시되어 있는지 확인
    const nodeGroupForm = document.getElementById("nodegroup_configuration_dynamic");
    const isNodeGroupVisible = nodeGroupForm && nodeGroupForm.style.display !== "none";

    try {
        // 사전 검증을 위한 commonSpec 결정
        let commonSpec = "";
        let commonImage = "";

        if (isNodeGroupVisible) {
            // NodeGroup이 있는 경우: 선택된 spec 사용
            commonSpec = $("#nodegroup_commonSpecId_dynamic").val();
            commonImage = $("#nodegroup_image_dynamic").val();
            if (!commonSpec) {
                alert("please select NodeGroup spec");
                return;
            }
        } else {
            // NodeGroup이 없는 경우: CSP별 하드코딩된 값 사용
            const selectedProvider = clusterData.provider.toLowerCase();

            switch (selectedProvider) {
                case 'aws':
                    commonSpec = "aws+ap-northeast-2+t3a.xlarge";
                    commonImage = "default";
                    break;
                case 'alibaba':
                    commonSpec = "alibaba+ap-northeast-2+ecs.g6e.xlarge";
                    commonImage = "alibaba+ubuntu_22_04_arm64_20g_alibase_20250625.vhd";
                    break;
                case 'azure':
                    commonSpec = "azure+koreacentral+standard_b4ms";
                    commonImage = "default";
                    break;
                case 'nhn':
                    commonSpec = "nhncloud+kr1+m2.c4m8";
                    commonImage = "nhncloud+kr1+ubuntu20.04container";
                    break;
                default:
                    // 기타 CSP는 빈값으로 설정
                    commonSpec = "";
                    commonImage = "";
                    break;
            }
        }

        // 사전 검증 API 호출
        const checkResult = await webconsolejs["common/api/services/pmk_api"].checkK8sClusterDynamic(
            selectedWorkspaceProject.nsId,
            commonSpec
        );

        if (!checkResult || checkResult.status !== 200) {
            alert("failed to pre-validate. please check the settings");
            return;
        }

        // 실제 클러스터 생성 데이터 준비
        let createData;

        // Azure provider인 경우 테스트용 하드코딩된 값 사용
        if (clusterData.provider.toLowerCase() === 'azure') {
            createData = {
                imageId: "default",
                specId: "azure+koreacentral+standard_b4ms",
                name: clusterData.name, // 폼에서 입력한 값 사용
                nodeGroupName: isNodeGroupVisible ? $("#nodegroup_name_dynamic").val() : "k8sng01" // 폼에서 입력한 값이 있으면 사용, 없으면 기본값
            };
        } else {
            // 다른 provider는 기존 로직 사용
            createData = {
                imageId: commonImage,
                specId: commonSpec,
                connectionName: clusterData.connection,
                name: clusterData.name,
                nodeGroupName: isNodeGroupVisible ? $("#nodegroup_name_dynamic").val() : ""
            };
        }

        // commonImage가 없으면 "default"로 설정
        if (!createData.commonImage || createData.commonImage === "") {
            createData.commonImage = "default";
        }

        // NodeGroup이 있는 경우 추가 정보 설정
        if (isNodeGroupVisible) {
            // NodeGroup 필수 필드 검증
            if (!createData.nodeGroupName) {
                alert("please input NodeGroup name");
                return;
            }
        }

        // 동적 클러스터 생성 API 호출
        const result = await webconsolejs["common/api/services/pmk_api"].createK8sClusterDynamic(
            selectedWorkspaceProject.nsId,
            createData
        );

        if (result && result.status === 200) {
            alert("Cluster created successfully");

            // 폼 초기화
            $("#cluster_name_dynamic").val("");
            $("#cluster_desc_dynamic").val("");
            $("#cluster_provider_dynamic").val("");
            $("#cluster_region_dynamic").val("");
            $("#cluster_cloudconnection_dynamic").val("");

            // NodeGroup 폼이 표시되어 있었다면 초기화
            if (isNodeGroupVisible) {
                $("#nodegroup_name_dynamic").val("");
                $("#nodegroup_spec_dynamic").val("");
                $("#nodegroup_provider_dynamic").val("");
                $("#nodegroup_connectionName_dynamic").val("");
                $("#nodegroup_commonSpecId_dynamic").val("");
                $("#nodegroup_image_dynamic").val("");
                $("#nodegroup_minnodesize_dynamic").val("");
                $("#nodegroup_maxnodesize_dynamic").val("");
                $("#nodegroup_autoscaling_dynamic").val("");
                $("#nodegroup_rootdisk_dynamic").val("");
                $("#nodegroup_rootdisksize_dynamic").val("");
                $("#nodegroup_desirednodesize_dynamic").val("1");

                // NodeGroup 폼 숨기기
                hideNodeGroupFormDynamic();
            }

            // Create Cluster 카드의 Deploy 버튼 표시
            $("#createcluster .card-footer").show();

            // PMK 목록 새로고침
            await refreshPmkList();

            // 클러스터 생성 폼 섹션을 닫기 (NodeGroup이 표시되어 있든 없든 항상 실행)
            const createClusterSection = document.querySelector('#createcluster');
            if (createClusterSection && createClusterSection.classList.contains('active')) {
                webconsolejs["partials/layout/navigatePages"].toggleElement(createClusterSection);
            }

        } else {
            alert("failed to create cluster");
        }
    } catch (error) {
        console.error("failed to create cluster:", error);
        alert("failed to create cluster");
    }
}

// PMK용 Spec 추천 모달 관련 함수들
export function showRecommendSpecSettingPmk(value) {
    if (value === "seoul") {
        $("#latitude-pmk").val("37.532600");
        $("#longitude-pmk").val("127.024612");
    } else if (value === "london") {
        $("#latitude-pmk").val("51.509865");
        $("#longitude-pmk").val("-0.118092");
    } else if (value === "newyork") {
        $("#latitude-pmk").val("40.730610");
        $("#longitude-pmk").val("-73.935242");
    } else {
        $("#latitude-pmk").val("");
        $("#longitude-pmk").val("");
    }
}

// PMK용 recommened Vm 조회 - 새로운 파일 사용
export async function getRecommendVmInfoPmk() {
    try {
        // 새로운 PMK용 Spec 추천 함수 호출
        if (webconsolejs["partials/operation/manage/pmk_serverrecommendation"]) {
            await webconsolejs["partials/operation/manage/pmk_serverrecommendation"].getRecommendVmInfoPmk();
        } else {
            console.error("PMK Server recommendation module not found");
            alert("PMK Server recommendation module not found");
        }
    } catch (error) {
        console.error("failed to recommend PMK spec:", error);
        alert("failed to recommend PMK spec");
    }
}

// PMK용 Spec 테이블 전역 변수
var pmkSpecTable = null;
var pmkRecommendSpecs = [];
var pmkRecommendVmSpecListObj = []; // PMK용 추천 VM Spec 목록 저장

// PMK용 Spec 모달 이벤트 리스너 설정
function setupPmkSpecModalEvents() {
    // Bootstrap 5 방식
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        var specModal = document.getElementById('spec-search-pmk');
        if (specModal) {
            specModal.addEventListener('shown.bs.modal', function () {
                // 모달이 열렸을 때의 처리
            });
        } else {
            console.error("spec-search-pmk modal element not found");
        }
    } else {
        console.warn("Bootstrap 5 not found");
    }

    // jQuery 방식 (fallback)
    if (typeof $ !== 'undefined' && $.fn.modal) {
        $("#spec-search-pmk").on('shown.bs.modal', function () {
            // 모달이 열렸을 때의 처리
        });
    } else {
        console.warn("jQuery modal not found");
    }

    // 직접 DOM 이벤트 방식 (추가 fallback)
    var specModalEl = document.getElementById('spec-search-pmk');
    if (specModalEl) {
        specModalEl.addEventListener('shown.bs.modal', function () {
            // 모달이 열렸을 때의 처리
        });
    }
}

// PMK용 Spec 테이블 초기화 - pmk_serverrecommendation.js에서 처리하므로 제거
// function initPmkSpecTable() { ... } - 중복 제거

// PMK용 선택된 행 업데이트 - pmk_serverrecommendation.js에서 처리하므로 제거  
// function updatePmkSelectedRows(data) { ... } - 중복 제거

// PMK용 Spec 정보 적용 - pmk_serverrecommendation.js에서 처리하므로 제거
// export function applyPmkSpecInfo() { ... } - 중복 제거

// PMK용 Image 모달 검증 및 열기
export function validateAndOpenImageModalPmk(event) {

    // 스펙 입력 필드 값 확인 (MCI와 동일한 검증 로직)
    var specValue = $("#nodegroup_spec_dynamic").val();

    if (!specValue || specValue.trim() === "") {
        console.warn("No PMK spec selected - validation failed");
        alert("Please select a server specification first before opening the image recommendation modal.");
        // 이벤트 전파 중단 및 기본 동작 방지
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        return false;
    }

    // 전역 변수에서 spec 정보 확인 (MCI와 동일한 검증 로직)
    if (!window.selectedPmkSpecInfo) {
        console.warn("No PMK spec info in global variable - validation failed");
        alert("Please select a server specification first before opening the image recommendation modal.");
        // 이벤트 전파 중단 및 기본 동작 방지
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        return false;
    }

    // 이벤트 전파 중단 및 기본 동작 방지 (모달 열기 전에 먼저 실행)
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    try {
        // PMK용 이미지 선택 콜백 함수 설정
        if (webconsolejs["partials/operation/manage/pmk_imagerecommendation"]) {
            webconsolejs["partials/operation/manage/pmk_imagerecommendation"].setImageSelectionCallbackPmk(function (selectedImage) {
                // PMK 폼의 이미지 필드에 설정
                $("#nodegroup_image_dynamic").val(selectedImage.name || selectedImage.cspImageName || "");
            });
        } else {
            console.error("PMK Image recommendation module not found.");
        }

    // 비동기적으로 모달 열기 (MCI와 동일한 패턴)
    setTimeout(function () {
        try {
            // Spec Information 필드 채우기 (모달 열기 전)
            if (window.selectedPmkSpecInfo) {
                $("#image-provider-pmk").val(window.selectedPmkSpecInfo.provider || "");
                $("#image-region-pmk").val(window.selectedPmkSpecInfo.regionName || "");
                $("#image-os-architecture-pmk").val(window.selectedPmkSpecInfo.osArchitecture || "");
            }
            
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
                alert("could not open modal because Bootstrap is not loaded");
            }
        } catch (error) {
            console.error("failed to open PMK image modal:", error);
            alert("Error opening PMK image recommendation modal. Please try again.");
        }
    }, 100); // 100ms 지연으로 이벤트 처리 완료 후 모달 열기

    } catch (error) {
        console.error("failed to open PMK image modal:", error);
        alert("failed to open PMK image modal");
    }


    return true;
}

// Desired Node Size +/- 버튼 이벤트 리스너 설정
function setupDesiredNodeSizeButtons() {
    // 기존 이벤트 핸들러 제거
    $(document).off('click', '#nodegroup_configuration_dynamic .input-number-decrement');
    $(document).off('click', '#nodegroup_configuration_dynamic .input-number-increment');

    // 새로운 이벤트 핸들러 등록
    $(document).on('click', '#nodegroup_configuration_dynamic .input-number-decrement', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const input = $(this).siblings('.input-number');
        const currentValue = parseInt(input.val()) || 1;
        const minValue = parseInt(input.attr('min')) || 1;

        if (currentValue > minValue) {
            input.val(currentValue - 1);
        }
    });

    $(document).on('click', '#nodegroup_configuration_dynamic .input-number-increment', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const input = $(this).siblings('.input-number');
        const currentValue = parseInt(input.val()) || 1;

        // maxValue 제한 제거
        input.val(currentValue + 1);
    });
}

// PMK용 Provider 필터링 기능 - 새로운 파일 사용
export function filterByProviderPmk(provider) {
    try {
        // 새로운 PMK용 Provider 필터링 함수 호출
        if (webconsolejs["partials/operation/manage/pmk_serverrecommendation"]) {
            webconsolejs["partials/operation/manage/pmk_serverrecommendation"].filterByProviderPmk(provider);
        } else {
            console.error("PMK Server recommendation module not found");
        }
    } catch (error) {
        console.error("Failed to filter PMK provider:", error);
    }
}

// PMK용 Server Recommendation 콜백 함수 (MCI 패턴과 동일)
export async function callbackPmkServerRecommendation(vmSpec) {
    // PMK Server Recommendation 콜백 함수

    // PMK NodeGroup 폼의 필드들에 spec 정보 설정
    $("#nodegroup_provider_dynamic").val(vmSpec.provider);
    $("#nodegroup_connectionName_dynamic").val(vmSpec.connectionName);
    $("#nodegroup_spec_dynamic").val(vmSpec.specName);
    $("#nodegroup_commonSpecId_dynamic").val(vmSpec.commonSpecId);

    // spec 정보를 전역 변수에 저장 (이미지 선택 시 사용)
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

// 전역 객체에 PMK 함수들 등록
if (typeof webconsolejs === 'undefined') {
    webconsolejs = {};
}

if (typeof webconsolejs['pages/operation/manage/pmk'] === 'undefined') {
    webconsolejs['pages/operation/manage/pmk'] = {};
}

// PMK 관련 함수들 등록
webconsolejs['pages/operation/manage/pmk'].initPmk = initPmk;
webconsolejs['pages/operation/manage/pmk'].refreshPmkList = refreshPmkList;
webconsolejs['pages/operation/manage/pmk'].getSelectedPmkData = getSelectedPmkData;
webconsolejs['pages/operation/manage/pmk'].deletePmk = deletePmk;
webconsolejs['pages/operation/manage/pmk'].deleteNodeGroup = deleteNodeGroup;
webconsolejs['pages/operation/manage/pmk'].changePmkLifeCycle = changePmkLifeCycle;
webconsolejs['pages/operation/manage/pmk'].toggleNodeCheck = toggleNodeCheck;
webconsolejs['pages/operation/manage/pmk'].handleNodeCheck = handleNodeCheck;
webconsolejs['pages/operation/manage/pmk'].nodeGroupDetailInfo = nodeGroupDetailInfo;
webconsolejs['pages/operation/manage/pmk'].toggleExpertCreation = toggleExpertCreation;
webconsolejs['pages/operation/manage/pmk'].initFormDynamic = initFormDynamic;
webconsolejs['pages/operation/manage/pmk'].changeCloudConnectionDynamic = changeCloudConnectionDynamic;
webconsolejs['pages/operation/manage/pmk'].onProviderChangeDynamic = onProviderChangeDynamic;
webconsolejs['pages/operation/manage/pmk'].showNodeGroupFormDynamic = showNodeGroupFormDynamic;
webconsolejs['pages/operation/manage/pmk'].hideNodeGroupFormDynamic = hideNodeGroupFormDynamic;
webconsolejs['pages/operation/manage/pmk'].deployPmkDynamic = deployPmkDynamic;
webconsolejs['pages/operation/manage/pmk'].showRecommendSpecSettingPmk = showRecommendSpecSettingPmk;
webconsolejs['pages/operation/manage/pmk'].getRecommendVmInfoPmk = getRecommendVmInfoPmk;
// webconsolejs['pages/operation/manage/pmk'].applyPmkSpecInfo = applyPmkSpecInfo; // 중복 제거 - pmk_serverrecommendation.js에서 처리
webconsolejs['pages/operation/manage/pmk'].validateAndOpenImageModalPmk = validateAndOpenImageModalPmk;
webconsolejs['pages/operation/manage/pmk'].setupPmkSpecModalEvents = setupPmkSpecModalEvents; // PMK Spec 모달 이벤트 리스너 등록
webconsolejs['pages/operation/manage/pmk'].filterByProviderPmk = filterByProviderPmk; // PMK용 Provider 필터링 함수 등록
webconsolejs['pages/operation/manage/pmk'].callbackPmkServerRecommendation = callbackPmkServerRecommendation; // PMK용 Server Recommendation 콜백 함수 등록

// 페이지 로드 시 초기화 (중복 방지)
let pmkInitialized = false;
document.addEventListener("DOMContentLoaded", function () {
    if (pmkInitialized) {
        return;
    }

    // 기존 Add cluster 버튼 제거 (중복 방지)
    const existingButtons = $("#page-header-btn-list").find('a[href="#createcluster"]');
    existingButtons.remove();

    // PMK 초기화
    initPmk();

    // Desired Node Size 버튼 설정
    setupDesiredNodeSizeButtons();

    // PMK용 모달 초기화
    // PMK용 Spec 추천 모달 초기화
    if (webconsolejs["partials/operation/manage/pmk_serverrecommendation"]) {
        webconsolejs["partials/operation/manage/pmk_serverrecommendation"].initServerRecommendationPmk(webconsolejs["pages/operation/manage/pmk"].callbackPmkServerRecommendation);
    } else {
        console.error("PMK Server recommendation module not found");
    }

    // PMK용 이미지 추천 모달 초기화
    if (webconsolejs["partials/operation/manage/pmk_imagerecommendation"]) {
        webconsolejs["partials/operation/manage/pmk_imagerecommendation"].initImageModalPmk();
    } else {
        console.error("PMK Image recommendation module not found");
    }

    pmkInitialized = true;
});

// Cluster Terminal 모달 표시 함수
export function showClusterTerminalModal() {
    // 현재 선택된 Cluster가 있는지 확인
    if (!currentPmkId) {
        alert("Please select a Cluster first.");
        return;
    }

    // 입력 필드 초기화
    const namespaceInput = document.getElementById('modalNamespace');
    const podNameInput = document.getElementById('modalPodName');

    if (namespaceInput) {
        namespaceInput.value = '';
    }
    if (podNameInput) {
        podNameInput.value = '';
    }

    // 모달 표시
    const modalElement = document.getElementById('clusterTerminalModal');
    if (modalElement) {
        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();
    } else {
        alert("Terminal modal not found");
    }
}

// Cluster Terminal 연결 함수
export async function connectToClusterTerminal() {
    const nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject().NsId

    // 현재 선택된 Cluster가 있는지 확인
    if (!currentPmkId) {
        alert("Please select a Cluster first.");
        return;
    }

    // 모달에서 값 가져오기
    const namespaceInput = document.getElementById('modalNamespace');
    const podNameInput = document.getElementById('modalPodName');

    const userNamespace = namespaceInput ? namespaceInput.value.trim() : '';
    const userPodName = podNameInput ? podNameInput.value.trim() : '';

    // 사용자가 입력한 값이 있으면 사용, 없으면 기본값 사용
    const namespace = userNamespace || 'default';
    const podName = userPodName || 'cluster-pod';

    try {
        // 클러스터 데이터에서 실제 정보 가져오기
        const clusterData = selectedClusterData || totalPmkListObj.find(cluster => cluster.id === currentPmkId);

        if (!clusterData) {
            alert("Cluster data not found.");
            return;
        }

        // 연결 모달 닫기
        const terminalModal = document.getElementById('clusterTerminalModal');
        if (terminalModal) {
            const modalInstance = bootstrap.Modal.getInstance(terminalModal);
            if (modalInstance) {
                modalInstance.hide();
            }
        }

        await webconsolejs["partials/operation/manage/remotecmd"].initClusterTerminal(
            'cluster-xterm-container',
            nsId,
            currentPmkId,
            namespace,
            podName,
            null // containerName은 선택사항
        );

        const modalElement = document.getElementById('cluster-cmdtestmodal');
        if (modalElement) {
            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();
        } else {
            alert("Terminal modal element not found");
        }
    } catch (error) {
        alert("Error initializing terminal: " + error.message);
    }
}

// Cluster Terminal 버튼 상태 업데이트
function updateClusterRemoteCmdButtonState() {
    const clusterRemoteCmdBtn = document.querySelector('a[onclick*="showClusterTerminalModal"]');

    if (clusterRemoteCmdBtn) {
        if (currentPmkId) {
            clusterRemoteCmdBtn.classList.remove('disabled');
            clusterRemoteCmdBtn.style.pointerEvents = 'auto';
            clusterRemoteCmdBtn.title = 'Connect to selected Cluster';
        } else {
            clusterRemoteCmdBtn.classList.add('disabled');
            clusterRemoteCmdBtn.style.pointerEvents = 'none';
            clusterRemoteCmdBtn.title = 'Please select a Cluster first';
        }
    }
}