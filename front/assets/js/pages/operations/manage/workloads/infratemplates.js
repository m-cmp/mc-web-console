import { TabulatorFull as Tabulator } from "tabulator-tables";

const AppState = {
  resources: { list: [], selected: null },
  ui: { viewMode: false },
  tables: { resourceTable: null },
  ns: ''
};

// project 변경 시 목록 재조회
$('#select-current-project').on('change', async function () {
  if (this.value === '') return;
  const project = { Id: this.value, Name: this.options[this.selectedIndex].text, NsId: this.options[this.selectedIndex].text };
  webconsolejs['common/api/services/workspace_api'].setCurrentProject(project);
  AppState.ns = project.NsId;
  hideDetail();
  await loadList();
  await loadInfraList();
});

async function loadList() {
  const ns = AppState.ns;
  if (!ns) return;
  try {
    const data = await webconsolejs['common/api/services/infratemplate_api'].list(ns);
    const items = data?.templates || [];
    AppState.resources.list = items;
    if (AppState.tables.resourceTable) {
      AppState.tables.resourceTable.replaceData(items);
    } else {
      initTable(items);
    }
  } catch (e) {
    if (e?.response?.status !== 404) console.error('Failed to load infra templates', e);
    AppState.resources.list = [];
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData([]);
    else initTable([]);
  }
}

function nodeGroupSummary(infraDynamicReq) {
  const groups = infraDynamicReq?.nodeGroups || [];
  const total = groups.reduce((sum, g) => sum + (Number(g.nodeGroupSize) || 0), 0);
  return `${groups.length} group(s) / ${total} node(s)`;
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#template-table', {
    data: data,
    layout: 'fitColumns',
    placeholder: 'No infra templates found.',
    columns: [
      { title: 'Name', field: 'name', sorter: 'string' },
      { title: 'Description', field: 'description', sorter: 'string' },
      {
        title: 'NodeGroups', field: 'infraDynamicReq', headerSort: false,
        formatter: function (cell) {
          return nodeGroupSummary(cell.getValue());
        }
      },
      {
        title: 'Source', field: 'source', sorter: 'string', width: 100,
        formatter: function (cell) {
          const v = cell.getValue();
          return v ? '<span class="badge bg-blue-lt">' + v + '</span>' : '-';
        }
      },
      { title: 'Created', field: 'createdAt', sorter: 'string', width: 180 },
      { title: 'Updated', field: 'updatedAt', sorter: 'string', width: 180 }
    ]
  });

  AppState.tables.resourceTable.on('rowClick', function (e, row) {
    const rowData = row.getData();
    AppState.resources.selected = rowData;
    renderDetail(rowData);
    showDetail();
  });
}

