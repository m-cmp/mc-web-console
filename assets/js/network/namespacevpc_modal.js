import { Modal } from "bootstrap";
import { VPC_MAP } from "../util/util";
var table;
var checked_array = [];

$(()=> {
    
    // search by enter key
    $('#keywordAssistVpc').on('keyup', function (key) {
        console.log("#namespaceVpcAssist .keywordAssistImage keyup")
        if (key.keyCode == 13) {
            searchNetworkByKeyword('searchNetworkAssistAtReg')
        }
    });

    // search button    
    $('#namespaceVpcAssist .btn_search_image').on('click', function () {
        console.log("#namespaceVpcAssist .btn_search_vpc clicked")
        searchNetworkByKeyword('searchNetworkAssistAtReg')
    });

    // apply buuton
    $('#namespaceVpcAssist .btn_apply').on('click', function () {
        console.log("#namespaceVpcAssist .btn_apply clicked")
        applyAssistValidCheck('namespaceVpcAssist')
    });

    // table 초기 세팅	
    initTable();
  
});

// table 설정
function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
		{title: "Image Id", field:"id", visible: false},
        {title: "CSP VPC Name", field:"cspVNetName", visible: false},
        {title: "Provider", field:"providerId", visible: false},
        {title: "Region", field:"regionName", visible: false},
        {title: "Connection", field:"connectionName", visible: false},
        {title: "Description", field:"description", visible: false},
        {title: "Name", field:"name", headerSort:false},
		{title: "CIDR Block", field:"cidrBlock", headerSort:false},
		{title: "Subnet Id", field:"subnetInfoList", headerSort:false},
    ]
    
    var isMultiSelect = false;//한개 Row만 선택가능
    table = mcpjs["util/util"].setTabulator("assistVnetList", tableObjParams, columns, isMultiSelect)

	//table.on("rowSelectionChanged", function(data, rows){
	//	checked_array = data
	//});
}

// popup이 호출될 때 set : 
export function setNamespaceVpcAssist(caller, providerId, regionName, connectionName){
    console.log("setNamespaceVpcAssist", caller)
    console.log("providerId=", providerId)
    console.log("regionName=", regionName)
    console.log("connectionName=", connectionName)

    $("#parentsNamespaceVpcAssist").val(caller)
    $("#parentsNamespaceVpcConnectionName").val(connectionName)    

    if ( providerId != ""){
        // region 목록 설정.
        $("#assistNetworkProviderId").val(providerId);
        mcpjs['util/util'].resetRegionListByProvider(providerId, "assistNetworkRegionName", regionName)
    }

    var caller = "namespacevpc_modal";
    var actionName="VpcListByRegion"
    var optionParamMap = new Map();
    optionParamMap.set("is_cb", "N");// db를 조회하는 경우 'N', cloud-barista를 직접호출하면 is_cb='Y'. 기본은 is_cb=Y
    optionParamMap.set("providerId", providerId)
    optionParamMap.set("regionName", regionName)
        
    // connectionName이 있으면 provider + region이 이미 선택된 것이므로 filter 조건이 있는 function 호출    
    if ( connectionName != ""){            
        optionParamMap.set("connectionName", connectionName)        
        mcpjs['util/pathfinder'].getCommonDataByConnection(caller, actionName, optionParamMap, mcpjs['network/namespacevpc_modal'].getVpcListCallbackSuccess)
    }else if ( providerId != ""){        
        // 둘다 있으면 해당 region의 vpc 목록을 보여준다.
        if ( providerId != "" && regionName != ""){
            mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['network/namespacevpc_modal'].getVpcListCallbackSuccess)
        }
    }    
}

export function getVpcListCallbackSuccess(caller, result){
    console.log("caller", caller)
    console.log("result", result)
    var data = result.data.VNetList;// getCommonData 호출 시에는 result.data 아래있는 것을 선택
    table.setData(data)
}

// EnterKey입력 시 해당 값, keyword 들이 있는 object id, 구분자(caller)
function searchAssistNetworkByEnter(event, caller) {
	if (event.keyCode === 13) {
		searchNetworkByKeyword(caller);
	}
}

