# 004_add_spec_name_column

## 현상

- Server Recommendation 결과 테이블에 spec 이름이 표시되지 않음
- 사용자가 provider, region, price, memory, vCPU 등은 볼 수 있지만 실제 spec 이름을 알 수 없음
- Network 탭 확인 결과:
  - API 응답에는 `cspSpecName` 필드가 포함되어 있음 (예: "t2.small", "Standard_B2s", "n1-standard-2")
  - 하지만 테이블 컬럼에는 표시되지 않음

## 문제점

### 사용성 문제

1. **Spec 식별 어려움**
   - t2.small, Standard_B2s 같은 실제 spec 이름을 확인할 수 없어 선택에 어려움
   - 사용자가 익숙한 spec 이름으로 확인할 수 없음

2. **정보 불일치**
   - 다른 화면에서는 spec 이름이 표시되는데 추천 테이블에서만 누락
   - MCI Create와 PMK NodeGroup에서 동일한 문제 발생

3. **선택 후 확인 필요**
   - Spec을 선택한 후에야 spec 이름을 확인할 수 있음
   - 선택 전에 어떤 spec인지 미리 알 수 없어 비효율적

### 현재 테이블 구조

**표시되는 컬럼**:
- PROVIDER (providerName)
- REGION (regionName)
- PRICE (costPerHour)
- MEMORY (memoryGiB)
- VCPU (vCPU)

**숨겨진 컬럼**:
- connectionName
- evaluationScore10

**누락된 정보**:
- **SPEC NAME (cspSpecName)** ← 추가 필요

## 해결방법

### 구현 방안

**SPEC NAME 컬럼을 테이블에 추가**
- `cspSpecName` 필드를 사용하여 CSP의 원본 spec 이름 표시
- REGION 다음, PRICE 이전에 배치하여 자연스러운 정보 흐름 구성
- 좌측 정렬하여 텍스트 가독성 향상
- 정렬 기능 활성화하여 spec 이름으로 정렬 가능
- 툴팁 기능 활성화하여 긴 spec 이름도 전체 확인 가능

### 컬럼 스펙

```javascript
{
  title: "SPEC NAME",
  field: "cspSpecName",
  vertAlign: "middle",
  hozAlign: "left",      // 텍스트는 좌측 정렬
  minWidth: 150,         // 최소 150px 너비
  headerSort: true,      // 정렬 가능
  tooltip: true          // 툴팁 표시
}
```

### 개선 후 테이블 구조

**컬럼 순서**:
1. 체크박스
2. PROVIDER
3. REGION
4. **SPEC NAME** ← 추가
5. PRICE
6. MEMORY
7. VCPU

## 수정내역

### 수정 대상 파일

#### 1. `front/assets/js/partials/operation/manage/serverrecommendation.js`

**함수**: `initRecommendSpecTable()` (44-103라인)

**수정 위치**: columns 배열의 REGION 컬럼 다음에 추가 (80-90라인)

**수정 내용**:
```javascript
{
  title: "REGION",
  field: "regionName",
  vertAlign: "middle"
},
// ===== 추가된 부분 =====
{
  title: "SPEC NAME",
  field: "cspSpecName",
  vertAlign: "middle",
  hozAlign: "left",
  minWidth: 150,
  headerSort: true,
  tooltip: true
},
// ====================
{
  title: "PRICE",
  field: "costPerHour",
  vertAlign: "middle",
  hozAlign: "center",
},
```

#### 2. `front/assets/js/partials/operation/manage/pmk_serverrecommendation.js`

**함수**: `initRecommendSpecTablePmk()` (43-117라인)

**수정 위치**: columns 배열의 REGION 컬럼 다음에 추가 (82-92라인)

**수정 내용**: MCI와 동일한 컬럼 정의 추가

### 데이터 소스 확인

**API 응답 필드**: `cspSpecName`
- 이미 API 응답에 포함되어 있음
- `applyServerRecommendInfo()` 함수(456라인)에서 사용 중
- 별도의 API 수정 불필요

**예시 데이터**:
- AWS: "t2.small", "t2.medium", "t2.large"
- Azure: "Standard_B2s", "Standard_D2s_v3"
- GCP: "n1-standard-2", "e2-medium"

## 예상 효과

