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
//   webconsolejs["common/api/services/mci_api"].getMciList(curWorkspaceProject.nsId);
//   //getMciList();
// })

// var totalMciListObj = new Object();
// var totalMciStatusMap = new Map();
// var totalVmStatusMap = new Map();
// var nsid = ""

// //document.addEventListener("DOMContentLoaded", initMciMngPage);

// // 모든 Page(화면)에서 1개의 initPage()를 만든다.
// // 이유는 project변경 시 화면 재구성이 필요한 경우가 있기 때문
// async function initMciMngPage() {
//   console.log("initMciMngPage")

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

//     // curWorkspace cur project가 모두 선택되어 있으면 mciList 조회
//     if (curProjectId != undefined && curProjectId != "") {
//       getMciList();
//     }
//     // var namespace = webconsolejs["common/api/services/workspace_api"].getCurrentProject()
//   }
// }

// // project(namespace)를 받아와 MciList 호출
// async function getMciList() {
//   console.log("getMciList")
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
//   //var controller = "targetController=getmcilist"
//   var controller = "/api/" + "getmcilist";
//   const response = await webconsolejs["common/api/http"].commonAPIPost(
//     controller,
//     data
//   )

//   // if (response.response.data.status.code != 200 && response.response.data.status.code != 201) {
//   //   alert(response.response.data.responseData.message)
//   // } else {
//   var mciList = response.data.responseData;
//   console.log("mciList : ", mciList);

//   // MciList 호출 성공 시
//   getMciListCallbackSuccess(nsid, mciList);
//   // }
// }
// // MCIS 목록 조회 후 화면에 Set


// // Mci 목록 조회 성공시 호출하는 function
// function getMciListCallbackSuccess(caller, mciList) {
//   console.log("getMciListCallbackSuccess");

//   totalMciListObj = mciList.mci;
  

//   setToTalMciStatus(); // mci상태 표시
//   setTotalVmStatus(); // mci 의 vm들 상태표시
//   //     setTotalConnection();// Mci의 provider별 connection 표시를 위해 필요

// }

// // 화면 표시용 mci status set 화면표시는 display function에서
// function setToTalMciStatus() {
//   console.log("setToTalMciStatus");
//   try {
//     for (var mciIndex in totalMciListObj) {
//       var aMci = totalMciListObj[mciIndex];

//       var aMciStatusCountMap = webconsolejs["common/api/services/mci_api"].calculateMciStatusCount(aMci);
//       console.log("aMci.id : ", aMci.id);
//       console.log("mciStatusMap ::: ", aMciStatusCountMap);
//       totalMciStatusMap.set(aMci.id, aMciStatusCountMap);
//     }
//   } catch (e) {
//     console.log("mci status error", e);
//   }
//   displayMciStatusArea();
// }

// // Mci 목록에서 vmStatus만 처리 : 화면표시는 display function에서
// function setTotalVmStatus() {
//   try {
//     for (var mciIndex in totalMciListObj) {
//       var aMci = totalMciListObj[mciIndex];
//       console.log("aMci : ", aMci);
//       var vmStatusCountMap = webconsolejs["common/api/services/mci_api"].calculateVmStatusCount(aMci);
//       totalVmStatusMap.set(aMci.id, vmStatusCountMap);
//     }
//   } catch (e) {
//     console.log("mci status error");
//   }
//   displayVmStatusArea();
// }

// // mci 상태 별 상태 표시
// function displayMciStatusArea() {
//   console.log("displayMciStatusArea");
//   var sumMciCnt = 0;
//   var sumMciRunningCnt = 0;
//   var sumMciStopCnt = 0;
//   var sumMciTerminateCnt = 0;
//   totalMciStatusMap.forEach((value, key) => {
//     var statusRunning = value.get("running");
//     var statusStop = value.get("stop");
//     var statusTerminate = value.get("terminate");
//     sumMciRunningCnt += statusRunning;
//     sumMciStopCnt += statusStop;
//     sumMciTerminateCnt += statusTerminate;
//     console.log("totalMciStatusMap :: ", key, value);
//   });
//   sumMciCnt = sumMciRunningCnt + sumMciStopCnt + sumMciTerminateCnt;

//   $("#total_mci").text(sumMciCnt);
//   $("#mci_status_running").text(sumMciRunningCnt);
//   $("#mci_status_stopped").text(sumMciStopCnt);
//   $("#mci_status_terminated").text(sumMciTerminateCnt);
//   console.log("displayMciStatusArea ");
//   console.log("running status count ", $("#mci_status_running").text());
// }

// // 해당 mci에서 상태값들을 count : 1개 mci의 상태는 1개만 있으므로 running, stop, terminate 중 1개만 1, 나머지는 0
// // dashboard, mci 에서 사용
// function calculateMciStatusCount(mciData) {

//   console.log("calculateMciStatusCount");
//   console.log("mciData : ", mciData);
//   var mciStatusCountMap = new Map();
//   mciStatusCountMap.set("running", 0);
//   mciStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
//   mciStatusCountMap.set("terminate", 0);
//   try {
//     var mciStatus = mciData.status;
//     var mciDispStatus = webconsolejs["common/api/services/mci_api"].getMciStatusFormatter(mciStatus); // 화면 표시용 status

//     if (mciStatus != "") {
//       // mci status 가 없는 경우는 skip
//       if (mciStatusCountMap.has(mciDispStatus)) {
//         mciStatusCountMap.set(
//           mciDispStatus,
//           mciStatusCountMap.get(mciDispStatus) + 1
//         );
//       }
//     }
//   } catch (e) {
//     console.log("mci status error", e);
//   }

//   return mciStatusCountMap;
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
