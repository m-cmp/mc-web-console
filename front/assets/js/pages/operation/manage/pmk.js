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
// var totalCloudConnectionMap = new Map();
var selectedVmId = "";
var currentPmkId = "";

var pmkListTable;
var checked_array = [];
var selectedPmkID = ""
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
        webconsolejs["partials/operation/manage/pmkcreate"].initPmkCreate();//PmkCreate을 Partial로 가지고 있음. 
    } catch (e) {
        console.log(e);
    }
    ////////////////////// partials init functions end ///////////////////////////////////////


    ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
    selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

    // workspace selection check
    webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject)
    ////////////////////// set workspace list, project list at Navbar end //////////////////////////////////



    if (selectedWorkspaceProject.projectId != "") {
        console.log("workspaceProject ", selectedWorkspaceProject)
        var selectedProjectId = selectedWorkspaceProject.projectId;
        var selectedNsId = selectedWorkspaceProject.nsId;
        console.log('in initPmk selectedNsId:', selectedNsId);

        //getPmkList();// project가 선택되어 있으면 pmk목록을 조회한다.
        var respPmkList = await webconsolejs["common/api/services/pmk_api"].getClusterList(selectedNsId);
        getPmkListCallbackSuccess(selectedProjectId, respPmkList);


        ////////////////////// 받은 pmkId가 있으면 해당 pmkId를 set하고 조회한다. ////////////////
        // 외부(dashboard)에서 받아온 pmkID가 있으면 pmk INFO 이동
        // 현재 브라우저의 URL
        const url = window.location.href;
        const urlObj = new URL(url);
        // URLSearchParams 객체 생성
        const params = new URLSearchParams(urlObj.search);
        // pmkID 파라미터 값 추출
        selectedPmkID = params.get('pmkID');

        console.log('selectedPmkID:', selectedPmkID);  // 출력: pmkID의 값 (예: com)
        if (selectedPmkID != undefined) {
            toggleRowSelection(selectedPmkID)
            getSelectedPmkData(selectedPmkID)
        }
        ////////////////////  pmkId를 set하고 조회 완료. ////////////////
    }
}

// getPmkList 호출 성공 시
function getPmkListCallbackSuccess(caller, pmkList) {
    console.log("getPmkListCallbackSuccess");
    console.log("getPmkListCallbackSuccess", pmkList);

    totalPmkListObj = pmkList.K8sClusterInfo;
    console.log("total pmk : ", totalPmkListObj);

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

        return {
            name: item.name,
            id: item.id,
            resourceType: item.resourceType,
            systemLabel: item.systemLabel || "N/A",
            systemMessage: item.systemMessage || "N/A",
            // TODO : ima, provider api res 변경되면 수정
            providerImg: "",  // providerImg 값을 추가해야 함 (필요시)
            provider: item.connectionName || "N/A",
            vpc: vpc,
            subnet: subnet,
            securitygroup: securityGroup,
            statusCount: { countTotal: keyValueList.find(kv => kv.key === "size")?.value || 0 }
        };
    });
}


// 클릭한 pmk info 가져오기
// 표에서 선택된 PmkId 받아옴
async function getSelectedPmkData(pmkID) {

    console.log('selectedPmkID:', pmkID);  // 출력: pmkID의 값 (예: com)
    if (pmkID != undefined && pmkID != "") {
        var selectedNsId = selectedWorkspaceProject.nsId;
        currentPmkId = pmkID
        var pmkResp = await webconsolejs["common/api/services/pmk_api"].getCluster(selectedNsId, pmkID)
        console.log("pmkResp ", pmkResp)
        console.log("currentPmkId ", currentPmkId)
        console.log("pmkID ", pmkID)
        console.log("selectedNsId ", selectedNsId)
        if (pmkResp.status != 200) {
            console.log("resp status ", pmkResp.status)
            // failed.  // TODO : Error Popup 처리
            return;
        }
        // SET PMK Info page
        setPmkInfoData(pmkResp.data)

        // Toggle PMK Info
        var div = document.getElementById("cluster_info");
        console.log("pmkInfo ", div)
        webconsolejs["partials/layout/navigatePages"].toggleElement(div)
    }
}

