import { TabulatorFull as Tabulator } from 'tabulator-tables';

// ── State ─────────────────────────────────────────────────────────────────────

const AppState = {
  overviewTable: null,
  resultTable: null,
  overviewRows: [],
  overviewRaw: [],      // raw { connectionName, resourceType, resourceOverview }[]
  allConnections: [],   // from getConnConfigList: { configName, providerName, ... }[]
  lastSyncResult: [],

  // Resources 탭 (구 CSP Overview)
  resUnmanaged: [],     // onCspOnly
  resRegistered: [],    // onTumblebug
  resTable: null,
  resRegisteredTable: null,

  // Schedule 탭 (구 CSP Schedule)
  schedules: [],
  scheduleTable: null,
  historyTable: null,
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
  document.getElementById('tab-overview').style.display   = tab === 'overview'  ? '' : 'none';
  document.getElementById('tab-resources').style.display  = tab === 'resources' ? '' : 'none';
  document.getElementById('tab-schedule').style.display   = tab === 'schedule'  ? '' : 'none';
  document.getElementById('tab-result').style.display     = tab === 'result'    ? '' : 'none';
  document.getElementById('tab-nssync').style.display     = tab === 'nssync'    ? '' : 'none';
  document.querySelectorAll('#sync-tabs .nav-link').forEach(a => a.classList.remove('active'));
  if (link) link.classList.add('active');
  if (tab === 'result')   renderResultTab();
  if (tab === 'schedule') loadScheduleList();
};

// ── 조회 조건: Provider mode toggle ──────────────────────────────────────────

