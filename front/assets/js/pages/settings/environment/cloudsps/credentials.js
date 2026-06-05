import { TabulatorFull as Tabulator } from "tabulator-tables";

const DOM = {
    holderTable: document.getElementById('credential-table'),
    detailPanel: document.getElementById('credential-detail-panel'),
    detailNameLabel: document.getElementById('credential-detail-name-label'),
    detailNameText: document.getElementById('credential-detail-name-text'),
    kvContainer: document.getElementById('kv-list-container'),
};

const AppState = {
    holders: [],
    selectedHolder: null,
    tables: { holderTable: null },
};

// cb-spider가 각 Provider별로 기대하는 Credential key 이름 목록
const PROVIDER_KEYS = {
    aws:       ['ClientId', 'ClientSecret'],
    gcp:       ['ClientEmail', 'PrivateKey', 'ProjectID'],
    azure:     ['ClientId', 'ClientSecret', 'TenantId', 'SubscriptionId'],
    alibaba:   ['ClientId', 'ClientSecret'],
    ncp:       ['ClientId', 'ClientSecret'],
    nhncloud:  ['ClientId', 'ClientSecret', 'TenantId'],
    ktcloud:   ['ClientId', 'ClientSecret'],
};

const PROVIDER_BADGE = {
    aws:   '<span class="badge bg-orange-lt">AWS</span>',
    gcp:   '<span class="badge bg-blue-lt">GCP</span>',
    azure: '<span class="badge bg-indigo-lt">Azure</span>',
};

function getProviderBadge(provider) {
    if (!provider) return '-';
    const key = (provider || '').toLowerCase();
    return PROVIDER_BADGE[key] || `<span class="badge bg-secondary-lt">${provider}</span>`;
}

function getProvidersBadges(providers) {
    if (!providers || !Array.isArray(providers) || providers.length === 0) return '-';
    return providers.map(p => getProviderBadge(p)).join(' ');
}

function getDefaultBadge(isDefault) {
    return isDefault
        ? '<span class="badge bg-blue-lt">Default</span>'
        : '<span class="badge bg-secondary-lt">Custom</span>';
}

// ─── KV Row 관리 ──────────────────────────────────────────────────

const KVManager = {
    addRow(key = '', value = '') {
        const container = document.getElementById('kv-list-container');
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'row g-2 mb-2 kv-row';
        row.innerHTML = `
            <div class="col-5">
                <input type="text" class="form-control kv-key" placeholder="Key" value="${key}" required>
            </div>
            <div class="col-6">
                <input type="text" class="form-control kv-value" placeholder="Value" value="${value}" required>
            </div>
            <div class="col-1 d-flex align-items-center">
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.kv-row').remove()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M18 6l-12 12"></path>
                        <path d="M6 6l12 12"></path>
                    </svg>
                </button>
            </div>`;
        container.appendChild(row);
    },

    getKVList() {
        const rows = document.querySelectorAll('#kv-list-container .kv-row');
        return Array.from(rows).map(row => ({
            key: row.querySelector('.kv-key').value.trim(),
            value: row.querySelector('.kv-value').value.trim(),
        })).filter(kv => kv.key !== '');
    },

    reset() {
        const container = document.getElementById('kv-list-container');
        if (container) container.innerHTML = '';
        KVManager.addRow();
    },
};

// ─── TableManager ──────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        if (AppState.tables.holderTable) {
            AppState.tables.holderTable.replaceData(data);
            return;
        }
        AppState.tables.holderTable = new Tabulator('#credential-table', {
            data,
            layout: 'fitColumns',
            placeholder: 'No Credential Holders Found',
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
                { title: 'Credential Holder', field: 'credentialHolder', sorter: 'string' },
                {
                    title: 'Providers',
                    field: 'providers',
                    formatter(cell) { return getProvidersBadges(cell.getValue()); },
                },
                { title: 'Connections', field: 'connectionCount', sorter: 'number', hozAlign: 'center', width: 120 },
                { title: 'Verified', field: 'verifiedConnectionCount', sorter: 'number', hozAlign: 'center', width: 100 },
                {
                    title: 'Default',
                    field: 'isDefault',
                    formatter(cell) { return getDefaultBadge(cell.getValue()); },
                    hozAlign: 'center',
                    width: 100,
                },
            ],
        });
        AppState.tables.holderTable.on('rowClick', (e, row) => {
            UIManager.showDetail(row.getData());
        });
    },
};

