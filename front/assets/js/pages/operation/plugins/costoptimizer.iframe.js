// const data = {
//     projectid: 'mzctestPrj',
//     workspaceid: 'mzctestWs',
//     usertoken: 'mzctoken'
// };

// 데모환경에서 사용할 예제 데이터 입니다.
const data = {
    accessToken: "accesstokenExample",
    workspaceInfo: {
        "id": "UUID", // 이부분은 UUID로 별도 정보가 필요할시 해당 ID 를 활용해 IAM 과 연동하시면됩니다.
        "name": "ws01", // Display 용 이름입니다. 
        "description": "ws01 desc", // 설명입니다. 
        "created_at": "UTC",
        "updated_at": "UTC"
    },
    projectInfo: {
        "id": "UUID",  // 이부분은 UUID로 별도 정보가 필요할시 해당 ID 를 활용해 IAM 과 연동하시면됩니다.
        "ns_id": "ns01", // 텀블벅 연동 ID 입니다.
        "name": "ns01", // Display 용 이름입니다. 
        "description": "ns01 desc", // 설명입니다. 
        "created_at": "UTC",
        "updated_at": "UTC"
    },
    requestOperationId: ""
};

document.addEventListener("DOMContentLoaded", async function(){
    var host =  await webconsolejs["common/iframe/iframe"].GetApiHosts("mc-cost-optimizer")
    const domain = window.location.protocol + '//' + window.location.hostname;
    if (host.startsWith(":")) {
        host = `${domain}${host}`;
    }
    webconsolejs["common/iframe/iframe"].addIframe("costIframe", host, data)
});