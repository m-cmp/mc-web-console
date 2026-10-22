// 공통 비밀값 모달 (#secretModal, templates/partials/operation/manage/_secret_modal.html)
// node detail의 Keypair(private key)와 CSP 임시자격증명 표시에 함께 쓴다.
//
// 보안 원칙
//  - 비밀값은 이 모듈의 메모리(state)에만 둔다. localStorage/sessionStorage/console에 남기지 않는다.
//  - 화면에는 기본적으로 가려서 표시하고(Show/Hide), 복사는 표시 여부와 관계없이 원문을 복사한다.
//  - DOM에는 textContent로만 넣는다(innerHTML 금지). 모달이 닫히면 값과 DOM을 모두 비운다.

const MASK = '******';
const MODAL_ID = 'secretModal';

const state = {
  session: 0,        // 모달을 열 때마다 증가 — 닫힌 뒤 도착한 비동기 응답은 무시한다
  visible: false,
  fields: [],        // [{ label, value, secret }]
  actions: [],       // [{ id, label, getText }]
  liveTimer: null,
  liveItems: [],     // [{ el, render }]
};

function $id(id) {
  return document.getElementById(id);
}

function modalInstance() {
  const el = $id(MODAL_ID);
  if (!el || typeof bootstrap === 'undefined') return null;
  if (!el.dataset.secretModalBound) {
    el.addEventListener('hidden.bs.modal', clearModal);
    el.dataset.secretModalBound = 'true';
  }
  return bootstrap.Modal.getOrCreateInstance(el);
}

function setHidden(id, hidden) {
  const el = $id(id);
  if (el) el.classList.toggle('d-none', !!hidden);
}

function setText(id, text) {
  const el = $id(id);
  if (el) el.textContent = text == null ? '' : String(text);
}

function stopLiveTimer() {
  if (state.liveTimer) {
    clearInterval(state.liveTimer);
    state.liveTimer = null;
  }
  state.liveItems = [];
}

// 모달 내용·메모리 값을 모두 지운다 (hidden.bs.modal 및 새로 열 때)
export function clearModal() {
  state.session += 1;
  state.visible = false;
  state.fields = [];
  state.actions = [];
  stopLiveTimer();
  ['secretModal-fields', 'secretModal-meta'].forEach((id) => {
    const el = $id(id);
    if (el) el.replaceChildren();
  });
  const actions = $id('secretModal-actions');
  if (actions) {
    actions.querySelectorAll('[data-secret-action]').forEach((b) => b.remove());
  }
  ['secretModal-error', 'secretModal-notice', 'secretModal-warning'].forEach((id) => setText(id, ''));
  ['secretModal-loading', 'secretModal-error', 'secretModal-notice', 'secretModal-warning',
    'secretModal-meta', 'secretModal-toolbar', 'secretModal-empty'].forEach((id) => setHidden(id, true));
  setText('secretModal-toggle-btn', 'Show');
}

/**
 * 로딩 상태로 모달을 연다. 반환한 session 값을 render/renderError에 넘기면,
 * 그 사이 모달이 닫혔을 때 늦게 도착한 응답이 화면(과 메모리)에 남지 않는다.
 */
export function openLoading(title, loadingText) {
  clearModal();
  setText('secretModal-title', title || 'Secret');
  setText('secretModal-loading-text', loadingText || 'Loading...');
  setHidden('secretModal-loading', false);
  const inst = modalInstance();
  if (inst) inst.show();
  return state.session;
}

function isStale(session) {
  return session !== undefined && session !== state.session;
}

function renderMeta(meta) {
  const dl = $id('secretModal-meta');
  if (!dl) return;
  dl.replaceChildren();
  (meta || []).forEach((item, i) => {
    if (!item) return;
    const dt = document.createElement('dt');
    dt.className = 'col-sm-4 text-muted fw-normal';
    dt.textContent = item.label;
    const dd = document.createElement('dd');
    dd.className = 'col-sm-8 mb-1 text-break';
    dd.id = 'secretModal-meta-' + (item.key || i);
    if (typeof item.render === 'function') {
      dd.textContent = item.render();
      state.liveItems.push({ el: dd, render: item.render });
    } else {
      dd.textContent = item.value == null || item.value === '' ? '-' : String(item.value);
    }
    dl.append(dt, dd);
  });
  setHidden('secretModal-meta', !(meta && meta.length));
  if (state.liveItems.length) {
    state.liveTimer = setInterval(() => {
      state.liveItems.forEach(({ el, render }) => { el.textContent = render(); });
    }, 15000);
  }
}

