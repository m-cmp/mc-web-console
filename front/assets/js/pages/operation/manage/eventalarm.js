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
initEventAlarmTable(); // init tabulator
var totalPolicyListObj = new Object();
var selectedWorkspaceProject = new Object();
var policyListTable;
var eventAlarmListTable
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

async function getPolicyListCallbackSuccess(nsId, policyList) {

    totalPolicyListObj = policyList.data.responseData.data
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
        {
            title: "Statistics",
            field: "statistics",
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

// 클릭한 policy info 가져오기
// 표에서 선택된 policy seq 받아옴
async function getSelectedPolicySeqData(policySeq) {

    if (policySeq != undefined && policySeq != "") {
        var selectedNsId = selectedWorkspaceProject.nsId;
        currentPolicySeq = policySeq
        var policySeqResp = await webconsolejs["common/api/services/eventalarm_api"].getPolicyOfSeqHistory(currentPolicySeq.toString())

        if (policySeqResp.status != 200) {
            // failed.  // TODO : Error Popup 처리
            return;
        }
        // SET policy Info page
        setPolicyInfoData(policySeqResp.data)

        // Toggle PMK Info
        // var div = document.getElementById("cluster_info");
        // webconsolejs["partials/layout/navigatePages"].toggleElement(div)
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


// 클릭한 policy의 info값 세팅
function setPolicyInfoData(policyData) {

    var div = document.getElementById("policy_info");
    webconsolejs["partials/layout/navigatePages"].toggleElement(div)

    var selectedPolicyData = totalPolicyListObj[0]

    try {

        var policyName = selectedPolicyData.name;
        var policyDescription = selectedPolicyData.description
        var policyStatus = selectedPolicyData.status
        var policyMeasurement = selectedPolicyData.measurement
        var policyField = selectedPolicyData.field
        var policyStatistics = selectedPolicyData.statistics
        var policyThresholds = JSON.parse(selectedPolicyData.threshold)

        var value = ''
        if (policyThresholds.crit) value += `Critical: ${policyThresholds.crit} `;
        if (policyThresholds.warn) value += `Warning: ${policyThresholds.warn} `;
        if (policyThresholds.info) value += `Info: ${policyThresholds.info} `;

        $("#policy_name").text(policyName);
        $("#policy_description").text(policyDescription);
        $("#policy_status").text(policyStatus);
        $("#policy_measurement").text(policyMeasurement);
        $("#policy_metric").text(policyField);
        $("#policy_statistics").text(policyStatistics);
        $("#policy_value").text(value.trim());

    } catch (e) {
        console.error(e);
    }
    const rawData = policyData.responseData.data
    const formattedData = formatEventData(rawData)
    eventAlarmListTable.setData(formattedData);

}

function formatEventData(policyRawData) {
    return policyRawData.map(item => ({
        seq: item.seq,
        metric: item.measurement,
        createdAt: item.create_at,
        occurTime: item.occur_time,
        data: item.data,
        hostname: item.target_id,
        level: item.level,
        "policy seq": item.policy_seq
    }));
}

function initEventAlarmTable() {
    var tableObjParams = {};

    var columns = [

        {
            formatter: "rowSelection",
            titleFormatter: "rowSelection",
            vertAlign: "middle",
            hozAlign: "center",
            headerhozAlign: "center",
            headerSort: false,
            width: 60
        },
        {
            title: "Seq",
            field: "seq",
            visible: false
        },
        {
            title: "Policy seq",
            field: "policy seq",
            vertAlign: "middle"
        },
        {
            title: "OccurTime",
            field: "occurTime",
            vertAlign: "middle"
        },
        {
            title: "Metric",
            field: "metric",
            vertAlign: "middle"
        },
        {
            title: "Hostname",
            field: "hostname",
            vertAlign: "middle"
        },
        {
            title: "Level",
            field: "level",
            vertAlign: "middle"
        },
        {
            title: "CreatedAt",
            field: "createdAt",
            vertAlign: "middle"
        },

        {
            title: "Data",
            field: "data",
            vertAlign: "middle"
        },
        
        

    ]

    eventAlarmListTable = setEventAlarmTabulator("eventAlarmlist-table", tableObjParams, columns, true);

    eventAlarmListTable.on("rowClick", function (e, row) {

        // var eventSeq = row.getCell("seq").getValue();
        var selectedEventSeq = row.getData()

        // 표에서 선택된 eventSeq
        getSelectedEventSeqData(selectedEventSeq)

    });
    //  선택된 여러개 row에 대해 처리
    eventAlarmListTable.on("rowSelectionChanged", function (data, rows) {
        checked_array = data
        selectedPolicyObj = data
    });

}

function setEventAlarmTabulator(
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
async function getSelectedEventSeqData(selectedEventSeq) {
    var div = document.getElementById("event_info");
    await webconsolejs["partials/layout/navigatePages"].toggleElement(div)

    $('#event_occurtime').text(selectedEventSeq.occurTime);
    $('#event_metric').text(selectedEventSeq.metric);
    $('#event_level').text(selectedEventSeq.level);
    $('#event_data').text(selectedEventSeq.data);
    $('#event_policyseq').text(selectedEventSeq["policy seq"]);
    $('#event_hostname').text(selectedEventSeq.hostname);
}