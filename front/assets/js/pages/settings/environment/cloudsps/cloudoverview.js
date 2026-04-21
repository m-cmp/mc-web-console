import { TabulatorFull as Tabulator } from "tabulator-tables";

// readyz_api 런타임 접근 헬퍼 (UMD 빌드 — ES module import 불가)
function readyzApi() {
    return webconsolejs["common/api/services/readyz_api"];
}

// DOM 요소 캐싱
const DOM = {
    cspTable: document.getElementById('csp-accounts-table'),
    viewModeCards: document.getElementById('view-mode-cards'),
    cspInfoNameLabel: document.getElementById('csp-info-name-label'),
    cspInfoNameText: document.getElementById('csp-info-name-text'),
    cspInfoName: document.getElementById('csp-info-name'),
    cspInfoType: document.getElementById('csp-info-type'),
    cspInfoStatus: document.getElementById('csp-info-status'),
    cspInfoDescription: document.getElementById('csp-info-description'),
    cspInfoCreated: document.getElementById('csp-info-created'),
    cspInfoUpdated: document.getElementById('csp-info-updated'),
    toggleStatusBtn: document.getElementById('csp-toggle-status-btn'),
    filterType: document.getElementById('csp-filter-type'),
    filterStatus: document.getElementById('csp-filter-status'),
    filterClear: document.getElementById('csp-filter-clear'),
    createCspType: document.getElementById('create-csp-type'),
    createCspName: document.getElementById('create-csp-name'),
    createCspDescription: document.getElementById('create-csp-description'),
    createFieldsAws: document.getElementById('create-fields-aws'),
    createFieldsGcp: document.getElementById('create-fields-gcp'),
    createFieldsAzure: document.getElementById('create-fields-azure'),
};

// 중앙화된 상태 관리 객체
const AppState = {
    csp: {
        list: [],
        selectedAccount: null,
    },
    ui: {
        viewMode: false,
    },
    tables: {
        cspTable: null,
    },
    readyz: {
        // { frameworkName: { ready, message } }
        results: {},
    },
    // mc-iam-manager Services map: { "mc-infra-manager": { Version, BaseURL, Auth }, ... }
    frameworkServices: {},
    // ListMcmpApisServices 기반 동적 framework 목록
    frameworkList: [],
    credentialValid: false,
};

// 선택된 행들을 관리하는 배열 (users.js와 동일한 패턴)
var checked_array = [];

const CSP_TYPE_BADGE = {
    aws: '<span class="badge bg-orange-lt">AWS</span>',
    gcp: '<span class="badge bg-blue-lt">GCP</span>',
    azure: '<span class="badge bg-indigo-lt">Azure</span>',
};

// ─── UIManager ──────────────────────────────────────────────────────

