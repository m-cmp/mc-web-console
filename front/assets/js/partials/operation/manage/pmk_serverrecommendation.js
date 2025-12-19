import { TabulatorFull as Tabulator } from "tabulator-tables";

var returnFunctionPmk;// popup인 경우에는 callback function으로 param을 전달해야 한다.
var recommendTablePmk;

var recommendVmSpecListObjPmk = new Object();

export function initServerRecommendationPmk(callbackfunction) {
	// MCI용과 동일하게 단순하게 처리
	initRecommendSpecTablePmk();

	// return function 정의
	if (callbackfunction != undefined) {
		returnFunctionPmk = callbackfunction;
	}
	
	// 모달 열기 이벤트 리스너 등록
	setupServerModalEventsPmk();
}

// PMK용 서버 추천 모달 이벤트 설정
function setupServerModalEventsPmk() {
	// Provider 옵션은 HTML partial component로 이미 렌더링됨
	// 추가 초기화가 필요한 경우 여기에 작성
}

function initRecommendSpecTablePmk() {
	var tableObjParams = {}; // MCI용과 동일하게 빈 객체 사용

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

	const tableElement = document.getElementById("spec-table-pmk");
	
	if (!tableElement) {
		console.error("Could not find spec-table-pmk element!");
		return;
	}
	
	recommendTablePmk = webconsolejs["common/util"].setTabulator("spec-table-pmk", tableObjParams, columns);

	recommendTablePmk.on("rowSelectionChanged", function (data, rows) {
		updateSelectedRowsPmk(data)
	});
}

var recommendSpecsPmk = [];

function updateSelectedRowsPmk(data) {
	recommendSpecsPmk = []; // 선택된 행의 데이터를 초기화

	data.forEach(function (rowData) {
		recommendSpecsPmk.push(rowData);
	});
}

// PMK용 recommened Vm 조회
export async function getRecommendVmInfoPmk() {
	try {
		const selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
		const selectedNsId = selectedWorkspaceProject.nsId;
		
		// PMK 최소 요구사항 (Kubernetes 권장 사양)
		// Min vCPU: 4, Min Memory: 16GB, Disk: 100GB
		const PMK_MIN_VCPU = 4;
		const PMK_MIN_MEMORY = 16;
		
		// 기본 필터링 조건 설정 (최소 요구사항 적용)
		const memoryMinVal = $("#assist_min_memory-pmk").val() || "";
		const memoryMaxVal = $("#assist_max_memory-pmk").val() || "";
		const cpuMinVal = $("#assist_min_cpu-pmk").val() || "";
		const cpuMaxVal = $("#assist_max_cpu-pmk").val() || "";
		const costMinVal = $("#assist_min_cost-pmk").val() || "";
		const costMaxVal = $("#assist_max_cost-pmk").val() || "";
		const lon = $("#longitude-pmk").val() || "";
		const lat = $("#latitude-pmk").val() || "";
		
		// 필터 정책 배열 생성
		const policyArr = [];
		
		// CPU 필터 (최소 4 vCPU 보장)
		if (cpuMinVal !== "" || cpuMaxVal !== "") {
			if (cpuMaxVal !== "" && cpuMaxVal < cpuMinVal) {
				alert("Maximum value is less than the minimum value.");
				return;
			}
			
			// 사용자 입력값과 PMK 최소값 중 큰 값 사용
			const cpuMin = Math.max(cpuMinVal === "" ? PMK_MIN_VCPU : parseInt(cpuMinVal), PMK_MIN_VCPU).toString();
			const cpuMax = cpuMaxVal === "" ? "0" : cpuMaxVal;
			
			policyArr.push({
				condition: [
					{ operand: cpuMax, operator: "<=" },
					{ operand: cpuMin, operator: ">=" }
				],
				metric: "vCPU"
			});
		} else {
			// 사용자 입력이 없으면 PMK 최소 요구사항 적용
			policyArr.push({
				condition: [
					{ operand: "0", operator: "<=" },
					{ operand: PMK_MIN_VCPU.toString(), operator: ">=" }
				],
				metric: "vCPU"
			});
		}
		
		// Memory 필터 (최소 16GB 보장)
		if (memoryMinVal !== "" || memoryMaxVal !== "") {
			if (memoryMaxVal !== "" && memoryMaxVal < memoryMinVal) {
				alert("Maximum value is less than the minimum value.");
				return;
			}
			
			// 사용자 입력값과 PMK 최소값 중 큰 값 사용
			const memoryMin = Math.max(memoryMinVal === "" ? PMK_MIN_MEMORY : parseInt(memoryMinVal), PMK_MIN_MEMORY).toString();
			const memoryMax = memoryMaxVal === "" ? "0" : memoryMaxVal;
			
			policyArr.push({
				condition: [
					{ operand: memoryMax, operator: "<=" },
					{ operand: memoryMin, operator: ">=" }
				],
				metric: "memoryGiB"
			});
		} else {
			// 사용자 입력이 없으면 PMK 최소 요구사항 적용
			policyArr.push({
				condition: [
					{ operand: "0", operator: "<=" },
					{ operand: PMK_MIN_MEMORY.toString(), operator: ">=" }
				],
				metric: "memoryGiB"
			});
		}
		
		// Cost 필터
		if (costMinVal !== "" || costMaxVal !== "") {
			if (costMaxVal !== "" && costMaxVal < costMinVal) {
				alert("Maximum value is less than the minimum value.");
				return;
			}
			
			const costMin = costMinVal === "" ? "0" : costMinVal;
			const costMax = costMaxVal === "" ? "0" : costMaxVal;
			
			policyArr.push({
				condition: [
					{ operand: costMax, operator: "<=" },
					{ operand: costMin, operator: ">=" }
				],
				metric: "costPerHour"
			});

		}
		
		// Architecture 필터링 추가
		var architectureVal = $("#assist_architecture-pmk").val()
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
		
		// 우선순위 정책 설정
		const priorityArr = [];
		if (lat && lon) {
			priorityArr.push({
				metric: "location",
				parameter: [{
					key: "coordinateClose",
					val: [lat + "/" + lon]
				}],
				weight: "0.3"
			});

		}
		
		// API 요청 데이터 구성
		const data = {
			request: {
				filter: {
					policy: policyArr
				},
				limit: "1000",
				priority: {
					policy: priorityArr
				}
			}
		};
		
		// PMK용 Spec 추천 API 호출 (기존 MCI API 사용)
		const result = await webconsolejs["common/api/services/mci_api"].mciRecommendVm(data);
		
		if (result && result.status && result.status.code === 200) {
			const specData = result.responseData;
			
			// 전역 변수에 데이터 저장 (필터링용)
			recommendVmSpecListObjPmk = specData;
			
			// 테이블에 데이터 표시 (기존 MCI 방식과 동일)
			if (specData && specData.length > 0) {
				// 테이블이 존재하는지 확인
				if (recommendTablePmk && typeof recommendTablePmk.setData === 'function') {
					recommendTablePmk.setData(specData);
				}
			} else {
				if (recommendTablePmk && typeof recommendTablePmk.setData === 'function') {
					recommendTablePmk.setData([]);
				}
			}
		} else {
			console.error("Failed to call PMK Spec recommendation API:", result);
			recommendVmSpecListObjPmk = [];
			if (recommendTablePmk && typeof recommendTablePmk.setData === 'function') {
				recommendTablePmk.setData([]);
			}
		}
		
	} catch (error) {
		console.error("Failed to recommend PMK spec:", error);
		recommendVmSpecListObjPmk = [];
		if (recommendTablePmk && typeof recommendTablePmk.setData === 'function') {
			recommendTablePmk.setData([]);
		}
	}
}

