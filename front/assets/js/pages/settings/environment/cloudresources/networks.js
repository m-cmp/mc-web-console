// VNet(VPC) 관리 페이지 — Create / Import / Filter 기능
// FR-CLOUD-ADMIN-003-01 / RQ-CLOUD-ADMIN-007

import { TabulatorFull as Tabulator } from "tabulator-tables";
import { showToast, TOAST_TYPES } from "../../../../common/utils/toast.js";
import { getProvider, getRegion, populateProviderFilterOptions, populateRegionFilterOptions } from "../../../../common/utils/cspResource.js";
import { usedByCount, usedByBadgeHtml, showAssociatedNodes, cancelAssociatedNodes, extractErrorMessage } from "../../../../common/utils/resourceUsage.js";

const vpcApi    = () => webconsolejs["common/api/services/vpc_api"];
const importApi = () => webconsolejs["common/api/services/import_api"];

// ─── 상태 ─────────────────────────────────────────────────────────────────
const AppState = {
    ns: '',
    tables: { vnetTable: null },
    // subnetUsage: { vNet, counts: Map<subnetId, nodeCount> } — 선택한 VPC의 연관 Node를 해석한 결과
    resources: { selected: null, all: [], subnetUsage: null },
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
        const rawVNets = data?.vNet || (Array.isArray(data) ? data : []);
        const vNets = rawVNets.map((v) => ({ ...v, _provider: getProvider(v), _region: getRegion(v), _usedBy: usedByCount(v) }));
        AppState.resources.all = vNets;
        populateProviderFilterOptions(vNets, 'filter-provider');
        populateRegionFilterOptions(vNets, 'filter-provider', 'filter-region');
        if (AppState.tables.vnetTable) {
            AppState.tables.vnetTable.replaceData(vNets);
        } else {
            initTable(vNets);
        }
    } catch (err) {
        console.error('VNet 목록 조회 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'Failed to load VNet list.');
    }
}

// ─── Tabulator 테이블 ─────────────────────────────────────────────────────

function initTable(vNets) {
    AppState.tables.vnetTable = new Tabulator('#vnet-list-table', {
        data: vNets,
        layout: 'fitColumns',
        placeholder: 'No registered VNets.',
        pagination: 'local',
        paginationSize: 10,
        paginationSizeSelector: [10, 20, 50],
        paginationCounter: 'rows',
        movableColumns: true,
        selectableRows: true, // false로 두면 Tabulator 내부 cap-check 버그(isNaN(false)===false)로 다중선택 자체가 깨진다
        initialSort: [{ column: 'name', dir: 'asc' }],
        columns: [
            { formatter: 'rowSelection', titleFormatter: 'rowSelection', headerSort: false, hozAlign: 'center', width: 40 },
            { title: 'Name',           field: 'name',           widthGrow: 2, sorter: 'string' },
            { title: 'Provider',       field: '_provider',      widthGrow: 1, sorter: 'string' },
            { title: 'Region',         field: '_region',        widthGrow: 1, sorter: 'string' },
            { title: 'CIDR',           field: 'cidrBlock',      widthGrow: 1 },
            { title: 'Subnet Count',      field: 'subnetInfoList',
              formatter: (cell) => `${(cell.getValue() || []).length}`,
              hozAlign: 'center', width: 100 },
            { title: 'Used By',        field: '_usedBy',        sorter: 'number', hozAlign: 'center', width: 120,
              formatter: (cell) => usedByBadgeHtml(cell.getValue()) },
            { title: 'CSP Resource ID', field: 'cspResourceId', widthGrow: 2 },
        ],
    });

    AppState.tables.vnetTable.on('rowClick', async function (e, row) {
        // selectableRows:true는 row 아무데나 클릭해도 체크박스를 토글하는 내장 동작이 있다.
        // 체크박스 자체를 클릭한 게 아니면 그 토글을 즉시 되돌려, row 클릭은 Detail Panel 오픈 전용으로 만든다.
        const clickedCell = row.getCells().find(c => c.getElement().contains(e.target));
        const isCheckboxCol = clickedCell?.getColumn()?.getDefinition()?.formatter === 'rowSelection';
        if (!isCheckboxCol) {
            row.toggleSelect();
        }

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
        await refreshSubnetUsage(AppState.resources.selected);
    });
}

// ─── 연관 Node(Used By) ───────────────────────────────────────────────────

