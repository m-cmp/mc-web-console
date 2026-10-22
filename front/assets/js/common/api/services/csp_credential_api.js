// CSP 임시 자격 증명(STS) 발급 API
// mc-iam-manager POST /api/workspaces/temporary-credentials — 프록시가 로그인 사용자의 IAM 토큰을 그대로 전달하므로
// 발급 권한은 "이 사용자의 워크스페이스 역할 → CSP Role 매핑" 기준으로 IAM이 판단한다.
//
// 응답에는 비밀값이 들어 있으므로:
//  - commonAPIPost에 sensitive 옵션을 넘겨 요청/응답 본문을 콘솔에 남기지 않는다
//  - 반환값을 storage에 저장하거나 console에 찍지 않는다 (호출부도 동일)

// IAM이 403으로 돌려주는 "역할 매핑 없음"과 "CSP Role assume 실패"를 구분해 사용자 안내 문구로 바꾼다
export class CspCredentialError extends Error {
  constructor(message, { status, code, serverMessage } = {}) {
    super(message);
    this.name = 'CspCredentialError';
    this.status = status;
    this.code = code; // 'NO_MAPPING' | 'ASSUME_FAILED' | 'NOT_FOUND' | 'BAD_REQUEST' | 'UNKNOWN'
    this.serverMessage = serverMessage;
  }
}

function serverErrorText(err) {
  const body = err?.response?.data;
  return body?.responseData?.error || body?.responseData?.message || body?.error || body?.message || '';
}

export function toCspCredentialError(err, cspType) {
  if (err instanceof CspCredentialError) return err;
  const status = err?.response?.status;
  const serverMessage = serverErrorText(err);
  const csp = String(cspType || '').toUpperCase() || 'this CSP';

  if (status === 403 && /No suitable CSP role mapping/i.test(serverMessage)) {
    return new CspCredentialError(
      `No CSP role is mapped to your role in this workspace for ${csp}. Ask an administrator.`,
      { status, code: 'NO_MAPPING', serverMessage }
    );
  }
  if (status === 403) {
    return new CspCredentialError(
      `Failed to assume the CSP role mapped for ${csp}. Ask an administrator to check the CSP role and IdP settings.`,
      { status, code: 'ASSUME_FAILED', serverMessage }
    );
  }
  if (status === 404) {
    return new CspCredentialError(
      'The workspace or user was not found in IAM. Select a workspace and try again.',
      { status, code: 'NOT_FOUND', serverMessage }
    );
  }
  if (status === 400) {
    return new CspCredentialError(
      `Temporary credentials are not supported for ${csp}${serverMessage ? ': ' + serverMessage : '.'}`,
      { status, code: 'BAD_REQUEST', serverMessage }
    );
  }
  return new CspCredentialError(
    `Failed to issue temporary credentials${serverMessage ? ': ' + serverMessage : (err?.message ? ': ' + err.message : '.')}`,
    { status, code: 'UNKNOWN', serverMessage }
  );
}

/**
 * 로그인 사용자 기준 CSP 임시 자격 증명 발급
 * @param {{workspaceId: string|number, cspType: string, region?: string, authMethod?: string}} params
 * @returns {Promise<object>} CspCredentialResponse (cspType, accessKeyId, secretAccessKey, sessionToken,
 *   accessToken, tokenType, accessKeySecret, securityToken, expiration, region)
 * @throws {CspCredentialError}
 */
export async function getTemporaryCredentials({ workspaceId, cspType, region, authMethod } = {}) {
  const csp = String(cspType || '').toLowerCase();
  if (!workspaceId) {
    throw new CspCredentialError('No workspace is selected. Select a workspace and try again.', { code: 'BAD_REQUEST' });
  }
  if (!csp) {
    throw new CspCredentialError('The CSP of this node could not be determined.', { code: 'BAD_REQUEST' });
  }

  const request = { workspaceId: String(workspaceId), cspType: csp, region: region || '' };
  if (authMethod) request.authMethod = authMethod;

  const controller = '/api/mc-iam-manager/GetTemporaryCredentials';
  let response;
  try {
    response = await webconsolejs['common/api/http'].commonAPIPost(
      controller,
      { request },
      undefined,
      { sensitive: true, silentErrors: true }
    );
  } catch (err) {
    throw toCspCredentialError(err, csp);
  }
  // 방어: 과거 commonAPIPost는 일부 오류에서 throw 대신 axios error 객체를 반환했다
  if (!response || response.response || !response.data) {
    throw toCspCredentialError(response || new Error('Empty response'), csp);
  }
  const cred = response.data.responseData;
  if (!cred || typeof cred !== 'object') {
    throw new CspCredentialError('Failed to issue temporary credentials: empty response.', { code: 'UNKNOWN' });
  }
  return cred;
}

