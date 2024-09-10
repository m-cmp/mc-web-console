document.addEventListener("DOMContentLoaded", initDashboardNs);

var totalMcisListObj = new Object();
var totalMcisStatusMap = new Map();
var totalVmStatusMap = new Map();

async function initDashboardNs() {

  ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
  var curWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
  console.log("workspaceIdProjectId = ", curWorkspaceProject)

  // workspace selection check
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(curWorkspaceProject)

  ////////////////////// partials init functions///////////////////////////////////////
  try {
    webconsolejs["partials/operation/dashboard/mcis_dashboard"].initMcisDashboard(webconsolejs["pages/operation/dashboard/ns"].callbackStatusChanged, curWorkspaceProject);
  } catch (e) {
    console.log(e);
  }

}

// partial에서 변경내용을 page로 알려줄 때,
export function callbackStatusChanged(caller, respData) {
  console.log("=== callback from ", caller);
  console.log("=== respData ", respData);
  
  if (caller == "mcischanged") {// mcis 목록 조회 뒤 status 표시를 위해 호출함

    totalMcisListObj.totalMcisStatusMap = respData.totalMcisStatusMap;
    totalMcisListObj.totalVmStatusMap = respData.totalVmStatusMap;

    webconsolejs["partials/operation/manage/mcisserver_summary"].initMcisServerSummary(null, totalMcisListObj);
  }
}

function calculateMcisStatusCount(mcisData) {
  console.log("calculateMcisStatusCount");

  console.log("mcisData : ", mcisData);
  var mcisStatusCountMap = new Map();
  mcisStatusCountMap.set("running", 0);
  mcisStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  mcisStatusCountMap.set("terminate", 0);
  try {
    var mcisStatus = mcisData.status;
    var mcisDispStatus = webconsolejs["common/api/services/mcis_api"].getMcisStatusFormatter(mcisStatus); // 화면 표시용 status

    if (mcisStatus != "") {
      // mcis status 가 없는 경우는 skip
      if (mcisStatusCountMap.has(mcisDispStatus)) {
        mcisStatusCountMap.set(
          mcisDispStatus,
          mcisStatusCountMap.get(mcisDispStatus) + 1
        );
      }
    }
  } catch (e) {
    console.log("mcis status error", e);
  }

  return mcisStatusCountMap;
}