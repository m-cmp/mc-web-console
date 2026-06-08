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
            '<div class="alert alert-warning m-3">Please select a Workspace and Project.</div>';
        return;
    }

    var host = await webconsolejs["common/iframe/iframe"].GetApiHosts("mc-data-manager-fe");
    if (!host) {
        document.getElementById("targetIframe").innerHTML =
            '<div class="alert alert-warning m-3">mc-data-manager-fe service URL not found.<br>' +
            'Please register the mc-data-manager-fe URL in Settings &gt; Environment.</div>';
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
