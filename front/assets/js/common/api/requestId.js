/**
 * Generate client X-Request-ID for mc-infra-manager (cb-tumblebug) RequestMap.
 * Format: mcwc-{yyyyMMddHHmmss}-{8hex}
 *
 * ASYNC_TRACK_OPERATION_IDS: GetRequest toast/navbar allowlist
 * (WEB-TECH-017 Phase1 create + Phase2 Control/Delete/NodeGroup)
 */

/** @type {readonly string[]} */
export const ASYNC_TRACK_OPERATION_IDS = Object.freeze([
  // Phase 1 — create
  'PostInfraDynamic',
  'PostInfraDynamicFromTemplate',
  'PostK8sClusterDynamic',
  'PostK8sCluster',
  // Expert 모드(WEB-TECH-052) — 비-dynamic이지만 동일한 fire-and-forget +
  // async-requests 폴링 패턴을 쓴다. PostInfra/PostInfraNode는 완전 동기 API라
  // (노드 생성이 끝날 때까지 응답하지 않음) 응답을 직접 기다리면 브라우저가
  // navigate와 함께 요청을 끊어버린다 — 허용목록에 넣어 cb-tumblebug 자체의
  // reqID 기반 진행상황 폴링(api/의 async_request_poller)으로 완료를 추적한다.
  'PostInfra',
  'PostInfraNode',
  // Phase 2 — nodegroup / scale
  'PostInfraNodeGroupDynamic',
  'PostInfraNodeGroupScaleOut',
  'PostK8sNodeGroupDynamic',
  'PostK8sNodeGroup',
  // Phase 2 — nodegroup autoscaling
  'PutSetK8sNodeGroupAutoscaling',
  'PutChangeK8sNodeGroupAutoscaleSize',
  // Phase 2 — control
  'GetControlInfra',
  'GetControlInfraNode',
  'PostInfraNodeSnapshot',
  // Phase 2 — delete
  'DelInfra',
  'DelInfraNode',
  'Deletek8scluster',
  'DeleteK8sNodeGroup',
]);

function pad(n, width) {
  const s = String(n);
  return s.length >= width ? s : ('0'.repeat(width - s.length) + s);
}

function formatTimestamp(date) {
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1, 2) +
    pad(date.getDate(), 2) +
    pad(date.getHours(), 2) +
    pad(date.getMinutes(), 2) +
    pad(date.getSeconds(), 2)
  );
}

function randomHex8() {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => pad(b.toString(16), 2)).join('');
}

/**
 * @returns {string} requestId for x-request-id header
 */
export function generateRequestId() {
  return 'mcwc-' + formatTimestamp(new Date()) + '-' + randomHex8();
}

export function xRequestIdHeaders(requestId) {
  return { 'x-request-id': requestId };
}

export function isAsyncTrackOperation(operationId) {
  return ASYNC_TRACK_OPERATION_IDS.indexOf(operationId) !== -1;
}

/**
 * Mint requestId, register tracker (allowlist only), return http options.
 *
 * @param {string} operationId - tumblebug / api.yaml operationId
 * @param {string} [label] - navbar / toast label
 * @returns {{ requestId: string, headers: Object, httpOptions: Object }}
 */
export function beginTrackedRequest(operationId, label, meta) {
  const requestId = generateRequestId();
  const headers = xRequestIdHeaders(requestId);
  const resolvedLabel = label || operationId;
  if (resolvedLabel) {
    headers['x-mcwc-label'] = resolvedLabel;
  }
  if (meta && meta.href) {
    headers['x-mcwc-href'] = meta.href;
  }
  if (meta && meta.nsId) {
    headers['x-mcwc-ns-id'] = meta.nsId;
  }
  if (isAsyncTrackOperation(operationId)) {
    const tracker = webconsolejs && webconsolejs['common/api/asyncRequestTracker'];
    if (tracker && typeof tracker.track === 'function') {
      tracker.track({
        requestId: requestId,
        operationId: operationId,
        label: resolvedLabel,
        href: (meta && meta.href) || '',
      });
    }
  }
  return {
    requestId: requestId,
    headers: headers,
    httpOptions: { loaderType: 'none', headers: headers },
  };
}
