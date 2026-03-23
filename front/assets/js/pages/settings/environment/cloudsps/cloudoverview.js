// CSP 계정 관리 페이지 (Cloud Overview)

if (typeof webconsolejs === 'undefined') {
    window.webconsolejs = {};
}
if (typeof webconsolejs['pages/settings/environment/cloudsps/cloudoverview'] === 'undefined') {
    webconsolejs['pages/settings/environment/cloudsps/cloudoverview'] = {};
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const SENSITIVE_FIELDS = ['secret_access_key', 'client_secret', 'service_account_key'];

const CSP_ACCOUNT_INFO_FIELDS = {
    aws: [
        { key: 'account_id', label: 'AWS Account ID', required: true, type: 'text', placeholder: '12자리 숫자 (예: 050864702683)' },
        { key: 'alias', label: 'Alias', required: false, type: 'text', placeholder: '계정 별칭' },
        { key: 'region', label: 'Default Region', required: false, type: 'text', placeholder: 'ap-northeast-2' },
        { key: 'access_key_id', label: 'Access Key ID', required: false, type: 'text', placeholder: 'AKIAIOSFODNN7EXAMPLE' },
        { key: 'secret_access_key', label: 'Secret Access Key', required: false, type: 'password', placeholder: '민감 정보' },
    ],
    gcp: [
        { key: 'project_id', label: 'Project ID', required: true, type: 'text', placeholder: 'my-gcp-project' },
        { key: 'project_number', label: 'Project Number', required: false, type: 'text', placeholder: '숫자 문자열' },
        { key: 'service_account_key', label: 'Service Account Key (JSON)', required: false, type: 'textarea', placeholder: '{ "type": "service_account", ... }' },
    ],
    azure: [
        { key: 'subscription_id', label: 'Subscription ID', required: true, type: 'text', placeholder: 'UUID 형식' },
        { key: 'tenant_id', label: 'Tenant ID', required: true, type: 'text', placeholder: 'UUID 형식' },
        { key: 'directory_id', label: 'Directory ID', required: false, type: 'text', placeholder: 'tenant_id와 동일한 경우 많음' },
        { key: 'client_id', label: 'Client ID', required: false, type: 'text', placeholder: 'App Registration Client ID' },
        { key: 'client_secret', label: 'Client Secret', required: false, type: 'password', placeholder: '민감 정보' },
    ],
};

const CSP_TYPE_BADGE = {
    aws: '<span class="badge bg-orange-lt">AWS</span>',
    gcp: '<span class="badge bg-blue-lt">GCP</span>',
    azure: '<span class="badge bg-indigo-lt">Azure</span>',
};

// 앱 상태
const AppState = {
    accounts: [],
    currentFilter: '',
    selectedAccountId: null,
    isEditMode: false,
    deleteTargetId: null,
};

// ─── Tabulator 테이블 ───────────────────────────────────────────────

let table = null;

function initTable() {
    table = new Tabulator("#csp-accounts-table", {
        data: [],
        layout: "fitColumns",
        responsiveLayout: "collapse",
        placeholder: "등록된 CSP 계정이 없습니다.",
        columns: [
            {
                title: "이름", field: "name", widthGrow: 2,
                formatter: (cell) => `<span class="fw-medium">${cell.getValue()}</span>`,
            },
            {
                title: "CSP 타입", field: "csp_type", width: 100,
                formatter: (cell) => CSP_TYPE_BADGE[cell.getValue()] || cell.getValue(),
            },
            {
                title: "상태", field: "is_active", width: 110,
                formatter: (cell) => cell.getValue()
                    ? '<span class="badge bg-success-lt">Active</span>'
                    : '<span class="badge bg-secondary-lt">Inactive</span>',
            },
            { title: "설명", field: "description", widthGrow: 3 },
            {
                title: "등록일", field: "created_at", width: 130,
                formatter: (cell) => cell.getValue() ? cell.getValue().substring(0, 10) : '',
            },
            {
                title: "", field: "id", width: 60, hozAlign: "center", headerSort: false,
                formatter: () => `<button class="btn btn-sm btn-ghost-danger py-0 px-1" title="삭제">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4h6v2"></path></svg>
                </button>`,
                cellClick: (e, cell) => {
                    e.stopPropagation();
                    openDeleteModal(cell.getData());
                },
            },
        ],
        rowClick: (e, row) => {
            if (e.target.closest('button')) return;
            loadCspAccountDetail(row.getData().id);
        },
    });
}

// ─── 목록 조회 ─────────────────────────────────────────────────────

async function loadCspAccounts() {
    try {
        const filter = AppState.currentFilter ? { csp_type: AppState.currentFilter } : {};
        const accounts = await webconsolejs["common/api/services/csp_accounts_api"].listCspAccounts(filter);
        AppState.accounts = accounts || [];
        if (table) {
            table.setData(AppState.accounts);
        }
    } catch (err) {
        showToast('error', '목록을 불러오지 못했습니다: ' + err.message);
    }
}

// ─── CSP 타입 필터 ─────────────────────────────────────────────────

function initCspTypeFilter() {
    document.getElementById('csp-type-filter').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-csp-type]');
        if (!btn) return;
        document.querySelectorAll('#csp-type-filter [data-csp-type]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.currentFilter = btn.dataset.cspType;
        loadCspAccounts();
    });
}

