import { TabulatorFull as Tabulator } from "tabulator-tables";

export function setTabulator(
  tableObjId,
  tableObjParamMap,
  columnsParams,
  isMultiSelect
) {
  var placeholder = "No Data";
  var pagination = "local";
  var paginationSize = 5;
  var paginationSizeSelector = [5, 10, 15, 20];
  var movableColumns = true;
  var columnHeaderVertAlign = "middle";
  var paginationCounter = "rows";
  var layout = "fitColumns";

  if (tableObjParamMap.hasOwnProperty("placeholder")) {
    placeholder = tableObjParamMap.placeholder;
  }

  if (tableObjParamMap.hasOwnProperty("pagination")) {
    pagination = tableObjParamMap.pagination;
  }

  if (tableObjParamMap.hasOwnProperty("paginationSize")) {
    paginationSize = tableObjParamMap.paginationSize;
  }

  if (tableObjParamMap.hasOwnProperty("paginationSizeSelector")) {
    paginationSizeSelector = tableObjParamMap.paginationSizeSelector;
  }

  if (tableObjParamMap.hasOwnProperty("movableColumns")) {
    movableColumns = tableObjParamMap.movableColumns;
  }

  if (tableObjParamMap.hasOwnProperty("columnHeaderVertAlign")) {
    columnHeaderVertAlign = tableObjParamMap.columnHeaderVertAlign;
  }

  if (tableObjParamMap.hasOwnProperty("paginationCounter")) {
    paginationCounter = tableObjParamMap.paginationCounter;
  }

  if (tableObjParamMap.hasOwnProperty("layout")) {
    layout = tableObjParamMap.layout;
  }

  var tabulatorTable = new Tabulator("#" + tableObjId, {
    //ajaxURL:"http://localhost:3000/operations/mcismng?option=status",
    placeholder,
    pagination,
    paginationSize,
    paginationSizeSelector,
    movableColumns,
    columnHeaderVertAlign,
    paginationCounter,
    layout,
    columns: columnsParams,
    selectable: isMultiSelect == false ? 1 : true,
  });

  return tabulatorTable;
}


// 화면이동 
export function changePage(target, urlParamMap){
  var url = "";
  // target에 따라 url을 달리한다.
  if( target == "McisMng"){
    url = "/webconsole/operation/manage/mcis"
  }
  
  // pathParam을 뒤에 붙인다.
  var keyIndex = 0;
  for (let key of urlParamMap.keys()) {
    console.log("urlParamMap " + key + " : " + urlParamMap.get(key));
    
    var urlParamValue = urlParamMap.get(key)

    if( keyIndex == 0 ) {
      url += "?" + key + "="  + urlParamValue;
    }else{
      url += "&" + key + "="  + urlParamValue;
    }
    
  }

  // 해당 화면으로 이동한다.
  location.href = url;
}

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
function getWorkspaceProjectList(){  
  webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceProjectList();
}

// 세션에 workspace project 목록 저장
function setWorkspaceProjectList(workspaceProjectList){
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
    const response = await webconsolejs["common/api/http"].commonAPIPost('/api/getworkspacebyuserid', null)    
    return response.data.responseData
}


