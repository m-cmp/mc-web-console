import { TabulatorFull as Tabulator } from "tabulator-tables";

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
    console.log("select-current-project changed ")
    let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
    console.log("select-current-project on change ", project)
    var respPolicyList = await webconsolejs["common/api/services/eventalarm_api"].getAllPolicy();
    var policyList = respPolicyList.data
    getPolicyListCallbackSuccess(project.NsId, policyList);
})

////
// 모달 콜백 예제
export function commoncallbac(val) {
    alert(val);
}

initPolicyTable(); // init tabulator
var totalPolicyListObj = new Object();
var selectedWorkspaceProject = new Object();
var policyListTable;
var checked_array = [];
export var selectedPolicyObj = new Object();
var currentPolicySeq = "";



document.addEventListener("DOMContentLoaded", initEventAlarm);
async function initEventAlarm() {
    console.log("initEventAlarm")
    ////////////////////// partials init functions///////////////////////////////////////
    // try {
    //     webconsolejs["partials/operation/manage/pmkcreate"].initPmkCreate();//PmkCreate을 Partial로 가지고 있음. 
    // } catch (e) {
    //     console.log(e);
    // }
    ////////////////////// partials init functions end ///////////////////////////////////////

    ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
    selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

    // workspace selection check
    webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject)
    ////////////////////// set workspace list, project list at Navbar end //////////////////////////////////



    if (selectedWorkspaceProject.projectId != "") {
        var selectedProjectId = selectedWorkspaceProject.projectId;
        var selectedNsId = selectedWorkspaceProject.nsId;

        //getPmkList();// project가 선택되어 있으면 pmk목록을 조회한다.
        var respMciList = await webconsolejs["common/api/services/eventalarm_api"].getAllPolicy();
        getPolicyListCallbackSuccess(selectedProjectId, respMciList);

    }
}

async function getPolicyListCallbackSuccess (nsId, policyList) {
    
    totalPolicyListObj = policyList.data.responseData.data
    console.log("totalPolicyListObj",totalPolicyListObj)
    const transformedData = mapPolicyData(totalPolicyListObj)
    policyListTable.setData(transformedData);
 
}
function mapPolicyData(data) {
    return data.map(item => {
        // threshold 필드를 파싱하여 crit, warn, info 필드를 추출
        let threshold = JSON.parse(item.threshold || '{}');
        return {
            ...item,
            crit: threshold.crit || '',
            warn: threshold.warn || '',
            info: threshold.info || ''
        };
    });
}


////////////////////////////////////////////////////// TABULATOR Start //////////////////////////////////////////////////////
// tabulator 행, 열, 기본값 설정
// table이 n개 가능하므로 개별 tabulator 정의 : 원리 util 안에 setTabulator있음.
function setPolicyTabulator(
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
function initPolicyTable() {

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
            title: "Seq",
            field: "seq",
            vertAlign: "middle"
        },
        {
            title: "Name",
            field: "name",
            vertAlign: "middle"
        },
        {
            title: "Measurement",
            field: "measurement",
            vertAlign: "middle"
        },
        {
            title: "Field",
            field: "field",
            vertAlign: "middle",
        },
        {
            title: "Status",
            field: "status",
            vertAlign: "middle",
        },
        {
            title: "Create_at",
            field: "create_at",
            vertAlign: "middle",
        },
        {
            title: "Crit",
            field: "crit",
            vertAlign: "middle",
        },
        {
            title: "Warn",
            field: "warn",
            vertAlign: "middle",
        },
        {
            title: "Info",
            field: "info",
            vertAlign: "middle",
        },
        {
            title: "Description",
            field: "description",
            visible: false,
        },
    ];

    policyListTable = setPolicyTabulator("policylist-table", tableObjParams, columns, true);

    // 행 클릭 시
    policyListTable.on("rowClick", function (e, row) {
        
        var policySeq = row.getCell("seq").getValue();

        // 표에서 선택된 seqInfo 
        getSelectedPolicySeqData(policySeq)

    });

    //  선택된 여러개 row에 대해 처리
    policyListTable.on("rowSelectionChanged", function (data, rows) {
        checked_array = data
        selectedPolicyObj = data
    });
    // displayColumn(table);
}

// 클릭한 pmk info 가져오기
// 표에서 선택된 PmkId 받아옴
async function getSelectedPolicySeqData(policySeq) {

    console.log('selectedpolicySeq:', policySeq)
    if (policySeq != undefined && policySeq != "") {
        var selectedNsId = selectedWorkspaceProject.nsId;
        currentPolicySeq = policySeq
        var policySeqResp = await webconsolejs["common/api/services/eventalarm_api"].getPolicyOfSeqHistory(currentPolicySeq.toString())
        
        if (policySeqResp.status != 200) {
            console.log("resp status ", policySeqResp.status)
            // failed.  // TODO : Error Popup 처리
            return;
        }
        // SET PMK Info page
        setPolicyInfoData(policySeqResp.data)

        // Toggle PMK Info
        var div = document.getElementById("cluster_info");
        webconsolejs["partials/layout/navigatePages"].toggleElement(div)
    }
}


// toggleSelectBox of table row
function toggleRowSelection(id) {
    // policyListTable 데이터 찾기
    var row = policyListTable.getRow(id);
    if (row) {
        row.select();
        console.log("Row with ID " + id + " is selected.");
    } else {
        console.log("Row with ID " + id + " not found.");
    }
}


// 클릭한 pmk의 info값 세팅
function setPolicyInfoData(policyData) {
    console.log("setPolicyInfoData", policyData);

    var clusterData = pmkData.responseData;
    var clusterDetailData = clusterData.CspViewK8sClusterDetail;
    var pmkNetwork = clusterDetailData.Network || {};

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
        displayNodeGroupStatusList(pmkID, clusterData);
    }
}
