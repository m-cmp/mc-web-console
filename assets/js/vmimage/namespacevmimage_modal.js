import { Modal } from "bootstrap";
var table;
var checked_array = [];
$(()=> {
    
    // search by enter key
    $('#keywordAssistImage').on('keyup', function (key) {
        console.log("#namespaceVmImageAssist .keywordAssistImage keyup")
        if (key.keyCode == 13) {
            console.log("#namespaceVmImageAssist .enter key")
            searchNamespaceVmImageByKeyword('searchVmImageAssistAtReg')
        }
    });

    // search button    
    $('#namespaceVmImageAssist .btn_search_image').on('click', function () {
        console.log("#namespaceVmImageAssist .btn_search_image clicked")
        var providerId = $("#ani_providerId").val();
        var regionName = $("#ani_regionName").val();
        searchNamespaceVmImageByKeyword('searchVmImageAssistAtReg')
    });

    // apply buuton
    $('#namespaceVmImageAssist .btn_apply').on('click', function () {
        console.log("#namespaceVmImageAssist .btn_apply clicked")
        applyAssistValidCheck();
       
    });

    // table 초기 세팅	
    initTable()
});

// table 설정
function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
		{title: "Image Id", field:"id", visible: false},
        {title: "Provider", field:"providerId", visible: false},
        {title: "Region", field:"regionName", visible: false},
        {title: "Connection", field:"connectionName", visible: false},
        {title: "GuestOS", field:"guestOS", visible: false},
        {title: "Description", field:"description", visible: false},
        {title: "Name", field:"name", headerSort:false},
		{title: "Csp Image Name", field:"cspImageName", headerSort:false},
		{title: "Csp Image Id", field:"cspImageId", headerSort:false},
    ]
    
    var isMultiSelect = false;//한개 Row만 선택가능
    table = mcpjs["util/util"].setTabulator("assistNamespaceVmImageList", tableObjParams, columns, isMultiSelect)

	table.on("rowSelectionChanged", function(data, rows){
        checked_array = data
	});
}
// popup이 호출될 때 parent에서 보내주는 param set.
export function setNamespaceVmImageAssist(caller, providerId, regionName, connectionName){
    console.log("setNamespaceVmImageAssist", caller)
    console.log("providerId=", providerId)
    console.log("regionName=", regionName)
    console.log("connectionName=", connectionName)

    $("#parentsNamespaceVmImageAssist").val(caller)
    $("#parentsNamespaceVmImageConnectionName").val(connectionName)
    
    if ( connectionName != ""){
        // 해당 connection으로 조회
        searchNamespaceVmImageByKeyword(caller);
    }else if ( providerId != ""){
        // region 목록 설정.
        $("#ani_providerId").val(providerId);
        mcpjs['util/util'].resetRegionListByProvider(providerId, "ani_regionName", regionName)
    }
    
}
  

