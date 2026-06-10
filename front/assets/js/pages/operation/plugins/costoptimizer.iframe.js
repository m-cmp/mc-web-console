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

async function loadCostOptimizer() {
    const currentWorkspace = webconsolejs["common/api/services/workspace_api"].getCurrentWorkspace();
    const currentProject = webconsolejs["common/api/services/workspace_api"].getCurrentProject();

    if (!currentWorkspace || !currentWorkspace.Id || !currentProject || !currentProject.Id) {
        document.getElementById("costIframe").innerHTML =
            '<div class="alert alert-warning m-3">Please select a Workspace and Project.</div>';
        return;
    }

    var host = await webconsolejs["common/iframe/iframe"].GetApiHosts("mc-cost-optimizer-fe");
    if (!host) {
        document.getElementById("costIframe").innerHTML =
            '<div class="alert alert-warning m-3">mc-cost-optimizer-fe service URL not found.<br>' +
            'Please register the mc-cost-optimizer-fe URL in Settings &gt; Environment &gt; Cloud SPs &gt; Cloud Overview.</div>';
        return;
    }
    // IFRAME_TARGET_IS_HOST=true 환경에서 :port 형식으로 오던 값에 browser origin을 붙이던 로직.
    // GetApiHosts가 DB full URL을 그대로 전달하도록 변경되어 비활성화.
    // const domain = window.location.protocol + '//' + window.location.hostname;
    // if (host.startsWith(":")) {
    //     host = `${domain}${host}`;
    // }
    const data = getCostOptimizerData();

    document.getElementById("costIframe").innerHTML = '';
    webconsolejs["common/iframe/iframe"].addIframe("costIframe", host, data);
}

// project 변경 시 iframe 재로드
$("#select-current-project").on('change', async function () {
    let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text };
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project);
    await loadCostOptimizer();
});

document.addEventListener("DOMContentLoaded", async function(){
    await loadCostOptimizer();
});