function renderDetail(data) {
  document.getElementById('detail-name').textContent = data.name || '-';
  document.getElementById('detail-id').textContent = data.id || '-';
  document.getElementById('detail-description').textContent = data.description || '-';
  document.getElementById('detail-source').textContent = data.source || '-';
  document.getElementById('detail-resourceType').textContent = data.resourceType || '-';
  document.getElementById('detail-createdAt').textContent = data.createdAt || '-';
  document.getElementById('detail-updatedAt').textContent = data.updatedAt || '-';

  const req = data.infraDynamicReq || {};

  const tbody = document.getElementById('detail-nodegroup-rows');
  tbody.innerHTML = '';
  const groups = req.nodeGroups || [];
  if (groups.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.className = 'text-muted';
    td.textContent = '-';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    groups.forEach(g => {
      const tr = document.createElement('tr');
      const rootDisk = [g.rootDiskType, g.rootDiskSize].filter(v => v !== undefined && v !== '' && v !== 0).join(' / ');
      [g.name, g.specId, g.imageId, g.nodeGroupSize, g.connectionName, rootDisk, g.zone].forEach(val => {
        const td = document.createElement('td');
        td.textContent = (val === undefined || val === null || val === '') ? '-' : String(val);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  // postCommands는 다단계 phase 배열(cb-tumblebug v0.12.29+). 이 화면은 phase 구분 없이
  // 전 phase의 command를 순서대로 이어붙여 표시한다(최소안 — 다단계 UI는 범위 밖).
  const commands = (req.postCommands || []).flatMap(pc => pc.command || []);
  document.getElementById('detail-postCommand').textContent = commands.length ? commands.join('\n') : '-';

  document.getElementById('detail-raw-json').textContent = JSON.stringify(req, null, 2);
}

function showDetail() {
  const el = document.getElementById('view-mode-cards');
  if (el) el.classList.add('show');
  AppState.ui.viewMode = true;
}

window.hideDetail = function () {
  const el = document.getElementById('view-mode-cards');
  if (el) el.classList.remove('show');
  AppState.ui.viewMode = false;
  AppState.resources.selected = null;
};

// ─── MCI List (From-MCI mode) ──────────────────────────────────────────

async function loadInfraList() {
  const ns = AppState.ns;
  if (!ns) return;
  try {
    const resp = await webconsolejs['common/api/http'].commonAPIPost('/api/mc-infra-manager/GetAllInfra', {
      pathParams: { nsId: ns },
      queryParams: { option: 'id' }
    });
    const ids = resp?.data?.responseData?.output || [];
    const sel = document.getElementById('create-mci-select');
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    ids.forEach(id => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = id;
      sel.appendChild(opt);
    });
  } catch (e) {
    console.error('Failed to load MCI list', e);
  }
}

// ─── Create / Edit Modal ───────────────────────────────────────────────

window.onCreateModeChange = function (mode) {
  document.getElementById('create-frommci-fields').style.display = mode === 'mci' ? '' : 'none';
};

window.extractFromMci = async function () {
  const ns = AppState.ns;
  const infraId = document.getElementById('create-mci-select').value;
  if (!ns) { webconsolejs['common/util'].showToast('Please select a project first.', 'error'); return; }
  if (!infraId) { webconsolejs['common/util'].showToast('Please select an Infra.', 'error'); return; }
  try {
    const req = await webconsolejs['common/api/services/infratemplate_api'].getInfraReqFromInfra(ns, infraId);
    document.getElementById('create-json').value = JSON.stringify(req, null, 2);
  } catch (e) {
    webconsolejs['common/util'].showToast('Failed to extract: ' + (e?.response?.data?.message || e.message), 'error');
  }
};

function parseJsonInput(elementId) {
  const raw = document.getElementById(elementId).value.trim();
  if (!raw) throw new Error('Infra Request JSON is empty');
  return JSON.parse(raw);
}

window.submitCreate = async function () {
  const ns = AppState.ns;
  if (!ns) { webconsolejs['common/util'].showToast('Please select a project first.', 'error'); return; }
  const name = document.getElementById('create-name').value.trim();
  if (!name) { webconsolejs['common/util'].showToast('Name is required.', 'error'); return; }
  let infraDynamicReq;
  try {
    infraDynamicReq = parseJsonInput('create-json');
  } catch (e) {
    webconsolejs['common/util'].showToast('Invalid JSON: ' + e.message, 'error');
    return;
  }
  const body = { name, infraDynamicReq };
  const description = document.getElementById('create-description').value.trim();
  if (description) body.description = description;
  try {
    await webconsolejs['common/api/services/infratemplate_api'].create(ns, body);
    bootstrap.Modal.getInstance(document.getElementById('create-modal'))?.hide();
    await loadList();
    webconsolejs['common/util'].showToast('Template created.', 'success');
  } catch (e) {
    webconsolejs['common/util'].showToast('Failed to create: ' + (e?.response?.data?.message || e.message), 'error');
  }
};

window.openEditModal = function () {
  const item = AppState.resources.selected;
  if (!item) return;
  document.getElementById('edit-name').value = item.name || '';
  document.getElementById('edit-description').value = item.description || '';
  document.getElementById('edit-json').value = JSON.stringify(item.infraDynamicReq || {}, null, 2);
  new bootstrap.Modal(document.getElementById('edit-modal')).show();
};

window.submitEdit = async function () {
  const ns = AppState.ns;
  const templateId = AppState.resources.selected?.id;
  if (!ns || !templateId) return;
  const name = document.getElementById('edit-name').value.trim();
  if (!name) { webconsolejs['common/util'].showToast('Name is required.', 'error'); return; }
  let infraDynamicReq;
  try {
    infraDynamicReq = parseJsonInput('edit-json');
  } catch (e) {
    webconsolejs['common/util'].showToast('Invalid JSON: ' + e.message, 'error');
    return;
  }
  const body = { name, infraDynamicReq };
  const description = document.getElementById('edit-description').value.trim();
  if (description) body.description = description;
  try {
    await webconsolejs['common/api/services/infratemplate_api'].update(ns, templateId, body);
    bootstrap.Modal.getInstance(document.getElementById('edit-modal'))?.hide();
    await loadList();
    webconsolejs['common/util'].showToast('Template updated.', 'success');
  } catch (e) {
    webconsolejs['common/util'].showToast('Failed to update: ' + (e?.response?.data?.message || e.message), 'error');
  }
};

// ─── Delete ────────────────────────────────────────────────────────────

window.confirmDelete = function () {
  const item = AppState.resources.selected;
  if (!item) return;
  webconsolejs['partials/layout/modal'].commonConfirmModal(
    'commonDefaultModal',
    'Delete Template',
    'Delete template "' + item.name + '"?',
    'pages/operations/manage/workloads/infratemplates.executeDelete'
  );
};

export async function executeDelete() {
  const templateId = AppState.resources.selected?.id;
  if (!templateId) return;
  try {
    await webconsolejs['common/api/services/infratemplate_api'].del(AppState.ns, templateId);
    hideDetail();
    await loadList();
    webconsolejs['common/util'].showToast('Template deleted.', 'success');
  } catch (e) {
    webconsolejs['common/util'].showToast('Failed to delete: ' + (e?.response?.data?.message || e.message), 'error');
  }
}

window.confirmDeleteAll = function () {
  webconsolejs['partials/layout/modal'].commonConfirmModal(
    'commonDefaultModal',
    'Delete All Templates',
    'Delete ALL infra templates in this namespace?',
    'pages/operations/manage/workloads/infratemplates.executeDeleteAll'
  );
};

export async function executeDeleteAll() {
  try {
    await webconsolejs['common/api/services/infratemplate_api'].deleteAll(AppState.ns);
    hideDetail();
    await loadList();
    webconsolejs['common/util'].showToast('All templates deleted.', 'success');
  } catch (e) {
    webconsolejs['common/util'].showToast('Failed to delete: ' + (e?.response?.data?.message || e.message), 'error');
  }
}

// ─── Filter ────────────────────────────────────────────────────────────

function initFilter() {
  const fieldEl = document.getElementById('filter-field');
  const typeEl = document.getElementById('filter-type');
  const valueEl = document.getElementById('filter-value');
  if (!fieldEl || !typeEl || !valueEl) return;

  function updateFilter() {
    const filterVal = fieldEl.value;
    const typeVal = typeEl.value;
    if (filterVal && AppState.tables.resourceTable) {
      AppState.tables.resourceTable.setFilter(filterVal, typeVal, valueEl.value);
    }
  }

  fieldEl.addEventListener('change', updateFilter);
  typeEl.addEventListener('change', updateFilter);
  valueEl.addEventListener('keyup', updateFilter);
  document.getElementById('filter-clear').addEventListener('click', function () {
    fieldEl.value = '';
    typeEl.value = 'like';
    valueEl.value = '';
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.clearFilter();
  });
}

// ─── Init ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-modal">Add Template</button>`;
  }

  const selectedWorkspaceProject = await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
  webconsolejs['partials/layout/modal'].checkWorkspaceSelection(selectedWorkspaceProject);

  if (selectedWorkspaceProject.workspaceId !== '' && selectedWorkspaceProject.projectId === '') {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Check', 'Please select a project first');
  }

  AppState.ns = selectedWorkspaceProject.nsId;
  initFilter();

  if (selectedWorkspaceProject.projectId !== '') {
    await loadList();
    await loadInfraList();
  }
});
