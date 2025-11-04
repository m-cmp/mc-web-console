# 002_MCI_Workloads_test

## 화면 정보
- 메뉴 ID: mciworkloads
- 화면 이름: MCI Workloads
- 파일 경로: front/assets/js/pages/operation/manage/mci.js

## 테스트 전제 조건

### Workspace 및 Project 선택
1. 화면 진입 시 workspace와 project가 선택되어 있지 않으면 경고 창이 표시됨
2. 경고 창에서 **Confirm** 버튼을 클릭하여 닫기
3. 화면 상단에서 **Workspace** 선택
   - 기본 선택: **ws01** (별다른 조건이 없는 경우)
4. Workspace 선택 후 **Project** 목록이 자동으로 로드됨
5. **Project** 선택
   - 기본 선택: **default** (별다른 조건이 없는 경우)

### VM 생성 테스트 전제 조건 (생성 테스트 시)
1. 테스트할 CSP별로 다음 사항이 사전 준비되어야 함:
   - Connection 설정 완료
   - Region: 서울 리전 (AWS: ap-northeast-2, Azure: koreacentral, GCP: asia-northeast3)
   - OS: Ubuntu 계열
   - VM Spec: 해당 CSP에서 정상 동작 확인된 Spec
   - VM Image: 해당 CSP에서 정상 동작 확인된 Image
2. VM 생성 실패 시 Connection, Region, Spec, Image 조합을 재확인

### 테스트 시작
- Workspace와 Project 선택 완료 후 아래 테스트 항목을 순차적으로 수행

## 테스트 항목

