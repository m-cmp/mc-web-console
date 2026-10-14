// Cloud Resources 화면 공통 — 리소스(vNet/SecurityGroup/DataDisk)를 사용 중인 Node 해석.
// tumblebug은 리소스 객체의 associatedObjectList에 Node 키("/ns/{ns}/infra/{infraId}/node/{nodeId}")를 담아
// 사용처를 추적한다(Node 생성·삭제 시 자동 갱신). 미사용이면 vNet은 null, SG는 []로 오므로 둘 다 빈 목록으로 다룬다.
// nodeId는 Infra 안에서만 고유하므로 Node는 항상 infraId와 함께 식별한다.

const INFRA_WORKLOADS_PATH = '/webconsole/operations/manage/workloads/infraworkloads';

// "/ns/default/infra/infra01/node/aws-ap-southeast-1-1" -> { nsId, infraId, nodeId }
export function parseNodeRef(resourcePath) {
  const m = /^\/ns\/([^/]+)\/infra\/([^/]+)\/node\/([^/]+)$/.exec(resourcePath || '');
  return m ? { nsId: m[1], infraId: m[2], nodeId: m[3] } : null;
}

export function associatedNodeRefs(resource) {
  return (resource?.associatedObjectList ?? []).map(parseNodeRef).filter(Boolean);
}

export function usedByCount(resource) {
  return associatedNodeRefs(resource).length;
}

// 목록·Subnet 표의 Used By 셀
export function usedByBadgeHtml(count) {
  return count > 0
    ? `<span class="badge bg-blue-lt">${count} Node${count > 1 ? 's' : ''}</span>`
    : '<span class="text-muted">-</span>';
}

// Infra Workloads 딥링크. nodeId 선택 처리는 Infra Workloads 쪽 후속 작업 — 현재는 mciID로 Infra까지 선택된다.
export function nodeDeepLink(infraId, nodeId) {
  const params = new URLSearchParams({ mciID: infraId, nodeId });
  return `${INFRA_WORKLOADS_PATH}?${params.toString()}`;
}

// API 프록시는 백엔드(CSP SDK) 에러 메시지를 {responseData:{message},status:{...}} 로 감싼다.
// 축소된 axios 기본 메시지("Request failed with status code 500") 대신 실제 원인을 보여준다.
export function extractErrorMessage(err) {
  return err?.response?.data?.responseData?.message || err?.response?.data?.message || err?.message || String(err);
}

async function fetchInfra(nsId, infraId) {
  const response = await webconsolejs['common/api/http'].commonAPIPost(
    '/api/mc-infra-manager/GetInfra',
    { pathParams: { nsId, infraId } },
    undefined,
    // 오래된 연관 1건마다 공통 500 토스트가 뜨지 않도록 억제하고, 섹션 안에서 상태로 표시한다.
    { loaderType: 'none', suppressErrorToast: true }
  );
  return response?.data?.responseData;
}

// tumblebug은 없는 Infra 조회에 404가 아니라 500 + "The infra <id> does not exist."를 돌려준다.
function isNotExistError(err) {
  return err?.response?.status === 404 || /does not exist/i.test(extractErrorMessage(err));
}

