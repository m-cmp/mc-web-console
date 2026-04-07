const AppState = {
  resources: { list: [], selected: null },
  ui: { viewMode: false },
  tables: { resourceTable: null, subnetTable: null },
  ns: ''
};

async function loadNamespaces() {
  const ctrl = '/api/mc-infra-manager/Getallns';
  try {
    const resp = await webconsolejs['common/api/http'].commonAPIPost(ctrl, {});
    const nsList = resp?.data?.responseData?.ns || [];
    const sel = document.getElementById('ns-selector');
    const modalSel = document.getElementById('modal-ns');
    nsList.forEach(ns => {
      [sel, modalSel].forEach(el => {
        if (!el) return;
        const opt = document.createElement('option');
        opt.value = ns.id;
        opt.textContent = ns.id;
        el.appendChild(opt);
      });
    });
    if (nsList.length > 0) {
      AppState.ns = nsList[0].id;
      await loadList();
    }
  } catch (e) {
    console.error('Failed to load namespaces', e);
  }
}

async function loadList() {
  const ns = AppState.ns;
  if (!ns) return;
  try {
    const data = await webconsolejs['common/api/services/vpc_api'].list(ns);
    const items = data?.vNet || [];
    AppState.resources.list = items;
    if (AppState.tables.resourceTable) {
      AppState.tables.resourceTable.replaceData(items);
    } else {
      initTable(items);
    }
  } catch (e) {
    if (e?.response?.status !== 404) console.error('Failed to load VPCs', e);
    AppState.resources.list = [];
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData([]);
    else initTable([]);
  }
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#vpc-table', {
    data: data,
    layout: 'fitColumns',
    placeholder: 'No VPCs found',
    columns: [
      { title: 'VPC Name', field: 'name', sorter: 'string' },
      { title: 'IPv4 CIDR', field: 'cidrBlock', sorter: 'string' },
      { title: 'Subnets', formatter: cell => (cell.getRow().getData().subnetInfoList || []).length },
      { title: 'Connection', field: 'connectionName', sorter: 'string' }
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
  document.getElementById('detail-vpcName').textContent = data.name || '-';
  document.getElementById('detail-cidrBlock').textContent = data.cidrBlock || '-';
  document.getElementById('detail-ns').textContent = AppState.ns;
  document.getElementById('detail-connection').textContent = data.connectionName || '-';

  const subnets = data.subnetInfoList || [];
  if (AppState.tables.subnetTable) {
    AppState.tables.subnetTable.replaceData(subnets);
  } else {
    AppState.tables.subnetTable = new Tabulator('#subnet-table', {
      data: subnets,
      layout: 'fitColumns',
      placeholder: 'No subnets',
      columns: [
        { title: 'Name', field: 'name' },
        { title: 'CIDR', field: 'ipv4_CIDR' },
        { title: 'Zone', field: 'zone' }
      ]
    });
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

window.deleteVpc = async function () {
  const item = AppState.resources.selected;
  if (!item) return;
  if (!confirm(`Delete VPC "${item.name}"?`)) return;
  try {
    await webconsolejs['common/api/services/vpc_api'].del(AppState.ns, item.name);
    hideDetail();
    await loadList();
  } catch (e) {
    alert('Failed to delete VPC: ' + (e?.response?.data?.message || e.message));
  }
};

window.addSubnetRow = function () {
  const container = document.getElementById('subnet-rows');
  const row = document.createElement('div');
  row.className = 'subnet-row row g-2 mb-2';
  row.innerHTML = `
    <div class="col-4"><input type="text" class="form-control form-control-sm subnet-name" placeholder="Subnet Name"></div>
    <div class="col-4"><input type="text" class="form-control form-control-sm subnet-cidr" placeholder="CIDR"></div>
    <div class="col-3"><input type="text" class="form-control form-control-sm subnet-zone" placeholder="Zone"></div>
    <div class="col-1"><button type="button" class="btn btn-sm btn-ghost-danger" onclick="removeSubnetRow(this)">✕</button></div>
  `;
  container.appendChild(row);
};

window.removeSubnetRow = function (btn) {
  const rows = document.querySelectorAll('#subnet-rows .subnet-row');
  if (rows.length <= 1) return;
  btn.closest('.subnet-row').remove();
};

window.submitCreateVpc = async function () {
  const ns = document.getElementById('modal-ns').value;
  const vpcName = document.getElementById('modal-vpcName').value.trim();
  const cidrBlock = document.getElementById('modal-cidrBlock').value.trim();

  if (!ns || !vpcName || !cidrBlock) {
    alert('Namespace, VPC Name, and CIDR are required.');
    return;
  }

  const subnetRows = document.querySelectorAll('#subnet-rows .subnet-row');
  const subnetInfoList = [];
  for (const row of subnetRows) {
    const name = row.querySelector('.subnet-name').value.trim();
    const ipv4_CIDR = row.querySelector('.subnet-cidr').value.trim();
    const zone = row.querySelector('.subnet-zone').value.trim();
    if (name && ipv4_CIDR) subnetInfoList.push({ name, ipv4_CIDR, zone });
  }
  if (subnetInfoList.length === 0) {
    alert('At least one subnet is required.');
    return;
  }

  try {
    await webconsolejs['common/api/services/vpc_api'].create(ns, { name: vpcName, cidrBlock, subnetInfoList });
    const modal = bootstrap.Modal.getInstance(document.getElementById('create-vpc-modal'));
    if (modal) modal.hide();
    AppState.ns = ns;
    await loadList();
  } catch (e) {
    alert('Failed to create VPC: ' + (e?.response?.data?.message || e.message));
  }
};

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-vpc-modal">Create VPC</button>`;
  }

  const nsSel = document.getElementById('ns-selector');
  if (nsSel) {
    nsSel.addEventListener('change', async function () {
      AppState.ns = this.value;
      hideDetail();
      await loadList();
    });
  }

  await loadNamespaces();
});
