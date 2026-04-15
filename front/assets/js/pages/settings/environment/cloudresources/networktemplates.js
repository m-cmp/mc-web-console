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
});

async function loadList() {
  const ns = AppState.ns;
  if (!ns) return;
  try {
    const data = await webconsolejs['common/api/services/networktemplate_api'].list(ns);
    const items = data?.templates || [];
    AppState.resources.list = items;
    if (AppState.tables.resourceTable) {
      AppState.tables.resourceTable.replaceData(items);
    } else {
      initTable(items);
    }
  } catch (e) {
    if (e?.response?.status !== 404) console.error('Failed to load VNet templates', e);
    AppState.resources.list = [];
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData([]);
    else initTable([]);
  }
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#template-table', {
    data: data,
    layout: 'fitColumns',
    placeholder: 'No VNet templates found.',
    columns: [
      { title: 'Name', field: 'name', sorter: 'string' },
      { title: 'Description', field: 'description', sorter: 'string' },
      {
        title: 'Type', field: 'vNetPolicy', sorter: 'string',
        formatter: function (cell) {
          return cell.getValue() ? '<span class="badge bg-blue-lt">Policy</span>' : '<span class="badge bg-secondary-lt">Raw</span>';
        }
      },
      { title: 'Source', field: 'source', sorter: 'string', width: 100 },
      { title: 'Created', field: 'createdAt', sorter: 'string', width: 180 }
    ],
    rowClick: function (e, row) {
      const data = row.getData();
      AppState.resources.selected = data;
      renderDetail(data);
      showDetail();
    }
  });
}

function renderDetail(data) {
  document.getElementById('detail-name').textContent = data.name || '-';
  document.getElementById('detail-id').textContent = data.id || '-';
  document.getElementById('detail-description').textContent = data.description || '-';
  document.getElementById('detail-source').textContent = data.source || '-';
  document.getElementById('detail-createdAt').textContent = data.createdAt || '-';
  document.getElementById('detail-updatedAt').textContent = data.updatedAt || '-';

  const policySection = document.getElementById('detail-policy-section');
  const rawSection = document.getElementById('detail-raw-section');

  if (data.vNetPolicy) {
    policySection.style.display = '';
    rawSection.style.display = 'none';
    document.getElementById('detail-cidrBlock').textContent = data.vNetPolicy.cidrBlock || '-';
    document.getElementById('detail-multiZone').textContent = data.vNetPolicy.multiZone ? 'Yes' : 'No';
    document.getElementById('detail-subnetCount').textContent = data.vNetPolicy.subnetCount ?? '-';
  } else if (data.vNetReq) {
    policySection.style.display = 'none';
    rawSection.style.display = '';
    document.getElementById('detail-connectionName').textContent = data.vNetReq.connectionName || '-';
    document.getElementById('detail-vNetName').textContent = data.vNetReq.name || '-';
    document.getElementById('detail-vNetCidr').textContent = data.vNetReq.cidrBlock || '-';
    const subnets = (data.vNetReq.subnetInfoList || []).map(s => `${s.name} (${s.ipv4_CIDR})`).join(', ');
    document.getElementById('detail-subnets').textContent = subnets || '-';
  } else {
    policySection.style.display = 'none';
    rawSection.style.display = 'none';
  }
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

// ─── Connection List ───────────────────────────────────────────────────

async function loadConnectionList() {
  try {
    const resp = await webconsolejs['common/api/http'].commonAPIPost('/api/mc-infra-manager/GetConnConfigList', {});
    const list = resp?.data?.responseData?.connectionconfig || [];
    ['create-connectionName', 'edit-connectionName'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      while (sel.options.length > 1) sel.remove(1);
      list.forEach(conn => {
        const opt = document.createElement('option');
        opt.value = conn.configName;
        opt.textContent = conn.configName;
        sel.appendChild(opt);
      });
    });
  } catch (e) {
    console.error('Failed to load connection list', e);
  }
}

// ─── Create / Edit Modal ───────────────────────────────────────────────

function getModeFromModal(prefix) {
  return document.getElementById(prefix + '-mode-policy').checked ? 'policy' : 'raw';
}

window.onModalModeChange = function (prefix) {
  const mode = getModeFromModal(prefix);
  document.getElementById(prefix + '-policy-fields').style.display = mode === 'policy' ? '' : 'none';
  document.getElementById(prefix + '-raw-fields').style.display = mode === 'raw' ? '' : 'none';
};

