import { TabulatorFull as Tabulator } from "tabulator-tables";

// navBar에 있는 object인데 직접 handling(onchange)
$("#select-current-project").on('change', async function () {
  // TODO : 왜 NsId를 select의 text값을 쓸까??
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  if (this.value == "") return;
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장

  window.currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId

  var respMciList = await webconsolejs["common/api/services/infra_api"].getMciList(project.NsId);
  getMciListCallbackSuccess(project.NsId, respMciList);
})

////
// 모달 콜백 예제
export function commoncallbac(val) {
  alert(val);
}
//// 선택한 값이 object면 selectedXXX
//// 선택한 값이 id면 current

window.totalMciListObj = new Object();
var selectedWorkspaceProject = new Object();
// export var selectedMciObj = new Object();
var totalMciStatusMap = new Map();
var totalVmStatusMap = new Map();

window.window.currentNsId = "";
window.currentMciId = "";
var currentVmId = "";
var currentNodeGroupId = "";
var currentNodeGroupVmId = "";
var currentGroupedVmList = [];
var vmListGroupedByNodeGroup = [];

var mciListTable;
export var checked_array = [];


// initMciTable(); // init tabulator
// initPolicyTable();
//DOMContentLoaded 는 Page에서 1개만.
// init + 파일명 () : ex) initMci() 를 호출하도록 한다.
document.addEventListener("DOMContentLoaded", initMci);

// 해당 화면에서 최초 설정하는 function
//로드 시 prj 값 받아와 getMciList 호출
async function initMci() {
  initMciTable(); // init tabulator

  try {
    webconsolejs["partials/operation/manage/mcicreate"].initMciCreate();

    const targetSection = "mcicreate";
    const createBtnName = "Add Infra";
    webconsolejs['partials/layout/navigatePages'].addPageHeaderButton(targetSection, createBtnName);

    // Add Node(Extend VM) 플로우가 남긴 Data Disk attach pending job 재개 (WEB-TECH-014)
    webconsolejs["partials/operation/manage/mcicreate"].resumePendingDiskAttachJobs();
  } catch (e) {
    console.error(e);
  }

  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject);
  window.currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;

  // URL 파라미터 처리
  const url = window.location.href;
  const urlObj = new URL(url);
  // URLSearchParams 객체 생성
  const params = new URLSearchParams(urlObj.search);
  // mciID 파라미터 값 추출
  var selectedMciID = params.get('mciID');

  //if (selectedMciID != undefined) {
  if (selectedMciID) {
    window.currentMciId = selectedMciID
    toggleRowSelection(selectedMciID)
  }

  refreshMciList();
  const policyTabEl = document.querySelector('a[data-bs-toggle="tab"][href="#tabs-mci-policy"]');
  policyTabEl.addEventListener('shown.bs.tab', function (event) {
    initPolicyPage();
  });
  const nlbTabEl = document.querySelector('a[data-bs-toggle="tab"][href="#tabs-mci-nlb"]');
  nlbTabEl?.addEventListener('shown.bs.tab', function (event) {
    webconsolejs['partials/operation/manage/mcinlb']?.loadMciNlbList(false);
  });

  // 모든 탭 전환 시 선택 상태 초기화
  const allTabElements = document.querySelectorAll('a[data-bs-toggle="tab"]');
  allTabElements.forEach(tabEl => {
    // 탭이 숨겨질 때 이전 탭의 선택 상태 초기화
    tabEl.addEventListener('hidden.bs.tab', function (event) {
      const hiddenTab = event.target.getAttribute('href');
      
      // 숨겨지는 탭의 선택 상태 초기화
      resetTabSelectionStates(hiddenTab);
      
      // Policy 탭이 아닌 다른 탭으로 전환 시 Policy Info 초기화
      if (hiddenTab !== '#tabs-mci-policy') {
        resetPolicyInfoState();
      }
    });
  });
}


// Mci 전체 목록 조회
export async function refreshMciList() {
  if (selectedWorkspaceProject.projectId != "") {
    //getMciList();// project가 선택되어 있으면 mci목록을 조회한다.
    var respMciList = await webconsolejs["common/api/services/infra_api"].getMciList(window.currentNsId);

    await getMciListCallbackSuccess(selectedWorkspaceProject.projectId, respMciList);

  }
}


// getMciList 호출 성공 시
async function getMciListCallbackSuccess(caller, mciList) {

  window.totalMciListObj = mciList.infra;

  // Update label key dropdown with actual keys from MCI data
  updateLabelKeyDropdown();

  // displayMciDashboard();

  if (window.currentMciId) {
    getSelectedMciData();//선택한 mci가 있으면 처리
  }
  refreshDisplay();
}


// data 표시 

function refreshDisplay() {
  setToTalMciStatus(); // mci상태 표시
  setTotalVmStatus(); // mci 의 vm들 상태표시

  // 현재 선택된 행 정보 저장
  const selectedRows = mciListTable.getSelectedData().map(row => row.id);
  const currentSelectedMciId = window.currentMciId;

  mciListTable.setData(window.totalMciListObj);

  // 테이블 데이터 설정 후 선택 상태 복원
  if (currentSelectedMciId && selectedRows.includes(currentSelectedMciId)) {
    setTimeout(() => {
      try {
        mciListTable.selectRow(currentSelectedMciId);
      } catch (error) {
        console.error("Error restoring row selection:", error);
      }
    }, 50);
  }

  if (window.currentMciId) {
    for (var mciIndex in window.totalMciListObj) {
      var aMci = window.totalMciListObj[mciIndex];

      if (window.currentMciId == aMci.id) {
        displayServerStatusList(window.currentMciId, aMci.node)
        break;
      }
    }
  }
}
// table의 특정 row만 갱신
function refreshRowData(rowId, newData) {
  const selectedRows = mciListTable.getSelectedData().map(row => row.id);
  // newData includes the full MCI object (with vm array) so providerFormatter reads correctly
  mciListTable.updateData([{ id: rowId, ...newData }])
    .then(() => {
      // 갱신 후 선택 상태 복원
      mciListTable.deselectRow(); // 기존 선택 해제
      mciListTable.selectRow(selectedRows); // 이전 선택 상태 복원
    })
    .catch(error => {
      console.error("Error updating row data:", error);
    });


  displayServerStatusList(rowId, newData.node)
  displayServerGroupStatusList(rowId, newData.node)
}

// Policy Info 상태 초기화 함수
function resetPolicyInfoState() {
  // Policy Info 숨기기
  const policyInfoElement = document.getElementById("policy_info");
  if (policyInfoElement) {
    webconsolejs["partials/layout/navigatePages"].deactiveElement(policyInfoElement);
  }
  
  // Policy 관련 전역 변수 초기화
  currentClickedmciIdInPolicyTable = "";
  
  // Policy 테이블 선택 해제
  if (policyListTable) {
    policyListTable.deselectRow();
  }
  
  // Policy Info 내용 초기화
  const policyInfoFields = [
    'policy-mciId', 'policy-mciName', 'policy-actionLog',
    'nodegroup-name', 'nodegroup-label', 'nodegroup-size', 'nodegroup-description',
    'nodegroup-currentVmCount', 'nodegroup-minMaxSize',
    'summary-nodegroupSize', 'summary-currentVmCount', 'summary-minMaxSize',
    'policy-type', 'policy-algorithm',
    'condition-metric', 'condition-operator', 'condition-operand',
    'vm-spec', 'vm-os', 'vm-csp', 'vm-disk', 'vm-connection'
  ];
  
  policyInfoFields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.textContent = '-';
    }
  });
  
  // Action Log는 textarea이므로 별도 처리
  const actionLogElement = document.getElementById('policy-actionLog');
  if (actionLogElement) {
    actionLogElement.value = '';
  }
}

// MCI 탭 상태 초기화 함수
function resetMciTabState() {
  // 모든 탭에서 active 클래스 제거
  const allTabLinks = document.querySelectorAll('#mci_info .nav-link');
  allTabLinks.forEach(tabLink => {
    tabLink.classList.remove('active');
  });
  
  // 모든 탭 패널에서 active, show 클래스 제거
  const allTabPanes = document.querySelectorAll('#mci_info .tab-pane');
  allTabPanes.forEach(tabPane => {
    tabPane.classList.remove('active', 'show');
  });
  
  // 첫 번째 탭(Default)을 활성화
  const firstTabLink = document.querySelector('#mci_info .nav-link[href="#tabs-mci-default"]');
  const firstTabPane = document.getElementById('tabs-mci-default');
  
  if (firstTabLink && firstTabPane) {
    firstTabLink.classList.add('active');
    firstTabPane.classList.add('active', 'show');
  }
}

// 탭별 선택 상태 초기화 함수
function resetTabSelectionStates(hiddenTab) {
  
  // 탭 내부 테이블 선택 상태 초기화 (MCI 선택은 유지)
  resetTabInternalTableSelections();
  
  // 숨겨지는 탭에 따라 해당 탭의 선택 상태 초기화
  if (hiddenTab === '#tabs-mci-default') {
    resetDefaultTabSelections();
  } else if (hiddenTab === '#tabs-mci-group') {
    resetGroupTabSelections();
  } else if (hiddenTab === '#tabs-mci-policy') {
    resetPolicyTabSelections();
  } else if (hiddenTab === '#tabs-mci-labels') {
    resetLabelsTabSelections();
  } else if (hiddenTab === '#tabs-mci-nlb') {
    webconsolejs['partials/operation/manage/mcinlb']?.hideDetail();
  }
}

// Default 탭 (VM List) 선택 상태 초기화
function resetDefaultTabSelections() {
  // VM 선택 상태 초기화
  if (typeof currentVmId !== 'undefined') {
    currentVmId = "";
  }
  if (typeof selectedVmId !== 'undefined') {
    selectedVmId = null;
  }
  
  // VM 목록에서 선택된 항목들 초기화
  const vmListItems = document.querySelectorAll('#mci_server_info_box .vmStatus-item');
  vmListItems.forEach(item => {
    item.classList.remove('selected');
  });
  
  // VM 체크박스 상태 초기화
  const vmCheckboxes = document.querySelectorAll('#mci_server_info_box input[type="checkbox"]');
  vmCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // VM 테두리 초기화
  $("#mci_server_info_box li").css("border", "none");
  
  // Server Info 숨기기
  const serverInfoElement = document.getElementById("server_info");
  if (serverInfoElement && serverInfoElement.classList.contains("active")) {
    webconsolejs["partials/layout/navigatePages"].deactiveElement(serverInfoElement);
  }
  
  // 필터 상태 초기화
  const filterCollapse = document.getElementById('filterbody');
  if (filterCollapse && filterCollapse.classList.contains('show')) {
    filterCollapse.classList.remove('show');
  }
  
  // 필터 입력값 초기화
  const filterValue = document.getElementById('filter-value');
  if (filterValue) {
    filterValue.value = '';
  }
}

// Group 탭 선택 상태 초기화
function resetGroupTabSelections() {
  // NodeGroup 선택 상태 초기화
  const nodegroupItems = document.querySelectorAll('#nodegroup_info_box .vmStatus-item');
  nodegroupItems.forEach(item => {
    item.classList.remove('selected');
  });
  
  // Scale Group 설정 collapse 상태 초기화
  const scaleGroupSettings = document.getElementById('scaleGroupSettings');
  if (scaleGroupSettings && scaleGroupSettings.classList.contains('show')) {
    scaleGroupSettings.classList.remove('show');
  }
  
  // Scale Policy 체크 collapse 상태 초기화
  const checkScalePolicySettings = document.getElementById('checkScalePolicySettings');
  if (checkScalePolicySettings && checkScalePolicySettings.classList.contains('show')) {
    checkScalePolicySettings.classList.remove('show');
  }
  
  // Terminal 모달이 열려있다면 닫기
  const terminalModal = document.getElementById('nodegroup-cmdtestmodal');
  if (terminalModal && terminalModal.classList.contains('show')) {
    const modal = bootstrap.Modal.getInstance(terminalModal);
    if (modal) {
      modal.hide();
    }
  }
}

// Policy 탭 선택 상태 초기화
function resetPolicyTabSelections() {
  // Policy 테이블 선택 상태 초기화
  if (typeof window.policyTable !== 'undefined' && window.policyTable) {
    window.policyTable.deselectRow();
  }
  
  // Policy 필터 상태 초기화
  const policyFilterCollapse = document.querySelector('#tabs-mci-policy #filterbody');
  if (policyFilterCollapse && policyFilterCollapse.classList.contains('show')) {
    policyFilterCollapse.classList.remove('show');
  }
  
  // Policy 필터 입력값 초기화
  const policyFilterValue = document.querySelector('#tabs-mci-policy #filter-value');
  if (policyFilterValue) {
    policyFilterValue.value = '';
  }
}

// 탭 내부 테이블 선택 상태 초기화 (MCI 선택은 유지)
function resetTabInternalTableSelections() {
  // Policy 테이블 선택 상태 초기화
  if (typeof window.policyTable !== 'undefined' && window.policyTable) {
    window.policyTable.deselectRow();
  }
  
  // VM 목록 테이블 선택 상태 초기화 (만약 있다면)
  if (typeof window.vmListTable !== 'undefined' && window.vmListTable) {
    window.vmListTable.deselectRow();
  }
  
  // NodeGroup 목록 테이블 선택 상태 초기화 (만약 있다면)
  if (typeof window.nodegroupTable !== 'undefined' && window.nodegroupTable) {
    window.nodegroupTable.deselectRow();
  }
}

// Labels 탭 선택 상태 초기화
function resetLabelsTabSelections() {
  // System Labels 토글 상태 초기화 (기본값으로)
  const showSystemLabels = document.getElementById('showSystemLabels');
  if (showSystemLabels) {
    showSystemLabels.checked = false;
  }
  
  // 라벨 편집 모달이 열려있다면 닫기
  const labelEditorModal = document.querySelector('.modal.show');
  if (labelEditorModal) {
    const modal = bootstrap.Modal.getInstance(labelEditorModal);
    if (modal) {
      modal.hide();
    }
  }
}

// Server Info 탭 상태 초기화 함수
function resetServerTabState() {
  // Server Info 탭에서 모든 탭 링크의 active 클래스 제거
  const serverTabLinks = document.querySelectorAll('#server_info .nav-link');
  serverTabLinks.forEach(tabLink => {
    tabLink.classList.remove('active');
  });
  
  // Server Info 탭에서 모든 탭 패널의 active, show 클래스 제거
  const serverTabPanes = document.querySelectorAll('#server_info .tab-pane');
  serverTabPanes.forEach(tabPane => {
    tabPane.classList.remove('active', 'show');
  });
  
  // 첫 번째 탭(Detail)을 활성화
  const detailTabLink = document.querySelector('#server_info .nav-link[href="#tabs-vm-details"]');
  const detailTabPane = document.getElementById('tabs-vm-details');
  
  if (detailTabLink && detailTabPane) {
    detailTabLink.classList.add('active');
    detailTabPane.classList.add('active', 'show');
  }
}

// NodeGroup VM Info 탭 상태 초기화 함수
function resetNodeGroupVmTabState() {
  // NodeGroup VM Info 탭에서 모든 탭 링크의 active 클래스 제거
  const nodeGroupVmTabLinks = document.querySelectorAll('#nodeGroup_vm_info .nav-link');
  nodeGroupVmTabLinks.forEach(tabLink => {
    tabLink.classList.remove('active');
  });
  
  // NodeGroup VM Info 탭에서 모든 탭 패널의 active, show 클래스 제거
  const nodeGroupVmTabPanes = document.querySelectorAll('#nodeGroup_vm_info .tab-pane');
  nodeGroupVmTabPanes.forEach(tabPane => {
    tabPane.classList.remove('active', 'show');
  });
  
  // 첫 번째 탭(Detail)을 활성화
  const detailTabLink = document.querySelector('#nodeGroup_vm_info .nav-link[href="#tabs-nodegroupvm-details"]');
  const detailTabPane = document.getElementById('tabs-nodegroupvm-details');
  
  if (detailTabLink && detailTabPane) {
    detailTabLink.classList.add('active');
    detailTabPane.classList.add('active', 'show');
  }
}

// 클릭한 mci info 가져오기
// 표에서 선택된 MciId 받아옴
export async function getSelectedMciData() {

  if (window.currentMciId != undefined && window.currentMciId != "") {

    var mciResp = await webconsolejs["common/api/services/infra_api"].getMci(window.currentNsId, window.currentMciId)
    if (mciResp.status.code != 200) {
      webconsolejs["common/utils/toast"].showToast(
        webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR,
        `Infra query failed: ${mciResp.status.message || window.currentMciId}`
      );
      return;
    }

    var mciData = mciResp.responseData;
    // 전체를 관리하는 obj 갱신
    for (var mciIndex in totalMciListObj) {
      var aMci = totalMciListObj[mciIndex];

      if (aMci.id == mciData.id) {
        totalMciListObj[mciIndex] = mciData
        // Set MciTable()
        refreshRowData(mciData.id, mciData);
        break;
      }
    }
    // SET MCIS Info page
    setMciInfoData(mciData)

    // NodeGroup Terminal 버튼 초기 상태 설정
    updateNodeGroupRemoteCmdButtonState();
    
    // MCI Terminal 버튼 상태 설정
    updateMciRemoteCmdButtonState();

    // // Toggle MCIS Info
    // var div = document.getElementById("mci_info");
    // console.log("mciInfo ", div)
    // webconsolejs["partials/layout/navigatePages"].toggleElement(div)
  }
}