| 번호 | 카테고리 | 기능 | 테스트 항목 | 결과 | 실패 사유 |
|------|---------|------|------------|------|----------|
| 1 | 초기화 | 화면 로드 | 페이지 진입 시 MCI 목록이 정상 표시되는가 |  |  |
| 2 | 초기화 | 프로젝트 선택 | 상단 프로젝트 선택 드롭다운이 동작하는가 |  |  |
| 3 | 초기화 | URL 파라미터 | URL에서 mciID 파라미터로 특정 MCI를 선택할 수 있는가 |  |  |
| 4 | 조회 | 목록 조회 | MCI 목록 테이블이 정상 표시되는가 |  |  |
| 5 | 조회 | 상태 정보 | 상단 대시보드에 MCI/VM 상태 통계가 표시되는가 |  |  |
| 6 | 조회 | 행 선택 | MCI 선택 시 상세 정보 영역이 활성화되는가 |  |  |
| 7 | 조회 | MCI 상세 | 선택한 MCI의 Name, Description, Status, Provider가 표시되는가 |  |  |
| 8 | 조회 | VM 목록 | 선택한 MCI의 VM 목록이 아이콘으로 표시되는가 |  |  |
| 9 | 조회 | VM 상세 | VM 선택 시 Server Info 패널이 열리는가 |  |  |
| 10 | 조회 | VM 정보 탭 | VM의 IP, Region, Connection, Spec 정보가 표시되는가 |  |  |
| 11 | 조회 | Detail 탭 | VM의 상세 정보(Image, VPC, Subnet, Security Group)가 표시되는가 |  |  |
| 12 | 조회 | Connection 탭 | VM의 Connection 설정 정보가 표시되는가 |  |  |
| 13 | 조회 | Monitoring 탭 | VM의 모니터링 데이터가 표시되는가 |  |  |
| 14 | 조회 | Agent 설치 | Monitoring Agent 설치 버튼/기능이 동작하는가 |  |  |
| 15 | 조회 | Agent 설치 API | InstallMonitoringAgent API가 호출되는가 |  |  |
| 16 | 조회 | Agent 상태 조회 | getTargetsNsMci API로 Agent 상태를 조회하는가 |  |  |
| 17 | 조회 | Agent 제거 | UninstallMonitoringAgent API로 Agent를 제거할 수 있는가 |  |  |
| 18 | 생성 - 기본 | Add 버튼 | 'Add Mci' 버튼이 정상 표시되는가 |  |  |
| 19 | 생성 - 기본 | MCI 생성 화면 | Add 버튼 클릭 시 MCI 생성 화면으로 이동하는가 |  |  |
| 20 | 생성 - 기본 | 부분 추가 | MCI Create partial이 정상 초기화되는가 |  |  |
| 21 | 생성 - 기본 | API 호출 | MCI 생성 시 관련 API가 호출되는가 |  |  |
| 22 | 생성 - AWS | Provider 선택 | Provider로 AWS를 선택할 수 있는가 |  |  |
| 23 | 생성 - AWS | Region 조회 | AWS Region 목록이 조회되는가 (기본: ap-northeast-2 서울) |  |  |
| 24 | 생성 - AWS | OS 선택 | Ubuntu 계열 OS를 선택할 수 있는가 |  |  |
| 25 | 생성 - AWS | Spec 선택 | 정상 동작 확인된 AWS VM Spec을 선택할 수 있는가 |  |  |
| 26 | 생성 - AWS | Image 선택 | 정상 동작 확인된 AWS VM Image를 선택할 수 있는가 |  |  |
| 27 | 생성 - Azure | Provider 선택 | Provider로 Azure를 선택할 수 있는가 |  |  |
| 28 | 생성 - Azure | Region 조회 | Azure Region 목록이 조회되는가 (기본: koreacentral 서울) |  |  |
| 29 | 생성 - Azure | OS 선택 | Ubuntu 계열 OS를 선택할 수 있는가 |  |  |
| 30 | 생성 - Azure | Spec 선택 | 정상 동작 확인된 Azure VM Spec을 선택할 수 있는가 |  |  |
| 31 | 생성 - Azure | Image 선택 | 정상 동작 확인된 Azure VM Image를 선택할 수 있는가 |  |  |
| 32 | 생성 - GCP | Provider 선택 | Provider로 GCP를 선택할 수 있는가 |  |  |
| 33 | 생성 - GCP | Region 조회 | GCP Region 목록이 조회되는가 (기본: asia-northeast3 서울) |  |  |
| 34 | 생성 - GCP | OS 선택 | Ubuntu 계열 OS를 선택할 수 있는가 |  |  |
| 35 | 생성 - GCP | Spec 선택 | 정상 동작 확인된 GCP VM Spec을 선택할 수 있는가 |  |  |
| 36 | 생성 - GCP | Image 선택 | 정상 동작 확인된 GCP VM Image를 선택할 수 있는가 |  |  |
| 37 | 생성 - 기타 CSP | Provider 선택 | Alibaba, NCP 등 기타 CSP를 선택할 수 있는가 |  |  |
| 38 | 생성 - 기타 CSP | VM 생성 | 각 CSP별로 VM이 정상 생성되는가 |  |  |
| 39 | 수정 | Refresh 버튼 | Refresh 버튼 클릭 시 MCI 목록이 갱신되는가 |  |  |
| 40 | 수정 | 자동 갱신 | MCI 선택 시 해당 MCI 정보가 자동 갱신되는가 |  |  |
| 41 | 삭제 | Delete MCI 버튼 | MCI 선택 후 Delete 버튼이 활성화되는가 |  |  |
| 42 | 삭제 | MCI 삭제 | Delete 확인 후 MCI가 삭제되는가 |  |  |
| 43 | 삭제 | Delete VM 버튼 | VM 선택 후 Delete 버튼이 활성화되는가 |  |  |
| 44 | 삭제 | VM 삭제 | Delete 확인 후 VM이 삭제되는가 |  |  |
| 45 | 삭제 | API 호출 | mciDelete, vmDelete API가 호출되는가 |  |  |
| 46 | 라이프사이클 | Start MCI | MCI Start 버튼이 동작하는가 |  |  |
| 47 | 라이프사이클 | Stop MCI | MCI Stop 버튼이 동작하는가 |  |  |
| 48 | 라이프사이클 | Reboot MCI | MCI Reboot 버튼이 동작하는가 |  |  |
| 49 | 라이프사이클 | Terminate MCI | MCI Terminate 버튼이 동작하는가 |  |  |
| 50 | 라이프사이클 | Start VM | VM Start 버튼이 동작하는가 |  |  |
| 51 | 라이프사이클 | Stop VM | VM Stop 버튼이 동작하는가 |  |  |
| 52 | 라이프사이클 | Reboot VM | VM Reboot 버튼이 동작하는가 |  |  |
| 53 | 라이프사이클 | Terminate VM | VM Terminate 버튼이 동작하는가 |  |  |
| 54 | 라이프사이클 | 상태 변경 | 라이프사이클 실행 후 상태가 정상 업데이트되는가 |  |  |
| 55 | 라이프사이클 | API 호출 | mciLifeCycle, vmLifeCycle API가 호출되는가 |  |  |
| 56 | SubGroup 관리 | SubGroup 목록 | SubGroup 탭에서 그룹별 VM이 표시되는가 |  |  |
| 57 | SubGroup 관리 | SubGroup 선택 | SubGroup 선택 시 해당 그룹의 VM 목록이 표시되는가 |  |  |
| 58 | SubGroup 관리 | VM 상세 | SubGroup 내 VM 선택 시 상세 정보가 표시되는가 |  |  |
| 59 | SubGroup 관리 | Scale Out | SubGroup 선택 후 Scale 버튼이 활성화되는가 |  |  |
| 60 | SubGroup 관리 | Scale 설정 | Scale 폼에서 VM 수를 증가시킬 수 있는가 |  |  |
| 61 | SubGroup 관리 | Scale 검증 | 현재 VM 수보다 작은 값 입력 시 에러 메시지가 표시되는가 |  |  |
| 62 | SubGroup 관리 | Scale 실행 | Apply 버튼 클릭 시 Scale Out이 실행되는가 |  |  |
| 63 | SubGroup 관리 | Scale 결과 | Scale Out 후 VM 목록이 갱신되는가 |  |  |
| 64 | SubGroup 관리 | API 호출 | postScaleOutSubGroup API가 호출되는가 |  |  |
| 65 | Policy 관리 | Policy 탭 | Policy 탭 전환이 정상 동작하는가 |  |  |
| 66 | Policy 관리 | Policy 목록 | 생성된 Policy 목록이 표시되는가 |  |  |
| 67 | Policy 관리 | Policy 상세 | Policy 선택 시 상세 정보가 표시되는가 |  |  |
| 68 | Policy 관리 | Policy 정보 | MCI, SubGroup, Condition, Action 정보가 표시되는가 |  |  |
| 69 | Policy 관리 | Policy 삭제 | Policy 삭제 기능이 동작하는가 |  |  |
| 70 | Policy 관리 | API 호출 | getPolicyList, deletePolicy API가 호출되는가 |  |  |
| 71 | 체크박스 선택 | 단일 선택 | VM 체크박스 단일 선택이 동작하는가 |  |  |
| 72 | 체크박스 선택 | 다중 선택 | VM 체크박스 다중 선택이 동작하는가 |  |  |
| 73 | 체크박스 선택 | 선택 강조 | 마지막 선택된 VM에 테두리가 표시되는가 |  |  |
| 74 | 체크박스 선택 | 선택 해제 | 체크박스 해제 시 정보 패널이 닫히는가 |  |  |
| 75 | 원격 명령 | SSH 키 조회 | SSH Key ID 클릭 시 Private Key가 표시되는가 |  |  |
| 76 | 원격 명령 | 명령 전송 모달 | Terminal 버튼 클릭 시 명령 전송 모달이 열리는가 |  |  |
| 77 | 원격 명령 | xterm UI 표시 | xterm UI가 정상 초기화되는가 (명령 입력 및 결과 표시용) |  |  |
| 78 | 원격 명령 | 명령 전송 API | postcmdmci API를 통해 VM에 명령이 전송되는가 |  |  |
| 79 | 테이블 기능 | 상태 아이콘 | MCI 상태가 색상 카드로 표시되는가 |  |  |
| 80 | 테이블 기능 | Provider 아이콘 | Provider 로고 이미지가 표시되는가 |  |  |
| 81 | 테이블 기능 | VM 카운트 | Total/Running/Suspended/Terminated/Failed VM 수가 표시되는가 |  |  |
| 82 | 테이블 기능 | 정렬 | 컬럼 클릭 시 정렬이 동작하는가 |  |  |
| 83 | 테이블 기능 | 페이징 | 페이지 네비게이션이 정상 동작하는가 |  |  |
| 84 | 테이블 기능 | 필터링 | Provider 필터링이 동작하는가 |  |  |
| 85 | 에러 처리 | API 오류 | API 오류 발생 시 Toast 메시지가 표시되는가 |  |  |
| 86 | 에러 처리 | 검증 오류 | VM 미선택 시 에러 메시지가 표시되는가 |  |  |

## 비고
- MCI(Multi-Cloud Infrastructure)는 여러 클라우드의 VM을 통합 관리하는 워크로드입니다.
- SubGroup 단위로 VM을 그룹화하여 관리할 수 있습니다.
- Auto Scaling Policy를 설정하여 자동으로 리소스를 관리할 수 있습니다.
- VM 체크박스를 통해 다중 선택 및 일괄 라이프사이클 관리가 가능합니다.
- CSP별 VM 생성 시 Connection, Region, Spec, Image는 사전에 정상 동작하는 것으로 확인된 것을 사용해야 합니다.
- VM 생성 실패 시 CSP/Region/Spec/Image 조합을 검토해야 합니다.
- Monitoring Agent는 VM 생성 후 별도로 설치할 수 있으며, Agent 상태 조회 및 제거가 가능합니다.
- 원격 명령 전송은 xterm이 아닌 자체 API(postcmdmci)를 통해 이루어집니다.
- xterm은 명령 입력 및 결과 표시를 위한 UI로만 사용됩니다.
- 코드 분석 결과를 기반으로 자동 생성된 테스트 항목입니다.
- 실제 테스트 시 결과 열과 실패 사유 열을 채워주세요.

