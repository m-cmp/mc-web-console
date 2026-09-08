// Data Disk 관리 페이지 — CRUD + Import
// FR-CLOUD-ADMIN-003 / RQ-CLOUD-ADMIN-007

import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { showToast, TOAST_TYPES } from '../../../../common/utils/toast.js';
import { getProvider, getRegion, populateProviderFilterOptions, populateRegionFilterOptions } from '../../../../common/utils/cspResource.js';

const diskApi = () => webconsolejs['common/api/services/disk_api'];
const importApi = () => webconsolejs['common/api/services/import_api'];

const AppState = {
  ns: '',
  tables: { diskTable: null },
  resources: { selected: null, all: [] },
  ui: { viewMode: false },
  connections: [],
};

// ─── 페이지 초기화 ────────────────────────────────────────────────────────

$('#select-current-project').on('change', async function () {
  if (this.value === '') return;
  const project = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  AppState.ns = project?.NsId || '';
  if (AppState.ns) await loadDiskList();
});

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <button type="button" class="btn btn-primary"
        data-bs-toggle="modal" data-bs-target="#create-disk-modal">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
          viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
          stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 5l0 14"/><path d="M5 12l14 0"/>
        </svg>
        Create Data Disk
      </button>`;
  }

  const selectedWorkspaceProject = await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
  webconsolejs['partials/layout/modal'].checkWorkspaceSelection(selectedWorkspaceProject);

  AppState.ns = selectedWorkspaceProject.nsId || '';
  initFilter();

  if (selectedWorkspaceProject.projectId !== '') {
    await loadDiskList();
  }
});

// ─── Data Disk 목록 로드 ──────────────────────────────────────────────────

export async function loadDiskList() {
  if (!AppState.ns) return;
  try {
    const data = await diskApi().getAllDataDisk(AppState.ns);
    const rawItems = data?.dataDisk || (Array.isArray(data) ? data : []);
    const items = rawItems.map((v) => {
      const ref = attachedNodeRef(v);
      return { ...v, _provider: getProvider(v), _region: getRegion(v), _attachedTo: ref ? `${ref.infraId} / ${ref.nodeId}` : '-' };
    });
    AppState.resources.all = items;
    populateProviderFilterOptions(items, 'filter-provider');
    populateRegionFilterOptions(items, 'filter-provider', 'filter-region');
    if (AppState.tables.diskTable) {
      AppState.tables.diskTable.replaceData(items);
    } else {
      initTable(items);
    }
  } catch (err) {
    console.error('Data Disk 목록 조회 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to load Data Disk list.');
  }
}

function diskId(data) {
  return data?.id || data?.name;
}

// "/ns/default/infra/infra01/node/aws-ap-southeast-1-1" -> { nsId, infraId, nodeId }
function parseNodeRef(resourcePath) {
  const m = /^\/ns\/([^/]+)\/infra\/([^/]+)\/node\/([^/]+)$/.exec(resourcePath || '');
  return m ? { nsId: m[1], infraId: m[2], nodeId: m[3] } : null;
}

function attachedNodeRef(disk) {
  for (const ref of disk?.associatedObjectList || []) {
    const parsed = parseNodeRef(ref);
    if (parsed) return parsed;
  }
  return null;
}

// API 프록시는 백엔드(CSP SDK) 에러 메시지를 {responseData:{message},status:{...}} 로 감싼다.
// 축소된 axios 기본 메시지("Request failed with status code 500") 대신 실제 원인을 보여준다.
function extractErrorMessage(err) {
  return err?.response?.data?.responseData?.message || err?.message || String(err);
}

// ─── Tabulator 테이블 ─────────────────────────────────────────────────────

function initTable(items) {
  AppState.tables.diskTable = new Tabulator('#disk-list-table', {
    data: items,
    layout: 'fitColumns',
    placeholder: 'No registered Data Disks.',
    pagination: 'local',
    paginationSize: 10,
    paginationSizeSelector: [10, 20, 50],
    paginationCounter: 'rows',
    movableColumns: true,
    selectableRows: true, // false로 두면 Tabulator 내부 cap-check 버그(isNaN(false)===false)로 다중선택 자체가 깨진다
    initialSort: [{ column: 'name', dir: 'asc' }],
    columns: [
      { formatter: 'rowSelection', titleFormatter: 'rowSelection', headerSort: false, hozAlign: 'center', width: 40 },
      { title: 'Name', field: 'name', widthGrow: 2, sorter: 'string' },
      { title: 'Provider', field: '_provider', widthGrow: 1, sorter: 'string' },
      { title: 'Region', field: '_region', widthGrow: 1, sorter: 'string' },
      { title: 'Disk Type', field: 'diskType', widthGrow: 1 },
      {
        title: 'Size (GB)',
        field: 'diskSize',
        hozAlign: 'right',
        width: 100,
        sorter: 'number',
      },
      { title: 'Status', field: 'status', widthGrow: 1 },
      { title: 'Attached To', field: '_attachedTo', widthGrow: 1.5, sorter: 'string' },
      { title: 'CSP Resource ID', field: 'cspResourceId', widthGrow: 2 },
    ],
  });

  AppState.tables.diskTable.on('rowClick', async function (e, row) {
    // selectableRows:true는 row 아무데나 클릭해도 체크박스를 토글하는 내장 동작이 있다.
    // 체크박스 자체를 클릭한 게 아니면 그 토글을 즉시 되돌려, row 클릭은 Detail Panel 오픈 전용으로 만든다.
    const clickedCell = row.getCells().find(c => c.getElement().contains(e.target));
    const isCheckboxCol = clickedCell?.getColumn()?.getDefinition()?.formatter === 'rowSelection';
    if (!isCheckboxCol) {
      row.toggleSelect();
    }

    const data = row.getData();
    AppState.resources.selected = data;
    renderDetail(data);
    showDetail();
    try {
      const detail = await diskApi().getDataDisk(AppState.ns, diskId(data));
      if (detail) {
        AppState.resources.selected = detail;
        renderDetail(detail);
      }
    } catch (err) {
      console.error('Data Disk 상세 조회 실패:', err);
    }
  });
}

// ─── Detail Panel ─────────────────────────────────────────────────────────

function renderDetail(data) {
  document.getElementById('detail-name').textContent = data.name || '-';
  document.getElementById('detail-disk-name').textContent = data.name || '-';
  document.getElementById('detail-disk-provider').textContent = getProvider(data);
  document.getElementById('detail-disk-region').textContent = getRegion(data);
  document.getElementById('detail-disk-type').textContent = data.diskType || '-';
  document.getElementById('detail-disk-size').textContent =
    data.diskSize != null ? String(data.diskSize) : '-';
  document.getElementById('detail-disk-status').textContent = data.status || '-';
  document.getElementById('detail-disk-csp-id').textContent = data.cspResourceId || '-';
  document.getElementById('detail-disk-description').textContent = data.description || '-';

  const ref = attachedNodeRef(data);
  document.getElementById('detail-disk-attached-to').textContent = ref ? `${ref.infraId} / ${ref.nodeId}` : '-';
  document.getElementById('detail-detach-btn').classList.toggle('d-none', !ref);
}

function showDetail() {
  const el = document.getElementById('view-mode-cards');
  if (el) el.classList.add('show');
  AppState.ui.viewMode = true;
}

export function hideDetail() {
  document.getElementById('view-mode-cards')?.classList.remove('show');
  AppState.ui.viewMode = false;
  AppState.resources.selected = null;
}

// ─── Attach / Detach ───────────────────────────────────────────────────────

export function confirmDetachDisk() {
  const selected = AppState.resources.selected;
  const ref = selected && attachedNodeRef(selected);
  if (!ref) return;
  webconsolejs['partials/layout/modal'].commonConfirmModal(
    'commonDefaultModal',
    'Detach Data Disk',
    `Detach Data Disk "${selected.name}" from ${ref.infraId}/${ref.nodeId}?`,
    'pages/settings/environment/cloudresources/disks.executeDetachDisk'
  );
}

export async function executeDetachDisk() {
  const selected = AppState.resources.selected;
  const ref = selected && attachedNodeRef(selected);
  if (!ref) return;
  try {
    await diskApi().detachDataDisk(AppState.ns, ref.infraId, ref.nodeId, diskId(selected));
    showToast(TOAST_TYPES.SUCCESS, `Data Disk "${selected.name}" detached`);
    hideDetail();
    await loadDiskList();
  } catch (err) {
    console.error('Data Disk Detach 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to detach Data Disk: ' + extractErrorMessage(err));
  }
}

// List에서 Attach 아이콘 클릭 시 — 체크된 행이 정확히 1개일 때만 진행
export function openAttachFromList() {
  const table = AppState.tables.diskTable;
  const rows = table ? table.getSelectedData() : [];
  if (rows.length !== 1) {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Selection Required',
      'Please select exactly one Data Disk to attach.'
    );
    return;
  }
  AppState.resources.selected = rows[0];
  openAttachDiskModal();
}

export async function openAttachDiskModal() {
  const selected = AppState.resources.selected;
  if (!selected) return;
  if (attachedNodeRef(selected)) {
    showToast(TOAST_TYPES.WARNING, 'This disk is already attached. Detach it first.');
    return;
  }
  document.getElementById('attach-disk-name').value = selected.name || '-';
  document.getElementById('attach-disk-nodegroup').innerHTML = '<option value="">Select</option>';
  document.getElementById('attach-disk-vm').innerHTML = '<option value="">Select</option>';
  await _loadAttachMciOptions();
  new bootstrap.Modal(document.getElementById('attach-disk-modal')).show();
}

// 디스크와 동일 CSP(provider)를 가진 노드가 하나라도 있는 Infra만 후보로 노출
async function _loadAttachMciOptions() {
  const select = document.getElementById('attach-disk-mci');
  select.innerHTML = '<option value="">Select</option>';
  const diskProvider = getProvider(AppState.resources.selected);
  try {
    const mciApi = webconsolejs['common/api/services/infra_api'];
    const list = await mciApi.getMciList(AppState.ns);
    const mcis = list?.infra || (Array.isArray(list) ? list : []);
    for (const mci of mcis) {
      const nodes = mci.node || [];
      if (!nodes.some((n) => n?.connectionConfig?.providerName === diskProvider)) continue;
      const opt = document.createElement('option');
      opt.value = mci.id || mci.name;
      opt.textContent = mci.id || mci.name;
      select.appendChild(opt);
    }
  } catch (err) {
    console.error('Infra 목록 조회 실패:', err);
  }
}

document.getElementById('attach-disk-mci')?.addEventListener('change', async function () {
  await _loadAttachNodeGroupOptions(this.value);
});

async function _loadAttachNodeGroupOptions(infraId) {
  const nodeGroupSelect = document.getElementById('attach-disk-nodegroup');
  const vmSelect = document.getElementById('attach-disk-vm');
  nodeGroupSelect.innerHTML = '<option value="">Select</option>';
  vmSelect.innerHTML = '<option value="">Select</option>';
  if (!infraId) return;
  try {
    const nlbApi = webconsolejs['common/api/services/nlb_api'];
    const data = await nlbApi.getInfraNodeGroupIds(AppState.ns, infraId);
    const ids = data?.output || data?.subGroup || (Array.isArray(data) ? data : []);
    for (const id of ids) {
      const nodeGroupId = typeof id === 'string' ? id : id?.id;
      const opt = document.createElement('option');
      opt.value = nodeGroupId;
      opt.textContent = nodeGroupId;
      nodeGroupSelect.appendChild(opt);
    }
  } catch (err) {
    console.error('NodeGroup 목록 조회 실패:', err);
  }
}

document.getElementById('attach-disk-nodegroup')?.addEventListener('change', async function () {
  const infraId = document.getElementById('attach-disk-mci').value;
  await _loadAttachVmOptions(infraId, this.value);
});

async function _loadAttachVmOptions(infraId, nodeGroupId) {
  const select = document.getElementById('attach-disk-vm');
  select.innerHTML = '<option value="">Select</option>';
  if (!infraId || !nodeGroupId) return;
  const selected = AppState.resources.selected;
  try {
    const mciApi = webconsolejs['common/api/services/infra_api'];
    const mciResp = await mciApi.getMci(AppState.ns, infraId);
    const nodes = mciResp?.responseData?.node || [];
    const diskProvider = getProvider(selected);
    const diskRegion = getRegion(selected);
    for (const node of nodes) {
      if (node.nodeGroupId !== nodeGroupId) continue;
      if (getProvider(node) !== diskProvider || getRegion(node) !== diskRegion) continue;
      if (String(node.status || '').toLowerCase() !== 'running') continue; // 중지된 VM은 attach 불가
      const opt = document.createElement('option');
      opt.value = node.id;
      opt.textContent = `${node.id} (${node.status})`;
      select.appendChild(opt);
    }
  } catch (err) {
    console.error('Node 목록 조회 실패:', err);
  }
}

export async function executeAttachDisk() {
  const selected = AppState.resources.selected;
  const infraId = document.getElementById('attach-disk-mci').value;
  const nodeId = document.getElementById('attach-disk-vm').value;
  if (!selected || !infraId || !nodeId) {
    showToast(TOAST_TYPES.WARNING, 'Please select Infra, NodeGroup, and Node.');
    return;
  }

  const spinner = document.getElementById('attach-disk-spinner');
  const btn = document.getElementById('attach-disk-execute-btn');
  spinner.classList.remove('d-none');
  btn.disabled = true;

  try {
    await diskApi().attachDataDisk(AppState.ns, infraId, nodeId, diskId(selected));
    showToast(TOAST_TYPES.SUCCESS, `Data Disk "${selected.name}" attached to ${nodeId}`);
    bootstrap.Modal.getInstance(document.getElementById('attach-disk-modal'))?.hide();
    await loadDiskList();
  } catch (err) {
    console.error('Data Disk Attach 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to attach Data Disk: ' + extractErrorMessage(err));
  } finally {
    spinner.classList.add('d-none');
    btn.disabled = false;
  }
}

// ─── 다중선택 삭제 ───────────────────────────────────────────────────────

export function confirmBulkDelete() {
  const table = AppState.tables.diskTable;
  const selected = table ? table.getSelectedData() : [];
  if (selected.length === 0) {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Nothing Selected',
      'Please select at least one item to delete.'
    );
    return;
  }
  AppState.resources.bulkSelected = selected;
  webconsolejs['partials/layout/modal'].commonConfirmModal(
    'commonDefaultModal',
    'Delete Selected',
    `Delete ${selected.length} selected Data Disk(s)?`,
    'pages/settings/environment/cloudresources/disks.executeBulkDelete'
  );
}

export async function executeBulkDelete() {
  const items = AppState.resources.bulkSelected || [];
  if (items.length === 0) return;
  const results = await Promise.allSettled(items.map((item) => diskApi().delDataDisk(AppState.ns, diskId(item))));
  const failed = results.filter((r) => r.status === 'rejected').length;
  const succeeded = results.length - failed;
  showToast(
    failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
    `${succeeded} Data Disk(s) deleted${failed > 0 ? `, ${failed} failed` : ''}`
  );
  AppState.resources.bulkSelected = [];
  AppState.tables.diskTable?.deselectRow();
  hideDetail();
  await loadDiskList();
}

// ─── Filter ───────────────────────────────────────────────────────────────

function initFilter() {
  const providerEl = document.getElementById('filter-provider');
  const regionEl = document.getElementById('filter-region');
  const fieldEl = document.getElementById('filter-field');
  const typeEl = document.getElementById('filter-type');
  const valueEl = document.getElementById('filter-value');
  if (!fieldEl || !typeEl || !valueEl) return;

  function updateFilter() {
    if (!AppState.tables.diskTable) return;
    const filters = [];
    if (providerEl?.value) filters.push({ field: '_provider', type: '=', value: providerEl.value });
    if (regionEl?.value) filters.push({ field: '_region', type: '=', value: regionEl.value });
    if (fieldEl.value) filters.push({ field: fieldEl.value, type: typeEl.value, value: valueEl.value });
    if (filters.length > 0) {
      AppState.tables.diskTable.setFilter(filters);
    } else {
      AppState.tables.diskTable.clearFilter();
    }
  }

  providerEl?.addEventListener('change', function () {
    populateRegionFilterOptions(AppState.resources.all, 'filter-provider', 'filter-region');
    updateFilter();
  });
  regionEl?.addEventListener('change', updateFilter);
  fieldEl.addEventListener('change', updateFilter);
  typeEl.addEventListener('change', updateFilter);
  valueEl.addEventListener('keyup', updateFilter);

  document.getElementById('filter-clear').addEventListener('click', function () {
    if (providerEl) providerEl.value = '';
    if (regionEl) regionEl.value = '';
    fieldEl.value = '';
    typeEl.value = 'like';
    valueEl.value = '';
    if (AppState.tables.diskTable) AppState.tables.diskTable.clearFilter();
  });
}

// ─── Create Data Disk 모달 ─────────────────────────────────────────────────

document.getElementById('create-disk-modal')?.addEventListener('show.bs.modal', async function () {
  document.getElementById('create-disk-name').value = '';
  document.getElementById('create-disk-size').value = '';
  document.getElementById('create-disk-description').value = '';
  document.getElementById('create-disk-type').innerHTML = '<option value="">Select (optional)</option>';
  await _loadConnectionOptions('create-disk-connection');
});

document.getElementById('create-disk-connection')?.addEventListener('change', async function () {
  await _loadDiskTypeOptions(this.value);
});

export async function executeCreateDisk() {
  const connectionName = document.getElementById('create-disk-connection').value;
  const name = document.getElementById('create-disk-name').value.trim();
  const diskType = document.getElementById('create-disk-type').value.trim();
  const diskSize = parseInt(document.getElementById('create-disk-size').value, 10);
  const description = document.getElementById('create-disk-description').value.trim();

  if (!connectionName || !name || !diskSize) {
    showToast(TOAST_TYPES.WARNING, 'Connection, disk name, and size are required.');
    return;
  }

  const spinner = document.getElementById('create-disk-spinner');
  const btn = document.getElementById('create-disk-execute-btn');
  spinner.classList.remove('d-none');
  btn.disabled = true;

  const body = { connectionName, name, diskSize };
  if (diskType) body.diskType = diskType;
  if (description) body.description = description;

  try {
    await diskApi().postDataDisk(AppState.ns, body);
    showToast(TOAST_TYPES.SUCCESS, `Data Disk "${name}" created successfully`);
    bootstrap.Modal.getInstance(document.getElementById('create-disk-modal'))?.hide();
    await loadDiskList();
  } catch (err) {
    console.error('Data Disk 생성 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to create Data Disk: ' + extractErrorMessage(err));
  } finally {
    spinner.classList.add('d-none');
    btn.disabled = false;
  }
}

async function _loadDiskTypeOptions(connectionName) {
  const select = document.getElementById('create-disk-type');
  select.innerHTML = '<option value="">Select (optional)</option>';
  if (!connectionName) return;

  const conn = AppState.connections.find((c) => c.configName === connectionName);
  const provider = conn?.providerName;
  if (!provider) return;

  try {
    const lookup = await diskApi().getCommonLookupDiskInfo(provider, connectionName);
    const providerId = provider.toUpperCase();
    const match = (lookup || []).find((item) => item.providerId === providerId);
    const diskTypes = match?.disksize || match?.rootdisktype || [];
    for (const type of diskTypes) {
      const typeName = String(type).split('|')[0];
      const opt = document.createElement('option');
      opt.value = typeName;
      opt.textContent = type;
      select.appendChild(opt);
    }
  } catch (err) {
    console.error('Disk type lookup 실패:', err);
  }
}

// ─── Import Data Disk 모달 ────────────────────────────────────────────────

export async function openImportDiskModal() {
  AppState.ns = webconsolejs['common/api/services/workspace_api'].getCurrentProject()?.NsId || '';
  if (!AppState.ns) {
    showToast(TOAST_TYPES.WARNING, 'Please select a project first.');
    return;
  }
  document.getElementById('import-disk-project').value = AppState.ns;
  await _loadConnectionOptions('import-disk-connection');
  new bootstrap.Modal(document.getElementById('import-disk-modal')).show();
}

export async function executeImportDisk() {
  const connectionName = document.getElementById('import-disk-connection').value;
  if (!connectionName) {
    showToast(TOAST_TYPES.WARNING, 'Please select a Connection.');
    return;
  }

  const spinner = document.getElementById('import-disk-spinner');
  const btn = document.getElementById('import-disk-execute-btn');
  spinner.classList.remove('d-none');
  btn.disabled = true;

  try {
    const result = await importApi().registerCspResources(['dataDisk'], connectionName, AppState.ns);
    const count = result?.registerationOverview?.dataDisk || 0;
    const failed = result?.registerationOverview?.failed || 0;
    showToast(
      failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
      `DataDisk ${count} registered successfully${failed > 0 ? `, ${failed} failed` : ''}`
    );
    bootstrap.Modal.getInstance(document.getElementById('import-disk-modal'))?.hide();
    await loadDiskList();
  } catch (err) {
    showToast(TOAST_TYPES.ERROR, 'DataDisk import failed: ' + extractErrorMessage(err));
  } finally {
    spinner.classList.add('d-none');
    btn.disabled = false;
  }
}

async function _loadConnectionOptions(selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Select</option>';
  try {
    const result = await webconsolejs['common/api/http'].commonAPIPost(
      '/api/mc-infra-manager/GetConnConfigList',
      {}
    );
    AppState.connections = result?.data?.responseData?.connectionconfig || [];
    for (const conn of AppState.connections) {
      const opt = document.createElement('option');
      opt.value = conn.configName;
      opt.textContent = conn.configName;
      select.appendChild(opt);
    }
  } catch (err) {
    console.error('Connection 목록 로드 실패:', err);
  }
}

// ─── webconsolejs 등록 ────────────────────────────────────────────────────
if (typeof webconsolejs === 'undefined') { window.webconsolejs = {}; }
webconsolejs['pages/settings/environment/cloudresources/disks'] = {
  loadDiskList,
  hideDetail,
  confirmDetachDisk,
  executeDetachDisk,
  openAttachFromList,
  openAttachDiskModal,
  executeAttachDisk,
  confirmBulkDelete,
  executeBulkDelete,
  executeCreateDisk,
  openImportDiskModal,
  executeImportDisk,
};
