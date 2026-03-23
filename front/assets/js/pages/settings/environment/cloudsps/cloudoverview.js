import { TabulatorFull as Tabulator } from "tabulator-tables";

// DOM 요소 캐싱
const DOM = {
    cspTable: document.getElementById('csp-accounts-table'),
    viewModeCards: document.getElementById('view-mode-cards'),
    cspInfoNameLabel: document.getElementById('csp-info-name-label'),
    cspInfoNameText: document.getElementById('csp-info-name-text'),
    cspInfoName: document.getElementById('csp-info-name'),
    cspInfoType: document.getElementById('csp-info-type'),
    cspInfoStatus: document.getElementById('csp-info-status'),
    cspInfoDescription: document.getElementById('csp-info-description'),
    cspInfoCreated: document.getElementById('csp-info-created'),
    cspInfoUpdated: document.getElementById('csp-info-updated'),
    toggleStatusBtn: document.getElementById('csp-toggle-status-btn'),
    filterType: document.getElementById('csp-filter-type'),
    filterStatus: document.getElementById('csp-filter-status'),
    filterClear: document.getElementById('csp-filter-clear'),
    createCspType: document.getElementById('create-csp-type'),
    createCspName: document.getElementById('create-csp-name'),
    createCspDescription: document.getElementById('create-csp-description'),
    createFieldsAws: document.getElementById('create-fields-aws'),
    createFieldsGcp: document.getElementById('create-fields-gcp'),
    createFieldsAzure: document.getElementById('create-fields-azure'),
};

// 중앙화된 상태 관리 객체
const AppState = {
    csp: {
        list: [],
        selectedAccount: null,
    },
    ui: {
        viewMode: false,
    },
    tables: {
        cspTable: null,
    },
};

// 선택된 행들을 관리하는 배열 (users.js와 동일한 패턴)
var checked_array = [];

const CSP_TYPE_BADGE = {
    aws: '<span class="badge bg-orange-lt">AWS</span>',
    gcp: '<span class="badge bg-blue-lt">GCP</span>',
    azure: '<span class="badge bg-indigo-lt">Azure</span>',
};

// ─── UIManager ──────────────────────────────────────────────────────

const UIManager = {
    showViewMode(account) {
        // Add CSP 폼이 열려 있으면 닫기
        const createSection = document.getElementById('cspcreate');
        if (createSection && createSection.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(createSection).hide();
        }
        DOM.viewModeCards.classList.add('show');
        AppState.ui.viewMode = true;
        this.updateCspDetail(account);
    },

    hideViewMode() {
        DOM.viewModeCards.classList.remove('show');
        AppState.ui.viewMode = false;
        AppState.csp.selectedAccount = null;
        this.clearCspDetail();
    },

    updateCspDetail(account) {
        AppState.csp.selectedAccount = account;

        // name label in card header
        if (DOM.cspInfoNameLabel) {
            DOM.cspInfoNameLabel.style.display = '';
        }
        if (DOM.cspInfoNameText) {
            DOM.cspInfoNameText.textContent = account.name || '';
        }

        // datagrid fields
        if (DOM.cspInfoName) DOM.cspInfoName.textContent = account.name || '';
        if (DOM.cspInfoType) {
            DOM.cspInfoType.innerHTML = CSP_TYPE_BADGE[account.csp_type] || account.csp_type || '';
        }
        if (DOM.cspInfoStatus) {
            DOM.cspInfoStatus.innerHTML = account.is_active
                ? '<span class="badge bg-success-lt">Active</span>'
                : '<span class="badge bg-secondary-lt">Inactive</span>';
        }
        if (DOM.cspInfoDescription) DOM.cspInfoDescription.textContent = account.description || '';
        if (DOM.cspInfoCreated) {
            DOM.cspInfoCreated.textContent = account.created_at
                ? account.created_at.replace('T', ' ').substring(0, 19)
                : '';
        }
        if (DOM.cspInfoUpdated) {
            DOM.cspInfoUpdated.textContent = account.updated_at
                ? account.updated_at.replace('T', ' ').substring(0, 19)
                : '';
        }

        // toggle button label
        if (DOM.toggleStatusBtn) {
            DOM.toggleStatusBtn.textContent = account.is_active ? 'Deactivate' : 'Activate';
            DOM.toggleStatusBtn.className = account.is_active
                ? 'btn btn-outline-warning'
                : 'btn btn-outline-success';
        }
    },

    clearCspDetail() {
        if (DOM.cspInfoNameLabel) DOM.cspInfoNameLabel.style.display = 'none';
        if (DOM.cspInfoNameText) DOM.cspInfoNameText.textContent = '';
        if (DOM.cspInfoName) DOM.cspInfoName.textContent = '';
        if (DOM.cspInfoType) DOM.cspInfoType.textContent = '';
        if (DOM.cspInfoStatus) DOM.cspInfoStatus.textContent = '';
        if (DOM.cspInfoDescription) DOM.cspInfoDescription.textContent = '';
        if (DOM.cspInfoCreated) DOM.cspInfoCreated.textContent = '';
        if (DOM.cspInfoUpdated) DOM.cspInfoUpdated.textContent = '';
    },
};

