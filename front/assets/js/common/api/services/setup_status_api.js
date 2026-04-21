// FR-CLOUD-ADMIN-006-08 — Pre-onboarding Setup Status API service
//
// 기존 endpoint를 병렬 호출하여 cloudoverview의 Setup Status 섹션이 표시할
// ViewModel(8개 카드: setupSequence/roles/menu/api/projects/wsMapping/credentials/loadAssets)
// 을 합성한다. 신규 백엔드 API 0건. mc-iam-manager + mc-infra-manager(cb-tumblebug) + BFF 1개.
//
// loadAssets / credentials는 cb-tumblebug v0.12.6+의 신규 API를 직접 호출:
//   - GetAssetsSummary: spec/image 카운트 + CSP별 분포 + priced/unpriced 비율
//   - GetCredentialHolderList: holder별 providers + connection/verified count + isDefault
//
// webpack UMD library 패턴 — 외부 호출은 webconsolejs["common/api/services/setup_status_api"]

// system namespace (mc-infra-manager init+loadAsset이 적재한 ns)
// window.SYSTEM_NS env override 가능, default = "system"
const SYSTEM_NS = (typeof window !== 'undefined' && window.SYSTEM_NS) || 'system';

// PREDEFINED_ROLE_EXPECTED — 1_setup_auto.sh가 init_predefined_roles에서 등록하는 role 목록.
// mc-admin-cli/conf/docker/conf/mc-iam-manager/.env의 PREDEFINED_ROLE 값과 일치.
// 변경 시: BFF에서 /api/admin/predefined-roles로 노출하는 안을 검토 (현재 클라이언트 상수).
export const PREDEFINED_ROLE_EXPECTED = ['admin', 'operator', 'viewer', 'billadmin', 'billviewer'];

// ─── URL helpers ────────────────────────────────────────────────────

// mc-iam-manager subsystem 프록시 URL
function iamUrl(operationId) {
  return `/api/mc-iam-manager/${operationId}`;
}

// mc-infra-manager subsystem 프록시 URL
function infraUrl(operationId) {
  return `/api/mc-infra-manager/${operationId}`;
}

// BFF 자체 endpoint (subsystem 프록시 미경유)
function bffUrl(path) {
  return path;
}

// ─── HTTP helpers ───────────────────────────────────────────────────

// Setup Status 카드는 화면 깜빡임 방지 위해 page loader 끄고 호출
const STATUS_OPTS = { loaderType: 'none' };

function http() {
  return webconsolejs['common/api/http'];
}

// 프록시 호출 (POST 형태로 BFF에 던지고, BFF가 api.yaml의 method로 백엔드 호출)
async function proxyPost(url, body = {}, opts = STATUS_OPTS) {
  return await http().commonAPIPost(url, body, undefined, opts);
}

// BFF 자체 GET (yaml reachability check 등)
async function bffGet(url) {
  return await http().commonAPIGet(url);
}

// ─── Public: 11개 호출 + ViewModel 합성 ─────────────────────────────

/**
 * Setup Status 화면용 11개 조회 호출 (병렬, allSettled)
 *
 * @returns {Promise<{ raw: Object<string, PromiseSettledResult>, viewModel: Object }>}
 */
export async function fetchAllStatus() {
  const calls = {
    // ─ mc-iam-manager: 7개 ────────────────────────────────────────
    menus:        proxyPost(iamUrl('listMenus'),             {}),
    mcmpApis:     proxyPost(iamUrl('ListMcmpApisServices'),  {}),
    projects:     proxyPost(iamUrl('listProjects'),          {}),
    workspaces:   proxyPost(iamUrl('listWorkspaces'),        {}),
    wsProjects:   proxyPost(iamUrl('listWorkspaceProjects'), {}),
    holders:      proxyPost(infraUrl('GetCredentialHolderList'), {}),
    roles:        proxyPost(iamUrl('Getrolelist'),               {}),
    // ─ mc-infra-manager: 1개 (system ns asset summary) ───────────
    summary:      proxyPost(infraUrl('GetAssetsSummary'), { queryParams: { nsId: SYSTEM_NS } }),
    // ─ BFF: 2개 (raw yaml URL 도달성) ─────────────────────────────
    menuYaml:     bffGet(bffUrl('/api/admin/setup-yaml-check?which=menu')),
    apiYaml:      bffGet(bffUrl('/api/admin/setup-yaml-check?which=api')),
  };

  const keys = Object.keys(calls);
  const settled = await Promise.allSettled(Object.values(calls));
  const raw = Object.fromEntries(keys.map((k, i) => [k, settled[i]]));

  return { raw, viewModel: buildViewModel(raw) };
}

