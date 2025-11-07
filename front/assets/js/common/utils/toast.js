/**
 * 공통 Toast 유틸리티
 * Bootstrap Toast 컴포넌트를 활용한 통합 Toast 관리 시스템
 */

// Toast 타입 정의
export const TOAST_TYPES = {
    PROGRESS: 'progress',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
};

// Toast 설정 옵션
export const TOAST_OPTIONS = {
    [TOAST_TYPES.PROGRESS]: {
        bgClass: 'bg-primary',
        icon: 'spinner-border spinner-border-sm',
        autohide: false,
        closeButton: true
    },
    [TOAST_TYPES.SUCCESS]: {
        bgClass: 'bg-success',
        icon: 'ti ti-check-circle',
        autohide: true,
        delay: 3000,
        closeButton: false
    },
    [TOAST_TYPES.WARNING]: {
        bgClass: 'bg-warning',
        icon: 'spinner-border spinner-border-sm',
        autohide: false,
        closeButton: true
    },
    [TOAST_TYPES.ERROR]: {
        bgClass: 'bg-danger',
        icon: 'ti ti-x-circle',
        autohide: true,
        delay: 5000,
        closeButton: false
    }
};

/**
 * Toast 관리 클래스
 */
class ToastManager {
    constructor() {
        this.activeToasts = new Map();
        this.container = null;
        this.initContainer();
    }

    /**
     * Toast 컨테이너 초기화
     */
    initContainer() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container position-fixed top-0 end-0 p-3';
            this.container.style.zIndex = '9999';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Toast HTML 생성
     * @param {string} id - Toast ID
     * @param {string} type - Toast 타입
     * @param {string} message - 표시할 메시지
     * @param {Object} options - 추가 옵션
     * @returns {string} Toast HTML
     */
    generateToastHtml(id, type, message, options = {}) {
        const config = { ...TOAST_OPTIONS[type], ...options };
        const hasSpinner = config.icon.includes('spinner');
        
        const iconHtml = hasSpinner 
            ? `<div class="${config.icon} me-2" role="status">
                 <span class="visually-hidden">Loading...</span>
               </div>`
            : `<i class="${config.icon} me-2"></i>`;

        const closeButtonHtml = config.closeButton 
            ? `<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>`
            : '';

        return `
            <div class="toast align-items-center text-white ${config.bgClass} border-0" id="${id}" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <div class="d-flex align-items-center">
                            ${iconHtml}
                            <span>${message}</span>
                        </div>
                    </div>
                    ${closeButtonHtml}
                </div>
            </div>
        `;
    }

    /**
     * Toast 표시
     * @param {string} type - Toast 타입
     * @param {string} message - 표시할 메시지
     * @param {Object} options - 추가 옵션
     * @returns {Object} Toast 인스턴스
     */
    show(type, message, options = {}) {
        const id = options.id || `${type}Toast_${Date.now()}`;
        const config = { ...TOAST_OPTIONS[type], ...options };

        // 기존 Toast 제거
        this.hide(id);

        // Toast HTML 생성 및 추가
        const toastHtml = this.generateToastHtml(id, type, message, options);
        this.container.insertAdjacentHTML('beforeend', toastHtml);

        // Bootstrap Toast 인스턴스 생성
        const toastElement = document.getElementById(id);
        const toast = new bootstrap.Toast(toastElement, { 
            autohide: config.autohide,
            delay: config.delay || 5000
        });

        // Toast 표시
        toast.show();

        // 활성 Toast 저장
        this.activeToasts.set(id, toast);

        // 자동 제거 설정
        if (config.autohide && config.delay) {
            setTimeout(() => {
                this.hide(id);
            }, config.delay);
        }

        return toast;
    }

