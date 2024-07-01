import { TabulatorFull as Tabulator } from "tabulator-tables";

var returnFunction;// popup인 경우에는 callback function으로 param을 전달해야 한다.
var recommandTable;

var recommandVmSpecListObj = new Object();


export function initServerRecommandation(callbackfunction){
    console.log("initServerRecommandation ")	

    initRecommandSpecTable();

	// return function 정의
	if( callbackfunction != undefined){
        returnFunction = callbackfunction;
    }
}

function initRecommandSpecTable(){
	var tableObjParams = {};

	var columns = [
		{
			formatter: "rowSelection",
			titleFormatter: "rowSelection",
			vertAlign: "middle",
			hozAlign: "center",
			headerHozAlign: "center",
			headerSort: false,
			width: 60,
		},
		{
			title: "connectionName",
			field: "connectionName",
			headerSort: false,
			visible: false
		},
		{
			title: "EVALUATIONSCORE",
			field: "evaluationScore10",
			headerSort: false,
			visible: false
		},
		{
			title: "PROVIDER",
			field: "providerName",
			vertAlign: "middle",
			hozAlign: "center",
			headerHozAlign: "center",
			headerSort: false,
			maxWidth: 100,
		},
		{
			title: "REGION",
			field: "regionName",
			vertAlign: "middle"
		},
		{
			title: "PRICE",
			field: "costPerHour",
			vertAlign: "middle",
			hozAlign: "center",
		},
		{
			title: "MEMORY",
			field: "memoryGiB",
			vertAlign: "middle",
			hozAlign: "center",
			maxWidth: 150,
		},
		{
			title: "VCPU",
			field: "vCPU",
			vertAlign: "middle",
			hozAlign: "center",
			headerHozAlign: "center",
			maxWidth: 135,
		}
	];

	//recommandTable = setSpecTabulator("spec-table", tableObjParams, columns);
    recommandTable = webconsolejs["common/util"].setTabulator("spec-table", tableObjParams, columns);
	
	recommandTable.on("rowSelectionChanged", function (data, rows) {
		console.log("data", data)

		updateSelectedRows(data)
	});

   
}

// function setSpecTabulator(
// 	tableObjId,
// 	tableObjParamMap,
// 	columnsParams,
// 	isMultiSelect
// ) {
// 	var placeholder = "No Data";
// 	var pagination = "local";
// 	var paginationSize = 5;
// 	var paginationSizeSelector = [5, 10, 15, 20];
// 	var movableColumns = true;
// 	var columnHeaderVertAlign = "middle";
// 	var paginationCounter = "rows";
// 	var layout = "fitColumns";

// 	if (tableObjParamMap.hasOwnProperty("placeholder")) {
// 		placeholder = tableObjParamMap.placeholder;
// 	}

// 	if (tableObjParamMap.hasOwnProperty("pagination")) {
// 		pagination = tableObjParamMap.pagination;
// 	}

// 	if (tableObjParamMap.hasOwnProperty("paginationSize")) {
// 		paginationSize = tableObjParamMap.paginationSize;
// 	}

// 	if (tableObjParamMap.hasOwnProperty("paginationSizeSelector")) {
// 		paginationSizeSelector = tableObjParamMap.paginationSizeSelector;
// 	}

// 	if (tableObjParamMap.hasOwnProperty("movableColumns")) {
// 		movableColumns = tableObjParamMap.movableColumns;
// 	}

// 	if (tableObjParamMap.hasOwnProperty("columnHeaderVertAlign")) {
// 		columnHeaderVertAlign = tableObjParamMap.columnHeaderVertAlign;
// 	}

// 	if (tableObjParamMap.hasOwnProperty("paginationCounter")) {
// 		paginationCounter = tableObjParamMap.paginationCounter;
// 	}

// 	if (tableObjParamMap.hasOwnProperty("layout")) {
// 		layout = tableObjParamMap.layout;
// 	}