const UIManager = {
    showViewMode(account) {
        // Add CSP 폼이 열려 있으면 닫기
        const createSection = document.getElementById('cspcreate');
        if (createSection && createSection.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(createSection).hide();
        }
        DOM.viewModeCards.classList.add('show');
        AppState.ui.viewMode = true;
        this.updateCspDetail(account);
    },

    hideViewMode() {
        DOM.viewModeCards.classList.remove('show');
        AppState.ui.viewMode = false;
        AppState.csp.selectedAccount = null;
        this.clearCspDetail();
    },

    updateCspDetail(account) {
        AppState.csp.selectedAccount = account;

        // name label in card header
        if (DOM.cspInfoNameLabel) {
            DOM.cspInfoNameLabel.style.display = '';
        }
        if (DOM.cspInfoNameText) {
            DOM.cspInfoNameText.textContent = account.name || '';
        }

        // datagrid fields
        if (DOM.cspInfoName) DOM.cspInfoName.textContent = account.name || '';
        if (DOM.cspInfoType) {
            DOM.cspInfoType.innerHTML = CSP_TYPE_BADGE[account.csp_type] || account.csp_type || '';
        }
        if (DOM.cspInfoStatus) {
            DOM.cspInfoStatus.innerHTML = account.is_active
                ? '<span class="badge bg-success-lt">Active</span>'
                : '<span class="badge bg-secondary-lt">Inactive</span>';
        }
        if (DOM.cspInfoDescription) DOM.cspInfoDescription.textContent = account.description || '';
        if (DOM.cspInfoCreated) {
            DOM.cspInfoCreated.textContent = account.created_at
                ? account.created_at.replace('T', ' ').substring(0, 19)
                : '';
        }
        if (DOM.cspInfoUpdated) {
            DOM.cspInfoUpdated.textContent = account.updated_at
                ? account.updated_at.replace('T', ' ').substring(0, 19)
                : '';
        }

        // toggle button label
        if (DOM.toggleStatusBtn) {
            DOM.toggleStatusBtn.textContent = account.is_active ? 'Deactivate' : 'Activate';
            DOM.toggleStatusBtn.className = account.is_active
                ? 'btn btn-outline-warning'
                : 'btn btn-outline-success';
        }
    },

    clearCspDetail() {
        if (DOM.cspInfoNameLabel) DOM.cspInfoNameLabel.style.display = 'none';
        if (DOM.cspInfoNameText) DOM.cspInfoNameText.textContent = '';
        if (DOM.cspInfoName) DOM.cspInfoName.textContent = '';
        if (DOM.cspInfoType) DOM.cspInfoType.textContent = '';
        if (DOM.cspInfoStatus) DOM.cspInfoStatus.textContent = '';
        if (DOM.cspInfoDescription) DOM.cspInfoDescription.textContent = '';
        if (DOM.cspInfoCreated) DOM.cspInfoCreated.textContent = '';
        if (DOM.cspInfoUpdated) DOM.cspInfoUpdated.textContent = '';
    },
};

// ─── CspManager ─────────────────────────────────────────────────────

const CspManager = {
    async loadAccounts(filter = {}) {
        const accounts = await webconsolejs["common/api/services/csp_accounts_api"].listCspAccounts(filter);
        AppState.csp.list = accounts || [];
        return AppState.csp.list;
    },

    async getAccountById(id) {
        return await webconsolejs["common/api/services/csp_accounts_api"].getCspAccountById(id);
    },

    async createAccount(payload) {
        return await webconsolejs["common/api/services/csp_accounts_api"].createCspAccount(payload);
    },

    async deleteAccounts(ids) {
        for (const id of ids) {
            await webconsolejs["common/api/services/csp_accounts_api"].deleteCspAccount(id);
        }
    },

    async validateAccount(id) {
        return await webconsolejs["common/api/services/csp_accounts_api"].validateCspAccount(id);
    },

    async activateAccount(id) {
        return await webconsolejs["common/api/services/csp_accounts_api"].activateCspAccount(id);
    },

    async deactivateAccount(id) {
        return await webconsolejs["common/api/services/csp_accounts_api"].deactivateCspAccount(id);
    },
};

// ─── TableManager ───────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        AppState.tables.cspTable = new Tabulator(DOM.cspTable, {
            data: data || [],
            layout: "fitColumns",
            responsiveLayout: "collapse",
            placeholder: "No CSP accounts found.",
            columns: this.getColumns(),
        });

        // users.js 패턴: 생성 후 이벤트 등록
        AppState.tables.cspTable.on("rowClick", function (e, row) {
            const rowData = row.getData();
            row.toggleSelect();
            getSelectedCspData(rowData.id);
        });

        AppState.tables.cspTable.on("rowSelectionChanged", function (data, rows) {
            // data는 row data 객체 배열 (users.js 패턴)
            checked_array = data;
        });
    },

    getColumns() {
        return [
            {
                formatter: "rowSelection",
                titleFormatter: "rowSelection",
                hozAlign: "center",
                headerSort: false,
                width: 40,
                cellClick: (e, cell) => {
                    cell.getRow().toggleSelect();
                },
            },
            {
                title: "Name", field: "name", widthGrow: 2,
                formatter: (cell) => `<span class="fw-medium">${cell.getValue() || ''}</span>`,
            },
            {
                title: "CSP Type", field: "csp_type", width: 110,
                formatter: (cell) => CSP_TYPE_BADGE[cell.getValue()] || cell.getValue() || '',
            },
            {
                title: "Status", field: "is_active", width: 110,
                formatter: (cell) => cell.getValue()
                    ? '<span class="badge bg-success-lt">Active</span>'
                    : '<span class="badge bg-secondary-lt">Inactive</span>',
            },
            {
                title: "Description", field: "description", widthGrow: 3,
            },
            {
                title: "Created At", field: "created_at", width: 130,
                formatter: (cell) => cell.getValue() ? cell.getValue().substring(0, 10) : '',
            },
        ];
    },

    setData(data) {
        if (AppState.tables.cspTable) {
            AppState.tables.cspTable.setData(data);
        }
    },

    applyFilter() {
        const cspType = DOM.filterType ? DOM.filterType.value : '';
        const statusVal = DOM.filterStatus ? DOM.filterStatus.value : '';

        const filters = [];
        if (cspType) filters.push({ field: "csp_type", type: "=", value: cspType });
        if (statusVal !== '') filters.push({ field: "is_active", type: "=", value: statusVal === 'true' });

        if (AppState.tables.cspTable) {
            AppState.tables.cspTable.setFilter(filters);
        }
    },

    clearFilter() {
        if (DOM.filterType) DOM.filterType.value = '';
        if (DOM.filterStatus) DOM.filterStatus.value = '';
        if (AppState.tables.cspTable) {
            AppState.tables.cspTable.clearFilter();
        }
    },
};

