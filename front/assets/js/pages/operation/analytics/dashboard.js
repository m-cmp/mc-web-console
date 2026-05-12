/**
 * dashboard.js — 커스터마이징 모니터링 대시보드 메인 로직
 */

import { GridStack } from 'gridstack';
import { WIDGET_CATALOG, MAX_WIDGETS, TIME_RANGES, REFRESH_INTERVALS, getWidgetDef, getWidgetsByCategory } from '../../../common/dashboard/widget_catalog';
import { createWidgetChart, loadWidgetData, setupAutoRefresh, destroyWidget, resizeChart } from '../../../common/dashboard/widget_renderer';
import { saveLayout, loadLayout, clearLayout, getDefaultLayout, generateWidgetId } from '../../../common/dashboard/dashboard_storage';

var grid = null;
var widgetConfigs = {};
var saveDebounceTimer = null;
var currentWorkspaceProject = null;

document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
  try {
    currentWorkspaceProject = await webconsolejs['partials/layout/navbar'].workspaceProjectInit();
  } catch (e) { console.warn('Workspace init skipped:', e); }
  initGrid();
  bindEvents();
  restoreLayout();
}

function initGrid() {
  grid = GridStack.init({
    column: 12, cellHeight: 80, minRow: 1, margin: 8, float: false, animate: true,
    resizable: { handles: 'se' },
    disableOneColumnMode: false,
  }, '#dashboard-grid');
  grid.on('change', function () { debounceSave(); });
  grid.on('resizestop', function (event, el) {
    var wid = el.getAttribute('data-widget-id');
    if (wid) setTimeout(function () { resizeChart(wid); }, 100);
  });
}

function bindEvents() {
  $('#btn-add-widget, #btn-add-widget-empty').on('click', openCatalogModal);
  $('#btn-save-layout').on('click', manualSave);
  $('#btn-reset-layout').on('click', resetLayout);
  $('#catalog-category-tabs .nav-link').on('click', function (e) {
    e.preventDefault();
    filterCatalog($(this).data('category'));
  });
}

// === FR-DASHBOARD-001-01: 위젯 카탈로그 ===
export function openCatalogModal() {
  if (Object.keys(widgetConfigs).length >= MAX_WIDGETS) { showToast('warning', 'Maximum ' + MAX_WIDGETS + ' widgets allowed.'); return; }
  renderCatalog('all');
  var modal = new bootstrap.Modal(document.getElementById('widgetCatalogModal'));
  modal.show();
}

function renderCatalog(categoryFilter) {
  var $container = $('#catalog-widget-list').empty();
  var widgets = categoryFilter === 'all' ? WIDGET_CATALOG : getWidgetsByCategory(categoryFilter);
  widgets.forEach(function (w) {
    var $card = $('<div class="col-md-4 mb-3"><div class="card card-sm cursor-pointer catalog-widget-card" data-widget-type="' + w.id + '">' +
      '<div class="card-body text-center"><i class="' + w.icon + '" style="font-size:2rem;color:' + w.color + '"></i>' +
      '<h4 class="mt-2 mb-1">' + w.name + '</h4><p class="text-muted small mb-0">' + w.description + '</p></div></div></div>');
    $card.find('.catalog-widget-card').on('click', function () {
      bootstrap.Modal.getInstance(document.getElementById('widgetCatalogModal')).hide();
      openResourceSelector(w.id);
    });
    $container.append($card);
  });
}

function filterCatalog(category) {
  $('#catalog-category-tabs .nav-link').removeClass('active');
  $('#catalog-category-tabs .nav-link[data-category="' + category + '"]').addClass('active');
  renderCatalog(category);
}

// === FR-DASHBOARD-001-02: 위젯 추가 ===
function openResourceSelector(widgetTypeId) {
  $('#resource-widget-type').val(widgetTypeId);
  loadNamespaceList();
  var modal = new bootstrap.Modal(document.getElementById('resourceSelectorModal'));
  modal.show();
}

async function loadNamespaceList() {
  var $sel = $('#resource-ns-select').empty().append('<option value="">Select</option>');

  // 항상 최신 세션값에서 nsId 읽기
  var nsId = '';
  try {
    // 1순위: sessionStorage의 currentProject.NsId (navbar에서 프로젝트 선택 시 저장됨)
    var curProject = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
    if (curProject && curProject.NsId) {
      nsId = curProject.NsId;
    }
    // 2순위: navbar select box에서 직접 읽기
    if (!nsId) {
      var prjSelect = document.getElementById('select-current-project');
      if (prjSelect && prjSelect.selectedIndex > 0) {
        nsId = prjSelect.options[prjSelect.selectedIndex].text;
      }
    }
  } catch (e) { console.warn('getCurrentProject error:', e); }

  if (!nsId) {
    showToast('warning', 'Please select a workspace/project from the navbar first.');
    return;
  }

  $sel.append('<option value="' + nsId + '" selected>' + nsId + '</option>');
  await loadMciList(nsId);
}

