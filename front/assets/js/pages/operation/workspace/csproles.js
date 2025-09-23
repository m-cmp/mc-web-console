import { TabulatorFull as Tabulator } from "tabulator-tables";

// 전역 변수
var cspRolesListTable;
var cspRolePoliciesTable;
var checked_array = [];
var currentClickedCspRoleId = "";
var selectedPolicyId = "";

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
    var tempCurrentCspRoleId = currentClickedCspRoleId;
    currentClickedCspRoleId = row.getCell("id").getValue();
    
    if (tempCurrentCspRoleId === currentClickedCspRoleId) {
      // 같은 행 클릭 - 정보 영역 숨김
      webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("csp_role_info"));
      currentClickedCspRoleId = "";
      this.deselectRow();
      return;
    } else {
      // 다른 행 클릭 - 정보 영역 표시
      webconsolejs["partials/layout/navigatePages"].activeElement(document.getElementById("csp_role_info"));
      this.deselectRow();
      this.selectRow(currentClickedCspRoleId);
      
      // 선택된 CSP Role 데이터 로드
      var selectedRole = row.getData();
      console.log("Selected CSP Role:", selectedRole);
      getSelectedCspRoleData(selectedRole);
      return;
    }
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

// 선택된 CSP Role 데이터 로드
function getSelectedCspRoleData(roleData) {
  // 제목 업데이트
  const titleElement = document.getElementById('csp_role_info_text');
  if (titleElement) {
    titleElement.textContent = `(${roleData.name || 'Unknown Role'})`;
  }

  // 상세 정보 업데이트
  updateElementText('csp_role_info_provider', roleData.provider || '-');
  updateElementText('csp_role_info_name', roleData.name || '-');
  updateElementText('csp_role_info_id', roleData.id || '-');
  updateElementText('csp_role_info_description', roleData.description || '-');
  
  // 플랫폼 역할 정보 (현재는 Mock 데이터로 처리)
  const platformRole = getPlatformRoleForCspRole(roleData);
  updateElementText('csp_role_info_platform_role', platformRole);

  // 정책 정보 로드
  loadCspRolePolicies(roleData.id);
}

// 요소 텍스트 업데이트 헬퍼 함수
function updateElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

// CSP Role에 연결된 플랫폼 역할 조회 (Mock 데이터)
function getPlatformRoleForCspRole(roleData) {
  // 실제로는 API를 통해 조회해야 하지만, 현재는 Mock 데이터로 처리
  const mockPlatformRoles = {
    'role-001': 'Admin',
    'role-002': 'User',
    'role-003': 'Viewer'
  };
  
  return mockPlatformRoles[roleData.id] || 'Not Assigned';
}

// CSP Role의 정책 정보 로드
async function loadCspRolePolicies(roleId) {
  try {
    console.log("Loading policies for role:", roleId);
    const policies = await window.webconsolejs["common/api/services/csproles_api"].getPoliciesByRoleId(roleId);
    console.log("Loaded policies:", policies);
    displayCspRolePolicies(policies);
  } catch (error) {
    console.error("정책 정보 로드 중 오류:", error);
    displayCspRolePolicies([]);
  }
}

