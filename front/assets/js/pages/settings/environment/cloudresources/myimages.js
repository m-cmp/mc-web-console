// MyImages (CustomImage) 관리 페이지 — List / Detail / Register / Delete

import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { showToast, TOAST_TYPES } from '../../../../common/utils/toast.js';
import { getProvider, getRegion, populateProviderFilterOptions, populateRegionFilterOptions } from '../../../../common/utils/cspResource.js';

const myImageApi = () => webconsolejs['common/api/services/myimage_api'];

const AppState = {
  ns: '',
  tables: { imageTable: null },
  resources: { selected: null, all: [] },
  ui: { viewMode: false },
};

function formatImageStatus(status) {
  if (status == null || status === '') return '-';
  if (typeof status === 'object') {
    return status.status || status.Status || JSON.stringify(status);
  }
  return String(status);
}

function statusBadge(statusText) {
  const text = formatImageStatus(statusText);
  if (text === '-') return text;
  const cls = /available/i.test(text) ? 'bg-success-lt' : 'bg-secondary-lt';
  return `<span class="badge ${cls}">${text}</span>`;
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

// ─── 페이지 초기화 ────────────────────────────────────────────────────────

$('#select-current-project').on('change', async function () {
  if (this.value === '') return;
  const project = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  AppState.ns = project?.NsId || '';
  hideDetail();
  if (AppState.ns) await loadImageList();
});

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <button type="button" class="btn btn-primary"
        data-bs-toggle="modal" data-bs-target="#create-myimage-modal">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
          viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
          stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 5l0 14"/><path d="M5 12l14 0"/>
        </svg>
        Register Custom Image
      </button>`;
  }

  const selectedWorkspaceProject = await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
  webconsolejs['partials/layout/modal'].checkWorkspaceSelection(selectedWorkspaceProject);

  AppState.ns = selectedWorkspaceProject.nsId || '';
  initFilter();

  if (selectedWorkspaceProject.projectId !== '') {
    await loadImageList();
  }
});

document.getElementById('create-myimage-modal')?.addEventListener('show.bs.modal', async function () {
  document.getElementById('create-myimage-name').value = '';
  document.getElementById('create-myimage-csp-id').value = '';
  document.getElementById('create-myimage-description').value = '';
  await _loadConnectionOptions('create-myimage-connection');
});

// ─── 목록 로드 ────────────────────────────────────────────────────────────

export async function loadImageList() {
  if (!AppState.ns) return;
  try {
    const data = await myImageApi().list(AppState.ns);
    const rawItems = data?.customImage || (Array.isArray(data) ? data : []);
    const items = rawItems.map((v) => ({ ...v, _provider: getProvider(v), _region: getRegion(v) }));
    AppState.resources.all = items;
    populateProviderFilterOptions(items, 'filter-provider');
    populateRegionFilterOptions(items, 'filter-provider', 'filter-region');
    if (AppState.tables.imageTable) {
      AppState.tables.imageTable.replaceData(items);
    } else {
      initTable(items);
    }
  } catch (err) {
    console.error('CustomImage 목록 조회 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to load MyImages list.');
  }
}

// ─── Tabulator 테이블 ─────────────────────────────────────────────────────

function initTable(items) {
  AppState.tables.imageTable = new Tabulator('#myimage-list-table', {
    data: items,
    layout: 'fitColumns',
    placeholder: 'No registered Custom Images.',
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
      { title: 'CSP Image ID', field: 'cspImageId', widthGrow: 2 },
      {
        title: 'Status',
        field: 'imageStatus',
        width: 120,
        formatter: (cell) => statusBadge(cell.getValue()),
      },
      { title: 'Source Node', field: 'sourceNodeUid', widthGrow: 1 },
      {
        title: 'Created At',
        field: 'creationDate',
        widthGrow: 1,
        formatter: (cell) => formatDate(cell.getValue()),
      },
    ],
  });

  AppState.tables.imageTable.on('rowClick', async function (e, row) {
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
      const detail = await myImageApi().get(AppState.ns, data.name);
      if (detail) {
        AppState.resources.selected = detail;
        renderDetail(detail);
      }
    } catch (err) {
      console.error('CustomImage 상세 조회 실패:', err);
    }
  });
}

// ─── Detail Panel ─────────────────────────────────────────────────────────

function renderDetail(data) {
  document.getElementById('detail-name').textContent = data.name || '-';
  document.getElementById('detail-image-name').textContent = data.name || '-';
  document.getElementById('detail-image-provider').textContent = getProvider(data);
  document.getElementById('detail-image-region').textContent = getRegion(data);
  document.getElementById('detail-image-csp-id').textContent = data.cspImageId || '-';
  document.getElementById('detail-image-status').innerHTML = statusBadge(data.imageStatus);
  document.getElementById('detail-image-source-node').textContent = data.sourceNodeUid || '-';
  document.getElementById('detail-image-os-distribution').textContent = data.osDistribution || '-';
  document.getElementById('detail-image-os-platform').textContent = formatImageStatus(data.osPlatform);
  document.getElementById('detail-image-architecture').textContent = formatImageStatus(data.osArchitecture);
  document.getElementById('detail-image-created').textContent = formatDate(data.creationDate);
  document.getElementById('detail-image-description').textContent = data.description || '-';
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

// ─── Delete ───────────────────────────────────────────────────────────────

export function confirmDeleteCustomImage() {
  const selected = AppState.resources.selected;
  if (!selected) return;
  webconsolejs['partials/layout/modal'].commonConfirmModal(
    'commonDefaultModal',
    'Delete Custom Image',
    `Delete Custom Image "${selected.name}"?`,
    'pages/settings/environment/cloudresources/myimages.executeDeleteCustomImage'
  );
}

export async function executeDeleteCustomImage() {
  const selected = AppState.resources.selected;
  if (!selected) return;
  try {
    await myImageApi().del(AppState.ns, selected.name);
    showToast(TOAST_TYPES.SUCCESS, `Custom Image "${selected.name}" deleted successfully`);
    hideDetail();
    await loadImageList();
  } catch (err) {
    console.error('CustomImage 삭제 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to delete Custom Image: ' + (err.message || ''));
  }
}

// ─── 다중선택 삭제 ───────────────────────────────────────────────────────

export function confirmBulkDelete() {
  const table = AppState.tables.imageTable;
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
    `Delete ${selected.length} selected Custom Image(s)?`,
    'pages/settings/environment/cloudresources/myimages.executeBulkDelete'
  );
}

export async function executeBulkDelete() {
  const items = AppState.resources.bulkSelected || [];
  if (items.length === 0) return;
  const results = await Promise.allSettled(items.map((item) => myImageApi().del(AppState.ns, item.name)));
  const failed = results.filter((r) => r.status === 'rejected').length;
  const succeeded = results.length - failed;
  showToast(
    failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
    `${succeeded} Custom Image(s) deleted${failed > 0 ? `, ${failed} failed` : ''}`
  );
  AppState.resources.bulkSelected = [];
  AppState.tables.imageTable?.deselectRow();
  hideDetail();
  await loadImageList();
}

// ─── Register ─────────────────────────────────────────────────────────────

export async function executeRegisterCustomImage() {
  const connectionName = document.getElementById('create-myimage-connection').value;
  const name = document.getElementById('create-myimage-name').value.trim();
  const cspResourceId = document.getElementById('create-myimage-csp-id').value.trim();
  const description = document.getElementById('create-myimage-description').value.trim();

  if (!connectionName || !name || !cspResourceId) {
    showToast(TOAST_TYPES.WARNING, 'Connection, Image name, and CSP Resource ID are required.');
    return;
  }

  const spinner = document.getElementById('create-myimage-spinner');
  const btn = document.getElementById('create-myimage-execute-btn');
  spinner?.classList.remove('d-none');
  if (btn) btn.disabled = true;

  const body = { name, connectionName, cspResourceId };
  if (description) body.description = description;

  try {
    await myImageApi().create(AppState.ns, body);
    showToast(TOAST_TYPES.SUCCESS, `Custom Image "${name}" registered successfully`);
    bootstrap.Modal.getInstance(document.getElementById('create-myimage-modal'))?.hide();
    await loadImageList();
  } catch (err) {
    console.error('CustomImage 등록 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to register Custom Image: ' + (err.message || ''));
  } finally {
    spinner?.classList.add('d-none');
    if (btn) btn.disabled = false;
  }
}

async function _loadConnectionOptions(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">Select</option>';
  try {
    const result = await webconsolejs['common/api/http'].commonAPIPost(
      '/api/mc-infra-manager/GetConnConfigList',
      {}
    );
    const list = result?.data?.responseData?.connectionconfig || [];
    for (const conn of list) {
      const opt = document.createElement('option');
      opt.value = conn.configName;
      opt.textContent = conn.configName;
      select.appendChild(opt);
    }
  } catch (err) {
    console.error('Connection 목록 로드 실패:', err);
  }
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
    if (!AppState.tables.imageTable) return;
    const filters = [];
    if (providerEl?.value) filters.push({ field: '_provider', type: '=', value: providerEl.value });
    if (regionEl?.value) filters.push({ field: '_region', type: '=', value: regionEl.value });
    if (fieldEl.value) filters.push({ field: fieldEl.value, type: typeEl.value, value: valueEl.value });
    if (filters.length > 0) {
      AppState.tables.imageTable.setFilter(filters);
    } else {
      AppState.tables.imageTable.clearFilter();
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
    if (AppState.tables.imageTable) AppState.tables.imageTable.clearFilter();
  });
}

// ─── webconsolejs 등록 ────────────────────────────────────────────────────
if (typeof webconsolejs === 'undefined') { window.webconsolejs = {}; }
webconsolejs['pages/settings/environment/cloudresources/myimages'] = {
  loadImageList,
  hideDetail,
  confirmDeleteCustomImage,
  executeDeleteCustomImage,
  confirmBulkDelete,
  executeBulkDelete,
  executeRegisterCustomImage,
};
