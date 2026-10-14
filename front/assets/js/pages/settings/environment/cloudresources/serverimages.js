// Server Image 관리 — system namespace 고정 (프로젝트 NsId 사용 금지)
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { showToast, TOAST_TYPES } from '../../../../common/utils/toast.js';
import { getProvider, getRegion } from '../../../../common/utils/cspResource.js';

const SYSTEM_NS = 'system';
const PAGE_KEY = 'pages/settings/environment/cloudresources/serverimages';
const imageApi = () => webconsolejs['common/api/services/serverimage_api'];

const AppState = {
  tables: { resourceTable: null, popupTable: null },
  resources: { selected: null },
  connections: [],
  lastCriteria: null,
};

// ─── 페이지 초기화 ────────────────────────────────────────────────────────
// Image는 system 네임스페이스 고정 리소스라 project(=namespace) 선택과 무관하다.

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-image-modal">
        Register Image
      </button>`;
  }

  const selectedWorkspaceProject = await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
  webconsolejs['partials/layout/modal'].checkWorkspaceSelection(selectedWorkspaceProject);

  updateNamespaceLabel();
  initFilter();
  // system ns 이미지는 17만+ 건 — 자동 전체 조회 대신 조건 검색으로만 로드
  initTable([]);
  await loadSearchConnections();
});

async function loadSearchConnections() {
  const providerSelect = document.getElementById('search-provider');
  if (!providerSelect) return;
  try {
    const resp = await webconsolejs['common/api/http'].commonAPIPost('/api/mc-infra-manager/GetConnConfigList', {});
    AppState.connections = resp?.data?.responseData?.connectionconfig || [];
    const providers = [...new Set(AppState.connections.map((c) => c.providerName).filter(Boolean))].sort();
    for (const p of providers) {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      providerSelect.appendChild(opt);
    }
  } catch (err) {
    console.error('Failed to load connection list', err);
  }
}

function updateSearchRegionOptions() {
  const provider = document.getElementById('search-provider')?.value || '';
  const regionSelect = document.getElementById('search-region');
  if (!regionSelect) return;
  regionSelect.innerHTML = '<option value="">-- all regions --</option>';
  if (!provider) return;
  const regions = [...new Set(
    AppState.connections
      .filter((c) => c.providerName === provider)
      .map((c) => c.regionDetail?.regionName || c.regionDetail?.regionId)
      .filter(Boolean)
  )].sort();
  for (const r of regions) {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    regionSelect.appendChild(opt);
  }
}

document.getElementById('search-provider')?.addEventListener('change', updateSearchRegionOptions);

export async function searchImages() {
  const provider = document.getElementById('search-provider')?.value || '';
  const region = document.getElementById('search-region')?.value || '';
  const osType = document.getElementById('search-ostype')?.value.trim() || '';
  const basicOnly = document.getElementById('search-basic-only')?.checked ?? true;

  if (!provider && !osType) {
    showToast(TOAST_TYPES.WARNING, 'Select a provider or enter an OS type to search.');
    return;
  }

  const criteria = {};
  if (osType) criteria.osType = osType;
  if (basicOnly) criteria.includeBasicImageOnly = true;
  if (provider) criteria.providerName = provider;
  if (region) criteria.regionName = region;

  const spinner = document.getElementById('search-image-spinner');
  const btn = document.getElementById('search-image-btn');
  spinner?.classList.remove('d-none');
  if (btn) btn.disabled = true;
  try {
    AppState.lastCriteria = criteria;
    const data = await imageApi().search(SYSTEM_NS, criteria);
    const rawItems = data?.imageList || [];
    const items = rawItems.map((v) => ({ ...v, _provider: getProvider(v), _region: getRegion(v) }));
    AppState.tables.resourceTable?.replaceData(items);
    showToast(TOAST_TYPES.SUCCESS, `Found ${data?.imageCount ?? items.length} images`);
  } catch (err) {
    console.error('Image search failed:', err);
    showToast(TOAST_TYPES.ERROR, 'Image search failed: ' + (err?.response?.data?.message || err.message));
  } finally {
    spinner?.classList.add('d-none');
    if (btn) btn.disabled = false;
  }
}

function updateNamespaceLabel() {
  const label = document.getElementById('serverimages-context-label');
  if (label) label.textContent = `Namespace: ${SYSTEM_NS}`;
}

// ─── Image 목록 ───────────────────────────────────────────────────────────

// 등록/삭제 후 목록 갱신 — 마지막 검색 조건으로 재검색 (검색 전이면 아무것도 안 함)
export async function refreshImageList() {
  if (!AppState.lastCriteria) return;
  try {
    const data = await imageApi().search(SYSTEM_NS, AppState.lastCriteria);
    const rawItems = data?.imageList || [];
    const items = rawItems.map((v) => ({ ...v, _provider: getProvider(v), _region: getRegion(v) }));
    AppState.tables.resourceTable?.replaceData(items);
  } catch (err) {
    if (err?.response?.status !== 404) console.error('Failed to refresh images', err);
  }
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#image-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'Search with connection/OS type to load images.',
    pagination: 'local',
    paginationSize: 10,
    paginationSizeSelector: [10, 20, 50],
    paginationCounter: 'rows',
    movableColumns: true,
    selectableRows: true, // false로 두면 Tabulator 내부 cap-check 버그(isNaN(false)===false)로 다중선택 자체가 깨진다
    initialSort: [{ column: 'name', dir: 'asc' }],
    columns: [
      { formatter: 'rowSelection', titleFormatter: 'rowSelection', headerSort: false, hozAlign: 'center', width: 40 },
      {
        title: 'Image Name',
        field: 'name',
        widthGrow: 2,
        sorter: 'string',
        formatter: (cell) => {
          const d = cell.getData();
          return d.cspImageId || d.name || '-';
        },
      },
      { title: 'Provider', field: '_provider', widthGrow: 1, sorter: 'string' },
      { title: 'Region', field: '_region', widthGrow: 1, sorter: 'string' },
      { title: 'OS Type', field: 'osType', widthGrow: 1, sorter: 'string' },
      { title: 'Architecture', field: 'architecture', hozAlign: 'center', width: 120, sorter: 'string' },
    ],
  });

  AppState.tables.resourceTable.on('rowClick', function (e, row) {
    // selectableRows:true는 row 아무데나 클릭해도 체크박스를 토글하는 내장 동작이 있다.
    // 체크박스 자체를 클릭한 게 아니면 그 토글을 즉시 되돌려, row 클릭은 Detail Panel 오픈 전용으로 만든다.
    const clickedCell = row.getCells().find(c => c.getElement().contains(e.target));
    const isCheckboxCol = clickedCell?.getColumn()?.getDefinition()?.formatter === 'rowSelection';
    if (!isCheckboxCol) {
      row.toggleSelect();
    }

    const d = row.getData();
    AppState.resources.selected = d;
    renderDetail(d);
    showDetail();
  });
}

// ─── Detail Panel ─────────────────────────────────────────────────────────

function renderDetail(data) {
  document.getElementById('detail-name').textContent = data.name || '-';
  document.getElementById('detail-imageName').textContent = data.name || '-';
  document.getElementById('detail-provider').textContent = getProvider(data);
  document.getElementById('detail-region').textContent = getRegion(data);
  document.getElementById('detail-osType').textContent = data.osType || '-';
  document.getElementById('detail-architecture').textContent = data.architecture || '-';
  document.getElementById('detail-cspImageId').textContent = data.cspImageId || '-';
  document.getElementById('detail-ns').textContent = SYSTEM_NS;
}

function showDetail() {
  document.getElementById('view-mode-cards')?.classList.add('show');
}

export function hideDetail() {
  document.getElementById('view-mode-cards')?.classList.remove('show');
  AppState.resources.selected = null;
}

export function confirmBulkDelete() {
  const table = AppState.tables.resourceTable;
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
    `Delete ${selected.length} selected Image(s)?`,
    'pages/settings/environment/cloudresources/serverimages.executeBulkDelete'
  );
}

export async function executeBulkDelete() {
  const items = AppState.resources.bulkSelected || [];
  if (items.length === 0) return;
  const results = await Promise.allSettled(items.map((item) => imageApi().del(SYSTEM_NS, item.name)));
  const failed = results.filter((r) => r.status === 'rejected').length;
  const succeeded = results.length - failed;
  showToast(
    failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
    `${succeeded} Image(s) deleted${failed > 0 ? `, ${failed} failed` : ''}`
  );
  AppState.resources.bulkSelected = [];
  AppState.tables.resourceTable?.deselectRow();
  hideDetail();
  await refreshImageList();
}

// ─── Filter ───────────────────────────────────────────────────────────────

function initFilter() {
  const fieldEl = document.getElementById('filter-field');
  const typeEl = document.getElementById('filter-type');
  const valueEl = document.getElementById('filter-value');
  if (!fieldEl || !typeEl || !valueEl) return;

  function updateFilter() {
    const field = fieldEl.value;
    const type = typeEl.value;
    if (field && AppState.tables.resourceTable) {
      AppState.tables.resourceTable.setFilter(field, type, valueEl.value);
    }
  }

  fieldEl.addEventListener('change', updateFilter);
  typeEl.addEventListener('change', updateFilter);
  valueEl.addEventListener('keyup', updateFilter);

  document.getElementById('filter-clear')?.addEventListener('click', function () {
    fieldEl.value = '';
    typeEl.value = 'like';
    valueEl.value = '';
    AppState.tables.resourceTable?.clearFilter();
  });
}

// ─── Register from CSP ────────────────────────────────────────────────────

document.getElementById('create-image-modal')?.addEventListener('show.bs.modal', function () {
  document.getElementById('modal-imageName').value = '';
  document.getElementById('modal-cspImageName').value = '';
  document.getElementById('modal-connectionName').value = '';
});

export async function openImageSelectPopup() {
  try {
    const resp = await webconsolejs['common/api/http'].commonAPIPost('/api/mc-infra-manager/GetConnConfigList', {});
    const conns = resp?.data?.responseData?.connectionconfig || [];
    const popupConn = document.getElementById('popup-connection');
    popupConn.innerHTML = '<option value="">-- Select Connection --</option>';
    conns.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.configName;
      opt.textContent = c.configName;
      popupConn.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load connections', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to load connection list.');
  }

  AppState.tables.popupTable = null;
  document.getElementById('popup-image-table').innerHTML = '';
  new bootstrap.Modal(document.getElementById('image-select-popup')).show();
}

export async function loadImageList(connectionName) {
  if (!connectionName) return;
  try {
    const data = await imageApi().lookupList(connectionName);
    const items = data?.image || [];
    if (AppState.tables.popupTable) {
      AppState.tables.popupTable.replaceData(items);
    } else {
      AppState.tables.popupTable = new Tabulator('#popup-image-table', {
        data: items,
        layout: 'fitColumns',
        placeholder: 'No images found.',
        pagination: 'local',
        paginationSize: 10,
        columns: [
          { title: 'Name', field: 'IId.NameId', sorter: 'string' },
          { title: 'CspImageId', field: 'IId.SystemId', sorter: 'string' },
          { title: 'OS', field: 'OSDistribution', sorter: 'string' },
        ],
      });
      AppState.tables.popupTable.on('rowClick', function (_e, row) {
        const d = row.getData();
        document.getElementById('modal-imageName').value = d.IId?.NameId || '';
        document.getElementById('modal-cspImageName').value = d.IId?.SystemId || '';
        document.getElementById('modal-connectionName').value = connectionName;
        bootstrap.Modal.getInstance(document.getElementById('image-select-popup'))?.hide();
      });
    }
  } catch (err) {
    console.error('Failed to load image list from CSP', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to load images from CSP.');
  }
}

export async function submitRegisterImage() {
  const imageName = document.getElementById('modal-imageName').value.trim();
  const cspImageName = document.getElementById('modal-cspImageName').value.trim();
  const connectionName = document.getElementById('modal-connectionName').value.trim();

  if (!imageName || !cspImageName) {
    showToast(TOAST_TYPES.WARNING, 'Image Name and CSP Image Name are required.');
    return;
  }

  try {
    await imageApi().register(SYSTEM_NS, { name: imageName, cspImageName, connectionName });
    showToast(TOAST_TYPES.SUCCESS, `Image "${imageName}" registered successfully`);
    bootstrap.Modal.getInstance(document.getElementById('create-image-modal'))?.hide();
    await refreshImageList();
  } catch (err) {
    console.error('Image register failed:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to register image: ' + (err?.response?.data?.message || err.message));
  }
}

document.getElementById('popup-connection')?.addEventListener('change', function () {
  loadImageList(this.value);
});

// ─── webconsolejs 등록 ────────────────────────────────────────────────────
if (typeof webconsolejs === 'undefined') { window.webconsolejs = {}; }
webconsolejs[PAGE_KEY] = {
  refreshImageList,
  searchImages,
  hideDetail,
  confirmBulkDelete,
  executeBulkDelete,
  openImageSelectPopup,
  loadImageList,
  submitRegisterImage,
};
