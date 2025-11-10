# 003_fix_multiple_api_calls

## 현상

- Workspaces 화면 로드 시 API가 불필요하게 여러 번 호출됨
- Network 로그 확인 결과:
  1. `Listusers` - 1회 호출 ✅
  2. `listProjects` - 1회 호출 ✅
  3. `listMciamPermissions` - 1회 호출 ✅
  4. `listUsersAndRolesByWorkspaces` - **N회 호출** ❌ (workspace 개수만큼)
- 예: workspace가 5개면 5회, 10개면 10회 호출
- 성능 저하 및 불필요한 서버 부하 발생

## 문제 원인

### 현재 코드 구조

**파일**: `front/assets/js/pages/operation/workspace/workspaces.js`

**함수**: `setWokrspaceTableData()` (462-485라인)

```javascript
async function setWokrspaceTableData() {
  var tableListData = [];
  
  // ❌ N+1 쿼리 문제: workspace 개수만큼 API 호출
  for (const workspace of listData.wsList) {
    // 각 workspace마다 API 호출
    var respWorkspaceRoleMappingList = await webconsolejs["common/api/services/workspace_api"]
      .getWorkspaceUserRoleMappingListByWorkspaceId(workspace.id);
    
    var userCount = 0
    var roleCountArr = new Set();
    if (respWorkspaceRoleMappingList.userinfo) {
      respWorkspaceRoleMappingList.userinfo.forEach(function (wsmapping) {
        userCount++
        roleCountArr.add(wsmapping.role.name)
      })
    }
    
    tableListData.push({
      name: workspace.name,
      id: workspace.id,
      description: workspace.description,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
      userCount: userCount,      // 이 값을 위해 API 호출
      roleCount: roleCountArr.size // 이 값을 위해 API 호출
    })
  };
  workspacesListTable.setData(tableListData)
}
```

### 문제점

1. **N+1 쿼리 문제**: workspace가 N개면 N번 API 호출
2. **순차 처리**: for 루프에서 await를 사용하여 순차적으로 처리 (병렬 처리 미활용)
3. **중복 데이터**: 각 API 응답에 중복된 데이터가 포함될 가능성
4. **성능 저하**: workspace가 많을수록 페이지 로딩 시간 증가

## 해결방법

### 개선 방안

**방법 1: 단일 API 호출로 통합** (권장)

```javascript
async function setWokrspaceTableData() {
  var tableListData = [];
  
  // ✅ 한 번만 호출: 모든 workspace의 user role mapping 정보 가져오기
  var allWorkspaceRoleMappings = await webconsolejs["common/api/services/workspace_api"]
    .getWorkspaceUserRoleMappingListOrderbyWorkspace();
  
  // workspace별로 그룹핑된 데이터 생성
  var workspaceMapping = {};
  allWorkspaceRoleMappings.forEach(mapping => {
    if (!workspaceMapping[mapping.workspace_id]) {
      workspaceMapping[mapping.workspace_id] = {
        userCount: 0,
        roles: new Set()
      };
    }
    workspaceMapping[mapping.workspace_id].userCount++;
    workspaceMapping[mapping.workspace_id].roles.add(mapping.role_id);
  });
  
  // 테이블 데이터 생성
  for (const workspace of listData.wsList) {
    const mappingData = workspaceMapping[workspace.id] || { userCount: 0, roles: new Set() };
    
    tableListData.push({
      name: workspace.name,
      id: workspace.id,
      description: workspace.description,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
      userCount: mappingData.userCount,
      roleCount: mappingData.roles.size
    })
  };
  
  workspacesListTable.setData(tableListData)
}
```

**방법 2: 병렬 처리 (현재 구조 유지 시)**

```javascript
async function setWokrspaceTableData() {
  var tableListData = [];
  
  // ✅ Promise.all로 병렬 처리
  var promises = listData.wsList.map(async (workspace) => {
    var respWorkspaceRoleMappingList = await webconsolejs["common/api/services/workspace_api"]
      .getWorkspaceUserRoleMappingListByWorkspaceId(workspace.id);
    
    var userCount = 0
    var roleCountArr = new Set();
    if (respWorkspaceRoleMappingList.userinfo) {
      respWorkspaceRoleMappingList.userinfo.forEach(function (wsmapping) {
        userCount++
        roleCountArr.add(wsmapping.role.name)
      })
    }
    
    return {
      name: workspace.name,
      id: workspace.id,
      description: workspace.description,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
      userCount: userCount,
      roleCount: roleCountArr.size
    };
  });
  
  tableListData = await Promise.all(promises);
  workspacesListTable.setData(tableListData)
}
```

### 성능 비교

