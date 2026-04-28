/**
 * widget_renderer.js — ApexCharts 기반 위젯 렌더링
 */

import ApexCharts from "apexcharts";
import { parseRefreshInterval } from "./widget_catalog";

var chartInstances = {};
var refreshTimers = {};

export function createWidgetChart(widgetId, containerId, config) {
  var el = document.querySelector('#' + containerId);
  if (!el) return null;

  // 컨테이너의 실제 높이를 픽셀로 계산 (부모 grid-stack-item 기준)
  var gridItem = el.closest('.grid-stack-item');
  var cardHeader = gridItem ? gridItem.querySelector('.card-header') : null;
  var itemHeight = gridItem ? gridItem.offsetHeight : 240;
  var headerHeight = cardHeader ? cardHeader.offsetHeight : 40;
  var chartHeight = Math.max(itemHeight - headerHeight - 16, 100); // 16px = padding

  var options = {
    chart: {
      type: 'area',
      height: chartHeight,
      toolbar: { show: true, tools: { download: true, zoom: true, zoomin: true, zoomout: true, pan: false, reset: true } },
      animations: { enabled: false },
      parentHeightOffset: 0,
    },
    series: [],
    xaxis: { type: 'datetime', labels: { format: 'HH:mm:ss' } },
    yaxis: { labels: { formatter: function (val) { return val !== null && val !== undefined ? val.toFixed(2) : ''; } } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    colors: [config.color || '#206bc4'],
    tooltip: { theme: 'dark', x: { format: 'yyyy-MM-dd HH:mm:ss' } },
    grid: { strokeDashArray: 4, padding: { top: 0, right: 10, bottom: 0, left: 10 } },
    noData: { text: '데이터 로딩 중...', align: 'center', verticalAlign: 'middle',
      style: { fontSize: '14px', color: '#888' } },
  };

  var chart = new ApexCharts(el, options);
  chart.render();
  chartInstances[widgetId] = chart;
  return chart;
}

export async function loadWidgetData(widgetId, config) {
  var chart = chartInstances[widgetId];
  if (!chart) return;

  try {
    var data = {
      pathParams: { nsId: config.nsId, mciId: config.mciId, vmId: config.vmId },
      Request: {
        measurement: config.measurement,
        range: config.range || '1h',
        group_time: '1m',
        group_by: ['vm_id'],
        limit: 20,
        fields: [{ function: 'mean', field: config.metric }],
        conditions: [],
      },
    };

    var controller = '/api/mc-observability/GetMetricsByVMId';
    var response = await webconsolejs['common/api/http'].commonAPIPost(controller, data);

    if (response && response.data && response.data.responseData) {
      var seriesData = transformMetricData(response.data.responseData, config.metric);
      chart.updateSeries(seriesData);
    } else {
      chart.updateOptions({ noData: { text: '데이터 없음' } });
    }
  } catch (error) {
    console.error('Widget data load error:', widgetId, error);
    chart.updateOptions({ noData: { text: '데이터 조회 실패' } });
  }
}

function transformMetricData(responseData, metricField) {
  if (!responseData || !responseData.data) return [];
  var dataMap = {};
  if (Array.isArray(responseData.data)) {
    responseData.data.forEach(function (item) {
      var vmId = item.vm_id || 'default';
      if (!dataMap[vmId]) dataMap[vmId] = [];
      dataMap[vmId].push({ x: new Date(item.time).getTime(), y: item[metricField] !== undefined ? item[metricField] : null });
    });
  }
  var series = [];
  Object.keys(dataMap).forEach(function (vmId) { series.push({ name: vmId, data: dataMap[vmId] }); });
  return series.length > 0 ? series : [{ name: metricField, data: [] }];
}

export function setupAutoRefresh(widgetId, config, intervalValue) {
  clearAutoRefresh(widgetId);
  var ms = parseRefreshInterval(intervalValue);
  if (ms > 0) {
    refreshTimers[widgetId] = setInterval(function () { loadWidgetData(widgetId, config); }, ms);
  }
}

export function clearAutoRefresh(widgetId) {
  if (refreshTimers[widgetId]) { clearInterval(refreshTimers[widgetId]); delete refreshTimers[widgetId]; }
}

export function destroyWidget(widgetId) {
  clearAutoRefresh(widgetId);
  if (chartInstances[widgetId]) { chartInstances[widgetId].destroy(); delete chartInstances[widgetId]; }
}

export function resizeChart(widgetId) {
  var chart = chartInstances[widgetId];
  if (!chart) return;
  // 리사이즈 후 새로운 높이 계산
  var chartEl = chart.el;
  if (chartEl) {
    var gridItem = chartEl.closest('.grid-stack-item');
    var cardHeader = gridItem ? gridItem.querySelector('.card-header') : null;
    var itemHeight = gridItem ? gridItem.offsetHeight : 240;
    var headerHeight = cardHeader ? cardHeader.offsetHeight : 40;
    var newHeight = Math.max(itemHeight - headerHeight - 16, 100);
    chart.updateOptions({ chart: { height: newHeight } }, false, false);
  }
}
