const DEFAULT_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const MIN_SCHEDULE_DELAY_MS = 30 * 1000;
const DEFAULT_ACCESS_TTL_MS = 25 * 60 * 1000;

let proactiveRefreshTimer = null;
let refreshInFlight = null;
let nextProactiveRefreshAt = null;

function getRefreshBufferMs() {
  if (typeof window !== 'undefined' && window.__MCWC_TOKEN_REFRESH_BUFFER_MS > 0) {
    return window.__MCWC_TOKEN_REFRESH_BUFFER_MS;
  }
  return DEFAULT_REFRESH_BUFFER_MS;
}

function isValidJWT(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  return Boolean(parts[0] && parts[1] && parts[2]);
}

function getCookie(name) {
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return value;
    }
  }

  return null;
}

function decodeJwtPayload(token) {
  if (!isValidJWT(token)) {
    return null;
  }

  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch (error) {
    console.error('Failed to decode JWT payload:', error);
    return null;
  }
}

function getAccessTokenFromCookie() {
  return getCookie('Authorization');
}

function getRefreshTokenFromCookie() {
  return getCookie('RefreshToken');
}

function syncSessionTokens() {
  if (!webconsolejs || !webconsolejs['common/storage/sessionstorage']) {
    return;
  }

  webconsolejs['common/storage/sessionstorage'].setSessionCurrentUserToken();
  webconsolejs['common/storage/sessionstorage'].setSessionCurrentUserRefreshToken();
}

export async function updateCookieAccessToken(accessToken) {
  let now = new Date();
  now.setTime(now.getTime() + (24 * 60 * 60 * 1000));
  document.cookie = `Authorization=${accessToken}; path=/; expires=${now.toUTCString()};`;
}

export async function updateCookieRefreshToken(refreshToken) {
  let now = new Date();
  now.setTime(now.getTime() + (24 * 60 * 60 * 1000));
  document.cookie = `RefreshToken=${refreshToken}; path=/; expires=${now.toUTCString()};`;
}

function computeProactiveRefreshDelayMs(accessToken) {
  const payload = decodeJwtPayload(accessToken);
  const bufferMs = getRefreshBufferMs();
  const nowMs = Date.now();

  if (payload && payload.exp) {
    const refreshAtMs = (payload.exp * 1000) - bufferMs;
    return Math.max(refreshAtMs - nowMs, MIN_SCHEDULE_DELAY_MS);
  }

  return Math.max(DEFAULT_ACCESS_TTL_MS - bufferMs, MIN_SCHEDULE_DELAY_MS);
}

export function stopProactiveTokenRefresh() {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
  nextProactiveRefreshAt = null;
}

async function runProactiveTokenRefresh() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const ok = await refreshCookieAccessToken();
    if (!ok) {
      console.warn('[authcookie] proactive refresh failed');
      stopProactiveTokenRefresh();
      if (webconsolejs && webconsolejs['common/util']) {
        webconsolejs['common/util'].showToast(
          'Session has expired. Please login again.',
          'error',
        );
      }
      window.location = '/auth/login';
      return false;
    }

    console.log('[authcookie] proactive refresh succeeded');
    scheduleProactiveTokenRefresh();
    return true;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export function scheduleProactiveTokenRefresh() {
  stopProactiveTokenRefresh();

  const accessToken = getAccessTokenFromCookie();
  const refreshToken = getRefreshTokenFromCookie();

  if (!accessToken || !refreshToken) {
    return;
  }

  if (!isValidJWT(accessToken) || !isValidJWT(refreshToken)) {
    return;
  }

  const delayMs = computeProactiveRefreshDelayMs(accessToken);
  nextProactiveRefreshAt = Date.now() + delayMs;

  proactiveRefreshTimer = setTimeout(() => {
    runProactiveTokenRefresh();
  }, delayMs);

  console.log(
    `[authcookie] proactive refresh scheduled in ${Math.round(delayMs / 1000)}s`,
  );
}

export function startProactiveTokenRefresh() {
  const accessToken = getAccessTokenFromCookie();
  if (!accessToken) {
    return;
  }

  const payload = decodeJwtPayload(accessToken);
  const bufferMs = getRefreshBufferMs();
  const expiresSoon = payload && payload.exp
    ? (payload.exp * 1000) - Date.now() <= bufferMs
    : false;

  if (expiresSoon) {
    runProactiveTokenRefresh();
    return;
  }

  scheduleProactiveTokenRefresh();
}

export function isProactiveTokenRefreshActive() {
  return proactiveRefreshTimer !== null;
}

export function getNextProactiveRefreshAt() {
  return nextProactiveRefreshAt;
}

export async function runProactiveTokenRefreshNow() {
  return runProactiveTokenRefresh();
}

export async function refreshCookieAccessToken() {
  const controller = '/api/auth/refresh';
  const refreshToken = getRefreshTokenFromCookie();

  if (!refreshToken) {
    return false;
  }

  if (!isValidJWT(refreshToken)) {
    document.cookie = 'RefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    return false;
  }

  const data = {
    request: {
      refresh_token: refreshToken,
    },
  };

  try {
    const response = await webconsolejs['common/api/http'].commonAPIPostWithoutRetry(
      controller,
      data,
    );

    if (response.error || response.response) {
      console.error('ERROR: Response contains error:', response.error || response.response);
      return false;
    }

    if (!response.data) {
      console.error('ERROR: Response data is missing');
      return false;
    }

    const accessToken = response.data.access_token;
    if (!accessToken || accessToken === '') {
      console.error('ERROR: Access token is missing or empty in response');
      return false;
    }

    if (!isValidJWT(accessToken)) {
      console.error('ERROR: Invalid access token format received:', accessToken);
      return false;
    }

    await updateCookieAccessToken(accessToken);

    if (response.data.refresh_token) {
      const newRefreshToken = response.data.refresh_token;
      if (isValidJWT(newRefreshToken)) {
        await updateCookieRefreshToken(newRefreshToken);
      } else {
        console.error('ERROR: Invalid new refresh token format:', newRefreshToken);
      }
    }

    syncSessionTokens();
    scheduleProactiveTokenRefresh();
    return true;
  } catch (error) {
    console.error('ERROR during token refresh:', error);
    return false;
  }
}
