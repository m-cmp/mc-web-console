/**
 * Navbar notification dropdown bound to asyncRequestTracker jobs.
 *
 * Two view modes share the same list element:
 * - live view: tracker subscription (first page) + older history appended
 *   via "Load more" (fetchJobsPage — never touches the live cache/timers)
 * - search view: server-side keyword search owns the list; the subscription
 *   only refreshes the badge so results are not overwritten mid-typing
 */

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

function tracker() {
  return webconsolejs && webconsolejs['common/api/asyncRequestTracker'];
}

function statusDotClass(status) {
  if (status === 'Handling') {
    return 'status-dot status-dot-animated bg-azure d-block';
  }
  if (status === 'Success') {
    return 'status-dot bg-green d-block';
  }
  if (status === 'Error' || status === 'Timeout') {
    return 'status-dot bg-red d-block';
  }
  return 'status-dot d-block';
}

/**
 * UI labels: never show "Success" (ambiguous with request acceptance).
 */
function statusPhrase(status) {
  if (status === 'Handling') {
    return 'In progress';
  }
  if (status === 'Success') {
    return 'Completed';
  }
  if (status === 'Timeout') {
    return 'Timed out';
  }
  if (status === 'Error') {
    return 'Failed';
  }
  return status || '';
}

function formatTime(ts) {
  if (!ts) {
    return '';
  }
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleTimeString();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSubtitleLines(job) {
  const line1 = [];
  if (job.startedAt) {
    line1.push('Requested ' + formatTime(job.startedAt));
  }
  if (job.requestId) {
    line1.push(job.requestId);
  }

  const line2 = [];
  if (job.status !== 'Handling' && job.finishedAt) {
    line2.push('Finished ' + formatTime(job.finishedAt));
  }
  if (job.status !== 'Handling' && job.message) {
    const shortMsg = String(job.message).replace(/^.*?—\s*/, '');
    if (shortMsg && shortMsg !== 'completed') {
      line2.push(shortMsg);
    }
  }

  return {
    line1: line1.join(' · '),
    line2: line2.join(' · '),
  };
}

let lastRenderKey = '';
let liveJobs = [];
let extraJobs = [];
let extraHasMore = null; // null = unknown until the first Load more round-trip
let viewQuery = '';
let searchJobs = [];
let searchHasMore = false;
let searchSeq = 0;
let searchDebounce = null;

function jobsRenderKey(jobs) {
  return JSON.stringify(
    (jobs || []).map((j) => [
      j.requestId,
      j.status,
      j.label,
      j.startedAt,
      j.finishedAt,
      j.message || '',
    ]),
  );
}

function updateBadge(jobs) {
  const badgeEl = document.getElementById('async-request-notif-badge');
  if (!badgeEl) {
    return;
  }
  const handling = (jobs || []).filter((j) => j.status === 'Handling').length;
  if (handling > 0) {
    badgeEl.textContent = String(handling);
    badgeEl.classList.remove('d-none');
  } else {
    badgeEl.textContent = '';
    badgeEl.classList.add('d-none');
  }
}

function setMoreVisible(visible) {
  const moreWrap = document.getElementById('async-request-notif-more-wrap');
  if (!moreWrap) {
    return;
  }
  moreWrap.classList.toggle('d-none', !visible);
}

function mergeLiveAndExtra() {
  const seen = new Set((liveJobs || []).map((j) => j.requestId));
  return (liveJobs || []).concat(
    (extraJobs || []).filter((j) => !seen.has(j.requestId))
  );
}

function renderList(jobs, emptyText) {
  const listEl = document.getElementById('async-request-notif-list');
  const emptyEl = document.getElementById('async-request-notif-empty');
  if (!listEl) {
    return;
  }

  // Skip DOM rewrite when content unchanged — preserves text selection / drag-copy
  const key = viewQuery + '|' + jobsRenderKey(jobs);
  if (key === lastRenderKey) {
    return;
  }
  // Defer rewrite while user is selecting text inside the menu
  try {
    const sel = window.getSelection && window.getSelection();
    const menu = document.getElementById('async-request-notif-menu');
    if (
      sel &&
      sel.rangeCount > 0 &&
      String(sel).length > 0 &&
      menu &&
      menu.contains(sel.anchorNode)
    ) {
      return;
    }
  } catch (e) {
    // ignore selection probe errors
  }
  lastRenderKey = key;

  if (!jobs || jobs.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) {
      emptyEl.textContent = emptyText;
      emptyEl.classList.remove('d-none');
    }
    return;
  }
  if (emptyEl) {
    emptyEl.classList.add('d-none');
  }

  listEl.innerHTML = jobs
    .map((job) => {
      const title = escapeHtml(job.label || job.operationId || 'Request');
      const st = statusPhrase(job.status);
      const { line1, line2 } = buildSubtitleLines(job);
      const subHtml =
        (line1
          ? '<div class="d-block text-secondary small text-wrap user-select-auto">' +
            escapeHtml(line1) +
            '</div>'
          : '') +
        (line2
          ? '<div class="d-block text-secondary small text-wrap user-select-auto">' +
            escapeHtml(line2) +
            '</div>'
          : '');
      return (
        '<div class="list-group-item user-select-auto" data-request-id="' +
        escapeHtml(job.requestId) +
        '">' +
        '<div class="row align-items-center">' +
        '<div class="col-auto"><span class="' +
        statusDotClass(job.status) +
        '" title="' +
        escapeHtml(st) +
        '"></span></div>' +
        '<div class="col text-break">' +
        '<span class="text-body d-block text-truncate">' +
        title +
        ' <span class="text-secondary small">· ' +
        escapeHtml(st) +
        '</span></span>' +
        subHtml +
        '</div>' +
        '<div class="col-auto">' +
        '<a href="#" class="list-group-item-actions async-request-dismiss" ' +
        'data-request-id="' +
        escapeHtml(job.requestId) +
        '" title="Dismiss">' +
        '<svg xmlns="http://www.w3.org/2000/svg" class="icon text-muted" width="24" height="24" ' +
        'viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" ' +
        'stroke-linecap="round" stroke-linejoin="round">' +
        '<path stroke="none" d="M0 0h24v24H0z" fill="none"/>' +
        '<path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg></a>' +
        '</div></div></div>'
      );
    })
    .join('');
}

