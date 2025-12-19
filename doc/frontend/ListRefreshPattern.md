# List Refresh Pattern 가이드

## 개요

List Refresh Pattern은 목록 화면의 일관된 refresh 동작을 제공하는 공통 패턴입니다. 이 패턴을 사용하면 다음과 같은 이점을 얻을 수 있습니다:

- **일관성**: 모든 목록 화면에서 동일한 refresh 동작
- **재사용성**: 설정 객체만 변경하면 어디서든 사용 가능
- **유지보수**: 패턴 수정 시 한 곳만 변경
- **확장성**: 새로운 화면 추가 시 설정만 정의
- **에러 처리**: 공통 에러 처리 로직

## 주요 기능

1. **상태 저장 및 복원**: 현재 선택된 항목을 자동으로 저장하고 refresh 후 복원
2. **UI 초기화**: 상세 영역 숨기기, 내용 비우기, 폼 닫기를 자동으로 처리
3. **에러 처리**: 통합된 에러 처리 및 사용자 피드백
4. **유연한 설정**: 각 화면의 특성에 맞게 설정 가능

## 사용 방법

### 1. 기본 사용법

```javascript
// 1단계: Config 객체 정의
const config = {
  // 필수: 현재 선택된 ID 반환
  getSelectionId: () => currentItemId,
  
  // 선택: 숨길 element ID 배열
  detailElementIds: ['detail_info'],
  
  // 선택: 비울 element ID 배열
  detailElementsToEmpty: ['detail_content', 'sub_info'],
  
  // 선택: 닫을 폼 ID 배열
  formsToClose: ['edit_form'],
  
  // 필수: 데이터 조회 함수
  fetchListData: async () => {
    return await api.getList(nsId);
  },
  
  // 필수: 목록 업데이트 함수
  updateListCallback: (data) => {
    updateTable(data);
  },
  
  // 선택: Row 조회 함수
  getRowById: (id) => {
    try { return table.getRow(id); }
    catch (e) { return null; }
  },
  
  // 선택: Row 선택 함수
  selectRow: (id) => {
    table.selectRow(id);
  },
  
  // 선택: 상세 정보 표시 함수
  showDetailData: async () => {
    await loadDetailData();
  },
  
  // 선택: 선택 상태 초기화 함수
  clearSelectionState: () => {
    currentItemId = '';
    selectedData = {};
  },
  
  // 선택: 에러 메시지
  errorMessage: 'Failed to refresh list.'
};

// 2단계: Pattern 실행
await webconsolejs['common/utils/listRefreshPattern'].execute(config);
```

### 2. Refresh 함수에 통합

```javascript
export async function refreshMyList() {
  if (selectedWorkspaceProject.projectId != "") {
    const config = getRefreshConfig();
    await webconsolejs['common/utils/listRefreshPattern'].execute(config);
  }
}
```

## Config 옵션 상세

### 필수 옵션

#### `fetchListData: async () => Promise`
목록 데이터를 가져오는 비동기 함수입니다.

```javascript
fetchListData: async () => {
  return await webconsolejs["common/api/services/my_api"].getList(selectedNsId);
}
```

#### `updateListCallback: (data) => void`
가져온 데이터로 목록을 업데이트하는 함수입니다.

```javascript
updateListCallback: (respList) => {
  getListCallbackSuccess(selectedProjectId, respList);
}
```

### 선택 옵션

#### `getSelectionId: () => string`
현재 선택된 항목의 ID를 반환하는 함수입니다. 이 함수를 제공하면 refresh 후 선택 상태가 자동으로 복원됩니다.

```javascript
getSelectionId: () => currentPmkId
```

#### `detailElementIds: string[]`
숨겨야 할 상세 영역 element ID 배열입니다.

```javascript
detailElementIds: ['cluster_info', 'node_info']
```

#### `detailElementsToEmpty: string[]`
내용을 비워야 할 element ID 배열입니다.

```javascript
detailElementsToEmpty: ['pmk_nodegroup_info_box', 'pmk_node_info_box']
```

#### `formsToClose: string[]`
닫아야 할 폼 element ID 배열입니다. `active` 클래스를 확인하여 열려있는 폼만 닫습니다.

```javascript
formsToClose: ['nodegroup_configuration', 'cluster_edit_form']
```

#### `getRowById: (id) => object|null`
ID로 테이블 row 객체를 가져오는 함수입니다. 선택 상태 복원에 사용됩니다.

