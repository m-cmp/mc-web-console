/**
 * Track long-running mc-infra-manager requests via console API + GetRequest.
 * Primary: GET /api/async-requests (Postgres). Fallback: sessionStorage + poll.
 */

const STORAGE_KEY = 'mcwc_async_requests';
const TOASTED_KEY = 'mcwc_async_toasted';
const POLL_MS = 2500;
const LIST_REFRESH_MS = 2000;
// Fallback-mode backstop only (sessionStorage, no server list). It means
// "stop watching", not "cancel" — nothing else resolves the job in that mode,
// so keep it generous and aligned with the server poller's TTL (1h).
// In server mode the poller owns lifecycle, so no client cutoff applies:
// a 15min cutoff mislabeled still-running EKS creations (10~20min) as timed out.
const FALLBACK_MAX_MS = 60 * 60 * 1000;
const MAX_JOBS = 20;
const RECENT_FINISH_TOAST_MS = 30 * 1000;
const TOASTED_MAX = 40;
const GET_REQUEST_URL = '/api/mc-infra-manager/GetRequest';
const LIST_URL = '/api/async-requests';
const EVENT_NAME = 'mcwc-async-request-changed';

const timers = new Map();
const listeners = new Set();
let useServer = null;
let listTimer = null;

function toastApi() {
  return webconsolejs && webconsolejs['common/utils/toast'];
}

function toastIdFor(requestId) {
  return 'async-req-' + requestId;
}

function toMillis(ts) {
  if (ts == null || ts === '') {
    return 0;
  }
  if (typeof ts === 'number') {
    return ts;
  }
  const n = Date.parse(ts);
  return Number.isNaN(n) ? 0 : n;
}

function normalizeJob(job) {
  if (!job) {
    return null;
  }
  return {
    requestId: job.requestId || job.request_id,
    operationId: job.operationId || job.operation_id || '',
    label: job.label || job.operationId || 'Request',
    status: job.status || 'Handling',
    startedAt: toMillis(job.startedAt || job.started_at) || Date.now(),
    finishedAt: job.finishedAt || job.finished_at
      ? toMillis(job.finishedAt || job.finished_at)
      : undefined,
    message: job.message || '',
    href: job.href || '',
  };
}

function loadJobsLocal() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeJob).filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}

function saveJobsLocal(jobs) {
  const handling = jobs
    .filter((j) => j.status === 'Handling')
    .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
  const finished = jobs
    .filter((j) => j.status !== 'Handling')
    .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
  const merged = handling.concat(finished).slice(0, MAX_JOBS);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

function emit(jobs) {
  const list = jobs || loadJobsLocal();
  listeners.forEach((cb) => {
    try {
      cb(list);
    } catch (e) {
      /* subscriber error ignored */
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { jobs: list } })
    );
  }
}

function upsertJobLocal(job) {
  const jobs = loadJobsLocal().filter((j) => j.requestId !== job.requestId);
  jobs.push(job);
  const saved = saveJobsLocal(jobs);
  emit(saved);
}

function stopTimer(requestId) {
  if (timers.has(requestId)) {
    clearInterval(timers.get(requestId));
    timers.delete(requestId);
  }
}

function showProgress(job) {
  const toast = toastApi();
  if (!toast || !toast.showToast) {
    return;
  }
  toast.showToast(
    toast.TOAST_TYPES ? toast.TOAST_TYPES.PROGRESS : 'progress',
    job.label + ' — in progress...',
    { id: toastIdFor(job.requestId), autohide: false }
  );
}

function finishToast(job, type, message) {
  const toast = toastApi();
  if (!toast) {
    return;
  }
  if (toast.hideToast) {
    toast.hideToast(toastIdFor(job.requestId));
  }
  if (toast.showToast) {
    const t = toast.TOAST_TYPES
      ? (type === 'success' ? toast.TOAST_TYPES.SUCCESS : toast.TOAST_TYPES.ERROR)
      : type;
    toast.showToast(t, message);
  }
}

