export async function updateCookieAccessToken(accessToken){
    let now = new Date();
    now.setTime(now.getTime() + (24 * 60 * 60 * 1000)); // 1day
    document.cookie = `Authorization=${accessToken}; path=/; expires=${now.toUTCString()};`;
}

export async function updateCookieRefreshToken(refreshToken){
    let now = new Date();
    now.setTime(now.getTime() + (24 * 60 * 60 * 1000)); // 1day
    document.cookie = `RefreshToken=${refreshToken}; path=/; expires=${now.toUTCString()};`;
}

export async function refreshCookieAccessToken(){
    // const response = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry("/api/auth/refresh")
   var controller = "/api/" + "mc-iam-manager/" + "Loginrefresh"; 
   // 쿠키에서 리프레시 토큰 가져오기
   function getRefreshTokenFromCookie() {
       const cookies = document.cookie.split(';');
       for (let cookie of cookies) {
           const [name, value] = cookie.trim().split('=');
           if (name === 'RefreshToken') {
               return value;
           }
       }
       return null;
   }
   
   const refreshToken = getRefreshTokenFromCookie();
   if (!refreshToken) {
       console.error("Refresh token not found in cookie");
       return false;
   }
   
   console.log("Refresh token from cookie:", refreshToken);

   var data = {
       "refresh_token": refreshToken
   }


    const response = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry(controller, data)
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