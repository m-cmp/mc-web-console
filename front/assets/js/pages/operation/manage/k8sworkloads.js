import { TabulatorFull as Tabulator } from "tabulator-tables";

/**
 * ===================================================================
 * PMK WORKLOADS PAGE - LOADER STRATEGY
 * ===================================================================
 * 📄 Page Loader: 동기 조회 — 사용자가 결과를 기다려야 하는 경우
 * 🔔 Toast Loader: 백그라운드 데이터 로딩
 * ⚪ No Loader: 추적되는 장기 작업 (create / delete / update)
 *
 * 생성·삭제·변경은 beginTrackedRequest가 loaderType을 'none'으로 강제하고
 * 진행/완료를 asyncRequestTracker의 toast와 navbar 배지로 알린다.
 * 따라서 여기에는 조회용 설정만 둔다.
 * ===================================================================
 */

// PMK Loader Configuration / PMK 로더 설정
const PMK_LOADER_CONFIG = {
  // 조회 작업 / Fetch operations
  fetch: {
    // 동기 조회 - Page Loader (사용자가 결과를 기다려야 함)
    clusterList: {
      loaderType: 'page'  // 변경: GetAllK8sCluster는 동기적으로 기다려야 함
    },
    clusterDetail: {
      loaderType: 'page'  // 변경: Getk8scluster는 동기적으로 기다려야 함
    },

    // 비동기 조회 - Toast Loader (백그라운드 데이터)
    monitoring: {
      loaderType: 'toast',
      progressLabel: 'Loading Monitoring Data...',
      successMessage: null
    },
    // CSP에 따라 실패/미지원일 수 있어 메인 클러스터 정보 로딩을 막지 않는다
    kubeconfig: {
      loaderType: 'toast',
      progressLabel: 'Loading KubeConfig...',
      successMessage: null
    }
  }
};

// PMK API Helper / PMK API 헬퍼
const PmkApiHelper = {
  // 조회 작업 / Fetch operations
  async getClusterList(nsId) {
    return await webconsolejs["common/api/services/k8s_api"].getClusterList(
      nsId,
      PMK_LOADER_CONFIG.fetch.clusterList
    );
  },
  
  async getClusterDetail(nsId, clusterId) {
    return await webconsolejs["common/api/services/k8s_api"].getCluster(
      nsId,
      clusterId,
      PMK_LOADER_CONFIG.fetch.clusterDetail
    );
  },

  // CSP-native auth 방식 kubeconfig — CSP에 따라 실패/미지원일 수 있음, 호출부에서 N/A 처리
  async getClusterKubeconfig(nsId, clusterId) {
    return await webconsolejs["common/api/services/k8s_api"].getClusterKubeconfig(
      nsId,
      clusterId,
      PMK_LOADER_CONFIG.fetch.kubeconfig
    );
  },

  // 삭제·변경 작업 / Delete, Update operations
  // 로더 옵션을 넘기지 않는다 — 추적되는 요청이라 api 함수가 loaderType을 'none'으로 강제한다
  async deleteCluster(nsId, clusterId) {
    return await webconsolejs["common/api/services/k8s_api"].pmkDelete(
      nsId,
      clusterId
    );
  },

  async deleteNodeGroup(nsId, clusterId, nodeGroupName) {
    return await webconsolejs["common/api/services/k8s_api"].nodeGroupDelete(
      nsId,
      clusterId,
      nodeGroupName
    );
  },

  async setNodeGroupAutoscaling(nsId, clusterId, nodeGroupName, onAutoScaling) {
    return await webconsolejs["common/api/services/k8s_api"].setNodeGroupAutoscaling(
      nsId,
      clusterId,
      nodeGroupName,
      onAutoScaling
    );
  },

  async changeNodeGroupAutoscaleSize(nsId, clusterId, nodeGroupName, sizes) {
    return await webconsolejs["common/api/services/k8s_api"].changeNodeGroupAutoscaleSize(
      nsId,
      clusterId,
      nodeGroupName,
      sizes
    );
  }
};

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
    const opt = this.options[this.selectedIndex];
    const nsFromAttr = opt ? (opt.getAttribute('data-nsid') || '') : '';
    let project = {
        "Id": this.value,
        "Name": opt ? opt.textContent : '',
        "NsId": nsFromAttr || (opt ? opt.textContent : '')
    };
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
    selectedWorkspaceProject.projectId = project.Id;
    selectedWorkspaceProject.projectName = project.Name;
    selectedWorkspaceProject.nsId = project.NsId;
    // Using direct API call with default page loader for project change
    var respPmkList = await webconsolejs["common/api/services/k8s_api"].getClusterList(project.NsId);
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
var currentPmkId = "";
var currentNodeGroupName = ""
export var currentProvider = ""

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
        // Provider/Connection 적재가 끝난 뒤 나머지 init이 진행되도록 기다린다
        await webconsolejs["partials/operation/manage/clustercreate"].addNewPmk();

        // 새로운 폼 Dynamic 초기화
        await initFormDynamic();

        // MCI용 이미지 모달 초기화 제거 — PMK는 initImageModalPmk()만 사용

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

    // 장기 작업 완료 시 목록 자동 갱신
    subscribeAsyncRequestRefresh()
}

// ─── 비동기 작업 완료 시 목록 갱신 ──────────────────────────────────────────
//
// asyncRequestTracker는 진행/완료 toast와 navbar 배지만 담당하고 목록은 건드리지 않아,
// 클러스터 생성이 끝나도 표는 Creating에 멈춰 있었다. K8s 작업이 Handling에서 끝난 순간에만
// 갱신한다 — MCI 작업으로는 갱신하지 않는다.
const PMK_ASYNC_OPERATION_IDS = [
    'PostK8sCluster',
    'PostK8sClusterDynamic',
    'PostK8sNodeGroup',
    'PostK8sNodeGroupDynamic',
    'Deletek8scluster',
    'DeleteK8sNodeGroup',
    'PutSetK8sNodeGroupAutoscaling',
    'PutChangeK8sNodeGroupAutoscaleSize',
];

const ASYNC_REFRESH_DEBOUNCE_MS = 1500;

function isPmkAsyncOperation(operationId) {
    if (!operationId) return false;
    return PMK_ASYNC_OPERATION_IDS.some(
        id => id.toLowerCase() === String(operationId).toLowerCase()
    );
}

// requestId → 직전 status. Handling에서 벗어난 전이만 골라내기 위한 스냅샷.
let asyncStatusSnapshot = new Map();
let asyncRefreshTimer = null;

function subscribeAsyncRequestRefresh() {
    const tracker = webconsolejs['common/api/asyncRequestTracker'];
    if (!tracker || typeof tracker.subscribe !== 'function') {
        return;
    }

    tracker.subscribe(function (jobs) {
        if (!Array.isArray(jobs)) return;

        let finished = false;
        const next = new Map();
        jobs.forEach(function (job) {
            if (!job || !job.requestId) return;
            next.set(job.requestId, job.status);
            if (!isPmkAsyncOperation(job.operationId)) return;
            // 첫 스냅샷(구독 직후)은 전이로 보지 않는다 — 페이지 진입 시 불필요한 갱신 방지
            const prev = asyncStatusSnapshot.get(job.requestId);
            if (prev === 'Handling' && job.status !== 'Handling') {
                finished = true;
            }
        });
        asyncStatusSnapshot = next;

        if (!finished) return;

        // 여러 작업이 연달아 끝나도 갱신은 한 번만
        if (asyncRefreshTimer) clearTimeout(asyncRefreshTimer);
        asyncRefreshTimer = setTimeout(function () {
            asyncRefreshTimer = null;
            refreshPmkList();
        }, ASYNC_REFRESH_DEBOUNCE_MS);
    });
}

// pmk목록 조회. init, refresh 에서 사용
/**
 * PMK 목록 새로고침
 * Refresh PMK list
 * 
 * List Refresh Pattern을 사용하여 일관된 refresh 동작 제공
 * Uses List Refresh Pattern for consistent refresh behavior
 * 
 * 적용 시나리오 / Applied scenarios:
 * - 화면 최초 로드 시 / Initial screen load
 * - Refresh 아이콘 클릭 시 / Refresh icon click
 * - NodeGroup 추가/삭제 후 / After NodeGroup add/delete
 * - Cluster 삭제 후 / After Cluster delete
 */
