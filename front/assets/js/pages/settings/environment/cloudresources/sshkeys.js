// SSH Key 관리 페이지 — CRUD + Import
// FR-CLOUD-ADMIN-003-03 / RQ-CLOUD-ADMIN-007

import { TabulatorFull as Tabulator } from "tabulator-tables";
import { showToast, TOAST_TYPES } from "../../../../common/utils/toast.js";
import { getProvider, getRegion, populateProviderFilterOptions, populateRegionFilterOptions } from "../../../../common/utils/cspResource.js";

const sshKeyApi = () => webconsolejs["common/api/services/sshkey_api"];
const importApi = () => webconsolejs["common/api/services/import_api"];

// ─── 상태 ─────────────────────────────────────────────────────────────────
const AppState = {
    ns: '',
    tables: { keyTable: null },
    resources: { selected: null, all: [] },
    ui: { viewMode: false, privKeyVisible: false },
    // 상세에 표시 중인 Private Key 원문 (화면에는 기본 ****** 로 가린다)
    _privKey: null,
};

// ─── 페이지 초기화 ────────────────────────────────────────────────────────

$('#select-current-project').on('change', async function () {
    if (this.value === '') return;
    const project = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
    AppState.ns = project?.NsId || '';
    if (AppState.ns) await loadKeyList();
});

document.addEventListener('DOMContentLoaded', async function () {
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        btnList.innerHTML = `
            <button type="button" class="btn btn-primary"
              data-bs-toggle="modal" data-bs-target="#create-sshkey-modal">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
                viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 5l0 14"/><path d="M5 12l14 0"/>
              </svg>
              Create SSH Key
            </button>`;
    }

    const selectedWorkspaceProject = await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
    webconsolejs['partials/layout/modal'].checkWorkspaceSelection(selectedWorkspaceProject);

    AppState.ns = selectedWorkspaceProject.nsId || '';
    initFilter();

    if (selectedWorkspaceProject.projectId !== '') {
        await loadKeyList();
    }
});

// ─── SSH Key 목록 로드 ────────────────────────────────────────────────────

