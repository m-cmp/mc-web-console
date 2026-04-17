// SecurityGroup 관리 페이지 — CRUD + Import
// FR-CLOUD-ADMIN-003-02 / RQ-CLOUD-ADMIN-007

import { TabulatorFull as Tabulator } from "tabulator-tables";
import { showToast, TOAST_TYPES } from "../../../../common/utils/toast.js";

const sgApi     = () => webconsolejs["common/api/services/securitygroup_api"];
const importApi = () => webconsolejs["common/api/services/import_api"];
const vpcApi    = () => webconsolejs["common/api/services/vpc_api"];

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
        showToast(TOAST_TYPES.ERROR, 'Failed to load SecurityGroup list.');
    }
}

// ─── Tabulator 테이블 ─────────────────────────────────────────────────────

function initTable(items) {
    AppState.tables.sgTable = new Tabulator('#sg-list-table', {
        data: items,
        layout: 'fitColumns',
        placeholder: 'No SecurityGroups registered.',
        pagination: 'local',
        paginationSize: 10,
        paginationSizeSelector: [10, 20, 50],
        paginationCounter: 'rows',
        movableColumns: true,
        initialSort: [{ column: 'name', dir: 'asc' }],
        columns: [
            { title: 'Name',         field: 'name',           widthGrow: 2, sorter: 'string' },
            { title: 'Connection',   field: 'connectionName', widthGrow: 1, sorter: 'string' },
            { title: 'VPC',          field: 'vNetId',         widthGrow: 1 },
            { title: 'Rules',        field: 'firewallRules',
              formatter: (cell) => {
                  const rules = cell.getValue() || [];
                  return `${rules.length}`;
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
    document.getElementById('detail-name').textContent          = data.name || '-';
    document.getElementById('detail-sg-name').textContent       = data.name || '-';
    document.getElementById('detail-sg-connection').textContent = data.connectionName || '-';
    document.getElementById('detail-sg-vnet').textContent       = data.vNetId || '-';
    document.getElementById('detail-sg-csp-id').textContent     = data.cspResourceId || '-';
    document.getElementById('detail-sg-csp-name').textContent   = data.cspResourceName || '-';
    document.getElementById('detail-sg-uid').textContent        = data.uid || '-';
    document.getElementById('detail-sg-description').textContent = data.description || '-';

    const cc = data.connectionConfig;
    document.getElementById('detail-sg-provider').textContent = cc?.providerName || '-';
    document.getElementById('detail-sg-region').textContent   = cc?.regionZoneInfo?.assignedRegion || '-';
    document.getElementById('detail-sg-zone').textContent     = cc?.regionZoneInfo?.assignedZone || '-';

    // Firewall Rules
    const rules     = data.firewallRules || data.securityRuleList || [];
    const tbody     = document.getElementById('detail-rule-tbody');
    const emptyEl   = document.getElementById('detail-rule-empty');
    const tableWrap = document.getElementById('detail-rule-table-wrap');

    tbody.innerHTML = '';
    if (rules.length === 0) {
        emptyEl.classList.remove('d-none');
        tableWrap.classList.add('d-none');
    } else {
        emptyEl.classList.add('d-none');
        tableWrap.classList.remove('d-none');
        for (const r of rules) {
            const dir      = (r.Direction || r.direction || '').toLowerCase();
            const dirBadge = dir === 'inbound'
                ? '<span class="badge bg-blue-lt">inbound</span>'
                : '<span class="badge bg-orange-lt">outbound</span>';
            const protocol = r.Protocol || r.ipProtocol || r.IPProtocol || '-';
            const port     = (r.Port !== undefined ? r.Port : (r.fromPort !== undefined ? r.fromPort : null));
            const portText = port === null ? '-' : (port === '' ? 'ALL' : port);
            const cidr     = r.CIDR || r.cidr || '-';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dirBadge}</td>
                <td>${protocol}</td>
                <td>${portText}</td>
                <td><code>${cidr}</code></td>`;
            tbody.appendChild(tr);
        }
    }

    // keyValueList
    const kvTbody = document.getElementById('detail-kv-tbody');
    kvTbody.innerHTML = '';
    for (const kv of (data.keyValueList || [])) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="text-muted" style="width:40%">${kv.key}</td><td>${kv.value || '-'}</td>`;
        kvTbody.appendChild(tr);
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
    if (!confirm(`Delete SecurityGroup "${selected.name}"?`)) return;
    try {
        await sgApi().del(AppState.ns, selected.name);
        showToast(TOAST_TYPES.SUCCESS, `SecurityGroup "${selected.name}" deleted.`);
        hideDetail();
        await loadSGList();
    } catch (err) {
        console.error('Delete SG failed:', err);
        showToast(TOAST_TYPES.ERROR, 'Failed to delete SecurityGroup: ' + (err.message || ''));
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

document.getElementById('create-sg-modal')?.addEventListener('hidden.bs.modal', function () {
    document.getElementById('create-sg-name').value = '';
    document.getElementById('create-sg-connection-display').value = '';
    document.getElementById('create-sg-rule-list').innerHTML = '';
});

document.getElementById('create-sg-modal')?.addEventListener('show.bs.modal', async function () {
    await _loadVNetOptions('create-sg-vnet-select', AppState.ns);
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
            placeholder="e.g. 0">
        </div>
        <div class="col-md-2">
          <input type="text" class="form-control form-control-sm rule-to-port"
            placeholder="e.g. 65535">
        </div>
        <div class="col-md-3">
          <input type="text" class="form-control form-control-sm rule-cidr"
            placeholder="CIDR (e.g. 0.0.0.0/0)">
        </div>
        <div class="col-md-1">
          <button type="button" class="btn btn-sm btn-outline-danger w-100"
            onclick="this.closest('.sg-rule-row').remove()">✕</button>
        </div>`;
    list.appendChild(row);
}

export async function executeCreateSG() {
    const vNetEl         = document.getElementById('create-sg-vnet-select');
    const vNetId         = vNetEl?.value || '';
    const connectionName = document.getElementById('create-sg-connection-display').value.trim();
    const name           = document.getElementById('create-sg-name').value.trim();

    if (!vNetId || !connectionName || !name) {
        showToast(TOAST_TYPES.WARNING, 'VPC and SG name are required.');
        return;
    }

    const firewallRules = [];
    let ruleError = false;
    document.querySelectorAll('#create-sg-rule-list .sg-rule-row').forEach(row => {
        const direction  = row.querySelector('.rule-direction')?.value;
        const protocol   = row.querySelector('.rule-protocol')?.value.toUpperCase();
        const fromPort   = row.querySelector('.rule-from-port')?.value.trim();
        const toPort     = row.querySelector('.rule-to-port')?.value.trim();
        const cidr       = row.querySelector('.rule-cidr')?.value.trim();
        if (!protocol && !cidr) return;
        const needsPort = protocol !== 'ICMP' && protocol !== 'ALL';
        if (needsPort && (!fromPort || !toPort)) { ruleError = true; return; }
        if (!cidr) { ruleError = true; return; }
        const ports = needsPort
            ? (fromPort === toPort ? fromPort : `${fromPort}-${toPort}`)
            : '';
        firewallRules.push({ Direction: direction, Protocol: protocol, Ports: ports, CIDR: cidr });
    });

    if (ruleError) {
        showToast(TOAST_TYPES.WARNING, 'TCP/UDP rules require From Port, To Port, and CIDR.');
        return;
    }

    const spinner = document.getElementById('create-sg-spinner');
    const btn     = document.getElementById('create-sg-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    try {
        await sgApi().create(AppState.ns, { connectionName, name, vNetId, firewallRules });
        showToast(TOAST_TYPES.SUCCESS, `SecurityGroup "${name}" created.`);
        document.querySelector('#create-sg-modal .btn-close')?.click();
        await loadSGList();
    } catch (err) {
        console.error('Create SG failed:', err);
        showToast(TOAST_TYPES.ERROR, 'Failed to create SecurityGroup: ' + (err.message || ''));
    } finally {
        spinner.classList.add('d-none');
        btn.disabled = false;
    }
}

// ─── Import SG 모달 ───────────────────────────────────────────────────────

export async function openImportSGModal() {
    AppState.ns = webconsolejs['common/api/services/workspace_api'].getCurrentProject()?.NsId || '';
    if (!AppState.ns) {
        showToast(TOAST_TYPES.WARNING, 'Please select a project first.');
        return;
    }
    document.getElementById('import-sg-project').value = AppState.ns;
    await _loadConnectionOptions('import-sg-connection');
    new bootstrap.Modal(document.getElementById('import-sg-modal')).show();
}

export async function executeImportSG() {
    const connectionName = document.getElementById('import-sg-connection').value;
    if (!connectionName) {
        showToast(TOAST_TYPES.WARNING, 'Please select a Connection.');
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
            `${count} SecurityGroup(s) imported${failed > 0 ? `, ${failed} failed` : ''}`
        );
        bootstrap.Modal.getInstance(document.getElementById('import-sg-modal'))?.hide();
        await loadSGList();
    } catch (err) {
        showToast(TOAST_TYPES.ERROR, 'Failed to import SecurityGroups: ' + (err.message || ''));
    } finally {
        spinner.classList.add('d-none');
    }
}

async function _loadVNetOptions(selectId, ns) {
    const select = document.getElementById(selectId);
    if (!ns) {
        select.innerHTML = '<option value="">-- Select VPC --</option>';
        return;
    }
    try {
        const data  = await vpcApi().getAllVNet(ns);
        select.innerHTML = '<option value="">-- Select VPC --</option>';
        const vNets = data?.vNet || (Array.isArray(data) ? data : []);
        if (vNets.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.textContent = 'No VPCs registered.';
            select.appendChild(opt);
            return;
        }
        for (const v of vNets) {
            const opt = document.createElement('option');
            opt.value = v.name;
            opt.dataset.connection = v.connectionName || '';
            opt.textContent = `${v.name} (${v.connectionName || '-'})`;
            select.appendChild(opt);
        }
        select.onchange = function () {
            const chosen = this.options[this.selectedIndex];
            document.getElementById('create-sg-connection-display').value =
                chosen?.dataset?.connection || '';
        };
    } catch (err) {
        console.error('VPC 목록 로드 실패:', err);
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
webconsolejs['pages/settings/environment/cloudresources/securitygroups'] = {
    loadSGList,
    hideDetail,
    confirmDeleteSG,
    addFirewallRuleRow,
    executeCreateSG,
    openImportSGModal,
    executeImportSG,
};
