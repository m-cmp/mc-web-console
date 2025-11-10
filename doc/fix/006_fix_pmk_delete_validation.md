# Fix 006: PMK Delete 및 NodeGroup Delete Validation 추가

## 개요

**작성일**: 2025-11-09  
**버그 ID**: 006  
**심각도**: High  
**상태**: Fixed

## 문제 발견

PMK(Platform Managed Kubernetes) 페이지에서 Delete 버튼 클릭 시 다음 문제들이 발견됨:

1. **Validation Check 누락**: PMK를 선택하지 않고 Delete 버튼 클릭 시 빈 clusterId로 API 호출
2. **API 파라미터 검증 없음**: `Deletek8scluster` API 호출 시 필수 파라미터(nsId, k8sClusterId) 검증 없음
3. **NodeGroup Delete도 동일 문제**: NodeGroup 삭제 시에도 validation 없음

## 문제 분석

### 1. deletePmk() 함수 - Validation 누락

**파일**: `front/assets/js/pages/operation/manage/pmk.js`

#### 문제 코드 (라인 194-198)

```javascript
export function deletePmk() {

    var selectedNsId = selectedWorkspaceProject.nsId;
    webconsolejs["common/api/services/pmk_api"].pmkDelete(selectedNsId, currentPmkId)
}
```

**문제점**:
- `currentPmkId`가 빈 문자열("")인 상태에서도 API 호출 가능
- PMK를 선택하지 않아도 Delete 버튼 클릭 시 동작
- `selectedNsId`가 빈 값이어도 검증 없이 API 호출
- 사용자에게 어떤 피드백도 제공하지 않음

#### 변수 초기값 (라인 29)

```javascript
var currentPmkId = "";
```

- `currentPmkId`는 초기값이 빈 문자열
- PMK를 선택하기 전까지는 빈 값 유지
- rowClick 이벤트에서만 값 설정됨 (라인 747)

### 2. deleteNodeGroup() 함수 - 동일 문제

**파일**: `front/assets/js/pages/operation/manage/pmk.js`

#### 문제 코드 (라인 201-206)

```javascript
export function deleteNodeGroup() {

    var selectedNsId = selectedWorkspaceProject.nsId;
    webconsolejs["common/api/services/pmk_api"].nodeGroupDelete(selectedNsId, currentPmkId, currentNodeGroupName)

}
```

**문제점**:
- `currentNodeGroupName`이 빈 값이어도 API 호출
- `currentPmkId`가 없어도 API 호출
- validation 전혀 없음

### 3. API 레벨 검증 부재

**파일**: `front/assets/js/common/api/services/pmk_api.js`

#### pmkDelete() 함수 (라인 618-630)

```javascript
export function pmkDelete(nsId, k8sClusterId) {
  let data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
    },
  };
  let controller = "/api/" + "mc-infra-manager/" + "Deletek8scluster";
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
}
```

**문제점**:
- 파라미터 검증 없이 바로 API 호출
- 빈 값이 전달되어도 API 요청 진행
- response 처리 없음
- 에러 핸들링 없음

#### nodeGroupDelete() 함수 (라인 632-646)

```javascript
export function nodeGroupDelete(nsId, k8sClusterId, k8sNodeGroupName) {

  let data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
      k8sNodeGroupName: k8sNodeGroupName
    },
  };
  let controller = "/api/" + "mc-infra-manager/" + "Deletek8snodegroup";
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
}
```

**문제점**:
- 필수 파라미터 3개 모두 검증 없음
- 에러 처리 없음

### 4. 비교: 다른 함수는 Validation 있음

**파일**: `front/assets/js/common/api/services/pmk_api.js`

#### getCluster() 함수 (라인 27-47) - 정상 예시

```javascript
export async function getCluster(nsId, clusterId) {
  if (nsId == "" || nsId == undefined || clusterId == undefined || clusterId == "") {
    alert(" undefined nsId: " + nsId + " clusterId " + clusterId);
    return;
  }
  // ... API 호출
}
```

