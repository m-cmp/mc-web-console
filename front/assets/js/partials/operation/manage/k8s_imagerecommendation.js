import { TabulatorFull as Tabulator } from "tabulator-tables";

var returnFunctionPmk;// popup인 경우에는 callback function으로 param을 전달해야 한다.
var recommendImageTablePmk;
var imageSelectionCallbackPmk;// 이미지 선택 시 호출될 콜백 함수

var recommendImageListObjPmk = new Object();
var selectedSpecInfoPmk = null; // 선택된 spec 정보

export function initImageRecommendationPmk(callbackfunction) {
	initRecommendImageTablePmk();

	// return function 정의
	if (callbackfunction != undefined) {
		returnFunctionPmk = callbackfunction;
	}
}

// PMK용 모달이 열릴 때 테이블 초기화
export function initImageModalPmk() {
	// 모달 요소 확인
	var imageModal = document.getElementById('image-search-pmk');
	if (!imageModal) {
		console.error("Could not find PMK Image modal element!");
		return;
	}
	
	// 초기 테이블 초기화만 수행 (필드 설정은 Apply 시점에 미리 완료됨)
	initRecommendImageTablePmk();

	// spec을 바꾼 뒤 모달을 다시 열면 이전 spec으로 조회했던 결과가 그대로 남아있던 결함 수정.
	// 모달이 열릴 때마다 결과 테이블을 비워, 사용자가 다시 Search를 눌러야 현재 spec 기준 결과가 보이게 한다.
	imageModal.addEventListener('shown.bs.modal', function () {
		recommendImageListObjPmk = [];
		if (recommendImageTablePmk && typeof recommendImageTablePmk.setData === 'function') {
			recommendImageTablePmk.setData([]);
		}
	});
}



// PMK용 OS Type 드롭다운 토글 함수
export function toggleOSDropdownPmk() {
	// Bootstrap 드롭다운이 자동으로 처리하므로 별도 로직 불필요
}

// PMK용 OS Type 선택 함수
export function selectOSTypePmk(osType) {
	$("#assist_os_type-pmk").val(osType);
	
	// 드롭다운 닫기
	var dropdown = document.getElementById('os-type-dropdown-pmk');
	if (dropdown) {
		var dropdownInstance = bootstrap.Dropdown.getInstance(dropdown);
		if (dropdownInstance) {
			dropdownInstance.hide();
		}
	}
}

// PMK용 GPU 토글 상태 업데이트 함수
export function updateGPUStatusPmk() {
	var gpuCheckbox = document.getElementById('assist_gpu_image-pmk');
	var gpuValue = document.getElementById('gpu_image_value-pmk');

	if (gpuCheckbox.checked) {
		gpuValue.value = 'true';
	} else {
		gpuValue.value = 'false';
	}
}

export function updateK8sStatusPmk() {
	var k8sCheckbox = document.getElementById('assist_k8s_image-pmk');
	var k8sValue = document.getElementById('k8s_image_value-pmk');

	if (k8sCheckbox.checked) {
		k8sValue.value = 'true';
	} else {
		k8sValue.value = 'false';
	}
}