| 방법 | API 호출 횟수 | 장점 | 단점 |
|------|--------------|------|------|
| **현재** (순차) | N회 | 구현 단순 | 느림, 서버 부하 큼 |
| **방법 1** (통합) | 1회 | 가장 빠름, 서버 부하 최소 | 데이터 구조 변경 필요 |
| **방법 2** (병렬) | N회 | 구현 쉬움 | 여전히 N회 호출, 동시 요청으로 서버 부하 |

**권장**: 방법 1 (단일 API 호출)

## 수정내역

### 수정 대상 파일

#### `front/assets/js/pages/operation/workspace/workspaces.js`

**함수**: `setWokrspaceTableData()` (462-485라인)

**수정 전**: N번 API 호출 (N = workspace 개수)
**수정 후**: 1번 API 호출

### API 확인 사항

#### 사용 가능한 API

1. **`getWorkspaceUserRoleMappingListByWorkspaceId(wsId)`**
   - 특정 workspace의 user role mapping 조회
   - 현재 사용 중
   - workspace별로 호출 필요 (N회)

2. **`getWorkspaceUserRoleMappingListOrderbyWorkspace()`**
   - 모든 workspace의 user role mapping 조회
   - workspace별로 그룹핑된 데이터 반환
   - 한 번만 호출하면 됨 (1회)
   - **권장 사용**

#### API 응답 형식 확인 필요

```javascript
// getWorkspaceUserRoleMappingListOrderbyWorkspace() 응답 예시
[
  {
    workspace_id: "ws-001",
    user_id: "user-001",
    role_id: "role-001",
    role: { name: "Admin" },
    // ...
  },
  {
    workspace_id: "ws-001",
    user_id: "user-002",
    role_id: "role-002",
    role: { name: "User" },
    // ...
  },
  // ...
]
```

## 예상 효과

### 성능 개선

**현재 상황** (workspace 10개 가정):
- API 호출: 10회
- 예상 시간: 약 2-5초 (네트워크 지연 포함)

**개선 후**:
- API 호출: 1회
- 예상 시간: 약 0.2-0.5초
- **성능 향상: 약 4-10배**

### 서버 부하 감소

- 불필요한 API 호출 제거
- 데이터베이스 쿼리 횟수 감소
- 네트워크 트래픽 감소

## 테스트 계획

### 테스트 시나리오

1. **기능 테스트**
   - [ ] Workspaces 화면 로드 시 테이블이 정상 표시되는가
   - [ ] userCount가 정확하게 표시되는가
   - [ ] roleCount가 정확하게 표시되는가

2. **성능 테스트**
   - [ ] Network 탭에서 API 호출 횟수 확인
   - [ ] `listUsersAndRolesByWorkspaces`가 1회만 호출되는가
   - [ ] 페이지 로딩 시간 측정

3. **에지 케이스**
   - [ ] workspace가 0개일 때
   - [ ] user가 없는 workspace가 있을 때
   - [ ] role이 없는 workspace가 있을 때

## 구현 우선순위

1. **Phase 1**: API 응답 형식 확인
   - `getWorkspaceUserRoleMappingListOrderbyWorkspace()` API 응답 구조 파악
   - 필요한 데이터 추출 방법 검토

2. **Phase 2**: 코드 수정
   - `setWokrspaceTableData()` 함수 수정
   - 단일 API 호출로 변경
   - 데이터 그룹핑 로직 구현

3. **Phase 3**: 테스트 및 검증
   - 기능 테스트
   - 성능 테스트
   - 버그 확인

## 참고사항

### 관련 코드 위치

- **초기화**: `initWorkspace()` (434-449라인)
- **데이터 조회**: `updateInitData()` (451-460라인)
- **테이블 생성**: `setWokrspaceTableData()` (462-485라인)
- **API 호출**: `workspace_api.js`

### 추가 최적화 가능 영역

1. **Roles 탭 로딩** (`setWokrspaceRolesTableData()` 함수)
   - 유사한 패턴으로 최적화 가능

2. **Users 탭 로딩** (`setWokrspaceUserTableData()` 함수)
   - 개별 사용자 정보 조회를 배치 처리로 개선 가능

## 적용 브랜치

- **브랜치명**: `fix_050`
- **기반 브랜치**: `develop`
- **관련 이슈**: Workspaces 화면 로딩 성능 개선

## 코딩 스타일 준수

- ✅ 들여쓰기: 2칸
- ✅ 따옴표: 작은따옴표(')
- ✅ 세미콜론: 모든 구문 끝에 사용
- ✅ 변수명: camelCase
- ✅ 주석: 슬래시 두 개(//) 사용