// 클릭한 mci의 info값 세팅
function setMciInfoData(mciData) {
  try {

    // window.totalMciListObj에서 최신 데이터(Label 포함) 가져오기
    const currentMci = window.totalMciListObj.find(mci => mci.id === mciData.id);
    if (currentMci) {
      mciData = currentMci; // Label 정보가 포함된 최신 데이터로 교체
    }

    var mciID = mciData.id;
    var mciName = mciData.name;
    var mciDescription = mciData.description;
    var mciStatus = mciData.status;
    // var mciDispStatus = webconsolejs["common/api/services/infra_api"].getMciStatusFormatter(mciStatus);
    // var mciStatusIcon = webconsolejs["common/api/services/infra_api"].getMciStatusIconFormatter(mciDispStatus);
    var mciProviderNames = webconsolejs["common/api/services/infra_api"].getMciInfoProviderNames(mciData); //MCI에 사용 된 provider
    var totalvmCount = (mciData.node || []).length; //mci의 node개수

    var mciStatusCell = "";

    if (mciStatus === "Running") {
      mciStatusCell =
        '<div class="bg-green-lt card" style="border: 0px; display: inline-block; padding: 5px 10px; text-align: left;">' +
        '  <span class="text-green" style="font-size: 12px;">Running</span>' +
        '</div>';
    } else if (mciStatus === "Suspended") {
      mciStatusCell =
        '<div class="card bg-yellow-lt" style="border: 0px; display: inline-block; padding: 5px 10px; text-align: left;">' +
        '  <span class="text-yellow" style="font-size: 12px;">Stopped</span>' +
        '</div>';
    } else if (mciStatus === "Terminated") {
      mciStatusCell =
        '<div class="card bg-muted-lt" style="border: 0px; display: inline-block; padding: 5px 10px; text-align: left;">' +
        '  <span class="text-muted" style="font-size: 12px;">Terminated</span>' +
        '</div>';
    } else if (mciStatus === "Failed") {
      mciStatusCell =
        '<div class="card bg-red-lt" style="border: 0px; display: inline-block; padding: 5px 10px; text-align: left;">' +
        '  <span class="text-red" style="font-size: 12px;">Failed</span>' +
        '</div>';
    } else {
      mciStatusCell =
        '<div class="card bg-muted-lt" style="border: 0px; display: inline-block; padding: 5px 10px; text-align: left;">' +
        '  <span class="text-muted" style="font-size: 12px;">' + mciStatus + '</span>' +
        '</div>';
    }

    $("#mci_info_text").text(" [ " + mciName + " ]")
    $("#mci_server_info_status").empty();
    $("#mci_server_info_status").text(" [ " + mciName + " ]")
    $("#mci_server_info_count").text(" Node(" + totalvmCount + ")")


    // $("#mci_info_status_img").attr("src", "/assets/images/common/" + mciStatusIcon)
    $("#mci_info_name").text(mciName + " / " + mciID)
    $("#mci_info_description").text(mciDescription)
    // $("#mci_info_status").text(mciStatus)
    $("#mci_info_status").empty()
    $("#mci_info_status").append(mciStatusCell)
    $("#mci_info_cloud_connection").empty()
    $("#mci_info_cloud_connection").append(mciProviderNames)

    // Labels 탭 업데이트 (탭이 활성화될 때만 로드)
    // updateMciLabelsTab(mciData);

  } catch (e) {
    console.error(e);
  }
}

// MCI Labels 탭 업데이트
function updateMciLabelsTab(mciData) {
  if (typeof window.displayMciLabels === 'function') {
    const labels = mciData.labels || {};
    window.displayMciLabels(labels);
  }
}

// mci 삭제 — requestId tracker가 progress/결과 toast 담당
export function deleteMci() {
  const deletingMciId = window.currentMciId;
  window.currentMciId = "";
  webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("mci_info"));
  mciListTable.deselectRow();
  executeTrackedRequest(
    () => webconsolejs["common/api/services/infra_api"].mciDelete(deletingMciId, window.currentNsId),
    "Infra deletion failed"
  ).then(() => {
    refreshMciList();
  });
}

// vm 삭제
export function deleteVm() {
  const deletingVmId = currentVmId;
  resetDefaultTabSelections();
  executeTrackedRequest(
    () => webconsolejs["common/api/services/infra_api"].vmDelete(window.currentMciId, window.currentNsId, deletingVmId),
    "Node deletion failed"
  ).then(() => {
    refreshMciList();
  });
}

// requestId 추적 API용: 레거시 "API Processing..." / 즉시 success toast 생략
// (asyncRequestTracker가 GetRequest 기반 progress·결과 toast를 표시)
function executeTrackedRequest(apiCall, errorMessage) {
  return Promise.resolve(apiCall())
    .catch((error) => {
      webconsolejs["common/utils/toast"].showToast(
        webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR,
        errorMessage
      );
      throw error;
    });
}

// 공통 API 호출 래퍼 함수 (Toast 포함) — 짧은 sync 작업용 (template save 등)
function executeWithToast(apiCall, successMessage, errorMessage) {
  // 진행 상태 표시
  webconsolejs["common/utils/toast"].showProgressToast("API", "processing");
  
  return apiCall()
    .then(response => {
      webconsolejs["common/utils/toast"].hideProgressToast();
      webconsolejs["common/utils/toast"].showToast(
        webconsolejs["common/utils/toast"].TOAST_TYPES.SUCCESS, 
        successMessage
      );
      return response;
    })
    .catch(error => {
      webconsolejs["common/utils/toast"].hideProgressToast();
      webconsolejs["common/utils/toast"].showToast(
        webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR, 
        errorMessage
      );
      throw error;
    });
}

// mci life cycle 변경
export function changeMciLifeCycle(type) {
  if (window.currentMciId == undefined || window.currentMciId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Please select an Infra')
    return;
  }
  executeTrackedRequest(
    () => webconsolejs["common/api/services/infra_api"].mciLifeCycle(type, window.currentMciId, window.currentNsId),
    `Infra ${type} failed`
  ).then(() => {
    refreshMciList();
  });
}

// vm life cycle 변경
export function changeVmLifeCycle(type) {
  if (currentVmId == undefined || currentVmId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Please select a Node')
    return;
  }
  if (selectedVmId) {
    executeTrackedRequest(
      () => webconsolejs["common/api/services/infra_api"].vmLifeCycle(type, window.currentMciId, window.currentNsId, selectedVmId),
      `Node ${type} failed`
    ).then(() => {
      refreshMciList();
    });
  }
}

// 노드 스냅샷 → MyImage 생성 모달 오픈
export function openCreateNodeMyImageModal() {
  if (currentVmId == undefined || currentVmId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Please select a Node')
    return;
  }

  // 일부 CSP는 Running 노드에서만 스냅샷 가능(커버리지 실증: IBM) — 안내 후 진행/취소 선택
  const SNAPSHOT_REQUIRES_RUNNING = ["ibm"];
  const infra = (window.totalMciListObj || []).find(m => m.id === window.currentMciId);
  const node = ((infra && infra.node) || []).find(n => n.id === selectedVmId);
  if (node) {
    const provider = (node.connectionConfig && node.connectionConfig.providerName) ||
      String(node.connectionName || "").split("-")[0];
    if (SNAPSHOT_REQUIRES_RUNNING.includes(String(provider).toLowerCase()) &&
        !String(node.status || "").includes("Running")) {
      const proceed = confirm(
        provider.toUpperCase() + " requires the node to be running to create a MyImage.\n" +
        "The current node is not running, so the request may fail.\n" +
        "Continue anyway?"
      );
      if (!proceed) return;
    }
  }

  $("#node-myimage-name").val("");
  $("#node-myimage-desc").val("");
  const modal = new bootstrap.Modal(document.getElementById("node-myimage-modal"));
  modal.show();
}

// Create MyImage 모달 Create 버튼 콜백
export function createNodeMyImage() {
  const imageName = ($("#node-myimage-name").val() || "").trim();
  if (!imageName) {
    webconsolejs["common/utils/toast"].showToast(
      webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR,
      "Please enter a MyImage name"
    );
    return;
  }
  if (!selectedVmId) {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Please select a Node')
    return;
  }
  const description = ($("#node-myimage-desc").val() || "").trim();
  bootstrap.Modal.getInstance(document.getElementById("node-myimage-modal"))?.hide();
  // 산출물은 customImage — 노드 목록 갱신 불필요, 완료/실패는 알림센터로 통지
  executeTrackedRequest(
    () => webconsolejs["common/api/services/infra_api"].createNodeSnapshot(
      window.currentNsId, window.currentMciId, selectedVmId, imageName, description),
    `Create MyImage failed`
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('checkScalePolicy');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    // Policy 탭을 가리키는 <a> 요소
    const policyTabLink = document.querySelector('a[href="#tabs-mci-policy"]');
    if (!policyTabLink) return;
    // Bootstrap Tab 인스턴스 생성/취득 후 show()
    const policyTab = bootstrap.Tab.getOrCreateInstance(policyTabLink);
    policyTab.show();
  });
});


// vm 상태별 icon으로 표시
// Server List / Status VM리스트
// function displayServerStatusList(mciID, vmList) {
//   console.log("displayServerStatusList")

//   var mciName = mciID;
//   var vmLi = "";
//   vmList.sort();
//   for (var vmIndex in vmList) {
//     var aVm = vmList[vmIndex]

//     var vmID = aVm.id;
//     var vmName = aVm.name;
//     var vmStatus = aVm.status;
//     var vmDispStatus = webconsolejs["common/api/services/infra_api"].getVmStatusFormatter(vmStatus); // vmStatus set
//     var vmStatusClass = webconsolejs["common/api/services/infra_api"].getVmStatusStyleClass(vmDispStatus) // vmStatus 별로 상태 색상 set

//     vmLi += '<li id="server_status_icon_' + vmID + '" class="card ' + vmStatusClass + '" onclick="webconsolejs[\'pages/operation/manage/mci\'].vmDetailInfo(\'' + vmID +'\')"><span class="text-dark-fg">' + vmName + '</span></li>';

// //     vmLi += '<div class="form-selectgroup-label d-flex align-items-center p-3">'
// //   '<div class="me-3">'
// //     '<span class="form-selectgroup-check"></span>'
// //   '</div>'

// //   '<div class="form-selectgroup-label-content d-flex align-items-center">'
// //     '<span class="avatar me-3" style="background-image: url(./static/avatars/000m.jpg)"></span>'
// //     '<div>'
// //       '<div class="font-weight-medium">Paweł Kuna</div>'
// //       '<div class="text-secondary">UI Designer</div>'
// //     '</div>'
// //   '</div>'
// // '</div>'
//   }// end of mci loop

//   $("#mci_server_info_box").empty();
//   $("#mci_server_info_box").append(vmLi);

//   // 선택한 vm이 있는 경우 해당 vm의 정보도 갱신한다.
//   if( currentVmId ){
//     vmDetailInfo(currentVmId)
//   }
// }

function displayServerStatusList(mciID, vmList) {
  var mciName = mciID;
  var vmLi = "";
  if (!vmList || vmList.length === 0) {
    $("#mci_server_info_box").empty();
    return;
  }
  vmList.sort();

  vmList.forEach((aVm) => {
    var vmID = aVm.id;
    var vmName = aVm.name;
    var vmStatus = aVm.status;
    var vmDispStatus = webconsolejs["common/api/services/infra_api"].getVmStatusFormatter(vmStatus);
    var vmStatusClass = webconsolejs["common/api/services/infra_api"].getVmStatusStyleClass(vmDispStatus);

    vmLi += `
      <li id="server_status_icon_${vmID}" 
          class="card ${vmStatusClass} d-flex align-items-center" 
          style="display: flex; flex-direction: row; align-items: center; justify-content: center; padding: 5px;" 
          onclick="webconsolejs['pages/operation/manage/mci'].toggleCheck('vm', '${vmID}')">
        
        <input type="checkbox" 
               id="checkbox_vm_${vmID}" 
               class="vm-checkbox" 
               style="width: 20px; height: 20px; margin-right: 10px; flex-shrink: 0;" 
               onchange="webconsolejs['pages/operation/manage/mci'].handleCheck('vm', '${vmID}')" 
               onclick="event.stopPropagation()">
        
        <span class="h3 mb-0 me-2">${vmName}</span>
      </li>
    `;
  });

  $("#mci_server_info_box").empty();
  $("#mci_server_info_box").append(vmLi);

  // 선택한 vm이 있는 경우 해당 vm의 정보도 갱신한다.
  if (currentVmId) {
    webconsolejs['pages/operation/manage/mci'].vmDetailInfo(currentVmId);
  }
}

// nodeGroup 단위로 묶음
function groupByNodeGroup(vmList) {
  const grouped = vmList.reduce((acc, vm) => {
    const key = vm.nodeGroupId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(vm);
    return acc;
  }, {});

  vmListGroupedByNodeGroup = Object.entries(grouped).map(([nodeGroupId, vms]) => ({
    nodeGroupId,
    vms
  }));
  return vmListGroupedByNodeGroup
}

function displayServerGroupStatusList(mciID, vmList) {
  var vmListGroupedByNodeGroup = groupByNodeGroup(vmList);
  var mciName = mciID;
  var vmGroupLi = "";
  vmListGroupedByNodeGroup.forEach(aNodeGroup => {

    var nodeGroupId = aNodeGroup.nodeGroupId
    var vmCount = aNodeGroup.vms.length
    var vmList = aNodeGroup.vms
    var vmGroupStatus = webconsolejs["common/api/services/infra_api"].getVmGroupStatusFormatter(vmList);
    var vmGroupStatusClass = webconsolejs["common/api/services/infra_api"].getVmGroupStatusStyleClass(vmGroupStatus);

    vmGroupLi += `
      <li id="serverGroup_status_icon_${nodeGroupId}" 
          class="card ${vmGroupStatusClass} d-flex align-items-center" 
          style="display: flex; flex-direction: row; align-items: center; justify-content: center; padding: 5px;" 
          onclick="webconsolejs['pages/operation/manage/mci'].toggleCheck('vmGroup', '${nodeGroupId}')">
        
        <input type="checkbox" 
               id="checkbox_vmGroup_${nodeGroupId}" 
               class="vmgroup-checkbox" 
               style="width: 20px; height: 20px; margin-right: 10px; flex-shrink: 0;" 
               onchange="webconsolejs['pages/operation/manage/mci'].handleCheck('vmGroup', '${nodeGroupId}')" 
               onclick="event.stopPropagation()">
        
        <span class="h3 mb-0 me-2">${nodeGroupId}(${vmCount})</span>
      </li>
    `;
  });

  $("#nodegroup_info_box").empty();
  $("#nodegroup_info_box").append(vmGroupLi);

  // 선택한 vm이 있는 경우 해당 vm의 정보도 갱신한다.
  // if (currentVmGroupId) {
  //   webconsolejs['pages/operation/manage/mci'].vmDetailInfo(currentVmGroupId);
  // }
}

// 체크박스를 선택하면 선택된 VM ID 업데이트 (단일 선택)
var selectedVmId = null;
var selectedVmGroupId = null;
var selectedNodeGroupVmId = null;
// 체크박스를 클릭했을 때 선택 상태를 반전시킴
export function toggleCheck(type, id) {

  var checkbox = $(`#checkbox_${type}_${id}`);
  checkbox.prop("checked", !checkbox.prop("checked"));
  handleCheck(type, id);
}

