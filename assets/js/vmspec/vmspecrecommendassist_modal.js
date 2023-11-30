import { Modal } from "bootstrap";
var table
var checked_array = []
$(()=> {
    
    // search button
	$('#recommendSpecAssist .btn_search_spec').on('click', function () {
        console.log("#recommendSpecAssist .btn_search_spec clicked")        
		getVmSpecRecommend()        
    });

	// spec 추천 시 option에 따라 map 표시
    $('#assistRecommendSpecConnectionName').on('change', function () {
		var recommendPriority = $("#assistRecommendSpecConnectionName option:selected").val();

		$("#recommendSpecSetting").removeClass("flexbox")
		$("#recommend_map").css("display", "none")

		if (recommendPriority == "location") {
			$("#recommendSpecSetting").addClass("flexbox")
			$("#recommend_map").css("display", "block")
			mcpjs['mcismng/vmassist_modal'].showMap()
			console.log("show map");
		}

    });

	// table 초기 세팅	
    initTable()

    // apply buuton
	// 자신의 값을 전달하기 위해 parent의 함수 호출
    $('#recommendSpecAssist .btn_apply').on('click', function () {
        console.log("#recommendSpecAssist .btn_apply clicked")
		applyAssistValidCheck();		
    });
  
});

// table 설정
function initTable() {
	// table 초기 세팅
	var tableObjParams = {}

	var columns = [
		{formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
		{title: "ProviderId", field:"providerName", visible: false},
		{title: "regionName", field:"regionName", visible: false},
		{title: "connectionName", field:"connectionName", visible: false},
		{title: "name", field:"name", visible: false},
		{title: "cspSpecName", field:"cspSpecName", visible: false},
		{title: "Provider", field:"providerName", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "Region", field:"regionName", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "Spec", field:"cspSpecName", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "Price", field:"costPerHour", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "Memory", field:"memGiB", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "CPU", field:"numvCPU", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
	]

	table = mcpjs["util/util"].setTabulator("assistRecommendSpecList", tableObjParams, columns)

	//table.on("rowSelectionChanged", function(data, rows){
	//	checked_array = data
	//});
}

// popup을 띄울 때 전달 받는 param
export function setVmSpecRecommendAssist(caller, providerId, regionName){
	$("#parentsRecommendVmSpecAssist").val(caller)	
}

// vm Spec 추천 : priority option에 따라
export function getVmSpecRecommend() {
	var recommendPriority = $("#assistRecommendSpecConnectionName option:selected").val();
	var recommendKey = "";
	var recommendValue = "";

	var max_cpu = $("#num_vCPU_max").val()
	var min_cpu = $("#num_vCPU_min").val()
	var max_mem = $("#num_memory_max").val()
	var min_mem = $("#num_memory_min").val()
	var max_cost = $("#num_cost_max").val()
	var min_cost = $("#num_cost_min").val()
	var limit = $("#recommendVmLimit").val()
	var lon = $("#longitude").val()
	var lat = $("#latitude").val()

	if (recommendPriority == "location"){
		recommendKey = "coordinateClose"
		recommendValue = lat + "/" + lon
		console.log(" lon " + lon + ", lat " + lat)
		if (lon == "" || lat == "") {
			mcpjs['util/util'].commonAlert(" 지도에서 위치를 선택하세요 ")
			return;
		}
	}
	
	// recommendPriority = "location"
	// recommendKey = "coordinateClose"
	// recommendValue = "34.386838/131.711403"
	
	var obj = {
		"filter": {
			"policy": [
				{
					"condition": [
						{
							"operand": max_cpu,
							"operator": "<="
						},
						{
							"operand": min_cpu,
							"operator": ">="
						}
					],
					"metric": "cpu"
				},
				{
					"condition": [
						{
							"operand": max_mem,
							"operator": "<="
						},
						{
							"operand": min_mem,
							"operator": ">="
						}
					],
					"metric": "memory"
				},
				{
					"condition": [
						{
							"operand": max_cost,
							"operator": "<="
						},
						{
							"operand": min_cost,
							"operator": ">="
						}
					],
					"metric": "cost"
				}
			]
		},
		"limit": limit,
		"priority": {
			"policy": [
				{
					"metric": recommendPriority,
					"parameter": [
						{
							"key": recommendKey,
							"val": [
								recommendValue
							]
						}
					],
					"weight": "0.3"
				}
			]
		}
	}

	var optionParamMap = new Map();
	mcpjs["util/pathfinder"].postCommonData('vmspecrecommendassist','RecommendVmSpecList',optionParamMap, obj, recommendVmSpecListCallbackSuccess)
	//mcpjs['util/pathfinder'].getCommonRecommendVmSpecList("vmspecrecommendassist", obj, mcpjs['vmspec/vmspecrecommendassist_modal'].recommendVmSpecListCallbackSuccess )
}


// recommend vm spec 조회 결과 표시
export function recommendVmSpecListCallbackSuccess(caller, result){
	var vmSpecList = result.data.VmSpecList
	table.setData(vmSpecList)
}

// parent로 값 넘기기 : 보통은 map으로하는데 obj로 넘기네...
export function applyAssistValidCheck(){
	var parentsName = $("#parentsRecommendVmSpecAssist").val();

	var specInfo = {};
	var selectedRows = table.getSelectedRows();
	selectedRows.forEach(function(row) {
		var providerId = row.getCell("providerName").getValue();
		var regionName = row.getCell("regionName").getValue();
		var specName = row.getCell("cspSpecName").getValue();
		specInfo = {
			"ProviderId": providerId,
			"RegionName": regionName,
			"SpecName": specName,			
		}
	});

	// var providerId = checked_array[0].providerName;
	// var regionName = checked_array[0].regionName;
	// var specName = checked_array[0].cspSpecName;
	
	// console.log("parentsName", parentsName)
	// console.log("providerId", providerId)
	// console.log("regionName", regionName)
	// console.log("specName : ", specName)

	if( parentsName == "MCIS_EXPRESS"){		
		mcpjs['mcismng/vmconfigureexpress'].setAssistSpecForExpress(specInfo);
	}else if ( parentsName == "MCIS_EXPERT"){
		// 자신의 값을 parent로 돌려 줌.
		mcpjs['mcismng/vmconfigureexpert'].setAssistSpecForExpert(specInfo);            
	}
}