// ─── 상세 조회 (rowClick 핸들러) ─────────────────────────────────────

async function getSelectedCspData(accountId) {
    try {
        const account = await CspManager.getAccountById(accountId);
        UIManager.showViewMode(account);
    } catch (err) {
        console.error('Failed to load CSP account detail:', err);
        alert('Failed to load account details: ' + err.message);
    }
}

// ─── 초기화 ─────────────────────────────────────────────────────────

async function initCspAccounts() {
    try {
        const accounts = await CspManager.loadAccounts();
        TableManager.initTable(accounts);
    } catch (err) {
        console.error('Failed to initialize CSP accounts:', err);
        TableManager.initTable([]);
    }
}

// ─── 필터 이벤트 ─────────────────────────────────────────────────────

function initFilterEvents() {
    if (DOM.filterType) {
        DOM.filterType.addEventListener('change', () => TableManager.applyFilter());
    }
    if (DOM.filterStatus) {
        DOM.filterStatus.addEventListener('change', () => TableManager.applyFilter());
    }
    if (DOM.filterClear) {
        DOM.filterClear.addEventListener('click', () => TableManager.clearFilter());
    }
}

// ─── 등록 폼 CSP 타입 연동 ──────────────────────────────────────────

function initCreateFormEvents() {
    if (!DOM.createCspType) return;
    DOM.createCspType.addEventListener('change', () => {
        const val = DOM.createCspType.value;
        if (DOM.createFieldsAws) DOM.createFieldsAws.style.display = val === 'aws' ? '' : 'none';
        if (DOM.createFieldsGcp) DOM.createFieldsGcp.style.display = val === 'gcp' ? '' : 'none';
        if (DOM.createFieldsAzure) DOM.createFieldsAzure.style.display = val === 'azure' ? '' : 'none';
    });
}

// ─── Export 함수 (webpack library 설정으로 webconsolejs 네임스페이스에 자동 등록) ──

export async function refreshCspList() {
    try {
        const accounts = await CspManager.loadAccounts();
        TableManager.setData(accounts);
        if (AppState.csp.selectedAccount) {
            const refreshed = await CspManager.getAccountById(AppState.csp.selectedAccount.id);
            UIManager.updateCspDetail(refreshed);
        }
    } catch (err) {
        console.error('Failed to refresh CSP list:', err);
        alert('Failed to refresh: ' + err.message);
    }
}