function renderLiveView() {
  const merged = mergeLiveAndExtra();
  renderList(merged, 'No request history');
  // Unknown until fetched: a full page on screen suggests older history
  const maybeMore = extraHasMore === null && merged.length >= PAGE_SIZE;
  setMoreVisible(extraHasMore === true || maybeMore);
}

function renderSearchView() {
  renderList(searchJobs, 'No matching notifications');
  setMoreVisible(searchHasMore);
}

function onJobsUpdate(jobs) {
  liveJobs = jobs || [];
  updateBadge(liveJobs);
  if (viewQuery) {
    // search view owns the list — badge only
    return;
  }
  renderLiveView();
}

function runSearch(query) {
  const t = tracker();
  if (!t || !t.fetchJobsPage) {
    return;
  }
  searchSeq += 1;
  const seq = searchSeq;
  t.fetchJobsPage({ q: query, offset: 0, limit: PAGE_SIZE }).then((page) => {
    if (seq !== searchSeq || viewQuery !== query || !page) {
      return;
    }
    searchJobs = page.jobs || [];
    searchHasMore = !!page.hasMore;
    renderSearchView();
  });
}

function loadMore() {
  const t = tracker();
  if (!t || !t.fetchJobsPage) {
    return;
  }
  if (viewQuery) {
    const query = viewQuery;
    t.fetchJobsPage({
      q: query,
      offset: searchJobs.length,
      limit: PAGE_SIZE,
    }).then((page) => {
      if (viewQuery !== query || !page) {
        return;
      }
      const seen = new Set(searchJobs.map((j) => j.requestId));
      searchJobs = searchJobs.concat(
        (page.jobs || []).filter((j) => !seen.has(j.requestId))
      );
      searchHasMore = !!page.hasMore;
      renderSearchView();
    });
    return;
  }
  const merged = mergeLiveAndExtra();
  t.fetchJobsPage({ offset: merged.length, limit: PAGE_SIZE }).then((page) => {
    if (viewQuery || !page) {
      return;
    }
    const seen = new Set(merged.map((j) => j.requestId));
    extraJobs = extraJobs.concat(
      (page.jobs || []).filter((j) => !seen.has(j.requestId))
    );
    extraHasMore = !!page.hasMore;
    renderLiveView();
  });
}

