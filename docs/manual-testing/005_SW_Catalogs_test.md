# 005_SW_Catalogs_test

## 화면 정보
- 메뉴 ID: swcatalogs
- 화면 이름: SW Catalogs
- 파일 경로: front/assets/js/pages/operation/plugins/softwaremanager.iframe.js

## 테스트 전제 조건

### Workspace 및 Project 선택
1. 화면 진입 시 workspace와 project가 선택되어 있지 않으면 경고 창이 표시됨
2. 경고 창에서 **Confirm** 버튼을 클릭하여 닫기
3. 화면 상단에서 **Workspace** 선택
   - 기본 선택: **ws01** (별다른 조건이 없는 경우)
4. Workspace 선택 후 **Project** 목록이 자동으로 로드됨
5. **Project** 선택
   - 기본 선택: **default** (별다른 조건이 없는 경우)

### 테스트 시작
- Workspace와 Project 선택 완료 후 아래 테스트 항목을 순차적으로 수행

## 테스트 항목

| 번호 | 카테고리 | 기능 | 테스트 항목 | 결과 | 실패 사유 |
|------|---------|------|------------|------|----------|
| 1 | 초기화 | 화면 로드 | 페이지 진입 시 SW Catalogs 화면이 정상 표시되는가 |  |  |
| 2 | 초기화 | iframe 로드 | iframe을 통한 외부 플러그인이 정상 로드되는가 |  |  |
| 3 | 조회 | Catalog 목록 | SW Catalog 목록이 정상 표시되는가 |  |  |
| 4 | 조회 | Catalog 상세 | SW Catalog 선택 시 상세 정보가 표시되는가 |  |  |
| 5 | 조회 | 카테고리 필터 | 카테고리별 필터링이 동작하는가 |  |  |
| 6 | 조회 | 검색 기능 | SW Catalog 검색 기능이 동작하는가 |  |  |
| 7 | 생성 | Add 버튼 | 'Add Catalog' 버튼이 정상 표시되는가 |  |  |
| 8 | 생성 | Catalog 생성 | SW Catalog 생성 기능이 동작하는가 |  |  |
| 9 | 수정 | Edit 버튼 | SW Catalog 수정 버튼이 동작하는가 |  |  |
| 10 | 수정 | Catalog 업데이트 | SW Catalog 수정 기능이 동작하는가 |  |  |
| 11 | 삭제 | Delete 버튼 | SW Catalog 삭제 버튼이 동작하는가 |  |  |
| 12 | 삭제 | Catalog 삭제 | SW Catalog 삭제 기능이 동작하는가 |  |  |
| 13 | 배포 | Deploy 버튼 | SW Catalog 배포 버튼이 동작하는가 |  |  |
| 14 | 배포 | 배포 대상 선택 | 배포할 대상(MCI/PMK)을 선택할 수 있는가 |  |  |
| 15 | 배포 | 배포 실행 | SW Catalog 배포 기능이 동작하는가 |  |  |
| 16 | 배포 | 배포 상태 | 배포 상태가 정상 표시되는가 |  |  |
| 17 | 에러 처리 | API 오류 | API 오류 발생 시 Toast 메시지가 표시되는가 |  |  |
| 18 | 에러 처리 | 검증 오류 | 필수 항목 누락 시 에러 메시지가 표시되는가 |  |  |

## 비고
- 이 화면은 iframe 플러그인으로 구현되어 있습니다.
- 외부 Software Manager 플러그인을 통해 SW Catalog 관리 기능을 제공합니다.
- 실제 기능은 플러그인 구현에 따라 달라질 수 있습니다.
- 테스트 항목은 일반적인 SW Catalog 관리 기능을 기준으로 작성되었습니다.
- 코드 분석 결과를 기반으로 자동 생성된 테스트 항목입니다.
- 실제 테스트 시 결과 열과 실패 사유 열을 채워주세요.

