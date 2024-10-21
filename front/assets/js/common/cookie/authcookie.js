export async function updateCookieAccessToken(accessToken){
    let now = new Date();
    now.setTime(now.getTime() + (24 * 60 * 60 * 1000)); // 1day
    document.cookie = `Authorization=${accessToken}; path=/; expires=${now.toUTCString()};`;
}

export async function refreshCookieAccessToken(){
    const response = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry("/api/auth/refresh")
    if (response.status !== 200) {
        return false
    }
    updateCookieAccessToken(response.data.access_token)
    return true
}