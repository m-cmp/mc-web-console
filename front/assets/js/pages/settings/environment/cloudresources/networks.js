// VNet(VPC) 관리 페이지 — Create / Import / Filter 기능
// FR-CLOUD-ADMIN-003-01 / RQ-CLOUD-ADMIN-007

import { TabulatorFull as Tabulator } from "tabulator-tables";
import { showToast, TOAST_TYPES } from "../../../../common/utils/toast.js";

const vpcApi    = () => webconsolejs["common/api/services/vpc_api"];
const importApi = () => webconsolejs["common/api/services/import_api"];

// ─── 상태 ─────────────────────────────────────────────────────────────────
const AppState = {
    ns: '',
    tables: { vnetTable: null },
    resources: { selected: null },
    ui: { viewMode: false },
};

let _unmanagedVNets = [];

// ─── 페이지 초기화 ────────────────────────────────────────────────────────

// 프로젝트 변경 시 재조회
$('#select-current-project').on('change', async function () {
    if (this.value === '') return;
    const project = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
    AppState.ns = project?.NsId || '';
    if (AppState.ns) await loadVNetList();
});

document.addEventListener('DOMContentLoaded', async function () {
    // page-header: + Create VPC 버튼
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        btnList.innerHTML = `
            <button type="button" class="btn btn-primary"
              data-bs-toggle="modal" data-bs-target="#create-vpc-modal">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
                viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 5l0 14"/><path d="M5 12l14 0"/>
              </svg>
              Create VPC
            </button>`;
    }

    const selectedWorkspaceProject = await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
    webconsolejs['partials/layout/modal'].checkWorkspaceSelection(selectedWorkspaceProject);

    AppState.ns = selectedWorkspaceProject.nsId || '';
    initFilter();

    if (selectedWorkspaceProject.projectId !== '') {
        await loadVNetList();
    }
});

// ─── VNet 목록 로드 ──────────────────────────────────────────────────────

