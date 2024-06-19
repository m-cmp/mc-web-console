// navigation 에 workspace목록, project목록 set
// - local storage에 저장된 user의 workspace목록, project 목록을 우선 set.
// - workspace 변경시 project 목록 조회
// - refresh 버튼 클릭 시 user의 workspace, project 목록 조회하여 local storage에 저장 init 호출
// - init은 저장된 user의 workspace목록, project 목록을 조회하여 set

let workspaceListselectBox = document.getElementById("select-current-workspace");
let projectListselectBox = document.getElementById("select-current-project");

let workspaceRefreshBtn = document.getElementById("refresh-user-ws-prj")// ws prj refresh 버튼

document.addEventListener('DOMContentLoaded',async function () {
    workspaceProjectInit()// workspace select box, project select box 초기화 from local storage
});


workspaceListselectBox.addEventListener('change', function () {
    if (this.value == "") return;
    
    let workspace = {"Id":this.value, "Name":this.options[this.selectedIndex].text}
    webconsolejs["common/util"].setCurrentWorkspace(workspace)
    
    // workspace 변경 시 currProject 다시 set
    setPrjSelectBox(workspace.Id)
    
});

projectListselectBox.addEventListener('change',function () {
    let project = {"Id":this.value, "Name":this.options[this.selectedIndex].text}
    webconsolejs["common/util"].setCurrentProject(project)
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
async function getWorkspaceProjectListByUser() {
//async function updateWorkspaceProjectList() {
    const response = await webconsolejs["common/api/http"].commonAPIPost('/api/getworkspacebyuserid', null)
    return response.data.responseData
}

// workspaceList select에 set.
//function updateWsSelectBox(workspaceList) {
async function setWorkspaceSelectBox(workspaceList) {
    while (workspaceListselectBox.options.length > 0) {
        workspaceListselectBox.remove(0);
    }
    var workspaceExists = false
    console.log("get workspace from session " , webconsolejs["common/util"].getCurrentWorkspace())
    let curWorkspaceId = await webconsolejs["common/util"].getCurrentWorkspace()?.Id

    console.log("setWorkspaceSelectbox --------------------")
    //console.log(workspaceList)
    const defaultOpt = document.createElement("option");
    defaultOpt.value = ""
    defaultOpt.textContent = "Please select a workspace";
    workspaceListselectBox.appendChild(defaultOpt);
    
    for (const w in workspaceList) {                
        const opt = document.createElement("option");
        opt.value = workspaceList[w].id;
        opt.textContent = workspaceList[w].name;
        console.log("curWorkspaceId", curWorkspaceId)
        console.log("workspaceList[w]", workspaceList[w])
        if (curWorkspaceId != "" && workspaceList[w].id == curWorkspaceId) {
            opt.setAttribute("selected", "selected");
            workspaceExists = true
        }
        workspaceListselectBox.appendChild(opt);
    }    
}

// project는 조회한다.
async function setPrjSelectBox(workspaceId) {
// function updatePrjSelectBox(workspaceId) {
    let projectList = await webconsolejs["common/util"].getProjectListByWorkspaceId(workspaceId)
    console.log("projectList ", projectList)
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

    //initPage("PROJECT_CHANGED");// project가 변경되면 InitPage 호출
}

// 기본은 local storage에 저장된 값 사용 -> 없으면 조회
async function workspaceProjectInit(){
    //let userWorkspaceProjectList = webconsolejs["common/util"].getCurrentWorkspaceProjectList()
    //
    let userWorkspaceList = await webconsolejs["common/util"].getWorkspaceListByUser();
    if (userWorkspaceList == null ){
        console.log("not saved. get ")
        userWorkspaceProjectList = await getWorkspaceProjectListByUser()// workspace 목록, project 목록 조회
        //webconsolejs["common/util"].setWorkspaceProjectList(userWorkspaceProjectList)

        // 새로 조회한 경우 저장된 curworkspace, curproject 는 초기화
    }
    console.log("In workspaceProjectInit")
    console.log("userWorkspaceProjectList", userWorkspaceList)
    // workspace목록을 select박스에 set
    setWorkspaceSelectBox(userWorkspaceList)

    let curWorkspaceId = webconsolejs["common/util"].getCurrentWorkspace()
    if (curWorkspaceId != "") {
        workspaceListselectBox.value = curWorkspaceId;
        
        // on change event가 자동으로 먹지 않을까?
        //updatePrjSelectBox(workspaceId)

        // project 목록에서 project 선택
        //projectListselectBox.value = webconsolejs["common/util"].getProject()?.Id;
    }
}