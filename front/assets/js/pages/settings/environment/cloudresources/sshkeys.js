const AppState = {
  resources: { list: [], selected: null },
  ui: { privateKeyVisible: false },
  tables: { resourceTable: null },
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
    const data = await webconsolejs['common/api/services/sshkey_api'].list(AppState.ns);
    const items = data?.sshKey || [];
    AppState.resources.list = items;
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
    else initTable(items);
  } catch (e) {
    if (e?.response?.status !== 404) console.error('Failed to load SSH Keys', e);
    const items = [];
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
    else initTable(items);
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
  document.getElementById('detail-keyName').textContent = data.name || '-';
  document.getElementById('detail-fingerprint').textContent = data.fingerprint || '-';
  document.getElementById('detail-ns').textContent = AppState.ns;
  const pkEl = document.getElementById('detail-privateKey');
  pkEl.value = data.privateKey || '(not available)';
  pkEl.style.filter = 'blur(4px)';
  AppState.ui.privateKeyVisible = false;
}

function showDetail() { document.getElementById('view-mode-cards').classList.add('show'); }

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
    await webconsolejs['common/api/services/sshkey_api'].del(AppState.ns, item.name);
    hideDetail();
    await loadList();
  } catch (e) { alert('Failed to delete: ' + (e?.response?.data?.message || e.message)); }
};

window.submitCreateSshKey = async function () {
  const ns = document.getElementById('modal-ns').value;
  const name = document.getElementById('modal-keyName').value.trim();
  if (!ns || !name) { alert('Namespace and Key Name are required.'); return; }
  try {
    const result = await webconsolejs['common/api/services/sshkey_api'].create(ns, { name });
    bootstrap.Modal.getInstance(document.getElementById('create-sshkey-modal'))?.hide();
    // Show private key if returned in creation response
    if (result?.responseData?.privateKey) {
      alert('SSH Key created. Please save your private key:\n\n' + result.responseData.privateKey);
    }
    AppState.ns = ns;
    await loadList();
  } catch (e) { alert('Failed to create: ' + (e?.response?.data?.message || e.message)); }
};

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) btnList.innerHTML = `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-sshkey-modal">Create SSH Key</button>`;

  document.getElementById('ns-selector')?.addEventListener('change', async function () {
    AppState.ns = this.value; hideDetail(); await loadList();
  });

  await loadNamespaces();
});
