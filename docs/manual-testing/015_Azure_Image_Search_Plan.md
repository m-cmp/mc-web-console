# Azure Image Search Test Plan
## Azure에서 사용 가능한 이미지 찾기 테스트 계획

### 작성일
2025-11-08

### 테스트 목표
1. **Price < 1인 Azure Spec에서 사용 가능한 이미지 찾기**
2. **실제 Deploy가 성공하는 Spec + Image 조합 발견**
3. **테스트 결과를 문서화하여 향후 참고 자료로 활용**

---

## Phase 1: Spec 목록 수집 (Agent Mode)

### 1.1 목표
- Azure, koreacentral region, price < 1 인 모든 spec 목록 확인
- 가격순으로 정렬하여 우선순위 결정

### 1.2 실행 단계
1. MCI Create 화면 접속
2. +SubGroup → Spec 검색 모달 열기
3. Priority Option: Seoul 선택
4. 검색 버튼 클릭
5. Cloud Provider Filter: Azure 선택
6. 브라우저 콘솔에서 Spec 목록 추출

```javascript
// 브라우저 콘솔에서 실행
const specs = window.recommendSpecTable.getData()
  .filter(row => row.providerName === 'azure' && parseFloat(row.pricePerHour) < 1)
  .map(row => ({
    id: row.id,
    name: row.name,
    price: parseFloat(row.pricePerHour),
    memory: row.memGiB,
    vcpu: row.numVCPU,
    region: row.regionName,
    connectionName: row.connectionName,
    osArchitecture: row.osArchitecture || 'x86_64'
  }))
  .sort((a, b) => a.price - b.price);

console.table(specs);
console.log(JSON.stringify(specs, null, 2));
```

### 1.3 예상 결과
- 약 50-100개의 Azure spec 목록
- 가격 범위: $0.005 ~ $0.999
- 주요 Spec Family: B-series (Burstable), D-series, etc.

---

## Phase 2: Image 검색 스크립트 실행 (Browser Console)

### 2.1 목표
- 각 Spec에 대해 사용 가능한 이미지 개수 확인
- API 직접 호출로 빠른 테스트

### 2.2 자동화 스크립트

```javascript
// 브라우저 콘솔에서 실행
async function testAzureImages() {
  // Phase 1에서 얻은 spec 목록 (상위 20개만 테스트)
  const specsToTest = [
    // 여기에 Phase 1 결과를 붙여넣기
  ];
  
  const results = [];
  
  for (const spec of specsToTest) {
    console.log(`\n🔍 Testing ${spec.name} ($${spec.price})...`);
    
    try {
      const response = await fetch('/api/mc-infra-manager/Searchimage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pathParams: { nsId: 'system' },
          request: {
            providerName: 'azure',
            regionName: 'koreacentral',
            osArchitecture: spec.osArchitecture || 'x86_64',
            includeDeprecatedImage: false,
            isGPUImage: false,
            isKubernetesImage: false
          }
        })
      });
      
      const data = await response.json();
      
      if (data.status.code === 200) {
        const imageList = data.responseData?.imageList || [];
        const imageCount = imageList.length;
        
        // Azure 이미지만 필터링 (img-* 형식)
        const azureImages = imageList.filter(img => 
          img.id && (img.id.startsWith('img-') || img.cspImageName?.startsWith('img-'))
        );
        
        const result = {
          spec: spec.name,
          price: spec.price,
          totalImages: imageCount,
          azureImages: azureImages.length,
          hasAzureImages: azureImages.length > 0,
          firstAzureImage: azureImages[0]?.id || azureImages[0]?.cspImageName || null,
          firstImageName: azureImages[0]?.name || null
        };
        
        results.push(result);
        
        if (azureImages.length > 0) {
          console.log(`  ✅ ${azureImages.length} Azure images found`);
          console.log(`     First: ${result.firstAzureImage} - ${result.firstImageName}`);
        } else if (imageCount > 0) {
          console.log(`  ⚠️  ${imageCount} total images but no Azure (img-*) format`);
        } else {
          console.log(`  ❌ No images found`);
        }
        
      } else {
        console.log(`  ❌ API Error: ${data.status.code}`);
        results.push({
          spec: spec.name,
          price: spec.price,
          error: data.status.message
        });
      }
      
      // API 부하 방지 대기
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      console.error(`  ❌ Exception:`, error.message);
      results.push({
        spec: spec.name,
        price: spec.price,
        error: error.message
      });
    }
  }
  
  console.log('\n\n📊 === Test Results Summary ===');
  console.table(results);
  
  const specsWithImages = results.filter(r => r.hasAzureImages);
  console.log(`\n✅ Specs with Azure images: ${specsWithImages.length}/${results.length}`);
  console.log('\n🎯 Recommended specs for testing:');
  console.table(specsWithImages);
  
  console.log('\n📋 Copy this for Phase 3:');
  console.log(JSON.stringify(specsWithImages, null, 2));
  
  return results;
}

// 실행
await testAzureImages();
```