```javascript
getRowById: (id) => {
  try {
    return pmkListTable.getRow(id);
  } catch (e) {
    return null;
  }
}
```

#### `selectRow: (id) => void`
테이블에서 특정 row를 선택하는 함수입니다.

```javascript
selectRow: (id) => {
  toggleRowSelection(id);
}
```

#### `showDetailData: async () => Promise`
선택된 항목의 상세 정보를 표시하는 비동기 함수입니다.

```javascript
showDetailData: async () => {
  await getSelectedPmkData();
}
```

#### `clearSelectionState: () => void`
선택 상태를 초기화하는 함수입니다. 선택된 항목이 삭제된 경우 호출됩니다.

```javascript
clearSelectionState: () => {
  currentPmkId = '';
  currentNodeGroupName = '';
  currentProvider = '';
  selectedClusterData = {};
}
```

#### `errorMessage: string`
에러 발생 시 표시할 메시지입니다. 지정하지 않으면 기본 메시지가 표시됩니다.

```javascript
errorMessage: 'Failed to refresh PMK list. Please try again.'
```

## 실제 적용 예시 (PMK)

### 전체 코드

```javascript
/**
 * PMK 목록 새로고침
 * Refresh PMK list
 */
export async function refreshPmkList() {
  if (selectedWorkspaceProject.projectId != "") {
    var selectedProjectId = selectedWorkspaceProject.projectId;
    var selectedNsId = selectedWorkspaceProject.nsId;

    // List Refresh Pattern 설정
    const config = {
      getSelectionId: () => currentPmkId,
      detailElementIds: ['cluster_info'],
      detailElementsToEmpty: ['pmk_nodegroup_info_box', 'pmk_node_info_box'],
      formsToClose: ['nodegroup_configuration'],
      
      fetchListData: async () => {
        return await webconsolejs["common/api/services/pmk_api"]
          .getClusterList(selectedNsId);
      },
      
      updateListCallback: (respPmkList) => {
        getPmkListCallbackSuccess(selectedProjectId, respPmkList);
      },
      
      getRowById: (id) => {
        try { return pmkListTable.getRow(id); }
        catch (e) { return null; }
      },
      
      selectRow: (id) => {
        toggleRowSelection(id);
      },
      
      showDetailData: async () => {
        await getSelectedPmkData();
      },
      
      clearSelectionState: () => {
        currentPmkId = '';
        currentNodeGroupName = '';
        currentProvider = '';
        selectedClusterData = {};
      },
      
      errorMessage: 'Failed to refresh PMK list. Please try again.'
    };

    await webconsolejs['common/utils/listRefreshPattern'].execute(config);
  }
}
```

### 적용 시나리오

PMK 화면에서 다음 모든 시나리오에서 일관되게 동작합니다:

1. **화면 최초 로드 시**: `initPmk()` → `refreshPmkList()`
2. **Refresh 아이콘 클릭**: 직접 `refreshPmkList()` 호출
3. **NodeGroup 추가 후**: `createNode()` → `refreshPmkList()`
4. **NodeGroup 삭제 후**: `deleteNodeGroup()` → `refreshPmkList()`
5. **Cluster 삭제 후**: `deletePmk()` → `refreshPmkList()`

## 다른 화면 적용 가이드

### VM Workloads 화면 적용 예시

```javascript
export async function refreshVmList() {
  if (selectedWorkspaceProject.projectId != "") {
    var selectedProjectId = selectedWorkspaceProject.projectId;
    var selectedNsId = selectedWorkspaceProject.nsId;

    const config = {
      getSelectionId: () => currentVmId,
      detailElementIds: ['vm_detail_info'],
      detailElementsToEmpty: ['vm_monitoring_box', 'vm_ssh_terminal_box'],
      formsToClose: ['vm_configuration_form'],
      
      fetchListData: async () => {
        return await webconsolejs["common/api/services/vm_api"]
          .getVmList(selectedNsId);
      },
      
      updateListCallback: (respVmList) => {
        getVmListCallbackSuccess(selectedProjectId, respVmList);
      },
      
      getRowById: (id) => {
        try { return vmListTable.getRow(id); }
        catch (e) { return null; }
      },
      
      selectRow: (id) => {
        toggleVmRowSelection(id);
      },
      
      showDetailData: async () => {
        await getSelectedVmData();
      },
      
      clearSelectionState: () => {
        currentVmId = '';
        selectedVmData = {};
      },
      
      errorMessage: 'Failed to refresh VM list. Please try again.'
    };

    await webconsolejs['common/utils/listRefreshPattern'].execute(config);
  }
}
```

