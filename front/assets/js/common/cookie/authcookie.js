export async function updateCookieAccessToken(accessToken){
    let now = new Date();
    now.setTime(now.getTime() + (24 * 60 * 60 * 1000)); // 1day
    document.cookie = `Authorization=${accessToken}; path=/; expires=${now.toUTCString()};`;
}

export async function refreshCookieAccessToken(){
    const response = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry("/api/auth/refresh")
    try{
        if (response.data.responseData.access_token === undefined || response.data.responseData.access_token === "") {
            return false
        }else {
            updateCookieAccessToken(response.data.responseData.access_token)
            return true
        }
    }catch(error){
        return false
    }
}