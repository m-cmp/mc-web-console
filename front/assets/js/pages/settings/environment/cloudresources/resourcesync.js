import { TabulatorFull as Tabulator } from 'tabulator-tables';

// ── State ─────────────────────────────────────────────────────────────────────

const AppState = {
  overviewTable: null,
  resultTable: null,
  overviewRows: [],
  overviewRaw: [],      // raw { connectionName, resourceType, resourceOverview }[]
  allConnections: [],   // from getConnConfigList: { configName, providerName, ... }[]
  lastSyncResult: [],
};

// connection name 첫 세그먼트가 provider
function getProvider(connectionName) {
  return connectionName.split('-')[0].toLowerCase();
}

// ── API shorthand ─────────────────────────────────────────────────────────────

function api() {
  return webconsolejs['common/api/services/cspimport_api'];
}

// ── Tab ───────────────────────────────────────────────────────────────────────

window.syncShowTab = function (tab, link) {
  document.getElementById('tab-overview').style.display = tab === 'overview' ? '' : 'none';
  document.getElementById('tab-result').style.display   = tab === 'result'   ? '' : 'none';
  document.querySelectorAll('#sync-tabs .nav-link').forEach(a => a.classList.remove('active'));
  if (link) link.classList.add('active');
  if (tab === 'result') renderResultTab();
};

// ── 조회 조건: Provider mode toggle ──────────────────────────────────────────

window.syncOnProviderModeChange = function () {
  const partial = document.querySelector('input[name="query-provider-radio"]:checked')?.value === 'partial';
  const providerGroup = document.getElementById('qry-provider-cb-group');
  const connSection   = document.getElementById('qry-conn-section');

  providerGroup.style.setProperty('display', partial ? 'flex' : 'none', 'important');
  connSection.style.display = partial ? '' : 'none';

  if (partial) syncUpdateConnCheckboxes();
};

// provider 체크박스 변경 시 connection 목록 갱신
window.syncOnProviderChange = function () {
  syncUpdateConnCheckboxes();
};

function syncUpdateConnCheckboxes() {
  const selectedProviders = new Set(
    Array.from(document.querySelectorAll('.qry-provider-cb:checked')).map(c => c.value)
  );
  const group = document.getElementById('qry-conn-cb-group');

  // provider별로 그룹 생성
  const byProvider = {};
  AppState.allConnections.forEach(c => {
    const p = getProvider(c.configName);
    if (!selectedProviders.has(p)) return;
    if (!byProvider[p]) byProvider[p] = [];
    byProvider[p].push(c.configName);
  });

  const providers = Object.keys(byProvider).sort();
  if (providers.length === 0) {
    group.innerHTML = '<span class="text-secondary small">선택된 Provider에 해당하는 Connection이 없습니다</span>';
    return;
  }

  group.innerHTML = providers.map(p => `
    <div class="mb-2 w-100">
      <label class="form-check mb-1">
        <input class="form-check-input qry-provider-group-cb" type="checkbox" value="${p}" checked
               onchange="syncToggleProviderConns('${p}', this.checked)">
        <span class="form-check-label fw-semibold text-uppercase">${p}</span>
      </label>
      <div class="ms-3 d-flex gap-3 flex-wrap">
        ${byProvider[p].map(conn =>
          `<label class="form-check mb-0">
             <input class="form-check-input qry-conn-cb" type="checkbox" value="${conn}" data-provider="${p}" checked>
             <span class="form-check-label small">${conn}</span>
           </label>`
        ).join('')}
      </div>
    </div>`
  ).join('');
}

window.syncToggleProviderConns = function (provider, checked) {
  document.querySelectorAll(`.qry-conn-cb[data-provider="${provider}"]`).forEach(cb => {
    cb.checked = checked;
  });
};

window.syncSelectAllConn = function (checked) {
  document.querySelectorAll('.qry-conn-cb').forEach(cb => { cb.checked = checked; });
  document.querySelectorAll('.qry-provider-group-cb').forEach(cb => { cb.checked = checked; });
};

