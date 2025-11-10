# Bug List

## 버그 목록 / Bug Tracking

---

### 001_Workspaces

**화면**: Workspaces (운영 > 워크스페이스)

**내용**: 
- 목록에서 workspace 선택 후 delete 실행 시 `deleteWorkspaces` API가 404 에러 발생
- IAM Manager API 확인 필요

**상태**: 미해결

**우선순위**: High

**발견일**: 2025-11-03

**관련 파일**:
- `front/assets/js/pages/operation/workspace/workspaces.js`
- `front/assets/js/common/api/services/workspace_api.js`

**추가 정보**:
- deleteWorkspaces API 엔드포인트 점검 필요
- IAM Manager 연동 상태 확인 필요

---

### 002_Login

**화면**: Login (로그인)

**내용**: 
- 로그인 실패 시 에러 메시지가 제대로 표시되지 않음
- `webconsolejs["common/api/http"]` 모듈이 undefined 상태로 인해 TypeError 발생
- 콘솔 에러: `TypeError: Cannot read properties of undefined (reading 'commonAPIPostWithoutRetry')`

**상태**: 미해결

**우선순위**: High

**발견일**: 2025-11-08

**관련 파일**:
- `front/assets/js/pages/auth/login.js` (8번 라인)

**에러 상세**:
```
login.js:23 Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'commonAPIPostWithoutRetry')
    at eval (login.js:23:48)
    at Generator.eval (login.js:7:1660)
    at Generator.eval [as next] (login.js:8:255)
    at asyncGeneratorStep (login.js:9:70)
    at _next (login.js:10:163)
    at eval (login.js:10:299)
    at new Promise (<anonymous>)
    at HTMLButtonElement.eval (login.js:10:90)
```

**추가 정보**:
- `webconsolejs["common/api/http"]` 모듈 로딩 확인 필요
- 모듈 의존성 체크 필요
- 에러 처리 로직 개선 필요

---

### 003_Workspace_Project_Session

**화면**: 전체 (모든 페이지)

**내용**: 
- 로그인 후 창을 닫고 새 창을 열어 특정 경로로 직접 접속하면 workspace와 project 정보가 모두 사라짐
- sessionStorage는 브라우저 창/탭이 닫히면 초기화되는데, 새 창에서 데이터를 다시 로드하는 로직이 제대로 작동하지 않았음
- workspace/project selectbox가 비어있어 사용자가 다시 선택해야 하는 불편함 발생

**상태**: 해결됨

**우선순위**: High

**발견일**: 2025-11-08

**해결일**: 2025-11-08

**관련 파일**:
- `front/assets/js/common/api/services/workspace_api.js`
- `front/assets/js/partials/layout/navbar.js`
- `front/assets/js/common/storage/sessionstorage.js`

**해결 내용**:
1. `workspace_api.js`의 `getWorkspaceListByUser()` 함수 개선:
   - sessionStorage가 null이거나 빈 배열인 경우 모두 체크하도록 수정
   - API 호출 실패 시 에러 핸들링 추가 (try-catch)
   - API 응답 데이터 유효성 검증 추가

2. `navbar.js`의 `workspaceProjectInit()` 함수 강화:
   - workspace 목록이 비어있는 경우 early return 처리
   - 빈 데이터에 대한 명시적인 처리 로직 추가

**테스트 방법**:
1. 로그인
2. 브라우저 창 닫기
3. 새 창 열어서 특정 경로로 직접 접속 (예: `/operation/manage/mci`)
4. navbar의 workspace/project selectbox에 목록이 정상적으로 표시되는지 확인

---

### 004_MCI_Deploy_Error_Handling

**화면**: MCI Workloads - Create MCI (MCI 생성)

