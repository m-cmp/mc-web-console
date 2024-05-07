// workspace
export function getSessionCurrentWorkspace() {
    return JSON.parse(sessionStorage.getItem("currentWorkspace"))
}
export function setSessionCurrentWorkspace(workspace) {
    sessionStorage.setItem('currentWorkspace',JSON.stringify(workspace))
}
export function getSessionCurrentWorkspaceList() {
    return JSON.parse(sessionStorage.getItem("currentWorkspaceList"))
}
export function setSessionCurrentWorkspaceList(workspaceList) {
    sessionStorage.setItem('currentWorkspaceList',JSON.stringify(workspaceList))
}

// project
export function getSessionCurrentProject() {
    return JSON.parse(sessionStorage.getItem("currentProject"))
}
export function setSessionCurrentProject(project) {
    sessionStorage.setItem('currentProject',JSON.stringify(project))
}
export function getSessionCurrentProjectList() {
    return JSON.parse(sessionStorage.getItem("currentProjectList"))
}
export function setSessionCurrentProjectList(projectList) {
    sessionStorage.setItem('currentProjectList',JSON.stringify(projectList))
}