import axios from 'axios';
import qs from 'qs';

document.getElementById("loginbtn").addEventListener('click',function () {
    let csrfToken = document.getElementById("csrf-token").getAttribute('content');
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;

    const userData = {
        id: document.getElementById("id").value,
        password: document.getElementById("password").value
    };

    axios.post('/auth/login', qs.stringify(userData),{
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(function (response) {
            if( response.status == "200"){
                window.location.href='/';
            }
        })
        .catch(function (error) {
        });

});