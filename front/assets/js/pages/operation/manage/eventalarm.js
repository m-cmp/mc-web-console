import { TabulatorFull as Tabulator } from "tabulator-tables";

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
    console.log("select-current-project changed ")
    let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
    console.log("select-current-project on change ", project)
    var respPolicyList = await webconsolejs["common/api/services/eventalarm_api"].getAllPolicy();
    console.log("asdasd",respPolicyList)
    var policyList = respPolicyList.responseData.data
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
    totalPolicyListObj = policyList
    setPolicyList(policyList)
}
async function setPolicyList () {
  
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
    ];

    policyListTable = setPolicyTabulator("policylist-table", tableObjParams, columns, true);

    // 행 클릭 시
    policyListTable.on("rowClick", function (e, row) {
        // vmid 초기화 for vmlifecycle
        // selectedClusterId = ""

        var pmkID = row.getCell("id").getValue();

        // 표에서 선택된 PmkInfo 
        getSelectedPmkData(pmkID)

    });

    //  선택된 여러개 row에 대해 처리
    policyListTable.on("rowSelectionChanged", function (data, rows) {
        checked_array = data
        selectedPmkObj = data
    });
    // displayColumn(table);
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