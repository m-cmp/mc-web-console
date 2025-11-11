# PMK NodeGroup 추가 상태 검증 기능

## 개요
PMK Cluster의 NodeGroup을 추가할 때, Cluster의 상태를 확인하여 Active 상태일 때만 NodeGroup 추가가 가능하도록 검증 로직을 추가한 기능입니다.

## 문제점
기존에는 PMK Cluster의 상태와 관계없이 NodeGroup 추가를 시도할 수 있었습니다. 이로 인해:
- Creating 상태의 Cluster에 NodeGroup을 추가하려고 시도하면 실패
- Deleting 상태의 Cluster에 NodeGroup을 추가하려고 시도하면 실패
- 사용자에게 명확한 피드백이 제공되지 않음

## 해결 방법
`addNewNodeGroup()` 함수에 Cluster 상태 검증 로직을 추가하여, Active 상태일 때만 NodeGroup 추가 폼이 표시되도록 구현했습니다.

## 구현 내용

### 1. Cluster 선택 여부 확인
- `selectedPmkObj`가 존재하는지 확인
- 선택되지 않은 경우 에러 메시지 표시

### 2. Cluster 상태 조회
- **API**: `GetK8sCluster` (operationId)
- **함수**: `webconsolejs["common/api/services/pmk_api"].getCluster(nsId, clusterId)`
- **Response Path**: `response.data.responseData.spiderViewK8sClusterDetail.Status`

### 3. 상태 검증 로직
- **허용되는 상태**: `Active`
- **거부되는 상태**: `Creating`, `Deleting`
- 거부 시 메시지: "NodeGroup can only be added when the cluster is in Active status. Current status is: {status}"

### 4. 에러 처리
- API 호출 실패 시 에러 메시지 표시
- try-catch 블록으로 예외 상황 처리
- 모든 에러 상황에서 사용자에게 명확한 피드백 제공

## 변경된 파일

### 1. front/assets/js/partials/operation/manage/clustercreate.js
**함수**: `addNewNodeGroup()`
**변경 내용**:
```javascript
// 추가된 검증 로직
1. Cluster 선택 여부 확인
2. GetK8sCluster API 호출하여 현재 상태 조회
3. Status 값이 'Active'인 경우만 기존 로직 실행
4. Active가 아닌 경우 commonShowDefaultModal로 에러 메시지 표시
```

**위치**: 394번째 줄 ~ 459번째 줄

## API 정보

### GetK8sCluster
- **Method**: GET
- **Resource Path**: `/ns/{nsId}/k8sCluster/{k8sClusterId}`
- **Description**: K8s Cluster 정보를 조회합니다
- **Parameters**:
  - `nsId`: Namespace ID
  - `k8sClusterId`: K8s Cluster ID
- **Response**:
  ```json
  {
    "status": 200,
    "data": {
      "responseData": {
        "spiderViewK8sClusterDetail": {
          "Status": "Active" | "Creating" | "Deleting"
        }
      }
    }
  }
  ```

## 테스트 시나리오

### Case 1: Cluster가 선택되지 않은 경우
1. PMK 목록 페이지에서 Cluster를 선택하지 않음
2. "Add NodeGroup" 버튼 클릭
3. **예상 결과**: "Cluster Selection Required" 모달 표시

### Case 2: Cluster 상태가 Creating인 경우
1. Creating 상태의 Cluster 선택
2. "Add NodeGroup" 버튼 클릭
3. **예상 결과**: "NodeGroup can only be added when the cluster is in Active status. Current status is: Creating" 모달 표시
4. NodeGroup 추가 폼이 표시되지 않음

### Case 3: Cluster 상태가 Deleting인 경우
1. Deleting 상태의 Cluster 선택
2. "Add NodeGroup" 버튼 클릭
3. **예상 결과**: "NodeGroup can only be added when the cluster is in Active status. Current status is: Deleting" 모달 표시
4. NodeGroup 추가 폼이 표시되지 않음

### Case 4: Cluster 상태가 Active인 경우
1. Active 상태의 Cluster 선택
2. "Add NodeGroup" 버튼 클릭
3. **예상 결과**: NodeGroup 추가 폼이 정상적으로 표시됨
4. 기존 기능과 동일하게 동작

### Case 5: API 호출 실패
1. 네트워크 문제 또는 API 오류 발생
2. "Add NodeGroup" 버튼 클릭
3. **예상 결과**: "Failed to retrieve cluster status. Please try again." 또는 "An error occurred while checking cluster status. Please try again." 모달 표시

## 사용자 영향
- **긍정적 영향**: 
  - Cluster 상태에 따른 명확한 피드백 제공
  - 불필요한 API 호출 실패 방지
  - 사용자 경험 개선
- **부정적 영향**: 
  - NodeGroup 추가 시 약간의 지연 발생 (API 호출로 인한)
  - 하지만 사용성 개선이 더 큰 이점

## 브랜치 정보
- **Base Branch**: develop
- **Feature Branch**: feature/pmk-nodegroup-status-validation

## 관련 이슈
- PMK NodeGroup 추가 시 상태 검증 필요

## 작성자
- Date: 2025-11-11
- Feature: PMK NodeGroup Status Validation