// 	var tabulatorTable = new Tabulator("#" + tableObjId, {
// 		//ajaxURL:"http://localhost:3000/operations/mcismng?option=status",
// 		placeholder,
// 		pagination,
// 		paginationSize,
// 		paginationSizeSelector,
// 		movableColumns,
// 		columnHeaderVertAlign,
// 		paginationCounter,
// 		layout,
// 		columns: columnsParams,
// 		selectableRows: isMultiSelect == false ? 1 : true,
// 		selectable: true,
// 	});
//     console.log("tabulator Table ", tabulatorTable)
// 	return tabulatorTable;
// }

var recommendSpecs = [];

function updateSelectedRows(data) {
	recommendSpecs = []; // 선택된 행의 데이터를 초기화

	data.forEach(function (rowData) {
		recommendSpecs.push(rowData);
	});

	console.log("선택된 행 데이터:", recommendSpecs);
}

// recommane Vm 조회
export async function getRecommendVmInfo() {
	console.log("in getRecommendVmInfo")

	// var max_cpu = $("#num_vCPU_max").val()
	// var min_cpu = $("#num_vCPU_min").val()
	// var max_mem = $("#num_memory_max").val()
	// var min_mem = $("#num_memory_min").val()
	// var max_cost = $("#num_cost_max").val()
	// var min_cost = $("#num_cost_min").val()
	// var limit = $("#recommendVmLimit").val()
	// var lon = $("#longitude").val()
	// var lat = $("#latitude").val()

	var memoryVal = $("#assist_num_memory").val()
	var cpuVal = $("#assist_num_cpu").val()
	var costVal = $("#assist_num_cost").val()
	var lon = $("#longitude").val()
	var lat = $("#latitude").val()

	var policyArr = new Array();

	if( cpuVal != ""){
		var filterPolicy = {
			"metric": "vCPU",
			"condition" : [
				{
					"operand": cpuVal,
					"operator": "<="
				}
			],
		}
		policyArr.push(filterPolicy)
	}

	if( memoryVal != ""){
		var filterPolicy = {
			"metric": "memoryGiB",
			"condition" : [
				{
					"operand": memoryVal,
					"operator": "<="
				}
			],
		}
		policyArr.push(filterPolicy)
	}
	
	if( costVal != ""){
		var filterPolicy = {
			"metric": "costPerHour",
			"condition" : [
				{
					"operand": costVal,
					"operator": "<="
				}
			],
		}
		policyArr.push(filterPolicy)
	}

	//
	var priorityArr = new Array();

	// location
	var priorityPolicy = {
		"metric": "location",
		"parameter": [
			{
				"key": "coordinateClose",
				"val": [
					lon + "/" + lat
				]
			}
		],
		"weight": "0.3"
	}
	priorityArr.push(priorityPolicy)

	const data = {
		request: {
			"filter": {
				"policy" : policyArr
				// "policy": [
				// 	{
				// 		"condition": [
				// 			{
				// 				"operand": cpuVal,
				// 				"operator": "<="
				// 			}
				// 		],
				// 		"metric": "vCPU"
				// 	},
				// 	{
				// 		"condition": [
				// 			{
				// 				"operand": memoryVal,
				// 				"operator": "<="
				// 			}
				// 		],
				// 		"metric": "memoryGiB"
				// 	},
				// 	{
				// 		"condition": [
				// 			{
				// 				"operand": costVal,
				// 				"operator": "<="
				// 			}
				// 		],
				// 		"metric": "costPerHour"
				// 	}
				// ]
			},
			"limit": "50",
			"priority": {
				"policy" : priorityArr,
				// "policy": [
				// 	{
				// 		"metric": "location",
				// 		"parameter": [
				// 			{
				// 				"key": "coordinateClose",
				// 				"val": [
				// 					lon + "/" + lat
				// 				]
				// 			}
				// 		],
				// 		"weight": "0.3"
				// 	}
				// ]
			}
		}
	}

	// var controller = "/api/" + "mcisrecommendvm";
	// const response = await webconsolejs["common/api/http"].commonAPIPost(
	// 	controller,
	// 	data
	// );

	// console.log("mcisrecommendvm response ", response.data.responseData)

	var respData = await webconsolejs["common/api/services/mcis_api"].mcisRecommendVm(data);
	console.log("respData ", respData)
	//var specList = response.data.responseData
	if( respData.status.code != 200){
		console.log(" e ", respData.status)
		// TODO : Error 표시
		return
	}
	recommandVmSpecListObj = respData.responseData

	recommandTable.setData(recommandVmSpecListObj)

	// getSpecListCallBackSuccess(specList);


	// var max_cpu = $("#num_vCPU_max").val()
	// var min_cpu = $("#num_vCPU_min").val()
	// var max_mem = $("#num_memory_max").val()
	// var min_mem = $("#num_memory_min").val()
	// var max_cost = $("#num_cost_max").val()
	// var min_cost = $("#num_cost_min").val()
	// var limit = $("#recommendVmLimit").val()
	// var lon = $("#longitude").val()
	// var lat = $("#latitude").val()

	// console.log(" lon " + lon + ", lat " + lat)
	// if (lon == "" || lat == "") {
	// 	commonAlert(" 지도에서 위치를 선택하세요 ")
	// 	return;
	// }

	// 	} else {
	// 		var message = result.data.message;
	// 		commonAlert("Fail Create Spec : " + message + "(" + statusCode + ")");

	// 	}

}

