// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
    console.log("select-current-project changed ")
    let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
    webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
    console.log("select-current-project on change ", project)
    var respPmkList = await webconsolejs["common/api/services/mci_api"].getMciList(project.NsId);
    getMciListCallbackSuccess(project.NsId, respPmkList);
})

////
// 모달 콜백 예제
export function commoncallbac(val) {
    alert(val);
}

var selectedWorkspaceProject = new Object();

//DOMContentLoaded 는 Page에서 1개만.
// init + 파일명 () : ex) initMonitoring() 를 호출하도록 한다.
document.addEventListener("DOMContentLoaded", initMonitoring);

// 해당 화면에서 최초 설정하는 function
//로드 시 prj 값 받아와 getPmkList 호출
async function initMonitoring() {
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
        var respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(selectedNsId);
        getMciListCallbackSuccess(selectedProjectId, respMciList);


        // ////////////////////// 받은 pmkId가 있으면 해당 pmkId를 set하고 조회한다. ////////////////
        // // 외부(dashboard)에서 받아온 pmkID가 있으면 pmk INFO 이동
        // // 현재 브라우저의 URL
        // const url = window.location.href;
        // const urlObj = new URL(url);
        // // URLSearchParams 객체 생성
        // const params = new URLSearchParams(urlObj.search);
        // // pmkID 파라미터 값 추출
        // selectedMonitoringID = params.get('pmkID');

        // console.log('selectedMonitoringID:', selectedMonitoringID);  // 출력: pmkID의 값 (예: com)
        // if (selectedMonitoringID != undefined) {
        //     toggleRowSelection(selectedPmkID)
        //     getSelectedPmkData(selectedPmkID)
        // }
        // ////////////////////  pmkId를 set하고 조회 완료. ////////////////
    }
}

function getMciListCallbackSuccess(nsId, mciList) {
    console.log("nsId", nsId)
    console.log("mciList", mciList)

    setMciList(mciList)
}

function setMciList(mciList) {
    var res_item = mciList.mci;

    // res_item이 배열인지 확인
    if (Array.isArray(res_item)) {
        // HTML option 리스트 초기값
        var html = '<option value="">Choose a Target MCI for Monitoring</option>';

        // res_item 배열을 순회하면서 각 MCI의 name을 option 태그로 변환
        res_item.forEach(item => {
            html += '<option value="' + item.id + '">' + item.name + '</option>';
        });

        // monitoring_mcilist 셀렉트 박스에 옵션 추가
        $("#monitoring_mcilist").empty();
        $("#monitoring_mcilist").append(html);
    } else {
        console.error("res_item is not an array");
    }
}

// 선택했을 때 displayMonitoringMci 
$("#monitoring_mcilist").on('change', async function () {
    console.log("monitoring_mcilist")
    
    var selectedMci = $("#monitoring_mcilist").val()
    console.log("selectedMci", selectedMci)

    selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
    var selectedNsId = selectedWorkspaceProject.nsId;

    displayMonitoringMci(selectedNsId, selectedMci)
})


async function displayMonitoringMci(nsId, mciId){
    console.log(mciId)

    //get mci
    
    var respMci = await webconsolejs["common/api/services/mci_api"].getMci(nsId, mciId);
    console.log("respMci",respMci)
    
    displayServerStatusList(mciId, respMci.responseData.vm)

}

function displayServerStatusList(mciId, vmList) {
    console.log("displayServerStatusList")
  
    var mciName = mciId;
    var vmLi = "";
    vmList.sort();
    for (var vmIndex in vmList) {
      var aVm = vmList[vmIndex]
  
      var vmID = aVm.id;
      var vmName = aVm.name;
      var vmStatus = aVm.status;
      var vmDispStatus = webconsolejs["common/api/services/mci_api"].getVmStatusFormatter(vmStatus); // vmStatus set
      var vmStatusClass = webconsolejs["common/api/services/mci_api"].getVmStatusStyleClass(vmDispStatus) // vmStatus 별로 상태 색상 set
  
      vmLi += '<li id="server_status_icon_' + vmID + '" class="card ' + vmStatusClass + '" onclick="webconsolejs[\'pages/operation/manage/mci\'].vmDetailInfo(\'' + mciId + '\',\'' + mciName + '\',\'' + vmID + '\')"><span class="text-dark-fg">' + vmName + '</span></li>';
  
    }// end of mci loop
  
    $("#monitoring_server_info_box").empty();
    $("#monitoring_server_info_box").append(vmLi);
  }