window.syncOnProviderModeChange = function () {
  const partial = document.querySelector('input[name="query-provider-radio"]:checked')?.value === 'partial';
  const connSection = document.getElementById('qry-conn-section');

  document.querySelectorAll('.qry-provider-cb').forEach(cb => { cb.disabled = !partial; });
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
    group.innerHTML = '<span class="text-secondary small">No Connections available for the selected Provider</span>';
    return;
  }

  group.innerHTML = providers.map(p => `
    <div class="mb-2 w-100">
      <label class="form-check mb-1">
        <input class="form-check-input qry-provider-group-cb" type="checkbox" value="${p}"
               onchange="syncToggleProviderConns('${p}', this.checked)">
        <span class="form-check-label fw-semibold text-uppercase">${p}</span>
      </label>
      <div class="ms-3 d-flex gap-3 flex-wrap">
        ${byProvider[p].map(conn =>
          `<label class="form-check mb-0">
             <input class="form-check-input qry-conn-cb" type="checkbox" value="${conn}" data-provider="${p}">
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
// 기본: disabled + unchecked — "부분 선택" 라디오 클릭 시 활성화
function populateQueryProviderCheckboxes() {
  const providers = [...new Set(AppState.allConnections.map(c => getProvider(c.configName)))].sort();
  const group = document.getElementById('qry-provider-cb-group');
  group.innerHTML = providers.map(p =>
    `<label class="form-check mb-0">
       <input class="form-check-input qry-provider-cb" type="checkbox" value="${p}" disabled onchange="syncOnProviderChange()">
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
  if (resourceTypes.length === 0) { alert('Please select at least one resource type.'); return; }

  const mode = document.querySelector('input[name="query-provider-radio"]:checked')?.value;

  if (mode === 'all') {
    await queryAll();
  } else {
    const selectedConns = Array.from(document.querySelectorAll('.qry-conn-cb:checked')).map(c => c.value);
    if (selectedConns.length === 0) { alert('Please select at least one Connection.'); return; }
    await queryPartial(selectedConns, resourceTypes);
  }
};

// All 조회: InspectResourcesOverview
async function queryAll() {
  const statusEl = document.getElementById('qry-status');
  const loading  = document.getElementById('sync-overview-loading');
  const summary  = document.getElementById('sync-summary');

  statusEl.textContent = 'Querying...';
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
      // InspectResourcesOverview 는 자원유형을 'node' 로 돌려준다 (model.StrNode)
      const displayType = item.resourceType;
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
    document.getElementById('sync-elapsed').textContent = data.elapsedTime ? `Query time: ${data.elapsedTime}s` : '';
    summary.style.display = '';

    populateSyncProviderCheckboxes();
    renderOverviewTable(AppState.overviewRows, selectedTypes);
    statusEl.textContent = '';
  } catch (e) {
    loading.style.display = 'none';
    statusEl.textContent = 'Query failed';
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
  statusEl.textContent = `0 / ${connections.length * resourceTypes.length} Querying...`;

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
            statusEl.textContent = `${done} / ${connections.length * resourceTypes.length} Querying...`;
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
    placeholder: 'Click the Query button to fetch the status.',
    pagination: 'local',
    paginationSize: 10,
    selectable: true, // false로 두면 Tabulator 내부 cap-check 버그(isNaN(false)===false)로 다중선택 자체가 깨진다
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
    // selectable:true는 row 아무데나 클릭해도 체크박스를 토글하는 내장 동작이 있다.
    // 체크박스 자체를 클릭한 게 아니면 그 토글을 즉시 되돌려, row 클릭은 Detail Card 오픈 전용으로 만든다.
    const clickedCell = row.getCells().find(c => c.getElement().contains(e.target));
    const isCheckboxCol = clickedCell?.getColumn()?.getDefinition()?.formatter === 'rowSelection';
    if (!isCheckboxCol) {
      row.toggleSelect();
    }
    renderDetailCard(row.getData(), resourceTypes || []);
  });

  AppState.overviewTable.on('rowSelectionChanged', (rows) => {
    const el = document.getElementById('sync-selected-conn');
    if (!rows || rows.length === 0) {
      el.textContent = 'Select a Connection from the status table (all if none selected)';
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
        ? `<span class="badge bg-warning text-dark">${onOnly} unregistered</span>`
        : `<span class="badge bg-success">Synced</span>`;
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
// 기본: disabled + unchecked — "부분 선택" 라디오 클릭 시 활성화
function populateSyncProviderCheckboxes() {
  const providers = [...new Set(AppState.overviewRows.map(r => getProvider(r.connectionName)))].sort();
  const group = document.getElementById('provider-cb-group');
  group.innerHTML = providers.map(p =>
    `<label class="form-check mb-0">
       <input class="form-check-input sync-provider-cb" type="checkbox" value="${p}" disabled>
       <span class="form-check-label">${p.toUpperCase()}</span>
     </label>`
  ).join('');
}

window.syncToggleProvider = function () {
  const partial = document.querySelector('input[name="provider-radio"]:checked')?.value === 'partial';
  document.querySelectorAll('.sync-provider-cb').forEach(cb => { cb.disabled = !partial; });
};

window.syncToggleResType = function () {
  const partial = document.querySelector('input[name="restype-radio"]:checked')?.value === 'partial';
  document.querySelectorAll('.sync-type-cb').forEach(cb => { cb.disabled = !partial; });
};

// ── 동기화 실행 ───────────────────────────────────────────────────────────────

// connectionName → { provider, region } — allConnections의 regionZoneInfo 우선 사용
// string split 방식은 "alibaba-us-east-1-us-east-1b" → region="us-east-1-us-east-1b" 오파싱 발생
function getProviderRegion(connectionName) {
  const conn = AppState.allConnections.find(c => c.configName === connectionName);
  if (conn) {
    return {
      provider: conn.providerName,
      region:   conn.regionZoneInfo?.assignedRegion || '',
    };
  }
  // fallback: provider만 추출 (region 필터 없음)
  return { provider: connectionName.split('-')[0], region: '' };
}

// 연결 목록 → 중복 제거된 { provider, region } 필터 배열 반환
function buildFilters(connNames) {
  const seen = new Set();
  const filters = [];
  for (const name of connNames) {
    const { provider, region } = getProviderRegion(name);
    const key = `${provider}|${region}`;
    if (!seen.has(key)) {
      seen.add(key);
      filters.push({ provider, region });
    }
  }
  return filters;
}

window.syncExecute = async function () {
  const nsId = document.getElementById('sync-ns').value;
  if (!nsId) { alert('Please select a Namespace first.'); return; }

  const restypePartial = document.querySelector('input[name="restype-radio"]:checked')?.value === 'partial';
  let types;
  if (restypePartial) {
    types = Array.from(document.querySelectorAll('.sync-type-cb:checked')).map(c => c.value);
    if (types.length === 0) { alert('Please select at least one resource type.'); return; }
    const missing = api().findMissingResourceTypeDeps(types);
    if (missing.length > 0) {
      alert('Some resource types require others to be selected together:\n\n' + missing.join('\n'));
      return;
    }
  } else {
    types = ['vNet', 'securityGroup', 'sshKey', 'node', 'dataDisk', 'customImage'];
  }

  // 대상 connection 결정 → provider/region 필터 목록 생성
  let filters;
  const selectedRows = AppState.overviewTable ? AppState.overviewTable.getSelectedData() : [];
  if (selectedRows.length > 0) {
    filters = buildFilters(selectedRows.map(r => r.connectionName));
  } else {
    const providerPartial = document.querySelector('input[name="provider-radio"]:checked')?.value === 'partial';
    if (providerPartial) {
      const selProviders = new Set(
        Array.from(document.querySelectorAll('.sync-provider-cb:checked')).map(c => c.value)
      );
      const conns = AppState.overviewRows
        .filter(r => selProviders.has(getProvider(r.connectionName)))
        .map(r => r.connectionName);
      filters = buildFilters(conns);
    } else {
      filters = [{}]; // All — provider/region 필터 없음
    }
  }

  const filterDesc = filters.length === 1 && !filters[0].provider
    ? 'All'
    : filters.map(f => `${f.provider}/${f.region}`).join(', ');

  if (!confirm(`Running sync.\nNS: ${nsId}\nTarget: ${filterDesc}\nResource Type: ${types.join(', ')}\n\nDo you want to continue?`)) return;

  const statusEl = document.getElementById('sync-exec-status');
  statusEl.className = 'text-secondary small';
  statusEl.textContent = `Running sync... (${filters.length} requests)`;

  AppState.lastSyncResult = [];
  let totalSucceeded = 0;
  let totalFailed = 0;

  for (const filter of filters) {
    try {
      const result = await api().registerCspNativeResources(nsId, filter, types);
      AppState.lastSyncResult.push({ success: true, filter, data: result });
      const ov = result?.registerationOverview || {};
      totalFailed    += ov.failed || 0;
      totalSucceeded += Object.entries(ov)
        .filter(([k]) => k !== 'failed' && k !== 'nlb')
        .reduce((s, [, v]) => s + (Number(v) || 0), 0);
    } catch (e) {
      AppState.lastSyncResult.push({ success: false, filter, error: e?.response?.data?.message || e.message });
    }
  }

  statusEl.className = totalFailed > 0 ? 'text-warning small' : 'text-success small';
  statusEl.textContent = `Completed: ${totalSucceeded} registered, ${totalFailed} failed`;

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

  const hasSuccess = AppState.lastSyncResult.some(r => r.success);
  if (!hasSuccess) {
    empty.style.display = '';
    content.style.display = 'none';
    document.getElementById('result-empty').textContent =
      `Sync failed: ${AppState.lastSyncResult.map(r => r.error).join(', ')}`;
    return;
  }

  empty.style.display   = 'none';
  content.style.display = '';

  // All 결과 집계 (다중 호출 합산)
  let totalSucceeded = 0;
  let totalFailed    = 0;
  let totalElapsed   = 0;
  let totalAvail     = 0;

  const rows = [];
  for (const entry of AppState.lastSyncResult) {
    if (!entry.success) {
      const filterLabel = entry.filter?.provider
        ? `${entry.filter.provider}/${entry.filter.region}`
        : 'All';
      rows.push({ connectionName: filterLabel, resourceType: '—', resourceId: entry.error, status: 'Error', message: '', _failed: true });
      continue;
    }
    const data     = entry.data || {};
    const globalOv = data.registerationOverview || {};
    totalFailed    += globalOv.failed || 0;
    totalSucceeded += Object.entries(globalOv)
      .filter(([k]) => k !== 'failed' && k !== 'nlb')
      .reduce((s, [, v]) => s + (Number(v) || 0), 0);
    totalElapsed   += data.elapsedTime || 0;
    totalAvail     += data.availableConnection || 0;

    // 단일 connection 응답 ({ connectionName, registerationOutputs })과
    // 다중 connection 응답 ({ registerationResult: [...] }) 두 형태 모두 처리
    const connResults = Array.isArray(data.registerationResult)
      ? data.registerationResult
      : data.connectionName ? [data] : [];
    for (const connResult of connResults) {
      const connName = connResult.connectionName || '';
      const outputs  = connResult.registerationOutputs?.output || [];
      if (outputs.length === 0) {
        rows.push({ connectionName: connName, resourceType: '—', resourceId: '(no result)', status: '—', message: '', _failed: false });
      } else {
        outputs.forEach(str => rows.push(parseOutputString(str, connName)));
      }
    }
  }

  document.getElementById('result-elapsed').textContent = totalElapsed ? `Elapsed: ${totalElapsed}s` : '';
  document.getElementById('result-summary').innerHTML = `
    <span class="text-secondary small">Available connections: <strong>${totalAvail}</strong></span>
    <span class="text-success small">Registered: <strong>${totalSucceeded}</strong></span>
    ${totalFailed > 0 ? `<span class="text-danger small">Failed: <strong>${totalFailed}</strong></span>` : ''}
  `;

  if (AppState.resultTable) {
    AppState.resultTable.destroy();
    AppState.resultTable = null;
  }

  AppState.resultTable = new Tabulator('#sync-result-table', {
    data: rows,
    layout: 'fitColumns',
    pagination: 'local',
    paginationSize: 20,
    placeholder: 'No registered resources found.',
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

// ══ Resources 탭 (구 CSP Overview) ═══════════════════════════════════════════

function httpStatus(err) {
  return err?.response?.status;
}

// Provider / Region 드롭다운 — 조회 대상 connection 을 여기서 좁힌다.
// (구 CSP Overview 는 전 커넥션 × 전 타입을 무조건 조회해 매우 무거웠다)
function populateResourceProviderSelect() {
  const sel = document.getElementById('res-provider');
  const providers = [...new Set(
    AppState.allConnections.map(c => (c.providerName || getProvider(c.configName)).toLowerCase())
  )].sort();
  providers.forEach(p => sel.appendChild(new Option(p.toUpperCase(), p)));
}

window.syncResOnProviderChange = function () {
  const provider = document.getElementById('res-provider').value;
  const sel = document.getElementById('res-region');
  sel.innerHTML = '<option value="">All Regions of the Provider</option>';
  if (!provider) return;

  const regions = [...new Set(
    AppState.allConnections
      .filter(c => (c.providerName || getProvider(c.configName)).toLowerCase() === provider)
      .map(c => c.regionZoneInfo?.assignedRegion || '')
      .filter(Boolean)
  )].sort();
  regions.forEach(r => sel.appendChild(new Option(r, r)));
};

// 선택한 provider/region 에 해당하는 connection 이름 목록
function resourceTargetConnections() {
  const provider = document.getElementById('res-provider').value;
  const region   = document.getElementById('res-region').value;
  if (!provider) return [];
  return AppState.allConnections
    .filter(c => (c.providerName || getProvider(c.configName)).toLowerCase() === provider)
    .filter(c => !region || (c.regionZoneInfo?.assignedRegion || '') === region)
    .map(c => c.configName)
    .filter(Boolean);
}

function selectedResourceFilterTypes() {
  return Array.from(document.querySelectorAll('.res-filter-type-cb:checked')).map(cb => cb.value);
}

window.syncResQuery = async function () {
  const connections = resourceTargetConnections();
  if (connections.length === 0) { alert('Please select a Provider first.'); return; }

  const types = selectedResourceFilterTypes();
  if (types.length === 0) { alert('Please select at least one resource type.'); return; }

  const loading = document.getElementById('res-loading');
  const loadingText = document.getElementById('res-loading-text');
  loading.style.display = '';

  AppState.resUnmanaged = [];
  AppState.resRegistered = [];

  const total = connections.length * types.length;
  let done = 0;
  loadingText.textContent = `0 / ${total} Querying…`;

  const tasks = [];
  for (const conn of connections) {
    for (const rt of types) {
      tasks.push(
        api().inspectResources(conn, rt)
          .then(data => {
            (data?.resources?.onCspOnly?.info || []).forEach(item => {
              AppState.resUnmanaged.push({
                connectionName: conn,
                resourceType: rt,
                cspResourceId: item.cspResourceId || item.idByCsp || '',
                refNameOrId: item.refNameOrId || item.name || '',
              });
            });
            (data?.resources?.onTumblebug?.info || []).forEach(item => {
              AppState.resRegistered.push({
                connectionName: conn,
                resourceType: rt,
                idByTb: item.idByTb || '',
                nsId: item.nsId || '',
                mciId: item.mciId || '',
                cspResourceId: item.cspResourceId || item.idByCsp || '',
                refNameOrId: item.refNameOrId || item.name || '',
              });
            });
          })
          .catch(() => {})
          .finally(() => {
            done++;
            loadingText.textContent = `${done} / ${total} Querying…`;
          })
      );
    }
  }

  await Promise.allSettled(tasks);
  loading.style.display = 'none';
  applyResourceFilter();
  renderResRegisteredTable(AppState.resRegistered);
};

window.syncResApplyFilter = applyResourceFilter;
function applyResourceFilter() {
  const checkedTypes = selectedResourceFilterTypes();
  const rows = AppState.resUnmanaged.filter(item => checkedTypes.includes(item.resourceType));

  if (AppState.resTable) {
    AppState.resTable.replaceData(rows);
  } else {
    renderResUnmanagedTable(rows);
  }
}

function renderResUnmanagedTable(data) {
  AppState.resTable = new Tabulator('#res-unmanaged-table', {
    data,
    layout: 'fitColumns',
    pagination: 'local',
    paginationSize: 20,
    placeholder: 'No unmanaged resources found. Select a Provider and click Query.',
    selectable: true,
    columns: [
      { formatter: 'rowSelection', titleFormatter: 'rowSelection', hozAlign: 'center', headerHozAlign: 'center', width: 40, headerSort: false },
      { title: 'Connection', field: 'connectionName', sorter: 'string' },
      { title: 'Type', field: 'resourceType', sorter: 'string', width: 130,
        formatter: (cell) => api().RESOURCE_TYPE_LABELS[cell.getValue()] || cell.getValue() },
      { title: 'CSP Resource ID', field: 'cspResourceId', sorter: 'string' },
      { title: 'Name / Ref ID', field: 'refNameOrId', sorter: 'string' },
    ],
  });
  AppState.resTable.on('rowSelectionChanged', (rows) => {
    // Node 가 선택된 경우에만 Infra Name 입력을 노출한다
    const hasNode = rows.some(r => r.resourceType === 'node');
    document.getElementById('res-infra-name-group').style.display = hasNode ? '' : 'none';
  });
}

function renderResRegisteredTable(data) {
  if (AppState.resRegisteredTable) {
    AppState.resRegisteredTable.replaceData(data);
    return;
  }
  AppState.resRegisteredTable = new Tabulator('#res-registered-table', {
    data,
    layout: 'fitColumns',
    pagination: 'local',
    paginationSize: 20,
    placeholder: 'No registered resources found.',
    selectable: 1,
    columns: [
      { title: 'Connection', field: 'connectionName', sorter: 'string' },
      { title: 'Type', field: 'resourceType', sorter: 'string', width: 130,
        formatter: (cell) => api().RESOURCE_TYPE_LABELS[cell.getValue()] || cell.getValue() },
      { title: 'MCMP ID', field: 'idByTb', sorter: 'string' },
      { title: 'NS', field: 'nsId', sorter: 'string', width: 90 },
      { title: 'CSP Resource ID', field: 'cspResourceId', sorter: 'string' },
    ],
  });
  AppState.resRegisteredTable.on('rowSelectionChanged', (rows) => {
    const btn = document.getElementById('res-btn-unregister');
    if (btn) btn.disabled = rows.length === 0;
  });
}

// 선행 의존성까지 채운 자원유형 집합 (securityGroup 단독 등록은 cb-tumblebug 이 거부)
function expandResourceTypeDeps(types) {
  const deps = api().RESOURCE_TYPE_DEPS;
  const out = new Set(types);
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of [...out]) {
      for (const d of (deps[t] || [])) {
        if (!out.has(d)) { out.add(d); changed = true; }
      }
    }
  }
  return [...out];
}

window.syncResRegister = async function () {
  const nsId = document.getElementById('res-ns').value;
  if (!nsId) { alert('Please select a Namespace.'); return; }

  const selected = AppState.resTable ? AppState.resTable.getSelectedData() : [];
  if (selected.length === 0) { alert('Please select at least one resource to register.'); return; }

  const infraName = document.getElementById('res-infra-name').value.trim();
  const nodes = selected.filter(r => r.resourceType === 'node');
  if (nodes.length > 0 && !infraName) {
    alert('Please enter an Infra Name for Node registration.');
    return;
  }

  // securityGroup / sshKey 는 개별 등록 API 가 없어 connection 단위로만 등록된다.
  // 선택한 한 건이 아니라 해당 connection 의 그 유형 전체가 등록되므로 먼저 확인받는다.
  const bulkTypes = ['securityGroup', 'sshKey'].filter(t => selected.some(r => r.resourceType === t));
  const bulkConns = [...new Set(selected.filter(r => bulkTypes.includes(r.resourceType)).map(r => r.connectionName))];
  const expanded = bulkTypes.length > 0 ? expandResourceTypeDeps(bulkTypes) : [];

  if (bulkTypes.length > 0) {
    const label = (t) => api().RESOURCE_TYPE_LABELS[t] || t;
    const added = expanded.filter(t => !bulkTypes.includes(t));
    const lines = [
      `${bulkTypes.map(label).join(' / ')} cannot be registered individually.`,
      '',
      `Registering will register ALL resources of the types below in the selected connection(s), not just the rows you picked.`,
      '',
      `Namespace: ${nsId}`,
      `Connections: ${bulkConns.join(', ')}`,
      `Resource types: ${expanded.map(label).join(', ')}`,
    ];
    if (added.length > 0) {
      lines.push('', `${added.map(label).join(', ')} is included automatically because the selected types require it.`);
    }
    lines.push('', 'Do you want to continue?');
    if (!confirm(lines.join('\n'))) return;
  }

  const statusEl = document.getElementById('res-register-status');
  statusEl.className = 'text-secondary small ms-2';
  statusEl.textContent = 'Registering…';

  // 자원 유형별 등록 건수를 실제 응답에서 집계한다 (API 호출 수가 아니라 자원 수)
  const tally = {};
  let failedCount = 0;
  const errors = [];
  const failedOutputs = [];

  function addOverview(result) {
    const ov = result?.registerationOverview || {};
    for (const [k, v] of Object.entries(ov)) {
      if (k === 'failed') { failedCount += Number(v) || 0; continue; }
      const n = Number(v) || 0;
      if (n > 0) tally[k] = (tally[k] || 0) + n;
    }
    for (const line of (result?.registerationOutputs?.output || [])) {
      if (String(line).includes('[Failed]')) failedOutputs.push(String(line));
    }
  }

  // vNet — 개별 등록 API 가 있어 선택한 자원만 등록한다
  for (const row of selected.filter(r => r.resourceType === 'vNet')) {
    try {
      await api().registerVNet(nsId, row.connectionName, row.cspResourceId, row.refNameOrId);
      tally.vNet = (tally.vNet || 0) + 1;
    } catch (e) {
      if (httpStatus(e) === 409) continue;   // 이미 등록됨
      failedCount++;
      errors.push(`vNet ${row.cspResourceId}: ${e?.response?.data?.message || e.message}`);
    }
  }

  // securityGroup / sshKey — connection 단위 일괄 등록
  for (const connectionName of bulkConns) {
    try {
      const result = await api().registerCspNativeResources(nsId, { connectionName }, expanded);
      addOverview(result);
    } catch (e) {
      if (httpStatus(e) === 409) continue;
      failedCount++;
      errors.push(`${connectionName}: ${e?.response?.data?.message || e.message}`);
    }
  }

  // node — Infra 단위 등록
  if (nodes.length > 0) {
    const byConn = {};
    nodes.forEach(r => { (byConn[r.connectionName] ||= []).push(r); });
    for (const [connectionName, rows] of Object.entries(byConn)) {
      try {
        await api().registerCspVm(nsId, infraName, rows.map(r => ({
          connectionName,
          cspResourceId: r.cspResourceId,
          name: r.refNameOrId,
        })));
        tally.node = (tally.node || 0) + rows.length;
      } catch (e) {
        if (httpStatus(e) === 409) continue;
        failedCount++;
        errors.push(`Node (${connectionName}): ${e?.response?.data?.message || e.message}`);
      }
    }
  }

  const summary = Object.entries(tally)
    .map(([k, v]) => `${api().RESOURCE_TYPE_LABELS[k] || k} ${v}`)
    .join(', ');
  const registeredTotal = Object.values(tally).reduce((a, b) => a + b, 0);

  statusEl.className = failedCount > 0 ? 'text-warning small ms-2' : 'text-success small ms-2';
  statusEl.textContent = registeredTotal > 0
    ? `Registered ${registeredTotal} resource(s) — ${summary}. Failed: ${failedCount}`
    : `No resource was registered. Failed: ${failedCount}`;

  if (failedCount > 0) {
    alert(['Some resources failed to register.', '', ...errors, ...failedOutputs.slice(0, 20)].join('\n'));
  }

  await window.syncResQuery();
};

window.syncResUnregister = async function () {
  const rows = AppState.resRegisteredTable ? AppState.resRegisteredTable.getSelectedData() : [];
  if (rows.length === 0) { alert('Please select a resource to unregister.'); return; }

  const row = rows[0];
  if (!confirm(`Unregister "${row.idByTb}" from MCMP?\n\nThe actual CSP resource will NOT be deleted.`)) return;

  try {
    const { nsId, idByTb, mciId, resourceType } = row;
    switch (resourceType) {
      case 'vNet':          await api().deregisterVNet(nsId, idByTb); break;
      case 'securityGroup': await api().deregisterSecurityGroup(nsId, idByTb); break;
      case 'sshKey':        await api().deregisterSshKey(nsId, idByTb); break;
      case 'node':          await api().deregisterMciVm(nsId, mciId, idByTb); break;
      default: alert(`Unregister is not supported for type: ${resourceType}`); return;
    }
    alert('Unregistered successfully.');
    await window.syncResQuery();
  } catch (e) {
    alert('Failed to unregister: ' + (e?.response?.data?.message || e.message));
  }
};

// ══ Schedule 탭 (구 CSP Schedule) ════════════════════════════════════════════

window.scheduleShowTab = function (tab, link) {
  document.getElementById('tab-schedule-list').style.display    = tab === 'list'    ? '' : 'none';
  document.getElementById('tab-schedule-history').style.display = tab === 'history' ? '' : 'none';
  document.querySelectorAll('#schedule-tabs .nav-link').forEach(a => a.classList.remove('active'));
  if (link) link.classList.add('active');
  if (tab === 'history') loadScheduleHistory();
};

function statusBadge(job) {
  if (job.autoDisabled) return '<span class="badge bg-danger">Error (auto-disabled)</span>';
  if (!job.enabled)     return '<span class="badge bg-secondary">Stopped</span>';
  if (job.status === 'Executing') return '<span class="badge bg-blue">Executing</span>';
  return '<span class="badge bg-success">Scheduled</span>';
}

async function loadScheduleList() {
  try {
    const data = await api().getScheduleList();
    const list = Array.isArray(data) ? data : (data?.scheduleInfo || []);
    AppState.schedules = list;
    renderScheduleTable(list);
  } catch (e) {
    console.error('Failed to load schedule list', e);
    renderScheduleTable([]);
  }
}

function renderScheduleTable(data) {
  if (AppState.scheduleTable) {
    AppState.scheduleTable.replaceData(data);
    return;
  }
  AppState.scheduleTable = new Tabulator('#schedule-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'No schedules. Click [+ Add Schedule] to create one.',
    columns: [
      { title: 'Job ID',         field: 'jobId',           sorter: 'string' },
      { title: 'NS',             field: 'nsId',            sorter: 'string', width: 90 },
      { title: 'Connection',     field: 'connectionName',  sorter: 'string' },
      { title: 'Resource Types', field: 'option',          sorter: 'string' },
      { title: 'Interval (s)',   field: 'intervalSeconds', sorter: 'number', width: 100 },
      { title: 'Status', headerSort: false, width: 160,
        formatter: (cell) => statusBadge(cell.getRow().getData()) },
      { title: 'Next Execution', field: 'nextExecutionAt', sorter: 'string',
        formatter: (cell) => cell.getValue() ? new Date(cell.getValue()).toLocaleString() : '—' },
      { title: 'Actions', headerSort: false, width: 100,
        formatter: (cell) => {
          const job = cell.getRow().getData();
          const jobId = job.jobId;
          if (!job.enabled || job.autoDisabled) {
            return `<button class="btn btn-sm btn-outline-success me-1" onclick="schedulePause_resume('${jobId}', 'resume')">▶</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="scheduleDelete('${jobId}')">🗑</button>`;
          }
          return `<button class="btn btn-sm btn-outline-warning me-1" onclick="schedulePause_resume('${jobId}', 'pause')">⏸</button>
                  <button class="btn btn-sm btn-outline-danger" onclick="scheduleDelete('${jobId}')">🗑</button>`;
        },
      },
    ],
  });
}

window.schedulePause_resume = async function (jobId, action) {
  try {
    if (action === 'pause') await api().pauseSchedule(jobId);
    else                    await api().resumeSchedule(jobId);
    await loadScheduleList();
  } catch (e) {
    alert(`Failed to ${action}: ` + (e?.response?.data?.message || e.message));
  }
};

window.scheduleDelete = async function (jobId) {
  if (!confirm(`Delete schedule "${jobId}"?`)) return;
  try {
    await api().deleteSchedule(jobId);
    await loadScheduleList();
  } catch (e) {
    alert('Failed to delete: ' + (e?.response?.data?.message || e.message));
  }
};

function loadScheduleHistory() {
  const historyRows = AppState.schedules.map(job => ({
    jobId: job.jobId,
    lastExecutionAt: job.lastExecutionAt || '—',
    executionCount: job.executionCount || 0,
    successCount: job.successCount || 0,
    failureCount: job.failureCount || 0,
    lastError: job.lastError || '—',
  }));

  if (AppState.historyTable) {
    AppState.historyTable.replaceData(historyRows);
    return;
  }
  AppState.historyTable = new Tabulator('#history-table', {
    data: historyRows,
    layout: 'fitColumns',
    placeholder: 'No execution history.',
    columns: [
      { title: 'Job ID',         field: 'jobId',           sorter: 'string' },
      { title: 'Last Execution', field: 'lastExecutionAt',
        formatter: (c) => c.getValue() && c.getValue() !== '—' ? new Date(c.getValue()).toLocaleString() : '—' },
      { title: 'Total Runs',     field: 'executionCount',  sorter: 'number', width: 90 },
      { title: 'Success',        field: 'successCount',    sorter: 'number', width: 80 },
      { title: 'Failure',        field: 'failureCount',    sorter: 'number', width: 80 },
      { title: 'Last Error',     field: 'lastError' },
    ],
  });
}

window.scheduleToggleModalMci = function () {
  const nodeOn = document.querySelector('.modal-type-cb[value="node"]')?.checked;
  document.getElementById('modal-mci-group').style.display = nodeOn ? '' : 'none';
};

let _modalDropdownsLoaded = false;
window.loadModalDropdownsOnce = async function () {
  if (_modalDropdownsLoaded) return;
  const selConn = document.getElementById('modal-connection');
  const selNs   = document.getElementById('modal-ns');
  selConn.innerHTML = '<option value="">Select Connection</option>';
  selNs.innerHTML   = '<option value="">Select Namespace</option>';

  AppState.allConnections.forEach(c => {
    const name = c.configName || c.connectionName || c.name;
    if (name) selConn.appendChild(new Option(name, name));
  });
  const nsList = await api().getAllNs().catch(() => []);
  nsList.forEach(n => {
    const id = n.id || n.nsId || n.name;
    if (id) selNs.appendChild(new Option(id, id));
  });
  _modalDropdownsLoaded = true;
};

window.scheduleSubmitCreate = async function () {
  const nsId           = document.getElementById('modal-ns').value;
  const connectionName = document.getElementById('modal-connection').value;
  const types          = Array.from(document.querySelectorAll('.modal-type-cb:checked')).map(c => c.value);
  const interval       = parseInt(document.getElementById('modal-interval').value) || 60;
  const nodeOn         = types.includes('node');
  const infraPrefix    = document.getElementById('modal-mci-prefix').value.trim();

  if (!nsId)           { alert('Please select a Namespace.');  return; }
  if (!connectionName) { alert('Please select a Connection.'); return; }
  if (types.length === 0) { alert('Please select at least one resource type.'); return; }

  const missing = api().findMissingResourceTypeDeps(types);
  if (missing.length > 0) {
    alert('Some resource types require others to be selected together:\n\n' + missing.join('\n'));
    return;
  }

  try {
    await api().createSchedule({
      jobType: 'registerCspResources',
      nsId,
      connectionName,
      option: types.join(','),
      intervalSeconds: interval,
      infraFlag: nodeOn ? 'y' : 'n',
      infraNamePrefix: nodeOn ? infraPrefix : undefined,
    });
    bootstrap.Modal.getInstance(document.getElementById('modal-add-schedule'))?.hide();
    await loadScheduleList();
  } catch (e) {
    alert('Failed to create schedule: ' + (e?.response?.data?.message || e.message));
  }
};

// ── NS 드롭다운 ───────────────────────────────────────────────────────────────

async function loadNsDropdown(selectId) {
  const sel = document.getElementById(selectId);
  const wsApi = webconsolejs['common/api/services/workspace_api'];
  const curWs = wsApi.getCurrentWorkspace();
  if (curWs?.Id) {
    const projects = await wsApi.getUserProjectList(curWs.Id).catch(() => []);
    const nsIds = projects.map(p => p.nsid || p.NsId).filter(Boolean);
    if (nsIds.length > 0) {
      nsIds.forEach(id => sel.appendChild(new Option(id, id)));
      return;
    }
  }
  const nsList = await api().getAllNs().catch(() => []);
  nsList.forEach(n => {
    const id = n.id || n.nsId || n.name || String(n);
    sel.appendChild(new Option(id, id));
  });
}

// ── NS 동기화 ─────────────────────────────────────────────────────────────────

window.nsSyncQuery = async function () {
  const area = document.getElementById('nssync-diff-area');
  area.innerHTML = '<p>Querying...</p>';
  const diff = await api().getProjectSyncDiff().catch(() => null);
  if (!diff) {
    area.innerHTML = '<p class="text-danger">Query failed — Check API connection.</p>';
    return;
  }
  renderNsSyncDiff(diff);
};

function renderNsSyncDiff(diff) {
  const missing    = diff.missingProjects    || [];
  const unassigned = diff.unassignedProjects || [];
  const hasIssue   = missing.length > 0 || unassigned.length > 0;
  let html = '';
  if (!hasIssue) {
    html = '<p class="text-success fw-semibold">Sync status OK — all Namespaces are assigned to a Workspace.</p>';
  } else {
    if (missing.length > 0) {
      html += `<h6 class="mb-2">Namespaces without Project (${missing.length} items)</h6>
      <table class="table table-sm table-bordered mb-3">
        <thead class="table-light"><tr><th>NS ID</th><th>NS Name</th></tr></thead>
        <tbody>${missing.map(r => `<tr><td>${r.nsId}</td><td>${r.nsName || ''}</td></tr>`).join('')}</tbody>
      </table>`;
    }
    if (unassigned.length > 0) {
      html += `<h6 class="mb-2">Projects not assigned to Workspace (${unassigned.length} items)</h6>
      <table class="table table-sm table-bordered mb-3">
        <thead class="table-light"><tr><th>Project ID</th><th>Name</th><th>NS ID</th></tr></thead>
        <tbody>${unassigned.map(r => `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.nsId || ''}</td></tr>`).join('')}</tbody>
      </table>`;
    }
  }
  document.getElementById('nssync-diff-area').innerHTML = html;
  const applyCard = document.getElementById('nssync-apply-card');
  if (hasIssue) {
    loadNsSyncWorkspaceDropdown();
    applyCard.style.display = '';
  } else {
    applyCard.style.display = 'none';
  }
}

async function loadNsSyncWorkspaceDropdown() {
  const sel = document.getElementById('nssync-workspace-sel');
  sel.innerHTML = '';
  const wsApi = webconsolejs['common/api/services/workspace_api'];
  const list = typeof wsApi.getWorkspaceList === 'function'
    ? await wsApi.getWorkspaceList().catch(() => [])
    : [];
  if (list.length === 0) {
    const cur = wsApi.getCurrentWorkspace();
    if (cur?.Id) sel.appendChild(new Option(cur.Name || cur.Id, cur.Id));
    return;
  }
  list.forEach(ws => sel.appendChild(new Option(ws.name || ws.Name || ws.id, ws.id || ws.Id)));
}

window.nsSyncApply = async function () {
  const workspaceId = document.getElementById('nssync-workspace-sel').value;
  if (!workspaceId) { alert('Please select a Workspace.'); return; }
  const resultDiv = document.getElementById('nssync-apply-result');
  resultDiv.innerHTML = '<p>Applying...</p>';

  const diff = await api().getProjectSyncDiff().catch(() => null);
  if (!diff) { resultDiv.innerHTML = '<p class="text-danger">Diff query failed</p>'; return; }

  const nsIds = [
    ...(diff.missingProjects    || []).map(r => r.nsId),
    ...(diff.unassignedProjects || []).map(r => r.nsId),
  ].filter(Boolean);

  if (nsIds.length === 0) {
    resultDiv.innerHTML = '<p class="text-success">Nothing to apply.</p>';
    return;
  }

  const result = await api().applyProjectSync(workspaceId, nsIds).catch(() => null);
  if (!result) { resultDiv.innerHTML = '<p class="text-danger">Apply failed</p>'; return; }

  resultDiv.innerHTML = `
    <ul class="list-unstyled mb-0">
      <li>Created: <strong>${(result.created || []).length}</strong> items</li>
      <li>Assigned: <strong>${(result.assigned || []).length}</strong> items</li>
      <li>Skipped: <strong>${(result.skipped || []).length}</strong> items</li>
      <li>Failed: <strong>${(result.failed  || []).length}</strong> items</li>
    </ul>`;

  await window.nsSyncQuery();
};

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  // connection 목록 로드 (빠름) — provider 체크박스/드롭다운 생성용
  const conns = await api().getConnConfigList().catch(() => []);
  AppState.allConnections = conns;
  populateQueryProviderCheckboxes();
  populateResourceProviderSelect();

  // NS 드롭다운
  await loadNsDropdown('sync-ns');
  await loadNsDropdown('res-ns');
  // 자동 조회 없음 — 사용자가 조회 버튼 클릭 시 실행
});