function initRecommendImageTablePmk() {
	// 기존 테이블이 있으면 제거
	if (recommendImageTablePmk) {
		recommendImageTablePmk.destroy();
	}
	
	var tableObjParams = {
		layout: "fitDataFill",
		placeholder: "No data available",
		// 기본 5건은 너무 적다 — CSP에 따라 수십 건이 나와 원하는 이미지가 뒤 페이지로 밀린다
		// (NHN kr1은 38건 → 기본값이면 8페이지). 하단 셀렉터(5/10/15/20)로 더 늘릴 수 있다.
		paginationSize: 10
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
			title: "BASIC",
			field: "isBasicImage",
			headerFilter: "tickCross",
			headerFilterParams: { tristate: true },
			headerFilterEmptyCheck: function (value) { return value === null; },
			vertAlign: "middle",
			hozAlign: "center",
			maxWidth: 100,
			headerSort: true,
			formatter: function(cell) {
				var value = cell.getValue();
				if (value === true) {
					return '<span style="color: green; font-weight: bold;">✓</span>';
				} else {
					return '<span style="color: gray;">-</span>';
				}
			}
		},
		{
			title: "OS TYPE",
			field: "osType",
			headerFilter: "input",
			vertAlign: "middle",
			hozAlign: "center",
			minWidth: 120,
			headerSort: true,
		},
		{
			title: "IMAGE NAME",
			field: "name",
			headerFilter: "input",
			vertAlign: "middle",
			hozAlign: "left",
			minWidth: 180,
			headerSort: true,
		},
		{
			title: "OS DISTRIBUTION",
			field: "osDistribution",
			headerFilter: "input",
			vertAlign: "middle",
			hozAlign: "left",
			minWidth: 300,
			tooltip: true,
			headerSort: true,
		},
		{
			title: "GPU",
			field: "isGPUImage",
			headerFilter: "tickCross",
			headerFilterParams: { tristate: true },
			headerFilterEmptyCheck: function (value) { return value === null; },
			vertAlign: "middle",
			hozAlign: "center",
			maxWidth: 80,
			headerSort: true,
			formatter: function(cell) {
				var value = cell.getValue();
				if (value === true) {
					return '<span style="color: blue; font-weight: bold;">✓</span>';
				} else {
					return '<span style="color: gray;">-</span>';
				}
			}
		},
		{
			title: "K8S",
			field: "isKubernetesImage",
			headerFilter: "tickCross",
			headerFilterParams: { tristate: true },
			headerFilterEmptyCheck: function (value) { return value === null; },
			vertAlign: "middle",
			hozAlign: "center",
			maxWidth: 80,
			headerSort: true,
			formatter: function(cell) {
				var value = cell.getValue();
				if (value === true) {
					return '<span style="color: purple; font-weight: bold;">✓</span>';
				} else {
					return '<span style="color: gray;">-</span>';
				}
			}
		}
	];

	// applyImageInfoPmk()은 항상 recommendImagesPmk[0]만 사용하므로 단일 선택으로 강제한다.
	// 다중 선택 상태로 두면 이전에 체크된 행이 재검색/재선택 후에도 남아있어 Apply가 옛 이미지를 다시 적용하는 결함이 생긴다.
	recommendImageTablePmk = webconsolejs["common/util"].setTabulator("image-table-pmk", tableObjParams, columns, false);
	
	recommendImageTablePmk.on("rowSelectionChanged", function (data, rows) {
		updateSelectedImageRowsPmk(data)
	});
}

var recommendImagesPmk = [];

function updateSelectedImageRowsPmk(data) {
	recommendImagesPmk = []; // 선택된 행의 데이터를 초기화

	data.forEach(function (rowData) {
		recommendImagesPmk.push(rowData);
	});


}

// PMK용 이미지 선택 콜백 함수 설정
export function setImageSelectionCallbackPmk(callback) {
	imageSelectionCallbackPmk = callback;
}

