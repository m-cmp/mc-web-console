function getObservabilityData() {
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

async function loadObservability() {
  const currentWorkspace = webconsolejs['common/api/services/workspace_api'].getCurrentWorkspace();
  const currentProject = webconsolejs['common/api/services/workspace_api'].getCurrentProject();
  const targetDiv = document.getElementById('targetIframe-observability');
  const bannerDiv = document.getElementById('observability-cert-banner');

  if (!currentWorkspace || !currentWorkspace.Id || !currentProject || !currentProject.Id) {
    bannerDiv.innerHTML = '';
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">Please select a Workspace and Project.</div>';
    return;
  }

  const host = await webconsolejs['common/iframe/iframe'].GetApiHosts('mc-observability-fe');
  if (!host) {
    bannerDiv.innerHTML = '';
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">mc-observability-fe service URL not found.<br>' +
      'Please register the mc-observability-fe URL in Settings &gt; Environment.</div>';
    return;
  }

  const nsId = encodeURIComponent(currentProject.NsId || '');
  const data = getObservabilityData();
  const iframeSrc = host + '/embed/monitoring/' + nsId;

  bannerDiv.innerHTML = '';
  targetDiv.innerHTML = '';
  webconsolejs['common/iframe/iframe'].addIframe('targetIframe-observability', iframeSrc, data);
}

$('#select-current-project').on('change', async function () {
  await loadObservability();
});

document.addEventListener('DOMContentLoaded', async function () {
  await loadObservability();
});
