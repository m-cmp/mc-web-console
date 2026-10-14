if (typeof webconsolejs === 'undefined') {
  window.webconsolejs = {};
}
if (typeof webconsolejs['pages/settings/accountnaccess/organizations/companyinfo'] === 'undefined') {
  webconsolejs['pages/settings/accountnaccess/organizations/companyinfo'] = {};
}

const AppState = {
  company: null
};

const companyApi = () => webconsolejs['common/api/services/company_api'];

function formatDate(value) {
  if (!value) {
    return '-';
  }
  try {
    return new Date(value).toLocaleString();
  } catch (e) {
    return String(value);
  }
}

function setVisible(id, visible) {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }
  el.classList.toggle('d-none', !visible);
  if (visible) {
    el.style.display = '';
  }
}

const companyInfoPage = {
  async load() {
    document.getElementById('companyinfo-loading').style.display = '';
    document.getElementById('companyinfo-data').style.display = 'none';
    document.getElementById('companyinfo-empty').style.display = 'none';
    setVisible('companyinfo-edit-btn', false);
    setVisible('companyinfo-create-btn', false);
    setVisible('companyinfo-activate-btn', false);

    try {
      const company = await companyApi().getCompany();
      AppState.company = company;
      this._render(company);
    } catch (e) {
      console.error('Failed to load company info:', e);
      AppState.company = null;
      document.getElementById('companyinfo-loading').style.display = 'none';
      if (e.status === 404) {
        document.getElementById('companyinfo-empty').style.display = '';
        setVisible('companyinfo-create-btn', true);
        return;
      }
      document.getElementById('companyinfo-loading').innerHTML =
        '<div class="alert alert-danger">Failed to load company info.</div>';
    }
  },

  _render(company) {
    document.getElementById('ci-name').textContent = company.name || '-';
    document.getElementById('ci-description').textContent = company.description || '-';
    document.getElementById('ci-realm').textContent = company.realm_name || '-';
    document.getElementById('ci-client-id').textContent = company.kc_client_id || '-';
    document.getElementById('ci-status').textContent = company.status || '-';
    document.getElementById('ci-created-at').textContent = formatDate(company.created_at);
    document.getElementById('ci-updated-at').textContent = formatDate(company.updated_at);

    document.getElementById('companyinfo-loading').style.display = 'none';
    document.getElementById('companyinfo-empty').style.display = 'none';
    document.getElementById('companyinfo-data').style.display = '';
    setVisible('companyinfo-edit-btn', true);

    // Deactivate는 UI에서 숨김. inactive일 때만 Activate 노출.
    const isActive = (company.status || '').toLowerCase() === 'active';
    setVisible('companyinfo-activate-btn', !isActive);
  },

  enterEditMode() {
    if (!AppState.company) {
      return;
    }
    document.getElementById('ci-edit-name').value = AppState.company.name || '';
    document.getElementById('ci-edit-description').value = AppState.company.description || '';
    document.getElementById('ci-edit-realm').value = AppState.company.realm_name || '';
    document.getElementById('ci-edit-client-id').value = AppState.company.kc_client_id || '';
    document.getElementById('companyinfo-view-card').style.display = 'none';
    document.getElementById('companyinfo-create-card').style.display = 'none';
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
      const updated = await companyApi().updateCompany({ name, description });
      AppState.company = { ...AppState.company, ...updated };
      this._render(AppState.company);
      this.cancelEdit();
    } catch (e) {
      console.error('Failed to update company:', e);
      alert(e.message || 'Failed to save. Please try again.');
    }
  },

  enterCreateMode() {
    document.getElementById('ci-create-name').value = '';
    document.getElementById('ci-create-realm').value = '';
    document.getElementById('ci-create-client-id').value = '';
    document.getElementById('ci-create-client-secret').value = '';
    document.getElementById('ci-create-description').value = '';
    document.getElementById('companyinfo-view-card').style.display = 'none';
    document.getElementById('companyinfo-edit-card').style.display = 'none';
    document.getElementById('companyinfo-create-card').style.display = '';
  },

  cancelCreate() {
    document.getElementById('companyinfo-create-card').style.display = 'none';
    document.getElementById('companyinfo-view-card').style.display = '';
  },

  async saveCreate() {
    const name = document.getElementById('ci-create-name').value.trim();
    const realmName = document.getElementById('ci-create-realm').value.trim();
    const kcClientId = document.getElementById('ci-create-client-id').value.trim();
    const kcClientSecret = document.getElementById('ci-create-client-secret').value.trim();
    const description = document.getElementById('ci-create-description').value.trim();

    if (!name || !realmName || !kcClientId || !kcClientSecret) {
      alert('Name, Realm Name, Client ID, and Client Secret are required.');
      return;
    }

    try {
      const created = await companyApi().createCompany({
        name,
        realm_name: realmName,
        kc_client_id: kcClientId,
        kc_client_secret: kcClientSecret,
        description
      });
      AppState.company = created;
      this._render(created);
      this.cancelCreate();
    } catch (e) {
      console.error('Failed to create company:', e);
      alert(e.message || 'Failed to create. Please try again.');
    }
  },

  async activate() {
    if (!confirm('Activate this company?')) {
      return;
    }
    try {
      const updated = await companyApi().activateCompany();
      AppState.company = { ...AppState.company, ...updated };
      this._render(AppState.company);
    } catch (e) {
      console.error('Failed to activate company:', e);
      alert(e.message || 'Failed to activate.');
    }
  },

  async deactivate() {
    if (!confirm('Deactivate this company?')) {
      return;
    }
    try {
      const updated = await companyApi().deactivateCompany();
      AppState.company = { ...AppState.company, ...updated };
      this._render(AppState.company);
    } catch (e) {
      console.error('Failed to deactivate company:', e);
      alert(e.message || 'Failed to deactivate.');
    }
  }
};

window.companyInfoPage = companyInfoPage;

document.addEventListener('DOMContentLoaded', () => {
  companyInfoPage.load();
});