///////////////////////////////////////
// 로그인 유저의 workspace 목록 조회
export async function getWorkspaceListByUser() {
  var workspaceList = [];
  // 세션에서 찾기
  let userWorkspaceList = await webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceProjectList();  
  
  if (userWorkspaceList == null ){// 없으면 조회
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
  }else{
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
  
  console.log("getProjectListByWorkspaceId", workspaceId)
  let requestObject = {
      "pathParams": {
        "workspaceId": workspaceId
      },
      "requestData":{
          "userId":"mciamuser", // TODO : 실제 로그인 user의 id 설정하도록 변경할 것.          
      }
  }

  var projectList = [];
  const response = await webconsolejs["common/api/http"].commonAPIPost('/api/projectlistbyworkspaceid',requestObject)
  console.log(response)
  var data = response.data.responseData.projects
  data.forEach(item => {
    console.log(item)
    projectList.push(item);
  });

  // project List
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


// TODO : 적절한 경로로 이동시킬 것.
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
    //console.log("get workspace from session " , webconsolejs["common/util"].getCurrentWorkspace())
    //let curWorkspaceId = await webconsolejs["common/util"].getCurrentWorkspace()?.Id

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

    //let projectList = await webconsolejs["common/util"].getProjectListByWorkspaceId(workspaceId)
    console.log("setPrjSelectBox projectList ", projectList)
    while (projectListselectBox.options.length > 0) {
        projectListselectBox.remove(0);        
    }

    const defaultOpt = document.createElement("option");
    defaultOpt.value = ""
    defaultOpt.textContent = "Please select a project";
    projectListselectBox.appendChild(defaultOpt);

    //let curProjectId = webconsolejs["common/util"].getCurrentProject()?.Id
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


///////////////////////

function isEmpty(str) {
    if (typeof str == "undefined" || str == null || str == "")
        return true;
    else
        return false;
}

// export function setTabulator(
//     tableObjId,
//     tableObjParamMap,
//     columnsParams,
//     isMultiSelect
//   ) {
//     var placeholder = "No Data";
//     var pagination = "local";
//     var paginationSize = 5;
//     var paginationSizeSelector = [5, 10, 15, 20];
//     var movableColumns = true;
//     var columnHeaderVertAlign = "middle";
//     var paginationCounter = "rows";
//     var layout = "fitColumns";
  
//     if (tableObjParamMap.hasOwnProperty("placeholder")) {
//       placeholder = tableObjParamMap.placeholder;
//     }
  
//     if (tableObjParamMap.hasOwnProperty("pagination")) {
//       pagination = tableObjParamMap.pagination;
//     }
  
//     if (tableObjParamMap.hasOwnProperty("paginationSize")) {
//       paginationSize = tableObjParamMap.paginationSize;
//     }
  
//     if (tableObjParamMap.hasOwnProperty("paginationSizeSelector")) {
//       paginationSizeSelector = tableObjParamMap.paginationSizeSelector;
//     }
  
//     if (tableObjParamMap.hasOwnProperty("movableColumns")) {
//       movableColumns = tableObjParamMap.movableColumns;
//     }
  
//     if (tableObjParamMap.hasOwnProperty("columnHeaderVertAlign")) {
//       columnHeaderVertAlign = tableObjParamMap.columnHeaderVertAlign;
//     }
  
//     if (tableObjParamMap.hasOwnProperty("paginationCounter")) {
//       paginationCounter = tableObjParamMap.paginationCounter;
//     }
  
//     if (tableObjParamMap.hasOwnProperty("layout")) {
//       layout = tableObjParamMap.layout;
//     }
  
//     var tabulatorTable = new Tabulator("#" + tableObjId, {
//       //ajaxURL:"http://localhost:3000/operations/mcismng?option=status",
//       placeholder,
//       pagination,
//       paginationSize,
//       paginationSizeSelector,
//       movableColumns,
//       columnHeaderVertAlign,
//       paginationCounter,
//       layout,
//       columns: columnsParams,
//       selectable: isMultiSelect == false ? 1 : true,
//     });
  
//     return tabulatorTable;
// }

// column show & hide
export function displayColumn(table) {
	$(".display-column").on("click", function () {
	  if ($(this).children("input:checkbox").is(":checked")) {
		$(this).children(".material-icons").text("visibility");
		table.showColumn($(this).data("column"));
	  } else {
		$(this).children(".material-icons").text("visibility_off");
		table.hideColumn($(this).data("column"));
	  }
	});
}

// mcis내 vm들의 provider별 connection count
export function calculateConnectionCount(vmList) {

// console.log("calculateConnectionCount")
// console.log(vmList)
var vmCloudConnectionCountMap = new Map();

for (var vmIndex in vmList) {
	var aVm = vmList[vmIndex];
    var location = aVm.connectionConfig;
    if (!isEmpty(location)) {
		
        var cloudType = location.providerName;
	if (vmCloudConnectionCountMap.has(cloudType)) {
        
		vmCloudConnectionCountMap.set(
		cloudType,
		vmCloudConnectionCountMap.get(cloudType) + 1
		);
	} else {
		vmCloudConnectionCountMap.set(cloudType, 0);
	}
	}
}

return vmCloudConnectionCountMap;
}

// 공통으로 사용하는 data 조회 function : 목록(list), 단건(data) 동일
// optionParamMap.set("is_cb", "N");// db를 조회하는 경우 'N', cloud-barista를 직접호출하면 is_cb='Y'. 기본은 is_cb=Y
// filter 할 조건이 있으면 filterKey="connectionName", filterVal="conn-xxx" 등으로 optionParam에 추가하면 됨.
// optionParamMap.set("option", "id");// 결과를 id만 가져오는 경우는 option="id"를 추가 한다.
// buffalo의 helperName으로 router를 찾도록 변경함.
//export function getCommonData(caller, controllerKeyName, optionParamMap, callbackSuccessFunction, callbackFailFunction){
export function getCommonData(
        caller,
        helperName,
        optionParamMap,
        callbackSuccessFunction,
        callbackFailFunction
      ) {
        //var url = getURL(controllerKeyName, optionParamMap);
        var url = getURL(helperName, optionParamMap);
      
        axios
          .get(url, {
            headers: {
              "Content-Type": "application/json",
            },
          })
          .then((result) => {
            console.log(result);
            if (
              callbackSuccessFunction == undefined ||
              callbackSuccessFunction == ""
            ) {
              var data = result.data;
              console.log("callbackSuccessFunction undefined get data : ", data);
            } else {
              callbackSuccessFunction(caller, result);
            }
          })
          .catch((error) => {
            console.warn(error);
            if (callbackFailFunction == undefined || callbackFailFunction == "") {
              mcpjs["util/util"].commonAlert(error);
            } else {
              callbackFailFunction(caller, error);
            }
          });
}