# 008_Monitoring_Config_test

## 화면 정보
- 메뉴 ID: monitoringconfig
- 화면 이름: Monitoring Config
- 파일 경로: front/assets/js/pages/operation/analytics/monitoringconfig.js

## 테스트 항목

| 번호 | 카테고리 | 기능 | 테스트 항목 | 결과 | 실패 사유 |
|------|---------|------|------------|------|----------|
| 1 | 초기화 | 화면 로드 | 페이지 진입 시 Monitoring Config 화면이 정상 표시되는가 |  |  |
| 2 | 초기화 | 프로젝트 선택 | 상단 프로젝트 선택 드롭다운이 동작하는가 |  |  |
| 3 | 초기화 | 테이블 초기화 | 모든 테이블(Config, Metrics, LogTrace, Storages)이 정상 초기화되는가 |  |  |
| 4 | 조회 | Workload 목록 | Workload 선택 드롭다운에 목록이 표시되는가 |  |  |
| 5 | 조회 | VM 목록 | Workload 선택 시 VM 목록 테이블이 표시되는가 |  |  |
| 6 | 조회 | Agent 상태 | VM의 Monitoring Agent 상태가 표시되는가 |  |  |
| 7 | 조회 | Collect 상태 | VM의 수집 상태가 표시되는가 |  |  |
| 8 | 조회 | VM 선택 | VM 선택 시 상세 설정 영역이 활성화되는가 |  |  |
| 9 | 조회 | API 호출 | getMciIdList, getMci, getTargetsNsMci API가 호출되는가 |  |  |
| 10 | Agent 설치 | Agent 상태 셀 | Agent 미설치 VM의 Agent Status 셀 클릭 시 확인 모달이 표시되는가 |  |  |
| 11 | Agent 설치 | 설치 확인 | 확인 모달에서 설치 여부를 확인하는가 |  |  |
| 12 | Agent 설치 | Agent 설치 | 확인 후 Monitoring Agent가 설치되는가 |  |  |
| 13 | Agent 설치 | 상태 업데이트 | 설치 후 Agent 상태가 ACTIVE로 변경되는가 |  |  |
| 14 | Agent 설치 | API 호출 | InstallMonitoringAgent API가 호출되는가 |  |  |
| 15 | Metrics 설정 | Metrics 탭 | Monitoring Configuration 영역의 Metrics 탭이 동작하는가 |  |  |
| 16 | Metrics 설정 | Metrics 목록 | VM의 Metrics 항목 테이블이 표시되는가 |  |  |
| 17 | Metrics 설정 | Plugin 정보 | Server Name/Id, Plugin name, Plugin seq가 표시되는가 |  |  |
| 18 | Metrics 설정 | Prediction 버튼 | Prediction 설정 버튼이 동작하는가 |  |  |
| 19 | Metrics 설정 | Detection 버튼 | Detection 설정 버튼이 동작하는가 |  |  |
| 20 | Metrics 설정 | Edit Metrics 모달 | Edit Metrics 모달이 정상 열리는가 |  |  |
| 21 | Metrics 설정 | Measurement 선택 | Measurement 선택 테이블이 표시되는가 |  |  |
| 22 | Metrics 설정 | Metrics 선택 | Metrics 항목을 선택할 수 있는가 |  |  |
| 23 | Metrics 설정 | Metrics 저장 | 선택한 Metrics 설정이 저장되는가 |  |  |
| 24 | Metrics 설정 | API 호출 | GetMetricitems API가 호출되는가 |  |  |
| 25 | LogTrace 설정 | LogTrace 탭 | Monitoring Configuration 영역의 LogTrace 탭이 동작하는가 |  |  |
| 26 | LogTrace 설정 | LogTrace 목록 | VM의 Log/Trace 설정 테이블이 표시되는가 |  |  |
| 27 | LogTrace 설정 | Plugin 정보 | Server Name/Id, Plugin name, Plugin seq, Plugin Config가 표시되는가 |  |  |
| 28 | LogTrace 설정 | Edit Log Collector 모달 | Edit Log Collector 모달이 정상 열리는가 |  |  |
| 29 | LogTrace 설정 | Target Item 선택 | 수집 대상 항목을 선택할 수 있는가 |  |  |
| 30 | LogTrace 설정 | Log 설정 저장 | Log Collector 설정이 저장되는가 |  |  |
| 31 | Storage 설정 | Storage 탭 | Monitoring Configuration 영역의 Storage 탭이 동작하는가 |  |  |
| 32 | Storage 설정 | Storage 목록 | VM의 Storage 설정 테이블이 표시되는가 |  |  |
| 33 | Storage 설정 | Storage 정보 | Server Name/Id, Plugin Name, Plugin seq, Plugin Config가 표시되는가 |  |  |
| 34 | Storage 설정 | Edit Storage 모달 | Edit Storage 모달이 정상 열리는가 |  |  |
| 35 | Storage 설정 | Storage 선택 | Storage 항목을 선택할 수 있는가 |  |  |
| 36 | Storage 설정 | Storage 저장 | Storage 설정이 저장되는가 |  |  |
| 37 | 상세 정보 | VM 정보 표시 | 선택한 VM의 Name, Description, Workload Type이 표시되는가 |  |  |
| 38 | 상세 정보 | Monitor 스위치 | Monitor On/Off 스위치가 표시되는가 |  |  |
| 39 | 상세 정보 | Agent 상태 표시 | Agent 상태가 Running/Stopped로 표시되는가 |  |  |
| 40 | 상세 정보 | Collect 상태 표시 | Collect 상태가 Running/Stopped로 표시되는가 |  |  |
| 41 | 테이블 기능 | 정렬 | 컬럼 클릭 시 정렬이 동작하는가 |  |  |
| 42 | 테이블 기능 | 페이징 | 페이지 네비게이션이 정상 동작하는가 |  |  |
| 43 | 테이블 기능 | 행 선택 | 체크박스를 통한 다중 선택이 동작하는가 |  |  |
| 44 | 에러 처리 | API 오류 | API 오류 발생 시 Toast 메시지가 표시되는가 |  |  |
| 45 | 에러 처리 | 검증 오류 | VM 미선택 시 에러 메시지가 표시되는가 |  |  |

## 비고
- Workload(MCI/PMK)의 VM별로 모니터링 설정을 관리합니다.
- Monitoring Agent 설치 상태를 확인하고 설치할 수 있습니다.
- Metrics, LogTrace, Storage 세 가지 카테고리로 모니터링 설정을 관리합니다.
- Tabulator를 사용하여 여러 개의 테이블을 관리합니다.
- Agent 상태는 ACTIVE/INACTIVE/Not Installed로 표시됩니다.
- 코드 분석 결과를 기반으로 자동 생성된 테스트 항목입니다.
- 실제 테스트 시 결과 열과 실패 사유 열을 채워주세요.