export async function createCspAccount() {
    const cspType = document.getElementById('create-csp-type') ? document.getElementById('create-csp-type').value : '';
    const name = document.getElementById('create-csp-name') ? document.getElementById('create-csp-name').value.trim() : '';
    const description = document.getElementById('create-csp-description') ? document.getElementById('create-csp-description').value.trim() : '';

    if (!cspType || !name) {
        alert('CSP Type and Account Name are required.');
        return;
    }

    const accountInfo = {};
    if (cspType === 'aws') {
        const accessKey = document.getElementById('create-aws-access-key');
        const secretKey = document.getElementById('create-aws-secret-key');
        const region = document.getElementById('create-aws-region');
        if (accessKey && accessKey.value.trim()) accountInfo.access_key_id = accessKey.value.trim();
        if (secretKey && secretKey.value.trim()) accountInfo.secret_access_key = secretKey.value.trim();
        if (region && region.value.trim()) accountInfo.region = region.value.trim();
    } else if (cspType === 'gcp') {
        const projectId = document.getElementById('create-gcp-project-id');
        const clientEmail = document.getElementById('create-gcp-client-email');
        const privateKey = document.getElementById('create-gcp-private-key');
        if (projectId && projectId.value.trim()) accountInfo.project_id = projectId.value.trim();
        if (clientEmail && clientEmail.value.trim()) accountInfo.client_email = clientEmail.value.trim();
        if (privateKey && privateKey.value.trim()) accountInfo.private_key = privateKey.value.trim();
    } else if (cspType === 'azure') {
        const subscriptionId = document.getElementById('create-azure-subscription-id');
        const tenantId = document.getElementById('create-azure-tenant-id');
        const clientId = document.getElementById('create-azure-client-id');
        const clientSecret = document.getElementById('create-azure-client-secret');
        if (subscriptionId && subscriptionId.value.trim()) accountInfo.subscription_id = subscriptionId.value.trim();
        if (tenantId && tenantId.value.trim()) accountInfo.tenant_id = tenantId.value.trim();
        if (clientId && clientId.value.trim()) accountInfo.client_id = clientId.value.trim();
        if (clientSecret && clientSecret.value.trim()) accountInfo.client_secret = clientSecret.value.trim();
    }

    try {
        await CspManager.createAccount({ name, csp_type: cspType, account_info: accountInfo, description });

        // 폼 초기화
        const createType = document.getElementById('create-csp-type');
        const createName = document.getElementById('create-csp-name');
        const createDesc = document.getElementById('create-csp-description');
        const fieldsAws = document.getElementById('create-fields-aws');
        const fieldsGcp = document.getElementById('create-fields-gcp');
        const fieldsAzure = document.getElementById('create-fields-azure');
        if (createType) createType.value = '';
        if (createName) createName.value = '';
        if (createDesc) createDesc.value = '';
        if (fieldsAws) fieldsAws.style.display = 'none';
        if (fieldsGcp) fieldsGcp.style.display = 'none';
        if (fieldsAzure) fieldsAzure.style.display = 'none';

        // cspcreate collapse 닫기
        const cspcreate = document.getElementById('cspcreate');
        if (cspcreate && cspcreate.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(cspcreate).hide();
        }

        // 목록 갱신
        const accounts = await CspManager.loadAccounts();
        TableManager.setData(accounts);
    } catch (err) {
        console.error('Failed to create CSP account:', err);
        alert('Failed to create account: ' + err.message);
    }
}

export async function deleteCspAccounts() {
    if (!checked_array || checked_array.length === 0) {
        alert('Please select at least one account to delete.');
        return;
    }

    // checked_array는 row data 객체 배열 → ID 추출
    const idsToDelete = checked_array.map(item => item.id);

    try {
        await CspManager.deleteAccounts(idsToDelete);

        // 삭제된 계정이 선택 중이면 상세 패널 닫기
        if (AppState.csp.selectedAccount && idsToDelete.includes(AppState.csp.selectedAccount.id)) {
            UIManager.hideViewMode();
        }

        checked_array = [];
        const accounts = await CspManager.loadAccounts();
        TableManager.setData(accounts);
    } catch (err) {
        console.error('Failed to delete CSP accounts:', err);
        alert('Failed to delete: ' + err.message);
    }
}

export async function validateSelectedCsp() {
    if (!AppState.csp.selectedAccount) {
        alert('Please select an account to validate.');
        return;
    }
    try {
        await CspManager.validateAccount(AppState.csp.selectedAccount.id);
        AppState.credentialValid = true;
        // 검증 성공 상태를 상세 패널에 표시
        const statusEl = document.getElementById('csp-info-status');
        if (statusEl) {
            statusEl.innerHTML += ' <span class="badge bg-teal-lt ms-1">✅ Valid</span>';
        }
        alert('Account credentials are valid.');
    } catch (err) {
        AppState.credentialValid = false;
        console.error('Validation failed:', err);
        alert('Validation failed: ' + err.message);
    }
}

