/**
 * Thin wrapper → genericMenuLoader (WEB-FIX-002)
 * Legacy convention URL 유지용 폴백 메타 포함
 */
document.addEventListener('DOMContentLoaded', async function () {
  const loader = webconsolejs['pages/operation/plugins/genericMenuLoader'];
  await loader.loadByMenuId('costanalysis', 'costIframe', {
    frameworkService: 'mc-cost-optimizer-fe',
    path: '/',
  });
});

$('#select-current-project').on('change', async function () {
  const project = {
    Id: this.value,
    Name: this.options[this.selectedIndex].text,
    NsId: this.options[this.selectedIndex].text,
  };
  webconsolejs['common/api/services/workspace_api'].setCurrentProject(project);
  const loader = webconsolejs['pages/operation/plugins/genericMenuLoader'];
  await loader.loadByMenuId('costanalysis', 'costIframe', {
    frameworkService: 'mc-cost-optimizer-fe',
    path: '/',
  });
});
