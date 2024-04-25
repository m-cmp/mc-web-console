export function getSessionWorkspaceList() {
    let workspaceList = JSON.parse(sessionStorage.getItem('workspaceList'))
    return workspaceList.Workspaces
}

export function getSessionProjectList() {
    let projectList = JSON.parse(sessionStorage.getItem('projectList'))
    return workspaceList.Workspaces
}

export async function updateSessionWorkspaceList() {
    const response = await webconsolejs["common/http/api"].commonAPIPost('/api/workspacelistbyuser')
    sessionStorage.setItem('workspaceList', JSON.stringify(response.data.responseData));
}

export async function updateSessionProjectListByWorkspaceId() {
    let data = {
        "requestData":{
            "userId":"asdasd",
            "workspaceId":"testId1"
        }
    }
    const response = await webconsolejs["common/http/api"].commonAPIPost('/api/projectlistbyworkspaceid',data)
    sessionStorage.setItem('projectList', JSON.stringify(response.data.responseData.Projects));
}

export function setSessionCurrentWorkspace() {
    
}