// PMK용 apply 클릭시 데이터 SET
export async function applySpecInfoPmk() {
	if (recommendSpecsPmk.length === 0) {
		console.warn("No PMK spec selected");
		alert("Please select a spec first.");
		return;
	}
	
	var selectedSpecs = recommendSpecsPmk[0]; // 첫 번째 선택된 spec 사용

	var provider = selectedSpecs.providerName;
	var connectionName = selectedSpecs.connectionName;
	var specName = selectedSpecs.cspSpecName;
	var commonSpecId = selectedSpecs.id; // common specid for create dynamic mci

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
	}

	// 부모 폼에 전달할 데이터 객체 생성
	var returnObject = {}
	returnObject.provider = provider
	returnObject.connectionName = connectionName
	returnObject.specName = specName
	returnObject.commonSpecId = commonSpecId
	returnObject.osArchitecture = osArchitecture
	returnObject.regionName = selectedSpecs.regionName
	
	if (returnFunctionPmk) {
		eval(returnFunctionPmk)(returnObject);
	}
}

export function showRecommendSpecSettingPmk(value) {
	if (value === "seoul") {
		$("#latitude-pmk").val("37.532600")
		$("#longitude-pmk").val("127.024612")
	} else if (value === "london") {
		$("#latitude-pmk").val("51.509865")
		$("#longitude-pmk").val("-0.118092")
	} else if (value === "newyork") {
		$("#latitude-pmk").val("40.730610")
		$("#longitude-pmk").val("-73.935242")
	}
}

// PMK용 프로바이더별 필터링 기능
export function filterByProviderPmk(provider) {
	if (!recommendVmSpecListObjPmk || recommendVmSpecListObjPmk.length === 0) {
		return;
	}
	
	if (!recommendTablePmk || typeof recommendTablePmk.setData !== 'function') {
		console.error("PMK spec table is not initialized.");
		return;
	}
	
	if (provider === "") {
		// 모든 프로바이더 표시
		recommendTablePmk.setData(recommendVmSpecListObjPmk);
	} else {
		// 선택된 프로바이더만 필터링
		var filteredData = recommendVmSpecListObjPmk.filter(function(item) {
			return item.providerName && item.providerName.toLowerCase() === provider.toLowerCase();
		});
		recommendTablePmk.setData(filteredData);
	}
}

// 전역 객체에 함수 등록 (필요시에만)
if (typeof webconsolejs === 'undefined') {
	webconsolejs = {};
}
if (typeof webconsolejs['partials/operation/manage/pmk_serverrecommendation'] === 'undefined') {
	webconsolejs['partials/operation/manage/pmk_serverrecommendation'] = {};
}

// 함수들을 조건부로 등록
if (!webconsolejs['partials/operation/manage/pmk_serverrecommendation'].initServerRecommendationPmk) {
	webconsolejs['partials/operation/manage/pmk_serverrecommendation'].initServerRecommendationPmk = initServerRecommendationPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_serverrecommendation'].getRecommendVmInfoPmk) {
	webconsolejs['partials/operation/manage/pmk_serverrecommendation'].getRecommendVmInfoPmk = getRecommendVmInfoPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_serverrecommendation'].applySpecInfoPmk) {
	webconsolejs['partials/operation/manage/pmk_serverrecommendation'].applySpecInfoPmk = applySpecInfoPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_serverrecommendation'].showRecommendSpecSettingPmk) {
	webconsolejs['partials/operation/manage/pmk_serverrecommendation'].showRecommendSpecSettingPmk = showRecommendSpecSettingPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_serverrecommendation'].filterByProviderPmk) {
	webconsolejs['partials/operation/manage/pmk_serverrecommendation'].filterByProviderPmk = filterByProviderPmk;
} 