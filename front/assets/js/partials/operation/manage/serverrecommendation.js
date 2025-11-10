import { TabulatorFull as Tabulator } from "tabulator-tables";

var returnFunction;// popup인 경우에는 callback function으로 param을 전달해야 한다.
var recommendTable;

var recommendVmSpecListObj = new Object();


export function initServerRecommendation(callbackfunction) {
	initRecommendSpecTable();

	// return function 정의
	if (callbackfunction != undefined) {
		returnFunction = callbackfunction;
	}
	
	// 모달 열기 이벤트 리스너 등록
	setupServerModalEvents();
}

// 서버 추천 모달 이벤트 설정
function setupServerModalEvents() {
	// Bootstrap 5 방식
	if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
		var serverModal = document.getElementById('spec-search');
		if (serverModal) {
			serverModal.addEventListener('shown.bs.modal', function() {
				// 모달이 열렸을 때의 처리
			});
		}
	}
	
	// jQuery 방식
	if (typeof $ !== 'undefined' && $.fn.modal) {
		$("#spec-search").on('shown.bs.modal', function() {
			// 모달이 열렸을 때의 처리
		});
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
			headerSort: true,
			maxWidth: 100,
		},
	{
		title: "REGION",
		field: "regionName",
		vertAlign: "middle"
	},
	{
		title: "SPEC NAME",
		field: "cspSpecName",
		vertAlign: "middle",
		hozAlign: "left",
		minWidth: 200,
		headerSort: true,
		tooltip: true
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
		maxWidth: 80,
	}
	];

	//recommendTable = setSpecTabulator("spec-table", tableObjParams, columns);
	recommendTable = webconsolejs["common/util"].setTabulator("spec-table", tableObjParams, columns);
	window.recommendTable = recommendTable; // window 객체에 할당

	recommendTable.on("rowSelectionChanged", function (data, rows) {

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
// 		//ajaxURL:"http://localhost:3000/operations/mcimng?option=status",
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

}

// recommened Vm 조회
export async function getRecommendVmInfo() {

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
				alert("Maximum value is less than minimum value.")
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
				alert("Maximum value is less than minimum value.")
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

	// Architecture 필터링 추가
	var architectureVal = $("#assist_architecture").val()
	if (architectureVal != "") {
		var filterPolicy = {
			"condition": [
				{
					"operand": architectureVal
				}
			],
			"metric": "architecture"
		}
		policyArr.push(filterPolicy)
	}

	if (cpuMinVal != "" || cpuMaxVal != "") {

		if (cpuMaxVal != "" && cpuMaxVal < cpuMinVal) {
			alert("Maximum value is less than minimum value.")
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
			alert("Maximum value is less than minimum value.")
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
			alert("Maximum value is less than minimum value.")
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
	const data = {
		request: {
			"filter": {
				"policy": policyArr
			},
			"limit": "1000",
			"priority": {
				"policy": priorityArr,
			}
		}
	}
	
	var respData = await webconsolejs["common/api/services/mci_api"].mciRecommendVm(data);
	//var specList = response.data.responseData
	if (respData.status.code != 200) {
		console.error(e)
		// TODO : Error 표시
		return
	}
	recommendVmSpecListObj = respData.responseData	
	recommendTable.setData(recommendVmSpecListObj)

}

// apply 클릭시 데이터 SET
// returnSpecInfo()
export async function applySpecInfo() {
	var selectedSpecs = recommendSpecs[0]

	// pre-release -> mode = express 고정
	//caller == "express"

	var provider = selectedSpecs.providerName
	var connectionName = selectedSpecs.connectionName
	var specName = selectedSpecs.cspSpecName
	var commonSpecId = selectedSpecs.id // common specid for create dynamic mci
	
	// spec 정보에서 osArchitecture 추출
	var osArchitecture = "x86_64"; // 기본값
	
	// API 응답에서 architecture 정보 추출
	if (selectedSpecs.architecture) {
		osArchitecture = selectedSpecs.architecture;
	} else if (selectedSpecs.keyValueList) {
		// keyValueList에서 architecture 정보 찾기
		for (var i = 0; i < selectedSpecs.keyValueList.length; i++) {
			var kv = selectedSpecs.keyValueList[i];
			if (kv.key === "CpuArchitecture" || kv.key === "CpuArchitectureType" || kv.key === "Architecture") {
				osArchitecture = kv.value;
				break;
			}
		}
	} else {
		console.error("No architecture information found in spec data");
	}
	
	// 부모 폼에 전달할 데이터 객체 생성
	var returnObject = {}
	returnObject.provider = provider
	returnObject.connectionName = connectionName
	returnObject.specName = specName
	returnObject.commonSpecId = commonSpecId
	returnObject.osArchitecture = osArchitecture
	returnObject.regionName = selectedSpecs.regionName

	eval(returnFunction)(returnObject);
	

}

export function showRecommendSpecSetting(value) {
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
// 이미지 추천 모달로 대체되었으므로 주석 처리
/*
async function availableVMImageBySpec(id) {

	var imageIds = []
	var commonimageId = [] // params for create dynamic mci 

	const data = {
		request: {
			"commonSpec": [
				id
			]

		}
	}

	var controller = "/api/" + "mc-infra-manager/" +"Postmcidynamiccheckrequest";
	const response = await webconsolejs["common/api/http"].commonAPIPost(
		controller,
		data
	);

	// TODO: 스펙 선택 시 사용가능한 이미지의 개수가 두개 이상일 때 선택하는 UI 추가 구현 필요
	// image ID 추출
	response.data.responseData.reqCheck.forEach(function (req) {
		req.image.forEach(function (img) {
			imageIds.push(img.guestOS);
			commonimageId.push(img.id);
		});
	});

	// TODO : dynamiccheckrequest api 오류 : 20.04 이미지는 spider에서 제공하지 않음
	// 임시로 3번 째 22.04 사용중

	// $("#ep_commonImageId").val(commonimageId[0])
	$("#ep_commonImageId").val(commonimageId[2])

	console.log("Image IDs:", imageIds);
	console.log("firstImageId", imageIds[0])
	console.log("commonImageid : ", commonimageId[0])

	return imageIds[0]
}
*/

// 프로바이더별 필터링 기능
export function filterByProvider(provider) {
	
	if (!recommendVmSpecListObj || recommendVmSpecListObj.length === 0) {
		console.error("No data to filter - no search results available");
		return;
	}
	
	if (provider === "") {
		// 모든 프로바이더 표시
		recommendTable.setData(recommendVmSpecListObj);
	} else {
		// 선택된 프로바이더만 필터링
		var filteredData = recommendVmSpecListObj.filter(function(item) {
			return item.providerName && item.providerName.toLowerCase() === provider.toLowerCase();
		});
		recommendTable.setData(filteredData);
	}
}

// 전역 객체에 함수 등록
if (typeof webconsolejs === 'undefined') {
	webconsolejs = {};
}
if (typeof webconsolejs['partials/operation/manage/serverrecommendation'] === 'undefined') {
	webconsolejs['partials/operation/manage/serverrecommendation'] = {};
}

webconsolejs['partials/operation/manage/serverrecommendation'].initServerRecommendation = initServerRecommendation;
webconsolejs['partials/operation/manage/serverrecommendation'].getRecommendVmInfo = getRecommendVmInfo;
webconsolejs['partials/operation/manage/serverrecommendation'].applySpecInfo = applySpecInfo;
webconsolejs['partials/operation/manage/serverrecommendation'].showRecommendSpecSetting = showRecommendSpecSetting;
webconsolejs['partials/operation/manage/serverrecommendation'].filterByProvider = filterByProvider;
