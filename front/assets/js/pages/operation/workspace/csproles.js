import { TabulatorFull as Tabulator } from "tabulator-tables";

// 전역 변수
var cspRolesListTable;
var checked_array = [];

// CSP Roles 목록 조회
export async function refreshCspRolesList() {
  try {
    const cspRoles = await window.webconsolejs["common/api/services/csproles_api"].getCspRoleList();
    console.log("Loaded CSP Roles:", cspRoles);
    
    if (cspRoles && cspRoles.length > 0) {
      cspRolesListTable.setData(cspRoles);
    } else {
      cspRolesListTable.setData([]);
    }
  } catch (error) {
    console.error("CSP Roles 목록 로드 중 오류:", error);
  }
}

// Tabulator 테이블 초기화
function initCspRolesTable() {
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
      title: "Id",
      field: "id",
      vertAlign: "middle",
      hozAlign: "center",
      width: 300,
    },
    {
      title: "Name",
      field: "name",
      vertAlign: "middle",
      hozAlign: "center",
      width: 300,
    },
    {
      title: "ProviderImg",
      field: "provider",
      formatter: providerFormatter,
      vertAlign: "middle",
      hozAlign: "center",
      headerSort: false,
      width: 120,
    },
    {
      title: "Provider",
      field: "provider",
      formatter: providerFormatterString,
      visible: false
    },
    {
      title: "Description",
      field: "description",
      vertAlign: "middle",
      hozAlign: "center",
      maxWidth: 500,
    }
  ];

  cspRolesListTable = setCspRolesTabulator("csp-roles-table", tableObjParams, columns, true);
  
  // 행 클릭 시
  cspRolesListTable.on("rowClick", function (e, row) {
    var tempcurRoleID = row.getCell("id").getValue();
    console.log("Selected CSP Role:", tempcurRoleID);
  });

  // 선택된 여러개 row에 대해 처리
  cspRolesListTable.on("rowSelectionChanged", function (data, rows) {
    checked_array = data;
    console.log("checked_array", checked_array);
  });
}

// Tabulator 설정 함수 (mci.js와 동일한 패턴)
function setCspRolesTabulator(
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


// provider를 table에서 표시하기 위해 감싸기 (mci.js와 동일한 패턴)
function providerFormatter(data) {
  const provider = data.getData().provider;
  let providerCell = "";
  
  if (provider) {
    providerCell = `
      <img class="img-fluid" class="rounded" width="30" src="/assets/images/common/img_logo_${provider}.png" alt="${provider}"/>`;
  } else {
    providerCell = `
      <img class="img-fluid" class="rounded" width="30" src="/assets/images/common/img_logo_mcmp.png" alt="unknown"/>`;
  }

  return providerCell;
}

// provider를 string으로 추출 (mci.js와 동일한 패턴)
function providerFormatterString(data) {
  const provider = data.getData().provider;
  return provider || "";
}

// CSP Role 삭제 (모달에서 호출)
export async function deleteCspRole(roleId) {
  try {
    if (!roleId) {
      throw new Error("삭제할 CSP Role ID가 없습니다.");
    }

    const result = await window.webconsolejs["common/api/services/csproles_api"].deleteCspRole(roleId);
    
    if (result.success) {
      console.log("CSP Role 삭제 성공:", result.deletedRole);
      
      // 테이블에서 해당 행 제거
      if (cspRolesListTable) {
        cspRolesListTable.deleteRow(roleId);
      }
      
      alert("CSP Role이 성공적으로 삭제되었습니다.");
    } else {
      throw new Error("CSP Role 삭제에 실패했습니다.");
    }
  } catch (error) {
    console.error("CSP Role 삭제 중 오류:", error);
    alert("CSP Role 삭제 중 오류가 발생했습니다.");
  }
}

// 필터 기능 초기화
function initFilter() {
  // 필터 적용 버튼
  document.getElementById('filter-value').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      applyFilter();
    }
  });

  // 필터 초기화 버튼
  document.getElementById('filter-clear').addEventListener('click', function() {
    clearFilter();
  });
}

// 필터 적용
function applyFilter() {
  const field = document.getElementById('filter-field').value;
  const type = document.getElementById('filter-type').value;
  const value = document.getElementById('filter-value').value;

  if (!value) {
    clearFilter();
    return;
  }

  if (cspRolesListTable) {
    cspRolesListTable.setFilter(field, type, value);
  }
}

// 필터 초기화
function clearFilter() {
  document.getElementById('filter-value').value = '';
  if (cspRolesListTable) {
    cspRolesListTable.clearFilter();
  }
}

// 페이지 로드 시 초기화 (mci.js와 동일한 패턴)
document.addEventListener("DOMContentLoaded", initCspRoles);

// 해당 화면에서 최초 설정하는 function
async function initCspRoles() {
  initCspRolesTable(); // init tabulator
  initFilter(); // 필터 초기화
  refreshCspRolesList(); // 데이터 로드
}

// 전역 함수로 노출 (HTML에서 호출용)
window.refreshCspRolesList = refreshCspRolesList;
window.deleteCspRole = deleteCspRole;
window.applyFilter = applyFilter;
window.clearFilter = clearFilter;
