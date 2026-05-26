// FR-CLOUD-ADMIN-006-08 — Setup Status section renderer
//
// cloudoverview 페이지의 #setup-status-section 안 5개 카드를 렌더링하고
// Refresh All / Re-sync 액션 버튼 이벤트를 바인딩한다.
//
// 데이터 출처: webconsolejs["common/api/services/setup_status_api"]
// 외부 호출: webconsolejs["pages/settings/environment/cloudsps/setup_status_section"].init()

// ─── 모듈 접근 헬퍼 (UMD 빌드 — ES import 불가) ───────────────────

function api() {
  return webconsolejs['common/api/services/setup_status_api'];
}

// ─── 진행 Status (race condition 방지) ──────────────────────────────

const State = {
  inFlightFull: false,
  inFlightAction: false,
  lastViewModel: null,
  // 카드별 in-flight 카운트 (5개 카드 모두 끝나면 액션 버튼 enable)
  cardInFlight: 0,
};

// ─── Public ───────────────────────────────────────────────────────

/** 페이지 init에서 1회 호출 */
export async function init() {
  bindEvents();
  await refresh();
}

/**
 * 카드별 독립 호출 + 즉시 loading skeleton 렌더 후 도착하는 카드부터 그려준다.
 *
 * 기존 fetchAllStatus(11개 allSettled)는 가장 느린 호출(특히 mc-infra-manager
 * ListImage가 수십~수백 초 걸리는 환경에서) 때문에 5개 카드 전체가 동시에
 * 막히는 문제가 있어 카드별 fetch로 분리한다.
 */
export async function refresh() {
  if (State.inFlightFull) return;
  State.inFlightFull = true;
  setActionsDisabled(true);
  clearSectionError();

  // 1) lastViewModel 초기화 + 5개 카드를 즉시 loading skeleton으로 렌더
  if (!State.lastViewModel) State.lastViewModel = emptyViewModel();
  renderAllLoading();

  // 2) 카드별 독립 fetch (병렬, fire-and-forget). 카드별 완료 시 부분 머지 + 재렌더.
  const tasks = [
    runCardFetch('setupSequence', () => api().fetchSetupSequenceOnly(), (partial) => {
      State.lastViewModel = mergeSetupSequence(State.lastViewModel, partial);
      renderSetupSequence(State.lastViewModel.setupSequence);
    }),
    runCardFetch('roles', () => api().fetchRolesOnly(), (partial) => {
      State.lastViewModel = mergeRoles(State.lastViewModel, partial);
      renderRolesCard(State.lastViewModel.roles);
    }),
    runCardFetch('menu', () => api().fetchMenuOnly(), (partial) => {
      State.lastViewModel = mergeMenu(State.lastViewModel, partial);
      renderMenuCard(State.lastViewModel.menu);
    }),
    runCardFetch('api', () => api().fetchApiOnly(), (partial) => {
      State.lastViewModel = mergeApi(State.lastViewModel, partial);
      renderApiCard(State.lastViewModel.api);
    }),
    runCardFetch('projects', () => api().fetchProjectsOnly(), (partial) => {
      State.lastViewModel = mergeProjectsCard(State.lastViewModel, partial);
      renderProjectsCard(State.lastViewModel.projects);
    }),
    runCardFetch('wsMapping', () => api().fetchWorkspaceMappingOnly(), (partial) => {
      State.lastViewModel = mergeWsMapping(State.lastViewModel, partial);
      renderWorkspaceMappingCard(State.lastViewModel.wsMapping);
    }),
    runCardFetch('credentials', () => api().fetchCredentialsOnly(), (partial) => {
      State.lastViewModel = mergeCredentials(State.lastViewModel, partial);
      renderCredentialsCard(State.lastViewModel.credentials);
    }),
    runCardFetch('loadAssets', () => api().fetchLoadAssetsOnly(), (partial) => {
      State.lastViewModel = mergeLoadAssets(State.lastViewModel, partial);
      renderLoadAssetsCard(State.lastViewModel.loadAssets);
    }),
  ];

  // 3) 모든 카드가 settle되면 inFlight 해제 (사용자는 카드별 결과를 점진적으로 보게 됨)
  Promise.allSettled(tasks).finally(() => {
    State.inFlightFull = false;
    setActionsDisabled(false);
  });
}

// 카드 1개의 fetch 라이프사이클 (실패해도 다른 카드에 영향 없음)
async function runCardFetch(label, fetchFn, applyFn) {
  State.cardInFlight += 1;
  try {
    const partial = await fetchFn();
    applyFn(partial);
  } catch (e) {
    console.error(`[setup-status] card ${label} fetch failed:`, e);
    renderCardError(label, e && e.message ? e.message : String(e));
  } finally {
    State.cardInFlight -= 1;
  }
}

// 빈 ViewModel — refresh 직후 머지 베이스로 사용
function emptyViewModel() {
  return {
    setupSequence: {},
    roles: { registered: [], missing: [], extra: [], expected: [] },
    menu: {},
    api: {},
    projects: { count: 0, items: [] },
    wsMapping: {
      workspaces: [], totalProjectCount: 0,
      mappedProjectIds: [], unmappedProjects: [],
    },
    credentials: { holders: [], holderCount: 0, byProvider: {}, inactiveConnectionCount: 0, fetched: false },
    loadAssets: {
      systemNs: 'system',
      specCount: 0, imageCount: 0,
      pricedSpecCount: 0, unpricedSpecCount: 0,
      providers: [],
      status: 'UNKNOWN',
      fetched: false,
    },
    workspace: { count: 0 },
  };
}

// 8개 카드 영역에 카드별 구조 skeleton + 헤더 spinner 렌더
// 카드 본체(타이틀/메트릭 라벨/표 헤더)는 즉시 보여주고, 값 자리에는
// Bootstrap5 placeholder bar + 헤더 우측에 'Fetching…' 소형 spinner를 둔다.
// 데이터 도착 시 render*Card()가 el.innerHTML 통째 교체로 자연스럽게 사라진다.
function renderAllLoading() {
  renderSequenceSkeleton();
  renderRolesSkeleton();
  renderMenuSkeleton();
  renderApiSkeleton();
  renderProjectsSkeleton();
  renderWorkspaceMappingSkeleton();
  renderCredentialsSkeleton();
  renderLoadAssetsSkeleton();
}

// 카드 헤더 우측 소형 spinner ('Fetching…') — 모든 skeleton 공통
function fetchingSpinnerHTML() {
  return `<span class="text-muted small ms-auto d-inline-flex align-items-center">
    <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
    Fetching…
  </span>`;
}

// placeholder bar — col-* 만 다르게
function placeholderBar(colCls = 'col-6') {
  return `<span class="placeholder ${colCls}"></span>`;
}

// 메트릭(라벨 + placeholder) 칸 1개
function skeletonMetric(label, mdCols = 3, barCol = 'col-6') {
  return `<div class="col-md-${mdCols}">
    <div class="text-muted small">${escapeHtml(label)}</div>
    <div class="fs-3 fw-medium placeholder-glow">${placeholderBar(barCol)}</div>
  </div>`;
}

