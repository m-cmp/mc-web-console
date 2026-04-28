import { TabulatorFull as Tabulator } from "tabulator-tables";

const DOM = {
    thresholdTable: document.getElementById('threshold-table'),
    detailPanel: document.getElementById('threshold-detail-panel'),
    detailNameLabel: document.getElementById('threshold-detail-name-label'),
    detailNameText: document.getElementById('threshold-detail-name-text'),
};

const AppState = {
    policies: [],
    selectedPolicy: null,
    tables: { thresholdTable: null },
};

const SEVERITY_BADGE = {
    critical: '<span class="badge bg-danger">Critical</span>',
    high: '<span class="badge bg-orange-lt">High</span>',
    medium: '<span class="badge bg-warning-lt">Medium</span>',
    low: '<span class="badge bg-info-lt">Low</span>',
};

function getSeverityBadge(severity) {
    if (!severity) return '-';
    return SEVERITY_BADGE[severity.toLowerCase()] || `<span class="badge bg-secondary-lt">${severity}</span>`;
}

const METRIC_LABELS = {
    cpu: 'CPU Usage (%)',
    memory: 'Memory Usage (%)',
    disk: 'Disk Usage (%)',
    network_in: 'Network In (bytes/s)',
    network_out: 'Network Out (bytes/s)',
};

function getMetricLabel(metric) {
    return METRIC_LABELS[metric] || metric || '-';
}

// ─── TableManager ──────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        if (AppState.tables.thresholdTable) {
            AppState.tables.thresholdTable.replaceData(data);
            return;
        }
        AppState.tables.thresholdTable = new Tabulator('#threshold-table', {
            data,
            layout: 'fitColumns',
            placeholder: 'No Threshold Policies Found',
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
                { title: 'Policy Name', field: 'name', sorter: 'string' },
                { title: 'Metric', field: 'metric', sorter: 'string', formatter(cell) {
                    return getMetricLabel(cell.getValue());
                }},
                { title: 'Condition', headerSort: false, formatter(cell) {
                    const row = cell.getRow().getData();
                    const op = row.operator || '>';
                    const val = row.value != null ? row.value : '-';
                    return `${op} ${val}`;
                }},
                { title: 'Severity', field: 'severity', formatter(cell) {
                    return getSeverityBadge(cell.getValue());
                }, hozAlign: 'center'},
                { title: 'Duration (s)', field: 'duration', sorter: 'number', hozAlign: 'center' },
                { title: 'Status', field: 'status', formatter(cell) {
                    const v = cell.getValue() || 'active';
                    const cls = v === 'active' ? 'bg-success-lt' : 'bg-secondary-lt';
                    return `<span class="badge ${cls}">${v}</span>`;
                }, hozAlign: 'center'},
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

        document.getElementById('detail-threshold-id').textContent = policy.id || policy.policySeq || '-';
        document.getElementById('detail-threshold-name').textContent = policy.name || '-';
        document.getElementById('detail-threshold-metric').textContent = getMetricLabel(policy.metric);
        document.getElementById('detail-threshold-operator').textContent = policy.operator || '-';
        document.getElementById('detail-threshold-value').textContent = policy.value != null ? policy.value : '-';
        document.getElementById('detail-threshold-severity').innerHTML = getSeverityBadge(policy.severity);
        document.getElementById('detail-threshold-duration').textContent = policy.duration != null ? policy.duration : '-';

        const statusVal = policy.status || 'active';
        const statusCls = statusVal === 'active' ? 'bg-success-lt' : 'bg-secondary-lt';
        document.getElementById('detail-threshold-status').innerHTML = `<span class="badge ${statusCls}">${statusVal}</span>`;

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
            const response = await webconsolejs["common/api/services/eventalarm_api"].getAllPolicy();
            const policies = (response && response.data && response.data.responseData)
                ? (Array.isArray(response.data.responseData) ? response.data.responseData : [])
                : [];
            AppState.policies = policies;
            TableManager.initTable(policies);
        } catch (e) {
            console.error('임계값 정책 목록 조회 실패:', e);
            TableManager.initTable([]);
        }
    },

    async createPolicy() {
        if (!webconsolejs['common/utils/formvalidation'].validateForm('threshold-create-form')) return;

        const name = document.getElementById('create-threshold-name').value.trim();
        const metric = document.getElementById('create-threshold-metric').value;
        const operator = document.getElementById('create-threshold-operator').value;
        const value = parseFloat(document.getElementById('create-threshold-value').value);
        const severity = document.getElementById('create-threshold-severity').value;
        const duration = parseInt(document.getElementById('create-threshold-duration').value || '60', 10);

        try {
            await webconsolejs["common/api/http"].commonAPIPost(
                '/api/mc-observability/Createtriggerpolicy',
                { request: { name, metric, operator, value, severity, duration } }
            );
            webconsolejs['common/util'].showToast('Threshold policy created successfully.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('threshold-create-modal')).hide();
            await PolicyManager.loadPolicies();
        } catch (e) {
            console.error('임계값 정책 생성 실패:', e);
            webconsolejs['common/util'].showToast('Failed to create policy: ' + e.message, 'error');
        }
    },

    async deleteSelected() {
        if (!AppState.selectedPolicy) return;
        const id = AppState.selectedPolicy.id || AppState.selectedPolicy.policySeq;
        if (!confirm(`Delete policy "${AppState.selectedPolicy.name}"?`)) return;
        try {
            await webconsolejs["common/api/http"].commonAPIPost(
                '/api/mc-observability/Deletetriggerpolicy',
                { pathParams: { policySeq: String(id) } }
            );
            webconsolejs['common/util'].showToast('Policy deleted.', 'success');
            UIManager.hideDetail();
            await PolicyManager.loadPolicies();
        } catch (e) {
            webconsolejs['common/util'].showToast('Delete failed: ' + e.message, 'error');
        }
    },

    editSelected() {
        webconsolejs['common/util'].showToast('Edit functionality coming soon.', 'info');
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

export function editSelected() {
    PolicyManager.editSelected();
}

export function hideDetail() {
    UIManager.hideDetail();
}

// ─── Init ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    PolicyManager.loadPolicies();
});