// ─── Public: 4개 Re-sync 액션 ────────────────────────────────────────

/** /api/setup/initial-menus — 1_setup_auto.sh init_menu 와 동일 */
export async function resyncMenu() {
  return await proxyPost(iamUrl('InitialMenus'), {});
}

/** /api/setup/sync-mcmp-apis — 1_setup_auto.sh init_api_resources 와 동일 */
export async function resyncMcmpApis() {
  return await proxyPost(iamUrl('SyncMcmpApis'), {});
}

/** /api/setup/sync-projects — 1_setup_auto.sh sync_projects 와 동일 */
export async function resyncProjects() {
  return await proxyPost(iamUrl('syncProjects'), {});
}

/**
 * cb-tumblebug LoadAssets 재실행 — internal asset csv 파일에서 spec/image를 (재)적재.
 * Azure는 기본 제외(40+분 소요). 필요 시 includeAzure=true를 query로 별도 추가.
 */
export async function rerunLoadAssets() {
  return await proxyPost(infraUrl('LoadAssets'), {});
}

// (removed) assignAllProjectsToFirstWorkspace
// 미할당 project 의 default workspace 매핑은 mc-iam-manager의 SyncProjectsWithInfraManager
// (env DEFAULT_WORKSPACE_NAME 기반) 가 책임진다. 임의 매핑은 운영 ▶ Workspace 페이지
// (workspaces.js의 createWPmapping/updateWPmappings/delete*)가 담당. Setup Status 카드의
// Re-sync ▶ Workspace Mapping 버튼은 위 두 책임과 중복이므로 제거.

// ─── Public: 부분 새로고침용 단건 조회 ───────────────────────────────

/** Re-sync menu 직후 menu 카드 + setupSequence.initMenu 갱신용 */
export async function fetchMenuOnly() {
  const calls = {
    menus:    proxyPost(iamUrl('listMenus'), {}),
    menuYaml: bffGet(bffUrl('/api/admin/setup-yaml-check?which=menu')),
  };
  const settled = await Promise.allSettled(Object.values(calls));
  return {
    menus:    settled[0],
    menuYaml: settled[1],
  };
}

/** Re-sync mcmp-apis 직후 api 카드 + setupSequence.initApiResources 갱신용 */
export async function fetchApiOnly() {
  const calls = {
    mcmpApis: proxyPost(iamUrl('ListMcmpApisServices'), {}),
    apiYaml:  bffGet(bffUrl('/api/admin/setup-yaml-check?which=api')),
  };
  const settled = await Promise.allSettled(Object.values(calls));
  return {
    mcmpApis: settled[0],
    apiYaml:  settled[1],
  };
}

/** Re-sync projects 직후 setupSequence.syncProjects 갱신용 */
export async function fetchProjectsOnly() {
  const calls = {
    projects:   proxyPost(iamUrl('listProjects'),          {}),
    wsProjects: proxyPost(iamUrl('listWorkspaceProjects'), {}),
  };
  const settled = await Promise.allSettled(Object.values(calls));
  return {
    projects:   settled[0],
    wsProjects: settled[1],
  };
}