// ─── CspManager ─────────────────────────────────────────────────────

const CspManager = {
    async loadAccounts(filter = {}) {
        const accounts = await webconsolejs["common/api/services/csp_accounts_api"].listCspAccounts(filter);
        AppState.csp.list = accounts || [];
        return AppState.csp.list;
    },

    async getAccountById(id) {
        return await webconsolejs["common/api/services/csp_accounts_api"].getCspAccountById(id);
    },

    async createAccount(payload) {
        return await webconsolejs["common/api/services/csp_accounts_api"].createCspAccount(payload);
    },

    async deleteAccounts(ids) {
        for (const id of ids) {
            await webconsolejs["common/api/services/csp_accounts_api"].deleteCspAccount(id);
        }
    },

    async validateAccount(id) {
        return await webconsolejs["common/api/services/csp_accounts_api"].validateCspAccount(id);
    },

    async activateAccount(id) {
        return await webconsolejs["common/api/services/csp_accounts_api"].activateCspAccount(id);
    },

    async deactivateAccount(id) {
        return await webconsolejs["common/api/services/csp_accounts_api"].deactivateCspAccount(id);
    },
};

// ─── TableManager ───────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        AppState.tables.cspTable = new Tabulator(DOM.cspTable, {
            data: data || [],
            layout: "fitColumns",
            responsiveLayout: "collapse",
            placeholder: "No CSP accounts found.",
            columns: this.getColumns(),
        });

        // users.js 패턴: 생성 후 이벤트 등록
        AppState.tables.cspTable.on("rowClick", function (e, row) {
            const rowData = row.getData();
            row.toggleSelect();
            getSelectedCspData(rowData.id);
        });

        AppState.tables.cspTable.on("rowSelectionChanged", function (data, rows) {
            // data는 row data 객체 배열 (users.js 패턴)
            checked_array = data;
        });
    },

    getColumns() {
        return [
            {
                formatter: "rowSelection",
                titleFormatter: "rowSelection",
                hozAlign: "center",
                headerSort: false,
                width: 40,
                cellClick: (e, cell) => {
                    cell.getRow().toggleSelect();
                },
            },
            {
                title: "Name", field: "name", widthGrow: 2,
                formatter: (cell) => `<span class="fw-medium">${cell.getValue() || ''}</span>`,
            },
            {
                title: "CSP Type", field: "csp_type", width: 110,
                formatter: (cell) => CSP_TYPE_BADGE[cell.getValue()] || cell.getValue() || '',
            },
            {
                title: "Status", field: "is_active", width: 110,
                formatter: (cell) => cell.getValue()
                    ? '<span class="badge bg-success-lt">Active</span>'
                    : '<span class="badge bg-secondary-lt">Inactive</span>',
            },
            {
                title: "Description", field: "description", widthGrow: 3,
            },
            {
                title: "Created At", field: "created_at", width: 130,
                formatter: (cell) => cell.getValue() ? cell.getValue().substring(0, 10) : '',
            },
        ];
    },

    setData(data) {
        if (AppState.tables.cspTable) {
            AppState.tables.cspTable.setData(data);
        }
    },

    applyFilter() {
        const cspType = DOM.filterType ? DOM.filterType.value : '';
        const statusVal = DOM.filterStatus ? DOM.filterStatus.value : '';

        const filters = [];
        if (cspType) filters.push({ field: "csp_type", type: "=", value: cspType });
        if (statusVal !== '') filters.push({ field: "is_active", type: "=", value: statusVal === 'true' });

        if (AppState.tables.cspTable) {
            AppState.tables.cspTable.setFilter(filters);
        }
    },

    clearFilter() {
        if (DOM.filterType) DOM.filterType.value = '';
        if (DOM.filterStatus) DOM.filterStatus.value = '';
        if (AppState.tables.cspTable) {
            AppState.tables.cspTable.clearFilter();
        }
    },
};

