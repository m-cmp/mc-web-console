# 002_MCI_Workloads_test

## 화면 정보
- 메뉴 ID: mciworkloads
- 화면 이름: MCI Workloads
- 파일 경로: front/assets/js/pages/operation/manage/mci.js

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
| 14 | 생성 | Add 버튼 | 'Add Mci' 버튼이 정상 표시되는가 |  |  |
| 15 | 생성 | MCI 생성 화면 | Add 버튼 클릭 시 MCI 생성 화면으로 이동하는가 |  |  |
| 16 | 생성 | 부분 추가 | MCI Create partial이 정상 초기화되는가 |  |  |
| 17 | 생성 | API 호출 | MCI 생성 시 관련 API가 호출되는가 |  |  |
| 18 | 수정 | Refresh 버튼 | Refresh 버튼 클릭 시 MCI 목록이 갱신되는가 |  |  |
| 19 | 수정 | 자동 갱신 | MCI 선택 시 해당 MCI 정보가 자동 갱신되는가 |  |  |
| 20 | 삭제 | Delete MCI 버튼 | MCI 선택 후 Delete 버튼이 활성화되는가 |  |  |
| 21 | 삭제 | MCI 삭제 | Delete 확인 후 MCI가 삭제되는가 |  |  |
| 22 | 삭제 | Delete VM 버튼 | VM 선택 후 Delete 버튼이 활성화되는가 |  |  |
| 23 | 삭제 | VM 삭제 | Delete 확인 후 VM이 삭제되는가 |  |  |
| 24 | 삭제 | API 호출 | mciDelete, vmDelete API가 호출되는가 |  |  |
| 25 | 라이프사이클 | Start MCI | MCI Start 버튼이 동작하는가 |  |  |
| 26 | 라이프사이클 | Stop MCI | MCI Stop 버튼이 동작하는가 |  |  |
| 27 | 라이프사이클 | Reboot MCI | MCI Reboot 버튼이 동작하는가 |  |  |
| 28 | 라이프사이클 | Terminate MCI | MCI Terminate 버튼이 동작하는가 |  |  |
| 29 | 라이프사이클 | Start VM | VM Start 버튼이 동작하는가 |  |  |
| 30 | 라이프사이클 | Stop VM | VM Stop 버튼이 동작하는가 |  |  |
| 31 | 라이프사이클 | Reboot VM | VM Reboot 버튼이 동작하는가 |  |  |
| 32 | 라이프사이클 | Terminate VM | VM Terminate 버튼이 동작하는가 |  |  |
| 33 | 라이프사이클 | 상태 변경 | 라이프사이클 실행 후 상태가 정상 업데이트되는가 |  |  |
| 34 | 라이프사이클 | API 호출 | mciLifeCycle, vmLifeCycle API가 호출되는가 |  |  |
| 35 | SubGroup 관리 | SubGroup 목록 | SubGroup 탭에서 그룹별 VM이 표시되는가 |  |  |
| 36 | SubGroup 관리 | SubGroup 선택 | SubGroup 선택 시 해당 그룹의 VM 목록이 표시되는가 |  |  |
| 37 | SubGroup 관리 | VM 상세 | SubGroup 내 VM 선택 시 상세 정보가 표시되는가 |  |  |
| 38 | SubGroup 관리 | Scale Out | SubGroup 선택 후 Scale 버튼이 활성화되는가 |  |  |
| 39 | SubGroup 관리 | Scale 설정 | Scale 폼에서 VM 수를 증가시킬 수 있는가 |  |  |
| 40 | SubGroup 관리 | Scale 검증 | 현재 VM 수보다 작은 값 입력 시 에러 메시지가 표시되는가 |  |  |
| 41 | SubGroup 관리 | Scale 실행 | Apply 버튼 클릭 시 Scale Out이 실행되는가 |  |  |
| 42 | SubGroup 관리 | Scale 결과 | Scale Out 후 VM 목록이 갱신되는가 |  |  |
| 43 | SubGroup 관리 | API 호출 | postScaleOutSubGroup API가 호출되는가 |  |  |
| 44 | Policy 관리 | Policy 탭 | Policy 탭 전환이 정상 동작하는가 |  |  |
| 45 | Policy 관리 | Policy 목록 | 생성된 Policy 목록이 표시되는가 |  |  |
| 46 | Policy 관리 | Policy 상세 | Policy 선택 시 상세 정보가 표시되는가 |  |  |
| 47 | Policy 관리 | Policy 정보 | MCI, SubGroup, Condition, Action 정보가 표시되는가 |  |  |
| 48 | Policy 관리 | Policy 삭제 | Policy 삭제 기능이 동작하는가 |  |  |
| 49 | Policy 관리 | API 호출 | getPolicyList, deletePolicy API가 호출되는가 |  |  |
| 50 | 체크박스 선택 | 단일 선택 | VM 체크박스 단일 선택이 동작하는가 |  |  |
| 51 | 체크박스 선택 | 다중 선택 | VM 체크박스 다중 선택이 동작하는가 |  |  |
| 52 | 체크박스 선택 | 선택 강조 | 마지막 선택된 VM에 테두리가 표시되는가 |  |  |
| 53 | 체크박스 선택 | 선택 해제 | 체크박스 해제 시 정보 패널이 닫히는가 |  |  |
| 54 | 원격 접속 | SSH 키 조회 | SSH Key ID 클릭 시 Private Key가 표시되는가 |  |  |
| 55 | 원격 접속 | Terminal 모달 | Terminal 버튼 클릭 시 원격 터미널 모달이 열리는가 |  |  |
| 56 | 원격 접속 | Terminal 연결 | xterm 터미널이 정상 초기화되는가 |  |  |
| 57 | 원격 접속 | API 호출 | getsshkey, initTerminal API가 호출되는가 |  |  |
| 58 | 테이블 기능 | 상태 아이콘 | MCI 상태가 색상 카드로 표시되는가 |  |  |
| 59 | 테이블 기능 | Provider 아이콘 | Provider 로고 이미지가 표시되는가 |  |  |
| 60 | 테이블 기능 | VM 카운트 | Total/Running/Suspended/Terminated/Failed VM 수가 표시되는가 |  |  |
| 61 | 테이블 기능 | 정렬 | 컬럼 클릭 시 정렬이 동작하는가 |  |  |
| 62 | 테이블 기능 | 페이징 | 페이지 네비게이션이 정상 동작하는가 |  |  |
| 63 | 테이블 기능 | 필터링 | Provider 필터링이 동작하는가 |  |  |
| 64 | 에러 처리 | API 오류 | API 오류 발생 시 Toast 메시지가 표시되는가 |  |  |
| 65 | 에러 처리 | 검증 오류 | VM 미선택 시 에러 메시지가 표시되는가 |  |  |

## 비고
- MCI(Multi-Cloud Infrastructure)는 여러 클라우드의 VM을 통합 관리하는 워크로드입니다.
- SubGroup 단위로 VM을 그룹화하여 관리할 수 있습니다.
- Auto Scaling Policy를 설정하여 자동으로 리소스를 관리할 수 있습니다.
- VM 체크박스를 통해 다중 선택 및 일괄 라이프사이클 관리가 가능합니다.
- xterm을 통한 원격 터미널 접속 기능을 제공합니다.
- 코드 분석 결과를 기반으로 자동 생성된 테스트 항목입니다.
- 실제 테스트 시 결과 열과 실패 사유 열을 채워주세요.

