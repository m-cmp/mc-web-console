// SecurityGroup 관리 페이지 — CRUD + Import
// FR-CLOUD-ADMIN-003-02 / RQ-CLOUD-ADMIN-007

import { TabulatorFull as Tabulator } from "tabulator-tables";
import { showToast, TOAST_TYPES } from "../../../../common/utils/toast.js";

const sgApi     = () => webconsolejs["common/api/services/securitygroup_api"];
const importApi = () => webconsolejs["common/api/services/import_api"];

// ─── 상태 ─────────────────────────────────────────────────────────────────
const AppState = {
    ns: '',
    tables: { sgTable: null },
    resources: { selected: null },
    ui: { viewMode: false },
};

// ─── 페이지 초기화 ────────────────────────────────────────────────────────

$('#select-current-project').on('change', async function () {
    if (this.value === '') return;
    const project = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
    AppState.ns = project?.NsId || '';
    if (AppState.ns) await loadSGList();
});

document.addEventListener('DOMContentLoaded', async function () {
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        btnList.innerHTML = `
            <button type="button" class="btn btn-primary"
              data-bs-toggle="modal" data-bs-target="#create-sg-modal">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
                viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 5l0 14"/><path d="M5 12l14 0"/>
              </svg>
              Create SG
            </button>`;
    }

    const selectedWorkspaceProject = await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
    webconsolejs['partials/layout/modal'].checkWorkspaceSelection(selectedWorkspaceProject);

    AppState.ns = selectedWorkspaceProject.nsId || '';
    initFilter();

    if (selectedWorkspaceProject.projectId !== '') {
        await loadSGList();
    }
});

// ─── SG 목록 로드 ─────────────────────────────────────────────────────────