**내용**: 
- `PostMciDynamicReview` API가 HTTP 200 응답을 반환하지만 `responseData.overallStatus`가 "Error"인 경우 오류 처리 미흡
- HTTP 상태 코드만 확인하고 응답 데이터 내부의 `overallStatus`를 체크하지 않아 오류가 발생해도 사용자에게 알림이 표시되지 않음
- `creationViable: false`와 `overallStatus: "Error"` 두 가지를 모두 체크해야 함

**상태**: 해결됨

**우선순위**: High

**발견일**: 2025-11-08

**해결일**: 2025-11-08

**관련 파일**:
- `front/assets/js/partials/operation/manage/mcicreate.js` (라인 792-846)

**문제 상황 예시**:
```json
{
  "status": { "code": 200, "message": "200 OK" },
  "responseData": {
    "overallStatus": "Error",
    "creationViable": false,
    "overallMessage": "MCI cannot be created due to critical errors in VM configurations",
    "vmReviews": [{
      "status": "Error",
      "errors": ["Image 'ami-0593272c889084af9' not available in CSP..."]
    }]
  }
}
```

**해결 내용**:
1. `createMciDynamic()` 함수에 `overallStatus === "Error"` 체크 로직 추가
2. 오류 발생 시 Toast 알림으로 상세 정보 표시:
   - VM 이름 및 SubGroup Size
   - Provider 및 Region 정보
   - Image ID
   - 구체적인 오류 메시지 (vmReviews[].errors)
3. `showToast()` 함수 사용하여 8초 동안 오류 메시지 표시

**수정 전 로직**:
```javascript
if (reviewData.creationViable) {
  if (reviewData.overallStatus === "Ready") {
    // 배포 진행
  } else if (reviewData.overallStatus === "Warning") {
    // 경고 표시
  } else {
    // 단순 alert만 표시
    alert(`MCI 생성 검증 실패:\n${reviewData.overallMessage}`);
  }
}
```

**수정 후 로직**:
```javascript
// overallStatus 우선 체크
if (reviewData.overallStatus === "Error" || !reviewData.creationViable) {
  // 상세 오류 정보 수집
  let errorMessage = `MCI 생성 오류\n\n${reviewData.overallMessage}\n\n`;
  
  if (reviewData.vmReviews && reviewData.vmReviews.length > 0) {
    reviewData.vmReviews.forEach(vm => {
      if (vm.status === "Error" && vm.errors) {
        errorMessage += `VM: ${vm.vmName} (SubGroup Size: ${vm.subGroupSize})\n`;
        errorMessage += `Provider: ${vm.providerName}\n`;
        errorMessage += `Region: ${vm.regionName}\n`;
        errorMessage += `Image: ${vm.imageValidation.resourceId}\n`;
        errorMessage += `\n오류:\n`;
        vm.errors.forEach(err => {
          errorMessage += `- ${err}\n`;
        });
      }
    });
  }
  
  // Toast로 표시
  webconsolejs["common/util"].showToast(errorMessage, 'error', 8000);
  return;
}

if (reviewData.creationViable) {
  if (reviewData.overallStatus === "Ready") {
    // 배포 진행
  } else if (reviewData.overallStatus === "Warning") {
    // 경고 표시
  }
}
```

**테스트 방법**:
1. MCI 생성 화면에서 Azure VM 생성 시도
2. AWS 이미지 ID (예: ami-0593272c889084af9)를 Azure에서 사용하도록 설정
3. Deploy 버튼 클릭
4. Toast 알림으로 상세 오류 메시지가 표시되는지 확인
5. 오류 메시지에 VM 정보, 이미지 정보, 구체적인 오류 내용이 모두 포함되어 있는지 확인

**관련 문서**:
- `doc/test/014_Azure_VM_Creation_test.md` (시도 4 실패 기록)

---

### 005_Image_Search_Provider_Filter_Not_Working

**화면**: MCI Workloads - Create MCI - Image Recommendation Modal (이미지 추천 모달)

