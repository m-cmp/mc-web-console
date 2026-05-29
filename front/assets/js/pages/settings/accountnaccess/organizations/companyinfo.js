if (typeof webconsolejs === 'undefined') window.webconsolejs = {};
if (typeof webconsolejs['pages/settings/accountnaccess/organizations/companyinfo'] === 'undefined') {
    webconsolejs['pages/settings/accountnaccess/organizations/companyinfo'] = {};
}

const AppState = {
    org: null
};

const groupsApi = () => webconsolejs['common/api/services/groups_api'];

const companyInfoPage = {
    async load() {
        try {
            const list = await groupsApi().getGroupList();
            const orgs = Array.isArray(list) ? list : [];
            if (orgs.length === 0) throw new Error('No organization found');
            // 최상위 조직: level이 가장 낮은 항목
            const root = orgs.reduce((min, o) => (o.level < min.level ? o : min), orgs[0]);
            AppState.org = root;
            this._render(root);
        } catch (e) {
            console.error('Failed to load organization info:', e);
            document.getElementById('companyinfo-loading').innerHTML =
                '<div class="alert alert-danger">Failed to load organization info.</div>';
        }
    },

    _render(org) {
        document.getElementById('ci-name').textContent = org.name || '-';
        document.getElementById('ci-code').textContent = org.organizationCode || org.code || '-';
        document.getElementById('ci-level').textContent = org.level ?? '-';
        document.getElementById('ci-path').textContent = org.path || '-';
        document.getElementById('ci-description').textContent = org.description || '-';
        document.getElementById('ci-user-count').textContent = org.userCount ?? '-';
        document.getElementById('companyinfo-loading').style.display = 'none';
        document.getElementById('companyinfo-data').style.display = '';
    },

    enterEditMode() {
        if (!AppState.org) return;
        document.getElementById('ci-edit-name').value = AppState.org.name || '';
        document.getElementById('ci-edit-description').value = AppState.org.description || '';
        document.getElementById('companyinfo-view-card').style.display = 'none';
        document.getElementById('companyinfo-edit-card').style.display = '';
    },

    cancelEdit() {
        document.getElementById('companyinfo-edit-card').style.display = 'none';
        document.getElementById('companyinfo-view-card').style.display = '';
    },

    async saveEdit() {
        const name = document.getElementById('ci-edit-name').value.trim();
        if (!name) {
            alert('Name is required.');
            return;
        }
        const description = document.getElementById('ci-edit-description').value.trim();
        try {
            const updated = await groupsApi().updateGroup(AppState.org.id, { name, description });
            AppState.org = { ...AppState.org, name, description, ...updated };
            this._render(AppState.org);
            this.cancelEdit();
        } catch (e) {
            console.error('Failed to update organization:', e);
            alert('Failed to save. Please try again.');
        }
    }
};

window.companyInfoPage = companyInfoPage;

document.addEventListener('DOMContentLoaded', () => {
    companyInfoPage.load();
});