### 2.3 예상 결과
- Spec 중 일부는 이미지가 없을 수 있음
- 이미지가 있는 Spec 목록 확보
- 각 Spec의 첫 번째 Azure 이미지 ID 수집

---

## Phase 3: 실제 Deploy 테스트 (Agent Mode - 선택적)

### 3.1 목표
- Phase 2에서 이미지가 발견된 Spec 중 상위 3-5개만 실제 Deploy 테스트
- PostMciDynamicReview까지 실행하여 성공 여부 확인

### 3.2 우선순위 기준
1. **가격이 가장 저렴한 Spec** (비용 효율성)
2. **이미지 개수가 많은 Spec** (선택지가 많음)
3. **일반적인 Spec** (B-series, D-series 등)

### 3.3 테스트 절차 (각 Spec마다)
1. MCI Create 화면
2. MCI Name: `test-azure-{spec명}`
3. +SubGroup
4. Server Name: `vm-{spec명}`
5. Spec 선택: Phase 2에서 확인한 Spec
6. Image 선택: Phase 2에서 확인한 첫 번째 Azure 이미지
7. Done
8. **Deploy 버튼 클릭** (실제 배포 아님, Review까지만)
9. PostMciDynamicReview 응답 확인:
   - `overallStatus: "Ready"` → ✅ 성공
   - `overallStatus: "Warning"` → ⚠️ 경고
   - `overallStatus: "Error"` → ❌ 실패

### 3.4 결과 기록
각 테스트마다 다음 정보 기록:

| Spec | Price | Image ID | Image Name | Review Status | Error Message | 비고 |
|------|-------|----------|------------|---------------|---------------|------|
| (테스트 후 기록) | | | | | | |

---

## Phase 4: 결과 문서화

### 4.1 성공한 조합 문서화
`docs/manual-testing/014_Azure_VM_Creation_test.md` 파일 업데이트

### 4.2 권장 사항 작성
- 가장 안정적인 Spec + Image 조합
- 가격대별 추천 조합
- 알려진 이슈 및 주의사항

---

## 실행 순서 요약

### Step 1: Spec 목록 수집 (5분)
- **Mode**: Agent mode 또는 수동
- **도구**: Browser + Console
- **출력**: spec 목록 JSON

### Step 2: Image 검색 스크립트 (10-20분)
- **Mode**: Browser Console
- **도구**: JavaScript 스크립트
- **출력**: 이미지가 있는 spec 목록

### Step 3: Deploy 테스트 (10-30분)
- **Mode**: Agent mode (선택적, 3-5개만)
- **도구**: Browser automation
- **출력**: 성공/실패 기록

### Step 4: 문서 업데이트 (5분)
- **Mode**: Agent mode
- **도구**: File edit
- **출력**: 업데이트된 테스트 문서

---

## 체크리스트

- [ ] Phase 1: Spec 목록 수집 완료
- [ ] Spec 목록을 JSON으로 저장
- [ ] Phase 2: Image 검색 스크립트 실행
- [ ] 이미지가 있는 Spec 목록 확보
- [ ] Phase 3: 상위 3-5개 Spec으로 Deploy 테스트 (선택적)
- [ ] 성공한 조합 최소 1개 이상 발견
- [ ] Phase 4: 문서 업데이트
- [ ] 다른 팀원에게 결과 공유