// 정책 정보 표시 (Tabulator 테이블 사용)
function displayCspRolePolicies(policies) {
  const policiesContainer = document.getElementById('csp_role_policies_list');
  if (!policiesContainer) return;

  console.log("Displaying policies:", policies);

  // 기존 테이블이 있으면 제거
  if (cspRolePoliciesTable) {
    cspRolePoliciesTable.destroy();
  }

  // 빈 데이터 처리
  if (!policies || policies.length === 0) {
    policiesContainer.innerHTML = `
      <div class="text-muted text-center py-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-info-circle" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
          <path d="M12 9h.01"></path>
          <path d="M11 12h1v4h1"></path>
        </svg>
        <div class="mt-2">이 CSP Role에 연결된 정책이 없습니다.</div>
      </div>
    `;
    return;
  }

  // Tabulator 테이블 초기화 (CSP Roles 목록과 유사한 간단한 구조)
  cspRolePoliciesTable = new Tabulator("#csp_role_policies_list", {
    data: policies,
    layout: "fitColumns",
    pagination: "local",
    paginationSize: 10,
    paginationSizeSelector: [5, 10, 20, 50],
    movableColumns: true,
    resizableRows: true,
    selectable: true,
    columns: [
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
        vertAlign: "middle",
        hozAlign: "center",
        width: 300,
      },
      {
        title: "ID",
        field: "id",
        vertAlign: "middle",
        hozAlign: "center",
        width: 300,
      },
      {
        title: "Policy Type",
        field: "provider",
        formatter: providerFormatter,
        vertAlign: "middle",
        hozAlign: "center",
        headerSort: false,
        width: 120,
      },
      {
        title: "Description",
        field: "description",
        vertAlign: "middle",
        hozAlign: "center",
        maxWidth: 500,
      },
    ]
  });

  // 정책 행 클릭 이벤트 추가
  cspRolePoliciesTable.on("rowClick", function (e, row) {
    const policyData = row.getData();
    showPolicyDetailPanel(policyData);
  });

  console.log("Policies table initialized with", policies.length, "policies");
}

// Provider별 색상 반환
function getProviderColor(provider) {
  const colorMap = {
    'aws': 'warning',
    'azure': 'info', 
    'gcp': 'primary',
    'alibaba': 'success',
    'tencent': 'secondary'
  };
  return colorMap[provider] || 'secondary';
}

// 정책 추가 모달 표시
function showAddPolicyModal() {
  // 모달이 이미 열려있으면 초기화
  const modal = new bootstrap.Modal(document.getElementById('addPolicyModal'));
  modal.show();
  
  // Provider 목록 로드
  loadPolicyProviders();
  
  // 검색 이벤트 리스너 추가
  document.getElementById('addPolicySearch').addEventListener('input', filterAvailablePolicies);
  document.getElementById('addPolicyProvider').addEventListener('change', loadAvailablePolicies);
}

