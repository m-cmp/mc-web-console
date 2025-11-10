# 006_Data_Migrations_test

## 화면 정보
- 메뉴 ID: datamigrations
- 화면 이름: Data Migrations
- 파일 경로: front/assets/js/pages/operation/plugins/datamanager.iframe.js

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
| 1 | 초기화 | 화면 로드 | 페이지 진입 시 Data Migrations 화면이 정상 표시되는가 |  |  |
| 2 | 초기화 | iframe 로드 | iframe을 통한 외부 플러그인이 정상 로드되는가 |  |  |
| 3 | 조회 | Migration 목록 | Data Migration 작업 목록이 정상 표시되는가 |  |  |
| 4 | 조회 | Migration 상세 | Migration 작업 선택 시 상세 정보가 표시되는가 |  |  |
| 5 | 조회 | 상태 필터 | 상태별 필터링이 동작하는가 |  |  |
| 6 | 조회 | 검색 기능 | Migration 작업 검색 기능이 동작하는가 |  |  |
| 7 | 생성 | Add 버튼 | 'Add Migration' 버튼이 정상 표시되는가 |  |  |
| 8 | 생성 | Source 선택 | Migration 소스를 선택할 수 있는가 |  |  |
| 9 | 생성 | Target 선택 | Migration 대상을 선택할 수 있는가 |  |  |
| 10 | 생성 | 설정 입력 | Migration 설정을 입력할 수 있는가 |  |  |
| 11 | 생성 | Migration 생성 | Data Migration 작업이 생성되는가 |  |  |
| 12 | 수정 | Edit 버튼 | Migration 작업 수정 버튼이 동작하는가 |  |  |
| 13 | 수정 | Migration 업데이트 | Migration 작업 수정 기능이 동작하는가 |  |  |
| 14 | 삭제 | Delete 버튼 | Migration 작업 삭제 버튼이 동작하는가 |  |  |
| 15 | 삭제 | Migration 삭제 | Migration 작업 삭제 기능이 동작하는가 |  |  |
| 16 | 실행 | Start 버튼 | Migration 시작 버튼이 동작하는가 |  |  |
| 17 | 실행 | Stop 버튼 | Migration 중지 버튼이 동작하는가 |  |  |
| 18 | 실행 | Pause 버튼 | Migration 일시정지 버튼이 동작하는가 |  |  |
| 19 | 실행 | Resume 버튼 | Migration 재개 버튼이 동작하는가 |  |  |
| 20 | 실행 | 진행 상태 | Migration 진행 상태가 표시되는가 |  |  |
| 21 | 실행 | 진행률 표시 | Migration 진행률(%)이 표시되는가 |  |  |
| 22 | 실행 | 로그 조회 | Migration 실행 로그를 조회할 수 있는가 |  |  |
| 23 | 에러 처리 | API 오류 | API 오류 발생 시 Toast 메시지가 표시되는가 |  |  |
| 24 | 에러 처리 | 검증 오류 | 필수 항목 누락 시 에러 메시지가 표시되는가 |  |  |

## 비고
- 이 화면은 iframe 플러그인으로 구현되어 있습니다.
- 외부 Data Manager 플러그인을 통해 데이터 마이그레이션 기능을 제공합니다.
- 실제 기능은 플러그인 구현에 따라 달라질 수 있습니다.
- 테스트 항목은 일반적인 데이터 마이그레이션 기능을 기준으로 작성되었습니다.
- 코드 분석 결과를 기반으로 자동 생성된 테스트 항목입니다.
- 실제 테스트 시 결과 열과 실패 사유 열을 채워주세요.