//
function searchNetworkByKeyword(caller) {
	var keyword = "";
	var keywordObjId = "";
	if (caller == "searchNetworkAssistAtReg") {
		keyword = $("#keywordAssistVpc").val();
		keywordObjId = "searchAssistNetworkKeywords";
		// network api에 connection으로 filter하는 기능이 없으므로
		//totalNetworkListByNamespace : page Load시 가져온 network List가 있으므로 해당 목록을 Filter한다.
	}

	var providerId = $("#assistNetworkProviderName").val();
    var regionName = $("#assistNetworkRegionName").val();

	
	if (!keyword) {
		mcpjs['util/util'].commonAlert("At least a keyword required");
		return;
	}
	var addKeyword = '<div class="keyword" name="keyword_' + caller + '">' + keyword.trim() + '<button class="btn_del_image" onclick="mcpjs[\'util/util\'].delSearchKeyword(event, \'' + caller + '\')"></button></div>';

	$("#" + keywordObjId).append(addKeyword);
	var keywords = new Array();// 기존에 있는 keyword에 받은 keyword 추가하여 filter적용
	$("[name='keyword_" + caller + "']").each(function (idx, ele) {
		keywords.push($(this).text());
	});

    // 둘다 있으면 해당 vpc목록을 뿌린다.
    if ( providerId != "" && regionName != ""){
        if (VPC_MAP.has(providerId+"|"+regionName)) {
            //vpcList = mcpjs['util/util'].VPC_MAP.get(providerId+"|"+regionName)
            vpcRegionList = VPC_MAP.get(providerId+"|"+regionName)
            table.setData(vpcRegionList)        
        }
    }

    // TODO : filter 기능 보완 필요. : vpc 목록에서 keyword로 filter하도록.
	// mcpjs['mcismng/mciscreate'].filterNetworkList(keywords, caller)
    // console.log(mcpjs['mcismng/mciscreate'].VPC_MAP)
    // new NamespaceVpcListComp(document.getElementById("assistVnetList"), mcpjs['mcismng/mciscreate'].VPC_MAP.get(providerId))
}

export function setAssistValue(index) {
    $("#selectedIndexNamespaceVpcAssist").val(index);
}
// parent로 값을 넘김
// providerId, regionName은 변경되지 않음
export function applyAssistValidCheck(caller) {
    //var selectedIndex = $("#selectedIndexNamespaceVpcAssist").val();// row을 클릭하면 해당 index를 저장
    //console.log("selectedIndex=" + selectedIndex)
    var parentsNamespaceVpcAssist = $("#parentsNamespaceVpcAssist").val();
    console.log("parentsNamespaceVpcAssist", parentsNamespaceVpcAssist)
  
    // 선택한 provider, region check : 이미 선택된 provider, region이 있을 때 비교하여 다른 provider, region이면 confirm을 띄우고 OK면 초기화 시키고 set
    //var selectedProviderId = "";
    //var selectedRegionName = "";
    //var orgPrefix = "vNetAssist_";
    //selectedProviderId = $("#" + orgPrefix + "providerId_" + selectedIndex).val();
    //selectedRegionName = $("#" + orgPrefix + "regionName_" + selectedIndex).val();
    //var selectedVpcId = $("#" + orgPrefix + "id_" + selectedIndex).val();
    //vNetAssist_id_0
    //console.log("caller=" + caller)
    //console.log("selectedProviderId=" + selectedProviderId)
    //console.log("selectedRegionName=" + selectedRegionName)
    //console.log("selectedVpcId=" + selectedVpcId)
  
    let vpcMap = new Map();   
    var selectedRows = table.getSelectedRows();
    selectedRows.forEach(function(row) {
        console.log(row);
        //console.log(row.getCell("id").getValue());
        var subnetInfoList = row.getCell("subnetInfoList").getValue();
        //console.log(subnetInfoList);
        //console.log(subnetInfoList[0].id);
        vpcMap.set("id", row.getCell("id").getValue());
        vpcMap.set("name", row.getCell("name").getValue());
        vpcMap.set("description", row.getCell("description").getValue());
        vpcMap.set("cidrBlock", row.getCell("cidrBlock").getValue());
        vpcMap.set("cspVnetName", row.getCell("cspVNetName").getValue());
        vpcMap.set("subnetId", subnetInfoList[0].id);
        vpcMap.set("subnetName", subnetInfoList[0].name);
        vpcMap.set("providerId", row.getCell("providerId").getValue());
        vpcMap.set("regionName", row.getCell("regionName").getValue());
        vpcMap.set("connectionName", row.getCell("connectionName").getValue());
        
        console.log("vpcMap", vpcMap)
    });
    // var checked_row = checked_array[0];
    // console.log("checked_row ", checked_row);
    // // target이 mcis의 expert mode이면    
    // vpcMap.set("id", checked_row.id);
    // vpcMap.set("name", checked_row.name);
    // vpcMap.set("description", checked_row.description);
    // vpcMap.set("cidrBlock", checked_row.cidrBlock);
    // vpcMap.set("cspVnetName", checked_row.cspVnetName);
    // vpcMap.set("subnetId", checked_row.subnetInfoList[0].id);//원래는 subnet이 list형태이나 [0]번째로 지정함
    // //vpcMap.set("subnetId", checked_row.subnetId);
    // vpcMap.set("subnetName", checked_row.subnetInfoList[0].name);
    // vpcMap.set("providerId", checked_row.providerId);
    // vpcMap.set("regionName", checked_row.regionName);
    // vpcMap.set("connectionName", checked_row.connectionName);
    // console.log("vpcMap", vpcMap)
  
    mcpjs['mcismng/vmconfigureexpert'].setValuesFromAssist("NamespaceVpcAssist", vpcMap);
    //mcpjs['mcismng/vmconfigureexpert'].applyAssistValues("namespaceVpcAssist", vpcMap);
    console.log("sss")
    $("#namespaceVpcAssist").modal("hide");
}
