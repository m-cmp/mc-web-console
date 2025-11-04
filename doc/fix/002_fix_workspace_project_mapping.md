# 002_fix_workspace_project_mapping

## 현상

- Workspace 생성 시 "with Project" 옵션으로 프로젝트를 선택하고 Confirm을 누르면 500 에러 발생
- Network 로그에 `CreateWorkspace`와 `createProject` API가 호출되는 것 확인됨
- createWPmapping() 함수 호출 시 오류는 나지 않지만 workspace Id를 찾지 못해 매핑을 못한다는 로그 확인
- 의도: 기존 프로젝트를 선택하여 workspace에 매핑하는 것
- 실제: 새로운 프로젝트를 생성하려고 시도하여 오류 발생

## 문제 원인

### 잘못된 로직
```javascript
// 기존 코드 (잘못된 로직)
if (document.getElementById('workspace-modal-add-withprojects').checked) {
  let selectedProjects = Array.from(multiprojectSelect.selectedOptions);
  
  // ❌ 선택된 각 프로젝트에 대해 새로 생성 시도
  for (const option of selectedProjects) {
    const createProjectResp = await createProject(projectName, projectDescription);
    const createWPmappingResp = await createWPmapping(createdWorkspace.message.id, [createProjectResp.message.id]);
  }
}
```

### 문제점
1. **createProject API 호출**: 이미 존재하는 프로젝트를 다시 생성하려고 시도
2. **중복 생성 시도**: selectbox에 표시된 기존 프로젝트를 새로 만들려고 함
3. **매핑 실패**: 생성된 workspace ID를 찾지 못함

## 해결방법

### 올바른 로직
- "with Project" 옵션은 **기존 프로젝트를 선택**하여 workspace에 **매핑만** 하는 기능
- 모든 프로젝트는 기본 workspace에 할당됨
- 다른 workspace에 매핑하면 기본 workspace에서는 제거되고 선택한 workspace로 이동

### 수정 방안
```javascript
// 올바른 로직
if (document.getElementById('workspace-modal-add-withprojects').checked) {
  let multiprojectSelect = document.getElementById('workspace-modal-add-multiproject');
  let multiprojects = Array.from(multiprojectSelect.selectedOptions, option => option.value);
  
  // ✅ 기존 프로젝트 ID들을 workspace에 매핑만 수행
  const createdWPmapping = await createWPmapping(createdWorkspace.message.id, multiprojects);
  if (!createdWPmapping.success) {
    showToast("Failed to map projects to workspace: " + JSON.stringify(createdWPmapping.message), 'error');
    return
  }
}
```

## 수정내역

### 수정 파일

#### `front/assets/js/pages/operation/workspace/workspaces.js`

**함수**: `creatworkspaceProject()` (817-825라인)

**변경 사항**:
1. ❌ **제거**: `createProject()` API 호출 - 새 프로젝트 생성 로직 삭제
2. ❌ **제거**: for 루프를 통한 개별 프로젝트 처리
3. ✅ **유지**: 선택된 프로젝트 ID 배열 추출 (`option.value`)
4. ✅ **수정**: `createWPmapping()` API를 **한 번만** 호출하여 모든 프로젝트 매핑
5. ✅ **유지**: 에러 발생 시 toast 알림 표시 (alert → toast 이미 적용됨)

**수정 전**:
```javascript
if (document.getElementById('workspace-modal-add-withprojects').checked) {
  let multiprojectSelect = document.getElementById('workspace-modal-add-multiproject');
  let selectedProjects = Array.from(multiprojectSelect.selectedOptions);
  
  for (const option of selectedProjects) {
    const projectName = option.text;
    const existingProject = listData.prjList.find(p => p.id === option.value);
    const projectDescription = existingProject ? existingProject.description : '';
    
    // ❌ 새 프로젝트 생성 시도
    const createProjectResp = await createProject(projectName, projectDescription);
    if (!createProjectResp.success) {
      showToast("Failed to create project: " + JSON.stringify(createProjectResp.message), 'error');
      continue;
    }
    
    const createWPmappingResp = await createWPmapping(createdWorkspace.message.id, [createProjectResp.message.id]);
    if (!createWPmappingResp.success) {
      showToast("Failed to map project to workspace: " + JSON.stringify(createWPmappingResp.message), 'error');
      continue;
    }
  }
}
```

**수정 후**:
```javascript
if (document.getElementById('workspace-modal-add-withprojects').checked) {
  let multiprojectSelect = document.getElementById('workspace-modal-add-multiproject');
  let multiprojects = Array.from(multiprojectSelect.selectedOptions, option => option.value);
  
  // ✅ 기존 프로젝트 ID들을 매핑만 수행
  const createdWPmapping = await createWPmapping(createdWorkspace.message.id, multiprojects);
  if (!createdWPmapping.success) {
    showToast("Failed to map projects to workspace: " + JSON.stringify(createdWPmapping.message), 'error');
    return
  }
}
```

## 검토 사항

### createworkspaceProject() 함수명 검토 필요

**현재 상황**:
- 함수명: `creatworkspaceProject()` (오타: creat → create)
- 실제 동작: workspace 생성 + 선택적으로 프로젝트 매핑
- "with Project" 옵션 체크 시: 기존 프로젝트를 매핑만 함 (생성하지 않음)

**개선 제안**:
1. **함수명 수정**: `creatworkspaceProject()` → `createWorkspaceWithMapping()`
   - 더 명확한 의미 전달
   - 오타 수정 (creat → create)

2. **함수 분리 검토**:
   ```javascript
   // Option 1: 기존 유지
   createWorkspaceWithMapping() // workspace 생성 + 선택적 프로젝트 매핑
   
   // Option 2: 함수 분리
   createWorkspace()            // workspace만 생성
   mapProjectsToWorkspace()     // 프로젝트 매핑만 수행
   ```

3. **주석 추가**:
   ```javascript
   /**
    * Create a new workspace and optionally map existing projects
    * 새 워크스페이스를 생성하고 선택적으로 기존 프로젝트를 매핑합니다.
    * 
    * @description
    * - Creates a workspace with name and description
    * - If "with Project" is checked, maps selected existing projects
    * - Does NOT create new projects (only maps existing ones)
    */
   export async function createWorkspaceWithMapping() {
     // ...
   }
   ```

## 테스트 결과

### 테스트 시나리오
1. ✅ Workspace만 생성 (with Project 체크 안 함)
2. ⏳ Workspace 생성 + 기존 프로젝트 매핑 (with Project 체크)

### 예상 API 호출
- **수정 전**: `CreateWorkspace` + `createProject` (❌ 잘못됨)
- **수정 후**: `CreateWorkspace` + `CreateWPmapping` (✅ 올바름)

### 추가 검증 필요
- [ ] createWPmapping API가 workspace ID를 정상적으로 인식하는지 확인
- [ ] 프로젝트가 이전 workspace에서 정상적으로 제거되는지 확인
- [ ] 프로젝트가 새 workspace에 정상적으로 할당되는지 확인

## 적용 브랜치
- **브랜치명**: `fix_050`
- **기반 브랜치**: `develop`
- **관련 이슈**: Workspace 프로젝트 매핑 오류

## 참고사항
- 프로젝트 생성 기능은 Projects 탭에서 별도로 제공됨 (`addWorkspaceProject()` 함수)
- "with Project" 옵션은 workspace 생성 시 기존 프로젝트를 바로 매핑하기 위한 편의 기능
- 모든 프로젝트는 하나의 workspace에만 속할 수 있음 (1:N 관계)

