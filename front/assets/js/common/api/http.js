import axios from 'axios';

export async function commonAPIPost(url, data, attempt) {
    activePageLoader()
    if (attempt === undefined) {
        attempt = false;
    }
    console.log("#### commonAPIPost", );
    console.log("Request URL :", url);
    console.log("Request Data :", JSON.stringify(data));
    console.log("-----------------------");
    try {
        if( data === undefined || data === null) {
            var response = await axios.post(url);
        } else if (data.formData instanceof FormData) {
            // FormData 처리 분기 - axios 사용
            console.log("FormData detected, sending with axios");
            
            // pathParams가 있으면 FormData에 추가
            if (data.pathParams) {
                for (const [key, value] of Object.entries(data.pathParams)) {
                    data.formData.append(key, value);
                }
                console.log("Added pathParams to FormData:", data.pathParams);
            }
            
            // queryParams가 있으면 FormData에 추가
            if (data.queryParams) {
                for (const [key, value] of Object.entries(data.queryParams)) {
                    data.formData.append(key, value);
                }
                console.log("Added queryParams to FormData:", data.queryParams);
            }
            
            // FormData 사용 시 Content-Type 헤더를 설정하지 않음
            // 브라우저가 자동으로 boundary 정보와 함께 올바른 헤더를 설정
            var response = await axios.post(url, data.formData);
        } else {
            var response = await axios.post(url, data);
        }
        console.log("#### commonAPIPost Response");
        console.log("Response status : ", response.status);
        console.log("Response from : ",url, response.data);
        console.log("----------------------------");
        deactivePageLoader()
        return response;
    } catch (error) {
        console.log("#### commonAPIPost Error");
        console.log("Error from : ",url, error.response ? error.response.status : error.message);
        console.log("----------------------------");
        if (!attempt || attempt === undefined) {
            if (error.response && error.response.status === 429) {
                webconsolejs["common/util"].showToast("Too many requests. Please try again later.", 'warning');
                return error;
            }
            // 404 에러는 데이터가 없는 정상적인 상황이므로 토큰 갱신하지 않음
            if (error.response && error.response.status === 404) {
                console.log("Resource not found (404) - this may be normal for empty data");
                return error;
            }
            // 401 Unauthorized는 토큰 만료 또는 인증 실패
            if (error.response && error.response.status === 401) {
                const authrefreshStatus = await webconsolejs["common/cookie/authcookie"].refreshCookieAccessToken();
                if (authrefreshStatus) {
                    console.log("refreshCookieAccessToken success. Retrying request with refreshed token...");
                    return commonAPIPost(url, data, true);
                } else {
                    webconsolejs["common/util"].showToast("Session has expired. Please login again.", 'error');
                    window.location = "/auth/login";
                    return;
                }
            }
            // 403 Forbidden은 권한 부족
            if (error.response && error.response.status === 403) {
                webconsolejs["common/util"].showToast("Insufficient permissions. Please contact your administrator.", 'error');
                return error;
            }
            // 500 Internal Server Error는 서버 오류
            if (error.response && error.response.status === 500) {
                webconsolejs["common/util"].showToast("Server error occurred. Please try again later.", 'error');
                return error;
            }
            // 기타 HTTP 에러
            if (error.response && (error.response.status !== 200)) {
                const authrefreshStatus = await webconsolejs["common/cookie/authcookie"].refreshCookieAccessToken();
                if (authrefreshStatus) {
                    console.log("refreshCookieAccessToken success. Retrying request with refreshed token...");
                    return commonAPIPost(url, data, true);
                } else {
                    // 토큰 갱신 실패 시 에러 메시지만 표시하고 로그인 페이지로 리다이렉트하지 않음
                    webconsolejs["common/util"].showToast("An error occurred. Please try again later.", 'error');
                    return error;
                }
            }
        }
        deactivePageLoader();
        
        // 네트워크 오류나 기타 예외 상황 처리
        if (!error.response) {
            // 네트워크 오류 (서버에 연결할 수 없음)
            if (error.code === 'ECONNABORTED') {
                webconsolejs["common/util"].showToast("Request timeout. Please check your network connection and try again.", 'error');
            } else if (error.code === 'ERR_NETWORK') {
                webconsolejs["common/util"].showToast("Network connection failed. Please check your internet connection and try again.", 'error');
            } else {
                webconsolejs["common/util"].showToast("An error occurred while processing the request: " + error.message, 'error');
            }
        } else {
            // HTTP 에러가 있지만 위에서 처리되지 않은 경우
            webconsolejs["common/util"].showToast("An error occurred while processing the request. (Status code: " + error.response.status + ")", 'error');
        }
        
        return error;
    }
}

export async function commonAPIPostWithoutRetry(url, data) {   
    try {
        let response;
        if (data === undefined) {
            response = await axios.post(url);
        } else {
            response = await axios.post(url, data);
        }
        console.log("#### commonAPIPostWithoutRetry Response");
        console.log("Response status : ", response.status);
        console.log("Response from : ",url, response.data);
        console.log("----------------------------");
        return response;
    } catch (error) {
        console.log("#### commonAPIPostWithoutRetry Error");
        console.log("Error status:", error.response ? error.response.status : "No response");
        console.log("Error message:", error.message);
        console.log("Error response data:", error.response ? error.response.data : "No response data");
        if (error.response && error.response.data) {
            if (typeof error.response.data === 'object') {
                console.log("Error response data keys:", Object.keys(error.response.data));
            }
        }
        console.log("----------------------------");
        console.log("Request failed :", error);
        
        // 에러 메시지 표시 (retry 없이)
        if (error.response) {
            if (error.response.status === 401) {
                webconsolejs["common/util"].showToast("Authentication required. Please login again.", 'error');
            } else if (error.response.status === 403) {
                webconsolejs["common/util"].showToast("Insufficient permissions. Please contact your administrator.", 'error');
            } else if (error.response.status === 404) {
                console.log("Requested resource not found.");
            } else if (error.response.status === 500) {
                webconsolejs["common/util"].showToast("Server error occurred. Please try again later.", 'error');
            } else {
                webconsolejs["common/util"].showToast("An error occurred while processing the request. (Status code: " + error.response.status + ")", 'error');
            }
        } else {
            // 네트워크 오류
            if (error.code === 'ECONNABORTED') {
                webconsolejs["common/util"].showToast("Request timeout. Please check your network connection and try again.", 'error');
            } else if (error.code === 'ERR_NETWORK') {
                webconsolejs["common/util"].showToast("Network connection failed. Please check your internet connection and try again.", 'error');
            } else {
                webconsolejs["common/util"].showToast("An error occurred while processing the request: " + error.message, 'error');
            }
        }
        
        return error;
    }
}

function activePageLoader(){
    try{
        document.getElementById("pageloader").classList.add('active');
    }catch(error){
        console.log("pageloader is not exist ")
    }
}

function deactivePageLoader(){
    try{
        document.getElementById("pageloader").classList.remove('active');
    }catch(error){
        console.log("pageloader is not exist ")
    }
}

export async function commonAPIGet(url) {
    console.log("#### commonAPIGet")
    console.log("Request URL : ", url)

    const response = await axios.get(url)
        .then(function (response) {
            console.log("#### commonAPIPost Response")
            console.log("Response status : ", (response.status))
            console.log("----------------------------")
            return response
        })
        .catch(function (error) {
            console.log("#### commonAPIPost Response ERR")
            console.log("error : ", (error))
            console.log("--------------------------------")
            return error
        });

    return response
}
 