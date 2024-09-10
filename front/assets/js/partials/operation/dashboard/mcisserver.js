// console.log("mcicserver.js");


// // navBar에 있는 object인데 직접 handling( onchange)
// // $("#select-current-workspace").on('change', async function () {  
// //   webconsolejs["partials/layout/navbar"].setPrjSelectBox(this.value);  
// // })

// // navBar에 있는 object인데 직접 handling( onchange)
// let projectListselectBox = document.getElementById("select-current-project");
// projectListselectBox.addEventListener('change',async function () {
// //$("#select-current-project").on('change', async function () {
//   console.log("project change")
//   var curWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
//   console.log("workspaceIdProjectId = ", curWorkspaceProject)
//   webconsolejs["common/api/services/mcis_api"].getMcisList(curWorkspaceProject.nsId);
//   //getMcisList();
// })

// var totalMcisListObj = new Object();
// var totalMcisStatusMap = new Map();
// var totalVmStatusMap = new Map();
// var nsid = ""

// //document.addEventListener("DOMContentLoaded", initMcisMngPage);

// // 모든 Page(화면)에서 1개의 initPage()를 만든다.
// // 이유는 project변경 시 화면 재구성이 필요한 경우가 있기 때문
// async function initMcisMngPage() {
//   console.log("initMcisMngPage")

//   let userWorkspaceList = await webconsolejs["common/api/services/workspace_api"].getWorkspaceListByUser()
//   console.log("user wslist ", userWorkspaceList)

//   let curWorkspace = await webconsolejs["common/api/services/workspace_api"].getCurrentWorkspace()
//   let curWorkspaceId = "";
//   //let curWorkspaceName = "";
//   if (curWorkspace) {
//     curWorkspaceId = curWorkspace.Id;
//     //curWorkspaceName = curWorkspace.Name;
//   }

//   webconsolejs["common/util"].setWorkspaceSelectBox(userWorkspaceList, curWorkspaceId)


//   // workspace, project 가 먼저 설정되어 있어야 한다.
//   //console.log("get workspace from session " , webconsolejs["common/api/services/workspace_api"].getCurrentWorkspace())
//   console.log("curWorkspaceId", curWorkspaceId)
//   if (curWorkspaceId == "" || curWorkspaceId == undefined) {
//     console.log(" curWorkspaceId is not set ")
//     //alert("workspace 먼저 선택하시오");
//     //return;
//   } else {
//     // workspace가 선택되어 있으면 project 목록도 표시
//     let userProjectList = await webconsolejs["common/util"].getUserProjectList(curWorkspaceId)
//     console.log("userProjectList ", userProjectList)

//     // project 목록이 있으면 cur project set
//     let curProjectId = await webconsolejs["common/api/services/workspace_api"].getCurrentProject()?.Id
//     console.log("curProjectId", curProjectId)

//     webconsolejs["common/util"].setPrjSelectBox(userProjectList, curProjectId)

//     // curWorkspace cur project가 모두 선택되어 있으면 mcisList 조회
//     if (curProjectId != undefined && curProjectId != "") {
//       getMcisList();
//     }
//     // var namespace = webconsolejs["common/api/services/workspace_api"].getCurrentProject()
//   }
// }

// // project(namespace)를 받아와 McisList 호출
// async function getMcisList() {
//   console.log("getMcisList")
//   var projectId = $("#select-current-project").val()
//   var projectName = $('#select-current-project').find('option:selected').text();

//   console.log("projectId", projectId)
//   console.log("projectName", projectName)
//   nsid = projectName

//   var data = {
//     pathParams: {
//       nsId: nsid,
//     },
//   };
//   //var controller = "targetController=getmcislist"
//   var controller = "/api/" + "getmcislist";
//   const response = await webconsolejs["common/api/http"].commonAPIPost(
//     controller,
//     data
//   )

//   // if (response.response.data.status.code != 200 && response.response.data.status.code != 201) {
//   //   alert(response.response.data.responseData.message)
//   // } else {
//   var mcisList = response.data.responseData;
//   console.log("mcisList : ", mcisList);

//   // McisList 호출 성공 시
//   getMcisListCallbackSuccess(nsid, mcisList);
//   // }
// }
// // MCIS 목록 조회 후 화면에 Set


// // Mcis 목록 조회 성공시 호출하는 function
// function getMcisListCallbackSuccess(caller, mcisList) {
//   console.log("getMcisListCallbackSuccess");

//   totalMcisListObj = mcisList.mcis;
  

//   setToTalMcisStatus(); // mcis상태 표시
//   setTotalVmStatus(); // mcis 의 vm들 상태표시
//   //     setTotalConnection();// Mcis의 provider별 connection 표시를 위해 필요

// }