// ─── AccountInfo 동적 입력 필드 ────────────────────────────────────

function renderAccountInfoFields(cspType, container, values = {}) {
    const fields = CSP_ACCOUNT_INFO_FIELDS[cspType] || [];
    if (!fields.length) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = `
        <div class="card mb-3">
            <div class="card-header"><h5 class="card-title mb-0">Account Info</h5></div>
            <div class="card-body">
                ${fields.map(f => {
                    const requiredMark = f.required ? '<span class="text-danger ms-1">*</span>' : '';
                    const val = values[f.key] || '';
                    if (f.type === 'textarea') {
                        return `<div class="mb-3">
                            <label class="form-label">${f.label}${requiredMark}</label>
                            <textarea class="form-control" id="ai-${f.key}" rows="4" placeholder="${f.placeholder}">${val}</textarea>
                        </div>`;
                    }
                    return `<div class="mb-3">
                        <label class="form-label">${f.label}${requiredMark}</label>
                        <input type="${f.type}" class="form-control" id="ai-${f.key}" value="${val}" placeholder="${f.placeholder}">
                    </div>`;
                }).join('')}
            </div>
        </div>`;
}

function collectAccountInfoValues(cspType) {
    const fields = CSP_ACCOUNT_INFO_FIELDS[cspType] || [];
    const result = {};
    fields.forEach(f => {
        const el = document.getElementById(`ai-${f.key}`);
        if (el && el.value.trim()) {
            result[f.key] = el.value.trim();
        }
    });
    return result;
}

// ─── 등록 모달 ─────────────────────────────────────────────────────

function initCreateModal() {
    const cspTypeSelect = document.getElementById('create-csp-type');
    const accountInfoContainer = document.getElementById('create-account-info-fields');

    cspTypeSelect.addEventListener('change', () => {
        renderAccountInfoFields(cspTypeSelect.value, accountInfoContainer);
    });

    document.getElementById('create-save-btn').addEventListener('click', createCspAccount);

    const modal = document.getElementById('csp-account-create-modal');
    modal.addEventListener('hidden.bs.modal', () => {
        document.getElementById('create-name').value = '';
        cspTypeSelect.value = '';
        accountInfoContainer.innerHTML = '';
        document.getElementById('create-description').value = '';
        document.getElementById('create-error-msg').classList.add('d-none');
    });
}

