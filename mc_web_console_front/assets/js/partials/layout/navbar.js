
let workspaceListselectBox = document.getElementById("select-current-workspace");
let projectListselectBox = document.getElementById("select-current-project");

let workspaceRefresh = document.getElementById("select-refresh")

document.addEventListener('DOMContentLoaded',async function () {
    workspaceProjectInit()
});

workspaceListselectBox.addEventListener('change',function () {
    let workspace = {"Id":this.value, "Name":this.options[this.selectedIndex].text}
    webconsolejs["common/util"].setCurrentWorkspace(workspace)
    updatePrjSelectBox(workspace.Id)
});

projectListselectBox.addEventListener('change',function () {
    let project = {"Id":this.value, "Name":this.options[this.selectedIndex].text}
    webconsolejs["common/util"].setCurrentProject(project)
});

workspaceRefresh.addEventListener('click',function () {
    webconsolejs["common/util"].clearCurrentWorkspaceProject()
    while (workspaceListselectBox.options.length > 0) {
        workspaceListselectBox.remove(0);
    }
    while (projectListselectBox.options.length > 0) {
        projectListselectBox.remove(0);
    }
    workspaceProjectInit()
});


async function updateWorkspaceProjectList() {
    const response = await webconsolejs["common/api/http"].commonAPIPost('/api/getworkspacebyuserid', null)
    return response.data.responseData
}

function updateWsSelectBox(workspaceList) {
    while (workspaceListselectBox.options.length > 0) {
        workspaceListselectBox.remove(0);
    }
    for (const w in workspaceList) {
        const opt = document.createElement("option");
        opt.value = workspaceList[w].workspaceId;
        opt.textContent = workspaceList[w].workspaceName;
        workspaceListselectBox.appendChild(opt);
    }
    workspaceListselectBox.value = ""
}

function updatePrjSelectBox(workspaceId) {
    let currentWorkspaceProjectList = webconsolejs["common/util"].getCurrentWorkspaceProjectList()
    let projecWorkspace = currentWorkspaceProjectList.find(item => item.workspaceId === workspaceId);
    let projectList = projecWorkspace.projectList
    while (projectListselectBox.options.length > 0) {
        projectListselectBox.remove(0);
    }
    for (const p in projectList) {
        const opt = document.createElement("option");
        opt.value = projectList[p].projectId;
        opt.textContent = projectList[p].projectName;
        projectListselectBox.appendChild(opt);
    }
    projectListselectBox.value = ""
}

async function workspaceProjectInit(){
    let currentWorkspaceProjectList = webconsolejs["common/util"].getCurrentWorkspaceProjectList()
    if (currentWorkspaceProjectList == null ){
        currentWorkspaceProjectList = await updateWorkspaceProjectList()
        webconsolejs["common/util"].setCurrentWorkspaceProjectList(currentWorkspaceProjectList)
    }
    updateWsSelectBox(currentWorkspaceProjectList)
    let workspaceId = webconsolejs["common/util"].getCurrentWorkspace()?.Id
    if (workspaceId != "") {
        workspaceListselectBox.value = webconsolejs["common/util"].getCurrentWorkspace()?.Id
        updatePrjSelectBox(workspaceId)
        projectListselectBox.value = webconsolejs["common/util"].getCurrentProject()?.Id;
    }
}