// PMK용 recommened Image 조회
export async function getRecommendImageInfoPmk() {
	// PMK용 전역 변수에서 spec 정보 확인
	if (!window.selectedPmkSpecInfo) {
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', 'Select a node specification first.');
		return;
	}

	var osType = $("#assist_os_type-pmk").val()
	var isGPUImage = $("#gpu_image_value-pmk").val()
	var isK8sImage = $("#k8s_image_value-pmk").val()

	// 전역 변수에서 정보 가져오기
	// 세터(clustercreate.js/pmk.js)가 담는 키는 commonSpecId — 'id'는 존재하지 않아 matchedSpecId가 누락됐었음
	var specId = window.selectedPmkSpecInfo.commonSpecId; // spec의 전체 ID (예: "aws+ap-northeast-2+t2.small")
	var provider = window.selectedPmkSpecInfo.provider;
	var region = window.selectedPmkSpecInfo.regionName;
	var connectionName = window.selectedPmkSpecInfo.connectionName;

	// 현재 workspace/project 정보 가져오기
	try {
		// nsId는 상단에 이미 선택돼 있는 project object에 들어 있다. 재조회하지 않는다.
		// workspaceProjectInit()은 셀렉트를 재구성하는 초기화 루틴이라 세션이 비어 있으면
		// 현재 프로젝트를 지워버린다.
		var currentProject = webconsolejs["common/api/services/workspace_api"].getCurrentProject();
		var nsId = currentProject ? (currentProject.NsId || currentProject.nsId || "") : "";

		// API 호출을 위한 파라미터 구성
		var searchParams = {
			providerName: provider,
			regionName: region,
			matchedSpecId: specId,
			maxResults: 100
		};

		// 선택적 파라미터
		if (osType && osType.trim() !== "") {
			searchParams.osType = osType.trim();
		}

		if (isK8sImage === "true") {
			searchParams.isKubernetesImage = true;
		}

		// GPU 이미지가 필요한 경우에만 추가
		if (isGPUImage === "true") {
			searchParams.isGPUImage = true;
		}



		// 이미지 검색 API 호출
		var response = await webconsolejs["common/api/services/infra_api"].searchImage(nsId, searchParams);


		if (response.status && response.status.code === 200) {
			var imageList = response.responseData.imageList || [];
			// API 응답을 테이블 형식에 맞게 변환
			var processedImageList = imageList.map(function(image) {
				return {
					namespace: image.namespace || "system",
					providerName: image.providerName || provider,
					cspImageName: image.cspImageName || image.name || "",
					regionList: image.regionList || [region],
					id: image.id || image.name || "",
					name: image.name || "",
					connectionName: image.connectionName || connectionName,
					fetchedTime: image.fetchedTime || new Date().toLocaleString(),
					creationDate: image.creationDate || new Date().toISOString(),
					osType: image.osType || osType,
					osArchitecture: image.osArchitecture,
					osPlatform: image.osPlatform || "Linux/UNIX",
					osDistribution: image.osDistribution || "",
				osDiskType: image.osDiskType || "ebs",
				osDiskSizeGB: image.osDiskSizeGB || -1,
				imageStatus: image.imageStatus || "Available",
				description: image.description || image.name,
				isBasicImage: image.isBasicImage || false,
				isGPUImage: image.isGPUImage || false,
				isKubernetesImage: image.isKubernetesImage || false
			};
			});

			recommendImageListObjPmk = processedImageList;
			safeSetTableDataPmk(processedImageList);

		} else {
			console.error("PMK API call failed:", response);
			webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Failed to search images. Please try again.');
		}

	} catch (error) {
		console.error("Error in getRecommendImageInfoPmk:", error);
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Error', 'Error searching images. Please try again.');
	}
}

export async function applyImageInfoPmk() {
	
	if (recommendImagesPmk.length === 0) {
		console.warn("No PMK image selected");
		webconsolejs['partials/layout/modal'].commonShowDefaultModal('Required Field', 'Please select an image first.');
		return;
	}

	var selectedImage = recommendImagesPmk[0]; // 첫 번째 선택된 이미지 사용
	

	// 콜백 함수가 설정되어 있으면 호출
	if (imageSelectionCallbackPmk) {

		imageSelectionCallbackPmk(selectedImage);
	} else {
		console.warn("Image selection callback function not set");
	}
	

	// MCI와 동일한 패턴: Bootstrap의 data-bs-dismiss="modal"이 자동으로 모달을 닫음
	// 별도의 모달 닫기 로직 불필요
}



// CSP 드라이버에게 "기본 노드 이미지를 알아서 골라라"라고 알리는 sentinel.
// cb-tumblebug은 imageId가 ""이거나 "default"면 빈 문자열로 cb-spider에 넘기고
// K8s 이미지 검증도 건너뛴다(k8s_cluster.go: 클러스터 생성/NodeGroup 추가 두 경로 모두).
// 각 드라이버가 자기 기본값을 적용한다 — NHN은 Container 판, AWS는 AL2023_x86_64_STANDARD,
// GCP는 COS_CONTAINERD, Alibaba는 defaultNodePoolImageType.
// nodeImageDesignation=false인 CSP(Azure/NCP/IBM)는 이미지를 아예 무시하므로 무해하다.
export const DEFAULT_IMAGE_ID = "default";

