# 003_PMK_Workloads_test

## 화면 정보
- 메뉴 ID: pmkworkloads
- 화면 이름: PMK Workloads
- 파일 경로: front/assets/js/pages/operation/manage/pmk.js

## 테스트 항목

| 번호 | 카테고리 | 기능 | 테스트 항목 | 결과 | 실패 사유 |
|------|---------|------|------------|------|----------|
| 1 | 초기화 | 화면 로드 | 페이지 진입 시 PMK 목록이 정상 표시되는가 |  |  |
| 2 | 초기화 | 프로젝트 선택 | 상단 프로젝트 선택 드롭다운이 동작하는가 |  |  |
| 3 | 초기화 | URL 파라미터 | URL에서 pmkID 파라미터로 특정 PMK를 선택할 수 있는가 |  |  |
| 4 | 조회 | 목록 조회 | PMK 목록 테이블이 정상 표시되는가 |  |  |
| 5 | 조회 | 상태 정보 | 상단 대시보드에 PMK 상태 통계가 표시되는가 |  |  |
| 6 | 조회 | 행 선택 | PMK 선택 시 상세 정보 영역이 활성화되는가 |  |  |
| 7 | 조회 | PMK 상세 | 선택한 PMK의 Name, Version, Status가 표시되는가 |  |  |
| 8 | 조회 | Network 정보 | PMK의 VPC, Subnet, Security Group 정보가 표시되는가 |  |  |
| 9 | 조회 | Connection 정보 | PMK의 Cloud Connection, Endpoint가 표시되는가 |  |  |
| 10 | 조회 | NodeGroup 목록 | 선택한 PMK의 NodeGroup 목록이 표시되는가 |  |  |
| 11 | 조회 | NodeGroup 상세 | NodeGroup 선택 시 상세 정보가 표시되는가 |  |  |
| 12 | 조회 | Node 정보 | NodeGroup의 Image, Spec, KeyPair, Node Size 정보가 표시되는가 |  |  |
| 13 | 생성 | Add 버튼 | 'Add cluster' 버튼이 정상 표시되는가 |  |  |
| 14 | 생성 | Simple Creation | Simple Creation 모드로 클러스터 생성 화면이 표시되는가 |  |  |
| 15 | 생성 | Expert Creation | Expert Creation 버튼으로 Expert 모드로 전환되는가 |  |  |
| 16 | 생성 | Provider 선택 | Provider 선택 드롭다운이 동작하는가 |  |  |
| 17 | 생성 | Region 선택 | Region 선택 드롭다운이 동작하는가 |  |  |
| 18 | 생성 | Provider 필터링 | Provider 선택 시 Region이 필터링되는가 |  |  |
| 19 | 생성 | Region 필터링 | Region 선택 시 Connection이 필터링되는가 |  |  |
| 20 | 생성 | Connection 선택 | Connection 선택 드롭다운이 동작하는가 |  |  |
| 21 | 생성 | NodeGroup 폼 표시 | Azure/GCP/IBM/NHN 선택 시 NodeGroup 구성 폼이 표시되는가 |  |  |
| 22 | 생성 | NodeGroup 폼 숨김 | 지원되지 않는 Provider 선택 시 NodeGroup 폼이 숨겨지는가 |  |  |
| 23 | 생성 | Spec 추천 모달 | Spec 추천 버튼 클릭 시 모달이 열리는가 |  |  |
| 24 | 생성 | Spec 선택 | 추천된 Spec을 선택할 수 있는가 |  |  |
| 25 | 생성 | Image 추천 모달 | Image 추천 버튼 클릭 시 모달이 열리는가 |  |  |
| 26 | 생성 | Image 선택 검증 | Spec 미선택 시 Image 모달 열기가 차단되는가 |  |  |
| 27 | 생성 | Image 선택 | 추천된 Image를 선택할 수 있는가 |  |  |
| 28 | 생성 | Node Size 조절 | Desired Node Size +/- 버튼이 동작하는가 |  |  |
| 29 | 생성 | 사전 검증 | Deploy 전 checkK8sClusterDynamic API가 호출되는가 |  |  |
| 30 | 생성 | 클러스터 생성 | Deploy 버튼 클릭 시 클러스터가 생성되는가 |  |  |
| 31 | 생성 | 폼 초기화 | 생성 완료 후 폼이 초기화되는가 |  |  |
| 32 | 생성 | API 호출 | checkK8sClusterDynamic, createK8sClusterDynamic API가 호출되는가 |  |  |
| 33 | 수정 | Refresh 버튼 | Refresh 버튼 클릭 시 PMK 목록이 갱신되는가 |  |  |
| 34 | 삭제 | Delete PMK 버튼 | PMK 선택 후 Delete 버튼이 활성화되는가 |  |  |
| 35 | 삭제 | PMK 삭제 | Delete 확인 후 PMK가 삭제되는가 |  |  |
| 36 | 삭제 | Delete NodeGroup 버튼 | NodeGroup 선택 후 Delete 버튼이 활성화되는가 |  |  |
| 37 | 삭제 | NodeGroup 삭제 | Delete 확인 후 NodeGroup이 삭제되는가 |  |  |
| 38 | 삭제 | API 호출 | pmkDelete, nodeGroupDelete API가 호출되는가 |  |  |
| 39 | 라이프사이클 | Start PMK | PMK Start 버튼이 동작하는가 |  |  |
| 40 | 라이프사이클 | Stop PMK | PMK Stop 버튼이 동작하는가 |  |  |
| 41 | 라이프사이클 | Terminate PMK | PMK Terminate 버튼이 동작하는가 |  |  |
| 42 | 라이프사이클 | 상태 변경 | 라이프사이클 실행 후 상태가 정상 업데이트되는가 |  |  |
| 43 | 라이프사이클 | API 호출 | pmkLifeCycle API가 호출되는가 |  |  |
| 44 | NodeGroup 관리 | 체크박스 선택 | NodeGroup 체크박스 선택이 동작하는가 |  |  |
| 45 | NodeGroup 관리 | 다중 선택 | NodeGroup 다중 선택이 동작하는가 |  |  |
| 46 | NodeGroup 관리 | 선택 강조 | 마지막 선택된 NodeGroup에 테두리가 표시되는가 |  |  |
| 47 | NodeGroup 관리 | Node 목록 | NodeGroup 내 Node 목록이 표시되는가 |  |  |
| 48 | Spec 추천 | Location 설정 | Seoul/London/New York 프리셋으로 좌표가 설정되는가 |  |  |
| 49 | Spec 추천 | 추천 조회 | Spec 추천 API가 정상 호출되는가 |  |  |
| 50 | Spec 추천 | Spec 테이블 | 추천된 Spec이 테이블에 표시되는가 |  |  |
| 51 | Spec 추천 | Provider 필터링 | Provider별 Spec 필터링이 동작하는가 |  |  |
| 52 | Spec 추천 | Spec 적용 | 선택한 Spec이 폼에 적용되는가 |  |  |
| 53 | Spec 추천 | 전역 변수 설정 | selectedPmkSpecInfo가 전역 변수에 저장되는가 |  |  |
| 54 | Spec 추천 | API 호출 | getRecommendVmInfoPmk API가 호출되는가 |  |  |
| 55 | Image 추천 | Image 모달 | Image 추천 모달이 정상 열리는가 |  |  |
| 56 | Image 추천 | Spec 정보 전달 | Spec 정보가 Image 모달에 전달되는가 |  |  |
| 57 | Image 추천 | Image 테이블 | 추천된 Image가 테이블에 표시되는가 |  |  |
| 58 | Image 추천 | Image 선택 | 선택한 Image가 폼에 적용되는가 |  |  |
| 59 | Image 추천 | 콜백 함수 | Image 선택 콜백이 정상 동작하는가 |  |  |
| 60 | 테이블 기능 | Provider 아이콘 | Provider 로고 이미지가 표시되는가 |  |  |
| 61 | 테이블 기능 | NodeGroup 수 | NodeGroup 개수가 표시되는가 |  |  |
| 62 | 테이블 기능 | 정렬 | 컬럼 클릭 시 정렬이 동작하는가 |  |  |
| 63 | 테이블 기능 | 페이징 | 페이지 네비게이션이 정상 동작하는가 |  |  |
| 64 | 에러 처리 | API 오류 | API 오류 발생 시 Toast 메시지가 표시되는가 |  |  |
| 65 | 에러 처리 | 검증 오류 | 필수 항목 누락 시 에러 메시지가 표시되는가 |  |  |

## 비고
- PMK(Platform Managed Kubernetes)는 Kubernetes 클러스터를 관리하는 워크로드입니다.
- Simple Creation과 Expert Creation 두 가지 생성 모드를 제공합니다.
- Azure, GCP, IBM, NHN 등 일부 CSP에서 NodeGroup 구성을 지원합니다.
- Spec 및 Image 추천 기능을 통해 최적의 리소스를 선택할 수 있습니다.
- 사전 검증(checkK8sClusterDynamic)을 통해 생성 가능 여부를 확인합니다.
- 코드 분석 결과를 기반으로 자동 생성된 테스트 항목입니다.
- 실제 테스트 시 결과 열과 실패 사유 열을 채워주세요.