// ─── Readyz export 함수 ──────────────────────────────────────────────

export async function runReadyz(frameworkName) {
    await ReadyzManager.runReadyz(frameworkName);
}

export async function runAllReadyz() {
    await ReadyzManager.runAll();
}

export async function runInit(frameworkName) {
    await ReadyzManager.runInit(frameworkName);
}

export function editFrameworkUrl(frameworkName) {
    ReadyzManager.editFrameworkUrl(frameworkName);
}

export function cancelEditFrameworkUrl(frameworkName) {
    ReadyzManager.cancelEditFrameworkUrl(frameworkName);
}

export async function saveFrameworkUrl(frameworkName) {
    await ReadyzManager.saveFrameworkUrl(frameworkName);
}

export async function toggleSelectedCspStatus() {
    if (!AppState.csp.selectedAccount) return;

    const account = AppState.csp.selectedAccount;
    const isActive = account.is_active;

    try {
        if (isActive) {
            await CspManager.deactivateAccount(account.id);
        } else {
            await CspManager.activateAccount(account.id);
        }

        const refreshed = await CspManager.getAccountById(account.id);
        UIManager.updateCspDetail(refreshed);

        const accounts = await CspManager.loadAccounts();
        TableManager.setData(accounts);
    } catch (err) {
        console.error('Failed to toggle CSP status:', err);
        alert('Failed to change status: ' + err.message);
    }
}

// ─── ReadyzManager ──────────────────────────────────────────────────