/**
 * Re-run loadAssets 직후 loadAssets 카드 갱신용.
 * cb-tumblebug v0.12.6+의 GetAssetsSummary 단일 호출로 spec/image 카운트 + CSP별 분포 + priced/unpriced 비율을 한 번에 받는다.
 * (기존 ListSpec/ListImage 2회 호출은 수만 건 record를 다운로드 후 length로 카운트하는 비효율 구조였음)
 */
export async function fetchLoadAssetsOnly() {
  const calls = {
    summary: proxyPost(infraUrl('GetAssetsSummary'), { queryParams: { nsId: SYSTEM_NS } }),
  };
  const settled = await Promise.allSettled(Object.values(calls));
  return {
    summary: settled[0],
  };
}

/**
 * Setup Sequence 카드 갱신용 — 7단계 중 응답이 필요한 5개 호출.
 * (initPlatformAdmin은 화면 도달 자체가 OK, mapWorkspaceProjects는 projects + wsProjects 둘 다 필요)
 */
export async function fetchSetupSequenceOnly() {
  const calls = {
    roles:      proxyPost(iamUrl('Getrolelist'),           {}),
    menus:      proxyPost(iamUrl('listMenus'),             {}),
    mcmpApis:   proxyPost(iamUrl('ListMcmpApisServices'),  {}),
    projects:   proxyPost(iamUrl('listProjects'),          {}),
    wsProjects: proxyPost(iamUrl('listWorkspaceProjects'), {}),
  };
  const keys = Object.keys(calls);
  const settled = await Promise.allSettled(Object.values(calls));
  return Object.fromEntries(keys.map((k, i) => [k, settled[i]]));
}

/**
 * Roles 카드 갱신용 — Getrolelist 단건.
 * (PREDEFINED_ROLE_EXPECTED와의 diff는 section 측 mergeRoles에서 처리)
 */
export async function fetchRolesOnly() {
  const calls = {
    roles: proxyPost(iamUrl('Getrolelist'), {}),
  };
  const settled = await Promise.allSettled(Object.values(calls));
  return {
    roles: settled[0],
  };
}

/**
 * Workspace Mapping 카드 갱신용 — listWorkspaces + listWorkspaceProjects 2건.
 * Re-sync 시 Projects 카드와 동일하게 wsProjects만 변하므로 listProjects는 별도 fetchProjectsOnly가 담당.
 */
export async function fetchWorkspaceMappingOnly() {
  const calls = {
    workspaces: proxyPost(iamUrl('listWorkspaces'),        {}),
    projects:   proxyPost(iamUrl('listProjects'),          {}),
    wsProjects: proxyPost(iamUrl('listWorkspaceProjects'), {}),
  };
  const settled = await Promise.allSettled(Object.values(calls));
  return {
    workspaces: settled[0],
    projects:   settled[1],
    wsProjects: settled[2],
  };
}

/**
 * Credentials 카드 갱신용.
 * cb-tumblebug의 GetCredentialHolderList 단건 호출로 holder별 providers/connectionCount/
 * verifiedConnectionCount/isDefault를 한 번에 받는다.
 *
 * (기존 mc-iam-manager listCspAccounts 호출은 mc-iam-manager 측 csp_accounts 테이블 조회로,
 *  실제 cb-tumblebug에 등록된 connection 상태와 괴리가 있었음. cb-tumblebug 직접 조회로 일원화.)
 */
export async function fetchCredentialsOnly() {
  const calls = {
    holders: proxyPost(infraUrl('GetCredentialHolderList'), {}),
  };
  const settled = await Promise.allSettled(Object.values(calls));
  return {
    holders: settled[0],
  };
}

/**
 * 특정 holder의 상세 정보 조회용 (선택). list 응답에 필드가 모두 포함되어 있어
 * 카드 기본 표시에는 불필요하지만, 추후 holder 클릭 시 details 패널에서 사용 가능.
 *
 * @param {string} holderId
 */
export async function fetchCredentialHolderDetail(holderId) {
  return await proxyPost(infraUrl('GetCredentialHolder'), {
    pathParams: { holderId },
  });
}

// ─── ViewModel 빌더 ──────────────────────────────────────────────────