**내용**: 
- Image Recommendation 모달에서 Spec Information 필드 (Provider, Region, OS Architecture)가 비어있는 상태로 표시됨
- Spec을 선택한 후 Image 검색 버튼을 클릭해도 해당 Provider의 이미지만 필터링되지 않고 모든 Cloud Provider의 이미지가 조회됨
- 예: Azure Spec 선택 후 → AWS (ami-*), Alibaba (*.vhd), NCP (23214590), Azure (img-*) 이미지가 모두 표시됨
- 사용자가 다른 Provider의 이미지를 선택하면 Deploy 시 "invalid format for image ID" 오류 발생

**상태**: 미해결

**우선순위**: High

**발견일**: 2025-11-08

**관련 파일**:
- `front/assets/js/partials/operation/manage/imagerecommendation.js` (라인 174-258: `getRecommendImageInfo` 함수)
- `front/assets/js/partials/operation/manage/imagerecommendation.js` (라인 342-403: `validateAndOpenImageModal` 함수)
- `front/assets/js/partials/operation/manage/mcicreate.js` (라인 35-68: `callbackServerRecommendation` 함수)

**문제 원인**:
1. **프론트엔드 이슈**: 모달을 열 때 Spec Information 필드가 채워지지 않음
   - `validateAndOpenImageModal()` 함수에서 필드를 설정하지 않음 (수정 완료했으나 JavaScript 캐시 문제로 미반영)
2. **백엔드 또는 API 호출 이슈**: Image Search API가 Provider/Region/Architecture 파라미터를 받아도 필터링하지 않음
   - `getRecommendImageInfo()` 함수가 `matchedSpecId`만 전달하고 있음
   - API가 `matchedSpecId`를 제대로 파싱해서 필터링하지 않는 것으로 추정

**재현 방법**:
1. MCI Create 화면에서 +SubGroup 클릭
2. Server Recommendation 모달에서 Azure Spec 선택 (예: Standard_B2ts_v2)
3. Image 검색 버튼 클릭
4. Image Recommendation 모달에서 Spec Information 필드 확인 → 비어있음
5. 검색 버튼 클릭 → AWS, Alibaba, NCP, Azure 이미지가 모두 표시됨

**기대 동작**:
- Spec Information 필드에 Provider (azure), Region (koreacentral), OS Architecture (x86_64)가 자동으로 채워짐
- 검색 시 Azure 전용 이미지만 표시되어야 함 (img-*, 일부 Azure Native 이미지)
- AWS 이미지 (ami-*), Alibaba 이미지 (*.vhd) 등은 표시되지 않아야 함

**해결 방법 (부분)**:
- ✅ 프론트엔드 수정 완료: `imagerecommendation.js`의 `validateAndOpenImageModal()` 함수에서 모달을 열 때 필드를 채우도록 수정 (라인 375-380)
```javascript
// Spec Information 필드를 window.selectedSpecInfo로 채우기
if (window.selectedSpecInfo) {
  document.getElementById('image-provider').value = window.selectedSpecInfo.provider || "";
  document.getElementById('image-region').value = window.selectedSpecInfo.regionName || "";
  document.getElementById('image-os-architecture').value = window.selectedSpecInfo.osArchitecture || "x86_64";
}
```
- ❌ **백엔드 API 확인 필요**: Image Search API가 Provider/Region 필터링을 제대로 수행하는지 확인 필요
- ❌ **API 호출 파라미터 확인 필요**: `matchedSpecId` 외에 개별 파라미터 (provider, region, osArch)를 명시적으로 전달해야 하는지 확인

**임시 우회 방법**:
- 사용자가 수동으로 해당 Provider의 이미지만 선택 (BASIC 체크 유무, 이미지 ID 형식으로 구분)
- Azure: img-* 형식
- AWS: ami-* 형식  
- Alibaba: *.vhd 형식
- NCP: 숫자 형식

**관련 문서**:
- `doc/test/014_Azure_VM_Creation_test.md` (시도 5-7 실패 기록 - AWS/Alibaba 이미지 혼재)

---

