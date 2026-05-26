// VM Import 3단계 팝업
// RQ-CLOUD-ADMIN-007 / UC-IMPORT-006

import { showToast, TOAST_TYPES } from "../../../common/utils/toast.js";

const importApi = () => webconsolejs["common/api/services/import_api"];

let _nsId = null;
let _currentStep = 1;
let _selectedVMs = [];         // Step1 선택된 VM 목록 [{connectionName, cspResourceId, name}]
let _depResources = [];        // Step2 의존 자원 상태 목록

// ─── 초기화 ────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
    _nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;

    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary ms-2';
        btn.id = 'import-vm-btn';
        btn.textContent = 'Import VM';
        btn.disabled = !_nsId;
        btn.title = _nsId ? 'Import Unmanaged VMs from CSP' : 'Select a project first';
        btn.onclick = () => openImportVmModal();
        btnList.appendChild(btn);
    }
});

// ─── 모달 오픈 ──────────────────────────────────────────────────────────

export async function openImportVmModal() {
    _nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
    if (!_nsId) { alert('Select a project first.'); return; }

    _currentStep = 1;
    _selectedVMs = [];
    _depResources = [];

    // Step1 초기화
    document.getElementById('import-vm-tbody').innerHTML = '';
    document.getElementById('import-vm-step1-list').classList.add('d-none');

    // Connection 드롭다운 로드
    await loadConnectionSelect('import-vm-connection');

    showStep(1);
    new bootstrap.Modal(document.getElementById('import-vm-modal')).show();
}

// ─── Step 네비게이션 ────────────────────────────────────────────────────

export async function nextStep() {
    if (_currentStep === 1) {
        const checked = Array.from(document.querySelectorAll('.import-vm-check:checked'));
        if (checked.length === 0) { alert('Please select VMs to import.'); return; }

        const connectionName = document.getElementById('import-vm-connection').value;
        _selectedVMs = checked.map(cb => ({
            connectionName,
            cspResourceId: cb.dataset.id,
            name: cb.dataset.name,
            vpcId: cb.dataset.vpcId || '',
            sgIds: (cb.dataset.sgIds || '').split(',').filter(Boolean),
            sshKeyId: cb.dataset.sshKeyId || '',
            diskIds: (cb.dataset.diskIds || '').split(',').filter(Boolean),
        }));

        await loadDepResources();
        _currentStep = 2;
        showStep(2);

    } else if (_currentStep === 2) {
        // Step3 초기화
        document.getElementById('import-vm-project').value = _nsId;
        await loadMciRefList();
        _currentStep = 3;
        showStep(3);
    }
}

export function prevStep() {
    if (_currentStep > 1) {
        _currentStep--;
        showStep(_currentStep);
    }
}

function showStep(step) {
    [1, 2, 3].forEach(s => {
        document.getElementById(`import-vm-step${s}`).classList.toggle('d-none', s !== step);
    });

    document.getElementById('import-vm-modal-title').textContent =
        ['', 'VM Import (1/3 — Select Target VM)', 'VM Import (2/3 — Dependent Resource Status)', 'VM Import (3/3 — Configure Target MCI)'][step];

    document.getElementById('import-vm-prev-btn').classList.toggle('d-none', step === 1);
    document.getElementById('import-vm-next-btn').classList.toggle('d-none', step === 3);
    document.getElementById('import-vm-execute-btn').classList.toggle('d-none', step !== 3);
}

// ─── Step 1: CSP VM 조회 ────────────────────────────────────────────────

export async function loadCspVMs() {
    const connectionName = document.getElementById('import-vm-connection').value;
    if (!connectionName) { alert('Please select a Connection.'); return; }

    document.getElementById('import-vm-step1-loading').classList.remove('d-none');
    document.getElementById('import-vm-step1-list').classList.add('d-none');

    try {
        const cspVMs = await importApi().getCspVMs(connectionName);
        renderVMTable(cspVMs, connectionName);
    } catch (err) {
        showToast(TOAST_TYPES.ERROR, 'Failed to load VM list: ' + (err.message || ''));
    } finally {
        document.getElementById('import-vm-step1-loading').classList.add('d-none');
    }
}

