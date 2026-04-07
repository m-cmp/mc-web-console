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
    const data = await webconsolejs['common/api/services/serverspec_api'].list(AppState.ns);
    const items = data?.spec || [];
    AppState.resources.list = items;
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
    else initTable(items);
  } catch (e) {
    if (e?.response?.status !== 404) console.error('Failed to load specs', e);
    const items = [];
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
    else initTable(items);
  }
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#spec-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'No specs found',
    columns: [
      { title: 'Spec Name', field: 'name', sorter: 'string' },
      { title: 'vCPU', field: 'numvCPU', sorter: 'number' },
      { title: 'Memory (GiB)', field: 'memGiB', sorter: 'number' },
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
  document.getElementById('detail-specName').textContent = data.name || '-';
  document.getElementById('detail-vcpu').textContent = data.numvCPU ?? '-';
  document.getElementById('detail-memory').textContent = data.memGiB ?? '-';
  document.getElementById('detail-gpu').textContent = data.numGPU ?? '-';
  document.getElementById('detail-disk').textContent = data.rootDiskSize ?? '-';
  document.getElementById('detail-cspSpecName').textContent = data.cspSpecName || '-';
  document.getElementById('detail-ns').textContent = AppState.ns;
}

function showDetail() { document.getElementById('view-mode-cards').classList.add('show'); }

window.hideDetail = function () {
  document.getElementById('view-mode-cards').classList.remove('show');
  AppState.resources.selected = null;
};

window.deleteSpec = async function () {
  const item = AppState.resources.selected;
  if (!item || !confirm(`Delete spec "${item.name}"?`)) return;
  try {
    await webconsolejs['common/api/services/serverspec_api'].del(AppState.ns, item.name);
    hideDetail(); await loadList();
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
        ],
        rowClick: function (e, row) {
          const d = row.getData();
          document.getElementById('modal-specName').value = d.IId?.NameId || '';
          document.getElementById('modal-cspSpecName').value = d.IId?.NameId || '';
          document.getElementById('modal-connectionName').value = connectionName;
          bootstrap.Modal.getInstance(document.getElementById('spec-select-popup'))?.hide();
        }
      });
    }
  } catch (e) { console.error('Failed to load spec list from CSP', e); }
};

window.submitRegisterSpec = async function () {
  const ns = document.getElementById('modal-ns').value;
  const specName = document.getElementById('modal-specName').value.trim();
  const cspSpecName = document.getElementById('modal-cspSpecName').value.trim();
  const connectionName = document.getElementById('modal-connectionName').value.trim();

  if (!ns || !specName || !cspSpecName) { alert('Namespace, Spec Name, and CSP Spec Name are required.'); return; }

  try {
    await webconsolejs['common/api/services/serverspec_api'].register(ns, { name: specName, cspSpecName, connectionName });
    bootstrap.Modal.getInstance(document.getElementById('create-spec-modal'))?.hide();
    AppState.ns = ns; await loadList();
  } catch (e) { alert('Failed to register: ' + (e?.response?.data?.message || e.message)); }
};

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) btnList.innerHTML = `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-spec-modal">Register Spec</button>`;

  document.getElementById('ns-selector')?.addEventListener('change', async function () {
    AppState.ns = this.value; hideDetail(); await loadList();
  });

  await loadNamespaces();
});
