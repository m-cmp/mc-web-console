# 001_Workspaces_test

## 화면 정보
- 메뉴 ID: workspaces
- 화면 이름: Workspaces
- 파일 경로: front/assets/js/pages/operation/workspace/workspaces.js

## 테스트 항목

| 번호 | 카테고리 | 기능 | 테스트 항목 | 결과 | 실패 사유 |
|------|---------|------|------------|------|----------|
| 1 | 초기화 | 화면 로드 | 페이지 진입 시 Workspace 목록이 정상 표시되는가 |  |  |
| 2 | 초기화 | 요약 정보 | 상단 대시보드에 Workspaces/Projects/Members 수가 표시되는가 |  |  |
| 3 | 조회 | 목록 조회 | Workspace 목록 테이블이 정상 표시되는가 |  |  |
| 4 | 조회 | 행 선택 | Workspace 선택 시 상세 정보 카드가 표시되는가 |  |  |
| 5 | 조회 | 상세 정보 탭 | Details 탭에서 Workspace 기본 정보가 표시되는가 |  |  |
| 6 | 조회 | 프로젝트 탭 | Projects 탭에서 할당된 프로젝트 목록이 표시되는가 |  |  |
| 7 | 조회 | 사용자 탭 | Users 탭에서 할당된 사용자 목록이 표시되는가 |  |  |
| 8 | 조회 | 역할 탭 | Roles 탭에서 역할 목록이 표시되는가 |  |  |
| 9 | 생성 | Add 버튼 | 'Add Workspace' 버튼이 정상 표시되는가 |  |  |
| 10 | 생성 | 모달 열기 | Add 버튼 클릭 시 Workspace 생성 모달이 열리는가 |  |  |
| 11 | 생성 | 기본 정보 입력 | Name, Description 입력 필드가 동작하는가 |  |  |
| 12 | 생성 | 프로젝트 선택 | 멀티 프로젝트 선택 드롭다운이 동작하는가 |  |  |
| 13 | 생성 | Workspace 생성 | 입력 후 생성 버튼 클릭 시 Workspace가 생성되는가 |  |  |
| 14 | 생성 | API 호출 | createWorkspace, createWPmapping API가 호출되는가 |  |  |
| 15 | 수정 | Edit 버튼 | Workspace 선택 후 Edit 버튼이 활성화되는가 |  |  |
| 16 | 수정 | 단일 선택 검증 | 여러 개 선택 시 에러 메시지가 표시되는가 |  |  |
| 17 | 수정 | 수정 모달 열기 | Edit 버튼 클릭 시 수정 모달이 열리는가 |  |  |
| 18 | 수정 | 기존 데이터 로드 | 모달에 기존 Workspace 정보가 로드되는가 |  |  |
| 19 | 수정 | 프로젝트 수정 | 할당된 프로젝트를 변경할 수 있는가 |  |  |
| 20 | 수정 | 중복 프로젝트 검증 | 다른 Workspace에 할당된 프로젝트 선택 시 에러가 표시되는가 |  |  |
| 21 | 수정 | Workspace 업데이트 | 수정 후 저장 시 정상 업데이트되는가 |  |  |
| 22 | 수정 | API 호출 | updateWorkspaceById, updateWPmappings API가 호출되는가 |  |  |
| 23 | 삭제 | Delete 버튼 | Workspace 선택 후 Delete 버튼이 활성화되는가 |  |  |
| 24 | 삭제 | 선택 검증 | 선택되지 않았을 때 에러 메시지가 표시되는가 |  |  |
| 25 | 삭제 | Workspace 삭제 | Delete 확인 후 Workspace가 삭제되는가 |  |  |
| 26 | 삭제 | API 호출 | deleteWorkspaceById API가 호출되는가 |  |  |
| 27 | 프로젝트 관리 | 프로젝트 추가 모달 | Projects 탭에서 Add 버튼이 동작하는가 |  |  |
| 28 | 프로젝트 관리 | 프로젝트 생성 | 새 프로젝트 생성 기능이 동작하는가 |  |  |
| 29 | 프로젝트 관리 | 프로젝트 매핑 | 생성된 프로젝트가 Workspace에 할당되는가 |  |  |
| 30 | 프로젝트 관리 | 프로젝트 삭제 | Projects 탭에서 프로젝트 매핑 삭제가 동작하는가 |  |  |
| 31 | 프로젝트 관리 | API 호출 | createProject, createWPmapping, deleteWorkspaceProjectMappingById API가 호출되는가 |  |  |
| 32 | 역할 관리 | 역할 추가 모달 | Roles 탭에서 Add 버튼이 동작하는가 |  |  |
| 33 | 역할 관리 | 권한 테이블 | 권한 선택 테이블이 표시되는가 |  |  |
| 34 | 역할 관리 | 역할 생성 | 새 역할이 정상 생성되는가 |  |  |
| 35 | 역할 관리 | 정책 할당 | 역할에 권한이 정상 할당되는가 |  |  |
| 36 | 역할 관리 | 역할 상세 | 역할 클릭 시 상세 모달이 열리는가 |  |  |
| 37 | 역할 관리 | 역할 수정 | 역할의 권한을 수정할 수 있는가 |  |  |
| 38 | 역할 관리 | 역할 삭제 | 역할 삭제 기능이 동작하는가 |  |  |
| 39 | 역할 관리 | API 호출 | createRole, appendResourcePermissionPolices, deleteResourcePermissionPolices, deleteRoleById API가 호출되는가 |  |  |
| 40 | 사용자 관리 | 사용자 추가 모달 | Users 탭에서 Add 버튼이 동작하는가 |  |  |
| 41 | 사용자 관리 | 사용자 선택 | 할당 가능한 사용자 목록이 표시되는가 |  |  |
| 42 | 사용자 관리 | 역할 선택 | 사용자에게 할당할 역할을 선택할 수 있는가 |  |  |
| 43 | 사용자 관리 | 사용자 할당 | 선택한 사용자가 Workspace에 할당되는가 |  |  |
| 44 | 사용자 관리 | 사용자 제거 | Users 탭에서 사용자 제거가 동작하는가 |  |  |
| 45 | 사용자 관리 | API 호출 | createWorkspaceUserRoleMappingByName, deleteWorkspaceUserRoleMapping API가 호출되는가 |  |  |
| 46 | 테이블 기능 | 정렬 | 컬럼 클릭 시 정렬이 동작하는가 |  |  |
| 47 | 테이블 기능 | 페이징 | 페이지 네비게이션이 정상 동작하는가 |  |  |
| 48 | 테이블 기능 | 행 선택 | 체크박스를 통한 다중 선택이 동작하는가 |  |  |
| 49 | 에러 처리 | API 오류 | API 오류 발생 시 Toast 메시지가 표시되는가 |  |  |
| 50 | 에러 처리 | 검증 오류 | 필수 항목 누락 시 에러 메시지가 표시되는가 |  |  |

## 비고
- Workspace는 Organization의 작업 단위이며, Projects, Users, Roles를 관리합니다.
- TomSelect 라이브러리를 사용한 멀티 선택 드롭다운이 구현되어 있습니다.
- Tabulator를 사용하여 여러 개의 테이블(Workspaces, Projects, Users, Roles)을 관리합니다.
- 코드 분석 결과를 기반으로 자동 생성된 테스트 항목입니다.
- 실제 테스트 시 결과 열과 실패 사유 열을 채워주세요.