export async function refreshPmkList() {
  if (selectedWorkspaceProject.projectId != "") {
    var selectedProjectId = selectedWorkspaceProject.projectId;
    var selectedNsId = selectedWorkspaceProject.nsId;

    // List Refresh Pattern 설정 / List Refresh Pattern configuration
    const config = {
      // 현재 선택 ID 가져오기 / Get current selection ID
      getSelectionId: () => currentPmkId,

      // 숨길 상세 영역 / Detail areas to hide
      detailElementIds: ['cluster_info'],

      // 내용을 비울 영역 / Areas to empty
      detailElementsToEmpty: ['pmk_nodegroup_info_box', 'pmk_node_info_box'],

      // 닫을 폼 / Forms to close
      formsToClose: ['nodegroup_configuration'],

      // 목록 데이터 조회 / Fetch list data
      fetchListData: async () => {
        return await PmkApiHelper.getClusterList(selectedNsId);
      },

      // 목록 업데이트 / Update list
      updateListCallback: (respPmkList) => {
        getPmkListCallbackSuccess(selectedProjectId, respPmkList);
      },

      // Row 가져오기 / Get row by ID
      getRowById: (id) => {
        try {
          return pmkListTable.getRow(id);
        } catch (e) {
          return null;
        }
      },

      // Row 선택 / Select row
      selectRow: (id) => {
        toggleRowSelection(id);
      },

      // 상세 정보 표시 / Show detail data
      showDetailData: async () => {
        await getSelectedPmkData();
      },

      // 선택 상태 초기화 / Clear selection state
      clearSelectionState: () => {
        currentPmkId = '';
        currentNodeGroupName = '';
        currentProvider = '';
        selectedClusterData = {};
      },

      // 에러 메시지 / Error message
      errorMessage: 'Failed to refresh K8s list. Please try again.'
    };

    // Pattern 실행 / Execute pattern
    await webconsolejs['common/utils/listRefreshPattern'].execute(config);
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
        const keyValueList = item.spiderViewK8sClusterDetail?.KeyValueList || [];
        const network = item.spiderViewK8sClusterDetail?.Network || {};
        const vpc = (network.VpcIID && network.VpcIID.SystemId) || "N/A";
        const subnet = (network.SubnetIIDs && network.SubnetIIDs[0] && network.SubnetIIDs[0].SystemId) || "N/A";
        const securityGroup = (network.SecurityGroupIIDs && network.SecurityGroupIIDs[0] && network.SecurityGroupIIDs[0].SystemId) || "N/A";
        const version = item.spiderViewK8sClusterDetail?.Version || "N/A";
        const nodeGroupCount = item.spiderViewK8sClusterDetail?.NodeGroupList?.length || 0;
        
        // Status 직접 사용 (Cluster Info와 동일하게)
        const clusterStatus = item.spiderViewK8sClusterDetail?.Status || "N/A";
        
        return {
            name: item.name,
            id: item.id,
            description: item.description || "",
            connectionName: item.connectionName || "N/A",
            resourceType: item.resourceType,
            systemLabel: item.systemLabel || "N/A",
            systemMessage: item.systemMessage || "N/A",
            // TODO : ima, provider api res 변경되면 수정
            providerImg: item.connectionConfig.providerName || "",  // providerImg 값을 추가해야 함 (필요시)
            provider: item.connectionConfig.providerName || "N/A",
            status: clusterStatus,
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

        try {
            var detailPromise = PmkApiHelper.getClusterDetail(selectedNsId, currentPmkId);
            // KubeConfig는 CSP에 따라 실패/미지원일 수 있어 클러스터 정보 조회와 별개로 병렬 진행 — 실패해도 메인 조회는 막지 않음
            var kubeconfigPromise = PmkApiHelper.getClusterKubeconfig(selectedNsId, currentPmkId)
                .catch(function(error) {
                    console.error('Error fetching kubeconfig:', error);
                    return null;
                });

            var pmkResp = await detailPromise;

            // Check if pmkResp exists
            if (!pmkResp) {
                console.error('getSelectedPmkData - pmkResp is null or undefined');
                webconsolejs["common/util"].showToast(
                    'Failed to retrieve cluster information. The cluster may not exist or the API is not responding.',
                    'error',
                    5000
                );
                return;
            }

            // Check response status
            // Note: axios response has status at top level, not in data
            if (pmkResp.status != 200) {
                console.error('getSelectedPmkData - Response status is not 200:', pmkResp.status);
                console.error('getSelectedPmkData - Full response:', JSON.stringify(pmkResp, null, 2));
                webconsolejs["common/util"].showToast(
                    'Failed to load cluster information. Status: ' + (pmkResp.status || 'Unknown'),
                    'error',
                    5000
                );
                return;
            }

            // Check if responseData exists in the expected location
            if (!pmkResp.data || !pmkResp.data.responseData) {
                console.error('getSelectedPmkData - responseData not found in expected location');
                console.error('getSelectedPmkData - pmkResp.data structure:', Object.keys(pmkResp.data || {}));
                webconsolejs["common/util"].showToast(
                    'Invalid response structure from API. Please check console for details.',
                    'error',
                    5000
                );
                return;
            }

            // KubeConfig 응답 처리 — CSP 미지원/실패 시 null (setPmkInfoData가 N/A로 표시)
            var kubeconfigResp = await kubeconfigPromise;
            var pmkKubeConfigText = (kubeconfigResp && kubeconfigResp.status === 200 &&
                kubeconfigResp.data && kubeconfigResp.data.responseData)
                ? (kubeconfigResp.data.responseData.kubeconfig || null)
                : null;

            // SET PMK Info page
            setPmkInfoData(pmkResp.data, pmkKubeConfigText);

            // Toggle PMK Info
            var div = document.getElementById("cluster_info");
            const hasActiveClass = div.classList.contains("active");
            if (!hasActiveClass) {
                // cluster_info 가 active면 toggle 필요 없음
                webconsolejs["partials/layout/navigatePages"].toggleElement(div);
            }
        } catch (error) {
            console.error('Error in getSelectedPmkData:', error);
            webconsolejs["common/util"].showToast(
                'An error occurred while loading cluster information. Please try again.',
                'error',
                5000
            );
        }
    }
}

// pmk 삭제
export async function deletePmk() {
  // Validation 1: PMK가 선택되었는지 확인
  if (!currentPmkId || currentPmkId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'K8s Selection Check',
      'Please select a K8s to delete.'
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

  // Validation 3: Tencent 클러스터의 경우 NodeGroup이 없어야 삭제 가능
  if (currentProvider && currentProvider.toLowerCase() === 'tencent') {
    // selectedClusterData에서 NodeGroup 목록 확인
    var nodeGroupList = selectedClusterData?.responseData?.spiderViewK8sClusterDetail?.NodeGroupList ||
                       selectedClusterData?.spiderViewK8sClusterDetail?.NodeGroupList ||
                       [];

    if (Array.isArray(nodeGroupList) && nodeGroupList.length > 0) {
      webconsolejs['partials/layout/modal'].commonShowDefaultModal(
        'Tencent Cluster Delete Restriction',
        'Tencent clusters can only be deleted when there are no NodeGroups.<br>' +
        'Please delete all NodeGroups first.<br><br>' +
        '<strong>Current NodeGroups: ' + nodeGroupList.length + '</strong>'
      );
      return;
    }
  }

  // 삭제 요청만 보내고 결과를 기다리지 않음 (fire and forget)
  PmkApiHelper.deleteCluster(
    selectedNsId,
    currentPmkId
  );

  // 즉시 Toast 메시지 표시
  webconsolejs['common/util'].showToast('Cluster deletion request has been sent', 'info');

  // 전역 변수 초기화
  currentPmkId = '';
  currentNodeGroupName = '';
  currentProvider = '';
  selectedClusterData = {};

  // PMK 상세 정보 초기화
  $('#cluster_info_name').text('N/A');
  $('#cluster_info_version').text('N/A');
  $('#cluster_info_status').text('N/A');
  $('#cluster_info_vpc').text('N/A');
  $('#cluster_info_subnet').text('N/A');
  $('#cluster_info_securitygroup').text('N/A');
  $('#cluster_info_cloudconnection').text('N/A');
  $('#cluster_info_endpoint').text('N/A');

  // NodeGroup List 초기화
  $('#pmk_nodegroup_info_box').empty();

  // Node 상세 정보 초기화
  $('#pmk_node_info_box').empty();

  // NodeGroup Info 영역 초기화 및 숨기기
  clearServerInfo();
  const nodeGroupInfoDiv = document.getElementById("nodeGroup_info");
  if (nodeGroupInfoDiv && nodeGroupInfoDiv.classList.contains("active")) {
    webconsolejs["partials/layout/navigatePages"].toggleElement(nodeGroupInfoDiv);
  }

  // Cluster Info 영역 숨기기 (초기 화면처럼)
  $('#cluster_info').hide();

  // PMK 목록 새로고침
  await refreshPmkList();
}

const INITIAL_NODEGROUP_DELETE_BLOCKED =
  'Initial NodeGroup cannot be deleted on its own; it is removed together with the cluster';

// 선택된 클러스터의 컨텍스트.
//
// 표 조작이 두 갈래라 단일 소스가 없다: rowClick은 currentPmkId만, 체크박스(rowSelectionChanged)는
// selectedPmkObj만 갱신한다. 그래서 행만 클릭하면 Add NodeGroup 버튼은 활성(currentPmkId 기준)인데
// addNewNodeGroup()은 "select a cluster first"로 막히는 불일치가 있었다.
// 세 소스를 순서대로 조회해 필요한 필드를 평평하게 돌려준다. 없으면 null.
export function getSelectedClusterContext() {
  const fromSelection = Array.isArray(selectedPmkObj) && selectedPmkObj.length > 0
    ? selectedPmkObj[0]
    : null;
  // 표 행 데이터는 이미 평평하다(mappingTablePmkData)
  if (fromSelection && fromSelection.id) {
    return fromSelection;
  }

  // Getk8scluster 응답(선택 클러스터) → 목록 캐시 순으로 되찾는다
  const raw = (selectedClusterData && selectedClusterData.id)
    ? selectedClusterData
    : (Array.isArray(totalPmkListObj)
      ? totalPmkListObj.find(cluster => cluster.id === currentPmkId)
      : null);
  if (!raw || !raw.id) {
    return null;
  }

  // mappingTablePmkData / setPmkInfoData와 같은 식으로 평평하게 만든다
  const network = raw.spiderViewK8sClusterDetail?.Network || {};
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || "",
    provider: currentProvider || raw.connectionConfig?.providerName || "",
    connectionName: raw.connectionName || "",
    vpc: network.VpcIID?.SystemId || "",
    subnet: network.SubnetIIDs?.[0]?.SystemId || "",
    securitygroup: network.SecurityGroupIIDs?.[0]?.SystemId || "",
    version: raw.spiderViewK8sClusterDetail?.Version || raw.version || "",
    status: raw.spiderViewK8sClusterDetail?.Status || raw.status || "N/A",
  };
}

// NodeGroup 대상 액션(Delete / Autoscaling / Export)의 공통 선행 검증.
// 통과하면 {nsId, clusterId, nodeGroupName}을, 실패하면 안내 모달을 띄우고 null을 반환한다.
function requireNodeGroupSelection(actionLabel) {
  // Validation 1: NodeGroup이 선택되었는지 확인
  if (!currentNodeGroupName || currentNodeGroupName === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'NodeGroup Selection Check',
      'Please select a NodeGroup to ' + actionLabel + '.'
    );
    return null;
  }

  // Validation 2: PMK가 선택되었는지 확인
  if (!currentPmkId || currentPmkId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'K8s Selection Check',
      'Please select a K8s first.'
    );
    return null;
  }

  // Validation 3: Workspace/Project가 선택되었는지 확인
  var selectedNsId = selectedWorkspaceProject.nsId;
  if (!selectedNsId || selectedNsId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Workspace Selection Check',
      'Please select a workspace and project first.'
    );
    return null;
  }

  return {
    nsId: selectedNsId,
    clusterId: currentPmkId,
    nodeGroupName: currentNodeGroupName
  };
}

