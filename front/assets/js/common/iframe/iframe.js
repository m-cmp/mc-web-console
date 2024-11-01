export function addIframe(targetDiv, srchost, data){
    var iframe = document.createElement("iframe");
    iframe.src = srchost;
    iframe.onload = function() {
        console.log("iFrame loaded..");
        console.log("postMessage : ", data);
        iframe.contentWindow.postMessage(data, srchost);
    };
    var div = document.getElementById(targetDiv);
    div.appendChild(iframe);
}

export async function GetApiHosts(frameworkName){
    var controller = "/api/" + "getapihosts";
    const getapihostsresponse = await webconsolejs["common/api/http"].commonAPIPost(
		controller,
		null,
	);
    const framework = getapihostsresponse.data.responseData[frameworkName];
    if (framework && framework.BaseURL) {
        return framework.BaseURL;
    } else {
        return 'Framework not found';
    }
}
