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
  await refreshSpecList();
});

var selectedWorkspaceProject = {};
window.currentNsId = "";

const AppState = {
  resources: { list: [], selected: null },
  tables: { resourceTable: null, popupTable: null }
};

document.addEventListener('DOMContentLoaded', initServerSpecs);

async function initServerSpecs() {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-spec-modal">Register Spec</button>`;
  }

  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject);
  window.currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
  await refreshSpecList();
}

async function refreshSpecList() {
  if (selectedWorkspaceProject.projectId != "") {
    try {
      const data = await webconsolejs['common/api/services/serverspec_api'].list(window.currentNsId);
      const items = data?.spec || [];
      AppState.resources.list = items;
      if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
      else initTable(items);
    } catch (e) {
      if (e?.response?.status !== 404) console.error('Failed to load specs', e);
      const items = [];
      AppState.resources.list = items;
      if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
      else initTable(items);
    }
  }
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#spec-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'No specs found',
    columns: [
      { title: 'Spec Name', field: 'name', sorter: 'string' },
      { title: 'vCPU', field: 'vCPU', sorter: 'number' },
      { title: 'Memory (GiB)', field: 'memoryGiB', sorter: 'number' },
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
  document.getElementById('detail-specName').textContent = data.name || '-';
  document.getElementById('detail-vcpu').textContent = data.vCPU ?? '-';
  document.getElementById('detail-memory').textContent = data.memoryGiB ?? '-';
  document.getElementById('detail-gpu').textContent = data.acceleratorCount ?? '-';
  document.getElementById('detail-disk').textContent = data.rootDiskSize ?? '-';
  document.getElementById('detail-cspSpecName').textContent = data.cspSpecName || '-';
  document.getElementById('detail-ns').textContent = window.currentNsId;
}

function showDetail() {
  document.getElementById('view-mode-cards').classList.add('show');
}

window.hideDetail = function () {
  document.getElementById('view-mode-cards').classList.remove('show');
  AppState.resources.selected = null;
};

window.deleteSpec = async function () {
  const item = AppState.resources.selected;
  if (!item || !confirm(`Delete spec "${item.name}"?`)) return;
  try {
    await webconsolejs['common/api/services/serverspec_api'].del(window.currentNsId, item.name);
    hideDetail();
    await refreshSpecList();
  } catch (e) { alert('Failed to delete: ' + (e?.response?.data?.message || e.message)); }
};

window.openSpecSelectPopup = async function () {
  try {
    const resp = await webconsolejs['common/api/http'].commonAPIPost('/api/mc-infra-manager/GetConnConfigList', {});
    const conns = resp?.data?.responseData?.connectionconfig || [];
    const popupConn = document.getElementById('popup-connection');
    popupConn.innerHTML = '<option value="">-- Select Connection --</option>';
    conns.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.configName; opt.textContent = c.configName;
      popupConn.appendChild(opt);
    });
  } catch (e) { console.error('Failed to load connections', e); }

  new bootstrap.Modal(document.getElementById('spec-select-popup')).show();
};

window.loadSpecList = async function (connectionName) {
  if (!connectionName) return;
  try {
    const data = await webconsolejs['common/api/services/serverspec_api'].lookupList(connectionName);
    const items = data?.vmSpec || [];
    if (AppState.tables.popupTable) {
      AppState.tables.popupTable.replaceData(items);
    } else {
      AppState.tables.popupTable = new Tabulator('#popup-spec-table', {
        data: items,
        layout: 'fitColumns',
        placeholder: 'No specs',
        columns: [
          { title: 'Name', field: 'IId.NameId' },
          { title: 'vCPU', field: 'NumvCPU' },
          { title: 'Memory (GiB)', field: 'MemGiB' }
        ]
      });
      AppState.tables.popupTable.on('rowClick', function (e, row) {
        const d = row.getData();
        document.getElementById('modal-specName').value = d.IId?.NameId || '';
        document.getElementById('modal-cspSpecName').value = d.IId?.NameId || '';
        document.getElementById('modal-connectionName').value = connectionName;
        bootstrap.Modal.getInstance(document.getElementById('spec-select-popup'))?.hide();
      });
    }
  } catch (e) { console.error('Failed to load spec list from CSP', e); }
};

window.submitRegisterSpec = async function () {
  const ns = window.currentNsId;
  const specName = document.getElementById('modal-specName').value.trim();
  const cspSpecName = document.getElementById('modal-cspSpecName').value.trim();
  const connectionName = document.getElementById('modal-connectionName').value.trim();

  if (!ns || !specName || !cspSpecName) { alert('Spec Name and CSP Spec Name are required. Make sure a project is selected.'); return; }

  try {
    await webconsolejs['common/api/services/serverspec_api'].register(ns, { name: specName, cspSpecName, connectionName });
    bootstrap.Modal.getInstance(document.getElementById('create-spec-modal'))?.hide();
    await refreshSpecList();
  } catch (e) { alert('Failed to register: ' + (e?.response?.data?.message || e.message)); }
};
