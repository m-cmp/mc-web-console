# 014_Azure_VM_Creation_test

## 화면 정보

- 메뉴 ID: mciworkloads
- 화면 이름: MCI Workloads - Create MCI
- 파일 경로: front/assets/js/partials/operation/manage/mcicreate.js

## 테스트 목표

1. Azure VM 생성 테스트 - 성공하는 이미지 찾기
2. SubGroup 수정 기능 - Deploy 전 Spec/Image 재선택 가능 여부 확인

## 알려진 이슈 ⚠️

### 이슈 1: Image Recommendation 모달에서 Provider 필터링 미작동

**문제**: 
- Image Recommendation 모달의 Spec Information 필드 (Provider, Region, OS Architecture)가 비어있음
- Azure Spec을 선택했음에도 검색 시 **모든 Cloud Provider의 이미지가 조회됨** (AWS, Alibaba, NCP, Azure 모두 표시)
- 다른 Provider의 이미지를 선택하면 Deploy 시 "invalid format for image ID" 오류 발생

**영향**:
- 사용자가 수동으로 Azure 전용 이미지를 구분해서 선택해야 함
- 이미지 ID 형식으로 구분 필요:
  - ✅ **Azure**: `img-*` 형식 (예: img-487zeit5) - 선택 가능
  - ❌ **AWS**: `ami-*` 형식 - Azure에서 사용 불가
  - ❌ **Alibaba**: `*.vhd` 형식 - Azure에서 사용 불가
  - ❌ **NCP**: 숫자 형식 (예: 23214590) - Azure에서 사용 불가

**참조**: 
- Bug #005: `docs/development/bug/buglist.md` 참조
- 관련 파일: `front/assets/js/partials/operation/manage/imagerecommendation.js`

**우회 방법**:
- **BASIC 체크 마크** 확인: Azure 전용 이미지는 BASIC 체크가 있을 가능성이 높음
- **이미지 ID 형식** 확인: `img-*` 형식의 이미지만 선택
- **OS DISTRIBUTION** 확인: Azure Native 이미지 설명 확인

---

## 테스트 전제 조건

### 로그인 정보
- URL: http://localhost:3001
- ID: mcmp
- Password: mcmp_password

### Workspace & Project
- Workspace: ws01
- Project: default

## 테스트 시나리오

### 1. MCI 생성 및 SubGroup 추가

| 단계 | 작업 | 입력 값 | 결과 | 비고 |
|------|------|---------|------|------|
| 1 | 로그인 | ID: mcmp, PW: mcmp_password | | |
| 2 | Workspace 선택 | ws01 | | |
| 3 | Project 선택 | default | | |
| 4 | Add MCI 버튼 클릭 | | | |
| 5 | MCI Name 입력 | azumci | | |
| 6 | +SubGroup 버튼 클릭 | | | |
| 7 | Server Name 입력 | azuvm1 | | |
| 8 | Spec 검색 (돋보기) 클릭 | | | |
| 9 | Priority Option 선택 | Seoul | | |
| 10 | 검색 버튼 클릭 | | | |
| 11 | Cloud Provider Filter | Azure | | |
| 12 | Spec 선택 | 가격 0.013 | | |
| 13 | Apply 버튼 클릭 | | | |
| 14 | Image 검색 (돋보기) 클릭 | | | |
| 15 | Image Recommendation 검색 | | | 제외 이미지: ami-0eeab253db7e765a9, ami-02620a572e8f54e3c |
| 16 | Image 선택 | (선택한 이미지 기록) | | |
| 17 | Apply 버튼 클릭 | | | |
| 18 | Done 버튼 클릭 | | | VM 입력 폼 숨김, SubGroup 리스트에 추가됨 |

### 2. SubGroup 수정 기능 테스트 (핵심 기능)

| 단계 | 작업 | 결과 | 상태 |
|------|------|------|------|
| 1 | SubGroup 리스트의 "azuvm1(1)" 아이템 클릭 | VM 입력 폼이 다시 나타남 | ✅ 구현 완료 |
| 2 | 폼에 기존 데이터가 채워져 있는지 확인 | Server Name, Spec, Image 정보 표시됨 | ✅ 구현 완료 |
| 3 | Spec 돋보기 버튼으로 다른 Spec 선택 | Spec 재선택 가능 | ✅ 구현 완료 |
| 4 | Image 돋보기 버튼으로 다른 Image 선택 | Image 재선택 가능 | ✅ 구현 완료 |
| 5 | Done 버튼 클릭 | 기존 SubGroup 데이터 업데이트, 리스트 텍스트 업데이트 | ✅ 구현 완료 |
| 6 | +SubGroup 버튼 클릭 | 폼이 비어있는 상태로 열림 (신규 추가 모드) | ✅ 구현 완료 |