async function createCspAccount() {
    const name = document.getElementById('create-name').value.trim();
    const cspType = document.getElementById('create-csp-type').value;
    const description = document.getElementById('create-description').value.trim();
    const errorEl = document.getElementById('create-error-msg');

    if (!name || !cspType) {
        errorEl.textContent = '계정 이름과 CSP 타입은 필수입니다.';
        errorEl.classList.remove('d-none');
        return;
    }

    const accountInfo = collectAccountInfoValues(cspType);
    const requiredFields = (CSP_ACCOUNT_INFO_FIELDS[cspType] || []).filter(f => f.required);
    for (const f of requiredFields) {
        if (!accountInfo[f.key]) {
            errorEl.textContent = `${f.label} 은(는) 필수입니다.`;
            errorEl.classList.remove('d-none');
            return;
        }
    }

    errorEl.classList.add('d-none');
    const saveBtn = document.getElementById('create-save-btn');
    saveBtn.disabled = true;

    try {
        await webconsolejs["common/api/services/csp_accounts_api"].createCspAccount({
            name,
            csp_type: cspType,
            account_info: accountInfo,
            description,
        });
        bootstrap.Modal.getInstance(document.getElementById('csp-account-create-modal')).hide();
        showToast('success', '계정이 등록되었습니다.');
        await loadCspAccounts();
    } catch (err) {
        errorEl.textContent = '등록 실패: ' + err.message;
        errorEl.classList.remove('d-none');
    } finally {
        saveBtn.disabled = false;
    }
}

// ─── 삭제 모달 ─────────────────────────────────────────────────────

function openDeleteModal(account) {
    AppState.deleteTargetId = account.id;
    document.getElementById('delete-account-name').textContent = account.name;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('csp-account-delete-modal')).show();
}

function initDeleteModal() {
    document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
        if (!AppState.deleteTargetId) return;
        const btn = document.getElementById('delete-confirm-btn');
        btn.disabled = true;
        try {
            await webconsolejs["common/api/services/csp_accounts_api"].deleteCspAccount(AppState.deleteTargetId);
            bootstrap.Modal.getInstance(document.getElementById('csp-account-delete-modal')).hide();
            showToast('success', '계정이 삭제되었습니다.');
            if (AppState.selectedAccountId === AppState.deleteTargetId) {
                closeDetailPanel();
            }
            AppState.deleteTargetId = null;
            await loadCspAccounts();
        } catch (err) {
            showToast('error', '삭제 실패: ' + err.message);
        } finally {
            btn.disabled = false;
        }
    });
}

// ─── 상세 패널 ─────────────────────────────────────────────────────

async function loadCspAccountDetail(accountId) {
    AppState.selectedAccountId = accountId;
    AppState.isEditMode = false;

    try {
        const account = await webconsolejs["common/api/services/csp_accounts_api"].getCspAccountById(accountId);
        renderDetailPanel(account);
        openDetailPanel();
    } catch (err) {
        showToast('error', '상세 정보를 불러오지 못했습니다: ' + err.message);
    }
}

function openDetailPanel() {
    const listCol = document.getElementById('csp-accounts-list-col');
    const detailPanel = document.getElementById('csp-account-detail-panel');
    listCol.classList.remove('col-12');
    listCol.classList.add('col-md-6');
    detailPanel.classList.remove('d-none');
}

function closeDetailPanel() {
    const listCol = document.getElementById('csp-accounts-list-col');
    const detailPanel = document.getElementById('csp-account-detail-panel');
    listCol.classList.remove('col-md-6');
    listCol.classList.add('col-12');
    detailPanel.classList.add('d-none');
    AppState.selectedAccountId = null;
    AppState.isEditMode = false;
}

