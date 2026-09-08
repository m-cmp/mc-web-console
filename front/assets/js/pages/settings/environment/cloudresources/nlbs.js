// NLB 관리 페이지 — infra(MCI) 하위 NLB 목록/상세/생성/삭제/헬스체크
// BAR-1573 / Cloud Resources 하위 고정

import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { showToast, TOAST_TYPES } from '../../../../common/utils/toast.js';
import { getProvider, getRegion, populateProviderFilterOptions, populateRegionFilterOptions } from '../../../../common/utils/cspResource.js';

const nlbApi = () => webconsolejs['common/api/services/nlb_api'];
const mciApi = () => webconsolejs['common/api/services/infra_api'];

const AppState = {
  ns: '',
  tables: { nlbTable: null },
  resources: { selected: null, all: [] },
  ui: { viewMode: false },
};

// ─── 페이지 초기화 ────────────────────────────────────────────────────────

$('#select-current-project').on('change', async function () {
  if (this.value === '') return;
  const project = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  AppState.ns = project?.NsId || '';
  hideDetail();
  if (AppState.tables.nlbTable) AppState.tables.nlbTable.replaceData([]);
  if (AppState.ns) await loadNlbInNsList();
});

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <button type="button" class="btn btn-primary"
        onclick="webconsolejs['pages/settings/environment/cloudresources/nlbs'].openCreateNlbModal()">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
          viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
          stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 5l0 14"/><path d="M5 12l14 0"/>
        </svg>
        Create NLB
      </button>`;
  }

  const selectedWorkspaceProject = await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
  webconsolejs['partials/layout/modal'].checkWorkspaceSelection(selectedWorkspaceProject);

  AppState.ns = selectedWorkspaceProject.nsId || '';
  initFilter();
  initTable([]);

  if (selectedWorkspaceProject.projectId !== '') {
    await loadNlbInNsList();
  }
});

// ─── Infra(MCI) 목록 ──────────────────────────────────────────────────────

// cluster별 providerNames/regionNames를 "provider/region" 형태로 묶어 라벨을 만든다.
// (멀티클라우드 infra처럼 cluster가 여러 개면 쉼표로 나열)
function formatInfraLabel(id, infra) {
  const parts = (infra.cluster || [])
    .map((c) => {
      const providers = (c.providerNames || []).join('/');
      const regions = (c.regionNames || []).join('/');
      return providers && regions ? `${providers}/${regions}` : providers || regions;
    })
    .filter(Boolean);
  return parts.length > 0 ? `${id} — ${parts.join(', ')}` : id;
}

async function getInfraList() {
  if (!AppState.ns) return [];
  try {
    const data = await mciApi().getMciList(AppState.ns);
    const infras = data?.infra || (Array.isArray(data) ? data : []);
    return infras
      .map((infra) => {
        const id = infra.id || infra.name;
        if (!id) return null;
        const provider =
          (infra.cluster || []).flatMap((c) => c.providerNames || [])[0] ||
          (infra.node || [])[0]?.connectionConfig?.providerName ||
          '';
        return { id, label: formatInfraLabel(id, infra), provider: String(provider).toLowerCase() };
      })
      .filter(Boolean);
  } catch (err) {
    console.error('Infra 목록 조회 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to load Infra list.');
    return [];
  }
}

// ─── NLB 목록 로드 ────────────────────────────────────────────────────────

// 배포 백엔드(cb-tumblebug NLBInfo)는 Type/Scope/CreatedTime에 json 태그가 없어 대문자 키로 내려오고,
// targetGroup의 노드 그룹 필드는 nodeGroupId(구계약 subGroupId), 노드 목록은 nodes(구계약 vms)다.
// 화면 전역에서 이 편차를 흡수하는 접근자.
const nlbType = (d) => d?.type ?? d?.Type ?? '-';
const nlbScope = (d) => d?.scope ?? d?.Scope ?? '-';
const nodeGroupOf = (d) => d?.targetGroup?.nodeGroupId || d?.targetGroup?.subGroupId || '-';
const assignedNodes = (d) => d?.targetGroup?.nodes || d?.targetGroup?.vms || [];

function _enrichNlbItem(v, infraId) {
  return {
    ...v,
    _infraId: infraId,
    _provider: getProvider(v),
    _region: getRegion(v),
    _type: nlbType(v),
    _scope: nlbScope(v),
  };
}

function _applyNlbItems(items) {
  AppState.resources.all = items;
  populateProviderFilterOptions(items, 'filter-provider');
  populateRegionFilterOptions(items, 'filter-provider', 'filter-region');
  if (AppState.tables.nlbTable) {
    AppState.tables.nlbTable.replaceData(items);
  } else {
    initTable(items);
  }
}

// namespace 전체 NLB를 단일 호출(GetAllNLBInNs, cb-tumblebug#2658)로 조회한다.
// 각 항목이 infraId를 들고 오므로 Infra별 N+1 조회 없이 하나의 테이블에 바로 싣는다.
export async function loadNlbInNsList() {
  if (!AppState.ns) return;
  try {
    const data = await nlbApi().getAllNLBInNs(AppState.ns);
    const rawItems = data?.nlb || (Array.isArray(data) ? data : []);
    const items = rawItems.map((v) => _enrichNlbItem(v, v.infraId || v._infraId || '-'));
    _applyNlbItems(items);
  } catch (err) {
    console.error('NLB 목록(namespace) 조회 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to load NLB list.');
  }
}

// [legacy] Infra별 N+1 집계 방식 — GetAllNLBInNs 미지원 백엔드용 폴백으로 유지(현재 미호출).
// Infra는 NLB 조회 API(nsId+infraId 필요)의 필수 경로 파라미터라 namespace의 전체 Infra
// 목록을 먼저 조회한 뒤, Infra별로 NLB를 조회해 하나의 테이블에 합친다.
export async function loadNlbList() {
  if (!AppState.ns) return;
  const infras = await getInfraList();
  if (infras.length === 0) {
    AppState.resources.all = [];
    if (AppState.tables.nlbTable) AppState.tables.nlbTable.replaceData([]);
    return;
  }
  try {
    const results = await Promise.allSettled(
      infras.map((infra) => nlbApi().getAllNLB(AppState.ns, infra.id))
    );
    const items = [];
    results.forEach((result, idx) => {
      if (result.status !== 'fulfilled') return;
      const rawItems = result.value?.nlb || (Array.isArray(result.value) ? result.value : []);
      for (const v of rawItems) {
        items.push(_enrichNlbItem(v, infras[idx].id));
      }
    });
    _applyNlbItems(items);
  } catch (err) {
    console.error('NLB 목록 조회 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to load NLB list.');
  }
}

function nlbId(data) {
  return data?.id || data?.name;
}

// ─── Tabulator 테이블 ─────────────────────────────────────────────────────

function initTable(items) {
  AppState.tables.nlbTable = new Tabulator('#nlb-list-table', {
    data: items,
    layout: 'fitColumns',
    placeholder: 'No NLBs. Create one to get started.',
    pagination: 'local',
    paginationSize: 10,
    paginationSizeSelector: [10, 20, 50],
    paginationCounter: 'rows',
    movableColumns: true,
    selectableRows: true, // false로 두면 Tabulator 내부 cap-check 버그(isNaN(false)===false)로 다중선택 자체가 깨진다
    initialSort: [{ column: 'id', dir: 'asc' }],
    columns: [
      { formatter: 'rowSelection', titleFormatter: 'rowSelection', headerSort: false, hozAlign: 'center', width: 40 },
      { title: 'Id', field: 'id', widthGrow: 2, sorter: 'string' },
      { title: 'Infra', field: '_infraId', widthGrow: 1, sorter: 'string' },
      { title: 'Provider', field: '_provider', widthGrow: 1, sorter: 'string' },
      { title: 'Region', field: '_region', widthGrow: 1, sorter: 'string' },
      { title: 'Type', field: '_type', width: 100 },
      { title: 'Scope', field: '_scope', width: 100 },
      {
        title: 'Listener',
        field: 'listener',
        widthGrow: 1,
        formatter: (cell) => {
          const l = cell.getValue();
          return l ? `${l.protocol || ''}:${l.port || ''}` : '-';
        },
      },
      {
        title: 'Target NodeGroup',
        field: 'targetGroup',
        widthGrow: 1,
        formatter: (cell) => nodeGroupOf(cell.getRow().getData()),
      },
      {
        title: 'Assigned Nodes',
        field: 'targetGroup',
        width: 130,
        hozAlign: 'center',
        formatter: (cell) => String(assignedNodes(cell.getRow().getData()).length),
        sorter: (a, b, aRow, bRow) => assignedNodes(aRow.getData()).length - assignedNodes(bRow.getData()).length,
      },
      {
        title: 'DNS Name',
        field: 'listener',
        widthGrow: 2,
        formatter: (cell) => {
          const l = cell.getValue();
          return l?.dnsName || l?.ip || '-';
        },
      },
    ],
  });

  AppState.tables.nlbTable.on('rowClick', async function (e, row) {
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
      const detail = await nlbApi().getNLB(AppState.ns, data._infraId, nlbId(data));
      if (detail) {
        AppState.resources.selected = { ...detail, _infraId: data._infraId };
        renderDetail(AppState.resources.selected);
      }
    } catch (err) {
      console.error('NLB 상세 조회 실패:', err);
    }
  });
}

// ─── Detail Panel ─────────────────────────────────────────────────────────

function renderDetail(data) {
  const listener = data.listener || {};
  const target = data.targetGroup || {};
  const hc = data.healthChecker || {};
  document.getElementById('detail-name').textContent = nlbId(data) || '-';
  document.getElementById('detail-nlb-id').textContent = nlbId(data) || '-';
  document.getElementById('detail-nlb-infra').textContent = data._infraId || '-';
  document.getElementById('detail-nlb-provider').textContent = getProvider(data);
  document.getElementById('detail-nlb-region').textContent = getRegion(data);
  document.getElementById('detail-nlb-type').textContent = nlbType(data);
  document.getElementById('detail-nlb-scope').textContent = nlbScope(data);
  document.getElementById('detail-nlb-listener').textContent =
    listener.protocol || listener.port ? `${listener.protocol || ''}:${listener.port || ''}` : '-';
  renderTruncatableCopyable('detail-nlb-endpoint', listener.dnsName || listener.ip || '-');
  document.getElementById('detail-nlb-nodegroup').textContent = nodeGroupOf(data);
  const nodes = assignedNodes(data);
  document.getElementById('detail-nlb-nodes').innerHTML = nodes.length
    ? nodes.map((n) => `<span class="badge bg-blue-lt me-1">${n}</span>`).join('')
    : '-';
  document.getElementById('detail-nlb-target-port').textContent = target.port || '-';
  document.getElementById('detail-nlb-healthchecker').textContent =
    hc.protocol || hc.port
      ? `${hc.protocol || ''}:${hc.port || ''} (interval ${hc.interval || '-'}, timeout ${hc.timeout || '-'}, threshold ${hc.threshold || '-'})`
      : '-';
  renderTruncatableCopyable('detail-nlb-csp-id', data.cspResourceId || '-');
  document.getElementById('detail-nlb-description').textContent = data.description || '-';
  document.getElementById('detail-nlb-health').textContent = '-';
}

// 길어서 "..."으로 잘리는 값(Listener IP/DNS, CSP Resource ID)을
// 말줄임 + hover 시 title 툴팁 + 끝에 복사 아이콘으로 전체 내용을 확인/복사할 수 있게 한다.
// target은 <div id="...">(endpoint)이거나 <code id="...">(csp-id)로 구조가 달라
// target 자신을 flex 컨테이너로 만들어 [텍스트 span, 복사 아이콘]을 그 안에 넣는다.
function renderTruncatableCopyable(targetId, fullText) {
  const target = document.getElementById(targetId);
  if (!target) return;
  // 이전 렌더의 툴팁 인스턴스가 body에 남지 않도록 정리
  if (window.bootstrap?.Tooltip) {
    target.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => bootstrap.Tooltip.getInstance(el)?.dispose());
  }
  target.innerHTML = '';

  if (!fullText || fullText === '-') {
    target.textContent = '-';
    return;
  }

  target.style.display = 'inline-flex';
  target.style.alignItems = 'center';
  target.style.gap = '4px';
  target.style.maxWidth = '100%';

  const span = document.createElement('span');
  span.textContent = fullText;
  span.style.maxWidth = '240px';
  span.style.overflow = 'hidden';
  span.style.textOverflow = 'ellipsis';
  span.style.whiteSpace = 'nowrap';
  span.style.cursor = 'default';
  // 잘린 값은 hover 시 Bootstrap 툴팁으로 전체 텍스트를 즉시 보여준다
  // (브라우저 기본 title 툴팁은 지연·미표시 환경이 있어 대체). 값이 짧아 안 잘리면 툴팁 불필요.
  span.setAttribute('data-bs-toggle', 'tooltip');
  span.setAttribute('data-bs-placement', 'top');
  span.setAttribute('title', fullText);
  if (window.bootstrap?.Tooltip) {
    new bootstrap.Tooltip(span, { container: 'body', trigger: 'hover focus', customClass: 'nlb-full-text-tooltip' });
  }

  const copyBtn = document.createElement('a');
  copyBtn.href = '#';
  copyBtn.className = 'copy-icon-btn flex-shrink-0';
  copyBtn.title = 'Copy to clipboard';
  copyBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-sm" width="16" height="16" viewBox="0 0 24 24" ' +
    'stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<path stroke="none" d="M0 0h24v24H0z" fill="none"/>' +
    '<path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z"/>' +
    '<path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"/>' +
    '</svg>';
  copyBtn.addEventListener('click', function (e) {
    e.preventDefault();
    navigator.clipboard
      .writeText(fullText)
      .then(() => showToast(TOAST_TYPES.SUCCESS, 'Copied to clipboard'))
      .catch(() => showToast(TOAST_TYPES.ERROR, 'Failed to copy'));
  });

  target.appendChild(span);
  target.appendChild(copyBtn);
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

// ─── Health Check (목록에서 선택 기반) ─────────────────────────────────────
// 체크 결과는 toast로 표시하면 놓치기 쉬워, 확인 후 닫아야 하는 modal로 표시한다.

export async function checkSelectedNlbHealth() {
  const table = AppState.tables.nlbTable;
  const selected = table ? table.getSelectedData() : [];
  if (selected.length === 0) {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Nothing Selected',
      'Please select at least one item to check health.'
    );
    return;
  }

  const results = await Promise.allSettled(
    selected.map((item) => nlbApi().getNLBHealth(AppState.ns, item._infraId, nlbId(item)))
  );

  const lines = selected.map((item, idx) => {
    const id = nlbId(item);
    const result = results[idx];
    if (result.status !== 'fulfilled') {
      const line = `${id}: check failed (${result.reason?.message || 'error'})`;
      _applyHealthToDetailIfShown(item, line);
      return line;
    }
    const line = `${id}: ${formatHealthSummary(result.value)}`;
    _applyHealthToDetailIfShown(item, formatHealthSummary(result.value));
    return line;
  });

  webconsolejs['partials/layout/modal'].commonShowDefaultModal('NLB Health Check', lines.join('\n'));
}

// GetNLBHealth 실제 응답은 { AllNodes, HealthyNodes, UnHealthyNodes } (PascalCase, healthz 래핑 없음).
function formatHealthSummary(hz) {
  const data = hz || {};
  const all = data.AllNodes || [];
  const healthy = data.HealthyNodes || [];
  const unhealthy = data.UnHealthyNodes || [];
  return `healthy ${healthy.length} / unhealthy ${unhealthy.length} / total ${all.length}`;
}

// 체크한 NLB가 현재 Detail 패널에 열려있는 것과 같으면 Health Status도 갱신한다.
function _applyHealthToDetailIfShown(item, text) {
  const shown = AppState.resources.selected;
  if (shown && shown._infraId === item._infraId && nlbId(shown) === nlbId(item)) {
    document.getElementById('detail-nlb-health').textContent = text;
  }
}

// ─── 다중선택 삭제 ───────────────────────────────────────────────────────

export function confirmBulkDelete() {
  const table = AppState.tables.nlbTable;
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
    `Delete ${selected.length} selected NLB(s)?`,
    'pages/settings/environment/cloudresources/nlbs.executeBulkDelete'
  );
}

export async function executeBulkDelete() {
  const items = AppState.resources.bulkSelected || [];
  if (items.length === 0) return;
  const results = await Promise.allSettled(
    items.map((item) => nlbApi().delNLB(AppState.ns, item._infraId, nlbId(item)))
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  const succeeded = results.length - failed;
  showToast(
    failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
    `${succeeded} NLB(s) deleted${failed > 0 ? `, ${failed} failed` : ''}`
  );
  AppState.resources.bulkSelected = [];
  AppState.tables.nlbTable?.deselectRow();
  hideDetail();
  await loadNlbInNsList();
}

// ─── Edit (노드 Assign/UnAssign) ─────────────────────────────────────────
// tumblebug에 NLB update API가 없어(RestPutNLB 미구현) Listener/HealthChecker는 생성 후 변경 불가.
// 콘솔의 "Edit"는 타겟 노드 추가(AddNLBNodes)/해제(RemoveNLBNodes)만을 의미한다.
// Infra Info NLB 탭(partials/operation/manage/mcinlb.js)의 Assign/UnAssign 로직을 이 화면 컨텍스트
// (AppState.ns + 선택 행의 _infraId)에 맞춰 단일 Edit 모달로 구성.

// 편집 대상 스냅샷 { id, infraId, assigned:[nodeId] } — 모달 오픈~저장 사이에만 유효
let _editTarget = null;

export async function triggerEditSelected() {
  const table = AppState.tables.nlbTable;
  const selected = table ? table.getSelectedData() : [];
  if (selected.length !== 1) {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Validation',
      selected.length === 0 ? 'Please select an NLB to edit.' : 'Please select only one NLB to edit.'
    );
    return;
  }
  const row = selected[0];
  _editTarget = { id: nlbId(row), infraId: row._infraId, assigned: assignedNodes(row) };
  document.getElementById('nlb-edit-nlb-name').textContent = _editTarget.id;
  document.getElementById('nlb-edit-assigned-list').innerHTML = '<div class="text-secondary">Loading...</div>';
  document.getElementById('nlb-edit-candidate-list').innerHTML = '<div class="text-secondary">Loading...</div>';
  document.getElementById('nlb-edit-node-status').textContent = '';
  new bootstrap.Modal(document.getElementById('nlb-edit-modal')).show();
  await _loadEditNodes();
}

async function _loadEditNodes() {
  if (!_editTarget) return;
  const { id, infraId } = _editTarget;

  // 목록 캐시가 오래됐을 수 있어 상세를 새로 조회해 할당 노드를 확정한다.
  try {
    const detail = await nlbApi().getNLB(AppState.ns, infraId, id);
    if (detail) _editTarget.assigned = assignedNodes(detail);
  } catch (err) {
    console.error('NLB 상세 조회 실패:', err);
  }
  const statusByGroup = await getNodeStatusesByGroup(AppState.ns, infraId);
  _renderEditLists(statusByGroup);
}

// 좌: 할당된 노드(체크=해제 대상) / 우: 미할당 노드(체크=추가 대상, 비Running은 비활성).
// 백엔드 Add는 중복 검증 없이 append하므로 기할당 노드 제외는 프론트가 책임진다.
function _renderEditLists(statusByGroup) {
  const assignedEl = document.getElementById('nlb-edit-assigned-list');
  const candidateEl = document.getElementById('nlb-edit-candidate-list');
  const statusEl = document.getElementById('nlb-edit-node-status');
  const assigned = new Set(_editTarget?.assigned || []);

  assignedEl.innerHTML = assigned.size
    ? Array.from(assigned)
        .map(
          (n) => `
        <label class="form-check mb-1">
          <input class="form-check-input nlb-edit-unassign-check" type="checkbox" value="${n}">
          <span class="form-check-label">${n}</span>
        </label>`
        )
        .join('')
    : '<div class="text-secondary">No nodes are assigned to this NLB.</div>';

  const candidates = [];
  for (const [groupId, nodes] of Object.entries(statusByGroup || {})) {
    for (const n of nodes) {
      if (assigned.has(n.id)) continue;
      candidates.push({ ...n, groupId });
    }
  }
  if (candidates.length === 0) {
    candidateEl.innerHTML = '<div class="text-secondary">No assignable nodes. All nodes of this Infra are already assigned.</div>';
    statusEl.textContent = '';
    return;
  }
  candidateEl.innerHTML = candidates
    .map((n) => {
      const running = n.status === 'Running';
      return `
        <label class="form-check mb-1">
          <input class="form-check-input nlb-edit-assign-check" type="checkbox" value="${n.id}" ${running ? '' : 'disabled'}>
          <span class="form-check-label">${n.id} <span class="text-secondary">(${n.groupId})</span>
            <span class="badge ${running ? 'bg-success' : 'bg-warning'} ms-1">${n.status || 'Unknown'}</span></span>
        </label>`;
    })
    .join('');
  const notRunning = candidates.filter((n) => n.status !== 'Running').length;
  statusEl.textContent = notRunning > 0 ? `${notRunning} node(s) not in Running state cannot be assigned.` : '';
}

export async function executeEditNlbNodes() {
  if (!_editTarget) return;
  const { id, infraId } = _editTarget;
  const toAdd = Array.from(document.querySelectorAll('.nlb-edit-assign-check:checked')).map((el) => el.value);
  const toRemove = Array.from(document.querySelectorAll('.nlb-edit-unassign-check:checked')).map((el) => el.value);
  if (toAdd.length === 0 && toRemove.length === 0) {
    showToast(TOAST_TYPES.WARNING, 'Select nodes to assign or unassign.');
    return;
  }

  const spinner = document.getElementById('nlb-edit-spinner');
  const btn = document.getElementById('nlb-edit-execute-btn');
  spinner.classList.remove('d-none');
  btn.disabled = true;

  // CSP 측 동시 변경 오류를 피하려고 add → remove 순차 호출. 하나가 실패해도 다른 하나는 시도한다.
  const failures = [];
  let added = 0;
  let removed = 0;
  if (toAdd.length > 0) {
    try {
      await nlbApi().addNLBNodes(AppState.ns, infraId, id, toAdd);
      added = toAdd.length;
    } catch (err) {
      console.error('NLB 노드 Assign 실패:', err);
      failures.push(`assign: ${_errMsg(err)}`);
    }
  }
  if (toRemove.length > 0) {
    try {
      await nlbApi().removeNLBNodes(AppState.ns, infraId, id, toRemove);
      removed = toRemove.length;
    } catch (err) {
      console.error('NLB 노드 UnAssign 실패:', err);
      failures.push(`unassign: ${_errMsg(err)}`);
    }
  }

  spinner.classList.add('d-none');
  btn.disabled = false;

  if (failures.length === 0) {
    showToast(TOAST_TYPES.SUCCESS, `Assigned ${added}, unassigned ${removed} node(s) for "${id}"`);
    bootstrap.Modal.getInstance(document.getElementById('nlb-edit-modal'))?.hide();
  } else {
    showToast(
      added + removed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.ERROR,
      `Edit NLB "${id}" — ${failures.join('; ')}`
    );
    if (added + removed > 0) bootstrap.Modal.getInstance(document.getElementById('nlb-edit-modal'))?.hide();
  }
  AppState.tables.nlbTable?.deselectRow();
  await _reloadAndRefreshDetail(id);
}

function _errMsg(err) {
  return err?.response?.data?.responseData?.message || err?.response?.data?.message || err?.message || 'unknown error';
}

// 편집 후 목록 재조회 + 열려 있는 Detail이 대상 NLB면 갱신
async function _reloadAndRefreshDetail(targetId) {
  await loadNlbInNsList();
  const shown = AppState.resources.selected;
  if (shown && nlbId(shown) === targetId) {
    const fresh = AppState.resources.all.find((it) => nlbId(it) === targetId && it._infraId === shown._infraId);
    if (fresh) {
      AppState.resources.selected = fresh;
      renderDetail(fresh);
    }
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
    if (!AppState.tables.nlbTable) return;
    const filters = [];
    if (providerEl?.value) filters.push({ field: '_provider', type: '=', value: providerEl.value });
    if (regionEl?.value) filters.push({ field: '_region', type: '=', value: regionEl.value });
    if (fieldEl.value) filters.push({ field: fieldEl.value, type: typeEl.value, value: valueEl.value });
    if (filters.length > 0) {
      AppState.tables.nlbTable.setFilter(filters);
    } else {
      AppState.tables.nlbTable.clearFilter();
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
    if (AppState.tables.nlbTable) AppState.tables.nlbTable.clearFilter();
  });
}

// ─── Create NLB 모달 ──────────────────────────────────────────────────────

export async function openCreateNlbModal() {
  if (!AppState.ns) {
    showToast(TOAST_TYPES.WARNING, 'Please select a project first.');
    return;
  }
  document.getElementById('create-nlb-listener-port').value = '80';
  document.getElementById('create-nlb-target-port').value = '80';
  document.getElementById('create-nlb-protocol').value = 'TCP';
  document.getElementById('create-nlb-description').value = '';
  _resetHealthCheckerInputs();
  await _loadCreateInfraOptions();
  new bootstrap.Modal(document.getElementById('create-nlb-modal')).show();
}

async function _loadCreateInfraOptions() {
  const select = document.getElementById('create-nlb-infra');
  select.innerHTML = '<option value="">Select</option>';
  const infras = await getInfraList();
  for (const infra of infras) {
    const opt = document.createElement('option');
    opt.value = infra.id;
    opt.textContent = infra.label;
    select.appendChild(opt);
  }
  _createInfraCache = infras;
  if (infras.length === 1) select.value = infras[0].id;
  await Promise.all([_loadNodeGroupOptions(select.value), _applyHealthCheckerSupport(select.value)]);
}

document.getElementById('create-nlb-infra')?.addEventListener('change', function () {
  _loadNodeGroupOptions(this.value);
  _applyHealthCheckerSupport(this.value);
});

// ─── Create NLB — HealthChecker 입력 (CSP별 커스텀 지원 여부는 GetNLBSupport로 결정) ──
// tumblebug NLBHealthCheckerReq는 interval/timeout/threshold(int)만 받고 0이면 백엔드 기본값을 쓴다.
// CSP에 따라 커스텀 값을 무시/거부하는 필드가 있어(예: AWS TCP NLB는 timeout 커스텀 불가)
// GetNLBSupport 응답으로 해당 필드를 비활성화한다. 지원 정보 조회 실패는 생성 자체를 막지 않는다.

const HC_FIELDS = [
  { key: 'Interval', id: 'create-nlb-hc-interval', label: 'Interval' },
  { key: 'Timeout', id: 'create-nlb-hc-timeout', label: 'Timeout' },
  { key: 'Threshold', id: 'create-nlb-hc-threshold', label: 'Threshold' },
];

// Create 모달용 Infra 목록 캐시 [{ id, label, provider }] — provider→GetNLBSupport 매칭에 사용
let _createInfraCache = [];
// GetNLBSupport 응답의 supports 맵 캐시 (페이지 수명 동안 1회 조회)
let _nlbSupportCache = null;

async function _getNlbSupport() {
  if (_nlbSupportCache) return _nlbSupportCache;
  try {
    const data = await nlbApi().getNLBSupport();
    _nlbSupportCache = data?.supports || {};
  } catch (err) {
    console.warn('GetNLBSupport 조회 실패 — health checker 필드 전체 활성 유지:', err);
    _nlbSupportCache = {};
  }
  return _nlbSupportCache;
}

function _resetHealthCheckerInputs() {
  for (const f of HC_FIELDS) {
    const el = document.getElementById(f.id);
    if (!el) continue;
    el.value = '0';
    el.disabled = false;
    el.title = '';
  }
  const note = document.getElementById('create-nlb-hc-support-note');
  if (note) note.textContent = '';
}

async function _applyHealthCheckerSupport(infraId) {
  const note = document.getElementById('create-nlb-hc-support-note');
  const provider = (_createInfraCache.find((i) => i.id === infraId)?.provider || '').toLowerCase();
  if (!provider) {
    _resetHealthCheckerInputs();
    return;
  }
  const supports = await _getNlbSupport();
  const sup = supports[provider];
  const unsupported = [];
  for (const f of HC_FIELDS) {
    const el = document.getElementById(f.id);
    if (!el) continue;
    const ok = sup ? sup[`customHealthChecker${f.key}`] !== false : true;
    el.disabled = !ok;
    if (!ok) {
      el.value = '0';
      el.title = `${f.label} is not configurable on ${provider.toUpperCase()}`;
      unsupported.push(f.label);
    } else {
      el.title = '';
    }
  }
  if (note) {
    note.textContent = unsupported.length
      ? `${unsupported.join(', ')} ${unsupported.length > 1 ? 'are' : 'is'} not configurable on ${provider.toUpperCase()} (provider default is used).`
      : '';
  }
}

// 입력값을 non-negative int로 읽는다. disabled 필드는 항상 0(=default). 잘못된 값이면 null.
function _readHealthCheckerInputs() {
  const out = {};
  for (const f of HC_FIELDS) {
    const el = document.getElementById(f.id);
    if (!el || el.disabled) {
      out[f.key.toLowerCase()] = 0;
      continue;
    }
    const raw = String(el.value ?? '').trim();
    const n = raw === '' ? 0 : Number(raw);
    if (!Number.isInteger(n) || n < 0) return null;
    out[f.key.toLowerCase()] = n;
  }
  return out;
}

document.getElementById('create-nlb-nodegroup')?.addEventListener('change', _updateNodeGroupStatus);

// nodeGroupId -> [{ id, status }] — NLB 생성 전 대상 노드가 실제로 Running인지 확인하기 위한 캐시.
// AWS 드라이버 등은 Running이 아닌 인스턴스를 NLB 타겟으로 등록하려 하면
// "InvalidTarget: ... not in a running state"로 거부한다. 이를 API 호출 전에 미리 걸러낸다.
let _nodeStatusByGroup = {};

async function getNodeStatusesByGroup(ns, infraId) {
  try {
    const resp = await webconsolejs['common/api/http'].commonAPIPost('/api/mc-infra-manager/GetInfra', {
      pathParams: { nsId: ns, infraId },
    });
    const nodes = resp?.data?.responseData?.node || [];
    const map = {};
    for (const n of nodes) {
      if (!n.nodeGroupId) continue;
      if (!map[n.nodeGroupId]) map[n.nodeGroupId] = [];
      map[n.nodeGroupId].push({ id: n.id, status: n.status });
    }
    return map;
  } catch (err) {
    console.error('Infra 노드 상태 조회 실패:', err);
    return {};
  }
}

function _updateNodeGroupStatus() {
  const nodeGroupId = document.getElementById('create-nlb-nodegroup').value;
  const statusEl = document.getElementById('create-nlb-nodegroup-status');
  const btn = document.getElementById('create-nlb-execute-btn');
  const nodes = nodeGroupId ? _nodeStatusByGroup[nodeGroupId] || [] : [];

  if (nodes.length === 0) {
    statusEl.textContent = '';
    statusEl.className = 'form-text';
    if (btn) btn.disabled = false;
    return;
  }

  const notRunning = nodes.filter((n) => n.status !== 'Running');
  if (notRunning.length === 0) {
    statusEl.textContent = `Node status: Running (${nodes.length}/${nodes.length})`;
    statusEl.className = 'form-text text-success';
    if (btn) btn.disabled = false;
  } else {
    statusEl.textContent =
      `Node status: ${notRunning.map((n) => `${n.id}=${n.status}`).join(', ')} — ` +
      'all nodes must be Running to create an NLB.';
    statusEl.className = 'form-text text-danger';
    if (btn) btn.disabled = true;
  }
}

async function _loadNodeGroupOptions(infraId) {
  const select = document.getElementById('create-nlb-nodegroup');
  select.innerHTML = '<option value="">Select</option>';
  _nodeStatusByGroup = {};
  _updateNodeGroupStatus();
  if (!infraId) return;
  try {
    const data = await nlbApi().getInfraNodeGroupIds(AppState.ns, infraId);
    const ids = data?.output || data?.subGroup || (Array.isArray(data) ? data : []);
    for (const id of ids) {
      const opt = document.createElement('option');
      opt.value = typeof id === 'string' ? id : id?.id;
      opt.textContent = opt.value;
      select.appendChild(opt);
    }
  } catch (err) {
    console.error('NodeGroup 목록 조회 실패:', err);
  }
  _nodeStatusByGroup = await getNodeStatusesByGroup(AppState.ns, infraId);
  _updateNodeGroupStatus();
}

export async function executeCreateNlb() {
  const infraId = document.getElementById('create-nlb-infra').value;
  const subGroupId = document.getElementById('create-nlb-nodegroup').value;
  const listenerPort = document.getElementById('create-nlb-listener-port').value.trim();
  const targetPort = document.getElementById('create-nlb-target-port').value.trim();
  const protocol = document.getElementById('create-nlb-protocol').value;
  const description = document.getElementById('create-nlb-description').value.trim();

  if (!infraId || !subGroupId || !listenerPort || !targetPort) {
    showToast(TOAST_TYPES.WARNING, 'Infra, Target NodeGroup, listener port, and target port are required.');
    return;
  }

  // 버튼 disabled 우회(폼 submit 등) 대비 이중 체크 — Running이 아닌 노드가 있으면
  // CSP 드라이버가 InvalidTarget으로 거부하므로 API 호출 전에 막는다.
  const notRunning = (_nodeStatusByGroup[subGroupId] || []).filter((n) => n.status !== 'Running');
  if (notRunning.length > 0) {
    showToast(
      TOAST_TYPES.WARNING,
      `Target NodeGroup has node(s) not in Running state (${notRunning.map((n) => `${n.id}=${n.status}`).join(', ')}). Start them before creating an NLB.`
    );
    return;
  }

  const healthChecker = _readHealthCheckerInputs();
  if (!healthChecker) {
    showToast(TOAST_TYPES.WARNING, 'Health checker values must be non-negative integers (0 = provider default).');
    return;
  }

  const spinner = document.getElementById('create-nlb-spinner');
  const btn = document.getElementById('create-nlb-execute-btn');
  spinner.classList.remove('d-none');
  btn.disabled = true;

  const body = {
    type: 'PUBLIC',
    scope: 'REGION',
    listener: { protocol, port: String(listenerPort) },
    // tumblebug model.NLBTargetGroupReq의 실제 필드명은 nodeGroupId다.
    // subGroupId로 보내면 빈 문자열로 취급되어 500(CheckString - empty string)이 난다.
    targetGroup: { protocol, port: String(targetPort), nodeGroupId: subGroupId },
    // model.NLBHealthCheckerReq는 interval/timeout/threshold만 받는 int 필드이며,
    // 0을 보내면 tumblebug가 자체 기본값을 적용한다("0 = use default").
    // CSP가 커스텀을 지원하지 않는 필드는 GetNLBSupport 기준으로 비활성화돼 0으로 전송된다.
    healthChecker,
  };
  if (description) body.description = description;

  try {
    await nlbApi().postNLB(AppState.ns, infraId, body);
    showToast(TOAST_TYPES.SUCCESS, `NLB for "${subGroupId}" created successfully`);
    bootstrap.Modal.getInstance(document.getElementById('create-nlb-modal'))?.hide();
    await loadNlbInNsList();
  } catch (err) {
    console.error('NLB 생성 실패:', err);
    showToast(TOAST_TYPES.ERROR, 'Failed to create NLB: ' + (err.message || ''));
  } finally {
    spinner.classList.add('d-none');
    btn.disabled = false;
  }
}

// ─── webconsolejs 등록 ────────────────────────────────────────────────────
if (typeof webconsolejs === 'undefined') { window.webconsolejs = {}; }
webconsolejs['pages/settings/environment/cloudresources/nlbs'] = {
  loadNlbInNsList,
  loadNlbList,
  hideDetail,
  checkSelectedNlbHealth,
  confirmBulkDelete,
  executeBulkDelete,
  triggerEditSelected,
  executeEditNlbNodes,
  openCreateNlbModal,
  executeCreateNlb,
};
