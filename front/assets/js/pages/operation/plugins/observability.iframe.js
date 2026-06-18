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

  if (!currentWorkspace || !currentWorkspace.Id || !currentProject || !currentProject.Id) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">Please select a Workspace and Project.</div>';
    return;
  }

  const host = await webconsolejs['common/iframe/iframe'].GetApiHosts('mc-observability-fe');
  if (!host) {
    targetDiv.innerHTML =
      '<div class="alert alert-warning m-3">mc-observability-fe service URL not found.<br>' +
      'Please register the mc-observability-fe URL in Settings &gt; Environment.</div>';
    return;
  }

  const nsId = encodeURIComponent(currentProject.NsId || '');
  const data = getObservabilityData();
  const iframeSrc = host + '/embed/monitoring/' + nsId;

  targetDiv.innerHTML = `
    <div class="d-flex align-items-center gap-2 p-2 mb-1" style="background:#f8f9fa;border-radius:4px;font-size:0.85rem;">
      <span class="text-muted">접속 주소:</span>
      <a href="${iframeSrc}" target="_blank" class="text-primary">${host}</a>
      <span class="text-muted">— iframe 내용이 보이지 않으면 위 링크에서 인증서를 수락한 후</span>
      <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="loadObservability()">새로고침</button>
    </div>
    <div id="targetIframe-observability-frame" style="flex:1;min-height:0;"></div>
  `;
  webconsolejs['common/iframe/iframe'].addIframe(
    'targetIframe-observability-frame',
    iframeSrc,
    data
  );
}

$('#select-current-project').on('change', async function () {
  const project = {
    Id: this.value,
    Name: this.options[this.selectedIndex].text,
    NsId: this.options[this.selectedIndex].text,
  };
  webconsolejs['common/api/services/workspace_api'].setCurrentProject(project);
  await loadObservability();
});

document.addEventListener('DOMContentLoaded', async function () {
  await loadObservability();
});