async function loadMciList(nsId) {
  var $mciSel = $('#resource-mci-select').empty().append('<option value="">Select</option>');
  $('#resource-vm-select').empty().append('<option value="">Select</option>');
  if (!nsId) return;
  try {
    var result = await webconsolejs['common/api/services/mci_api'].getMciList(nsId);
    // getMciList returns responseData which is { infra: [...] } or array
    var mciList = Array.isArray(result) ? result : (result && result.infra ? result.infra : []);
    mciList.forEach(function (mci) {
      var id = mci.id || mci.mciId || mci.name;
      $mciSel.append('<option value="' + id + '">' + (mci.name || id) + '</option>');
    });
  } catch (e) { console.error('MCI list error:', e); }
}

$(document).on('change', '#resource-ns-select', async function () {
  await loadMciList($(this).val());
});

$(document).on('change', '#resource-mci-select', async function () {
  var nsId = $('#resource-ns-select').val(), mciId = $(this).val();
  var $vmSel = $('#resource-vm-select').empty().append('<option value="">선택</option>');
  if (!nsId || !mciId) return;
  try {
    var mciData = await webconsolejs['common/api/services/mci_api'].getMci(nsId, mciId);
    if (mciData && mciData.responseData && mciData.responseData.vm) {
      mciData.responseData.vm.forEach(function (vm) {
        var id = vm.id || vm.vmId;
        $vmSel.append('<option value="' + id + '">' + (vm.name || id) + '</option>');
      });
    }
  } catch (e) { console.error('VM list error:', e); }
});

export function confirmAddWidget() {
  var widgetTypeId = $('#resource-widget-type').val();
  var nsId = $('#resource-ns-select').val(), mciId = $('#resource-mci-select').val(), vmId = $('#resource-vm-select').val();
  if (!nsId || !mciId || !vmId) { showToast('warning', 'Please select a target resource.'); return; }
  bootstrap.Modal.getInstance(document.getElementById('resourceSelectorModal')).hide();
  var widgetDef = getWidgetDef(widgetTypeId);
  addWidgetToGrid(generateWidgetId(), widgetDef, {
    type: widgetTypeId, nsId: nsId, mciId: mciId, vmId: vmId,
    measurement: widgetDef.measurement, metric: widgetDef.defaultMetric,
    range: '1h', refreshInterval: '30s', color: widgetDef.color,
  });
}

function addWidgetToGrid(widgetId, widgetDef, config) {
  var chartId = 'chart-' + widgetId;

  var widgetHtml =
    '<div class="grid-stack-item" data-widget-id="' + widgetId + '">' +
    '<div class="grid-stack-item-content">' +
    '<div class="card h-100">' +
    '<div class="card-header" style="cursor:move;padding:0.5rem 0.75rem;">' +
    '<h3 class="card-title" style="font-size:0.85rem;"><i class="' + widgetDef.icon + '" style="color:' + widgetDef.color + '"></i> ' +
    widgetDef.name + '<small class="text-muted ms-2">' + (config.vmId || '') + '</small></h3>' +
    '<div class="card-actions">' +
    '<button class="btn btn-ghost-secondary btn-icon btn-sm widget-config-btn" data-widget-id="' + widgetId + '" title="설정"><i class="ti ti-settings"></i></button>' +
    '<button class="btn btn-ghost-danger btn-icon btn-sm widget-remove-btn" data-widget-id="' + widgetId + '" title="삭제"><i class="ti ti-x"></i></button>' +
    '</div></div>' +
    '<div class="card-body p-2" style="min-height:0;overflow:hidden;"><div id="' + chartId + '" style="width:100%;height:100%;"></div></div>' +
    '</div></div></div>';

  var el = grid.addWidget(widgetHtml, {
    w: widgetDef.defaultW, h: widgetDef.defaultH,
    minW: widgetDef.minW, minH: widgetDef.minH, maxW: 12, maxH: 6,
    id: widgetId,
  });

  widgetConfigs[widgetId] = config;

  setTimeout(function () {
    createWidgetChart(widgetId, chartId, config);
    loadWidgetData(widgetId, config);
    setupAutoRefresh(widgetId, config, config.refreshInterval);
  }, 200);

  $(el).find('.widget-remove-btn').on('click', function () { confirmRemoveWidget($(this).data('widget-id')); });
  $(el).find('.widget-config-btn').on('click', function () { openWidgetConfig($(this).data('widget-id')); });
  updateEmptyState();
  debounceSave();
}

