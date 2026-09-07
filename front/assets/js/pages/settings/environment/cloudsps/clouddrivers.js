import { TabulatorFull as Tabulator } from "tabulator-tables";

// DOM 요소 캐싱
const DOM = {
    driverTable: document.getElementById('driver-table'),
    viewModeCards: document.getElementById('view-mode-cards'),
    driverInfoNameLabel: document.getElementById('driver-info-name-label'),
    driverInfoNameText: document.getElementById('driver-info-name-text'),
    driverInfoDrivername: document.getElementById('driver-info-drivername'),
    driverInfoProvider: document.getElementById('driver-info-provider'),
    driverInfoLib: document.getElementById('driver-info-lib'),
};

const AppState = {
    driver: {
        list: [],
        selectedDriver: null,
    },
    tables: {
        driverTable: null,
    },
};

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

// ─── UIManager ──────────────────────────────────────────────────────

const UIManager = {
    showViewMode(driver) {
        DOM.viewModeCards.classList.add('show');
        this.updateDriverDetail(driver);
    },

    updateDriverDetail(driver) {
        AppState.driver.selectedDriver = driver;

        if (DOM.driverInfoNameLabel) DOM.driverInfoNameLabel.style.display = '';
        if (DOM.driverInfoNameText) DOM.driverInfoNameText.textContent = driver.DriverName || '';

        if (DOM.driverInfoDrivername) DOM.driverInfoDrivername.textContent = driver.DriverName || '-';
        if (DOM.driverInfoProvider) DOM.driverInfoProvider.innerHTML = getProviderBadge(driver.ProviderName);
        if (DOM.driverInfoLib) DOM.driverInfoLib.textContent = driver.DriverLibFileName || '-';
    },
};

// ─── DriverManager ──────────────────────────────────────────────────

const DriverManager = {
    async loadDrivers() {
        try {
            const drivers = await webconsolejs["common/api/services/clouddriver_api"].listCloudDrivers();
            AppState.driver.list = drivers;
            TableManager.initTable(drivers);
        } catch (e) {
            console.error('드라이버 목록 조회 실패:', e);
            webconsolejs["common/util"].showToast('Failed to load driver list.', 'error');
            TableManager.initTable([]);
        }
    },
};

// ─── TableManager ──────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        if (AppState.tables.driverTable) {
            AppState.tables.driverTable.replaceData(data);
            return;
        }

        const table = new Tabulator("#driver-table", {
            data: data,
            layout: "fitColumns",
            height: "350px",
            placeholder: "No drivers registered.",
            columns: this.getColumns(),
        });

        table.on("rowClick", function (e, row) {
            UIManager.showViewMode(row.getData());
        });

        AppState.tables.driverTable = table;
    },

    getColumns() {
        return [
            {
                title: "Driver Name",
                field: "DriverName",
                headerSort: true,
            },
            {
                title: "Provider",
                field: "ProviderName",
                width: 150,
                formatter: function (cell) {
                    return getProviderBadge(cell.getValue());
                },
            },
            {
                title: "Driver Library",
                field: "DriverLibFileName",
                headerSort: true,
            },
        ];
    },
};

// ─── Export functions ──────────────────────────────────────────────

export async function refreshDriverList() {
    await DriverManager.loadDrivers();
}

// ─── DOMContentLoaded ──────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
    DriverManager.loadDrivers();
});
