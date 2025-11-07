# 003_PMK_Workloads_test

## 화면 정보
- 메뉴 ID: pmkworkloads
- 화면 이름: PMK Workloads
- 파일 경로: front/assets/js/pages/operation/manage/pmk.js

## 테스트 전제 조건

### Workspace 및 Project 선택
1. 화면 진입 시 workspace와 project가 선택되어 있지 않으면 경고 창이 표시됨
2. 경고 창에서 **Confirm** 버튼을 클릭하여 닫기
3. 화면 상단에서 **Workspace** 선택
   - 기본 선택: **ws01** (별다른 조건이 없는 경우)
4. Workspace 선택 후 **Project** 목록이 자동으로 로드됨
5. **Project** 선택
   - 기본 선택: **default** (별다른 조건이 없는 경우)

### PMK 생성 테스트 전제 조건 (생성 테스트 시)
1. Provider별 생성 방식:
   - **Type1 (AWS, Alibaba, 기타)**: Cluster 생성 후 NodeGroup 별도 생성 (2단계)
   - **Type2 (Azure, GCP, IBM, NHN)**: Cluster와 NodeGroup 동시 생성 (1단계)
2. 테스트할 Provider별로 다음 사항이 사전 준비되어야 함:
   - Connection 설정 완료
   - Region 선택 (서울 리전 우선: AWS ap-northeast-2, Azure koreacentral, GCP asia-northeast3)
   - Spec 및 Image 사전 확인
3. Type2 Provider는 NodeGroup 폼이 표시되어야 함