function onSearchInput(value) {
  if (searchDebounce) {
    clearTimeout(searchDebounce);
  }
  searchDebounce = setTimeout(() => {
    const query = String(value || '').trim();
    if (query === viewQuery) {
      return;
    }
    viewQuery = query;
    if (!query) {
      searchJobs = [];
      searchHasMore = false;
      renderLiveView();
      return;
    }
    runSearch(query);
  }, SEARCH_DEBOUNCE_MS);
}

function refreshCurrentView() {
  if (viewQuery) {
    runSearch(viewQuery);
    return;
  }
  renderLiveView();
}

function bindActions() {
  const clearBtn = document.getElementById('async-request-notif-clear');
  if (clearBtn && !clearBtn.dataset.bound) {
    clearBtn.dataset.bound = '1';
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const t = tracker();
      if (t && t.clearFinished) {
        Promise.resolve(t.clearFinished()).then(() => {
          extraJobs = [];
          extraHasMore = null;
          refreshCurrentView();
        });
      }
    });
  }

  const toggleEl = document.getElementById('async-request-notif-toggle');
  if (toggleEl && !toggleEl.dataset.refreshBound) {
    toggleEl.dataset.refreshBound = '1';
    // Interval polling stops while nothing is in flight — refresh once on open
    // so the list reflects jobs started elsewhere (other tabs/sessions)
    toggleEl.addEventListener('show.bs.dropdown', () => {
      const t = tracker();
      if (t && t.refreshNow) {
        t.refreshNow();
      }
      if (viewQuery) {
        runSearch(viewQuery);
      }
    });
  }

  const menuEl = document.getElementById('async-request-notif-menu');
  if (menuEl && !menuEl.dataset.selectBound) {
    menuEl.dataset.selectBound = '1';
    // Keep dropdown open while selecting text (mouseup may land outside)
    menuEl.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
  }

  const searchEl = document.getElementById('async-request-notif-search');
  if (searchEl && !searchEl.dataset.bound) {
    searchEl.dataset.bound = '1';
    searchEl.addEventListener('input', (e) => {
      onSearchInput(e.target.value);
    });
  }

  const moreBtn = document.getElementById('async-request-notif-more');
  if (moreBtn && !moreBtn.dataset.bound) {
    moreBtn.dataset.bound = '1';
    moreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      loadMore();
    });
  }

  const listEl = document.getElementById('async-request-notif-list');
  if (listEl && !listEl.dataset.bound) {
    listEl.dataset.bound = '1';
    listEl.addEventListener('click', (e) => {
      const dismiss = e.target.closest('.async-request-dismiss');
      if (!dismiss) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const id = dismiss.getAttribute('data-request-id');
      const t = tracker();
      if (t && t.dismiss && id) {
        Promise.resolve(t.dismiss(id)).then(() => {
          extraJobs = extraJobs.filter((j) => j.requestId !== id);
          refreshCurrentView();
        });
      }
    });
  }
}

export function initAsyncRequestNotify() {
  bindActions();
  const t = tracker();
  if (t && t.subscribe) {
    t.subscribe(onJobsUpdate);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAsyncRequestNotify);
  } else {
    setTimeout(initAsyncRequestNotify, 0);
  }
}
