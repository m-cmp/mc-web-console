import { Modal } from "bootstrap";
import { SECURITYGROUP_MAP } from "../util/util";
var table;
var checked_array = [];
$(()=> {

    $('#namespaceSecurityGroupAssist').on('keyup', function (key) {
        console.log("#namespaceSecurityGroupAssist .keywordAssistSecurityGroup keyup")
        if (key.keyCode == 13) {
            searchSecurityGroupByKeyword('searchNetworkAssistAtReg')
        }
    });

    // search button    
    $('#namespaceSecurityGroupAssist .btn_search_image').on('click', function () {
        console.log("#namespaceSecurityGroupAssist .btn_search_image clicked")
        searchSecurityGroupByKeyword('searchNetworkAssistAtReg')
    });

    // apply button
    $('#namespaceSecurityGroupAssist .btn_apply').on('click', function () {
        console.log("#namespaceSecurityGroupAssist .btn_apply clicked")
        applyAssistValidCheck('securityGroupAssist')
    });

    // table 초기 세팅	
    initTable();
});

// table 초기 세팅	
function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
		{title: "SecurityGroup Id", field:"id", visible: false},
        {title: "CSP SecurityGroup Id", field:"cspSecurityGroupId", visible: false},
        {title: "CSP SecurityGroup Name", field:"cspSecurityGroupName", visible: false},
        {title: "Provider", field:"providerId", visible: false},
        {title: "Region", field:"regionName", visible: false},
        {title: "Connection", field:"connectionName", visible: false},
        {title: "Description", field:"description", visible: false},
        {title: "Name", field:"name", headerSort:false},
		{title: "VPC", field:"vNetId", headerSort:false},
		{title: "Firewall Rules", field:"firewallRules", headerSort:false},
    ]
    
    table = mcpjs["util/util"].setTabulator("assistSecurityGroupList", tableObjParams, columns)// multi select 가능

	//table.on("rowSelectionChanged", function(data, rows){
	//	checked_array = data
	//});
}

// popup이 호출될 때 set :
export function setNamespaceSecurityGroupAssist(caller, providerId, regionName, vpcId){
    console.log("setNamespaceSecurityGroupAssist", caller)
    console.log("providerId=", providerId)
    console.log("regionName=", regionName)
    console.log("vpcId=", vpcId)

    $("#parentsNamespaceSecurityGroupAssist").val(caller)
    $("#parentsNamespaceSecurityGroupVpcId").val(vpcId)

    if ( providerId != ""){
        // region 목록 설정.
        $("#assistSecurityGroupProviderId").val(providerId);
        mcpjs['util/util'].resetRegionListByProvider(providerId, "assistSecurityGroupRegionName", regionName)
    }

    // if ( providerId != "" || regionName != "" || vpcId != ""){        
    //     var actionName="SecurityGroupListByProviderRegionZone"
    //     var optionParam = ""
    //     var urlParamMap = new Map();
    //     var filterKeyValMap =  new Map();
    //     var mconParamMap = new Map();
    //     mconParamMap.set("is_cb", "N")
    //     mconParamMap.set("providerId", providerId)
    //     mconParamMap.set("regionName", regionName)
    //     mconParamMap.set("vpcId", vpcId)
        
    //     mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['securitygroup/namespacesecuritygroup_modal'].getSecurityGroupListCallbackSuccess, '', urlParamMap, optionParam, filterKeyValMap, mconParamMap)    
    // }
    searchSecurityGroupByKeyword(caller)
}

