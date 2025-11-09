# Fix 005: Postk8snodegroup Validation 및 sshKeyId 처리 개선

## 개요

**작성일**: 2025-11-09  
**버그 ID**: 005  
**심각도**: Medium  
**상태**: Fixed

## 문제 발견

PMK(Platform Managed Kubernetes) 페이지에서 Node Group 추가 시 다음 문제들이 발견됨:

1. **Validation Check 누락**: `addNodeFormDone_btn()` 함수에 필수 필드 검증이 없어 빈 값으로 API 호출 가능
2. **sshKeyId 처리 불안정**: sshKeyId가 빈 값 또는 undefined로 전송될 수 있음
3. **에러 처리 없음**: API 호출 후 response 처리 및 에러 핸들링이 없음

## 문제 분석

### 1. Validation Check 누락

**파일**: `front/assets/js/partials/operation/manage/clustercreate.js`

#### 문제 코드 (수정 전)

```javascript
export function addNodeFormDone_btn() {
  $("#n_name").val($("#node_name").val())
  $("#n_specid").val($("#node_specid").val())
  $("#n_imageid").val($("#node_imageid").val())
  // ... 필드 validation 없이 바로 처리
}
```

**문제점**:
- 필수 필드(name, specId, imageId, sshKeyId, autoscaling) 검증 없음
- 사용자가 빈 값으로 Submit 가능
- 같은 파일의 `clusterFormDone_btn()` 함수에는 validation이 구현되어 있음 (일관성 없음)

### 2. sshKeyId 처리 불안정

**파일**: `front/assets/js/common/api/services/pmk_api.js`

#### 문제 코드 (수정 전)

```javascript
export async function createNode(k8sClusterId, nsId, Create_Node_Config_Arr) {
  var obj = {}
  obj = Create_Node_Config_Arr[0]
  const data = {
    request: {
      "sshKeyId": obj.sshKeyId  // undefined 또는 빈 값 가능
    }
  }
  
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  // response 처리 없음
}
```

**문제점**:
- `obj.sshKeyId`가 undefined 또는 빈 문자열일 수 있음
- 필수 필드 검증 없음
- API 호출 후 response 처리 없음
- try-catch 블록 없어 에러 발생 시 처리 불가

## 수정 내용

### 1. addNodeFormDone_btn() 함수 개선

**파일**: `front/assets/js/partials/operation/manage/clustercreate.js` (라인 761-789)

#### 수정 후 코드

```javascript
export function addNodeFormDone_btn() {
  // 1. 필수 필드 검증
  var requiredFields = [
    { id: '#node_name', message: 'NodeGroup name is required' },
    { id: '#node_specid', message: 'Spec is required' },
    { id: '#node_imageid', message: 'Image is required' },
    { id: '#node_sshkey', message: 'SSH Key is required' },
    { id: '#node_autoscaling', message: 'AutoScaling option is required' },
    { id: '#node_minnodesize', message: 'Min Node Size is required' },
    { id: '#node_maxnodesize', message: 'Max Node Size is required' }
  ];
  
  for (var field of requiredFields) {
    if (!$(field.id).val() || $(field.id).val().trim() === '') {
      alert(field.message);
      $(field.id).focus();
      return;
    }
  }

  // 2. hidden 필드에 값 설정
  $("#n_name").val($("#node_name").val())
  // ... 나머지 처리
}
```

**개선 사항**:
- 필수 필드 7개에 대한 validation 추가
  - name: NodeGroup 이름
  - specId: 서버 스펙
  - imageId: 이미지
  - sshKeyId: SSH Key
  - autoscaling: AutoScaling 설정
  - minNodeSize: 최소 노드 수
  - maxNodeSize: 최대 노드 수
- validation 실패 시 alert 표시 및 해당 필드로 focus
- validation 통과 후에만 처리 진행
- `clusterFormDone_btn()` 함수와 일관성 유지

### 2. createNode() 함수 개선

**파일**: `front/assets/js/common/api/services/pmk_api.js` (라인 347-405)

#### 수정 후 코드

