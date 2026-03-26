/**
 * widget_catalog.js — 모니터링 대시보드 위젯 카탈로그 정의
 * FR-DASHBOARD-001-01: 위젯 카탈로그 조회
 */

export const WIDGET_CATEGORIES = [
  { id: 'compute', name: 'Compute', icon: 'ti-cpu' },
  { id: 'storage', name: 'Storage', icon: 'ti-database' },
  { id: 'network', name: 'Network', icon: 'ti-network' },
  { id: 'etc', name: 'Etc', icon: 'ti-dots' },
];

export const WIDGET_CATALOG = [
  {
    id: 'WIDGET-CPU',
    name: 'CPU Usage',
    category: 'compute',
    measurement: 'cpu',
    defaultMetric: 'usage_idle',
    icon: 'ti-cpu',
    description: 'VM CPU usage time-series chart',
    minW: 4, minH: 3, defaultW: 6, defaultH: 3,
    color: '#206bc4',
  },
  {
    id: 'WIDGET-MEM',
    name: 'Memory Usage',
    category: 'compute',
    measurement: 'mem',
    defaultMetric: 'used_percent',
    icon: 'ti-database',
    description: 'VM memory usage time-series chart',
    minW: 4, minH: 3, defaultW: 6, defaultH: 3,
    color: '#2fb344',
  },
  {
    id: 'WIDGET-DISK',
    name: 'Disk Usage',
    category: 'storage',
    measurement: 'disk',
    defaultMetric: 'used_percent',
    icon: 'ti-device-floppy',
    description: 'Disk usage time-series chart',
    minW: 4, minH: 3, defaultW: 6, defaultH: 3,
    color: '#f76707',
  },
  {
    id: 'WIDGET-DISKIO',
    name: 'Disk I/O',
    category: 'storage',
    measurement: 'diskio',
    defaultMetric: 'read_bytes',
    icon: 'ti-arrows-transfer-down',
    description: 'Disk read/write bytes chart',
    minW: 4, minH: 3, defaultW: 6, defaultH: 3,
    color: '#d63939',
  },
  {
    id: 'WIDGET-NET',
    name: 'Network Traffic',
    category: 'network',
    measurement: 'net',
    defaultMetric: 'bytes_sent',
    icon: 'ti-network',
    description: 'Network send/receive traffic chart',
    minW: 4, minH: 3, defaultW: 12, defaultH: 3,
    color: '#ae3ec9',
  },
  {
    id: 'WIDGET-SYSLOG',
    name: 'System Log',
    category: 'compute',
    measurement: 'log',
    defaultMetric: 'syslog',
    icon: 'ti-file-text',
    description: 'VM system log viewer',
    minW: 4, minH: 3, defaultW: 6, defaultH: 3,
    color: '#0ca678',
  },
  {
    id: 'WIDGET-EVENTALARM',
    name: 'Event Alarm',
    category: 'etc',
    measurement: 'event',
    defaultMetric: 'alarm',
    icon: 'ti-bell',
    description: 'Event alarm history and notifications',
    minW: 4, minH: 3, defaultW: 6, defaultH: 3,
    color: '#e8590c',
  },
];

export const MAX_WIDGETS = 12;

export const TIME_RANGES = [
  { value: '1h', label: '1시간' },
  { value: '6h', label: '6시간' },
  { value: '24h', label: '24시간' },
  { value: '7d', label: '7일' },
];

export const REFRESH_INTERVALS = [
  { value: '10s', label: '10초', ms: 10000 },
  { value: '30s', label: '30초', ms: 30000 },
  { value: '1m', label: '1분', ms: 60000 },
  { value: '5m', label: '5분', ms: 300000 },
  { value: 'off', label: '끄기', ms: 0 },
];

export function getWidgetDef(typeId) {
  return WIDGET_CATALOG.find(w => w.id === typeId);
}

export function getWidgetsByCategory(categoryId) {
  return WIDGET_CATALOG.filter(w => w.category === categoryId);
}

export function parseRefreshInterval(interval) {
  var def = REFRESH_INTERVALS.find(r => r.value === interval);
  return def ? def.ms : 0;
}
