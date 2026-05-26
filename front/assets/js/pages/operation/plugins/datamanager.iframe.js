function getDataManagerData() {
    const currentWorkspace = webconsolejs["common/api/services/workspace_api"].getCurrentWorkspace();
    const currentProject = webconsolejs["common/api/services/workspace_api"].getCurrentProject();
    const accessToken = webconsolejs["common/storage/sessionstorage"].getSessionCurrentUserToken();

    return {
        accessToken: accessToken,
        workspaceInfo: {
            "id": currentWorkspace.Id,
            "name": currentWorkspace.Name,
        },
        projectInfo: {
            "id": currentProject.Id,
            "ns_id": currentProject.NsId,
            "name": currentProject.Name,
        },
        requestOperationId: ""
    };
}

async function loadDataManager() {
    const currentWorkspace = webconsolejs["common/api/services/workspace_api"].getCurrentWorkspace();
    const currentProject = webconsolejs["common/api/services/workspace_api"].getCurrentProject();

    if (!currentWorkspace || !currentWorkspace.Id || !currentProject || !currentProject.Id) {
        document.getElementById("targetIframe").innerHTML =
            '<div class="alert alert-warning m-3">Workspace와 Project를 선택해 주세요.</div>';
        return;
    }

    var host = await webconsolejs["common/iframe/iframe"].GetApiHosts("mc-data-manager-fe");
    if (!host) {
        document.getElementById("targetIframe").innerHTML =
            '<div class="alert alert-warning m-3">mc-data-manager-fe 서비스 URL을 찾을 수 없습니다.<br>' +
            'Settings &gt; Environment에서 mc-data-manager-fe URL을 등록해 주세요.</div>';
        return;
    }

    const data = getDataManagerData();
    webconsolejs["common/iframe/iframe"].addIframe("targetIframe", host, data);
}

$("#select-current-project").on('change', async function () {
    let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text };
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project);
    await loadDataManager();
});

document.addEventListener("DOMContentLoaded", async function () {
    await loadDataManager();
});
