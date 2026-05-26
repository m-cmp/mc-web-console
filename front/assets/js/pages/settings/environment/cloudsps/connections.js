import { TabulatorFull as Tabulator } from "tabulator-tables";

const DOM = {
    connectionTable: document.getElementById('connection-table'),
    detailPanel: document.getElementById('connection-detail-panel'),
    detailNameLabel: document.getElementById('connection-detail-name-label'),
    detailNameText: document.getElementById('connection-detail-name-text'),
    filterSelect: document.getElementById('filter-credential-holder'),
};

const AppState = {
    connections: [],
    selectedConnection: null,
    tables: { connectionTable: null },
};

const PROVIDER_BADGE = {
    aws:      '<span class="badge bg-orange-lt">AWS</span>',
    gcp:      '<span class="badge bg-blue-lt">GCP</span>',
    azure:    '<span class="badge bg-indigo-lt">Azure</span>',
    alibaba:  '<span class="badge bg-yellow-lt">Alibaba</span>',
    ncp:      '<span class="badge bg-green-lt">NCP</span>',
    nhncloud: '<span class="badge bg-cyan-lt">NHN</span>',
    ktcloud:  '<span class="badge bg-teal-lt">KT</span>',
    tencent:  '<span class="badge bg-red-lt">Tencent</span>',
};

function getProviderBadge(provider) {
    if (!provider) return '-';
    const key = (provider || '').toLowerCase();
    return PROVIDER_BADGE[key] || `<span class="badge bg-secondary-lt">${provider}</span>`;
}

function getVerifiedBadge(verified) {
    return verified
        ? '<span class="badge bg-green-lt">Verified</span>'
        : '<span class="badge bg-secondary-lt">Unverified</span>';
}

// ─── TableManager ──────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        if (AppState.tables.connectionTable) {
            AppState.tables.connectionTable.replaceData(data);
            return;
        }
        AppState.tables.connectionTable = new Tabulator('#connection-table', {
            data,
            layout: 'fitColumns',
            placeholder: 'No Connections Found',
            pagination: 'local',
            paginationSize: 15,
            paginationSizeSelector: [15, 30, 50],
            paginationCounter: 'rows',
            height: '400px',
            columns: [
                {
                    formatter: 'rowSelection',
                    titleFormatter: 'rowSelection',
                    hozAlign: 'center',
                    headerSort: false,
                    width: 40,
                    cellClick(e, cell) { cell.getRow().toggleSelect(); },
                },
                { title: 'Config Name', field: 'configName', sorter: 'string' },
                { title: 'Credential Holder', field: 'credentialHolder', sorter: 'string', width: 160 },
                {
                    title: 'Provider',
                    field: 'providerName',
                    formatter(cell) { return getProviderBadge(cell.getValue()); },
                    width: 110,
                },
                { title: 'Region Zone Info', field: 'regionZoneInfoName', sorter: 'string' },
                {
                    title: 'Verified',
                    field: 'verified',
                    formatter(cell) { return getVerifiedBadge(cell.getValue()); },
                    hozAlign: 'center',
                    width: 110,
                },
            ],
        });
        AppState.tables.connectionTable.on('rowClick', (e, row) => {
            ConnectionManager.loadDetail(row.getData().configName);
        });
    },
};

// ─── UIManager ──────────────────────────────────────────────────────