// 현재 선택된 NodeGroup의 tumblebug 레벨 정보를 찾는다.
// spiderViewK8sNodeGroupDetail은 CSP 네이티브 값(spec/image/keypair)이라 재생성·변경 입력값으로 쓸 수 없다.
function findSelectedNodeGroupInfo() {
  var list = selectedClusterData?.k8sNodeGroupList
    || selectedClusterData?.responseData?.k8sNodeGroupList
    || [];
  return list.find(ng => ng.name === currentNodeGroupName
    || ng.cspResourceId === currentNodeGroupName
    || ng.cspResourceName === currentNodeGroupName) || null;
}

// nodegroup 삭제
export async function deleteNodeGroup() {
  const target = requireNodeGroupSelection('delete');
  if (!target) return;

  // 드롭다운 비활성화가 늦게 반영되는 경로 대비 — 반드시 실패할 요청을 보내지 않는다
  if (findSelectedNodeGroupInfo()?.isInitialNodeGroup === true) {
    webconsolejs['common/util'].showToast(INITIAL_NODEGROUP_DELETE_BLOCKED, 'warning');
    return;
  }

  var selectedNsId = target.nsId;

  // 삭제 요청만 보내고 결과를 기다리지 않음 (fire and forget)
  PmkApiHelper.deleteNodeGroup(
    selectedNsId,
    currentPmkId,
    currentNodeGroupName
  );

  // 즉시 메시지 표시
  webconsolejs['common/util'].showToast('NodeGroup deletion request has been sent', 'info');

  // 선택된 NodeGroup 정보 초기화
  currentNodeGroupName = '';

  // Node 상세 정보 초기화
  $('#pmk_node_info_box').empty();

  // NodeGroup Info 영역 초기화 및 숨기기
  clearServerInfo();
  const nodeGroupInfoDiv = document.getElementById("nodeGroup_info");
  if (nodeGroupInfoDiv && nodeGroupInfoDiv.classList.contains("active")) {
    webconsolejs["partials/layout/navigatePages"].toggleElement(nodeGroupInfoDiv);
  }

  // PMK 목록 새로고침 (ListRefreshPattern이 자동으로 상세 정보 표시)
  await refreshPmkList();
}

// ─── NodeGroup Autoscaling ──────────────────────────────────────────────────
// tumblebug은 K8s NodeGroup에 대해 lifecycle(reboot/suspend/resume/terminate) 액션을
// 제공하지 않는다. NodeGroup 단위로 가능한 변경은 Autoscaling On/Off와 Autoscale Size뿐이다.

// AWS는 SetNodeGroupAutoScaling이 미구현 스텁이라(cb-spider, WEB-BUG-066) On/Off 자체가 무의미하다 —
// 항상 무반응인데 성공 토스트만 뜬다. Change Autoscale Size(min/max/desired 직접 조정)는
// 실제 AWS AutoScaling API로 구현돼 있어 그쪽으로 유도한다.
const AUTOSCALING_TOGGLE_UNSUPPORTED_PROVIDERS = ['aws'];
const AUTOSCALING_TOGGLE_UNSUPPORTED_MESSAGE =
  'AWS does not support a separate Autoscaling On/Off toggle. Use Change Autoscale Size to adjust min/max/desired directly.';

function isAutoscalingToggleUnsupported(provider) {
  return AUTOSCALING_TOGGLE_UNSUPPORTED_PROVIDERS.includes(String(provider || '').toLowerCase());
}

// cb-spider AWS 드라이버가 NodeGroupInfo.OnAutoScaling을 채우지 않아(convertNodeGroup) 항상 false로
// 내려온다 — min/max는 정상 반영되므로 AWS에 한해 그걸로 On/Off를 직접 계산한다.
function resolveAutoScalingState(minSize, maxSize, rawOnAutoScaling) {
  if (isAutoscalingToggleUnsupported(currentProvider)) {
    const min = Number(minSize);
    const max = Number(maxSize);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      return min < max;
    }
  }
  return String(rawOnAutoScaling ?? 'false') === 'true';
}

function isAutoScalingOn(nodeGroupInfo) {
  return resolveAutoScalingState(nodeGroupInfo?.minNodeSize, nodeGroupInfo?.maxNodeSize, nodeGroupInfo?.onAutoScaling);
}

export function openAutoscalingModal() {
  const target = requireNodeGroupSelection('set autoscaling for');
  if (!target) return;

  if (isAutoscalingToggleUnsupported(currentProvider)) {
    webconsolejs['common/util'].showToast(AUTOSCALING_TOGGLE_UNSUPPORTED_MESSAGE, 'info');
    return;
  }

  $('#nodegroup-autoscaling-name').val(target.nodeGroupName);
  $('#nodegroup-autoscaling-value').val(isAutoScalingOn(findSelectedNodeGroupInfo()) ? 'true' : 'false');

  new bootstrap.Modal(document.getElementById('nodegroup-autoscaling-modal')).show();
}

export async function applyAutoscaling() {
  const target = requireNodeGroupSelection('set autoscaling for');
  if (!target) return;

  const onAutoScaling = $('#nodegroup-autoscaling-value').val();
  bootstrap.Modal.getInstance(document.getElementById('nodegroup-autoscaling-modal'))?.hide();

  try {
    await PmkApiHelper.setNodeGroupAutoscaling(
      target.nsId,
      target.clusterId,
      target.nodeGroupName,
      onAutoScaling
    );
    webconsolejs['common/util'].showToast(
      'Autoscaling has been set to ' + (onAutoScaling === 'true' ? 'On' : 'Off'),
      'success'
    );
    await getSelectedPmkData();
  } catch (error) {
    console.error('Failed to set autoscaling:', error);
    webconsolejs['common/util'].showToast('Failed to set autoscaling', 'error');
  }
}

export function openAutoscaleSizeModal() {
  const target = requireNodeGroupSelection('change autoscale size for');
  if (!target) return;

  const nodeGroupInfo = findSelectedNodeGroupInfo();
  if (!isAutoscalingToggleUnsupported(currentProvider) && !isAutoScalingOn(nodeGroupInfo)) {
    webconsolejs['common/util'].showToast(
      'Autoscale size can only be changed while autoscaling is On. Use Set Autoscaling first.',
      'warning'
    );
    return;
  }

  $('#nodegroup-autoscalesize-name').val(target.nodeGroupName);
  $('#nodegroup-autoscalesize-desired').val(nodeGroupInfo.desiredNodeSize ?? '');
  $('#nodegroup-autoscalesize-min').val(nodeGroupInfo.minNodeSize ?? '');
  $('#nodegroup-autoscalesize-max').val(nodeGroupInfo.maxNodeSize ?? '');

  new bootstrap.Modal(document.getElementById('nodegroup-autoscalesize-modal')).show();
}