function buildRequestBody(prefix) {
  const name = document.getElementById(prefix + '-name').value.trim();
  const description = document.getElementById(prefix + '-description').value.trim();
  const mode = getModeFromModal(prefix);
  const body = { name };
  if (description) body.description = description;

  if (mode === 'policy') {
    body.vNetPolicy = {
      cidrBlock: document.getElementById(prefix + '-cidrBlock').value.trim() || 'auto',
      multiZone: document.getElementById(prefix + '-multiZone').checked,
      subnetCount: parseInt(document.getElementById(prefix + '-subnetCount').value, 10) || 1
    };
  } else {
    const connectionName = document.getElementById(prefix + '-connectionName').value.trim();
    const vNetName = document.getElementById(prefix + '-vNetName').value.trim();
    const cidrBlock = document.getElementById(prefix + '-vNetCidr').value.trim();
    const subnetRows = document.querySelectorAll('#' + prefix + '-subnet-rows .subnet-row');
    const subnetInfoList = [];
    subnetRows.forEach(row => {
      const sName = row.querySelector('.subnet-name').value.trim();
      const sCidr = row.querySelector('.subnet-cidr').value.trim();
      const sZone = row.querySelector('.subnet-zone').value.trim();
      if (sName && sCidr) subnetInfoList.push({ name: sName, ipv4_CIDR: sCidr, zone: sZone });
    });
    body.vNetReq = { connectionName, name: vNetName, cidrBlock, subnetInfoList };
  }
  return body;
}

window.addSubnetRow = function (prefix) {
  const container = document.getElementById(prefix + '-subnet-rows');
  const row = document.createElement('div');
  row.className = 'subnet-row row g-2 mb-2';
  row.innerHTML = `
    <div class="col-4"><input type="text" class="form-control form-control-sm subnet-name" placeholder="Subnet Name"></div>
    <div class="col-4"><input type="text" class="form-control form-control-sm subnet-cidr" placeholder="CIDR (10.0.1.0/24)"></div>
    <div class="col-3"><input type="text" class="form-control form-control-sm subnet-zone" placeholder="Zone"></div>
    <div class="col-1"><button type="button" class="btn btn-sm btn-ghost-danger" onclick="removeSubnetRow(this)">✕</button></div>`;
  container.appendChild(row);
};

window.removeSubnetRow = function (btn) {
  const rows = btn.closest('[id$="-subnet-rows"]').querySelectorAll('.subnet-row');
  if (rows.length <= 1) return;
  btn.closest('.subnet-row').remove();
};

window.submitCreate = async function () {
  const ns = AppState.ns;
  if (!ns) { webconsolejs['common/util'].showToast('Please select a project first.', 'error'); return; }
  const body = buildRequestBody('create');
  if (!body.name) { webconsolejs['common/util'].showToast('Name is required.', 'error'); return; }
  try {
    await webconsolejs['common/api/services/networktemplate_api'].create(ns, body);
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

  if (item.vNetPolicy) {
    document.getElementById('edit-mode-policy').checked = true;
    document.getElementById('edit-cidrBlock').value = item.vNetPolicy.cidrBlock || 'auto';
    document.getElementById('edit-multiZone').checked = !!item.vNetPolicy.multiZone;
    document.getElementById('edit-subnetCount').value = item.vNetPolicy.subnetCount || 1;
  } else {
    document.getElementById('edit-mode-raw').checked = true;
    if (item.vNetReq) {
      document.getElementById('edit-connectionName').value = item.vNetReq.connectionName || '';
      document.getElementById('edit-vNetName').value = item.vNetReq.name || '';
      document.getElementById('edit-vNetCidr').value = item.vNetReq.cidrBlock || '';
    }
  }
  onModalModeChange('edit');
  new bootstrap.Modal(document.getElementById('edit-modal')).show();
};

window.submitEdit = async function () {
  const ns = AppState.ns;
  const templateId = AppState.resources.selected?.id;
  if (!ns || !templateId) return;
  const body = buildRequestBody('edit');
  if (!body.name) { webconsolejs['common/util'].showToast('Name is required.', 'error'); return; }
  try {
    await webconsolejs['common/api/services/networktemplate_api'].update(ns, templateId, body);
    bootstrap.Modal.getInstance(document.getElementById('edit-modal'))?.hide();
    await loadList();
    webconsolejs['common/util'].showToast('Template updated.', 'success');
  } catch (e) {
    webconsolejs['common/util'].showToast('Failed to update: ' + (e?.response?.data?.message || e.message), 'error');
  }
};

// ─── Delete All ────────────────────────────────────────────────────────

window.confirmDeleteAll = function () {
  webconsolejs['partials/layout/modal'].commonConfirmModal(
    'commonDefaultModal',
    'Delete All Templates',
    'Delete ALL VNet templates in this namespace?',
    'pages/settings/environment/cloudresources/networktemplates.executeDeleteAll'
  );
};

export async function executeDeleteAll() {
  try {
    await webconsolejs['common/api/services/networktemplate_api'].deleteAll(AppState.ns);
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
  await loadConnectionList();

  if (selectedWorkspaceProject.projectId !== '') {
    await loadList();
  }
});
