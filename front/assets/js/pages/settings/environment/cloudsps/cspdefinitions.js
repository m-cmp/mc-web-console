import { TabulatorFull as Tabulator } from "tabulator-tables";

const AppState = {
    csps: {},
    selected: null,
    tables: { cspTable: null },
};

var checked_array = [];

const PROVIDER_BADGE = {
    aws: '<span class="badge bg-orange-lt">AWS</span>',
    gcp: '<span class="badge bg-blue-lt">GCP</span>',
    azure: '<span class="badge bg-indigo-lt">Azure</span>',
    alibaba: '<span class="badge bg-yellow-lt">Alibaba</span>',
    ncp: '<span class="badge bg-green-lt">NCP</span>',
    ibm: '<span class="badge bg-purple-lt">IBM</span>',
    nhn: '<span class="badge bg-cyan-lt">NHN</span>',
    kt: '<span class="badge bg-teal-lt">KT</span>',
    openstack: '<span class="badge bg-red-lt">OpenStack</span>',
    tencent: '<span class="badge bg-red-lt">Tencent</span>',
};

function getProviderBadge(provider) {
    if (!provider) return '-';
    return PROVIDER_BADGE[provider.toLowerCase()] || `<span class="badge bg-secondary-lt">${provider}</span>`;
}

// cloudPlatform이 비어 있으면 provider 자신이 플랫폼이다
// (tumblebug도 RegisterCloudPlatform(providerName, providerName)으로 같게 처리한다).
function cloudPlatformOf(csp) {
    return csp.cloudPlatform || csp.providerName || '-';
}