export async function loadKeyList() {
    if (!AppState.ns) return;
    try {
        const data = await sshKeyApi().list(AppState.ns);
        const rawItems = data?.sshKey || (Array.isArray(data) ? data : []);
        const items = rawItems.map((v) => ({ ...v, _provider: getProvider(v), _region: getRegion(v) }));
        AppState.resources.all = items;
        populateProviderFilterOptions(items, 'filter-provider');
        populateRegionFilterOptions(items, 'filter-provider', 'filter-region');
        if (AppState.tables.keyTable) {
            AppState.tables.keyTable.replaceData(items);
        } else {
            initTable(items);
        }
    } catch (err) {
        console.error('SSH Key 목록 조회 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'Failed to load SSH Key list.');
    }
}

// ─── Tabulator 테이블 ─────────────────────────────────────────────────────

function initTable(items) {
    AppState.tables.keyTable = new Tabulator('#sshkey-list-table', {
        data: items,
        layout: 'fitColumns',
        placeholder: 'No registered SSH Keys.',
        pagination: 'local',
        paginationSize: 10,
        paginationSizeSelector: [10, 20, 50],
        paginationCounter: 'rows',
        movableColumns: true,
        selectableRows: true, // false로 두면 Tabulator 내부 cap-check 버그(isNaN(false)===false)로 다중선택 자체가 깨진다
        initialSort: [{ column: 'name', dir: 'asc' }],
        columns: [
            { formatter: 'rowSelection', titleFormatter: 'rowSelection', headerSort: false, hozAlign: 'center', width: 40 },
            { title: 'Name',        field: 'name',           widthGrow: 2, sorter: 'string' },
            { title: 'Provider',    field: '_provider',      widthGrow: 1, sorter: 'string' },
            { title: 'Region',      field: '_region',        widthGrow: 1, sorter: 'string' },
            { title: 'Fingerprint', field: 'fingerprint',    widthGrow: 2 },
            { title: 'CSP Resource ID', field: 'cspResourceId', widthGrow: 2 },
        ],
    });

    AppState.tables.keyTable.on('rowClick', async function (e, row) {
        // selectableRows:true는 row 아무데나 클릭해도 체크박스를 토글하는 내장 동작이 있다.
        // 체크박스 자체를 클릭한 게 아니면 그 토글을 즉시 되돌려, row 클릭은 Detail Panel 오픈 전용으로 만든다.
        const clickedCell = row.getCells().find(c => c.getElement().contains(e.target));
        const isCheckboxCol = clickedCell?.getColumn()?.getDefinition()?.formatter === 'rowSelection';
        if (!isCheckboxCol) {
            row.toggleSelect();
        }

        const data = row.getData();
        AppState.resources.selected = data;
        renderDetail(data, null);
        showDetail();
        try {
            const detail = await sshKeyApi().get(AppState.ns, data.name);
            if (detail) {
                AppState.resources.selected = detail;
                renderDetail(detail, null);
            }
        } catch (err) {
            console.error('SSH Key 상세 조회 실패:', err);
        }
    });
}

// ─── Detail Panel ─────────────────────────────────────────────────────────

function renderDetail(data, privateKey) {
    document.getElementById('detail-name').textContent            = data.name || '-';
    document.getElementById('detail-key-name').textContent        = data.name || '-';
    document.getElementById('detail-key-provider').textContent    = getProvider(data);
    document.getElementById('detail-key-region').textContent      = getRegion(data);
    document.getElementById('detail-key-fingerprint').textContent = data.fingerprint || '-';
    document.getElementById('detail-key-csp-id').textContent      = data.cspResourceId || '-';

    const pubKey = data.publicKey || data.publicKeyMaterial || '';
    const pubKeyEl    = document.getElementById('detail-pubkey');
    const pubEmptyEl  = document.getElementById('detail-pubkey-empty');
    if (pubKey) {
        pubKeyEl.textContent = pubKey;
        pubKeyEl.style.display = '';
        pubEmptyEl.classList.add('d-none');
    } else {
        pubKeyEl.style.display = 'none';
        pubEmptyEl.classList.remove('d-none');
    }

    // Private Key — 생성 응답뿐 아니라 cb-tumblebug 목록·상세 응답에도 들어 있다. 기본은 가려서 보여 준다.
    AppState._privKey = privateKey || data.privateKey || data.privateKeyMaterial || null;
    AppState.ui.privKeyVisible = false;
    const hasPrivKey = !!AppState._privKey;
    document.getElementById('detail-privkey').style.display = hasPrivKey ? '' : 'none';
    document.getElementById('detail-privkey-actions').classList.toggle('d-none', !hasPrivKey);
    document.getElementById('detail-privkey-empty').classList.toggle('d-none', hasPrivKey);
    renderPrivateKey();
}

function renderPrivateKey() {
    const visible = AppState.ui.privKeyVisible && AppState._privKey;
    document.getElementById('detail-privkey').textContent = visible ? AppState._privKey : '******';
    document.getElementById('toggle-privkey-btn').textContent = visible ? 'Hide' : 'Show';
}

function showDetail() {
    const el = document.getElementById('view-mode-cards');
    if (el) el.classList.add('show');
    AppState.ui.viewMode = true;
}

export function hideDetail() {
    document.getElementById('view-mode-cards')?.classList.remove('show');
    AppState.ui.viewMode = false;
    AppState.resources.selected = null;
    AppState._privKey = null;
    AppState.ui.privKeyVisible = false;
    document.getElementById('detail-privkey').textContent = '******';
}

export function togglePrivateKey() {
    AppState.ui.privKeyVisible = !AppState.ui.privKeyVisible;
    renderPrivateKey();
}

// 화면 표시 여부와 관계없이 원문을 복사한다
export function copyPrivateKey() {
    const btnEl = document.getElementById('copy-privkey-btn');
    const done = (label) => {
        btnEl.textContent = label;
        setTimeout(() => { btnEl.textContent = 'Copy'; }, 1500);
    };
    if (!AppState._privKey || !navigator.clipboard) {
        done('Copy failed');
        return;
    }
    navigator.clipboard.writeText(AppState._privKey).then(() => done('Copied!')).catch(() => done('Copy failed'));
}

// ─── Delete ───────────────────────────────────────────────────────────────

export function confirmDeleteSshKey() {
    const selected = AppState.resources.selected;
    if (!selected) return;
    webconsolejs['partials/layout/modal'].commonConfirmModal(
        'commonDefaultModal',
        'Delete SSH Key',
        `SSH Key "${selected.name}" — confirm delete?`,
        'pages/settings/environment/cloudresources/sshkeys.executeDeleteSshKey'
    );
}

export async function executeDeleteSshKey() {
    const selected = AppState.resources.selected;
    if (!selected) return;
    try {
        await sshKeyApi().del(AppState.ns, selected.name);
        showToast(TOAST_TYPES.SUCCESS, `SSH Key "${selected.name}" deleted successfully`);
        hideDetail();
        await loadKeyList();
    } catch (err) {
        console.error('SSH Key 삭제 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'Failed to delete SSH Key: ' + (err.message || ''));
    }
}

// ─── 다중선택 삭제 ───────────────────────────────────────────────────────

export function confirmBulkDelete() {
    const table = AppState.tables.keyTable;
    const selected = table ? table.getSelectedData() : [];
    if (selected.length === 0) {
        webconsolejs['partials/layout/modal'].commonShowDefaultModal(
            'Nothing Selected',
            'Please select at least one item to delete.'
        );
        return;
    }
    AppState.resources.bulkSelected = selected;
    webconsolejs['partials/layout/modal'].commonConfirmModal(
        'commonDefaultModal',
        'Delete Selected',
        `Delete ${selected.length} selected SSH Key(s)?`,
        'pages/settings/environment/cloudresources/sshkeys.executeBulkDelete'
    );
}

export async function executeBulkDelete() {
    const items = AppState.resources.bulkSelected || [];
    if (items.length === 0) return;
    const results = await Promise.allSettled(items.map((item) => sshKeyApi().del(AppState.ns, item.name)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    showToast(
        failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
        `${succeeded} SSH Key(s) deleted${failed > 0 ? `, ${failed} failed` : ''}`
    );
    AppState.resources.bulkSelected = [];
    AppState.tables.keyTable?.deselectRow();
    hideDetail();
    await loadKeyList();
}

// ─── Filter ───────────────────────────────────────────────────────────────

function initFilter() {
    const providerEl = document.getElementById('filter-provider');
    const regionEl   = document.getElementById('filter-region');
    const fieldEl = document.getElementById('filter-field');
    const typeEl  = document.getElementById('filter-type');
    const valueEl = document.getElementById('filter-value');
    if (!fieldEl || !typeEl || !valueEl) return;

    function updateFilter() {
        if (!AppState.tables.keyTable) return;
        const filters = [];
        if (providerEl?.value) filters.push({ field: '_provider', type: '=', value: providerEl.value });
        if (regionEl?.value) filters.push({ field: '_region', type: '=', value: regionEl.value });
        if (fieldEl.value) filters.push({ field: fieldEl.value, type: typeEl.value, value: valueEl.value });
        if (filters.length > 0) {
            AppState.tables.keyTable.setFilter(filters);
        } else {
            AppState.tables.keyTable.clearFilter();
        }
    }

    providerEl?.addEventListener('change', function () {
        populateRegionFilterOptions(AppState.resources.all, 'filter-provider', 'filter-region');
        updateFilter();
    });
    regionEl?.addEventListener('change', updateFilter);
    fieldEl.addEventListener('change', updateFilter);
    typeEl.addEventListener('change', updateFilter);
    valueEl.addEventListener('keyup', updateFilter);

    document.getElementById('filter-clear').addEventListener('click', function () {
        if (providerEl) providerEl.value = '';
        if (regionEl) regionEl.value = '';
        fieldEl.value = '';
        typeEl.value  = 'like';
        valueEl.value = '';
        if (AppState.tables.keyTable) AppState.tables.keyTable.clearFilter();
    });
}

// ─── Create SSH Key 모달 ──────────────────────────────────────────────────

document.getElementById('create-sshkey-modal')?.addEventListener('show.bs.modal', async function () {
    document.getElementById('create-sshkey-name').value = '';
    await _loadConnectionOptions('create-sshkey-connection');
});

export async function executeCreateSshKey() {
    const connectionName = document.getElementById('create-sshkey-connection').value;
    const name           = document.getElementById('create-sshkey-name').value.trim();

    if (!connectionName || !name) {
        showToast(TOAST_TYPES.WARNING, 'Connection and Key name are required.');
        return;
    }

    const spinner = document.getElementById('create-sshkey-spinner');
    const btn     = document.getElementById('create-sshkey-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    try {
        const result = await sshKeyApi().create(AppState.ns, { connectionName, name });
        const created = result?.responseData || result;
        showToast(TOAST_TYPES.SUCCESS, `SSH Key "${name}" created successfully`);
        bootstrap.Modal.getInstance(document.getElementById('create-sshkey-modal'))?.hide();

        const privateKey = created?.privateKey || created?.privateKeyMaterial || null;

        await loadKeyList();

        // 생성된 항목 선택 후 상세 패널 표시
        AppState.resources.selected = created;
        renderDetail(created, privateKey);
        showDetail();
    } catch (err) {
        console.error('SSH Key 생성 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'Failed to create SSH Key: ' + (err.message || ''));
    } finally {
        spinner.classList.add('d-none');
        btn.disabled = false;
    }
}

// ─── Import SSH Key 모달 ──────────────────────────────────────────────────

export async function openImportSshKeyModal() {
    AppState.ns = webconsolejs['common/api/services/workspace_api'].getCurrentProject()?.NsId || '';
    if (!AppState.ns) {
        showToast(TOAST_TYPES.WARNING, 'Please select a project first.');
        return;
    }
    document.getElementById('import-sshkey-project').value = AppState.ns;
    await _loadConnectionOptions('import-sshkey-connection');
    new bootstrap.Modal(document.getElementById('import-sshkey-modal')).show();
}

export async function executeImportSshKey() {
    const connectionName = document.getElementById('import-sshkey-connection').value;
    if (!connectionName) {
        showToast(TOAST_TYPES.WARNING, 'Please select a Connection.');
        return;
    }

    const spinner = document.getElementById('import-sshkey-spinner');
    const btn     = document.getElementById('import-sshkey-execute-btn');
    spinner.classList.remove('d-none');
    if (btn) btn.disabled = true;

    try {
        const result = await importApi().registerCspResources(['sshKey'], connectionName, AppState.ns);
        const count  = result?.registerationOverview?.sshKey || 0;
        const failed = result?.registerationOverview?.failed || 0;
        showToast(
            failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
            `SSH Key ${count} registered successfully${failed > 0 ? `, ${failed} failed` : ''}`
        );
        bootstrap.Modal.getInstance(document.getElementById('import-sshkey-modal'))?.hide();
        await loadKeyList();
    } catch (err) {
        showToast(TOAST_TYPES.ERROR, 'SSH Key import failed: ' + (err.message || ''));
    } finally {
        spinner.classList.add('d-none');
        if (btn) btn.disabled = false;
    }
}

async function _loadConnectionOptions(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">-- Select --</option>';
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

// ─── webconsolejs 등록 ────────────────────────────────────────────────────
if (typeof webconsolejs === 'undefined') { window.webconsolejs = {}; }
webconsolejs['pages/settings/environment/cloudresources/sshkeys'] = {
    loadKeyList,
    hideDetail,
    togglePrivateKey,
    copyPrivateKey,
    confirmDeleteSshKey,
    executeDeleteSshKey,
    confirmBulkDelete,
    executeBulkDelete,
    executeCreateSshKey,
    openImportSshKeyModal,
    executeImportSshKey,
};
