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

	// 팝업 열릴 때마다 선택된 provider를 배지에 표시
	const modalEl = document.getElementById('spec-search-pmk');
	if (modalEl) {
		modalEl.addEventListener('shown.bs.modal', function () {
			const provider = document.getElementById('cluster_provider_dynamic')?.value
				|| document.getElementById('cluster_provider')?.value
				|| webconsolejs["pages/operation/manage/k8sworkloads"]?.selectedPmkObj?.[0]?.provider
				|| '';
			const badge = document.getElementById('spec-provider-badge-pmk');
			const hidden = document.getElementById('spec-provider-value-pmk');
			if (badge) badge.textContent = provider;
			if (hidden) hidden.value = provider;

			// 선택된 Connection도 함께 잡아둔다. providerName으로만 거르면 같은 CSP의
			// 다른 리전 스펙까지 섞여 나와(예: nhn → jp1/kr1/kr2), 그 스펙을 고르면
			// 클러스터 Connection과 어긋나 cb-tumblebug이 400으로 거부한다.
			const connection = document.getElementById('cluster_cloudconnection_dynamic')?.value
				|| document.getElementById('cluster_cloudconnection')?.value
				|| webconsolejs["pages/operation/manage/k8sworkloads"]?.selectedPmkObj?.[0]?.connectionName
				|| '';
			const connHidden = document.getElementById('spec-connection-value-pmk');
			if (connHidden) connHidden.value = connection;
		});
	}
}

// 값이 없거나 0/-1인 숫자 필드는 "-"로 표시
function dashIfEmpty(cell) {
	var v = cell.getValue();
	if (v === undefined || v === null || v === "" || v === 0 || v === -1) {
		return "-";
	}
	return v;
}

function initRecommendSpecTablePmk() {
	// MCI용(serverrecommendation.js)과 동일 — fitColumns는 가로 스크롤이 생기지 않아 fitData로 전환
	var tableObjParams = {
		layout: "fitData",
	};

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
		vertAlign: "middle",
		minWidth: 140,
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
	},
	{
		title: "ARCHITECTURE",
		field: "architecture",
		vertAlign: "middle",
		hozAlign: "center",
		formatter: dashIfEmpty,
	},
	{
		title: "DISK (GB)",
		field: "diskSizeGB",
		vertAlign: "middle",
		hozAlign: "center",
		formatter: dashIfEmpty,
	},
	{
		title: "ROOT DISK",
		field: "rootDiskType",
		vertAlign: "middle",
		hozAlign: "center",
		formatter: function (cell) {
			var row = cell.getRow().getData();
			var type = row.rootDiskType;
			var size = row.rootDiskSize;
			if (!type && (!size || size <= 0)) {
				return "-";
			}
			if (size && size > 0) {
				return (type ? type + " " : "") + size + " GB";
			}
			return type;
		},
	},
	{
		title: "NET BW (Gbps)",
		field: "netBwGbps",
		vertAlign: "middle",
		hozAlign: "center",
		formatter: dashIfEmpty,
	},
	{
		title: "GPU",
		field: "acceleratorModel",
		vertAlign: "middle",
		hozAlign: "center",
		formatter: function (cell) {
			var row = cell.getRow().getData();
			var model = row.acceleratorModel;
			if (!model || model === "NA" || row.acceleratorType === "") {
				return "-";
			}
			var count = row.acceleratorCount;
			return count && count > 1 ? model + " x" + count : model;
		},
	},
	{
		title: "GPU MEM (GB)",
		field: "acceleratorMemoryGB",
		vertAlign: "middle",
		hozAlign: "center",
		formatter: dashIfEmpty,
	},
	{
		title: "SCORE",
		field: "evaluationScore10",
		vertAlign: "middle",
		hozAlign: "center",
	}
	];

	const tableElement = document.getElementById("spec-table-pmk");
	
	if (!tableElement) {
		console.error("Could not find spec-table-pmk element!");
		return;
	}
	
	// applySpecInfoPmk()은 항상 recommendSpecsPmk[0]만 사용하므로 단일 선택으로 강제한다.
	// 다중 선택 상태로 두면 이전에 체크된 행이 재검색/재선택 후에도 남아있어 Apply가 옛 spec을 다시 적용하는 결함이 생긴다.
	recommendTablePmk = webconsolejs["common/util"].setTabulator("spec-table-pmk", tableObjParams, columns, false);

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

		// Connection이 정해져 있으면 connectionName으로 거른다 — provider만으로 거르면
		// 같은 CSP의 다른 리전 스펙이 섞여 나온다(nhn → nhn-jp1/nhn-kr1/nhn-kr2 혼재).
		// Connection이 아직 없을 때만 provider로 폴백한다.
		const selectedConnection = document.getElementById('spec-connection-value-pmk')?.value;
		const selectedProvider = document.getElementById('spec-provider-value-pmk')?.value;
		if (selectedConnection) {
			policyArr.push({
				"metric": "connectionName",
				"condition": [{ "operator": "==", "operand": selectedConnection }]
			});
		} else if (selectedProvider) {
			policyArr.push({
				"metric": "providerName",
				"condition": [{ "operator": "==", "operand": selectedProvider }]
			});
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
				weight: 0.3
			});

		}
		
		// API 요청 데이터 구성
		const data = {
			request: {
				filter: {
					policy: policyArr
				},
				limit: 1000,
				priority: {
					policy: priorityArr
				}
			}
		};
		
		const loadingEl = document.getElementById('spec-search-loading-pmk');
		if (loadingEl) loadingEl.style.display = 'block';
		try {
			// PMK용 Spec 추천 API 호출 (기존 MCI API 사용)
			const result = await webconsolejs["common/api/services/infra_api"].mciRecommendVm(data);

			if (result && result.status && result.status.code === 200) {
				const specData = result.responseData;

				// 전역 변수에 데이터 저장 (필터링용)
				recommendVmSpecListObjPmk = specData;

				// 테이블에 데이터 표시 (기존 MCI 방식과 동일)
				if (specData && specData.length > 0) {
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
		} finally {
			if (loadingEl) loadingEl.style.display = 'none';
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
if (typeof webconsolejs['partials/operation/manage/k8s_serverrecommendation'] === 'undefined') {
	webconsolejs['partials/operation/manage/k8s_serverrecommendation'] = {};
}

// 함수들을 조건부로 등록
if (!webconsolejs['partials/operation/manage/k8s_serverrecommendation'].initServerRecommendationPmk) {
	webconsolejs['partials/operation/manage/k8s_serverrecommendation'].initServerRecommendationPmk = initServerRecommendationPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_serverrecommendation'].getRecommendVmInfoPmk) {
	webconsolejs['partials/operation/manage/k8s_serverrecommendation'].getRecommendVmInfoPmk = getRecommendVmInfoPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_serverrecommendation'].applySpecInfoPmk) {
	webconsolejs['partials/operation/manage/k8s_serverrecommendation'].applySpecInfoPmk = applySpecInfoPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_serverrecommendation'].showRecommendSpecSettingPmk) {
	webconsolejs['partials/operation/manage/k8s_serverrecommendation'].showRecommendSpecSettingPmk = showRecommendSpecSettingPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_serverrecommendation'].filterByProviderPmk) {
	webconsolejs['partials/operation/manage/k8s_serverrecommendation'].filterByProviderPmk = filterByProviderPmk;
} 