import { TabulatorFull as Tabulator } from 'tabulator-tables';

// ── State ─────────────────────────────────────────────────────────────────────

const AppState = {
  allUnmanaged: [],      // 전체 미관리 자원 (onCspOnly)
  allRegistered: [],     // 전체 등록 자원 (onTumblebug)
  filtered: [],
  table: null,
  registeredTable: null,
};

// ── API shorthand ─────────────────────────────────────────────────────────────

function api() {
  return webconsolejs['common/api/services/cspimport_api'];
}

// ── Dropdowns ─────────────────────────────────────────────────────────────────

async function loadDropdowns() {
  const [connections, nsList] = await Promise.all([
    api().getConnConfigList().catch(() => []),
    api().getAllNs().catch(() => []),
  ]);

  const filterConn = document.getElementById('filter-connection');
  const targetConn = document.getElementById('target-connection');
  const targetNs   = document.getElementById('target-ns');

  connections.forEach(c => {
    const name = c.connectionName || c.name || String(c);
    filterConn.appendChild(new Option(name, name));
    targetConn.appendChild(new Option(name, name));
  });

  nsList.forEach(n => {
    const id = n.id || n.nsId || n.name || String(n);
    targetNs.appendChild(new Option(id, id));
  });
}

// ── Inspect (load all unmanaged) ──────────────────────────────────────────────

