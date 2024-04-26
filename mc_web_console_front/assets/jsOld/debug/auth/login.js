import axios from 'axios'

document.addEventListener("DOMContentLoaded", function () {
    axios.get('http://ifconfig.me/all.json')
        .then(function (response) {
            console.log(response.data);
        })
        .catch(function (error) {
            console.error(error);
        });
});