// 조회
function searchSecurityGroupByKeyword(caller) {
    var providerId = $("#assistSecurityGroupProviderId").val();
    var regionName = $("#assistSecurityGroupRegionName").val();

	var keyword = "";
	var keywordObjId = "";
	console.log(caller)
	if (caller == "searchSecurityGroupAssistAtReg") {
		keyword = $("#keywordAssistSecurityGroup").val();
		keywordObjId = "searchAssistNetworkKeywords";
		// securityGroup api에 connection으로 filter하는 기능이 없으므로
		//totalSecurityGroupListByNamespace : page Load시 가져온 securityGroup List가 있으므로 해당 목록을 Filter한다.
	}

	// vpcId
	var vpcId = $("#parentsNamespaceSecurityGroupVpcId").val();

    if (!vpcId ){
        if (!keyword) {// vpcId가 없으면 keyword는 필수
            mcpjs['util/util'].commonAlert("At least a keyword required");
            return;
        }
        var addKeyword = '<div class="keyword" name="keyword_' + caller + '">' + keyword.trim() + '<button class="btn_del_image" onclick="mcpjs[\'util/util\'].delSearchKeyword(event, \'' + caller + '\')"></button></div>';
    
        $("#" + keywordObjId).append(addKeyword);
        var keywords = new Array();// 기존에 있는 keyword에 받은 keyword 추가하여 filter적용
        $("[name='keyword_" + caller + "']").each(function (idx, ele) {
            keywords.push($(this).text());
        });
    }else{
        if (keyword) {// keyword가 있으면 추가            
            var addKeyword = '<div class="keyword" name="keyword_' + caller + '">' + keyword.trim() + '<button class="btn_del_image" onclick="mcpjs[\'util/util\'].delSearchKeyword(event, \'' + caller + '\')"></button></div>';
        
            $("#" + keywordObjId).append(addKeyword);
            var keywords = new Array();// 기존에 있는 keyword에 받은 keyword 추가하여 filter적용
            $("[name='keyword_" + caller + "']").each(function (idx, ele) {
                keywords.push($(this).text());
            });
        }
    }

	// 현재 keywords는 filter로 쓰이지 않음.
	
    // var actionName="SecurityGroupListByProviderRegionZone"
    // var optionParam = ""
    // var urlParamMap = new Map();
    // var filterKeyValMap =  new Map();
    // var mconParamMap = new Map();
    // mconParamMap.set("is_cb", "N")
    // mconParamMap.set("providerId", providerId)
    // mconParamMap.set("regionName", regionName)
    // mconParamMap.set("vpcId", vpcId)
    
    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['securitygroup/namespacesecuritygroup_modal'].getSecurityGroupListCallbackSuccess, '', urlParamMap, optionParam, filterKeyValMap, mconParamMap)    
    var actionName="SecurityGroupListByRegion"
    var optionParamMap = new Map();
    //optionParamMap.set("is_cb", "N")// database에서 조회 : sync가 되어 있어야 제대로 된 결과가 나올 수 있어 우선은 주석 처리 함.
    optionParamMap.set("is_cb", "Y")// cloud barista(cb-tumblebug 을 조회)
    optionParamMap.set("providerId", providerId)
    optionParamMap.set("regionName", regionName)
    optionParamMap.set("vpcId", vpcId)

    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['securitygroup/namespacesecuritygroup_modal'].getSecurityGroupListCallbackSuccess);    
}

export function getSecurityGroupListCallbackSuccess(caller, result){
    var data = result.data.SecurityGroupList;
    //var data = result.SecurityGroupList;
    //console.log(data)
    table.setData(data)
}

