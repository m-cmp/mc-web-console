# 007_MCIs_Monitoring_test

## 화면 정보
- 메뉴 ID: mcismonitoring
- 화면 이름: MCIs Monitoring
- 파일 경로: front/assets/js/pages/operation/manage/monitoring.js

## 테스트 항목

| 번호 | 카테고리 | 기능 | 테스트 항목 | 결과 | 실패 사유 |
|------|---------|------|------------|------|----------|
| 1 | 초기화 | 화면 로드 | 페이지 진입 시 Monitoring 화면이 정상 표시되는가 |  |  |
| 2 | 초기화 | 프로젝트 선택 | 상단 프로젝트 선택 드롭다운이 동작하는가 |  |  |
| 3 | 조회 | MCI 목록 | MCI 선택 드롭다운에 MCI 목록이 표시되는가 |  |  |
| 4 | 조회 | VM 목록 | MCI 선택 시 VM 목록이 표시되는가 |  |  |
| 5 | 조회 | Measurement 목록 | VM 선택 시 Measurement 목록이 표시되는가 |  |  |
| 6 | 조회 | Range 선택 | Time Range 선택 드롭다운이 동작하는가 |  |  |
| 7 | 모니터링 | Start 버튼 | 'Start Monitoring' 버튼이 동작하는가 |  |  |
| 8 | 모니터링 | 데이터 조회 | Monitoring 데이터가 정상 조회되는가 |  |  |
| 9 | 모니터링 | 그래프 표시 | CPU Usage 그래프가 정상 표시되는가 |  |  |
| 10 | 모니터링 | CPU 별 데이터 | cpu0, cpu1, cpu2, cpu3 별 데이터가 표시되는가 |  |  |
| 11 | 모니터링 | 시계열 데이터 | 시간대별 시계열 데이터가 그래프에 표시되는가 |  |  |
| 12 | 모니터링 | API 호출 | getInfluxDBMetrics API가 호출되는가 |  |  |
| 13 | Prediction | Prediction Switch | Prediction 토글 스위치가 동작하는가 |  |  |
| 14 | Prediction | Prediction 활성화 | Prediction 활성화 시 예측 데이터가 조회되는가 |  |  |
| 15 | Prediction | Prediction 그래프 | 예측 데이터가 그래프에 추가되는가 |  |  |
| 16 | Prediction | Prediction 색상 | 예측 데이터가 다른 색상으로 표시되는가 |  |  |
| 17 | Prediction | API 호출 | monitoringPrediction API가 호출되는가 |  |  |
| 18 | Prediction | API 실패 처리 | Prediction API 실패 시 기존 데이터만 표시되는가 |  |  |
| 19 | Detection | Detection Switch | Detection 토글 스위치가 동작하는가 |  |  |
| 20 | Detection | Detection 활성화 | Detection 활성화 시 Detection 그래프 영역이 표시되는가 |  |  |
| 21 | Detection | Anomaly Score 그래프 | Anomaly Score 그래프가 정상 표시되는가 |  |  |
| 22 | Detection | 시계열 표시 | 시간대별 Anomaly Score가 표시되는가 |  |  |
| 23 | Detection | API 호출 | getDetectionHistory API가 호출되는가 |  |  |
| 24 | 그래프 설정 | Area Chart | 그래프가 Area Chart 형태로 표시되는가 |  |  |
| 25 | 그래프 설정 | Toolbar | 그래프 Toolbar가 표시되는가 |  |  |
| 26 | 그래프 설정 | 범례 | 그래프 범례가 정상 표시되는가 |  |  |
| 27 | 그래프 설정 | Tooltip | 그래프 Tooltip이 정상 동작하는가 |  |  |
| 28 | 그래프 설정 | 색상 구분 | CPU별로 색상이 구분되어 표시되는가 |  |  |
| 29 | 에러 처리 | API 오류 | API 오류 발생 시 Toast 메시지가 표시되는가 |  |  |
| 30 | 에러 처리 | 데이터 없음 | 모니터링 데이터가 없을 때 적절한 메시지가 표시되는가 |  |  |

## 비고
- ApexCharts 라이브러리를 사용하여 모니터링 그래프를 표시합니다.
- InfluxDB를 통해 메트릭 데이터를 조회합니다.
- Prediction 기능을 통해 향후 리소스 사용량을 예측할 수 있습니다.
- Anomaly Detection 기능을 통해 비정상 패턴을 탐지할 수 있습니다.
- MCI → VM → Measurement → Range 순으로 선택하여 모니터링 데이터를 조회합니다.
- 코드 분석 결과를 기반으로 자동 생성된 테스트 항목입니다.
- 실제 테스트 시 결과 열과 실패 사유 열을 채워주세요.