### 005_Bootstrap_Undefined_Error

**화면**: 전체 (모든 페이지)

**내용**: 
- navbar.js에서 `bootstrap is not defined` 오류 발생
- tooltip 초기화 시 bootstrap 객체를 찾을 수 없음
- `imagerecommendation.js` 파일 404 에러도 함께 발생 (webpack 빌드 필요)

**상태**: 해결됨

**우선순위**: High

**발견일**: 2025-11-08

**해결일**: 2025-11-08

**관련 파일**:
- `front/assets/js/application.js`
- `front/assets/js/partials/layout/navbar.js` (라인 21-24)
- `front/assets/js/partials/operation/manage/imagerecommendation.js`

**에러 상세**:
```
navbar.js:39 Uncaught (in promise) ReferenceError: bootstrap is not defined
    at eval (navbar.js:39:11)
    at Array.map (<anonymous>)
    at eval (navbar.js:38:42)

GET http://localhost:3001/assets/partials/operation/manage/imagerecommendation.856655508ce8784c43cb.js 
net::ERR_ABORTED 404 (Not Found)
```

**해결 내용**:
1. `application.js`를 수정하여 bootstrap을 전역으로 노출:
```javascript
// 수정 전
require("bootstrap/dist/js/bootstrap.bundle.js");

// 수정 후
const bootstrap = require("bootstrap/dist/js/bootstrap.bundle.js");
window.bootstrap = bootstrap;
```

2. Webpack 재빌드 실행:
```bash
cd front && yarn build
```

**테스트 결과**:
- ✅ Bootstrap 오류 없음
- ✅ Workspace 목록 정상 로드
- ✅ JavaScript 404 오류 없음
- ✅ Tooltip 정상 작동

**테스트 시나리오**:
1. 브라우저 새로고침 → workspace 목록 정상 표시
2. 브라우저 탭 닫고 새 탭에서 직접 접속 → workspace 목록 정상 표시
3. 콘솔에 bootstrap 관련 오류 없음 확인

---

### 006_Workspace_Selection_Not_Persisted

**화면**: 전체 (모든 페이지 navbar)

**내용**: 
- workspace를 선택한 후 브라우저 탭을 닫고 새 탭에서 접속하면 workspace 선택이 초기화됨
- sessionStorage는 탭 간 공유되지 않는데, 새로 workspace 목록을 API에서 조회할 때 선택 정보를 의도적으로 초기화함
- 사용자가 매번 workspace와 project를 다시 선택해야 하는 불편함

**상태**: 미해결

**우선순위**: Medium

**발견일**: 2025-11-08

**관련 파일**:
- `front/assets/js/common/api/services/workspace_api.js` (라인 71-73)
- `front/assets/js/partials/layout/navbar.js` (라인 96-102)
- `front/assets/js/common/storage/sessionstorage.js`

**문제 원인**:
1. **sessionStorage의 특성**:
   - sessionStorage는 각 탭마다 독립적
   - 탭을 닫으면 해당 탭의 sessionStorage만 삭제됨
   - 새 탭은 빈 sessionStorage로 시작

2. **현재 로직의 문제**:
```javascript
// workspace_api.js 라인 71-73
// 새로 조회한 경우 저장된 curworkspace, curproject 는 초기화
setCurrentWorkspace("");
setCurrentProject("");
```
   - workspace 목록을 API에서 새로 조회하면 선택 정보를 빈 문자열로 초기화
   - 새 탭에서는 항상 API를 호출하므로 항상 초기화됨

3. **현재 sessionStorage 상태**:
```json
{
  "currentWorkspace": "\"\"",  // 빈 문자열
  "currentProject": "\"\"",    // 빈 문자열
  "currentWorkspaceProjcetList": "[{...}]"  // 목록은 있음
}
```

**기대 동작**:
- 같은 브라우저 세션 내에서 탭을 닫고 새 탭을 열어도 workspace 선택이 유지되어야 함
- 또는 localStorage를 사용하여 브라우저를 완전히 닫아도 유지

