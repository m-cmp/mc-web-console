function getSoftwareManagerData() {
  const currentWorkspace = webconsolejs['common/api/services/workspace_api'].getCurrentWorkspace();
  const currentProject = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  const accessToken = webconsolejs['common/storage/sessionstorage'].getSessionCurrentUserToken();

  return {
    accessToken: accessToken,
    workspaceInfo: {
      id: currentWorkspace.Id,
      name: currentWorkspace.Name,
    },
    projectInfo: {
      id: currentProject.Id,
      ns_id: currentProject.NsId,
      name: currentProject.Name,
    },
    requestOperationId: '',
  };
}

async function loadSoftwareManager() {
  const currentWorkspace = webconsolejs['common/api/services/workspace_api'].getCurrentWorkspace();
  const currentProject = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  const targetDiv = document.getElementById('targetIframe-sofrwareCatalog');

  if (!currentWorkspace || !currentWorkspace.Id || !currentProject || !currentProject.Id) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">Please select a Workspace and Project.</div>';
    return;
  }

  const host = await webconsolejs['common/iframe/iframe'].GetApiHosts('mc-application-manager-fe');
  if (!host) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">mc-application-manager-fe service URL not found.<br>' +
      'Please register the mc-application-manager-fe URL in Settings &gt; Environment.</div>';
    return;
  }

  const data = getSoftwareManagerData();

  const apiHost = await webconsolejs['common/iframe/iframe'].GetApiHosts('mc-application-manager');
  if (apiHost) {
    data.apiBaseUrl = apiHost;
  }

  targetDiv.innerHTML = '';
  webconsolejs['common/iframe/iframe'].addIframe('targetIframe-sofrwareCatalog', host + '/web/softwareCatalog', data);
}

$('#select-current-project').on('change', async function () {
  const project = { Id: this.value, Name: this.options[this.selectedIndex].text, NsId: this.options[this.selectedIndex].text };
  webconsolejs['common/api/services/workspace_api'].setCurrentProject(project);
  await loadSoftwareManager();
});

document.addEventListener('DOMContentLoaded', async function () {
  await loadSoftwareManager();
});