---

## 테스트 결과

### Phase 1 결과: Spec 목록 ✅

**수집 완료**: 2025-11-08

**결과**:
- **Total**: 374개의 Azure spec (price < $1, region: koreacentral)
- **가격 범위**: $0.0117 ~ $0.999

**가장 저렴한 Top 10 Spec** (화면에서 확인):

| #  | Price  | Memory (GB) | vCPU | Spec Name | 비고 |
|----|--------|-------------|------|-----------|------|
| 1  | 0.0117 | 0.98        | 2    | Standard_B2ats_v2 | 최저가, Phase 2 테스트 완료 |
| 2  | 0.013  | 0.98        | 2    | Standard_B2ts_v2 | Phase 2 테스트 완료 |
| 3  | 0.0468 | 3.91        | 2    | Standard_B2ms | Phase 2 테스트 완료 |
| 4  | 0.052  | 3.91        | 2    | Standard_B2s | Phase 2 테스트 완료 |
| 5  | 0.0936 | 7.81        | 2    | Standard_B4ms | Phase 2 테스트 완료 |
| 6+ | ...    | ...         | ...  | ... | 나머지 369개 |

**Azure Spec 상세 정보** (Phase 2 테스트 대상):

| Spec Name | Region | Connection | Price/Hour | Memory (GiB) | vCPU | OS Arch | Image 결과 |
|-----------|--------|------------|------------|--------------|------|---------|-----------|
| Standard_B2ats_v2 | koreacentral | azure-koreacentral | $0.0117 | 0.9765625 | 2 | x86_64 | 0개 ❌ |
| Standard_B2ts_v2 | koreacentral | azure-koreacentral | $0.013 | 0.9765625 | 2 | x86_64 | 0개 ❌ |
| Standard_B2ms | koreacentral | azure-koreacentral | $0.0468 | 3.90625 | 2 | x86_64 | 0개 ❌ |
| Standard_B2s | koreacentral | azure-koreacentral | $0.052 | 3.90625 | 2 | x86_64 | 0개 ❌ |
| Standard_B4ms | koreacentral | azure-koreacentral | $0.0936 | 7.8125 | 2 | x86_64 | 0개 ❌ |

**Spec 특징**:
- **B-series (Burstable)**: 가변 성능 VM으로 비용 효율적
- **ats_v2, ts_v2**: ARM 기반 또는 특수 목적 인스턴스
- **ms, s**: 메모리 및 스토리지 최적화

**다음 단계**: 위 spec들로 Phase 2 Image 검색 진행

---

### Phase 2 결과: Image 검색 ❌

**실행 완료**: 2025-11-08

**결과**: ⚠️ **Azure koreacentral region에서 사용 가능한 이미지 없음**

**테스트한 Spec** (5개):

| Spec Name | Price | Total Images | Azure Images (img-*) | 결과 |
|-----------|-------|--------------|----------------------|------|
| Standard_B2ats_v2 | $0.0117 | 0 | 0 | ❌ 이미지 없음 |
| Standard_B2ts_v2 | $0.013 | 0 | 0 | ❌ 이미지 없음 |
| Standard_B2ms | $0.0468 | 0 | 0 | ❌ 이미지 없음 |
| Standard_B2s | $0.052 | 0 | 0 | ❌ 이미지 없음 |
| Standard_B4ms | $0.0936 | 0 | 0 | ❌ 이미지 없음 |

**발견 사항**:
1. Searchimage API는 정상 응답 (200 OK)
2. `responseData.imageList`가 빈 배열 `[]`로 반환됨
3. Provider와 Region 필터링은 정상 작동
4. **문제**: Azure koreacentral의 이미지가 시스템에 등록되어 있지 않음

**이전 테스트 기록과 일치**:
- `docs/manual-testing/014_Azure_VM_Creation_test.md`의 시도 2-7에서도 같은 문제 발생
- 모달에서 검색 시 AWS (ami-*), Alibaba (*.vhd), NCP (숫자) 이미지만 표시됨
- Azure 전용 이미지 (img-*) 형식은 찾을 수 없었음

