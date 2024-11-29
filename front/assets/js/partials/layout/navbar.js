// navigation 에 workspace목록, project목록 set
// - local storage에 저장된 user의 workspace목록, project 목록을 우선 set.
// - workspace 변경시 project 목록 조회
// - refresh 버튼 클릭 시 user의 workspace, project 목록 조회하여 local storage에 저장 init 호출
// - init은 저장된 user의 workspace목록, project 목록을 조회하여 set

let workspaceListselectBox = document.getElementById("select-current-workspace");
let projectListselectBox = document.getElementById("select-current-project");

let workspaceRefreshBtn = document.getElementById("refresh-user-ws-prj")// ws prj refresh 버튼

document.addEventListener('DOMContentLoaded', async function () {
    console.log("navbar init")
    await workspaceProjectInit() // workspace select box, project select box 초기화 from local storage
    if (workspaceListselectBox.value === ""){
        workspaceListselectBox.classList.add('is-invalid');
    }
    if (projectListselectBox.value === ""){
        projectListselectBox.classList.add('is-invalid');
    }
    // tooltip 추가
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// navbar에서는 변경시 session에만 set. 필요화면에서 사용
workspaceListselectBox.addEventListener('change', function () {
    if (this.value === ""){
        this.classList.add('is-invalid');
        return
    }else{
        this.classList.remove('is-invalid');
    }
    let workspace = { "Id": this.value, "Name": this.options[this.selectedIndex].text }
    webconsolejs["common/api/services/workspace_api"].setCurrentWorkspace(workspace);//세션에 저장
    setPrjSelectBox(workspace.Id)
});

projectListselectBox.addEventListener('change', function () {
    if (this.value === ""){
        this.classList.add('is-invalid');
        return
    }else{
        this.classList.remove('is-invalid');
    }
    let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project);//세션에 저장
});

// refresh 버튼 클릭시 user의 workspace, project 목록 조회
workspaceRefreshBtn.addEventListener('click', async function () {
    webconsolejs["common/api/services/workspace_api"].setCurrentWorkspace("");
    webconsolejs["common/api/services/workspace_api"].setCurrentProject("");
    await workspaceProjectInit()
});

export async function setPrjSelectBox(workspaceId) {
    let projectList = await webconsolejs["common/api/services/workspace_api"].getProjectListByWorkspaceId(workspaceId)
    console.log("projectList ", projectList)
    while (projectListselectBox.options.length > 0) {
        projectListselectBox.remove(0);
    }

    const defaultOpt = document.createElement("option");
    defaultOpt.value = ""
    defaultOpt.textContent = "Please select a project";
    projectListselectBox.appendChild(defaultOpt);

    let curProjectId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.Id
    for (const p in projectList) {
        const opt = document.createElement("option");
        opt.value = projectList[p].id;
        opt.textContent = projectList[p].name;
        projectListselectBox.appendChild(opt);

        if (curProjectId != "" && projectList[p].id == curProjectId) {
            opt.setAttribute("selected", "selected");
        }
    }
}

// 기본은 local storage에 저장된 값 사용 -> 없으면 조회
// navbar에 workspace 목록 selectbox와 project 목록 select box set
export async function workspaceProjectInit() {
    let userWorkspaceList = await webconsolejs["common/api/services/workspace_api"].getWorkspaceListByUser()
    let curWorkspace = webconsolejs["common/api/services/workspace_api"].getCurrentWorkspace()
    let curWorkspaceId = "";
    let curWorkspaceName = "";
    if (curWorkspace) {
        curWorkspaceId = curWorkspace.Id;
        curWorkspaceName = curWorkspace.Name;
    }

    webconsolejs["common/api/services/workspace_api"].setWorkspaceSelectBox(userWorkspaceList, curWorkspaceId)

    let curProjectId = "";
    let curProjectName = "";
    let curNsId = "";
    if (curWorkspaceId == "" || curWorkspaceId == undefined) {
        webconsolejs["common/api/services/workspace_api"].setPrjSelectBox(null, "")
        console.log("curWorkspaceId is not set ")
    } else {
        let userProjectList = await webconsolejs["common/api/services/workspace_api"].getUserProjectList(curWorkspaceId)
        let curProject = await webconsolejs["common/api/services/workspace_api"].getCurrentProject();
        if (curProject) {
            curProjectId = curProject.Id;
            curProjectName = curProject.Name;
            curNsId = curProject.NsId;
        }
        webconsolejs["common/api/services/workspace_api"].setPrjSelectBox(userProjectList, curProjectId)
    }

    return { workspaceId: curWorkspaceId, workspaceName: curWorkspaceName, projectId: curProjectId, projectName: curProjectName, nsId: curNsId };
}


document.getElementById("logoutbtn").addEventListener('click', async function () {
    destroyAccessToken()
    sessionStorage.clear();
    window.location = "/auth/logout"
});

export function destroyAccessToken() {
    document.cookie = `Authorization=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
}

// workspaceObj
// export async function setWorkspaceChanged(selectedWorkspaceValue){
//     console.log(" setWorkspaceChanged ")

//     if( selectedWorkspaceValue == ""){
//         console.log("selectedWorkspace Value empty")
//         return;
//     }

//     let projectListselectBox = document.getElementById("select-current-project");

//     let projectList = await webconsolejs["common/api/services/workspace_api"].getProjectListByWorkspaceId(selectedWorkspaceValue);
//     console.log("set project select box")
//     while (projectListselectBox.options.length > 0) {
//         projectListselectBox.remove(0);        
//     }

//     const defaultOpt = document.createElement("option");
//     defaultOpt.value = ""
//     defaultOpt.textContent = "Please select a project";
//     projectListselectBox.appendChild(defaultOpt);

//     let curProjectId = webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.Id
//     for (const p in projectList) {
//         console.log("p ", p)
//         const opt = document.createElement("option");
//         opt.value = projectList[p].id;
//         opt.textContent = projectList[p].name;
//         projectListselectBox.appendChild(opt);

//         if (curProjectId != "" && projectList[p].id == curProjectId) {
//             opt.setAttribute("selected", "selected");
//         }
//     }
// }