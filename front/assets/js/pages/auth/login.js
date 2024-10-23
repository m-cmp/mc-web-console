
document.getElementById("loginbtn").addEventListener('click',async function () {
    const data ={
        "request":{
            "id":document.getElementById("id").value,
            "password":document.getElementById("password").value
        }
    };
    const response = await webconsolejs["common/api/http"].commonAPIPostWithoutRetry('/api/auth/login', data)
    if (response.status !== 200){
        alert("LoginFail\n"+response)
        document.getElementById("id").value = null
        document.getElementById("password").value = null
    }else{
        await webconsolejs["common/cookie/authcookie"].updateCookieAccessToken(response.data.access_token);
        const menuListresponse = await webconsolejs["common/api/http"].commonAPIPost('/api/getmenutree')
        try{
            let tempMenulist = menuListresponse.data.responseData
            tempMenulist.forEach(tempMenulist => sortMenusByPriority(tempMenulist));
            webconsolejs["common/storage/localstorage"].setMenuLocalStorage(tempMenulist)
            window.location = "/"
        } catch(error){
            console.log(error)
            alert("dynamic menu error : " + error)
            window.location = "/"
        }
    }
});

document.getElementById('id').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('loginbtn').click();
    }
});

document.getElementById('password').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('loginbtn').click();
    }
});

function sortMenusByPriority(menu) {
    if (menu.menus && Array.isArray(menu.menus)) {
        menu.menus.sort((a, b) => parseInt(a.priority) - parseInt(b.priority));
        menu.menus.forEach(subMenu => sortMenusByPriority(subMenu));
    }
    return menu;
}