export function handleCheck(type, id) {
  var checkbox = $(`#checkbox_${type}_${id}`);

  if (type === 'vm') {
    if (checkbox.prop("checked")) {
      // 기존 선택된 VM이 있다면 해제
      if (selectedVmId && selectedVmId !== id) {
        $(`#checkbox_vm_${selectedVmId}`).prop("checked", false);
      }
      selectedVmId = id;
      currentVmId = id;
      webconsolejs['pages/operation/manage/mci'].vmDetailInfo(currentVmId);
    } else {
      selectedVmId = null;
      // 선택된 VM이 없다면 ServerInfo를 접음
      clearServerInfo();
      const div = document.getElementById("server_info");
      if (div.classList.contains("active")) {
        webconsolejs["partials/layout/navigatePages"].toggleElement(div);
      }
    }
  } else if (type === 'vmGroup') { // nodegroup

    if (checkbox.prop("checked")) {
      // 같은 항목 재선택인지 확인
      if (selectedVmGroupId === id) {
        // 같은 항목 재선택 - 토글 닫기
        selectedVmGroupId = null;
        currentNodeGroupId = null;
        clearServerInfo();
        const div = document.getElementById("nodegroup_vm");
        if (div.classList.contains("active")) {
          webconsolejs["partials/layout/navigatePages"].toggleElement(div);
        }
        // Server Info도 닫기
        const serverInfoDiv = document.getElementById("nodeGroup_vm_info");
        if (serverInfoDiv && serverInfoDiv.classList.contains("active")) {
          webconsolejs["partials/layout/navigatePages"].toggleElement(serverInfoDiv);
        }
      } else {
        // 다른 항목 선택 - 기존 선택 해제 후 새 항목 선택
        if (selectedVmGroupId && selectedVmGroupId !== id) {
          $(`#checkbox_vmGroup_${selectedVmGroupId}`).prop("checked", false);
        }
        selectedVmGroupId = id;
        currentNodeGroupId = id;
        // Server Info 닫기 (다른 항목 선택 시)
        const serverInfoDiv = document.getElementById("nodeGroup_vm_info");
        if (serverInfoDiv && serverInfoDiv.classList.contains("active")) {
          webconsolejs["partials/layout/navigatePages"].toggleElement(serverInfoDiv);
        }
        vmListInNodeGroup(currentNodeGroupId);
      }
    } else {
      selectedVmGroupId = null;
      currentNodeGroupId = null;
      clearServerInfo();
      // 체크 해제 시 토글 닫기
      const div = document.getElementById("nodegroup_vm");
      if (div.classList.contains("active")) {
        webconsolejs["partials/layout/navigatePages"].toggleElement(div);
      }
      // Server Info도 닫기
      const serverInfoDiv = document.getElementById("nodeGroup_vm_info");
      if (serverInfoDiv && serverInfoDiv.classList.contains("active")) {
        webconsolejs["partials/layout/navigatePages"].toggleElement(serverInfoDiv);
      }
    }
  } else if (type === 'nodegroup_vm') {
    if (checkbox.prop("checked")) {
      // 같은 항목 재선택인지 확인
      if (selectedNodeGroupVmId === id) {
        // 같은 항목 재선택 - 토글 닫기
        selectedNodeGroupVmId = null;
        currentNodeGroupVmId = null;
        clearServerInfo();
        const div = document.getElementById("nodeGroup_vm_info");
        if (div && div.classList.contains("active")) {
          webconsolejs["partials/layout/navigatePages"].toggleElement(div);
        }
      } else {
        // 다른 항목 선택 - 기존 선택 해제 후 새 항목 선택
        if (selectedNodeGroupVmId && selectedNodeGroupVmId !== id) {
          $(`#checkbox_nodegroup_vm_${selectedNodeGroupVmId}`).prop("checked", false);
        }
        selectedNodeGroupVmId = id;
        currentNodeGroupVmId = id;
        webconsolejs['pages/operation/manage/mci'].nodeGroup_vmDetailInfo(currentNodeGroupVmId);
        // Server Info 토글 (c 버튼 역할)
        const div = document.getElementById("nodeGroup_vm_info");
        if (div && !div.classList.contains("active")) {
          webconsolejs["partials/layout/navigatePages"].toggleElement(div);
        }
      }
    } else {
      selectedNodeGroupVmId = null;
      currentNodeGroupVmId = null;
      clearServerInfo();
      // 체크 해제 시 토글 닫기
      const div = document.getElementById("nodeGroup_vm_info");
      if (div && div.classList.contains("active")) {
        webconsolejs["partials/layout/navigatePages"].toggleElement(div);
      }
    }
  }
  // 마지막 선택된 VM 강조 표시
  highlightSelected(type);
  
  // NodeGroup Terminal 버튼 상태 업데이트
  updateNodeGroupRemoteCmdButtonState();
}


function highlightSelected(type) {
  // 모든 li 요소의 테두리 제거

  if (type === 'vm') {
    $("#mci_server_info_box li").css("border", "none");
    if (selectedVmId) {
      $(`#server_status_icon_${selectedVmId}`)
        .css("border", "2px solid blue");
    }
  }
  else if (type === 'vmGroup') {
    $("#nodegroup_info_box li").css("border", "none");
    if (selectedVmGroupId) {
      $(`#serverGroup_status_icon_${selectedVmGroupId}`)
        .css("border", "2px solid blue");
    }
  }
  else if (type === 'nodegroup_vm') {
    $("#nodegroup_vm_info_box li").css("border", "none");
    if (selectedNodeGroupVmId) {
      $(`#nodegroup_vm_status_icon_${selectedNodeGroupVmId}`)
        .css("border", "2px solid blue");
    }
  }
  else {
    alert("error")
  }

  // $("#mci_server_info_box li").css("border", "none");

  // // 마지막 선택된 VM ID에 테두리 추가
  // if (selectedVmIds.length > 0) {
  //   const lastSelectedVmID = selectedVmIds[selectedVmIds.length - 1];
  //   $(`#server_status_icon_${lastSelectedVmID}`).css("border", "2px solid blue");
  // }
}

function vmListInNodeGroup(nodeGroupId) {
  var div = document.getElementById("nodegroup_vm");
  
  // 토글이 닫혀있을 때만 열기
  if (!div.classList.contains("active")) {
    webconsolejs["partials/layout/navigatePages"].toggleElement(div);
  }

  // nodeGroupId의 vmList 정렬
  var groupedVm = vmListGroupedByNodeGroup.find(item => item.nodeGroupId === nodeGroupId);
  var groupedVmList = groupedVm.vms
  currentGroupedVmList = groupedVmList

  var vmLi = "";
  groupedVmList.sort();

  groupedVmList.forEach((aVm) => {
    var vmID = aVm.id;
    var vmName = aVm.name;
    var vmStatus = aVm.status;
    var vmDispStatus = webconsolejs["common/api/services/infra_api"].getVmStatusFormatter(vmStatus);
    var vmStatusClass = webconsolejs["common/api/services/infra_api"].getVmStatusStyleClass(vmDispStatus);

    vmLi += `
      <li id="nodegroup_vm_status_icon_${vmID}" 
          class="card ${vmStatusClass} d-flex align-items-center" 
          style="display: flex; flex-direction: row; align-items: center; justify-content: center; padding: 5px;" 
          onclick="webconsolejs['pages/operation/manage/mci'].toggleCheck('nodegroup_vm', '${vmID}')">
        
        <input type="checkbox" 
               id="checkbox_nodegroup_vm_${vmID}" 
               class="vm-checkbox" 
               style="width: 20px; height: 20px; margin-right: 10px; flex-shrink: 0;" 
               onchange="webconsolejs['pages/operation/manage/mci'].handleCheck('nodegroup_vm', '${vmID}')" 
               onclick="event.stopPropagation()">
        
        <span class="h3 mb-0 me-2">${vmName}</span>
      </li>
    `;
  });

  $("#nodegroup_vm_info_box").empty();
  $("#nodegroup_vm_info_box").append(vmLi);

  // 선택한 vm이 있는 경우 해당 vm의 정보도 갱신한다.
  // if (currentNodeGroupVmId) {
  //   webconsolejs['pages/operation/manage/mci'].vmDetailInfo(currentNodeGroupVmId);
  // }
  // displayServerStatusList(currentMciId, groupedVmList.vms);
}

// Server List / Status VM 리스트에서
// VM 한 개 클릭시 vm의 세부 정보
export async function vmDetailInfo(vmId) {
  currentVmId = vmId
  // Toggle MCIS Info
  var div = document.getElementById("server_info");
  const hasActiveClass = div.classList.contains("active");
  if (!hasActiveClass) {
    webconsolejs["partials/layout/navigatePages"].toggleElement(div)
  }
  
  // Server Info 탭 상태 초기화 (Detail 탭으로 리셋)
  resetServerTabState();

  // get mci vm  
  try {
    var response = await webconsolejs["common/api/services/infra_api"].getMciVm(window.currentNsId, currentMciId, vmId);
    var aVm = response.responseData
    var nodeGroupId = aVm.nodeGroupId
    var cspVMID = aVm.uid
    var responseVmId = response.id;
    // 전체를 관리하는 obj 갱신
    var aMci = {};
    for (var mciIndex in totalMciListObj) {
      aMci = totalMciListObj[mciIndex];

      if (aMci.id == currentMciId) {
        for (var vmIndex in aMci.node) {
          var tempVms = aMci.node
          if (currentVmId == tempVms.id) {
            aMci.node[vmIndex] = aVm;
            break;
          }
        }
        //aMci = totalMciListObj[mciIndex];
        totalMciListObj[mciIndex] = aMci;

        break;
      }
    }
    clearServerInfo();


    if (!aMci || !aMci.node) {
      return;
    }

    var mciName = aMci.name;
    var vmList = aMci.node;

    var vmExist = false;
    var data = new Object();

    for (var vmIndex in vmList) {
      var aVm = vmList[vmIndex];
      if (currentVmId == aVm.id) {
        data = aVm;
        vmExist = true;
        break;
      }
    }

    if (!vmExist) {
      console.error("vm is not exist");
    }
  } catch (error) {
    console.error("Error occurred: ", error);
  }
  var vmId = data.id;
  var vmName = data.name;
  var vmStatus = data.status;
  var vmDescription = data.description;
  var vmPublicIp = data.publicIP == undefined ? "" : data.publicIP;
  var vmSshKeyID = data.sshKeyId;
  var imageId = data.imageId;
  var operatingSystem = "Ubuntu";

  // Architecture 정보만 추출
  var architecture = data.image?.osType || data.image?.osArchitecture || ""
  if (!architecture && data.addtionalDetails && Array.isArray(data.addtionalDetails)) {
    var archDetail = data.addtionalDetails.find(detail => detail.key === "Architecture")
    if (archDetail) {
      architecture = archDetail.value
    }
  }
  var startTime = data.createdTime
  var privateIp = data.privateIP;
  //var securityGroupID = data.securityGroupIds[0];
  var securityGroupID = data.securityGroupIds;
  var providerName = data.connectionConfig.providerName
  var vmProviderIcon = ""
  vmProviderIcon +=
    '<img class="img-fluid" class="rounded" width="80" src="/assets/images/common/img_logo_' +
    (providerName == "" ? "mcmp" : providerName) +
    '.png" alt="' +
    providerName +
    '"/>';

  var vmDispStatus = webconsolejs["common/api/services/infra_api"].getMciStatusFormatter(vmStatus);
  var mciStatusIcon = webconsolejs["common/api/services/infra_api"].getMciStatusIconFormatter(vmDispStatus);

  //vm info
  $("#mci_server_info_status_img").attr("src", "/assets/images/common/" + mciStatusIcon)
  $("#mci_server_info_connection").empty()
  $("#mci_server_info_connection").append(vmProviderIcon)

  $("#server_info_text").text(' [ ' + nodeGroupId + ' / ' + vmName + ' ]')
  $("#server_info_name").text(vmName + "/" + vmId)
  $("#server_info_desc").text(vmDescription)

  // 새로운 구조에 맞게 데이터 설정
  // Row 1: CSP
  $("#server_info_csp").text(providerName)

  // Row 2: Region, Zone, Config Name
  var region = data.region?.region ?? data.region?.Region ?? ''
  var zone = data.region?.zone ?? data.region?.Zone ?? ''
  var connectionName = data.connectionName
  $("#server_info_region").text(region)
  $("#server_info_zone").text(zone)
  $("#server_info_connection_name").text(connectionName)

  // Row 3: VMID, VM Spec, Architecture
  $("#server_info_cspVMID").text(cspVMID)
  $("#server_info_vmspec_name").text(data.cspSpecName)
  $("#server_info_os_arch").text(architecture)

  // Row 4: Public IP + Terminal Button, Private IP
  $("#server_info_public_ip").text(vmPublicIp)
  $("#server_info_private_ip").text(privateIp)

  // Terminal 버튼은 HTML에서 직접 onclick으로 처리됨

  // 기존 코드 유지 (다른 부분에서 사용)
  $("#server_detail_info_public_ip_text").text("Public IP : " + vmPublicIp)
  $("#server_info_public_dns").text(data.publicDNS)
  $("#server_info_private_dns").text(data.privateDNS)

  $("#server_detail_view_public_ip").text(vmPublicIp)
  $("#server_detail_view_public_dns").text(data.publicDNS)
  $("#server_detail_view_private_ip").text(data.privateIP)
  $("#server_detail_view_private_dns").text(data.privateDNS)

  // detail tab
  $("#server_detail_info_text").text(' [' + vmName + '/' + mciName + ']')
  $("#server_detail_view_server_id").text(vmId)
  $("#server_detail_view_server_status").text(vmStatus);
  // $("#server_detail_view_public_dns").text(data.publicDNS)
  // $("#server_detail_view_public_ip").text(vmPublicIp)
  // $("#server_detail_view_private_ip").text(data.privateIP)
  $("#server_detail_view_security_group_text").text(securityGroupID)
  // $("#server_detail_view_private_dns").text(data.privateDNS)
  // $("#server_detail_view_private_ip").text(data.privateIP)
  $("#server_detail_view_image_id").text(imageId)
  $("#server_detail_view_os").text(operatingSystem);
  $("#server_detail_view_user_id_pass").text(data.nodeUserName ? data.nodeUserName + ' / ***' : (data.vmUserAccount ? data.vmUserAccount + ' / ***' : '-'))

  var region = data.region?.region ?? data.region?.Region ?? ''

  var zone = data.region?.zone ?? data.region?.Zone ?? ''

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
  // var vmDetailKeyValueList = vmDetail.KeyValueList
  var addtionalDetails = data.addtionalDetails
  var architecture = data.image?.osType || data.image?.osArchitecture || "";
  var vpcId = ""
  var subnetId = ""

  if (!architecture && addtionalDetails) {
    for (var i = 0; i < addtionalDetails.length; i++) {
      if (addtionalDetails[i].key === "Architecture") {
        architecture = addtionalDetails[i].value;
        break;
      }
    }
  }
  var vpcId = data.cspVNetId
  var subnetId = data.cspSubnetId
  var vmSpecName = data.cspSpecName
  var vpcSystemId = data.vNetId

  var subnetSystemId = data.subnetId
  var eth = data.networkInterface

  $("#server_info_archi").text(architecture)
  // detail tab
  $("#server_detail_view_archi").text(architecture)
  $("#server_detail_view_vpc_id").text(vpcId + "(" + vpcSystemId + ")")
  $("#server_detail_view_subnet_id").text(subnetId + "(" + subnetSystemId + ")")
  $("#server_detail_view_eth").text(eth)
  $("#server_detail_view_root_device_type").text(data.rootDiskType);
  $("#server_detail_view_root_device").text(data.RootDeviceName ?? data.rootDeviceName ?? '');
  $("#server_detail_view_keypair_name").text(data.sshKeyId)
  $("#server_detail_view_access_id_pass").text(data.vmUserName ? data.vmUserName + ' / ***' : '-')


  // server spec
  // var vmSecName = data.VmSpecName
  $("#server_info_vmspec_name").text(vmSpecName)
  $("#server_detail_view_server_spec").text(vmSpecName) // detail tab

  webconsolejs["partials/operation/manage/server_monitoring"].monitoringDataInit()
  await renderBlockDeviceSection('default')
}