### 테스트 시작
- Workspace와 Project 선택 완료 후 아래 테스트 항목을 순차적으로 수행

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
| 13 | 생성 - 기본 | Add 버튼 | 'Add cluster' 버튼이 정상 표시되는가 |  |  |
| 14 | 생성 - 기본 | Simple Creation | Simple Creation 모드로 클러스터 생성 화면이 표시되는가 |  |  |
| 15 | 생성 - 기본 | Expert Creation | Expert Creation 버튼으로 Expert 모드로 전환되는가 |  |  |
| 16 | 생성 - Type1 공통 | Provider 선택 | AWS, Alibaba, 기타 Provider를 선택할 수 있는가 |  |  |
| 17 | 생성 - Type1 공통 | Region 선택 | Region 선택 드롭다운이 동작하는가 |  |  |
| 18 | 생성 - Type1 공통 | Connection 필터링 | Provider/Region 선택 시 Connection이 필터링되는가 |  |  |
| 19 | 생성 - Type1 공통 | Connection 선택 | Connection 선택 드롭다운이 동작하는가 |  |  |
| 20 | 생성 - Type1 공통 | Spec 추천 | Spec 추천 및 선택 기능이 동작하는가 |  |  |
| 21 | 생성 - AWS | Provider 선택 | Provider로 AWS를 선택할 수 있는가 |  |  |
| 22 | 생성 - AWS | Region 선택 | AWS Region 목록이 조회되는가 (기본: ap-northeast-2 서울) |  |  |
| 23 | 생성 - AWS | Connection 선택 | AWS Connection을 선택할 수 있는가 |  |  |
| 24 | 생성 - AWS | Cluster 생성 | Cluster 생성 API가 호출되는가 |  |  |
| 25 | 생성 - AWS | NodeGroup 추가 | Cluster 생성 후 NodeGroup을 별도로 추가할 수 있는가 |  |  |
| 26 | 생성 - Alibaba | Provider 선택 | Provider로 Alibaba를 선택할 수 있는가 |  |  |
| 27 | 생성 - Alibaba | Region 선택 | Alibaba Region 목록이 조회되는가 |  |  |
| 28 | 생성 - Alibaba | Connection 선택 | Alibaba Connection을 선택할 수 있는가 |  |  |
| 29 | 생성 - Alibaba | Cluster 생성 | Cluster 생성 API가 호출되는가 |  |  |
| 30 | 생성 - Alibaba | NodeGroup 추가 | Cluster 생성 후 NodeGroup을 별도로 추가할 수 있는가 |  |  |
| 31 | 생성 - Type2 공통 | Provider 선택 | Azure, GCP, IBM, NHN Provider를 선택할 수 있는가 |  |  |
| 32 | 생성 - Type2 공통 | Region 선택 | Region 선택 드롭다운이 동작하는가 |  |  |
| 33 | 생성 - Type2 공통 | Connection 선택 | Connection 선택 드롭다운이 동작하는가 |  |  |
| 34 | 생성 - Type2 공통 | NodeGroup 폼 표시 | NodeGroup 구성 폼이 자동으로 표시되는가 |  |  |
| 35 | 생성 - Type2 공통 | NodeGroup 정보 입력 | Image, Spec, Node Size를 입력할 수 있는가 |  |  |
| 36 | 생성 - Type2 공통 | 동시 생성 | Cluster와 NodeGroup이 동시에 생성되는가 |  |  |
| 37 | 생성 - Azure | Provider 선택 | Provider로 Azure를 선택할 수 있는가 |  |  |
| 38 | 생성 - Azure | Region 선택 | Azure Region 목록이 조회되는가 (기본: koreacentral 서울) |  |  |
| 39 | 생성 - Azure | NodeGroup 설정 | NodeGroup 폼에서 Image, Spec, Node Size를 설정할 수 있는가 |  |  |
| 40 | 생성 - Azure | 생성 확인 | Cluster + NodeGroup이 정상 생성되는가 |  |  |
| 41 | 생성 - GCP | Provider 선택 | Provider로 GCP를 선택할 수 있는가 |  |  |
| 42 | 생성 - GCP | Region 선택 | GCP Region 목록이 조회되는가 (기본: asia-northeast3 서울) |  |  |
| 43 | 생성 - GCP | NodeGroup 설정 | NodeGroup 폼에서 Image, Spec, Node Size를 설정할 수 있는가 |  |  |
| 44 | 생성 - GCP | 생성 확인 | Cluster + NodeGroup이 정상 생성되는가 |  |  |
| 45 | 생성 - IBM | Provider 선택 | Provider로 IBM을 선택할 수 있는가 |  |  |
| 46 | 생성 - IBM | Region 선택 | IBM Region 목록이 조회되는가 |  |  |
| 47 | 생성 - IBM | NodeGroup 설정 | NodeGroup 폼에서 Image, Spec, Node Size를 설정할 수 있는가 |  |  |
| 48 | 생성 - IBM | 생성 확인 | Cluster + NodeGroup이 정상 생성되는가 |  |  |
| 49 | 생성 - NHN | Provider 선택 | Provider로 NHN을 선택할 수 있는가 |  |  |
| 50 | 생성 - NHN | Region 선택 | NHN Region 목록이 조회되는가 |  |  |
| 51 | 생성 - NHN | NodeGroup 설정 | NodeGroup 폼에서 Image, Spec, Node Size를 설정할 수 있는가 |  |  |
| 52 | 생성 - NHN | 생성 확인 | Cluster + NodeGroup이 정상 생성되는가 |  |  |
| 53 | 생성 - 검증 및 API | 사전 검증 | Deploy 전 checkK8sClusterDynamic API가 호출되는가 |  |  |
| 54 | 생성 - 검증 및 API | 폼 초기화 | 생성 완료 후 폼이 초기화되는가 |  |  |
| 55 | 생성 - 검증 및 API | API 호출 | checkK8sClusterDynamic, createK8sClusterDynamic API가 호출되는가 |  |  |
| 56 | 생성 - 검증 및 API | 목록 갱신 | 생성 완료 후 PMK 목록이 갱신되는가 |  |  |
| 57 | 수정 | Refresh 버튼 | Refresh 버튼 클릭 시 PMK 목록이 갱신되는가 |  |  |
| 58 | 삭제 | Delete PMK 버튼 | PMK 선택 후 Delete 버튼이 활성화되는가 |  |  |
| 59 | 삭제 | PMK 삭제 | Delete 확인 후 PMK가 삭제되는가 |  |  |
| 60 | 삭제 | Delete NodeGroup 버튼 | NodeGroup 선택 후 Delete 버튼이 활성화되는가 |  |  |
| 61 | 삭제 | NodeGroup 삭제 | Delete 확인 후 NodeGroup이 삭제되는가 |  |  |
| 62 | 삭제 | API 호출 | pmkDelete, nodeGroupDelete API가 호출되는가 |  |  |
| 63 | 라이프사이클 | Start PMK | PMK Start 버튼이 동작하는가 |  |  |
| 64 | 라이프사이클 | Stop PMK | PMK Stop 버튼이 동작하는가 |  |  |
| 65 | 라이프사이클 | Terminate PMK | PMK Terminate 버튼이 동작하는가 |  |  |
| 66 | 라이프사이클 | 상태 변경 | 라이프사이클 실행 후 상태가 정상 업데이트되는가 |  |  |
| 67 | 라이프사이클 | API 호출 | pmkLifeCycle API가 호출되는가 |  |  |
| 68 | NodeGroup 관리 | 체크박스 선택 | NodeGroup 체크박스 선택이 동작하는가 |  |  |
| 69 | NodeGroup 관리 | 다중 선택 | NodeGroup 다중 선택이 동작하는가 |  |  |
| 70 | NodeGroup 관리 | 선택 강조 | 마지막 선택된 NodeGroup에 테두리가 표시되는가 |  |  |
| 71 | NodeGroup 관리 | Node 목록 | NodeGroup 내 Node 목록이 표시되는가 |  |  |
| 72 | Spec 추천 | Location 설정 | Seoul/London/New York 프리셋으로 좌표가 설정되는가 |  |  |
| 73 | Spec 추천 | 추천 조회 | Spec 추천 API가 정상 호출되는가 |  |  |
| 74 | Spec 추천 | Spec 테이블 | 추천된 Spec이 테이블에 표시되는가 |  |  |
| 75 | Spec 추천 | Provider 필터링 | Provider별 Spec 필터링이 동작하는가 |  |  |
| 76 | Spec 추천 | Spec 적용 | 선택한 Spec이 폼에 적용되는가 |  |  |
| 77 | Spec 추천 | 전역 변수 설정 | selectedPmkSpecInfo가 전역 변수에 저장되는가 |  |  |
| 78 | Spec 추천 | API 호출 | getRecommendVmInfoPmk API가 호출되는가 |  |  |
| 79 | Image 추천 | Image 모달 | Image 추천 모달이 정상 열리는가 |  |  |
| 80 | Image 추천 | Spec 정보 전달 | Spec 정보가 Image 모달에 전달되는가 |  |  |
| 81 | Image 추천 | Image 테이블 | 추천된 Image가 테이블에 표시되는가 |  |  |
| 82 | Image 추천 | Image 선택 | 선택한 Image가 폼에 적용되는가 |  |  |
| 83 | Image 추천 | 콜백 함수 | Image 선택 콜백이 정상 동작하는가 |  |  |
| 84 | 테이블 기능 | Provider 아이콘 | Provider 로고 이미지가 표시되는가 |  |  |
| 85 | 테이블 기능 | NodeGroup 수 | NodeGroup 개수가 표시되는가 |  |  |
| 86 | 테이블 기능 | 정렬 | 컬럼 클릭 시 정렬이 동작하는가 |  |  |
| 87 | 테이블 기능 | 페이징 | 페이지 네비게이션이 정상 동작하는가 |  |  |
| 88 | 에러 처리 | API 오류 | API 오류 발생 시 Toast 메시지가 표시되는가 |  |  |
| 89 | 에러 처리 | 검증 오류 | 필수 항목 누락 시 에러 메시지가 표시되는가 |  |  |

## 비고
- PMK(Platform Managed Kubernetes)는 Kubernetes 클러스터를 관리하는 워크로드입니다.
- Simple Creation과 Expert Creation 두 가지 생성 모드를 제공합니다.
- **Provider별 생성 방식 차이**:
  - **Type1 (AWS, Alibaba, 기타)**: Cluster 생성 후 NodeGroup을 별도로 추가하는 2단계 생성 방식
  - **Type2 (Azure, GCP, IBM, NHN)**: Cluster와 NodeGroup을 동시에 생성하는 1단계 생성 방식
- Type2 Provider는 생성 시 NodeGroup 구성 폼이 자동으로 표시됩니다.
- NodeGroup 폼 표시 여부는 Provider에 따라 자동으로 결정됩니다.
- Spec 및 Image 추천 기능을 통해 최적의 리소스를 선택할 수 있습니다.
- 사전 검증(checkK8sClusterDynamic)을 통해 생성 가능 여부를 확인합니다.
- 코드 분석 결과를 기반으로 자동 생성된 테스트 항목입니다.
- 실제 테스트 시 결과 열과 실패 사유 열을 채워주세요.

