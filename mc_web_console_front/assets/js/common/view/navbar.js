document.addEventListener('DOMContentLoaded',async function () {
    let workspaceList = webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceList()
    let projectListselectBox = document.getElementById("select-current-project");
    let workspaceListselectBox = document.getElementById("select-current-workspace");
    for (let workspace of workspaceList){
        let option = document.createElement("option");
        option.text = workspace.Name;
        option.value = workspace.Id;
        workspaceListselectBox.add(option);
    }
    let currentWorksppacProject = webconsolejs["common/storage/sessionstorage"].getSessionCurrentWorkspaceProjcet()
    if (currentWorksppacProject) {
        console.log("123123123123123")
        await webconsolejs["common/storage/sessionstorage"].updateSessionProjectListByWorkspaceId(currentWorksppacProject.currentWorkspace)
        let projectList = webconsolejs["common/storage/sessionstorage"].getSessionProjectList()
        for (let projcet of projectList){
            let option = document.createElement("option");
            option.text = projcet.Name;
            option.value = projcet.Id;
            projectListselectBox.add(option);
        }
        workspaceListselectBox.value = currentWorksppacProject.currentWorkspace
        projectListselectBox.value = currentWorksppacProject.currentProject
    }else{
        workspaceListselectBox.value = ""
        projectListselectBox.value = ""
    }
});

document.getElementById("select-current-workspace").addEventListener('change',async function () {
    let projectListselectBox = document.getElementById("select-current-project");
    while (projectListselectBox.options.length > 0) {
        projectListselectBox.remove(0);
    }
    await webconsolejs["common/storage/sessionstorage"].updateSessionProjectListByWorkspaceId(this.value)
    let projectList = webconsolejs["common/storage/sessionstorage"].getSessionProjectList()
    for (let projcet of projectList){
        let option = document.createElement("option");
        option.text = projcet.Name;
        option.value = projcet.Id;
        projectListselectBox.add(option);
    }
});


document.getElementById("select-refresh").addEventListener("click",async function () {
    await webconsolejs["common/storage/sessionstorage"].updateSessionWorkspaceList()
    alert("Workspace List is updated")
});

document.getElementById("select-confirm").addEventListener("click",function () {
    let workspacId = document.getElementById("select-current-workspace").value
    let projectId = document.getElementById("select-current-project").value;

    if (workspacId && projectId){
        webconsolejs["common/storage/sessionstorage"].setSessionCurrentWorkspaceProjcet(workspacId, projectId)
        alert("SUCCESS : "+workspacId+" and "+projectId+" is selected !")
    }else {
        alert("ERROR : workspace and project is not selected !")
    }
});