export async function nodeGroup_vmDetailInfo(vmId) {
  currentNodeGroupVmId = vmId
  // Server Info는 c 버튼으로만 제어되므로 자동 토글 제거
  // var div = document.getElementById("nodeGroup_vm_info");
  // const hasActiveClass = div.classList.contains("active");
  // if (!hasActiveClass) {
  //   webconsolejs["partials/layout/navigatePages"].toggleElement(div)
  // }

  // NodeGroup VM Info 탭 상태 초기화 (Detail 탭으로 리셋)
  resetNodeGroupVmTabState();

  // get mci vm  
  try {
    var response = await webconsolejs["common/api/services/infra_api"].getMciVm(window.currentNsId, currentMciId, vmId);
    var aVm = response.responseData
    var responseVmId = response.id;
    // 전체를 관리하는 obj 갱신
    var aMci = {};
    for (var mciIndex in totalMciListObj) {
      aMci = totalMciListObj[mciIndex];

      if (aMci.id == currentMciId) {
        for (var vmIndex in aMci.node) {
          var tempVms = aMci.node
          if (currentVmId == tempVms.id) {
            aMci.node[vmIndex] = aVm;
            break;
          }
        }
        //aMci = totalMciListObj[mciIndex];
        totalMciListObj[mciIndex] = aMci;

        break;
      }
    }
    clearServerInfo();


    if (!aMci || !aMci.node) {
      console.error("aMci or nodeList is not defined");
      return;
    }

    var mciName = aMci.name;
    var vmList = aMci.node;

    var vmExist = false;
    var data = new Object();

    for (var vmIndex in vmList) {
      var aVm = vmList[vmIndex];
      if (currentNodeGroupVmId == aVm.id) {
        data = aVm;
        vmExist = true;
        break;
      }
    }

    if (!vmExist) {
      console.error("vm is not exist");
    }
  } catch (error) {
    console.error("Error occurred: ", error);
  }
  var vmId = data.id;
  var vmName = data.name;
  var vmStatus = data.status;
  var vmDescription = data.description;
  var vmPublicIp = data.publicIP == undefined ? "" : data.publicIP;
  var vmSshKeyID = data.sshKeyId;
  var cspVMID = data.uid;

  try {
    var imageId = data.imageId
    // var operatingSystem = await webconsolejs["common/api/services/vmimage_api"].getCommonVmImageInfo(imageId)
    // var operatingSystem = data.imageId
    var operatingSystem = "Ubuntu"
    $("#nodegroup_server_info_os").text(operatingSystem)
  } catch (e) {
    console.error(e)
  }
  var startTime = data.createdTime
  var privateIp = data.privateIP;
  //var securityGroupID = data.securityGroupIds[0];
  var securityGroupID = data.securityGroupIds;
  var providerName = data.connectionConfig.providerName
  var vmProviderIcon = ""
  vmProviderIcon +=
    '<img class="img-fluid" class="rounded" width="80" src="/assets/images/common/img_logo_' +
    (providerName == "" ? "mcmp" : providerName) +
    '.png" alt="' +
    providerName +
    '"/>';
  var vmDispStatus = webconsolejs["common/api/services/infra_api"].getMciStatusFormatter(vmStatus);
  var mciStatusIcon = webconsolejs["common/api/services/infra_api"].getMciStatusIconFormatter(vmDispStatus);

  //vm info
  $("#nodegroup_mci_server_info_status_img").attr("src", "/assets/images/common/" + mciStatusIcon)
  $("#nodegroup_mci_server_info_connection").empty()
  $("#nodegroup_mci_server_info_connection").append(vmProviderIcon)

  // CSP 정보 설정
  $("#nodegroup_server_info_csp").text(providerName)


  $("#nodegroup_server_info_text").text(' [ ' + currentNodeGroupId + ' / ' + vmName + ' ]')
  $("#nodegroup_server_info_name").text(vmName + "/" + vmId)
  $("#nodegroup_server_info_desc").text(vmDescription)

  $("#nodegroup_server_info_start_time").text(startTime)
  $("#nodegroup_server_info_private_ip").text(privateIp)
  // $("#server_info_cspVMID").text(data.cspResourceName)
  $("#nodegroup_server_info_cspVMID").text(cspVMID)

  // ip information
  $("#nodegroup_server_info_public_ip").text(vmPublicIp)
  $("#nodegroup_server_detail_info_public_ip_text").text("Public IP : " + vmPublicIp)
  $("#nodegroup_server_info_public_dns").text(data.publicDNS)
  // $("#server_info_private_ip").val(data.privateIP)
  $("#nodegroup_server_info_private_dns").text(data.privateDNS)

  $("#nodegroup_server_detail_view_public_ip").text(vmPublicIp)
  $("#nodegroup_server_detail_view_public_dns").text(data.publicDNS)
  $("#nodegroup_server_detail_view_private_ip").text(data.privateIP)
  $("#nodegroup_server_detail_view_private_dns").text(data.privateDNS)

  // detail tab
  $("#nodegroup_server_detail_info_text").text(' [' + vmName + '/' + mciName + ']')
  $("#nodegroup_server_detail_view_server_id").text(vmId)
  $("#nodegroup_server_detail_view_server_status").text(vmStatus);
  // $("#server_detail_view_public_dns").text(data.publicDNS)
  // $("#server_detail_view_public_ip").text(vmPublicIp)
  // $("#server_detail_view_private_ip").text(data.privateIP)
  $("#nodegroup_server_detail_view_security_group_text").text(securityGroupID)
  // $("#server_detail_view_private_dns").text(data.privateDNS)
  // $("#server_detail_view_private_ip").text(data.privateIP)
  $("#nodegroup_server_detail_view_image_id").text(imageId)
  $("#nodegroup_server_detail_view_os").text(operatingSystem);
  $("#nodegroup_server_detail_view_user_id_pass").text(data.nodeUserName ? data.nodeUserName + ' / ***' : (data.vmUserAccount ? data.vmUserAccount + ' / ***' : '-'))

  var region = data.region?.region ?? data.region?.Region ?? ''

  var zone = data.region?.zone ?? data.region?.Zone ?? ''

  // connection tab
  var connectionName = data.connectionName
  var credentialName = data.connectionConfig.credentialName
  var driverName = data.connectionConfig.driverName
  var locationInfo = data.location;
  var cloudType = locationInfo.cloudType;

  $("#nodegroup_server_connection_view_connection_name").text(connectionName)
  $("#nodegroup_server_connection_view_credential_name").text(credentialName)
  $("#nodegroup_server_connection_view_csp").text(providerName)
  $("#nodegroup_server_connection_view_driver_name").text(driverName)
  $("#nodegroup_server_connection_view_region").text(providerName + " : " + region)
  $("#nodegroup_server_connection_view_zone").text(zone)

  // region zone locate
  $("#nodegroup_server_info_region").text(providerName + ":" + region)
  $("#nodegroup_server_info_zone").text(zone)


  $("#nodegroup_server_detail_view_region").text(providerName + " : " + region)
  $("#nodegroup_server_detail_view_zone").text(zone)

  // connection name
  var connectionName = data.connectionName;
  $("#nodegroup_server_info_connection_name").text(connectionName)

  var vmDetail = data.cspViewVmDetail;
  // var vmDetailKeyValueList = vmDetail.KeyValueList
  var addtionalDetails = data.addtionalDetails
  var architecture = data.image?.osType || data.image?.osArchitecture || "";
  var vpcId = ""
  var subnetId = ""

  if (!architecture && addtionalDetails) {
    for (var i = 0; i < addtionalDetails.length; i++) {
      if (addtionalDetails[i].key === "Architecture") {
        architecture = addtionalDetails[i].value;
        break;
      }
    }
  }
  var vpcId = data.cspVNetId
  var subnetId = data.cspSubnetId
  var vmSpecName = data.cspSpecName
  var vpcSystemId = data.vNetId

  var subnetSystemId = data.subnetId
  var eth = data.networkInterface

  $("#nodegroup_server_info_archi").text(architecture)
  // detail tab
  $("#nodegroup_server_detail_view_archi").text(architecture)
  $("#nodegroup_server_detail_view_vpc_id").text(vpcId + "(" + vpcSystemId + ")")
  $("#nodegroup_server_detail_view_subnet_id").text(subnetId + "(" + subnetSystemId + ")")
  $("#nodegroup_server_detail_view_eth").text(eth)
  $("#nodegroup_server_detail_view_root_device_type").text(data.rootDiskType);
  $("#nodegroup_server_detail_view_root_device").text(data.RootDeviceName ?? data.rootDeviceName ?? '');
  $("#nodegroup_server_detail_view_keypair_name").text(data.sshKeyId)
  $("#nodegroup_server_detail_view_access_id_pass").text(data.vmUserName ? data.vmUserName + ' / ***' : '-')


  // server spec
  // var vmSecName = data.VmSpecName
  $("#nodegroup_server_info_vmspec_name").text(vmSpecName)
  $("#nodegroup_server_detail_view_server_spec").text(vmSpecName) // detail tab

  webconsolejs["partials/operation/manage/server_monitoring"].monitoringDataInit()
  await renderBlockDeviceSection('group')
}

// ─── Data Disk Attach/Detach (Default 탭 Node Detail + Group 탭 Node Detail 공유) ──

function _diskContext(context) {
  if (context === 'group') {
    return { infraId: window.currentMciId, nodeId: currentNodeGroupVmId, blockDeviceElId: 'nodegroup_block_device_section' }
  }
  return { infraId: window.currentMciId, nodeId: currentVmId, blockDeviceElId: 'block_device_section' }
}

let _attachDiskContext = 'default'

// GetNodeDataDisk는 명세와 달리 이 노드에 "실제 연결된" 것이 아니라 연결 후보군을
// 반환한다(다른 provider 디스크까지 포함되는 것을 확인함). Disks 화면과 동일하게
// associatedObjectList(신뢰 가능한 유일한 소스)로 실제 연결 여부를 판단해
// 두 화면이 항상 같은 기준으로 일치된 정보를 보여주게 한다.
async function renderBlockDeviceSection(context) {
  const { infraId, nodeId, blockDeviceElId } = _diskContext(context)
  const el = document.getElementById(blockDeviceElId)
  if (!el || !infraId || !nodeId) return
  try {
    const diskApi = webconsolejs['common/api/services/disk_api']
    const data = await diskApi.getAllDataDisk(window.currentNsId)
    const allDisks = data?.dataDisk || (Array.isArray(data) ? data : [])
    const nodeSuffix = `/infra/${infraId}/node/${nodeId}`
    const disks = allDisks.filter((d) => (d.associatedObjectList || []).some((ref) => ref.endsWith(nodeSuffix)))
    el.innerHTML = disks.length === 0
      ? '<span class="text-muted">No attached disks</span>'
      : disks.map((d) => `<div class="mb-1">${d.name || d.id}
          <a class="btn btn-sm btn-outline-warning ms-1"
             onclick="webconsolejs['pages/operation/manage/mci'].confirmDetachDisk('${context}','${d.id || d.name}')">Detach</a>
        </div>`).join('')
    el.innerHTML += `<a class="btn btn-sm btn-outline-primary mt-1"
        onclick="webconsolejs['pages/operation/manage/mci'].openAttachDiskModal('${context}')">+ Attach Disk</a>`
  } catch (err) {
    console.error('Block device 조회 실패:', err)
    el.innerHTML = '<span class="text-danger">Failed to load disks</span>'
  }
}

document.getElementById('node-attach-mode-existing')?.addEventListener('change', _toggleAttachDiskMode)
document.getElementById('node-attach-mode-new')?.addEventListener('change', _toggleAttachDiskMode)

function _toggleAttachDiskMode() {
  const isNew = document.getElementById('node-attach-mode-new').checked
  document.getElementById('node-attach-existing-fields').classList.toggle('d-none', isNew)
  document.getElementById('node-attach-new-fields').classList.toggle('d-none', !isNew)
}

export async function openAttachDiskModal(context) {
  const { infraId, nodeId } = _diskContext(context)
  if (!infraId || !nodeId) return
  _attachDiskContext = context

  document.getElementById('node-attach-disk-target').value = `${infraId} / ${nodeId}`
  document.getElementById('node-attach-mode-existing').checked = true
  document.getElementById('node-attach-new-name').value = ''
  document.getElementById('node-attach-new-size').value = ''
  document.getElementById('node-attach-new-type').value = ''
  document.getElementById('node-attach-new-description').value = ''
  _toggleAttachDiskMode()

  const select = document.getElementById('node-attach-disk-select')
  select.innerHTML = '<option value="">Select</option>'
  try {
    const diskApi = webconsolejs['common/api/services/disk_api']
    const mciApi = webconsolejs['common/api/services/infra_api']
    const [allDisks, mciResp] = await Promise.all([
      diskApi.getAllDataDisk(window.currentNsId),
      mciApi.getMci(window.currentNsId, infraId),
    ])
    const disks = allDisks?.dataDisk || (Array.isArray(allDisks) ? allDisks : [])
    const node = (mciResp?.responseData?.node || []).find((n) => n.id === nodeId)
    const nodeProvider = node?.connectionConfig?.providerName
    const nodeRegion = node?.connectionConfig?.regionDetail?.regionName
    for (const d of disks) {
      if ((d.associatedObjectList || []).length > 0) continue // 이미 attach된 디스크 제외
      const diskProvider = d?.connectionConfig?.providerName
      const diskRegion = d?.connectionConfig?.regionDetail?.regionName
      if (nodeProvider && diskProvider !== nodeProvider) continue
      if (nodeRegion && diskRegion !== nodeRegion) continue
      const opt = document.createElement('option')
      opt.value = d.id || d.name
      opt.textContent = d.name || d.id
      select.appendChild(opt)
    }
  } catch (err) {
    console.error('디스크 목록 조회 실패:', err)
  }

  new bootstrap.Modal(document.getElementById('node-attach-disk-modal')).show()
}

export async function executeAttachDiskToNode() {
  const context = _attachDiskContext
  const { infraId, nodeId } = _diskContext(context)
  if (!infraId || !nodeId) return

  const diskApi = webconsolejs['common/api/services/disk_api']
  const isNewMode = document.getElementById('node-attach-mode-new').checked
  const spinner = document.getElementById('node-attach-disk-spinner')
  const btn = document.getElementById('node-attach-disk-execute-btn')
  spinner.classList.remove('d-none')
  btn.disabled = true

  try {
    if (isNewMode) {
      const name = document.getElementById('node-attach-new-name').value.trim()
      const diskSize = parseInt(document.getElementById('node-attach-new-size').value, 10)
      const diskType = document.getElementById('node-attach-new-type').value.trim()
      const description = document.getElementById('node-attach-new-description').value.trim()
      if (!name || !diskSize) {
        webconsolejs['common/utils/toast'].showToast(webconsolejs['common/utils/toast'].TOAST_TYPES.WARNING, 'Disk name and size are required.')
        return
      }
      const body = { name, diskSize }
      if (diskType) body.diskType = diskType
      if (description) body.description = description
      await diskApi.postNodeDataDisk(window.currentNsId, infraId, nodeId, body)
    } else {
      const dataDiskId = document.getElementById('node-attach-disk-select').value
      if (!dataDiskId) {
        webconsolejs['common/utils/toast'].showToast(webconsolejs['common/utils/toast'].TOAST_TYPES.WARNING, 'Please select a disk.')
        return
      }
      await diskApi.attachDataDisk(window.currentNsId, infraId, nodeId, dataDiskId)
    }
    webconsolejs['common/utils/toast'].showToast(webconsolejs['common/utils/toast'].TOAST_TYPES.SUCCESS, 'Disk attached successfully')
    bootstrap.Modal.getInstance(document.getElementById('node-attach-disk-modal'))?.hide()
    await renderBlockDeviceSection(context)
  } catch (err) {
    console.error('Disk Attach 실패:', err)
    const msg = err?.response?.data?.responseData?.message || err?.message || String(err)
    webconsolejs['common/utils/toast'].showToast(webconsolejs['common/utils/toast'].TOAST_TYPES.ERROR, 'Failed to attach disk: ' + msg)
  } finally {
    spinner.classList.add('d-none')
    btn.disabled = false
  }
}

export function confirmDetachDisk(context, dataDiskId) {
  webconsolejs['partials/layout/modal'].commonConfirmModal(
    'commonDefaultModal', 'Detach Disk', `Detach disk "${dataDiskId}"?`,
    'pages/operation/manage/mci.executeDetachDiskFromNode', `${context}|${dataDiskId}`
  )
}

export async function executeDetachDiskFromNode(arg) {
  const [context, dataDiskId] = arg.split('|')
  const { infraId, nodeId } = _diskContext(context)
  try {
    await webconsolejs['common/api/services/disk_api'].detachDataDisk(window.currentNsId, infraId, nodeId, dataDiskId)
    await renderBlockDeviceSection(context)
  } catch (err) {
    console.error('Disk Detach 실패:', err)
    const msg = err?.response?.data?.responseData?.message || err?.message || String(err)
    webconsolejs['common/utils/toast'].showToast(webconsolejs['common/utils/toast'].TOAST_TYPES.ERROR, 'Failed to detach disk: ' + msg)
  }
}

// vm 세부 정보 초기화
function clearServerInfo() {
  $("#server_info_text").text("")
  $("#server_detail_info_text").text("")
  $("#server_detail_view_server_status").val("");
  $("#server_info_name").val("")
  $("#server_info_desc").val("")

  // 새로운 구조 필드들 초기화
  $("#server_info_csp").text("")
  $("#server_info_region").text("")
  $("#server_info_zone").text("")
  $("#server_info_connection_name").text("")
  $("#server_info_cspVMID").text("")
  $("#server_info_vmspec_name").text("")
  $("#server_info_os_arch").text("")
  $("#server_info_public_ip").text("")
  $("#server_info_private_ip").text("")

  // nodegroup 필드들 초기화
  $("#nodegroup_server_info_csp").text("")
  $("#nodegroup_server_info_region").text("")
  $("#nodegroup_server_info_zone").text("")
  $("#nodegroup_server_info_connection_name").text("")
  $("#nodegroup_server_info_cspVMID").text("")
  $("#nodegroup_server_info_vmspec_name").text("")
  $("#nodegroup_server_info_archi").text("")
  $("#nodegroup_server_info_public_ip").text("")
  $("#nodegroup_server_info_private_ip").text("")
  $("#nodegroup_server_info_os").text("")
  $("#nodegroup_server_info_start_time").text("")
  $("#nodegroup_server_info_public_dns").text("")
  $("#nodegroup_server_info_private_dns").text("")

  // ip information
  $("#server_detail_info_public_ip_text").text("")
  $("#server_info_public_dns").val("")
  $("#server_info_private_dns").val("")

  $("#server_detail_view_public_ip").val("")
  $("#server_detail_view_public_dns").val("")
  $("#server_detail_view_private_ip").val("")
  $("#server_detail_view_private_dns").val("")

  $("#manage_mci_popup_public_ip").val("")

  // connection tab
  $("#server_info_csp_icon").empty()
  $("#server_connection_view_csp").val("")
  $("#manage_mci_popup_csp").val("")

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
  // $("#manage_mci_popup_user_name").val("")

  $("#block_device_section").empty()
  $("#nodegroup_block_device_section").empty()
  // $("#attachedDiskList").empty()

  $("#server_detail_view_root_device_type").val("");
  $("#server_detail_view_root_device").val("");
  // $("#server_detail_disk_id").val("");
  // $("#server_detail_disk_mci_id").val("");
  // $("#server_detail_disk_vm_id").val("");

  $("#server_detail_view_security_group").empty()
  $("#server_detail_view_keypair_name").val("")
  $("#server_info_cspVMID").val("")

  // $("#selected_mci_id").val("");
  // $("#selected_vm_id").val("");

  // $("#exportFileName").val("");
  // $("#exportScript").val("");
}