**해결 방안** (선택 가능):

**방안 1**: localStorage 사용 (권장)
- currentWorkspace와 currentProject를 localStorage에 저장
- 브라우저를 완전히 닫아도 유지됨
- 장점: 사용자 경험 향상
- 단점: 명시적으로 초기화하지 않으면 계속 유지

**방안 2**: workspace_api.js 로직 수정
- 라인 71-73의 초기화 로직 제거 또는 조건부 실행
- sessionStorage에 workspace 목록이 있고 currentWorkspace도 있으면 유지
- 장점: 최소한의 수정
- 단점: sessionStorage의 한계로 탭 간 공유는 안됨

**방안 3**: 하이브리드 방식
- workspace 목록은 sessionStorage에 저장 (API 부하 감소)
- currentWorkspace/currentProject는 localStorage에 저장 (선택 유지)
- 장점: 두 방식의 장점 결합
- 단점: 구현 복잡도 증가

**추가 정보**:
- 현재는 workspace 목록(7개)이 정상적으로 로드됨
- workspace 선택 기능 자체는 정상 작동
- 단순히 선택 정보가 유지되지 않는 것만이 문제

**관련 이슈**:
- #003_Workspace_Project_Session (이미 해결됨 - workspace 목록 로드 문제)
- 이 버그는 workspace 목록은 로드되지만 "선택"이 유지되지 않는 별개의 문제

---

### 007_Image_Recommendation_Alert_Usage

**화면**: MCI Workloads - Create MCI - Image Recommendation Modal (이미지 추천 모달)

**내용**: 
- Image Recommendation 모달에서 이미지 검색 결과가 없을 때 브라우저 기본 `alert()` 사용
- 사용자 경험을 위해 Toast 알림으로 변경 필요
- 현재는 "No images found for the selected specification and OS type. Please try different criteria." 메시지를 alert로 표시

**상태**: 미해결

**우선순위**: Medium

**발견일**: 2025-11-08

**관련 파일**:
- `front/assets/js/partials/operation/manage/imagerecommendation.js` (라인 219)

**문제 코드**:
```javascript
// 라인 216-221
if (imageList.length === 0) {
  console.warn("No images found for the selected spec and OS type");
  alert("No images found for the selected specification and OS type. Please try different criteria.");
  safeSetTableData([]);
  return;
}
```

**해결 방법**:
```javascript
// alert 대신 Toast 사용
if (imageList.length === 0) {
  console.warn("No images found for the selected spec and OS type");
  webconsolejs["common/util"].showToast(
    "No images found for the selected specification and OS type. Please try different criteria.",
    'warning',
    5000
  );
  safeSetTableData([]);
  return;
}
```

**테스트 방법**:
1. MCI 생성 화면에서 +SubGroup 클릭
2. Spec 선택 (예: Azure Standard_B2ts_v2)
3. Image 검색 버튼 클릭
4. OS Type에 존재하지 않는 값 입력 (예: "ubuntu 22.04")
5. 검색 버튼 클릭
6. Toast 알림이 표시되는지 확인

**관련 이슈**:
- #005_Image_Search_Provider_Filter_Not_Working (이미지 검색 관련)

---

### 008_Image_Search_OS_Type_Not_Cleared

**화면**: MCI Workloads - Create MCI - Image Recommendation Modal (이미지 추천 모달)

**내용**: 
- Image Recommendation 모달에서 OS Type 입력 필드를 비워도 API 요청에는 이전 값이 계속 전달됨
- 사용자가 필드를 비웠음에도 불구하고 `osType: "ubuntu 22.04"` 같은 값이 API에 전달되어 검색 결과가 비어있음
- 필드 값과 실제 API 요청 파라미터가 불일치하는 문제

**상태**: 미해결

**우선순위**: High

**발견일**: 2025-11-08

