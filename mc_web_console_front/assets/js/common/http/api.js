import axios from 'axios';

export function commonAPIPost(url, data) {

    console.log("#### commonAPIPost")
    console.log("Request URL : ", url)
    console.log("Request Data : ")
    console.log(JSON.stringify(data))
    console.log("-----------------------")

    let csrfToken = document.getElementById("csrf-token").getAttribute('content');
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;

    axios.post(url, data)
    .then(function (response) {
        console.log("## commonAPIPost Response")
        console.log("Response status : ", (response.status))
        console.log("Response Data : ")
        console.log(JSON.stringify(response.data))
        console.log("----------------------------")
        return response
    })
    .catch(function (error) {
        console.log("## commonAPIPost Response ERR")
        console.log("error : ", (error))
        console.log("--------------------------------")
        return error
    });
}