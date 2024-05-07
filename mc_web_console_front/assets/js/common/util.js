// default workspace에서 sessionstorage를 사용하지 않을때, 아래에서 리턴값 재정의
// workspace
export function getCurrentWorkspace() {
    return webconsolejs["common/storage/sessionstorage"].getSessionCurrentWorkspace()
}
export function setCurrentWorkspace(workspace) {
    webconsolejs["common/storage/sessionstorage"].setSessionCurrentWorkspace(workspace)
}
export function getCurrentWorkspaceList() {
    return JSON.parse(sessionStorage.getItem("currentWorkspaceList"))
}
export function setCurrentWorkspaceList(workspaceList) {
    sessionStorage.setItem('currentWorkspaceList',JSON.stringify(workspaceList))
}



// project
export function getCurrentProject() {
    return webconsolejs["common/storage/sessionstorage"].getSessionCurrentProject()
}
export function setCurrentProject(project) {
    webconsolejs["common/storage/sessionstorage"].setSessionCurrentProject(project)
}
export function getCurrentProjectList() {
    return JSON.parse(sessionStorage.getItem("currentProjectList"))
}
export function setCurrentProjectList(projectList) {
    webconsolejs["common/storage/sessionstorage"].setSessionCurrentProjectList(projectList)
}
