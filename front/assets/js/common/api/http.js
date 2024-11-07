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
            if (error.response && (error.response.status !== 200)){
                const authrefreshStatus = await webconsolejs["common/cookie/authcookie"].refreshCookieAccessToken();
                if (authrefreshStatus) {
                    console.log("refreshCookieAccessToken success. Retrying request with refreshed token...");
                    return commonAPIPost(url, data, true);
                } else {
                    alert("session is expired");
                    window.location = "/auth/login"
                    return
                }
            }
        }
        deactivePageLoader()
        alert("request fail : "+ error.message);
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
 