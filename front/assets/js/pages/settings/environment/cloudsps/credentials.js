import { TabulatorFull as Tabulator } from "tabulator-tables";

// Provider별 필요한 Credential Key 목록
const PROVIDER_CREDENTIAL_KEYS = {
    AWS:     [{ key: 'ClientId', label: 'Access Key ID' }, { key: 'ClientSecret', label: 'Secret Access Key' }],
    GCP:     [{ key: 'PrivateKey', label: 'Private Key (JSON)' }, { key: 'ClientEmail', label: 'Client Email' }, { key: 'ProjectID', label: 'Project ID' }],
    AZURE:   [{ key: 'ClientId', label: 'Client ID' }, { key: 'ClientSecret', label: 'Client Secret' }, { key: 'TenantId', label: 'Tenant ID' }, { key: 'SubscriptionId', label: 'Subscription ID' }],
    ALIBABA: [{ key: 'ClientId', label: 'Access Key ID' }, { key: 'ClientSecret', label: 'Access Key Secret' }],
    TENCENT: [{ key: 'ClientId', label: 'Secret ID' }, { key: 'ClientSecret', label: 'Secret Key' }],
    IBM:     [{ key: 'ApiKey', label: 'API Key' }, { key: 'IamToken', label: 'IAM Token' }],
    NCP:     [{ key: 'ClientId', label: 'Access Key' }, { key: 'ClientSecret', label: 'Secret Key' }],
    NHN:     [{ key: 'ClientId', label: 'Tenant ID' }, { key: 'ClientSecret', label: 'Password' }, { key: 'Username', label: 'Username' }],
    OPENSTACK: [{ key: 'ClientId', label: 'Tenant ID' }, { key: 'ClientSecret', label: 'Password' }, { key: 'Username', label: 'Username' }, { key: 'AuthURL', label: 'Auth URL' }],
};

const PROVIDER_BADGE_MAP = {
    aws: 'bg-orange-lt', gcp: 'bg-blue-lt', azure: 'bg-indigo-lt',
    alibaba: 'bg-red-lt', tencent: 'bg-cyan-lt', ibm: 'bg-dark-lt',
};

function providerBadge(name) {
    if (!name) return '-';
    const lower = name.toLowerCase();
    const cls = PROVIDER_BADGE_MAP[lower] || 'bg-secondary-lt';
    return `<span class="badge ${cls}">${name.toUpperCase()}</span>`;
}

const AppState = {
    holders: [],
    holderTable: null,
};

// ─── CredentialHolder 테이블 ──────────────────────────────────────────

const TableManager = {
    init(data) {
        if (AppState.holderTable) {
            AppState.holderTable.replaceData(data);
            return;
        }
        AppState.holderTable = new Tabulator("#credential-holder-table", {
            data,
            layout: "fitColumns",
            height: "350px",
            placeholder: "등록된 Credential이 없습니다.",
            columns: [
                { title: "Holder", field: "credentialHolder", headerSort: true },
                {
                    title: "Providers",
                    field: "providers",
                    formatter: cell => {
                        const providers = cell.getValue() || [];
                        return providers.map(p => providerBadge(p)).join(' ');
                    },
                },
                {
                    title: "Connections",
                    field: "connectionCount",
                    width: 130,
                    hozAlign: "center",
                    formatter: cell => {
                        const total = cell.getValue() || 0;
                        const row = cell.getRow().getData();
                        const verified = row.verifiedConnectionCount || 0;
                        return `${verified} / ${total}`;
                    },
                    headerTooltip: "Verified / Total",
                },
                {
                    title: "Status",
                    field: "verifiedConnectionCount",
                    width: 100,
                    hozAlign: "center",
                    formatter: (cell, _, row) => {
                        const data = row.getData ? row.getData() : cell.getRow().getData();
                        const total = data.connectionCount || 0;
                        const verified = data.verifiedConnectionCount || 0;
                        if (total === 0) return '<span class="badge bg-secondary-lt">-</span>';
                        if (verified === total) return '<span class="badge bg-success-lt">OK</span>';
                        if (verified > 0) return '<span class="badge bg-warning-lt">Partial</span>';
                        return '<span class="badge bg-danger-lt">Failed</span>';
                    },
                },
                {
                    title: "Default",
                    field: "isDefault",
                    width: 90,
                    hozAlign: "center",
                    formatter: cell => cell.getValue()
                        ? '<span class="badge bg-primary-lt">Default</span>'
                        : '',
                },
            ],
        });
    },
};

// ─── Credential 등록 ──────────────────────────────────────────────────