export async function applyAutoscaleSize() {
  const target = requireNodeGroupSelection('change autoscale size for');
  if (!target) return;

  const desired = $('#nodegroup-autoscalesize-desired').val();
  const min = $('#nodegroup-autoscalesize-min').val();
  const max = $('#nodegroup-autoscalesize-max').val();

  if (desired === '' || min === '' || max === '') {
    webconsolejs['common/util'].showToast('Please fill in desired, min and max node size', 'warning');
    return;
  }

  const desiredNum = parseInt(desired);
  const minNum = parseInt(min);
  const maxNum = parseInt(max);

  if (minNum > maxNum) {
    webconsolejs['common/util'].showToast('Min node size cannot be greater than max node size', 'warning');
    return;
  }
  if (desiredNum < minNum || desiredNum > maxNum) {
    webconsolejs['common/util'].showToast('Desired node size must be between min and max node size', 'warning');
    return;
  }

  bootstrap.Modal.getInstance(document.getElementById('nodegroup-autoscalesize-modal'))?.hide();

  try {
    await PmkApiHelper.changeNodeGroupAutoscaleSize(
      target.nsId,
      target.clusterId,
      target.nodeGroupName,
      { desiredNodeSize: desiredNum, minNodeSize: minNum, maxNodeSize: maxNum }
    );
    webconsolejs['common/util'].showToast('Autoscale size has been changed', 'success');
    await getSelectedPmkData();
  } catch (error) {
    console.error('Failed to change autoscale size:', error);
    webconsolejs['common/util'].showToast('Failed to change autoscale size', 'error');
  }
}

// ─── NodeGroup Export / Import ──────────────────────────────────────────────

const NODEGROUP_EXPORT_VERSION = '1.0';

// 선택된 클러스터의 tumblebug 레벨 NodeGroup 목록.
// spiderViewK8sClusterDetail.NodeGroupList는 CSP 네이티브 값이라 재생성에 쓸 수 없다.
function getClusterNodeGroupList() {
  return selectedClusterData?.k8sNodeGroupList
    || selectedClusterData?.responseData?.k8sNodeGroupList
    || [];
}

// model.K8sNodeGroupReq와 호환되는 필드만 뽑아 Import로 그대로 되돌릴 수 있게 한다
function toNodeGroupRequest(nodeGroup) {
  return {
    name: nodeGroup.name || '',
    specId: nodeGroup.specId || '',
    imageId: nodeGroup.imageId || '',
    sshKeyId: nodeGroup.sshKeyId || '',
    rootDiskType: nodeGroup.rootDiskType || '',
    rootDiskSize: nodeGroup.rootDiskSize || '',
    desiredNodeSize: nodeGroup.desiredNodeSize,
    minNodeSize: nodeGroup.minNodeSize,
    maxNodeSize: nodeGroup.maxNodeSize,
    onAutoScaling: String(nodeGroup.onAutoScaling ?? 'false')
  };
}

export function exportNodeGroups() {
  if (!currentPmkId || currentPmkId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'K8s Selection Check',
      'Please select a K8s first.'
    );
    return;
  }

  const nodeGroupList = getClusterNodeGroupList();
  if (nodeGroupList.length === 0) {
    webconsolejs['common/util'].showToast('The selected cluster has no NodeGroup to export', 'warning');
    return;
  }

  const payload = {
    version: NODEGROUP_EXPORT_VERSION,
    exported_at: new Date().toISOString(),
    clusterId: currentPmkId,
    provider: currentProvider,
    nodeGroups: nodeGroupList.map(toNodeGroupRequest)
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = currentPmkId + '-nodegroups-' + new Date().toISOString().slice(0, 10) + '.json';
  link.click();
  URL.revokeObjectURL(url);

  webconsolejs['common/util'].showToast(
    nodeGroupList.length + ' NodeGroup(s) exported',
    'success'
  );
}

// 이름이 이미 클러스터에 있거나 이번 import 배치 안에서 겹치면, 사용자에게 새 이름을
// 직접 입력받는다(자동 접미사 추천은 하되 강제하지 않는다). 건너뛰면 null을 돌려준다.
function promptNodeGroupRename(originalName, suggestedName) {
  return new Promise((resolve) => {
    $('#nodegroup-import-rename-message').text(
      '"' + originalName + '" already exists on this cluster. Enter a new name to import it.'
    );
    $('#nodegroup-import-rename-input').val(suggestedName);

    const modalEl = document.getElementById('nodegroup-import-rename-modal');
    const modal = new bootstrap.Modal(modalEl);
    const applyBtn = document.getElementById('nodegroup-import-rename-apply-btn');
    const skipBtn = document.getElementById('nodegroup-import-rename-skip-btn');

    const settle = (value) => {
      applyBtn.onclick = null;
      skipBtn.onclick = null;
      modal.hide();
      resolve(value);
    };

    applyBtn.onclick = () => settle($('#nodegroup-import-rename-input').val().trim() || null);
    skipBtn.onclick = () => settle(null);

    modal.show();
  });
}

// JSON 파일을 읽어 Add NodeGroup 폼을 채운다.
// 곧바로 생성하지 않는 이유: 다른 클러스터에서 export한 spec/sshKey를 사용자가
// Deploy 전에 보정할 수 있어야 한다. 이름이 이미 있으면 원래 이름으로 조용히 밀어넣지 않고
// promptNodeGroupRename()으로 새 이름을 직접 입력받는다 — 그대로 두면 Deploy 시 반드시 실패한다.
export async function importNodeGroups(input) {
  const file = input?.files?.[0];
  // 같은 파일을 다시 고를 수 있도록 즉시 비운다
  if (input) input.value = '';
  if (!file) return;

  if (!currentPmkId || currentPmkId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'K8s Selection Check',
      'Please select a K8s first.'
    );
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch (error) {
    console.error('Failed to parse the imported file:', error);
    webconsolejs['common/util'].showToast('Failed to parse the JSON file', 'error');
    return;
  }

  const nodeGroups = Array.isArray(payload?.nodeGroups)
    ? payload.nodeGroups
    : (Array.isArray(payload) ? payload : null);

  if (!nodeGroups || nodeGroups.length === 0) {
    webconsolejs['common/util'].showToast('No NodeGroup found in the file', 'error');
    return;
  }

  const invalid = nodeGroups.filter(ng => !ng?.name || !ng?.specId || !ng?.imageId);
  if (invalid.length > 0) {
    webconsolejs['common/util'].showToast(
      'Every NodeGroup requires name, specId and imageId',
      'error'
    );
    return;
  }

  const clustercreate = webconsolejs['partials/operation/manage/clustercreate'];

  // 클러스터 컨텍스트(provider/connection/vpc/subnet/sg/version) 세팅 + Add NodeGroup 화면으로 이동
  await clustercreate.addNewNodeGroup();
  // sshKey / Root Disk Type 옵션 조회 — 목록이 있어야 프리필한 값이 살아남는다
  await clustercreate.displayNewNodeForm();

  const existingNames = new Set(getClusterNodeGroupList().map(ng => ng.name));
  const usedNamesThisImport = new Set(); // 배치 내부 중복도 같은 방식으로 잡는다

  let unmatchedSshKey = 0;
  let renamedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < nodeGroups.length; i++) {
    // 직전 항목의 Done이 폼을 닫았으므로 다시 연다
    if (i > 0) clustercreate.startCreateMode();

    let ng = nodeGroups[i];
    if (existingNames.has(ng.name) || usedNamesThisImport.has(ng.name)) {
      let suggested = ng.name;
      let suffix = 2;
      while (existingNames.has(suggested) || usedNamesThisImport.has(suggested)) {
        suggested = ng.name + '-' + suffix;
        suffix++;
      }
      const chosen = await promptNodeGroupRename(ng.name, suggested);
      if (!chosen) {
        skippedCount++;
        continue;
      }
      if (existingNames.has(chosen) || usedNamesThisImport.has(chosen)) {
        webconsolejs['common/util'].showToast(
          '"' + chosen + '" is also already in use — skipped "' + ng.name + '"',
          'warning'
        );
        skippedCount++;
        continue;
      }
      ng = { ...ng, name: chosen };
      renamedCount++;
    }
    usedNamesThisImport.add(ng.name);

    const result = clustercreate.prefillNodeGroupForm(ng);
    if (!result.sshKeyMatched) unmatchedSshKey++;
    clustercreate.clusterFormDone_btn();
  }

  if (usedNamesThisImport.size === 0) {
    webconsolejs['common/util'].showToast('No NodeGroup was imported', 'warning');
    return;
  }

  if (skippedCount > 0) {
    webconsolejs['common/util'].showToast(
      skippedCount + ' NodeGroup(s) skipped due to name conflicts',
      'warning'
    );
  } else if (unmatchedSshKey > 0) {
    webconsolejs['common/util'].showToast(
      unmatchedSshKey + ' NodeGroup(s) need an SSH key to be selected before deploying',
      'warning'
    );
  } else {
    webconsolejs['common/util'].showToast(
      usedNamesThisImport.size + ' NodeGroup(s) loaded' +
        (renamedCount > 0 ? ' (' + renamedCount + ' renamed)' : '') +
        '. Review the list and click Deploy.',
      'info'
    );
  }
}