function renderDetailPanel(account) {
    document.getElementById('detail-panel-title').textContent = account.name;

    // 상태 제어 버튼
    const statusControl = document.getElementById('detail-status-control');
    if (account.is_active) {
        statusControl.innerHTML = `<button type="button" class="btn btn-sm btn-outline-warning" id="detail-status-toggle-btn" data-active="true">Deactivate</button>`;
    } else {
        statusControl.innerHTML = `<button type="button" class="btn btn-sm btn-outline-success" id="detail-status-toggle-btn" data-active="false">Activate</button>`;
    }
    document.getElementById('detail-status-toggle-btn').addEventListener('click', () => toggleStatus(account));

    // 본문 렌더링 (읽기 모드)
    renderDetailBody(account, false);

    // Edit 버튼 이벤트
    document.getElementById('detail-edit-btn').onclick = () => enterEditMode(account);
    document.getElementById('detail-delete-btn').onclick = () => openDeleteModal(account);
    document.getElementById('detail-save-btn').onclick = () => saveEdit(account.id);
    document.getElementById('detail-cancel-btn').onclick = () => renderDetailPanel(account);
    document.getElementById('detail-validate-btn').onclick = () => validateAccount(account.id);
}

function renderDetailBody(account, editMode) {
    const body = document.getElementById('detail-panel-body');

    const cspBadge = CSP_TYPE_BADGE[account.csp_type] || account.csp_type;
    const statusBadge = account.is_active
        ? '<span class="badge bg-success-lt">Active</span>'
        : '<span class="badge bg-secondary-lt">Inactive</span>';

    if (!editMode) {
        // 읽기 모드
        const accountInfoRows = Object.entries(account.account_info || {}).map(([k, v]) => {
            const displayVal = SENSITIVE_FIELDS.includes(k) ? '****' : escapeHtml(v);
            return `<tr><th class="w-40">${escapeHtml(k)}</th><td>${displayVal}</td></tr>`;
        }).join('');

        body.innerHTML = `
            <table class="table table-sm card-table mb-3">
                <tbody>
                    <tr><th class="w-40">CSP 타입</th><td>${cspBadge}</td></tr>
                    <tr><th>상태</th><td>${statusBadge}</td></tr>
                    <tr><th>설명</th><td>${account.description || '-'}</td></tr>
                </tbody>
            </table>
            <div class="mb-3">
                <div class="fw-medium mb-2">Account Info</div>
                <table class="table table-sm card-table">
                    <tbody>${accountInfoRows}</tbody>
                </table>
            </div>
            <table class="table table-sm card-table">
                <tbody>
                    <tr><th class="w-40">등록일</th><td>${account.created_at ? account.created_at.replace('T', ' ').substring(0, 19) : '-'}</td></tr>
                    <tr><th>수정일</th><td>${account.updated_at ? account.updated_at.replace('T', ' ').substring(0, 19) : '-'}</td></tr>
                </tbody>
            </table>`;

        document.getElementById('detail-edit-btn').classList.remove('d-none');
        document.getElementById('detail-save-btn').classList.add('d-none');
        document.getElementById('detail-cancel-btn').classList.add('d-none');
    } else {
        // 편집 모드
        body.innerHTML = `
            <div class="mb-3">
                <label class="form-label required">계정 이름</label>
                <input type="text" class="form-control" id="edit-name" value="${account.name}">
            </div>
            <div class="mb-3">
                <label class="form-label">CSP 타입</label>
                <input type="text" class="form-control" value="${account.csp_type}" readonly>
            </div>
            <div id="edit-account-info-fields"></div>
            <div class="mb-3">
                <label class="form-label">설명</label>
                <textarea class="form-control" id="edit-description" rows="2">${account.description || ''}</textarea>
            </div>
            <div id="edit-error-msg" class="alert alert-danger d-none"></div>`;

        renderAccountInfoFields(account.csp_type, document.getElementById('edit-account-info-fields'), account.account_info || {});

        document.getElementById('detail-edit-btn').classList.add('d-none');
        document.getElementById('detail-save-btn').classList.remove('d-none');
        document.getElementById('detail-cancel-btn').classList.remove('d-none');
    }
}

function enterEditMode(account) {
    AppState.isEditMode = true;
    renderDetailBody(account, true);
}