**관련 파일**:
- `front/assets/js/partials/operation/manage/imagerecommendation.js` (라인 182, 202)

**문제 원인**:
1. OS Type 입력 필드 (`#assist_os_type`)를 비워도 (value = "") API 호출 시 이전 값이 사용됨
2. 가능한 원인:
   - 필드 값이 어딘가에 캐시되어 있을 가능성
   - placeholder 값이 실제 값처럼 동작할 가능성
   - 다른 hidden field에서 값을 가져오고 있을 가능성

**재현 방법**:
1. MCI 생성 화면에서 Image 검색 모달 열기
2. OS Type에 "ubuntu 22.04" 입력 후 검색 → 결과 없음
3. 브라우저 콘솔에서 OS Type 필드 비우기:
   ```javascript
   document.getElementById('assist_os_type').value = '';
   ```
4. 다시 검색 버튼 클릭
5. 네트워크 탭 또는 console.log에서 API 요청 확인
6. **결과**: `osType: "ubuntu 22.04"`가 여전히 전달됨

**Console 로그 증거**:
```
[LOG] Request Data : {"pathParams":{"nsId":"system"},"request":{
  "includeDeprecatedImage":false,
  "isGPUImage":false,
  "isKubernetesImage":false,
  "osArchitecture":"x86_64",
  "osType":"ubuntu 22.04",  // 필드를 비웠는데도 전달됨!
  "providerName":"azure",
  "regionName":"koreacentral"
}}
```

**문제 코드**:
```javascript
// 라인 182
var osType = $("#assist_os_type").val()

// 라인 198-203
var searchParams = {
  providerName: provider,
  regionName: region,
  osArchitecture: window.selectedSpecInfo.osArchitecture || "x86_64",
  osType: osType  // 빈 값이어야 하는데 이전 값이 들어감
};
```

**기대 동작**:
- OS Type 필드를 비우면 (value = "") API 요청에서도 `osType: ""`로 전달되어야 함
- 또는 빈 값인 경우 `osType` 파라미터 자체를 제거해야 함

**해결 방법 (제안)**:
```javascript
// 라인 182-183
var osType = $("#assist_os_type").val();
console.log("OS Type value from input:", osType); // 디버깅용

// 라인 198-209
var searchParams = {
  providerName: provider,
  regionName: region,
  osArchitecture: window.selectedSpecInfo.osArchitecture || "x86_64"
};

// osType이 비어있지 않은 경우에만 추가
if (osType && osType.trim() !== "") {
  searchParams.osType = osType;
}
```

**추가 조사 필요**:
1. `#assist_os_type` 요소가 실제 input 필드인지 확인
2. jQuery `.val()` 메서드가 올바른 값을 반환하는지 확인
3. 모달이 열릴 때 필드가 초기화되는지 확인 (이전 값이 남아있을 가능성)
4. OS Type dropdown 선택 로직 확인 (`selectOSType` 함수, 라인 40-54)

**테스트 방법**:
1. Image Recommendation 모달 열기
2. 브라우저 개발자 도구 Console 탭 열기
3. OS Type 필드 확인:
   ```javascript
   document.getElementById('assist_os_type').value
   ```
4. 값을 비운 후:
   ```javascript
   document.getElementById('assist_os_type').value = '';
   document.getElementById('assist_os_type').value // 빈 문자열 확인
   ```
5. 검색 버튼 클릭
6. Network 탭에서 Searchimage API 요청의 Payload 확인
7. osType이 비어있는지 또는 제외되었는지 확인

**관련 이슈**:
- #007_Image_Recommendation_Alert_Usage (이미지 검색 alert 문제)
- #005_Image_Search_Provider_Filter_Not_Working (이미지 검색 필터 문제)

---

### 009_Workspace_Project_Selection_Validation

**화면**: 전체 (모든 페이지 - 화면 전환 시)

