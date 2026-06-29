function getCostOptimizerData() {
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

async function loadCostOptimizer() {
  const currentWorkspace = webconsolejs['common/api/services/workspace_api'].getCurrentWorkspace();
  const currentProject = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  const targetDiv = document.getElementById('costIframe');

  if (!currentWorkspace || !currentWorkspace.Id || !currentProject || !currentProject.Id) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">Please select a Workspace and Project.</div>';
    return;
  }

  const host = await webconsolejs['common/iframe/iframe'].GetApiHosts('mc-cost-optimizer-fe');
  if (!host) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">mc-cost-optimizer-fe service URL not found.<br>' +
      'Please register the mc-cost-optimizer-fe URL in Settings &gt; Environment &gt; Cloud SPs &gt; Cloud Overview.</div>';
    return;
  }

  const data = getCostOptimizerData();
  targetDiv.innerHTML = '';
  webconsolejs['common/iframe/iframe'].addIframe('costIframe', host, data);
}

$('#select-current-project').on('change', async function () {
  const project = { Id: this.value, Name: this.options[this.selectedIndex].text, NsId: this.options[this.selectedIndex].text };
  webconsolejs['common/api/services/workspace_api'].setCurrentProject(project);
  await loadCostOptimizer();
});

document.addEventListener('DOMContentLoaded', async function () {
  await loadCostOptimizer();
});