// 연관 Node를 해석해 상세 섹션을 그리고, 그 Node들의 subnetId로 Subnet별 사용 수를 집계한다.
// Subnet은 tumblebug에 자체 연관 목록이 없어 vNet 연관 Node 기준으로 계산한다.
async function refreshSubnetUsage(vNet) {
    if (!vNet) return;
    AppState.resources.subnetUsage = null;
    const rows = await showAssociatedNodes(AppState.ns, vNet, { showSubnet: true });
    if (rows === null || AppState.resources.selected?.name !== vNet.name) return;
    const counts = new Map();
    for (const row of rows) {
        if (row.state !== 'ok' || !row.node.subnetId) continue;
        counts.set(row.node.subnetId, (counts.get(row.node.subnetId) || 0) + 1);
    }
    AppState.resources.subnetUsage = { vNet: vNet.name, counts };
    renderDetail(AppState.resources.selected);
    if (AppState.ui.editMode) _renderEditSubnetTable(AppState.resources.selected.subnetInfoList || []);
}

// 집계 전이면 null — 화면에는 "…"로 표시하고 삭제 버튼은 막아 둔다
function subnetUsedBy(subnet) {
    const usage = AppState.resources.subnetUsage;
    if (!usage || usage.vNet !== AppState.resources.selected?.name) return null;
    return usage.counts.get(subnet.id || subnet.name) || 0;
}

// ─── Detail Panel ─────────────────────────────────────────────────────────

