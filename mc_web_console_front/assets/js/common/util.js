// default workspace에서 sessionstorage를 사용하지 않을때, 아래에서 리턴값 재정의
// workspace
export function getCurrentWorkspace() {
    return webconsolejs["common/storage/sessionstorage"].getSessionCurrentWorkspace()
}
export function setCurrentWorkspace(v) {
    webconsolejs["common/storage/sessionstorage"].setSessionCurrentWorkspace(v)
}

export function getCurrentProject() {
    return webconsolejs["common/storage/sessionstorage"].getSessionCurrentProject()
}
export function setCurrentProject(v) {
    webconsolejs["common/storage/sessionstorage"].setSessionCurrentProject(v)
}

// workspace project List
export function getCurrentWorkspaceProjectList() {
    return webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceProjectList()
}
export function setCurrentWorkspaceProjectList(v) {
    webconsolejs["common/storage/sessionstorage"].setSessionWorkspaceProjectList(v)
}

export function clearCurrentWorkspaceProject() {
    webconsolejs["common/storage/sessionstorage"].clearSessionCurrentWorkspaceProject()
}
