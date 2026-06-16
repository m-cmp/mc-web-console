function getSoftwareManagerData() {
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

async function loadSoftwareManager() {
    const currentWorkspace = webconsolejs["common/api/services/workspace_api"].getCurrentWorkspace();
    const currentProject = webconsolejs["common/api/services/workspace_api"].getCurrentProject();

    if (!currentWorkspace || !currentWorkspace.Id || !currentProject || !currentProject.Id) {
        document.getElementById("targetIframe-sofrwareCatalog").innerHTML =
            '<div class="alert alert-warning m-3">Please select a Workspace and Project.</div>';
        return;
    }

    var host = await webconsolejs["common/iframe/iframe"].GetApiHosts("mc-application-manager-fe");
    if (!host) {
        document.getElementById("targetIframe-sofrwareCatalog").innerHTML =
            '<div class="alert alert-warning m-3">mc-application-manager-fe service URL not found.<br>' +
            'Please register the mc-application-manager-fe URL in Settings &gt; Environment.</div>';
        return;
    }

    const data = getSoftwareManagerData();

    // mc-application-manager API URL을 레지스트리에서 직접 조회하여 전달
    var apiHost = await webconsolejs["common/iframe/iframe"].GetApiHosts("mc-application-manager");
    if (apiHost) {
        data.apiBaseUrl = apiHost;
    }

    webconsolejs["common/iframe/iframe"].addIframe("targetIframe-sofrwareCatalog", host + "/web/softwareCatalog", data);
}

$("#select-current-project").on('change', async function () {
    let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text };
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project);
    await loadSoftwareManager();
});

document.addEventListener("DOMContentLoaded", async function () {
    await loadSoftwareManager();
});
