// Navbar 사용자 메뉴 "CSP Credentials" — CSP 임시 자격 증명(STS) 발급 (전용 모달 #cspCredentialModal)
//
// 발급 근거는 노드가 아니라 "현재 워크스페이스에서의 내 역할 → CSP Role 매핑"이다.
// 그래서 진입점을 노드 상세가 아닌 사용자 메뉴에 두고, 발급 대상 CSP·Region 을 직접 고르게 한다.
//   1단계(request): Workspace(현재 선택, 읽기 전용) / Role(이 워크스페이스에서의 내 콘솔 역할) / CSP(내 역할에 매핑된 CSP만) / Region(해당 CSP 의 connection region)
// 콘솔 안에서는 콘솔 역할만 보여 준다 — 매핑된 CSP Role 은 역할 관리(Workspaces > Roles)에서 확인한다.
//   2단계(result) : 발급 정보 + CLI/API 용 환경변수 블록 하나(기본 가림, Show / Copy)
// 임시 자격 증명은 CLI/API 로 쓰는 것이라 키를 항목별로 나열하지 않는다
// (SSH 접속 키를 보여 주는 Keypair 모달 #secretModal 과 용도가 달라 모달을 분리했다).
// Region 은 필수다 — 비우면 IAM 의 AWS AssumeRole 이 실패한다(403).
// 발급 값은 이 모듈의 메모리에만 두고 모달이 닫히면 지운다(storage·console 미기록).

const REQUEST_MODAL_ID = 'cspCredentialModal';
const DEFAULT_REGION = 'ap-northeast-2';

const CSP_CREDENTIAL_SCOPE_NOTICE =
  "This credential is issued for the CSP role mapped to your role in the current workspace. " +
  "Its permissions follow that CSP role (account-wide).";

const MASK = '••••••';

// 요청 모달이 연 시점의 상태 — 다시 열면 초기화된다
let request = { session: 0, workspaceId: '', workspaceName: '', cspTypes: new Set(), regionsByType: null };

function $id(id) {
  return document.getElementById(id);
}

function api() {
  return webconsolejs['common/api/services/csp_credential_api'];
}

function requestModalInstance() {
  const el = $id(REQUEST_MODAL_ID);
  if (!el || typeof bootstrap === 'undefined') return null;
  if (!el.dataset.cspCredentialBound) {
    el.addEventListener('hidden.bs.modal', clearResult);
    el.dataset.cspCredentialBound = 'true';
  }
  return bootstrap.Modal.getOrCreateInstance(el);
}

function setHidden(id, hidden) {
  const el = $id(id);
  if (el) el.classList.toggle('d-none', !!hidden);
}

function fillSelect(select, values, selected, labelOf = (v) => v) {
  if (!select) return;
  select.replaceChildren();
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = labelOf(v);
    if (v === selected) opt.selected = true;
    select.append(opt);
  });
}

function showRequestMessage(message) {
  const el = $id('cspCredentialModal-message');
  if (el) el.textContent = message || '';
  setHidden('cspCredentialModal-message', !message);
}

function setFormEnabled(enabled) {
  ['cspCredentialModal-csp', 'cspCredentialModal-region', 'cspCredentialModal-issue-btn'].forEach((id) => {
    const el = $id(id);
    if (el) el.disabled = !enabled;
  });
}

// ─── Region 후보: tumblebug connection config 의 region (provider 별, 중복 제거) ─────────────

async function loadRegionsByType() {
  if (request.regionsByType) return request.regionsByType;
  const byType = new Map();
  try {
    const response = await webconsolejs['common/api/http'].commonAPIPost(
      '/api/mc-infra-manager/GetConnConfigList', {}, undefined, { loaderType: 'none', silentErrors: true }
    );
    const list = response?.data?.responseData?.connectionconfig || [];
    list.forEach((c) => {
      const type = String(c.providerName || '').toLowerCase();
      const region = c.regionDetail?.regionId || c.regionZoneInfo?.assignedRegion || '';
      if (!type || !region) return;
      if (!byType.has(type)) byType.set(type, new Set());
      byType.get(type).add(region);
    });
  } catch (e) {
    // region 목록을 못 받아도 기본 region 으로 발급은 시도할 수 있다
  }
  request.regionsByType = byType;
  return byType;
}