// Provider 체크박스 초기 생성 (allConnections 로드 후 호출)
function populateQueryProviderCheckboxes() {
  const providers = [...new Set(AppState.allConnections.map(c => getProvider(c.configName)))].sort();
  const group = document.getElementById('qry-provider-cb-group');
  group.innerHTML = providers.map(p =>
    `<label class="form-check mb-0">
       <input class="form-check-input qry-provider-cb" type="checkbox" value="${p}" checked onchange="syncOnProviderChange()">
       <span class="form-check-label">${p.toUpperCase()}</span>
     </label>`
  ).join('');
}

// ── 조회 조건: 자원 유형 mode toggle ─────────────────────────────────────────

window.syncOnResTypeModeChange = function () {
  const partial = document.querySelector('input[name="query-restype-radio"]:checked')?.value === 'partial';
  document.getElementById('qry-restype-cb-group').style.setProperty('display', partial ? 'flex' : 'none', 'important');
};

const ALL_QUERY_TYPES = ['vNet', 'securityGroup', 'sshKey', 'node'];

function getSelectedQueryTypes() {
  const mode = document.querySelector('input[name="query-restype-radio"]:checked')?.value;
  if (mode === 'all') return ALL_QUERY_TYPES.slice();
  return Array.from(document.querySelectorAll('.qry-restype-cb:checked')).map(c => c.value);
}

// ── 조회 실행 ─────────────────────────────────────────────────────────────────

window.syncQuery = async function () {
  const resourceTypes = getSelectedQueryTypes();
  if (resourceTypes.length === 0) { alert('자원 유형을 하나 이상 선택하세요.'); return; }

  const mode = document.querySelector('input[name="query-provider-radio"]:checked')?.value;

  if (mode === 'all') {
    await queryAll();
  } else {
    const selectedConns = Array.from(document.querySelectorAll('.qry-conn-cb:checked')).map(c => c.value);
    if (selectedConns.length === 0) { alert('Connection을 하나 이상 선택하세요.'); return; }
    await queryPartial(selectedConns, resourceTypes);
  }
};

// 전체 조회: InspectResourcesOverview
async function queryAll() {
  const statusEl = document.getElementById('qry-status');
  const loading  = document.getElementById('sync-overview-loading');
  const summary  = document.getElementById('sync-summary');

  statusEl.textContent = '조회 중…';
  loading.style.display = '';
  summary.style.display = 'none';

  try {
    const data = await api().getResourcesOverview();
    loading.style.display = 'none';
    if (!data) { renderOverviewTable([], []); statusEl.textContent = ''; return; }

    const selectedTypes = Array.from(document.querySelectorAll('.qry-restype-cb:checked')).map(c => c.value);

    AppState.overviewRaw = Array.isArray(data.inspectResult) ? data.inspectResult : [];

    const connMap = {};
    for (const item of AppState.overviewRaw) {
      const conn = item.connectionName;
      if (!connMap[conn]) {
        connMap[conn] = { connectionName: conn, hasUnsynced: false };
        selectedTypes.forEach(t => { connMap[conn][t] = '-'; });
      }
      // InspectResourcesOverview uses 'vm'; map to 'node' if user selected 'node'
      const displayType = item.resourceType === 'vm' && selectedTypes.includes('node')
        ? 'node'
        : item.resourceType;
      if (selectedTypes.includes(displayType)) {
        const onTb   = item.resourceOverview?.onTumblebug ?? 0;
        const onCsp  = item.resourceOverview?.onCspTotal  ?? 0;
        const onOnly = item.resourceOverview?.onCspOnly   ?? 0;
        connMap[conn][displayType] = `${onTb}/${onCsp}`;
        if (onOnly > 0) connMap[conn].hasUnsynced = true;
      }
    }

    AppState.overviewRows = Object.values(connMap);

    const unsyncedCount = AppState.overviewRows.filter(r => r.hasUnsynced).length;
    document.getElementById('sum-total').textContent    = data.registeredConnection ?? AppState.overviewRows.length;
    document.getElementById('sum-avail').textContent    = data.availableConnection  ?? AppState.overviewRows.length;
    document.getElementById('sum-unsynced').textContent = unsyncedCount;
    document.getElementById('sync-elapsed').textContent = data.elapsedTime ? `조회 시간: ${data.elapsedTime}초` : '';
    summary.style.display = '';

    populateSyncProviderCheckboxes();
    renderOverviewTable(AppState.overviewRows, selectedTypes);
    statusEl.textContent = '';
  } catch (e) {
    loading.style.display = 'none';
    statusEl.textContent = '조회 실패';
    console.error('InspectResourcesOverview failed', e);
    renderOverviewTable([], []);
  }
}