**원인 추정**:
1. **Image Catalog 미등록**: Azure koreacentral region의 이미지가 M-CMP 시스템에 등록되지 않음
2. **Connection 문제**: azure-koreacentral connection이 이미지 정보를 가져오지 못함
3. **Provider 설정 문제**: Azure 이미지 수집 설정이 비활성화되어 있을 가능성

**다음 조치 필요**:
1. Cloud Resources → Image Catalogs에서 Azure 이미지 등록 상태 확인
2. azure-koreacentral connection 설정 확인
3. 다른 Azure region (예: eastus, westus2) 테스트
4. 또는 다른 provider (AWS, GCP, Alibaba) 테스트

### Phase 3 결과: Deploy 테스트

**상태**: ⏭️ 스킵됨

**사유**: Phase 2에서 Azure koreacentral region에 사용 가능한 이미지가 없음을 확인했으므로, Deploy 테스트를 진행할 수 없음.

---

## 결론 및 권장사항

### 테스트 결과 요약

✅ **Phase 1 완료**: 374개의 Azure spec (price < $1) 확인  
❌ **Phase 2 실패**: 모든 spec에서 이미지 0개  
⏭️ **Phase 3 스킵**: 이미지 없음으로 인해 Deploy 테스트 불가  

### 근본 원인

**Azure koreacentral region의 이미지가 M-CMP 시스템에 등록되어 있지 않음**

이는 다음 중 하나의 문제일 가능성이 높습니다:
1. Image Catalog에 Azure 이미지가 수집/등록되지 않음
2. azure-koreacentral connection 설정 문제
3. Azure API와의 연동 문제

### 권장 조치사항

#### 즉시 조치 (High Priority)

1. **Image Catalog 확인**
   - 메뉴: Settings → Environment → Cloud Res Catalogs
   - Azure provider의 이미지 목록 확인
   - 이미지가 없다면 Azure API로부터 이미지 수집 실행

2. **Connection 설정 확인**
   - 메뉴: Settings → Environment → Cloud SPs
   - azure-koreacentral connection 상태 확인
   - Test Connection 실행

3. **다른 Provider 테스트**
   - AWS (이미 이미지 확인됨: ami-* 형식)
   - GCP
   - Alibaba (이미 이미지 확인됨: *.vhd 형식)

#### 대안 (Medium Priority)

4. **다른 Azure Region 테스트**
   - eastus, westus2, westeurope 등
   - 해당 region의 spec과 이미지 확인

5. **Manual Image 등록**
   - Azure Portal에서 직접 이미지 ID 확인
   - M-CMP에 수동으로 이미지 등록

### 학습 사항

1. **Image Recommendation 모달의 Provider 필터링 문제**
   - Bug #005에서 확인한 것처럼, 모달에서 다른 provider의 이미지가 섞여 표시되는 것은 프론트엔드 문제
   - 하지만 API 레벨에서도 Azure 이미지 자체가 없음을 확인

2. **자동화 테스트의 가치**
   - 이 테스트를 통해 수동 테스트에서 놓쳤던 근본 원인을 명확히 파악
   - 5개 spec을 자동으로 테스트하여 일관된 결과 확인

3. **효율적인 디버깅 프로세스**
   - Phase 1: Spec 확인 (문제없음)
   - Phase 2: Image 확인 (문제 발견)
   - Phase 3: Deploy 테스트 (불필요, 스킵)
   - 단계별로 진행하여 시간과 리소스 절약

### 다음 단계

**우선순위 1**: Image Catalog 확인 및 Azure 이미지 등록  
**우선순위 2**: 다른 provider (AWS/GCP)로 VM 생성 테스트  
**우선순위 3**: Azure 다른 region 테스트  

---

## 생성된 파일