// 클릭한 pmk의 info값 세팅
function setPmkInfoData(pmkData, kubeconfigText) {
    // Cluster Info 영역 표시
    $('#cluster_info').show();
    
    var clusterData = pmkData.responseData;
    // NodeGroup이 0개인 클러스터에서도 최신 값이 유지되도록 여기서 대입한다
    // (displayNodeGroupStatusList는 NodeGroup이 있을 때만 호출된다)
    selectedClusterData = clusterData;
    var clusterDetailData = clusterData.spiderViewK8sClusterDetail;
    var pmkNetwork = clusterDetailData?.Network || {};
    var clusterProvider = clusterData.connectionConfig.providerName
    currentProvider = clusterProvider
    
    // pmkStatus를 try 블록 밖에서 선언
    var pmkStatus = "N/A";
    
    try {

        // Name, CspName, CspId 구분
        var pmkName = clusterData.name || "N/A";
        var pmkCspName = clusterDetailData?.IId?.NameId || "N/A";
        var pmkCspId = clusterDetailData?.IId?.SystemId || "N/A";
        var pmkVersion = clusterDetailData?.Version || "N/A";
        pmkStatus = clusterDetailData?.Status || "N/A";

        // 네트워크 정보
        var pmkVpc = (pmkNetwork.VpcIID && pmkNetwork.VpcIID.SystemId) || "N/A";
        var pmkSubnet = (pmkNetwork.SubnetIIDs && pmkNetwork.SubnetIIDs[0] && pmkNetwork.SubnetIIDs[0].SystemId) || "N/A";
        var pmkSecurityGroup = (pmkNetwork.SecurityGroupIIDs && pmkNetwork.SecurityGroupIIDs[0] && pmkNetwork.SecurityGroupIIDs[0].SystemId) || "N/A";

        // 추가정보
        var pmkCloudConnection = clusterData.connectionName
        var pmkEndPoint = clusterDetailData?.AccessInfo?.Endpoint || "N/A"
        // CSP-native auth 방식(GetK8sClusterKubeconfig) — cb-spider는 AWS/GCP 외 CSP에서
        // native 변환 없이(에러도 없이) 기존 spider-relay 값을 그대로 200으로 돌려주므로
        // (cb-spider ClusterManager.go convertToNativeKubeConfig의 default 분기),
        // 응답 성공 여부가 아니라 provider로 직접 게이팅해야 한다.
        // AccessInfo.Kubeconfig(cb-spider relay)는 spider 프로세스 내부 호출 전용 경로라 외부 클라이언트에서 쓰지 않는다.
        var pmkKubeConfigNote = {
            aws: 'Requires AWS CLI credentials and EKS Access Entry registration to use locally.',
            gcp: 'Requires gcloud CLI (gke-gcloud-auth-plugin) and GKE cluster IAM access to use locally.'
        };
        var pmkProviderLower = (clusterProvider || "").toLowerCase();
        var pmkKubeConfigSupported = pmkKubeConfigNote.hasOwnProperty(pmkProviderLower);
        var pmkKubeConfig = (pmkKubeConfigSupported && kubeconfigText) ? kubeconfigText : "N/A";

        // webconsolejs["common/api/services/k8s_api"].getPmkInfoProviderNames(pmkData); // PMK에 사용된 provider
        // var pmkDescription = clusterData.description;
        // var pmkDispStatus = webconsolejs["common/api/services/k8s_api"].getPmkStatusFormatter(pmkStatus);
        // var pmkStatusIcon = webconsolejs["common/api/services/k8s_api"].getPmkStatusIconFormatter(pmkDispStatus);
        // var totalNodeGroupCount = (clusterDetailData.NodeGroupList == null) ? 0 : clusterDetailData.NodeGroupList.length;

        $("#cluster_info_name").text(pmkName);
        $("#cluster_info_cspname").text(pmkCspName);
        $("#cluster_info_cspid").text(pmkCspId);
        $("#cluster_info_version").text(pmkVersion);

        // 상태 배지 렌더링
        const statusEl = document.getElementById("cluster_info_status");
        if (statusEl) {
            const statusLower = (pmkStatus || "").toLowerCase();
            let badgeClass = "bg-muted-lt text-muted";
            if (statusLower === "active") {
                badgeClass = "bg-green-lt text-green";
            } else if (statusLower.includes("creat") || statusLower.includes("pending")) {
                badgeClass = "bg-azure-lt text-azure";
            } else if (statusLower.includes("delet") || statusLower.includes("terminat")) {
                badgeClass = "bg-red-lt text-red";
            } else if (statusLower.includes("inactive") || statusLower.includes("stop")) {
                badgeClass = "bg-yellow-lt text-yellow";
            }
            statusEl.innerHTML = `<span class="badge ${badgeClass}" style="font-size: 0.8rem;">${pmkStatus}</span>`;
        }

        // 네트워크 정보
        $("#cluster_info_vpc").text(pmkVpc);
        $("#cluster_info_subnet").text(pmkSubnet);
        $("#cluster_info_securitygroup").text(pmkSecurityGroup);

        // 추가정보
        $("#cluster_info_cloudconnection").text(pmkCloudConnection);
        $("#cluster_info_endpoint").text(pmkEndPoint || "N/A");

        // KubeConfig: 클립보드 복사 버튼과 함께 표시
        const kubeconfigEl = document.getElementById("cluster_info_kubeconfig");
        if (kubeconfigEl) {
            if (pmkKubeConfig && pmkKubeConfig !== "N/A") {
                const btn = document.createElement('a');
                btn.href = '#';
                btn.className = 'btn btn-sm btn-outline-secondary';
                btn.textContent = 'Copy KubeConfig';
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigator.clipboard.writeText(pmkKubeConfig).then(() => {
                        btn.textContent = 'Copied!';
                        setTimeout(() => { btn.textContent = 'Copy KubeConfig'; }, 1500);
                    }).catch(() => {
                        btn.textContent = 'Copy failed';
                        setTimeout(() => { btn.textContent = 'Copy KubeConfig'; }, 1500);
                    });
                });
                const note = document.createElement('div');
                // .datagrid-content는 짧은 값 표시를 위해 white-space:nowrap+ellipsis로 잘라내므로
                // 여러 줄로 감싸야 하는 안내문에는 text-wrap(white-space:normal)으로 되돌린다
                note.className = 'form-text text-wrap';
                note.textContent = pmkKubeConfigNote[pmkProviderLower];

                kubeconfigEl.innerHTML = '';
                kubeconfigEl.appendChild(btn);
                kubeconfigEl.appendChild(note);
            } else {
                kubeconfigEl.textContent = "N/A";
            }
        }

    } catch (e) {
        console.error(e);
    }

    // cluster info 영역으로 스크롤 이동
    const clusterInfoEl = document.getElementById("cluster_info");
    if (clusterInfoEl) {
        clusterInfoEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    var nodeGroupList = clusterDetailData?.NodeGroupList

    // displayNodeGroupStatusList(pmkID, clusterData)
    if (Array.isArray(nodeGroupList) && nodeGroupList.length > 0) {
        displayNodeGroupStatusList(currentPmkId, clusterProvider, clusterData);
    }
    
    // Add NodeGroup 버튼 상태 업데이트
    updateAddNodeGroupButtonState(pmkStatus);
}

// 체크박스를 클릭했을 때 선택 상태를 반전시킴
export function toggleNodeCheck(pmkID, nodeID) {
    var checkbox = $(`#node_checkbox_${nodeID}`);
    checkbox.prop("checked", !checkbox.prop("checked"));
    handleNodeCheck(pmkID, nodeID);
}

