
// default workspace에서 sessionstorage를 사용하지 않을때, 아래에서 리턴값 재정의
// workspace 만
export function getCurrentWorkspace() {
  const currWs = webconsolejs["common/storage/sessionstorage"].getSessionCurrentWorkspace()

  console.log("currWs ", currWs)
  return currWs
}

export function setCurrentWorkspace(workspace) {
  webconsolejs["common/storage/sessionstorage"].setSessionCurrentWorkspace(workspace)
}

export function getCurrentProject() {
  return webconsolejs["common/storage/sessionstorage"].getSessionCurrentProject()
}

export function setCurrentProject(project) {
  webconsolejs["common/storage/sessionstorage"].setSessionCurrentProject(project)
}

// 세션에서 workspace project 목록 찾기
function getWorkspaceProjectList() {
  webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceProjectList();
}

// 세션에 workspace project 목록 저장
function setWorkspaceProjectList(workspaceProjectList) {
  webconsolejs["common/storage/sessionstorage"].setSessionWorkspaceProjectList(workspaceProjectList)
}

// user의 workspace 목록만 추출
export function getUserWorkspaceList() {
  return webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceList()
}

export async function getUserProjectList(workspaceId) {
  var projectList = await webconsolejs["common/storage/sessionstorage"].getSessionProjectList(workspaceId)
  console.log("getUserProjectList ", projectList)
  return projectList
}

/////////////////////////////////////

// 유저의 workspace 목록 조회
async function getWorkspaceProjectListByUser() {
  var currentUserId = document.getElementById("userid").value
  console.log("currentUserId",currentUserId)
  var data = {
    pathParams: {
      userId: currentUserId,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost('/api/Getworkspaceuserrolemappinglistbyuserid', data)
  return response.data.responseData
}

///////////////////////////////////////
// 로그인 유저의 workspace 목록 조회
export async function getWorkspaceListByUser() {
  var workspaceList = [];
  // 세션에서 찾기
  let userWorkspaceList = await webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceProjectList();

  if (userWorkspaceList == null) {// 없으면 조회
    console.log("not saved. get ")
    var userWorkspaceProjectList = await getWorkspaceProjectListByUser()// workspace 목록, project 목록 조회
    setWorkspaceProjectList(userWorkspaceProjectList)

    // workspaceProjectList에서 workspace 목록만 추출
    const jsonData = JSON.parse(userWorkspaceProjectList);
    //console.log(jsonData)
    jsonData.forEach(item => {
      //console.log(item)
      workspaceList.push(item.workspaceProject.workspace);
    });

    // 새로 조회한 경우 저장된 curworkspace, curproject 는 초기화 할까?
    setCurrentWorkspace("")
    setCurrentProject("")
  } else {
    const jsonData = JSON.parse(userWorkspaceList);
    //console.log(jsonData)
    jsonData.forEach(item => {
      //console.log(item)
      workspaceList.push(item.workspaceProject.workspace);
    });
  }

  return workspaceList;
}

// workspace에 매핑된 project목록 조회
export async function getProjectListByWorkspaceId(workspaceId) {
  console.debug("getProjectListByWorkspaceId", workspaceId)
  let userId = document.getElementById("userid").value
  let requestObject = {
    "pathParams": {
      "workspaceId": workspaceId
    },
    "requestData": {
      "userId": userId,
    }
  }

  let projectList = [];
  const response = await webconsolejs["common/api/http"].commonAPIPost('/api/GetWPmappingListByWorkspaceId', requestObject)
  let data = response.data.responseData.projects
  console.debug("GetWPmappingListByWorkspaceId data :", data)
  data.forEach(item => {
    console.debug(item)
    projectList.push(item);
  });

  return projectList;
}

export function getUserWorkspaceProjectList() {
  return webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceProjectList()
}

export function setUserWorkspaceProjectList(workspaceProjectList) {
  webconsolejs["common/storage/sessionstorage"].setSessionWorkspaceProjectList(workspaceProjectList)
}

// workspace project List
export function getCurrentWorkspaceProjectList() {
  return webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceProjectList()
}

export function setCurrentWorkspaceProjectList(v) {
  webconsolejs["common/storage/sessionstorage"].setSessionWorkspaceProjectList(v)
}

export function clearCurrentWorkspaceProject() {
  webconsolejs["common/storage/sessionstorage"].clearSessionCurrentWorkspaceProject()
}


/////////////////////// component util //////////////////////////
// workspaceList select에 set.
//function updateWsSelectBox(workspaceList) {

// navbar에 있는 workspace select 에 workspace 목록 set
// 만약 curworkspaceid가 있으면 selected 하도록
// session에서 꺼내쓰려고 했으나 그냥 param으로 받는게 함.
export function setWorkspaceSelectBox(workspaceList, curWorkspaceId) {
  let workspaceListselectBox = document.getElementById("select-current-workspace");

  while (workspaceListselectBox.options.length > 0) {
    workspaceListselectBox.remove(0);
  }
  var workspaceExists = false

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

// navbar에 있는 project select 에 project 목록 set
// 만약 curprojectid가 있으면 selected 하도록
// session에서 꺼내쓰려고 했으나 그냥 param으로 받는게 함.
export function setPrjSelectBox(projectList, curProjectId) {
  // function updatePrjSelectBox(workspaceId) {

  let projectListselectBox = document.getElementById("select-current-project");

  console.log("setPrjSelectBox projectList ", projectList)
  while (projectListselectBox.options.length > 0) {
    projectListselectBox.remove(0);
  }

  const defaultOpt = document.createElement("option");
  defaultOpt.value = ""
  defaultOpt.textContent = "Please select a project";
  projectListselectBox.appendChild(defaultOpt);

  for (const p in projectList) {
    console.log("p ", p)
    const opt = document.createElement("option");
    opt.value = projectList[p].id;
    opt.textContent = projectList[p].name;
    projectListselectBox.appendChild(opt);

    if (curProjectId != undefined && curProjectId != "" && projectList[p].id == curProjectId) {
      opt.setAttribute("selected", "selected");
    }
  }
}
