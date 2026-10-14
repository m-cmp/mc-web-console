// SecurityGroup 관리 페이지 — CRUD + Import
// FR-CLOUD-ADMIN-003-02 / RQ-CLOUD-ADMIN-007

import { TabulatorFull as Tabulator } from "tabulator-tables";
import { showToast, TOAST_TYPES } from "../../../../common/utils/toast.js";
import { getProvider, getRegion, populateProviderFilterOptions, populateRegionFilterOptions } from "../../../../common/utils/cspResource.js";
import { usedByCount, usedByBadgeHtml, showAssociatedNodes, cancelAssociatedNodes, extractErrorMessage } from "../../../../common/utils/resourceUsage.js";

const sgApi     = () => webconsolejs["common/api/services/securitygroup_api"];
const importApi = () => webconsolejs["common/api/services/import_api"];
const vpcApi    = () => webconsolejs["common/api/services/vpc_api"];

// ─── 상태 ─────────────────────────────────────────────────────────────────
const AppState = {
    ns: '',
    tables: { sgTable: null },
    resources: { selected: null, all: [] },
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
        const rawItems = data?.securityGroup || (Array.isArray(data) ? data : []);
        const items = rawItems.map((v) => ({ ...v, _provider: getProvider(v), _region: getRegion(v), _usedBy: usedByCount(v) }));
        AppState.resources.all = items;
        populateProviderFilterOptions(items, 'filter-provider');
        populateRegionFilterOptions(items, 'filter-provider', 'filter-region');
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
        selectableRows: true, // false로 두면 Tabulator 내부 cap-check 버그(isNaN(false)===false)로 다중선택 자체가 깨진다
        initialSort: [{ column: 'name', dir: 'asc' }],
        columns: [
            { formatter: 'rowSelection', titleFormatter: 'rowSelection', headerSort: false, hozAlign: 'center', width: 40 },
            { title: 'Name',         field: 'name',           widthGrow: 2, sorter: 'string' },
            { title: 'Provider',     field: '_provider',      widthGrow: 1, sorter: 'string' },
            { title: 'Region',       field: '_region',        widthGrow: 1, sorter: 'string' },
            { title: 'VPC',          field: 'vNetId',         widthGrow: 1 },
            { title: 'Rules',        field: 'firewallRules',
              formatter: (cell) => {
                  const rules = cell.getValue() || [];
                  return `${rules.length}`;
              },
              hozAlign: 'center', width: 90 },
            { title: 'Used By',      field: '_usedBy',        sorter: 'number', hozAlign: 'center', width: 120,
              formatter: (cell) => usedByBadgeHtml(cell.getValue()) },
            { title: 'CSP Resource ID', field: 'cspResourceId', widthGrow: 2 },
        ],
    });

    AppState.tables.sgTable.on('rowClick', async function (e, row) {
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
        try {
            const detail = await sgApi().get(AppState.ns, data.name);
            if (detail) {
                AppState.resources.selected = detail;
                renderDetail(detail);
            }
        } catch (err) {
            console.error('SG 상세 조회 실패:', err);
        }
        await showAssociatedNodes(AppState.ns, AppState.resources.selected);
    });
}

// ─── Detail Panel ─────────────────────────────────────────────────────────

