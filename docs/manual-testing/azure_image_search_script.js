// Azure Image Search Test Script
// 브라우저 콘솔에서 실행하세요 (F12 → Console 탭)

async function testAzureImages() {
  console.log('🚀 Starting Azure Image Search Test...\n');
  
  // 테스트할 spec 목록 (가장 저렴한 10개)
  // 실제 spec 이름은 UI에서 확인 필요
  const specsToTest = [
    { name: 'Standard_B2ats_v2', price: 0.0117, region: 'koreacentral' },
    { name: 'Standard_B2ts_v2', price: 0.013, region: 'koreacentral' }, // 이미 테스트함
    { name: 'Standard_B2ms', price: 0.0468, region: 'koreacentral' },
    { name: 'Standard_B2s', price: 0.052, region: 'koreacentral' },
    { name: 'Standard_B4ms', price: 0.0936, region: 'koreacentral' },
  ];
  
  const results = [];
  let successCount = 0;
  
  for (const spec of specsToTest) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Testing: ${spec.name} ($${spec.price})`);
    console.log(`${'='.repeat(60)}`);
    
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
            regionName: spec.region,
            osArchitecture: 'x86_64',
            includeDeprecatedImage: false,
            isGPUImage: false,
            isKubernetesImage: false
            // osType 제외 - 모든 OS 검색
          }
        })
      });
      
      const data = await response.json();
      
      if (data.status.code === 200) {
        const imageList = data.responseData?.imageList || [];
        const imageCount = imageList.length;
        
        // Azure 이미지 필터링 (img-* 형식)
        const azureImages = imageList.filter(img => {
          const id = img.id || img.cspImageName || '';
          return id.startsWith('img-') || id.includes('azure');
        });
        
        // 다른 provider 이미지 개수
        const awsImages = imageList.filter(img => (img.id || '').startsWith('ami-'));
        const alibabaImages = imageList.filter(img => (img.id || '').includes('.vhd'));
        
        const result = {
          spec: spec.name,
          price: spec.price,
          totalImages: imageCount,
          azureImages: azureImages.length,
          awsImages: awsImages.length,
          alibabaImages: alibabaImages.length,
          hasAzureImages: azureImages.length > 0,
          firstAzureImage: azureImages[0]?.id || azureImages[0]?.cspImageName || null,
          firstImageName: azureImages[0]?.name || null,
          firstImageOSType: azureImages[0]?.osType || null
        };
        
        results.push(result);
        
        if (azureImages.length > 0) {
          console.log(`  ✅ SUCCESS: ${azureImages.length} Azure images found!`);
          console.log(`     📸 First Image: ${result.firstAzureImage}`);
          console.log(`     📝 Image Name: ${result.firstImageName}`);
          console.log(`     💻 OS Type: ${result.firstImageOSType}`);
          successCount++;
        } else {
          console.log(`  ⚠️  WARNING: ${imageCount} total images but no Azure (img-*) format`);
          if (awsImages.length > 0) console.log(`     AWS: ${awsImages.length}, Alibaba: ${alibabaImages.length}`);
        }
        
      } else {
        console.log(`  ❌ API Error: ${data.status.code} - ${data.status.message}`);
        results.push({
          spec: spec.name,
          price: spec.price,
          error: `API ${data.status.code}: ${data.status.message}`
        });
      }
      
      // API 부하 방지 대기 (1초)
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      console.error(`  ❌ Exception:`, error.message);
      results.push({
        spec: spec.name,
        price: spec.price,
        error: `Exception: ${error.message}`
      });
    }
  }
  
  // 결과 요약
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.table(results);
  
  const specsWithImages = results.filter(r => r.hasAzureImages);
  console.log(`\n✅ Specs with Azure images: ${successCount}/${results.length}`);
  
  if (specsWithImages.length > 0) {
    console.log('\n🎯 RECOMMENDED SPECS FOR DEPLOY TEST:');
    console.log('='.repeat(80));
    console.table(specsWithImages);
    
    console.log('\n📋 Copy this data for Phase 3:');
    console.log(JSON.stringify(specsWithImages, null, 2));
  } else {
    console.log('\n❌ No specs with Azure images found.');
    console.log('💡 Recommendation: Try different regions or check image availability');
  }
  
  console.log('\n✨ Test completed!');
  
  return {
    summary: {
      total: results.length,
      withImages: successCount,
      withoutImages: results.length - successCount
    },
    results: results,
    recommended: specsWithImages
  };
}

// 실행
console.log('💡 Azure Image Search Test Script Loaded');
console.log('📝 Run: await testAzureImages()');
console.log('');

// 자동 실행 (주석 해제 시)
// await testAzureImages();

