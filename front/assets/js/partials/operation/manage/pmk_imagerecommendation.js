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
		console.error("PMK Image 모달 요소를 찾을 수 없습니다!");
		return;
	}
	
	// 초기 테이블 초기화만 수행 (필드 설정은 Apply 시점에 미리 완료됨)
	initRecommendImageTablePmk();
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

function initRecommendImageTablePmk() {
	// 기존 테이블이 있으면 제거
	if (recommendImageTablePmk) {
		recommendImageTablePmk.destroy();
	}
	
	var tableObjParams = {
		layout: "fitDataFill",
		placeholder: "No data available"
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
			field: "regionList",
			vertAlign: "middle",
			hozAlign: "center",
			formatter: function(cell) {
				var regions = cell.getValue();
				if (Array.isArray(regions)) {
					return regions.join(", ");
				}
				return regions;
			}
		},
		{
			title: "IMAGE NAME",
			field: "name",
			vertAlign: "middle",
			hozAlign: "left",
			maxWidth: 200,
		},
		{
			title: "CSP IMAGE",
			field: "cspImageName",
			vertAlign: "middle",
			hozAlign: "center",
			maxWidth: 150,
		},
		{
			title: "OS TYPE",
			field: "osType",
			vertAlign: "middle",
			hozAlign: "center",
			maxWidth: 120,
		},
		{
			title: "OS ARCH",
			field: "osArchitecture",
			vertAlign: "middle",
			hozAlign: "center",
			maxWidth: 100,
		},
		{
			title: "PLATFORM",
			field: "osPlatform",
			vertAlign: "middle",
			hozAlign: "center",
			maxWidth: 120,
		},
		{
			title: "STATUS",
			field: "imageStatus",
			vertAlign: "middle",
			hozAlign: "center",
			maxWidth: 100,
		}
	];

	recommendImageTablePmk = webconsolejs["common/util"].setTabulator("image-table-pmk", tableObjParams, columns);
	
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
		alert("Please select a server specification first.");
		return;
	}

	var osType = $("#assist_os_type-pmk").val()
	var isGPUImage = $("#gpu_image_value-pmk").val()
	
	// 전역 변수에서 정보 가져오기
	var provider = window.selectedPmkSpecInfo.provider;
	var region = window.selectedPmkSpecInfo.regionName;
	var connectionName = window.selectedPmkSpecInfo.connectionName;
	var osArchitecture = window.selectedPmkSpecInfo.osArchitecture;
	


	// 현재 workspace/project 정보 가져오기
	try {
		var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
		var nsId = selectedWorkspaceProject.nsId;


		// API 호출을 위한 파라미터 구성
		var searchParams = {
			includeDeprecatedImage: false,
			isGPUImage: isGPUImage === "false",
			isKubernetesImage: false,
			isRegisteredByAsset: false,
			osArchitecture: osArchitecture,
			osType: osType,
			providerName: provider.toLowerCase() || "",
			regionName: region || ""
		};



		// 이미지 검색 API 호출
		var response = await webconsolejs["common/api/services/mci_api"].searchImage(nsId, searchParams);


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
					osArchitecture: image.osArchitecture || osArchitecture,
					osPlatform: image.osPlatform || "Linux/UNIX",
					osDistribution: image.osDistribution || "",
					osDiskType: image.osDiskType || "ebs",
					osDiskSizeGB: image.osDiskSizeGB || -1,
					imageStatus: image.imageStatus || "Available",
					description: image.description || image.name
				};
			});

			recommendImageListObjPmk = processedImageList;
			safeSetTableDataPmk(processedImageList);

		} else {
			console.error("PMK API call failed:", response);
			alert("Failed to search images. Please try again.");
		}

	} catch (error) {
		console.error("Error in getRecommendImageInfoPmk:", error);
		alert("Error searching images. Please try again.");
	}
}



export async function applyImageInfoPmk() {
	
	if (recommendImagesPmk.length === 0) {
		console.warn("No PMK image selected");
		alert("Please select an image first.");
		return;
	}

	var selectedImage = recommendImagesPmk[0]; // 첫 번째 선택된 이미지 사용
	

	// 콜백 함수가 설정되어 있으면 호출
	if (imageSelectionCallbackPmk) {

		imageSelectionCallbackPmk(selectedImage);
	} else {
		console.warn("PMK 이미지 선택 콜백 함수가 설정되지 않음");
	}
	

	// MCI와 동일한 패턴: Bootstrap의 data-bs-dismiss="modal"이 자동으로 모달을 닫음
	// 별도의 모달 닫기 로직 불필요
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
if (typeof webconsolejs['partials/operation/manage/pmk_imagerecommendation'] === 'undefined') {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'] = {};
}

// 함수들을 조건부로 등록
if (!webconsolejs['partials/operation/manage/pmk_imagerecommendation'].initImageRecommendationPmk) {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'].initImageRecommendationPmk = initImageRecommendationPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_imagerecommendation'].initImageModalPmk) {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'].initImageModalPmk = initImageModalPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_imagerecommendation'].getRecommendImageInfoPmk) {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'].getRecommendImageInfoPmk = getRecommendImageInfoPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_imagerecommendation'].applyImageInfoPmk) {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'].applyImageInfoPmk = applyImageInfoPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_imagerecommendation'].showRecommendImageSettingPmk) {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'].showRecommendImageSettingPmk = showRecommendImageSettingPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_imagerecommendation'].setImageSelectionCallbackPmk) {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'].setImageSelectionCallbackPmk = setImageSelectionCallbackPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_imagerecommendation'].filterByProviderPmk) {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'].filterByProviderPmk = filterByProviderPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_imagerecommendation'].updateGPUStatusPmk) {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'].updateGPUStatusPmk = updateGPUStatusPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_imagerecommendation'].toggleOSDropdownPmk) {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'].toggleOSDropdownPmk = toggleOSDropdownPmk;
}
if (!webconsolejs['partials/operation/manage/pmk_imagerecommendation'].selectOSTypePmk) {
	webconsolejs['partials/operation/manage/pmk_imagerecommendation'].selectOSTypePmk = selectOSTypePmk;
}

 