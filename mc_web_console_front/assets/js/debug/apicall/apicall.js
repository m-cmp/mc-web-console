import axios from 'axios';
import { TabulatorFull as Tabulator } from 'tabulator-tables';


document.getElementById("sendBtn").addEventListener('click',function () {
    let method = document.getElementById("methodSelect").value
    let url = document.getElementById("url").value
    
    if (document.getElementById("CSRFSelect").value == "True") {
        let csrfToken = document.getElementById("csrf-token").getAttribute('content');
        axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
    } else {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = "";
    }

    if (document.getElementById("authorizationSelect").value == "BearerToken") {
        axios.defaults.headers.common['Authorization'] = "Bearer "+ document.getElementById("bearerToken").value;
        console.log(axios.defaults.headers)
    }

    axios({
        method: method,
        url: paramsTable.getData().length > 0 ? url +'?'+ buildQueryString(paramsTable.getData()) : url,
        data: document.getElementById("bodyArea").value ? document.getElementById("bodyArea").value : "",
        }).then(function (response) {
            document.getElementById("RequestTarget").innerText=paramsTable.getData().length > 0 ? url +'?'+ buildQueryString(paramsTable.getData()) : url;
            document.getElementById("ResponseData").innerText=JSON.stringify(response.data, null, 2);
            document.getElementById("ResponseHeaders").innerText=response.headers;
            console.log(response.data);
        })
        .catch(function (error) {
            document.getElementById("RequestTarget").innerText="";
            document.getElementById("ResponseData").innerText=error;
            document.getElementById("ResponseHeaders").innerText="";
            console.error(error);
        });

});

function buildQueryString(data) {
    return data.map(item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`).join('&');
}

let paramsTable = new Tabulator()
document.addEventListener("DOMContentLoaded", function () {
    paramsTable = new Tabulator("#paramsTable", {
        layout:"fitColumns",
        resizableColumnFit:true,
        columns:[
                {title:"KEY", field:"key", editor:"input"},
                {title:"VALUE", field:"value", editor:"input"},
                {formatter:"buttonCross", resizable:false, frozen:true, align:"center", title:"del", headerSort:false, cellClick:function(e, cell){
                    if(confirm('Are you sure you want to delete?'))
                        cell.getRow().delete();
                    }
                }
            ],
        
    });
});
document.getElementById("paramAdd").addEventListener('click',function () {
    paramsTable.addRow();
});

let headerTable = new Tabulator()
document.addEventListener("DOMContentLoaded", function () {
    headerTable = new Tabulator("#headerTable", {
        layout:"fitColumns",
        resizableColumnFit:true,
        columns:[
                {title:"KEY", field:"key", editor:"input"},
                {title:"VALUE", field:"value", editor:"input"},
                {formatter:"buttonCross", resizable:false, frozen:true, align:"center", title:"del", headerSort:false, cellClick:function(e, cell){
                    if(confirm('Are you sure you want to delete?'))
                        cell.getRow().delete();
                    }
                }
            ],
        
    });
});
document.getElementById("headerAdd").addEventListener('click',function () {
    headerTable.addRow();
});

