import { TabulatorFull as Tabulator } from "tabulator-tables";

const DOM = {
    credentialTable: document.getElementById('credential-table'),
    detailPanel: document.getElementById('credential-detail-panel'),
    detailNameLabel: document.getElementById('credential-detail-name-label'),
    detailNameText: document.getElementById('credential-detail-name-text'),
};

const AppState = {
    credentials: [],
    selectedCredential: null,
    tables: { credentialTable: null },
};

const PROVIDER_BADGE = {
    AWS: '<span class="badge bg-orange-lt">AWS</span>',
    GCP: '<span class="badge bg-blue-lt">GCP</span>',
    AZURE: '<span class="badge bg-indigo-lt">Azure</span>',
};

function getProviderBadge(provider) {
    if (!provider) return '-';
    const key = (provider || '').toUpperCase();
    return PROVIDER_BADGE[key] || `<span class="badge bg-secondary-lt">${provider}</span>`;
}

function getActiveBadge(active) {
    return active
        ? '<span class="badge bg-success-lt">Active</span>'
        : '<span class="badge bg-secondary-lt">Inactive</span>';
}

// ─── TableManager ──────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        if (AppState.tables.credentialTable) {
            AppState.tables.credentialTable.replaceData(data);
            return;
        }
        AppState.tables.credentialTable = new Tabulator('#credential-table', {
            data,
            layout: 'fitColumns',
            placeholder: 'No CSP Accounts Found',
            pagination: 'local',
            paginationSize: 10,
            paginationSizeSelector: [10, 20, 50],
            paginationCounter: 'rows',
            columns: [
                {
                    formatter: 'rowSelection',
                    titleFormatter: 'rowSelection',
                    hozAlign: 'center',
                    headerSort: false,
                    width: 40,
                    cellClick(e, cell) { cell.getRow().toggleSelect(); },
                },
                { title: 'ID', field: 'id', sorter: 'number', width: 80 },
                { title: 'Name', field: 'name', sorter: 'string' },
                {
                    title: 'Provider',
                    field: 'cspType',
                    formatter(cell) { return getProviderBadge(cell.getValue()); },
                },
                {
                    title: 'Active',
                    field: 'isActive',
                    formatter(cell) { return getActiveBadge(cell.getValue()); },
                    hozAlign: 'center',
                    width: 100,
                },
                { title: 'Created At', field: 'createdAt', sorter: 'string', formatter(cell) {
                    const v = cell.getValue();
                    return v ? new Date(v).toLocaleString() : '-';
                }},
            ],
            rowClick(e, row) {
                UIManager.showDetail(row.getData());
            },
        });
    },
};

// ─── UIManager ──────────────────────────────────────────────────────

const UIManager = {
    showDetail(cred) {
        AppState.selectedCredential = cred;

        if (DOM.detailNameLabel) DOM.detailNameLabel.style.display = '';
        if (DOM.detailNameText) DOM.detailNameText.textContent = cred.name || '-';

        document.getElementById('detail-cred-id').textContent = cred.id || '-';
        document.getElementById('detail-cred-name').textContent = cred.name || '-';
        document.getElementById('detail-cred-provider').innerHTML = getProviderBadge(cred.cspType);
        document.getElementById('detail-cred-status').textContent = cred.status || '-';
        document.getElementById('detail-cred-active').innerHTML = getActiveBadge(cred.isActive);
        document.getElementById('detail-cred-created').textContent = cred.createdAt
            ? new Date(cred.createdAt).toLocaleString()
            : '-';

        if (DOM.detailPanel) DOM.detailPanel.style.display = '';
    },

    hideDetail() {
        AppState.selectedCredential = null;
        if (DOM.detailPanel) DOM.detailPanel.style.display = 'none';
    },
};

// ─── CspAccountManager ──────────────────────────────────────────────

const CspAccountManager = {
    async loadAccounts() {
        try {
            const accounts = await webconsolejs["common/api/services/csp_accounts_api"].listCspAccounts();
            AppState.credentials = Array.isArray(accounts) ? accounts : [];
            TableManager.initTable(AppState.credentials);
        } catch (e) {
            console.error('CSP 계정 목록 조회 실패:', e);
            TableManager.initTable([]);
        }
    },

    async createAccount() {
        const nameEl = document.getElementById('create-cred-name');
        const providerEl = document.getElementById('create-cred-provider');
        const dataEl = document.getElementById('create-cred-data');

        if (!webconsolejs['common/utils/formvalidation'].validateForm('credential-create-form')) return;

        let credData;
        try {
            credData = JSON.parse(dataEl.value);
        } catch (e) {
            webconsolejs['common/util'].showToast('Invalid JSON in Credential Data field.', 'error');
            dataEl.classList.add('is-invalid');
            return;
        }

        try {
            await webconsolejs["common/api/services/csp_accounts_api"].createCspAccount({
                name: nameEl.value.trim(),
                cspType: providerEl.value,
                credential: credData,
            });
            webconsolejs['common/util'].showToast('CSP Account created successfully.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('credential-create-modal')).hide();
            await CspAccountManager.loadAccounts();
        } catch (e) {
            console.error('CSP 계정 생성 실패:', e);
            webconsolejs['common/util'].showToast('Failed to create CSP Account: ' + e.message, 'error');
        }
    },

    async validateSelected() {
        if (!AppState.selectedCredential) return;
        try {
            await webconsolejs["common/api/services/csp_accounts_api"].validateCspAccount(AppState.selectedCredential.id);
            webconsolejs['common/util'].showToast('CSP Account validated successfully.', 'success');
        } catch (e) {
            webconsolejs['common/util'].showToast('Validation failed: ' + e.message, 'error');
        }
    },

    async deleteSelected() {
        if (!AppState.selectedCredential) return;
        if (!confirm(`Delete CSP Account "${AppState.selectedCredential.name}"?`)) return;
        try {
            await webconsolejs["common/api/services/csp_accounts_api"].deleteCspAccount(AppState.selectedCredential.id);
            webconsolejs['common/util'].showToast('CSP Account deleted.', 'success');
            UIManager.hideDetail();
            await CspAccountManager.loadAccounts();
        } catch (e) {
            webconsolejs['common/util'].showToast('Delete failed: ' + e.message, 'error');
        }
    },
};

// ─── Public exports ──────────────────────────────────────────────────

export function refreshCredentialList() {
    CspAccountManager.loadAccounts();
}

export function createCredential() {
    CspAccountManager.createAccount();
}

export function validateSelected() {
    CspAccountManager.validateSelected();
}

export function deleteSelected() {
    CspAccountManager.deleteSelected();
}

export function hideDetail() {
    UIManager.hideDetail();
}

// ─── Init ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    CspAccountManager.loadAccounts();
});
