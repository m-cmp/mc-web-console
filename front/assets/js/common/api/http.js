import axios from 'axios';

export async function commonAPIPost(url, data, attempt) {
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
        return response;
    } catch (error) {
        console.log("#### commonAPIPost Error");
        console.log("Error from : ",url, error.response ? error.response.status : error.message);
        console.log("----------------------------");
        if (!attempt || undefined) {
            if (error.response && (error.response.status === 401)){
                const authrefreshStatus = await webconsolejs["common/cookie/authcookie"].refreshCookieAccessToken();
                if (authrefreshStatus) {
                    console.log("Retrying request with refreshed token...");
                    return commonAPIPost(url, data, true);
                }
            } 
        } else {
            alert("error while refresh.", error);
            window.location = "/auth/unauthorized"
        }
        console.log("Request failed :", error);
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
        return error
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
