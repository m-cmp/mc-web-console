# Fix 007: OS Architecture 필드 readonly 속성 제거

## 개요

**작성일**: 2025-11-09  
**버그 ID**: 007  
**심각도**: Medium  
**상태**: Fixed

## 문제 발견

Image Recommendation 모달에서 OS Architecture 필드가 readonly로 설정되어 있어 사용자가 수정할 수 없음:

1. **수정 불가**: OS Architecture 값이 하드코딩된 기본값 "x86_64"로 설정
2. **ARM 지원 제한**: arm64, aarch64 등 다른 아키텍처 선택 불가
3. **사용자 경험 저하**: Spec 정보에서 값을 가져오지만 수정 필요 시 불가능

## 문제 분석

### 1. OS Architecture 값 설정 메커니즘

**파일**: `front/assets/js/partials/operation/manage/imagerecommendation.js`

#### 값 결정 순서 (라인 188)

```javascript
var osArchitecture = $("#image-os-architecture").val() || window.selectedSpecInfo.osArchitecture || "x86_64";
```

**동작 방식**:
1. UI 필드 값 확인 (`$("#image-os-architecture").val()`)
2. 선택된 Spec 정보에서 가져오기 (`window.selectedSpecInfo.osArchitecture`)
3. 기본값 사용 (`"x86_64"` - 하드코딩)

#### 모달 열릴 때 필드 설정 (라인 385-390)

```javascript
// Spec Information 필드 채우기 (모달 열기 전)
if (window.selectedSpecInfo) {
  $("#image-provider").val(window.selectedSpecInfo.provider || "");
  $("#image-region").val(window.selectedSpecInfo.regionName || "");
  $("#image-os-architecture").val(window.selectedSpecInfo.osArchitecture || "x86_64");
}
```

**문제점**:
- Spec에 `osArchitecture` 정보가 있으면 자동 설정
- 없으면 기본값 "x86_64" 설정
- 하지만 HTML에서 readonly로 설정되어 있어 수정 불가

### 2. HTML readonly 속성

**MCI용 파일**: `front/templates/partials/operation/manage/_imagerecommendation.html`

#### 문제 코드 (라인 46-55)

```html
<div class="col-md-4">
  <label class="form-label">OS Architecture</label>
  <input
    type="text"
    class="form-control"
    id="image-os-architecture"
    readonly
    placeholder="OS Architecture from spec selection"
  />
</div>
```

**PMK용 파일**: `front/templates/partials/operation/manage/_pmk_imagerecommendation.html`

#### 문제 코드 (라인 45-54)

```html
<div class="col-md-4">
  <label class="form-label">OS Architecture</label>
  <input
    type="text"
    class="form-control"
    id="image-os-architecture-pmk"
    readonly
    placeholder="OS Architecture from spec selection"
  />
</div>
```

**문제점**:
- `readonly` 속성으로 인해 사용자가 값을 변경할 수 없음
- Spec에서 자동으로 값을 가져오는 것은 좋지만, 수정이 필요한 경우 대응 불가
- Provider와 Region은 Spec에 종속적이지만, OS Architecture는 사용자가 선택할 수 있어야 함

### 3. 비교: Provider와 Region 필드

**동일하게 readonly 설정**:
```html
<!-- Provider -->
<input
  type="text"
  class="form-control"
  id="image-provider"
  readonly
  placeholder="Provider from spec selection"
/>

<!-- Region -->
<input
  type="text"
  class="form-control"
  id="image-region"
  readonly
  placeholder="Region from spec selection"
/>
```

**차이점**:
- Provider와 Region: Spec 선택에 따라 결정되므로 readonly가 적절
- **OS Architecture**: 동일한 Spec에서도 x86_64와 arm64를 모두 지원할 수 있으므로 사용자 선택 필요

## 재현 방법

### 시나리오 1: OS Architecture 수정 시도

1. MCI Workloads 페이지 접속
2. MCI Create → Server Spec 선택
3. Image Recommendation 모달 열기
4. OS Architecture 필드 클릭하여 수정 시도
5. **결과**: 
   - ❌ 입력 불가 (readonly)
   - OS Architecture 값이 "x86_64"로 고정
   - arm64를 사용하려는 경우 수정 불가능

### 시나리오 2: ARM 아키텍처 이미지 검색

1. PMK Workloads 페이지 접속
2. NodeGroup 추가 → Server Spec 선택
3. Image Recommendation 모달 열기
4. OS Architecture를 "arm64"로 변경하려고 시도
5. **결과**:
   - ❌ 수정 불가
   - ARM 기반 이미지 검색 불가능