export async function loadVNetList() {
    if (!AppState.ns) return;
    try {
        const data = await vpcApi().getAllVNet(AppState.ns);
        const vNets = data?.vNet || (Array.isArray(data) ? data : []);
        if (AppState.tables.vnetTable) {
            AppState.tables.vnetTable.replaceData(vNets);
        } else {
            initTable(vNets);
        }
    } catch (err) {
        console.error('VNet 목록 조회 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'VNet 목록 조회에 실패했습니다.');
    }
}

// ─── Tabulator 테이블 ─────────────────────────────────────────────────────

function initTable(vNets) {
    AppState.tables.vnetTable = new Tabulator('#vnet-list-table', {
        data: vNets,
        layout: 'fitColumns',
        placeholder: '등록된 VNet이 없습니다.',
        pagination: 'local',
        paginationSize: 10,
        paginationSizeSelector: [10, 20, 50],
        paginationCounter: 'rows',
        movableColumns: true,
        initialSort: [{ column: 'name', dir: 'asc' }],
        columns: [
            { title: '이름',           field: 'name',           widthGrow: 2, sorter: 'string' },
            { title: 'Connection',     field: 'connectionName', widthGrow: 1, sorter: 'string' },
            { title: 'CIDR',           field: 'cidrBlock',      widthGrow: 1 },
            { title: 'Subnet 수',      field: 'subnetInfoList',
              formatter: (cell) => `${(cell.getValue() || []).length}개`,
              hozAlign: 'center', width: 100 },
            { title: 'CSP Resource ID', field: 'cspResourceId', widthGrow: 2 },
        ],
    });

    AppState.tables.vnetTable.on('rowClick', async function (e, row) {
        const data = row.getData();
        AppState.resources.selected = data;
        renderDetail(data);
        showDetail();
        // GetVNet으로 subnet 등 상세 정보 추가 로드
        try {
            const detail = await vpcApi().get(AppState.ns, data.name);
            if (detail) {
                AppState.resources.selected = detail;
                renderDetail(detail);
            }
        } catch (err) {
            console.error('VNet 상세 조회 실패:', err);
        }
    });
}

// ─── Detail Panel ─────────────────────────────────────────────────────────

function renderDetail(data) {
    document.getElementById('detail-name').textContent      = data.name || '-';
    document.getElementById('detail-vnet-name').textContent = data.name || '-';
    document.getElementById('detail-vnet-connection').textContent = data.connectionName || '-';
    document.getElementById('detail-vnet-cidr').textContent = data.cidrBlock || '-';
    document.getElementById('detail-vnet-csp-id').textContent = data.cspResourceId || '-';

    const subnets = data.subnetInfoList || [];
    const tbody = document.getElementById('detail-subnet-tbody');
    const emptyEl = document.getElementById('detail-subnet-empty');
    const tableWrap = document.getElementById('detail-subnet-table-wrap');

    tbody.innerHTML = '';
    if (subnets.length === 0) {
        emptyEl.classList.remove('d-none');
        tableWrap.classList.add('d-none');
    } else {
        emptyEl.classList.add('d-none');
        tableWrap.classList.remove('d-none');
        for (const s of subnets) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.name || '-'}</td>
                <td>${s.ipv4_cidr || s.ipv4CIDR || s.cidr || '-'}</td>
                <td>${s.zone || '-'}</td>
                <td><code>${s.cspResourceId || '-'}</code></td>`;
            tbody.appendChild(tr);
        }
    }
}

function showDetail() {
    const el = document.getElementById('view-mode-cards');
    if (el) el.classList.add('show');
    AppState.ui.viewMode = true;
}

export function hideDetail() {
    const el = document.getElementById('view-mode-cards');
    if (el) el.classList.remove('show');
    AppState.ui.viewMode = false;
    AppState.resources.selected = null;
}

export async function confirmDeleteVNet() {
    const selected = AppState.resources.selected;
    if (!selected) return;
    if (!confirm(`VPC "${selected.name}"을 삭제하시겠습니까?`)) return;
    try {
        await vpcApi().del(AppState.ns, selected.name);
        showToast(TOAST_TYPES.SUCCESS, `VPC "${selected.name}" 삭제 완료`);
        hideDetail();
        await loadVNetList();
    } catch (err) {
        console.error('VPC 삭제 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'VPC 삭제에 실패했습니다: ' + (err.message || ''));
    }
}

// ─── Filter (Tabulator 내장 setFilter) ───────────────────────────────────

function initFilter() {
    const fieldEl = document.getElementById('filter-field');
    const typeEl  = document.getElementById('filter-type');
    const valueEl = document.getElementById('filter-value');
    if (!fieldEl || !typeEl || !valueEl) return;

    function updateFilter() {
        const field = fieldEl.value;
        const type  = typeEl.value;
        if (field && AppState.tables.vnetTable) {
            AppState.tables.vnetTable.setFilter(field, type, valueEl.value);
        }
    }

    fieldEl.addEventListener('change', updateFilter);
    typeEl.addEventListener('change', updateFilter);
    valueEl.addEventListener('keyup', updateFilter);

    document.getElementById('filter-clear').addEventListener('click', function () {
        fieldEl.value = '';
        typeEl.value  = 'like';
        valueEl.value = '';
        if (AppState.tables.vnetTable) AppState.tables.vnetTable.clearFilter();
    });
}

// ─── Create VPC 모달 ─────────────────────────────────────────────────────

document.getElementById('create-vpc-modal')?.addEventListener('show.bs.modal', async function () {
    document.getElementById('create-vpc-name').value = '';
    document.getElementById('create-vpc-cidr').value = '';
    document.getElementById('create-vpc-subnet-list').innerHTML = '';
    await _loadConnectionOptions('create-vpc-connection');
    addSubnetRow();
});

export function addSubnetRow() {
    const list = document.getElementById('create-vpc-subnet-list');
    const idx = list.children.length;
    const row = document.createElement('div');
    row.className = 'row g-2 mb-2 align-items-center subnet-row';
    row.innerHTML = `
        <div class="col-md-5">
          <input type="text" class="form-control form-control-sm subnet-name"
            placeholder="Subnet 이름 (예: subnet-${idx + 1})">
        </div>
        <div class="col-md-5">
          <input type="text" class="form-control form-control-sm subnet-cidr"
            placeholder="CIDR (예: 10.0.${idx}.0/24)">
        </div>
        <div class="col-md-2">
          <button type="button" class="btn btn-sm btn-outline-danger w-100"
            onclick="this.closest('.subnet-row').remove()">삭제</button>
        </div>`;
    list.appendChild(row);
}

export async function executeCreateVNet() {
    const connectionName = document.getElementById('create-vpc-connection').value;
    const name           = document.getElementById('create-vpc-name').value.trim();
    const cidrBlock      = document.getElementById('create-vpc-cidr').value.trim();

    if (!connectionName || !name || !cidrBlock) {
        showToast(TOAST_TYPES.WARNING, 'Connection, VPC 이름, CIDR은 필수입니다.');
        return;
    }

    const subnetInfoList = [];
    document.querySelectorAll('#create-vpc-subnet-list .subnet-row').forEach(row => {
        const subName = row.querySelector('.subnet-name')?.value.trim();
        const subCidr = row.querySelector('.subnet-cidr')?.value.trim();
        if (subName && subCidr) subnetInfoList.push({ name: subName, ipv4_cidr: subCidr });
    });

    const spinner = document.getElementById('create-vpc-spinner');
    const btn     = document.getElementById('create-vpc-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    try {
        await vpcApi().create(AppState.ns, { connectionName, name, cidrBlock, subnetInfoList });
        showToast(TOAST_TYPES.SUCCESS, `VPC "${name}" 생성 완료`);
        bootstrap.Modal.getInstance(document.getElementById('create-vpc-modal'))?.hide();
        await loadVNetList();
    } catch (err) {
        console.error('VPC 생성 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'VPC 생성에 실패했습니다: ' + (err.message || ''));
    } finally {
        spinner.classList.add('d-none');
        btn.disabled = false;
    }
}

// ─── Import VNet 모달 ─────────────────────────────────────────────────────

export async function openImportVNetModal() {
    const project = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
    AppState.ns = project?.NsId || '';
    if (!AppState.ns) {
        showToast(TOAST_TYPES.WARNING, '프로젝트를 먼저 선택하세요.');
        return;
    }

    document.getElementById('import-vnet-project').value = AppState.ns;
    document.getElementById('import-vnet-list-area').classList.add('d-none');
    document.getElementById('import-vnet-empty').classList.add('d-none');
    document.getElementById('import-vnet-tbody').innerHTML = '';
    _unmanagedVNets = [];

    await _loadConnectionOptions('import-vnet-connection');
    new bootstrap.Modal(document.getElementById('import-vnet-modal')).show();
}

async function _loadConnectionOptions(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">선택하세요</option>';
    try {
        const result = await webconsolejs['common/api/http'].commonAPIPost(
            '/api/mc-infra-manager/GetConnConfigList', {}
        );
        const list = result?.data?.responseData?.connectionconfig || [];
        for (const conn of list) {
            const opt = document.createElement('option');
            opt.value = conn.configName;
            opt.textContent = conn.configName;
            select.appendChild(opt);
        }
    } catch (err) {
        console.error('Connection 목록 로드 실패:', err);
    }
}

export async function loadUnmanagedVNets() {
    const connectionName = document.getElementById('import-vnet-connection').value;
    if (!connectionName) {
        showToast(TOAST_TYPES.WARNING, 'Connection을 선택하세요.');
        return;
    }

    document.getElementById('import-vnet-loading').classList.remove('d-none');
    document.getElementById('import-vnet-list-area').classList.add('d-none');
    document.getElementById('import-vnet-empty').classList.add('d-none');

    try {
        const [cspVNets, registeredVNets] = await Promise.all([
            importApi().getCspVNets(connectionName),
            importApi().getRegisteredVNets(AppState.ns),
        ]);

        const registeredIds = new Set(registeredVNets.map(v => v.cspResourceId));
        const unmanaged = cspVNets.filter(v => !registeredIds.has(v.id || v.cspResourceId));
        const managed   = cspVNets.filter(v =>  registeredIds.has(v.id || v.cspResourceId));

        _unmanagedVNets = unmanaged;
        _renderUnmanagedVNetTable(unmanaged, managed);
    } catch (err) {
        console.error('미관리 VNet 조회 실패:', err);
        showToast(TOAST_TYPES.ERROR, '미관리 VNet 조회에 실패했습니다: ' + (err.message || ''));
    } finally {
        document.getElementById('import-vnet-loading').classList.add('d-none');
    }
}

function _renderUnmanagedVNetTable(unmanaged, managed) {
    const tbody = document.getElementById('import-vnet-tbody');
    tbody.innerHTML = '';

    if (unmanaged.length === 0 && managed.length === 0) {
        document.getElementById('import-vnet-empty').classList.remove('d-none');
        return;
    }

    for (const v of unmanaged) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="form-check-input import-vnet-check"
              data-id="${v.id || v.cspResourceId}" data-name="${v.name || v.id}" data-cidr="${v.cidrBlock || ''}"></td>
            <td>${v.name || v.id}</td>
            <td>${v.cidrBlock || '-'}</td>
            <td><code>${v.id || '-'}</code></td>
            <td><span class="badge bg-warning-lt">● 미관리</span></td>`;
        tbody.appendChild(tr);
    }
    for (const v of managed) {
        const tr = document.createElement('tr');
        tr.className = 'text-muted';
        tr.innerHTML = `
            <td><input type="checkbox" class="form-check-input" disabled></td>
            <td>${v.name || v.id}</td>
            <td>${v.cidrBlock || '-'}</td>
            <td><code>${v.id || '-'}</code></td>
            <td><span class="badge bg-success-lt">✓ 등록됨</span></td>`;
        tbody.appendChild(tr);
    }

    document.getElementById('import-vnet-list-area').classList.remove('d-none');
    document.getElementById('import-vnet-select-all').onchange = function () {
        document.querySelectorAll('.import-vnet-check').forEach(cb => cb.checked = this.checked);
    };
}