/**
 * 11개 응답 → 5개 카드 ViewModel 합성.
 * status는 1_setup_auto.sh 7단계와 분석 문서 v1.1의 산출 규칙을 따른다.
 *
 * - settled.status === 'rejected'           → null (UI는 ❓ 표기)
 * - response.status >= 400                  → null (UI는 ❌ 표기)
 * - 정상이면 responseData에서 count 산출
 */
export function buildViewModel(raw) {
  // ─ 카운트 산출 ─────────────────────────────────────────────────
  const menuCount    = countFromList(raw.menus);
  const apiCount     = countFromMcmpApis(raw.mcmpApis);
  const projectCount = countFromList(raw.projects);
  const wsCount      = countFromList(raw.workspaces);
  const wsProjCount  = countFromList(raw.wsProjects);
  const rolesCount   = countFromList(raw.roles);
  const assetSummary = parseAssetsSummary(raw.summary);
  const holderList   = parseCredentialHolders(raw.holders);

  // ─ Credentials: holder별 provider/connection count 집계 ───────
  const credByProvider = aggregateProvidersFromHolders(holderList);
  const inactiveConnTotal = holderList.reduce(
    (sum, h) => sum + Math.max(0, (h.connectionCount || 0) - (h.verifiedConnectionCount || 0)),
    0
  );

  // ─ Yaml reachability 결과 ──────────────────────────────────────
  const menuYaml = parseYamlCheck(raw.menuYaml);
  const apiYaml  = parseYamlCheck(raw.apiYaml);

  // ─ Services map (mc-iam-manager 등록 mcmpApi 카탈로그의 BaseURL) ─
  const services = unwrapServicesMap(raw.mcmpApis);

  // ─ Setup Sequence 7단계 status 산출 ────────────────────────────
  const setupSequence = {
    initPlatformAdmin: {
      // 본 화면에 도달했다는 것 자체가 admin 토큰 보유 (false negative 없음)
      status: 'OK',
    },
    initPredefinedRoles: {
      status: deriveStatus(rolesCount, raw.roles),
      count: rolesCount,
    },
    initMenu: {
      status: deriveStatus(menuCount, raw.menus),
      count: menuCount,
    },
    initApiResources: {
      status: deriveStatus(apiCount, raw.mcmpApis),
      count: apiCount,
    },
    syncProjects: {
      status: deriveStatus(projectCount, raw.projects),
      count: projectCount,
    },
    mapWorkspaceProjects: {
      // wsProjCount >= projectCount이면 OK, 미달이면 WARN
      status: deriveMapWsProjectStatus(wsProjCount, projectCount, raw.wsProjects),
      count: wsProjCount,
      expected: projectCount,
    },
  };

  return {
    setupSequence,
    menu: {
      registeredCount: menuCount,
      sourceUrl: menuYaml.url,
      sourceUrlReachable: menuYaml.reachable,
      sourceHttpStatus: menuYaml.httpStatus,
      sourceLastModified: menuYaml.lastModified,
      sourceETag: menuYaml.etag,
      sourceErrorMessage: menuYaml.errorMessage,
    },
    api: {
      registeredCount: apiCount,
      servicesCount: Object.keys(services).length,
      services,
      sourceUrl: apiYaml.url,
      sourceUrlReachable: apiYaml.reachable,
      sourceHttpStatus: apiYaml.httpStatus,
      sourceLastModified: apiYaml.lastModified,
      sourceETag: apiYaml.etag,
      sourceErrorMessage: apiYaml.errorMessage,
    },
    credentials: {
      holders: holderList,
      holderCount: holderList.length,
      byProvider: credByProvider,
      inactiveConnectionCount: inactiveConnTotal,
    },
    loadAssets: {
      systemNs: assetSummary.namespaceId || SYSTEM_NS,
      specCount: assetSummary.totalSpecCount,
      imageCount: assetSummary.totalImageCount,
      pricedSpecCount: assetSummary.pricedSpecCount,
      unpricedSpecCount: assetSummary.unpricedSpecCount,
      providers: assetSummary.providers,
      // 둘 다 0건 이면 NOT-EXECUTED, 한쪽만 0이면 PARTIAL, 둘 다 >0이면 OK
      status: deriveLoadAssetsStatus(
        assetSummary.totalSpecCount, assetSummary.totalImageCount,
        raw.summary, raw.summary
      ),
    },
    workspace: {
      count: wsCount,
    },
  };
}