// 부분 조회: 선택된 connection × resource type 마다 InspectResources 호출
async function queryPartial(connections, resourceTypes) {
  const statusEl = document.getElementById('qry-status');
  const loading  = document.getElementById('sync-overview-loading');
  const summary  = document.getElementById('sync-summary');

  loading.style.display = '';
  summary.style.display = 'none';
  statusEl.textContent = `0 / ${connections.length * resourceTypes.length} 조회 중…`;

  AppState.overviewRaw = [];
  const connMap = {};
  connections.forEach(conn => {
    connMap[conn] = { connectionName: conn, hasUnsynced: false };
    resourceTypes.forEach(t => { connMap[conn][t] = '-'; });
  });

  let done = 0;
  const tasks = [];
  for (const conn of connections) {
    for (const rt of resourceTypes) {
      tasks.push(
        api().inspectResources(conn, rt)
          .then(data => {
            const onTb   = data?.resources?.onTumblebug?.count ?? 0;
            const onCsp  = data?.resources?.onCspTotal?.count  ?? 0;
            const onOnly = data?.resources?.onCspOnly?.count   ?? 0;
            AppState.overviewRaw.push({
              connectionName: conn,
              resourceType: rt,
              resourceOverview: { onTumblebug: onTb, onCspTotal: onCsp, onCspOnly: onOnly },
            });
            connMap[conn][rt] = `${onTb}/${onCsp}`;
            if (onOnly > 0) connMap[conn].hasUnsynced = true;
          })
          .catch(e => { console.warn(`InspectResources failed: ${conn}/${rt}`, e); })
          .finally(() => {
            done++;
            statusEl.textContent = `${done} / ${connections.length * resourceTypes.length} 조회 중…`;
          })
      );
    }
  }

  await Promise.allSettled(tasks);
  loading.style.display = 'none';

  AppState.overviewRows = Object.values(connMap);
  const unsyncedCount = AppState.overviewRows.filter(r => r.hasUnsynced).length;
  document.getElementById('sum-total').textContent    = connections.length;
  document.getElementById('sum-avail').textContent    = AppState.overviewRows.length;
  document.getElementById('sum-unsynced').textContent = unsyncedCount;
  document.getElementById('sync-elapsed').textContent = '';
  summary.style.display = '';

  populateSyncProviderCheckboxes();
  renderOverviewTable(AppState.overviewRows, resourceTypes);
  statusEl.textContent = '';
}

// ── 현황 테이블 ───────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  vNet: 'vNet', securityGroup: 'Security Group', sshKey: 'SSH Key', node: 'Node',
};