// ─── 상세 조회 (rowClick 핸들러) ─────────────────────────────────────

async function getSelectedCspData(accountId) {
    try {
        const account = await CspManager.getAccountById(accountId);
        UIManager.showViewMode(account);
    } catch (err) {
        console.error('Failed to load CSP account detail:', err);
        alert('Failed to load account details: ' + err.message);
    }
}

// ─── 초기화 ─────────────────────────────────────────────────────────

async function initCspAccounts() {
    try {
        const accounts = await CspManager.loadAccounts();
        TableManager.initTable(accounts);
    } catch (err) {
        console.error('Failed to initialize CSP accounts:', err);
        TableManager.initTable([]);
    }
}

// ─── 필터 이벤트 ─────────────────────────────────────────────────────

function initFilterEvents() {
    if (DOM.filterType) {
        DOM.filterType.addEventListener('change', () => TableManager.applyFilter());
    }
    if (DOM.filterStatus) {
        DOM.filterStatus.addEventListener('change', () => TableManager.applyFilter());
    }
    if (DOM.filterClear) {
        DOM.filterClear.addEventListener('click', () => TableManager.clearFilter());
    }
}

// ─── 등록 폼 CSP 타입 연동 ──────────────────────────────────────────

function initCreateFormEvents() {
    if (!DOM.createCspType) return;
    DOM.createCspType.addEventListener('change', () => {
        const val = DOM.createCspType.value;
        if (DOM.createFieldsAws) DOM.createFieldsAws.style.display = val === 'aws' ? '' : 'none';
        if (DOM.createFieldsGcp) DOM.createFieldsGcp.style.display = val === 'gcp' ? '' : 'none';
        if (DOM.createFieldsAzure) DOM.createFieldsAzure.style.display = val === 'azure' ? '' : 'none';
    });
}

// ─── Export 함수 (webpack library 설정으로 webconsolejs 네임스페이스에 자동 등록) ──

export async function refreshCspList() {
    try {
        const accounts = await CspManager.loadAccounts();
        TableManager.setData(accounts);
        if (AppState.csp.selectedAccount) {
            const refreshed = await CspManager.getAccountById(AppState.csp.selectedAccount.id);
            UIManager.updateCspDetail(refreshed);
        }
    } catch (err) {
        console.error('Failed to refresh CSP list:', err);
        alert('Failed to refresh: ' + err.message);
    }
}

