document.addEventListener('DOMContentLoaded',function () {
    let workspaceList = webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceList()
    let selectBox = document.getElementById("select-current-workspace");
    for (let workspace of workspaceList){
        let option = document.createElement("option");
        option.text = workspace.Name;
        option.value = workspace.Id;
        selectBox.add(option);
    }

    webconsolejs["common/storage/sessionstorage"].updateSessionProjectListByWorkspaceId()
    alert("updateSessionProjectListByWorkspaceId")

});

// document.getElementById("select-refresh").addEvcentListener('click', async function () {
//     await webconsolejs["common/storage/sessionstorage"].updateSessionWorkspaceList()
//     console.log(workspaceList)
// });