// mci 상태 표시
function setToTalMciStatus() {
  try {
    for (var mciIndex in totalMciListObj) {
      var aMci = totalMciListObj[mciIndex];

      var aMciStatusCountMap = webconsolejs["common/api/services/infra_api"].calculateMciStatusCount(aMci);
      totalMciStatusMap.set(aMci.id, aMciStatusCountMap);
    }
  } catch (e) {
  }
  // 마지막 갱신 시각 표시
  const updatedAt = new Date().toLocaleTimeString();
  const el = document.getElementById("mci_status_updated_at");
  if (el) el.textContent = updatedAt;

  displayMciStatusArea();
}

// Mci 목록에서 vmStatus만 처리 : 화면표시는 display function에서
// vm 상태 표시
function setTotalVmStatus() {
  try {
    for (var mciIndex in totalMciListObj) {
      var aMci = totalMciListObj[mciIndex];
      //console.log("aMci : ", aMci);
      var vmStatusCountMap = webconsolejs["common/api/services/infra_api"].calculateVmStatusCount(aMci);
      totalVmStatusMap.set(aMci.id, vmStatusCountMap);
    }
  } catch (e) {
  }
  displayVmStatusArea();
}
// mci status display
function displayMciStatusArea() {
  var sumMciCnt = 0;
  var sumMciRunningCnt = 0;
  var sumMciRunningIngCnt = 0;
  var sumMciStoppedCnt = 0;
  var sumMciStoppedIngCnt = 0;
  var sumMciTerminateCnt = 0;
  var sumMciTerminateIngCnt = 0;
  var sumMciFailedCnt = 0;
  var sumMciEtcCnt = 0;

  // 각 상태 합산
  totalMciStatusMap.forEach((value, key) => {
    if (value instanceof Map) {
      // 각 상태 가져오기 (값이 없으면 기본값 0)
      const statusRunning = value.get("running") || 0;
      const statusRunningIng = value.get("running-ing") || 0;
      const statusStopped = value.get("stopped") || 0;
      const statusStoppedIng = value.get("stopped-ing") || 0;
      const statusTerminate = value.get("terminated") || 0;
      const statusTerminateIng = value.get("terminated-ing") || 0;
      const statusFailed = value.get("failed") || 0;
      const statusEtc = value.get("etc") || 0;

      // 누적 계산
      sumMciRunningCnt += statusRunning;
      sumMciRunningIngCnt += statusRunningIng;
      sumMciStoppedCnt += statusStopped;
      sumMciStoppedIngCnt += statusStoppedIng;
      sumMciTerminateCnt += statusTerminate;
      sumMciTerminateIngCnt += statusTerminateIng;
      sumMciFailedCnt += statusFailed;
      sumMciEtcCnt += statusEtc;
    } else {
      console.warn(`Invalid value for key ${key}:`, value);
    }
  });

  // 전체 MCI 수 계산
  sumMciCnt =
    sumMciRunningCnt +
    sumMciStoppedCnt +
    sumMciTerminateCnt +
    sumMciFailedCnt +
    sumMciEtcCnt;

  // DOM 업데이트
  $("#total_mci").text(sumMciCnt);
  $("#mci_status_running").text(
    sumMciRunningIngCnt > 0
      ? `${sumMciRunningCnt}(${sumMciRunningIngCnt})`
      : `${sumMciRunningCnt}`
  );
  $("#mci_status_stopped").text(
    sumMciStoppedIngCnt > 0
      ? `${sumMciStoppedCnt}(${sumMciStoppedIngCnt})`
      : `${sumMciStoppedCnt}`
  );
  $("#mci_status_terminated").text(
    sumMciTerminateIngCnt > 0
      ? `${sumMciTerminateCnt}(${sumMciTerminateIngCnt})`
      : `${sumMciTerminateCnt}`
  );
  $("#mci_status_failed").text(sumMciFailedCnt);
  $("#mci_status_etc").text(sumMciEtcCnt);

}

// vm 상태값 표시
function displayVmStatusArea() {

  let sumVmCnt = 0;
  let sumVmRunningCnt = 0;
  let sumVmRunningIngCnt = 0;
  let sumVmStoppedCnt = 0;
  let sumVmStoppedIngCnt = 0;
  let sumVmTerminatedCnt = 0;
  let sumVmTerminatedIngCnt = 0;
  let sumVmEtcCnt = 0;
  totalVmStatusMap.forEach((value, key) => {
    if (value instanceof Map) {
      // 기본 상태
      const statusRunning = value.get("running") || 0;
      const statusStopped = value.get("suspended") || 0;
      const statusTerminated = value.get("terminated") || 0;

      // 진행 중 상태
      const statusRunningIng = value.get("running-ing") || 0;
      const statusStoppedIng = value.get("stopped-ing") || 0;
      const statusTerminatedIng = value.get("terminated-ing") || 0;

      // 기타 상태
      const statusEtc = value.get("etc") || 0;

      // 합산
      sumVmRunningCnt += statusRunning;
      sumVmRunningIngCnt += statusRunningIng;
      sumVmStoppedCnt += statusStopped;
      sumVmStoppedIngCnt += statusStoppedIng;
      sumVmTerminatedCnt += statusTerminated;
      sumVmTerminatedIngCnt += statusTerminatedIng;
      sumVmEtcCnt += statusEtc;
    } else {
      console.warn(`Invalid value for key ${key}:`, value);
    }
  });

  // 전체 VM 수 계산
  sumVmCnt =
    sumVmRunningCnt +
    sumVmStoppedCnt +
    sumVmTerminatedCnt +
    sumVmEtcCnt;

  // DOM 업데이트
  $("#total_vm").text(sumVmCnt);
  $("#vm_status_running").text(
    sumVmRunningIngCnt > 0
      ? `${sumVmRunningCnt}(${sumVmRunningIngCnt})`
      : `${sumVmRunningCnt}`
  );
  $("#vm_status_stopped").text(
    sumVmStoppedIngCnt > 0
      ? `${sumVmStoppedCnt}(${sumVmStoppedIngCnt})`
      : `${sumVmStoppedCnt}`
  );
  $("#vm_status_terminated").text(
    sumVmTerminatedIngCnt > 0
      ? `${sumVmTerminatedCnt}(${sumVmTerminatedIngCnt})`
      : `${sumVmTerminatedCnt}`
  );
  $("#vm_status_etc").text(sumVmEtcCnt);

}


////////////////////////////////////////////////////// TABULATOR Start //////////////////////////////////////////////////////
// tabulator 행, 열, 기본값 설정
// table이 n개 가능하므로 개별 tabulator 정의 : 원리 util 안에 setTabulator있음.
function setMciTabulator(
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
function initMciTable() {
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
      title: "Status",
      field: "status",
      formatter: statusFormatter,
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      headerSort: false,
      maxWidth: 100,
    },
    {
      title: "Id",
      field: "id",
      vertAlign: "middle",
      hozAlign: "center",
    },
    {
      title: "System Label",
      field: "systemLabel",
      visible: false
    },
    {
      title: "Name",
      field: "name",
      vertAlign: "middle",
      hozAlign: "center",
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
      title: "Total Nodes",
      field: "statusCount.countTotal",
      vertAlign: "middle",
      hozAlign: "center",
      maxWidth: 150,
    },
    {
      title: "Running",
      field: "statusCount.countRunning",
      formatterParams: { status: "running" },
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      maxWidth: 135,
    },
    {
      title: "Suspended",
      field: "statusCount.countSuspended",
      formatterParams: { status: "stop" },
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      maxWidth: 135,
    },
    {
      title: "Terminated",
      field: "statusCount.countTerminated",
      formatterParams: { status: "terminate" },
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      maxWidth: 135,
    },
    {
      title: "Failed",
      field: "statusCount.countFailed",
      formatterParams: { status: "failed" },
      vertAlign: "middle",
      hozAlign: "center",
      headerHozAlign: "center",
      maxWidth: 135,
    },
  ];

  //mciListTable = webconsolejs["common/util"].setTabulator("mcilist-table", tableObjParams, columns);// TODO [common/util]에 정의되어 있는데 호출하면 에러남... why?
  mciListTable = setMciTabulator("mcilist-table", tableObjParams, columns, false);
  // 행 클릭 시
  mciListTable.on("rowClick", function (e, row) {
    // var tempcurmciID = row.getCell("id").getValue();
    var tempcurmciID = row.getCell("id").getValue();
    if (tempcurmciID === window.currentMciId) {
      webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("mci_info"))
      window.currentMciId = ""
      this.deselectRow();
      // MCI 선택 해제 시 Policy Info도 초기화
      resetPolicyInfoState();
      return
    } else {
      // 기존 선택 해제 후 새 행 선택
      this.deselectRow();
      this.selectRow(tempcurmciID);
      
      window.currentMciId = tempcurmciID;
      webconsolejs['partials/operation/manage/mcinlb']?.resetForMciSwitch();
      // MCI 변경 시 이전 VM 선택 상태 초기화
      currentVmId = "";
      selectedVmId = null;
      
      // Server Info 숨기기 (이전 MCI의 VM 정보가 표시되지 않도록)
      const serverInfoElement = document.getElementById("server_info");
      if (serverInfoElement && serverInfoElement.classList.contains("active")) {
        webconsolejs["partials/layout/navigatePages"].deactiveElement(serverInfoElement);
      }
      
      webconsolejs["partials/layout/navigatePages"].activeElement(document.getElementById("mci_info"))
      // 표에서 선택된 MCISInfo 
      // MCI 선택 변경 시 Policy Info 및 탭 상태 초기화
      resetPolicyInfoState();
      resetMciTabState();
      getSelectedMciData()
      return
    }
    //   webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("mci_info"))
    //   currentMciId = ""
    //   this.deselectRow();
    //   return
    // } else {
    //   currentMciId = tempcurmciID;
    //   webconsolejs["partials/layout/navigatePages"].activeElement(document.getElementById("mci_info"))
    //   //this.deselectRow();
    //   //this.selectRow(currentMciId);
    //   // 표에서 선택된 MCIInfo 
    //   getSelectedMciData()
    //   return
    // }
  });


  //  선택된 여러개 row에 대해 처리
  // mciListTable.on("rowSelectionChanged", function (data, rows) {
  //   checked_array = data
  //   console.log("checked_array", checked_array)
  //   console.log("rowsrows", data)
  //   selectedMciObj = data
  // });
  // displayColumn(table);
}

// toggleSelectBox of table row
function toggleRowSelection(id) {
  // mciListTable에서 데이터 찾기
  var row = mciListTable.getRow(id);
  if (row) {
    row.select();
  } else {
  }
}

// 상태값을 table에서 표시하기 위해 감싸기
function statusFormatter(cell) {
  const mciDispStatus = webconsolejs["common/api/services/infra_api"].getMciStatusFormatter(
    cell.getData().status
  ); // 화면 표시용 status

  let mciStatusCell = "";

  if (mciDispStatus === "running") {
    mciStatusCell = `
      <div class="bg-green-lt card" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 90px; height: 25px;">
        <span class="text-green" style="font-size: 12px;">Running</span>
      </div>`;
  } else if (mciDispStatus === "running-ing") {
    mciStatusCell = `
      <div class="bg-green-lt card" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 90px; height: 25px;">
        <span class="text-green" style="font-size: 12px;">Starting…</span>
      </div>`;
  } else if (mciDispStatus === "stopped") {
    mciStatusCell = `
      <div class="bg-yellow-lt card" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 90px; height: 25px;">
        <span class="text-yellow" style="font-size: 12px;">Stopped</span>
      </div>`;
  } else if (mciDispStatus === "stopped-ing") {
    mciStatusCell = `
      <div class="bg-yellow-lt card" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 90px; height: 25px;">
        <span class="text-yellow" style="font-size: 12px;">Stopping…</span>
      </div>`;
  } else if (mciDispStatus === "terminated") {
    mciStatusCell = `
      <div class="bg-muted-lt card" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 90px; height: 25px;">
        <span class="text-muted" style="font-size: 12px;">Terminated</span>
      </div>`;
  } else if (mciDispStatus === "terminated-ing") {
    mciStatusCell = `
      <div class="bg-muted-lt card" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 90px; height: 25px;">
        <span class="text-muted" style="font-size: 12px;">Terminating…</span>
      </div>`;
  } else if (mciDispStatus === "failed") {
    mciStatusCell = `
      <div class="bg-red-lt card" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 90px; height: 25px;">
        <span class="text-red" style="font-size: 12px;">Failed</span>
      </div>`;
  } else if (mciDispStatus === "etc") {
    mciStatusCell = `
      <div class="bg-azure-lt card" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 90px; height: 25px;">
        <span class="text-azure" style="font-size: 12px;">ETC</span>
      </div>`;
  } else {
    mciStatusCell = `
      <div class="bg-muted-lt card" style="border: 0px; display: flex; align-items: center; justify-content: center; width: 90px; height: 25px;">
        <span class="text-muted" style="font-size: 12px;">${mciDispStatus || 'Unknown'}</span>
      </div>`;
  }

  return mciStatusCell;
}

// provider를 table에서 표시하기 위해 감싸기
function providerFormatter(data) {
  var vmCloudConnectionMap = webconsolejs["common/api/services/infra_api"].calculateConnectionCount(
    data.getData().node
  );
  var mciProviderCell = "";
  vmCloudConnectionMap.forEach((value, key) => {
    mciProviderCell +=
      '<img class="img-fluid" class="rounded" width="30" src="/assets/images/common/img_logo_' +
      (key == "" ? "mcmp" : key) +
      '.png" alt="' +
      key +
      '"/>';
  });

  return mciProviderCell;
}

// provider를 string으로 추출
// table에서 provider 이름으로 필터링 하기 위해
function providerFormatterString(data) {

  var vmCloudConnectionMap = webconsolejs["common/api/services/infra_api"].calculateConnectionCount(
    data.getData().node
  );

  var mciProviderCell = "";
  vmCloudConnectionMap.forEach((value, key) => {
    mciProviderCell += key + ", "
  });

  // Remove the trailing comma and space
  if (mciProviderCell.length > 0) {
    mciProviderCell = mciProviderCell.slice(0, -2);
  }

  return mciProviderCell;
}

// scale group size 버튼 토글 기능
(function () {
  const toggleBtn = document.getElementById('scaleGroupToggle');
  const collapseEl = document.getElementById('scaleGroupSettings');
  const formListUl = document.getElementById('scaleGroupFormList');
  const listBox = document.getElementById('nodegroup_info_box');
  if (!toggleBtn || !collapseEl || !formListUl || !listBox) return;

  // collapse 수동 인스턴스
  const bsCollapse = new bootstrap.Collapse(collapseEl, { toggle: false });

  toggleBtn.addEventListener('click', function (e) {

    // 토글 열려있으면 닫기
    if (collapseEl.classList.contains('show')) {
      bsCollapse.hide();
      toggleBtn.setAttribute('aria-expanded', 'false');
      return;
    }
    // 0개, 1개만 체크 검증
    const checkedBoxes = listBox.querySelectorAll('input[type="checkbox"]:checked');
    if (checkedBoxes.length !== 1) {
      e.preventDefault();
      e.stopImmediatePropagation();
      alert(checkedBoxes.length === 0
        ? 'Please select NodeGroup first'
        : 'Please select only one NodeGroup');
      return;
    }

    // 1개 선택됐을때
    const chk = checkedBoxes[0];
    const groupId = chk.value;
    const vmCount = currentGroupedVmList.length
    let targetCount = 1;  // 숫자박스 초기값
    formListUl.innerHTML = '';

    // 컨트롤용 li 생성
    const li = document.createElement('li');
    li.className = 'd-flex align-items-center';

    // - 버튼
    const btnMinus = document.createElement('button');
    btnMinus.type = 'button';
    btnMinus.className = 'btn btn-outline-secondary btn-sm';
    btnMinus.textContent = '–';
    btnMinus.addEventListener('click', () => {
      if (targetCount > 1) {
        targetCount--;
        inputBox.value = targetCount;
      }
    });
    li.appendChild(btnMinus);

    // 숫자박스
    const inputBox = document.createElement('input');
    inputBox.type = 'text';
    inputBox.readOnly = true;
    inputBox.className = 'form-control mx-2 text-center';
    inputBox.style.width = '60px';
    inputBox.value = targetCount;
    li.appendChild(inputBox);

    // + 버튼
    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'btn btn-outline-secondary btn-sm';
    btnPlus.textContent = '+';
    btnPlus.addEventListener('click', () => {
      targetCount++;
      inputBox.value = targetCount;
    });
    li.appendChild(btnPlus);

    // OK 버튼
    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.className = 'btn btn-primary btn-sm ms-3';
    btnOk.textContent = 'Apply';
    btnOk.addEventListener('click', () => {
      var numVMsToAdd = parseInt(inputBox.value, 10)
      
      // fire-and-forget: requestId tracker가 ScaleOut progress/결과 toast 표시
      webconsolejs["common/api/services/infra_api"].postScaleOutNodeGroup(window.currentNsId, currentMciId, currentNodeGroupId, numVMsToAdd);
    });
    li.appendChild(btnOk);
    
    // 설명 텍스트 추가
    const explanationText = document.createElement('span');
    explanationText.className = 'ms-2 text-muted small';
    explanationText.textContent = '(Nodes to add)';
    li.appendChild(explanationText);

    formListUl.appendChild(li);
    bsCollapse.show();
    toggleBtn.setAttribute('aria-expanded', 'true');
  });
})();

