# Hybrid Loader Pattern 가이드

## 개요

Hybrid Loader Pattern은 여러 API를 동시에 호출할 때 각각의 진행 상황을 독립적으로 표시할 수 있는 로더 시스템입니다.

### 문제점

기존 시스템에서는 여러 API를 동시에 호출할 때 먼저 응답을 받는 API가 전체 페이지 로더를 닫아버려, 나머지 API가 아직 진행 중임에도 프로그레스 표시가 사라지는 문제가 있었습니다.

### 해결책

세 가지 로더 타입을 제공하여 상황에 맞게 선택할 수 있습니다:
- **Page Loader**: 전체 페이지를 블로킹하는 중요한 작업
- **Toast Loader**: 개별 API마다 독립적인 프로그레스 표시
- **No Loader**: 백그라운드 작업, 사용자 인지 불필요

## Loader Type 선택 기준

### 🔵 PAGE LOADER (전체 페이지 로더)

**사용 시나리오**:
- 사용자 액션으로 시작된 중요한 작업
- 페이지 전체가 블로킹되어야 하는 작업
- 작업 완료까지 다른 조작을 막아야 하는 경우
- **동기적으로 결과를 기다려야 하는 조회 작업** ✨

**예시**:
- 생성 (Create Cluster, Create NodeGroup)
- 삭제 (Delete Cluster, Delete NodeGroup)
- 수정 (Update Configuration)
- 실행 (Start, Stop, Reboot)
- **목록 조회 (GetAllK8sCluster)** ✨
- **상세 조회 (Getk8scluster)** ✨
- **Refresh 버튼 클릭** ✨

```javascript
{
  loaderType: 'page'
}
```

### 🟢 TOAST LOADER (개별 프로그레스 toast)

**사용 시나리오**:
- 백그라운드 데이터 로딩
- **비동기적으로 독립적으로 로딩되는 부가 데이터** ✨
- 일부 데이터 로딩이 실패해도 페이지 사용이 가능한 경우
- 사용자가 기다리지 않아도 되는 데이터

**예시**:
- 모니터링 데이터 (실시간 통계)
- 대시보드 위젯
- 백그라운드 통계 업데이트
- 선택적 부가 정보

```javascript
{
  loaderType: 'toast',
  progressLabel: 'Loading Monitoring Data...',
  successMessage: null  // 성공 메시지 표시 안 함
}
```

### ⚪ NO LOADER

**사용 시나리오**:
- 폴링(주기적 업데이트)
- 사용자가 인지할 필요 없는 백그라운드 작업
- 실시간 상태 업데이트
- Heartbeat, Health Check

```javascript
{
  loaderType: 'none'
}
```

## 페이지별 구현 패턴

### 1. Loader Config 정의

각 페이지 상단에 `[PAGE]_LOADER_CONFIG` 객체를 정의합니다:

```javascript
/**
 * ===================================================================
 * PMK WORKLOADS PAGE - LOADER STRATEGY
 * ===================================================================
 * 📄 Page Loader: Create, Delete, Update operations
 * 🔔 Toast Loader: Data fetching (list, details, monitoring)
 * ⚪ No Loader: Background status updates
 * ===================================================================
 */

const PMK_LOADER_CONFIG = {
  // 생성/삭제/수정 작업 - PAGE LOADER
  create: {
    cluster: { loaderType: 'page' },
    nodeGroup: { loaderType: 'page' }
  },
  
  delete: {
    cluster: { loaderType: 'page' },
    nodeGroup: { loaderType: 'page' }
  },
  
  update: {
    cluster: { loaderType: 'page' },
    nodeGroup: { loaderType: 'page' }
  },
  
  // 조회 작업 - PAGE LOADER (동기 조회)
  fetch: {
    // 동기 조회 - 사용자가 결과를 기다려야 하는 중요한 데이터
    clusterList: {
      loaderType: 'page'  // GetAllK8sCluster
    },
    
    clusterDetail: {
      loaderType: 'page'  // Getk8scluster
    },
    
    // 비동기 조회 - 백그라운드로 독립적으로 로딩되는 부가 데이터
    monitoring: {
      loaderType: 'toast',
      progressLabel: 'Loading Monitoring Data...',
      successMessage: null
    }
  },
  
  // 백그라운드 작업 - NO LOADER
  background: {
    statusUpdate: { loaderType: 'none' },
    heartbeat: { loaderType: 'none' }
  }
};
```

### 2. API Helper 생성

Config를 사용하는 Helper 객체를 만듭니다:

