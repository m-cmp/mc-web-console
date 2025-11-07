/**
 * Toast 유틸리티 사용 예시
 * 이 파일은 개발 참고용이며, 실제 배포 시에는 제거해도 됩니다.
 */

import { 
    showToast, 
    hideToast, 
    hideAllToasts,
    TOAST_TYPES,
    showProgressToast,
    showRetrySuccessToast 
} from './toast.js';

// 사용 예시들
export function toastExamples() {
    // 1. 기본 Toast 표시
    showToast(TOAST_TYPES.SUCCESS, '작업이 완료되었습니다!');
    
    // 2. 진행 상태 Toast (기존 호환성)
    showProgressToast('파일업로드', 'processing');
    
    // 3. 커스텀 옵션으로 Toast 표시
    showToast(TOAST_TYPES.ERROR, '오류가 발생했습니다.', {
        id: 'customErrorToast',
        delay: 10000
    });
    
    // 4. Retry 성공 Toast
    showRetrySuccessToast('vm-001');
    
    // 5. 특정 Toast 숨기기
    setTimeout(() => {
        hideToast('customErrorToast');
    }, 5000);
    
    // 6. 모든 Toast 숨기기
    setTimeout(() => {
        hideAllToasts();
    }, 10000);
}

// 전역 함수로 등록 (개발 테스트용)
window.toastExamples = toastExamples;