    /**
     * Toast 숨기기
     * @param {string} id - Toast ID
     */
    hide(id) {
        const toast = this.activeToasts.get(id);
        if (toast) {
            toast.hide();
            this.activeToasts.delete(id);
        }

        // DOM에서 제거
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    /**
     * 모든 Toast 숨기기
     */
    hideAll() {
        this.activeToasts.forEach((toast, id) => {
            toast.hide();
        });
        this.activeToasts.clear();
    }

    /**
     * 특정 타입의 Toast 숨기기
     * @param {string} type - Toast 타입
     */
    hideByType(type) {
        this.activeToasts.forEach((toast, id) => {
            if (id.startsWith(type)) {
                this.hide(id);
            }
        });
    }

    /**
     * 진행 상태 Toast 표시 (기존 호환성)
     * @param {string} fileName - 파일명
     * @param {string} status - 상태
     */
    showProgress(fileName, status) {
        let message = `${fileName} processing...`;
        if (fileName === "ScaleOut") {
            message = "ScaleOut 작업 중...";
        }
        return this.show(TOAST_TYPES.PROGRESS, message, { id: 'transferProgressToast' });
    }

    /**
     * 명령어 실행 Toast 표시 (기존 호환성)
     * @param {string} command - 명령어
     * @param {string} status - 상태
     */
    showCommandProgress(command, status) {
        return this.show(TOAST_TYPES.PROGRESS, `Executing command: ${command}`, { id: 'commandProgressToast' });
    }

    /**
     * Retry 진행 Toast 표시 (기존 호환성)
     * @param {string} vmId - VM ID
     */
    showRetryProgress(vmId) {
        return this.show(TOAST_TYPES.WARNING, `Retrying command for VM: <strong>${vmId}</strong>`, { id: 'retryProgressToast' });
    }

    /**
     * Retry 성공 Toast 표시 (기존 호환성)
     * @param {string} vmId - VM ID
     */
    showRetrySuccess(vmId) {
        return this.show(TOAST_TYPES.SUCCESS, `Command retry successful for VM: <strong>${vmId}</strong>`, { id: 'retrySuccessToast' });
    }

    /**
     * Retry 실패 Toast 표시 (기존 호환성)
     * @param {string} vmId - VM ID
     * @param {string} errorMessage - 에러 메시지
     */
    showRetryError(vmId, errorMessage) {
        return this.show(TOAST_TYPES.ERROR, `Command retry failed for VM: <strong>${vmId}</strong><br><small>${errorMessage}</small>`, { id: 'retryErrorToast' });
    }
}

// 전역 Toast Manager 인스턴스
const toastManager = new ToastManager();

// 기존 호환성을 위한 전역 함수들
export function showProgressToast(fileName, status) {
    return toastManager.showProgress(fileName, status);
}

export function hideProgressToast() {
    toastManager.hideAll();
}

export function showCommandProgressToast(command, status) {
    return toastManager.showCommandProgress(command, status);
}

export function showRetryProgressToast(vmId) {
    return toastManager.showRetryProgress(vmId);
}

export function showRetrySuccessToast(vmId) {
    return toastManager.showRetrySuccess(vmId);
}

export function showRetryErrorToast(vmId, errorMessage) {
    return toastManager.showRetryError(vmId, errorMessage);
}

// 새로운 통합 API
export function showToast(type, message, options = {}) {
    return toastManager.show(type, message, options);
}

export function hideToast(id) {
    return toastManager.hide(id);
}

export function hideAllToasts() {
    return toastManager.hideAll();
}

// 전역 변수 호환성 유지
export function getCurrentTransferToast() {
    return toastManager.activeToasts.get('transferProgressToast');
}

export function getCurrentCommandToast() {
    return toastManager.activeToasts.get('commandProgressToast');
}

export function getCurrentRetryToast() {
    return toastManager.activeToasts.get('retryProgressToast');
}

// webconsolejs 객체에 등록
if (typeof webconsolejs === 'undefined') {
    webconsolejs = {};
}

if (typeof webconsolejs['common/utils/toast'] === 'undefined') {
    webconsolejs['common/utils/toast'] = {};
}

// Toast 함수들을 webconsolejs 객체에 등록
webconsolejs['common/utils/toast'].showProgressToast = showProgressToast;
webconsolejs['common/utils/toast'].hideProgressToast = hideProgressToast;
webconsolejs['common/utils/toast'].showCommandProgressToast = showCommandProgressToast;
webconsolejs['common/utils/toast'].showRetryProgressToast = showRetryProgressToast;
webconsolejs['common/utils/toast'].showRetrySuccessToast = showRetrySuccessToast;
webconsolejs['common/utils/toast'].showRetryErrorToast = showRetryErrorToast;
webconsolejs['common/utils/toast'].showToast = showToast;
webconsolejs['common/utils/toast'].hideToast = hideToast;
webconsolejs['common/utils/toast'].hideAllToasts = hideAllToasts;
webconsolejs['common/utils/toast'].TOAST_TYPES = TOAST_TYPES;

// 기본 export
export default toastManager;
