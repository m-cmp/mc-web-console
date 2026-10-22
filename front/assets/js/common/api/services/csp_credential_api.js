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