/////////////////////////Tabulator Filter start/////////////////////////
//Define variables for input elements
var fieldEl = document.getElementById("filter-field");
var typeEl = document.getElementById("filter-type");
var valueEl = document.getElementById("filter-value");

// Label filter elements (label-filter-key는 제거됨)
var labelKeyEl = null; // 제거된 요소
var labelTypeEl = document.getElementById("label-filter-type");
var labelValueEl = document.getElementById("label-filter-value");

// 요소가 존재하지 않을 경우를 대비한 안전성 검사
if (!labelTypeEl) {
  console.warn('label-filter-type element not found');
}
if (!labelValueEl) {
  console.warn('label-filter-value element not found');
}

// Update label key dropdown with actual keys from MCI data
function updateLabelKeyDropdown() {
  const keys = new Set();
  
  // Collect all unique label keys from MCI data
  Object.values(window.totalMciListObj || {}).forEach(mci => {
    if (mci.label && typeof mci.label === 'object') {
      Object.keys(mci.label).forEach(key => {
        // Exclude system labels (sys.*)
        if (!key.startsWith('sys.')) {
          keys.add(key);
        }
      });
    }
  });
  
  // Label key dropdown이 제거되었으므로 이 기능은 비활성화
  // const select = document.getElementById('label-filter-key');
  // select.innerHTML = '<option value="">Select key...</option>';
  
  // Sort keys alphabetically and add to dropdown
  // Array.from(keys).sort().forEach(key => {
  //   const option = document.createElement('option');
  //   option.value = key;
  //   option.textContent = key;
  //   select.appendChild(option);
  // });
  
}

// Label filtering function
function labelFilter(data) {
  const labelKey = labelKeyEl ? labelKeyEl.value.trim() : '';
  const labelType = labelTypeEl ? labelTypeEl.value : '';
  const labelValue = labelValueEl ? labelValueEl.value.trim() : '';
  
  
  // 둘 다 비어있으면 필터링하지 않음
  if (!labelKey && !labelValue) {
    return true;
  }
  
  // MCI의 label 정보가 있는지 확인
  if (!data.label || typeof data.label !== 'object') {
    return false;
  }
  
  // Key만 있는 경우: 해당 키가 존재하는지 확인
  if (labelKey && !labelValue) {
    const hasKey = data.label.hasOwnProperty(labelKey);
    return hasKey;
  }
  
  // Value만 있는 경우: 사용자 정의 label 값에서만 검사 (시스템 label 제외)
  if (!labelKey && labelValue) {
    const userLabelValues = Object.entries(data.label)
      .filter(([key]) => !key.startsWith('sys.'))
      .map(([key, value]) => value);
    
    const filterValue = labelValue.toLowerCase();
    let hasMatch = false;
    
    switch (labelType) {
      case 'like':
        hasMatch = userLabelValues.some(value => 
          value.toString().toLowerCase().includes(filterValue)
        );
        break;
      case '=':
        hasMatch = userLabelValues.some(value => 
          value.toString().toLowerCase() === filterValue
        );
        break;
      case '!=':
        hasMatch = userLabelValues.some(value => 
          value.toString().toLowerCase() !== filterValue
        );
        break;
      default:
        hasMatch = userLabelValues.some(value => 
          value.toString().toLowerCase().includes(filterValue)
        );
    }
    
    return hasMatch;
  }
  
  // Key와 Value 모두 있는 경우: 연산자에 따른 매치 확인
  if (labelKey && labelValue) {
    if (!data.label.hasOwnProperty(labelKey)) {
      return false;
    }
    
    const actualValue = data.label[labelKey].toString().toLowerCase();
    const filterValue = labelValue.toLowerCase();
    
    switch (labelType) {
      case 'like':
        return actualValue.includes(filterValue);
      case '=':
        return actualValue === filterValue;
      case '!=':
        return actualValue !== filterValue;
      default:
        return actualValue.includes(filterValue);
    }
  }
  
  return true;
}

// table rovider filtering / equel 고정
function providerFilter(data) {

  // case type like, equal, not eual
  // equal only
  if (typeEl.value == "=") {
    var vmCloudConnectionMap = webconsolejs["common/api/services/infra_api"].calculateConnectionCount(
      data.node
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
    mciListTable.setFilter(filter, typeVal, valueEl.value);
  }
}

// Label filter update function
function updateLabelFilter() {
  const labelKey = labelKeyEl ? labelKeyEl.value.trim() : '';
  const labelValue = labelValueEl ? labelValueEl.value.trim() : '';
  
  
  // Label 필터가 설정되어 있으면 적용
  if (labelKey || labelValue) {
    mciListTable.setFilter(labelFilter);
  } else {
    // Label 필터가 비어있으면 제거
    mciListTable.removeFilter(labelFilter);
  }
}

// Update filters on value change
const filterField = document.getElementById("filter-field");
const filterType = document.getElementById("filter-type");
const filterValue = document.getElementById("filter-value");

if (filterField) {
  filterField.addEventListener("change", updateFilter);
} else {
  console.warn('filter-field element not found');
}

if (filterType) {
  filterType.addEventListener("change", updateFilter);
} else {
  console.warn('filter-type element not found');
}

if (filterValue) {
  filterValue.addEventListener("keyup", updateFilter);
} else {
  console.warn('filter-value element not found');
}

// Update label filters on value change (label-filter-key는 제거됨)
const labelFilterKey = document.getElementById("label-filter-key");
const labelFilterType = document.getElementById("label-filter-type");
const labelFilterValue = document.getElementById("label-filter-value");

if (labelFilterKey) {
  labelFilterKey.addEventListener("change", updateLabelFilter);
} else {
  console.warn('label-filter-key element not found (removed)');
}

// 기존 Tabulator 필터 이벤트 리스너 제거 (새로운 Label Filter 시스템과 충돌 방지)
// if (labelFilterType) {
//   labelFilterType.addEventListener("change", updateLabelFilter);
// } else {
//   console.warn('label-filter-type element not found');
// }

// Label 필터는 keyup 이벤트 제거 - keypress만 사용 (Enter 키만 허용)
// if (labelFilterValue) {
//   labelFilterValue.addEventListener("keyup", updateLabelFilter);
// } else {
//   console.warn('label-filter-value element not found');
// }

// Clear filters on "Clear Filters" button click
const filterClearBtn = document.getElementById("filter-clear");
if (filterClearBtn) {
  filterClearBtn.addEventListener("click", function () {
    if (fieldEl) fieldEl.value = "name";
    if (typeEl) typeEl.value = "like";
    if (valueEl) valueEl.value = "";
    if (mciListTable) mciListTable.clearFilter();
  });
} else {
  console.warn('filter-clear button not found');
}

// Clear label filters on "Clear Label Filters" button click
const clearBtn = document.getElementById("label-filter-clear");
if (clearBtn) {
  clearBtn.addEventListener("click", function () {
    if (labelKeyEl) labelKeyEl.value = "";
    if (labelTypeEl) labelTypeEl.value = "like";
    if (labelValueEl) labelValueEl.value = "";
    if (mciListTable) mciListTable.removeFilter(labelFilter);
  });
} else {
  console.warn('label-filter-clear button not found');
}
/////////////////////////Tabulator Filter END/////////////////////////

////////////////////////////////////////////////////// END TABULATOR ///////////////////////////////////////////////////
////////////////////////////////////////////////////// POLICY ///////////////////////////////////////////////////
// import { TabulatorFull as Tabulator } from "tabulator-tables";
var policyListTable;
var currentClickedmciIdInPolicyTable = "";
let selectedPolicies = [];

export function initPolicyPage() {
  initPolicyTable();
  loadPolicyData();
}

// Tabulator 테이블 초기화
function initPolicyTable() {

  var columns = [
    {
      formatter: "rowSelection", titleFormatter: "rowSelection", vertAlign: "middle", hozAlign: "center",        // headerHozAlign: "center",
      width: 60,
    },
    { title: "Infra Name", field: "mciName", width: 120 },
    { title: "Infra ID", field: "mciId", width: 120 },
    { title: "NodeGroup Size", field: "nodeGroupSize", width: 120 },
    { title: "Condition", field: "condition", width: 150 },
    { title: "Period(s)", field: "evaluationPeriod", width: 100 },
    { title: "Action", field: "actionType", width: 100 },
    { title: "Status", field: "status", width: 120 },

    // 숨길 컬럼들
    { title: "Action Log", field: "actionLog", visible: false },
    { title: "Description", field: "description", visible: false },
    { title: "Placement Algo", field: "placementAlgo", visible: false },
    { title: "Command", field: "command", visible: false },
    { title: "User Name", field: "userName", visible: false },
    { title: "Common Image", field: "commonImage", visible: false },
    { title: "Common Spec", field: "commonSpec", visible: false },
    { title: "Connection Name", field: "connectionName", visible: false },
    { title: "Node Description", field: "vmDescription", visible: false },
    { title: "Label", field: "label", visible: false },
    { title: "Node Name", field: "vmName", visible: false },
    { title: "Root Disk Size", field: "rootDiskSize", visible: false },
    { title: "Root Disk Type", field: "rootDiskType", visible: false },
    { title: "Metric", field: "metric", visible: false },
    { title: "Operator", field: "operator", visible: false },
    { title: "Operand", field: "operand", visible: false },


  ];
  policyListTable = new Tabulator("#policy-table", {
    layout: "fitColumns",
    selectable: true,
    columns: columns,
    rowClick: onPolicyRowClick,
    rowSelectionChanged: onPolicySelectionChanged,
  });
  loadPolicyData();
  policyListTable.on("rowClick", function (e, row) {
    var tempcurMciIDInPolicyTable = currentClickedmciIdInPolicyTable
    currentClickedmciIdInPolicyTable = row.getCell("mciId").getValue();
    if (tempcurMciIDInPolicyTable === currentClickedmciIdInPolicyTable) {
      webconsolejs["partials/layout/navigatePages"].deactiveElement(document.getElementById("policy_info"))
      currentClickedmciIdInPolicyTable = ""
      this.deselectRow();
      return
    } else {
      webconsolejs["partials/layout/navigatePages"].activeElement(document.getElementById("policy_info"))
      this.deselectRow();
      this.selectRow(currentClickedmciIdInPolicyTable);
      // var selectedData = this.getSelectedData();
      var selectedData = row.getData();

      setPolicyInfoData(selectedData)
      return
    }

  })

  policyListTable.on("rowSelectionChanged", function (data, rows) {
    selectedPolicies = data
  })

}

function setPolicyInfoData(selectedPolicyData) {
  var policy = selectedPolicyData;
  // --- MCI Info ---
  document.getElementById('policy-mciId').textContent = policy.mciId || '-';
  document.getElementById('policy-mciName').textContent = policy.mciName || '-';
  document.getElementById('policy-actionLog').textContent = policy.actionLog || '-';

  // --- NodeGroup Info ---
  // Name: using VM name as nodegroup display name
  document.getElementById('nodegroup-name').textContent = policy.vmName || '-';
  // Label: createdBy label (or stringify full label object)
  document.getElementById('nodegroup-label').textContent = policy.label?.createdBy || JSON.stringify(policy.label) || '-';
  document.getElementById('nodegroup-size').textContent = policy.nodeGroupSize || '-';
  document.getElementById('nodegroup-description').textContent = policy.description || '-';
  // current VM count & min/max size – if you have those values in your context, substitute them here
  document.getElementById('nodegroup-currentVmCount').textContent = policy.currentVmCount ?? '-';
  document.getElementById('nodegroup-minMaxSize').textContent = policy.minMaxSize || '-';

  // --- MCI Scale Summary ---
  document.getElementById('summary-nodegroupSize').textContent = policy.nodeGroupSize || '-';
  document.getElementById('summary-currentVmCount').textContent = policy.currentVmCount ?? '-';
  document.getElementById('summary-minMaxSize').textContent = policy.minMaxSize || '-';

  // --- MCI Scale Policy Info ---
  document.getElementById('policy-type').textContent = policy.actionType || '-';
  document.getElementById('policy-algorithm').textContent = policy.placementAlgo || '-';

  // --- MCI Scale Condition Info ---
  document.getElementById('condition-metric').textContent = policy.metric || '-';
  document.getElementById('condition-operator').textContent = policy.operator || '-';
  document.getElementById('condition-operand').textContent = policy.operand || '-';

  // --- Policy VM Item ---
  document.getElementById('vm-spec').textContent = policy.commonSpec || '-';
  document.getElementById('vm-os').textContent = policy.commonImage || '-';
  document.getElementById('vm-disk').textContent = policy.rootDiskSize
    ? `${policy.rootDiskSize}GB (${policy.rootDiskType})`
    : '-';
  // CSP: extract provider from commonSpec (e.g. "aws")
  document.getElementById('vm-csp').textContent = policy.commonSpec
    ? policy.commonSpec.split('+')[0]
    : '-';
  document.getElementById('vm-connection').textContent = policy.connectionName || '-';
}

// 정책 데이터 조회
async function loadPolicyData() {
  try {
    var responseData = await webconsolejs['common/api/services/infra_api'].getPolicyList(window.currentNsId);
    var transformedData = transformPolicyResponse(responseData);
    setPolicyTableData(transformedData);
  } catch (err) {
    console.error('Policy load error:', err);
  }
}

// API 응답을 테이블 형식으로 가공
function transformPolicyResponse(resp) {
  const list = [];
  resp.infraPolicy.forEach(mci => {
    const { Id: mciId, Name: mciName, actionLog, description } = mci;

    mci.policy.forEach(pol => {
      const {
        autoAction = {},
        autoCondition = {},
        status = ''
      } = pol;

      const {
        actionType = '',
        placementAlgo = '',
        postCommands = [],
        nodeGroupDynamicReq = {}
      } = autoAction;

      // postCommands는 다단계 phase 배열(cb-tumblebug v0.12.29+).
      // 현재 화면은 단일 명령만 표시하므로 첫 phase를 읽는다.
      const {
        command = [],
        userName = ''
      } = (postCommands[0] || {});

      const {
        imageId: commonImage = '',
        specId: commonSpec = '',
        description: vmDescription = '',
        label = {},
        name: vmName = '',
        nodeGroupSize = ''
      } = nodeGroupDynamicReq;
      
      // API 응답에 없는 필드들은 기본값으로 설정
      const connectionName = '';
      const rootDiskSize = '';
      const rootDiskType = '';

      const {
        metric = '',
        operator = '',
        operand = '',
        evaluationPeriod = '',
        evaluationValue = ''
      } = autoCondition;

      const condition = `${metric} ${operator} ${operand}`.trim();

      list.push({
        // MCI 레벨
        mciId,
        mciName,
        actionLog,
        description,

        // Auto Action 레벨
        actionType,
        placementAlgo,
        command,
        userName,

        // VM Dynamic Req 레벨
        commonImage,
        commonSpec,
        connectionName,
        vmDescription,
        label,
        vmName,
        rootDiskSize,
        rootDiskType,
        nodeGroupSize,

        // Auto Condition 레벨
        condition,
        metric,
        operator,
        operand,
        evaluationPeriod,
        evaluationValue,

        // 정책 상태
        status
      });
    });
  });

  return list;
}

// 테이블에 데이터 세팅
function setPolicyTableData(data) {
  policyListTable.setData(data);
}

// 단일 행 클릭 이벤트
function onPolicyRowClick(e, row) {
  const policy = row.getData();
  showPolicyDetail(policy);
}

// 선택된 행 변경 시
function onPolicySelectionChanged(data, rows) {
  selectedPolicies = data;
}

// 상세 보기 폼에 데이터 바인딩
export function showPolicyDetail(policy) {
  // TODO: 폼 요소에 policy 객체 내용을 채워넣기
  document.getElementById('policy-form-mciId').value = policy.mciId;
  document.getElementById('policy-form-metric').value = policy.metric;
  // ...
}

// 선택된 정책 삭제
export async function deletePolicy() {
  if (selectedPolicies.length === 0) {
    alert('Please select a policy to delete.');
    return;
  }

  try {
    await webconsolejs['common/api/services/infra_api'].deletePolicy(window.currentNsId, currentMciId);
    
    alert("Policy deletion completed.");

    // Policy 목록 새로고침
    await loadPolicyData();

    // 현재 선택된 MCI가 있으면 해당 MCI를 다시 선택 (Policy 탭에서 이미 선택된 상태 유지)
    if (window.currentMciId && mciListTable) {
      try {
        const row = mciListTable.getRow(window.currentMciId);
        if (row) {
          // MCI 선택 상태 유지
          var tempcurmciID = row.getCell("id").getValue();
          window.currentMciId = tempcurmciID;
          
          // mci_info 요소가 이미 활성화되어 있는지 확인하고 필요시 활성화
          const mciInfoElement = document.getElementById("mci_info");
          if (mciInfoElement && !mciInfoElement.classList.contains('active')) {
            // 다른 섹션들을 먼저 비활성화
            document.querySelectorAll('.section').forEach(section => {
              section.classList.remove('active');
            });
            // mci_info 섹션 활성화
            mciInfoElement.classList.add('active');
            // 강제로 표시되도록 스타일 설정
            mciInfoElement.style.display = 'block';
            mciInfoElement.style.visibility = 'visible';
            mciInfoElement.style.opacity = '1';
          }
          
          getSelectedMciData();
        }
      } catch (error) {
        console.error("Error selecting MCI:", error);
      }
    }

  } catch (error) {
    console.error("Error deleting policy:", error);
    alert("Error deleting policy occurred.");
  }
}


////////////////////////////////////////////////////// END POLICY ///////////////////////////////////////////////////






/////////////////// TEST TERMINAL MODAL /////////////////////////

export async function initremotecmdModal(target) {
  const nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject().NsId
  
  if (target === 'vm'){
    currentVmId = currentVmId;
  }else if (target === 'nodegroupvm'){
    currentVmId = currentNodeGroupVmId;
  }
  
  await webconsolejs["partials/operation/manage/remotecmd"].initTerminal('xterm-container', nsId, currentMciId, currentVmId, 'vm') // vmStatus 별로 상태 색상 set
  const modalElement = document.getElementById('cmdtestmodal');
  const modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}

export async function initNodeGroupRemoteCmdModal() {
  const nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject().NsId
  
  // 현재 선택된 NodeGroup이 있는지 확인
  if (!currentNodeGroupId) {
    if (selectedVmGroupId) {
      currentNodeGroupId = selectedVmGroupId;
    } else {
      alert("Please select a NodeGroup first.");
      return;
    }
  }
  
  try {
    // 새로운 단발성 명령어 실행 방식으로 초기화
    await webconsolejs["partials/operation/manage/remotecmd"].initBatchCommandTerminal('nodegroup-xterm-container', nsId, currentMciId, currentNodeGroupId, 'nodegroup');
    
    const modalElement = document.getElementById('nodegroup-cmdtestmodal');
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    } else {
      alert("Modal element not found");
    }
  } catch (error) {
    alert("Error initializing terminal: " + error.message);
  }
}

