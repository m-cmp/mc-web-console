const AppState = {
  resources: { list: [], selected: null },
  tables: { resourceTable: null, popupTable: null },
  ns: ''
};

async function loadNamespaces() {
  try {
    const resp = await webconsolejs['common/api/http'].commonAPIPost('/api/mc-infra-manager/Getallns', {});
    const nsList = resp?.data?.responseData?.ns || [];
    const sel = document.getElementById('ns-selector');
    const modalSel = document.getElementById('modal-ns');
    nsList.forEach(ns => {
      [sel, modalSel].forEach(el => {
        if (!el) return;
        const opt = document.createElement('option');
        opt.value = ns.id; opt.textContent = ns.id;
        el.appendChild(opt);
      });
    });
    if (nsList.length > 0) { AppState.ns = nsList[0].id; await loadList(); }
  } catch (e) { console.error('Failed to load namespaces', e); }
}

async function loadList() {
  if (!AppState.ns) return;
  try {
    const data = await webconsolejs['common/api/services/serverimage_api'].list(AppState.ns);
    const items = data?.image || [];
    AppState.resources.list = items;
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
    else initTable(items);
  } catch (e) {
    if (e?.response?.status !== 404) console.error('Failed to load images', e);
    const items = [];
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
    else initTable(items);
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
    ],
    rowClick: function (e, row) {
      const d = row.getData();
      AppState.resources.selected = d;
      renderDetail(d);
      showDetail();
    }
  });
}

function renderDetail(data) {
  document.getElementById('detail-name').textContent = data.name || '-';
  document.getElementById('detail-imageName').textContent = data.name || '-';
  document.getElementById('detail-osType').textContent = data.osType || '-';
  document.getElementById('detail-architecture').textContent = data.architecture || '-';
  document.getElementById('detail-cspImageId').textContent = data.cspImageId || '-';
  document.getElementById('detail-ns').textContent = AppState.ns;
}

function showDetail() { document.getElementById('view-mode-cards').classList.add('show'); }

window.hideDetail = function () {
  document.getElementById('view-mode-cards').classList.remove('show');
  AppState.resources.selected = null;
};

window.deleteImage = async function () {
  const item = AppState.resources.selected;
  if (!item || !confirm(`Delete image "${item.name}"?`)) return;
  try {
    await webconsolejs['common/api/services/serverimage_api'].del(AppState.ns, item.name);
    hideDetail(); await loadList();
  } catch (e) { alert('Failed to delete: ' + (e?.response?.data?.message || e.message)); }
};

window.openImageSelectPopup = async function () {
  // Load connection list for popup
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

  const modal = new bootstrap.Modal(document.getElementById('image-select-popup'));
  modal.show();
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
        ],
        rowClick: function (e, row) {
          const d = row.getData();
          document.getElementById('modal-imageName').value = d.IId?.NameId || '';
          document.getElementById('modal-cspImageName').value = d.CspImageId || '';
          document.getElementById('modal-connectionName').value = connectionName;
          bootstrap.Modal.getInstance(document.getElementById('image-select-popup'))?.hide();
        }
      });
    }
  } catch (e) { console.error('Failed to load image list from CSP', e); }
};

window.submitRegisterImage = async function () {
  const ns = document.getElementById('modal-ns').value;
  const imageName = document.getElementById('modal-imageName').value.trim();
  const cspImageName = document.getElementById('modal-cspImageName').value.trim();
  const connectionName = document.getElementById('modal-connectionName').value.trim();

  if (!ns || !imageName || !cspImageName) { alert('Namespace, Image Name, and CSP Image Name are required.'); return; }

  try {
    await webconsolejs['common/api/services/serverimage_api'].register(ns, { name: imageName, cspImageName, connectionName });
    bootstrap.Modal.getInstance(document.getElementById('create-image-modal'))?.hide();
    AppState.ns = ns; await loadList();
  } catch (e) { alert('Failed to register: ' + (e?.response?.data?.message || e.message)); }
};

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) btnList.innerHTML = `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-image-modal">Register Image</button>`;

  document.getElementById('ns-selector')?.addEventListener('change', async function () {
    AppState.ns = this.value; hideDetail(); await loadList();
  });

  await loadNamespaces();
});