**특징**:
- 필수 파라미터 검증 있음
- undefined와 빈 문자열 모두 체크

## 재현 방법

### 시나리오 1: PMK 선택 없이 삭제 시도

1. PMK Workloads 페이지 접속
2. PMK 목록에서 **아무것도 선택하지 않음**
3. 우측 상단 Action 드롭다운 → Delete 클릭
4. 확인 모달에서 OK 클릭
5. **결과**: 
   - API 호출: `/api/mc-infra-manager/Deletek8scluster`
   - Request Payload:
     ```json
     {
       "pathParams": {
         "nsId": "ns01",
         "k8sClusterId": ""  // ← 빈 문자열
       }
     }
     ```
   - 서버 에러 발생 또는 잘못된 동작

### 시나리오 2: Workspace/Project 미선택 상태

1. 로그인 직후 (Workspace/Project 선택 안 한 상태)
2. PMK Workloads 페이지 접속
3. PMK 선택 후 Delete 클릭
4. **결과**:
   - `selectedNsId`가 undefined 또는 빈 값
   - 잘못된 API 호출

## 수정 내용

### 기존 Modal 시스템 활용

프로젝트에서 Workspace 미선택 시 사용하는 `commonShowDefaultModal` 방식 적용:

**파일**: `front/assets/js/partials/layout/modal.js` (라인 47-54, 65-69)

```javascript
// default modal show
export function commonShowDefaultModal(title, content) {
    const modalId = 'commonDefaultModal';
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    document.getElementById(`${modalId}-title`).innerText = title;
    document.getElementById(`${modalId}-content`).innerText = content;
    document.getElementById(`${modalId}-confirm-btn`).onclick = modalHide('commonDefaultModal')
    modal.show();
}

// workspace selection 여부 확인 function
export function checkWorkspaceSelection(selectedWorkspaceProject) {
    if (selectedWorkspaceProject.workspaceId == "") {
        commonShowDefaultModal('Workspace Selection Check', 'Please select workspace first')
    }
}
```

### 1. deletePmk() 함수 개선

**파일**: `front/assets/js/pages/operation/manage/pmk.js` (라인 194-198)

#### 수정 후 코드

```javascript
// pmk 삭제
export function deletePmk() {
  // Validation 1: PMK가 선택되었는지 확인
  if (!currentPmkId || currentPmkId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'PMK Selection Check',
      'Please select a PMK to delete.'
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

  // Validation 통과 후 API 호출
  webconsolejs['common/api/services/pmk_api'].pmkDelete(selectedNsId, currentPmkId);
}
```

**개선 사항**:
- PMK 선택 여부 검증 추가
- Workspace/Project 선택 여부 검증 추가
- 기존 `checkWorkspaceSelection`과 동일한 모달 스타일 사용
- `commonDefaultModal` 사용으로 일관된 UI 제공
- 모달은 중앙에 표시되며 Cancel/Confirm 버튼 제공

### 2. deleteNodeGroup() 함수 개선

**파일**: `front/assets/js/pages/operation/manage/pmk.js` (라인 201-206)

#### 수정 후 코드

```javascript
// nodegroup 삭제
export function deleteNodeGroup() {
  // Validation 1: NodeGroup이 선택되었는지 확인
  if (!currentNodeGroupName || currentNodeGroupName === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'NodeGroup Selection Check',
      'Please select a NodeGroup to delete.'
    );
    return;
  }

  // Validation 2: PMK가 선택되었는지 확인
  if (!currentPmkId || currentPmkId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'PMK Selection Check',
      'Please select a PMK first.'
    );
    return;
  }

  // Validation 3: Workspace/Project가 선택되었는지 확인
  var selectedNsId = selectedWorkspaceProject.nsId;
  if (!selectedNsId || selectedNsId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Workspace Selection Check',
      'Please select a workspace and project first.'
    );
    return;
  }

  // Validation 통과 후 API 호출
  webconsolejs['common/api/services/pmk_api'].nodeGroupDelete(
    selectedNsId,
    currentPmkId,
    currentNodeGroupName
  );
}
```

