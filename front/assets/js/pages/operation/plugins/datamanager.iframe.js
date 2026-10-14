document.addEventListener('DOMContentLoaded', async function () {
  const loader = webconsolejs['pages/operation/plugins/genericMenuLoader'];
  await loader.loadByMenuId('datamigrations', 'targetIframe', {
    frameworkService: 'mc-data-manager-fe',
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
  await loader.loadByMenuId('datamigrations', 'targetIframe', {
    frameworkService: 'mc-data-manager-fe',
    path: '/',
  });
});
