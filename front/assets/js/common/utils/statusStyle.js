// ===================================================================
// Status → color rules — single source of truth
// ===================================================================
// 규칙 (Infra 목록 테이블과 동일):
//   - 진행 중 상태는 "최종 목표 상태"와 같은 색으로 표시하고 라벨 끝에 "…" 를 붙인다.
//   - 빨강은 실패(failed) 전용이다. 진행 중 상태에 빨강을 쓰지 않는다.
//   - 배경은 연한 -lt 색, 글자는 같은 계열 색을 쓴다.
//
// 상태 키(Infra 포매터와 같은 어휘):
//   running / running-ing / stopped / stopped-ing /
//   terminated / terminated-ing / failed / etc / unknown
// ===================================================================

export const STATUS_KEYS = {
  RUNNING: 'running',
  RUNNING_ING: 'running-ing',
  STOPPED: 'stopped',
  STOPPED_ING: 'stopped-ing',
  TERMINATED: 'terminated',
  TERMINATED_ING: 'terminated-ing',
  FAILED: 'failed',
  ETC: 'etc',
  UNKNOWN: 'unknown',
};

const TONES = {
  green: { bgClass: 'bg-green-lt', textClass: 'text-green' },
  yellow: { bgClass: 'bg-yellow-lt', textClass: 'text-yellow' },
  muted: { bgClass: 'bg-muted-lt', textClass: 'text-muted' },
  red: { bgClass: 'bg-red-lt', textClass: 'text-red' },
  azure: { bgClass: 'bg-azure-lt', textClass: 'text-azure' },
};

// 상태 키 → 색. "-ing" 키는 목표 상태와 같은 색을 쓴다.
const KEY_TONE = {
  [STATUS_KEYS.RUNNING]: 'green',
  [STATUS_KEYS.RUNNING_ING]: 'green',
  [STATUS_KEYS.STOPPED]: 'yellow',
  [STATUS_KEYS.STOPPED_ING]: 'yellow',
  [STATUS_KEYS.TERMINATED]: 'muted',
  [STATUS_KEYS.TERMINATED_ING]: 'muted',
  [STATUS_KEYS.FAILED]: 'red',
  [STATUS_KEYS.ETC]: 'azure',
  [STATUS_KEYS.UNKNOWN]: 'muted',
};

export function isInProgressStatusKey(statusKey) {
  return typeof statusKey === 'string' && statusKey.endsWith('-ing');
}

// 상태 키 → { key, bgClass, textClass, inProgress }
export function getStatusStyle(statusKey) {
  const key = Object.prototype.hasOwnProperty.call(KEY_TONE, statusKey)
    ? statusKey
    : STATUS_KEYS.UNKNOWN;
  const tone = TONES[KEY_TONE[key]];
  return {
    key,
    bgClass: tone.bgClass,
    textClass: tone.textClass,
    inProgress: isInProgressStatusKey(key),
  };
}

// 진행 중이면 라벨 끝에 "…" 를 붙인다.
export function formatStatusLabel(label, statusKey) {
  const text = label == null ? '' : String(label);
  if (!text) return '';
  return isInProgressStatusKey(statusKey) ? text + '…' : text;
}

// ─── K8s (cb-spider Cluster / NodeGroup 상태) ────────────────────────
// Creating / Active / Inactive / Updating / Deleting
//   Creating·Updating 의 목표 상태는 Active → 초록 + "…"
//   Deleting 의 목표 상태는 삭제됨 → 회색 + "…"
//   Inactive 는 비정상 → 빨강
export function getK8sStatusKey(rawStatus) {
  const status = (rawStatus == null ? '' : String(rawStatus)).trim().toLowerCase();
  if (!status) return STATUS_KEYS.UNKNOWN;
  if (status === 'active') return STATUS_KEYS.RUNNING;
  if (status === 'inactive' || status.includes('fail') || status.includes('error')) {
    return STATUS_KEYS.FAILED;
  }
  if (status.includes('creat') || status.includes('updat') || status.includes('pending')) {
    return STATUS_KEYS.RUNNING_ING;
  }
  if (status.includes('delet') || status.includes('terminat')) {
    return status.endsWith('ing') ? STATUS_KEYS.TERMINATED_ING : STATUS_KEYS.TERMINATED;
  }
  return STATUS_KEYS.UNKNOWN;
}

// raw 상태 → { key, bgClass, textClass, inProgress, label }
export function getK8sStatusStyle(rawStatus) {
  const style = getStatusStyle(getK8sStatusKey(rawStatus));
  return { ...style, label: formatStatusLabel(rawStatus, style.key) };
}
