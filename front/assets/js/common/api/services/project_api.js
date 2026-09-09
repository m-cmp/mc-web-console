// Project(플랫폼 워크스페이스 크로스) API 서비스
// FR-PLATFORM-ADMIN-008-01 / FR-PLATFORM-ADMIN-008-02

function unwrapResponse(response) {
    if (!response) {
        throw new Error('Invalid response from server');
    }
    if (response.response) {
        const err = new Error(response.message || 'Request failed');
        err.response = response.response;
        throw err;
    }
    // 204 No Content(예: removeWorkspaceFromProject)는 응답 바디가 없어 response.data가
    // 빈 문자열로 온다 — 정상 성공으로 취급한다(mc-web-console API가 upstream 204를 그대로 통과시킴).
    if (response.status === 204) {
        return undefined;
    }
    if (!response.data) {
        throw new Error('Invalid response from server');
    }
    if (response.status >= 400) {
        const msg = (response.data.status && response.data.status.message) || response.data.message || 'Request failed';
        const err = new Error(msg);
        err.response = response;
        throw err;
    }
    return response.data.responseData;
}

export async function listProjects() {
    const controller = '/api/mc-iam-manager/listProjects';
    const response = await webconsolejs['common/api/http'].commonAPIPost(controller);
    return unwrapResponse(response);
}

export async function createProject(data) {
    const controller = '/api/mc-iam-manager/createProject';
    const response = await webconsolejs['common/api/http'].commonAPIPost(controller, { request: data });
    return unwrapResponse(response);
}

export async function getProjectById(projectId) {
    const controller = '/api/mc-iam-manager/getProjectByID';
    const data = { pathParams: { projectId: projectId.toString() } };
    const response = await webconsolejs['common/api/http'].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function updateProject(projectId, data) {
    const controller = '/api/mc-iam-manager/updateProject';
    const requestData = { pathParams: { projectId: projectId.toString() }, request: data };
    const response = await webconsolejs['common/api/http'].commonAPIPost(controller, requestData);
    return unwrapResponse(response);
}

export async function deleteProject(projectId) {
    const controller = '/api/mc-iam-manager/deleteProject';
    const data = { pathParams: { projectId: projectId.toString() } };
    const response = await webconsolejs['common/api/http'].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

// project 기준 배정된 workspace 목록 조회
export async function getProjectWorkspaces(projectId) {
    const controller = '/api/mc-iam-manager/getProjectWorkspaces';
    const data = { pathParams: { projectId: projectId.toString() } };
    const response = await webconsolejs['common/api/http'].commonAPIPost(controller, data);
    return unwrapResponse(response) ?? [];
}

// project-side addWorkspaceToProject(POST /api/projects/assign/workspaces)는 mc-iam-manager 500 버그
// (IAM-BUG-034 / BAR-1844) — DB write 자체는 성공하지만 응답 처리 중 500을 던진다.
// 시그니처는 project-centric으로 유지하되, 내부는 동일 서비스 메소드를 호출하는
// workspace-side 엔드포인트(addProjectToWorkspace, POST /api/workspaces/assign/projects)로 우회한다.
export async function addWorkspaceToProject(projectId, workspaceId) {
    const controller = '/api/mc-iam-manager/addProjectToWorkspace';
    const data = { request: { workspaceId: workspaceId.toString(), projectIds: [projectId.toString()] } };
    const response = await webconsolejs['common/api/http'].commonAPIPost(controller, data);
    return unwrapResponse(response);
}

export async function removeWorkspaceFromProject(projectId, workspaceId) {
    const controller = '/api/mc-iam-manager/removeWorkspaceFromProject';
    const data = { request: { workspaceId: workspaceId.toString(), projectIds: [projectId.toString()] } };
    const response = await webconsolejs['common/api/http'].commonAPIPost(controller, data);
    return unwrapResponse(response);
}