function renderOverviewTable(data, resourceTypes) {
  // 기존 테이블이 있으면 destroy 후 재생성 (컬럼이 달라질 수 있음)
  if (AppState.overviewTable) {
    AppState.overviewTable.destroy();
    AppState.overviewTable = null;
  }

  const typeCols = (resourceTypes || []).map(t => ({
    title: TYPE_LABELS[t] || t,
    field: t,
    sorter: 'string',
    width: 110,
    hozAlign: 'center',
  }));

  AppState.overviewTable = new Tabulator('#sync-overview-table', {
    data,
    layout: 'fitColumns',
    placeholder: '조회 버튼을 클릭하여 현황을 조회하세요.',
    pagination: 'local',
    paginationSize: 10,
    selectable: true,
    rowFormatter: (row) => {
      if (row.getData().hasUnsynced) row.getElement().classList.add('table-warning');
    },
    columns: [
      { formatter: 'rowSelection', titleFormatter: 'rowSelection', hozAlign: 'center', headerHozAlign: 'center', width: 40, headerSort: false },
      { title: 'Connection', field: 'connectionName', sorter: 'string', minWidth: 160 },
      ...typeCols,
    ],
  });

  AppState.overviewTable.on('rowClick', (e, row) => {
    renderDetailCard(row.getData(), resourceTypes || []);
  });

  AppState.overviewTable.on('rowSelectionChanged', (rows) => {
    const el = document.getElementById('sync-selected-conn');
    if (!rows || rows.length === 0) {
      el.textContent = '현황 테이블에서 Connection을 선택하세요 (미선택 시 전체 대상)';
      el.className = 'form-control bg-light text-secondary';
    } else {
      el.textContent = rows.map(r => r.connectionName).join(', ');
      el.className = 'form-control bg-light text-dark';
    }
  });
}

// ── Detail Card ───────────────────────────────────────────────────────────────

function renderDetailCard(rowData, resourceTypes) {
  document.getElementById('detail-conn-name').textContent = rowData.connectionName;

  const rawMap = {};
  AppState.overviewRaw
    .filter(i => i.connectionName === rowData.connectionName)
    .forEach(i => { rawMap[i.resourceType] = i.resourceOverview; });

  const types = resourceTypes.length ? resourceTypes : Object.keys(TYPE_LABELS);
  const rows = types.map(t => {
    const ov     = rawMap[t];
    const onTb   = ov?.onTumblebug ?? '-';
    const onCsp  = ov?.onCspTotal  ?? '-';
    const onOnly = ov?.onCspOnly;
    let badge;
    if (typeof onOnly === 'number') {
      badge = onOnly > 0
        ? `<span class="badge bg-warning text-dark">${onOnly}개 미등록</span>`
        : `<span class="badge bg-success">동기화됨</span>`;
    } else {
      badge = `<span class="text-secondary small">-</span>`;
    }
    return `<tr>
      <td>${TYPE_LABELS[t] || t}</td>
      <td class="text-center">${onTb}</td>
      <td class="text-center">${onCsp}</td>
      <td class="text-center">${onOnly ?? '-'}</td>
      <td class="text-center">${badge}</td>
    </tr>`;
  });

  document.getElementById('detail-tbody').innerHTML = rows.join('');
  document.getElementById('sync-detail-card').style.display = '';
}

// ── Search ────────────────────────────────────────────────────────────────────

window.syncFilterTable = function (val) {
  if (!AppState.overviewTable) return;
  if (val) {
    AppState.overviewTable.setFilter('connectionName', 'like', val);
  } else {
    AppState.overviewTable.clearFilter();
  }
};

// ── 동기화 실행 카드: Provider / ResType toggles ──────────────────────────────

// 동기화 실행 섹션의 provider 체크박스 — 조회 결과에서 추출
function populateSyncProviderCheckboxes() {
  const providers = [...new Set(AppState.overviewRows.map(r => getProvider(r.connectionName)))].sort();
  const group = document.getElementById('provider-cb-group');
  group.innerHTML = providers.map(p =>
    `<label class="form-check mb-0">
       <input class="form-check-input sync-provider-cb" type="checkbox" value="${p}" checked>
       <span class="form-check-label">${p.toUpperCase()}</span>
     </label>`
  ).join('');
}

window.syncToggleProvider = function () {
  const partial = document.querySelector('input[name="provider-radio"]:checked')?.value === 'partial';
  document.getElementById('provider-cb-group').style.setProperty('display', partial ? 'flex' : 'none', 'important');
};

window.syncToggleResType = function () {
  const partial = document.querySelector('input[name="restype-radio"]:checked')?.value === 'partial';
  document.getElementById('restype-cb-group').style.setProperty('display', partial ? 'flex' : 'none', 'important');
};