const CredentialForm = {
    /** Provider 선택 시 Key 입력 필드 동적 렌더링 */
    updateKeyFields(provider) {
        const container = document.getElementById('cred-key-fields');
        if (!container) return;
        const keys = PROVIDER_CREDENTIAL_KEYS[provider?.toUpperCase()] || [];
        if (!keys.length) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = keys.map(({ key, label }) => `
            <div class="mb-3">
                <label class="form-label required">${label}</label>
                <input type="password" class="form-control" id="cred-key-${key}" data-key="${key}" placeholder="${label}" autocomplete="off">
            </div>
        `).join('');
    },

    validate() {
        const provider = document.getElementById('cred-provider')?.value?.trim();
        const holder = document.getElementById('cred-holder')?.value?.trim();
        if (!provider) {
            webconsolejs["partials/layout/toast"].showToast('Provider를 선택해 주세요.', 'warning');
            return false;
        }
        if (!holder || !/^[a-z0-9_]+$/.test(holder)) {
            webconsolejs["partials/layout/toast"].showToast('Credential Holder는 소문자·숫자·언더스코어만 사용 가능합니다.', 'warning');
            return false;
        }
        const keys = PROVIDER_CREDENTIAL_KEYS[provider.toUpperCase()] || [];
        for (const { key, label } of keys) {
            const val = document.getElementById(`cred-key-${key}`)?.value?.trim();
            if (!val) {
                webconsolejs["partials/layout/toast"].showToast(`${label}을(를) 입력해 주세요.`, 'warning');
                return false;
            }
        }
        return true;
    },

    collectKeyValues(provider) {
        const keys = PROVIDER_CREDENTIAL_KEYS[provider.toUpperCase()] || [];
        return keys.map(({ key }) => ({
            key,
            value: document.getElementById(`cred-key-${key}`)?.value?.trim() || '',
        }));
    },
};

async function doSubmitCredential() {
    if (!CredentialForm.validate()) return;

    const provider = document.getElementById('cred-provider').value.trim();
    const holder = document.getElementById('cred-holder').value.trim();
    const keyValueList = CredentialForm.collectKeyValues(provider);

    try {
        webconsolejs["partials/layout/toast"].showToast('공개키를 발급 중입니다...', 'info');

        // Step 1: 공개키 발급
        const { tokenId, publicKey } = await webconsolejs["common/api/services/cloudconnection_api"].getPublicKeyForCredential();

        // Step 2 + 3: 암호화 및 등록
        const payload = await webconsolejs["common/api/services/cloudconnection_api"].buildEncryptedCredentialPayload(
            provider.toLowerCase(), holder, tokenId, publicKey, keyValueList
        );
        await webconsolejs["common/api/services/cloudconnection_api"].registerCredential(payload, holder);

        webconsolejs["partials/layout/toast"].showToast('Credential이 등록되었습니다. 모든 리전에 Connection이 자동 생성됩니다.', 'success');
        bootstrap.Collapse.getOrCreateInstance(document.getElementById('credential-create-section')).hide();
        await loadHolders();
    } catch (e) {
        console.error('Credential 등록 실패:', e);
        webconsolejs["partials/layout/toast"].showToast(e.message || 'Credential 등록에 실패했습니다.', 'error');
    }
}

async function loadHolders() {
    try {
        const holders = await webconsolejs["common/api/services/cloudconnection_api"].listCredentialHolders();
        AppState.holders = holders;
        TableManager.init(holders);
    } catch (e) {
        console.error('Credential Holder 목록 조회 실패:', e);
        webconsolejs["partials/layout/toast"].showToast('Credential 목록을 불러오지 못했습니다.', 'error');
        TableManager.init([]);
    }
}

async function loadCloudOS() {
    try {
        const cloudos = await webconsolejs["common/api/services/cloudconnection_api"].listCloudOS();
        const select = document.getElementById('cred-provider');
        if (!select) return;
        select.innerHTML = '<option value="">Select Provider</option>';
        cloudos.forEach(os => {
            const opt = document.createElement('option');
            opt.value = os;
            opt.textContent = os;
            select.appendChild(opt);
        });
        select.addEventListener('change', e => CredentialForm.updateKeyFields(e.target.value));
    } catch (e) {
        console.error('CloudOS 목록 조회 실패:', e);
    }
}

// ─── Export ───────────────────────────────────────────────────────────

export async function refreshHolderList() {
    await loadHolders();
}

export async function submitCredential() {
    await doSubmitCredential();
}

// ─── DOMContentLoaded ─────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        btnList.innerHTML = `
            <button type="button" class="btn btn-primary" onclick="
                bootstrap.Collapse.getOrCreateInstance(document.getElementById('credential-create-section')).toggle()
            ">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M12 5l0 14"></path>
                    <path d="M5 12l14 0"></path>
                </svg>
                Add Credential
            </button>`;
    }

    loadHolders();
    loadCloudOS();
});
