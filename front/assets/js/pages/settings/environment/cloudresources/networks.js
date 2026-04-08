import { TabulatorFull as Tabulator } from 'tabulator-tables';

const AppState = {
  resources: { list: [], selected: null },
  ui: { viewMode: false },
  tables: { resourceTable: null, subnetTable: null },
  /** Selected project NsId (mc-infra namespace) */
  nsId: ''
};

function getWorkspaceProjectNsContext() {
  const ws = webconsolejs['common/api/services/workspace_api'].getCurrentWorkspace();
  const prj = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  return {
    workspaceId: ws && ws.Id ? String(ws.Id) : '',
    projectId: prj && prj.Id ? String(prj.Id) : '',
    nsId: prj && prj.NsId ? String(prj.NsId) : ''
  };
}

function syncProjectNsIdFromSession() {
  const ctx = getWorkspaceProjectNsContext();
  AppState.nsId = ctx.nsId || '';
  return ctx;
}

function setContextLabel(text) {
  const el = document.getElementById('networks-context-label');
  if (el) {
    el.textContent = text || '';
  }
  const alertEl = document.getElementById('networks-no-context-alert');
  if (alertEl) {
    alertEl.style.display = text ? '' : 'none';
  }
}

async function loadList() {
  const ctx = syncProjectNsIdFromSession();
  hideDetail();

  if (!ctx.workspaceId) {
    setContextLabel('Choose a workspace.');
    if (AppState.tables.resourceTable) {
      AppState.tables.resourceTable.replaceData([]);
    } else {
      initTable([]);
    }
    return;
  }
  if (!ctx.projectId || !ctx.nsId) {
    setContextLabel('Choose a project.');
    if (AppState.tables.resourceTable) {
      AppState.tables.resourceTable.replaceData([]);
    } else {
      initTable([]);
    }
    return;
  }

  setContextLabel('');

  try {
    const data = await webconsolejs['common/api/services/vpc_api'].getAllVNet(ctx.nsId, {
      option: '',
      filterKey: [],
      filterVal: []
    });
    console.debug('[Networks] GetAllVNet responseData:', data);
    const items = data?.vNet || [];
    AppState.resources.list = items;
    if (AppState.tables.resourceTable) {
      AppState.tables.resourceTable.replaceData(items);
    } else {
      initTable(items);
    }
  } catch (e) {
    if (e?.response?.status !== 404) {
      console.error('Failed to load VPCs', e);
    }
    AppState.resources.list = [];
    if (AppState.tables.resourceTable) {
      AppState.tables.resourceTable.replaceData([]);
    } else {
      initTable([]);
    }
  }
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#vpc-table', {
    data: data,
    layout: 'fitColumns',
    placeholder: 'No VPCs for this project.',
    columns: [
      { title: 'VPC Name', field: 'name', sorter: 'string' },
      { title: 'IPv4 CIDR', field: 'cidrBlock', sorter: 'string' },
      {
        title: 'Subnets',
        formatter: (cell) => String((cell.getRow().getData().subnetInfoList || []).length)
      },
      { title: 'Connection', field: 'connectionName', sorter: 'string' }
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
  document.getElementById('detail-vpcName').textContent = data.name || '-';
  document.getElementById('detail-cidrBlock').textContent = data.cidrBlock || '-';
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
  if (el) {
    el.classList.add('show');
  }
  AppState.ui.viewMode = true;
}

window.hideDetail = function () {
  const el = document.getElementById('view-mode-cards');
  if (el) {
    el.classList.remove('show');
  }
  AppState.ui.viewMode = false;
  AppState.resources.selected = null;
};

window.deleteVpc = async function () {
  const item = AppState.resources.selected;
  if (!item) {
    return;
  }
  if (!AppState.nsId) {
    alert('No project selected.');
    return;
  }
  if (!confirm(`Delete VPC "${item.name}"?`)) {
    return;
  }
  try {
    await webconsolejs['common/api/services/vpc_api'].del(AppState.nsId, item.name);
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
  if (rows.length <= 1) {
    return;
  }
  btn.closest('.subnet-row').remove();
};

window.submitCreateVpc = async function () {
  syncProjectNsIdFromSession();
  const nsId = AppState.nsId;
  const vpcName = document.getElementById('modal-vpcName').value.trim();
  const cidrBlock = document.getElementById('modal-cidrBlock').value.trim();

  if (!nsId) {
    alert('Select workspace and project in the top bar first.');
    return;
  }
  if (!vpcName || !cidrBlock) {
    alert('VPC Name and CIDR are required.');
    return;
  }

  const subnetRows = document.querySelectorAll('#subnet-rows .subnet-row');
  const subnetInfoList = [];
  for (const row of subnetRows) {
    const name = row.querySelector('.subnet-name').value.trim();
    const ipv4_CIDR = row.querySelector('.subnet-cidr').value.trim();
    const zone = row.querySelector('.subnet-zone').value.trim();
    if (name && ipv4_CIDR) {
      subnetInfoList.push({ name, ipv4_CIDR, zone });
    }
  }
  if (subnetInfoList.length === 0) {
    alert('At least one subnet is required.');
    return;
  }

  try {
    await webconsolejs['common/api/services/vpc_api'].create(nsId, {
      name: vpcName,
      cidrBlock,
      subnetInfoList
    });
    const modal = bootstrap.Modal.getInstance(document.getElementById('create-vpc-modal'));
    if (modal) {
      modal.hide();
    }
    await loadList();
  } catch (e) {
    alert('Failed to create VPC: ' + (e?.response?.data?.message || e.message));
  }
};

function bindWorkspaceProjectListeners() {
  const ws = document.getElementById('select-current-workspace');
  const prj = document.getElementById('select-current-project');
  if (ws) {
    ws.addEventListener('change', () => {
      loadList();
    });
  }
  if (prj) {
    prj.addEventListener('change', () => {
      loadList();
    });
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML =
      '<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-vpc-modal">Create VPC</button>';
  }

  await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
  bindWorkspaceProjectListeners();
  await loadList();
});