function renderDetail(data) {
    document.getElementById('detail-name').textContent      = data.name || '-';
    document.getElementById('detail-vnet-name').textContent = data.name || '-';
    document.getElementById('detail-vnet-provider').textContent = getProvider(data);
    document.getElementById('detail-vnet-region').textContent = getRegion(data);
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
                <td><code>${s.cspResourceId || '-'}</code></td>
                <td>${subnetUsedByText(s)}</td>`;
            tbody.appendChild(tr);
        }
    }
}

function subnetUsedByText(subnet) {
    const count = subnetUsedBy(subnet);
    return count === null ? '<span class="text-muted">…</span>' : usedByBadgeHtml(count);
}

function showDetail() {
    document.getElementById('edit-mode-cards')?.classList.remove('show');
    AppState.ui.editMode = false;
    const el = document.getElementById('view-mode-cards');
    if (el) el.classList.add('show');
    AppState.ui.viewMode = true;
}

export function hideDetail() {
    cancelAssociatedNodes();
    document.getElementById('view-mode-cards')?.classList.remove('show');
    document.getElementById('edit-mode-cards')?.classList.remove('show');
    AppState.ui.viewMode = false;
    AppState.ui.editMode = false;
    AppState.resources.selected = null;
}

// ─── Edit Mode ────────────────────────────────────────────────────────────

export function showEditMode() {
    const selected = AppState.resources.selected;
    if (!selected) return;

    // read-only 필드 채우기
    document.getElementById('edit-name').textContent       = selected.name || '';
    document.getElementById('edit-vnet-name').value        = selected.name || '';
    document.getElementById('edit-vnet-provider').value  = getProvider(selected);
    document.getElementById('edit-vnet-region').value    = getRegion(selected);
    document.getElementById('edit-vnet-cidr').value        = selected.cidrBlock || '';

    // 기존 Subnet 행 렌더링
    _renderEditSubnetTable(selected.subnetInfoList || []);
    document.getElementById('edit-new-subnet-list').innerHTML = '';

    // 모드 전환
    document.getElementById('view-mode-cards')?.classList.remove('show');
    document.getElementById('edit-mode-cards')?.classList.add('show');
    AppState.ui.viewMode = false;
    AppState.ui.editMode = true;
}

export function cancelEditMode() {
    document.getElementById('edit-mode-cards')?.classList.remove('show');
    document.getElementById('view-mode-cards')?.classList.add('show');
    AppState.ui.editMode = false;
    AppState.ui.viewMode = true;
}

function _renderEditSubnetTable(subnets) {
    const tbody = document.getElementById('edit-subnet-tbody');
    tbody.innerHTML = '';
    for (const s of subnets) {
        const count = subnetUsedBy(s);
        // 사용 중 Subnet은 tumblebug이 삭제를 거부하므로 요청 전에 막는다. 집계 전(null)에도 막아 둔다.
        const blocked = count !== 0;
        const tip = count === null ? 'Checking usage...' : `In use by ${count} node(s)`;
        const tr = document.createElement('tr');
        tr.dataset.subnetId = s.name;
        tr.innerHTML = `
            <td>${s.name || '-'}</td>
            <td>${s.ipv4_cidr || s.ipv4CIDR || s.cidr || '-'}</td>
            <td>${s.zone || '-'}</td>
            <td><code>${s.cspResourceId || '-'}</code></td>
            <td>${subnetUsedByText(s)}</td>
            <td>
              <span ${blocked ? `title="${tip}"` : ''}>
                <button type="button" class="btn btn-sm btn-outline-danger" ${blocked ? 'disabled' : ''}
                  onclick="webconsolejs['pages/settings/environment/cloudresources/networks'].confirmDeleteSubnet('${s.name}')">
                  Delete
                </button>
              </span>
            </td>`;
        tbody.appendChild(tr);
    }
}

export function addEditSubnetRow() {
    const list = document.getElementById('edit-new-subnet-list');
    const idx = list.children.length;
    const row = document.createElement('div');
    row.className = 'row g-2 mb-2 align-items-center new-subnet-row';
    row.innerHTML = `
        <div class="col-md-4">
          <input type="text" class="form-control form-control-sm new-subnet-name"
            placeholder="Subnet name (e.g. subnet-${idx + 1})">
        </div>
        <div class="col-md-4">
          <input type="text" class="form-control form-control-sm new-subnet-cidr"
            placeholder="CIDR (e.g. 10.0.${idx}.0/24)">
        </div>
        <div class="col-md-3">
          <input type="text" class="form-control form-control-sm new-subnet-zone"
            placeholder="Zone (optional)">
        </div>
        <div class="col-md-1">
          <button type="button" class="btn btn-sm btn-outline-danger w-100"
            onclick="this.closest('.new-subnet-row').remove()">✕</button>
        </div>`;
    list.appendChild(row);
}

export function confirmDeleteSubnet(subnetId) {
    const vnetName = AppState.resources.selected?.name;
    if (!vnetName || !subnetId) return;
    webconsolejs['partials/layout/modal'].commonConfirmModal(
        'commonDefaultModal',
        'Delete Subnet',
        `Delete Subnet "${subnetId}"?`,
        'pages/settings/environment/cloudresources/networks.executeDeleteSubnet',
        subnetId
    );
}

export async function executeDeleteSubnet(subnetId) {
    const vnetName = AppState.resources.selected?.name;
    if (!vnetName || !subnetId) return;
    try {
        await vpcApi().delSubnet(AppState.ns, vnetName, subnetId, { suppressErrorToast: true });
        showToast(TOAST_TYPES.SUCCESS, `Subnet "${subnetId}" deleted successfully`);
        // 상태 업데이트 및 UI 갱신
        const detail = await vpcApi().get(AppState.ns, vnetName);
        if (detail) {
            AppState.resources.selected = detail;
            _renderEditSubnetTable(detail.subnetInfoList || []);
        }
    } catch (err) {
        console.error('Subnet Delete 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'Failed to delete Subnet: ' + extractErrorMessage(err));
    }
}

export async function saveVNet() {
    const vnetName = AppState.resources.selected?.name;
    if (!vnetName) return;

    const newRows = Array.from(document.querySelectorAll('#edit-new-subnet-list .new-subnet-row'));
    const toAdd = newRows
        .map(row => ({
            name:      row.querySelector('.new-subnet-name')?.value.trim(),
            ipv4_cidr: row.querySelector('.new-subnet-cidr')?.value.trim(),
            zone:      row.querySelector('.new-subnet-zone')?.value.trim() || undefined,
        }))
        .filter(s => s.name && s.ipv4_cidr);

    if (toAdd.length === 0) {
        showToast(TOAST_TYPES.WARNING, 'No Subnets to add.');
        return;
    }

    const spinner = document.getElementById('edit-save-spinner');
    const btn = document.querySelector('#edit-mode-cards .btn-primary');
    spinner?.classList.remove('d-none');
    if (btn) btn.disabled = true;

    let successCount = 0, failCount = 0;
    for (const subnet of toAdd) {
        try {
            await vpcApi().createSubnet(AppState.ns, vnetName, subnet);
            successCount++;
        } catch (err) {
            failCount++;
            console.error(`Subnet ${subnet.name} 추가 실패:`, err);
        }
    }

    spinner?.classList.add('d-none');
    if (btn) btn.disabled = false;

    if (failCount > 0) {
        showToast(TOAST_TYPES.WARNING, `${successCount} added, ${failCount} failed`);
    } else {
        showToast(TOAST_TYPES.SUCCESS, `${successCount} Subnets added successfully`);
    }

    // 상세 갱신 후 view 모드로 복귀
    const detail = await vpcApi().get(AppState.ns, vnetName);
    if (detail) {
        AppState.resources.selected = detail;
        renderDetail(detail);
    }
    cancelEditMode();
    await loadVNetList();
}

// ─── Table 선택 기반 Edit ─────────────────────────────────────────────────

export async function triggerEditSelected() {
    const table = AppState.tables.vnetTable;
    const selected = table ? table.getSelectedData() : [];
    if (selected.length !== 1) {
        webconsolejs['partials/layout/modal'].commonShowDefaultModal(
            'Validation',
            selected.length === 0
                ? 'Please select a VPC to edit.'
                : 'Please select only one VPC to edit.'
        );
        return;
    }

    const data = selected[0];
    AppState.resources.selected = data;
    // GetVNet으로 최신 subnet 정보까지 로드 후 Edit 모드 진입 (rowClick 핸들러와 동일 패턴)
    try {
        const detail = await vpcApi().get(AppState.ns, data.name);
        if (detail) AppState.resources.selected = detail;
    } catch (err) {
        console.error('VNet 상세 조회 실패:', err);
    }
    showEditMode();
    table.deselectRow();
    // Subnet 삭제 보호를 위해 사용 현황을 집계한다(완료되면 Edit 표를 다시 그림)
    await refreshSubnetUsage(AppState.resources.selected);
}

// ─── 다중선택 삭제 ───────────────────────────────────────────────────────

export function confirmBulkDelete() {
    const table = AppState.tables.vnetTable;
    const selected = table ? table.getSelectedData() : [];
    if (selected.length === 0) {
        webconsolejs['partials/layout/modal'].commonShowDefaultModal(
            'Nothing Selected',
            'Please select at least one item to delete.'
        );
        return;
    }
    // 사용 중 VPC는 요청하지 않는다. withsubnets 삭제는 Subnet을 순서대로 지우다 사용 중 Subnet에서 멈춰
    // 앞서 지운 Subnet이 복구되지 않는 부분 삭제가 생기기 때문이다.
    const inUse = selected.filter((v) => v._usedBy > 0);
    const deletable = selected.filter((v) => !(v._usedBy > 0));
    const inUseLines = inUse.map((v) => `· ${v.name} — used by ${v._usedBy} node(s)`).join('\n');
    if (deletable.length === 0) {
        webconsolejs['partials/layout/modal'].commonShowDefaultModal(
            'Cannot Delete',
            `The selected VPC(s) are in use and cannot be deleted:\n${inUseLines}`
        );
        return;
    }
    AppState.resources.bulkSelected = deletable;
    const skipNote = inUse.length > 0
        ? `\n\n${inUse.length} VPC(s) are in use and will be skipped:\n${inUseLines}`
        : '';
    webconsolejs['partials/layout/modal'].commonConfirmModal(
        'commonDefaultModal',
        'Delete Selected',
        `Delete ${deletable.length} VPC(s)?${skipNote}`,
        'pages/settings/environment/cloudresources/networks.executeBulkDelete'
    );
}

export async function executeBulkDelete() {
    const items = AppState.resources.bulkSelected || [];
    if (items.length === 0) return;
    const results = await Promise.allSettled(
        items.map((item) => vpcApi().del(AppState.ns, item.name, { suppressErrorToast: true }))
    );
    const failures = results
        .map((r, i) => (r.status === 'rejected' ? `· ${items[i].name}: ${extractErrorMessage(r.reason)}` : null))
        .filter(Boolean);
    const succeeded = results.length - failures.length;
    showToast(
        failures.length > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
        `${succeeded} VPC(s) deleted${failures.length > 0 ? `, ${failures.length} failed` : ''}`
    );
    if (failures.length > 0) {
        webconsolejs['partials/layout/modal'].commonShowDefaultModal('Delete Failed', failures.join('\n'));
    }
    AppState.resources.bulkSelected = [];
    AppState.tables.vnetTable?.deselectRow();
    hideDetail();
    await loadVNetList();
}

// ─── Filter (Tabulator 내장 setFilter) ───────────────────────────────────

function initFilter() {
    const providerEl = document.getElementById('filter-provider');
    const regionEl   = document.getElementById('filter-region');
    const usageEl    = document.getElementById('filter-usage');
    const fieldEl = document.getElementById('filter-field');
    const typeEl  = document.getElementById('filter-type');
    const valueEl = document.getElementById('filter-value');
    if (!fieldEl || !typeEl || !valueEl) return;

    function updateFilter() {
        if (!AppState.tables.vnetTable) return;
        const filters = [];
        if (providerEl?.value) filters.push({ field: '_provider', type: '=', value: providerEl.value });
        if (regionEl?.value) filters.push({ field: '_region', type: '=', value: regionEl.value });
        if (usageEl?.value === 'in-use') filters.push({ field: '_usedBy', type: '>', value: 0 });
        if (usageEl?.value === 'unused') filters.push({ field: '_usedBy', type: '=', value: 0 });
        if (fieldEl.value) filters.push({ field: fieldEl.value, type: typeEl.value, value: valueEl.value });
        if (filters.length > 0) {
            AppState.tables.vnetTable.setFilter(filters);
        } else {
            AppState.tables.vnetTable.clearFilter();
        }
    }

    providerEl?.addEventListener('change', function () {
        populateRegionFilterOptions(AppState.resources.all, 'filter-provider', 'filter-region');
        updateFilter();
    });
    regionEl?.addEventListener('change', updateFilter);
    usageEl?.addEventListener('change', updateFilter);
    fieldEl.addEventListener('change', updateFilter);
    typeEl.addEventListener('change', updateFilter);
    valueEl.addEventListener('keyup', updateFilter);

    document.getElementById('filter-clear').addEventListener('click', function () {
        if (providerEl) providerEl.value = '';
        if (regionEl) regionEl.value = '';
        if (usageEl) usageEl.value = '';
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
            placeholder="Subnet name (e.g. subnet-${idx + 1})">
        </div>
        <div class="col-md-5">
          <input type="text" class="form-control form-control-sm subnet-cidr"
            placeholder="CIDR (e.g. 10.0.${idx}.0/24)">
        </div>
        <div class="col-md-2">
          <button type="button" class="btn btn-sm btn-outline-danger w-100"
            onclick="this.closest('.subnet-row').remove()">Delete</button>
        </div>`;
    list.appendChild(row);
}