// ── 동기화 실행 ───────────────────────────────────────────────────────────────

window.syncExecute = async function () {
  const nsId = document.getElementById('sync-ns').value;
  if (!nsId) { alert('먼저 Namespace를 선택하세요.'); return; }

  const restypePartial = document.querySelector('input[name="restype-radio"]:checked')?.value === 'partial';
  let types;
  if (restypePartial) {
    types = Array.from(document.querySelectorAll('.sync-type-cb:checked')).map(c => c.value);
    if (types.length === 0) { alert('자원 유형을 하나 이상 선택하세요.'); return; }
  } else {
    types = ['vNet', 'securityGroup', 'sshKey', 'vm', 'dataDisk', 'customImage'];
  }

  let targetConns;
  const selectedRows = AppState.overviewTable ? AppState.overviewTable.getSelectedData() : [];
  if (selectedRows.length > 0) {
    targetConns = selectedRows.map(r => r.connectionName);
  } else {
    const providerPartial = document.querySelector('input[name="provider-radio"]:checked')?.value === 'partial';
    if (providerPartial) {
      const selProviders = new Set(
        Array.from(document.querySelectorAll('.sync-provider-cb:checked')).map(c => c.value)
      );
      targetConns = AppState.overviewRows
        .filter(r => selProviders.has(getProvider(r.connectionName)))
        .map(r => r.connectionName);
    } else {
      targetConns = AppState.overviewRows.map(r => r.connectionName);
    }
  }

  if (!confirm(`동기화를 실행합니다.\nNS: ${nsId}\n자원 유형: ${types.join(', ')}\n\n계속하시겠습니까?`)) return;

  const statusEl = document.getElementById('sync-exec-status');
  statusEl.className = 'text-secondary small';
  statusEl.textContent = '동기화 실행 중… (시간이 걸릴 수 있습니다)';

  AppState.lastSyncResult = [];
  try {
    // API는 필터에 관계없이 전체 connection을 대상으로 실행됨 → 1회 호출
    const result = await api().registerCspNativeResources(nsId, {}, types);
    AppState.lastSyncResult = [{ success: true, data: result }];

    const ov = result?.registerationOverview || {};
    const failed    = ov.failed || 0;
    const succeeded = Object.entries(ov)
      .filter(([k]) => k !== 'failed' && k !== 'nlb')
      .reduce((s, [, v]) => s + (Number(v) || 0), 0);
    statusEl.className = failed > 0 ? 'text-warning small' : 'text-success small';
    statusEl.textContent = `완료: ${succeeded}개 등록, ${failed}개 실패`;
  } catch (e) {
    AppState.lastSyncResult = [{ success: false, error: e?.response?.data?.message || e.message }];
    statusEl.className = 'text-danger small';
    statusEl.textContent = `실패: ${e?.response?.data?.message || e.message}`;
  }

  const resultTabLink = document.querySelector('#sync-tabs .nav-item:last-child .nav-link');
  syncShowTab('result', resultTabLink);
};

// ── 결과 탭 ───────────────────────────────────────────────────────────────────

// output 문자열 파싱: "vNet: some-id [Failed] reason message"
const OUTPUT_RE = /^(\w+):\s+(.+?)\s+\[(\w+)\]\s*(.*)$/;

function parseOutputString(str, connectionName) {
  const m = OUTPUT_RE.exec(str.trim());
  if (!m) return { connectionName, resourceType: '—', resourceId: str, status: '—', message: '', _failed: false };
  return {
    connectionName,
    resourceType: m[1],
    resourceId:   m[2],
    status:       m[3],
    message:      m[4] || '',
    _failed:      m[3].toLowerCase() !== 'success',
  };
}