const UIManager = {
    showDetail(conn) {
        AppState.selectedConnection = conn;

        const detailPanel = document.getElementById('connection-detail-panel');
        const detailNameLabel = document.getElementById('connection-detail-name-label');
        const detailNameText = document.getElementById('connection-detail-name-text');

        if (detailNameLabel) detailNameLabel.style.display = '';
        if (detailNameText) detailNameText.textContent = conn.configName || '-';

        document.getElementById('detail-config-name').textContent = conn.configName || '-';
        document.getElementById('detail-credential-holder').textContent = conn.credentialHolder || '-';
        document.getElementById('detail-credential-name').textContent = conn.credentialName || '-';
        document.getElementById('detail-driver-name').textContent = conn.driverName || '-';
        document.getElementById('detail-provider-name').innerHTML = getProviderBadge(conn.providerName);
        document.getElementById('detail-region-zone-info-name').textContent = conn.regionZoneInfoName || '-';

        const regionDetail = conn.regionDetail || {};
        document.getElementById('detail-region-id').textContent = regionDetail.regionId || '-';
        const zones = Array.isArray(regionDetail.zones) ? regionDetail.zones.join(', ') : (regionDetail.zones || '-');
        document.getElementById('detail-zones').textContent = zones;

        const regionZoneInfo = conn.regionZoneInfo || {};
        document.getElementById('detail-assigned-region').textContent = regionZoneInfo.assignedRegion || '-';
        document.getElementById('detail-assigned-zone').textContent = regionZoneInfo.assignedZone || '-';

        document.getElementById('detail-verified').innerHTML = getVerifiedBadge(conn.verified);
        document.getElementById('detail-region-representative').innerHTML = conn.regionRepresentative
            ? '<span class="badge bg-blue-lt">Yes</span>'
            : '<span class="badge bg-secondary-lt">No</span>';

        if (detailPanel) detailPanel.style.display = '';
    },

    hideDetail() {
        AppState.selectedConnection = null;
        const detailPanel = document.getElementById('connection-detail-panel');
        if (detailPanel) detailPanel.style.display = 'none';
    },
};

// ─── ConnectionManager ──────────────────────────────────────────────

const ConnectionManager = {
    async loadConnections(credentialHolder = '') {
        try {
            const connections = await webconsolejs["common/api/services/connection_config_api"].filterConnConfigByCredentialHolder(credentialHolder);
            AppState.connections = connections;
            TableManager.initTable(connections);
        } catch (e) {
            console.error('Connection 목록 조회 실패:', e);
            TableManager.initTable([]);
        }
    },

    async loadDetail(configName) {
        try {
            const conn = await webconsolejs["common/api/services/connection_config_api"].getConnConfig(configName);
            if (conn) {
                UIManager.showDetail(conn);
            }
        } catch (e) {
            console.error('Connection 상세 조회 실패:', e);
        }
    },

    async populateHolderFilter() {
        try {
            const result = await webconsolejs["common/api/services/credential_holder_api"].getCredentialHolderList();
            const holders = (result && result.credentialHolderList) ? result.credentialHolderList
                : Array.isArray(result) ? result : [];
            const select = DOM.filterSelect;
            if (!select) return;
            holders.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h.credentialHolder;
                opt.textContent = h.credentialHolder;
                select.appendChild(opt);
            });
        } catch (e) {
            console.error('CredentialHolder 목록 조회 실패:', e);
        }
    },
};

// ─── FilterManager ──────────────────────────────────────────────────

const FilterManager = {
    init() {
        const fieldEl = document.getElementById('connection-filter-field');
        const typeEl  = document.getElementById('connection-filter-type');
        const valueEl = document.getElementById('connection-filter-value');
        if (!fieldEl || !typeEl || !valueEl) return;

        function updateFilter() {
            const field = fieldEl.value;
            const type  = typeEl.value;
            if (field && AppState.tables.connectionTable) {
                AppState.tables.connectionTable.setFilter(field, type, valueEl.value);
            }
        }

        fieldEl.addEventListener('change', updateFilter);
        typeEl.addEventListener('change', updateFilter);
        valueEl.addEventListener('keyup', updateFilter);

        document.getElementById('connection-filter-clear')?.addEventListener('click', () => {
            fieldEl.value = '';
            typeEl.value  = 'like';
            valueEl.value = '';
            if (AppState.tables.connectionTable) AppState.tables.connectionTable.clearFilter();
        });
    },
};

// ─── Public exports ──────────────────────────────────────────────────

export function refreshConnectionList() {
    const holder = DOM.filterSelect ? DOM.filterSelect.value : '';
    ConnectionManager.loadConnections(holder);
}

export function hideDetail() {
    UIManager.hideDetail();
}

// ─── Init ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    FilterManager.init();
    await ConnectionManager.populateHolderFilter();
    await ConnectionManager.loadConnections('');

    if (DOM.filterSelect) {
        DOM.filterSelect.addEventListener('change', () => {
            ConnectionManager.loadConnections(DOM.filterSelect.value);
            UIManager.hideDetail();
        });
    }
});
