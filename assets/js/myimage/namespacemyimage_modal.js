var table;
var checked_array = [];

$(()=> {
    // apply buuton
    $('#namespaceMyImageAssist .btn_apply').on('click', function () {
        console.log("#namespaceMyImageAssist .btn_apply clicked");
        applyAssistValidCheck()
    });

    // table 초기 세팅	
    initTable();

    //getMyImageList();// 팝업 띄우면서 Set할 때 조회 함  
});

// table 설정
function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
		{title: "MyImage Id", field:"id", visible: false},
        {title: "CSP MyImage Id", field:"cspCustomImageId", visible: false},
        {title: "CSP MyImage Name", field:"cspCustomImageName", visible: false},
        {title: "Connection", field:"connectionName", visible: false},
        {title: "GuestOS", field:"guestOS", visible: false},
        {title: "Description", field:"description", visible: false},
        {title: "Name", field:"name", headerSort:false},
		{title: "Source VM", field:"sourceVmId", headerSort:false},
		{title: "Status", field:"status", headerSort:false},
    ]
    
    var isMultiSelect = false;//한개 Row만 선택가능
    table = mcpjs["util/util"].setTabulator("assistMyImageList", tableObjParams, columns, isMultiSelect)

	//table.on("rowSelectionChanged", function(data, rows){
	//	checked_array = data
	//});
}

// popup이 호출될 때 parent에서 보내주는 param set.
export function setNamespaceMyImageAssist(caller, providerId, regionName, connectionName){
    console.log("setNamespaceVmImageAssist", caller)
    console.log("providerId=", providerId)
    console.log("regionName=", regionName)
    console.log("connectionName=", connectionName)

    $("#parentsNamespaceMyImageAssist").val(caller)
    $("#parentsNamespaceMyImageConnectionName").val(connectionName)
    
    if ( connectionName != ""){
        // 해당 connection으로 자동 조회
        searchMyImageByKeyword(caller);
    }else if ( providerId != ""){
        // region 목록 설정.
        $("#assistMyImageProviderName").val(providerId);
        mcpjs['util/util'].resetRegionListByProvider(providerId, "assistMyImageRegionName", regionName)
    }
    
}

// MyImage 목록 전체 조회
function getMyImageList(optionParamMap){
    //var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData("myimagepop", "MyImageList", optionParamMap, mcpjs['myimage/namespacemyimage_modal'].getMyImageListCallbackSuccess)
}
// function getCommonSearchMyImageList(keywordList, caller) {

// 	var connectionName = $("#myImageConnectionName").val();
// 	var url = "/settings/resources/myimage";
// 	if(connectionName){
// 		url +="?filterKey=connectionName&filterVal="+connectionName;
// 	}

//     axios.get(url).then(result => {
//         console.log("result", result);

//         if (result.data.myImageInfoList == null || result.data.myImageInfoList == undefined || result.data.myImageInfoList == "null") {
//             commonAlert("There is no result")
//         } else {
//             getCommonSearchMyImageListCallbackSuccess(caller, result.data.myImageInfoList);
//         }
//     })
// }

export function getMyImageListCallbackSuccess(caller, result) {
//function getCommonSearchMyImageListCallbackSuccess(caller, myImageList) {
    console.log(result);
    var myImageList = result.data.myImageInfoList;
    
    var rowCount = 0;
    if (myImageList.length > 0) {
        table.setData(myImageList)
    }

    if (rowCount === 0) {
      // TO DO: data 없을 때 표시할 방법
    }
}