// ─── status 산출 helper ──────────────────────────────────────────────

// settled 결과가 fulfilled + HTTP 200대 면 정상 응답 — 응답 누락 구분용
function isFulfilledOk(settled) {
  if (!settled || settled.status !== 'fulfilled') return false;
  const resp = settled.value;
  if (!resp) return false;
  // axios 응답 또는 axios 에러(error.response)
  const status = resp.status || (resp.response && resp.response.status);
  return typeof status === 'number' && status >= 200 && status < 300;
}

// count 기반 상태 도출
function deriveStatus(count, settled) {
  if (!isFulfilledOk(settled)) return 'UNKNOWN';
  return count > 0 ? 'OK' : 'FAIL';
}

function deriveMapWsProjectStatus(wsProjCount, projectCount, settled) {
  if (!isFulfilledOk(settled)) return 'UNKNOWN';
  if (projectCount === 0) return 'OK'; // mapping 대상 자체가 없음
  if (wsProjCount >= projectCount) return 'OK';
  return 'WARN';
}

function deriveLoadAssetsStatus(specCount, imageCount, specsSettled, imagesSettled) {
  const specOk = isFulfilledOk(specsSettled);
  const imageOk = isFulfilledOk(imagesSettled);
  if (!specOk && !imageOk) return 'UNKNOWN';
  if (specCount > 0 && imageCount > 0) return 'OK';
  if (specCount === 0 && imageCount === 0) return 'NOT-EXECUTED';
  return 'PARTIAL';
}

// ─── 응답 파싱 helper ────────────────────────────────────────────────

// 표준 list 응답에서 count 추출
// 응답 예: { responseData: [...] } 또는 { responseData: { spec: [...] } }
function countFromList(settled, listKeys = []) {
  if (!isFulfilledOk(settled)) return 0;
  const data = extractResponseData(settled.value);
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') {
    // mc-infra-manager의 ListSpec/ListImage는 { spec: [...] } / { image: [...] } 형식
    for (const key of listKeys) {
      if (Array.isArray(data[key])) return data[key].length;
    }
    // 기타 fallback: data 자체가 list-like 객체일 때
    if (Array.isArray(data.responseData)) return data.responseData.length;
    if (typeof data.count === 'number') return data.count;
  }
  return 0;
}

// 배열로 unwrap
function unwrapArray(settled) {
  if (!isFulfilledOk(settled)) return [];
  const data = extractResponseData(settled.value);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.responseData)) return data.responseData;
  return [];
}

// mc-iam-manager의 ListMcmpApisServices 응답에서 mcmpApi 등록 건수 산출
// 응답 형태: { Services: { name: { BaseURL, Version, ... } }, ServiceActions: { name: { actionName: { method, resourcePath }, ... } } }
// → 등록 API 건수 = 모든 ServiceActions의 actionName 합계
function countFromMcmpApis(settled) {
  if (!isFulfilledOk(settled)) return 0;
  const data = extractResponseData(settled.value);
  if (!data) return 0;
  const sa = data.ServiceActions || data.serviceActions || {};
  let total = 0;
  for (const svc of Object.keys(sa)) {
    const actions = sa[svc];
    if (actions && typeof actions === 'object') {
      total += Object.keys(actions).length;
    }
  }
  return total;
}

// ListMcmpApisServices 응답에서 Services map(BaseURL 보유) 추출
function unwrapServicesMap(settled) {
  if (!isFulfilledOk(settled)) return {};
  const data = extractResponseData(settled.value);
  if (!data) return {};
  return data.Services || data.services || {};
}