// apply 클릭시 데이터 SET
// returnSpecInfo()
export async function applySpecInfo() {
	console.log("array", recommendSpecs)
	var selectedSpecs = recommendSpecs[0]

	// pre-release -> mode = express 고정
	//caller == "express"


	var provider = selectedSpecs.providerName
	var connectionName = selectedSpecs.connectionName
	var specName = selectedSpecs.cspSpecName
	var imageName = await availableVMImageBySpec(selectedSpecs.id)
	var commonSpecId = selectedSpecs.id // common specid for create dynamic mcis

	console.log("commonSpecId", commonSpecId)
	console.log("connectionName", selectedSpecs.connectionName)
	console.log("providerName", selectedSpecs.providerName)
	console.log("cspSpecName", selectedSpecs.cspSpecName)
	console.log("123123123", imageName)

	// $("#ep_provider").val(provider)
	// $("#ep_connectionName").val(connectionName)
	// $("#ep_specId").val(specName)
	// $("#ep_imageId").val(imageName)
	// $("#ep_commonSpecId").val(commonSpecId)
	// commonImage는 availableVMImageBySpec에서 조회 후 설정한다 (두 개 이상일 수 있음)

    var returnObject = {}
    returnObject.provider = provider
    returnObject.connectionName = connectionName
    returnObject.specName = specName
    returnObject.imageName = imageName
    returnObject.commonSpecId = commonSpecId

    console.log("return to parent");
    console.log(returnFunction)
    eval(returnFunction)(returnObject);
	


}

export function showRecommendSpecSetting(value) {
	console.log("Selected coordinate : ", value)
	if (value === "seoul") {
		$("#latitude").val("37.532600")
		$("#longitude").val("127.024612")
	} else if (value === "london") {
		$("#latitude").val("51.509865")
		$("#longitude").val("-0.118092")
	} else if (value === "newyork") {
		$("#latitude").val("40.730610")
		$("#longitude").val("-73.935242")
	}
}


// TODO: 스펙 선택 시 사용가능한 이미지의 개수가 두개 이상일 때 선택하는 UI 추가 구현 필요
async function availableVMImageBySpec(id) {

	var imageIds = []
	var commonimageId = [] // params for create dynamic mcis 

	const data = {
		request: {
			"CommonSpec": [
				id
			]

		}
	}

	var controller = "/api/" + "mcisdynamiccheckrequest";
	const response = await webconsolejs["common/api/http"].commonAPIPost(
		controller,
		data
	);

	// TODO: 스펙 선택 시 사용가능한 이미지의 개수가 두개 이상일 때 선택하는 UI 추가 구현 필요
	// image ID 추출
	response.data.responseData.reqCheck.forEach(function (req) {
		req.image.forEach(function (img) {
			console.log("reqCheckreqCheckreqCheck", img)
			imageIds.push(img.guestOS);
			commonimageId.push(img.id);
		});
	});
	$("#ep_commonImageId").val(commonimageId[0])

	console.log("Image IDs:", imageIds);
	console.log("firstImageId", imageIds[0])
	console.log("commonImageid : ", commonimageId[0])

	return imageIds[0]
}