function renderResultTab() {
  const empty   = document.getElementById('result-empty');
  const content = document.getElementById('result-content');

  if (!AppState.lastSyncResult || AppState.lastSyncResult.length === 0) {
    empty.style.display   = '';
    content.style.display = 'none';
    return;
  }

  const entry = AppState.lastSyncResult[0];
  if (!entry.success) {
    empty.style.display   = '';
    content.style.display = 'none';
    document.getElementById('result-empty').textContent = `동기화 실패: ${entry.error}`;
    return;
  }

  empty.style.display   = 'none';
  content.style.display = '';

  const data     = entry.data || {};
  const globalOv = data.registerationOverview || {};
  const elapsed  = data.elapsedTime ?? '';
  const avail    = data.availableConnection ?? '';

  const failed    = globalOv.failed || 0;
  const succeeded = Object.entries(globalOv)
    .filter(([k]) => k !== 'failed' && k !== 'nlb')
    .reduce((s, [, v]) => s + (Number(v) || 0), 0);

  document.getElementById('result-elapsed').textContent = elapsed ? `소요 시간: ${elapsed}초` : '';
  document.getElementById('result-summary').innerHTML = `
    <span class="text-secondary small">가용 커넥션: <strong>${avail}</strong></span>
    <span class="text-success small">등록 성공: <strong>${succeeded}</strong></span>
    ${failed > 0 ? `<span class="text-danger small">실패: <strong>${failed}</strong></span>` : ''}
  `;

  // 각 connection별 output[] 문자열 파싱 → flat row 배열
  const rows = [];
  const connResults = Array.isArray(data.registerationResult) ? data.registerationResult : [];
  for (const connResult of connResults) {
    const connName = connResult.connectionName || '';
    const outputs  = connResult.registerationOutputs?.output || [];
    if (outputs.length === 0) {
      rows.push({ connectionName: connName, resourceType: '—', resourceId: '(결과 없음)', status: '—', message: '', _failed: false });
    } else {
      outputs.forEach(str => rows.push(parseOutputString(str, connName)));
    }
  }

  if (AppState.resultTable) {
    AppState.resultTable.destroy();
    AppState.resultTable = null;
  }

  AppState.resultTable = new Tabulator('#sync-result-table', {
    data: rows,
    layout: 'fitColumns',
    pagination: 'local',
    paginationSize: 20,
    placeholder: '등록된 자원이 없습니다.',
    rowFormatter: (row) => {
      if (row.getData()._failed) row.getElement().classList.add('table-danger');
    },
    columns: [
      { title: 'Connection',   field: 'connectionName', sorter: 'string', minWidth: 160 },
      { title: 'Type',         field: 'resourceType',   sorter: 'string', width: 120 },
      { title: 'Resource ID',  field: 'resourceId',     sorter: 'string' },
      {
        title: 'Status', field: 'status', sorter: 'string', width: 110, hozAlign: 'center',
        formatter: (cell) => {
          const v = cell.getValue();
          if (!v || v === '—') return v;
          const cls = v.toLowerCase() === 'success' ? 'bg-success' : 'bg-danger';
          return `<span class="badge ${cls}">${v}</span>`;
        },
      },
      { title: 'Message', field: 'message', sorter: 'string' },
    ],
  });
}

// ── NS 드롭다운 ───────────────────────────────────────────────────────────────

async function loadNsDropdown() {
  const nsList = await api().getAllNs().catch(() => []);
  const sel = document.getElementById('sync-ns');
  nsList.forEach(n => {
    const id = n.id || n.nsId || n.name || String(n);
    sel.appendChild(new Option(id, id));
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <a href="/webconsole/settings/environment/cloudresources/csp" class="btn btn-outline-secondary me-2">CSP Import</a>
      <a href="/webconsole/settings/environment/cloudresources/cspschedule" class="btn btn-outline-secondary">CSP Schedule</a>`;
  }

  // connection 목록 로드 (빠름) — provider 체크박스 생성용
  const conns = await api().getConnConfigList().catch(() => []);
  AppState.allConnections = conns;
  populateQueryProviderCheckboxes();

  // NS 드롭다운
  await loadNsDropdown();
  // 자동 조회 없음 — 사용자가 조회 버튼 클릭 시 실행
});