// NodeGroup / Status 리스트
function displayNodeGroupStatusList(pmkID, clusterProvider, clusterData) {

    var nodeGroupList = clusterData.spiderViewK8sClusterDetail?.NodeGroupList;
    var pmkName = pmkID;
    var nodeLi = "";
    nodeGroupList.sort();

    nodeGroupList.forEach((aNodeGroup) => {
        var nodeID = aNodeGroup.IId.SystemId;
        var nodeName = aNodeGroup.IId.NameId;
        var nodeStatus = aNodeGroup.Status;

        if (clusterProvider === "azure") {
            var nodeIDParts = nodeID.split("/");
            nodeID = nodeIDParts[nodeIDParts.length - 1];
        }
        var nodeStatusClass = webconsolejs["common/api/services/k8s_api"].getVmStatusStyleClass(nodeStatus);

        // 텍스트 길이 제한 (10자 초과 시 ... 표시)
        var displayName = nodeName.length > 10 ? nodeName.substring(0, 10) + '...' : nodeName;

        nodeLi += `
        <li id="nodeGroup_status_icon_${nodeID}" 
            class="card ${nodeStatusClass} d-flex align-items-center" 
            style="display: flex; 
                   flex-direction: row; 
                   align-items: center; 
                   justify-content: flex-start; 
                   padding: 10px 15px; 
                   min-width: 150px; 
                   min-height: 60px;
                   cursor: pointer;" 
            onclick="webconsolejs['pages/operation/manage/k8sworkloads'].toggleNodeCheck('${pmkID}', '${nodeID}')"
            title="${nodeName}">
          
          <input type="checkbox" 
                 id="node_checkbox_${nodeID}" 
                 class="vm-checkbox" 
                 style="width: 20px; height: 20px; margin-right: 15px; flex-shrink: 0;" 
                 onchange="webconsolejs['pages/operation/manage/k8sworkloads'].handleNodeCheck('${pmkID}', '${nodeID}')">
          
          <span class="text-dark-fg" 
                style="overflow: hidden; 
                       text-overflow: ellipsis; 
                       white-space: nowrap; 
                       flex: 1;">${displayName}</span>
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

        webconsolejs['pages/operation/manage/k8sworkloads'].nodeGroupDetailInfo(pmkID, aNodeObject, lastSelectedNodeID);
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
    updateNodeGroupActionState()
    var ngId = aNode.cspResourceId || nodeGroupDetail.IId.SystemId || 'N/A'
    var ngStatus = aNode.status || 'N/A'
    var ngImage = nodeGroupDetail.ImageIID.NameId || "AL2023_x86_64_STANDARD"
    var ngSpec = nodeGroupDetail.VMSpecName || "t3.medium"

    var ngKeyPair = nodeGroupDetail.KeyPairIID.NameId || "d2rpbhedf1f12d7uev2g"
    var ngDesiredNodeSize = nodeGroupDetail.DesiredNodeSize || aNode.desiredNodeSize
    var ngMinNodeSize = nodeGroupDetail.MinNodeSize || aNode.minNodeSize
    var ngMaxNodeSize = nodeGroupDetail.MaxNodeSize || aNode.maxNodeSize

    var ngAutoScaling = resolveAutoScalingState(ngMinNodeSize, ngMaxNodeSize, nodeGroupDetail.OnAutoScaling ?? aNode.onAutoScaling)
    var ngRootDiskType = nodeGroupDetail.RootDiskType || ""
    var ngRootDiskSize = nodeGroupDetail.RootDiskSize || aNode.rootDiskSize

    // Info SET
    $("#ng_info_name").text(ngName)
    $("#ng_info_id").text(ngId)
    $("#ng_info_status").text(ngStatus)
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
        var nodeStatusClass = webconsolejs["common/api/services/k8s_api"].getVmStatusStyleClass(nodeStatus)

        nodeLi += '<li id="node_status_icon_' + nodeId + '" class="card ' + nodeStatusClass + '"><span class="text-dark-fg">' + nodeName + '</span></li>';

        $("#pmk_node_info_box").empty();
        $("#pmk_node_info_box").append(nodeLi);
    }
}

// Cluster Info 초기화
function clearClusterInfo() {
    // Cluster Info 필드 초기화
    $("#cluster_info_name").text("N/A");
    $("#cluster_info_cspname").text("N/A");
    $("#cluster_info_cspid").text("N/A");
    $("#cluster_info_version").text("N/A");
    $("#cluster_info_status").text("N/A");
    $("#cluster_info_vpc").text("N/A");
    $("#cluster_info_subnet").text("N/A");
    $("#cluster_info_securitygroup").text("N/A");
    $("#cluster_info_cloudconnection").text("N/A");
    $("#cluster_info_endpoint").text("N/A");
}

// NodeGroup List & Info 초기화
function clearNodeGroupInfo() {
    // NodeGroup 선택 상태 초기화
    currentNodeGroupName = '';
    updateNodeGroupActionState();
    
    // NodeGroup List 영역 비우기
    $('#pmk_nodegroup_info_box').empty();
    
    // Node 목록 비우기
    $('#pmk_node_info_box').empty();
    
    // NodeGroup Info 초기화 (clearServerInfo의 NodeGroup 부분)
    $("#ng_info_name").text("");
    $("#ng_info_id").text("");
    $("#ng_info_status").text("");
    $("#ng_info_image").text("");
    $("#ng_info_spec").text("");
    $("#ng_info_keypair").text("");
    $("#ng_info_desirednodesize").text("");
    $("#ng_info_nodesize").text("");
    $("#ng_info_autoscaling").text("");
    $("#ng_info_rootdisktype").text("");
    $("#ng_info_rootdisksize").text("");
}

// vm 세부 정보 초기화
function clearServerInfo() {

    $("#server_info_text").text("")
    $("#server_detail_info_text").text("")
    $("#server_detail_view_server_status").val("");
    $("#server_info_name").val("")
    $("#server_info_desc").val("")

    // NodeGroup Info 초기화
    $("#ng_info_name").text("")
    $("#ng_info_id").text("")
    $("#ng_info_status").text("")
    $("#ng_info_image").text("")
    $("#ng_info_spec").text("")
    $("#ng_info_keypair").text("")
    $("#ng_info_desirednodesize").text("")
    $("#ng_info_nodesize").text("")
    $("#ng_info_autoscaling").text("")
    $("#ng_info_rootdisktype").text("")
    $("#ng_info_rootdisksize").text("")

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

            var aPmkStatusCountMap = webconsolejs["common/api/services/k8s_api"].calculatePmkStatusCount(aPmk);
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
            var vmStatusCountMap = webconsolejs["common/api/services/k8s_api"].calculateVmStatusCount(aPmk);
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
            title: "ProviderImg",
            field: "providerImg",
            formatter: providerFormatter,
            vertAlign: "middle",
            hozAlign: "center",
            headerSort: false,
        },
        {
            title: "Status",
            field: "status",
            vertAlign: "middle",
            hozAlign: "center",
        },
        {
            title: "Name",
            field: "name",
            vertAlign: "middle"
        },
        {
            title: "Node Group",
            field: "nodegroup",
            vertAlign: "middle",
            hozAlign: "center",
            maxWidth: 150,
        },
        {
            title: "VPC",
            field: "vpc",
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
            title: "Provider",
            field: "provider",
            formatter: providerFormatterString,
            visible: false
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
        }
    ];

    //pmkListTable = webconsolejs["common/util"].setTabulator("pmklist-table", tableObjParams, columns);// TODO [common/util]에 정의되어 있는데 호출하면 에러남... why?
    pmkListTable = setPmkTabulator("pmklist-table", tableObjParams, columns, true);

    // 행 클릭 시
    pmkListTable.on("rowClick", function (e, row) {
        // vmid 초기화 for vmlifecycle
        // selectedClusterId = ""

        // 1. 기존 UI 먼저 초기화
        clearClusterInfo();
        clearNodeGroupInfo();
        
        // 2. 새로운 PMK ID 설정
        currentPmkId = row.getCell("id").getValue();
        
        // 3. 표에서 선택된 PmkInfo 조회
        getSelectedPmkData()

    });

    //  선택된 여러개 row에 대해 처리
    pmkListTable.on("rowSelectionChanged", function (data, rows) {
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
    var pmkDispStatus = webconsolejs["common/api/services/k8s_api"].getPmkStatusFormatter(
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

    var vmCloudConnectionMap = webconsolejs["common/api/services/k8s_api"].calculateConnectionCount(
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
        var vmCloudConnectionMap = webconsolejs["common/api/services/k8s_api"].calculateConnectionCount(
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

// Dynamic 폼 Region/Connection 목록의 정본 (ConnConfig 객체 배열)
let dynamicConnectionList = [];

// Dynamic 폼용 데이터 직접 로드
// Region 목록은 Connection에서 파생시킨다 — RetrieveRegionListFromCsp는 zone 단위 항목까지
// 내려주는데(전체의 약 76%) 그 대부분은 대응하는 Connection이 없어, 고르면 Connection 목록이 빈다.
async function loadFormDynamicData() {
    try {
        // Provider 목록은 HTML partial component로 이미 렌더링됨
        dynamicConnectionList = await webconsolejs["common/api/services/k8s_api"]
            .getCloudConnection({ loaderType: 'none' }) || [];
        applyDynamicRegionConnectionOptions("", "");
    } catch (error) {
        console.error("Failed to load dynamic form data:", error);
    }
}

// provider(+region)에 맞춰 Dynamic 폼의 Region/Connection select를 다시 채운다
function applyDynamicRegionConnectionOptions(provider, regionZoneInfoName) {
    const k8sApi = webconsolejs["common/api/services/k8s_api"];
    k8sApi.fillSelectOptions(
        "#cluster_region_dynamic", "Select Region",
        k8sApi.listRegionOptions(dynamicConnectionList, provider));
    k8sApi.fillSelectOptions(
        "#cluster_cloudconnection_dynamic", "Select Connection",
        k8sApi.listConnectionNames(dynamicConnectionList, provider, regionZoneInfoName), true);
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

// Dynamic 폼용 필터링 업데이트 함수
async function updateFormDynamicConfigurationFiltering() {
    const k8sApi = webconsolejs["common/api/services/k8s_api"];
    const selectedProvider = document.getElementById('cluster_provider_dynamic').value;
    const selectedRegion = document.getElementById('cluster_region_dynamic').value;

    // Provider 미선택 — 전체 목록으로 되돌리고 NodeGroup 폼을 숨긴다
    if (selectedProvider === "") {
        applyDynamicRegionConnectionOptions("", "");
        hideNodeGroupFormDynamic();
        return;
    }

    // Provider가 바뀌면 이전 Region 값이 select에 그대로 남아 있다.
    // 그 값으로 Connection을 거르면 빈 목록이 되고 Region 목록도 옛 provider 것에 고착되므로,
    // provider가 맞지 않는 Region은 미선택으로 취급해 목록부터 다시 만든다.
    const parsed = k8sApi.parseRegionOption(selectedRegion);
    const regionBelongsToProvider = selectedRegion !== ""
        && parsed.provider.toLowerCase() === selectedProvider.toLowerCase();

    if (!regionBelongsToProvider) {
        applyDynamicRegionConnectionOptions(selectedProvider, "");
        onProviderChangeDynamic(selectedProvider);
        return;
    }

    // Region까지 선택 — Connection을 그 Region 하나로 확정한다.
    // regionZoneInfoName 정확 일치로 비교한다(startsWith 금지 — "azure-eastus"가
    // "azure-eastus2"를, "gcp-europe-west1"이 "...west10/12"를 끌고 온다).
    k8sApi.fillSelectOptions(
        "#cluster_cloudconnection_dynamic", "Select Connection",
        k8sApi.listConnectionNames(dynamicConnectionList, selectedProvider, parsed.regionZoneInfoName), true);
    onProviderChangeDynamic(selectedProvider);
}



// 폼 Dynamic 용 Cloud Connection 변경 이벤트
export async function changeCloudConnectionDynamic(connectionName) {
    // 동적 생성에서는 VPC, Subnet, Security Group 선택이 필요 없음
    // Cloud Connection만 설정하고 추가 API 호출 없이 처리
    if (!connectionName) {
        resetNodeGroupRootDiskTypeDynamic();
        return;
    }

    const provider = $("#cluster_provider_dynamic").val();
    if (!provider) {
        resetNodeGroupRootDiskTypeDynamic();
        return;
    }

    try {
        const diskResp = await webconsolejs["common/api/services/disk_api"]
            .getCommonLookupDiskInfo(provider, connectionName);
        applyNodeGroupRootDiskTypeDynamic(provider, diskResp);
    } catch (error) {
        console.error("Failed to look up disk types:", error);
        resetNodeGroupRootDiskTypeDynamic();
    }
}

// provider/connectionName에 맞는 Root Disk Type 옵션으로 드롭다운을 채운다
function applyNodeGroupRootDiskTypeDynamic(provider, diskInfoList) {
    const providerId = provider.toUpperCase();
    const matched = Array.isArray(diskInfoList)
        ? diskInfoList.find(item => item.providerId === providerId)
        : null;

    let html = '<option value="">Select Root Disk Type</option><option value="default">default</option>';
    if (matched && Array.isArray(matched.rootdisktype)) {
        matched.rootdisktype.forEach(type => {
            html += `<option value="${type}">${type}</option>`;
        });
    }

    $("#nodegroup_rootdisk_dynamic").empty().append(html);
}

// Root Disk Type 드롭다운을 기본 상태로 되돌린다
function resetNodeGroupRootDiskTypeDynamic() {
    $("#nodegroup_rootdisk_dynamic").empty().append(
        '<option value="">Select Root Disk Type</option><option value="default">default</option>'
    );
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
        webconsolejs['common/util'].showToast('Please fill in all required fields', 'warning');
        return;
    }

    // NodeGroup Configuration 폼이 표시되어 있는지 확인
    const nodeGroupForm = document.getElementById("nodegroup_configuration_dynamic");
    const isNodeGroupVisible = nodeGroupForm && nodeGroupForm.style.display !== "none";

    try {
        let commonSpec = "";
        let commonImage = "";
        let k8sVersion = "";

        if (isNodeGroupVisible) {
            // NodeGroup이 있는 경우: 선택된 spec으로 사전 검증 후 배포
            commonSpec = $("#nodegroup_commonSpecId_dynamic").val();
            commonImage = $("#nodegroup_image_dynamic").val();
            if (!commonSpec) {
                webconsolejs['common/util'].showToast('Please select NodeGroup spec', 'warning');
                return;
            }

            // 스펙 ↔ Connection 정합성 검증.
            // 스펙 검색은 Provider로만 거르기 때문에 다른 리전의 스펙이 후보에 섞인다.
            // 선택된 스펙이 자기 connectionName을 들고 있으므로, 클러스터 Connection과
            // 다르면 여기서 잡는다 (예: kr1 스펙 + jp1 Connection → cb-tumblebug 400).
            const specConnection = $("#nodegroup_connectionName_dynamic").val();
            if (specConnection && specConnection !== clusterData.connection) {
                webconsolejs['common/util'].showToast(
                    `The selected spec belongs to connection '${specConnection}' but the cluster uses '${clusterData.connection}'. Select a spec from the same connection.`,
                    'error'
                );
                return;
            }

            const checkResult = await webconsolejs["common/api/services/k8s_api"].checkK8sClusterDynamic(
                selectedWorkspaceProject.nsId,
                commonSpec
            );
            if (!checkResult || checkResult.status !== 200) {
                webconsolejs['common/util'].showToast('Failed to pre-validate. Please check the settings', 'error');
                return;
            }
        } else {
            // NodeGroup이 없는 경우: K8s 버전 + specId 동적 조회 후 control plane만 생성
            const providerName = clusterData.provider;
            const parsedRegion = webconsolejs["common/api/services/k8s_api"]
                .parseRegionOption(clusterData.region);
            const regionName = parsedRegion.regionZoneInfoName;

            if (!providerName || !regionName) {
                webconsolejs['common/util'].showToast('Please select both Provider and Region', 'warning');
                return;
            }

            // K8s 버전 조회 — CSP 원본 region 이름을 넘긴다.
            // "nhn-kr1"을 그대로 넘기면 NHN이 500("no entry for provider(nhn):region(nhn-kr1)")을 반환한다.
            const cspRegionName = webconsolejs["common/api/services/k8s_api"]
                .toCspRegionName(providerName, regionName);
            const versions = await webconsolejs["common/api/services/k8s_api"]
                .getAvailableK8sClusterVersion(providerName, cspRegionName);
            if (versions && Array.isArray(versions) && versions.length > 0) {
                k8sVersion = versions[0].id || "";
            }

            // provider 컨텍스트용 specId: RecommendK8sNode를 connectionName으로 서버 사이드 필터링하여 조회
            commonSpec = await webconsolejs["common/api/services/k8s_api"]
                .getRecommendedK8sSpecId(clusterData.connection);
            if (!commonSpec) {
                // 하드코딩된 fallback 스펙은 리전마다 유효성이 달라 항상 실패할 수 있으므로 사용하지 않는다.
                // 대신 실패 원인을 명확히 알리고 중단한다.
                webconsolejs['common/util'].showToast(
                    `No available spec found for connection '${clusterData.connection}'. Please check if specs are registered/synced for this connection.`,
                    'error'
                );
                return;
            }

            commonImage = "default";
        }

        // 클러스터 생성 데이터 준비
        const createData = {
            imageId: commonImage || "default",
            specId: commonSpec,
            connectionName: clusterData.connection,
            name: clusterData.name,
            nodeGroupName: isNodeGroupVisible ? $("#nodegroup_name_dynamic").val() : ""
        };

        if (k8sVersion) {
            createData.version = k8sVersion;
        }

        // NodeGroup이 있는 경우 추가 정보 설정
        if (isNodeGroupVisible) {
            if (!createData.nodeGroupName) {
                webconsolejs['common/util'].showToast('Please input NodeGroup name', 'warning');
                return;
            }
            const autoScalingVal = $("#nodegroup_autoscaling_dynamic").val();
            createData.onAutoScaling = autoScalingVal || "false";
            if (autoScalingVal === "true") {
                const minNodeSize = $("#nodegroup_minnodesize_dynamic").val();
                const maxNodeSize = $("#nodegroup_maxnodesize_dynamic").val();
                if (!minNodeSize || !maxNodeSize) {
                    webconsolejs['common/util'].showToast('Min/Max Node Size is required when AutoScaling is On', 'warning');
                    return;
                }
                createData.minNodeSize = parseInt(minNodeSize, 10);
                createData.maxNodeSize = parseInt(maxNodeSize, 10);
            }
        }

        // 동적 클러스터 생성 API 호출 (비동기 - requestId toast로 상태 표시)
        // 결과는 기다리지 않지만 rejection은 관측한다 — 그러지 않으면 실패를 사용자가 알 수 없다
        webconsolejs["common/api/services/k8s_api"].createK8sClusterDynamic(
            selectedWorkspaceProject.nsId,
            createData
        ).catch(function (error) {
            console.error("Failed to send cluster creation request:", error);
            webconsolejs['common/util'].showToast('Failed to send cluster creation request', 'error');
        });

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

        // 2초 대기 후 PMK 목록 새로고침 (CSP에 생성 명령이 전달되는 시간 고려)
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refreshPmkList();

        // 클러스터 생성 폼 섹션을 닫기 (NodeGroup이 표시되어 있든 없든 항상 실행)
        const createClusterSection = document.querySelector('#createcluster');
        if (createClusterSection && createClusterSection.classList.contains('active')) {
            webconsolejs["partials/layout/navigatePages"].toggleElement(createClusterSection);
        }

    } catch (error) {
        console.error("failed to create cluster:", error);
        webconsolejs['common/util'].showToast('Failed to create cluster', 'error');
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
        if (webconsolejs["partials/operation/manage/k8s_serverrecommendation"]) {
            await webconsolejs["partials/operation/manage/k8s_serverrecommendation"].getRecommendVmInfoPmk();
        } else {
            console.error("PMK Server recommendation module not found");
            alert("K8s Node recommendation module not found");
        }
    } catch (error) {
        console.error("failed to recommend PMK spec:", error);
        alert("failed to recommend K8s spec");
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

// PMK용 Spec 테이블 초기화 - k8s_serverrecommendation.js에서 처리하므로 제거
// function initPmkSpecTable() { ... } - 중복 제거

// PMK용 선택된 행 업데이트 - k8s_serverrecommendation.js에서 처리하므로 제거  
// function updatePmkSelectedRows(data) { ... } - 중복 제거

// PMK용 Spec 정보 적용 - k8s_serverrecommendation.js에서 처리하므로 제거
// export function applyPmkSpecInfo() { ... } - 중복 제거

// PMK용 Image 모달 검증 및 열기
export function validateAndOpenImageModalPmk(event) {

    // 스펙 입력 필드 값 확인 (MCI와 동일한 검증 로직)
    var specValue = $("#nodegroup_spec_dynamic").val();

    if (!specValue || specValue.trim() === "") {
        console.warn("No PMK spec selected - validation failed");
        alert("Please select a node specification first before opening the image recommendation modal.");
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
        alert("Please select a node specification first before opening the image recommendation modal.");
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
        if (webconsolejs["partials/operation/manage/k8s_imagerecommendation"]) {
            webconsolejs["partials/operation/manage/k8s_imagerecommendation"].setImageSelectionCallbackPmk(function (selectedImage) {
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
            alert("Error opening K8s image recommendation modal. Please try again.");
        }
    }, 100); // 100ms 지연으로 이벤트 처리 완료 후 모달 열기

    } catch (error) {
        console.error("failed to open PMK image modal:", error);
        alert("failed to open K8s image modal");
    }


    return true;
}

// Desired Node Size +/- 버튼 이벤트 리스너 설정
function setupDesiredNodeSizeButtons() {
    // 기존 이벤트 핸들러 제거
    $(document).off('click', '#nodegroup_configuration_dynamic .input-number-decrement');
    $(document).off('click', '#nodegroup_configuration_dynamic .input-number-increment');
    $(document).off('change', '#nodegroup_autoscaling_dynamic');

    // AutoScaling 변경 시 min/max 활성화 제어
    $(document).on('change', '#nodegroup_autoscaling_dynamic', function () {
        if ($(this).val() === 'true') {
            $('#nodegroup_minnodesize_dynamic, #nodegroup_maxnodesize_dynamic').prop('disabled', false);
        } else {
            $('#nodegroup_minnodesize_dynamic, #nodegroup_maxnodesize_dynamic').val('').prop('disabled', true);
        }
    });

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
        if (webconsolejs["partials/operation/manage/k8s_serverrecommendation"]) {
            webconsolejs["partials/operation/manage/k8s_serverrecommendation"].filterByProviderPmk(provider);
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

if (typeof webconsolejs['pages/operation/manage/k8sworkloads'] === 'undefined') {
    webconsolejs['pages/operation/manage/k8sworkloads'] = {};
}

// PMK 관련 함수들 등록
webconsolejs['pages/operation/manage/k8sworkloads'].initPmk = initPmk;
webconsolejs['pages/operation/manage/k8sworkloads'].refreshPmkList = refreshPmkList;
webconsolejs['pages/operation/manage/k8sworkloads'].getSelectedPmkData = getSelectedPmkData;
webconsolejs['pages/operation/manage/k8sworkloads'].getSelectedClusterContext = getSelectedClusterContext;
webconsolejs['pages/operation/manage/k8sworkloads'].deletePmk = deletePmk;
webconsolejs['pages/operation/manage/k8sworkloads'].deleteNodeGroup = deleteNodeGroup;
webconsolejs['pages/operation/manage/k8sworkloads'].openAutoscalingModal = openAutoscalingModal;
webconsolejs['pages/operation/manage/k8sworkloads'].applyAutoscaling = applyAutoscaling;
webconsolejs['pages/operation/manage/k8sworkloads'].openAutoscaleSizeModal = openAutoscaleSizeModal;
webconsolejs['pages/operation/manage/k8sworkloads'].applyAutoscaleSize = applyAutoscaleSize;
webconsolejs['pages/operation/manage/k8sworkloads'].exportNodeGroups = exportNodeGroups;
webconsolejs['pages/operation/manage/k8sworkloads'].importNodeGroups = importNodeGroups;
webconsolejs['pages/operation/manage/k8sworkloads'].toggleNodeCheck = toggleNodeCheck;
webconsolejs['pages/operation/manage/k8sworkloads'].handleNodeCheck = handleNodeCheck;
webconsolejs['pages/operation/manage/k8sworkloads'].nodeGroupDetailInfo = nodeGroupDetailInfo;
webconsolejs['pages/operation/manage/k8sworkloads'].toggleExpertCreation = toggleExpertCreation;
webconsolejs['pages/operation/manage/k8sworkloads'].initFormDynamic = initFormDynamic;
webconsolejs['pages/operation/manage/k8sworkloads'].changeCloudConnectionDynamic = changeCloudConnectionDynamic;
webconsolejs['pages/operation/manage/k8sworkloads'].onProviderChangeDynamic = onProviderChangeDynamic;
webconsolejs['pages/operation/manage/k8sworkloads'].showNodeGroupFormDynamic = showNodeGroupFormDynamic;
webconsolejs['pages/operation/manage/k8sworkloads'].hideNodeGroupFormDynamic = hideNodeGroupFormDynamic;
webconsolejs['pages/operation/manage/k8sworkloads'].deployPmkDynamic = deployPmkDynamic;
webconsolejs['pages/operation/manage/k8sworkloads'].showRecommendSpecSettingPmk = showRecommendSpecSettingPmk;
webconsolejs['pages/operation/manage/k8sworkloads'].getRecommendVmInfoPmk = getRecommendVmInfoPmk;
// webconsolejs['pages/operation/manage/k8sworkloads'].applyPmkSpecInfo = applyPmkSpecInfo; // 중복 제거 - k8s_serverrecommendation.js에서 처리
webconsolejs['pages/operation/manage/k8sworkloads'].validateAndOpenImageModalPmk = validateAndOpenImageModalPmk;
webconsolejs['pages/operation/manage/k8sworkloads'].setupPmkSpecModalEvents = setupPmkSpecModalEvents; // PMK Spec 모달 이벤트 리스너 등록
webconsolejs['pages/operation/manage/k8sworkloads'].filterByProviderPmk = filterByProviderPmk; // PMK용 Provider 필터링 함수 등록
webconsolejs['pages/operation/manage/k8sworkloads'].callbackPmkServerRecommendation = callbackPmkServerRecommendation; // PMK용 Server Recommendation 콜백 함수 등록

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
    if (webconsolejs["partials/operation/manage/k8s_serverrecommendation"]) {
        webconsolejs["partials/operation/manage/k8s_serverrecommendation"].initServerRecommendationPmk(webconsolejs["pages/operation/manage/k8sworkloads"].callbackPmkServerRecommendation);
    } else {
        console.error("PMK Server recommendation module not found");
    }

    // PMK용 이미지 추천 모달 초기화
    if (webconsolejs["partials/operation/manage/k8s_imagerecommendation"]) {
        webconsolejs["partials/operation/manage/k8s_imagerecommendation"].initImageModalPmk();
    } else {
        console.error("PMK Image recommendation module not found");
    }

    pmkInitialized = true;
});

// Add NodeGroup 버튼 상태 업데이트
function updateAddNodeGroupButtonState(clusterStatus) {
    const addNodeGroupBtns = document.querySelectorAll('a[onclick*="addNewNodeGroup"]');

    addNodeGroupBtns.forEach(btn => {
        if (!currentPmkId) {
            // Cluster가 선택되지 않은 경우
            btn.classList.add('disabled');
            btn.style.pointerEvents = 'none';
            btn.title = 'Please select a cluster first';
        } else if (clusterStatus === 'Active') {
            // Active 상태인 경우 활성화
            btn.classList.remove('disabled');
            btn.style.pointerEvents = 'auto';
            btn.title = 'Add NodeGroup to this cluster';
        } else {
            // Active가 아닌 경우 비활성화
            btn.classList.add('disabled');
            btn.style.pointerEvents = 'none';
            btn.title = 'NodeGroup can only be added when cluster is Active. Current status: ' + clusterStatus;
        }
    });
}

// NodeGroup Delete 액션 상태 갱신.
//
// Alibaba ACK / Tencent TKE 등은 클러스터 생성 시 만들어진 최초 NodeGroup을 단독 삭제할 수 없다
// (model.K8sNodeGroupInfo.isInitialNodeGroup). 클러스터를 지울 때 함께 사라진다.
// <a>는 .disabled 클래스만으로 onclick이 막히지 않으므로 pointerEvents도 함께 꺼야 한다.
function updateNodeGroupActionState() {
    const deleteItems = document.querySelectorAll('a.dropdown-item[onclick*="deleteNodeGroup"]');
    if (deleteItems.length === 0) {
        return;
    }

    const nodeGroupInfo = currentNodeGroupName ? findSelectedNodeGroupInfo() : null;
    const isInitial = nodeGroupInfo?.isInitialNodeGroup === true;

    deleteItems.forEach(item => {
        if (isInitial) {
            item.classList.add('disabled');
            item.style.pointerEvents = 'none';
            item.title = INITIAL_NODEGROUP_DELETE_BLOCKED;
        } else {
            item.classList.remove('disabled');
            item.style.pointerEvents = 'auto';
            item.title = '';
        }
    });
}
