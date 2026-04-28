import { TabulatorFull as Tabulator } from "tabulator-tables";

const DOM = {
    accesscontrolTable: document.getElementById('accesscontrol-table'),
    detailPanel: document.getElementById('accesscontrol-detail-panel'),
    detailNameLabel: document.getElementById('accesscontrol-detail-name-label'),
    detailNameText: document.getElementById('accesscontrol-detail-name-text'),
};

const AppState = {
    policies: [],
    selectedPolicy: null,
    tables: { accesscontrolTable: null },
};

function getEffectBadge(effect) {
    if (!effect) return '-';
    const cls = effect === 'Allow' ? 'bg-success-lt' : 'bg-danger-lt';
    return `<span class="badge ${cls}">${effect}</span>`;
}

// ─── TableManager ──────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        if (AppState.tables.accesscontrolTable) {
            AppState.tables.accesscontrolTable.replaceData(data);
            return;
        }
        AppState.tables.accesscontrolTable = new Tabulator('#accesscontrol-table', {
            data,
            layout: 'fitColumns',
            placeholder: 'No Access Control Policies Found',
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
                { title: 'Policy Name', field: 'name', sorter: 'string' },
                {
                    title: 'Effect',
                    field: 'effect',
                    formatter(cell) { return getEffectBadge(cell.getValue()); },
                    hozAlign: 'center',
                    width: 100,
                },
                { title: 'Description', field: 'description', sorter: 'string' },
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
    showDetail(policy) {
        AppState.selectedPolicy = policy;

        if (DOM.detailNameLabel) DOM.detailNameLabel.style.display = '';
        if (DOM.detailNameText) DOM.detailNameText.textContent = policy.name || '-';

        document.getElementById('detail-policy-id').textContent = policy.id || '-';
        document.getElementById('detail-policy-name').textContent = policy.name || '-';
        document.getElementById('detail-policy-effect').innerHTML = getEffectBadge(policy.effect);
        document.getElementById('detail-policy-created').textContent = policy.createdAt
            ? new Date(policy.createdAt).toLocaleString()
            : '-';

        const permsEl = document.getElementById('detail-policy-permissions');
        if (permsEl) {
            const perms = policy.permissions || policy.actions || [];
            if (Array.isArray(perms) && perms.length > 0) {
                permsEl.innerHTML = perms.map(p =>
                    `<span class="badge bg-secondary-lt me-1">${p}</span>`
                ).join('');
            } else {
                permsEl.textContent = '-';
            }
        }

        if (DOM.detailPanel) DOM.detailPanel.style.display = '';
    },

    hideDetail() {
        AppState.selectedPolicy = null;
        if (DOM.detailPanel) DOM.detailPanel.style.display = 'none';
    },
};

// ─── PolicyManager ──────────────────────────────────────────────────

const PolicyManager = {
    async loadPolicies() {
        try {
            const response = await webconsolejs["common/api/http"].commonAPIPost(
                '/api/mc-iam-manager/listPolicy',
                {}
            );
            const policies = (response && response.data && response.data.responseData)
                ? (Array.isArray(response.data.responseData) ? response.data.responseData : [])
                : [];
            AppState.policies = policies;
            TableManager.initTable(policies);
        } catch (e) {
            console.error('접근제어 정책 목록 조회 실패:', e);
            TableManager.initTable([]);
        }
    },

    async createPolicy() {
        if (!webconsolejs['common/utils/formvalidation'].validateForm('access-control-create-form')) return;

        const name = document.getElementById('create-policy-name').value.trim();
        const effect = document.getElementById('create-policy-effect').value;
        const description = document.getElementById('create-policy-description').value.trim();

        try {
            await webconsolejs["common/api/http"].commonAPIPost(
                '/api/mc-iam-manager/createPolicy',
                { request: { name, effect, description } }
            );
            webconsolejs['common/util'].showToast('Policy created successfully.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('access-control-create-modal')).hide();
            await PolicyManager.loadPolicies();
        } catch (e) {
            console.error('정책 생성 실패:', e);
            webconsolejs['common/util'].showToast('Failed to create policy: ' + e.message, 'error');
        }
    },

    async deleteSelected() {
        if (!AppState.selectedPolicy) return;
        if (!confirm(`Delete policy "${AppState.selectedPolicy.name}"?`)) return;
        try {
            await webconsolejs["common/api/http"].commonAPIPost(
                '/api/mc-iam-manager/deletePolicy',
                { pathParams: { policyId: String(AppState.selectedPolicy.id) } }
            );
            webconsolejs['common/util'].showToast('Policy deleted.', 'success');
            UIManager.hideDetail();
            await PolicyManager.loadPolicies();
        } catch (e) {
            webconsolejs['common/util'].showToast('Delete failed: ' + e.message, 'error');
        }
    },
};

// ─── Public exports ──────────────────────────────────────────────────

export function refreshList() {
    PolicyManager.loadPolicies();
}

export function createPolicy() {
    PolicyManager.createPolicy();
}

export function deleteSelected() {
    PolicyManager.deleteSelected();
}

export function hideDetail() {
    UIManager.hideDetail();
}

// ─── Init ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    PolicyManager.loadPolicies();
});