// table에서 체크된 항목들을 parent로 값을 넘김
export function applyAssistValidCheck(caller) {
    var parentsNamespaceSecurityGroupAssist = $("#parentsNamespaceSecurityGroupAssist").val();
    console.log("parentsNamespaceSecurityGroupAssist", parentsNamespaceSecurityGroupAssist)

    let securityGroupMap = new Map();
    //checked_array
    var selectedRows = table.getSelectedRows();
    selectedRows.forEach(function(row) {
        var selectedSecurityGroupMap = new Map
        selectedSecurityGroupMap.set("id", row.getCell("id").getValue());
        selectedSecurityGroupMap.set("name", row.getCell("name").getValue());
        selectedSecurityGroupMap.set("connectionName", row.getCell("connectionName").getValue());
        selectedSecurityGroupMap.set("vpcId", row.getCell("vNetId").getValue());
        selectedSecurityGroupMap.set("firewallRules", row.getCell("firewallRules").getValue());

        selectedSecurityGroupMap.set("providerId", row.getCell("providerId").getValue());
        selectedSecurityGroupMap.set("regionName", row.getCell("regionName").getValue());
        selectedSecurityGroupMap.set("connectionName", row.getCell("connectionName").getValue());
        
        
        securityGroupMap.set(row.getCell("id").getValue(), selectedSecurityGroupMap)
    });
    //var orgPrefix = "securityGroupAssist_"
    //securityGroupAssist_id_2
    // var orgFireGroupPrefix = "securityGroupAssist_firewallRules_"
    // // for문으로 돌면서 체크된 securityGroup 찾기
    // $('#namespaceSecurityGroupAssist input:checkbox[name="securityGroupAssist_chk"]').each(function () {
    //     console.log("here")
    //     if (this.checked) {//checked 처리된 항목의 값
    //         var chkIdArr = $(this).attr('id').split("_");// 0번째와 2번째를 합치면 id 추출가능  ex) securityGroup_Raw_0
    //         console.log(chkIdArr)
            
    //         var selectedIndex = chkIdArr[2];
    //         var securityGroupId = $("#" + chkIdArr[0] + "_id_" + selectedIndex).val()//id="securityGroup_id_{{$securityGroupIndex}}"
    //         var providerId = $("#" + chkIdArr[0] + "_providerId_" + selectedIndex).val()
    //         var regionName = $("#" + chkIdArr[0] + "_regionName_" + selectedIndex).val()
    //         var connectionName = $("#" + orgPrefix + "connectionName_" + selectedIndex).val()
    //         var vpcId = $("#" + orgPrefix + "vNetId_" + selectedIndex).val()
            
    //         var securityGroupMapKey = vpcId;// vpc에 dependency가 있으므로(connection 포함)

    //         let selectedSecurityGroupMap = new Map();
    //         selectedSecurityGroupMap.set("id", $("#" + orgPrefix + "id_" + selectedIndex).val());
    //         selectedSecurityGroupMap.set("name", $("#" + orgPrefix + "name_" + selectedIndex).val());
    //         selectedSecurityGroupMap.set("description", $("#" + orgPrefix + "description_" + selectedIndex).val());
    //         selectedSecurityGroupMap.set("connectionName", connectionName);
    //         selectedSecurityGroupMap.set("vpcId", vpcId);
            
    //         // firewall은 필요하면 추가 : 배열형태임. 우선 0번째만
    //         selectedSecurityGroupMap.set("firewall_direction", $("#" + orgFireGroupPrefix + "direction_" + selectedIndex).val());
    //         selectedSecurityGroupMap.set("firewall_fromPort", $("#" + orgFireGroupPrefix + "fromPort_" + selectedIndex).val());
    //         selectedSecurityGroupMap.set("firewall_toPort", $("#" + orgFireGroupPrefix + "toPort_" + selectedIndex).val());      
    //         selectedSecurityGroupMap.set("firewall_ipProtocol", $("#" + orgFireGroupPrefix + "ipProtocol_" + selectedIndex).val());
    //         selectedSecurityGroupMap.set("firewall_cidr", $("#" + orgFireGroupPrefix + "cidr_" + selectedIndex).val());
            
    //         securityGroupMap.set(securityGroupMapKey, selectedSecurityGroupMap)          
    //     }
    // });
    //console.log(securityGroupMap)  
    mcpjs['mcismng/vmconfigureexpert'].setValuesFromAssist("NamespaceSecurityGroupAssist", securityGroupMap);
    
    //$("#namespaceSecurityGroupAssist").modal("hide");
}
