document.addEventListener('DOMContentLoaded',async function () {
    let workspaceList = await webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceList()
    let selectBox = document.getElementById("select-current-workspace");
    for (let workspace of workspaceList){
        let option = document.createElement("option");
        option.text = workspace.Name;
        option.value = workspace.Id;
        selectBox.add(option);
    }
});
