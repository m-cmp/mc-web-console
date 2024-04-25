export function getSessionWorkspaceList() {
    let workspaceList = JSON.parse(sessionStorage.getItem('workspaceList'))
    return workspaceList.Workspaces
}

export async function updateSessionWorkspaceList() {
    const response = await webconsolejs["common/http/api"].commonAPIPost('/api/workspacelistbyuser')
    sessionStorage.setItem('workspaceList', JSON.stringify(response.data.responseData));
}

export function setSessionCurrentWorkspace() {
    
}