// cb-tumblebug GetAssetsSummary 응답 → { namespaceId, totalSpecCount, ... } 정규화
// 응답 예: { namespaceId, totalSpecCount, pricedSpecCount, unpricedSpecCount,
//           totalImageCount, providers:[{providerName, specCount, pricedSpecCount, ...}] }
function parseAssetsSummary(settled) {
  const empty = {
    namespaceId: '', totalSpecCount: 0, pricedSpecCount: 0, unpricedSpecCount: 0,
    totalImageCount: 0, providers: [],
  };
  if (!isFulfilledOk(settled)) return empty;
  const data = extractResponseData(settled.value);
  if (!data || typeof data !== 'object') return empty;
  return {
    namespaceId: data.namespaceId || data.NamespaceID || '',
    totalSpecCount: Number(data.totalSpecCount || 0),
    pricedSpecCount: Number(data.pricedSpecCount || 0),
    unpricedSpecCount: Number(data.unpricedSpecCount || 0),
    totalImageCount: Number(data.totalImageCount || 0),
    providers: Array.isArray(data.providers) ? data.providers : [],
  };
}

// cb-tumblebug GetCredentialHolderList → CredentialHolderInfo[] 정규화
// 응답 예: { credentialHolderList: [{ credentialHolder, providers[], connectionCount,
//           verifiedConnectionCount, isDefault }] }
function parseCredentialHolders(settled) {
  if (!isFulfilledOk(settled)) return [];
  const data = extractResponseData(settled.value);
  if (!data) return [];
  const list = data.credentialHolderList || data.CredentialHolderList || [];
  if (!Array.isArray(list)) return [];
  return list.map((h) => ({
    credentialHolder: h.credentialHolder || h.CredentialHolder || '',
    providers: Array.isArray(h.providers) ? h.providers : [],
    connectionCount: Number(h.connectionCount || 0),
    verifiedConnectionCount: Number(h.verifiedConnectionCount || 0),
    isDefault: !!h.isDefault,
  }));
}

// holder 목록에서 provider별 connection 카운트 집계 → { aws: {total, verified}, ... }
function aggregateProvidersFromHolders(holders) {
  const out = {};
  for (const h of holders) {
    // holder당 connectionCount/verified는 합계이므로 provider 균등 분배는 불가.
    // → 단순히 'provider 등장 여부'만 마킹하고, holder별 상세는 카드에서 보여준다.
    for (const p of h.providers) {
      const key = String(p).toLowerCase();
      if (!out[key]) out[key] = { holderCount: 0 };
      out[key].holderCount += 1;
    }
  }
  return out;
}

// BFF setup-yaml-check 응답 파싱 — 항상 200으로 오므로 reachable 필드로 판정
function parseYamlCheck(settled) {
  const empty = {
    url: null, reachable: false, httpStatus: null,
    lastModified: null, etag: null, errorMessage: null,
  };
  if (!settled || settled.status !== 'fulfilled') {
    return { ...empty, errorMessage: settled && settled.reason ? String(settled.reason) : 'request failed' };
  }
  const resp = settled.value;
  if (!resp || !resp.data) return empty;
  // BFF는 CommonResponse 래핑 — responseData가 SetupYamlCheckResult
  const data = resp.data.responseData || resp.data;
  return {
    url: data.url || null,
    reachable: !!data.reachable,
    httpStatus: data.httpStatus || null,
    lastModified: data.lastModified || null,
    etag: data.etag || null,
    errorMessage: data.errorMessage || null,
  };
}

// axios 응답에서 responseData unwrap (BFF CommonResponse + 백엔드 raw 둘 다 지원)
function extractResponseData(resp) {
  if (!resp || !resp.data) return null;
  // BFF CommonResponse: { responseData, status: { code, message } }
  if (Object.prototype.hasOwnProperty.call(resp.data, 'responseData')) {
    return resp.data.responseData;
  }
  // SubsystemAnyController가 백엔드 raw body를 그대로 전달하는 경우
  return resp.data;
}
