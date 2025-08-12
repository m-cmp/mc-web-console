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
        // for the test
        // const authrefreshStatus = await webconsolejs["common/cookie/authcookie"].refreshCookieAccessToken();
        // if (authrefreshStatus) {
        //     console.log("refreshCookieAccessToken success. Retrying request with refreshed token...");
        //     return commonAPIPost(url, data, true);
        // }
        //////
        deactivePageLoader()
        return response;
    } catch (error) {
        console.log("#### commonAPIPost Error");
        console.log("Error from : ",url, error.response ? error.response.status : error.message);
        console.log("----------------------------");
        if (!attempt || attempt === undefined) {
            if (error.response) {
                const status = error.response.status;
                switch (status) {
                    case 400:
                        alert("Bad Request: " + error.message);
                        return error;
                    case 401:
                        console.log("status is 401", status)
                        console.log("Attempting token refresh...")
                        // Authentication failed - try token refresh
                        try {
                            const authrefreshStatus = await webconsolejs["common/cookie/authcookie"].refreshCookieAccessToken();
                            console.log("authrefreshStatus", authrefreshStatus)
                            if (authrefreshStatus) {
                                console.log("refreshCookieAccessToken success. Retrying request with refreshed token...");
                                return commonAPIPost(url, data, true);
                            } else {
                                console.error("Token refresh failed");
                                alert("Session is expired. Please login again.");
                                // 쿠키 정리
                                document.cookie = "Authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                                document.cookie = "RefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                                window.location = "/auth/login";
                                return;
                            }
                        } catch (refreshError) {
                            console.error("Error during token refresh:", refreshError);
                            alert("Failed to refresh session. Please login again.");
                            // 쿠키 정리
                            document.cookie = "Authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            document.cookie = "RefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            window.location = "/auth/login";
                            return;
                        }
                    case 403:
                        alert("Access Denied: " + error.message);
                        return error;
                    case 404:
                        alert("Resource Not Found: " + error.message);
                        return error;
                    case 429:
                        alert("Too Many Requests: " + error.message);
                        return error;
                    case 500:
                        alert("Internal Server Error: " + error.message);
                        return error;
                    default:
                        alert("Request Failed: " + error.message);
                        return error;
                }
            }
        }
        deactivePageLoader()
        alert("request fail : "+ error.message);
        return error
    }
}

export async function commonAPIPostWithoutRetry(url, data) {
    console.log("#### commonAPIPostWithoutRetry START");
    console.log("1. Request URL:", url);
    console.log("2. Request Data:", JSON.stringify(data));
    console.log("3. Request headers:", {
        'Content-Type': 'application/json',
        'Authorization': document.cookie.split(';').find(c => c.trim().startsWith('Authorization='))?.split('=')[1] || 'Not found'
    });
    console.log("-----------------------");
  
    try {
        console.log("4. Preparing axios request...");
        let response;
        if (data === undefined) {
            console.log("4a. Sending POST request without data");
            response = await axios.post(url);
        } else {
            console.log("4a. Sending POST request with data");
            response = await axios.post(url, data);
        }
        
        console.log("5. Axios request completed successfully");
        console.log("#### commonAPIPostWithoutRetry Response");
        console.log("6. Response status:", response.status);
        console.log("7. Response headers:", response.headers);        
        console.log("8. Response data:", response.data);
        console.log("9. Response data type:", typeof response.data);
        if (response.data && typeof response.data === 'object') {
            console.log("10. Response data keys:", Object.keys(response.data));
        }
        console.log("11. Response :", response);
        console.log("----------------------------");
        return response;
    } catch (error) {
        console.log("#### commonAPIPostWithoutRetry Error");
        console.log("4. Axios request failed");
        console.log("5. Error status:", error.response ? error.response.status : "No response");
        console.log("6. Error message:", error.message);
        console.log("7. Error response data:", error.response ? error.response.data : "No response data");
        if (error.response && error.response.data) {
            console.log("8. Error response data type:", typeof error.response.data);
            if (typeof error.response.data === 'object') {
                console.log("9. Error response data keys:", Object.keys(error.response.data));
            }
        }
        console.log("----------------------------");
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
 