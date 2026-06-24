const DEFAULT_PROACTIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

let proactiveRefreshTimer = null;
let refreshInFlight = null;
let nextProactiveRefreshAt = null;
let lastRefreshAtMs = 0;

function getProactiveRefreshIntervalMs() {
  if (typeof window !== 'undefined' && window.__MCWC_TOKEN_REFRESH_INTERVAL_MS > 0) {
    return window.__MCWC_TOKEN_REFRESH_INTERVAL_MS;
  }
  return DEFAULT_PROACTIVE_REFRESH_INTERVAL_MS;
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

function hasValidAuthTokens() {
  const accessToken = getAccessTokenFromCookie();
  const refreshToken = getRefreshTokenFromCookie();

  return Boolean(
    accessToken && refreshToken
      && isValidJWT(accessToken) && isValidJWT(refreshToken),
  );
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

export function stopProactiveTokenRefresh() {
  if (proactiveRefreshTimer) {
    clearInterval(proactiveRefreshTimer);
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
    return true;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export function scheduleProactiveTokenRefresh() {
  startProactiveTokenRefresh();
}

export function startProactiveTokenRefresh() {
  if (proactiveRefreshTimer) {
    return;
  }

  if (!hasValidAuthTokens()) {
    return;
  }

  const intervalMs = getProactiveRefreshIntervalMs();
  nextProactiveRefreshAt = Date.now() + intervalMs;

  proactiveRefreshTimer = setInterval(() => {
    nextProactiveRefreshAt = Date.now() + intervalMs;
    runProactiveTokenRefresh();
  }, intervalMs);

  console.log(
    `[authcookie] proactive refresh interval: every ${Math.round(intervalMs / 1000)}s`,
  );
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

export async function refreshCookieAccessToken(options = {}) {
  const force = options.force === true;
  const intervalMs = getProactiveRefreshIntervalMs();
  const nowMs = Date.now();

  if (!force && lastRefreshAtMs > 0 && (nowMs - lastRefreshAtMs) < intervalMs) {
    console.log(
      `[authcookie] refresh skipped (last refresh ${Math.round((nowMs - lastRefreshAtMs) / 1000)}s ago)`,
    );
    return true;
  }

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
    lastRefreshAtMs = Date.now();
    return true;
  } catch (error) {
    console.error('ERROR during token refresh:', error);
    return false;
  }
}
