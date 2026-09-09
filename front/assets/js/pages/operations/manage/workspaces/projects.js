// Workspaces > Projects — 크로스 워크스페이스 Project 관리 화면
// FR-PLATFORM-ADMIN-008-01 (목록/생성/수정/삭제) + FR-PLATFORM-ADMIN-008-02 (배정 상세패널)
//
// 이 화면은 특정 workspace/project 선택(ns)에 종속되지 않는 플랫폼 레벨 관리 화면이다.
// (navbar의 workspace/project selector 초기화는 partials/layout/navbar.js가 전역으로 처리한다.)

import { TabulatorFull as Tabulator } from 'tabulator-tables';
import TomSelect from 'tom-select';

const AppState = {
  projects: [],           // 목록 캐시 — workspaces 필드는 enrichment pass로 채워짐
  selectedProjectId: null,
  table: null,
  bulkDeletePending: [],
  bulkDeleteBlocked: [],
};

const projectApi = () => webconsolejs['common/api/services/project_api'];
const workspaceApi = () => webconsolejs['common/api/services/workspace_api'];
const modalApi = () => webconsolejs['partials/layout/modal'];
const showToast = (message, type) => webconsolejs['common/util'].showToast(message, type);
const formatDate = (v) => (v ? webconsolejs['common/util'].dateYYYYMMDDHH24MISS(v) : '-');

