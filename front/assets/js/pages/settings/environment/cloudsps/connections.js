import { TabulatorFull as Tabulator } from "tabulator-tables";

const PROVIDER_BADGE_MAP = {
    aws: 'bg-orange-lt', gcp: 'bg-blue-lt', azure: 'bg-indigo-lt',
    alibaba: 'bg-red-lt', tencent: 'bg-cyan-lt', ibm: 'bg-dark-lt',
};

function providerBadge(name) {
    if (!name) return '-';
    const lower = name.toLowerCase();
    const cls = PROVIDER_BADGE_MAP[lower] || 'bg-secondary-lt';
    return `<span class="badge ${cls}">${name.toUpperCase()}</span>`;
}

const AppState = {
    connTable: null,
    holders: [],
};

// ─── Detail Panel ──────────────────────────────────────────────────────

const DetailPanel = {
    show(conn) {
        document.getElementById('conn-detail-name').textContent = `[${conn.configName}]`;
        document.getElementById('conn-detail-configname').textContent = conn.configName || '-';
        document.getElementById('conn-detail-provider').innerHTML = providerBadge(conn.providerName);
        document.getElementById('conn-detail-holder').textContent = conn.credentialHolder || '-';
        document.getElementById('conn-detail-region').textContent = conn.regionZoneInfo?.assignedRegion || '-';
        document.getElementById('conn-detail-zone').textContent = conn.regionZoneInfo?.assignedZone || '-';
        document.getElementById('conn-detail-verified').innerHTML = conn.verified
            ? '<span class="badge bg-success-lt">Verified</span>'
            : '<span class="badge bg-danger-lt">Unverified</span>';
        document.getElementById('conn-detail-representative').innerHTML = conn.regionRepresentative
            ? '<span class="badge bg-primary-lt">Yes</span>'
            : '<span class="badge bg-secondary-lt">No</span>';
        const panel = document.getElementById('conn-detail-panel');
        bootstrap.Collapse.getOrCreateInstance(panel).show();
    },

    hide() {
        bootstrap.Collapse.getOrCreateInstance(document.getElementById('conn-detail-panel')).hide();
    },
};

// ─── Table ─────────────────────────────────────────────────────────────

const TableManager = {
    init(data) {
        if (AppState.connTable) {
            AppState.connTable.replaceData(data);
            return;
        }
        AppState.connTable = new Tabulator("#connection-table", {
            data,
            layout: "fitColumns",
            height: "400px",
            placeholder: "조건에 맞는 Connection Config가 없습니다.",
            columns: [
                {
                    title: "Config Name",
                    field: "configName",
                    headerSort: true,
                },
                {
                    title: "Provider",
                    field: "providerName",
                    width: 120,
                    formatter: cell => providerBadge(cell.getValue()),
                },
                {
                    title: "Holder",
                    field: "credentialHolder",
                    width: 130,
                },
                {
                    title: "Region",
                    field: "regionZoneInfo",
                    formatter: cell => {
                        const v = cell.getValue();
                        return v?.assignedRegion || '-';
                    },
                },
                {
                    title: "Zone",
                    field: "regionZoneInfo",
                    width: 160,
                    formatter: cell => {
                        const v = cell.getValue();
                        return v?.assignedZone || '-';
                    },
                },
                {
                    title: "Verified",
                    field: "verified",
                    width: 100,
                    hozAlign: "center",
                    formatter: cell => cell.getValue()
                        ? '<span class="badge bg-success-lt">OK</span>'
                        : '<span class="badge bg-danger-lt">Fail</span>',
                },
                {
                    title: "Rep.",
                    field: "regionRepresentative",
                    width: 70,
                    hozAlign: "center",
                    formatter: cell => cell.getValue()
                        ? '<span class="badge bg-primary-lt">★</span>'
                        : '',
                    headerTooltip: "Region Representative",
                },
            ],
        });

        AppState.connTable.on("rowClick", (e, row) => {
            DetailPanel.show(row.getData());
        });
    },
};

// ─── Load & Filter ─────────────────────────────────────────────────────

async function loadConnections() {
    const holder = document.getElementById('filter-holder')?.value || '';
    const verified = document.getElementById('filter-verified')?.checked;
    const rep = document.getElementById('filter-representative')?.checked;

    const filters = {};
    if (holder) filters.filterCredentialHolder = holder;
    if (verified !== undefined) filters.filterVerified = verified;
    if (rep !== undefined) filters.filterRegionRepresentative = rep;

    try {
        const conns = await webconsolejs["common/api/services/cloudconnection_api"].listConnConfigs(filters);
        TableManager.init(conns);
        DetailPanel.hide();
    } catch (e) {
        console.error('Connection Config 조회 실패:', e);
        webconsolejs["partials/layout/toast"].showToast('Connection 목록을 불러오지 못했습니다.', 'error');
        TableManager.init([]);
    }
}

async function loadHolderFilter() {
    try {
        const holders = await webconsolejs["common/api/services/cloudconnection_api"].listCredentialHolders();
        AppState.holders = holders;
        const select = document.getElementById('filter-holder');
        if (!select) return;
        select.innerHTML = '<option value="">All Holders</option>';
        holders.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h.credentialHolder;
            opt.textContent = h.credentialHolder;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Holder 필터 로드 실패:', e);
    }
}

// ─── Export ────────────────────────────────────────────────────────────

export async function applyFilters() {
    await loadConnections();
}

// ─── DOMContentLoaded ──────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async function () {
    // 필터 변경 시 자동 새로고침
    document.getElementById('filter-verified')?.addEventListener('change', loadConnections);
    document.getElementById('filter-representative')?.addEventListener('change', loadConnections);

    await loadHolderFilter();
    await loadConnections();
});