const ReadyzManager = {
    /** mc-iam-manager에서 framework 서비스 주소 로드 + 동적 목록 빌드 */
    async loadFrameworkServices() {
        try {
            const services = await readyzApi().listFrameworkServices();
            AppState.frameworkServices = services || {};
            AppState.frameworkList = readyzApi().buildFrameworkList(AppState.frameworkServices);
        } catch (e) {
            console.warn('loadFrameworkServices failed:', e.message);
            AppState.frameworkServices = {};
        }
        // API 실패(403/404 등) 또는 빈 응답 시 하드코딩 맵 키로 폴백
        if (!AppState.frameworkList || AppState.frameworkList.length === 0) {
            const fallbackServices = Object.fromEntries(
                Object.keys(readyzApi().READYZ_OPERATIONID_MAP).map(k => [k, {}])
            );
            AppState.frameworkList = readyzApi().buildFrameworkList(fallbackServices);
        }
    },

    /** Readyz 섹션 테이블 초기 렌더링 */
    renderTable() {
        const tbody = document.getElementById('readyz-table-body');
        if (!tbody) return;
        tbody.innerHTML = (AppState.frameworkList || []).map(fw => {
            const svcInfo = AppState.frameworkServices[fw.name] || {};
            const baseUrl = svcInfo.BaseURL || '-';
            const escapedUrl = this._esc(baseUrl);
            const inputVal = baseUrl === '-' ? '' : baseUrl;
            return `
            <tr id="readyz-row-${fw.name}">
                <td class="fw-medium">${fw.name}</td>
                <td id="readyz-baseurl-cell-${fw.name}">
                    <div class="d-flex align-items-center gap-1">
                        <span id="readyz-baseurl-${fw.name}" class="text-muted small text-truncate" style="max-width:220px" title="${escapedUrl}">${escapedUrl}</span>
                        <button class="btn btn-xs btn-ghost-secondary px-1 py-0 flex-shrink-0"
                            title="Edit BaseURL"
                            onclick="webconsolejs['pages/settings/environment/cloudsps/cloudoverview'].editFrameworkUrl('${fw.name}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                    </div>
                    <div id="readyz-baseurl-edit-${fw.name}" class="d-none mt-1">
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control form-control-sm"
                                id="readyz-baseurl-input-${fw.name}"
                                value="${this._esc(inputVal)}"
                                placeholder="http://host:port">
                            <button class="btn btn-sm btn-primary"
                                onclick="webconsolejs['pages/settings/environment/cloudsps/cloudoverview'].saveFrameworkUrl('${fw.name}')">Save</button>
                            <button class="btn btn-sm btn-outline-secondary"
                                onclick="webconsolejs['pages/settings/environment/cloudsps/cloudoverview'].cancelEditFrameworkUrl('${fw.name}')">Cancel</button>
                        </div>
                    </div>
                </td>
                <td id="readyz-status-${fw.name}">
                    ${fw.operationId
                        ? '<span class="badge bg-secondary-lt">-</span>'
                        : '<span class="badge bg-muted-lt text-muted">N/A</span>'}
                </td>
                <td>
                    ${fw.operationId ? `
                    <button class="btn btn-sm btn-outline-primary me-1"
                        onclick="webconsolejs['pages/settings/environment/cloudsps/cloudoverview'].runReadyz('${fw.name}')">
                        Readyz
                    </button>
                    ${fw.initOperationId ? `
                    <button class="btn btn-sm btn-outline-secondary" id="readyz-init-btn-${fw.name}"
                        onclick="webconsolejs['pages/settings/environment/cloudsps/cloudoverview'].runInit('${fw.name}')">
                        Init
                    </button>` : ''}` : ''}
                </td>
                <td id="readyz-desc-${fw.name}" class="text-muted small"></td>
            </tr>
        `;
        }).join('');
    },

    /** BaseURL 편집 모드 진입 */
    editFrameworkUrl(frameworkName) {
        const editDiv = document.getElementById(`readyz-baseurl-edit-${frameworkName}`);
        if (editDiv) editDiv.classList.remove('d-none');
        const input = document.getElementById(`readyz-baseurl-input-${frameworkName}`);
        if (input) {
            input.focus();
            input.select();
        }
    },

    /** BaseURL 편집 취소 */
    cancelEditFrameworkUrl(frameworkName) {
        const editDiv = document.getElementById(`readyz-baseurl-edit-${frameworkName}`);
        if (editDiv) editDiv.classList.add('d-none');
    },

    /** BaseURL 저장 → mc-iam-manager PUT → readyz 재검증 */
    async saveFrameworkUrl(frameworkName) {
        const input = document.getElementById(`readyz-baseurl-input-${frameworkName}`);
        if (!input) return;
        const newUrl = input.value.trim();
        if (!newUrl) {
            alert('BaseURL을 입력하세요.');
            return;
        }
        try {
            await readyzApi().updateFrameworkServiceUrl(frameworkName, newUrl);
            // 로컬 상태 업데이트
            if (!AppState.frameworkServices[frameworkName]) {
                AppState.frameworkServices[frameworkName] = {};
            }
            AppState.frameworkServices[frameworkName].BaseURL = newUrl;
            // 표시 갱신
            const span = document.getElementById(`readyz-baseurl-${frameworkName}`);
            if (span) {
                span.textContent = newUrl;
                span.title = newUrl;
            }
            // 편집 모드 닫기
            this.cancelEditFrameworkUrl(frameworkName);
            // 저장 후 readyz 재검증
            await this.runReadyz(frameworkName);
        } catch (e) {
            alert('BaseURL 저장 실패: ' + (e.message || String(e)));
        }
    },

    /** 단일 프레임워크 readyz 실행 */
    async runReadyz(frameworkName) {
        const fw = (AppState.frameworkList || []).find(f => f.name === frameworkName);
        if (!fw || !fw.operationId) return;

        this.setStatus(frameworkName, 'loading', '');
        try {
            const response = await readyzApi().callReadyz(fw.subsystem, fw.operationId);
            const parsed = readyzApi().parseReadyzResponse(response);
            AppState.readyz.results[frameworkName] = parsed;
            this.setStatus(frameworkName, parsed.ready ? 'ok' : 'error', parsed.message);
        } catch (e) {
            const msg = e.message || 'Connection failed';
            AppState.readyz.results[frameworkName] = { ready: false, message: msg };
            this.setStatus(frameworkName, 'error', msg);
        }
    },

    /** 전체 프레임워크 readyz 병렬 실행 (operationId 있는 것만) */
    async runAll() {
        const list = (AppState.frameworkList || []).filter(fw => fw.operationId);
        await Promise.all(list.map(fw => this.runReadyz(fw.name)));
    },

    /** Init 실행 (credential valid 확인 후) */
    async runInit(frameworkName) {
        const fw = (AppState.frameworkList || []).find(f => f.name === frameworkName);
        if (!fw || !fw.initOperationId) return;

        if (!AppState.credentialValid) {
            alert('Credential 검증이 필요합니다.\nCloud Overview에서 CSP 계정을 선택하고 Validate 버튼을 클릭하세요.');
            return;
        }

        const btn = document.getElementById(`readyz-init-btn-${frameworkName}`);
        if (btn) {
            btn.disabled = true;
            btn.textContent = '...';
        }

        try {
            const response = await readyzApi().callInit(fw.subsystem, fw.initOperationId);
            if (!response || (response.status && response.status >= 400)) {
                const errMsg = (response && response.data && response.data.message) || 'Init failed';
                this.setInitStatus(frameworkName, 'error', errMsg);
            } else {
                const data = response.data ? (response.data.responseData || response.data) : {};
                const detail = data.message || 'Init complete';
                this.setInitStatus(frameworkName, 'ok', detail);
            }
        } catch (e) {
            this.setInitStatus(frameworkName, 'error', e.message || 'Init failed');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Init';
            }
        }
    },

    /** 상태 뱃지 업데이트 */
    setStatus(frameworkName, state, message) {
        const el = document.getElementById(`readyz-status-${frameworkName}`);
        const desc = document.getElementById(`readyz-desc-${frameworkName}`);
        if (!el) return;

        if (state === 'loading') {
            el.innerHTML = '<span class="badge bg-secondary-lt"><span class="spinner-border spinner-border-sm me-1"></span>...</span>';
            if (desc) desc.textContent = '';
            return;
        }
        if (state === 'error') {
            el.innerHTML = `<span class="badge bg-danger-lt">❌ ERROR</span>`;
            if (desc) desc.textContent = message || '';
            return;
        }
        el.innerHTML = `<span class="badge bg-success-lt" title="${message || ''}">✅ Ready</span>`;
        if (desc) desc.textContent = message || '';
    },

    /** Init 결과 뱃지 */
    setInitStatus(frameworkName, state, message) {
        const el = document.getElementById(`readyz-status-${frameworkName}`);
        const desc = document.getElementById(`readyz-desc-${frameworkName}`);
        if (!el) return;
        if (state === 'ok') {
            el.innerHTML += ` <span class="badge bg-teal-lt">Init Done</span>`;
        } else {
            el.innerHTML += ` <span class="badge bg-danger-lt">Init Failed</span>`;
        }
        if (desc && message) desc.textContent = (desc.textContent ? desc.textContent + ' | ' : '') + message;
    },

    _esc(str) {
        return (str || '').replace(/"/g, '&quot;');
    },
};

