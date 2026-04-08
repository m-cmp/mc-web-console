import { TabulatorFull as Tabulator } from 'tabulator-tables';

// Project change event (module level — MCI pattern)
$("#select-current-project").on('change', async function () {
  if (this.value == "") return;
  const opt = this.options[this.selectedIndex];
  const project = {
    Id: this.value,
    Name: opt.text,
    NsId: opt.getAttribute('data-nsid') || opt.text
  };
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project);
  window.currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
  hideDetail();
  await refreshSshKeyList();
});

var selectedWorkspaceProject = {};
window.currentNsId = "";

const AppState = {
  resources: { list: [], selected: null },
  ui: { privateKeyVisible: false },
  tables: { resourceTable: null }
};

document.addEventListener('DOMContentLoaded', initSshKeys);

async function initSshKeys() {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-sshkey-modal">Create SSH Key</button>`;
  }

  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject);
  window.currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
  await refreshSshKeyList();
}

async function refreshSshKeyList() {
  if (selectedWorkspaceProject.projectId != "") {
    try {
      const data = await webconsolejs['common/api/services/sshkey_api'].list(window.currentNsId);
      const items = data?.sshKey || [];
      AppState.resources.list = items;
      if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
      else initTable(items);
    } catch (e) {
      if (e?.response?.status !== 404) console.error('Failed to load SSH Keys', e);
      const items = [];
      AppState.resources.list = items;
      if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
      else initTable(items);
    }
  }
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#sshkey-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'No SSH Keys found',
    columns: [
      { title: 'Key Name', field: 'name', sorter: 'string' },
      { title: 'Fingerprint', field: 'fingerprint', sorter: 'string' },
      { title: 'Connection', field: 'connectionName', sorter: 'string' }
    ]
  });
  AppState.tables.resourceTable.on('rowClick', function (e, row) {
    const d = row.getData();
    AppState.resources.selected = d;
    renderDetail(d);
    showDetail();
  });
}

function renderDetail(data) {
  document.getElementById('detail-name').textContent = data.name || '-';
  document.getElementById('detail-keyName').textContent = data.name || '-';
  document.getElementById('detail-fingerprint').textContent = data.fingerprint || '-';
  document.getElementById('detail-ns').textContent = window.currentNsId;
  const pkEl = document.getElementById('detail-privateKey');
  pkEl.value = data.privateKey || '(not available)';
  pkEl.style.filter = 'blur(4px)';
  AppState.ui.privateKeyVisible = false;
}

function showDetail() {
  document.getElementById('view-mode-cards').classList.add('show');
}

window.hideDetail = function () {
  document.getElementById('view-mode-cards').classList.remove('show');
  AppState.resources.selected = null;
};

window.togglePrivateKey = function () {
  const pkEl = document.getElementById('detail-privateKey');
  AppState.ui.privateKeyVisible = !AppState.ui.privateKeyVisible;
  pkEl.style.filter = AppState.ui.privateKeyVisible ? 'none' : 'blur(4px)';
};

window.deleteSshKey = async function () {
  const item = AppState.resources.selected;
  if (!item || !confirm(`Delete SSH Key "${item.name}"?`)) return;
  try {
    await webconsolejs['common/api/services/sshkey_api'].del(window.currentNsId, item.name);
    hideDetail();
    await refreshSshKeyList();
  } catch (e) { alert('Failed to delete: ' + (e?.response?.data?.message || e.message)); }
};

window.submitCreateSshKey = async function () {
  const ns = window.currentNsId;
  const name = document.getElementById('modal-keyName').value.trim();
  if (!ns || !name) { alert('Key Name is required. Make sure a project is selected.'); return; }
  try {
    const result = await webconsolejs['common/api/services/sshkey_api'].create(ns, { name });
    bootstrap.Modal.getInstance(document.getElementById('create-sshkey-modal'))?.hide();
    if (result?.responseData?.privateKey) {
      alert('SSH Key created. Please save your private key:\n\n' + result.responseData.privateKey);
    }
    await refreshSshKeyList();
  } catch (e) { alert('Failed to create: ' + (e?.response?.data?.message || e.message)); }
};
