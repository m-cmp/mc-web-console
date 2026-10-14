/**
 * Azure VM 생성 자동화 테스트 스크립트
 * 
 * 사용 방법:
 * 1. MCI Workloads 페이지에서 브라우저 개발자 도구 콘솔 열기 (F12)
 * 2. 이 스크립트를 콘솔에 붙여넣기
 * 3. startAzureVMTest() 함수 실행
 */

// 테스트할 이미지 목록 (순서대로 시도)
const testImages = [
  { id: 'img-487zeit5', name: 'Ubuntu Server 22.04 LTS 64bit', attempted: false },
  { id: 'ubuntu_22_04_x64_20G_alibase_20250917.vhd', name: 'Ubuntu 22.04 64 bit', attempted: false },
  { id: 'ami-0593272c889084af9', name: 'ubuntu-pro-fips-updates-server', attempted: false }
];

// Spec 정보 (재사용)
const azureSpec = {
  provider: 'Azure',
  region: 'koreacentral',
  price: 0.013,
  specName: 'Standard_B2ts_v2'
};

// 현재 테스트 인덱스
let currentImageIndex = 0;

/**
 * 다음 이미지로 테스트 진행
 */
async function testNextImage() {
  if (currentImageIndex >= testImages.length) {
    console.log('✅ 모든 이미지 테스트 완료!');
    console.log('테스트 결과:', testImages);
    return;
  }
  
  const currentImage = testImages[currentImageIndex];
  console.log(`\n🔍 테스트 ${currentImageIndex + 1}/${testImages.length}: ${currentImage.name} (${currentImage.id})`);
  console.log('-------------------------------------------');
  
  // 사용자에게 수동 작업 안내
  console.log('📋 다음 단계를 수동으로 진행해주세요:');
  console.log('1. NodeGroup 클릭 (또는 +NodeGroup)');
  console.log('2. Server Name 입력');
  console.log(`3. Spec 선택: ${azureSpec.specName} (${azureSpec.provider}, ${azureSpec.price})`);
  console.log(`4. Image 선택: ${currentImage.id}`);
  console.log('5. Done 버튼 클릭');
  console.log('6. Deploy 버튼 클릭');
  console.log('\n배포 완료 후:');
  console.log('- 성공: recordSuccess() 입력');
  console.log('- 실패: recordFailure("오류메시지") 입력');
  
  currentImage.attempted = true;
}

/**
 * 성공 기록
 */
function recordSuccess() {
  const currentImage = testImages[currentImageIndex];
  currentImage.result = 'SUCCESS';
  currentImage.timestamp = new Date().toISOString();
  
  console.log(`\n✅ 성공! 이미지: ${currentImage.id}`);
  console.log('성공한 이미지 정보:');
  console.log(JSON.stringify(currentImage, null, 2));
  console.log('\n🎉 Azure VM 생성 테스트 성공!');
  console.log('\n📝 테스트 문서에 다음 정보를 추가하세요:');
  console.log(`| ${currentImage.id} | ${currentImage.name} | Azure | koreacentral | ✅ SUCCESS |`);
}

/**
 * 실패 기록 및 다음 이미지로 진행
 */
function recordFailure(errorMessage = '') {
  const currentImage = testImages[currentImageIndex];
  currentImage.result = 'FAILURE';
  currentImage.error = errorMessage;
  currentImage.timestamp = new Date().toISOString();
  
  console.log(`\n❌ 실패! 이미지: ${currentImage.id}`);
  console.log(`오류: ${errorMessage}`);
  console.log('\n📝 테스트 문서에 다음 정보를 추가하세요:');
  console.log(`| ${currentImageIndex + 2} | ${currentImage.id} | ${currentImage.name} | ${azureSpec.specName}, ${azureSpec.price} | ❌ FAILURE | ${errorMessage} | 시도 ${currentImageIndex + 2} 실패 |`);
  
  // 다음 이미지로 진행
  currentImageIndex++;
  setTimeout(testNextImage, 1000);
}

/**
 * 테스트 시작
 */
function startAzureVMTest() {
  console.log('🚀 Azure VM 생성 자동화 테스트 시작');
  console.log('=====================================');
  console.log(`총 테스트 이미지 수: ${testImages.length}`);
  console.log(`Spec: ${azureSpec.specName} (${azureSpec.provider}, ${azureSpec.region}, $${azureSpec.price})`);
  console.log('=====================================\n');
  
  currentImageIndex = 0;
  testNextImage();
}

/**
 * 현재 테스트 상태 확인
 */
function getTestStatus() {
  console.log('\n📊 테스트 현황');
  console.log('=====================================');
  testImages.forEach((img, idx) => {
    const status = img.result ? (img.result === 'SUCCESS' ? '✅' : '❌') : '⏳';
    console.log(`${idx + 1}. ${status} ${img.name} (${img.id})`);
    if (img.result === 'FAILURE' && img.error) {
      console.log(`   오류: ${img.error}`);
    }
  });
  console.log('=====================================\n');
}

// 사용 가능한 함수 안내
console.log('📌 사용 가능한 함수:');
console.log('- startAzureVMTest() : 테스트 시작');
console.log('- recordSuccess() : 성공 기록');
console.log('- recordFailure("오류메시지") : 실패 기록 및 다음 이미지 테스트');
console.log('- getTestStatus() : 현재 테스트 상태 확인');
console.log('- testNextImage() : 다음 이미지 테스트 안내');
console.log('\n준비되면 startAzureVMTest()를 입력하여 시작하세요!');

