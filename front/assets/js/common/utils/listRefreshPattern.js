/**
 * List Refresh Pattern 유틸리티
 * List Refresh Pattern Utility
 * 
 * 목록 화면의 일관된 refresh 동작을 제공하는 공통 패턴
 * Provides consistent refresh behavior for list screens
 * 
 * @module listRefreshPattern
 */

/**
 * 범용 List Refresh 패턴 실행
 * Execute universal list refresh pattern
 * 
 * @param {Object} config - Refresh 설정 객체 / Refresh configuration object
 * @param {Function} config.getSelectionId - 현재 선택된 항목 ID를 반환하는 함수 / Function to get current selection ID
 * @param {Array<string>} config.detailElementIds - 숨겨야 할 상세 영역 element ID 배열 / Array of detail element IDs to hide
 * @param {Array<string>} config.detailElementsToEmpty - 내용을 비워야 할 element ID 배열 / Array of element IDs to empty
 * @param {Array<string>} config.formsToClose - 닫아야 할 폼 element ID 배열 / Array of form element IDs to close
 * @param {Function} config.fetchListData - 목록 데이터를 가져오는 async 함수 / Async function to fetch list data
 * @param {Function} config.updateListCallback - 가져온 데이터로 목록을 업데이트하는 함수 / Function to update list with fetched data
 * @param {Function} config.getRowById - ID로 row 객체를 가져오는 함수 / Function to get row object by ID
 * @param {Function} config.selectRow - row를 선택하는 함수 / Function to select a row
 * @param {Function} config.showDetailData - 선택된 항목의 상세 정보를 표시하는 async 함수 / Async function to show detail data
 * @param {Function} config.clearSelectionState - 선택 상태를 초기화하는 함수 / Function to clear selection state
 * @param {string} config.errorMessage - 에러 메시지 (선택사항) / Error message (optional)
 * @returns {Promise<Object>} - { success: boolean, state: Object, error: Error }
 */
export async function execute(config) {
  try {
    // 설정 검증 / Validate configuration
    if (!validateConfig(config)) {
      console.error('Invalid refresh config:', config);
      return { success: false, error: 'Invalid configuration' };
    }

    // 1. 현재 선택 상태 저장 / Save current selection state
    const state = saveState(config);

    // 2. UI 초기화 / Reset UI
    resetUI(config);

    // 3. 데이터 조회 및 업데이트 / Fetch and update data
    await refreshData(config);

    // 4. 상태 복원 / Restore state
    await restoreState(config, state);

    return { success: true, state };
  } catch (error) {
    console.error('List refresh pattern error:', error);
    handleError(config, error);
    return { success: false, error };
  }
}

/**
 * 설정 객체 검증
 * Validate configuration object
 * 
 * @param {Object} config - 검증할 설정 객체 / Configuration object to validate
 * @returns {boolean} - 검증 결과 / Validation result
 */
function validateConfig(config) {
  const required = ['fetchListData', 'updateListCallback'];
  return required.every(key => typeof config[key] === 'function');
}

/**
 * 현재 상태 저장
 * Save current state
 * 
 * @param {Object} config - 설정 객체 / Configuration object
 * @returns {Object} - 저장된 상태 / Saved state
 */
function saveState(config) {
  return {
    selectedId: config.getSelectionId ? config.getSelectionId() : null,
    timestamp: Date.now()
  };
}

/**
 * UI 초기화
 * Reset UI elements
 * 
 * @param {Object} config - 설정 객체 / Configuration object
 */
function resetUI(config) {
  // 상세 영역 숨기기 / Hide detail areas
  if (config.detailElementIds && Array.isArray(config.detailElementIds)) {
    config.detailElementIds.forEach(id => {
      $(`#${id}`).hide();
    });
  }

  // 내용 비우기 / Empty content areas
  if (config.detailElementsToEmpty && Array.isArray(config.detailElementsToEmpty)) {
    config.detailElementsToEmpty.forEach(id => {
      $(`#${id}`).empty();
    });
  }

  // 폼 닫기 / Close forms
  if (config.formsToClose && Array.isArray(config.formsToClose)) {
    config.formsToClose.forEach(formId => {
      const form = document.getElementById(formId);
      if (form && form.classList.contains('active')) {
        webconsolejs['partials/layout/navigatePages'].toggleSubElement(form);
      }
    });
  }
}

/**
 * 데이터 조회 및 목록 업데이트
 * Fetch data and update list
 * 
 * @param {Object} config - 설정 객체 / Configuration object
 */
async function refreshData(config) {
  const data = await config.fetchListData();
  config.updateListCallback(data);
}

/**
 * 선택 상태 복원
 * Restore selection state
 * 
 * @param {Object} config - 설정 객체 / Configuration object
 * @param {Object} state - 저장된 상태 / Saved state
 */
async function restoreState(config, state) {
  if (!state.selectedId || !config.getRowById) {
    return;
  }

  const row = config.getRowById(state.selectedId);

  if (row) {
    // 항목이 여전히 존재하면 선택 복원 / Item still exists, restore selection
    if (config.selectRow) {
      config.selectRow(state.selectedId);
    }
    if (config.showDetailData) {
      await config.showDetailData();
    }
  } else {
    // 항목이 삭제되었으면 상태 초기화 / Item deleted, clear state
    if (config.clearSelectionState) {
      config.clearSelectionState();
    }
  }
}

/**
 * 에러 처리
 * Handle error
 * 
 * @param {Object} config - 설정 객체 / Configuration object
 * @param {Error} error - 에러 객체 / Error object
 */
function handleError(config, error) {
  const message = config.errorMessage || 'Failed to refresh list. Please try again.';
  if (webconsolejs && webconsolejs['common/util'] && webconsolejs['common/util'].showToast) {
    webconsolejs['common/util'].showToast(message, 'error');
  } else {
    console.error(message, error);
  }
}

// Export functions
export const ListRefreshPattern = {
  execute,
  validateConfig,
  saveState,
  resetUI,
  refreshData,
  restoreState,
  handleError
};

// Webpack에 등록 / Register to webpack
if (typeof webconsolejs === 'undefined') {
  window.webconsolejs = {};
}
if (typeof webconsolejs['common/utils/listRefreshPattern'] === 'undefined') {
  webconsolejs['common/utils/listRefreshPattern'] = ListRefreshPattern;
}

// Default export
export default ListRefreshPattern;