async function updateRegionOptions() {
  const csp = $id('cspCredentialModal-csp')?.value || '';
  const byType = await loadRegionsByType();
  const regions = [...(byType.get(csp) || [])].sort();
  if (!regions.length) regions.push(DEFAULT_REGION);
  const selected = regions.includes(DEFAULT_REGION) ? DEFAULT_REGION : regions[0];
  fillSelect($id('cspCredentialModal-region'), regions, selected);
}

// ─── 요청 모달 ───────────────────────────────────────────────────────

/** 사용자 메뉴 "CSP Credentials" 클릭 */
export async function openCspCredentialModal() {
  const session = ++request.session;
  const workspace = webconsolejs['common/api/services/workspace_api'].getCurrentWorkspace();
  request = {
    session,
    workspaceId: String(workspace?.id ?? workspace?.Id ?? ''),
    workspaceName: workspace?.name || workspace?.Name || '',
    cspTypes: new Set(),
    regionsByType: null,
  };

  clearResult();
  showStep('request');
  const wsEl = $id('cspCredentialModal-workspace');
  if (wsEl) wsEl.textContent = request.workspaceName || request.workspaceId || '-';
  fillSelect($id('cspCredentialModal-csp'), [], '');
  fillSelect($id('cspCredentialModal-region'), [], '');
  const roleEl = $id('cspCredentialModal-role');
  if (roleEl) roleEl.textContent = '-';
  setFormEnabled(false);
  showRequestMessage('');
  setHidden('cspCredentialModal-loading', false);
  requestModalInstance()?.show();

  if (!request.workspaceId) {
    setHidden('cspCredentialModal-loading', true);
    showRequestMessage('Select a workspace first.');
    return;
  }

  const access = await api().getCspCredentialAccess(request.workspaceId);
  if (session !== request.session) return; // 그 사이 다시 열렸다
  request.cspTypes = access.cspTypes;
  setHidden('cspCredentialModal-loading', true);
  if (roleEl) roleEl.textContent = access.roleNames.length ? access.roleNames.join(', ') : '-';

  const types = [...access.cspTypes].sort();
  if (!types.length) {
    showRequestMessage('No CSP role is mapped to your role in this workspace. Ask an administrator.');
    return;
  }
  fillSelect($id('cspCredentialModal-csp'), types, types[0], (t) => t.toUpperCase());
  await updateRegionOptions();
  if (session !== request.session) return;
  setFormEnabled(true);
}

/** CSP 선택 변경 → Region 후보 갱신 */
export function onCspChange() {
  return updateRegionOptions();
}

// ─── 2단계: 발급 결과 (CLI/API 용 환경변수 블록) ──────────────────────────

// 발급 결과 — 모달이 닫히거나 다시 요청하면 지운다
let result = { vars: [], visible: false, timer: null, expiration: null };

function showStep(step) {
  const isResult = step === 'result';
  setHidden('cspCredentialModal-request', isResult);
  setHidden('cspCredentialModal-result', !isResult);
  setHidden('cspCredentialModal-issue-btn', isResult);
  setHidden('cspCredentialModal-back-btn', !isResult);
}

function clearResult() {
  if (result.timer) clearInterval(result.timer);
  result = { vars: [], visible: false, timer: null, expiration: null };
  ['cspCredentialModal-env', 'cspCredentialModal-error', 'cspCredentialModal-notice'].forEach((id) => {
    const el = $id(id);
    if (el) el.textContent = '';
  });
  const meta = $id('cspCredentialModal-meta');
  if (meta) meta.replaceChildren();
  ['cspCredentialModal-issuing', 'cspCredentialModal-error', 'cspCredentialModal-meta', 'cspCredentialModal-credential']
    .forEach((id) => setHidden(id, true));
  const showBtn = $id('cspCredentialModal-show-btn');
  if (showBtn) showBtn.textContent = 'Show';
}

