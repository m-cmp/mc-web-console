document.addEventListener("DOMContentLoaded", function () {

    document.getElementById('target').addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        window.location.hash = selectedValue
    });
    
    const selectElements = document.getElementsByClassName('operationIdSelector');
    Array.from(selectElements).forEach((selectElement) => {
        selectElement.addEventListener('change', (event) => {
            const desc = event.target.selectedOptions[0].getAttribute('desc');
            const descformhint = document.getElementById('descformhint')
            descformhint.innerText = desc
            
            const resourcePath = event.target.selectedOptions[0].getAttribute('resourcePath');
            document.getElementById('resourcePath').value = resourcePath

            const operationId = event.target.selectedOptions[0].value;
            document.getElementById('targetOpertaionId').value = operationId

            const method = event.target.selectedOptions[0].getAttribute('method');
            document.getElementById('method').innerText = method

            const paramsPlaceholder = document.getElementById('paramsPlaceholder')
            let currenthtml = ""
            if (extractBracesContent(resourcePath).length){
                paramsPlaceholder.innerHTML = ""
                Array.from(extractBracesContent(resourcePath)).forEach((param) => {
                    currenthtml += `<div class="input-group mb-1">
                        <span class="input-group-text pathParamsId" id="${param}_id">${param}</span>
                        <input type="text" class="form-control" id="${param}_value">
                    </div>
                    `
                    paramsPlaceholder.innerHTML = currenthtml
                });
            }else {
                paramsPlaceholder.innerHTML = `<div class="input-group mb-2">
                    <span class="input-group-text pathParamsId">----</span>
                    <input type="text" class="form-control">
                </div>
                `
            }
        });
    });

    document.getElementById('requestBtn').addEventListener('click', async () => {
        let pathParamData = {};
        let queryParamData = document.getElementById('queryParamData').value ? JSON.parse(document.getElementById('queryParamData').value) : {};
        let requestData = document.getElementById('requestData').value ? JSON.parse(document.getElementById('requestData').value) : {};

        let operationId = document.getElementById('targetOpertaionId').value
        let resourcePath = document.getElementById('resourcePath').value
        let resourcePathArr = extractBracesContent(resourcePath)
        console.log("resourcePath", resourcePath )
        console.log("resourcePathArr", resourcePathArr )

        Array.from(resourcePathArr).forEach((param) => {
            let paramValue = document.getElementById(param+"_value").value
            pathParamData[param] = paramValue
            console.log("param", param )
            console.log("paramValue", paramValue )
            console.log("pathParamData[param]", pathParamData[param] )
        });

        let data = {
            pathParams: pathParamData,
            queryParams: queryParamData,
            request: requestData,
        };

        const response = await webconsolejs["common/api/http"].commonAPIPost(
            "/api/"+operationId,
            data
        )
        document.getElementById('responseRequestData').innerText = JSON.stringify(data, null, 4)
        document.getElementById('responseData').innerText = JSON.stringify(response, null, 4)
    });
})


function extractBracesContent(str) {
    const regex = /\{([^}]+)\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(str)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}