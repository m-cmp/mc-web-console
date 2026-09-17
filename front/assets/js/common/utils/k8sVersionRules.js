// ===================================================================
// K8s Cluster Version Rules — 목록 밖 버전 입력과 CSP 거부 응답 해석
// ===================================================================
// cb-tumblebug 의 가용 버전 목록(assets/k8sclusterinfo.yaml)은 손으로 관리하는
// 정적 목록이라 CSP 가 패치 버전을 올리면 곧바로 어긋난다. 목록 전체가 CSP 허용
// 버전과 맞지 않으면(Alibaba 사례) 콘솔에서는 어떤 항목을 골라도 생성이 실패하고,
// 목록 밖 값을 고를 방법이 없어 사용자에게 우회 수단이 남지 않는다.
//
// cb-tumblebug 은 이를 위해 skipVersionCheck 쿼리 파라미터를 제공한다
// (POST /ns/{nsId}/k8sCluster, POST /ns/{nsId}/k8sClusterDynamic).
// true 면 tumblebug 이 정적 목록 대조를 건너뛰고 요청 버전을 CSP 로 그대로 넘긴다.
//
// 이 모듈은 두 가지를 맡는다.
//   1. 입력 버전이 조회 목록 밖일 때만 skipVersionCheck 를 붙인다
//      (무조건 붙이면 전 CSP 에서 오타 방어가 사라진다)
//   2. CSP 가 버전을 거부했을 때 응답에 실려 오는 허용 버전 목록을 뽑아
//      사용자가 다시 시도할 수 있는 문구로 만든다
// ===================================================================

// 조회 응답은 [{name, id}] 형태지만, 호출부에 따라 문자열 배열이 올 수도 있다
function toVersionIds(availableVersions) {
  if (!Array.isArray(availableVersions)) {
    return [];
  }
  return availableVersions
    .map((v) => (typeof v === 'string' ? v : v && v.id))
    .filter((id) => typeof id === 'string' && id !== '');
}

/**
 * 입력 버전이 tumblebug 이 내려준 목록 안에 있는가.
 * 목록이 비어 있으면(조회 실패, 해당 provider/region 항목 없음) 아는 버전이 없는 것이므로 false.
 */
export function isKnownVersion(version, availableVersions) {
  const ids = toVersionIds(availableVersions);
  if (!version || ids.length === 0) {
    return false;
  }
  return ids.some((id) => id.toLowerCase() === String(version).toLowerCase());
}

/**
 * 목록 밖 버전인가 — skipVersionCheck 부착 여부의 판단 기준.
 *
 * 목록에서 고른 값에는 절대 붙지 않는다. 이것이 핵심이다 —
 * 무조건 붙이면 전 CSP 에서 tumblebug 의 오타 방어가 사라진다.
 *
 * 목록을 못 받은 경우(조회 실패, provider/region 항목 자체가 없음)에도 붙인다.
 * 그때는 tumblebug 도 대조할 목록이 없어 어떤 값을 보내든 거부하므로,
 * 사용자가 직접 입력한 값을 CSP 까지 보내려면 이 경로밖에 없다.
 */
export function isVersionOutsideAvailableList(version, availableVersions) {
  if (!version) {
    return false;
  }
  return !isKnownVersion(version, availableVersions);
}

/**
 * 생성 요청에 실을 queryParams. 목록 밖 버전일 때만 skipVersionCheck 를 돌려준다.
 * 붙일 것이 없으면 undefined — 호출부에서 그대로 request 객체에 넣으면 된다.
 */
export function buildVersionQueryParams(version, availableVersions) {
  if (!isVersionOutsideAvailableList(version, availableVersions)) {
    return undefined;
  }
  return { skipVersionCheck: 'true' };
}

// CSP 가 버전을 거부할 때의 응답 문구에서 허용 목록을 뽑는다.
// Alibaba 실측 원문(오타 allowd 포함):
//   The specified KubernetesVersion 1.35.2-aliyun.1 is invalid,
//   allowd values are [1.36.2-aliyun.1 1.35.7-aliyun.1 1.34.10-aliyun.1]
// 대괄호 목록은 공백 구분이지만 CSP 에 따라 콤마일 수 있어 둘 다 받는다.
const ALLOWED_LIST_RE = /allow(?:e)?d\s+values?\s+are\s*[[(]([^\])]*)[\])]/i;
const REQUESTED_VERSION_RE = /(?:specified\s+)?KubernetesVersion\s+([^\s,]+)\s+is\s+invalid/i;
const INVALID_VERSION_HINT_RE = /InvalidKubernetesVersion|KubernetesVersion\s+\S+\s+is\s+invalid/i;

/**
 * 버전 거부 에러면 {requested, allowed[]} 를, 아니면 null.
 * allowed 를 못 뽑아도 버전 거부인 것이 분명하면 빈 배열로 돌려준다 —
 * 호출부가 "버전 문제"라는 사실만으로도 안내를 바꿀 수 있어야 한다.
 */
export function parseInvalidVersionError(message) {
  if (!message || typeof message !== 'string') {
    return null;
  }
  if (!INVALID_VERSION_HINT_RE.test(message)) {
    return null;
  }

  const requestedMatch = message.match(REQUESTED_VERSION_RE);
  const allowedMatch = message.match(ALLOWED_LIST_RE);

  const allowed = allowedMatch
    ? allowedMatch[1]
        .split(/[\s,]+/)
        .map((v) => v.trim())
        .filter((v) => v !== '')
    : [];

  return {
    requested: requestedMatch ? requestedMatch[1] : '',
    allowed: allowed,
  };
}

/**
 * 사용자에게 보여줄 안내 문구 (영문 — 콘솔 노출 문구 규칙).
 * 재시도 방법까지 담아 사용자가 목록 밖 버전을 직접 입력할 수 있게 한다.
 */
export function formatInvalidVersionMessage(parsed) {
  if (!parsed) {
    return '';
  }
  const head = parsed.requested
    ? `Kubernetes version '${parsed.requested}' was rejected by the CSP.`
    : 'The requested Kubernetes version was rejected by the CSP.';

  if (parsed.allowed.length === 0) {
    return `${head} Enter a version the CSP currently accepts in the Cluster Version field and try again.`;
  }

  return (
    `${head} The CSP currently accepts: ${parsed.allowed.join(', ')}. ` +
    'Enter one of these in the Cluster Version field and try again.'
  );
}

if (typeof webconsolejs !== 'undefined') {
  if (typeof webconsolejs['common/utils/k8sVersionRules'] === 'undefined') {
    webconsolejs['common/utils/k8sVersionRules'] = {};
  }
  Object.assign(webconsolejs['common/utils/k8sVersionRules'], {
    isKnownVersion,
    isVersionOutsideAvailableList,
    buildVersionQueryParams,
    parseInvalidVersionError,
    formatInvalidVersionMessage,
  });
}
