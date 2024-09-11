
document.getElementById("loginbtn").addEventListener('click',async function () {
    const data ={
        "request":{
            "id":document.getElementById("id").value,
            "password":document.getElementById("password").value
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost('/api/auth/login', data)
    if (response.status != 200){
        alert("LoginFail\n"+response.data)
        document.getElementById("id").value = null
        document.getElementById("password").value = null
    }else{
        saveAccessToken(response.data.access_token)
        window.location = "/"
    }
});

function saveAccessToken(accessToken){
    let now = new Date();
    now.setTime(now.getTime() + (24 * 60 * 60 * 1000)); // 1day
    document.cookie = `Authorization=${accessToken}; path=/; expires=${now.toUTCString()};`;
}