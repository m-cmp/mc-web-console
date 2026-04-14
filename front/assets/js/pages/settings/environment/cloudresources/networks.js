const AppState = {
  resources: { list: [], selected: null },
  ui: { viewMode: false },
  tables: { resourceTable: null, subnetTable: null },
  ns: ''
};

// navbar의 project 변경 시 VPC 목록 재조회
$("#select-current-project").on('change', async function () {
  if (this.value === "") return;
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text };
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project);
  AppState.ns = project.NsId;
  hideDetail();
  await loadList();
});

async function loadConnectionList() {
  try {
    const resp = await webconsolejs['common/api/http'].commonAPIPost('/api/mc-infra-manager/GetConnConfigList', {});
    const list = resp?.data?.responseData?.connectionconfig || [];
    const sel = document.getElementById('modal-connectionName');
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    list.forEach(conn => {
      const opt = document.createElement('option');
      opt.value = conn.configName;
      opt.textContent = conn.configName;
      sel.appendChild(opt);
    });
  } catch (e) {
    console.error('Failed to load connection list', e);
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

export async function executeDeleteVpc(vpcName) {
  try {
    await webconsolejs['common/api/services/vpc_api'].del(AppState.ns, vpcName);
    hideDetail();
    await loadList();
  } catch (e) {
    webconsolejs['common/util'].showToast('Failed to delete VPC: ' + (e?.response?.data?.message || e.message), 'error');
  }
}

window.deleteVpc = function () {
  const item = AppState.resources.selected;
  if (!item) return;
  webconsolejs['partials/layout/modal'].commonConfirmModal(
    'commonDefaultModal',
    'Delete VPC',
    `Delete VPC "${item.name}"?`,
    'pages/settings/environment/cloudresources/networks.executeDeleteVpc',
    item.name
  );
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
  const ns = AppState.ns;
  const connectionName = document.getElementById('modal-connectionName').value.trim();
  const vpcName = document.getElementById('modal-vpcName').value.trim();
  const cidrBlock = document.getElementById('modal-cidrBlock').value.trim();

  if (!ns) {
    webconsolejs['common/util'].showToast('No namespace available. Please select a project first.', 'error');
    return;
  }
  if (!connectionName) {
    webconsolejs['common/util'].showToast('Connection is required.', 'error');
    return;
  }
  if (!vpcName || !cidrBlock) {
    webconsolejs['common/util'].showToast('VPC Name and CIDR are required.', 'error');
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
    webconsolejs['common/util'].showToast('At least one subnet is required.', 'error');
    return;
  }

  try {
    await webconsolejs['common/api/services/vpc_api'].create(ns, { connectionName, name: vpcName, cidrBlock, subnetInfoList });
    const modal = bootstrap.Modal.getInstance(document.getElementById('create-vpc-modal'));
    if (modal) modal.hide();
    await loadList();
  } catch (e) {
    webconsolejs['common/util'].showToast('Failed to create VPC: ' + (e?.response?.data?.message || e.message), 'error');
  }
};

function initFilter() {
  var fieldEl = document.getElementById("vpc-filter-field");
  var typeEl  = document.getElementById("vpc-filter-type");
  var valueEl = document.getElementById("vpc-filter-value");
  if (!fieldEl || !typeEl || !valueEl) return;

  function updateFilter() {
    var filterVal = fieldEl.options[fieldEl.selectedIndex].value;
    var typeVal   = typeEl.options[typeEl.selectedIndex].value;
    if (filterVal && AppState.tables.resourceTable) {
      AppState.tables.resourceTable.setFilter(filterVal, typeVal, valueEl.value);
    }
  }

  fieldEl.addEventListener("change", updateFilter);
  typeEl.addEventListener("change", updateFilter);
  valueEl.addEventListener("keyup", updateFilter);

  document.getElementById("vpc-filter-clear").addEventListener("click", function () {
    fieldEl.value = "";
    typeEl.value  = "like";
    valueEl.value = "";
    if (AppState.tables.resourceTable) AppState.tables.resourceTable.clearFilter();
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-vpc-modal">Create VPC</button>`;
  }

  const selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

  // workspace 미선택 체크
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject);

  // project 미선택 체크 (workspace는 선택됐으나 project 미선택)
  if (selectedWorkspaceProject.workspaceId !== "" && selectedWorkspaceProject.projectId === "") {
    webconsolejs["partials/layout/modal"].commonShowDefaultModal('Project Selection Check', 'Please select a project first');
  }

  AppState.ns = selectedWorkspaceProject.nsId;

  initFilter();
  await loadConnectionList();

  if (selectedWorkspaceProject.projectId !== "") {
    await loadList();
  }
});