// ─── DOMContentLoaded ────────────────────────────────────────────────

// ─── CSP 자원 동기화 (RQ-CLOUD-ADMIN-007) ────────────────────────────

/**
 * Sync 팝업 오픈 — 현재 Project nsId 표시 + Connection 목록 로드
 */
export async function openSyncPopup() {
    const nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
    document.getElementById('sync-target-project').value = nsId || '(프로젝트 미선택)';

    // Connection 드롭다운 — CSP 계정 목록으로 채우기
    const select = document.getElementById('sync-connection-select');
    select.innerHTML = '<option value="">전체 계정</option>';
    for (const acc of AppState.csp.list) {
        const opt = document.createElement('option');
        opt.value = acc.connectionName || acc.name;
        opt.textContent = acc.name;
        select.appendChild(opt);
    }

    // 결과 영역 초기화
    document.getElementById('sync-result').classList.add('d-none');
    document.getElementById('sync-execute-btn').disabled = false;

    new bootstrap.Modal(document.getElementById('sync-csp-modal')).show();
}

/**
 * 동기화 실행
 */
export async function executeSyncCspResources() {
    const nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
    if (!nsId) {
        alert('프로젝트를 먼저 선택하세요.');
        return;
    }

    const options = Array.from(document.querySelectorAll('.sync-resource-type:checked')).map(cb => cb.value);
    if (options.length === 0) {
        alert('동기화할 자원 유형을 하나 이상 선택하세요.');
        return;
    }

    const connectionName = document.getElementById('sync-connection-select').value || null;

    const spinner = document.getElementById('sync-execute-spinner');
    const btn = document.getElementById('sync-execute-btn');
    spinner.classList.remove('d-none');
    btn.disabled = true;

    try {
        const result = await webconsolejs["common/api/services/import_api"].registerCspResources(options, connectionName, nsId);
        renderSyncResult(result);
    } catch (err) {
        console.error('Sync failed:', err);
        document.getElementById('sync-result-body').innerHTML =
            `<div class="alert alert-danger">동기화 실패: ${err.message || '알 수 없는 오류'}</div>`;
        document.getElementById('sync-result').classList.remove('d-none');
    } finally {
        spinner.classList.add('d-none');
        btn.disabled = false;
    }
}

