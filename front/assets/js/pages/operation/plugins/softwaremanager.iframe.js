// 동적으로 workspace와 project 정보를 가져오는 함수
function getSoftwareManagerData() {

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
    var host =  await webconsolejs["common/iframe/iframe"].GetApiHosts("mc-application-manager")
    const domain = window.location.protocol + '//' + window.location.hostname;

    if (host.startsWith(":")) {
        host = `${domain}${host}`;
    }
    
    // 동적으로 데이터 가져오기
    const data = getSoftwareManagerData();
    
    // webconsolejs["common/iframe/iframe"].addIframe("targetIframe-repository", host+"/web/repository/list", data)
    webconsolejs["common/iframe/iframe"].addIframe("targetIframe-sofrwareCatalog", host+"/web/softwareCatalog", data)
});