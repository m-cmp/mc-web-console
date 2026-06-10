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
    createDriverName: document.getElementById('create-driver-name'),
    createDriverProvider: document.getElementById('create-driver-provider'),
    createDriverLib: document.getElementById('create-driver-lib'),
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

var checked_array = [];

const PROVIDER_BADGE = {
    AWS: '<span class="badge bg-orange-lt">AWS</span>',
    GCP: '<span class="badge bg-blue-lt">GCP</span>',
    AZURE: '<span class="badge bg-indigo-lt">Azure</span>',
};

// ─── UIManager ──────────────────────────────────────────────────────

const UIManager = {
    showViewMode(driver) {
        const createSection = document.getElementById('drivercreate');
        if (createSection && createSection.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(createSection).hide();
        }
        DOM.viewModeCards.classList.add('show');
        this.updateDriverDetail(driver);
    },

    hideViewMode() {
        DOM.viewModeCards.classList.remove('show');
        AppState.driver.selectedDriver = null;
        this.clearDriverDetail();
    },

    updateDriverDetail(driver) {
        AppState.driver.selectedDriver = driver;

        if (DOM.driverInfoNameLabel) DOM.driverInfoNameLabel.style.display = '';
        if (DOM.driverInfoNameText) DOM.driverInfoNameText.textContent = driver.DriverName || '';

        if (DOM.driverInfoDrivername) DOM.driverInfoDrivername.textContent = driver.DriverName || '-';
        if (DOM.driverInfoProvider) {
            const providerName = driver.ProviderName || '-';
            DOM.driverInfoProvider.innerHTML = PROVIDER_BADGE[providerName.toUpperCase()] || `<span class="badge bg-secondary-lt">${providerName}</span>`;
        }
        if (DOM.driverInfoLib) DOM.driverInfoLib.textContent = driver.DriverLibFileName || '-';
    },

    clearDriverDetail() {
        if (DOM.driverInfoNameLabel) DOM.driverInfoNameLabel.style.display = 'none';
        if (DOM.driverInfoNameText) DOM.driverInfoNameText.textContent = '';
        if (DOM.driverInfoDrivername) DOM.driverInfoDrivername.textContent = '';
        if (DOM.driverInfoProvider) DOM.driverInfoProvider.textContent = '';
        if (DOM.driverInfoLib) DOM.driverInfoLib.textContent = '';
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
            webconsolejs["partials/layout/toast"].showToast('Failed to load driver list.', 'error');
            TableManager.initTable([]);
        }
    },

    async loadCloudOS() {
        try {
            const cloudos = await webconsolejs["common/api/services/clouddriver_api"].listCloudOS();
            const select = DOM.createDriverProvider;
            if (!select) return;
            select.innerHTML = '<option value="">Select Provider</option>';
            cloudos.forEach(os => {
                const opt = document.createElement('option');
                opt.value = os;
                opt.textContent = os;
                select.appendChild(opt);
            });
        } catch (e) {
            console.error('CloudOS 목록 조회 실패:', e);
        }
    },

    async createDriver() {
        const name = document.getElementById('create-driver-name')?.value?.trim();
        const provider = document.getElementById('create-driver-provider')?.value?.trim();
        const lib = document.getElementById('create-driver-lib')?.value?.trim();

        if (!name || !provider || !lib) {
            webconsolejs["partials/layout/toast"].showToast('Please fill in all fields.', 'warning');
            return;
        }

        try {
            await webconsolejs["common/api/services/clouddriver_api"].registerCloudDriver({
                DriverName: name,
                ProviderName: provider,
                DriverLibFileName: lib,
            });
            webconsolejs["partials/layout/toast"].showToast('Driver registered successfully.', 'success');
            bootstrap.Collapse.getOrCreateInstance(document.getElementById('drivercreate')).hide();
            await this.loadDrivers();
        } catch (e) {
            console.error('드라이버 등록 실패:', e);
            webconsolejs["partials/layout/toast"].showToast(e.message || 'Failed to register driver.', 'error');
        }
    },

    async deleteDrivers() {
        if (!checked_array.length) {
            webconsolejs["partials/layout/toast"].showToast('Please select a driver to delete.', 'warning');
            return;
        }
        try {
            for (const driver of checked_array) {
                await webconsolejs["common/api/services/clouddriver_api"].unregisterCloudDriver(driver.DriverName);
            }
            webconsolejs["partials/layout/toast"].showToast('Selected driver deleted successfully.', 'success');
            checked_array = [];
            UIManager.hideViewMode();
            await this.loadDrivers();
        } catch (e) {
            console.error('드라이버 삭제 실패:', e);
            webconsolejs["partials/layout/toast"].showToast(e.message || 'Failed to delete driver.', 'error');
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
            const driver = row.getData();
            UIManager.showViewMode(driver);
        });

        table.on("rowSelectionChanged", function (data) {
            checked_array = data;
        });

        AppState.tables.driverTable = table;
    },

    getColumns() {
        return [
            {
                formatter: "rowSelection",
                titleFormatter: "rowSelection",
                hozAlign: "center",
                headerHozAlign: "center",
                width: 40,
                headerSort: false,
            },
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
                    const val = cell.getValue() || '';
                    return PROVIDER_BADGE[val.toUpperCase()] || `<span class="badge bg-secondary-lt">${val}</span>`;
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

export async function createDriver() {
    await DriverManager.createDriver();
}

export async function deleteDrivers() {
    await DriverManager.deleteDrivers();
}

// ─── DOMContentLoaded ──────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
    // 페이지 헤더 버튼 추가
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        btnList.innerHTML = `
            <button type="button" class="btn btn-primary" onclick="
                document.getElementById('view-mode-cards').classList.remove('show');
                bootstrap.Collapse.getOrCreateInstance(document.getElementById('drivercreate')).toggle()
            ">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M12 5l0 14"></path>
                    <path d="M5 12l14 0"></path>
                </svg>
                Add Driver
            </button>`;
    }

    // 초기 데이터 로드
    DriverManager.loadDrivers();
    DriverManager.loadCloudOS();
});
