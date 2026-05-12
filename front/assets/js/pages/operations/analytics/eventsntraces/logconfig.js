import { TabulatorFull as Tabulator } from "tabulator-tables";

const DOM = {
    logconfigTable: document.getElementById('logconfig-table'),
    mciSelect: document.getElementById('logconfig-mci-select'),
    targetSelect: document.getElementById('logconfig-target-select'),
};

const AppState = {
    configs: [],
    selectedMciId: null,
    selectedTargetId: null,
    tables: { logconfigTable: null },
};

// ─── TableManager ──────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        if (AppState.tables.logconfigTable) {
            AppState.tables.logconfigTable.replaceData(data);
            return;
        }
        AppState.tables.logconfigTable = new Tabulator('#logconfig-table', {
            data,
            layout: 'fitColumns',
            placeholder: 'No Log Config Entries. Select a workload and server.',
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
                { title: 'Log Path', field: 'path', sorter: 'string' },
                { title: 'Type', field: 'logType', sorter: 'string', formatter(cell) {
                    const v = cell.getValue();
                    return v ? `<span class="badge bg-azure-lt">${v}</span>` : '-';
                }},
                { title: 'Tag', field: 'tag', sorter: 'string' },
                { title: 'Status', field: 'status', sorter: 'string', formatter(cell) {
                    const v = cell.getValue() || 'active';
                    const cls = v === 'active' ? 'bg-success-lt' : 'bg-secondary-lt';
                    return `<span class="badge ${cls}">${v}</span>`;
                }},
                {
                    title: 'Actions',
                    headerSort: false,
                    formatter(cell) {
                        return '<button class="btn btn-sm btn-ghost-danger">Remove</button>';
                    },
                    cellClick(e, cell) {
                        LogConfigManager.removeConfig(cell.getRow().getData());
                    },
                    width: 100,
                },
            ],
        });
    },
};

// ─── LogConfigManager ──────────────────────────────────────────────

const LogConfigManager = {
    async loadMciList() {
        try {
            const workspace = await webconsolejs["partials/layout/navbar"].workspaceProjectInit
                ? webconsolejs["partials/layout/navbar"].workspaceProjectInit()
                : { nsId: 'system' };
            const nsId = (workspace && workspace.nsId) ? workspace.nsId : 'system';
            const respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(nsId);
            const mciList = (respMciList && respMciList.infra) ? respMciList.infra : [];

            if (DOM.mciSelect) {
                DOM.mciSelect.innerHTML = '<option value="">Select Workload</option>';
                mciList.forEach(mci => {
                    const opt = document.createElement('option');
                    opt.value = mci.id;
                    opt.textContent = mci.name || mci.id;
                    DOM.mciSelect.appendChild(opt);
                });
            }
        } catch (e) {
            console.error('MCI 목록 조회 실패:', e);
        }
    },

    async loadVmList(mciId) {
        if (!mciId) {
            if (DOM.targetSelect) DOM.targetSelect.innerHTML = '<option value="">Select Server</option>';
            return;
        }
        try {
            const workspace = { nsId: 'system' };
            const respMci = await webconsolejs["common/api/services/mci_api"].getMci(workspace.nsId, mciId);
            const vms = (respMci && respMci.vm) ? respMci.vm : [];

            if (DOM.targetSelect) {
                DOM.targetSelect.innerHTML = '<option value="">Select Server</option>';
                vms.forEach(vm => {
                    const opt = document.createElement('option');
                    opt.value = vm.id;
                    opt.textContent = vm.name || vm.id;
                    DOM.targetSelect.appendChild(opt);
                });
            }
        } catch (e) {
            console.error('VM 목록 조회 실패:', e);
        }
    },

    async loadLogConfig() {
        const mciId = DOM.mciSelect ? DOM.mciSelect.value : '';
        const targetId = DOM.targetSelect ? DOM.targetSelect.value : '';

        if (!mciId || !targetId) {
            webconsolejs['common/util'].showToast('Please select a workload and server.', 'warning');
            return;
        }

        AppState.selectedMciId = mciId;
        AppState.selectedTargetId = targetId;

        try {
            const response = await webconsolejs["common/api/http"].commonAPIPost(
                '/api/mc-observability/GetLogConfig',
                { pathParams: { mciId, targetId } }
            );
            const configs = (response && response.data && response.data.responseData)
                ? (Array.isArray(response.data.responseData) ? response.data.responseData : [])
                : [];
            AppState.configs = configs;
            TableManager.initTable(configs);
        } catch (e) {
            console.error('로그 설정 조회 실패:', e);
            TableManager.initTable([]);
        }
    },

    async addLogConfig() {
        if (!webconsolejs['common/utils/formvalidation'].validateForm('logconfig-add-form')) return;

        const path = document.getElementById('logconfig-path').value.trim();
        const logType = document.getElementById('logconfig-type').value;
        const tag = document.getElementById('logconfig-tag').value.trim();

        if (!AppState.selectedMciId || !AppState.selectedTargetId) {
            webconsolejs['common/util'].showToast('Please select a workload and server first.', 'warning');
            return;
        }

        try {
            await webconsolejs["common/api/http"].commonAPIPost(
                '/api/mc-observability/AddLogConfig',
                {
                    pathParams: { mciId: AppState.selectedMciId, targetId: AppState.selectedTargetId },
                    request: { path, logType, tag },
                }
            );
            webconsolejs['common/util'].showToast('Log config added successfully.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('logconfig-add-modal')).hide();
            await LogConfigManager.loadLogConfig();
        } catch (e) {
            webconsolejs['common/util'].showToast('Failed to add log config: ' + e.message, 'error');
        }
    },

    async removeConfig(config) {
        if (!confirm(`Remove log config for path "${config.path}"?`)) return;
        try {
            await webconsolejs["common/api/http"].commonAPIPost(
                '/api/mc-observability/RemoveLogConfig',
                {
                    pathParams: {
                        mciId: AppState.selectedMciId,
                        targetId: AppState.selectedTargetId,
                        configId: String(config.id || config.path),
                    },
                }
            );
            webconsolejs['common/util'].showToast('Log config removed.', 'success');
            await LogConfigManager.loadLogConfig();
        } catch (e) {
            webconsolejs['common/util'].showToast('Remove failed: ' + e.message, 'error');
        }
    },
};

// ─── Public exports ──────────────────────────────────────────────────

export function refreshList() {
    LogConfigManager.loadLogConfig();
}

export function loadLogConfig() {
    LogConfigManager.loadLogConfig();
}

export function addLogConfig() {
    LogConfigManager.addLogConfig();
}

// ─── Init ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    LogConfigManager.loadMciList();
    TableManager.initTable([]);

    if (DOM.mciSelect) {
        DOM.mciSelect.addEventListener('change', () => {
            LogConfigManager.loadVmList(DOM.mciSelect.value);
        });
    }
});
