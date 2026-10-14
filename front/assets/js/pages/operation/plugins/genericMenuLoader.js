/**
 * WEB-FIX-002: generic iframe loader
 * menuId → IAM 메뉴 메타(frameworkService/path) + getapihosts → iframe src
 */

function getCommonIframePostData() {
  const currentWorkspace = webconsolejs['common/api/services/workspace_api'].getCurrentWorkspace();
  const currentProject = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  const accessToken = webconsolejs['common/storage/sessionstorage'].getSessionCurrentUserToken();

  return {
    accessToken: accessToken,
    workspaceInfo: {
      id: currentWorkspace?.Id,
      name: currentWorkspace?.Name,
    },
    projectInfo: {
      id: currentProject?.Id,
      ns_id: currentProject?.NsId,
      name: currentProject?.Name,
    },
    requestOperationId: '',
  };
}

function findMenuInTree(nodes, menuId) {
  if (!Array.isArray(nodes)) return null;
  for (const node of nodes) {
    if (node.id === menuId) return node;
    const nested = node.menus || node.children;
    if (nested && nested.length) {
      const found = findMenuInTree(nested, menuId);
      if (found) return found;
    }
  }
  return null;
}

function normalizePath(path) {
  if (path == null || path === '') return '/';
  return path.startsWith('/') ? path : '/' + path;
}

/** getapihosts BaseURL + menu path (BaseURL trailing / 와 path 조합) */
export function joinFrameworkUrl(baseUrl, path) {
  const p = normalizePath(path);
  if (!baseUrl) return p;
  try {
    const u = new URL(baseUrl);
    if (p === '/') {
      return baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    }
    // BaseURL pathname 이 / 만이면 origin + path
    const basePath = u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '');
    return u.origin + basePath + p;
  } catch {
    const base = baseUrl.replace(/\/$/, '');
    return p === '/' ? base + '/' : base + p;
  }
}

/**
 * @param {string} menuId
 * @param {string} targetDivId
 * @param {object} [opts]
 * @param {string} [opts.frameworkService] menu 메타 없을 때 폴백
 * @param {string} [opts.path]
 * @param {string} [opts.apiFrameworkService] swcatalogs 용 apiBaseUrl
 */
export async function loadByMenuId(menuId, targetDivId, opts = {}) {
  const targetDiv = document.getElementById(targetDivId);
  if (!targetDiv) {
    console.error('[genericMenuLoader] target div not found:', targetDivId);
    return;
  }

  const currentWorkspace = webconsolejs['common/api/services/workspace_api'].getCurrentWorkspace();
  const currentProject = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  if (!currentWorkspace?.Id || !currentProject?.Id) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">Please select a Workspace and Project.</div>';
    return;
  }

  const tree = webconsolejs['common/storage/localstorage'].getMenuLocalStorage() || [];
  const menu = findMenuInTree(tree, menuId) || {};
  // opts는 페이지가 전달하는 known-good 메타(WEB-BUG-037) — 메뉴 시드 DB 기본값보다 우선한다.
  const frameworkService =
    opts.frameworkService || menu.frameworkService || '';
  const path = opts.path ?? (menu.path != null && menu.path !== '' ? menu.path : '/');

  if (!frameworkService) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">Menu resource metadata missing (frameworkService).<br>' +
      'menuId=' + menuId + '</div>';
    return;
  }

  const host = await webconsolejs['common/iframe/iframe'].GetApiHosts(frameworkService);
  if (!host) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">' + frameworkService +
      ' service URL not found.<br>Please register it in Settings &gt; Environment.</div>';
    return;
  }

  const data = getCommonIframePostData();
  const apiFw = opts.apiFrameworkService ||
    (frameworkService === 'mc-application-manager-fe' ? 'mc-application-manager' : null);
  if (apiFw) {
    const apiHost = await webconsolejs['common/iframe/iframe'].GetApiHosts(apiFw);
    if (apiHost) data.apiBaseUrl = apiHost;
  }

  const src = joinFrameworkUrl(host, path);
  targetDiv.innerHTML = '';
  webconsolejs['common/iframe/iframe'].addIframe(targetDivId, src, data);
}

export function resolveMenuIdFromLocation() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('_view');
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  const el = document.getElementById('genericMenuIframe');
  return el?.dataset?.menuId || null;
}

async function bootGenericView() {
  const menuId = resolveMenuIdFromLocation();
  if (!menuId) return;
  await loadByMenuId(menuId, 'genericMenuIframe');
}

$('#select-current-project').on('change', async function () {
  const project = {
    Id: this.value,
    Name: this.options[this.selectedIndex].text,
    NsId: this.options[this.selectedIndex].text,
  };
  webconsolejs['common/api/services/workspace_api'].setCurrentProject(project);
  const menuId = resolveMenuIdFromLocation();
  if (menuId && document.getElementById('genericMenuIframe')) {
    await loadByMenuId(menuId, 'genericMenuIframe');
  }
});

document.addEventListener('DOMContentLoaded', async function () {
  if (document.getElementById('genericMenuIframe')) {
    await bootGenericView();
  }
});