function renderFields() {
  const box = $id('secretModal-fields');
  if (!box) return;
  box.replaceChildren();
  state.fields.forEach((field, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'mb-3';

    const head = document.createElement('div');
    head.className = 'd-flex align-items-center mb-1';
    const label = document.createElement('label');
    label.className = 'form-label mb-0';
    label.textContent = field.label;
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-sm btn-outline-primary ms-auto';
    copyBtn.id = 'secretModal-copy-' + i;
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => copyField(i));
    head.append(label, copyBtn);

    const pre = document.createElement('pre');
    pre.id = 'secretModal-value-' + i;
    // Tabler 기본 pre 는 어두운 배경·밝은 글자라 bg-light 만 주면 글자가 안 보인다 — 글자색도 함께 지정
    pre.className = 'bg-light text-dark p-2 rounded small mb-0';
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.wordBreak = 'break-all';
    pre.style.maxHeight = '320px';
    pre.style.overflowY = 'auto';
    pre.dataset.secret = field.secret ? 'true' : 'false';

    wrap.append(head, pre);
    box.append(wrap);
  });
  renderVisibility();
}

function renderVisibility() {
  state.fields.forEach((field, i) => {
    const pre = $id('secretModal-value-' + i);
    if (!pre) return;
    pre.textContent = (!field.secret || state.visible) ? field.value : MASK;
  });
  setText('secretModal-toggle-btn', state.visible ? 'Hide' : 'Show');
}

function renderActions() {
  const box = $id('secretModal-actions');
  if (!box) return;
  const toggle = $id('secretModal-toggle-btn');
  state.actions.forEach((action, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-sm btn-outline-primary';
    btn.id = 'secretModal-action-' + (action.id || i);
    btn.dataset.secretAction = 'true';
    btn.textContent = action.label;
    btn.addEventListener('click', () => runAction(i));
    box.insertBefore(btn, toggle);
  });
}

/**
 * 모달 내용을 그린다.
 * @param {object} opts
 * @param {string} opts.title
 * @param {Array<{label:string,value?:string,render?:Function,key?:string}>} [opts.meta]
 * @param {string} [opts.notice]   정보 안내(alert-info)
 * @param {string} [opts.warning]  주의(alert-warning)
 * @param {Array<{label:string,value:string,secret?:boolean}>} [opts.fields] 값이 빈 항목은 표시하지 않는다
 * @param {Array<{id:string,label:string,getText:Function}>} [opts.actions] 복사 액션 (예: 환경변수 형식)
 * @param {string} [opts.emptyText] 표시할 값이 없을 때 문구 (기본 "Not available")
 * @param {number} [session] openLoading이 돌려준 값
 */
export function render(opts = {}, session) {
  if (isStale(session)) return false;
  setHidden('secretModal-loading', true);
  setText('secretModal-title', opts.title || 'Secret');

  state.fields = (opts.fields || [])
    .filter((f) => f && f.value != null && String(f.value) !== '')
    .map((f) => ({ label: f.label, value: String(f.value), secret: f.secret !== false }));
  state.actions = (opts.actions || []).filter(Boolean);
  state.visible = false;

  renderMeta(opts.meta);
  if (opts.notice) { setText('secretModal-notice', opts.notice); setHidden('secretModal-notice', false); }
  if (opts.warning) { setText('secretModal-warning', opts.warning); setHidden('secretModal-warning', false); }

  const hasFields = state.fields.length > 0;
  setText('secretModal-empty', opts.emptyText || 'Not available');
  setHidden('secretModal-empty', hasFields);
  setHidden('secretModal-toolbar', !hasFields);
  setHidden('secretModal-toggle-btn', !state.fields.some((f) => f.secret));
  renderFields();
  if (hasFields) renderActions();

  const inst = modalInstance();
  if (inst) inst.show();
  return true;
}

export function renderError(title, message, { meta, notice } = {}, session) {
  if (isStale(session)) return false;
  setHidden('secretModal-loading', true);
  setText('secretModal-title', title || 'Secret');
  renderMeta(meta);
  if (notice) { setText('secretModal-notice', notice); setHidden('secretModal-notice', false); }
  setText('secretModal-error', message || 'An error occurred.');
  setHidden('secretModal-error', false);
  const inst = modalInstance();
  if (inst) inst.show();
  return true;
}

export function toggleSecrets() {
  state.visible = !state.visible;
  renderVisibility();
}

function flashButton(btn, label, original) {
  if (!btn) return;
  btn.textContent = label;
  setTimeout(() => { btn.textContent = original; }, 1500);
}

function writeClipboard(text, btn, original) {
  if (!text || !navigator.clipboard) {
    flashButton(btn, 'Copy failed', original);
    return Promise.resolve(false);
  }
  return navigator.clipboard.writeText(text)
    .then(() => { flashButton(btn, 'Copied!', original); return true; })
    .catch(() => { flashButton(btn, 'Copy failed', original); return false; });
}

// 화면 표시 여부와 관계없이 원문을 복사한다
export function copyField(index) {
  const field = state.fields[index];
  return writeClipboard(field && field.value, $id('secretModal-copy-' + index), 'Copy');
}

export function runAction(index) {
  const action = state.actions[index];
  if (!action) return Promise.resolve(false);
  let text = '';
  try {
    text = action.getText(state.fields) || '';
  } catch (e) {
    text = '';
  }
  return writeClipboard(text, $id('secretModal-action-' + (action.id || index)), action.label);
}
