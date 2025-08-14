export async function updateCookieAccessToken(accessToken) {
    let now = new Date();
    now.setTime(now.getTime() + (24 * 60 * 60 * 1000)); // 1day
    document.cookie = `Authorization=${accessToken}; path=/; expires=${now.toUTCString()};`;
}

export async function updateCookieRefreshToken(refreshToken) {
    let now = new Date();
    now.setTime(now.getTime() + (24 * 60 * 60 * 1000)); // 1day
    document.cookie = `RefreshToken=${refreshToken}; path=/; expires=${now.toUTCString()};`;
}

export async function refreshCookieAccessToken(){
   var controller = "/api/auth/refresh"; 
   
   // JWT 토큰 형식 검증 함수
   function isValidJWT(token) {
       if (!token || typeof token !== 'string') {
           return false;
       }
       
       // JWT는 3개의 부분으로 구성되어야 함 (header.payload.signature)
       const parts = token.split('.');
       if (parts.length !== 3) {
           console.error("Invalid JWT format: token should have 3 parts, got", parts.length);
           return false;
       }
       
       // 각 부분이 비어있지 않아야 함
       if (!parts[0] || !parts[1] || !parts[2]) {
           console.error("Invalid JWT format: one or more parts are empty");
           return false;
       }
       
       return true;
   }
   
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
       return false;
   }

   // 토큰 형식 검증
   if (!isValidJWT(refreshToken)) {
       // 잘못된 토큰이면 쿠키에서 제거
       document.cookie = "RefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
       return false;
   }

   // 요청 데이터 준비 - CommonRequest.Request 형태로 감싸기
   var data = {
       "request": {
           "refresh_token": refreshToken
       }
   }

    try {
        
        const response = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry(controller, data)
        
        // 응답이 에러인지 확인
        if (response.error || response.response) {
            console.error("ERROR: Response contains error:", response.error || response.response);
            return false;
        }
        
        // 응답 데이터 구조 확인
        if (!response.data) {
            console.error("ERROR: Response data is missing");
            return false;
        }

        const accessToken = response.data.access_token;
        if (!accessToken || accessToken === "") {
            console.error("ERROR: Access token is missing or empty in response");
            return false;
        }
        
        // 새로운 액세스 토큰도 JWT 형식 검증
        if (!isValidJWT(accessToken)) {
            console.error("ERROR: Invalid access token format received:", accessToken);
            return false;
        }
        
        // 토큰 업데이트
        updateCookieAccessToken(accessToken)
        
        // refresh_token도 함께 업데이트 (있는 경우)
        if (response.data.refresh_token) {
            const newRefreshToken = response.data.refresh_token;
            if (isValidJWT(newRefreshToken)) {
                updateCookieRefreshToken(newRefreshToken)
            } else {
                console.error("ERROR: Invalid new refresh token format:", newRefreshToken);
            }
        } else {
            console.log("No new refresh token in response");
        }
        
        return true;
        
    } catch (error) {
        console.error("ERROR during token refresh:", error);
        return false;
    }
}
// export async function refreshCookieAccessToken() {
//     const response = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry("/api/auth/refresh")
    
    
//     try {
//         if (response.data.responseData.access_token === undefined || response.data.responseData.access_token === "") {
//             return false
//         } else {
//             updateCookieAccessToken(response.data.responseData.access_token)
//             return true
//         }
//     } catch (error) {
//         return false
//     }
// }