**개선 사항**:
- NodeGroup 선택 여부 검증
- PMK 선택 여부 검증
- Workspace/Project 선택 여부 검증
- 3단계 검증으로 안전성 강화
- 모달로 명확한 피드백

### 3. pmkDelete() API 함수 개선

**파일**: `front/assets/js/common/api/services/pmk_api.js` (라인 618-630)

#### 수정 후 코드

```javascript
export function pmkDelete(nsId, k8sClusterId) {
  // API 레벨 Validation (추가 안전장치)
  if (!nsId || nsId === '' || !k8sClusterId || k8sClusterId === '') {
    console.error('Invalid parameters for PMK deletion:', {
      nsId: nsId,
      k8sClusterId: k8sClusterId
    });
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Invalid Parameters',
      'Invalid parameters for PMK deletion. Please try again.'
    );
    return;
  }

  let data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
    },
  };
  let controller = '/api/' + 'mc-infra-manager/' + 'Deletek8scluster';
  let response = webconsolejs['common/api/http'].commonAPIPost(
    controller,
    data
  );
  return response;
}
```

**개선 사항**:
- API 레벨에서 추가 검증 (방어적 프로그래밍)
- 필수 파라미터 2개 모두 검증
- undefined와 빈 문자열 모두 체크
- console.error로 디버깅 정보 제공
- 모달로 사용자 피드백
- response 반환하여 호출자가 처리 가능

### 4. nodeGroupDelete() API 함수 개선

**파일**: `front/assets/js/common/api/services/pmk_api.js` (라인 632-646)

#### 수정 후 코드

```javascript
export function nodeGroupDelete(nsId, k8sClusterId, k8sNodeGroupName) {
  // API 레벨 Validation (추가 안전장치)
  if (!nsId || nsId === '' || 
      !k8sClusterId || k8sClusterId === '' || 
      !k8sNodeGroupName || k8sNodeGroupName === '') {
    console.error('Invalid parameters for NodeGroup deletion:', {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
      k8sNodeGroupName: k8sNodeGroupName
    });
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Invalid Parameters',
      'Invalid parameters for NodeGroup deletion. Please try again.'
    );
    return;
  }

  let data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
      k8sNodeGroupName: k8sNodeGroupName
    },
  };
  let controller = '/api/' + 'mc-infra-manager/' + 'Deletek8snodegroup';
  let response = webconsolejs['common/api/http'].commonAPIPost(
    controller,
    data
  );
  return response;
}
```

**개선 사항**:
- 필수 파라미터 3개 모두 검증
- 상세한 에러 로그
- 모달로 사용자 피드백
- response 반환

## Modal 시스템 사용

### commonDefaultModal 개요

**템플릿**: `front/templates/partials/layout/_modal.html`

```html
<!-- commonDefaultModal -->
<div class="modal modal-blur fade" id="commonDefaultModal" tabindex="-1" style="display: none;">
    <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-body">
                <div class="modal-title" id="commonDefaultModal-title">Title</div>
                <div id="commonDefaultModal-content">Content</div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
                <button type="button" id="commonDefaultModal-confirm-btn" class="btn btn-info" data-bs-dismiss="modal">Confirm</button>
            </div>
        </div>
    </div>
</div>
```

### Modal 특성

| 특성 | 설명 |
|------|------|
| 위치 | 화면 중앙 (modal-dialog-centered) |
| 크기 | Small (modal-sm) |
| 스타일 | 블러 배경 (modal-blur) |
| 버튼 | Cancel (왼쪽), Confirm (오른쪽 파란색) |
| 차단 | Blocking (모달 닫기 전까지 다른 작업 불가) |
| 닫기 | ESC 키, Cancel 버튼, Confirm 버튼, 배경 클릭 |

### 사용 방법

```javascript
webconsolejs['partials/layout/modal'].commonShowDefaultModal(
  'Title Text',      // 모달 제목
  'Content Text'     // 모달 내용
);
```

### 기존 사용 예시