// === FR-DASHBOARD-001-03: 위젯 제거 ===
function confirmRemoveWidget(widgetId) {
  $('#remove-widget-id').val(widgetId);
  var modal = new bootstrap.Modal(document.getElementById('confirmRemoveModal'));
  modal.show();
}

export function executeRemoveWidget() {
  var widgetId = $('#remove-widget-id').val();
  bootstrap.Modal.getInstance(document.getElementById('confirmRemoveModal')).hide();
  destroyWidget(widgetId);
  delete widgetConfigs[widgetId];
  var el = document.querySelector('.grid-stack-item[data-widget-id="' + widgetId + '"]');
  if (el) grid.removeWidget(el);
  updateEmptyState();
  debounceSave();
}

// === FR-DASHBOARD-001-04: 위젯 설정 ===
function openWidgetConfig(widgetId) {
  var config = widgetConfigs[widgetId];
  if (!config) return;
  $('#config-widget-id').val(widgetId);
  var $range = $('#config-range-select').empty();
  TIME_RANGES.forEach(function (r) { $range.append('<option value="' + r.value + '">' + r.label + '</option>'); });
  $range.val(config.range);
  var $refresh = $('#config-refresh-select').empty();
  REFRESH_INTERVALS.forEach(function (r) { $refresh.append('<option value="' + r.value + '">' + r.label + '</option>'); });
  $refresh.val(config.refreshInterval);
  var modal = new bootstrap.Modal(document.getElementById('widgetConfigModal'));
  modal.show();
}

export function applyWidgetConfig() {
  var widgetId = $('#config-widget-id').val(), config = widgetConfigs[widgetId];
  if (!config) return;
  config.range = $('#config-range-select').val();
  config.refreshInterval = $('#config-refresh-select').val();
  bootstrap.Modal.getInstance(document.getElementById('widgetConfigModal')).hide();
  loadWidgetData(widgetId, config);
  setupAutoRefresh(widgetId, config, config.refreshInterval);
  debounceSave();
  showToast('success', 'Settings applied.');
}

// === FR-DASHBOARD-002-03: 저장 ===
function debounceSave() { if (saveDebounceTimer) clearTimeout(saveDebounceTimer); saveDebounceTimer = setTimeout(executeSave, 3000); }
function manualSave() { if (saveDebounceTimer) clearTimeout(saveDebounceTimer); executeSave(); showToast('success', 'Dashboard saved.'); }
function executeSave() {
  var items = grid.getGridItems();
  var list = items.map(function (el) {
    var node = el.gridstackNode, wid = el.getAttribute('data-widget-id'), cfg = widgetConfigs[wid] || {};
    return { id: wid, type: cfg.type, x: node.x, y: node.y, w: node.w, h: node.h,
      config: { nsId: cfg.nsId, mciId: cfg.mciId, vmId: cfg.vmId, measurement: cfg.measurement, metric: cfg.metric, range: cfg.range, refreshInterval: cfg.refreshInterval } };
  });
  saveLayout(list);
}

// === FR-DASHBOARD-002-04: 로드 ===
function restoreLayout() {
  var layoutData = loadLayout();
  if (!layoutData || !layoutData.widgets || layoutData.widgets.length === 0) { updateEmptyState(); return; }
  layoutData.widgets.forEach(function (w) {
    var def = getWidgetDef(w.type);
    if (!def) return;
    addWidgetToGrid(w.id || generateWidgetId(), def, Object.assign({}, w.config || {}, { type: w.type, color: def.color }));
  });
  updateEmptyState();
}

function resetLayout() {
  if (!confirm('Reset dashboard to default layout?')) return;
  Object.keys(widgetConfigs).forEach(function (wid) { destroyWidget(wid); });
  grid.removeAll(); widgetConfigs = {}; clearLayout();
  getDefaultLayout().widgets.forEach(function (w) {
    var def = getWidgetDef(w.type);
    if (def) addWidgetToGrid(w.id, def, Object.assign({}, w.config, { type: w.type, color: def.color }));
  });
  updateEmptyState();
  showToast('success', 'Dashboard reset to default layout.');
}

function updateEmptyState() {
  if (Object.keys(widgetConfigs).length === 0) { $('#dashboard-grid').addClass('d-none'); $('#empty-dashboard').removeClass('d-none'); }
  else { $('#dashboard-grid').removeClass('d-none'); $('#empty-dashboard').addClass('d-none'); }
}

function showToast(type, message) {
  var bg = type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning' : 'bg-danger';
  var $t = $('<div class="toast show position-fixed bottom-0 end-0 m-3" role="alert" style="z-index:9999;">' +
    '<div class="toast-header ' + bg + ' text-white"><strong class="me-auto">대시보드</strong>' +
    '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button></div>' +
    '<div class="toast-body">' + message + '</div></div>');
  $('body').append($t);
  setTimeout(function () { $t.remove(); }, 3000);
}
