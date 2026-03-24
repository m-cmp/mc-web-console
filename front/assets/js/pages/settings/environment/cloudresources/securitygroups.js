const AppState = {
  resources: { list: [], selected: null },
  ui: { viewMode: false },
  tables: { resourceTable: null, ruleTable: null },
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
        opt.value = ns.id;
        opt.textContent = ns.id;
        el.appendChild(opt);
      });
    });
    if (nsList.length > 0) { AppState.ns = nsList[0].id; await loadList(); }
  } catch (e) { console.error('Failed to load namespaces', e); }
}

async function loadList() {
  if (!AppState.ns) return;
  try {
    const data = await webconsolejs['common/api/services/securitygroup_api'].list(AppState.ns);
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
  document.getElementById('detail-sgName').textContent = data.name || '-';
  document.getElementById('detail-vpcName').textContent = data.vNetId || '-';
  document.getElementById('detail-ns').textContent = AppState.ns;
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

function showDetail() { document.getElementById('view-mode-cards').classList.add('show'); }

window.hideDetail = function () {
  document.getElementById('view-mode-cards').classList.remove('show');
  AppState.resources.selected = null;
};

window.deleteSg = async function () {
  const item = AppState.resources.selected;
  if (!item || !confirm(`Delete Security Group "${item.name}"?`)) return;
  try {
    await webconsolejs['common/api/services/securitygroup_api'].del(AppState.ns, item.name);
    hideDetail();
    await loadList();
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
  const ns = document.getElementById('modal-ns').value;
  const name = document.getElementById('modal-sgName').value.trim();
  const vNetId = document.getElementById('modal-vpcName').value.trim();
  if (!ns || !name || !vNetId) { alert('Namespace, SG Name, and VPC Name are required.'); return; }

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
    AppState.ns = ns;
    await loadList();
  } catch (e) { alert('Failed to create: ' + (e?.response?.data?.message || e.message)); }
};

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) btnList.innerHTML = `<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-sg-modal">Create Security Group</button>`;

  document.getElementById('ns-selector')?.addEventListener('change', async function () {
    AppState.ns = this.value;
    hideDetail();
    await loadList();
  });

  await loadNamespaces();
});
