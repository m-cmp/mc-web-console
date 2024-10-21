// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
    console.log("select-current-project changed ")
    let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
    console.log("select-current-project on change ", project)
    var respPolicyList = await webconsolejs["common/api/services/eventalarm_api"].getAllPolicy();
    getPolicyListCallbackSuccess(project.NsId, respPolicyList);
})

////
// 모달 콜백 예제
export function commoncallbac(val) {
    alert(val);
}

document.addEventListener("DOMContentLoaded", initEventAlarm);
async function initEventAlarm() {
    console.log("initMonitoring")
    ////////////////////// partials init functions///////////////////////////////////////
    // try {
    //     webconsolejs["partials/operation/manage/pmkcreate"].initPmkCreate();//PmkCreate을 Partial로 가지고 있음. 
    // } catch (e) {
    //     console.log(e);
    // }
    ////////////////////// partials init functions end ///////////////////////////////////////

    ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
    selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

    // workspace selection check
    webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject)
    ////////////////////// set workspace list, project list at Navbar end //////////////////////////////////



    if (selectedWorkspaceProject.projectId != "") {
        var selectedProjectId = selectedWorkspaceProject.projectId;
        var selectedNsId = selectedWorkspaceProject.nsId;

        //getPmkList();// project가 선택되어 있으면 pmk목록을 조회한다.
        var respMciList = await webconsolejs["common/api/services/eventalarm_api"].getMciList(selectedNsId);
        getMciListCallbackSuccess(selectedProjectId, respMciList);

    }
}

async function getPolicyListCallbackSuccess (nsId, policyList) {
  setPolicyList(policyList)
}
async function setPolicyList () {
  
}