```javascript
const PmkApiHelper = {
  // 조회 작업
  async getClusterList(nsId) {
    return await webconsolejs["common/api/services/pmk_api"].getClusterList(
      nsId,
      PMK_LOADER_CONFIG.fetch.clusterList
    );
  },
  
  async getClusterDetail(nsId, clusterId) {
    return await webconsolejs["common/api/services/pmk_api"].getCluster(
      nsId,
      clusterId,
      PMK_LOADER_CONFIG.fetch.clusterDetail
    );
  },
  
  async getNodeGroups(nsId, clusterId) {
    return await webconsolejs["common/api/services/pmk_api"].getNodeGroups(
      nsId,
      clusterId,
      PMK_LOADER_CONFIG.fetch.nodeGroupList
    );
  },
  
  // 생성/삭제 작업
  async createCluster(nsId, data) {
    return await webconsolejs["common/api/services/pmk_api"].createCluster(
      nsId,
      data,
      PMK_LOADER_CONFIG.create.cluster
    );
  },
  
  async deleteCluster(nsId, clusterId) {
    return await webconsolejs["common/api/services/pmk_api"].deleteCluster(
      nsId,
      clusterId,
      PMK_LOADER_CONFIG.delete.cluster
    );
  },
  
  // 여러 데이터 동시 로딩
  async loadMultipleData(nsId, clusterId) {
    return await Promise.all([
      this.getClusterDetail(nsId, clusterId),
      this.getNodeGroups(nsId, clusterId),
      webconsolejs["common/api/services/pmk_api"].getMonitoring(
        nsId,
        clusterId,
        PMK_LOADER_CONFIG.fetch.monitoring
      )
    ]);
  }
};
```

### 3. 기존 함수를 Helper 사용으로 변경

```javascript
// ❌ Before - 직접 API 호출
export async function refreshPmkList() {
  if (selectedWorkspaceProject.projectId != "") {
    var respPmkList = await webconsolejs["common/api/services/pmk_api"]
      .getClusterList(selectedNsId);
    getPmkListCallbackSuccess(selectedProjectId, respPmkList);
  }
}

// ✅ After - Helper 사용
export async function refreshPmkList() {
  if (selectedWorkspaceProject.projectId != "") {
    const config = {
      fetchListData: async () => {
        return await PmkApiHelper.getClusterList(selectedNsId);
      },
      updateListCallback: (respPmkList) => {
        getPmkListCallbackSuccess(selectedProjectId, respPmkList);
      },
      // ... 나머지 config
    };
    
    await webconsolejs['common/utils/listRefreshPattern'].execute(config);
  }
}
```

## 사용 예시

### 단일 API 호출 (Page Loader)

```javascript
export async function deletePmk() {
  // ... validation ...
  
  // Page Loader가 자동으로 표시됨
  const result = await PmkApiHelper.deleteCluster(
    selectedNsId,
    currentPmkId
  );

  if (result && result.status === 200) {
    alert('Cluster deleted successfully');
    await refreshPmkList();
  }
}
```

### 여러 API 동시 호출 (Toast Loader)

```javascript
export async function getSelectedPmkData() {
  if (currentPmkId) {
    try {
      // 3개의 Toast가 동시에 표시됨
      // 각 API가 완료되면 해당 Toast만 사라짐
      const [clusterDetail, nodeGroups, monitoring] = 
        await PmkApiHelper.loadMultipleData(selectedNsId, currentPmkId);
      
      if (clusterDetail && clusterDetail.status === 200) {
        setPmkInfoData(clusterDetail.data);
      }
      
      if (nodeGroups && nodeGroups.status === 200) {
        displayNodeGroupList(nodeGroups.data);
      }
      
      if (monitoring && monitoring.status === 200) {
        displayMonitoringData(monitoring.data);
      }
    } catch (error) {
      console.error('Error loading PMK data:', error);
    }
  }
}
```

### 목록 새로고침 (Toast Loader)

```javascript
export async function refreshPmkList() {
  if (selectedWorkspaceProject.projectId != "") {
    const config = {
      getSelectionId: () => currentPmkId,
      detailElementIds: ['cluster_info'],
      detailElementsToEmpty: ['pmk_nodegroup_info_box', 'pmk_node_info_box'],
      formsToClose: ['nodegroup_configuration'],
      
      fetchListData: async () => {
        // "Loading PMK Clusters..." toast 표시
        return await PmkApiHelper.getClusterList(selectedNsId);
      },
      
      updateListCallback: (respPmkList) => {
        getPmkListCallbackSuccess(selectedProjectId, respPmkList);
      },
      
      // ... 나머지 config
    };

    await webconsolejs['common/utils/listRefreshPattern'].execute(config);
  }
}
```

## UI 표시 예시

### Page Loader
전체 화면을 덮는 로더:
```
┌────────────────────────────────────┐
│                                    │
│         🔄 Preparing Data          │
│                                    │
└────────────────────────────────────┘
```