- `docs/manual-testing/015_Azure_Image_Search_Plan.md` - 이 파일 (테스트 계획 및 결과)
- `docs/manual-testing/azure_image_search_script.js` - Image 검색 자동화 스크립트
- `docs/development/bug/buglist.md` - 업데이트됨 (Bug #007, #008 추가)

---

## 체크리스트 완료 상태

- [x] Phase 1: Spec 목록 수집 완료
- [x] Spec 목록을 JSON으로 저장 (문서에 테이블 형태로 기록)
- [x] Phase 2: Image 검색 스크립트 실행
- [x] 이미지가 있는 Spec 목록 확보 (결과: 0개)
- [ ] Phase 3: 상위 3-5개 Spec으로 Deploy 테스트 (스킵 - 이미지 없음)
- [ ] 성공한 조합 최소 1개 이상 발견 (불가 - 이미지 없음)
- [x] Phase 4: 문서 업데이트
- [ ] 다른 팀원에게 결과 공유 (사용자 재량)

---

## 부록: 테스트한 Azure Spec 상세 목록

### 테스트 대상 Spec (5개)

모든 Spec은 다음 조건을 만족합니다:
- **Provider**: Azure
- **Region**: koreacentral
- **Connection**: azure-koreacentral
- **Price**: < $1/hour
- **OS Architecture**: x86_64

#### 1. Standard_B2ats_v2 (최저가)

```
Spec ID: azure+koreacentral+Standard_B2ats_v2
Price: $0.0117/hour
Memory: 0.9765625 GiB (~1 GB)
vCPU: 2
Series: B-series (Burstable)
특징: ARM 기반 가능, 최저가 옵션
Image 검색 결과: 0개 ❌
```

#### 2. Standard_B2ts_v2

```
Spec ID: azure+koreacentral+Standard_B2ts_v2
Price: $0.013/hour
Memory: 0.9765625 GiB (~1 GB)
vCPU: 2
Series: B-series (Burstable)
특징: 이전 테스트(014)에서도 확인됨
Image 검색 결과: 0개 ❌
```

#### 3. Standard_B2ms

```
Spec ID: azure+koreacentral+Standard_B2ms
Price: $0.0468/hour
Memory: 3.90625 GiB (~4 GB)
vCPU: 2
Series: B-series (Burstable)
특징: 메모리 최적화 (ms = memory)
Image 검색 결과: 0개 ❌
```

#### 4. Standard_B2s

```
Spec ID: azure+koreacentral+Standard_B2s
Price: $0.052/hour
Memory: 3.90625 GiB (~4 GB)
vCPU: 2
Series: B-series (Burstable)
특징: 표준 Burstable VM
Image 검색 결과: 0개 ❌
```

#### 5. Standard_B4ms

```
Spec ID: azure+koreacentral+Standard_B4ms
Price: $0.0936/hour
Memory: 7.8125 GiB (~8 GB)
vCPU: 2
Series: B-series (Burstable)
특징: 메모리 최적화, 가장 높은 메모리
Image 검색 결과: 0개 ❌
```

### Spec 선정 기준

1. **가격 기준**: Price < $1/hour 중 최저가부터 테스트
2. **다양성**: 메모리 크기가 다른 spec 포함 (1GB ~ 8GB)
3. **실용성**: B-series는 일반적인 워크로드에 적합
4. **지역**: koreacentral (서울 리전)

### 테스트 결과 요약

| 항목 | 결과 |
|------|------|
| 테스트한 Spec 수 | 5개 |
| 이미지를 찾은 Spec | 0개 ❌ |
| 총 발견한 이미지 | 0개 |
| API 호출 성공률 | 100% (5/5) |
| API 응답 시간 | ~1-2초/spec |

### 미테스트 Spec (참고)

koreacentral에는 아직 **369개의 Azure spec**이 더 있습니다 (price < $1 기준).

상위 10-20개 spec들:
- Standard_D2s_v3, Standard_D2as_v4 등 D-series
- Standard_F2s_v2 등 F-series (Compute optimized)
- Standard_E2s_v3 등 E-series (Memory optimized)

**권장사항**: 현재 모든 spec에서 이미지가 없으므로, 다른 spec을 테스트하는 것보다 **Image Catalog 문제를 먼저 해결**하는 것이 우선입니다.

---

## 참고 문서
- `docs/manual-testing/014_Azure_VM_Creation_test.md` - 기존 테스트 기록
- `docs/development/bug/buglist.md` - 알려진 이슈
- `front/assets/js/partials/operation/manage/imagerecommendation.js` - Image 검색 로직