```javascript
export async function createNode(k8sClusterId, nsId, Create_Node_Config_Arr) {
  // 1. 배열 검증
  if (!Create_Node_Config_Arr || Create_Node_Config_Arr.length === 0) {
    console.error('No node configuration provided');
    webconsolejs["common/util"].showToast('No node configuration to create', 'error');
    return;
  }

  var obj = Create_Node_Config_Arr[0];
  
  // 2. 필수 필드 검증
  if (!obj.name || !obj.specId || !obj.imageId || !obj.sshKeyId || !obj.minNodeSize || !obj.maxNodeSize || !obj.onAutoScaling) {
    console.error('Missing required fields:', obj);
    webconsolejs["common/util"].showToast('Missing required fields for node creation', 'error');
    return;
  }

  // 3. 데이터 준비 (기본값 포함)
  const data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
    },
    request: {
      "desiredNodeSize": obj.desiredNodeSize || "1",
      "imageId": obj.imageId,
      "maxNodeSize": obj.maxNodeSize || obj.desiredNodeSize || "1",
      "minNodeSize": obj.minNodeSize || obj.desiredNodeSize || "1",
      "name": obj.name,
      "onAutoScaling": obj.onAutoScaling || "false",
      "rootDiskSize": obj.rootDiskSize || "",
      "rootDiskType": obj.rootDiskType || "",
      "specId": obj.specId,
      "sshKeyId": obj.sshKeyId
    }
  };

  var controller = "/api/" + "mc-infra-manager/" + "Postk8snodegroup";
  
  // 4. API 호출 및 에러 처리
  try {
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    );
    
    // 성공 처리
    if (response && response.status === 200) {
      webconsolejs["common/util"].showToast('Node group creation request completed successfully', 'success');
      return response;
    } else {
      console.error('Node creation failed:', response);
      webconsolejs["common/util"].showToast('Failed to create node group', 'error');
      return response;
    }
  } catch (error) {
    console.error('Error creating node:', error);
    webconsolejs["common/util"].showToast('Error creating node group: ' + (error.message || 'Unknown error'), 'error');
    throw error;
  }
}
```

**개선 사항**:
- 입력 배열 존재 여부 검증
- 필수 필드 7개(name, specId, imageId, sshKeyId, minNodeSize, maxNodeSize, onAutoScaling) 검증
- 기본값 설정 추가:
  - desiredNodeSize: "1"
  - onAutoScaling: "false"
  - minNodeSize, maxNodeSize: desiredNodeSize 값 또는 "1"
- try-catch 블록으로 에러 핸들링
- **alert() 대신 Toast 메시지 사용으로 UX 개선**
- 성공 시 success Toast, 실패 시 error Toast 표시
- response 객체 반환하여 호출자가 추가 처리 가능
- commonAPIPost가 자동으로 pageloader 관리 (activePageLoader/deactivePageLoader)

## 테스트 방법

### 1. Validation 테스트

1. PMK 페이지에서 기존 클러스터 선택
2. "Add Node Group" 버튼 클릭
3. **필수 필드 누락 테스트**:
   - NodeGroup name만 입력하고 Done 클릭
   - → "Spec is required" alert 확인
   - Spec 선택 후 Done 클릭
   - → "Image is required" alert 확인
   - Image 선택 후 Done 클릭
   - → "SSH Key is required" alert 확인
   - SSH Key 선택 후 Done 클릭
   - → "AutoScaling option is required" alert 확인
   - AutoScaling 선택 후 Done 클릭
   - → "Min Node Size is required" alert 확인
   - Min Node Size 입력 후 Done 클릭
   - → "Max Node Size is required" alert 확인

### 2. 정상 동작 테스트

1. 모든 필수 필드 입력:
   - NodeGroup name: "test-nodegroup"
   - Spec: 추천 spec 선택
   - Image: 추천 image 선택
   - SSH Key: 목록에서 선택
   - AutoScaling: true/false 선택
   - Min Node Size: "1" 입력
   - Max Node Size: "3" 입력