function loadToasted() {
  try {
    const raw = sessionStorage.getItem(TOASTED_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveToasted(map) {
  const keys = Object.keys(map);
  if (keys.length > TOASTED_MAX) {
    keys.slice(0, keys.length - TOASTED_MAX).forEach((k) => delete map[k]);
  }
  try {
    sessionStorage.setItem(TOASTED_KEY, JSON.stringify(map));
  } catch (e) {
    /* storage full — dedupe degrades gracefully */
  }
}

/**
 * Terminal-status toast, at most once per requestId per tab session
 * (ledger in sessionStorage so page reloads stay silent).
 * Shows only when the transition was observed live on this page, or the job
 * finished within RECENT_FINISH_TOAST_MS (completion during navigation).
 */
function maybeFinishToast(job, status, live, message) {
  const toasted = loadToasted();
  if (toasted[job.requestId] === status) {
    return;
  }
  const recent =
    job.finishedAt && Date.now() - job.finishedAt < RECENT_FINISH_TOAST_MS;
  if (live || recent) {
    finishToast(job, status === 'Success' ? 'success' : 'error', message);
  }
  toasted[job.requestId] = status;
  saveToasted(toasted);
}

function markFinishedLocal(requestId, status, message) {
  stopTimer(requestId);
  const jobs = loadJobsLocal();
  const job = jobs.find((j) => j.requestId === requestId);
  if (!job) {
    return;
  }
  job.status = status;
  job.finishedAt = Date.now();
  if (message) {
    job.message = message;
  }
  const saved = saveJobsLocal(jobs);
  emit(saved);
  return job;
}

function maybeToastTransition(prevJobs, nextJobs) {
  const prevMap = new Map((prevJobs || []).map((j) => [j.requestId, j]));
  (nextJobs || []).forEach((job) => {
    if (job.status === 'Handling') {
      // progress toast is shown only at track() time — never on load/refresh
      return;
    }
    const prev = prevMap.get(job.requestId);
    const live = !!prev && prev.status === 'Handling';
    if (job.status === 'Success') {
      maybeFinishToast(job, 'Success', live, job.label + ' — completed');
      stopTimer(job.requestId);
      return;
    }
    if (job.status === 'Error' || job.status === 'Timeout') {
      maybeFinishToast(
        job,
        job.status,
        live,
        job.message || job.label + ' — ' + (job.status === 'Timeout' ? 'timed out' : 'failed')
      );
      stopTimer(job.requestId);
    }
  });
}

function parseJobsPayload(data) {
  // New shape: { items, total, hasMore }. Legacy shape: bare array.
  if (Array.isArray(data)) {
    const jobs = data.map(normalizeJob).filter(Boolean);
    return { jobs, total: jobs.length, hasMore: false };
  }
  if (data && Array.isArray(data.items)) {
    const jobs = data.items.map(normalizeJob).filter(Boolean);
    return {
      jobs,
      total: typeof data.total === 'number' ? data.total : jobs.length,
      hasMore: !!data.hasMore,
    };
  }
  return null;
}

async function requestJobsPage(params) {
  const http = webconsolejs && webconsolejs['common/api/http'];
  if (!http || !http.commonAPIGet) {
    return null;
  }
  const qs = [];
  if (params && params.q) {
    qs.push('q=' + encodeURIComponent(params.q));
  }
  if (params && params.offset) {
    qs.push('offset=' + encodeURIComponent(params.offset));
  }
  if (params && params.limit) {
    qs.push('limit=' + encodeURIComponent(params.limit));
  }
  const url = LIST_URL + (qs.length ? '?' + qs.join('&') : '');
  const response = await http.commonAPIGet(url);
  if (!response || response.status !== 200) {
    return null;
  }
  const data =
    (response.data && response.data.responseData) ||
    (response.data && response.data.data) ||
    response.data;
  return parseJobsPayload(data);
}

async function fetchServerJobs() {
  const page = await requestJobsPage(null);
  return page ? page.jobs : null;
}

async function refreshFromServer() {
  try {
    const jobs = await fetchServerJobs();
    if (jobs == null) {
      if (useServer === true) {
        // transient failure — keep server mode
        return;
      }
      useServer = false;
      return;
    }
    const prev = useServer === true ? (window.__mcwcAsyncJobsCache || []) : loadJobsLocal();
    useServer = true;
    window.__mcwcAsyncJobsCache = jobs;
    maybeToastTransition(prev, jobs);
    emit(jobs);
    // still poll GetRequest for Handling toast progress when server list lags
    jobs.filter((j) => j.status === 'Handling').forEach((job) => {
      if (!timers.has(job.requestId)) {
        startPolling(job);
      }
    });
    // Nothing in flight (server list has no Handling job and no active GetRequest
    // poll — the timers guard covers the gap between track() and the server row
    // appearing): stop the list interval. track() restarts it on the next request.
    if (!jobs.some((j) => j.status === 'Handling') && timers.size === 0) {
      stopListRefresh();
    }
  } catch (e) {
    if (useServer !== true) {
      useServer = false;
    }
  }
}

function stopListRefresh() {
  if (listTimer) {
    clearInterval(listTimer);
    listTimer = null;
  }
}

function ensureListRefresh() {
  if (listTimer) {
    return;
  }
  listTimer = setInterval(function () {
    if (useServer === false) {
      // fallback mode has no server list — per-request GetRequest timers
      // handle progress and stop on their own
      stopListRefresh();
      return;
    }
    refreshFromServer();
  }, LIST_REFRESH_MS);
}

async function pollOnce(job) {
  try {
    const response = await webconsolejs['common/api/http'].commonAPIPost(
      GET_REQUEST_URL,
      { pathParams: { reqId: job.requestId } },
      undefined,
      { loaderType: 'none' }
    );

    const statusCode = response && response.status;
    const details =
      (response && response.data && response.data.responseData) ||
      (response && response.data) ||
      {};
    const status = details.status || details.Status;

    if (status === 'Success' || status === 'success') {
      const msg = job.label + ' — completed';
      maybeFinishToast(job, 'Success', true, msg);
      if (useServer) {
        stopTimer(job.requestId);
        refreshFromServer();
      } else {
        markFinishedLocal(job.requestId, 'Success', msg);
      }
      return;
    }
    if (status === 'Error' || status === 'error') {
      const errMsg = details.errorResponse || details.ErrorResponse || 'failed';
      const msg = job.label + ' — ' + errMsg;
      maybeFinishToast(job, 'Error', true, msg);
      if (useServer) {
        stopTimer(job.requestId);
        refreshFromServer();
      } else {
        markFinishedLocal(job.requestId, 'Error', msg);
      }
      return;
    }

    if (statusCode === 404 || (response && response.response && response.response.status === 404)) {
      return;
    }
  } catch (e) {
    // network blip — keep polling until timeout
  }
}

function startPolling(job) {
  if (timers.has(job.requestId)) {
    return;
  }
  const tick = () => {
    const current = (useServer ? (window.__mcwcAsyncJobsCache || []) : loadJobsLocal())
      .find((j) => j.requestId === job.requestId);
    if (!current || current.status !== 'Handling') {
      stopTimer(job.requestId);
      return;
    }
    // Server mode: the server poller decides terminal status. Giving up here
    // would both mislabel a running job and thrash the timer — refreshFromServer
    // re-arms startPolling every 2s while the job is still Handling.
    if (useServer !== true && Date.now() - current.startedAt > FALLBACK_MAX_MS) {
      const msg = current.label + ' — status check timed out';
      maybeFinishToast(current, 'Timeout', true, msg);
      markFinishedLocal(current.requestId, 'Timeout', msg);
      stopTimer(job.requestId);
      return;
    }
    pollOnce(current);
  };
  timers.set(job.requestId, setInterval(tick, DEFAULT_POLL_MS()));
  tick();
}

function DEFAULT_POLL_MS() {
  return POLL_MS;
}

/**
 * Register async tracking for a requestId already (or about to be) sent.
 */
export function track(opts) {
  const requestId = opts.requestId;
  if (!requestId) {
    return;
  }
  const job = {
    requestId,
    operationId: opts.operationId || '',
    label: opts.label || opts.operationId || 'Request',
    startedAt: Date.now(),
    status: 'Handling',
    href: opts.href || '',
  };
  showProgress(job);
  if (useServer !== true) {
    upsertJobLocal(job);
  } else {
    const cache = window.__mcwcAsyncJobsCache || [];
    const next = cache.filter((j) => j.requestId !== requestId).concat([job]);
    window.__mcwcAsyncJobsCache = next;
    emit(next);
  }
  startPolling(job);
  ensureListRefresh();
  refreshFromServer();
}

/**
 * One-shot server list refresh — used by the navbar dropdown on open so the
 * list stays current even while interval polling is stopped.
 */
export function refreshNow() {
  return refreshFromServer();
}

/**
 * History/search page fetch for the dropdown ({q, offset, limit} →
 * {jobs, total, hasMore}). Never touches the live cache, toasts, or polling
 * timers. Falls back to filtering/slicing the sessionStorage jobs when the
 * server list is unavailable.
 */
export async function fetchJobsPage(opts) {
  const params = opts || {};
  if (useServer !== false) {
    const page = await requestJobsPage(params);
    if (page) {
      return page;
    }
    if (useServer === true) {
      // transient server failure — empty page, caller keeps current view
      return { jobs: [], total: 0, hasMore: false };
    }
  }
  const q = String(params.q || '').toLowerCase();
  const all = loadJobsLocal().filter((j) => {
    if (!q) {
      return true;
    }
    return [j.label, j.operationId, j.requestId, j.status, j.message].some(
      (v) => String(v || '').toLowerCase().indexOf(q) !== -1
    );
  });
  const offset = params.offset > 0 ? params.offset : 0;
  const limit = params.limit > 0 ? params.limit : 20;
  const jobs = all.slice(offset, offset + limit);
  return {
    jobs,
    total: all.length,
    hasMore: offset + jobs.length < all.length,
  };
}

export function resume() {
  ensureListRefresh();
  refreshFromServer().then(function () {
    if (useServer) {
      return;
    }
    const jobs = loadJobsLocal();
    jobs.filter((j) => j.status === 'Handling').forEach((job) => {
      // no progress re-toast on load — badge/list carry in-flight state
      startPolling(job);
    });
    emit(jobs);
  });
}

export function listJobs() {
  if (useServer && window.__mcwcAsyncJobsCache) {
    return window.__mcwcAsyncJobsCache;
  }
  return loadJobsLocal();
}

export function getHandlingCount() {
  return listJobs().filter((j) => j.status === 'Handling').length;
}

export function subscribe(cb) {
  if (typeof cb !== 'function') {
    return function noop() {};
  }
  listeners.add(cb);
  cb(listJobs());
  return function unsubscribe() {
    listeners.delete(cb);
  };
}

export async function clearFinished() {
  if (useServer) {
    try {
      await axiosDelete(LIST_URL + '?finished=1');
      await refreshFromServer();
      return;
    } catch (e) {
      /* fall through */
    }
  }
  const saved = saveJobsLocal(loadJobsLocal().filter((j) => j.status === 'Handling'));
  emit(saved);
}

export async function dismiss(requestId) {
  stopTimer(requestId);
  if (useServer) {
    try {
      await axiosDelete(LIST_URL + '/' + encodeURIComponent(requestId));
      await refreshFromServer();
      return;
    } catch (e) {
      /* fall through */
    }
  }
  const saved = saveJobsLocal(loadJobsLocal().filter((j) => j.requestId !== requestId));
  emit(saved);
}

async function axiosDelete(url) {
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error('DELETE ' + url + ' failed: ' + response.status);
  }
  return response;
}

export const ASYNC_REQUEST_EVENT = EVENT_NAME;

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resume);
  } else {
    setTimeout(resume, 0);
  }
}