function renderVMTable(vms, connectionName) {
    const tbody = document.getElementById('import-vm-tbody');
    tbody.innerHTML = '';

    for (const vm of vms) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="form-check-input import-vm-check"
              data-id="${vm.id || vm.cspResourceId}"
              data-name="${vm.name || vm.id}"
              data-vpc-id="${vm.vpcId || ''}"
              data-sg-ids="${(vm.securityGroupIds || []).join(',')}"
              data-ssh-key-id="${vm.sshKeyId || ''}"
              data-disk-ids="${(vm.dataDiskIds || []).join(',')}"></td>
            <td>${vm.name || vm.id}</td>
            <td>${vm.instanceType || '-'}</td>
            <td><code>${vm.id || '-'}</code></td>
            <td><span class="badge bg-warning-lt">● Unmanaged</span></td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById('import-vm-step1-list').classList.remove('d-none');

    document.getElementById('import-vm-select-all').onchange = function () {
        document.querySelectorAll('.import-vm-check').forEach(cb => cb.checked = this.checked);
    };
}

// ─── Step 2: 의존 자원 상태 확인 ─────────────────────────────────────────

async function loadDepResources() {
    const container = document.getElementById('import-vm-dep-table');
    container.innerHTML = '<div class="text-center py-2"><div class="spinner-border spinner-border-sm"></div> Checking dependent resources...</div>';

    try {
        const [registeredVNets, registeredSGs, registeredSshKeys] = await Promise.all([
            importApi().getRegisteredVNets(_nsId).catch(() => []),
            getRegisteredResources('securityGroup'),
            getRegisteredResources('sshKey'),
        ]);

        _depResources = [];
        const regVNetIds = new Set(registeredVNets.map(r => r.cspResourceId));
        const regSGIds = new Set((registeredSGs || []).map(r => r.cspResourceId));
        const regSshKeyIds = new Set((registeredSshKeys || []).map(r => r.cspResourceId));

        // 선택된 VM들의 의존 자원 수집 (중복 제거)
        const vpcIds = new Set(), sgIds = new Set(), sshKeyIds = new Set();
        for (const vm of _selectedVMs) {
            if (vm.vpcId) vpcIds.add(vm.vpcId);
            vm.sgIds.forEach(id => sgIds.add(id));
            if (vm.sshKeyId) sshKeyIds.add(vm.sshKeyId);
        }

        const rows = [];
        for (const id of vpcIds) {
            const registered = regVNetIds.has(id);
            _depResources.push({ type: 'vNet', id, registered });
            rows.push(depRow('VNet', id, registered));
        }
        for (const id of sgIds) {
            const registered = regSGIds.has(id);
            _depResources.push({ type: 'securityGroup', id, registered });
            rows.push(depRow('SecurityGroup', id, registered));
        }
        for (const id of sshKeyIds) {
            const registered = regSshKeyIds.has(id);
            _depResources.push({ type: 'sshKey', id, registered });
            rows.push(depRow('SSH Key', id, registered));
        }

        if (rows.length === 0) {
            container.innerHTML = '<div class="text-muted">Cannot check dependent resource info. (No CSP query result provided)</div>';
        } else {
            container.innerHTML = `
                <table class="table table-sm">
                  <thead><tr><th>Resource Type</th><th>CSP ID</th><th>Status</th></tr></thead>
                  <tbody>${rows.join('')}</tbody>
                </table>`;
        }
    } catch (err) {
        container.innerHTML = `<div class="alert alert-warning">Failed to check dependent resource status. Import can still proceed.</div>`;
    }
}

function depRow(type, id, registered) {
    const badge = registered
        ? '<span class="badge bg-success-lt">✓ Already Registered</span>'
        : '<span class="badge bg-warning-lt">Will be auto-registered</span>';
    return `<tr><td>${type}</td><td><code>${id}</code></td><td>${badge}</td></tr>`;
}