// ─── 발급 가능 CSP 판정 (버튼 표시용) ─────────────────────────────────────
// 현재 워크스페이스에서 내 역할에 "설정된" CSP Role 매핑이 있는 CSP만 버튼을 보여 준다.
//   1) GET /api/users/me/workspace-roles → 현재 워크스페이스의 role_id
//   2) GET /api/roles/csp-roles/id/{roleId} → cspRoles 중 status=created 이고 idp/iam identifier 가 있는 csp_type
// "설정됨" 판정일 뿐 발급 보장은 아니다(클릭 후 403 등은 getTemporaryCredentials 쪽에서 안내).
// 조회 실패·역할 없음은 빈 집합(버튼 숨김). identifier 값은 판정에만 쓰고 보관·출력하지 않는다.
// IAM readiness API 도입 시 이 판정을 교체한다.

const QUIET = { loaderType: 'none', sensitive: true, silentErrors: true };
let issuableCache = { workspaceId: null, promise: null };

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== '') return obj[k];
  }
  return undefined;
}

async function fetchIssuableCspTypes(workspaceId) {
  const http = webconsolejs['common/api/http'];
  const rolesResp = await http.commonAPIPost('/api/mc-iam-manager/GetMyWorkspaceRoles', {}, undefined, QUIET);
  const roles = Array.isArray(rolesResp?.data?.responseData) ? rolesResp.data.responseData : [];
  const roleIds = [...new Set(roles
    .filter((r) => String(pick(r, 'workspace_id', 'workspaceId')) === String(workspaceId))
    .map((r) => pick(r, 'role_id', 'roleId'))
    .filter((id) => id != null))];

  const types = new Set();
  for (const roleId of roleIds) {
    const resp = await http.commonAPIPost('/api/mc-iam-manager/Getrolescsproles', {
      pathParams: { roleId: String(roleId) },
    }, undefined, QUIET);
    const cspRoles = resp?.data?.responseData?.cspRoles || resp?.data?.responseData?.csp_roles || [];
    (Array.isArray(cspRoles) ? cspRoles : []).forEach((c) => {
      const configured = String(pick(c, 'status') || '').toLowerCase() === 'created'
        && !!pick(c, 'idp_identifier', 'idpIdentifier')
        && !!pick(c, 'iam_identifier', 'iamIdentifier');
      const type = String(pick(c, 'csp_type', 'cspType') || '').toLowerCase();
      if (configured && type) types.add(type);
    });
  }
  return types;
}

/**
 * 현재 워크스페이스에서 임시자격증명 버튼을 보여 줄 CSP 집합 (소문자 csp_type).
 * 워크스페이스 단위로 1회만 조회해 캐시하고, 워크스페이스가 바뀌면 다시 조회한다. 실패하면 빈 집합.
 */
export function getIssuableCspTypes(workspaceId) {
  if (!workspaceId) return Promise.resolve(new Set());
  if (issuableCache.workspaceId !== String(workspaceId) || !issuableCache.promise) {
    issuableCache = {
      workspaceId: String(workspaceId),
      promise: fetchIssuableCspTypes(workspaceId).catch(() => {
        // 실패는 캐시하지 않는다(다음 노드 열 때 재시도)
        issuableCache = { workspaceId: null, promise: null };
        return new Set();
      }),
    };
  }
  return issuableCache.promise;
}

export function clearIssuableCspTypesCache() {
  issuableCache = { workspaceId: null, promise: null };
}
