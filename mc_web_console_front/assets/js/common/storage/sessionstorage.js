// workspace
export function getSessionCurrentWorkspace() {
    return JSON.parse(sessionStorage.getItem("currentWorkspace"))
}
export function setSessionCurrentWorkspace(workspace) {
    sessionStorage.setItem('currentWorkspace',JSON.stringify(workspace))
}

// project
export function getSessionCurrentProject() {
    return JSON.parse(sessionStorage.getItem("currentProject"))
}
export function setSessionCurrentProject(project) {
    sessionStorage.setItem('currentProject',JSON.stringify(project))
}

export function getSessionWorkspaceProjectList() {
    return JSON.parse(sessionStorage.getItem("currentWorkspaceProjcetList"))
}
export function setSessionWorkspaceProjectList(v) {
    sessionStorage.setItem('currentWorkspaceProjcetList',JSON.stringify(v))
}

export function clearSessionCurrentWorkspaceProject() {
    sessionStorage.removeItem("currentWorkspaceProjcetList")
    sessionStorage.removeItem("currentProject")
    sessionStorage.removeItem("currentWorkspace")
}
