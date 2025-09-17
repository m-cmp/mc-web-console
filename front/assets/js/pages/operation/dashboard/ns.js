document.addEventListener("DOMContentLoaded", initDashboardNs);

var totalMciListObj = new Object();
var totalMciStatusMap = new Map();
var totalVmStatusMap = new Map();

async function initDashboardNs() {

  ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
  var curWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

  // workspace selection check
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(curWorkspaceProject)

  ////////////////////// partials init functions///////////////////////////////////////
  try {
    webconsolejs["partials/operation/dashboard/mci_dashboard"].initMciDashboard(webconsolejs["pages/operation/dashboard/ns"].callbackStatusChanged, curWorkspaceProject);
  } catch (e) {
    console.error(e);
  }

}

// partial에서 변경내용을 page로 알려줄 때,
export function callbackStatusChanged(caller, respData) {
  
  if (caller == "mcichanged") {// mci 목록 조회 뒤 status 표시를 위해 호출함

    totalMciListObj.totalMciStatusMap = respData.totalMciStatusMap;
    totalMciListObj.totalVmStatusMap = respData.totalVmStatusMap;

    webconsolejs["partials/operation/manage/mciserver_summary"].initMciServerSummary(null, totalMciListObj);
  }
}

function calculateMciStatusCount(mciData) {

  var mciStatusCountMap = new Map();
  mciStatusCountMap.set("running", 0);
  mciStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  mciStatusCountMap.set("terminate", 0);
  try {
    var mciStatus = mciData.status;
    var mciDispStatus = webconsolejs["common/api/services/mci_api"].getMciStatusFormatter(mciStatus); // 화면 표시용 status

    if (mciStatus != "") {
      // mci status 가 없는 경우는 skip
      if (mciStatusCountMap.has(mciDispStatus)) {
        mciStatusCountMap.set(
          mciDispStatus,
          mciStatusCountMap.get(mciDispStatus) + 1
        );
      }
    }
  } catch (e) {
  }

  return mciStatusCountMap;
}