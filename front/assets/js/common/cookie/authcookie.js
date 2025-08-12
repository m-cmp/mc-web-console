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
    console.log("=== refreshCookieAccessToken START ===");
    
    // const response = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry("/api/auth/refresh")
   var controller = "/api/auth/refresh"; 
   console.log("1. Controller endpoint:", controller);
   
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
       console.log("2. Getting refresh token from cookie...");
       const cookies = document.cookie.split(';');
       console.log("2a. All cookies:", cookies);
       
       for (let cookie of cookies) {
           const [name, value] = cookie.trim().split('=');
           console.log("2b. Checking cookie:", name, "=", value);
           if (name === 'RefreshToken') {
            console.log("2c. RefreshToken found in cookie:", value);
               return value;
           }
       }
       
       console.log("2d. RefreshToken not found in cookies");
       return null;
   }

   const refreshToken = getRefreshTokenFromCookie();
   if (!refreshToken) {
       console.error("3. ERROR: Refresh token not found in cookie");
       return false;
   }

   // 토큰 형식 검증
   console.log("3. Validating refresh token format...");
   if (!isValidJWT(refreshToken)) {
       console.error("3a. ERROR: Invalid refresh token format:", refreshToken);
       // 잘못된 토큰이면 쿠키에서 제거
       document.cookie = "RefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
       return false;
   }

   console.log("3a. Refresh token format is valid");
   console.log("3b. Refresh token from cookie:", refreshToken);
   console.log("3c. Token parts count:", refreshToken.split('.').length);

   // 요청 데이터 준비 - CommonRequest.Request 형태로 감싸기
   var data = {
       "request": {
           "refresh_token": refreshToken
       }
   }
   console.log("4. Request data prepared:", data);

    try {
        console.log("5. Sending request to:", controller);
        console.log("5a. Request payload:", JSON.stringify(data));
        
        const response = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry(controller, data)
        console.log("6. Response received:", response);
        
        // 응답이 에러인지 확인
        if (response.error || response.response) {
            console.error("6a. ERROR: Response contains error:", response.error || response.response);
            return false;
        }
        
        // 응답 데이터 구조 확인
        if (!response.data) {
            console.error("6b. ERROR: Response data is missing");
            return false;
        }
        console.log("6b. Response data exists:", response.data);
        
        // if (!response.data.responseData) {
        //     console.error("6c. ERROR: ResponseData is missing from response");
        //     console.log("6c. Available response keys:", Object.keys(response.data));
        //     return false;
        // }
        // console.log("6c. ResponseData exists:", response.data.responseData);
        
        // const accessToken = response.data.responseData.access_token;
        // if (!accessToken || accessToken === "") {
        //     console.error("6d. ERROR: Access token is missing or empty in response");
        //     return false;
        // }
        // console.log("6d. Access token found:", accessToken);

        if (!response.data) {
            console.error("6c. ERROR: ResponseData is missing from response");
            console.log("6c. Available response keys:", Object.keys(response.data));
            return false;
        }
        console.log("6c. ResponseData exists:", response.data);
            
        const accessToken = response.data.access_token;
        if (!accessToken || accessToken === "") {
            console.error("6d. ERROR: Access token is missing or empty in response");
            return false;
        }
        console.log("6d. Access token found:", accessToken);
        
        // 새로운 액세스 토큰도 JWT 형식 검증
        console.log("7. Validating new access token format...");
        if (!isValidJWT(accessToken)) {
            console.error("7a. ERROR: Invalid access token format received:", accessToken);
            return false;
        }
        console.log("7a. New access token format is valid");
        
        // 토큰 업데이트
        console.log("8. Updating cookies...");
        updateCookieAccessToken(accessToken)
        console.log("8a. Access token cookie updated");
        
        // refresh_token도 함께 업데이트 (있는 경우)
        if (response.data.refresh_token) {
            const newRefreshToken = response.data.refresh_token;
            console.log("8b. New refresh token received:", newRefreshToken);
            if (isValidJWT(newRefreshToken)) {
                updateCookieRefreshToken(newRefreshToken)
                console.log("8c. Refresh token cookie updated");
            } else {
                console.error("8c. ERROR: Invalid new refresh token format:", newRefreshToken);
            }
        } else {
            console.log("8b. No new refresh token in response");
        }
        
        console.log("9. Token refresh successful");
        console.log("=== refreshCookieAccessToken END ===");
        return true;
        
    } catch (error) {
        console.error("5. ERROR during token refresh:", error);
        console.log("=== refreshCookieAccessToken END WITH ERROR ===");
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