**Workspace 선택 체크**:
```javascript
export function checkWorkspaceSelection(selectedWorkspaceProject) {
    if (selectedWorkspaceProject.workspaceId == "") {
        commonShowDefaultModal('Workspace Selection Check', 'Please select workspace first')
    }
}
```

**사용 위치**:
- `front/assets/js/pages/operation/manage/pmk.js` (라인 81)
- `front/assets/js/pages/operation/manage/mci.js` (라인 64)
- `front/assets/js/pages/operation/manage/monitoring.js` (라인 38)
- 기타 10개 이상 파일에서 사용 중

## 테스트 방법

### 1. PMK 삭제 Validation 테스트

#### Test Case 1-1: PMK 미선택 상태에서 삭제 시도

1. PMK Workloads 페이지 접속
2. PMK를 **선택하지 않은 상태**에서 Delete 버튼 클릭
3. **예상 결과**:
   - ❌ API 호출 안 됨
   - ✅ 화면 중앙에 모달 표시
   - ✅ 제목: "PMK Selection Check"
   - ✅ 내용: "Please select a PMK to delete."
   - ✅ Cancel / Confirm 버튼
   - ✅ Network 탭에 API 호출 기록 없음

#### Test Case 1-2: Workspace 미선택 상태

1. 로그인 직후 (Workspace/Project 선택 전)
2. PMK Workloads 페이지 접속
3. PMK 선택 후 Delete 버튼 클릭
4. **예상 결과**:
   - ❌ API 호출 안 됨
   - ✅ 모달 제목: "Workspace Selection Check"
   - ✅ 모달 내용: "Please select a workspace and project first."

#### Test Case 1-3: 정상 삭제

1. Workspace/Project 선택
2. PMK 선택 (테이블 행 클릭)
3. Delete 버튼 클릭
4. 확인 모달에서 OK 클릭
5. **예상 결과**:
   - ✅ API 호출: `/api/mc-infra-manager/Deletek8scluster`
   - ✅ Request Payload에 올바른 nsId, k8sClusterId 포함
   - ✅ "Preparing Data" 로딩 표시
   - ✅ 성공 시 PMK 목록 새로고침

### 2. NodeGroup 삭제 Validation 테스트

#### Test Case 2-1: NodeGroup 미선택 상태

1. PMK 선택
2. NodeGroup을 **선택하지 않고** Delete NodeGroup 버튼 클릭
3. **예상 결과**:
   - ❌ API 호출 안 됨
   - ✅ 모달 제목: "NodeGroup Selection Check"
   - ✅ 모달 내용: "Please select a NodeGroup to delete."

#### Test Case 2-2: PMK 미선택 상태

1. PMK를 선택하지 않음
2. Delete NodeGroup 버튼 클릭
3. **예상 결과**:
   - ❌ API 호출 안 됨
   - ✅ 모달 제목: "PMK Selection Check"
   - ✅ 모달 내용: "Please select a PMK first."

#### Test Case 2-3: 정상 삭제

1. PMK 선택
2. NodeGroup 선택
3. Delete NodeGroup 버튼 클릭
4. **예상 결과**:
   - ✅ API 호출: `/api/mc-infra-manager/Deletek8snodegroup`
   - ✅ Request Payload에 nsId, k8sClusterId, k8sNodeGroupName 포함

### 3. API 레벨 Validation 테스트

#### Test Case 3-1: 빈 파라미터로 직접 호출 (Console 테스트)

```javascript
// 브라우저 Console에서 실행
webconsolejs['common/api/services/pmk_api'].pmkDelete('', '');
```

**예상 결과**:
- ❌ API 호출 안 됨
- ✅ Console에 에러 로그: "Invalid parameters for PMK deletion"
- ✅ 모달 제목: "Invalid Parameters"
- ✅ 모달 내용: "Invalid parameters for PMK deletion. Please try again."

#### Test Case 3-2: undefined 파라미터

```javascript
webconsolejs['common/api/services/pmk_api'].pmkDelete(undefined, undefined);
```

**예상 결과**:
- ❌ API 호출 안 됨
- ✅ validation에서 차단

### 4. Modal UI 테스트