### 적용 체크리스트

새로운 화면에 패턴을 적용할 때 다음 체크리스트를 따르세요:

- [ ] 현재 refresh 로직 분석
- [ ] 전역 변수 식별 (선택 상태, 상세 데이터 등)
- [ ] UI 요소 식별 (상세 영역, 폼 등)
- [ ] Config 객체 작성
- [ ] 기존 refresh 함수를 패턴 사용 방식으로 변경
- [ ] 모든 refresh 호출 지점에서 테스트
- [ ] JSDoc 주석 추가

## 실행 흐름

```
사용자 액션 (삭제/추가/새로고침)
  ↓
refreshList() 호출
  ↓
ListRefreshPattern.execute(config)
  ↓
1. 현재 선택 ID 저장 (getSelectionId)
  ↓
2. UI 초기화
   - 상세 영역 숨기기 (detailElementIds)
   - 내용 비우기 (detailElementsToEmpty)
   - 폼 닫기 (formsToClose)
  ↓
3. 데이터 조회 (fetchListData)
  ↓
4. 목록 업데이트 (updateListCallback)
  ↓
5. 선택 상태 복원
   ├─ 항목 존재 → selectRow + showDetailData
   └─ 항목 삭제 → clearSelectionState
  ↓
완료
```

## 트러블슈팅

### 문제: Pattern이 undefined 에러

**원인**: Webpack이 유틸리티를 번들링하지 못했거나 로드 순서 문제

**해결**:
1. 브라우저 콘솔에서 확인:
   ```javascript
   console.log(webconsolejs['common/utils/listRefreshPattern']);
   ```
2. 유틸리티 파일이 올바르게 export되었는지 확인
3. 페이지 새로고침 (Ctrl+F5)

### 문제: 선택 상태가 복원되지 않음

**원인**: `getRowById`가 제대로 작동하지 않거나 ID가 변경됨

**해결**:
1. `getRowById` 함수가 올바르게 구현되었는지 확인
2. try-catch로 에러를 잡고 null 반환하는지 확인
3. ID가 refresh 전후에 동일한지 확인

### 문제: 상세 영역이 숨겨지지 않음

**원인**: Element ID가 잘못되었거나 jQuery 선택자 문제

**해결**:
1. Element ID가 올바른지 확인 (대소문자 구분)
2. 브라우저 개발자 도구에서 Element 확인
3. `$('#element_id').length`로 존재 여부 확인

### 문제: 폼이 닫히지 않음

**원인**: 폼이 `active` 클래스를 사용하지 않거나 다른 토글 방식 사용

**해결**:
1. 폼의 실제 토글 방식 확인
2. 필요시 `formsToClose` 대신 `resetUI`에서 커스텀 로직 추가
3. 또는 config에 커스텀 폼 닫기 함수 추가

## 향후 적용 대상 화면

우선순위 순서로 다음 화면에 패턴을 적용할 예정입니다:

### 1순위: VM Workloads
- 파일: `front/assets/js/pages/operation/manage/vm.js`
- 예상 작업: 1-2시간
- 복잡도: 중간

### 2순위: MCI Workloads
- 파일: `front/assets/js/pages/operation/manage/mci.js`
- 예상 작업: 1-2시간
- 복잡도: 중간

### 3순위: NLB Workloads
- 파일: `front/assets/js/pages/operation/manage/nlb.js`
- 예상 작업: 1시간
- 복잡도: 낮음

### 4순위: Disk Management
- 파일: `front/assets/js/pages/operation/manage/disk.js`
- 예상 작업: 1시간
- 복잡도: 낮음

### 5순위: Security Group Management
- 파일: `front/assets/js/pages/operation/manage/securityGroup.js`
- 예상 작업: 1-2시간
- 복잡도: 중간

## 관련 파일

- **유틸리티**: `front/assets/js/common/utils/listRefreshPattern.js`
- **적용 예시**: `front/assets/js/pages/operation/manage/pmk.js`
- **문서**: `doc/frontend/ListRefreshPattern.md` (현재 문서)

## 참고 사항

- 모든 함수는 JSDoc으로 한글/영문 병기 주석 작성
- 코딩 규칙 준수 (2칸 들여쓰기, 작은따옴표, 세미콜론)
- 에러 처리는 항상 포함
- 선택 옵션이지만 가능한 모든 옵션 구현 권장

## 버전 히스토리

- **v1.0.0** (2024): 초기 구현 및 PMK 화면 적용

