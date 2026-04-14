// Cloud Connection API 서비스 (mc-infra-manager / cb-tumblebug)
// Credential은 RSA+AES 암호화 방식으로 등록, Connection Config는 자동 생성됨

function unwrapResponse(response) {
    if (!response) throw new Error('Invalid response from server');
    if (response.status === 204) return null;
    if (!response.data) throw new Error('Invalid response from server');
    if (response.status >= 400) {
        const msg = (response.data.status && response.data.status.message)
            || response.data.message
            || response.data.error
            || 'Request failed';
        const err = new Error(msg);
        err.response = response;
        throw err;
    }
    return response.data.responseData;
}

// ─── CloudOS ──────────────────────────────────────────────────────────

export async function listCloudOS() {
    const controller = "/api/mc-infra-connector/List-Cloudos";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {});
    const data = unwrapResponse(response);
    return (data && data.cloudos) ? data.cloudos : [];
}

// ─── Credential ───────────────────────────────────────────────────────

/**
 * Credential 등록 Step 1: RSA 공개키 발급
 * @returns {{ tokenId: string, publicKey: string }}
 */
export async function getPublicKeyForCredential() {
    const controller = "/api/mc-infra-manager/GetPublicKeyForCredentialEncryption";
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, {});
    return unwrapResponse(response);
}

/**
 * Credential 등록 Step 3: 암호화된 payload 전송
 * @param {object} payload - { providerName, credentialHolder, publicKeyTokenId, encryptedClientAesKeyByPublicKey, credentialKeyValueList }
 * @returns {object} CredentialInfo (자동 생성된 ConnectionConfig 목록 포함)
 */
export async function registerCredential(payload, credentialHolder) {
    const controller = "/api/mc-infra-manager/RegisterCredential";
    const data = {
        request: payload,
        headers: { 'X-Credential-Holder': credentialHolder || 'admin' },
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

/**
 * Credential Holder 목록 조회
 * @returns {Array} CredentialHolderInfo[]
 */
export async function listCredentialHolders(credentialHolder) {
    const controller = "/api/mc-infra-manager/GetCredentialHolderList";
    const data = {
        headers: { 'X-Credential-Holder': credentialHolder || 'admin' },
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    const result = unwrapResponse(response);
    return (result && result.credentialHolderInfos) ? result.credentialHolderInfos : [];
}

/**
 * Credential Holder 상세 조회
 * @param {string} holderId
 * @returns {object} CredentialHolderInfo
 */
export async function getCredentialHolder(holderId, credentialHolder) {
    const controller = "/api/mc-infra-manager/GetCredentialHolder";
    const data = {
        pathParams: { holderId },
        headers: { 'X-Credential-Holder': credentialHolder || 'admin' },
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

// ─── Connection Config ─────────────────────────────────────────────────

/**
 * Connection Config 목록 조회
 * @param {object} filters - { filterCredentialHolder, filterVerified, filterRegionRepresentative }
 * @returns {Array} ConnConfig[]
 */
export async function listConnConfigs(filters = {}, credentialHolder) {
    const controller = "/api/mc-infra-manager/GetConnConfigList";
    const queryParams = {};
    if (filters.filterCredentialHolder) queryParams.filterCredentialHolder = filters.filterCredentialHolder;
    if (filters.filterVerified !== undefined) queryParams.filterVerified = filters.filterVerified;
    if (filters.filterRegionRepresentative !== undefined) queryParams.filterRegionRepresentative = filters.filterRegionRepresentative;
    const data = {
        queryParams,
        headers: { 'X-Credential-Holder': credentialHolder || 'admin' },
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    const result = unwrapResponse(response);
    return (result && result.connConfig) ? result.connConfig : [];
}

/**
 * Connection Config 상세 조회
 * @param {string} connConfigName
 * @returns {object} ConnConfig
 */
export async function getConnConfig(connConfigName, credentialHolder) {
    const controller = "/api/mc-infra-manager/GetConnConfig";
    const data = {
        pathParams: { connConfigName },
        headers: { 'X-Credential-Holder': credentialHolder || 'admin' },
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

// ─── 암호화 유틸 ───────────────────────────────────────────────────────

/**
 * 평문 credential 값을 RSA 공개키로 암호화하여 RegisterCredential payload 생성
 * Web Crypto API(SubtleCrypto) 사용 — 브라우저 환경에서만 동작
 *
 * @param {string} providerName        - CSP 이름 (소문자, e.g. "aws")
 * @param {string} credentialHolder    - Holder 이름 (e.g. "admin")
 * @param {string} tokenId             - getPublicKeyForCredential() 응답의 tokenId
 * @param {string} publicKeyPem        - PEM 형식 RSA 공개키
 * @param {Array}  keyValueList        - [{ key: "ClientId", value: "AKIA..." }, ...]
 * @returns {object} RegisterCredential API body
 */
export async function buildEncryptedCredentialPayload(providerName, credentialHolder, tokenId, publicKeyPem, keyValueList) {
    // 1. AES-256 키 생성
    const aesKey = await crypto.subtle.generateKey(
        { name: 'AES-CBC', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
    const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);

    // 2. 각 credential 값을 AES-CBC로 암호화
    const credentialKeyValueList = await Promise.all(keyValueList.map(async ({ key, value }) => {
        const iv = crypto.getRandomValues(new Uint8Array(16));
        const encoded = new TextEncoder().encode(value);
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, aesKey, encoded);
        // IV(16) + ciphertext 를 Base64
        const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.byteLength);
        return { key, encryptedValue: btoa(String.fromCharCode(...combined)) };
    }));

    // 3. PEM → CryptoKey (RSA-OAEP SHA-256)
    const pemBody = publicKeyPem
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');
    const derBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
    const rsaKey = await crypto.subtle.importKey(
        'spki',
        derBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );

    // 4. AES 키를 RSA-OAEP로 암호화
    const encryptedAesKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAesKey);
    const encryptedClientAesKeyByPublicKey = btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey)));

    return {
        providerName,
        credentialHolder,
        publicKeyTokenId: tokenId,
        encryptedClientAesKeyByPublicKey,
        credentialKeyValueList,
    };
}
