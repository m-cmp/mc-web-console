// MCI Label Editor 열기 함수 (전역으로 등록)
window.openMciLabelEditor = function() {
  // 현재 선택된 MCI 정보 가져오기
  const mciId = window.currentMciId;
  const mciName = document.getElementById('mci_info_name')?.textContent || 'Unknown MCI';
  
  if (!mciId || mciId === "" || mciId === "undefined") {
    alert('Please select an MCI first.');
    return;
  }
  
  // Label Editor 모달 열기
  webconsolejs['pages/operation/manage/mci'].openLabelEditorModal('mci', mciId, mciName);
}

// MCI Labels 표시 함수 (전역으로 등록)
window.displayMciLabels = function(labels) {
  const container = document.getElementById('mci-labels-content');
  
  if (!labels || Object.keys(labels).length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted">
        <p>No labels found. Click "Edit Labels" to add labels to this MCI.</p>
      </div>
    `;
    return;
  }
  
  // 라벨을 system 라벨과 사용자 라벨로 분류
  const allLabels = Object.entries(labels);
  const systemLabels = allLabels.filter(([key]) => key.startsWith('sys.'));
  const userLabels = allLabels.filter(([key]) => !key.startsWith('sys.'));
  
  // 현재 토글 상태 확인
  const showSystemLabels = document.getElementById('showSystemLabels')?.checked || false;
  
  // 표시할 라벨 결정
  const labelsToShow = showSystemLabels ? allLabels : userLabels;
  
  if (labelsToShow.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted">
        <p>No ${showSystemLabels ? '' : 'user '}labels found. Click "Edit Labels" to add labels to this MCI.</p>
      </div>
    `;
    return;
  }
  
  // 테이블 행 생성 (system 라벨과 사용자 라벨 구분)
  const tableRows = labelsToShow.map(([key, value]) => {
    const isSystemLabel = key.startsWith('sys.');
    const rowClass = isSystemLabel ? 'table-secondary' : '';
    const keyClass = isSystemLabel ? 'text-muted fst-italic' : 'text-muted';
    
    return `
      <tr class="${rowClass}">
        <td class="${keyClass}" style="width: 40%; word-break: break-word;">${key}</td>
        <td style="width: 60%; word-break: break-word;">${value}</td>
      </tr>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-vcenter">
        <thead>
          <tr>
            <th class="text-muted" style="width: 40%;">Key</th>
            <th class="text-muted" style="width: 60%;">Value</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

// Labels 탭이 활성화될 때 Label 정보 로드
document.addEventListener('DOMContentLoaded', function() {
  // Labels 탭 클릭 이벤트 리스너
  const labelsTab = document.querySelector('a[href="#tabs-mci-labels"]');
  
  if (labelsTab) {
    labelsTab.addEventListener('click', function() {
      loadMciLabels();
    });
  }
});

// System 라벨 토글 함수 (전역으로 등록)
window.toggleSystemLabels = function() {
  // 현재 저장된 라벨 데이터가 있는지 확인
  if (window.currentMciLabels) {
    window.displayMciLabels(window.currentMciLabels);
  } else {
    loadMciLabels();
  }
}

// MCI Labels 로드 함수 (전역으로 등록)
window.loadMciLabels = async function() {
  if (!window.currentMciId) {
    return;
  }
  
  try {
    // Getmci API로 MCI 상세 정보 조회
    const mciResponse = await webconsolejs["common/api/services/mci_api"].getMci(window.currentNsId, window.currentMciId);
    
    if (mciResponse && mciResponse.responseData && mciResponse.responseData.label) {
      const labels = mciResponse.responseData.label;
      
      // 라벨 데이터를 전역 변수에 저장 (토글 시 재사용)
      window.currentMciLabels = labels;
      
      window.displayMciLabels(labels);
    } else {
      window.currentMciLabels = {};
      window.displayMciLabels({});
    }
  } catch (error) {
    console.error("Error loading MCI labels:", error);
    window.currentMciLabels = {};
    displayMciLabels({});
  }
}