// refs를 infraId로 묶어 GetInfra를 Infra당 1회 호출하고 Node 정보를 붙인다.
// tumblebug rate limit(GET /infra/{id} 5/s)은 콘솔 API 서버 IP 하나로 모든 사용자가 공유하므로 동시 호출 수를 제한한다.
// 결과 state: 'ok' | 'stale'(Infra 또는 Node가 더 이상 없음) | 'unavailable'(rate limit 등 일시적 조회 실패)
export async function resolveAssociatedNodes(nsId, refs, { concurrency = 3 } = {}) {
  const infraIds = [...new Set(refs.map((r) => r.infraId))];
  const infraResults = new Map();

  let cursor = 0;
  async function worker() {
    while (cursor < infraIds.length) {
      const infraId = infraIds[cursor++];
      try {
        infraResults.set(infraId, { infra: await fetchInfra(nsId, infraId) });
      } catch (err) {
        infraResults.set(infraId, { error: err, notExist: isNotExistError(err) });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, infraIds.length) }, worker));

  return refs.map((ref) => {
    const result = infraResults.get(ref.infraId);
    if (result?.error) {
      return { ...ref, state: result.notExist ? 'stale' : 'unavailable', message: extractErrorMessage(result.error) };
    }
    const node = (result?.infra?.node || []).find((n) => n.id === ref.nodeId);
    return node ? { ...ref, state: 'ok', node } : { ...ref, state: 'stale' };
  });
}

// ─── 상세 패널 "Associated Nodes" 섹션 (detail-assoc-* 요소를 쓰는 화면 공통) ─────────────

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nodeRowHtml(row, showSubnet) {
  const infra = escapeHtml(row.infraId);
  const nodeId = escapeHtml(row.nodeId);
  const subnetCell = (value) => (showSubnet ? `<td>${value}</td>` : '');
  if (row.state === 'ok') {
    const n = row.node;
    return `
      <td><a href="${escapeHtml(nodeDeepLink(row.infraId, row.nodeId))}">${infra}</a></td>
      <td><a href="${escapeHtml(nodeDeepLink(row.infraId, row.nodeId))}">${nodeId}</a></td>
      ${subnetCell(escapeHtml(n.subnetId || '-'))}
      <td>${escapeHtml(n.status || '-')}</td>
      <td>${escapeHtml(n.privateIP || '-')}</td>
      <td>${escapeHtml(n.publicIP || '-')}</td>`;
  }
  const badge = row.state === 'stale'
    ? '<span class="badge bg-warning-lt" title="This Node no longer exists. The reference is left over in the resource.">Stale reference</span>'
    : `<span class="badge bg-secondary-lt" title="${escapeHtml(row.message || '')}">Unavailable — reopen to retry</span>`;
  const colspan = showSubnet ? 4 : 3;
  return `
      <td>${infra}</td>
      <td>${nodeId}</td>
      <td colspan="${colspan}">${badge}</td>`;
}

let _assocSeq = 0;

// 리소스의 연관 Node를 해석해 상세 섹션에 그린다. 다른 행을 연 사이 늦게 도착한 결과는 버리고 null을 반환한다.
export async function showAssociatedNodes(nsId, resource, { showSubnet = false } = {}) {
  const seq = ++_assocSeq;
  const refs = associatedNodeRefs(resource);
  const countEl = document.getElementById('detail-assoc-count');
  const loadingEl = document.getElementById('detail-assoc-loading');
  const emptyEl = document.getElementById('detail-assoc-empty');
  const wrapEl = document.getElementById('detail-assoc-table-wrap');
  const tbody = document.getElementById('detail-assoc-tbody');

  if (countEl) countEl.textContent = String(refs.length);
  tbody.innerHTML = '';
  wrapEl.classList.add('d-none');
  emptyEl.classList.toggle('d-none', refs.length > 0);
  loadingEl.classList.toggle('d-none', refs.length === 0);
  if (refs.length === 0) return [];

  const rows = await resolveAssociatedNodes(nsId, refs);
  if (seq !== _assocSeq) return null;

  rows.sort((a, b) => a.infraId.localeCompare(b.infraId) || a.nodeId.localeCompare(b.nodeId));
  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = nodeRowHtml(row, showSubnet);
    tbody.appendChild(tr);
  }
  loadingEl.classList.add('d-none');
  wrapEl.classList.remove('d-none');
  return rows;
}

// 화면을 닫거나 다른 리소스로 바뀔 때 진행 중인 해석 결과가 늦게 그려지지 않게 한다.
export function cancelAssociatedNodes() {
  _assocSeq++;
}