export async function loadSGList() {
    if (!AppState.ns) return;
    try {
        const data = await sgApi().list(AppState.ns);
        const items = data?.securityGroup || (Array.isArray(data) ? data : []);
        if (AppState.tables.sgTable) {
            AppState.tables.sgTable.replaceData(items);
        } else {
            initTable(items);
        }
    } catch (err) {
        console.error('SecurityGroup 목록 조회 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'SecurityGroup 목록 조회에 실패했습니다.');
    }
}

// ─── Tabulator 테이블 ─────────────────────────────────────────────────────

function initTable(items) {
    AppState.tables.sgTable = new Tabulator('#sg-list-table', {
        data: items,
        layout: 'fitColumns',
        placeholder: '등록된 SecurityGroup이 없습니다.',
        pagination: 'local',
        paginationSize: 10,
        paginationSizeSelector: [10, 20, 50],
        paginationCounter: 'rows',
        movableColumns: true,
        initialSort: [{ column: 'name', dir: 'asc' }],
        columns: [
            { title: '이름',         field: 'name',           widthGrow: 2, sorter: 'string' },
            { title: 'Connection',   field: 'connectionName', widthGrow: 1, sorter: 'string' },
            { title: 'VPC',          field: 'vNetId',         widthGrow: 1 },
            { title: '규칙 수',       field: 'firewallRules',
              formatter: (cell) => {
                  const rules = cell.getValue() || [];
                  return `${rules.length}개`;
              },
              hozAlign: 'center', width: 90 },
            { title: 'CSP Resource ID', field: 'cspResourceId', widthGrow: 2 },
        ],
    });

    AppState.tables.sgTable.on('rowClick', async function (e, row) {
        const data = row.getData();
        AppState.resources.selected = data;
        renderDetail(data);
        showDetail();
        try {
            const detail = await sgApi().get(AppState.ns, data.name);
            if (detail) {
                AppState.resources.selected = detail;
                renderDetail(detail);
            }
        } catch (err) {
            console.error('SG 상세 조회 실패:', err);
        }
    });
}

// ─── Detail Panel ─────────────────────────────────────────────────────────

function renderDetail(data) {
    document.getElementById('detail-name').textContent         = data.name || '-';
    document.getElementById('detail-sg-name').textContent      = data.name || '-';
    document.getElementById('detail-sg-connection').textContent = data.connectionName || '-';
    document.getElementById('detail-sg-vnet').textContent      = data.vNetId || '-';
    document.getElementById('detail-sg-csp-id').textContent    = data.cspResourceId || '-';

    const rules = data.firewallRules || data.securityRuleList || [];
    const tbody    = document.getElementById('detail-rule-tbody');
    const emptyEl  = document.getElementById('detail-rule-empty');
    const tableWrap = document.getElementById('detail-rule-table-wrap');

    tbody.innerHTML = '';
    if (rules.length === 0) {
        emptyEl.classList.remove('d-none');
        tableWrap.classList.add('d-none');
    } else {
        emptyEl.classList.add('d-none');
        tableWrap.classList.remove('d-none');
        for (const r of rules) {
            const dirBadge = r.direction === 'inbound'
                ? '<span class="badge bg-blue-lt">inbound</span>'
                : '<span class="badge bg-orange-lt">outbound</span>';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dirBadge}</td>
                <td>${r.ipProtocol || r.IPProtocol || '-'}</td>
                <td>${r.fromPort || '-'}</td>
                <td>${r.toPort || '-'}</td>
                <td><code>${r.cidr || '-'}</code></td>`;
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
    document.getElementById('view-mode-cards')?.classList.remove('show');
    AppState.ui.viewMode = false;
    AppState.resources.selected = null;
}

// ─── Delete ───────────────────────────────────────────────────────────────

export async function confirmDeleteSG() {
    const selected = AppState.resources.selected;
    if (!selected) return;
    if (!confirm(`SecurityGroup "${selected.name}"을 삭제하시겠습니까?`)) return;
    try {
        await sgApi().del(AppState.ns, selected.name);
        showToast(TOAST_TYPES.SUCCESS, `SecurityGroup "${selected.name}" 삭제 완료`);
        hideDetail();
        await loadSGList();
    } catch (err) {
        console.error('SG 삭제 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'SecurityGroup 삭제에 실패했습니다: ' + (err.message || ''));
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
        if (field && AppState.tables.sgTable) {
            AppState.tables.sgTable.setFilter(field, type, valueEl.value);
        }
    }

    fieldEl.addEventListener('change', updateFilter);
    typeEl.addEventListener('change', updateFilter);
    valueEl.addEventListener('keyup', updateFilter);

    document.getElementById('filter-clear').addEventListener('click', function () {
        fieldEl.value = '';
        typeEl.value  = 'like';
        valueEl.value = '';
        if (AppState.tables.sgTable) AppState.tables.sgTable.clearFilter();
    });
}

// ─── Create SG 모달 ───────────────────────────────────────────────────────

document.getElementById('create-sg-modal')?.addEventListener('show.bs.modal', async function () {
    document.getElementById('create-sg-name').value = '';
    document.getElementById('create-sg-vnet').value = '';
    document.getElementById('create-sg-rule-list').innerHTML = '';
    await _loadConnectionOptions('create-sg-connection');
    addFirewallRuleRow();
});

export function addFirewallRuleRow() {
    const list = document.getElementById('create-sg-rule-list');
    const row = document.createElement('div');
    row.className = 'row g-2 mb-2 align-items-center sg-rule-row';
    row.innerHTML = `
        <div class="col-md-2">
          <select class="form-select form-select-sm rule-direction">
            <option value="inbound">inbound</option>
            <option value="outbound">outbound</option>
          </select>
        </div>
        <div class="col-md-2">
          <select class="form-select form-select-sm rule-protocol">
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
            <option value="icmp">ICMP</option>
            <option value="all">ALL</option>
          </select>
        </div>
        <div class="col-md-2">
          <input type="text" class="form-control form-control-sm rule-from-port"
            placeholder="From Port">
        </div>
        <div class="col-md-2">
          <input type="text" class="form-control form-control-sm rule-to-port"
            placeholder="To Port">
        </div>
        <div class="col-md-3">
          <input type="text" class="form-control form-control-sm rule-cidr"
            placeholder="CIDR (예: 0.0.0.0/0)">
        </div>
        <div class="col-md-1">
          <button type="button" class="btn btn-sm btn-outline-danger w-100"
            onclick="this.closest('.sg-rule-row').remove()">✕</button>
        </div>`;
    list.appendChild(row);
}

export async function executeCreateSG() {
    const connectionName = document.getElementById('create-sg-connection').value;
    const name           = document.getElementById('create-sg-name').value.trim();
    const vNetId         = document.getElementById('create-sg-vnet').value.trim();

    if (!connectionName || !name || !vNetId) {
        showToast(TOAST_TYPES.WARNING, 'Connection, SG 이름, VPC 이름은 필수입니다.');
        return;
    }

    const firewallRules = [];
    document.querySelectorAll('#create-sg-rule-list .sg-rule-row').forEach(row => {
        const direction  = row.querySelector('.rule-direction')?.value;
        const ipProtocol = row.querySelector('.rule-protocol')?.value;
        const fromPort   = row.querySelector('.rule-from-port')?.value.trim();
        const toPort     = row.querySelector('.rule-to-port')?.value.trim();
        const cidr       = row.querySelector('.rule-cidr')?.value.trim();
        if (ipProtocol && cidr) {
            firewallRules.push({ direction, ipProtocol, fromPort, toPort, cidr });
        }
    });

    const spinner = document.getElementById('create-sg-spinner');
    const btn     = document.getElementById('create-sg-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    try {
        await sgApi().create(AppState.ns, { connectionName, name, vNetId, firewallRules });
        showToast(TOAST_TYPES.SUCCESS, `SecurityGroup "${name}" 생성 완료`);
        bootstrap.Modal.getInstance(document.getElementById('create-sg-modal'))?.hide();
        await loadSGList();
    } catch (err) {
        console.error('SG 생성 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'SecurityGroup 생성에 실패했습니다: ' + (err.message || ''));
    } finally {
        spinner.classList.add('d-none');
        btn.disabled = false;
    }
}

// ─── Import SG 모달 ───────────────────────────────────────────────────────

export async function openImportSGModal() {
    AppState.ns = webconsolejs['common/api/services/workspace_api'].getCurrentProject()?.NsId || '';
    if (!AppState.ns) {
        showToast(TOAST_TYPES.WARNING, '프로젝트를 먼저 선택하세요.');
        return;
    }
    document.getElementById('import-sg-project').value = AppState.ns;
    await _loadConnectionOptions('import-sg-connection');
    new bootstrap.Modal(document.getElementById('import-sg-modal')).show();
}

export async function executeImportSG() {
    const connectionName = document.getElementById('import-sg-connection').value;
    if (!connectionName) {
        showToast(TOAST_TYPES.WARNING, 'Connection을 선택하세요.');
        return;
    }

    const spinner = document.getElementById('import-sg-spinner');
    spinner.classList.remove('d-none');

    try {
        const result = await importApi().registerCspResources(['securityGroup'], connectionName, AppState.ns);
        const count  = result?.registerationOverview?.securityGroup || 0;
        const failed = result?.registerationOverview?.failed || 0;
        showToast(
            failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
            `SecurityGroup ${count}개 등록 완료${failed > 0 ? `, ${failed}개 실패` : ''}`
        );
        bootstrap.Modal.getInstance(document.getElementById('import-sg-modal'))?.hide();
        await loadSGList();
    } catch (err) {
        showToast(TOAST_TYPES.ERROR, 'SecurityGroup Import 실패: ' + (err.message || ''));
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
webconsolejs['pages/settings/environment/cloudresources/securitygroups'] = {
    loadSGList,
    hideDetail,
    confirmDeleteSG,
    addFirewallRuleRow,
    executeCreateSG,
    openImportSGModal,
    executeImportSG,
};