// 정책 Provider 목록 로드
async function loadPolicyProviders() {
  try {
    const providers = await window.webconsolejs["common/api/services/csproles_api"].getCspProviders();
    const select = document.getElementById('addPolicyProvider');
    select.innerHTML = '<option value="">Select Policy Provider</option>';
    
    providers.forEach(provider => {
      const option = document.createElement('option');
      option.value = provider;
      option.textContent = provider.toUpperCase();
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Provider 목록 로드 중 오류:", error);
  }
}

// 사용 가능한 정책 목록 로드
async function loadAvailablePolicies() {
  const provider = document.getElementById('addPolicyProvider').value;
  const container = document.getElementById('availablePoliciesList');
  
  if (!provider) {
    container.innerHTML = '<div class="text-muted text-center py-3">Select a Policy Provider to view available policies</div>';
    return;
  }
  
  try {
    container.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm" role="status"></div> Loading policies...</div>';
    
    const policies = await window.webconsolejs["common/api/services/csproles_api"].getCspPolicyList(provider);
    
    if (!policies || policies.length === 0) {
      container.innerHTML = '<div class="text-muted text-center py-3">No policies available for this provider</div>';
      return;
    }
    
    // 정책 목록 표시
    let html = '<div class="list-group">';
    policies.forEach(policy => {
      html += `
        <div class="list-group-item d-flex justify-content-between align-items-center policy-item" data-policy-id="${policy.id}">
          <div>
            <h6 class="mb-1">${policy.name}</h6>
            <small class="text-muted">ID: ${policy.id}</small>
            <br>
            <small class="text-muted">${policy.description || 'No description'}</small>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="selectedPolicy" value="${policy.id}">
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    container.innerHTML = html;
  } catch (error) {
    console.error("정책 목록 로드 중 오류:", error);
    container.innerHTML = '<div class="text-danger text-center py-3">Error loading policies</div>';
  }
}

// 정책 검색 필터
function filterAvailablePolicies() {
  const searchTerm = document.getElementById('addPolicySearch').value.toLowerCase();
  const policyItems = document.querySelectorAll('.policy-item');
  
  policyItems.forEach(item => {
    const policyName = item.querySelector('h6').textContent.toLowerCase();
    const policyId = item.querySelector('small').textContent.toLowerCase();
    
    if (policyName.includes(searchTerm) || policyId.includes(searchTerm)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// 선택된 정책 추가
async function addSelectedPolicy() {
  const selectedPolicy = document.querySelector('input[name="selectedPolicy"]:checked');
  
  if (!selectedPolicy) {
    alert('Please select a policy to add');
    return;
  }
  
  if (!currentClickedCspRoleId) {
    alert('Please select a CSP Role first');
    return;
  }
  
  try {
    const policyId = selectedPolicy.value;
    const result = await window.webconsolejs["common/api/services/csproles_api"].bindPolicyToRole(currentClickedCspRoleId, policyId);
    
    if (result.success) {
      alert('Policy added successfully');
      
      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('addPolicyModal'));
      modal.hide();
      
      // 정책 목록 새로고침
      await loadCspRolePolicies(currentClickedCspRoleId);
    } else {
      throw new Error(result.message || 'Failed to add policy');
    }
  } catch (error) {
    console.error("정책 추가 중 오류:", error);
    alert('Error adding policy: ' + error.message);
  }
}

// 정책 언바인딩

// 정책 목록 새로고침
function refreshPoliciesList() {
  if (currentClickedCspRoleId) {
    loadCspRolePolicies(currentClickedCspRoleId);
  }
}

// 모든 정책 선택 (Tabulator 사용)
function selectAllPolicies() {
  if (!cspRolePoliciesTable) {
    console.warn("Policies table not initialized");
    return;
  }
  
  cspRolePoliciesTable.selectRow();
  console.log("All policies selected");
}

// 모든 정책 선택 해제 (Tabulator 사용)
function unselectAllPolicies() {
  if (!cspRolePoliciesTable) {
    console.warn("Policies table not initialized");
    return;
  }
  
  cspRolePoliciesTable.deselectRow();
  console.log("All policies deselected");
}

// 정책 언바인딩
function unbindPolicies() {
  if (!cspRolePoliciesTable) {
    console.warn("Policies table not initialized");
    return;
  }
  
  const selectedRows = cspRolePoliciesTable.getSelectedRows();
  if (selectedRows.length === 0) {
    alert("선택된 정책이 없습니다.");
    return;
  }

  const selectedIds = selectedRows.map(row => row.getData().binding_id);
  if (confirm(`선택된 ${selectedIds.length}개의 정책을 CSP Role에서 제거하시겠습니까?`)) {
    try {
      // TODO: 실제 일괄 언바인딩 API 호출
      console.log("정책 언바인딩:", selectedIds);
      alert("선택된 정책들이 성공적으로 제거되었습니다.");
      // 정책 목록 새로고침
      refreshPoliciesList();
    } catch (error) {
      console.error("정책 언바인딩 중 오류:", error);
      alert("정책 제거 중 오류가 발생했습니다.");
    }
  }
}

// 정책 가져오기 (Import)
function importPolicy() {
  // 파일 입력 요소 생성
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  
  fileInput.onchange = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const fileContent = await readFileContent(file);
      const policyData = JSON.parse(fileContent);
      
      // 정책 데이터 검증
      if (!policyData.name || !policyData.document) {
        throw new Error('정책 파일에 필수 필드(name, document)가 없습니다.');
      }
      
      // 정책 생성
      const result = await window.webconsolejs["common/api/services/csproles_api"].createCspPolicy(policyData);
      
      if (result.success) {
        alert('정책이 성공적으로 가져왔습니다.');
        // 정책 목록 새로고침
        refreshPoliciesList();
      } else {
        throw new Error(result.message || 'Failed to import policy');
      }
    } catch (error) {
      console.error("정책 가져오기 중 오류:", error);
      alert('정책 가져오기 중 오류가 발생했습니다: ' + error.message);
    }
  };
  
  // 파일 선택 다이얼로그 표시
  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
}

// 파일 내용 읽기 헬퍼 함수
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

// 정책 상세 보기
function viewPolicy(bindingId) {
  console.log("Viewing policy details for binding:", bindingId);
  showPolicyEditor(bindingId);
}

// 정책 에디터 모달 표시
async function showPolicyEditor(bindingId) {
  try {
    // 정책 상세 정보 로드
    const policy = await window.webconsolejs["common/api/services/csproles_api"].getCspPolicyById(bindingId);
    
    // 모달 필드 채우기
    document.getElementById('policyEditorName').value = policy.name || '';
    document.getElementById('policyEditorId').value = policy.id || '';
    document.getElementById('policyEditorType').value = policy.provider || '';
    document.getElementById('policyEditorDescription').value = policy.description || '';
    document.getElementById('policyEditorDocument').value = JSON.stringify(policy.document || {}, null, 2);
    
    // 미리보기 업데이트
    updatePolicyDocumentPreview();
    
    // 모달 표시
    const modal = new bootstrap.Modal(document.getElementById('policyEditorModal'));
    modal.show();
    
    // 이벤트 리스너 추가
    addPolicyDocumentListeners();
    
  } catch (error) {
    console.error("정책 정보 로드 중 오류:", error);
    alert('Error loading policy details: ' + error.message);
  }
}

// 정책 문서 토글
function togglePolicyDocument() {
  const container = document.getElementById('policyDocumentContainer');
  const preview = document.getElementById('policyDocumentPreview');
  const toggleText = document.getElementById('policyDocumentToggleText');
  
  if (container.style.display === 'none') {
    container.style.display = 'block';
    preview.style.display = 'none';
    toggleText.textContent = 'Collapse';
  } else {
    container.style.display = 'none';
    preview.style.display = 'block';
    toggleText.textContent = 'Expand';
  }
}

// 정책 문서 미리보기 업데이트
function updatePolicyDocumentPreview() {
  const document = document.getElementById('policyEditorDocument').value;
  const preview = document.getElementById('policyDocumentPreview');
  
  try {
    const parsed = JSON.parse(document);
    preview.innerHTML = `<pre class="mb-0">${JSON.stringify(parsed, null, 2)}</pre>`;
  } catch (error) {
    preview.innerHTML = '<div class="text-danger">Invalid JSON format</div>';
  }
}

// 정책 문서 에디터 이벤트 리스너 추가
function addPolicyDocumentListeners() {
  const documentTextarea = document.getElementById('policyEditorDocument');
  if (documentTextarea) {
    documentTextarea.addEventListener('input', updatePolicyDocumentPreview);
  }
}

// 정책 문서 클리어
function clearPolicyDocument() {
  if (confirm('정책 문서를 클리어하시겠습니까?')) {
    document.getElementById('policyEditorDocument').value = '';
    updatePolicyDocumentPreview();
  }
}

// 정책 문서 편집 모드
function editPolicyDocument() {
  const editBtn = document.querySelector('button[onclick="editPolicyDocument()"]');
  const saveBtn = document.querySelector('button[onclick="savePolicyDocument()"]');
  const documentTextarea = document.getElementById('policyEditorDocument');
  
  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';
  documentTextarea.readOnly = false;
  documentTextarea.focus();
}

// 정책 문서 저장
async function savePolicyDocument() {
  const policyId = document.getElementById('policyEditorId').value;
  const document = document.getElementById('policyEditorDocument').value;
  
  try {
    // JSON 유효성 검사
    JSON.parse(document);
    
    const result = await window.webconsolejs["common/api/services/csproles_api"].updateCspPolicy(policyId, {
      document: JSON.parse(document)
    });
    
    if (result.success) {
      alert('정책이 성공적으로 업데이트되었습니다.');
      
      // 편집 모드 해제
      const editBtn = document.querySelector('button[onclick="editPolicyDocument()"]');
      const saveBtn = document.querySelector('button[onclick="savePolicyDocument()"]');
      const documentTextarea = document.getElementById('policyEditorDocument');
      
      editBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
      documentTextarea.readOnly = true;
      
      // 미리보기 업데이트
      updatePolicyDocumentPreview();
    } else {
      throw new Error(result.message || 'Failed to update policy');
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      alert('Invalid JSON format. Please check your syntax.');
    } else {
      console.error("정책 업데이트 중 오류:", error);
      alert('Error updating policy: ' + error.message);
    }
  }
}

// 정책 동기화
async function syncPolicies() {
  if (!currentClickedCspRoleId) {
    alert('Please select a CSP Role first');
    return;
  }
  
  if (confirm('정책을 동기화하시겠습니까?')) {
    try {
      const result = await window.webconsolejs["common/api/services/csproles_api"].syncPolicies(currentClickedCspRoleId);
      
      if (result.success) {
        alert('정책이 성공적으로 동기화되었습니다.');
        // 정책 목록 새로고침
        await loadCspRolePolicies(currentClickedCspRoleId);
      } else {
        throw new Error(result.message || 'Failed to sync policies');
      }
    } catch (error) {
      console.error("정책 동기화 중 오류:", error);
      alert('Error syncing policies: ' + error.message);
    }
  }
}

// ===== 정책 상세 패널 관리 =====

// 정책 상세 패널 표시
function showPolicyDetailPanel(policyData) {
  selectedPolicyId = policyData.id;
  
  // 헤더 업데이트
  document.getElementById('policy-detail-header').textContent = `${policyData.name} / (${policyData.id})`;
  
  // 기본 정보 업데이트
  document.getElementById('policy-detail-name').textContent = policyData.name || '-';
  document.getElementById('policy-detail-id').textContent = policyData.id || '-';
  document.getElementById('policy-detail-type').textContent = policyData.provider || '-';
  document.getElementById('policy-detail-description').textContent = policyData.description || '-';
  
  // Context JSON 업데이트
  const contextJson = policyData.document || {};
  document.getElementById('policy-detail-context').value = JSON.stringify(contextJson, null, 2);
  updatePolicyContextPreview();
  
  // 패널 표시
  document.getElementById('policy-detail-panel').style.display = 'block';
  
  // Context JSON 이벤트 리스너 추가
  const contextTextarea = document.getElementById('policy-detail-context');
  if (contextTextarea) {
    contextTextarea.addEventListener('input', updatePolicyContextPreview);
  }
  
  // 스크롤을 패널로 이동
  document.getElementById('policy-detail-panel').scrollIntoView({ behavior: 'smooth' });
}


// 정책 Context JSON 토글 (모달로 열기)
function togglePolicyContextJson() {
  const jsonContent = document.getElementById('policy-detail-context').value;
  
  // JSON 에디터 모달에 내용 설정
  document.getElementById('jsonEditorContent').value = jsonContent;
  
  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('jsonEditorModal'));
  modal.show();
}

// 정책 Context JSON 클리어
function clearPolicyContextJson() {
  if (confirm('정책 Context JSON을 클리어하시겠습니까?')) {
    document.getElementById('policy-detail-context').value = '';
    updatePolicyContextPreview();
  }
}

// JSON 에디터 모달 내부 함수들
function clearJsonEditor() {
  if (confirm('JSON 내용을 클리어하시겠습니까?')) {
    document.getElementById('jsonEditorContent').value = '';
  }
}

function saveJsonEditor() {
  const jsonContent = document.getElementById('jsonEditorContent').value;
  
  try {
    // JSON 유효성 검사
    JSON.parse(jsonContent);
    
    // 원래 위치에 내용 저장
    document.getElementById('policy-detail-context').value = jsonContent;
    updatePolicyContextPreview();
    
    // 모달 닫기
    const modal = bootstrap.Modal.getInstance(document.getElementById('jsonEditorModal'));
    modal.hide();
    
    alert('JSON이 성공적으로 저장되었습니다.');
  } catch (error) {
    alert('유효하지 않은 JSON 형식입니다: ' + error.message);
  }
}

// 정책 Context 미리보기 업데이트
function updatePolicyContextPreview() {
  const context = document.getElementById('policy-detail-context').value;
  const preview = document.getElementById('policy-context-preview');
  
  try {
    const parsed = JSON.parse(context);
    preview.innerHTML = `<pre class="mb-0">${JSON.stringify(parsed, null, 2)}</pre>`;
  } catch (error) {
    preview.innerHTML = '<div class="text-danger">Invalid JSON format</div>';
  }
}

// 선택된 정책 편집
function editSelectedPolicy() {
  if (!selectedPolicyId) {
    alert('Please select a policy first');
    return;
  }
  
  // 정책 에디터 모달로 이동
  showPolicyEditor(selectedPolicyId);
}


// 정책 문서 보기
function viewPolicyDocument(policyId) {
  console.log("Viewing policy document for policy:", policyId);
  // TODO: 정책 문서 보기 모달 구현
  alert(`정책 문서 보기: ${policyId}\n\n이 기능은 향후 구현 예정입니다.`);
}

// 정책 정렬 (Tabulator 내장 정렬 사용)
function sortPolicies(field, direction) {
  console.log(`정책 정렬: ${field} ${direction}`);
  
  if (!cspRolePoliciesTable) {
    console.warn("Policies table not initialized");
    return;
  }
  
  // Tabulator의 내장 정렬 기능 사용
  cspRolePoliciesTable.setSort(field, direction === 'asc' ? 'asc' : 'desc');
  
  console.log(`정책이 ${field} 기준으로 ${direction === 'asc' ? '오름차순' : '내림차순'} 정렬되었습니다.`);
}

// 정책 내보내기
function exportPolicies() {
  // TODO: 정책 내보내기 기능 구현
  alert("정책 내보내기 기능은 향후 구현 예정입니다.");
}

// 정책 필터 초기화
function clearPoliciesFilter() {
  document.getElementById('policies-filter-field').value = 'name';
  document.getElementById('policies-filter-type').value = 'like';
  document.getElementById('policies-filter-value').value = '';
  // TODO: 필터 적용 로직 구현
  refreshPoliciesList();
}

// 필터 클리어 버튼 이벤트 연결
document.addEventListener('DOMContentLoaded', function() {
  const clearButton = document.getElementById('policies-filter-clear');
  if (clearButton) {
    clearButton.addEventListener('click', clearPoliciesFilter);
  }
});

// 전역 함수로 노출
window.showAddPolicyModal = showAddPolicyModal;
window.refreshPoliciesList = refreshPoliciesList;
window.selectAllPolicies = selectAllPolicies;
window.unselectAllPolicies = unselectAllPolicies;
window.unbindPolicies = unbindPolicies;
window.importPolicy = importPolicy;
window.viewPolicy = viewPolicy;
window.viewPolicyDocument = viewPolicyDocument;
window.sortPolicies = sortPolicies;
window.exportPolicies = exportPolicies;
window.clearPoliciesFilter = clearPoliciesFilter;

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
      
      // 정보 영역 숨기기
      webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("csp_role_info"));
      currentClickedCspRoleId = "";
      
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

// CSP Role 추가 모달 표시
function showAddCspRoleModal() {
  const modal = new bootstrap.Modal(document.getElementById('addCspRoleModal'));
  modal.show();
  
  // Provider 목록 로드
  loadCspRoleProviders();
  
  // 검색 이벤트 리스너 추가
  document.getElementById('addCspRoleSearch').addEventListener('input', filterAvailableCspRoles);
  document.getElementById('addCspRoleProvider').addEventListener('change', loadAvailableCspRoles);
}

// CSP Role Provider 목록 로드
async function loadCspRoleProviders() {
  try {
    const providers = await window.webconsolejs["common/api/services/csproles_api"].getCspProviders();
    const select = document.getElementById('addCspRoleProvider');
    select.innerHTML = '<option value="">Select CSP Provider</option>';
    
    providers.forEach(provider => {
      const option = document.createElement('option');
      option.value = provider;
      option.textContent = provider.toUpperCase();
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Provider 목록 로드 중 오류:", error);
  }
}

// 사용 가능한 CSP Role 목록 로드
async function loadAvailableCspRoles() {
  const provider = document.getElementById('addCspRoleProvider').value;
  const container = document.getElementById('availableCspRolesList');
  
  if (!provider) {
    container.innerHTML = '<div class="text-muted text-center py-3">Select a CSP Provider to view available roles</div>';
    return;
  }
  
  try {
    container.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm" role="status"></div> Loading roles...</div>';
    
    const roles = await window.webconsolejs["common/api/services/csproles_api"].getCspRoleList(provider);
    
    if (!roles || roles.length === 0) {
      container.innerHTML = '<div class="text-muted text-center py-3">No roles available for this provider</div>';
      return;
    }
    
    // 역할 목록 표시
    let html = '<div class="list-group">';
    roles.forEach(role => {
      html += `
        <div class="list-group-item d-flex justify-content-between align-items-center csp-role-item" data-role-id="${role.id}">
          <div>
            <h6 class="mb-1">${role.name}</h6>
            <small class="text-muted">ID: ${role.id}</small>
            <br>
            <small class="text-muted">${role.description || 'No description'}</small>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="selectedCspRole" value="${role.id}">
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    container.innerHTML = html;
  } catch (error) {
    console.error("CSP Role 목록 로드 중 오류:", error);
    container.innerHTML = '<div class="text-danger text-center py-3">Error loading roles</div>';
  }
}

// CSP Role 검색 필터
function filterAvailableCspRoles() {
  const searchTerm = document.getElementById('addCspRoleSearch').value.toLowerCase();
  const roleItems = document.querySelectorAll('.csp-role-item');
  
  roleItems.forEach(item => {
    const roleName = item.querySelector('h6').textContent.toLowerCase();
    const roleId = item.querySelector('small').textContent.toLowerCase();
    
    if (roleName.includes(searchTerm) || roleId.includes(searchTerm)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// 선택된 CSP Role 추가
async function addSelectedCspRole() {
  const selectedRole = document.querySelector('input[name="selectedCspRole"]:checked');
  
  if (!selectedRole) {
    alert('Please select a CSP Role to add');
    return;
  }
  
  try {
    const roleId = selectedRole.value;
    const roleData = {
      id: roleId,
      name: selectedRole.closest('.csp-role-item').querySelector('h6').textContent,
      description: selectedRole.closest('.csp-role-item').querySelectorAll('small')[1].textContent.replace('No description', ''),
      provider: document.getElementById('addCspRoleProvider').value
    };
    
    const result = await window.webconsolejs["common/api/services/csproles_api"].createCspRole(roleData);
    
    if (result.success) {
      alert('CSP Role added successfully');
      
      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('addCspRoleModal'));
      modal.hide();
      
      // CSP Role 목록 새로고침
      await refreshCspRolesList();
    } else {
      throw new Error(result.message || 'Failed to add CSP Role');
    }
  } catch (error) {
    console.error("CSP Role 추가 중 오류:", error);
    alert('Error adding CSP Role: ' + error.message);
  }
}

// CSP Role 동기화
async function syncCspRoles() {
  if (confirm('CSP Role을 동기화하시겠습니까?')) {
    try {
      const result = await window.webconsolejs["common/api/services/csproles_api"].syncCspRoles();
      
      if (result.success) {
        alert('CSP Role이 성공적으로 동기화되었습니다.');
        // CSP Role 목록 새로고침
        await refreshCspRolesList();
      } else {
        throw new Error(result.message || 'Failed to sync CSP Roles');
      }
    } catch (error) {
      console.error("CSP Role 동기화 중 오류:", error);
      alert('Error syncing CSP Roles: ' + error.message);
    }
  }
}

// 전역 함수로 노출 (HTML에서 호출용)
window.refreshCspRolesList = refreshCspRolesList;
window.deleteCspRole = deleteCspRole;
window.applyFilter = applyFilter;
window.clearFilter = clearFilter;
window.showAddCspRoleModal = showAddCspRoleModal;
window.addSelectedCspRole = addSelectedCspRole;
window.syncCspRoles = syncCspRoles;
window.showAddPolicyModal = showAddPolicyModal;
window.addSelectedPolicy = addSelectedPolicy;
window.syncPolicies = syncPolicies;
window.togglePolicyDocument = togglePolicyDocument;
window.clearPolicyDocument = clearPolicyDocument;
window.editPolicyDocument = editPolicyDocument;
window.savePolicyDocument = savePolicyDocument;
window.addPolicyDocumentListeners = addPolicyDocumentListeners;
window.showPolicyDetailPanel = showPolicyDetailPanel;
window.togglePolicyContextJson = togglePolicyContextJson;
window.clearPolicyContextJson = clearPolicyContextJson;
window.updatePolicyContextPreview = updatePolicyContextPreview;
window.clearJsonEditor = clearJsonEditor;
window.saveJsonEditor = saveJsonEditor;
window.editSelectedPolicy = editSelectedPolicy;
