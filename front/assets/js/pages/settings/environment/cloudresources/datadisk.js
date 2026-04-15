// DataDisk 관리 페이지 — Import 기능 (Connection 단위)
// RQ-CLOUD-ADMIN-007 / UC-IMPORT-005

import { showToast, TOAST_TYPES } from "../../../../common/utils/toast.js";

const importApi = () => webconsolejs["common/api/services/import_api"];
let _nsId = null;

document.addEventListener("DOMContentLoaded", async function () {
    _nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;

    const btnList = document.getElementById('page-header-btn-list');
    if (btnList) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.textContent = 'Import DataDisk';
        btn.disabled = !_nsId;
        btn.title = _nsId ? 'CSP 미관리 DataDisk 임포트' : '프로젝트를 먼저 선택하세요';
        btn.onclick = () => openImportDiskModal();
        btnList.appendChild(btn);
    }
});

export async function openImportDiskModal() {
    _nsId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.NsId;
    if (!_nsId) { alert('프로젝트를 먼저 선택하세요.'); return; }

    document.getElementById('import-datadisk-project').value = _nsId;
    await loadConnectionSelect('import-datadisk-connection');
    new bootstrap.Modal(document.getElementById('import-datadisk-modal')).show();
}

export async function executeImportDisk() {
    const connectionName = document.getElementById('import-datadisk-connection').value;
    if (!connectionName) { alert('Connection을 선택하세요.'); return; }

    const spinner = document.getElementById('import-datadisk-spinner');
    spinner.classList.remove('d-none');

    try {
        const result = await importApi().registerCspResources(['dataDisk'], connectionName, _nsId);
        const count = result?.registerationOverview?.dataDisk || 0;
        const failed = result?.registerationOverview?.failed || 0;
        showToast(failed > 0 ? TOAST_TYPES.WARNING : TOAST_TYPES.SUCCESS,
            `DataDisk ${count}개 등록 완료${failed > 0 ? `, ${failed}개 실패` : ''}`);
        bootstrap.Modal.getInstance(document.getElementById('import-datadisk-modal'))?.hide();
    } catch (err) {
        showToast(TOAST_TYPES.ERROR, 'DataDisk Import 실패: ' + (err.message || ''));
    } finally {
        spinner.classList.add('d-none');
    }
}

async function loadConnectionSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">선택하세요</option>';
    try {
        const result = await webconsolejs["common/api/http"].commonAPIPost("/api/mc-iam-manager/ListCspAccounts", {});
        const accounts = result?.data?.responseData?.items || [];
        accounts.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.connectionName || acc.name;
            opt.textContent = acc.name;
            select.appendChild(opt);
        });
    } catch (err) { console.error(err); }
}

if (typeof webconsolejs === "undefined") { window.webconsolejs = {}; }
webconsolejs["pages/settings/environment/cloudresources/datadisk"] = {
    openImportDiskModal, executeImportDisk,
};