export async function initMciRemoteCmdModal() {
  const nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject().NsId
  
  // 현재 선택된 MCI가 있는지 확인
  if (!currentMciId) {
    alert("Please select an Infra first.");
    return;
  }
  
  try {
    // 새로운 단발성 명령어 실행 방식으로 초기화
    await webconsolejs["partials/operation/manage/remotecmd"].initBatchCommandTerminal('mci-xterm-container', nsId, currentMciId, currentMciId, 'mci');
    
    const modalElement = document.getElementById('mci-cmdtestmodal');
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    } else {
      alert("Modal element not found");
    }
  } catch (error) {
    alert("Error initializing terminal: " + error.message);
  }
}


export async function getKeypair(el) {
  const sshkeyId = el.innerText
  $("#keypairModal-bodytitle").text(sshkeyId);
  var respSSHkey = await webconsolejs["common/api/services/infra_api"].getsshkey(window.currentNsId, sshkeyId);
  $("#keypairModal-textarea").val(respSSHkey.privateKey);
}

// Policy 배포 함수
export async function deployPolicy() {
  try {

    // Policy 데이터 수집
    const policyData = collectPolicyData();

    // 데이터 검증
    if (!validatePolicyData(policyData)) {
      return;
    }

    // API 요청 데이터 구성
    const requestData = buildPolicyRequestData(policyData);

    // API 호출
    const response = await webconsolejs["common/api/services/infra_api"].createPolicy(
      window.currentNsId,
      window.currentMciId,
      requestData.policy
    );


    // 성공 처리 - 응답 구조를 더 유연하게 확인
    if (response && (
      (response.status && response.status.code === 200) ||
      (response.data && response.data.status && response.data.status.code === 200) ||
      (response.statusCode === 200) ||
      (response.data && response.data.statusCode === 200)
    )) {
      alert("Policy creation completed.");

      // Policy 목록 새로고침
      await loadPolicyData();

      // Policy 생성 폼 섹션을 닫기
      const addPolicySection = document.querySelector('#addpolicy');
      if (addPolicySection && addPolicySection.classList.contains('active')) {
        webconsolejs["partials/layout/navigatePages"].toggleElement(addPolicySection);
      }

      // 현재 선택된 MCI가 있으면 해당 MCI를 다시 선택
      if (window.currentMciId && mciListTable) {
        try {
          const row = mciListTable.getRow(window.currentMciId);
          if (row) {
            // 강제로 MCI 선택 상태로 만들기
            var tempcurmciID = row.getCell("id").getValue();
            window.currentMciId = tempcurmciID;
            
            // mci_info 요소를 직접 활성화
            const mciInfoElement = document.getElementById("mci_info");
            if (mciInfoElement) {
              // 다른 섹션들을 먼저 비활성화
              document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
              });
              // mci_info 섹션 활성화
              mciInfoElement.classList.add('active');
              // 강제로 표시되도록 스타일 설정
              mciInfoElement.style.display = 'block';
              mciInfoElement.style.visibility = 'visible';
              mciInfoElement.style.opacity = '1';
            }
            
            getSelectedMciData();
          }
        } catch (error) {
          console.error("Error selecting MCI:", error);
        }
      }

      // Policy 탭으로 이동
      setTimeout(() => {
        const policyTabLink = document.querySelector('a[href="#tabs-mci-policy"]');
        if (policyTabLink) {
          try {
            const tab = new bootstrap.Tab(policyTabLink);
            tab.show();
          } catch (error) {
            console.error("Error moving to policy tab:", error);
          }
        }
      }, 500);
    } else {
      throw new Error("Failed to create policy.");
    }

  } catch (error) {
    console.error("Error deploying policy:", error);
    alert("Error deploying policy occurred: " + error.message);
  }
}



// Policy 데이터 수집
function collectPolicyData() {
  return {
    // AutoAction 데이터
    actionType: "ScaleOut", // 기본값
    placementAlgo: $("#policy_ep_placementAlgo").val() || "random",
    command: $("#policy_ep_command").val() || "",
    userName: $("#policy_ep_username").val() || "",

    // VM Dynamic Request 데이터
    commonImage: $("#policy_ep_commonImageId").val() || "",
    commonSpec: $("#policy_ep_commonSpecId").val() || "",
    connectionName: $("#policy_ep_connectionName").val() || "",
    description: $("#policy_ep_description").val() || "",
    name: $("#policy_ep_name").val() || "",
    rootDiskSize: $("#policy_ep_root_disk_size").val() || "",
    rootDiskType: $("#policy_ep_root_disk_type").val() || "",
    nodeGroupSize: $("#policy_ep_vm_add_cnt").val() || "1",

    // AutoCondition 데이터
    evaluationPeriod: $("#policy_ep_evaluationPeriod").val() || "10",
    metric: $("#policy_ep_metric").val() || "",
    operand: $("#policy_ep_operand").val() || "",
    operator: $("#policy_ep_operator").val() || ""
  };
}

// Operator 값 정규화 함수
function normalizeOperator(operator) {
  // Unicode 이스케이프된 문자들을 일반 문자로 변환
  const operatorMap = {
    "\\u003e": ">",
    "\\u003c": "<",
    "\\u003e\\u003d": ">=",
    "\\u003c\\u003d": "<=",
    "\\u003d\\u003d": "==",
    "\\u0021\\u003d": "!="
  };
  
  // 이미 정규화된 경우 그대로 반환
  if (operator === ">" || operator === "<" || operator === ">=" || 
      operator === "<=" || operator === "==" || operator === "!=") {
    return operator;
  }
  
  // Unicode 이스케이프된 경우 변환
  return operatorMap[operator] || operator;
}

// Policy 데이터 검증
function validatePolicyData(data) {
  const requiredFields = [
    { field: 'commonSpec', name: 'Spec' },
    { field: 'commonImage', name: 'Image' },
    { field: 'connectionName', name: 'Connection' },
    { field: 'metric', name: 'Metric' },
    { field: 'operator', name: 'Operator' },
    { field: 'operand', name: 'Operand' }
  ];

  for (const required of requiredFields) {
    if (!data[required.field] || data[required.field].trim() === "") {
      alert(`${required.name} field is required.`);
      return false;
    }
  }

  return true;
}

// Policy API 요청 데이터 구성
function buildPolicyRequestData(data) {
  return {
    policy: [{
      autoAction: {
        actionType: data.actionType,
        placementAlgo: data.placementAlgo,
        // 명령이 있을 때만 phase 1개로 전송 (cb-tumblebug v0.12.29+ postCommands 배열 구조)
        ...(data.command ? {
          postCommands: [{ command: [data.command], userName: data.userName || "cb-user" }]
        } : {}),
        nodeGroupDynamicReq: {
          imageId: data.commonImage,
          specId: data.commonSpec,
          connectionName: data.connectionName,
          description: data.description,
          label: {
            "env": "test",
            "role": "worker"
          },
          name: data.name,
          rootDiskSize: data.rootDiskSize,
          rootDiskType: data.rootDiskType,
          nodeGroupSize: data.nodeGroupSize
        }
      },
      autoCondition: {
        evaluationPeriod: data.evaluationPeriod,
        metric: data.metric,
        operand: data.operand,
        operator: normalizeOperator(data.operator)
      },
      status: "active"
    }]
  };
}

// NodeGroup Terminal 버튼 상태 업데이트
function updateNodeGroupRemoteCmdButtonState() {
  // _nodegroupvm_status.html에 있는 NodeGroup Terminal 버튼 찾기
  const nodeGroupRemoteCmdBtn = document.querySelector('#nodegroup_vm .card-actions a[onclick*="initNodeGroupRemoteCmdModal"]');
  if (nodeGroupRemoteCmdBtn) {
    if (selectedVmGroupId) {
      nodeGroupRemoteCmdBtn.classList.remove('disabled');
      nodeGroupRemoteCmdBtn.style.pointerEvents = 'auto';
      nodeGroupRemoteCmdBtn.title = 'Connect to selected NodeGroup';
    } else {
      nodeGroupRemoteCmdBtn.classList.add('disabled');
      nodeGroupRemoteCmdBtn.style.pointerEvents = 'none';
      nodeGroupRemoteCmdBtn.title = 'Please select a NodeGroup first';
    }
  }
}

// MCI Terminal 버튼 상태 업데이트
function updateMciRemoteCmdButtonState() {
  const mciRemoteCmdBtn = document.querySelector('a[onclick*="initMciRemoteCmdModal"]');
  if (mciRemoteCmdBtn) {
    if (currentMciId) {
      mciRemoteCmdBtn.classList.remove('disabled');
      mciRemoteCmdBtn.style.pointerEvents = 'auto';
      mciRemoteCmdBtn.title = 'Connect to selected Infra';
    } else {
      mciRemoteCmdBtn.classList.add('disabled');
      mciRemoteCmdBtn.style.pointerEvents = 'none';
      mciRemoteCmdBtn.title = 'Please select an Infra first';
    }
  }
}

// Label 관련 함수들

// Label Editor 모달 열기
export function openLabelEditorModal(resourceType, resourceId, resourceName) {
  
  // 현재 MCI의 uid 찾기
  const currentMci = window.totalMciListObj.find(mci => mci.id === resourceId);
  const uid = currentMci ? currentMci.uid : resourceId;
  
  // 모달 제목 설정
  document.getElementById('label-editor-title').innerText = `${resourceName} - Edit Labels`;
  
  // 현재 Label 조회 (uid 사용)
  loadLabelsForEditor(resourceType, uid);
  
  // 모달 표시
  const modal = new bootstrap.Modal(document.getElementById('label-editor-modal'));
  modal.show();
}

// Label Editor에서 Label 조회
async function loadLabelsForEditor(labelType, uid) {
  try {
    const response = await webconsolejs["common/api/services/infra_api"].getLabels(labelType, uid);
    
    if (response && response.data && response.data.responseData) {
      const labels = response.data.responseData.labels || {};
      // 원본 Label 데이터를 전역 변수에 저장 (삭제 비교용)
      window.originalLabels = { ...labels };
      // 모달용 라벨 데이터도 저장 (토글 시 재사용)
      window.editorLabels = { ...labels };
      displayLabelsInEditor(labels);
    } else {
      // Label이 없는 경우 빈 상태로 표시
      window.originalLabels = {};
      window.editorLabels = {};
      displayLabelsInEditor({});
    }
  } catch (error) {
    console.error("Error loading labels:", error);
    window.originalLabels = {};
    window.editorLabels = {};
    displayLabelsInEditor({});
  }
}

// 모달 내에서 System 라벨 토글 함수
function toggleSystemLabelsInEditor() {
  
  // 현재 저장된 라벨 데이터가 있는지 확인
  if (window.editorLabels) {
    displayLabelsInEditor(window.editorLabels);
  } else {
    // 현재 선택된 리소스 정보로 다시 로드
    const currentMci = window.totalMciListObj.find(mci => mci.id === window.currentMciId);
    const uid = currentMci ? currentMci.uid : null;
    if (uid) {
      loadLabelsForEditor('mci', uid);
    }
  }
}

// Label Editor에 Label 표시
function displayLabelsInEditor(labels) {
  const container = document.getElementById('label-editor-content');
  container.innerHTML = '';
  
  // 라벨을 system 라벨과 사용자 라벨로 분류
  const allLabels = Object.entries(labels);
  const systemLabels = allLabels.filter(([key]) => key.startsWith('sys.'));
  const userLabels = allLabels.filter(([key]) => !key.startsWith('sys.'));
  
  // 현재 토글 상태 확인
  const showSystemLabels = document.getElementById('showSystemLabelsInEditor')?.checked || false;
  
  // 표시할 라벨 결정
  const labelsToShow = showSystemLabels ? allLabels : userLabels;
  
  // 기존 Label들 표시
  labelsToShow.forEach(([key, value], index) => {
    const labelRow = createLabelRow(key, value, index);
    container.appendChild(labelRow);
  });
  
  // 빈 행 하나 추가 (새 Label 추가용)
  const emptyRow = createLabelRow('', '', 'new');
  container.appendChild(emptyRow);
}

// Label 행 생성
function createLabelRow(key, value, index) {
  const row = document.createElement('div');
  row.className = 'row mb-2';
  row.setAttribute('data-index', index);
  
  // system 라벨인지 확인
  const isSystemLabel = key.startsWith('sys.');
  const keyInputClass = isSystemLabel ? 'form-control label-key bg-light' : 'form-control label-key';
  const valueInputClass = isSystemLabel ? 'form-control label-value bg-light' : 'form-control label-value';
  const isReadonly = isSystemLabel ? 'readonly' : '';
  
  row.innerHTML = `
    <div class="col-md-4">
      <input type="text" class="${keyInputClass}" placeholder="Key" value="${key}" ${isReadonly}>
    </div>
    <div class="col-md-4">
      <input type="text" class="${valueInputClass}" placeholder="Value" value="${value}" ${isReadonly}>
    </div>
    <div class="col-md-4">
      <button type="button" class="btn btn-outline-danger remove-label" ${index === 'new' || isSystemLabel ? 'style="display:none"' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="10" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M4 7l16 0"></path>
          <path d="M10 11l0 6"></path>
          <path d="M14 11l0 6"></path>
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
        </svg>
      </button>
    </div>
  `;
  
  return row;
}