// axios가 4xx/5xx에서 throw하므로 백엔드 메시지는 error.response.data에서 꺼내야 한다.
function errorMessage(err, fallback) {
    return err?.response?.data?.responseData?.message
        || err?.response?.data?.message
        || err?.message
        || fallback;
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── UIManager ──────────────────────────────────────────────────────

const UIManager = {
    showViewMode(csp) {
        const createSection = document.getElementById('cspcreate');
        if (createSection && createSection.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(createSection).hide();
        }
        document.getElementById('view-mode-cards').classList.add('show');
        this.updateDetail(csp);
    },

    hideViewMode() {
        document.getElementById('view-mode-cards').classList.remove('show');
        AppState.selected = null;
    },

    updateDetail(csp) {
        AppState.selected = csp;

        const nameLabel = document.getElementById('csp-info-name-label');
        const nameText = document.getElementById('csp-info-name-text');
        if (nameLabel) nameLabel.style.display = '';
        if (nameText) nameText.textContent = csp.providerName || '';

        document.getElementById('csp-info-provider').innerHTML = getProviderBadge(csp.providerName);
        document.getElementById('csp-info-driver').textContent = csp.driver || '-';
        document.getElementById('csp-info-platform').textContent = cloudPlatformOf(csp);
        document.getElementById('csp-info-description').textContent = csp.description || '-';

        const regions = csp.regions || {};
        const rows = Object.keys(regions).sort().map((key) => {
            const region = regions[key] || {};
            const zones = Array.isArray(region.zones) ? region.zones.join(', ') : '-';
            return `<tr>
                <td>${escapeHtml(region.regionId || key)}</td>
                <td>${escapeHtml(region.regionName || '-')}</td>
                <td>${escapeHtml(zones || '-')}</td>
            </tr>`;
        });

        document.getElementById('csp-info-regions').innerHTML = rows.length
            ? rows.join('')
            : '<tr><td colspan="3" class="text-secondary">No regions</td></tr>';
    },
};

// ─── RegionFormManager ─────────────────────────────────────────────

const RegionFormManager = {
    addRow() {
        const container = document.getElementById('region-rows');
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'row g-2 mb-2 region-row';
        row.innerHTML = `
            <div class="col-md-4">
                <input type="text" class="form-control region-id" placeholder="e.g. ap-northeast-2">
            </div>
            <div class="col-md-7">
                <input type="text" class="form-control region-zones" placeholder="Comma-separated, e.g. ap-northeast-2a, ap-northeast-2c">
            </div>
            <div class="col-md-1 d-flex align-items-center">
                <button type="button" class="btn btn-outline-danger btn-icon region-remove" title="Remove region">-</button>
            </div>`;

        row.querySelector('.region-remove').addEventListener('click', () => {
            RegionFormManager.removeRow(row);
        });

        container.appendChild(row);
        this.syncRemoveButtons();
    },

    removeRow(row) {
        const container = document.getElementById('region-rows');
        if (!container || container.querySelectorAll('.region-row').length <= 1) return;
        row.remove();
        this.syncRemoveButtons();
    },

    // 최소 1개 region이 필요하므로 마지막 한 행의 삭제 버튼은 비활성화한다.
    syncRemoveButtons() {
        const rows = document.querySelectorAll('#region-rows .region-row');
        rows.forEach((row) => {
            row.querySelector('.region-remove').disabled = rows.length <= 1;
        });
    },

    reset() {
        const container = document.getElementById('region-rows');
        if (!container) return;
        container.innerHTML = '';
        this.addRow();
    },

    // 폼 입력을 model.CSPDetail의 regions 맵으로 변환한다.
    // regionName은 서버가 region 키로 덮어쓰므로 보내지 않는다.
    collect() {
        const regions = {};
        document.querySelectorAll('#region-rows .region-row').forEach((row) => {
            const regionId = row.querySelector('.region-id').value.trim();
            const zones = row.querySelector('.region-zones').value
                .split(',')
                .map((z) => z.trim())
                .filter((z) => z);

            if (!regionId) return;
            regions[regionId.toLowerCase()] = { regionId, zones };
        });
        return regions;
    },
};

// ─── CspDefinitionManager ──────────────────────────────────────────

const CspDefinitionManager = {
    async loadDefinitions() {
        try {
            const csps = await webconsolejs["common/api/services/cspdefinition_api"].getCloudInfo();
            AppState.csps = csps;
            const rows = Object.entries(csps).map(([providerName, detail]) => ({
                providerName,
                ...detail,
                regionCount: Object.keys(detail.regions || {}).length,
            }));
            TableManager.initTable(rows);
        } catch (e) {
            console.error('CSP 정의 목록 조회 실패:', e);
            webconsolejs["common/util"].showToast('Failed to load CSP definitions.', 'error');
            TableManager.initTable([]);
        }
    },

    async loadCloudPlatforms() {
        try {
            const platforms = await webconsolejs["common/api/services/clouddriver_api"].listCloudOS();
            const select = document.getElementById('create-csp-platform');
            if (!select) return;
            select.innerHTML = '<option value="">Not set</option>';
            platforms.forEach((platform) => {
                const opt = document.createElement('option');
                opt.value = platform;
                opt.textContent = platform;
                select.appendChild(opt);
            });
        } catch (e) {
            console.error('Cloud platform 목록 조회 실패:', e);
        }
    },

    async createDefinition() {
        const providerName = document.getElementById('create-csp-provider').value.trim();
        const driver = document.getElementById('create-csp-driver').value.trim();
        const cloudPlatform = document.getElementById('create-csp-platform').value.trim();
        const description = document.getElementById('create-csp-description').value.trim();
        const regions = RegionFormManager.collect();

        if (!providerName || !driver) {
            webconsolejs["common/util"].showToast('Provider Name and Driver are required.', 'warning');
            return;
        }
        if (!Object.keys(regions).length) {
            webconsolejs["common/util"].showToast('At least one region with a region ID is required.', 'warning');
            return;
        }
        const regionWithoutZone = Object.values(regions).find((r) => !r.zones.length);
        if (regionWithoutZone) {
            webconsolejs["common/util"].showToast(`Region "${regionWithoutZone.regionId}" needs at least one zone.`, 'warning');
            return;
        }

        const cspDetail = { driver, regions };
        if (cloudPlatform) cspDetail.cloudPlatform = cloudPlatform;
        if (description) cspDetail.description = description;

        try {
            await webconsolejs["common/api/services/cspdefinition_api"].registerCspDefinition(providerName, cspDetail);
            webconsolejs["common/util"].showToast(
                'CSP definition registered. Register a credential for this provider to make it usable.', 'success');
            bootstrap.Collapse.getOrCreateInstance(document.getElementById('cspcreate')).hide();
            this.resetForm();
            await this.loadDefinitions();
        } catch (e) {
            console.error('CSP 정의 등록 실패:', e);
            webconsolejs["common/util"].showToast(
                errorMessage(e, 'Failed to register CSP definition.'), 'error');
        }
    },

    // 정적 설정으로 로드된 provider는 백엔드가 거부하므로, 실패 항목을 모아 한 번에 보고한다.
    async deleteDefinitions() {
        if (!checked_array.length) {
            webconsolejs["common/util"].showToast('Please select a CSP definition to delete.', 'warning');
            return;
        }

        const failures = [];
        let deleted = 0;
        for (const csp of checked_array) {
            try {
                await webconsolejs["common/api/services/cspdefinition_api"].unregisterCspDefinition(csp.providerName);
                deleted++;
            } catch (e) {
                failures.push(`${csp.providerName}: ${errorMessage(e, 'failed')}`);
            }
        }

        if (failures.length) {
            webconsolejs["common/util"].showToast(
                `${deleted} deleted, ${failures.length} failed — ${failures.join(' | ')}`, 'error');
        } else {
            webconsolejs["common/util"].showToast('Selected CSP definition(s) deleted.', 'success');
        }

        checked_array = [];
        UIManager.hideViewMode();
        await this.loadDefinitions();
    },

    resetForm() {
        document.getElementById('create-csp-provider').value = '';
        document.getElementById('create-csp-driver').value = '';
        document.getElementById('create-csp-platform').value = '';
        document.getElementById('create-csp-description').value = '';
        RegionFormManager.reset();
    },
};

// ─── TableManager ──────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        if (AppState.tables.cspTable) {
            AppState.tables.cspTable.replaceData(data);
            return;
        }

        const table = new Tabulator("#csp-table", {
            data: data,
            layout: "fitColumns",
            height: "350px",
            placeholder: "No CSP definitions registered.",
            columns: [
                {
                    formatter: "rowSelection",
                    titleFormatter: "rowSelection",
                    hozAlign: "center",
                    headerHozAlign: "center",
                    width: 40,
                    headerSort: false,
                    cellClick(e, cell) { cell.getRow().toggleSelect(); },
                },
                {
                    title: "Provider",
                    field: "providerName",
                    headerSort: true,
                    formatter(cell) { return getProviderBadge(cell.getValue()); },
                },
                {
                    title: "Cloud Platform",
                    field: "cloudPlatform",
                    headerSort: true,
                    formatter(cell) { return cloudPlatformOf(cell.getRow().getData()); },
                },
                { title: "Driver", field: "driver", headerSort: true },
                { title: "Regions", field: "regionCount", width: 110, hozAlign: "center" },
            ],
        });

        table.on("rowClick", function (e, row) {
            UIManager.showViewMode(row.getData());
        });

        table.on("rowSelectionChanged", function (data) {
            checked_array = data;
        });

        AppState.tables.cspTable = table;
    },
};

// ─── Export functions ──────────────────────────────────────────────

export async function refreshDefinitionList() {
    await CspDefinitionManager.loadDefinitions();
}

export async function createDefinition() {
    await CspDefinitionManager.createDefinition();
}

export async function deleteDefinitions() {
    await CspDefinitionManager.deleteDefinitions();
}

export function addRegionRow() {
    RegionFormManager.addRow();
}

// ─── DOMContentLoaded ──────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        btnList.innerHTML = `
            <button type="button" class="btn btn-primary" onclick="
                document.getElementById('view-mode-cards').classList.remove('show');
                bootstrap.Collapse.getOrCreateInstance(document.getElementById('cspcreate')).toggle()
            ">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M12 5l0 14"></path>
                    <path d="M5 12l14 0"></path>
                </svg>
                Add CSP Definition
            </button>`;
    }

    RegionFormManager.reset();
    CspDefinitionManager.loadDefinitions();
    CspDefinitionManager.loadCloudPlatforms();
});