async function getRegisteredResources(type) {
    try {
        const resp = await webconsolejs["common/api/http"].commonAPIPost(
            "/api/mc-infra-manager/GetAll" + capitalize(type),
            { pathParams: { nsId: _nsId } }
        );
        return resp?.data?.responseData?.[type] || [];
    } catch { return []; }
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ─── Step 3: MCI 참조 목록 로드 ──────────────────────────────────────────

async function loadMciRefList() {
    const select = document.getElementById('import-vm-mci-ref');
    select.innerHTML = '<option value="">Select existing MCI (for name reference)</option>';
    try {
        const mciList = await importApi().getMciListSimple(_nsId);
        mciList.forEach(mci => {
            const opt = document.createElement('option');
            opt.value = mci.name;
            opt.textContent = mci.name;
            select.appendChild(opt);
        });
    } catch (err) { console.error('MCI 목록 로드 실패:', err); }
}

export function toggleMciMode(mode) {
    document.getElementById('import-vm-mci-name').classList.toggle('d-none', mode === 'ref');
    document.getElementById('import-vm-mci-ref').classList.toggle('d-none', mode === 'new');
    if (mode === 'new') document.getElementById('import-vm-mci-name').value = '';
}

// ─── Import 실행 ──────────────────────────────────────────────────────────

export async function executeImportVMs() {
    const mciName = document.getElementById('import-vm-mci-name').value.trim();
    if (!mciName) { alert('Please enter an MCI name.'); return; }

    const spinner = document.getElementById('import-vm-spinner');
    const btn = document.getElementById('import-vm-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    const autoRegister = document.getElementById('import-vm-auto-register').checked;
    const connectionName = _selectedVMs[0]?.connectionName;

    try {
        // Step A: 미등록 의존 자원 선등록 (자동 등록 ON인 경우)
        if (autoRegister) {
            const unregistered = _depResources.filter(r => !r.registered);
            if (unregistered.some(r => r.type === 'securityGroup' || r.type === 'sshKey')) {
                await importApi().registerCspResources(
                    ['securityGroup', 'sshKey'], connectionName, _nsId
                ).catch(err => console.warn('의존 자원 사전 등록 실패 (계속 진행):', err));
            }
            // VNet은 registerCspVm 내부에서 자동 처리되므로 별도 호출 생략 가능
            // (필요 시 추가)
        }

        // Step B: VM 등록 (신규 MCI 생성)
        const result = await importApi().registerCspVm(_nsId, mciName, _selectedVMs);

        const successCount = result?.creationErrors?.successfulVmCount || _selectedVMs.length;
        const failCount = result?.creationErrors?.failedVmCount || 0;

        showToast(
            failCount > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
            `${successCount} VMs imported (MCI: ${mciName})${failCount > 0 ? `, ${failCount} failed` : ''}`
        );

        bootstrap.Modal.getInstance(document.getElementById('import-vm-modal'))?.hide();

        // MCI 목록 새로고침
        if (window.currentNsId && typeof window.getMciListCallbackSuccess === 'function') {
            const mciList = await webconsolejs["common/api/services/mci_api"].getMciList(window.currentNsId);
            getMciListCallbackSuccess(window.currentNsId, mciList);
        }

    } catch (err) {
        const errMsg = err.response?.data?.message || err.message || 'Unknown error';
        if (err.response?.status === 409) {
            showToast(TOAST_TYPES.ERROR, `MCI name "${mciName}" is already in use. Please enter a different name.`);
        } else {
            showToast(TOAST_TYPES.ERROR, 'VM import failed: ' + errMsg);
        }
    } finally {
        spinner.classList.add('d-none');
        btn.disabled = false;
    }
}

// ─── 공통 유틸 ────────────────────────────────────────────────────────────

async function loadConnectionSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select</option>';
    try {
        const result = await webconsolejs["common/api/http"].commonAPIPost("/api/mc-iam-manager/ListCspAccounts", {});
        const accounts = result?.data?.responseData?.items || [];
        accounts.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.connectionName || acc.name;
            opt.textContent = acc.name;
            select.appendChild(opt);
        });
    } catch (err) { console.error(err); }
}

// webconsolejs 등록
if (typeof webconsolejs === "undefined") { window.webconsolejs = {}; }
webconsolejs["pages/operation/manage/importvm"] = {
    openImportVmModal,
    loadCspVMs,
    nextStep,
    prevStep,
    toggleMciMode,
    executeImportVMs,
};