// // 화면 표시용 mcis status set 화면표시는 display function에서
// function setToTalMcisStatus() {
//   console.log("setToTalMcisStatus");
//   try {
//     for (var mcisIndex in totalMcisListObj) {
//       var aMcis = totalMcisListObj[mcisIndex];

//       var aMcisStatusCountMap = webconsolejs["common/api/services/mcis_api"].calculateMcisStatusCount(aMcis);
//       console.log("aMcis.id : ", aMcis.id);
//       console.log("mcisStatusMap ::: ", aMcisStatusCountMap);
//       totalMcisStatusMap.set(aMcis.id, aMcisStatusCountMap);
//     }
//   } catch (e) {
//     console.log("mcis status error", e);
//   }
//   displayMcisStatusArea();
// }

// // Mcis 목록에서 vmStatus만 처리 : 화면표시는 display function에서
// function setTotalVmStatus() {
//   try {
//     for (var mcisIndex in totalMcisListObj) {
//       var aMcis = totalMcisListObj[mcisIndex];
//       console.log("aMcis : ", aMcis);
//       var vmStatusCountMap = webconsolejs["common/api/services/mcis_api"].calculateVmStatusCount(aMcis);
//       totalVmStatusMap.set(aMcis.id, vmStatusCountMap);
//     }
//   } catch (e) {
//     console.log("mcis status error");
//   }
//   displayVmStatusArea();
// }

// // mcis 상태 별 상태 표시
// function displayMcisStatusArea() {
//   console.log("displayMcisStatusArea");
//   var sumMcisCnt = 0;
//   var sumMcisRunningCnt = 0;
//   var sumMcisStopCnt = 0;
//   var sumMcisTerminateCnt = 0;
//   totalMcisStatusMap.forEach((value, key) => {
//     var statusRunning = value.get("running");
//     var statusStop = value.get("stop");
//     var statusTerminate = value.get("terminate");
//     sumMcisRunningCnt += statusRunning;
//     sumMcisStopCnt += statusStop;
//     sumMcisTerminateCnt += statusTerminate;
//     console.log("totalMcisStatusMap :: ", key, value);
//   });
//   sumMcisCnt = sumMcisRunningCnt + sumMcisStopCnt + sumMcisTerminateCnt;

//   $("#total_mcis").text(sumMcisCnt);
//   $("#mcis_status_running").text(sumMcisRunningCnt);
//   $("#mcis_status_stopped").text(sumMcisStopCnt);
//   $("#mcis_status_terminated").text(sumMcisTerminateCnt);
//   console.log("displayMcisStatusArea ");
//   console.log("running status count ", $("#mcis_status_running").text());
// }

// // 해당 mcis에서 상태값들을 count : 1개 mcis의 상태는 1개만 있으므로 running, stop, terminate 중 1개만 1, 나머지는 0
// // dashboard, mcis 에서 사용
// function calculateMcisStatusCount(mcisData) {

//   console.log("calculateMcisStatusCount");
//   console.log("mcisData : ", mcisData);
//   var mcisStatusCountMap = new Map();
//   mcisStatusCountMap.set("running", 0);
//   mcisStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
//   mcisStatusCountMap.set("terminate", 0);
//   try {
//     var mcisStatus = mcisData.status;
//     var mcisDispStatus = webconsolejs["common/api/services/mcis_api"].getMcisStatusFormatter(mcisStatus); // 화면 표시용 status

//     if (mcisStatus != "") {
//       // mcis status 가 없는 경우는 skip
//       if (mcisStatusCountMap.has(mcisDispStatus)) {
//         mcisStatusCountMap.set(
//           mcisDispStatus,
//           mcisStatusCountMap.get(mcisDispStatus) + 1
//         );
//       }
//     }
//   } catch (e) {
//     console.log("mcis status error", e);
//   }

//   return mcisStatusCountMap;
// }


// // vm 화면 표시
// function displayVmStatusArea() {
//   var sumVmCnt = 0;
//   var sumVmRunningCnt = 0;
//   var sumVmStopCnt = 0;
//   var sumVmTerminateCnt = 0;
//   totalVmStatusMap.forEach((value, key) => {
//     var statusRunning = value.get("running");
//     var statusStop = value.get("stop");
//     var statusTerminate = value.get("terminate");
//     sumVmRunningCnt += statusRunning;
//     sumVmStopCnt += statusStop;
//     sumVmTerminateCnt += statusTerminate;
//   });
//   sumVmCnt = sumVmRunningCnt + sumVmStopCnt + sumVmTerminateCnt;
//   $("#total_vm").text(sumVmCnt);
//   $("#vm_status_running").text(sumVmRunningCnt);
//   $("#vm_status_stopped").text(sumVmStopCnt);
//   $("#vm_status_terminated").text(sumVmTerminateCnt);
// }