// ── ① Setup Sequence skeleton ─────────────────────────────────────
function renderSequenceSkeleton() {
  const el = document.getElementById('setup-sequence-card');
  if (!el) return;
  const rows = Object.keys(STEP_LABELS).map((key) => `<tr>
    <td class="fw-medium">${STEP_LABELS[key]}</td>
    <td class="placeholder-glow">${placeholderBar('col-8')}</td>
    <td class="placeholder-glow">${placeholderBar('col-10')}</td>
  </tr>`).join('');
  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">Setup Sequence (1_setup_auto.sh)</h4>
      <div class="card-subtitle text-muted small ms-3">See each step card below for details</div>
      ${fetchingSpinnerHTML()}
    </div>
    <div class="table-responsive">
      <table class="table table-sm table-vcenter card-table mb-0">
        <thead><tr>
          <th style="width:260px">Step</th>
          <th style="width:120px">Status</th>
          <th>Detail</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

// ── ② Roles skeleton ──────────────────────────────────────────────
function renderRolesSkeleton() {
  const el = document.getElementById('setup-roles-card');
  if (!el) return;
  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">Roles <span class="text-muted small ms-2">(② init_predefined_roles)</span></h4>
      ${fetchingSpinnerHTML()}
    </div>
    <div class="card-body">
      <div class="row g-2">
        ${skeletonMetric('Registered roles', 3, 'col-4')}
        ${skeletonMetric('Expected roles', 3, 'col-4')}
        <div class="col-md-6">
          <div class="text-muted small">Expected vs Registered</div>
          <div class="placeholder-glow">
            <span class="placeholder col-2 me-2"></span>
            <span class="placeholder col-2 me-2"></span>
            <span class="placeholder col-2 me-2"></span>
            <span class="placeholder col-2"></span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ── ③ Menu skeleton ───────────────────────────────────────────────
function renderMenuSkeleton() {
  const el = document.getElementById('setup-menu-card');
  if (!el) return;
  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">Menu Settings</h4>
      ${fetchingSpinnerHTML()}
    </div>
    <div class="card-body">
      <div class="row g-2">
        ${skeletonMetric('Registered menus', 3, 'col-4')}
        ${skeletonMetric('Source yaml reachable', 3, 'col-6')}
        ${skeletonMetric('Last-Modified / ETag', 6, 'col-10')}
        <div class="col-12">
          <div class="text-muted small">URL</div>
          <div class="small placeholder-glow">${placeholderBar('col-12')}</div>
        </div>
      </div>
    </div>
  </div>`;
}

// ── ④ API skeleton ────────────────────────────────────────────────
function renderApiSkeleton() {
  const el = document.getElementById('setup-api-card');
  if (!el) return;
  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">API Settings</h4>
      ${fetchingSpinnerHTML()}
    </div>
    <div class="card-body">
      <div class="row g-2">
        ${skeletonMetric('Registered APIs', 3, 'col-4')}
        ${skeletonMetric('Services (BaseURL)', 3, 'col-4')}
        ${skeletonMetric('Source yaml reachable', 3, 'col-6')}
        ${skeletonMetric('Last-Modified', 3, 'col-8')}
        <div class="col-12">
          <div class="text-muted small">URL</div>
          <div class="small placeholder-glow">${placeholderBar('col-12')}</div>
        </div>
        <div class="col-12 mt-2">
          <div class="text-muted small mb-1">Registered service BaseURL list</div>
          <div class="table-responsive">
            <table class="table table-sm table-vcenter mb-0">
              <thead><tr><th>Service</th><th>BaseURL</th><th style="width:120px">Version</th></tr></thead>
              <tbody>
                <tr class="placeholder-glow">
                  <td>${placeholderBar('col-6')}</td><td>${placeholderBar('col-10')}</td><td>${placeholderBar('col-4')}</td>
                </tr>
                <tr class="placeholder-glow">
                  <td>${placeholderBar('col-6')}</td><td>${placeholderBar('col-10')}</td><td>${placeholderBar('col-4')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ── ⑤ Projects skeleton ───────────────────────────────────────────
function renderProjectsSkeleton() {
  const el = document.getElementById('setup-projects-card');
  if (!el) return;
  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">Projects <span class="text-muted small ms-2">(⑤ sync_projects)</span></h4>
      ${fetchingSpinnerHTML()}
    </div>
    <div class="card-body">
      <div class="row g-2">
        ${skeletonMetric('Registered projects', 3, 'col-4')}
        <div class="col-md-9">
          <div class="text-muted small">Description</div>
          <div class="small">1:1 mapping to mc-infra-manager namespace. Empty NsId means the ns is not registered in mc-infra-manager or sync is missing.</div>
        </div>
      </div>
      <div class="table-responsive mt-2">
        <table class="table table-sm table-vcenter mb-0">
          <thead><tr>
            <th style="width:80px">ID</th><th>Name</th>
            <th style="width:160px">NsId</th><th>Description</th>
          </tr></thead>
          <tbody>
            <tr class="placeholder-glow">
              <td>${placeholderBar('col-4')}</td><td>${placeholderBar('col-6')}</td>
              <td>${placeholderBar('col-6')}</td><td>${placeholderBar('col-10')}</td>
            </tr>
            <tr class="placeholder-glow">
              <td>${placeholderBar('col-4')}</td><td>${placeholderBar('col-6')}</td>
              <td>${placeholderBar('col-6')}</td><td>${placeholderBar('col-10')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ── ⑥ Workspace Mapping skeleton ─────────────────────────────────
function renderWorkspaceMappingSkeleton() {
  const el = document.getElementById('setup-wsmapping-card');
  if (!el) return;
  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">Workspace Mapping <span class="text-muted small ms-2">(⑥ map_workspace_projects)</span></h4>
      ${fetchingSpinnerHTML()}
    </div>
    <div class="card-body">
      <div class="row g-2">
        ${skeletonMetric('Workspaces', 3, 'col-4')}
        ${skeletonMetric('Mapped projects', 3, 'col-6')}
        ${skeletonMetric('Unmapped projects', 3, 'col-4')}
        ${skeletonMetric('Status', 3, 'col-6')}
      </div>
      <div class="table-responsive mt-2">
        <table class="table table-sm table-vcenter mb-0">
          <thead><tr>
            <th style="width:80px">ID</th><th>Name</th>
            <th style="width:120px" class="text-end">Mapped projects</th><th>Description</th>
          </tr></thead>
          <tbody>
            <tr class="placeholder-glow">
              <td>${placeholderBar('col-4')}</td><td>${placeholderBar('col-6')}</td>
              <td class="text-end">${placeholderBar('col-4')}</td><td>${placeholderBar('col-10')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ── ⑦ Credentials skeleton ────────────────────────────────────────
function renderCredentialsSkeleton() {
  const el = document.getElementById('setup-credentials-card');
  if (!el) return;
  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">Credentials
        <span class="text-muted small ms-2">(GetCredentialHolderList @ cb-tumblebug)</span>
      </h4>
      ${fetchingSpinnerHTML()}
    </div>
    <div class="card-body">
      <div class="row g-2">
        ${skeletonMetric('Holders', 3, 'col-4')}
        ${skeletonMetric('Verified Connection', 3, 'col-6')}
        <div class="col-md-6">
          <div class="text-muted small">Holders by Provider</div>
          <div class="placeholder-glow">
            <span class="placeholder col-2 me-2"></span>
            <span class="placeholder col-2 me-2"></span>
            <span class="placeholder col-2"></span>
          </div>
        </div>
      </div>
      <div class="table-responsive mt-2">
        <table class="table table-sm table-vcenter mb-0">
          <thead><tr>
            <th>Holder</th><th>Providers</th>
            <th style="width:140px" class="text-end">Verified / Total</th>
            <th style="width:80px" class="text-end">Verify%</th>
          </tr></thead>
          <tbody>
            <tr class="placeholder-glow">
              <td>${placeholderBar('col-6')}</td><td>${placeholderBar('col-8')}</td>
              <td class="text-end">${placeholderBar('col-6')}</td>
              <td class="text-end">${placeholderBar('col-4')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ── ⑧ loadAssets skeleton ─────────────────────────────────────────
function renderLoadAssetsSkeleton() {
  const el = document.getElementById('setup-loadassets-card');
  if (!el) return;
  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">loadAssets
        <span class="text-muted small ms-2">(GetAssetsSummary @ ns: system)</span>
      </h4>
      ${fetchingSpinnerHTML()}
    </div>
    <div class="card-body">
      <div class="row g-2">
        ${skeletonMetric('Spec loaded', 3, 'col-4')}
        ${skeletonMetric('Image loaded', 3, 'col-4')}
        ${skeletonMetric('Priced / Unpriced', 3, 'col-8')}
        ${skeletonMetric('Status', 3, 'col-6')}
      </div>
      <div class="table-responsive mt-2">
        <table class="table table-sm table-vcenter mb-0">
          <thead><tr>
            <th>Provider</th>
            <th class="text-end" style="width:100px">Spec</th>
            <th class="text-end" style="width:100px">Priced</th>
            <th class="text-end" style="width:100px">Unpriced</th>
            <th class="text-end" style="width:80px">Priced%</th>
            <th class="text-end" style="width:100px">Image</th>
          </tr></thead>
          <tbody>
            <tr class="placeholder-glow">
              <td>${placeholderBar('col-6')}</td>
              <td class="text-end">${placeholderBar('col-4')}</td>
              <td class="text-end">${placeholderBar('col-4')}</td>
              <td class="text-end">${placeholderBar('col-4')}</td>
              <td class="text-end">${placeholderBar('col-4')}</td>
              <td class="text-end">${placeholderBar('col-4')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// fallback (혹시 카드 ID가 추가되어도 generic spinner 로 대응 가능하도록 보존)
function renderLoadingSkeleton(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = `<div class="card border">
    <div class="card-body py-3 d-flex align-items-center text-muted small">
      <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
      <span>Loading…</span>
    </div>
  </div>`;
}

// 카드 단위 에러 표시 (해당 카드 자리에 작은 alert)
function renderCardError(label, message) {
  const idMap = {
    setupSequence: 'setup-sequence-card',
    roles:         'setup-roles-card',
    menu:          'setup-menu-card',
    api:           'setup-api-card',
    projects:      'setup-projects-card',
    wsMapping:     'setup-wsmapping-card',
    credentials:   'setup-credentials-card',
    loadAssets:    'setup-loadassets-card',
  };
  const el = document.getElementById(idMap[label]);
  if (!el) return;
  el.innerHTML = `<div class="card border border-danger">
    <div class="card-body py-3 small">
      <strong class="text-danger">${escapeHtml(label)} card load failed:</strong>
      ${escapeHtml(message)}
    </div>
  </div>`;
}

// ─── 이벤트 바인딩 ────────────────────────────────────────────────

// 초기 1회 바인딩 — 정적 element만 (refresh 버튼).
// Re-sync 버튼들은 각 카드 렌더 시 자체 재바인딩.
function bindEvents() {
  bindClick('setup-refresh-all-btn', () => refresh());
}

function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', (e) => {
    e.preventDefault();
    handler();
  });
}

// 단일 액션 실행 + 부분 갱신 (실패해도 직전 view는 유지)
async function runAction(label, actionFn, partialRefreshFn) {
  if (State.inFlightAction) return;
  State.inFlightAction = true;
  setActionsDisabled(true);
  try {
    const resp = await actionFn();
    const status = resp && resp.status;
    if (typeof status === 'number' && status >= 400) {
      const msg = (resp.data && resp.data.status && resp.data.status.message)
                || (resp.data && resp.data.message)
                || `${label} re-sync failed (HTTP ${status})`;
      renderActionError(label, msg);
    } else {
      await partialRefreshFn();
    }
  } catch (e) {
    console.error(`[setup-status] action ${label} failed:`, e);
    renderActionError(label, e && e.message ? e.message : String(e));
  } finally {
    State.inFlightAction = false;
    setActionsDisabled(false);
  }
}

// ─── 부분 ViewModel 머지 ──────────────────────────────────────────

function mergeMenu(prev, partial) {
  const next = { ...prev };
  // setupSequence.initMenu 갱신
  const menuCount = countFromList(partial.menus);
  next.setupSequence = {
    ...prev.setupSequence,
    initMenu: { status: deriveStatusFromCount(menuCount, partial.menus), count: menuCount },
  };
  const menuYaml = parseYaml(partial.menuYaml);
  next.menu = {
    ...prev.menu,
    registeredCount: menuCount,
    sourceUrl: menuYaml.url,
    sourceUrlReachable: menuYaml.reachable,
    sourceHttpStatus: menuYaml.httpStatus,
    sourceLastModified: menuYaml.lastModified,
    sourceETag: menuYaml.etag,
    sourceErrorMessage: menuYaml.errorMessage,
  };
  return next;
}

function mergeApi(prev, partial) {
  const next = { ...prev };
  const apiCount = countFromMcmpApis(partial.mcmpApis);
  next.setupSequence = {
    ...prev.setupSequence,
    initApiResources: { status: deriveStatusFromCount(apiCount, partial.mcmpApis), count: apiCount },
  };
  const services = unwrapServicesMap(partial.mcmpApis);
  const apiYaml = parseYaml(partial.apiYaml);
  next.api = {
    ...prev.api,
    registeredCount: apiCount,
    services,
    servicesCount: Object.keys(services).length,
    sourceUrl: apiYaml.url,
    sourceUrlReachable: apiYaml.reachable,
    sourceHttpStatus: apiYaml.httpStatus,
    sourceLastModified: apiYaml.lastModified,
    sourceETag: apiYaml.etag,
    sourceErrorMessage: apiYaml.errorMessage,
  };
  return next;
}

// Roles 카드 머지 — Getrolelist 응답 + PREDEFINED_ROLE_EXPECTED diff
// 기준: role.name (대소문자 무시), role_types 정보가 있으면 같이 보존.
function mergeRoles(prev, partial) {
  const next = { ...prev };
  const apiSvc = api();
  const expected = (apiSvc && apiSvc.PREDEFINED_ROLE_EXPECTED) || [];
  const list = unwrapArray(partial.roles);
  const registered = list.map((r) => ({
    name: String(r.name ?? r.Name ?? '').trim(),
    description: r.description ?? r.Description ?? '',
    roleTypes: Array.isArray(r.role_types) ? r.role_types
              : Array.isArray(r.roleTypes)  ? r.roleTypes
              : [],
  })).filter((r) => r.name);

  const registeredNames = new Set(registered.map((r) => r.name.toLowerCase()));
  const expectedNames   = new Set(expected.map((s) => String(s).toLowerCase()));

  const missing = expected.filter((e) => !registeredNames.has(String(e).toLowerCase()));
  const extra   = registered
    .map((r) => r.name)
    .filter((n) => !expectedNames.has(n.toLowerCase()));

  next.roles = {
    expected,
    registered,
    missing,
    extra,
    fetched: isFulfilledOk(partial.roles),
  };

  // setupSequence.initPredefinedRoles 동기 갱신
  next.setupSequence = {
    ...prev.setupSequence,
    initPredefinedRoles: {
      status: !isFulfilledOk(partial.roles)
        ? 'UNKNOWN'
        : (missing.length === 0 && registered.length > 0 ? 'OK'
            : registered.length > 0 ? 'WARN' : 'FAIL'),
      count: registered.length,
    },
  };
  return next;
}

// Projects 카드 머지 — listProjects 응답 + setupSequence.syncProjects + mapWorkspaceProjects 동기 갱신
function mergeProjectsCard(prev, partial) {
  const next = { ...prev };
  const list = unwrapArray(partial.projects);
  const items = list.map((p) => ({
    id: p.id ?? p.ID ?? '',
    name: p.name ?? p.Name ?? '',
    // mc-iam-manager model.Project의 JSON 태그가 `nsid` (소문자/단일어)이므로 우선 그것부터 본다.
    // 다른 표기(NsId/nsId/ns_id)는 다른 컴포넌트에서 올 가능성에 대비한 fallback.
    nsId: p.nsid ?? p.NsId ?? p.nsId ?? p.ns_id ?? '',
    description: p.description ?? p.Description ?? '',
  }));
  next.projects = {
    count: items.length,
    items,
    fetched: isFulfilledOk(partial.projects),
  };

  const projectCount = items.length;
  const wsProjCount  = countFromList(partial.wsProjects);
  next.setupSequence = {
    ...prev.setupSequence,
    syncProjects: {
      status: deriveStatusFromCount(projectCount, partial.projects),
      count: projectCount,
    },
    mapWorkspaceProjects: {
      status: !isFulfilledOk(partial.wsProjects)
        ? 'UNKNOWN'
        : (projectCount === 0 ? 'OK' : (wsProjCount >= projectCount ? 'OK' : 'WARN')),
      count: wsProjCount,
      expected: projectCount,
    },
  };
  return next;
}

// Workspace Mapping 카드 머지 — listWorkspaces + listProjects + listWorkspaceProjects 종합
// listWorkspaceProjects 응답 형태가 환경마다 달라 두 가지 fallback 지원:
//   (a) 평탄: [{ workspace_id, project_id }, ...]
//   (b) 그룹: [{ workspaceId, projects:[{id,name}] }, ...]
function mergeWsMapping(prev, partial) {
  const next = { ...prev };
  const wsList   = unwrapArray(partial.workspaces);
  const projList = unwrapArray(partial.projects);
  const wsProjs  = unwrapArray(partial.wsProjects);

  // workspaceId → Set<projectId> 빌드
  const wsToProj = new Map();
  const allMappedProjectIds = new Set();
  for (const row of wsProjs) {
    if (!row) continue;
    // listWorkspaceProjects 응답은 [{id, name, projects:[...]}, ...] 형태로
    // workspace 자체의 `id`가 곧 workspaceId. 그 외 평탄/래핑 형태도 커버.
    const wid = String(
      row.id ?? row.ID ??
      row.workspace_id ?? row.workspaceId ?? row.WorkspaceID ?? row.WorkspaceId ?? ''
    );
    if (!wid) continue;
    if (!wsToProj.has(wid)) wsToProj.set(wid, new Set());
    const bucket = wsToProj.get(wid);
    if (Array.isArray(row.projects)) {
      // (b) 그룹 형태
      for (const p of row.projects) {
        const pid = String(p && (p.id ?? p.ID ?? p.project_id ?? p.projectId ?? '') || '');
        if (pid) { bucket.add(pid); allMappedProjectIds.add(pid); }
      }
    } else {
      // (a) 평탄 형태
      const pid = String(row.project_id ?? row.projectId ?? row.ProjectID ?? row.ProjectId ?? '');
      if (pid) { bucket.add(pid); allMappedProjectIds.add(pid); }
    }
  }

  const workspaces = wsList.map((w) => {
    const wid = String(w.id ?? w.ID ?? '');
    return {
      id: wid,
      name: w.name ?? w.Name ?? '',
      description: w.description ?? w.Description ?? '',
      projectCount: wsToProj.get(wid) ? wsToProj.get(wid).size : 0,
    };
  });

  const unmappedProjects = projList
    .filter((p) => !allMappedProjectIds.has(String(p.id ?? p.ID ?? '')))
    .map((p) => ({
      id: p.id ?? p.ID ?? '',
      name: p.name ?? p.Name ?? '',
      // model.Project JSON 태그 = `nsid`. 위 mergeProjectsCard 주석 참고.
      nsId: p.nsid ?? p.NsId ?? p.nsId ?? p.ns_id ?? '',
    }));

  next.wsMapping = {
    workspaces,
    totalProjectCount: projList.length,
    mappedProjectIds: Array.from(allMappedProjectIds),
    unmappedProjects,
    fetched: isFulfilledOk(partial.wsProjects) && isFulfilledOk(partial.workspaces),
  };

  // setupSequence.mapWorkspaceProjects 동기 갱신 (fetchProjectsOnly와 동시 도착 시 보정)
  const projectCount = projList.length;
  const wsProjCount  = allMappedProjectIds.size;
  next.setupSequence = {
    ...prev.setupSequence,
    mapWorkspaceProjects: {
      status: !isFulfilledOk(partial.wsProjects)
        ? 'UNKNOWN'
        : (projectCount === 0 ? 'OK' : (wsProjCount >= projectCount ? 'OK' : 'WARN')),
      count: wsProjCount,
      expected: projectCount,
    },
  };
  return next;
}

/**
 * Setup Sequence 카드용 5개 호출 결과 → 7단계 status 합성.
 * (initPlatformAdmin은 화면 도달 자체가 OK)
 */
function mergeSetupSequence(prev, partial) {
  const next = { ...prev };
  const rolesCount   = countFromList(partial.roles);
  const menuCount    = countFromList(partial.menus);
  const apiCount     = countFromMcmpApis(partial.mcmpApis);
  const projectCount = countFromList(partial.projects);
  const wsProjCount  = countFromList(partial.wsProjects);

  next.setupSequence = {
    initPlatformAdmin:    { status: 'OK' },
    initPredefinedRoles:  { status: deriveStatusFromCount(rolesCount, partial.roles), count: rolesCount },
    initMenu:             { status: deriveStatusFromCount(menuCount, partial.menus), count: menuCount },
    initApiResources:     { status: deriveStatusFromCount(apiCount, partial.mcmpApis), count: apiCount },
    syncProjects:         { status: deriveStatusFromCount(projectCount, partial.projects), count: projectCount },
    mapWorkspaceProjects: {
      status: !isFulfilledOk(partial.wsProjects)
        ? 'UNKNOWN'
        : (projectCount === 0 ? 'OK' : (wsProjCount >= projectCount ? 'OK' : 'WARN')),
      count: wsProjCount,
      expected: projectCount,
    },
  };
  return next;
}

// Credentials 카드 머지 — cb-tumblebug GetCredentialHolderList 응답 기반.
// holder 목록을 그대로 보존하고, provider 분포는 카드 chips용으로 보조 집계.
function mergeCredentials(prev, partial) {
  const next = { ...prev };
  const fetched = isFulfilledOk(partial.holders);
  const data    = fetched ? extractResponseData(partial.holders.value) : null;
  const rawList = (data && (data.credentialHolderList || data.CredentialHolderList)) || [];
  const holders = (Array.isArray(rawList) ? rawList : []).map((h) => ({
    credentialHolder: h.credentialHolder || h.CredentialHolder || '',
    providers: Array.isArray(h.providers) ? h.providers : [],
    connectionCount: Number(h.connectionCount || 0),
    verifiedConnectionCount: Number(h.verifiedConnectionCount || 0),
    isDefault: !!h.isDefault,
  }));

  const byProvider = {};
  let inactiveConnectionCount = 0;
  for (const h of holders) {
    inactiveConnectionCount += Math.max(0, h.connectionCount - h.verifiedConnectionCount);
    for (const p of h.providers) {
      const key = String(p).toLowerCase();
      if (!byProvider[key]) byProvider[key] = { holderCount: 0 };
      byProvider[key].holderCount += 1;
    }
  }

  next.credentials = {
    fetched,
    holders,
    holderCount: holders.length,
    byProvider,
    inactiveConnectionCount,
  };
  return next;
}

// loadAssets 카드 머지 — cb-tumblebug GetAssetsSummary 응답(AssetsSummaryResponse) 기반.
function mergeLoadAssets(prev, partial) {
  const next = { ...prev };
  const fetched = isFulfilledOk(partial.summary);
  const data    = fetched ? extractResponseData(partial.summary.value) : null;

  const summary = {
    namespaceId: (data && (data.namespaceId || data.NamespaceID)) || prev.loadAssets.systemNs,
    totalSpecCount: Number((data && data.totalSpecCount) || 0),
    pricedSpecCount: Number((data && data.pricedSpecCount) || 0),
    unpricedSpecCount: Number((data && data.unpricedSpecCount) || 0),
    totalImageCount: Number((data && data.totalImageCount) || 0),
    providers: (data && Array.isArray(data.providers)) ? data.providers : [],
  };

  let status = 'UNKNOWN';
  if (fetched) {
    if (summary.totalSpecCount > 0 && summary.totalImageCount > 0) status = 'OK';
    else if (summary.totalSpecCount === 0 && summary.totalImageCount === 0) status = 'NOT-EXECUTED';
    else status = 'PARTIAL';
  }

  next.loadAssets = {
    fetched,
    systemNs: summary.namespaceId,
    specCount: summary.totalSpecCount,
    imageCount: summary.totalImageCount,
    pricedSpecCount: summary.pricedSpecCount,
    unpricedSpecCount: summary.unpricedSpecCount,
    providers: summary.providers,
    status,
  };
  return next;
}

// ─── 섹션 레벨 에러 배너 ──────────────────────────────────────────

// 카드 단위 에러는 renderCardError가 처리하고, renderSectionError는
// 향후 "전체 refresh 자체가 실패" 같은 상위 레벨 오류용으로만 남겨둔다.
function renderSectionError(message) {
  const banner = document.getElementById('setup-status-error');
  if (!banner) return;
  banner.classList.remove('d-none');
  banner.innerHTML = `<div class="alert alert-warning mb-2">
    <strong>Setup Status refresh failed:</strong> ${escapeHtml(message)}
    <button class="btn btn-sm btn-outline-warning ms-2" onclick="webconsolejs['pages/settings/environment/cloudsps/setup_status_section'].refresh()">
      Retry
    </button>
  </div>`;
}

function clearSectionError() {
  const banner = document.getElementById('setup-status-error');
  if (banner) {
    banner.classList.add('d-none');
    banner.innerHTML = '';
  }
}

function renderActionError(label, message) {
  const banner = document.getElementById('setup-status-error');
  if (!banner) return;
  banner.classList.remove('d-none');
  banner.innerHTML = `<div class="alert alert-danger mb-2">
    <strong>${escapeHtml(label)} re-sync failed:</strong> ${escapeHtml(message)}
  </div>`;
}

// ─── 카드 1: Setup Sequence (1_setup_auto.sh 7단계) ─────────────────

const STEP_LABELS = {
  initPlatformAdmin:    '① init_platform_admin',
  initPredefinedRoles:  '② init_predefined_roles',
  initMenu:             '③ init_menu',
  initApiResources:     '④ init_api_resources',
  syncProjects:         '⑤ sync_projects',
  mapWorkspaceProjects: '⑥ map_workspace_projects',
};

function renderSetupSequence(seq) {
  const el = document.getElementById('setup-sequence-card');
  if (!el || !seq) return;

  const rows = Object.keys(STEP_LABELS).map((key) => {
    const step = seq[key] || {};
    const badge = statusBadge(step.status);
    const detail = formatStepDetail(key, step);
    return `<tr>
      <td class="fw-medium">${STEP_LABELS[key]}</td>
      <td>${badge}</td>
      <td class="text-muted small">${escapeHtml(detail)}</td>
    </tr>`;
  }).join('');

  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">Setup Sequence (1_setup_auto.sh)</h4>
      <div class="card-subtitle text-muted small ms-3">
        See each step card below for details
      </div>
    </div>
    <div class="table-responsive">
      <table class="table table-sm table-vcenter card-table mb-0">
        <thead>
          <tr>
            <th style="width:260px">Step</th>
            <th style="width:120px">Status</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
  // Re-sync 버튼은 각 카드(Roles/Menu/API/Projects/Workspace Mapping/loadAssets)로 일원화 — 여기에는 두지 않음.
}

function formatStepDetail(key, step) {
  if (step.status === 'UNKNOWN') return 'Missing response or insufficient permissions';
  if (typeof step.count === 'number') {
    if (key === 'mapWorkspaceProjects' && typeof step.expected === 'number') {
      return `${step.count} / ${step.expected} mapped`;
    }
    return `${step.count}  items`;
  }
  return '';
}

// ─── 카드 2: Menu Settings ────────────────────────────────────────

function renderMenuCard(menu) {
  const el = document.getElementById('setup-menu-card');
  if (!el || !menu) return;

  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">Menu Settings</h4>
      <div class="ms-auto">
        <button id="setup-resync-menu-btn" class="btn btn-sm btn-outline-primary">
          Re-sync ▶ Menu
        </button>
      </div>
    </div>
    <div class="card-body">
      <div class="row g-2">
        <div class="col-md-3"><div class="text-muted small">Registered menus</div>
          <div class="fs-3 fw-medium">${menu.registeredCount ?? '-'}</div></div>
        <div class="col-md-3"><div class="text-muted small">Source yaml reachable</div>
          <div>${reachableBadge(menu.sourceUrlReachable, menu.sourceHttpStatus, menu.sourceErrorMessage)}</div></div>
        <div class="col-md-6"><div class="text-muted small">Last-Modified / ETag</div>
          <div class="small">${formatYamlMeta(menu)}</div></div>
        <div class="col-12"><div class="text-muted small">URL</div>
          <div class="small text-break">${menu.sourceUrl ? escapeHtml(menu.sourceUrl) : '<span class="text-muted">env not configured</span>'}</div></div>
      </div>
    </div>
  </div>`;
  // Re-sync 버튼은 매 렌더마다 새로 그려지므로 이벤트 재바인딩
  bindClick('setup-resync-menu-btn', () => runAction('menu', api().resyncMenu, async () => {
    const partial = await api().fetchMenuOnly();
    if (!State.lastViewModel) return refresh();
    const merged = mergeMenu(State.lastViewModel, partial);
    State.lastViewModel = merged;
    renderSetupSequence(merged.setupSequence);
    renderMenuCard(merged.menu);
  }));
}

// ─── 카드 3: API Settings ─────────────────────────────────────────

function renderApiCard(apiVm) {
  const el = document.getElementById('setup-api-card');
  if (!el || !apiVm) return;

  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">API Settings</h4>
      <div class="ms-auto">
        <button id="setup-resync-api-btn" class="btn btn-sm btn-outline-primary">
          Re-sync ▶ API
        </button>
      </div>
    </div>
    <div class="card-body">
      <div class="row g-2">
        <div class="col-md-3"><div class="text-muted small">Registered APIs</div>
          <div class="fs-3 fw-medium">${apiVm.registeredCount ?? '-'}</div></div>
        <div class="col-md-3"><div class="text-muted small">Services (BaseURL)</div>
          <div class="fs-3 fw-medium">${apiVm.servicesCount ?? '-'}</div></div>
        <div class="col-md-3"><div class="text-muted small">Source yaml reachable</div>
          <div>${reachableBadge(apiVm.sourceUrlReachable, apiVm.sourceHttpStatus, apiVm.sourceErrorMessage)}</div></div>
        <div class="col-md-3"><div class="text-muted small">Last-Modified</div>
          <div class="small">${formatYamlMeta(apiVm)}</div></div>
        <div class="col-12"><div class="text-muted small">URL</div>
          <div class="small text-break">${apiVm.sourceUrl ? escapeHtml(apiVm.sourceUrl) : '<span class="text-muted">env not configured</span>'}</div></div>
        ${renderServicesTable(apiVm.services)}
      </div>
    </div>
  </div>`;
  bindClick('setup-resync-api-btn', () => runAction('api', api().resyncMcmpApis, async () => {
    const partial = await api().fetchApiOnly();
    if (!State.lastViewModel) return refresh();
    const merged = mergeApi(State.lastViewModel, partial);
    State.lastViewModel = merged;
    renderSetupSequence(merged.setupSequence);
    renderApiCard(merged.api);
  }));
}

function renderServicesTable(services) {
  const names = Object.keys(services || {}).sort();
  if (names.length === 0) return '';
  const rows = names.map((name) => {
    const svc = services[name] || {};
    const baseUrl = svc.BaseURL || svc.baseUrl || '-';
    const version = svc.Version || svc.version || '-';
    return `<tr>
      <td class="fw-medium">${escapeHtml(name)}</td>
      <td class="small text-break">${escapeHtml(baseUrl)}</td>
      <td class="text-muted small">${escapeHtml(version)}</td>
    </tr>`;
  }).join('');
  return `<div class="col-12 mt-2">
    <details>
      <summary class="text-muted small mb-1" style="cursor:pointer">
        Registered service BaseURL list (${names.length} items)
      </summary>
      <div class="table-responsive mt-2">
        <table class="table table-sm table-vcenter mb-0">
          <thead><tr><th>Service</th><th>BaseURL</th><th style="width:120px">Version</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </details>
  </div>`;
}

// ─── 카드 (신규): Roles (② init_predefined_roles) ─────────────────

function renderRolesCard(roles) {
  const el = document.getElementById('setup-roles-card');
  if (!el || !roles) return;

  const expected = roles.expected || [];
  const registeredNames = new Set((roles.registered || []).map((r) => r.name.toLowerCase()));
  const chips = expected.map((name) => {
    const ok = registeredNames.has(String(name).toLowerCase());
    const cls = ok ? 'bg-success-lt' : 'bg-danger-lt';
    const mark = ok ? '✅' : '❌';
    return `<span class="badge ${cls} me-2 mb-1">${mark} ${escapeHtml(name)}</span>`;
  }).join('');

  let banner = '';
  if (!roles.fetched) {
    banner = '<div class="alert alert-secondary py-2 mb-2 small">Getrolelist response missing — please retry.</div>';
  } else if ((roles.missing || []).length > 0) {
    banner = `<div class="alert alert-warning py-2 mb-2 small">
      ⚠️ Missing roles: <strong>${(roles.missing || []).map(escapeHtml).join(', ')}</strong>
      — <code>1_setup_auto.sh</code>'s <code>init_predefined_roles</code> again or add them manually in mc-iam-manager.
      (No integrated Re-sync endpoint available yet)
    </div>`;
  }

  const extraNote = (roles.extra || []).length > 0
    ? `<div class="text-muted small mt-2">Extra registered roles: ${(roles.extra || []).map(escapeHtml).join(', ')}</div>`
    : '';

  const rows = (roles.registered || []).map((r) => `<tr>
    <td class="fw-medium">${escapeHtml(r.name)}</td>
    <td class="small">${(r.roleTypes || []).map((t) => `<span class="badge bg-blue-lt me-1">${escapeHtml(t)}</span>`).join('') || '<span class="text-muted">-</span>'}</td>
    <td class="text-muted small">${escapeHtml(r.description || '')}</td>
  </tr>`).join('');

  const detailsBlock = rows
    ? `<details class="mt-2">
        <summary class="text-muted small mb-1" style="cursor:pointer">Registered role details (${(roles.registered || []).length} items)</summary>
        <div class="table-responsive mt-2">
          <table class="table table-sm table-vcenter mb-0">
            <thead><tr><th>Name</th><th style="width:200px">role_types</th><th>Description</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </details>`
    : '';

  el.innerHTML = `<div class="card border">
    <div class="card-header py-2">
      <h4 class="card-title mb-0">Roles <span class="text-muted small ms-2">(② init_predefined_roles)</span></h4>
    </div>
    <div class="card-body">
      ${banner}
      <div class="row g-2">
        <div class="col-md-3"><div class="text-muted small">Registered roles</div>
          <div class="fs-3 fw-medium">${(roles.registered || []).length}</div></div>
        <div class="col-md-3"><div class="text-muted small">Expected roles</div>
          <div class="fs-3 fw-medium">${expected.length}</div></div>
        <div class="col-md-6"><div class="text-muted small">Expected vs Registered</div>
          <div>${chips || '<span class="text-muted">-</span>'}</div></div>
      </div>
      ${extraNote}
      ${detailsBlock}
    </div>
  </div>`;
}

// ─── 카드 (신규): Projects (⑤ sync_projects) ──────────────────────

function renderProjectsCard(projects) {
  const el = document.getElementById('setup-projects-card');
  if (!el || !projects) return;

  const items = projects.items || [];
  const missingNs = items.filter((p) => !p.nsId).length;

  let banner = '';
  if (!projects.fetched) {
    banner = '<div class="alert alert-secondary py-2 mb-2 small">listProjects response missing — please retry.</div>';
  } else if (items.length === 0) {
    banner = '<div class="alert alert-warning py-2 mb-2 small">⚠️ No registered projects. Sync mc-infra-manager namespaces via <strong>Re-sync ▶ Projects</strong>.</div>';
  } else if (missingNs > 0) {
    banner = `<div class="alert alert-info py-2 mb-2 small">${missingNs} projects are registered without a NsId.</div>`;
  }

  const rows = items.map((p) => `<tr>
    <td class="text-muted small">${escapeHtml(String(p.id))}</td>
    <td class="fw-medium">${escapeHtml(p.name)}</td>
    <td class="small">${p.nsId ? escapeHtml(p.nsId) : '<span class="text-warning">⚠️ None</span>'}</td>
    <td class="text-muted small">${escapeHtml(p.description || '')}</td>
  </tr>`).join('');

  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">Projects <span class="text-muted small ms-2">(⑤ sync_projects)</span></h4>
      <div class="ms-auto">
        <button id="setup-resync-projects-card-btn" class="btn btn-sm btn-outline-primary">
          Re-sync ▶ Projects
        </button>
      </div>
    </div>
    <div class="card-body">
      ${banner}
      <div class="row g-2">
        <div class="col-md-3"><div class="text-muted small">Registered projects</div>
          <div class="fs-3 fw-medium">${items.length}</div></div>
        <div class="col-md-9"><div class="text-muted small">Description</div>
          <div class="small">1:1 mapping to mc-infra-manager namespace. Empty NsId means the ns is not registered in mc-infra-manager or sync is missing.</div></div>
      </div>
      ${rows ? `<details class="mt-2">
        <summary class="text-muted small mb-1" style="cursor:pointer">Registered project details (${items.length} items)</summary>
        <div class="table-responsive mt-2">
          <table class="table table-sm table-vcenter mb-0">
            <thead><tr><th style="width:80px">ID</th><th>Name</th><th style="width:160px">NsId</th><th>Description</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </details>` : ''}
    </div>
  </div>`;
  bindClick('setup-resync-projects-card-btn', () => runAction('projects', api().resyncProjects, async () => {
    const partial = await api().fetchProjectsOnly();
    if (!State.lastViewModel) return refresh();
    const merged = mergeProjectsCard(State.lastViewModel, partial);
    State.lastViewModel = merged;
    renderSetupSequence(merged.setupSequence);
    renderProjectsCard(merged.projects);
  }));
}

// ─── 카드 (신규): Workspace Mapping (⑥ map_workspace_projects) ────

function renderWorkspaceMappingCard(wsMap) {
  const el = document.getElementById('setup-wsmapping-card');
  if (!el || !wsMap) return;

  const workspaces = wsMap.workspaces || [];
  const unmapped   = wsMap.unmappedProjects || [];
  const mappedTotal = (wsMap.mappedProjectIds || []).length;
  const projectTotal = wsMap.totalProjectCount || 0;

  let banner = '';
  if (!wsMap.fetched) {
    banner = '<div class="alert alert-secondary py-2 mb-2 small">listWorkspaces / listWorkspaceProjects response missing — please retry.</div>';
  } else if (workspaces.length === 0) {
    banner = '<div class="alert alert-warning py-2 mb-2 small">⚠️ No registered workspaces. Please create a workspace in mc-iam-manager first.</div>';
  } else if (projectTotal > 0 && mappedTotal < projectTotal) {
    banner = `<div class="alert alert-warning py-2 mb-2 small">
      ⚠️ ${unmapped.length} unmapped projects — will be auto-mapped to the default workspace on Re-sync ▶ Projects
      (<code>env DEFAULT_WORKSPACE_NAME</code>). For manual mapping to a specific workspace,
      <a href="/operation/workspace/workspaces" class="alert-link">go to the <a href="/operation/workspace/workspaces" class="alert-link">Operations ▶ Workspaces page</a>.
    </div>`;
  }

  const wsRows = workspaces.map((w) => `<tr>
    <td class="text-muted small">${escapeHtml(String(w.id))}</td>
    <td class="fw-medium">${escapeHtml(w.name)}</td>
    <td class="text-end">${w.projectCount}</td>
    <td class="text-muted small">${escapeHtml(w.description || '')}</td>
  </tr>`).join('');

  const unmappedRows = unmapped.map((p) => `<tr>
    <td class="text-muted small">${escapeHtml(String(p.id))}</td>
    <td class="fw-medium">${escapeHtml(p.name)}</td>
    <td class="small">${p.nsId ? escapeHtml(p.nsId) : '<span class="text-muted">-</span>'}</td>
  </tr>`).join('');

  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">Workspace Mapping <span class="text-muted small ms-2">(⑥ map_workspace_projects)</span></h4>
      <div class="ms-auto">
        <a href="/operation/workspace/workspaces" class="btn btn-sm btn-outline-secondary">
          Operations ▶ Workspaces
        </a>
      </div>
    </div>
    <div class="card-body">
      ${banner}
      <div class="row g-2">
        <div class="col-md-3"><div class="text-muted small">Workspaces</div>
          <div class="fs-3 fw-medium">${workspaces.length}</div></div>
        <div class="col-md-3"><div class="text-muted small">Mapped projects</div>
          <div class="fs-3 fw-medium">${mappedTotal} / ${projectTotal}</div></div>
        <div class="col-md-3"><div class="text-muted small">Unmapped projects</div>
          <div class="fs-3 fw-medium ${unmapped.length > 0 ? 'text-warning' : ''}">${unmapped.length}</div></div>
        <div class="col-md-3"><div class="text-muted small">Status</div>
          <div>${statusBadge(
            !wsMap.fetched ? 'UNKNOWN'
              : (projectTotal === 0 ? 'OK'
                : (mappedTotal >= projectTotal ? 'OK' : 'WARN'))
          )}</div></div>
      </div>
      ${wsRows ? `<details class="mt-2">
        <summary class="text-muted small mb-1" style="cursor:pointer">Workspace list (${workspaces.length} items)</summary>
        <div class="table-responsive mt-2">
          <table class="table table-sm table-vcenter mb-0">
            <thead><tr><th style="width:80px">ID</th><th>Name</th><th style="width:120px" class="text-end">Mapped projects</th><th>Description</th></tr></thead>
            <tbody>${wsRows}</tbody>
          </table>
        </div>
      </details>` : ''}
      ${unmappedRows ? `<details class="mt-2">
        <summary class="text-warning small mb-1" style="cursor:pointer">Unmapped projects (${unmapped.length} items)</summary>
        <div class="table-responsive mt-2">
          <table class="table table-sm table-vcenter mb-0">
            <thead><tr><th style="width:80px">ID</th><th>Name</th><th style="width:160px">NsId</th></tr></thead>
            <tbody>${unmappedRows}</tbody>
          </table>
        </div>
      </details>` : ''}
    </div>
  </div>`;
}

// ─── 카드 4: Credentials (cb-tumblebug GetCredentialHolderList 기반) ─

function renderCredentialsCard(cred) {
  const el = document.getElementById('setup-credentials-card');
  if (!el || !cred) return;

  const holders = cred.holders || [];
  const totalConn = holders.reduce((s, h) => s + h.connectionCount, 0);
  const verifiedConn = holders.reduce((s, h) => s + h.verifiedConnectionCount, 0);

  const providerKeys = Object.keys(cred.byProvider || {}).sort();
  const providerChips = providerKeys.map((k) => {
    const g = cred.byProvider[k];
    return `<span class="badge bg-blue-lt me-2 mb-1">
      ${escapeHtml(k.toUpperCase())} : ${g.holderCount} holder
    </span>`;
  }).join('') || '<span class="text-muted">-</span>';

  let banner = '';
  if (!cred.fetched) {
    banner = '<div class="alert alert-secondary py-2 mb-2 small">GetCredentialHolderList response missing — check mc-infra-manager(cb-tumblebug) availability.</div>';
  } else if (holders.length === 0) {
    banner = '<div class="alert alert-warning py-2 mb-2 small">⚠️ No credential holders registered. Register credentials in cb-tumblebug before entering the onboarding wizard.</div>';
  } else if (cred.inactiveConnectionCount > 0) {
    banner = `<div class="alert alert-info py-2 mb-2 small">verified ${verifiedConn} / total ${totalConn} connection — ${cred.inactiveConnectionCount} unverified connections may be excluded from onboarding.</div>`;
  }

  const rows = holders.map((h) => {
    const ratio = h.connectionCount > 0
      ? Math.round((h.verifiedConnectionCount / h.connectionCount) * 100)
      : 0;
    const ratioCls = ratio === 100 ? 'text-success' : ratio > 0 ? 'text-warning' : 'text-muted';
    const providerBadges = h.providers.map((p) =>
      `<span class="badge bg-blue-lt me-1">${escapeHtml(String(p))}</span>`
    ).join('') || '<span class="text-muted">-</span>';
    return `<tr>
      <td class="fw-medium">
        ${escapeHtml(h.credentialHolder)}
        ${h.isDefault ? '<span class="badge bg-success-lt ms-2">default</span>' : ''}
      </td>
      <td class="small">${providerBadges}</td>
      <td class="text-end">${h.verifiedConnectionCount} / ${h.connectionCount}</td>
      <td class="text-end ${ratioCls}">${ratio}%</td>
    </tr>`;
  }).join('');

  const detailsBlock = rows
    ? `<details class="mt-2" open>
        <summary class="text-muted small mb-1" style="cursor:pointer">Credential Holder details (${holders.length} items)</summary>
        <div class="table-responsive mt-2">
          <table class="table table-sm table-vcenter mb-0">
            <thead><tr>
              <th>Holder</th>
              <th>Providers</th>
              <th style="width:140px" class="text-end">Verified / Total</th>
              <th style="width:80px" class="text-end">Verify%</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </details>`
    : '';

  el.innerHTML = `<div class="card border">
    <div class="card-header py-2">
      <h4 class="card-title mb-0">Credentials
        <span class="text-muted small ms-2">(GetCredentialHolderList @ cb-tumblebug)</span>
      </h4>
    </div>
    <div class="card-body">
      ${banner}
      <div class="row g-2">
        <div class="col-md-3"><div class="text-muted small">Holders</div>
          <div class="fs-3 fw-medium">${holders.length}</div></div>
        <div class="col-md-3"><div class="text-muted small">Verified Connection</div>
          <div class="fs-3 fw-medium">${verifiedConn} / ${totalConn}</div></div>
        <div class="col-md-6"><div class="text-muted small">Holders by Provider</div>
          <div>${providerChips}</div></div>
      </div>
      ${detailsBlock}
    </div>
  </div>`;
}

// ─── 카드 5: loadAssets (cb-tumblebug GetAssetsSummary 기반) ───────

function renderLoadAssetsCard(la) {
  const el = document.getElementById('setup-loadassets-card');
  if (!el || !la) return;

  const isOk = la.status === 'OK';
  const isNotExec = la.status === 'NOT-EXECUTED';
  const btnClass = isOk ? 'btn-outline-secondary' : 'btn-warning';

  let banner = '';
  if (isNotExec) {
    banner = '<div class="alert alert-warning py-2 mb-2 small">⚠️ Spec/image not loaded in system namespace. Please run <strong>Re-run loadAssets</strong>.</div>';
  } else if (la.status === 'PARTIAL') {
    banner = '<div class="alert alert-info py-2 mb-2 small">Only one of spec or image is loaded.</div>';
  } else if (la.status === 'UNKNOWN') {
    banner = '<div class="alert alert-secondary py-2 mb-2 small">cb-tumblebug GetAssetsSummary response missing — check readyz first.</div>';
  }

  // Spec priced 비율
  const pricedRatio = la.specCount > 0
    ? Math.round((la.pricedSpecCount / la.specCount) * 100)
    : 0;
  const pricedCls = pricedRatio === 100 ? 'text-success'
                   : pricedRatio >= 80   ? 'text-info'
                   : pricedRatio > 0     ? 'text-warning'
                                         : 'text-muted';

  // CSP별 표 (providers[])
  const providerRows = (la.providers || []).map((p) => {
    const specCount = Number(p.specCount || 0);
    const priced    = Number(p.pricedSpecCount || 0);
    const unpriced  = Number(p.unpricedSpecCount || 0);
    const images    = Number(p.imageCount || 0);
    const ratio = specCount > 0 ? Math.round((priced / specCount) * 100) : 0;
    const ratioCls = ratio === 100 ? 'text-success'
                    : ratio >= 80  ? 'text-info'
                    : ratio > 0    ? 'text-warning'
                                   : 'text-muted';
    return `<tr>
      <td class="fw-medium">${escapeHtml(String(p.providerName || '-'))}</td>
      <td class="text-end">${specCount.toLocaleString()}</td>
      <td class="text-end">${priced.toLocaleString()}</td>
      <td class="text-end ${unpriced > 0 ? 'text-warning' : ''}">${unpriced.toLocaleString()}</td>
      <td class="text-end ${ratioCls}">${ratio}%</td>
      <td class="text-end">${images.toLocaleString()}</td>
    </tr>`;
  }).join('');

  const providerBlock = providerRows
    ? `<details class="mt-2" open>
        <summary class="text-muted small mb-1" style="cursor:pointer">Distribution by Provider (${(la.providers || []).length} items)</summary>
        <div class="table-responsive mt-2">
          <table class="table table-sm table-vcenter mb-0">
            <thead><tr>
              <th>Provider</th>
              <th class="text-end" style="width:100px">Spec</th>
              <th class="text-end" style="width:100px">Priced</th>
              <th class="text-end" style="width:100px">Unpriced</th>
              <th class="text-end" style="width:80px">Priced%</th>
              <th class="text-end" style="width:100px">Image</th>
            </tr></thead>
            <tbody>${providerRows}</tbody>
          </table>
        </div>
      </details>`
    : '';

  el.innerHTML = `<div class="card border">
    <div class="card-header py-2 d-flex align-items-center">
      <h4 class="card-title mb-0">loadAssets
        <span class="text-muted small ms-2">(GetAssetsSummary @ ns: ${escapeHtml(la.systemNs || 'system')})</span>
      </h4>
      <div class="ms-auto">
        <button id="setup-rerun-loadassets-btn" class="btn btn-sm ${btnClass}">
          Re-run ▶ loadAssets
        </button>
      </div>
    </div>
    <div class="card-body">
      ${banner}
      <div class="row g-2">
        <div class="col-md-3"><div class="text-muted small">Spec loaded</div>
          <div class="fs-3 fw-medium">${(la.specCount || 0).toLocaleString()}</div></div>
        <div class="col-md-3"><div class="text-muted small">Image loaded</div>
          <div class="fs-3 fw-medium">${(la.imageCount || 0).toLocaleString()}</div></div>
        <div class="col-md-3"><div class="text-muted small">Priced / Unpriced</div>
          <div class="fs-3 fw-medium">
            <span class="${pricedCls}">${(la.pricedSpecCount || 0).toLocaleString()}</span>
            <span class="text-muted"> / </span>
            <span class="${(la.unpricedSpecCount || 0) > 0 ? 'text-warning' : 'text-muted'}">${(la.unpricedSpecCount || 0).toLocaleString()}</span>
          </div>
          <div class="small ${pricedCls}">${pricedRatio}% priced</div></div>
        <div class="col-md-3"><div class="text-muted small">Status</div>
          <div>${statusBadge(la.status)}</div></div>
      </div>
      ${providerBlock}
    </div>
  </div>`;
  bindClick('setup-rerun-loadassets-btn', () => runAction('loadassets', api().rerunLoadAssets, async () => {
    const partial = await api().fetchLoadAssetsOnly();
    if (!State.lastViewModel) return refresh();
    const merged = mergeLoadAssets(State.lastViewModel, partial);
    State.lastViewModel = merged;
    renderLoadAssetsCard(merged.loadAssets);
  }));
}

// ─── UI 공통 helper ───────────────────────────────────────────────

const STATUS_BADGE_CLASS = {
  'OK':           { cls: 'bg-success-lt',   text: '✅ OK' },
  'FAIL':         { cls: 'bg-danger-lt',    text: '❌ FAIL' },
  'WARN':         { cls: 'bg-yellow-lt',    text: '⚠️ WARN' },
  'PARTIAL':      { cls: 'bg-yellow-lt',    text: '⚠️ PARTIAL' },
  'NOT-EXECUTED': { cls: 'bg-yellow-lt',    text: '⚠️ NOT-EXECUTED' },
  'UNKNOWN':      { cls: 'bg-secondary-lt', text: '❓ UNKNOWN' },
};

function statusBadge(status) {
  const meta = STATUS_BADGE_CLASS[status] || STATUS_BADGE_CLASS['UNKNOWN'];
  return `<span class="badge ${meta.cls}">${meta.text}</span>`;
}

function reachableBadge(reachable, httpStatus, errorMessage) {
  if (reachable) {
    return `<span class="badge bg-success-lt" title="HTTP ${httpStatus}">✅ ${httpStatus || 200}</span>`;
  }
  if (errorMessage) {
    return `<span class="badge bg-danger-lt" title="${escapeAttr(errorMessage)}">❌ unreachable</span>`;
  }
  if (httpStatus) {
    return `<span class="badge bg-danger-lt">❌ HTTP ${httpStatus}</span>`;
  }
  return '<span class="badge bg-secondary-lt">env not configured</span>';
}

function formatYamlMeta(card) {
  const lm = card.sourceLastModified;
  const etag = card.sourceETag;
  const parts = [];
  if (lm)   parts.push(`Last: ${escapeHtml(lm)}`);
  if (etag) parts.push(`ETag: ${escapeHtml(etag)}`);
  return parts.length > 0 ? parts.join('<br>') : '<span class="text-muted">-</span>';
}

function setActionsDisabled(disabled) {
  const ids = [
    'setup-refresh-all-btn',
    'setup-resync-menu-btn',
    'setup-resync-api-btn',
    'setup-resync-projects-card-btn',
    'setup-rerun-loadassets-btn',
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  });
}

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) {
  return escapeHtml(s);
}

// ─── ViewModel 로직 helper (api 모듈 일부 재사용 — UMD라 내부 함수 export 못함) ─

function isFulfilledOk(settled) {
  if (!settled || settled.status !== 'fulfilled') return false;
  const resp = settled.value;
  if (!resp) return false;
  const status = resp.status || (resp.response && resp.response.status);
  return typeof status === 'number' && status >= 200 && status < 300;
}

function deriveStatusFromCount(count, settled) {
  if (!isFulfilledOk(settled)) return 'UNKNOWN';
  return count > 0 ? 'OK' : 'FAIL';
}

function extractResponseData(resp) {
  if (!resp || !resp.data) return null;
  if (Object.prototype.hasOwnProperty.call(resp.data, 'responseData')) {
    return resp.data.responseData;
  }
  return resp.data;
}

function countFromList(settled, listKeys = []) {
  if (!isFulfilledOk(settled)) return 0;
  const data = extractResponseData(settled.value);
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') {
    for (const key of listKeys) {
      if (Array.isArray(data[key])) return data[key].length;
    }
    if (Array.isArray(data.responseData)) return data.responseData.length;
    if (typeof data.count === 'number') return data.count;
  }
  return 0;
}

function countFromMcmpApis(settled) {
  if (!isFulfilledOk(settled)) return 0;
  const data = extractResponseData(settled.value);
  if (!data) return 0;
  const sa = data.ServiceActions || data.serviceActions || {};
  let total = 0;
  for (const svc of Object.keys(sa)) {
    const actions = sa[svc];
    if (actions && typeof actions === 'object') total += Object.keys(actions).length;
  }
  return total;
}

function unwrapArray(settled) {
  if (!isFulfilledOk(settled)) return [];
  const data = extractResponseData(settled.value);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.responseData)) return data.responseData;
  return [];
}

function unwrapServicesMap(settled) {
  if (!isFulfilledOk(settled)) return {};
  const data = extractResponseData(settled.value);
  if (!data) return {};
  return data.Services || data.services || {};
}

function parseYaml(settled) {
  const empty = {
    url: null, reachable: false, httpStatus: null,
    lastModified: null, etag: null, errorMessage: null,
  };
  if (!settled || settled.status !== 'fulfilled') return empty;
  const resp = settled.value;
  if (!resp || !resp.data) return empty;
  const data = resp.data.responseData || resp.data;
  return {
    url: data.url || null,
    reachable: !!data.reachable,
    httpStatus: data.httpStatus || null,
    lastModified: data.lastModified || null,
    etag: data.etag || null,
    errorMessage: data.errorMessage || null,
  };
}