export async function executeImportVNets() {
    const connectionName = document.getElementById('import-vnet-connection').value;
    const checked = Array.from(document.querySelectorAll('.import-vnet-check:checked'));

    if (checked.length === 0) {
        showToast(TOAST_TYPES.WARNING, 'Import할 VNet을 선택하세요.');
        return;
    }

    const spinner = document.getElementById('import-vnet-spinner');
    const btn     = document.getElementById('import-vnet-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    let successCount = 0, skipCount = 0, failCount = 0;
    for (const cb of checked) {
        try {
            await importApi().registerCspVNet(AppState.ns, connectionName, cb.dataset.id, cb.dataset.name);
            successCount++;
        } catch (err) {
            err.response?.status === 409 ? skipCount++ : failCount++;
            if (err.response?.status !== 409) console.error(`VNet ${cb.dataset.name} 등록 실패:`, err);
        }
    }

    spinner.classList.add('d-none');
    btn.disabled = false;

    let msg = `VNet ${successCount}개 등록 완료`;
    if (skipCount > 0) msg += `, ${skipCount}개 이미 등록됨`;
    if (failCount > 0) msg += `, ${failCount}개 실패`;
    showToast(failCount > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS, msg);

    bootstrap.Modal.getInstance(document.getElementById('import-vnet-modal'))?.hide();
    await loadVNetList();
}

// ─── webconsolejs 등록 ────────────────────────────────────────────────────
if (typeof webconsolejs === 'undefined') { window.webconsolejs = {}; }
webconsolejs['pages/settings/environment/cloudresources/networks'] = {
    loadVNetList,
    openImportVNetModal,
    loadUnmanagedVNets,
    executeImportVNets,
    addSubnetRow,
    executeCreateVNet,
    hideDetail,
    confirmDeleteVNet,
};