// 셸 export 문 — 값은 작은따옴표로 감싸 셸 특수문자를 막는다
function shellQuote(v) {
  return "'" + String(v).replace(/'/g, "'\\''") + "'";
}

// CSP 별 CLI/SDK 표준 환경변수 (kind: id=앞뒤 4자 노출, secret=길이만, plain=그대로)
function credentialVars(cred, region) {
  const csp = String(cred?.cspType || '').toLowerCase();
  const reg = cred?.region || region || '';
  const v = [];
  const add = (name, value, kind) => { if (value) v.push({ name, value: String(value), kind }); };
  switch (csp) {
    case 'aws':
      add('AWS_ACCESS_KEY_ID', cred.accessKeyId, 'id');
      add('AWS_SECRET_ACCESS_KEY', cred.secretAccessKey, 'secret');
      add('AWS_SESSION_TOKEN', cred.sessionToken, 'secret');
      add('AWS_DEFAULT_REGION', reg, 'plain');
      break;
    case 'gcp':
      add('GOOGLE_OAUTH_ACCESS_TOKEN', cred.accessToken, 'secret');
      break;
    case 'alibaba':
      add('ALIBABA_CLOUD_ACCESS_KEY_ID', cred.accessKeyId, 'id');
      add('ALIBABA_CLOUD_ACCESS_KEY_SECRET', cred.accessKeySecret || cred.secretAccessKey, 'secret');
      add('ALIBABA_CLOUD_SECURITY_TOKEN', cred.securityToken || cred.sessionToken, 'secret');
      add('ALIBABA_CLOUD_REGION_ID', reg, 'plain');
      break;
    case 'tencent':
      add('TENCENTCLOUD_SECRET_ID', cred.accessKeyId, 'id');
      add('TENCENTCLOUD_SECRET_KEY', cred.secretAccessKey, 'secret');
      add('TENCENTCLOUD_SESSION_TOKEN', cred.sessionToken, 'secret');
      add('TENCENTCLOUD_REGION', reg, 'plain');
      break;
    default:
      // 그 밖의 CSP 는 CLI 표준 변수명이 인증 방식마다 달라 받은 값을 일반 이름으로 내보낸다
      add('CSP_ACCESS_KEY_ID', cred.accessKeyId, 'id');
      add('CSP_SECRET_ACCESS_KEY', cred.secretAccessKey || cred.accessKeySecret, 'secret');
      add('CSP_SESSION_TOKEN', cred.sessionToken || cred.securityToken, 'secret');
      add('CSP_ACCESS_TOKEN', cred.accessToken, 'secret');
      add('CSP_REGION', reg, 'plain');
  }
  return v;
}

function maskVar(item) {
  if (item.kind === 'plain') return item.value;
  if (item.kind === 'id') {
    return item.value.length <= 8 ? '••••••••' : item.value.slice(0, 4) + '••••••••' + item.value.slice(-4);
  }
  return `${MASK}  (${item.value.length} chars)`;
}

function exportText(vars, masked) {
  return vars.map((it) => 'export ' + it.name + '=' + (masked ? maskVar(it) : shellQuote(it.value))).join('\n');
}

function renderEnv() {
  const pre = $id('cspCredentialModal-env');
  if (pre) {
    pre.textContent = exportText(result.vars, !result.visible);
    pre.dataset.visible = result.visible ? 'true' : 'false';
  }
  const btn = $id('cspCredentialModal-show-btn');
  if (btn) btn.textContent = result.visible ? 'Hide' : 'Show';
}

function formatRemaining(expiration) {
  const exp = new Date(expiration);
  if (isNaN(exp.getTime())) return '-';
  const ms = exp.getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return (h > 0 ? h + 'h ' : '') + m + 'm remaining';
}

function formatExpiration(expiration) {
  const exp = new Date(expiration);
  if (!expiration || isNaN(exp.getTime()) || exp.getFullYear() < 2000) return '';
  return exp.toLocaleString();
}

function renderMeta(items) {
  const dl = $id('cspCredentialModal-meta');
  if (!dl) return;
  dl.replaceChildren();
  items.forEach((item) => {
    const dt = document.createElement('dt');
    dt.className = 'col-sm-3 text-muted fw-normal';
    dt.textContent = item.label;
    const dd = document.createElement('dd');
    dd.className = 'col-sm-9 mb-1 text-break';
    dd.id = 'cspCredentialModal-meta-' + item.key;
    dd.textContent = item.value || '-';
    dl.append(dt, dd);
  });
  setHidden('cspCredentialModal-meta', !items.length);
}

/** Issue — 2단계로 넘어가 발급 결과(환경변수 블록)를 같은 모달에 표시 */
export async function issue() {
  const csp = $id('cspCredentialModal-csp')?.value || '';
  const region = $id('cspCredentialModal-region')?.value || '';
  if (!request.workspaceId || !csp) return;
  const session = request.session;

  clearResult();
  showStep('result');
  setHidden('cspCredentialModal-issuing', false);
  const baseMeta = [
    { key: 'csp', label: 'CSP', value: csp.toUpperCase() },
    { key: 'region', label: 'Region', value: region },
  ];

  let cred;
  try {
    cred = await api().getTemporaryCredentials({ workspaceId: request.workspaceId, cspType: csp, region });
  } catch (err) {
    if (session !== request.session) return; // 그 사이 닫혔다가 다시 열렸다
    setHidden('cspCredentialModal-issuing', true);
    renderMeta(baseMeta);
    const errEl = $id('cspCredentialModal-error');
    if (errEl) errEl.textContent = err?.message || 'Failed to issue temporary credentials.';
    setHidden('cspCredentialModal-error', false);
    return;
  }
  // 닫힌 뒤 도착한 응답은 버린다(메모리에 남기지 않는다)
  const modalEl = $id(REQUEST_MODAL_ID);
  if (session !== request.session || !modalEl || !modalEl.classList.contains('show')) return;
  setHidden('cspCredentialModal-issuing', true);

  const issuedCsp = String(cred.cspType || csp).toLowerCase();
  const issuedRegion = cred.region || region || '';
  const expirationText = formatExpiration(cred.expiration);
  renderMeta([
    { key: 'csp', label: 'CSP', value: issuedCsp.toUpperCase() },
    { key: 'region', label: 'Region', value: issuedRegion },
    { key: 'expiration', label: 'Expiration', value: expirationText || 'Not provided' },
    { key: 'remaining', label: 'Time left', value: expirationText ? formatRemaining(cred.expiration) : '-' },
  ]);
  if (expirationText) {
    result.expiration = cred.expiration;
    result.timer = setInterval(() => {
      const el = $id('cspCredentialModal-meta-remaining');
      if (el) el.textContent = formatRemaining(result.expiration);
    }, 15000);
  }

  result.vars = credentialVars(cred, issuedRegion);
  if (!result.vars.length) {
    const errEl = $id('cspCredentialModal-error');
    if (errEl) errEl.textContent = 'The response did not contain any credential values.';
    setHidden('cspCredentialModal-error', false);
    return;
  }
  const notice = $id('cspCredentialModal-notice');
  if (notice) notice.textContent = CSP_CREDENTIAL_SCOPE_NOTICE;
  renderEnv();
  setHidden('cspCredentialModal-credential', false);
}

/** Show / Hide — 환경변수 블록 전체 */
export function toggleShow() {
  if (!result.vars.length) return;
  result.visible = !result.visible;
  renderEnv();
}

function flash(btn, label) {
  if (!btn) return;
  btn.textContent = label;
  setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
}

/** Copy — 표시 여부와 관계없이 실제 값의 export 문을 복사 */
export function copyCredential() {
  const btn = $id('cspCredentialModal-copy-btn');
  if (!result.vars.length || !navigator.clipboard) {
    flash(btn, 'Copy failed');
    return Promise.resolve(false);
  }
  return navigator.clipboard.writeText(exportText(result.vars, false))
    .then(() => { flash(btn, 'Copied!'); return true; })
    .catch(() => { flash(btn, 'Copy failed'); return false; });
}

/** Back — 발급 결과를 지우고 1단계로 */
export function backToRequest() {
  clearResult();
  showStep('request');
}