// EnterKey입력 시 해당 값, keyword 들이 있는 object id, 구분자(caller)
export function searchAssistMyImageByEnter(event, caller) {
	if (event.keyCode === 13) {		
		searchMyImageByKeyword(caller);		
	}
}
// keyword로 조회
export function searchMyImageByKeyword(caller) {
	var	keyword = $("#keywordMyImage").val();
	var	keywordObjId = "searchMyImageKeywords";


	// if (!keyword) {
	// 	commonAlert("At least a keyword required");
	// 	return;
	// }
	if (keyword != "") {
		var addKeyword = '<div class="keyword" name="keyword_' + caller + '">' + keyword.trim() + '<button class="btn_del_image" onclick="delSearchKeyword(event, \'' + caller + '\')"></button></div>';
	}

	$("#" + keywordObjId).append(addKeyword);
	var keywords = new Array();// 기존에 있는 keyword에 받은 keyword 추가하여 filter적용
	$("[name='keyword_" + caller + "']").each(function (idx, ele) {
		keywords.push($(this).text());
	});
	
    //getCommonSearchMyImageList(keywords, caller);
	var caller = "vmimage_modal"
    var controllerKeyName = "SearchVirtualMachineImageList"
    var optionParamMap = new Map();
    // TODO : tumblebug에 조회 조건이 filterkey, filterVal 한가지만 있음. 
    //  이전단계에서 connection이 선택되기 때문에 해당 connection을 사용하는 방법이 있음.
    //  현재 popup에서는 connection을 사용하지 않지만 내부적으로는 가지고 있으므로 해당 connection을 조회할 수 있을 것 같기는 하나, provider를 변경하거나 region을 변경하면 초기화되어 connection을 특정할 수 없음.
    //  tumblebug 조회를 db조회로 바꾸는 방법도 있음.
	//mcpjs['util/pathfinder'].getCommonNamespaceVmImageList(keywords, caller, mcpjs['vmimage/namespacevmimage_modal'].searchVmImageListCallbackSuccess);    
    getMyImageList(optionParamMap);
}

// apply button click시 validation 체크 후 applyAssistValues()에서 parent로 값전달
// connection이 미선택인 경우는 지정 가능하나, connection이 다르면 선택불가.
export function applyAssistValidCheck(){

    applyAssistValues();
}

// parent로 값전달
export function applyAssistValues(){
    // 자신의 값을 전달하기 위해 parent의 함수 호출
    var parentsName = $("#parentsNamespaceMyImageAssist").val();
    var providerId = $("#assistMyImageProviderName").val();
    var regionName = $("#assistMyImageRegionName").val();

    //var selectedIndex = $("#selectedIndexNamespaceVmImageAssist").val();// row를 클릭하면 해당 index를 저장해 둠.
    //$("#parentsNamespaceVmImageAssist").val(caller)
    console.log("parentsName", parentsName)
    console.log("providerId", providerId)
    console.log("regionName", regionName)
    //console.log("selectedIndex", selectedIndex)

    let myImageMap = new Map();
    var selectedRows = table.getSelectedRows();
    selectedRows.forEach(function(row) {
        myImageMap.set("id", row.getCell("id").getValue());
        myImageMap.set("name", row.getCell("name").getValue());
        myImageMap.set("cspImageId", row.getCell("cspImageId").getValue());
        myImageMap.set("cspImageName", row.getCell("cspImageName").getValue());
        myImageMap.set("guestOS", row.getCell("guestOS").getValue());
        myImageMap.set("description", row.getCell("description").getValue());
        myImageMap.set("regionName", row.getCell("regionName").getValue());
        myImageMap.set("connectionName", row.getCell("connectionName").getValue());

    });

    // var checked_row = checked_array[0];
    // console.log("checked_row ", checked_row);
    
    // myImageMap.set("id", checked_row.id);
    // myImageMap.set("name", checked_row.name);
    // myImageMap.set("cspImageId", checked_row.cspCustomImageId);
    // myImageMap.set("cspImageName", checked_row.cspCustomImageName);
    // myImageMap.set("guestOS", checked_row.guestOS);
    // myImageMap.set("description", checked_row.description);
    // myImageMap.set("regionName", checked_row.regionName);
    // myImageMap.set("connectionName", checked_row.connectionName);

    // MCIS Simple Mode 의 ss_imageId
    if( parentsName == "MCIS_SIMPLE"){
        console.log(" return values to parents simple ", myImageMap)
        mcpjs['mcismng/vmconfiguresimple'].setValuesFromAssist("NamespaceMyImageAssist", myImageMap);
    }else if ( parentsName == "MCIS_EXPERT"){
        // 자신의 값을 parent로 돌려 줌.
        // MCIS Expert Mode 의 e_imageId 와 OS_HW > tab_vmImage_name, tab_vmImage_id, tab_vmImage_cspImageId, tab_vmImage_cspImageName, tab_vmImage_guestOS, tab_vmImage_description
        //var orgPrefix = "vmImageAssist_";
        console.log(" return values to parents expert ", myImageMap)
        mcpjs['mcismng/vmconfigureexpert'].setValuesFromAssist("NamespaceMyImageAssist", myImageMap);            
    }
}