// parent의 provider, region 과 popup에서 선택한 provider, region 비교
// parent의 apply() 함수 호출하여 값을 set 하도록
export function applyAssistValidCheck() {
    // var parentProviderID = "";
    // var parentRegionName = "";
    
  
    // // 선택한 provider, region check : 이미 선택된 provider, region이 있을 때 비교하여 다른 provider, region이면 confirm을 띄우고 OK면 초기화 시키고 set
    // var selectedProviderId = "";
    // var selectedRegionName = "";
    // if (caller == "vmImageAssist") {
    //   var orgPrefix = "vmImageAssist_";// 조회 결과 table의 id
    //   selectedProviderId = $("#" + orgPrefix + "providerId_" + selectedIndex).val();
    //   selectedRegionName = $("#" + orgPrefix + "regionName_" + selectedIndex).val();
    // } 
  
    // console.log("caller=" + caller)
    // //console.log($("#e_connectionName").val())
    // //console.log("selectedConnectionName=" + selectedConnectionName)

    // // target이 mcis의 expert mode이면
    // $("#t_connectionName").val(selectedConnectionName);
    // if ($("#e_connectionName").val() != "" && $("#e_connectionName").val() != selectedConnectionName) {
    //   //commonConfirmOpen("DifferentConnectionAtSecurityGroup");
    //   mcpjs["util/util"].commonConfirmOpen("DifferentConnectionAtAssistPopup", caller)
    // } else {
    //   applyAssistValues(caller)
    // }

     // 자신의 값을 전달하기 위해 parent의 함수 호출
     var parentsName = $("#parentsNamespaceVmImageAssist").val();
     var providerId = $("#ani_providerId").val();
     var regionName = $("#ani_regionName").val();
     
     console.log("parentsName", parentsName)
     console.log("providerId", providerId)
     console.log("regionName", regionName)

     let imageMap = new Map();
     var selectedRows = table.getSelectedRows();
     selectedRows.forEach(function(row) {
         imageMap.set("id", row.getCell("id").getValue());
         imageMap.set("name", row.getCell("name").getValue());
         imageMap.set("cspImageName", row.getCell("cspImageName").getValue());
         imageMap.set("cspImageId", row.getCell("cspImageId").getValue());
         imageMap.set("guestOS", row.getCell("guestOS").getValue());
         imageMap.set("description", row.getCell("description").getValue());
         imageMap.set("providerId", row.getCell("providerId").getValue());
         imageMap.set("regionName", row.getCell("regionName").getValue());
         imageMap.set("connectionName", row.getCell("connectionName").getValue());
     });
     // var checked_row = checked_array[0];
     // console.log("checked_row ", checked_row);
     // imageMap.set("id", checked_row.id);
     // imageMap.set("name", checked_row.name);
     // imageMap.set("cspImageId", checked_row.cspImageId);
     // imageMap.set("cspImageName", checked_row.cspImageName);
     // imageMap.set("guestOS", checked_row.guestOS);
     // imageMap.set("description", checked_row.description);
     // imageMap.set("regionName", checked_row.regionName);
     // imageMap.set("connectionName", checked_row.connectionName);


     // imageMap.set("id", $("#" + orgPrefix + "id_" + selectedIndex).val());
     // imageMap.set("name", $("#" + orgPrefix + "name_" + selectedIndex).val());
     // imageMap.set("cspImageId", $("#" + orgPrefix + "cspImageId_" + selectedIndex).val());
     // imageMap.set("cspImageName", $("#" + orgPrefix + "cspImageName_" + selectedIndex).val());
     // imageMap.set("guestOS", $("#" + orgPrefix + "guestOS_" + selectedIndex).val());
     // imageMap.set("description", $("#" + orgPrefix + "description_" + selectedIndex).val());
     // imageMap.set("providerId", $("#" + orgPrefix + "providerId_" + selectedIndex).val());
     // imageMap.set("regionName", $("#" + orgPrefix + "regionName_" + selectedIndex).val());
     // imageMap.set("connectionName", $("#" + orgPrefix + "connectionName_" + selectedIndex).val());

     // MCIS Simple Mode 의 ss_imageId
     if( parentsName == "MCIS_SIMPLE"){
         console.log(" return values to parents simple ", imageMap)
         mcpjs['mcismng/vmconfiguresimple'].setValuesFromAssist("NamespaceVmImageAssist", imageMap);
     }else if ( parentsName == "MCIS_EXPERT"){
         // 자신의 값을 parent로 돌려 줌.
         // MCIS Expert Mode 의 e_imageId 와 OS_HW > tab_vmImage_name, tab_vmImage_id, tab_vmImage_cspImageId, tab_vmImage_cspImageName, tab_vmImage_guestOS, tab_vmImage_description
         //var orgPrefix = "vmImageAssist_";
         console.log(" return values to parents expert ", imageMap)
         mcpjs['mcismng/vmconfigureexpert'].setValuesFromAssist("NamespaceVmImageAssist", imageMap);            
     }
}

// EnterKey입력 시 해당 값, keyword 들이 있는 object id, 구분자(caller)
// export function searchNamespaceVmImageByEnter(event, caller) {
// 	if (event.keyCode === 13) {		
// 		searchNamespaceVmImageByKeyword(caller);
// 	}
// }

// vmImage 목록 조회
export function searchNamespaceVmImageByKeyword(caller) {
	var keyword = "";
	var keywordObjId = "";
	if (caller == "searchVmImageAssistAtReg") {
		keyword = $("#keywordAssistImage").val();
		keywordObjId = "searchAssistImageKeywords";
	}

	if (keyword != "") {
		var addKeyword = '<div class="keyword" name="keyword_' + caller + '">' + keyword.trim() + '<button class="btn_del_image" onclick="mcpjs[\'util/util\'].delSearchKeyword(event, \'' + caller + '\')"></button></div>';
        $("#" + keywordObjId).append(addKeyword);
	}
	
	var keywordList = new Array();// 기존에 있는 keyword에 받은 keyword 추가하여 filter적용

    // connectionName이 있으면 검색어에 추가한다.
    // var connectionName = $("#parentsNamespaceVmImageConnectionName").val();
    // if( connectionName != ""){
    //     keywords.push(connectionName);
    // }
    var providerId = $("#ani_providerId").val();
    if( providerId != ""){
        keywordList.push(providerId)
    }    
    //keywords.push($("#ani_regionName").val())// vmImage에는 region을 넣으면 결과가 안나옴(image name등에 region이 들어가는 경우가 거의 없음. 화면 design은 provider, region 선택으로 나오나, 실제 조회에서는 조회조건으로 들어가서 region은 skip하도록 함)

	$("[name='keyword_" + caller + "']").each(function (idx, ele) {
		keywordList.push($(this).text());
	});

    var caller = "vmimage_modal"
    var controllerKeyName = "SearchVirtualMachineImageList"
    var optionParamMap = new Map();
	//mcpjs['util/pathfinder'].getCommonNamespaceVmImageList(keywords, caller, mcpjs['vmimage/namespacevmimage_modal'].searchVmImageListCallbackSuccess);
    mcpjs['util/pathfinder'].postCommonDataWithTargetObjName(caller, controllerKeyName, optionParamMap, "keywords", keywordList, searchVmImageListCallbackSuccess);
}

export function searchVmImageListCallbackSuccess(caller, result){
    //console.log(result);
    //var vmImageList = result.data.vmImageList;
    var vmImageList = result.data.VirtualMachineImageList;
    console.log(vmImageList);         
    table.setData(vmImageList);    
}