async function saveEdit(accountId) {
    const nameEl = document.getElementById('edit-name');
    const descEl = document.getElementById('edit-description');
    const errorEl = document.getElementById('edit-error-msg');

    const name = nameEl ? nameEl.value.trim() : '';
    if (!name) {
        if (errorEl) {
            errorEl.textContent = '계정 이름은 필수입니다.';
            errorEl.classList.remove('d-none');
        }
        return;
    }

    // 현재 CSP 타입으로 account_info 수집
    const currentAccount = AppState.accounts.find(a => a.id === accountId);
    const cspType = currentAccount ? currentAccount.csp_type : '';
    const accountInfo = collectAccountInfoValues(cspType);

    const saveBtn = document.getElementById('detail-save-btn');
    saveBtn.disabled = true;

    try {
        const updated = await webconsolejs["common/api/services/csp_accounts_api"].updateCspAccount(accountId, {
            name,
            account_info: accountInfo,
            description: descEl ? descEl.value.trim() : '',
        });
        showToast('success', '저장되었습니다.');
        await loadCspAccounts();
        // 업데이트된 데이터로 상세 패널 다시 렌더링
        const refreshed = await webconsolejs["common/api/services/csp_accounts_api"].getCspAccountById(accountId);
        renderDetailPanel(refreshed);
    } catch (err) {
        if (errorEl) {
            errorEl.textContent = '저장 실패: ' + err.message;
            errorEl.classList.remove('d-none');
        } else {
            showToast('error', '저장 실패: ' + err.message);
        }
    } finally {
        saveBtn.disabled = false;
    }
}

async function toggleStatus(account) {
    const isActive = account.is_active;
    const action = isActive ? '비활성화' : '활성화';
    if (!confirm(`계정을 ${action}하시겠습니까?`)) return;

    try {
        if (isActive) {
            await webconsolejs["common/api/services/csp_accounts_api"].deactivateCspAccount(account.id);
        } else {
            await webconsolejs["common/api/services/csp_accounts_api"].activateCspAccount(account.id);
        }
        showToast('success', `계정이 ${action}되었습니다.`);
        await loadCspAccounts();
        const refreshed = await webconsolejs["common/api/services/csp_accounts_api"].getCspAccountById(account.id);
        renderDetailPanel(refreshed);
    } catch (err) {
        showToast('error', `${action} 실패: ` + err.message);
    }
}

async function validateAccount(accountId) {
    const btn = document.getElementById('detail-validate-btn');
    const spinner = document.getElementById('validate-spinner');
    btn.disabled = true;
    spinner.classList.remove('d-none');

    try {
        await webconsolejs["common/api/services/csp_accounts_api"].validateCspAccount(accountId);
        showToast('success', '계정 자격증명이 유효합니다.');
    } catch (err) {
        showToast('error', '유효성 검증 실패: ' + err.message);
    } finally {
        btn.disabled = false;
        spinner.classList.add('d-none');
    }
}

// ─── 토스트 ────────────────────────────────────────────────────────

function showToast(type, message) {
    // Tabler 토스트 활용 (또는 alert fallback)
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const id = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
    const html = `
        <div id="${id}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>`;
    toastContainer.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const toast = new bootstrap.Toast(el, { delay: 4000 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

function createToastContainer() {
    const div = document.createElement('div');
    div.id = 'toast-container';
    div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    div.style.zIndex = '9999';
    document.body.appendChild(div);
    return div;
}

// ─── 초기화 ────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async function () {
    // page-header 버튼 삽입
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        btnList.innerHTML = `
            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#csp-account-create-modal">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Account
            </button>`;
    }

    // 상세 패널 닫기
    document.getElementById('detail-panel-close-btn').addEventListener('click', closeDetailPanel);

    // 테이블 초기화
    initTable();

    // 필터 초기화
    initCspTypeFilter();

    // 모달 초기화
    initCreateModal();
    initDeleteModal();

    // 목록 로드
    await loadCspAccounts();
});