### 3. Azure VM 생성 테스트

| 시도 | Image ID | Image Name | Spec | Deploy 결과 | 오류 메시지 | 비고 |
|------|----------|------------|------|-------------|-------------|------|
| 1 | 23214590 | ubuntu-22.04-base (Hypervisor:KVM) | Standard_B2ts_v2, 0.013 | ❌ FAILURE | MCI cannot be created due to critical errors in VM configurations (Providers: [azure], Regions: [koreacentral]) | 첫 번째 시도 |
| 2 | img-487zeit5 | Ubuntu Server 22.04 LTS 64bit | Standard_B2ts_v2, 0.013 | ❌ FAILURE | (실패 alert 발생) | 두 번째 시도 (2025-11-08) |
| 3 | ubuntu_22_04_x64_20G_alibase_20250917.vhd | Ubuntu 22.04 64 bit | Standard_B2ts_v2, 0.013 | ⚠️ 미완료 | PostMciDynamicReview 응답 캐치 문제 | Deploy API 호출 안됨 (2025-11-08) |
| 4 | ami-0593272c889084af9 | ubuntu-pro-fips-updates-server | Standard_B2ts_v2, 0.013 | ❌ FAILURE | Image 'ami-0593272c889084af9' not available in CSP: invalid format for image ID (AWS 이미지 ID 형식) | 네 번째 시도 (2025-11-08) |
| 5 | ami-0224cf1060c316eca | ubuntu-pro-fips-updates-server (다른 버전) | Standard_B2ts_v2, 0.013 | ❌ FAILURE | PostMciDynamicReview 200 OK, overallStatus: Error (Toast 알림 정상 표시 확인) | 다섯 번째 시도 (2025-11-08) - 에러 처리 개선 테스트 성공 |
| 6 | ami-05bd437dbad994c42 | ubuntu-minimal (2025.10.17) | Standard_B2ts_v2, 0.013 | ❌ FAILURE | Image not available: invalid format for image ID (AWS 이미지 ID) - Toast 정상 표시 | 여섯 번째 시도 (2025-11-08) |
| 7 | ubuntu_22_04_x64_20G_alibase_20250917.vhd | Ubuntu 22.04 64 bit (Alibaba Cloud) | Standard_B2ts_v2, 0.013 | ❌ FAILURE | PostMciDynamicReview Error (Alibaba Cloud image) - Toast 표시됨 | 일곱 번째 시도 (2025-11-08) |

## 테스트 결과

### SubGroup 수정 기능

- **구현 상태**: ✅ 완료
- **구현 일자**: 2025-11-08
- **구현 파일**: `front/assets/js/partials/operation/manage/mcicreate.js`

**구현 내용**:
1. `view_express(cnt)` 함수: SubGroup 클릭 시 폼에 데이터 채우기
2. `expressDone_btn()` 함수: 신규/수정 모드 구분 로직
3. `displayNewServerForm()` 함수: +SubGroup 버튼 클릭 시 신규 모드 설정
4. `currentEditingIndex` 전역 변수: 수정 모드 추적

**동작 방식**:
- **신규 모드** (currentEditingIndex = -1): 배열에 추가 + 리스트에 새 아이템 추가
- **수정 모드** (currentEditingIndex >= 0): 배열 업데이트 + 리스트 아이템 텍스트만 업데이트

**지원 기능**:
- ✅ Deploy 전 SubGroup 수정 가능
- ✅ Spec 재선택 가능
- ✅ Image 재선택 가능
- ✅ 모든 설정 항목 수정 가능
- ✅ 모든 클라우드 (Azure, AWS, GCP 등) 지원

### Azure VM 생성 테스트

**성공한 이미지 목록**:
| Image ID | Image Name | CSP | Region | 비고 |
|----------|------------|-----|--------|------|
| | | Azure | Seoul | 테스트 후 기록 |

**실패한 이미지 목록**:
| Image ID | Image Name | CSP | Region | 오류 메시지 | 비고 |
|----------|------------|-----|--------|-------------|------|
| ami-0eeab253db7e765a9 | | | | | 사전 제외 |
| ami-02620a572e8f54e3c | | | | | 사전 제외 |
| 23214590 | ubuntu-22.04-base (Hypervisor:KVM) | Azure | koreacentral | MCI cannot be created due to critical errors in VM configurations | 시도 1 실패 (2025-11-08) |
| img-487zeit5 | Ubuntu Server 22.04 LTS 64bit | Azure | koreacentral | (실패 alert 발생) | 시도 2 실패 (2025-11-08) |
| ami-0593272c889084af9 | ubuntu-pro-fips-updates-server | Azure | koreacentral | invalid format for image ID (AWS 이미지 ID 형식) | 시도 4 실패 (2025-11-08) |
| ami-0224cf1060c316eca | ubuntu-pro-fips-updates-server (다른 버전) | Azure | koreacentral | PostMciDynamicReview 200 OK, overallStatus: Error | 시도 5 실패 (2025-11-08) |
| ami-05bd437dbad994c42 | ubuntu-minimal (2025.10.17) | Azure | koreacentral | invalid format for image ID (AWS 이미지 ID) | 시도 6 실패 (2025-11-08) |
| ubuntu_22_04_x64_20G_alibase_20250917.vhd | Ubuntu 22.04 64 bit | Azure | koreacentral | PostMciDynamicReview Error (Alibaba Cloud image) | 시도 7 실패 (2025-11-08) |

