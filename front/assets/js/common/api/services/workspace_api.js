

// default workspace에서 sessionstorage를 사용하지 않을때, 아래에서 리턴값 재정의
// workspace 만
export function getCurrentWorkspace() {
  const currWs = webconsolejs["common/storage/sessionstorage"].getSessionCurrentWorkspace()
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
async function getWorkspaceProjectListByUserToken() {
  const response = await webconsolejs["common/api/http"].commonAPIPost('/api/getworkspaceuserrolemappingbytoken')
  return response.data.responseData
}

///////////////////////////////////////
export async function getWorkspaceListByUser() {
  var workspaceList = [];
  // 세션에서 찾기
  let userWorkspaceList = await webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceProjectList();

  if (userWorkspaceList == null) {// 없으면 조회
    console.log("not saved. get ")
    var userWorkspaceProjectList = await getWorkspaceProjectListByUserToken()// workspace 목록, project 목록 조회
    setWorkspaceProjectList(userWorkspaceProjectList)
    console.log("userWorkspaceProjectList", userWorkspaceProjectList)
    userWorkspaceProjectList.forEach(item => {
      workspaceList.push(item.workspaceProject.workspace);
    });

    // 새로 조회한 경우 저장된 curworkspace, curproject 는 초기화 할까?
    setCurrentWorkspace("")
    setCurrentProject("")
  } else {
    userWorkspaceList.forEach(item => {
      workspaceList.push(item.workspaceProject.workspace);
    });
  }

  return workspaceList;
}

// workspace에 매핑된 project목록 조회
export async function getProjectListByWorkspaceId(workspaceId) {
  console.debug("getProjectListByWorkspaceId", workspaceId)
  // let userId = document.getElementById("userid").value
  let requestObject = {
    "pathParams": {
      "workspaceId": workspaceId
    }
  }

  let projectList = [];
  const response = await webconsolejs["common/api/http"].commonAPIPost('/api/mc-iam-manager/getwpmappinglistbyworkspaceid', requestObject)
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

// handle workspace

export async function createWorkspace(name, description){
  const controller = '/api/mc-iam-manager/CreateWorkspace'
  var data = {
    request: {
      "name": name,
      "description": description
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data, null)
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

export async function getAllWorksaceList(){
  const controller = '/api/mc-iam-manager/GetWorkspaceList'
  const response = await webconsolejs["common/api/http"].commonAPIPost(controller, null, null)
  return response.data.responseData
}

export async function getWorkspaceById(wsId){
  const controller = '/api/mc-iam-manager/GetWorkspaceById'
  var data = {
    pathParams: {
      workspaceId: wsId,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  return response.data.responseData
}

export async function updateWorkspaceById(wsId, desc){
  const controller = '/api/mc-iam-manager/UpdateWorkspaceById'
  var data = {
    request: {
      description: desc,
    },
    pathParams: {
      workspaceId: wsId,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  return response.data.responseData
}

export async function deleteWorkspaceById(wsId){
  const controller = '/api/mc-iam-manager/DeleteWorkspaceById'
  var data = {
    pathParams: {
      "workspaceId": wsId
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data, null)
  return response.data.responseData
}

// handle project

export async function createProject(prjName, prjDesc){
  const controller = '/api/mc-iam-manager/CreateProject'
  var data = {
    request: {
      "name": prjName,
      "description": prjDesc
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(controller,data,null)
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

export async function getProjectList(){
  const controller = '/api/mc-iam-manager/GetProjectList'
  const response = await webconsolejs["common/api/http"].commonAPIPost(controller,null,null)
  return response.data.responseData
}

// handle users

export async function getUsers(){
  const controller = '/api/mc-iam-manager/getusers'
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    null,
    null
  )
  return response.data.responseData
}

export async function getUsersById(userId){
  const controller = '/api/mc-iam-manager/getusers'
  var data = {
    queryParams: {
      userid: userId,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    null
  )
  return response.data.responseData
}

// handle roles
export async function createRole(roleName, roleDescription){
  const controller = '/api/mc-iam-manager/CreateRole'
  var data = {
    request: {
      name: roleName,
      description: roleDescription
      // platformRole: "true"
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    null
  )
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

export async function getRoleList(){
  const controller = '/api/mc-iam-manager/GetRoleList'
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    null,
    null
  )
  return response.data.responseData
}

export async function deleteRoleById(reqRoleId){
  const controller = '/api/mc-iam-manager/DeleteRoleById'
  var data = {
    pathParams: {
      roleId: reqRoleId,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    null
  )
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

// handle permissions
export async function getPermissions(){
  const controller = '/api/mc-iam-manager/GetPermissions'
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    null,
    null
  )
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

export async function getdependentPermissionsByPolicyId(reqPolicyid){
  const controller = '/api/mc-iam-manager/GetdependentPermissionsByPolicyId'
  var data = {
    pathParams: {
      policyid: reqPolicyid,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    null
  )
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

export async function appendResourcePermissionPolicesByOperationId(reqFramework,reqOperationid,reqDesc,reqRoleArr){
  const controller = '/api/mc-iam-manager/AppendResourcePermissionPolicesByOperationId'
  var data = {
    pathParams: {
      framework: reqFramework,
      operationid: reqOperationid,
    },
    request:{
      desc:reqDesc,
      role:reqRoleArr,
    }
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    null
  )
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

export async function deleteResourcePermissionPolicesByOperationId(reqFramework,reqOperationid,reqDesc,reqRoleArr){
  const controller = '/api/mc-iam-manager/DeleteResourcePermissionPolicesByOperationId'
  var data = {
    pathParams: {
      framework: reqFramework,
      operationid: reqOperationid,
    },
    request:{
      desc:reqDesc,
      role:reqRoleArr,
    }
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    null
  )
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

// handle workspace user role mapping

export async function createWorkspaceUserRoleMappingByName(wsId, reqRoleID, UserID){
  const controller = '/api/mc-iam-manager/CreateWorkspaceUserRoleMappingByName'
  var data = {
    request:{
      workspaceId:wsId,
      roleId:reqRoleID,
      userId:UserID,
    }
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    null
  )
  return response.data.responseData
}

export async function getWorkspaceUserRoleMappingListOrderbyWorkspace(wsId){
  const controller = '/api/mc-iam-manager/GetWorkspaceUserRoleMappingListOrderbyWorkspace'
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    null
  )
  return response.data.responseData
}

export async function getWorkspaceUserRoleMappingListByWorkspaceId(wsId){
  const controller = '/api/mc-iam-manager/GetWorkspaceUserRoleMappingListByWorkspaceId'
  var data = {
    pathParams: {
      workspaceId: wsId,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  return response.data.responseData
}

export async function deleteWorkspaceUserRoleMapping(wsId,requserId){
  const controller = '/api/mc-iam-manager/DeleteWorkspaceUserRoleMapping'
  var data = {
    pathParams: {
      workspaceId: wsId,
      userId: requserId,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  return response.data.responseData
}

// handle workspace projects mapping

export async function createWPmapping(worskspaceId, projectsArr){
  const controller = '/api/mc-iam-manager/CreateWPmapping'
  var data = {
    request: {
      "workspaceId": worskspaceId,
      "projectIds": projectsArr
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(controller, data, null)
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

export async function updateWPmappings(wsId, projectsIdsArr){
  const controller = '/api/mc-iam-manager/UpdateWPmappings'
  var data = {
    request: {
      workspaceId: wsId,
      projectIds: projectsIdsArr,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

export async function deleteWorkspaceProjectMappingById(wsId, projectsId){
  const controller = '/api/mc-iam-manager/DeleteWorkspaceProjectMappingById'
  var data = {
    pathParams: {
      workspaceId: wsId,
      projectId: projectsId,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  try{
    return { success: true, message: response.data.responseData };
  } catch(error){
    console.log(error)
    return { success: false, message: response.response.data.responseData };
  }
}

export async function getWPmappingListByWorkspaceId(wsId){
  const controller = '/api/mc-iam-manager/GetWPmappingListByWorkspaceId'
  var data = {
    pathParams: {
      workspaceId: wsId,
    },
  };
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  return response.data.responseData
}

export async function getWPmappingListOrderbyWorkspace(){
  const controller = '/api/mc-iam-manager/GetWPmappingListOrderbyWorkspace'
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    null
  )
  return response.data.responseData
}