function renderSyncResult(result) {
    const overview = result?.registerationOverview || {};
    const rows = ['vNet', 'securityGroup', 'sshKey', 'vm', 'dataDisk', 'nlb', 'customImage']
        .filter(k => overview[k] !== undefined)
        .map(k => `<tr><td>${k}</td><td class="text-end">${overview[k]}개</td></tr>`)
        .join('');

    const failed = overview.failed || 0;
    const failBadge = failed > 0
        ? `<tr class="text-danger"><td>실패</td><td class="text-end">${failed}개</td></tr>`
        : '';

    document.getElementById('sync-result-body').innerHTML = `
        <table class="table table-sm">
          <thead><tr><th>자원 유형</th><th class="text-end">등록</th></tr></thead>
          <tbody>${rows}${failBadge}</tbody>
        </table>`;
    document.getElementById('sync-result').classList.remove('d-none');
}

// ─── DOMContentLoaded ────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async function () {
    // page-header Add CSP 버튼 삽입 (상세 패널 닫고 등록 폼 토글)
    webconsolejs['partials/layout/navigatePages'].addPageHeaderButton(
        "cspcreate",
        "Add CSP",
        "document.getElementById('view-mode-cards').classList.remove('show'); bootstrap.Collapse.getOrCreateInstance(document.getElementById('cspcreate')).toggle()"
    );

    // Sync 버튼 삽입 (Project 선택 시에만 활성화)
    const syncBtn = document.createElement('button');
    syncBtn.className = 'btn btn-secondary ms-2';
    syncBtn.id = 'sync-csp-btn';
    syncBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/></svg> Sync';
    syncBtn.onclick = () => webconsolejs['pages/settings/environment/cloudsps/cloudoverview'].openSyncPopup();

    const nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
    if (!nsId) syncBtn.disabled = true;
    syncBtn.title = nsId ? '자원 동기화' : '프로젝트를 먼저 선택하세요';

    document.getElementById('page-header-btn-list').appendChild(syncBtn);

    // 필터 이벤트 초기화
    initFilterEvents();

    // 등록 폼 이벤트 초기화
    initCreateFormEvents();

    // Setup Status 섹션 초기화 (FR-CLOUD-ADMIN-006-08)
    // — Readyz/CspAccounts 와 완전 독립. await 하지 않고 즉시 시작하여
    //   상위 await 흐름이 stuck 되어도 본 섹션은 카드별로 그려진다.
    try {
        const setupSection = webconsolejs['pages/settings/environment/cloudsps/setup_status_section'];
        if (setupSection && typeof setupSection.init === 'function') {
            setupSection.init().catch((e) => {
                console.warn('[cloudoverview] setup_status_section init failed:', e);
            });
        }
    } catch (e) {
        console.warn('[cloudoverview] setup_status_section init failed (sync):', e);
    }

    // 목록 초기화
    await initCspAccounts();

    // Readyz 섹션 초기화 — framework 서비스 주소 먼저 로드 후 테이블 렌더링
    await ReadyzManager.loadFrameworkServices();
    ReadyzManager.renderTable();
});
