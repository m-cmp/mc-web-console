# 011_Log_Manage_test

## 화면 정보
- 메뉴 ID: logmanage
- 화면 이름: Log Manage
- 파일 경로: front/assets/js/pages/operation/analytics/logmanage.js

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
| 1 | 초기화 | 화면 로드 | 페이지 진입 시 Log Manage 화면이 정상 표시되는가 |  |  |
| 2 | 초기화 | 프로젝트 선택 | 상단 프로젝트 선택 드롭다운이 동작하는가 |  |  |
| 3 | 초기화 | 테이블 초기화 | Log 목록 테이블이 정상 초기화되는가 |  |  |
| 4 | 조회 | Log 조회 버튼 | 'Get Collected Log' 버튼이 정상 표시되는가 |  |  |
| 5 | 조회 | Log 목록 | Log 목록 테이블이 정상 표시되는가 |  |  |
| 6 | 조회 | Log 데이터 | 조회된 Log 데이터가 테이블에 표시되는가 |  |  |
| 7 | 조회 | API 호출 | getMonitoringLog API가 호출되는가 |  |  |
| 8 | Log 정보 | NS 표시 | Log의 Namespace(NS) 정보가 표시되는가 |  |  |
| 9 | Log 정보 | MCI 표시 | Log의 MCI ID가 표시되는가 |  |  |
| 10 | Log 정보 | Target 표시 | Log의 Target(VM) ID가 표시되는가 |  |  |
| 11 | Log 정보 | Host 표시 | Log의 Host 정보가 표시되는가 |  |  |
| 12 | Log 정보 | PID 표시 | Log의 Process ID가 표시되는가 |  |  |
| 13 | Log 정보 | Program 표시 | Log의 Program 이름이 표시되는가 |  |  |
| 14 | Log 정보 | Timestamp 표시 | Log의 Timestamp가 표시되는가 |  |  |
| 15 | Log 정보 | Message 표시 | Log Message가 표시되는가 |  |  |
| 16 | Log 상세 | Log 선택 | Log 선택 시 상세 정보 영역이 활성화되는가 |  |  |
| 17 | Log 상세 | Timestamp 상세 | 선택한 Log의 @timestamp가 표시되는가 |  |  |
| 18 | Log 상세 | Measurement 상세 | 선택한 Log의 measurement_name이 표시되는가 |  |  |
| 19 | Log 상세 | Message 상세 | 선택한 Log의 전체 Message가 표시되는가 |  |  |
| 20 | Log 상세 | Tag 정보 | Log의 Tag 정보(host, mci_id, ns_id, path, target_id)가 표시되는가 |  |  |
| 21 | Log 상세 | Tail 정보 | Log의 Tail 정보(host, pid, program, timestamp)가 표시되는가 |  |  |
| 22 | 필터링 | Measurement 선택 | Measurement 선택 드롭다운이 동작하는가 |  |  |
| 23 | 필터링 | Range 선택 | Time Range 선택 드롭다운이 동작하는가 |  |  |
| 24 | 필터링 | VM 선택 | VM 선택 드롭다운이 동작하는가 |  |  |
| 25 | 필터링 | 키워드 필터 | 키워드로 Log 필터링이 동작하는가 |  |  |
| 26 | 필터링 | 필터 적용 | 필터 적용 후 Log 목록이 갱신되는가 |  |  |
| 27 | 필터링 | 필터 초기화 | 'Clear Filters' 버튼이 동작하는가 |  |  |
| 28 | Formatter | Tag Formatter | Tag 필드의 NS/MCI/Target ID가 정상 포맷되는가 |  |  |
| 29 | Formatter | Tail Formatter | Tail 필드의 Host/PID/Program/Timestamp가 정상 포맷되는가 |  |  |
| 30 | 테이블 기능 | 정렬 | 컬럼 클릭 시 정렬이 동작하는가 |  |  |
| 31 | 테이블 기능 | 페이징 | 페이지 네비게이션이 정상 동작하는가 |  |  |
| 32 | 테이블 기능 | 행 선택 | 체크박스를 통한 다중 선택이 동작하는가 |  |  |
| 33 | 에러 처리 | API 오류 | API 오류 발생 시 Toast 메시지가 표시되는가 |  |  |
| 34 | 에러 처리 | 데이터 없음 | Log 데이터가 없을 때 적절한 메시지가 표시되는가 |  |  |

## 비고
- Tabulator를 사용하여 Log 목록 테이블을 관리합니다.
- OpenSearch/ElasticSearch를 통해 Log 데이터를 조회합니다.
- Log 데이터는 Tag(메타데이터)와 Tail(실제 로그 내용)로 구성됩니다.
- Measurement, Range, VM 선택을 통해 Log를 필터링할 수 있습니다.
- 현재 코드에는 테스트 데이터가 하드코딩되어 있습니다(실제 API 호출은 주석 처리).
- 코드 분석 결과를 기반으로 자동 생성된 테스트 항목입니다.
- 실제 테스트 시 결과 열과 실패 사유 열을 채워주세요.

