import { TabulatorFull as Tabulator } from "tabulator-tables";

var returnFunction;// popup인 경우에는 callback function으로 param을 전달해야 한다.
var recommendTable;

var recommendVmSpecListObj = new Object();


export function initServerRecommendation(callbackfunction) {
	console.log("initServerRecommendation ")

	initRecommendSpecTable();

	// return function 정의
	if (callbackfunction != undefined) {
		returnFunction = callbackfunction;
	}
}

function initRecommendSpecTable() {
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

	//recommendTable = setSpecTabulator("spec-table", tableObjParams, columns);
	recommendTable = webconsolejs["common/util"].setTabulator("spec-table", tableObjParams, columns);

	recommendTable.on("rowSelectionChanged", function (data, rows) {
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

// recommened Vm 조회
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

	var memoryMinVal = $("#assist_min_memory").val()
	var memoryMaxVal = $("#assist_max_memory").val()

	var cpuMinVal = $("#assist_min_cpu").val()
	var cpuMaxVal = $("#assist_max_cpu").val()

	var costMinVal = $("#assist_min_cost").val()
	var costMaxVal = $("#assist_max_cost").val()

	var lon = $("#longitude").val()
	var lat = $("#latitude").val()

	var acceleratorType = $("#assist_accelerator_type").val()
	var acceleratorModel = $("#assist_gpu_model").val()
	var acceleratorCountMin = $("#assist_gpu_count_min").val()
	var acceleratorCountMax = $("#assist_gpu_count_max").val()
	var acceleratorMemoryMin = $("#assist_gpu_memory_min").val()
	var acceleratorMemoryMax = $("#assist_gpu_memory_max").val()
	console.log("acceleratorType", acceleratorType)
	console.log("acceleratorType", lon)

	var policyArr = new Array();
	//TODO type이 추가 정의되면 type별 분기 추가
	if (acceleratorType != "") {
		var filterPolicy = {

			"condition": [
				{
					"operand": acceleratorType
				}
			],
			"metric": "acceleratorType"
		}
		policyArr.push(filterPolicy)

		if (acceleratorCountMin != "" || acceleratorCountMax != "") {

			if (acceleratorCountMax != "" && acceleratorCountMax < acceleratorCountMin) {
				alert("최대값이 최소값보다 작습니다.")
			}

			if (acceleratorCountMin === "") {
				acceleratorCountMin = "0";
			}

			if (acceleratorCountMax === "") {
				acceleratorCountMax = "0";
			}

			var filterPolicy = {

				"condition": [
					{
						"operand": acceleratorCountMax,
						"operator": "<="
					},
					{
						"operand": acceleratorCountMin,
						"operator": ">="
					}
				],
				"metric": "acceleratorCount",
			}
			policyArr.push(filterPolicy)
		}

		if (acceleratorMemoryMin != "" || acceleratorMemoryMax != "") {

			if (acceleratorMemoryMax != "" && acceleratorMemoryMax < acceleratorMemoryMin) {
				alert("최대값이 최소값보다 작습니다.")
			}

			if (acceleratorMemoryMin === "") {
				acceleratorMemoryMin = "0";
			}

			if (acceleratorMemoryMax === "") {
				acceleratorMemoryMax = "0";
			}
			var filterPolicy = {

				"condition": [
					{
						"operand": acceleratorMemoryMax,
						"operator": "<=",
					},
					{
						"operand": acceleratorMemoryMin,
						"operator": ">=",
					}
				],
				"metric": "acceleratorMemoryGB",
			}
			policyArr.push(filterPolicy)
		}
	}

	if (acceleratorModel != "") {
		var filterPolicy = {

			"condition": [
				{
					"operand": acceleratorModel
				}
			],
			"metric": "acceleratorModel"
		}
		policyArr.push(filterPolicy)
	}

	if (cpuMinVal != "" || cpuMaxVal != "") {

		if (cpuMaxVal != "" && cpuMaxVal < cpuMinVal) {
			console.log("cpuMaxVal",cpuMaxVal)
			alert("최대값이 최소값보다 작습니다.")
		}

		if (cpuMinVal === "") {
			cpuMinVal = "0";
		}

		if (cpuMaxVal === "") {
			cpuMaxVal = "0";
		}
		var filterPolicy = {

			"condition": [
				{
					"operand": cpuMaxVal,
					"operator": "<="
				},
				{
					"operand": cpuMinVal,
					"operator": ">="
				}
			],
			"metric": "vCPU",
		}
		policyArr.push(filterPolicy)
	}

	if (memoryMinVal != "" || memoryMaxVal != "") {

		if (memoryMaxVal != "" && memoryMaxVal < memoryMinVal) {
			alert("최대값이 최소값보다 작습니다.")
		}

		if (memoryMinVal === "") {
			memoryMinVal = "0";
		}

		if (memoryMaxVal === "") {
			memoryMaxVal = "0";
		}
		var filterPolicy = {

			"condition": [
				{
					"operand": memoryMaxVal,
					"operator": "<="
				},
				{
					"operand": memoryMinVal,
					"operator": ">="
				}
			],
			"metric": "memoryGiB",
		}
		policyArr.push(filterPolicy)
	}

	if (costMinVal != "" || costMaxVal != "") {

		if (costMaxVal != "" && costMaxVal < costMinVal) {
			alert("최대값이 최소값보다 작습니다.")
		}

		if (costMinVal === "") {
			costMinVal = "0";
		}

		if (costMaxVal === "") {
			costMaxVal = "0";
		}
		var filterPolicy = {

			"condition": [
				{
					"operand": costMaxVal,
					"operator": "<="
				},
				{
					"operand": costMinVal,
					"operator": ">="
				}
			],
			"metric": "costPerHour",
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
					lat + "/" + lon
				]
			}
		],
		"weight": "0.3"
	}
	priorityArr.push(priorityPolicy)
	console.log("policyArr", priorityArr)
	const data = {
		request: {
			"filter": {
				"policy": policyArr
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
			"limit": "400",
			"priority": {
				"policy": priorityArr,
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
	if (respData.status.code != 200) {
		console.log(" e ", respData.status)
		// TODO : Error 표시
		return
	}
	recommendVmSpecListObj = respData.responseData

	recommendTable.setData(recommendVmSpecListObj)

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