#### Test Case 4-1: Modal 위치 확인

1. validation 에러 발생시키기
2. **확인 사항**:
   - ✅ Modal이 화면 중앙에 표시
   - ✅ 배경이 블러 처리됨
   - ✅ Modal 크기가 Small (modal-sm)

#### Test Case 4-2: Modal 닫기

1. Modal 표시된 상태에서:
   - Cancel 버튼 클릭 → 닫힘
   - Confirm 버튼 클릭 → 닫힘
   - ESC 키 → 닫힘
   - 배경 클릭 → 닫힘

#### Test Case 4-3: Modal Blocking

1. Modal 표시된 상태
2. **확인 사항**:
   - ✅ Modal 뒤의 UI 클릭 안 됨
   - ✅ Modal 닫기 전까지 다른 작업 불가

### 5. 브라우저 Console 확인

#### 정상 동작 시

- ✅ 에러 로그 없음
- ✅ API 요청 성공 로그

#### Validation 실패 시

```
Invalid parameters for PMK deletion: {nsId: "", k8sClusterId: ""}
```

## 영향 범위

### 수정된 파일

1. **front/assets/js/pages/operation/manage/pmk.js**
   - `deletePmk()` 함수 (194-198라인) → validation 추가
   - `deleteNodeGroup()` 함수 (201-206라인) → validation 추가

2. **front/assets/js/common/api/services/pmk_api.js**
   - `pmkDelete()` 함수 (618-630라인) → API 레벨 validation 추가
   - `nodeGroupDelete()` 함수 (632-646라인) → API 레벨 validation 추가

### 영향받는 기능

- PMK 삭제 기능
- NodeGroup 삭제 기능
- 관련 모달 및 확인 다이얼로그

### 하위 호환성

- ✅ API 인터페이스 변경 없음
- ✅ 기존 코드와 완벽 호환
- ✅ 기존 `commonDefaultModal` 활용으로 UI 일관성 유지
- ✅ 추가된 validation은 선택 사항이 아닌 필수사항으로 개선

## 예상 효과

### 1. 안정성 향상

- 잘못된 API 호출 방지
- 서버 에러 감소
- 데이터 무결성 보장

### 2. 사용자 경험 개선

- 명확한 에러 메시지 제공
- 기존 Modal 시스템과 일관된 UI
- Workspace 선택 체크와 동일한 스타일

### 3. 디버깅 개선

- Console에 상세한 에러 로그 출력
- 문제 원인 파악 용이

### 4. UI 일관성

- 기존 `checkWorkspaceSelection`과 동일한 방식
- 프로젝트 전반에 걸쳐 10개 이상 파일에서 사용 중인 검증된 방식
- 사용자에게 익숙한 인터페이스

## 추가 개선 사항

### 향후 고려 사항

1. **Delete 버튼 비활성화**
   - PMK 미선택 시 Delete 버튼 비활성화
   - UI 레벨에서 사전 차단

2. **확인 모달 개선**
   - 삭제할 PMK 이름 표시
   - "정말 삭제하시겠습니까?" 명확한 문구

3. **서버 사이드 Validation**
   - 백엔드에서도 필수 파라미터 검증
   - 이중 안전장치

4. **Bulk Delete 지원**
   - 여러 PMK 동시 삭제 시 validation
   - 실패한 항목에 대한 모달 메시지

## 관련 문서

- `doc/fix/005_fix_postk8snodegroup_validation.md` - NodeGroup 생성 validation
- API 문서: `conf/api.yaml` - Deletek8scluster, Deletek8snodegroup
- Modal 템플릿: `front/templates/partials/layout/_modal.html`

## 코딩 스타일 준수

- ✅ 들여쓰기: 2칸
- ✅ 따옴표: 작은따옴표(') 사용
- ✅ 세미콜론: 모든 구문 끝에 사용
- ✅ 변수명: camelCase
- ✅ 함수명: camelCase
- ✅ 주석: 슬래시 두 개(//) 사용

## 작성자

- AI Assistant
- 검토자: [검토자명 추가 필요]

