let workspaceListselectBox = document.getElementById("select-current-workspace");
let projectListselectBox = document.getElementById("select-current-project");

let workspaceRefresh = document.getElementById("select-refresh")

document.addEventListener('DOMContentLoaded',async function () {
    let currentWorkspaceList = webconsolejs["common/util"].getCurrentWorkspaceList()
    let currentProjectList = webconsolejs["common/util"].getCurrentProjectList()
    if (currentWorkspaceList == null || currentProjectList == null){
        let workspaceList = await updateWorkspaceList()
        webconsolejs["common/util"].setCurrentWorkspaceList(workspaceList)
        updateSelectBox(workspaceListselectBox, workspaceList)
    }else {
        updateSelectBox(workspaceListselectBox, currentWorkspaceList)
        updateSelectBox(projectListselectBox, currentProjectList)
    }
    let currentWorkspace = webconsolejs["common/util"].getCurrentWorkspace()
    let currentProject = webconsolejs["common/util"].getCurrentProject()
    workspaceListselectBox.value = currentWorkspace.Id
    projectListselectBox.value = currentProject.Id
});

workspaceListselectBox.addEventListener('change',async function () {
    let workspace = {"Id":this.value, "Name":this.options[this.selectedIndex].text}
    webconsolejs["common/util"].setCurrentWorkspace(workspace)
    let projectList = await updateProjectListByWorkspaceId(this.value)
    webconsolejs["common/util"].setCurrentProjectList(projectList)
    updateSelectBox(projectListselectBox, projectList)
});

projectListselectBox.addEventListener('change',function () {
    let project = { "Id" : this.value, "Name": this.options[this.selectedIndex].text}
    webconsolejs["common/util"].setCurrentProject(project)
});

workspaceRefresh.addEventListener("click",async function () {
    let workspaceList = await updateWorkspaceList()
    updateSelectBox(workspaceListselectBox, workspaceList)
    cleanSelectBox(projectListselectBox)
    alert("Workspace List is updated")
});

async function updateWorkspaceList() {
    const response = await webconsolejs["common/api/http"].commonAPIPost('/api/workspacelistbyuser')
    return response.data.responseData.Workspaces
}

async function updateProjectListByWorkspaceId(workspaceId) {
    let data = {
        "requestData":{
            "userId":"mciamuser",
            "workspaceId": workspaceId
        }
    }
    const response = await webconsolejs["common/api/http"].commonAPIPost('/api/projectlistbyworkspaceid',data)
    return response.data.responseData.Projects
}

function updateSelectBox(elem, datalist) {
    while (elem.options.length > 0) {
        elem.remove(0);
    }
    for (let d of datalist){
        let opt = document.createElement("option")
        opt.value = d.Id
        opt.text = d.Name
        elem.add(opt);
    }
    elem.value = ""
}

function initSelectBox(elem, data) {
    while (elem.options.length > 0) {
        elem.remove(0);
    }
    let opt = document.createElement("option")
    opt.value = data.Id
    opt.text = data.Name
    elem.add(opt);
    elem.value = data.Id
}

function cleanSelectBox(elem) {
    while (elem.options.length > 0) {
        elem.remove(0);
    }
}