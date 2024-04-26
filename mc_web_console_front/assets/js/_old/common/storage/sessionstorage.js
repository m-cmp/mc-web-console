export function getSessionCurrentWorkspaceProjcet() {
    let currentWorkspacProject = JSON.parse(sessionStorage.getItem('currentWorkspacProject'))
    return currentWorkspacProject
}

export function setSessionCurrentWorkspaceProjcet(workspaceId, projectId) {
    let currentWorksppacProject = {
        "currentWorkspace":workspaceId,
        "currentProject":projectId
    }
    sessionStorage.setItem('currentWorkspacProject',JSON.stringify(currentWorksppacProject))
}

export async function getSessionWorkspaceList() {
    let workspaceList = JSON.parse(sessionStorage.getItem('workspaceList'))
    if (workspaceList == null){
        await webconsolejs["common/storage/sessionstorage"].updateSessionWorkspaceList()
        workspaceList = webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceList()
    }
    return workspaceList.Workspaces
}

export function getSessionProjectList() {
    let projectList = JSON.parse(sessionStorage.getItem('projectList'))
    return projectList.Projects
}

export async function updateSessionWorkspaceList() {
    const response = await webconsolejs["common/http/api"].commonAPIPost('/api/workspacelistbyuser')
    sessionStorage.setItem('workspaceList', JSON.stringify(response.data.responseData));
}

export async function updateSessionProjectListByWorkspaceId(workspaceId) {
    let data = {
        "requestData":{
            "userId":"mciamuser",
            "workspaceId": workspaceId
        }
    }
    const response = await webconsolejs["common/http/api"].commonAPIPost('/api/projectlistbyworkspaceid',data)
    sessionStorage.setItem('projectList', JSON.stringify(response.data.responseData));
}
