// navigation 에 workspace목록, project목록 set
// - local storage에 저장된 user의 workspace목록, project 목록을 우선 set.
// - workspace 변경시 project 목록 조회
// - refresh 버튼 클릭 시 user의 workspace, project 목록 조회하여 local storage에 저장 init 호출
// - init은 저장된 user의 workspace목록, project 목록을 조회하여 set

let workspaceListselectBox = document.getElementById("select-current-workspace");
let projectListselectBox = document.getElementById("select-current-project");

let workspaceRefreshBtn = document.getElementById("refresh-user-ws-prj")// ws prj refresh 버튼

document.addEventListener('DOMContentLoaded',async function () {
    console.log("navbar init")
    //await workspaceProjectInit()// workspace select box, project select box 초기화 from local storage
});


// navbar에서는 변경시 session에만 set. 필요화면에서 사용
workspaceListselectBox.addEventListener('change', function () {
    // if (this.value == "") return;
    
    let workspace = {"Id":this.value, "Name":this.options[this.selectedIndex].text}
    webconsolejs["common/util"].setCurrentWorkspace(workspace);//세션에 저장

    // // workspace 변경 시 currProject 다시 set
    // setPrjSelectBox(workspace.Id)
    
});

// navbar에서는 변경시 session에만 set. 필요화면에서 사용
projectListselectBox.addEventListener('change',function () {
    let project = {"Id":this.value, "Name":this.options[this.selectedIndex].text}
    webconsolejs["common/util"].setCurrentProject(project)// 세션에 저장

    // 현재 화면의 iniPage() 호출
    //webconsolejs["pages/manage/mcis"].inptPage(project)
    //webconsolejs["pages/configuration/workspace/manage"].inptPage(project)
});

// refresh 버튼 클릭시 user의 workspace, project 목록 조회
workspaceRefreshBtn.addEventListener('click',function () {
    // webconsolejs["common/util"].clearCurrentWorkspaceProject()
    // while (workspaceListselectBox.options.length > 0) {
    //     workspaceListselectBox.remove(0);
    // }
    // while (projectListselectBox.options.length > 0) {
    //     projectListselectBox.remove(0);
    // }
    // workspaceProjectInit()
});

// user의 workspace와 project 목록 조회
// async function getWorkspaceProjectListByUser() {
// //async function updateWorkspaceProjectList() {
//     const response = await webconsolejs["common/api/http"].commonAPIPost('/api/getworkspacebyuserid', null)
//     return response.data.responseData
// }

// // workspaceList select에 set.
// //function updateWsSelectBox(workspaceList) {
// async function setWorkspaceSelectBox(workspaceList) {
//     while (workspaceListselectBox.options.length > 0) {
//         workspaceListselectBox.remove(0);
//     }
//     var workspaceExists = false
//     console.log("get workspace from session " , webconsolejs["common/util"].getCurrentWorkspace())
//     let curWorkspaceId = await webconsolejs["common/util"].getCurrentWorkspace()?.Id

//     console.log("setWorkspaceSelectbox --------------------")
//     //console.log(workspaceList)
//     const defaultOpt = document.createElement("option");
//     defaultOpt.value = ""
//     defaultOpt.textContent = "Please select a workspace";
//     workspaceListselectBox.appendChild(defaultOpt);
    
//     for (const w in workspaceList) {                
//         const opt = document.createElement("option");
//         opt.value = workspaceList[w].id;
//         opt.textContent = workspaceList[w].name;
//         console.log("curWorkspaceId", curWorkspaceId)
//         console.log("workspaceList[w]", workspaceList[w])
//         if (curWorkspaceId != "" && workspaceList[w].id == curWorkspaceId) {
//             opt.setAttribute("selected", "selected");
//             workspaceExists = true
//         }
//         workspaceListselectBox.appendChild(opt);
//     }    
// }

// // project는 조회한다.
// async function setPrjSelectBox(workspaceId) {
// // function updatePrjSelectBox(workspaceId) {
//     let projectList = await webconsolejs["common/util"].getProjectListByWorkspaceId(workspaceId)
//     console.log("projectList ", projectList)
//     while (projectListselectBox.options.length > 0) {
//         projectListselectBox.remove(0);        
//     }

//     const defaultOpt = document.createElement("option");
//     defaultOpt.value = ""
//     defaultOpt.textContent = "Please select a project";
//     projectListselectBox.appendChild(defaultOpt);

//     let curProjectId = webconsolejs["common/util"].getCurrentProject()?.Id
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

//     //initPage("PROJECT_CHANGED");// project가 변경되면 InitPage 호출
// }

// 기본은 local storage에 저장된 값 사용 -> 없으면 조회
// navbar에 workspace 목록 selectbox와 project 목록 select box set
export async function workspaceProjectInit(){

    let userWorkspaceList = await webconsolejs["common/util"].getWorkspaceListByUser()
    console.log("user wslist ", userWorkspaceList)

    let curWorkspace = await webconsolejs["common/util"].getCurrentWorkspace()
    let curWorkspaceId = "";
    //let curWorkspaceName = "";
    if( curWorkspace ){
        curWorkspaceId = curWorkspace.Id;
        //curWorkspaceName = curWorkspace.Name;
    }
    
    webconsolejs["common/util"].setWorkspaceSelectBox(userWorkspaceList, curWorkspaceId)
    

    // workspace, project 가 먼저 설정되어 있어야 한다.
    console.log("curWorkspaceId", curWorkspaceId)
    let curProjectId = "";
    if( curWorkspaceId == "" || curWorkspaceId == undefined){
        console.log(" curWorkspaceId is not set ")
    }else{
        // workspace가 선택되어 있으면 project 목록도 표시
        let userProjectList = await webconsolejs["common/util"].getUserProjectList(curWorkspaceId)
        console.log("userProjectList ", userProjectList)
        
        // project 목록이 있으면 cur project set
        curProjectId = await webconsolejs["common/util"].getCurrentProject()?.Id
        console.log("curProjectId", curProjectId)    

        webconsolejs["common/util"].setPrjSelectBox(userProjectList, curProjectId)
    }

    return {workspaceId:curWorkspaceId, projectId:curProjectId};    
}


// workspaceObj
export async function setWorkspaceChanged(selectedWorkspaceValue){
    console.log(" setWorkspaceChanged ")

    if( selectedWorkspaceValue == ""){
        console.log("selectedWorkspace Value empty")
        return;
    }

    let projectListselectBox = document.getElementById("select-current-project");

    let projectList = await webconsolejs["common/util"].getProjectListByWorkspaceId(selectedWorkspaceValue);
    console.log("set project select box")
    while (projectListselectBox.options.length > 0) {
        projectListselectBox.remove(0);        
    }

    const defaultOpt = document.createElement("option");
    defaultOpt.value = ""
    defaultOpt.textContent = "Please select a project";
    projectListselectBox.appendChild(defaultOpt);

    let curProjectId = webconsolejs["common/util"].getCurrentProject()?.Id
    for (const p in projectList) {
        console.log("p ", p)
        const opt = document.createElement("option");
        opt.value = projectList[p].id;
        opt.textContent = projectList[p].name;
        projectListselectBox.appendChild(opt);

        if (curProjectId != "" && projectList[p].id == curProjectId) {
            opt.setAttribute("selected", "selected");
        }
    }
}