import { TabulatorFull as Tabulator } from 'tabulator-tables';

const AppState = {
  scheduleTable: null,
  historyTable: null,
  schedules: [],
};

function api() {
  return webconsolejs['common/api/services/cspimport_api'];
}

// ── Tab ───────────────────────────────────────────────────────────────────────

window.scheduleShowTab = function (tab, link) {
  document.getElementById('tab-list').style.display    = tab === 'list'    ? '' : 'none';
  document.getElementById('tab-history').style.display = tab === 'history' ? '' : 'none';

  document.querySelectorAll('#schedule-tabs .nav-link').forEach(a => a.classList.remove('active'));
  if (link) link.classList.add('active');

  if (tab === 'history') loadHistory();
};

// ── Status badge ──────────────────────────────────────────────────────────────

function statusBadge(job) {
  if (job.autoDisabled) {
    return '<span class="badge bg-danger">Error (auto-disabled)</span>';
  }
  if (!job.enabled) {
    return '<span class="badge bg-secondary">Stopped</span>';
  }
  if (job.status === 'Executing') {
    return '<span class="badge bg-blue">Executing</span>';
  }
  return '<span class="badge bg-success">Scheduled</span>';
}

// ── Schedule List ─────────────────────────────────────────────────────────────

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
      { title: 'Job ID',         field: 'jobId',          sorter: 'string' },
      { title: 'NS',             field: 'nsId',           sorter: 'string', width: 90 },
      { title: 'Connection',     field: 'connectionName', sorter: 'string' },
      { title: 'Resource Types', field: 'option',         sorter: 'string' },
      { title: 'Interval (s)',   field: 'intervalSeconds',sorter: 'number', width: 100 },
      {
        title: 'Status',
        formatter: (cell) => statusBadge(cell.getRow().getData()),
        headerSort: false,
        width: 160,
      },
      {
        title: 'Next Execution',
        field: 'nextExecutionAt',
        formatter: (cell) => cell.getValue() ? new Date(cell.getValue()).toLocaleString() : '—',
        sorter: 'string',
      },
      {
        title: 'Actions',
        headerSort: false,
        width: 100,
        formatter: (cell) => {
          const job = cell.getRow().getData();
          const jobId = job.jobId;
          if (!job.enabled || job.autoDisabled) {
            return `<button class="btn btn-sm btn-outline-success me-1" onclick="scheduleResume('${jobId}')">▶</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="scheduleDelete('${jobId}')">🗑</button>`;
          }
          return `<button class="btn btn-sm btn-outline-warning me-1" onclick="schedulePause('${jobId}')">⏸</button>
                  <button class="btn btn-sm btn-outline-danger" onclick="scheduleDelete('${jobId}')">🗑</button>`;
        },
      },
    ],
  });
}

// ── Schedule actions ──────────────────────────────────────────────────────────

window.schedulePause = async function (jobId) {
  try {
    await api().pauseSchedule(jobId);
    await loadScheduleList();
  } catch (e) {
    alert('Failed to pause: ' + (e?.response?.data?.message || e.message));
  }
};

window.scheduleResume = async function (jobId) {
  try {
    await api().resumeSchedule(jobId);
    await loadScheduleList();
  } catch (e) {
    alert('Failed to resume: ' + (e?.response?.data?.message || e.message));
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

// ── Execution History ─────────────────────────────────────────────────────────

async function loadHistory() {
  // 스케줄 상태 API에서 실행 이력 필드 조합
  const list = AppState.schedules;
  const historyRows = list.map(job => ({
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
      { title: 'Job ID',          field: 'jobId',           sorter: 'string' },
      { title: 'Last Execution',  field: 'lastExecutionAt', formatter: (c) => c.getValue() && c.getValue() !== '—' ? new Date(c.getValue()).toLocaleString() : '—' },
      { title: 'Total Runs',      field: 'executionCount',  sorter: 'number', width: 90 },
      { title: 'Success',         field: 'successCount',    sorter: 'number', width: 80 },
      { title: 'Failure',         field: 'failureCount',    sorter: 'number', width: 80 },
      { title: 'Last Error',      field: 'lastError' },
    ],
  });
}

// ── Add Schedule Modal ────────────────────────────────────────────────────────

window.scheduleToggleModalMci = function () {
  const vmOn = document.querySelector('.modal-type-cb[value="vm"]')?.checked;
  document.getElementById('modal-mci-group').style.display = vmOn ? '' : 'none';
};

async function loadModalDropdowns() {
  const [connections, nsList] = await Promise.all([
    api().getConnConfigList().catch(() => []),
    api().getAllNs().catch(() => []),
  ]);

  const selConn = document.getElementById('modal-connection');
  const selNs   = document.getElementById('modal-ns');

  // 중복 방지
  selConn.innerHTML = '<option value="">Select Connection</option>';
  selNs.innerHTML   = '<option value="">Select Namespace</option>';

  connections.forEach(c => {
    const name = c.connectionName || c.name || String(c);
    selConn.appendChild(new Option(name, name));
  });
  nsList.forEach(n => {
    const id = n.id || n.nsId || n.name || String(n);
    selNs.appendChild(new Option(id, id));
  });
}

window.scheduleSubmitCreate = async function () {
  const nsId           = document.getElementById('modal-ns').value;
  const connectionName = document.getElementById('modal-connection').value;
  const types          = Array.from(document.querySelectorAll('.modal-type-cb:checked')).map(c => c.value);
  const interval       = parseInt(document.getElementById('modal-interval').value) || 60;
  const vmOn           = types.includes('vm');
  const mciPrefix      = document.getElementById('modal-mci-prefix').value.trim();

  if (!nsId)           { alert('Select a Namespace.');  return; }
  if (!connectionName) { alert('Select a Connection.'); return; }
  if (types.length === 0) { alert('Select at least one resource type.'); return; }

  try {
    await api().createSchedule({
      jobType: 'registerCspResources',
      nsId,
      connectionName,
      option: types.join(','),
      intervalSeconds: interval,
      mciFlag: vmOn ? 'y' : 'n',
      mciNamePrefix: vmOn ? mciPrefix : undefined,
    });
    bootstrap.Modal.getInstance(document.getElementById('modal-add-schedule'))?.hide();
    await loadScheduleList();
  } catch (e) {
    alert('Failed to create schedule: ' + (e?.response?.data?.message || e.message));
  }
};

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal-add-schedule" onclick="loadModalDropdownsOnce()">
        + Add Schedule
      </button>`;
  }

  await loadScheduleList();
});

let _modalDropdownsLoaded = false;
window.loadModalDropdownsOnce = async function () {
  if (!_modalDropdownsLoaded) {
    await loadModalDropdowns();
    _modalDropdownsLoaded = true;
  }
};