2. Done 버튼 클릭
3. → 폼이 닫히고 Node Group 목록에 추가됨 확인

### 3. API 요청 검증

1. 브라우저 개발자 도구 → Network 탭 열기
2. Add Node Group 수행
3. Deploy Node 버튼 클릭
4. "Postk8snodegroup" API 호출 확인
5. Request Payload 확인:
   ```json
   {
     "pathParams": {
       "nsId": "...",
       "k8sClusterId": "..."
     },
     "request": {
       "name": "test-nodegroup",
       "specId": "...",
       "imageId": "...",
       "sshKeyId": "...",  // 빈 값이 아닌지 확인
       "desiredNodeSize": "1",
       "minNodeSize": "1",
       "maxNodeSize": "1",
       "onAutoScaling": "false",
       "rootDiskSize": "",
       "rootDiskType": ""
     }
   }
   ```

### 4. 에러 처리 테스트

1. 잘못된 데이터로 API 호출 (콘솔에서 수동 테스트)
2. → "Error creating node group" Toast 메시지 확인 (우측 상단)
3. Console에 에러 로그 출력 확인
4. "Preparing Data" 로딩 인디케이터가 자동으로 사라지는지 확인

### 5. Toast 메시지 확인

1. 성공 시: 녹색 Toast "Node group creation request completed successfully" 표시
2. Validation 실패 시: 빨간색 Toast "Missing required fields for node creation" 표시
3. API 에러 시: 빨간색 Toast "Failed to create node group" 표시
4. Toast는 5초 후 자동으로 사라짐

## 영향 범위

### 수정된 파일

1. `front/assets/js/partials/operation/manage/clustercreate.js`
   - `addNodeFormDone_btn()` 함수 수정
2. `front/assets/js/common/api/services/pmk_api.js`
   - `createNode()` 함수 수정

### 영향받는 기능

- PMK 페이지에서 Node Group 추가 기능
- Node Group 생성 API 호출

### 하위 호환성

- API 인터페이스 변경 없음
- 기존 코드와 호환됨
- 추가된 validation으로 인해 사용자는 필수 필드를 반드시 입력해야 함 (개선)

## 추가 개선 사항 (2025-11-09 추가)

### alert()를 Toast로 변경

**문제**: 
- 기존 `alert()` 사용으로 인해 사용자 경험 저하
- 에러 발생 시 "Preparing Data" 로딩 메시지가 사라지지 않음
- 모달 alert는 브라우저를 블로킹하여 비동기 작업 흐름 방해

**해결**:
- `alert()` → `webconsolejs["common/util"].showToast()` 로 변경
- Toast 메시지는 비침투적(non-blocking)으로 우측 상단에 표시
- commonAPIPost의 내장 pageloader 관리 활용
- 성공/실패에 따라 적절한 Toast 타입 사용 (success/error)

**변경 내역**:
```javascript
// 수정 전
alert('Missing required fields for node creation');

// 수정 후
webconsolejs["common/util"].showToast('Missing required fields for node creation', 'error');
```

### Loading State 관리

`commonAPIPost()` 함수가 자동으로 처리:
- API 호출 전: `activePageLoader()` - "Preparing Data" 표시
- API 호출 후: `deactivePageLoader()` - 로딩 메시지 제거
- 에러 발생 시에도 자동으로 `deactivePageLoader()` 호출

## 추가 개선 사항

### 향후 고려 사항

1. **서버 사이드 Validation**: 백엔드 API에서도 필수 필드 검증 구현
2. **Toast 메시지**: alert 대신 toast 메시지로 사용자 경험 개선
3. **입력 필드 힌트**: placeholder 또는 tooltip으로 필수 필드 표시
4. **Form Validation 라이브러리**: 통일된 validation 로직을 위한 라이브러리 도입 고려

## 관련 문서

- API 문서: `conf/api.yaml` - Postk8snodegroup
- 이전 수정: `doc/fix/004_add_spec_name_column.md`

## 작성자

- AI Assistant
- 검토자: [검토자명 추가 필요]

