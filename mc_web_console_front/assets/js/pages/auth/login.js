import axios from 'axios';

document.getElementById("loginbtn").addEventListener('click',async function () {
    let csrfToken = document.getElementById("csrf-token").getAttribute('content');
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;

    const userData ={
        id: document.getElementById("id").value,
        password: document.getElementById("password").value,
    };
    const response = await webconsolejs["common/api/http"].commonAPIPost('/auth/login', userData)
    if (response.status != 200){
        alert("LoginFail\n"+response.data)
        document.getElementById("id").value = null
        document.getElementById("password").value = null
    }else{
        window.location = response.data.redirect
    }
});