## 수정 내용

### 1. MCI Image Recommendation 템플릿 수정

**파일**: `front/templates/partials/operation/manage/_imagerecommendation.html`

#### 수정 전 (라인 46-55)

```html
<div class="col-md-4">
  <label class="form-label">OS Architecture</label>
  <input
    type="text"
    class="form-control"
    id="image-os-architecture"
    readonly
    placeholder="OS Architecture from spec selection"
  />
</div>
```

#### 수정 후

```html
<div class="col-md-4">
  <label class="form-label">OS Architecture</label>
  <input
    type="text"
    class="form-control"
    id="image-os-architecture"
    placeholder="OS Architecture from spec selection"
  />
</div>
```

**변경 사항**:
- `readonly` 속성 제거
- 다른 속성은 그대로 유지

### 2. PMK Image Recommendation 템플릿 수정

**파일**: `front/templates/partials/operation/manage/_pmk_imagerecommendation.html`

#### 수정 전 (라인 45-54)

```html
<div class="col-md-4">
  <label class="form-label">OS Architecture</label>
  <input
    type="text"
    class="form-control"
    id="image-os-architecture-pmk"
    readonly
    placeholder="OS Architecture from spec selection"
  />
</div>
```

#### 수정 후

```html
<div class="col-md-4">
  <label class="form-label">OS Architecture</label>
  <input
    type="text"
    class="form-control"
    id="image-os-architecture-pmk"
    placeholder="OS Architecture from spec selection"
  />
</div>
```

**변경 사항**:
- `readonly` 속성 제거
- 다른 속성은 그대로 유지

## 동작 방식

### 수정 후 동작 흐름

1. **모달 열릴 때**:
   - Spec에서 `osArchitecture` 값을 가져와 필드에 자동 입력
   - 값이 없으면 "x86_64" 기본값 설정

2. **사용자 수정**:
   - 사용자가 필요 시 필드 값 수정 가능
   - "arm64", "aarch64" 등으로 변경 가능

3. **검색 버튼 클릭**:
   - 수정된 값으로 이미지 검색
   - `osArchitecture` 파라미터에 사용자가 입력한 값 전달

### 값 우선순위

```javascript
// getRecommendImageInfo() 함수에서
var osArchitecture = $("#image-os-architecture").val() || 
                     window.selectedSpecInfo.osArchitecture || 
                     "x86_64";
```

**우선순위**:
1. **사용자 입력값** (가장 높음)
2. Spec 정보
3. 기본값 "x86_64"

## 테스트 방법

### 1. 기본 동작 테스트

#### Test Case 1-1: 자동 입력 확인

1. MCI Create → Server Spec 선택
2. Image Recommendation 모달 열기
3. **예상 결과**:
   - ✅ OS Architecture 필드에 값 자동 입력
   - ✅ Spec에 정보가 있으면 해당 값 표시
   - ✅ 없으면 "x86_64" 표시

#### Test Case 1-2: 수정 가능 확인

1. OS Architecture 필드 클릭
2. 값을 "arm64"로 수정
3. **예상 결과**:
   - ✅ 입력 가능
   - ✅ 커서가 표시되고 편집 가능
   - ✅ readonly 상태가 아님

### 2. 검색 기능 테스트

#### Test Case 2-1: 수정된 값으로 검색

1. OS Architecture를 "arm64"로 수정
2. OS Type 입력 (예: ubuntu 22.04)
3. Search 버튼 클릭
4. **예상 결과**:
   - ✅ API 호출: `/api/mc-infra-manager/SearchImage`
   - ✅ Request Payload에 `osArchitecture: "arm64"` 포함
   - ✅ ARM 아키텍처 이미지 검색 결과 표시

#### Test Case 2-2: 기본값으로 검색

1. OS Architecture 필드 값 확인 (x86_64)
2. 수정하지 않고 Search 버튼 클릭
3. **예상 결과**:
   - ✅ API 호출에 `osArchitecture: "x86_64"` 포함
   - ✅ x86_64 이미지 검색 결과 표시

### 3. PMK 이미지 검색 테스트

#### Test Case 3-1: PMK용 필드 수정

1. PMK Workloads → NodeGroup 추가
2. Image Recommendation 모달 열기
3. OS Architecture 필드 수정
4. **예상 결과**:
   - ✅ 수정 가능
   - ✅ 수정된 값으로 검색 가능

