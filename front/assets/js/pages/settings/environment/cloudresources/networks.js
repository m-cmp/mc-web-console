// VNet(VPC) 관리 페이지 — Create / Import / Filter 기능
// FR-CLOUD-ADMIN-003-01 / RQ-CLOUD-ADMIN-007

import { TabulatorFull as Tabulator } from "tabulator-tables";
import { showToast, TOAST_TYPES } from "../../../../common/utils/toast.js";

const vpcApi  = () => webconsolejs["common/api/services/vpc_api"];
const importApi = () => webconsolejs["common/api/services/import_api"];

// ─── 상태 ─────────────────────────────────────────────────────────────────
let _currentNsId = null;
let _allVNets    = [];   // 전체 목록 캐시 (필터 적용 전)
let _table       = null; // Tabulator 인스턴스
let _unmanagedVNets = [];

// ─── 페이지 초기화 ────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async function () {
    _currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;

    // page-header: + Create VPC 버튼
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        btnList.innerHTML = `
            <button type="button" class="btn btn-primary" id="create-vpc-btn"
              onclick="webconsolejs['pages/settings/environment/cloudresources/networks'].openCreateVNetModal()">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
                viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 5l0 14"/><path d="M5 12l14 0"/>
              </svg>
              Create VPC
            </button>`;
    }

    // 테이블 toolbar 버튼 상태 초기화
    _syncToolbarState();

    // VNet 목록 로드
    if (_currentNsId) {
        await loadVNetList();
    }

    // 프로젝트 변경 시 재조회
    document.getElementById('select-current-project')?.addEventListener('change', async () => {
        _currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
        _syncToolbarState();
        if (_currentNsId) await loadVNetList();
    });
});

function _syncToolbarState() {
    const importBtn = document.getElementById('import-vnet-btn');
    const createBtn = document.getElementById('create-vpc-btn');
    if (importBtn) {
        importBtn.disabled = !_currentNsId;
        importBtn.title = _currentNsId ? 'CSP 미관리 VNet 임포트' : '프로젝트를 먼저 선택하세요';
    }
    if (createBtn) {
        createBtn.disabled = !_currentNsId;
    }
}

// ─── VNet 목록 로드 ──────────────────────────────────────────────────────

