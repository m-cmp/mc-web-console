import axios from 'axios';

document.getElementById("loginbtn").addEventListener('click',function () {
    let csrfToken = document.getElementById("csrf-token").getAttribute('content');
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;

    const userData ={
        id: document.getElementById("id").value,
        password: document.getElementById("password").value,
    };

    axios.post('/auth/login', userData)
    .then(function (response) {
        if (response.status != 200){
            alert(response.data)
        }else{

            window.location = response.data.redirect
        }
        
    })
    .catch(function (error) {
        alert("LoginFail\n"+error.response.data.err)
        document.getElementById("id").value = null
        document.getElementById("password").value = null
    });
});