### 사용성 개선

1. **즉각적인 Spec 식별**
   - 테이블에서 바로 spec 이름 확인 가능
   - 사용자가 익숙한 spec 이름으로 빠른 선택 가능

2. **정보 일관성**
   - MCI와 PMK 모두에서 동일한 정보 제공
   - 다른 화면과 일관된 정보 표시

3. **선택 정확도 향상**
   - 선택 전에 spec을 정확히 확인할 수 있어 실수 방지
   - 여러 spec을 비교할 때 spec 이름으로 쉽게 구별 가능

### 화면 개선

**변경 전**:
```
| □ | PROVIDER | REGION        | PRICE  | MEMORY | VCPU |
|----|----------|---------------|--------|--------|------|
| □ | aws      | ap-northeast-2| 0.0464 | 2      | 1    |
```

**변경 후**:
```
| □ | PROVIDER | REGION        | SPEC NAME | PRICE  | MEMORY | VCPU |
|----|----------|---------------|-----------|--------|--------|------|
| □ | aws      | ap-northeast-2| t2.small  | 0.0464 | 2      | 1    |
```

## 테스트 시나리오

### 기능 테스트

1. **MCI Create - Server Recommendation**
   - [ ] Server Recommendation 모달 열기
   - [ ] 검색 조건 입력 후 조회
   - [ ] SPEC NAME 컬럼이 표시되는가
   - [ ] Spec 이름이 정확하게 표시되는가 (예: t2.small, Standard_B2s)
   - [ ] SPEC NAME으로 정렬이 작동하는가

2. **PMK NodeGroup - Server Recommendation**
   - [ ] Server Recommendation 모달 열기
   - [ ] 검색 조건 입력 후 조회
   - [ ] SPEC NAME 컬럼이 표시되는가
   - [ ] Spec 이름이 정확하게 표시되는가
   - [ ] SPEC NAME으로 정렬이 작동하는가

3. **다양한 Provider 테스트**
   - [ ] AWS spec 이름 표시 확인
   - [ ] Azure spec 이름 표시 확인
   - [ ] GCP spec 이름 표시 확인

4. **UI/UX 테스트**
   - [ ] 컬럼 너비가 적절한가 (최소 150px)
   - [ ] 긴 spec 이름에 툴팁이 표시되는가
   - [ ] 좌측 정렬이 적용되어 가독성이 좋은가
   - [ ] 정렬 아이콘이 헤더에 표시되는가

### 회귀 테스트

- [ ] 기존 컬럼들이 정상 표시되는가
- [ ] Spec 선택 기능이 정상 작동하는가
- [ ] Apply 버튼 클릭 시 spec 정보가 정확하게 전달되는가
- [ ] 다른 필터 조건들이 정상 작동하는가

## 관련 이슈

- Image Recommendation 필터 수정 (provider/region 값 전달 문제)과 연계
- Server Recommendation UI/UX 개선 작업의 일환

## 적용 브랜치

- **브랜치명**: `fix_050`
- **기반 브랜치**: `develop`
- **관련 커밋**: Add SPEC NAME column to server recommendation tables

## 코딩 스타일 준수

- ✅ 들여쓰기: 2칸
- ✅ 따옴표: 작은따옴표(') 사용
- ✅ 세미콜론: 모든 구문 끝에 사용
- ✅ 변수명: camelCase
- ✅ 주석: 슬래시 두 개(//) 사용

## 참고사항

### 향후 개선 가능 사항

1. **추가 정보 표시**
   - Common Spec ID 표시 (디버깅용)
   - OS Architecture 정보 표시
   - Storage Type 정보 표시

2. **필터 기능 강화**
   - Spec 이름으로 검색 기능 추가
   - Spec 패밀리별 필터링 (예: t2 시리즈, Standard_D 시리즈)

3. **즐겨찾기 기능**
   - 자주 사용하는 spec을 즐겨찾기로 저장
   - 즐겨찾기한 spec 우선 표시

### 관련 문서

- [001_fix_api_error_toast.md](./001_fix_api_error_toast.md)
- [002_fix_workspace_project_mapping.md](./002_fix_workspace_project_mapping.md)
- [003_fix_multiple_api_calls.md](./003_fix_multiple_api_calls.md)