### 4. 회귀 테스트

#### Test Case 4-1: 기존 기능 정상 동작

1. Spec 선택 → Image Recommendation 모달
2. OS Type, GPU 옵션 설정
3. Search → Image 선택 → Apply
4. **예상 결과**:
   - ✅ 모든 기능 정상 동작
   - ✅ Apply 시 이미지 정보 정확히 전달
   - ✅ MCI/PMK 생성 정상 진행

### 5. UI/UX 테스트

#### Test Case 5-1: 입력 필드 스타일

1. OS Architecture 필드 확인
2. **확인 사항**:
   - ✅ Placeholder 표시: "OS Architecture from spec selection"
   - ✅ 클릭 시 커서 표시
   - ✅ 포커스 효과 정상
   - ✅ Bootstrap form-control 스타일 적용

#### Test Case 5-2: 다양한 값 입력

1. 다양한 아키텍처 값 입력 테스트:
   - "x86_64"
   - "arm64"
   - "aarch64"
   - "i386"
2. **예상 결과**:
   - ✅ 모든 값 입력 가능
   - ✅ 입력한 값으로 검색 가능

## 영향 범위

### 수정된 파일

1. **front/templates/partials/operation/manage/_imagerecommendation.html**
   - OS Architecture 필드 (라인 51) - `readonly` 속성 제거

2. **front/templates/partials/operation/manage/_pmk_imagerecommendation.html**
   - OS Architecture 필드 (라인 50) - `readonly` 속성 제거

### 영향받는 기능

- MCI Image Recommendation (MCI Create 화면)
- PMK Image Recommendation (PMK NodeGroup 화면)
- Image 검색 API 호출

### 하위 호환성

- ✅ JavaScript 코드 변경 없음
- ✅ API 인터페이스 변경 없음
- ✅ 기존 동작 방식 유지 (자동 입력)
- ✅ 추가 기능만 제공 (수정 가능)

## 예상 효과

### 1. 사용자 경험 개선

- ARM 아키텍처 이미지 검색 가능
- Spec 정보가 부정확한 경우 수정 가능
- 다양한 아키텍처 지원으로 유연성 증가

### 2. 기능 확장성

- 향후 새로운 아키텍처 (RISC-V 등) 지원 용이
- 사용자가 직접 아키텍처를 지정할 수 있어 테스트 및 검증 편리

### 3. 일관성 유지

- OS Type 필드와 동일하게 수정 가능한 입력 필드
- Provider, Region은 Spec 종속이지만, OS Architecture는 사용자 선택 가능

### 4. 자동화 유지

- 기본적으로 Spec에서 값을 자동 입력
- 수동 수정도 가능하여 자동화와 수동 제어의 균형

## 추가 개선 사항

### 향후 고려 사항

1. **드롭다운 방식 적용**
   - OS Architecture를 텍스트 입력 대신 select 드롭다운으로 변경
   - 사전 정의된 값만 선택 가능하게 제한
   
   ```html
   <select class="form-select" id="image-os-architecture">
     <option value="x86_64">x86_64</option>
     <option value="arm64">arm64</option>
     <option value="aarch64">aarch64</option>
   </select>
   ```

2. **Validation 추가**
   - 유효한 아키텍처 값인지 검증
   - 잘못된 값 입력 시 경고 메시지

3. **Spec 정보 개선**
   - Spec API 응답에 `supportedArchitectures` 배열 추가
   - 해당 Spec이 지원하는 아키텍처 목록 제공

4. **자동 필터링**
   - 선택한 Spec이 지원하는 아키텍처만 선택 가능하도록 제한
   - 지원하지 않는 아키텍처 선택 시 경고

## 관련 문서

- Image Recommendation 모달: `front/templates/partials/operation/manage/_imagerecommendation.html`
- Image Search API: `conf/api.yaml` - SearchImage
- 관련 이슈: Azure ARM 이미지 검색 지원

## 코딩 스타일 준수

- ✅ HTML 들여쓰기: 2칸
- ✅ 속성 정렬: 의미있는 순서대로 배치
- ✅ Placeholder: 명확한 안내 문구
- ✅ ID 명명: kebab-case 사용

## 적용 브랜치

- **브랜치명**: `fix_050`
- **기반 브랜치**: `develop`
- **관련 커밋**: Remove readonly attribute from OS Architecture fields

## 작성자

- AI Assistant
- 검토자: [검토자명 추가 필요]