// Label Editor 이벤트 리스너 설정
function setupLabelEditorEvents() {
  // Label 삭제 버튼 이벤트
  document.addEventListener('click', function(e) {
    if (e.target.closest('.remove-label')) {
      const row = e.target.closest('.row');
      row.remove();
    }
  });
  
  // 새 Label 행 추가 이벤트
  document.addEventListener('input', function(e) {
    if (e.target.classList.contains('label-key') || e.target.classList.contains('label-value')) {
      const row = e.target.closest('.row');
      const isNewRow = row.getAttribute('data-index') === 'new';
      
      if (isNewRow && (e.target.value.trim() !== '')) {
        // 새 행이 입력되면 또 다른 빈 행 추가
        const container = document.getElementById('label-editor-content');
        const existingNewRow = container.querySelector('[data-index="new"]');
        if (existingNewRow === row) {
          const newEmptyRow = createLabelRow('', '', 'new');
          container.appendChild(newEmptyRow);
          row.setAttribute('data-index', Date.now()); // 고유 인덱스 부여
        }
      }
    }
  });
}

// Label 저장
export async function saveLabels() {
  const container = document.getElementById('label-editor-content');
  const rows = container.querySelectorAll('.row');
  
  const labels = {};
  let hasValidLabels = false;
  
  rows.forEach(row => {
    const keyInput = row.querySelector('.label-key');
    const valueInput = row.querySelector('.label-value');
    
    if (keyInput && valueInput) {
      const key = keyInput.value.trim();
      const value = valueInput.value.trim();
      
      if (key && value) {
        labels[key] = value;
        hasValidLabels = true;
      }
    }
  });
  
  try {
    // 현재 선택된 리소스 정보 가져오기
    const labelType = 'mci';
    const currentMci = window.totalMciListObj.find(mci => mci.id === window.currentMciId);
    const uid = currentMci ? currentMci.uid : null;
    
    if (!uid) {
      alert('Please select a resource.');
      return;
    }
    
    // 삭제된 Label 찾기 (원본에 있지만 현재 UI에 없는 것들)
    const originalLabels = window.originalLabels || {};
    const deletedLabels = [];
    
    for (const key in originalLabels) {
      if (!labels.hasOwnProperty(key)) {
        // 시스템 라벨(sys.로 시작)은 삭제하지 않음
        if (!key.startsWith('sys.')) {
          deletedLabels.push(key);
        }
      }
    }
    
    // 삭제된 Label들을 먼저 삭제
    for (const key of deletedLabels) {
      try {
        const deleteResponse = await webconsolejs["common/api/services/infra_api"].removeLabel(labelType, uid, key);
        
        if (deleteResponse && deleteResponse.data && deleteResponse.data.status && deleteResponse.data.status.code === 200) {
        } else {
          console.warn(`Failed to delete label: ${key}`, deleteResponse);
        }
      } catch (deleteError) {
        console.error(`Error deleting label ${key}:`, deleteError);
      }
    }
    
    // 시스템 라벨을 현재 저장할 라벨에 추가 (원본에서 가져옴)
    const finalLabels = { ...labels };
    
    // 시스템 라벨들을 최종 라벨에 포함
    for (const key in originalLabels) {
      if (key.startsWith('sys.')) {
        finalLabels[key] = originalLabels[key];
      }
    }
    
    // 현재 Label들 저장 (추가/수정)
    if (hasValidLabels || Object.keys(finalLabels).length > 0) {
      const response = await webconsolejs["common/api/services/infra_api"].createOrUpdateLabel(labelType, uid, finalLabels);
      
      if (response && response.data && response.data.status && response.data.status.code === 200) {
      } else {
        console.error('Failed to save labels:', response);
        alert('Failed to save labels.');
        return;
      }
    }
    
    // 성공 메시지 표시
    if (deletedLabels.length > 0 && hasValidLabels) {
      alert(`${deletedLabels.length} labels were deleted and ${Object.keys(labels).length} labels were saved.`);
    } else if (deletedLabels.length > 0) {
      alert(`${deletedLabels.length} labels were deleted.`);
    } else if (hasValidLabels) {
      alert('Labels were successfully saved.');
    } else {
      alert('No changes were made.');
      return;
    }
    
    // 모달 닫기
    const modal = bootstrap.Modal.getInstance(document.getElementById('label-editor-modal'));
    modal.hide();
    
    // 목록 새로고침
    if (typeof refreshMciList === 'function') {
      refreshMciList();
    }
    
    // 화면 전환 로직 추가 (Policy UI Navigation 패턴 참조)
    await handleLabelSaveNavigation();
    
  } catch (error) {
    console.error("Error saving labels:", error);
    alert('Error saving labels occurred.');
  }
}

// 새 Label 행 추가 함수 (전역 함수로 등록)
window.addNewLabelRow = function() {
  const container = document.getElementById('label-editor-content');
  const newRow = createLabelRow('', '', 'new');
  container.appendChild(newRow);
};




// Label 저장 후 화면 전환 처리 함수 (Policy UI Navigation 패턴 참조)
async function handleLabelSaveNavigation() {
  try {
    // 1. 현재 선택된 MCI를 다시 선택하여 상태 복원
    if (window.currentMciId && window.mciListTable) {
      try {
        const row = window.mciListTable.getRow(window.currentMciId);
        if (row) {
          var tempcurmciID = row.getCell("id").getValue();
          window.currentMciId = tempcurmciID;
          
          // mci_info 요소를 직접 활성화
          const mciInfoElement = document.getElementById("mci_info");
          if (mciInfoElement) {
            // 다른 섹션들을 먼저 비활성화
            document.querySelectorAll('.section').forEach(section => {
              section.classList.remove('active');
            });
            // mci_info 섹션 활성화
            mciInfoElement.classList.add('active');
            // 강제로 표시되도록 스타일 설정
            mciInfoElement.style.display = 'block';
            mciInfoElement.style.visibility = 'visible';
            mciInfoElement.style.opacity = '1';
          }
          
          // MCI 데이터 새로고침
          if (typeof getSelectedMciData === 'function') {
            getSelectedMciData();
          }
        }
      } catch (error) {
        console.error("MCI selection error:", error);
      }
    }

    // 2. Labels 탭으로 이동
    setTimeout(() => {
      const labelsTabLink = document.querySelector('a[href="#tabs-mci-labels"]');
      if (labelsTabLink) {
        try {
          const tab = new bootstrap.Tab(labelsTabLink);
          tab.show();
          
          // 3. Labels 탭 내용 새로고침
          setTimeout(() => {
            if (typeof loadMciLabels === 'function') {
              loadMciLabels();
            }
          }, 100);
        } catch (error) {
          console.error("Error moving to labels tab:", error);
        }
      }
    }, 500);
  } catch (error) {
    console.error("Error saving labels and navigating to screen:", error);
  }
}

// Label Editor 초기화
document.addEventListener('DOMContentLoaded', function() {
  setupLabelEditorEvents();
  setupLabelFilterEvents();
});

// Label Filter 이벤트 설정
function setupLabelFilterEvents() {
  // Type 변경 시 placeholder 업데이트
  const typeSelect = document.getElementById('label-filter-type');
  const valueInput = document.getElementById('label-filter-value');
  
  if (typeSelect && valueInput) {
    typeSelect.addEventListener('change', function() {
      updateValuePlaceholder();
    });
    
    // Enter 키로 필터 적용 (다른 키 입력 시 즉시 필터링 방지)
    valueInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyLabelFilter();
      }
    });
  } else {
    console.warn('Label filter elements not found. Type select:', !!typeSelect, 'Value input:', !!valueInput);
  }
  
  // Clear 버튼
  const clearBtn = document.getElementById('label-filter-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      clearLabelFilter();
    });
  } else {
    console.warn('Label filter clear button not found');
  }
  
  // Apply 버튼 (Enter 키 대신 사용)
  const applyBtn = document.getElementById('label-filter-apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', function() {
      applyLabelFilter();
    });
  } else {
    console.warn('Label filter apply button not found');
  }
}

// Value placeholder 업데이트
function updateValuePlaceholder() {
  const typeSelect = document.getElementById('label-filter-type');
  const valueInput = document.getElementById('label-filter-value');
  
  if (!typeSelect || !valueInput) {
    console.warn('Label filter elements not found for placeholder update');
    return;
  }
  
  const type = typeSelect.value;
  let placeholder = '';
  
  switch (type) {
    case '=':
    case '!=':
      placeholder = 'env (e.g., env=production)';
      break;
    case 'in':
    case 'notin':
      placeholder = 'region (e.g., region in (us-west, us-east))';
      break;
    case 'exists':
    case '!exists':
      placeholder = 'env (e.g., env exists)';
      break;
    default:
      placeholder = 'env (e.g., env=production)';
  }
  
  valueInput.placeholder = placeholder;
  valueInput.disabled = false;
}

// Label Selector 생성
function createLabelSelector() {
  const typeSelect = document.getElementById('label-filter-type');
  const valueInput = document.getElementById('label-filter-value');
  
  if (!typeSelect || !valueInput) {
    console.warn('Label filter elements not found');
    return '';
  }
  
  const type = typeSelect.value;
  const value = valueInput.value.trim();
  
  if (!value) return '';
  
  // Type과 Value를 조합하여 labelSelector 생성
  switch (type) {
    case '=':
    case '!=':
      // =, != 연산자는 값이 필요하므로 값이 없으면 빈 문자열 반환
      return value ? `${value}${type}` : '';
    case 'in':
    case 'notin':
      // in, notin 연산자는 값이 필요하므로 값이 없으면 빈 문자열 반환
      return value ? `${value} ${type}` : '';
    case 'exists':
    case '!exists':
      // exists, !exists 연산자는 값이 없어도 됨
      return `${value} ${type}`;
    default:
      return value;
  }
}

// Label Filter 적용 (ID 매칭 방식)
async function applyLabelFilter() {
  try {
    const labelSelector = createLabelSelector();
    
    if (!labelSelector) {
      alert('Please enter a valid label filter');
      return;
    }
        
    // 1. API 호출로 필터링된 MCI 목록 받기
    const response = await webconsolejs["common/api/services/infra_api"].getResourcesByLabelSelector(labelSelector);
    
    if (response && response.data && response.data.responseData) {
      let filteredMciResults = response.data.responseData;
      
      // responseData가 객체이고 그 안에 배열이 있는 경우 처리
      if (filteredMciResults && typeof filteredMciResults === 'object' && !Array.isArray(filteredMciResults)) {
        if (filteredMciResults.results) {
          filteredMciResults = filteredMciResults.results;
        } else if (filteredMciResults.data) {
          filteredMciResults = filteredMciResults.data;
        } else if (filteredMciResults.mcis) {
          filteredMciResults = filteredMciResults.mcis;
        } else {
          const possibleArrays = Object.values(filteredMciResults).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            filteredMciResults = possibleArrays[0];
          }
        }
      }
            
      if (Array.isArray(filteredMciResults)) {
        // 2. 필터링된 MCI ID 목록 추출
        const filteredMciIds = filteredMciResults.map(mci => mci.id);
        
        // 3. 기존 MCI 목록에서 ID 매칭
        const allMcis = Object.values(window.totalMciListObj || {});
        const matchedMcis = allMcis.filter(mci => filteredMciIds.includes(mci.id));

        // 4. 테이블 업데이트
        if (mciListTable) {
          mciListTable.setData(matchedMcis);
        }
        
        // 현재 선택된 MCI 초기화
        window.currentMciId = '';
      } else {
        if (mciListTable) {
          mciListTable.setData([]);
        }
        // 데이터 형식 오류 - 빈 테이블 표시
      }
    } else {
      if (mciListTable) {
        mciListTable.setData([]);
      }
      // 응답 데이터 없음 - 빈 테이블 표시
    }
    
  } catch (error) {
    console.error('Label filter error:', error);
    // 에러 발생 시 빈 테이블 표시
    if (mciListTable) {
      mciListTable.setData([]);
    }
  }
}

// 사용하지 않는 클라이언트 필터링 함수들 제거됨
// 이제 서버 API 결과의 ID 매칭 방식 사용

// Label Filter 초기화
function clearLabelFilter() {
  const typeSelect = document.getElementById('label-filter-type');
  const valueInput = document.getElementById('label-filter-value');
  
  if (typeSelect) {
    typeSelect.value = '=';
  } else {
    console.warn('Label filter type select not found');
  }
  
  if (valueInput) {
    valueInput.value = '';
    valueInput.disabled = false;
    valueInput.placeholder = 'env=production,tier=backend';
  } else {
    console.warn('Label filter value input not found');
  }
  
  // 원래 MCI 목록 복원
  if (window.totalMciListObj && mciListTable) {
    mciListTable.setData(Object.values(window.totalMciListObj));
  }
}
// ─── MCI를 Infra Template으로 저장 ────────────────────────────────────────

export function openSaveAsTemplateModal() {
  if (window.currentMciId == undefined || window.currentMciId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Please select an Infra first')
    return;
  }
  document.getElementById('save-template-name').value = `${window.currentMciId}-template`;
  document.getElementById('save-template-desc').value = '';
  new bootstrap.Modal(document.getElementById('save-as-template-modal')).show();
}

export async function executeSaveAsTemplate() {
  const mciId = window.currentMciId;
  const nsId = window.currentNsId;
  if (mciId == undefined || mciId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Please select an Infra first')
    return;
  }
  const name = document.getElementById('save-template-name').value.trim();
  if (!name) {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Template name is required')
    return;
  }
  const description = document.getElementById('save-template-desc').value.trim();

  executeWithToast(
    async () => {
      const infraDynamicReq = await webconsolejs["common/api/services/infratemplate_api"].getInfraReqFromInfra(nsId, mciId);
      const body = { name, infraDynamicReq };
      if (description) body.description = description;
      return webconsolejs["common/api/services/infratemplate_api"].create(nsId, body);
    },
    "Template saved",
    "Failed to save template"
  ).then(() => {
    bootstrap.Modal.getInstance(document.getElementById('save-as-template-modal'))?.hide();
  }).catch(() => {});
}

// ─── MCI를 JSON으로 Export (Node Import에서 재사용할 파일 생성) ────────────
function exportDateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportInfraAsJson() {
  const mciId = window.currentMciId;
  const nsId = window.currentNsId;
  if (mciId == undefined || mciId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Please select an Infra first')
    return;
  }

  try {
    const infraDynamicReq = await webconsolejs["common/api/services/infratemplate_api"].getInfraReqFromInfra(nsId, mciId);
    downloadJson({ infraDynamicReq }, `${mciId}-nodegroups-${exportDateStamp()}.json`);
  } catch (e) {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Failed to export Infra as JSON: ' + (e?.message || e));
  }
}

// ─── 선택한 Node가 속한 NodeGroup만 JSON으로 Export ────────────────────────
// Node List / Status 카드의 Action 항목. 형제 액션(Delete/Create MyImage)과 동일하게
// 단일 선택(selectedVmId) 규약을 따르므로 결과는 NodeGroup 1개다.
// 산출물은 전체 Export와 같은 형상이라 Import 모달이 그대로 받아들인다.
export async function exportSelectedNodeGroupAsJson() {
  const mciId = window.currentMciId;
  const nsId = window.currentNsId;
  if (mciId == undefined || mciId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Please select an Infra first')
    return;
  }
  // 형제 액션들은 currentVmId로 가드하는데 그 값은 체크 해제 시 초기화되지 않는다.
  // selectedVmId가 실제 선택 상태를 반영하므로 이쪽을 쓴다.
  if (!selectedVmId) {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Validation', 'Please select a Node')
    return;
  }

  const infra = (window.totalMciListObj || []).find(m => m.id === mciId);
  const node = ((infra && infra.node) || []).find(n => n.id === selectedVmId);
  const nodeGroupId = node && node.nodeGroupId;
  if (!nodeGroupId) {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Could not determine the NodeGroup of the selected node.')
    return;
  }

  try {
    const req = await webconsolejs["common/api/services/infratemplate_api"].getInfraReqFromInfra(nsId, mciId);
    const groups = (req && req.nodeGroups) || [];
    // 1차 정확 일치 → 2차 대소문자 무시 일치
    const norm = v => String(v == null ? "" : v).trim().toLowerCase();
    const wanted = new Set([nodeGroupId]);
    let filtered = groups.filter(g => wanted.has(g.name));
    if (filtered.length === 0) {
      const wantedNorm = new Set([norm(nodeGroupId)]);
      filtered = groups.filter(g => wantedNorm.has(norm(g.name)));
    }
    if (filtered.length === 0) {
      webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Could not find the NodeGroup definition for the selected node.')
      return;
    }

    // infra 레벨 필드(description/installMonAgent/postCommand 등)를 보존해야
    // import 시 carry-through 동작이 전체 Export와 동일해진다.
    // nodeGroupSize는 원본 정의 값을 그대로 둔다 — 선택 노드 수로 축소하지 않는다.
    const payload = { infraDynamicReq: { ...req, nodeGroups: filtered } };
    downloadJson(payload, `${mciId}-${nodeGroupId}-nodegroup-${exportDateStamp()}.json`);
  } catch (e) {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Failed to export NodeGroup as JSON: ' + (e?.message || e));
  }
}