## 사용 방법

### SubGroup 수정 방법

1. MCI 생성 화면에서 +SubGroup 버튼으로 VM을 추가
2. Done 버튼으로 SubGroup 리스트에 추가
3. **리스트의 SubGroup 아이템을 클릭**하면 수정 모드로 전환됨
4. Spec, Image 등을 재선택한 후 Done 버튼 클릭
5. Deploy 버튼으로 MCI 배포

### 실패 시 이미지 재선택 방법 (Spec 재사용)

#### 방법 1: 기존 SubGroup 수정
1. Deploy 실패 alert 확인
2. **리스트의 SubGroup (예: azuvm1(1)) 클릭** ← 구현된 기능 활용!
3. Image 돋보기 버튼 클릭
4. Image Recommendation에서 검색 버튼 클릭
5. **실패한 이미지를 제외한 다른 이미지 선택**:
   - 첫 번째 이미지(ami-0eeab253db7e765a9) 제외
   - 두 번째 이미지(23214590) 제외 - 시도 1 실패
   - **세 번째 이미지(img-487zeit5) 선택** ← 시도 2
6. Apply 버튼 클릭
7. Done 버튼 클릭 (SubGroup 업데이트됨)
8. Deploy 버튼으로 재시도

#### 방법 2: 새로운 SubGroup 추가
1. +SubGroup 버튼 클릭
2. Server Name 입력 (예: azuvm2)
3. **Spec 재선택** (Seoul, Azure, 0.013 동일)
4. **다른 Image 선택**
5. Done → Deploy

### 연속 이미지 테스트 가이드

**Spec 고정**: Standard_B2ts_v2 (Azure, koreacentral, 0.013)

**테스트할 이미지 순서** (Image Recommendation 검색 결과 순서):
1. ~~ami-0eeab253db7e765a9~~ (사전 제외)
2. ~~23214590 (ubuntu-22.04-base)~~ ✅ 시도 1 완료 - **실패**
3. **img-487zeit5** (Ubuntu Server 22.04 LTS 64bit) ← 다음 시도
4. ubuntu_22_04_x64_20G_alibase_20250917.vhd (Ubuntu 22.04 64 bit)
5. ami-0593272c889084af9 (ubuntu-pro-fips-updates-server)
6. ... (계속)

**각 시도마다**:
- Deploy 후 성공/실패 확인
- 실패 시: 이 문서의 표에 결과 기록 후 다음 이미지로 진행
- 성공 시: 이미지 ID를 "성공한 이미지 목록"에 추가

## 빠른 테스트 가이드 (수동)

### 🚀 현재 진행 상황
- ✅ 시도 1: `23214590` (ubuntu-22.04-base) - **실패**
- ⏳ 시도 2: `img-487zeit5` (Ubuntu Server 22.04 LTS 64bit) - **다음 시도**

### 📋 체크리스트
1. [ ] http://localhost:3001 접속
2. [ ] Workspace: ws01, Project: default 선택
3. [ ] Add MCI 버튼 → MCI Name: azumci
4. [ ] +SubGroup 또는 기존 SubGroup 클릭
5. [ ] Server Name: azuvm2 입력
6. [ ] Spec 선택: Seoul, Azure, 0.013 (Standard_B2ts_v2)
7. [ ] **Image 선택: img-487zeit5** ← 현재 시도
8. [ ] Done → Deploy
9. [ ] 결과 확인 후 이 문서 업데이트

### 🔁 실패 시 다음 이미지
3. ubuntu_22_04_x64_20G_alibase_20250917.vhd
4. ami-0593272c889084af9
5. ... (Image Recommendation에서 계속)

## 비고

- SubGroup 수정 기능은 2025-11-08에 구현 완료
- Azure VM 생성 테스트는 실제 환경에서 수행 필요
- 성공/실패 이미지 정보는 테스트 후 이 문서에 업데이트
- Image ID가 "ami-"로 시작하는 것은 AWS 이미지이므로 Azure 테스트에서는 제외
- **테스트 자동화 스크립트**: `docs/manual-testing/azure_vm_test_automation.js` (브라우저 콘솔에서 실행 가능)