// ─── UIManager ──────────────────────────────────────────────────────

const UIManager = {
    showDetail(holder) {
        AppState.selectedHolder = holder;

        const detailPanel = document.getElementById('credential-detail-panel');
        const detailNameLabel = document.getElementById('credential-detail-name-label');
        const detailNameText = document.getElementById('credential-detail-name-text');

        if (detailNameLabel) detailNameLabel.style.display = '';
        if (detailNameText) detailNameText.textContent = holder.credentialHolder || '-';

        document.getElementById('detail-holder-id').textContent = holder.credentialHolder || '-';
        document.getElementById('detail-holder-provider').innerHTML = getProvidersBadges(holder.providers);
        document.getElementById('detail-holder-connections').textContent = holder.connectionCount ?? '-';
        document.getElementById('detail-holder-verified').textContent = holder.verifiedConnectionCount ?? '-';
        document.getElementById('detail-holder-default').innerHTML = getDefaultBadge(holder.isDefault);

        if (detailPanel) detailPanel.style.display = '';
    },

    hideDetail() {
        AppState.selectedHolder = null;
        const detailPanel = document.getElementById('credential-detail-panel');
        if (detailPanel) detailPanel.style.display = 'none';
    },
};

// ─── CredentialHolderManager ──────────────────────────────────────

const CredentialHolderManager = {
    async loadHolders() {
        try {
            const result = await webconsolejs["common/api/services/credential_holder_api"].getCredentialHolderList();
            const holders = (result && result.credentialHolderList) ? result.credentialHolderList
                : Array.isArray(result) ? result : [];
            AppState.holders = holders;
            TableManager.initTable(AppState.holders);
        } catch (e) {
            console.error('CredentialHolder 목록 조회 실패:', e);
            TableManager.initTable([]);
        }
    },

    async registerCredential() {
        const holderEl = document.getElementById('create-holder-name');
        const providerEl = document.getElementById('create-holder-provider');

        if (!holderEl.value.trim()) {
            holderEl.classList.add('is-invalid');
            return;
        }
        if (!providerEl.value) {
            providerEl.classList.add('is-invalid');
            return;
        }

        const credentialKeyValueList = KVManager.getKVList();
        if (credentialKeyValueList.length === 0) {
            webconsolejs['common/util'].showToast('At least one credential key-value pair is required.', 'error');
            return;
        }

        try {
            await webconsolejs["common/api/services/credential_holder_api"].registerCredential({
                credentialHolder: holderEl.value.trim(),
                providerName: providerEl.value,
                credentialKeyValueList,
            });
            webconsolejs['common/util'].showToast('Credential registered successfully.', 'success');
            bootstrap.Modal.getInstance(document.getElementById('credential-create-modal')).hide();
            await CredentialHolderManager.loadHolders();
        } catch (e) {
            console.error('Credential 등록 실패:', e);
            webconsolejs['common/util'].showToast('Failed to register credential: ' + e.message, 'error');
        }
    },
};

// ─── Public exports ──────────────────────────────────────────────────

export function refreshCredentialList() {
    CredentialHolderManager.loadHolders();
}

export function registerCredential() {
    CredentialHolderManager.registerCredential();
}

export function addKvRow() {
    KVManager.addRow();
}

export function hideDetail() {
    UIManager.hideDetail();
}

// ─── Init ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    KVManager.reset();
    CredentialHolderManager.loadHolders();

    // Provider 선택 시 cb-spider 기대 key 이름으로 KV 행 자동 채우기
    const providerSelect = document.getElementById('create-holder-provider');
    if (providerSelect) {
        providerSelect.addEventListener('change', () => {
            const keys = PROVIDER_KEYS[providerSelect.value];
            const container = document.getElementById('kv-list-container');
            if (!container) return;
            container.innerHTML = '';
            if (keys && keys.length > 0) {
                keys.forEach(key => KVManager.addRow(key, ''));
            } else {
                KVManager.addRow();
            }
        });
    }
});