function renderDetail(data) {
    document.getElementById('detail-name').textContent          = data.name || '-';
    document.getElementById('detail-sg-name').textContent       = data.name || '-';
    document.getElementById('detail-sg-vnet').textContent       = data.vNetId || '-';
    document.getElementById('detail-sg-csp-id').textContent     = data.cspResourceId || '-';
    document.getElementById('detail-sg-csp-name').textContent   = data.cspResourceName || '-';
    document.getElementById('detail-sg-description').textContent = data.description || '-';

    document.getElementById('detail-sg-provider').textContent = getProvider(data);
    document.getElementById('detail-sg-region').textContent   = getRegion(data);
    document.getElementById('detail-sg-zone').textContent     = data.connectionConfig?.regionZoneInfo?.assignedZone || '-';

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
        tr.innerHTML = `<td class="text-muted" style="width:40%">${escapeHtml(kv.key)}</td><td>${formatKvValue(kv.value)}</td>`;
        kvTbody.appendChild(tr);
    }
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Properties 같은 값이 JSON 문자열이면 pretty-print.
// CSP 드라이버가 Go map을 quote 없이 stringify해서 주는 경우(유효 JSON 아님)도 있어,
// 그런 경우는 값을 바꾸지 않고 중괄호/대괄호 깊이 기준으로 줄바꿈만 넣어 구조를 알아볼 수 있게 한다.
function formatKvValue(value) {
    if (value == null || value === '') return '-';
    try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
            return `<pre class="mb-0 small" style="max-height:320px;overflow-y:auto;">${escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`;
        }
    } catch {
        // not valid JSON — 아래 폴백으로
    }
    if (/^[{[]/.test(value.trim())) {
        return `<pre class="mb-0 small" style="max-height:320px;overflow-y:auto;">${escapeHtml(indentBraceString(value))}</pre>`;
    }
    return escapeHtml(value);
}

function indentBraceString(str) {
    let depth = 0;
    let out = '';
    for (const ch of str) {
        if (ch === '{' || ch === '[') {
            depth++;
            out += ch + '\n' + '  '.repeat(depth);
        } else if (ch === '}' || ch === ']') {
            depth = Math.max(depth - 1, 0);
            out += '\n' + '  '.repeat(depth) + ch;
        } else if (ch === ',') {
            out += ch + '\n' + '  '.repeat(depth);
        } else {
            out += ch;
        }
    }
    return out;
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

// ─── Table 선택 기반 Edit ─────────────────────────────────────────────────

export async function triggerEditSelected() {
    const table = AppState.tables.sgTable;
    const selected = table ? table.getSelectedData() : [];
    if (selected.length !== 1) {
        webconsolejs['partials/layout/modal'].commonShowDefaultModal(
            'Validation',
            selected.length === 0
                ? 'Please select a SecurityGroup to edit.'
                : 'Please select only one SecurityGroup to edit.'
        );
        return;
    }

    const data = selected[0];
    AppState.resources.selected = data;
    try {
        const detail = await sgApi().get(AppState.ns, data.name);
        if (detail) AppState.resources.selected = detail;
    } catch (err) {
        console.error('SG 상세 조회 실패:', err);
    }
    showEditMode();
    table.deselectRow();
}

// ─── Edit Mode ────────────────────────────────────────────────────────────

// tumblebug UpdateFirewallRules(securitygroup.go:788)는 ICMP만 포트 검증을 건너뛰고
// ALL은 예외 처리가 빠져 있어, ALL 규칙이 있는 SG는 Update 호출 시 항상 500이 난다 (Create는 정상 허용).
function _hasUnsupportedAllRule(rules) {
    return (rules || []).some(r => String(r.Protocol || r.protocol || '').toUpperCase() === 'ALL');
}

export function showEditMode() {
    const selected = AppState.resources.selected;
    if (!selected) return;

    document.getElementById('edit-name').textContent    = selected.name || '';
    document.getElementById('edit-sg-name').value       = selected.name || '';
    document.getElementById('edit-sg-vnet').value       = selected.vNetId || '';
    document.getElementById('edit-sg-provider').value   = getProvider(selected);
    document.getElementById('edit-sg-region').value     = getRegion(selected);

    // 규칙 변경은 이 SG를 쓰는 Node에 바로 적용되므로 사용 중이면 영향 범위를 알린다
    const usedBy = usedByCount(selected);
    const inUseEl = document.getElementById('edit-sg-inuse-warning');
    if (inUseEl) {
        inUseEl.textContent = `This Security Group is used by ${usedBy} node(s). Rule changes apply to them immediately.`;
        inUseEl.classList.toggle('d-none', usedBy === 0);
    }

    const rules = selected.firewallRules || selected.securityRuleList || [];
    const blocked = _hasUnsupportedAllRule(rules);
    document.getElementById('edit-sg-all-warning')?.classList.toggle('d-none', !blocked);
    const saveBtn = document.getElementById('edit-save-btn');
    if (saveBtn) saveBtn.disabled = blocked;

    _renderEditRuleTable(rules);

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

function _splitPortRange(ports) {
    const str = String(ports ?? '').trim();
    if (!str) return { from: '', to: '' };
    const [from, to] = str.split('-');
    return { from: from ?? '', to: (to ?? from) ?? '' };
}

function _renderEditRuleTable(rules) {
    const list = document.getElementById('edit-sg-rule-list');
    list.innerHTML = '';
    for (const r of rules) {
        const direction = (r.Direction || r.direction || 'inbound').toLowerCase();
        const protocol  = (r.Protocol || r.ipProtocol || r.IPProtocol || 'tcp').toLowerCase();
        const { from, to } = _splitPortRange(r.Ports ?? r.Port ?? '');
        const cidr = r.CIDR || r.cidr || '';
        _appendRuleRow('edit-sg-rule-list', { direction, protocol, from, to, cidr });
    }
}

export function addEditRuleRow() {
    _appendRuleRow('edit-sg-rule-list');
}

function _appendRuleRow(listId, values = {}) {
    const list = document.getElementById(listId);
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
            placeholder="e.g. 0" value="${values.from ?? ''}">
        </div>
        <div class="col-md-2">
          <input type="text" class="form-control form-control-sm rule-to-port"
            placeholder="e.g. 65535" value="${values.to ?? ''}">
        </div>
        <div class="col-md-3">
          <input type="text" class="form-control form-control-sm rule-cidr"
            placeholder="CIDR (e.g. 0.0.0.0/0)" value="${values.cidr ?? ''}">
        </div>
        <div class="col-md-1">
          <button type="button" class="btn btn-sm btn-outline-danger w-100"
            onclick="this.closest('.sg-rule-row').remove()">✕</button>
        </div>`;
    if (values.direction) row.querySelector('.rule-direction').value = values.direction;
    if (values.protocol) row.querySelector('.rule-protocol').value = values.protocol;
    list.appendChild(row);
}

function _collectRuleRows(listId) {
    const rules = [];
    let ruleError = false;
    document.querySelectorAll(`#${listId} .sg-rule-row`).forEach(row => {
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
        rules.push({ Direction: direction, Protocol: protocol, Ports: ports, CIDR: cidr });
    });
    return { rules, ruleError };
}

export async function saveSG() {
    const selected = AppState.resources.selected;
    if (!selected) return;

    const { rules: firewallRules, ruleError } = _collectRuleRows('edit-sg-rule-list');

    if (_hasUnsupportedAllRule(firewallRules)) {
        webconsolejs['partials/layout/modal'].commonShowDefaultModal(
            'Not Supported',
            'This SecurityGroup contains an ALL protocol rule. Saving is currently blocked because the backend rejects ALL protocol rules on update (known limitation).'
        );
        return;
    }
    if (ruleError) {
        showToast(TOAST_TYPES.WARNING, 'TCP/UDP rules require From Port, To Port, and CIDR.');
        return;
    }

    const spinner = document.getElementById('edit-save-spinner');
    const btn = document.querySelector('#edit-mode-cards .btn-primary');
    spinner?.classList.remove('d-none');
    if (btn) btn.disabled = true;

    try {
        await sgApi().update(AppState.ns, selected.name, { firewallRules });
        showToast(TOAST_TYPES.SUCCESS, `SecurityGroup "${selected.name}" updated successfully`);
        const detail = await sgApi().get(AppState.ns, selected.name);
        if (detail) {
            AppState.resources.selected = detail;
            renderDetail(detail);
        }
        cancelEditMode();
        await loadSGList();
    } catch (err) {
        console.error('SG Update 실패:', err);
        showToast(TOAST_TYPES.ERROR, 'Failed to update SecurityGroup: ' + (err.message || ''));
    } finally {
        spinner?.classList.add('d-none');
        if (btn) btn.disabled = false;
    }
}

// ─── 다중선택 삭제 ───────────────────────────────────────────────────────

export function confirmBulkDelete() {
    const table = AppState.tables.sgTable;
    const selected = table ? table.getSelectedData() : [];
    if (selected.length === 0) {
        webconsolejs['partials/layout/modal'].commonShowDefaultModal(
            'Nothing Selected',
            'Please select at least one item to delete.'
        );
        return;
    }
    // 사용 중 SG는 tumblebug이 삭제를 거부하므로 요청하지 않는다
    const inUse = selected.filter((v) => v._usedBy > 0);
    const deletable = selected.filter((v) => !(v._usedBy > 0));
    const inUseLines = inUse.map((v) => `· ${v.name} — used by ${v._usedBy} node(s)`).join('\n');
    if (deletable.length === 0) {
        webconsolejs['partials/layout/modal'].commonShowDefaultModal(
            'Cannot Delete',
            `The selected SecurityGroup(s) are in use and cannot be deleted:\n${inUseLines}`
        );
        return;
    }
    AppState.resources.bulkSelected = deletable;
    const skipNote = inUse.length > 0
        ? `\n\n${inUse.length} SecurityGroup(s) are in use and will be skipped:\n${inUseLines}`
        : '';
    webconsolejs['partials/layout/modal'].commonConfirmModal(
        'commonDefaultModal',
        'Delete Selected',
        `Delete ${deletable.length} SecurityGroup(s)?${skipNote}`,
        'pages/settings/environment/cloudresources/securitygroups.executeBulkDelete'
    );
}

export async function executeBulkDelete() {
    const items = AppState.resources.bulkSelected || [];
    if (items.length === 0) return;
    const results = await Promise.allSettled(
        items.map((item) => sgApi().del(AppState.ns, item.name, { suppressErrorToast: true }))
    );
    const failures = results
        .map((r, i) => (r.status === 'rejected' ? `· ${items[i].name}: ${extractErrorMessage(r.reason)}` : null))
        .filter(Boolean);
    const succeeded = results.length - failures.length;
    showToast(
        failures.length > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
        `${succeeded} SecurityGroup(s) deleted${failures.length > 0 ? `, ${failures.length} failed` : ''}`
    );
    if (failures.length > 0) {
        webconsolejs['partials/layout/modal'].commonShowDefaultModal('Delete Failed', failures.join('\n'));
    }
    AppState.resources.bulkSelected = [];
    AppState.tables.sgTable?.deselectRow();
    hideDetail();
    await loadSGList();
}

// ─── Filter ───────────────────────────────────────────────────────────────

function initFilter() {
    const providerEl = document.getElementById('filter-provider');
    const regionEl   = document.getElementById('filter-region');
    const usageEl    = document.getElementById('filter-usage');
    const fieldEl = document.getElementById('filter-field');
    const typeEl  = document.getElementById('filter-type');
    const valueEl = document.getElementById('filter-value');
    if (!fieldEl || !typeEl || !valueEl) return;

    function updateFilter() {
        if (!AppState.tables.sgTable) return;
        const filters = [];
        if (providerEl?.value) filters.push({ field: '_provider', type: '=', value: providerEl.value });
        if (regionEl?.value) filters.push({ field: '_region', type: '=', value: regionEl.value });
        if (usageEl?.value === 'in-use') filters.push({ field: '_usedBy', type: '>', value: 0 });
        if (usageEl?.value === 'unused') filters.push({ field: '_usedBy', type: '=', value: 0 });
        if (fieldEl.value) filters.push({ field: fieldEl.value, type: typeEl.value, value: valueEl.value });
        if (filters.length > 0) {
            AppState.tables.sgTable.setFilter(filters);
        } else {
            AppState.tables.sgTable.clearFilter();
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
        showToast(TOAST_TYPES.SUCCESS, `SecurityGroup "${name}" created successfully`);
        bootstrap.Modal.getInstance(document.getElementById('create-sg-modal'))?.hide();
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
    const btn     = document.getElementById('import-sg-execute-btn');
    spinner.classList.remove('d-none');
    if (btn) btn.disabled = true;

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
        if (btn) btn.disabled = false;
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
    confirmBulkDelete,
    executeBulkDelete,
    triggerEditSelected,
    showEditMode,
    cancelEditMode,
    addEditRuleRow,
    saveSG,
    addFirewallRuleRow,
    executeCreateSG,
    openImportSGModal,
    executeImportSG,
};
