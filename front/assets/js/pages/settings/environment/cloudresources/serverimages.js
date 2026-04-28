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
  await refreshImageList();
});

var selectedWorkspaceProject = {};
window.currentNsId = "";

const AppState = {
  resources: { list: [], selected: null },
  tables: { resourceTable: null, popupTable: null }
};

document.addEventListener('DOMContentLoaded', initServerImages);

async function initServerImages() {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-image-modal">Register Image</button>`;
  }

  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject);
  window.currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
  await refreshImageList();
}

async function refreshImageList() {
  if (selectedWorkspaceProject.projectId != "") {
    try {
      const data = await webconsolejs['common/api/services/serverimage_api'].list(window.currentNsId);
      const items = data?.image || [];
      AppState.resources.list = items;
      if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
      else initTable(items);
    } catch (e) {
      if (e?.response?.status !== 404) console.error('Failed to load images', e);
      const items = [];
      AppState.resources.list = items;
      if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
      else initTable(items);
    }
  }
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#image-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'No images found',
    columns: [
      { title: 'Image Name', field: 'name', sorter: 'string' },
      { title: 'OS Type', field: 'osType', sorter: 'string' },
      { title: 'Architecture', field: 'architecture', sorter: 'string' },
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
  document.getElementById('detail-imageName').textContent = data.name || '-';
  document.getElementById('detail-osType').textContent = data.osType || '-';
  document.getElementById('detail-architecture').textContent = data.architecture || '-';
  document.getElementById('detail-cspImageId').textContent = data.cspImageId || '-';
  document.getElementById('detail-ns').textContent = window.currentNsId;
}

function showDetail() {
  document.getElementById('view-mode-cards').classList.add('show');
}

window.hideDetail = function () {
  document.getElementById('view-mode-cards').classList.remove('show');
  AppState.resources.selected = null;
};

window.deleteImage = async function () {
  const item = AppState.resources.selected;
  if (!item || !confirm(`Delete image "${item.name}"?`)) return;
  try {
    await webconsolejs['common/api/services/serverimage_api'].del(window.currentNsId, item.name);
    hideDetail();
    await refreshImageList();
  } catch (e) { alert('Failed to delete: ' + (e?.response?.data?.message || e.message)); }
};

window.openImageSelectPopup = async function () {
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

  new bootstrap.Modal(document.getElementById('image-select-popup')).show();
};

window.loadImageList = async function (connectionName) {
  if (!connectionName) return;
  try {
    const data = await webconsolejs['common/api/services/serverimage_api'].lookupList(connectionName);
    const items = data?.image || [];
    if (AppState.tables.popupTable) {
      AppState.tables.popupTable.replaceData(items);
    } else {
      AppState.tables.popupTable = new Tabulator('#popup-image-table', {
        data: items,
        layout: 'fitColumns',
        placeholder: 'No images',
        columns: [
          { title: 'Name', field: 'IId.NameId' },
          { title: 'CspImageId', field: 'CspImageId' },
          { title: 'OS', field: 'GuestOS' }
        ]
      });
      AppState.tables.popupTable.on('rowClick', function (e, row) {
        const d = row.getData();
        document.getElementById('modal-imageName').value = d.IId?.NameId || '';
        document.getElementById('modal-cspImageName').value = d.CspImageId || '';
        document.getElementById('modal-connectionName').value = connectionName;
        bootstrap.Modal.getInstance(document.getElementById('image-select-popup'))?.hide();
      });
    }
  } catch (e) { console.error('Failed to load image list from CSP', e); }
};

window.submitRegisterImage = async function () {
  const ns = window.currentNsId;
  const imageName = document.getElementById('modal-imageName').value.trim();
  const cspImageName = document.getElementById('modal-cspImageName').value.trim();
  const connectionName = document.getElementById('modal-connectionName').value.trim();

  if (!ns || !imageName || !cspImageName) { alert('Image Name and CSP Image Name are required. Make sure a project is selected.'); return; }

  try {
    await webconsolejs['common/api/services/serverimage_api'].register(ns, { name: imageName, cspImageName, connectionName });
    bootstrap.Modal.getInstance(document.getElementById('create-image-modal'))?.hide();
    await refreshImageList();
  } catch (e) { alert('Failed to register: ' + (e?.response?.data?.message || e.message)); }
};
