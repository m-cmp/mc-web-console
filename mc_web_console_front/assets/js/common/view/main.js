// starting 지점.

document.addEventListener('DOMContentLoaded', function () {
    console.log("DOMContentLoaded")
    const data = {
        "requestData":{"userid":"asd"}
    }
    webconsolejs["common/http/api"].commonAPIPost('/api/workspacelistbyuser',data)
});