### Toast Loader
화면 우측 상단에 쌓이는 독립적인 toast:
```
                         ┌─────────────────────────────┐
                         │ 🔄 Loading PMK Clusters...  │
                         └─────────────────────────────┘
                         ┌─────────────────────────────┐
                         │ 🔄 Loading Node Groups...   │
                         └─────────────────────────────┘
                         ┌─────────────────────────────┐
                         │ 🔄 Loading Monitoring...    │
                         └─────────────────────────────┘
```

## 다른 페이지 적용 가이드

### VM Workloads 적용 예시

```javascript
// vm.js

const VM_LOADER_CONFIG = {
  create: {
    vm: { loaderType: 'page' }
  },
  
  delete: {
    vm: { loaderType: 'page' }
  },
  
  fetch: {
    vmList: {
      loaderType: 'toast',
      progressLabel: 'Loading VMs...'
    },
    vmDetail: {
      loaderType: 'toast',
      progressLabel: 'Loading VM Details...'
    }
  },
  
  action: {
    start: { loaderType: 'page' },
    stop: { loaderType: 'page' },
    reboot: { loaderType: 'page' }
  }
};

const VmApiHelper = {
  async getVmList(nsId) {
    return await webconsolejs["common/api/services/vm_api"].getVmList(
      nsId,
      VM_LOADER_CONFIG.fetch.vmList
    );
  },
  
  async startVm(nsId, vmId) {
    return await webconsolejs["common/api/services/vm_api"].startVm(
      nsId,
      vmId,
      VM_LOADER_CONFIG.action.start
    );
  }
};
```

## 구현 체크리스트

새로운 페이지에 패턴을 적용할 때:

- [ ] `[PAGE]_LOADER_CONFIG` 객체 정의
- [ ] `[Page]ApiHelper` 객체 생성
- [ ] 기존 API 호출을 Helper로 변경
- [ ] Page Loader가 필요한 작업 확인
- [ ] Toast Loader가 필요한 작업 확인
- [ ] 여러 API 동시 호출 시나리오 확인
- [ ] 테스트 (단일 API, 복수 API)

## 주의사항

1. **성공 메시지**: 대부분의 조회 작업은 `successMessage: null`로 설정하여 성공 메시지를 표시하지 않습니다.

2. **에러 처리**: Toast loader는 에러 발생 시 자동으로 에러 toast를 표시하지 않습니다. 필요시 별도 처리가 필요합니다.

3. **동시 호출**: `Promise.all`을 사용하여 여러 API를 동시에 호출할 때 각 Toast가 독립적으로 표시됩니다.

4. **기본값**: `loaderType`을 지정하지 않으면 기본적으로 `page` loader가 사용됩니다.

## 기술적 구현

### http.js의 로직

```javascript
export async function commonAPIPost(url, data, attempt, options = {}) {
  const loaderType = options.loaderType || 'page';
  let toastId = null;
  
  try {
    // Loader 시작
    if (loaderType === 'toast') {
      toastId = showAPIProgressToast(url, options.progressLabel);
    } else if (loaderType === 'page') {
      activePageLoader();
    }
    
    // API 호출
    const response = await axios.post(url, data);
    
    return response;
  } catch (error) {
    // 에러 처리
    throw error;
  } finally {
    // Loader 종료 (항상 실행)
    if (loaderType === 'toast' && toastId) {
      hideAPIProgressToast(toastId, success, options.successMessage);
    } else if (loaderType === 'page') {
      deactivePageLoader();
    }
  }
}
```

## 트러블슈팅

### Toast가 표시되지 않음

**원인**: Toast 시스템이 초기화되지 않았거나 `webconsolejs['common/utils/toast']`가 로드되지 않음

**해결**: HTML에서 `toast.js`가 `http.js` 이전에 로드되는지 확인

### Page Loader가 닫히지 않음

**원인**: API 호출 중 에러가 발생했지만 `finally` 블록이 실행되지 않음

**해결**: `try-finally` 구조 확인 및 `deactivePageLoader()` 호출 확인

### 여러 Toast가 겹쳐 보임

**정상 동작**: Toast는 화면 우측 상단에 쌓이도록 설계되었습니다. 각 Toast는 독립적으로 사라집니다.

## 관련 파일

- **유틸리티**: `front/assets/js/common/api/http.js`
- **Toast 시스템**: `front/assets/js/common/utils/toast.js`
- **적용 예시**: `front/assets/js/pages/operation/manage/pmk.js`
- **문서**: `doc/frontend/HybridLoaderPattern.md` (현재 문서)

## 버전 히스토리

- **v1.0.0** (2024): 초기 구현 및 PMK 화면 적용