// 클릭한 pmk의 info값 세팅
function setPmkInfoData(pmkData) {
    console.log("setPmkInfoData", pmkData);

    var clusterData = pmkData.responseData;
    var clusterDetailData = clusterData.CspViewK8sClusterDetail;
    var pmkNetwork = clusterDetailData.Network || {};

    try {

        var pmkName = clusterData.name;
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
    // TODO: nodegroup box (Node group 상태 등을 추가로 처리)
}

// pmk life cycle 변경
export function changePmkLifeCycle(type) {

    var selectedNsId = selectedWorkspaceProject.nsId;
    webconsolejs["common/api/services/pmk_api"].pmkLifeCycle(type, checked_array, selectedNsId)
}

// vm life cycle 변경
export function changeVmLifeCycle(type) {
    var selectedNsId = selectedWorkspaceProject.nsId;

    webconsolejs["common/api/services/pmk_api"].vmLifeCycle(type, currentPmkId, selectedNsId, selectedVmId)
}

// vm 상태별 icon으로 표시
// Server List / Status VM리스트
function displayServerStatusList(pmkID, vmList) {
    console.log("displayServerStatusList")
    console.log("displayServerStatusList", vmList)

    var pmkName = pmkID;
    var vmLi = "";
    vmList.sort();
    for (var vmIndex in vmList) {
        var aVm = vmList[vmIndex]

        var vmID = aVm.id;
        var vmName = aVm.name;
        var vmStatus = aVm.status;
        var vmDispStatus = webconsolejs["common/api/services/pmk_api"].getVmStatusFormatter(vmStatus); // vmStatus set
        var vmStatusClass = webconsolejs["common/api/services/pmk_api"].getVmStatusStyleClass(vmDispStatus) // vmStatus 별로 상태 색상 set

        vmLi += '<li id="server_status_icon_' + vmID + '" class="card ' + vmStatusClass + '" onclick="webconsolejs[\'pages/operation/manage/pmk\'].vmDetailInfo(\'' + pmkID + '\',\'' + pmkName + '\',\'' + vmID + '\')"><span class="text-dark-fg">' + vmName + '</span></li>';

    }// end of pmk loop

    $("#pmk_server_info_box").empty();
    $("#pmk_server_info_box").append(vmLi);
}

// Server List / Status VM 리스트에서
// VM 한 개 클릭시 vm의 세부 정보
export async function vmDetailInfo(pmkID, pmkName, vmID) {
    // Toggle PMK Info
    var div = document.getElementById("server_info");
    webconsolejs["partials/layout/navigatePages"].toggleElement(div)

    console.log("vmDetailInfo")
    console.log("pmkID : ", pmkID)
    console.log("pmkName : ", pmkName)
    console.log("vmID : ", vmID)

    clearServerInfo();

    var aPmk = new Object();
    for (var pmkIndex in totalPmkListObj) {
        var tempPmk = totalPmkListObj[pmkIndex]
        if (pmkID == tempPmk.id) {
            aPmk = tempPmk;
            break;
        }
    }// end of pmk loop
    console.log("aPmk", aPmk);
    var vmList = aPmk.vm;
    var vmExist = false
    var data = new Object();
    for (var vmIndex in vmList) {
        var aVm = vmList[vmIndex]
        if (vmID == aVm.id) {
            //aVm = vmData;
            data = aVm;
            vmExist = true
            console.log("aVm", aVm)
            break;
        }
    }
    if (!vmExist) {
        console.log("vm is not exist");
        console.log(vmList)
    }
    console.log("selected Vm");
    console.log("selected vm data : ", data);
    var vmId = data.id;
    selectedVmId = vmId
    var vmName = data.name;
    var vmStatus = data.status;
    var vmDescription = data.description;
    var vmPublicIp = data.publicIP == undefined ? "" : data.publicIP;
    console.log("vmPublicIp", vmPublicIp)
    var vmSshKeyID = data.sshKeyId;

    try {
        var imageId = data.imageId
        var operatingSystem = await webconsolejs["common/api/services/vmimage_api"].getCommonVmImageInfo(imageId)
        $("#server_info_os").text(operatingSystem)
    } catch (e) {
        console.log("e", e)
    }
    var startTime = data.cspViewVmDetail.StartTime
    var privateIp = data.privateIP
    var securityGroupID = data.securityGroupIds[0];
    var providerName = data.connectionConfig.providerName
    var vmProviderIcon = ""
    vmProviderIcon +=
        '<img class="img-fluid" class="rounded" width="80" src="/assets/images/common/img_logo_' +
        providerName +
        '.png" alt="' +
        providerName +
        '"/>';

    var vmDispStatus = webconsolejs["common/api/services/pmk_api"].getPmkStatusFormatter(vmStatus);
    var pmkStatusIcon = webconsolejs["common/api/services/pmk_api"].getPmkStatusIconFormatter(vmDispStatus);

    //vm info
    $("#pmk_server_info_status_img").attr("src", "/assets/images/common/" + pmkStatusIcon)
    $("#pmk_server_info_connection").empty()
    $("#pmk_server_info_connection").append(vmProviderIcon)


    $("#server_info_text").text(' [ ' + vmName + ' / ' + pmkName + ' ]')
    $("#server_info_name").text(vmName + "/" + vmID)
    $("#server_info_desc").text(vmDescription)

    $("#server_info_start_time").text(startTime)
    $("#server_info_private_ip").text(privateIp)
    $("#server_info_cspVMID").text(data.cspViewVmDetail.IId.NameId)

    // ip information
    $("#server_info_public_ip").text(vmPublicIp)
    $("#server_detail_info_public_ip_text").text("Public IP : " + vmPublicIp)
    $("#server_info_public_dns").text(data.publicDNS)
    // $("#server_info_private_ip").val(data.privateIP)
    $("#server_info_private_dns").text(data.privateDNS)

    $("#server_detail_view_public_ip").text(vmPublicIp)
    $("#server_detail_view_public_dns").text(data.publicDNS)
    $("#server_detail_view_private_ip").text(data.privateIP)
    $("#server_detail_view_private_dns").text(data.privateDNS)

    // detail tab
    $("#server_detail_info_text").text(' [' + vmName + '/' + pmkName + ']')
    $("#server_detail_view_server_id").text(vmId)
    $("#server_detail_view_server_status").text(vmStatus);
    $("#server_detail_view_public_dns").text(data.publicDNS)
    $("#server_detail_view_public_ip").text(vmPublicIp)
    $("#server_detail_view_private_ip").text(data.privateIP)
    $("#server_detail_view_security_group_text").text(securityGroupID)
    $("#server_detail_view_private_dns").text(data.privateDNS)
    $("#server_detail_view_private_ip").text(data.privateIP)
    $("#server_detail_view_image_id").text(imageId)
    $("#server_detail_view_os").text(operatingSystem);
    $("#server_detail_view_user_id_pass").text(data.vmUserAccount + "/ *** ")

    var region = data.region.Region

    var zone = data.region.Zone

    // connection tab
    var connectionName = data.connectionName
    var credentialName = data.connectionConfig.credentialName
    var driverName = data.connectionConfig.driverName
    var locationInfo = data.location;
    var cloudType = locationInfo.cloudType;

    $("#server_connection_view_connection_name").text(connectionName)
    $("#server_connection_view_credential_name").text(credentialName)
    $("#server_connection_view_csp").text(providerName)
    $("#server_connection_view_driver_name").text(driverName)
    $("#server_connection_view_region").text(providerName + " : " + region)
    $("#server_connection_view_zone").text(zone)

    // region zone locate
    $("#server_info_region").text(providerName + ":" + region)
    $("#server_info_zone").text(zone)


    $("#server_detail_view_region").text(providerName + " : " + region)
    $("#server_detail_view_zone").text(zone)

    // connection name
    var connectionName = data.connectionName;
    $("#server_info_connection_name").text(connectionName)

    var vmDetail = data.cspViewVmDetail;
    var vmDetailKeyValueList = vmDetail.KeyValueList
    var architecture = "";

    if (vmDetailKeyValueList) {
        for (var i = 0; i < vmDetailKeyValueList.length; i++) {
            if (vmDetailKeyValueList[i].key === "Architecture") {
                architecture = vmDetailKeyValueList[i].value;
                break; // 찾았으므로 반복문을 종료
            }
        }
    }
    var vmSpecName = vmDetail.VMSpecName
    var vpcId = vmDetail.VpcIID.NameId
    var vpcSystemId = vmDetail.VpcIID.SystemId
    var subnetId = vmDetail.SubnetIID.NameId
    var subnetSystemId = vmDetail.SubnetIID.SystemId
    var eth = vmDetail.NetworkInterface

    $("#server_info_archi").text(architecture)
    // detail tab
    $("#server_detail_view_archi").text(architecture)
    $("#server_detail_view_vpc_id").text(vpcId + "(" + vpcSystemId + ")")
    $("#server_detail_view_subnet_id").text(subnetId + "(" + subnetSystemId + ")")
    $("#server_detail_view_eth").text(eth)
    $("#server_detail_view_root_device_type").text(vmDetail.RootDiskType);
    $("#server_detail_view_root_device").text(vmDetail.RootDeviceName);
    $("#server_detail_view_keypair_name").text(vmDetail.KeyPairIId.NameId)
    $("#server_detail_view_access_id_pass").text(vmDetail.VMUserId + "/ *** ")


    // server spec
    // var vmSecName = data.VmSpecName
    $("#server_info_vmspec_name").text(vmSpecName)
    $("#server_detail_view_server_spec").text(vmSpecName) // detail tab

    webconsolejs["partials/operation/manage/server_monitoring"].monitoringDataInit()
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
    displayVmStatusArea();
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
    console.log("displayPmkStatusArea ");
    console.log("running status count ", $("#pmk_status_running").text());
}

// vm 상태값 표시
function displayVmStatusArea() {
    var sumVmCnt = 0;
    var sumVmRunningCnt = 0;
    var sumVmStopCnt = 0;
    var sumVmTerminateCnt = 0;
    totalVmStatusMap.forEach((value, key) => {
        var statusRunning = value.get("running");
        var statusStop = value.get("stop");
        var statusTerminate = value.get("terminate");
        sumVmRunningCnt += statusRunning;
        sumVmStopCnt += statusStop;
        sumVmTerminateCnt += statusTerminate;
    });
    sumVmCnt = sumVmRunningCnt + sumVmStopCnt + sumVmTerminateCnt;
    $("#total_vm").text(sumVmCnt);
    $("#vm_status_running").text(sumVmRunningCnt);
    $("#vm_status_stopped").text(sumVmStopCnt);
    $("#vm_status_terminated").text(sumVmTerminateCnt);
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
            title: "Total Servers",
            field: "statusCount.countTotal",
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

        var pmkID = row.getCell("id").getValue();
        console.log("pmkID", pmkID)

        // 표에서 선택된 PmkInfo 
        getSelectedPmkData(pmkID)

    });

    //  선택된 여러개 row에 대해 처리
    pmkListTable.on("rowSelectionChanged", function (data, rows) {
        checked_array = data
        console.log("checked_array", checked_array)
        console.log("rowsrows", data)
        selectedPmkObj = data
    });
    // displayColumn(table);
}

// toggleSelectBox of table row
function toggleRowSelection(id) {
    // pmkListTable에서 데이터 찾기
    console.log("idid : ", id)
    var row = pmkListTable.getRow(id);
    console.log("rowrow", row)
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
    console.log("datadata", data)
    console.log("cell.getData()", data.getData())
    var vmCloudConnectionMap = webconsolejs["common/api/services/pmk_api"].calculateConnectionCount(
        data.getData()
    );
    var pmkProviderCell = "";
    vmCloudConnectionMap.forEach((value, key) => {
        pmkProviderCell +=
            '<img class="img-fluid" class="rounded" width="30" src="/assets/images/common/img_logo_' +
            key +
            '.png" alt="' +
            key +
            '"/>';
    });

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