export async function loadVNetList() {
    _currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
    if (!_currentNsId) return;
    try {
        const data = await vpcApi().getAllVNet(_currentNsId);
        _allVNets = data?.vNet || (Array.isArray(data) ? data : []);
        renderFilterConnections(_allVNets);
        renderVNetTable(_allVNets);
    } catch (err) {
        console.error('VNet 목록 조회 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'VNet 목록 조회에 실패했습니다.');
    }
}

// ─── 테이블 Filter ────────────────────────────────────────────────────────

function renderFilterConnections(vNets) {
    const sel = document.getElementById('filter-connection');
    if (!sel) return;
    const current = sel.value;
    const connections = [...new Set(vNets.map(v => v.connectionName).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">전체</option>' +
        connections.map(c => `<option value="${c}"${c === current ? ' selected' : ''}>${c}</option>`).join('');
}

export function applyFilter() {
    const connFilter = document.getElementById('filter-connection')?.value || '';
    const nameFilter = (document.getElementById('filter-name')?.value || '').toLowerCase();
    const filtered = _allVNets.filter(v => {
        const matchConn = !connFilter || v.connectionName === connFilter;
        const matchName = !nameFilter || (v.name || '').toLowerCase().includes(nameFilter);
        return matchConn && matchName;
    });
    _table?.setData(filtered);
}

// ─── Tabulator 테이블 렌더링 ──────────────────────────────────────────────

function renderVNetTable(vNets) {
    if (_table) {
        _table.setData(vNets);
        return;
    }
    _table = new Tabulator("#vnet-list-table", {
        data: vNets,
        layout: "fitColumns",
        placeholder: "등록된 VNet이 없습니다.",
        pagination: true,
        paginationSize: 10,
        paginationSizeSelector: [10, 20, 50],
        columns: [
            { title: "이름",           field: "name",           widthGrow: 2, sorter: "string" },
            { title: "Connection",     field: "connectionName", widthGrow: 1, sorter: "string" },
            { title: "CIDR",           field: "cidrBlock",      widthGrow: 1 },
            { title: "Subnet 수",      field: "subnetInfoList",
              formatter: (cell) => `${(cell.getValue() || []).length}개`,
              hozAlign: "center", width: 100 },
            { title: "CSP Resource ID", field: "cspResourceId", widthGrow: 2 },
        ],
    });
}

// ─── Create VPC 모달 ─────────────────────────────────────────────────────

export async function openCreateVNetModal() {
    _currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
    if (!_currentNsId) {
        showToast(TOAST_TYPES.WARNING, '프로젝트를 먼저 선택하세요.');
        return;
    }

    // 폼 초기화
    document.getElementById('create-vpc-name').value = '';
    document.getElementById('create-vpc-cidr').value = '';
    document.getElementById('create-vpc-subnet-list').innerHTML = '';

    await _loadConnectionOptions('create-vpc-connection');
    // 기본 subnet row 1개 추가
    addSubnetRow();

    new bootstrap.Modal(document.getElementById('create-vpc-modal')).show();
}

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
    const name = document.getElementById('create-vpc-name').value.trim();
    const cidrBlock = document.getElementById('create-vpc-cidr').value.trim();

    if (!connectionName || !name || !cidrBlock) {
        showToast(TOAST_TYPES.WARNING, 'Connection, VPC 이름, CIDR은 필수입니다.');
        return;
    }

    // Subnet 목록 수집
    const subnetInfoList = [];
    document.querySelectorAll('#create-vpc-subnet-list .subnet-row').forEach(row => {
        const subName = row.querySelector('.subnet-name')?.value.trim();
        const subCidr = row.querySelector('.subnet-cidr')?.value.trim();
        if (subName && subCidr) {
            subnetInfoList.push({ name: subName, ipv4_cidr: subCidr });
        }
    });

    const spinner = document.getElementById('create-vpc-spinner');
    const btn = document.getElementById('create-vpc-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    try {
        await vpcApi().create(_currentNsId, { connectionName, name, cidrBlock, subnetInfoList });
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
    _currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
    if (!_currentNsId) {
        showToast(TOAST_TYPES.WARNING, '프로젝트를 먼저 선택하세요.');
        return;
    }

    document.getElementById('import-vnet-project').value = _currentNsId;
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
        const result = await webconsolejs["common/api/http"].commonAPIPost(
            "/api/mc-infra-manager/GetConnConfigList", {}
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
            importApi().getRegisteredVNets(_currentNsId),
        ]);

        const registeredIds = new Set(registeredVNets.map(v => v.cspResourceId));
        const unmanaged = cspVNets.filter(v => !registeredIds.has(v.id || v.cspResourceId));
        const alreadyManaged = cspVNets.filter(v => registeredIds.has(v.id || v.cspResourceId));

        _unmanagedVNets = unmanaged;
        _renderUnmanagedVNetTable(unmanaged, alreadyManaged);
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
    const btn = document.getElementById('import-vnet-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    let successCount = 0, skipCount = 0, failCount = 0;

    for (const cb of checked) {
        const cspResourceId = cb.dataset.id;
        const name = cb.dataset.name;
        try {
            await importApi().registerCspVNet(_currentNsId, connectionName, cspResourceId, name);
            successCount++;
        } catch (err) {
            if (err.response?.status === 409) {
                skipCount++;
            } else {
                failCount++;
                console.error(`VNet ${name} 등록 실패:`, err);
            }
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
if (typeof webconsolejs === "undefined") { window.webconsolejs = {}; }
webconsolejs["pages/settings/environment/cloudresources/networks"] = {
    loadVNetList,
    applyFilter,
    openCreateVNetModal,
    addSubnetRow,
    executeCreateVNet,
    openImportVNetModal,
    loadUnmanagedVNets,
    executeImportVNets,
};
