/**
 * dashboard_storage.js — 사용자별 대시보드 레이아웃 저장/로드
 */

var STORAGE_PREFIX = 'dashboard_layout_';
var LAYOUT_VERSION = 1;

var DEFAULT_LAYOUT = {
  version: LAYOUT_VERSION,
  widgets: [
    { id: 'default-cpu', type: 'WIDGET-CPU', x: 0, y: 0, w: 6, h: 3,
      config: { nsId: '', mciId: '', vmId: '', measurement: 'cpu', metric: 'usage_idle', range: '1h', refreshInterval: '30s' } },
    { id: 'default-mem', type: 'WIDGET-MEM', x: 6, y: 0, w: 6, h: 3,
      config: { nsId: '', mciId: '', vmId: '', measurement: 'mem', metric: 'used_percent', range: '1h', refreshInterval: '30s' } },
    { id: 'default-net', type: 'WIDGET-NET', x: 0, y: 3, w: 12, h: 3,
      config: { nsId: '', mciId: '', vmId: '', measurement: 'net', metric: 'bytes_sent', range: '1h', refreshInterval: '30s' } },
  ],
};

export function getUserId() {
  try {
    var userInfo = webconsolejs['common/cookie/authcookie'].getUserInfo();
    return userInfo && userInfo.userId ? userInfo.userId : 'anonymous';
  } catch (e) { return 'anonymous'; }
}

function getStorageKey() { return STORAGE_PREFIX + getUserId(); }

export function saveLayout(widgetDataList) {
  try {
    var layoutData = { version: LAYOUT_VERSION, updatedAt: new Date().toISOString(), widgets: widgetDataList };
    localStorage.setItem(getStorageKey(), JSON.stringify(layoutData));
    return true;
  } catch (error) { console.error('Dashboard layout save error:', error); return false; }
}

export function loadLayout() {
  try {
    var raw = localStorage.getItem(getStorageKey());
    if (!raw) return getDefaultLayout();
    var data = JSON.parse(raw);
    if (!data || !data.widgets || !Array.isArray(data.widgets)) { localStorage.removeItem(getStorageKey()); return getDefaultLayout(); }
    return data;
  } catch (error) { console.error('Dashboard layout load error:', error); localStorage.removeItem(getStorageKey()); return getDefaultLayout(); }
}

export function clearLayout() { localStorage.removeItem(getStorageKey()); }
export function getDefaultLayout() { return JSON.parse(JSON.stringify(DEFAULT_LAYOUT)); }
export function generateWidgetId() { return 'widget-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6); }