function extractErrorMessage(err) {
  return err?.response?.data?.responseData?.message || err?.response?.data?.message || err?.message || String(err);
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function currentProject() {
  return AppState.projects.find((p) => p.id === AppState.selectedProjectId);
}

// ─── 목록 로드 + enrichment pass ────────────────────────────────────────────

async function loadProjects() {
  try {
    const projects = (await projectApi().listProjects()) || [];
    projects.forEach((p) => {
      p.workspaces = [];
      p.workspaceCount = undefined; // undefined -> 배지 "…" 표시(아직 enrichment 전)
      p._wsLoaded = false;
    });
    AppState.projects = projects;
    if (AppState.table) {
      AppState.table.setData(projects);
    } else {
      initTable(projects);
    }
    enrichWorkspaceCounts(projects);
  } catch (err) {
    console.error('Failed to load projects:', err);
    showToast('Failed to load projects.', 'error');
    AppState.projects = [];
    if (AppState.table) AppState.table.setData([]);
    else initTable([]);
  }
}

// 목록 렌더는 기다리지 않고 백그라운드로 프로젝트별 배정 workspace 수를 채운다.
function enrichWorkspaceCounts(projects) {
  Promise.all(
    projects.map((p) =>
      projectApi()
        .getProjectWorkspaces(p.id)
        .then((ws) => {
          p.workspaces = ws || [];
          p.workspaceCount = p.workspaces.length;
          p._wsLoaded = true;
          AppState.table?.updateData([{ id: p.id, workspaceCount: p.workspaceCount, _wsLoaded: true }]);
        })
        .catch(() => {
          p.workspaces = [];
          p.workspaceCount = 0;
          p._wsLoaded = true;
          AppState.table?.updateData([{ id: p.id, workspaceCount: 0, _wsLoaded: true }]);
        })
    )
  );
}

// ─── Tabulator 테이블 ────────────────────────────────────────────────────

function workspaceBadgeFormatter(cell) {
  const data = cell.getRow().getData();
  if (!data._wsLoaded) {
    return '<span class="badge bg-secondary-lt">…</span>';
  }
  const count = cell.getValue() || 0;
  const cls = count > 0 ? 'bg-blue-lt' : 'bg-secondary-lt';
  return `<span class="badge ${cls}">${count}</span>`;
}

function ellipsisFormatter(cell) {
  const v = cell.getValue() || '';
  const span = document.createElement('span');
  span.textContent = v;
  span.title = v;
  span.style.overflow = 'hidden';
  span.style.textOverflow = 'ellipsis';
  span.style.whiteSpace = 'nowrap';
  span.style.display = 'inline-block';
  span.style.maxWidth = '100%';
  return span;
}

function nsidFormatter(cell) {
  const v = cell.getValue() || '-';
  return `<code title="System managed">${escapeHtml(v)}</code>`;
}

function dateFormatter(cell) {
  return formatDate(cell.getValue());
}

function initTable(data) {
  AppState.table = new Tabulator('#project-table', {
    data,
    layout: 'fitColumns',
    placeholder: 'No projects found.',
    pagination: 'local',
    paginationSize: 10,
    paginationSizeSelector: [10, 20, 50],
    selectableRows: true,
    columns: [
      { formatter: 'rowSelection', titleFormatter: 'rowSelection', headerSort: false, hozAlign: 'center', width: 40 },
      { title: 'ID', field: 'id', width: 70, sorter: 'number' },
      { title: 'Name', field: 'name', sorter: 'string' },
      { title: 'Description', field: 'description', formatter: ellipsisFormatter, widthGrow: 2 },
      { title: 'NsId', field: 'nsid', formatter: nsidFormatter, width: 140 },
      { title: 'Workspaces', field: 'workspaceCount', formatter: workspaceBadgeFormatter, hozAlign: 'center', width: 120, headerSort: false },
      { title: 'Created', field: 'created_at', formatter: dateFormatter, width: 170 },
      { title: 'Updated', field: 'updated_at', formatter: dateFormatter, width: 170, visible: false },
    ],
  });

  AppState.table.on('rowClick', function (e, row) {
    const clickedCell = row.getCells().find((c) => c.getElement().contains(e.target));
    const colDef = clickedCell?.getColumn()?.getDefinition();
    const isCheckboxCol = colDef?.formatter === 'rowSelection';
    if (!isCheckboxCol) {
      row.toggleSelect();
    }
    const data = row.getData();
    if (colDef?.field === 'workspaceCount') {
      openDetailPanel(data.id, { scrollToAssign: true });
    } else {
      openDetailPanel(data.id);
    }
  });
}

// ─── Filter ──────────────────────────────────────────────────────────────

function initFilter() {
  const fieldEl = document.getElementById('filter-field');
  const valueEl = document.getElementById('filter-value');
  const clearBtn = document.getElementById('filter-clear');
  if (!fieldEl || !valueEl || !clearBtn) return;

  function updateFilter() {
    if (!AppState.table) return;
    const field = fieldEl.value;
    const value = valueEl.value;
    if (field && value) {
      AppState.table.setFilter(field, 'like', value);
    } else {
      AppState.table.clearFilter();
    }
  }

  fieldEl.addEventListener('change', updateFilter);
  valueEl.addEventListener('keyup', updateFilter);
  clearBtn.addEventListener('click', function () {
    fieldEl.value = '';
    valueEl.value = '';
    AppState.table?.clearFilter();
  });
}

// ─── Detail Panel ────────────────────────────────────────────────────────

export async function openDetailPanel(projectId, opts = {}) {
  const project = AppState.projects.find((p) => p.id === projectId);
  if (!project) {
    showToast('Project not found.', 'error');
    return;
  }
  AppState.selectedProjectId = projectId;
  renderDetail(project);
  showDetailPanel();
  await loadProjectWorkspaces(projectId);
  if (opts.scrollToAssign) {
    document.getElementById('assign-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}

function renderDetail(project) {
  document.getElementById('detail-name').textContent = project.name || '-';
  document.getElementById('detail-id').textContent = project.id ?? '-';
  document.getElementById('detail-nsid').textContent = project.nsid || '-';
  document.getElementById('detail-description').textContent = project.description || '-';
  document.getElementById('detail-created').textContent = formatDate(project.created_at);
  document.getElementById('detail-updated').textContent = formatDate(project.updated_at);
}

function showDetailPanel() {
  document.getElementById('project-detail-panel')?.classList.add('show');
}

export function hideDetailPanel() {
  document.getElementById('project-detail-panel')?.classList.remove('show');
  AppState.selectedProjectId = null;
}

// ─── 배정 워크스페이스 서브리스트 (FR-02) ────────────────────────────────────

async function loadProjectWorkspaces(projectId) {
  const errorEl = document.getElementById('assign-section-error');
  errorEl.classList.add('d-none');
  try {
    const workspaces = await projectApi().getProjectWorkspaces(projectId);
    const project = AppState.projects.find((p) => p.id === projectId);
    if (project) {
      project.workspaces = workspaces || [];
      project.workspaceCount = project.workspaces.length;
      project._wsLoaded = true;
      AppState.table?.updateData([{ id: projectId, workspaceCount: project.workspaceCount, _wsLoaded: true }]);
    }
    renderAssignList(workspaces || []);
    await populateAssignSelect(workspaces || []);
    setAssignControlsEnabled(true);
  } catch (err) {
    if (err?.response?.status === 404) {
      showToast('Project not found.', 'error');
      hideDetailPanel();
      return;
    }
    console.error('Failed to load assigned workspaces:', err);
    errorEl.textContent = 'Failed to load assigned workspaces: ' + extractErrorMessage(err);
    errorEl.classList.remove('d-none');
    setAssignControlsEnabled(false);
  }
}

function setAssignControlsEnabled(enabled) {
  const btn = document.getElementById('assign-workspace-btn');
  const select = document.getElementById('assign-workspace-select');
  if (select?.tomselect) {
    if (enabled) select.tomselect.enable();
    else select.tomselect.disable();
  }
  if (btn) btn.disabled = !enabled || !select?.value;
}

function renderAssignList(workspaces) {
  const container = document.getElementById('assign-list');
  if (!container) return;
  container.innerHTML = '';
  if (!workspaces || workspaces.length === 0) {
    container.innerHTML = '<div class="text-muted">No workspaces assigned.</div>';
    return;
  }
  workspaces.forEach((ws) => {
    const row = document.createElement('div');
    row.className = 'd-flex align-items-center justify-content-between border-bottom py-2';
    row.innerHTML = `
      <div>${escapeHtml(ws.name)} <span class="text-muted">(id: ${escapeHtml(String(ws.id))})</span></div>
      <button type="button" class="btn btn-sm btn-outline-danger">Unassign</button>
    `;
    row.querySelector('button').addEventListener('click', function () {
      submitUnassignWorkspace(ws.id);
    });
    container.appendChild(row);
  });
}

async function populateAssignSelect(assignedWorkspaces) {
  const el = document.getElementById('assign-workspace-select');
  if (!el) return;
  if (el.tomselect) {
    el.tomselect.destroy();
  }
  el.innerHTML = '';

  const assignedIds = new Set((assignedWorkspaces || []).map((ws) => String(ws.id)));
  let allWorkspaces = [];
  try {
    allWorkspaces = (await workspaceApi().getAllWorksaceList()) || [];
  } catch (err) {
    console.error('Failed to load workspace list for assignment select:', err);
  }
  allWorkspaces
    .filter((ws) => !assignedIds.has(String(ws.id)))
    .forEach((ws) => {
      const opt = document.createElement('option');
      opt.value = ws.id;
      opt.textContent = ws.name;
      el.appendChild(opt);
    });

  new TomSelect(el, {
    placeholder: 'Select a workspace…',
    onChange: function (value) {
      const btn = document.getElementById('assign-workspace-btn');
      if (btn) btn.disabled = !value;
    },
  });
  document.getElementById('assign-workspace-btn').disabled = true;
}

export async function submitAssignWorkspace() {
  const projectId = AppState.selectedProjectId;
  const select = document.getElementById('assign-workspace-select');
  const workspaceId = select?.value;
  if (!projectId || !workspaceId) return;
  try {
    await projectApi().addWorkspaceToProject(projectId, workspaceId);
    const tomOpt = select.tomselect?.options?.[workspaceId];
    const ws = { id: workspaceId, name: tomOpt?.text || String(workspaceId) };
    const project = currentProject();
    if (project) {
      project.workspaces = [...(project.workspaces || []), ws];
    }
    renderAssignList(project?.workspaces || []);
    select.tomselect?.removeOption(workspaceId);
    select.tomselect?.setValue('', true);
    document.getElementById('assign-workspace-btn').disabled = true;
    updateWorkspaceBadge(projectId, 1);
    showToast('Workspace assigned.', 'success');
  } catch (err) {
    console.error('Failed to assign workspace:', err);
    showToast('Failed to assign workspace: ' + extractErrorMessage(err), 'error');
  }
}

export async function submitUnassignWorkspace(workspaceId) {
  const projectId = AppState.selectedProjectId;
  if (!projectId) return;
  try {
    await projectApi().removeWorkspaceFromProject(projectId, workspaceId);
    const project = currentProject();
    let removed = null;
    if (project) {
      removed = (project.workspaces || []).find((ws) => String(ws.id) === String(workspaceId));
      project.workspaces = (project.workspaces || []).filter((ws) => String(ws.id) !== String(workspaceId));
    }
    renderAssignList(project?.workspaces || []);
    restoreAssignSelectOption(removed || { id: workspaceId, name: String(workspaceId) });
    updateWorkspaceBadge(projectId, -1);
    showToast('Workspace unassigned.', 'success');
  } catch (err) {
    console.error('Failed to unassign workspace:', err);
    showToast('Failed to unassign workspace: ' + extractErrorMessage(err), 'error');
  }
}

function restoreAssignSelectOption(ws) {
  const select = document.getElementById('assign-workspace-select');
  if (select?.tomselect) {
    select.tomselect.addOption({ value: String(ws.id), text: ws.name });
  }
}

function updateWorkspaceBadge(projectId, delta) {
  const project = AppState.projects.find((p) => p.id === projectId);
  const base = project?.workspaceCount ?? 0;
  const newCount = Math.max(0, base + delta);
  if (project) project.workspaceCount = newCount;
  AppState.table?.updateData([{ id: projectId, workspaceCount: newCount, _wsLoaded: true }]);
}

// ─── Add Project ─────────────────────────────────────────────────────────

export async function openAddProjectModal() {
  document.getElementById('add-project-name').value = '';
  document.getElementById('add-project-description').value = '';
  await populateInitialWorkspaceSelect();
  new bootstrap.Modal(document.getElementById('modal-project-add')).show();
}

async function populateInitialWorkspaceSelect() {
  const el = document.getElementById('add-project-initial-workspace');
  if (!el) return;
  if (el.tomselect) {
    el.tomselect.destroy();
  }
  el.innerHTML = '';
  try {
    const workspaces = (await workspaceApi().getAllWorksaceList()) || [];
    workspaces.forEach((ws) => {
      const opt = document.createElement('option');
      opt.value = ws.id;
      opt.textContent = ws.name;
      el.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load workspace list:', err);
  }
  new TomSelect(el, { placeholder: 'Select an initial workspace (optional)' });
}

export async function submitAddProject() {
  const name = document.getElementById('add-project-name').value.trim();
  const description = document.getElementById('add-project-description').value.trim();
  const workspaceSelect = document.getElementById('add-project-initial-workspace');
  const workspaceId = workspaceSelect?.value;

  if (!name) {
    showToast('Name is required.', 'error');
    return;
  }
  if (name.length > 255) {
    showToast('Name must be 255 characters or fewer.', 'error');
    return;
  }
  if (description.length > 1000) {
    showToast('Description must be 1000 characters or fewer.', 'error');
    return;
  }

  try {
    const created = await projectApi().createProject({ name, description });
    if (workspaceId && created?.id) {
      try {
        await projectApi().addWorkspaceToProject(created.id, workspaceId);
      } catch (assignErr) {
        console.error('Failed to assign initial workspace:', assignErr);
        showToast('Project created, but failed to assign the initial workspace: ' + extractErrorMessage(assignErr), 'warning');
      }
    }
    bootstrap.Modal.getInstance(document.getElementById('modal-project-add'))?.hide();
    showToast('Project created.', 'success');
    await loadProjects();
  } catch (err) {
    console.error('Failed to create project:', err);
    showToast('Failed to create project: ' + extractErrorMessage(err), 'error');
    // 모달은 유지하고 입력값도 보존한다 (legacy alert()/location.reload() 패턴 금지)
  }
}

// ─── Edit Project ────────────────────────────────────────────────────────

export function openEditProjectModal() {
  const project = currentProject();
  if (!project) return;
  document.getElementById('edit-project-name').value = project.name || '';
  document.getElementById('edit-project-description').value = project.description || '';
  new bootstrap.Modal(document.getElementById('modal-project-edit')).show();
}

export async function submitEditProject() {
  const projectId = AppState.selectedProjectId;
  if (!projectId) return;
  const name = document.getElementById('edit-project-name').value.trim();
  const description = document.getElementById('edit-project-description').value.trim();

  if (!name) {
    showToast('Name is required.', 'error');
    return;
  }
  if (name.length > 255) {
    showToast('Name must be 255 characters or fewer.', 'error');
    return;
  }
  if (description.length > 1000) {
    showToast('Description must be 1000 characters or fewer.', 'error');
    return;
  }

  try {
    const updated = await projectApi().updateProject(projectId, { name, description });
    const project = currentProject();
    if (project) {
      project.name = updated?.name ?? name;
      project.description = updated?.description ?? description;
      project.updated_at = updated?.updated_at ?? project.updated_at;
      renderDetail(project);
      AppState.table?.updateData([{ id: projectId, name: project.name, description: project.description, updated_at: project.updated_at }]);
    }
    bootstrap.Modal.getInstance(document.getElementById('modal-project-edit'))?.hide();
    showToast('Project updated.', 'success');
  } catch (err) {
    console.error('Failed to update project:', err);
    showToast('Failed to update project: ' + extractErrorMessage(err), 'error');
  }
}

// ─── Delete (단건, 가드 포함) ─────────────────────────────────────────────

export function confirmDeleteProject() {
  const project = currentProject();
  if (!project) return;
  const assigned = project.workspaces || [];
  if (assigned.length > 0) {
    showCannotDeleteModal(assigned);
    return;
  }
  modalApi().commonConfirmModal(
    'commonDefaultModal',
    'Delete Project',
    `Delete project "${project.name}"?`,
    'pages/operations/manage/workspaces/projects.executeDeleteProject'
  );
}

export async function executeDeleteProject() {
  const projectId = AppState.selectedProjectId;
  if (!projectId) return;
  try {
    await projectApi().deleteProject(projectId);
    showToast('Project deleted.', 'success');
    AppState.projects = AppState.projects.filter((p) => p.id !== projectId);
    AppState.table?.deleteRow(projectId)?.catch(() => {});
    hideDetailPanel();
  } catch (err) {
    console.error('Failed to delete project:', err);
    showToast('Failed to delete project: ' + extractErrorMessage(err), 'error');
  }
}

function showCannotDeleteModal(assignedWorkspaces) {
  const list = document.getElementById('cannot-delete-list');
  list.innerHTML = '';
  assignedWorkspaces.forEach((ws) => {
    const li = document.createElement('li');
    li.textContent = ws.name;
    list.appendChild(li);
  });
  new bootstrap.Modal(document.getElementById('modal-cannot-delete')).show();
}

export function goToAssignments() {
  bootstrap.Modal.getInstance(document.getElementById('modal-cannot-delete'))?.hide();
  document.getElementById('assign-section')?.scrollIntoView({ behavior: 'smooth' });
}

// ─── Delete Selected (다중선택, 가드 포함) ─────────────────────────────────

export function confirmBulkDelete() {
  const selectedRows = AppState.table ? AppState.table.getSelectedData() : [];
  if (selectedRows.length === 0) {
    modalApi().commonShowDefaultModal('Nothing Selected', 'Please select at least one project to delete.');
    return;
  }

  const items = selectedRows.map((row) => AppState.projects.find((p) => p.id === row.id)).filter(Boolean);
  const blocked = items.filter((p) => (p.workspaces || []).length > 0);
  const deletable = items.filter((p) => (p.workspaces || []).length === 0);

  if (deletable.length === 0) {
    modalApi().commonShowDefaultModal(
      'Cannot Delete Projects',
      `All ${blocked.length} selected project(s) are assigned to workspaces and cannot be deleted: ` +
        blocked.map((p) => p.name).join(', ') +
        '. Unassign them first.'
    );
    return;
  }

  AppState.bulkDeletePending = deletable;
  AppState.bulkDeleteBlocked = blocked;
  const message =
    blocked.length > 0
      ? `Delete ${deletable.length} project(s)? ${blocked.length} selected project(s) are assigned to workspaces and will be skipped: ${blocked
          .map((p) => p.name)
          .join(', ')}.`
      : `Delete ${deletable.length} selected project(s)?`;

  modalApi().commonConfirmModal(
    'commonDefaultModal',
    'Delete Selected',
    message,
    'pages/operations/manage/workspaces/projects.executeBulkDelete'
  );
}

export async function executeBulkDelete() {
  const items = AppState.bulkDeletePending || [];
  const blocked = AppState.bulkDeleteBlocked || [];
  if (items.length === 0) return;

  const results = await Promise.allSettled(items.map((p) => projectApi().deleteProject(p.id)));
  const failed = results.filter((r) => r.status === 'rejected').length;
  const succeeded = results.length - failed;

  const parts = [`${succeeded} project(s) deleted`];
  if (failed > 0) parts.push(`${failed} failed`);
  if (blocked.length > 0) parts.push(`${blocked.length} skipped (still assigned to workspaces)`);
  showToast(parts.join(', ') + '.', failed > 0 ? 'warning' : 'success');

  const closedProjectId = AppState.selectedProjectId;
  AppState.bulkDeletePending = [];
  AppState.bulkDeleteBlocked = [];
  AppState.table?.deselectRow();
  if (closedProjectId && items.some((p) => p.id === closedProjectId)) {
    hideDetailPanel();
  }
  await loadProjects();
}

// ─── Init ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function () {
  const btnList = document.getElementById('page-header-btn-list');
  if (btnList) {
    btnList.innerHTML = `
      <button type="button" class="btn btn-primary"
        onclick="webconsolejs['pages/operations/manage/workspaces/projects'].openAddProjectModal()">
        Add Project
      </button>`;
  }

  initFilter();
  await loadProjects();
});
