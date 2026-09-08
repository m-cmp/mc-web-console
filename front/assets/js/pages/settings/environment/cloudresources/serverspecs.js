// Server Spec 관리 — system namespace 고정 (프로젝트 NsId 사용 금지)
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { showToast, TOAST_TYPES } from '../../../../common/utils/toast.js';
import { getProvider, getRegion } from '../../../../common/utils/cspResource.js';

const SYSTEM_NS = 'system';
const PAGE_KEY = 'pages/settings/environment/cloudresources/serverspecs';
const specApi = () => webconsolejs['common/api/services/serverspec_api'];

const AppState = {
  tables: { resourceTable: null, popupTable: null },
  resources: { selected: null },
  popupConnections: [],
};

// ─── 페이지 초기화 ────────────────────────────────────────────────────────
// Spec은 system 네임스페이스 고정 리소스라 project(=namespace) 선택과 무관하다.

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#create-spec-modal">
        Register Spec
      </button>`;
  }

  const selectedWorkspaceProject = await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
  webconsolejs['partials/layout/modal'].checkWorkspaceSelection(selectedWorkspaceProject);

  updateNamespaceLabel();
  initFilter();
  await refreshSpecList();
});

function updateNamespaceLabel() {
  const label = document.getElementById('serverspecs-context-label');
  if (label) label.textContent = `Namespace: ${SYSTEM_NS}`;
}

// ─── Spec 목록 ────────────────────────────────────────────────────────────

export async function refreshSpecList() {
  try {
    const data = await specApi().list(SYSTEM_NS);
    const rawItems = data?.spec || [];
    const items = rawItems.map((v) => ({ ...v, _provider: getProvider(v), _region: getRegion(v) }));
    if (AppState.tables.resourceTable) {
      AppState.tables.resourceTable.replaceData(items);
    } else {
      initTable(items);
    }
  } catch (err) {
    if (err?.response?.status !== 404) console.error('Failed to load specs', err);
    const items = [];
    if (AppState.tables.resourceTable) {
      AppState.tables.resourceTable.replaceData(items);
    } else {
      initTable(items);
    }
  }
}

function initTable(data) {
  AppState.tables.resourceTable = new Tabulator('#spec-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'No specs found.',
    pagination: 'local',
    paginationSize: 10,
    paginationSizeSelector: [10, 20, 50],
    paginationCounter: 'rows',
    movableColumns: true,
    selectableRows: true, // false로 두면 Tabulator 내부 cap-check 버그(isNaN(false)===false)로 다중선택 자체가 깨진다
    initialSort: [{ column: 'cspSpecName', dir: 'asc' }],
    columns: [
      { formatter: 'rowSelection', titleFormatter: 'rowSelection', headerSort: false, hozAlign: 'center', width: 40 },
      { title: 'CSP Spec Name', field: 'cspSpecName', widthGrow: 2, sorter: 'string' },
      { title: 'Provider', field: '_provider', widthGrow: 1, sorter: 'string' },
      { title: 'Region', field: '_region', widthGrow: 1, sorter: 'string' },
      { title: 'vCPU', field: 'vCPU', hozAlign: 'center', width: 80, sorter: 'number' },
      { title: 'Memory (GiB)', field: 'memoryGiB', hozAlign: 'center', width: 120, sorter: 'number' },
      { title: 'GPU', field: 'acceleratorCount', hozAlign: 'center', width: 80, sorter: 'number' },
      { title: 'Disk', field: 'rootDiskSize', hozAlign: 'center', width: 90, sorter: 'number' },
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
  document.getElementById('detail-specName').textContent = data.name || '-';
  document.getElementById('detail-provider').textContent = getProvider(data);
  document.getElementById('detail-region').textContent = getRegion(data);
  document.getElementById('detail-vcpu').textContent = data.vCPU ?? '-';
  document.getElementById('detail-memory').textContent = data.memoryGiB ?? '-';
  document.getElementById('detail-gpu').textContent = data.acceleratorCount ?? '-';
  document.getElementById('detail-disk').textContent = data.rootDiskSize ?? '-';
  document.getElementById('detail-cspSpecName').textContent = data.cspSpecName || '-';
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
    `Delete ${selected.length} selected Spec(s)?`,
    'pages/settings/environment/cloudresources/serverspecs.executeBulkDelete'
  );
}

export async function executeBulkDelete() {
  const items = AppState.resources.bulkSelected || [];
  if (items.length === 0) return;
  const results = await Promise.allSettled(items.map((item) => specApi().del(SYSTEM_NS, item.name)));
  const failed = results.filter((r) => r.status === 'rejected').length;
  const succeeded = results.length - failed;
  showToast(
    failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
    `${succeeded} Spec(s) deleted${failed > 0 ? `, ${failed} failed` : ''}`
  );
  AppState.resources.bulkSelected = [];
  AppState.tables.resourceTable?.deselectRow();
  hideDetail();
  await refreshSpecList();
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

document.getElementById('create-spec-modal')?.addEventListener('show.bs.modal', function () {
  document.getElementById('modal-specName').value = '';
  document.getElementById('modal-cspSpecName').value = '';
  document.getElementById('modal-connectionName').value = '';
});

// 연결이 8개 CSP에 걸쳐 177개까지 늘어나 provider로 먼저 좁힌다.
function renderPopupConnections(providerName) {
  const popupConn = document.getElementById('popup-connection');
  popupConn.disabled = !providerName;
  if (!providerName) {
    popupConn.innerHTML = '<option value="">Select a provider first</option>';
    return;
  }
  popupConn.innerHTML = '<option value="">-- Select Connection --</option>';
  AppState.popupConnections
    .filter(c => c.providerName === providerName)
    .forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.configName;
      opt.textContent = c.configName;
      popupConn.appendChild(opt);
    });
}

export async function openSpecSelectPopup() {
  try {
    const resp = await webconsolejs['common/api/http'].commonAPIPost('/api/mc-infra-manager/GetConnConfigList', {});
    AppState.popupConnections = resp?.data?.responseData?.connectionconfig || [];

    const popupProvider = document.getElementById('popup-provider');
    popupProvider.innerHTML = '<option value="">-- Select Provider --</option>';
    [...new Set(AppState.popupConnections.map(c => c.providerName))].sort().forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      popupProvider.appendChild(opt);
    });
    popupProvider.value = '';
    renderPopupConnections('');
  } catch (err) {
    console.error('Failed to load connections', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to load connection list.');
  }

  AppState.tables.popupTable = null;
  document.getElementById('popup-spec-table').innerHTML = '';
  new bootstrap.Modal(document.getElementById('spec-select-popup')).show();
}

export async function loadSpecList(connectionName) {
  if (!connectionName) return;
  try {
    const data = await specApi().lookupList(connectionName);
    const items = data?.vmspec || [];
    if (AppState.tables.popupTable) {
      AppState.tables.popupTable.replaceData(items);
    } else {
      AppState.tables.popupTable = new Tabulator('#popup-spec-table', {
        data: items,
        layout: 'fitColumns',
        placeholder: 'No specs found.',
        pagination: 'local',
        paginationSize: 10,
        columns: [
          { title: 'Name', field: 'Name', sorter: 'string' },
          { title: 'vCPU', field: 'VCpu.Count', hozAlign: 'center', sorter: 'number' },
          {
            title: 'Memory (GiB)',
            field: 'MemSizeMiB',
            hozAlign: 'center',
            sorter: 'number',
            // cb-spider는 MiB로 반환한다. 같은 화면 위쪽 표(memoryGiB)가 0.5 같은 소수를
            // 그대로 보여주므로 반올림하지 않고 소수 둘째 자리까지만 정리한다.
            formatter(cell) {
              const mib = Number(cell.getValue());
              return Number.isFinite(mib) && mib > 0 ? Math.round((mib / 1024) * 100) / 100 : '-';
            },
          },
        ],
      });
      AppState.tables.popupTable.on('rowClick', function (_e, row) {
        const d = row.getData();
        document.getElementById('modal-specName').value = d.Name || '';
        document.getElementById('modal-cspSpecName').value = d.Name || '';
        document.getElementById('modal-connectionName').value = connectionName;
        bootstrap.Modal.getInstance(document.getElementById('spec-select-popup'))?.hide();
      });
    }
  } catch (err) {
    console.error('Failed to load spec list from CSP', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to load specs from CSP.');
  }
}

export async function submitRegisterSpec() {
  const specName = document.getElementById('modal-specName').value.trim();
  const cspSpecName = document.getElementById('modal-cspSpecName').value.trim();
  const connectionName = document.getElementById('modal-connectionName').value.trim();

  if (!specName || !cspSpecName) {
    showToast(TOAST_TYPES.WARNING, 'Spec Name and CSP Spec Name are required.');
    return;
  }

  try {
    await specApi().register(SYSTEM_NS, { name: specName, cspSpecName, connectionName });
    showToast(TOAST_TYPES.SUCCESS, `Spec "${specName}" registered successfully`);
    bootstrap.Modal.getInstance(document.getElementById('create-spec-modal'))?.hide();
    await refreshSpecList();
  } catch (err) {
    console.error('Spec register failed:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to register spec: ' + (err?.response?.data?.message || err.message));
  }
}

document.getElementById('popup-provider')?.addEventListener('change', function () {
  renderPopupConnections(this.value);
  AppState.tables.popupTable = null;
  document.getElementById('popup-spec-table').innerHTML = '';
});

document.getElementById('popup-connection')?.addEventListener('change', function () {
  loadSpecList(this.value);
});

// ─── webconsolejs 등록 ────────────────────────────────────────────────────
if (typeof webconsolejs === 'undefined') { window.webconsolejs = {}; }
webconsolejs[PAGE_KEY] = {
  refreshSpecList,
  hideDetail,
  confirmBulkDelete,
  executeBulkDelete,
  openSpecSelectPopup,
  loadSpecList,
  submitRegisterSpec,
};
