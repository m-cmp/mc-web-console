import { TabulatorFull as Tabulator } from "tabulator-tables";

const DOM = {
    imageTable: document.getElementById('image-table'),
    detailPanel: document.getElementById('image-detail-panel'),
    detailNameLabel: document.getElementById('image-detail-name-label'),
    detailNameText: document.getElementById('image-detail-name-text'),
    nsFilter: document.getElementById('image-ns-filter'),
    providerFilter: document.getElementById('image-provider-filter'),
    osFilter: document.getElementById('image-os-filter'),
};

const AppState = {
    images: [],
    selectedImage: null,
    tables: { imageTable: null },
};

const PROVIDER_BADGE = {
    AWS: '<span class="badge bg-orange-lt">AWS</span>',
    GCP: '<span class="badge bg-blue-lt">GCP</span>',
    AZURE: '<span class="badge bg-indigo-lt">Azure</span>',
};

function getProviderBadge(provider) {
    if (!provider) return '-';
    return PROVIDER_BADGE[provider.toUpperCase()] || `<span class="badge bg-secondary-lt">${provider}</span>`;
}

// ─── TableManager ──────────────────────────────────────────────────

const TableManager = {
    initTable(data) {
        if (AppState.tables.imageTable) {
            AppState.tables.imageTable.replaceData(data);
            return;
        }
        AppState.tables.imageTable = new Tabulator('#image-table', {
            data,
            layout: 'fitColumns',
            placeholder: 'No Images Found',
            pagination: 'local',
            paginationSize: 10,
            paginationSizeSelector: [10, 20, 50],
            paginationCounter: 'rows',
            columns: [
                {
                    formatter: 'rowSelection',
                    titleFormatter: 'rowSelection',
                    hozAlign: 'center',
                    headerSort: false,
                    width: 40,
                    cellClick(e, cell) { cell.getRow().toggleSelect(); },
                },
                { title: 'Image Name', field: 'IId.NameId', sorter: 'string' },
                { title: 'Image ID', field: 'IId.SystemId', sorter: 'string' },
                {
                    title: 'Provider',
                    field: 'ConnectionName',
                    formatter(cell) { return getProviderBadge(cell.getValue()); },
                },
                { title: 'OS', field: 'GuestOS', sorter: 'string' },
                { title: 'Architecture', field: 'Architecture', sorter: 'string' },
                { title: 'Region', field: 'Region', sorter: 'string' },
                {
                    title: 'Status',
                    field: 'Status',
                    formatter(cell) {
                        const v = cell.getValue() || 'Available';
                        const cls = v === 'Available' ? 'bg-success-lt' : 'bg-secondary-lt';
                        return `<span class="badge ${cls}">${v}</span>`;
                    },
                },
            ],
            rowClick(e, row) {
                UIManager.showDetail(row.getData());
            },
        });
    },
};

// ─── UIManager ──────────────────────────────────────────────────────

const UIManager = {
    showDetail(image) {
        AppState.selectedImage = image;
        const name = image.IId && image.IId.NameId ? image.IId.NameId : '-';
        const sysId = image.IId && image.IId.SystemId ? image.IId.SystemId : '-';

        if (DOM.detailNameLabel) DOM.detailNameLabel.style.display = '';
        if (DOM.detailNameText) DOM.detailNameText.textContent = name;

        document.getElementById('detail-image-id').textContent = sysId;
        document.getElementById('detail-image-name').textContent = name;
        document.getElementById('detail-image-provider').innerHTML = getProviderBadge(image.ConnectionName);
        document.getElementById('detail-image-region').textContent = image.Region || '-';
        document.getElementById('detail-image-os').textContent = image.GuestOS || '-';
        document.getElementById('detail-image-arch').textContent = image.Architecture || '-';
        document.getElementById('detail-image-status').textContent = image.Status || 'Available';
        document.getElementById('detail-image-created').textContent = image.CreatedAt
            ? new Date(image.CreatedAt).toLocaleString()
            : '-';

        if (DOM.detailPanel) DOM.detailPanel.style.display = '';
    },

    hideDetail() {
        AppState.selectedImage = null;
        if (DOM.detailPanel) DOM.detailPanel.style.display = 'none';
    },
};

// ─── ImageManager ──────────────────────────────────────────────────

const ImageManager = {
    async loadImages() {
        try {
            const ns = DOM.nsFilter ? DOM.nsFilter.value : '';
            const data = {
                pathParams: { nsId: ns || 'system' },
            };
            const response = await webconsolejs["common/api/http"].commonAPIPost(
                '/api/mc-infra-manager/ListImage',
                data
            );
            let images = (response && response.data && response.data.responseData && response.data.responseData.image)
                ? response.data.responseData.image
                : [];

            // Apply OS filter client-side
            const osFilter = DOM.osFilter ? DOM.osFilter.value : '';
            const providerFilter = DOM.providerFilter ? DOM.providerFilter.value : '';
            if (osFilter) {
                images = images.filter(img => img.GuestOS && img.GuestOS.toLowerCase().includes(osFilter.toLowerCase()));
            }
            if (providerFilter) {
                images = images.filter(img => img.ConnectionName && img.ConnectionName.toUpperCase() === providerFilter.toUpperCase());
            }

            AppState.images = images;
            TableManager.initTable(images);
        } catch (e) {
            console.error('이미지 목록 조회 실패:', e);
            TableManager.initTable([]);
        }
    },
};

// ─── Public exports ──────────────────────────────────────────────────

export function refreshImageList() {
    ImageManager.loadImages();
}

export function applyFilter() {
    ImageManager.loadImages();
}

export function hideDetail() {
    UIManager.hideDetail();
}

// ─── Init ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    ImageManager.loadImages();
});