async function loadAllUnmanaged() {
  const loading = document.getElementById('csp-loading');
  loading.style.display = '';
  AppState.allUnmanaged = [];

  const filterConn = document.getElementById('filter-connection');
  const connections = Array.from(filterConn.options)
    .map(o => o.value)
    .filter(v => v !== '');

  if (connections.length === 0) {
    loading.style.display = 'none';
    renderTable([]);
    return;
  }

  const resourceTypes = ['vNet', 'securityGroup', 'sshKey', 'vm'];
  AppState.allRegistered = [];
  const tasks = [];
  for (const conn of connections) {
    for (const rt of resourceTypes) {
      tasks.push(
        api().inspectResources(conn, rt)
          .then(data => {
            // 미관리 (onCspOnly)
            const unmanaged = data?.resources?.onCspOnly?.info || [];
            unmanaged.forEach(item => {
              AppState.allUnmanaged.push({
                connectionName: conn,
                resourceType: rt,
                cspResourceId: item.cspResourceId || item.idByCsp || '',
                refNameOrId: item.refNameOrId || item.name || '',
              });
            });
            // 등록됨 (onTumblebug)
            const registered = data?.resources?.onTumblebug?.info || [];
            registered.forEach(item => {
              AppState.allRegistered.push({
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
      );
    }
  }

  await Promise.allSettled(tasks);
  loading.style.display = 'none';
  applyFilter();
  renderRegisteredTable(AppState.allRegistered);
}

// ── Filter ────────────────────────────────────────────────────────────────────

window.cspApplyFilter = applyFilter;
function applyFilter() {
  const conn = document.getElementById('filter-connection').value;
  const checkedTypes = Array.from(
    document.querySelectorAll('.filter-type-cb:checked')
  ).map(cb => cb.value);

  AppState.filtered = AppState.allUnmanaged.filter(item =>
    (conn === '' || item.connectionName === conn) &&
    checkedTypes.includes(item.resourceType)
  );

  if (AppState.table) {
    AppState.table.replaceData(AppState.filtered);
  } else {
    renderTable(AppState.filtered);
  }
}

// ── Table ─────────────────────────────────────────────────────────────────────

function renderTable(data) {
  AppState.table = new Tabulator('#csp-unmanaged-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'No unmanaged resources found. Click Refresh to load.',
    selectable: true,
    columns: [
      { formatter: 'rowSelection', titleFormatter: 'rowSelection', hozAlign: 'center', headerHozAlign: 'center', width: 40, headerSort: false },
      { title: 'Connection', field: 'connectionName', sorter: 'string' },
      { title: 'Type', field: 'resourceType', sorter: 'string', width: 130 },
      { title: 'CSP Resource ID', field: 'cspResourceId', sorter: 'string' },
      { title: 'Name / Ref ID', field: 'refNameOrId', sorter: 'string' },
    ],
  });
}

// ── Registered Resources Table (FR-007-03) ────────────────────────────────────

function renderRegisteredTable(data) {
  if (AppState.registeredTable) {
    AppState.registeredTable.replaceData(data);
    return;
  }
  AppState.registeredTable = new Tabulator('#csp-registered-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'No registered resources found.',
    selectable: 1,
    columns: [
      { title: 'Connection', field: 'connectionName', sorter: 'string' },
      { title: 'Type', field: 'resourceType', sorter: 'string', width: 130 },
      { title: 'MCMP ID', field: 'idByTb', sorter: 'string' },
      { title: 'NS', field: 'nsId', sorter: 'string', width: 90 },
      { title: 'CSP Resource ID', field: 'cspResourceId', sorter: 'string' },
    ],
  });
  AppState.registeredTable.on('rowSelectionChanged', (rows) => {
    const btn = document.getElementById('btn-unregister');
    if (btn) btn.disabled = rows.length === 0;
  });
}

window.cspUnregister = async function () {
  const rows = AppState.registeredTable ? AppState.registeredTable.getSelectedData() : [];
  if (rows.length === 0) { alert('Select a resource to unregister.'); return; }

  const row = rows[0];
  if (!confirm(`Unregister "${row.idByTb}" from MCMP?\n\nThe actual CSP resource will NOT be deleted.`)) return;

  try {
    const { nsId, idByTb, mciId, resourceType } = row;
    switch (resourceType) {
      case 'vNet':          await api().deregisterVNet(nsId, idByTb); break;
      case 'securityGroup': await api().deregisterSecurityGroup(nsId, idByTb); break;
      case 'sshKey':        await api().deregisterSshKey(nsId, idByTb); break;
      case 'vm':            await api().deregisterMciVm(nsId, mciId, idByTb); break;
      default: alert(`Unregister not supported for type: ${resourceType}`); return;
    }
    alert('Unregistered successfully.');
    await loadAllUnmanaged();
  } catch (e) {
    alert('Failed to unregister: ' + (e?.response?.data?.message || e.message));
  }
};

// ── Toggle helpers ────────────────────────────────────────────────────────────

window.cspToggleMciName = function () {
  const vmChecked = document.querySelector('.target-type-cb[value="vm"]')?.checked;
  document.getElementById('mci-name-group').style.display = vmChecked ? '' : 'none';
};

window.cspToggleSchedule = function () {
  const on = document.getElementById('schedule-toggle').checked;
  document.getElementById('schedule-interval-group').style.display = on ? '' : 'none';
};

// ── Register ─────────────────────────────────────────────────────────────────

window.cspSubmitRegist = async function () {
  const connectionName = document.getElementById('target-connection').value;
  const nsId           = document.getElementById('target-ns').value;
  const isSchedule     = document.getElementById('schedule-toggle').checked;
  const targetTypes    = Array.from(
    document.querySelectorAll('.target-type-cb:checked')
  ).map(cb => cb.value);

  if (!connectionName) { alert('Select a Connection.'); return; }
  if (!nsId)           { alert('Select a Namespace.');  return; }
  if (targetTypes.length === 0) { alert('Select at least one resource type.'); return; }

  const vmChecked = targetTypes.includes('vm');
  const mciName   = document.getElementById('target-mci-name').value.trim();
  if (vmChecked && !mciName) { alert('Enter an MCI Name for VM registration.'); return; }

  if (isSchedule) {
    await submitSchedule(nsId, connectionName, targetTypes, mciName);
  } else {
    await submitImmediate(nsId, connectionName, targetTypes, mciName);
  }
};

async function submitImmediate(nsId, connectionName, targetTypes, mciName) {
  const selectedRows = AppState.table ? AppState.table.getSelectedData() : [];
  let successCount = 0;
  let failCount = 0;
  const errors = [];

  // vNet: 선택 항목 건별 등록
  if (targetTypes.includes('vNet')) {
    const vNets = selectedRows.filter(r => r.resourceType === 'vNet');
    for (const row of vNets) {
      try {
        await api().registerVNet(nsId, connectionName, row.cspResourceId, row.refNameOrId);
        successCount++;
      } catch (e) {
        failCount++;
        errors.push(`vNet ${row.cspResourceId}: ${e?.response?.data?.message || e.message}`);
      }
    }
  }

  // securityGroup: Connection 단위 일괄
  if (targetTypes.includes('securityGroup')) {
    try {
      await api().registerCspNativeResources(nsId, connectionName, ['securityGroup']);
      successCount++;
    } catch (e) {
      failCount++;
      errors.push(`securityGroup: ${e?.response?.data?.message || e.message}`);
    }
  }

  // sshKey: Connection 단위 일괄
  if (targetTypes.includes('sshKey')) {
    try {
      await api().registerCspNativeResources(nsId, connectionName, ['sshKey']);
      successCount++;
    } catch (e) {
      failCount++;
      errors.push(`sshKey: ${e?.response?.data?.message || e.message}`);
    }
  }

  // VM: MCI 단위
  if (targetTypes.includes('vm')) {
    const vms = selectedRows.filter(r => r.resourceType === 'vm');
    if (vms.length > 0) {
      try {
        await api().registerCspVm(nsId, mciName, vms.map(r => ({
          connectionName,
          cspResourceId: r.cspResourceId,
          name: r.refNameOrId,
        })));
        successCount++;
      } catch (e) {
        failCount++;
        errors.push(`VM: ${e?.response?.data?.message || e.message}`);
      }
    }
  }

  const msg = failCount === 0
    ? `Registration complete. ${successCount} item(s) registered.`
    : `Partial success: ${successCount} succeeded, ${failCount} failed.\n${errors.join('\n')}`;
  alert(msg);

  // 완료 후 재조회
  await loadAllUnmanaged();
}

async function submitSchedule(nsId, connectionName, targetTypes, mciNamePrefix) {
  const interval = parseInt(document.getElementById('schedule-interval').value) || 60;
  const vmChecked = targetTypes.includes('vm');
  try {
    await api().createSchedule({
      jobType: 'registerCspResources',
      nsId,
      connectionName,
      option: targetTypes.join(','),
      intervalSeconds: interval,
      mciFlag: vmChecked ? 'y' : 'n',
      mciNamePrefix: vmChecked ? mciNamePrefix : undefined,
    });
    alert('Schedule created. Check the CSP Schedule page.');
  } catch (e) {
    alert('Failed to create schedule: ' + (e?.response?.data?.message || e.message));
  }
}

// ── Reload ────────────────────────────────────────────────────────────────────

window.cspReloadAll = loadAllUnmanaged;

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <a href="/webconsole/settings/environment/cloudresources/cspschedule" class="btn btn-outline-secondary">
        CSP Schedule
      </a>`;
  }

  await loadDropdowns();
  await loadAllUnmanaged();
});
