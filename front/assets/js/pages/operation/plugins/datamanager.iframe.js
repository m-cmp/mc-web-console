function getDataManagerData() {
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

async function loadDataManager() {
  const currentWorkspace = webconsolejs['common/api/services/workspace_api'].getCurrentWorkspace();
  const currentProject = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  const targetDiv = document.getElementById('targetIframe');

  if (!currentWorkspace || !currentWorkspace.Id || !currentProject || !currentProject.Id) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">Please select a Workspace and Project.</div>';
    return;
  }

  const host = await webconsolejs['common/iframe/iframe'].GetApiHosts('mc-data-manager-fe');
  if (!host) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">mc-data-manager-fe service URL not found.<br>' +
      'Please register the mc-data-manager-fe URL in Settings &gt; Environment.</div>';
    return;
  }

  const data = getDataManagerData();
  targetDiv.innerHTML = '';
  webconsolejs['common/iframe/iframe'].addIframe('targetIframe', host, data);
}

$('#select-current-project').on('change', async function () {
  const project = { Id: this.value, Name: this.options[this.selectedIndex].text, NsId: this.options[this.selectedIndex].text };
  webconsolejs['common/api/services/workspace_api'].setCurrentProject(project);
  await loadDataManager();
});

document.addEventListener('DOMContentLoaded', async function () {
  await loadDataManager();
});
