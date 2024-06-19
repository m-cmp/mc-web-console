// workspace
// export function getSessionCurrentWorkspace() {
//     return JSON.parse(sessionStorage.getItem("currentWorkspace"))
// }
// export function setSessionCurrentWorkspace(workspace) {
//     sessionStorage.setItem('currentWorkspace',JSON.stringify(workspace))
// }

// // project
// export function getSessionCurrentProject() {
//     return JSON.parse(sessionStorage.getItem("currentProject"))
// }
// export function setSessionCurrentProject(project) {
//     sessionStorage.setItem('currentProject',JSON.stringify(project))
// }

// export function getSessionWorkspaceProjectList() {
//     return JSON.parse(sessionStorage.getItem("currentWorkspaceProjcetList"))
// }
// export function setSessionWorkspaceProjectList(v) {
//     sessionStorage.setItem('currentWorkspaceProjcetList',JSON.stringify(v))
// }

// export function clearSessionCurrentWorkspaceProject() {
//     sessionStorage.removeItem("currentWorkspaceProjcetList")
//     sessionStorage.removeItem("currentProject")
//     sessionStorage.removeItem("currentWorkspace")
// }

//////////
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

// sessionStorage의 workspaceList 갱신
export async function updateSessionWorkspaceList(workspaceList) {
    // const response = await webconsolejs["common/http/api"].commonAPIPost('/api/workspacelistbyuser')
    // sessionStorage.setItem('workspaceList', JSON.stringify(response.data.responseData));
    sessionStorage.setItem('workspaceList', JSON.stringify(workspaceList));
}

// sessionStorage의 projectList 갱신 : 조회된 목록을 갱신
//export async function updateSessionProjectListByWorkspaceId(workspaceId) {
export async function updateSessionProjectList(projectList) {    
    sessionStorage.setItem('projectList', JSON.stringify(projectList));
}