**내용**: 
- Workspace와 Project를 선택하도록 되어 있으나, 검증 로직이 Workspace만 체크함
- Workspace를 선택하지 않으면 경고 창이 표시되지만, Workspace만 선택하고 Project를 선택하지 않은 상태로 다른 화면으로 이동하면 Project 선택 경고 창이 표시되지 않음
- `checkWorkspaceSelection()` 함수가 `workspaceId`만 확인하고 `projectId`는 확인하지 않음

**상태**: 미해결

**우선순위**: Low

**발견일**: 2025-11-09

**관련 파일**:
- `front/assets/js/partials/layout/modal.js` (라인 64-69: `checkWorkspaceSelection` 함수)
- `front/assets/js/pages/operation/manage/mci.js` (라인 64)
- `front/assets/js/pages/operation/manage/pmk.js` (라인 81)
- `front/assets/js/pages/operation/manage/monitoring.js` (라인 38)
- `front/assets/js/pages/operation/manage/eventalarm.js` (라인 44)
- `front/assets/js/pages/operation/analytics/monitoringconfig.js` (라인 110)
- `front/assets/js/pages/operation/analytics/logmanage.js` (라인 56)
- `front/assets/js/pages/operation/dashboard/ns.js` (라인 13)
- `front/assets/js/pages/operation/workspace/roles.js` (라인 1398)

**문제 코드**:
```javascript
// modal.js 라인 64-69
// workspace selection 여부 확인 function
export function checkWorkspaceSelection(selectedWorkspaceProject) {
  if (selectedWorkspaceProject.workspaceId == "") {
    commonShowDefaultModal('Workspace Selection Check', 'Please select workspace first')
  }
  // projectId 검증 누락!
}
```

**재현 방법**:
1. 로그인 후 navbar에서 Workspace만 선택 (Project는 선택하지 않음)
2. 다른 화면으로 이동 (예: MCI Workloads, PMK Workloads 등)
3. **결과**: Project 선택 경고 창이 표시되지 않음
4. **기대**: Project도 선택하지 않았으므로 경고 창이 표시되어야 함

**해결 방법 (제안)**:

**방법 1**: 기존 함수에 Project 검증 추가 (권장)
```javascript
// workspace와 project selection 여부 확인 function
export function checkWorkspaceSelection(selectedWorkspaceProject) {
  if (selectedWorkspaceProject.workspaceId == "") {
    commonShowDefaultModal('Workspace Selection Check', 'Please select workspace first');
    return false;
  }
  if (selectedWorkspaceProject.projectId == "") {
    commonShowDefaultModal('Project Selection Check', 'Please select project first');
    return false;
  }
  return true;
}
```

**방법 2**: 함수명 변경 및 로직 추가 (더 명확)
```javascript
// workspace와 project selection 여부 확인 function
export function checkWorkspaceProjectSelection(selectedWorkspaceProject) {
  if (selectedWorkspaceProject.workspaceId == "") {
    commonShowDefaultModal('Workspace Selection Check', 'Please select workspace first');
    return false;
  }
  if (selectedWorkspaceProject.projectId == "") {
    commonShowDefaultModal('Project Selection Check', 'Please select project first');
    return false;
  }
  return true;
}
```
- 함수명을 변경하는 경우 9개 파일의 호출부도 함께 수정 필요

**테스트 방법**:
1. 로그인
2. Workspace 선택 (Project는 비워둠)
3. MCI Workloads 화면으로 이동
4. "Please select project first" 경고 창이 표시되는지 확인
5. Project 선택 후 다시 화면 이동
6. 정상적으로 화면이 로드되는지 확인

**추가 정보**:
- navbar.js (라인 14-19)에서 이미 workspace와 project가 비어있으면 `is-invalid` 클래스를 추가하는 UI 표시 로직은 존재함
- 다만 화면 전환 시 검증하는 `checkWorkspaceSelection` 함수에서 project를 체크하지 않아 사용자가 미선택 상태로 화면을 이동할 수 있음

---