export async function executeCreateVNet() {
    const connectionName = document.getElementById('create-vpc-connection').value;
    const name           = document.getElementById('create-vpc-name').value.trim();
    const cidrBlock      = document.getElementById('create-vpc-cidr').value.trim();

    if (!connectionName || !name || !cidrBlock) {
        showToast(TOAST_TYPES.WARNING, 'Connection, VPC name, and CIDR are required.');
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
        showToast(TOAST_TYPES.SUCCESS, `VPC "${name}" created successfully`);
        bootstrap.Modal.getInstance(document.getElementById('create-vpc-modal'))?.hide();
        await loadVNetList();
    } catch (err) {
        console.error('VPC 생성 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'Failed to create VPC: ' + (err.message || ''));
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
        showToast(TOAST_TYPES.WARNING, 'Please select a project first.');
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
    select.innerHTML = '<option value="">Select</option>';
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
        showToast(TOAST_TYPES.WARNING, 'Please select a Connection.');
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
        showToast(TOAST_TYPES.ERROR, 'Failed to load unmanaged VNets: ' + (err.message || ''));
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
            <td><span class="badge bg-warning-lt">● Unmanaged</span></td>`;
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
            <td><span class="badge bg-success-lt">✓ Registered</span></td>`;
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
        showToast(TOAST_TYPES.WARNING, 'Please select VNets to import.');
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

    let msg = `${successCount} VNets registered successfully`;
    if (skipCount > 0) msg += `, ${skipCount} already registered`;
    if (failCount > 0) msg += `, ${failCount} failed`;
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
    confirmBulkDelete,
    executeBulkDelete,
    triggerEditSelected,
    showEditMode,
    cancelEditMode,
    addEditSubnetRow,
    confirmDeleteSubnet,
    executeDeleteSubnet,
    saveVNet,
};
