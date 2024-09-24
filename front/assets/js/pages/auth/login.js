
document.getElementById("loginbtn").addEventListener('click',async function () {
    const data ={
        "request":{
            "id":document.getElementById("id").value,
            "password":document.getElementById("password").value
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost('/api/auth/login', data)
    if (response.status != 200){
        console.log(response)
        alert("LoginFail\n"+response.data)
        document.getElementById("id").value = null
        document.getElementById("password").value = null
    }else{
        console.log("response.data.access_token", response.data.access_token)
        await webconsolejs["common/cookie/authcookie"].updateCookieAccessToken(response.data.access_token);
        window.location = "/"
    }
});
