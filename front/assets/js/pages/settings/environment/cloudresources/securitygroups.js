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
  await refreshSgList();
});

var selectedWorkspaceProject = {};
window.currentNsId = "";

const AppState = {
  resources: { list: [], selected: null },
  ui: { viewMode: false },
  tables: { resourceTable: null, ruleTable: null }
};

document.addEventListener('DOMContentLoaded', initSecurityGroups);

async function initSecurityGroups() {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-sg-modal">Create Security Group</button>`;
  }

  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject);
  window.currentNsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
  await refreshSgList();
}

async function refreshSgList() {
  if (selectedWorkspaceProject.projectId != "") {
    try {
      const data = await webconsolejs['common/api/services/securitygroup_api'].list(window.currentNsId);
      const items = data?.securityGroup || [];
      AppState.resources.list = items;
      if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
      else initTable(items);
    } catch (e) {
      if (e?.response?.status !== 404) console.error('Failed to load SecurityGroups', e);
      const items = [];
      AppState.resources.list = items;
      if (AppState.tables.resourceTable) AppState.tables.resourceTable.replaceData(items);
      else initTable(items);
    }
  }
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#sg-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'No Security Groups found',
    columns: [
      { title: 'SG Name', field: 'name', sorter: 'string' },
      { title: 'VPC', field: 'vNetId', sorter: 'string' },
      { title: 'Inbound Rules', formatter: cell => (cell.getRow().getData().firewallRules || []).filter(r => r.direction === 'inbound').length },
      { title: 'Outbound Rules', formatter: cell => (cell.getRow().getData().firewallRules || []).filter(r => r.direction === 'outbound').length },
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
  document.getElementById('detail-sgName').textContent = data.name || '-';
  document.getElementById('detail-vpcName').textContent = data.vNetId || '-';
  document.getElementById('detail-ns').textContent = window.currentNsId;
  document.getElementById('detail-connection').textContent = data.connectionName || '-';

  const rules = data.firewallRules || [];
  if (AppState.tables.ruleTable) {
    AppState.tables.ruleTable.replaceData(rules);
  } else {
    AppState.tables.ruleTable = new Tabulator('#rule-table', {
      data: rules,
      layout: 'fitColumns',
      placeholder: 'No rules',
      columns: [
        { title: 'Protocol', field: 'protocol' },
        { title: 'Direction', field: 'direction' },
        { title: 'CIDR', field: 'cidr' },
        { title: 'From Port', field: 'fromPort' },
        { title: 'To Port', field: 'toPort' }
      ]
    });
  }
}

function showDetail() {
  document.getElementById('view-mode-cards').classList.add('show');
  AppState.ui.viewMode = true;
}

window.hideDetail = function () {
  document.getElementById('view-mode-cards').classList.remove('show');
  AppState.ui.viewMode = false;
  AppState.resources.selected = null;
};

window.deleteSg = async function () {
  const item = AppState.resources.selected;
  if (!item || !confirm(`Delete Security Group "${item.name}"?`)) return;
  try {
    await webconsolejs['common/api/services/securitygroup_api'].del(window.currentNsId, item.name);
    hideDetail();
    await refreshSgList();
  } catch (e) { alert('Failed to delete: ' + (e?.response?.data?.message || e.message)); }
};

window.addRuleRow = function () {
  const container = document.getElementById('rule-rows');
  const row = document.createElement('div');
  row.className = 'rule-row row g-2 mb-2';
  row.innerHTML = `
    <div class="col-2"><select class="form-select form-select-sm rule-protocol"><option>TCP</option><option>UDP</option><option>ICMP</option><option>ALL</option></select></div>
    <div class="col-2"><select class="form-select form-select-sm rule-direction"><option value="inbound">Inbound</option><option value="outbound">Outbound</option></select></div>
    <div class="col-3"><input type="text" class="form-control form-control-sm rule-cidr" placeholder="CIDR"></div>
    <div class="col-2"><input type="number" class="form-control form-control-sm rule-from" placeholder="From Port"></div>
    <div class="col-2"><input type="number" class="form-control form-control-sm rule-to" placeholder="To Port"></div>
    <div class="col-1"><button type="button" class="btn btn-sm btn-ghost-danger" onclick="removeRuleRow(this)">✕</button></div>
  `;
  container.appendChild(row);
};

window.removeRuleRow = function (btn) {
  const rows = document.querySelectorAll('#rule-rows .rule-row');
  if (rows.length <= 1) return;
  btn.closest('.rule-row').remove();
};

window.submitCreateSg = async function () {
  const ns = window.currentNsId;
  const name = document.getElementById('modal-sgName').value.trim();
  const vNetId = document.getElementById('modal-vpcName').value.trim();
  if (!ns || !name || !vNetId) { alert('SG Name and VPC Name are required. Make sure a project is selected.'); return; }

  const ruleRows = document.querySelectorAll('#rule-rows .rule-row');
  const firewallRules = Array.from(ruleRows).map(row => ({
    protocol: row.querySelector('.rule-protocol').value,
    direction: row.querySelector('.rule-direction').value,
    cidr: row.querySelector('.rule-cidr').value.trim(),
    fromPort: row.querySelector('.rule-from').value,
    toPort: row.querySelector('.rule-to').value
  })).filter(r => r.cidr);

  try {
    await webconsolejs['common/api/services/securitygroup_api'].create(ns, { name, vNetId, firewallRules });
    bootstrap.Modal.getInstance(document.getElementById('create-sg-modal'))?.hide();
    await refreshSgList();
  } catch (e) { alert('Failed to create: ' + (e?.response?.data?.message || e.message)); }
};