// 목록에서 고르지 않고 CSP 기본 이미지를 쓴다.
// 기존 콜백들은 selectedImage.name || cspImageName 을 읽으므로 name 하나면 충분하다.
export function applyDefaultImagePmk() {
	if (imageSelectionCallbackPmk) {
		imageSelectionCallbackPmk({ name: DEFAULT_IMAGE_ID, cspImageName: DEFAULT_IMAGE_ID });
	} else {
		console.warn("Image selection callback function not set");
	}
}

export function showRecommendImageSettingPmk(value) {
	// TODO: 지역 선택에 따른 설정 로직 구현
}

// PMK용 프로바이더별 필터링 기능
export function filterByProviderPmk(provider) {
	if (!recommendImageListObjPmk || recommendImageListObjPmk.length === 0) {
		return;
	}
	
	if (provider === "") {
		// 모든 프로바이더 표시
		safeSetTableDataPmk(recommendImageListObjPmk);
	} else {
		// 선택된 프로바이더만 필터링
		var filteredData = recommendImageListObjPmk.filter(function(item) {
			return item.providerName && item.providerName.toLowerCase() === provider.toLowerCase();
		});
		safeSetTableDataPmk(filteredData);
	}
}

// PMK용 안전한 테이블 데이터 설정 함수
function safeSetTableDataPmk(data) {
	if (recommendImageTablePmk && typeof recommendImageTablePmk.setData === 'function') {
		try {
			recommendImageTablePmk.setData(data);
		} catch (error) {
			console.error("Error setting PMK table data:", error);
			// 테이블 재초기화 시도
			setTimeout(function() {
				try {
					initRecommendImageTablePmk();
					if (recommendImageTablePmk && typeof recommendImageTablePmk.setData === 'function') {
						recommendImageTablePmk.setData(data);
					}
				} catch (reinitError) {
					console.error("Error reinitializing PMK table:", reinitError);
				}
			}, 100);
		}
	} else {
		console.error("PMK Table is not properly initialized");
		// 테이블 재초기화 시도
		setTimeout(function() {
			try {
				initRecommendImageTablePmk();
				if (recommendImageTablePmk && typeof recommendImageTablePmk.setData === 'function') {
					recommendImageTablePmk.setData(data);
				}
			} catch (reinitError) {
				console.error("Error reinitializing PMK table:", reinitError);
			}
		}, 100);
	}
}

// 전역 객체에 함수 등록 (필요시에만)
if (typeof webconsolejs === 'undefined') {
	webconsolejs = {};
}
if (typeof webconsolejs['partials/operation/manage/k8s_imagerecommendation'] === 'undefined') {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'] = {};
}

// 함수들을 조건부로 등록
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].initImageRecommendationPmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].initImageRecommendationPmk = initImageRecommendationPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].initImageModalPmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].initImageModalPmk = initImageModalPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].getRecommendImageInfoPmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].getRecommendImageInfoPmk = getRecommendImageInfoPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].applyImageInfoPmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].applyImageInfoPmk = applyImageInfoPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].applyDefaultImagePmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].applyDefaultImagePmk = applyDefaultImagePmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].showRecommendImageSettingPmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].showRecommendImageSettingPmk = showRecommendImageSettingPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].setImageSelectionCallbackPmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].setImageSelectionCallbackPmk = setImageSelectionCallbackPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].filterByProviderPmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].filterByProviderPmk = filterByProviderPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].updateK8sStatusPmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].updateK8sStatusPmk = updateK8sStatusPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].updateGPUStatusPmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].updateGPUStatusPmk = updateGPUStatusPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].toggleOSDropdownPmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].toggleOSDropdownPmk = toggleOSDropdownPmk;
}
if (!webconsolejs['partials/operation/manage/k8s_imagerecommendation'].selectOSTypePmk) {
	webconsolejs['partials/operation/manage/k8s_imagerecommendation'].selectOSTypePmk = selectOSTypePmk;
}

 