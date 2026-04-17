// SSH Key 관리 페이지 — CRUD + Import
// FR-CLOUD-ADMIN-003-03 / RQ-CLOUD-ADMIN-007

import { TabulatorFull as Tabulator } from "tabulator-tables";
import { showToast, TOAST_TYPES } from "../../../../common/utils/toast.js";

const sshKeyApi = () => webconsolejs["common/api/services/sshkey_api"];
const importApi = () => webconsolejs["common/api/services/import_api"];

// ─── 상태 ─────────────────────────────────────────────────────────────────
const AppState = {
    ns: '',
    tables: { keyTable: null },
    resources: { selected: null },
    ui: { viewMode: false, privKeyVisible: false },
    _lastCreatedPrivKey: null,
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
        const items = data?.sshKey || (Array.isArray(data) ? data : []);
        if (AppState.tables.keyTable) {
            AppState.tables.keyTable.replaceData(items);
        } else {
            initTable(items);
        }
    } catch (err) {
        console.error('SSH Key 목록 조회 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'SSH Key 목록 조회에 실패했습니다.');
    }
}

// ─── Tabulator 테이블 ─────────────────────────────────────────────────────

function initTable(items) {
    AppState.tables.keyTable = new Tabulator('#sshkey-list-table', {
        data: items,
        layout: 'fitColumns',
        placeholder: '등록된 SSH Key가 없습니다.',
        pagination: 'local',
        paginationSize: 10,
        paginationSizeSelector: [10, 20, 50],
        paginationCounter: 'rows',
        movableColumns: true,
        initialSort: [{ column: 'name', dir: 'asc' }],
        columns: [
            { title: '이름',        field: 'name',           widthGrow: 2, sorter: 'string' },
            { title: 'Connection',  field: 'connectionName', widthGrow: 1, sorter: 'string' },
            { title: 'Fingerprint', field: 'fingerprint',    widthGrow: 2 },
            { title: 'CSP Resource ID', field: 'cspResourceId', widthGrow: 2 },
        ],
    });

    AppState.tables.keyTable.on('rowClick', async function (e, row) {
        const data = row.getData();
        // 행 클릭 시 private key 초기화 (생성 직후가 아닌 경우)
        AppState._lastCreatedPrivKey = null;
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
    document.getElementById('detail-key-connection').textContent  = data.connectionName || '-';
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

    const privSection = document.getElementById('detail-privkey-section');
    if (privateKey) {
        privSection.style.display = '';
        document.getElementById('detail-privkey').textContent = privateKey;
        document.getElementById('detail-privkey').style.filter = 'blur(4px)';
        document.getElementById('toggle-privkey-btn').textContent = '보기';
        AppState.ui.privKeyVisible = false;
    } else {
        privSection.style.display = 'none';
    }
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
    AppState._lastCreatedPrivKey = null;
}

export function togglePrivateKey() {
    const preEl  = document.getElementById('detail-privkey');
    const btnEl  = document.getElementById('toggle-privkey-btn');
    AppState.ui.privKeyVisible = !AppState.ui.privKeyVisible;
    preEl.style.filter    = AppState.ui.privKeyVisible ? 'none' : 'blur(4px)';
    preEl.style.userSelect = AppState.ui.privKeyVisible ? 'text' : 'none';
    btnEl.textContent = AppState.ui.privKeyVisible ? '숨기기' : '보기';
}

// ─── Delete ───────────────────────────────────────────────────────────────

export async function confirmDeleteSshKey() {
    const selected = AppState.resources.selected;
    if (!selected) return;
    if (!confirm(`SSH Key "${selected.name}"을 삭제하시겠습니까?`)) return;
    try {
        await sshKeyApi().del(AppState.ns, selected.name);
        showToast(TOAST_TYPES.SUCCESS, `SSH Key "${selected.name}" 삭제 완료`);
        hideDetail();
        await loadKeyList();
    } catch (err) {
        console.error('SSH Key 삭제 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'SSH Key 삭제에 실패했습니다: ' + (err.message || ''));
    }
}

// ─── Filter ───────────────────────────────────────────────────────────────

function initFilter() {
    const fieldEl = document.getElementById('filter-field');
    const typeEl  = document.getElementById('filter-type');
    const valueEl = document.getElementById('filter-value');
    if (!fieldEl || !typeEl || !valueEl) return;

    function updateFilter() {
        const field = fieldEl.value;
        const type  = typeEl.value;
        if (field && AppState.tables.keyTable) {
            AppState.tables.keyTable.setFilter(field, type, valueEl.value);
        }
    }

    fieldEl.addEventListener('change', updateFilter);
    typeEl.addEventListener('change', updateFilter);
    valueEl.addEventListener('keyup', updateFilter);

    document.getElementById('filter-clear').addEventListener('click', function () {
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
        showToast(TOAST_TYPES.WARNING, 'Connection과 Key 이름은 필수입니다.');
        return;
    }

    const spinner = document.getElementById('create-sshkey-spinner');
    const btn     = document.getElementById('create-sshkey-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    try {
        const result = await sshKeyApi().create(AppState.ns, { connectionName, name });
        const created = result?.responseData || result;
        showToast(TOAST_TYPES.SUCCESS, `SSH Key "${name}" 생성 완료`);
        bootstrap.Modal.getInstance(document.getElementById('create-sshkey-modal'))?.hide();

        // Private Key는 생성 응답에만 포함 — 즉시 상세 패널에 표시
        const privateKey = created?.privateKey || created?.privateKeyMaterial || null;
        AppState._lastCreatedPrivKey = privateKey;

        await loadKeyList();

        // 생성된 항목 선택 후 상세 패널 표시
        AppState.resources.selected = created;
        renderDetail(created, privateKey);
        showDetail();
    } catch (err) {
        console.error('SSH Key 생성 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'SSH Key 생성에 실패했습니다: ' + (err.message || ''));
    } finally {
        spinner.classList.add('d-none');
        btn.disabled = false;
    }
}

// ─── Import SSH Key 모달 ──────────────────────────────────────────────────

export async function openImportSshKeyModal() {
    AppState.ns = webconsolejs['common/api/services/workspace_api'].getCurrentProject()?.NsId || '';
    if (!AppState.ns) {
        showToast(TOAST_TYPES.WARNING, '프로젝트를 먼저 선택하세요.');
        return;
    }
    document.getElementById('import-sshkey-project').value = AppState.ns;
    await _loadConnectionOptions('import-sshkey-connection');
    new bootstrap.Modal(document.getElementById('import-sshkey-modal')).show();
}

export async function executeImportSshKey() {
    const connectionName = document.getElementById('import-sshkey-connection').value;
    if (!connectionName) {
        showToast(TOAST_TYPES.WARNING, 'Connection을 선택하세요.');
        return;
    }

    const spinner = document.getElementById('import-sshkey-spinner');
    spinner.classList.remove('d-none');

    try {
        const result = await importApi().registerCspResources(['sshKey'], connectionName, AppState.ns);
        const count  = result?.registerationOverview?.sshKey || 0;
        const failed = result?.registerationOverview?.failed || 0;
        showToast(
            failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
            `SSH Key ${count}개 등록 완료${failed > 0 ? `, ${failed}개 실패` : ''}`
        );
        bootstrap.Modal.getInstance(document.getElementById('import-sshkey-modal'))?.hide();
        await loadKeyList();
    } catch (err) {
        showToast(TOAST_TYPES.ERROR, 'SSH Key Import 실패: ' + (err.message || ''));
    } finally {
        spinner.classList.add('d-none');
    }
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

// ─── webconsolejs 등록 ────────────────────────────────────────────────────
if (typeof webconsolejs === 'undefined') { window.webconsolejs = {}; }
webconsolejs['pages/settings/environment/cloudresources/sshkeys'] = {
    loadKeyList,
    hideDetail,
    togglePrivateKey,
    confirmDeleteSshKey,
    executeCreateSshKey,
    openImportSshKeyModal,
    executeImportSshKey,
};
