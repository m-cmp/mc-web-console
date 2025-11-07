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


