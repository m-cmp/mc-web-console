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
        if( data === undefined) {
            var response = await axios.post(url);
        }else {
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
            if (error.response.status === 429){
                alert("too many request : "+ error.message);
                return error
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
                    alert("Session has expired. Please login again.");
                    window.location = "/auth/login"
                    return
                }
            }
            // 403 Forbidden은 권한 부족
            if (error.response && error.response.status === 403) {
                alert("Insufficient permissions. Please contact your administrator.");
                return error;
            }
            // 500 Internal Server Error는 서버 오류
            if (error.response && error.response.status === 500) {
                alert("Server error occurred. Please try again later.");
                return error;
            }
            // 기타 HTTP 에러
            if (error.response && (error.response.status !== 200)){
                const authrefreshStatus = await webconsolejs["common/cookie/authcookie"].refreshCookieAccessToken();
                if (authrefreshStatus) {
                    console.log("refreshCookieAccessToken success. Retrying request with refreshed token...");
                    return commonAPIPost(url, data, true);
                } else {
                    // 토큰 갱신 실패 시에도 세션 만료로 간주
                    alert("Session has expired. Please login again.");
                    window.location = "/auth/login"
                    return
                }
            }
        }
        deactivePageLoader()
        
        // 네트워크 오류나 기타 예외 상황 처리
        if (!error.response) {
            // 네트워크 오류 (서버에 연결할 수 없음)
            if (error.code === 'ECONNABORTED') {
                alert("Request timeout. Please check your network connection and try again.");
            } else if (error.code === 'ERR_NETWORK') {
                alert("Network connection failed. Please check your internet connection and try again.");
            } else {
                alert("An error occurred while processing the request: " + error.message);
            }
        } else {
            // HTTP 에러가 있지만 위에서 처리되지 않은 경우
            alert("An error occurred while processing the request. (Status code: " + error.response.status + ")");
        }
        
        return error
    }
}

export async function commonAPIPostWithoutRetry(url, data) {
    console.log("#### commonAPIPost", );
    console.log("Request URL :", url);
    console.log("Request Data :", JSON.stringify(data));
    console.log("-----------------------");
    try {
        if( data === undefined) {
            var response = await axios.post(url);
        }else {
            var response = await axios.post(url, data);
        }
        console.log("#### commonAPIPost Response");
        console.log("Response status : ", response.status);
        console.log("Response : ", response.data);
        console.log("----------------------------");
        return response;
    } catch (error) {
        console.log("#### commonAPIPost Error");
        console.log("Error: ", error.response ? error.response.status : error.message);
        console.log("----------------------------");
        console.log("Request failed :", error);
        
        // 에러 메시지 표시 (retry 없이)
        if (error.response) {
            if (error.response.status === 401) {
                alert("Authentication required. Please login again.");
            } else if (error.response.status === 403) {
                alert("Insufficient permissions. Please contact your administrator.");
            } else if (error.response.status === 404) {
                console.log("Requested resource not found.");
            } else if (error.response.status === 500) {
                alert("Server error occurred. Please try again later.");
            } else {
                alert("An error occurred while processing the request. (Status code: " + error.response.status + ")");
            }
        } else {
            // 네트워크 오류
            if (error.code === 'ECONNABORTED') {
                alert("Request timeout. Please check your network connection and try again.");
            } else if (error.code === 'ERR_NETWORK') {
                alert("Network connection failed. Please check your internet connection and try again.");
            } else {
                alert("An error occurred while processing the request: " + error.message);
            }
        }
        
        return error
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
 