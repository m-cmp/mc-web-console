// VNet(VPC) 관리 페이지 — Import 기능 포함
// RQ-CLOUD-ADMIN-007 / UC-IMPORT-002

import { TabulatorFull as Tabulator } from "tabulator-tables";
import { showToast, TOAST_TYPES } from "../../../../common/utils/toast.js";

const importApi = () => webconsolejs["common/api/services/import_api"];

// 상태
let _unmanagedVNets = [];  // 조회된 미관리 VNet 목록
let _currentNsId = null;

// ─── 페이지 초기화 ────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async function () {
    _currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;

    // Import VNet 버튼 삽입
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        const importBtn = document.createElement('button');
        importBtn.className = 'btn btn-secondary';
        importBtn.id = 'import-vnet-btn';
        importBtn.textContent = 'Import VNet';
        importBtn.disabled = !_currentNsId;
        importBtn.title = _currentNsId ? 'CSP 미관리 VNet 임포트' : '프로젝트를 먼저 선택하세요';
        importBtn.onclick = () => openImportVNetModal();
        btnList.appendChild(importBtn);
    }

    // VNet 목록 로드
    if (_currentNsId) {
        await loadVNetList(_currentNsId);
    }
});

async function loadVNetList(nsId) {
    try {
        const vNets = await importApi().getRegisteredVNets(nsId);
        renderVNetTable(vNets);
    } catch (err) {
        console.error('VNet 목록 조회 실패:', err);
    }
}

function renderVNetTable(vNets) {
    new Tabulator("#vnet-list-table", {
        data: vNets,
        layout: "fitColumns",
        placeholder: "등록된 VNet이 없습니다.",
        columns: [
            { title: "이름", field: "name", widthGrow: 2 },
            { title: "CSP Resource ID", field: "cspResourceId", widthGrow: 2 },
            { title: "Connection", field: "connectionName", widthGrow: 1 },
            { title: "CIDR", field: "cidrBlock", widthGrow: 1 },
            { title: "Subnet 수", field: "subnetInfoList",
              formatter: (cell) => (cell.getValue() || []).length + "개" },
        ],
    });
}

// ─── Import VNet 모달 ─────────────────────────────────────────────────

export async function openImportVNetModal() {
    _currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
    if (!_currentNsId) {
        alert('프로젝트를 먼저 선택하세요.');
        return;
    }

    document.getElementById('import-vnet-project').value = _currentNsId;
    document.getElementById('import-vnet-list-area').classList.add('d-none');
    document.getElementById('import-vnet-empty').classList.add('d-none');
    document.getElementById('import-vnet-tbody').innerHTML = '';
    _unmanagedVNets = [];

    // Connection 목록 로드 (CSP 계정에서)
    await loadConnectionOptions('import-vnet-connection');

    new bootstrap.Modal(document.getElementById('import-vnet-modal')).show();
}

async function loadConnectionOptions(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">선택하세요</option>';
    try {
        // CSP 계정 목록에서 connectionName 가져오기
        const result = await webconsolejs["common/api/http"].commonAPIPost(
            "/api/mc-iam-manager/ListCspAccounts", {}
        );
        const accounts = result?.data?.responseData?.items || [];
        for (const acc of accounts) {
            const opt = document.createElement('option');
            opt.value = acc.connectionName || acc.name;
            opt.textContent = acc.name;
            select.appendChild(opt);
        }
    } catch (err) {
        console.error('Connection 목록 로드 실패:', err);
    }
}

/**
 * 미관리 VNet 조회
 * CSP 전체 VNet - 등록된 VNet = 미관리 VNet
 */
export async function loadUnmanagedVNets() {
    const connectionName = document.getElementById('import-vnet-connection').value;
    if (!connectionName) {
        alert('Connection을 선택하세요.');
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
        renderUnmanagedVNetTable(unmanaged, alreadyManaged);
    } catch (err) {
        console.error('미관리 VNet 조회 실패:', err);
        showToast(TOAST_TYPES.ERROR, '미관리 VNet 조회에 실패했습니다: ' + (err.message || ''));
    } finally {
        document.getElementById('import-vnet-loading').classList.add('d-none');
    }
}

function renderUnmanagedVNetTable(unmanaged, managed) {
    const tbody = document.getElementById('import-vnet-tbody');
    tbody.innerHTML = '';

    if (unmanaged.length === 0 && managed.length === 0) {
        document.getElementById('import-vnet-empty').classList.remove('d-none');
        return;
    }

    // 미관리 항목 (선택 가능)
    for (const v of unmanaged) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="form-check-input import-vnet-check" data-id="${v.id || v.cspResourceId}" data-name="${v.name || v.id}" data-cidr="${v.cidrBlock || ''}"></td>
            <td>${v.name || v.id}</td>
            <td>${v.cidrBlock || '-'}</td>
            <td><code>${v.id || '-'}</code></td>
            <td><span class="badge bg-warning-lt">● 미관리</span></td>
        `;
        tbody.appendChild(tr);
    }

    // 이미 등록된 항목 (비활성화)
    for (const v of managed) {
        const tr = document.createElement('tr');
        tr.className = 'text-muted';
        tr.innerHTML = `
            <td><input type="checkbox" class="form-check-input" disabled></td>
            <td>${v.name || v.id}</td>
            <td>${v.cidrBlock || '-'}</td>
            <td><code>${v.id || '-'}</code></td>
            <td><span class="badge bg-success-lt">✓ 등록됨</span></td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById('import-vnet-list-area').classList.remove('d-none');

    // 전체 선택 체크박스
    document.getElementById('import-vnet-select-all').onchange = function () {
        document.querySelectorAll('.import-vnet-check').forEach(cb => cb.checked = this.checked);
    };
}

/**
 * 선택된 VNet Import 실행
 */
export async function executeImportVNets() {
    const connectionName = document.getElementById('import-vnet-connection').value;
    const checked = Array.from(document.querySelectorAll('.import-vnet-check:checked'));

    if (checked.length === 0) {
        alert('Import할 VNet을 선택하세요.');
        return;
    }

    const spinner = document.getElementById('import-vnet-spinner');
    const btn = document.getElementById('import-vnet-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

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

    const toastType = failCount > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS;
    showToast(toastType, msg);

    bootstrap.Modal.getInstance(document.getElementById('import-vnet-modal'))?.hide();
    await loadVNetList(_currentNsId);
}

// webconsolejs 등록
if (typeof webconsolejs === "undefined") { window.webconsolejs = {}; }
webconsolejs["pages/settings/environment/cloudresources/networks"] = {
    openImportVNetModal,
    loadUnmanagedVNets,
    executeImportVNets,
};
