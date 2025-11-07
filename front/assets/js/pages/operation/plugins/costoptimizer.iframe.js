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
    var host =  await webconsolejs["common/iframe/iframe"].GetApiHosts("mc-cost-optimizer")
    const domain = window.location.protocol + '//' + window.location.hostname;
    if (host.startsWith(":")) {
        host = `${domain}${host}`;
    }
    const data = getCostOptimizerData();

    webconsolejs["common/iframe/iframe"].addIframe("costIframe", host, data)
});