export async function createCspAccount() {
    const cspType = document.getElementById('create-csp-type') ? document.getElementById('create-csp-type').value : '';
    const name = document.getElementById('create-csp-name') ? document.getElementById('create-csp-name').value.trim() : '';
    const description = document.getElementById('create-csp-description') ? document.getElementById('create-csp-description').value.trim() : '';

    if (!cspType || !name) {
        alert('CSP Type and Account Name are required.');
        return;
    }

    const accountInfo = {};
    if (cspType === 'aws') {
        const accessKey = document.getElementById('create-aws-access-key');
        const secretKey = document.getElementById('create-aws-secret-key');
        const region = document.getElementById('create-aws-region');
        if (accessKey && accessKey.value.trim()) accountInfo.access_key_id = accessKey.value.trim();
        if (secretKey && secretKey.value.trim()) accountInfo.secret_access_key = secretKey.value.trim();
        if (region && region.value.trim()) accountInfo.region = region.value.trim();
    } else if (cspType === 'gcp') {
        const projectId = document.getElementById('create-gcp-project-id');
        const clientEmail = document.getElementById('create-gcp-client-email');
        const privateKey = document.getElementById('create-gcp-private-key');
        if (projectId && projectId.value.trim()) accountInfo.project_id = projectId.value.trim();
        if (clientEmail && clientEmail.value.trim()) accountInfo.client_email = clientEmail.value.trim();
        if (privateKey && privateKey.value.trim()) accountInfo.private_key = privateKey.value.trim();
    } else if (cspType === 'azure') {
        const subscriptionId = document.getElementById('create-azure-subscription-id');
        const tenantId = document.getElementById('create-azure-tenant-id');
        const clientId = document.getElementById('create-azure-client-id');
        const clientSecret = document.getElementById('create-azure-client-secret');
        if (subscriptionId && subscriptionId.value.trim()) accountInfo.subscription_id = subscriptionId.value.trim();
        if (tenantId && tenantId.value.trim()) accountInfo.tenant_id = tenantId.value.trim();
        if (clientId && clientId.value.trim()) accountInfo.client_id = clientId.value.trim();
        if (clientSecret && clientSecret.value.trim()) accountInfo.client_secret = clientSecret.value.trim();
    }

    try {
        await CspManager.createAccount({ name, csp_type: cspType, account_info: accountInfo, description });

        // 폼 초기화
        const createType = document.getElementById('create-csp-type');
        const createName = document.getElementById('create-csp-name');
        const createDesc = document.getElementById('create-csp-description');
        const fieldsAws = document.getElementById('create-fields-aws');
        const fieldsGcp = document.getElementById('create-fields-gcp');
        const fieldsAzure = document.getElementById('create-fields-azure');
        if (createType) createType.value = '';
        if (createName) createName.value = '';
        if (createDesc) createDesc.value = '';
        if (fieldsAws) fieldsAws.style.display = 'none';
        if (fieldsGcp) fieldsGcp.style.display = 'none';
        if (fieldsAzure) fieldsAzure.style.display = 'none';

        // cspcreate collapse 닫기
        const cspcreate = document.getElementById('cspcreate');
        if (cspcreate && cspcreate.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(cspcreate).hide();
        }

        // 목록 갱신
        const accounts = await CspManager.loadAccounts();
        TableManager.setData(accounts);
    } catch (err) {
        console.error('Failed to create CSP account:', err);
        alert('Failed to create account: ' + err.message);
    }
}

export async function deleteCspAccounts() {
    if (!checked_array || checked_array.length === 0) {
        alert('Please select at least one account to delete.');
        return;
    }

    // checked_array는 row data 객체 배열 → ID 추출
    const idsToDelete = checked_array.map(item => item.id);

    try {
        await CspManager.deleteAccounts(idsToDelete);

        // 삭제된 계정이 선택 중이면 상세 패널 닫기
        if (AppState.csp.selectedAccount && idsToDelete.includes(AppState.csp.selectedAccount.id)) {
            UIManager.hideViewMode();
        }

        checked_array = [];
        const accounts = await CspManager.loadAccounts();
        TableManager.setData(accounts);
    } catch (err) {
        console.error('Failed to delete CSP accounts:', err);
        alert('Failed to delete: ' + err.message);
    }
}

export async function validateSelectedCsp() {
    if (!AppState.csp.selectedAccount) {
        alert('Please select an account to validate.');
        return;
    }
    try {
        await CspManager.validateAccount(AppState.csp.selectedAccount.id);
        alert('Account credentials are valid.');
    } catch (err) {
        console.error('Validation failed:', err);
        alert('Validation failed: ' + err.message);
    }
}

export async function toggleSelectedCspStatus() {
    if (!AppState.csp.selectedAccount) return;

    const account = AppState.csp.selectedAccount;
    const isActive = account.is_active;

    try {
        if (isActive) {
            await CspManager.deactivateAccount(account.id);
        } else {
            await CspManager.activateAccount(account.id);
        }

        const refreshed = await CspManager.getAccountById(account.id);
        UIManager.updateCspDetail(refreshed);

        const accounts = await CspManager.loadAccounts();
        TableManager.setData(accounts);
    } catch (err) {
        console.error('Failed to toggle CSP status:', err);
        alert('Failed to change status: ' + err.message);
    }
}

// ─── DOMContentLoaded ────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async function () {
    // page-header Add CSP 버튼 삽입 (상세 패널 닫고 등록 폼 토글)
    webconsolejs['partials/layout/navigatePages'].addPageHeaderButton(
        "cspcreate",
        "Add CSP",
        "document.getElementById('view-mode-cards').classList.remove('show'); bootstrap.Collapse.getOrCreateInstance(document.getElementById('cspcreate')).toggle()"
    );

    // 필터 이벤트 초기화
    initFilterEvents();

    // 등록 폼 이벤트 초기화
    initCreateFormEvents();

    // 목록 초기화
    await initCspAccounts();
});
