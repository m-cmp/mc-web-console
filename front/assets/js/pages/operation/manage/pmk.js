import { TabulatorFull as Tabulator } from "tabulator-tables";

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
    console.log("select-current-project changed ")
    let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
    console.log("select-current-project on change ", project)
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
document.addEventListener("DOMContentLoaded", initPmk);

// 해당 화면에서 최초 설정하는 function
//로드 시 prj 값 받아와 getPmkList 호출
async function initPmk() {
    console.log("initPmk")
    ////////////////////// partials init functions///////////////////////////////////////
    try {
        webconsolejs["partials/operation/manage/clustercreate"].iniClusterkCreate();//PmkCreate을 Partial로 가지고 있음. 
        webconsolejs["partials/operation/manage/clustercreate"].addNewPmk();

    } catch (e) {
        console.log(e);
    }
    ////////////////////// partials init functions end ///////////////////////////////////////


    ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
    selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

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
    console.log("ppp ", params)
    console.log('before currentPmkId:', currentPmkId);

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

        console.log('currentPmkId:', currentPmkId);  // 출력: pmkID의 값 (예: com)
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

    // displayPmkDashboard();

}

function mappingTablePmkData(totalPmkListObj) {

    return totalPmkListObj.map(item => {
        const keyValueList = item.CspViewK8sClusterDetail.KeyValueList || [];
        const network = item.CspViewK8sClusterDetail.Network || {};
        const vpc = (network.VpcIID && network.VpcIID.SystemId) || "N/A";
        const subnet = (network.SubnetIIDs && network.SubnetIIDs[0] && network.SubnetIIDs[0].SystemId) || "N/A";
        const securityGroup = (network.SecurityGroupIIDs && network.SecurityGroupIIDs[0] && network.SecurityGroupIIDs[0].SystemId) || "N/A";
        const version = item.CspViewK8sClusterDetail.Version || "N/A";
        const nodeGroupCount = item.CspViewK8sClusterDetail?.NodeGroupList?.length || 0;
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
            console.log("resp status ", pmkResp.status)
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

    var selectedNsId = selectedWorkspaceProject.nsId;
    webconsolejs["common/api/services/pmk_api"].pmkDelete(selectedNsId, currentPmkId)
}

// nodegroup 삭제
export function deleteNodeGroup() {

    var selectedNsId = selectedWorkspaceProject.nsId;
    webconsolejs["common/api/services/pmk_api"].nodeGroupDelete(selectedNsId, currentPmkId, currentNodeGroupName)

}

// 클릭한 pmk의 info값 세팅
function setPmkInfoData(pmkData) {
    console.log("setPmkInfoData", pmkData);

    var clusterData = pmkData.responseData;
    var clusterDetailData = clusterData.CspViewK8sClusterDetail;
    var pmkNetwork = clusterDetailData.Network || {};
    console.log("pmkData.connectionConfig", pmkData.connectionConfig)
    var clusterProvider = clusterData.connectionConfig.providerName
    currentProvider = clusterProvider
    try {

        var pmkName = clusterData.name;
        var pmkID = clusterData.id
        var pmkVersion = clusterDetailData.Version;
        var pmkStatus = clusterDetailData.Status;

        // 네트워크 정보
        var pmkVpc = (pmkNetwork.VpcIID && pmkNetwork.VpcIID.SystemId) || "N/A";
        var pmkSubnet = (pmkNetwork.SubnetIIDs && pmkNetwork.SubnetIIDs[0] && pmkNetwork.SubnetIIDs[0].SystemId) || "N/A";
        var pmkSecurityGroup = (pmkNetwork.SecurityGroupIIDs && pmkNetwork.SecurityGroupIIDs[0] && pmkNetwork.SecurityGroupIIDs[0].SystemId) || "N/A";

        // 추가정보
        var pmkCloudConnection = clusterData.connectionName
        var pmkEndPoint = clusterDetailData.AccessInfo.Endpoint
        var pmkKubeConfig = clusterDetailData.AccessInfo.Kubeconfig // TODO: 너무 길어서 처리 질문

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
    var nodeGroupList = clusterDetailData.NodeGroupList

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
    console.log("displayNodeGroupStatusList", selectedClusterData);

    var nodeGroupList = clusterData.CspViewK8sClusterDetail.NodeGroupList;
    var pmkName = pmkID;
    var nodeLi = "";
    nodeGroupList.sort();

    nodeGroupList.forEach((aNodeGroup) => {
        var nodeID = aNodeGroup.IId.SystemId;
        var nodeName = aNodeGroup.IId.NameId;
        var nodeStatus = aNodeGroup.Status;
        console.log("nodeIDnodeIDnodeID", nodeID)

        if (clusterProvider === "azure") {
            var nodeIDParts = nodeID.split("/");
            nodeID = nodeIDParts[nodeIDParts.length - 1];
        }
        var nodeStatusClass = webconsolejs["common/api/services/pmk_api"].getVmStatusStyleClass(nodeStatus);

        nodeLi += `
        <li id="nodeGroup_status_icon_${nodeID}" 
            class="card ${nodeStatusClass} d-flex align-items-center" 
            style="display: flex; flex-direction: row; align-items: center; justify-content: center; padding: 5px;" 
            onclick="webconsolejs['pages/operation/manage/pmk'].toggleNodeCheck('${pmkID}', '${nodeID}')">
          
          <input type="checkbox" 
                 id="node_checkbox_${nodeID}" 
                 class="vm-checkbox" 
                 style="width: 20px; height: 20px; margin-right: 10px; flex-shrink: 0;" 
                 onchange="webconsolejs['pages/operation/manage/pmk'].handleNodeCheck('${pmkID}', '${nodeID}')">
          
          <span class="text-dark-fg">${nodeName}</span>
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
        console.log("lastSelectedNodeID", lastSelectedNodeID);

        // Azure인 경우 SystemId에서 마지막 부분 추출
        var nodeList = selectedClusterData.CspViewK8sClusterDetail.NodeGroupList.map(node => {
            var systemId = node.IId.SystemId;
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
        console.log("aNodeObject", aNodeObject);

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
    console.log("aNodeObjectaNodeObject", aNodeObject)
    var aNode = JSON.parse(aNodeObject);

    displayNodeStatusList(aNode)

    var ngName = aNode.IId.NameId
    currentNodeGroupName = ngName
    var ngImage = aNode.ImageIID.NameId
    var ngSpec = aNode.VMSpecName

    var ngKeyPair = aNode.KeyPairIID.NameId
    var ngDesiredNodeSize = aNode.DesiredNodeSize
    var ngMinNodeSize = aNode.MinNodeSize
    var ngMaxNodeSize = aNode.MaxNodeSize

    var ngAutoScaling = aNode.OnAutoScaling
    var ngRootDiskType = aNode.RootDiskType
    var ngRootDiskSize = aNode.RootDiskSize

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
    console.log("displayNodeStatusList", nodeData)
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
    console.log("clearServerInfo")

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
    console.log("setToTalPmkStatus");
    try {
        for (var pmkIndex in totalPmkListObj) {
            var aPmk = totalPmkListObj[pmkIndex];

            var aPmkStatusCountMap = webconsolejs["common/api/services/pmk_api"].calculatePmkStatusCount(aPmk);
            console.log("aPmk.id : ", aPmk.id);
            console.log("pmkStatusMap ::: ", aPmkStatusCountMap);
            totalPmkStatusMap.set(aPmk.id, aPmkStatusCountMap);
        }
    } catch (e) {
        console.log("pmk status error", e);
    }
    displayPmkStatusArea();
}

// Pmk 목록에서 vmStatus만 처리 : 화면표시는 display function에서
// vm 상태 표시
function setTotalClusterStatus() {
    console.log("setTotalClusterStatus")
    try {
        for (var pmkIndex in totalPmkListObj) {
            var aPmk = totalPmkListObj[pmkIndex];
            console.log("aPmk : ", aPmk);
            var vmStatusCountMap = webconsolejs["common/api/services/pmk_api"].calculateVmStatusCount(aPmk);
            totalVmStatusMap.set(aPmk.id, vmStatusCountMap);
        }
    } catch (e) {
        console.log("pmk status error");
    }
    // displayVmStatusArea();
}

// pmk status display
function displayPmkStatusArea() {
    console.log("displayPmkStatusArea");
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
        console.log("totalPmkStatusMap :: ", key, value);
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
        console.log("Row with ID " + id + " is selected.");
    } else {
        console.log("Row with ID " + id + " not found.");
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