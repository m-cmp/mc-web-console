// const data = {
//     projectid: 'mzctestPrj',
//     workspaceid: 'mzctestWs',
//     usertoken: 'mzctoken'
// };

// 데모환경에서 사용할 예제 데이터 입니다.
function getCostOptimizerData() {

    const currentWorkspace = webconsolejs["common/api/services/workspace_api"].getCurrentWorkspace();
    const currentProject = webconsolejs["common/api/services/workspace_api"].getCurrentProject();
    console.log("Current Workspace:", currentWorkspace);
    console.log("Current Project:", currentProject);
    
    const accessToken = webconsolejs["common/storage/sessionstorage"].getSessionCurrentUserToken();
    
    return {
        accessToken: accessToken,
        workspaceInfo: {
            "id": currentWorkspace.Id,
            "name": currentWorkspace.Name,
        },
        projectInfo: {
            "id": currentProject.Id ,
            "ns_id": currentProject.NsId,
            "name": currentProject.Name,
        },
        requestOperationId: ""
    };
}

document.addEventListener("DOMContentLoaded", async function(){
    var host = await webconsolejs["common/iframe/iframe"].GetApiHosts("mc-cost-optimizer");
    if (!host) {
        document.getElementById("costIframe").innerHTML =
            '<div class="alert alert-warning m-3">mc-cost-optimizer 서비스 URL을 찾을 수 없습니다.<br>' +
            'Settings &gt; Environment &gt; Cloud SPs &gt; Cloud Overview 에서 서비스 URL을 등록해 주세요.</div>';
        return;
    }
    const domain = window.location.protocol + '//' + window.location.hostname;
    if (host.startsWith(":")) {
        host = `${domain}${host}`;
    }
    const data = getCostOptimizerData();

    webconsolejs["common/iframe/iframe"].addIframe("costIframe", host, data);
});