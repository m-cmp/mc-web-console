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
 