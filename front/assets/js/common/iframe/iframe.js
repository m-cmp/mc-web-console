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

// Docker 내부 hostname(점 없음)을 브라우저 hostname으로 대체하고,
// HTTPS 페이지에서 HTTP URL은 프로토콜을 업그레이드한다.
// localhost 접근 시 http://localhost:PORT 로 변환 (로컬 Docker 개발 환경).
// mc-admin-cli 배포 환경에서 레지스트리에 컨테이너명이 등록되는 문제를 보정.
function resolveIframeUrl(baseURL) {
    try {
        const urlObj = new URL(baseURL);
        const port = urlObj.port ? ':' + urlObj.port : '';
        const rawPath = urlObj.pathname + urlObj.search;
        const path = rawPath === '/' ? '' : rawPath;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        const isIpAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname);

        // IP 주소: 명시적으로 설정된 주소이므로 그대로 사용
        if (isIpAddress) {
            return baseURL;
        }

        // Docker 내부 hostname (점 없음): 브라우저 hostname + protocol로 대체
        if (!urlObj.hostname.includes('.')) {
            if (isLocalhost) {
                return 'http://' + window.location.hostname + port + path;
            }
            return window.location.protocol + '//' + window.location.hostname + port + path;
        }

        // 브라우저가 localhost인 경우: http://localhost:PORT 로 변환
        if (isLocalhost) {
            return 'http://' + window.location.hostname + port + path;
        }

        // HTTPS 페이지에서 HTTP URL → protocol 업그레이드
        if (window.location.protocol === 'https:' && urlObj.protocol === 'http:') {
            return 'https://' + urlObj.hostname + port + path;
        }
    } catch (e) {
        // URL 파싱 실패 시 원본 반환
    }
    return baseURL;
}

export async function GetApiHosts(frameworkName){
    var controller = "/api/" + "getapihosts";
    const getapihostsresponse = await webconsolejs["common/api/http"].commonAPIPost(
		controller,
		null,
	);
    const framework = getapihostsresponse.data.responseData[frameworkName];
    if (framework && framework.BaseURL) {
        return resolveIframeUrl(framework.BaseURL);
    }
    return null;
}

// mc-observability-fe 미등록 시 mc-observability(manager) URL에서 fe URL(18080) 유도
function deriveObservabilityFeUrl(managerBaseURL) {
    return managerBaseURL
        .replace('mc-observability-manager', 'mc-observability-fe')
        .replace('mc-observability-front', 'mc-observability-fe')
        .replace('mc-observability:', 'mc-observability-fe:');
}

export async function GetObservabilityFeHost() {
    const frontHost = await GetApiHosts('mc-observability-fe');
    if (frontHost) {
        return frontHost;
    }

    const managerHost = await GetApiHosts('mc-observability');
    if (!managerHost) {
        return null;
    }

    return resolveIframeUrl(deriveObservabilityFeUrl(managerHost));
}
