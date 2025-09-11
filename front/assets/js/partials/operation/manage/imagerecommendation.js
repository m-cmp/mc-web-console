import { TabulatorFull as Tabulator } from "tabulator-tables";

var returnFunction;// popup인 경우에는 callback function으로 param을 전달해야 한다.
var recommendImageTable;
var imageSelectionCallback;// 이미지 선택 시 호출될 콜백 함수

var recommendImageListObj = new Object();
var selectedSpecInfo = null; // 선택된 spec 정보

export function initImageRecommendation(callbackfunction) {
	initRecommendImageTable();

	// return function 정의
	if (callbackfunction != undefined) {
		returnFunction = callbackfunction;
	}
}

// 모달이 열릴 때 테이블 초기화 (PMK와 동일한 방식으로 단순화)
export function initImageModal() {
	// 모달 요소 확인
	var imageModal = document.getElementById('image-search');
	if (!imageModal) {
		console.error("MCI Image 모달 요소를 찾을 수 없습니다!");
		return;
	}
	
	// 초기 테이블 초기화만 수행 (필드 설정은 Apply 시점에 미리 완료됨)
	initRecommendImageTable();
}

// 이 함수는 더 이상 사용하지 않음 (PMK와 동일한 방식으로 단순화)

// OS Type 드롭다운 토글 함수
export function toggleOSDropdown() {
	// Bootstrap 드롭다운이 자동으로 처리하므로 별도 로직 불필요
}

// OS Type 선택 함수
export function selectOSType(osType) {
	$("#assist_os_type").val(osType);
	
	// 드롭다운 닫기
	var dropdown = document.getElementById('os-type-dropdown');
	if (dropdown) {
		var dropdownInstance = bootstrap.Dropdown.getInstance(dropdown);
		if (dropdownInstance) {
			dropdownInstance.hide();
		}
	}
	
	// 이벤트 기본 동작 방지
	return false;
}

// GPU 토글 상태 업데이트 함수
export function updateGPUStatus() {
	var gpuCheckbox = document.getElementById('assist_gpu_image');
	var gpuValue = document.getElementById('gpu_image_value');
	
	if (gpuCheckbox.checked) {
		gpuValue.value = 'true';
	} else {
		gpuValue.value = 'false';
	}
}

function initRecommendImageTable() {
	// 기존 테이블이 있으면 제거
	if (recommendImageTable) {
		recommendImageTable.destroy();
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

	recommendImageTable = webconsolejs["common/util"].setTabulator("image-table", tableObjParams, columns);
	window.recommendImageTable = recommendImageTable; // window 객체에 할당

	recommendImageTable.on("rowSelectionChanged", function (data, rows) {
		updateSelectedImageRows(data)
	});
}

var recommendImages = [];

function updateSelectedImageRows(data) {
	recommendImages = []; // 선택된 행의 데이터를 초기화

	data.forEach(function (rowData) {
		recommendImages.push(rowData);
	});


}

// 이미지 선택 콜백 함수 설정
export function setImageSelectionCallback(callback) {
	imageSelectionCallback = callback;
}

// recommened Image 조회
export async function getRecommendImageInfo() {

	// 전역 변수에서 spec 정보 확인
	if (!window.selectedSpecInfo) {
		alert("Please select a server specification first.");
		return;
	}

	var osType = $("#assist_os_type").val()
	var isGPUImage = $("#gpu_image_value").val()
	
	// 전역 변수에서 정보 가져오기
	var provider = window.selectedSpecInfo.provider;
	var region = window.selectedSpecInfo.regionName;
	var connectionName = window.selectedSpecInfo.connectionName;
	var osArchitecture = window.selectedSpecInfo.osArchitecture;
	// 현재 workspace/project 정보 가져오기
	try {
		var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
		var nsId = selectedWorkspaceProject.nsId;

		// API 호출을 위한 파라미터 구성
		var searchParams = {
			includeDeprecatedImage: false,
			isGPUImage: isGPUImage === "true",
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

			recommendImageListObj = processedImageList;
			safeSetTableData(processedImageList);

		} else {
			console.error("API call failed:", response);
			alert("Failed to search images. Please try again.");
		}

	} catch (error) {
		console.error("Error in getRecommendImageInfo:", error);
		alert("Error searching images. Please try again.");
	}
}

// 모달을 확실하게 닫는 함수
function closeAllModals() {
	try {
		// Bootstrap 5 방식
		if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
			var imageModal = bootstrap.Modal.getInstance(document.getElementById('image-search'));
			if (imageModal) {
				imageModal.hide();
			}
		}
		
		// jQuery 방식
		if (typeof $ !== 'undefined' && $.fn.modal) {
			$("#image-search").modal('hide');
		}
		
		// 직접 DOM 조작 (최종 fallback)
		var imageModalEl = document.getElementById('image-search');
		
		if (imageModalEl) {
			imageModalEl.style.display = 'none';
			imageModalEl.classList.remove('show');
			imageModalEl.setAttribute('aria-hidden', 'true');
		}
		
		// backdrop 제거
		var backdrops = document.querySelectorAll('.modal-backdrop');
		backdrops.forEach(function(backdrop) {
			backdrop.remove();
		});
		
		// body에서 modal-open 클래스 제거
		document.body.classList.remove('modal-open');
		document.body.style.paddingRight = '';
		
	} catch (error) {
		console.error("Error closing image modal:", error);
	}
}

export async function applyImageInfo() {
	if (recommendImages.length === 0) {
		console.warn("No image selected");
		alert("Please select an image first.");
		return;
	}

	var selectedImage = recommendImages[0]; // 첫 번째 선택된 이미지 사용

	// 콜백 함수가 설정되어 있으면 먼저 호출
	if (imageSelectionCallback) {
		imageSelectionCallback(selectedImage);
	}

	// 모달 닫기
	setTimeout(function() {
		closeAllModals();
	}, 100);
}

export function showRecommendImageSetting(value) {
	// TODO: 지역 선택에 따른 설정 로직 구현
}

// 프로바이더별 필터링 기능
export function filterByProvider(provider) {
	if (!recommendImageListObj || recommendImageListObj.length === 0) {
		return;
	}
	
	if (provider === "") {
		// 모든 프로바이더 표시
		safeSetTableData(recommendImageListObj);
	} else {
		// 선택된 프로바이더만 필터링
		var filteredData = recommendImageListObj.filter(function(item) {
			return item.providerName && item.providerName.toLowerCase() === provider.toLowerCase();
		});
		safeSetTableData(filteredData);
	}
}

// 스펙 검증 및 이미지 모달 열기 함수
export function validateAndOpenImageModal(event) {
	// 스펙 입력 필드 값 확인
	var specValue = $("#ep_specId").val();
	
	if (!specValue || specValue.trim() === "") {
		console.warn("No spec selected - validation failed");
		alert("Please select a server specification first before opening the image recommendation modal.");
		// 이벤트 전파 중단 및 기본 동작 방지
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	
	// 전역 변수에서 spec 정보 확인
	if (!window.selectedSpecInfo) {
		console.warn("No spec info in global variable - validation failed");
		alert("Please select a server specification first before opening the image recommendation modal.");
		// 이벤트 전파 중단 및 기본 동작 방지
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	
	// 이벤트 전파 중단 및 기본 동작 방지 (모달 열기 전에 먼저 실행)
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	
	// 비동기적으로 모달 열기 (PMK와 동일한 방식으로 단순화)
	setTimeout(function() {
		try {
			// Bootstrap 5 방식으로 모달 열기
			if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
				var imageModalEl = document.getElementById('image-search');
				if (imageModalEl) {
					var imageModal = new bootstrap.Modal(imageModalEl);
					imageModal.show();
				} else {
					throw new Error("MCI Image modal element not found");
				}
			} else {
				console.error("Bootstrap이 로드되지 않았습니다.");
				alert("Bootstrap이 로드되지 않아 모달을 열 수 없습니다.");
			}
			
		} catch (error) {
			console.error("Error opening MCI image modal:", error);
			alert("Error opening MCI image recommendation modal. Please try again.");
		}
	}, 100); // 100ms 지연으로 이벤트 처리 완료 후 모달 열기
	
	return true;
}

// 안전한 테이블 데이터 설정 함수
function safeSetTableData(data) {
	if (recommendImageTable && typeof recommendImageTable.setData === 'function') {
		try {
			recommendImageTable.setData(data);
		} catch (error) {
			console.error("Error setting table data:", error);
			// 테이블 재초기화 시도
			setTimeout(function() {
				try {
					initRecommendImageTable();
					if (recommendImageTable && typeof recommendImageTable.setData === 'function') {
						recommendImageTable.setData(data);
					}
				} catch (reinitError) {
					console.error("Error reinitializing table:", reinitError);
				}
			}, 100);
		}
	} else {
		console.error("Table is not properly initialized");
		// 테이블 재초기화 시도
		setTimeout(function() {
			try {
				initRecommendImageTable();
				if (recommendImageTable && typeof recommendImageTable.setData === 'function') {
					recommendImageTable.setData(data);
				}
			} catch (reinitError) {
				console.error("Error reinitializing table:", reinitError);
			}
		}, 100);
	}
}

// 전역 객체에 함수 등록 (필요시에만)
if (typeof webconsolejs === 'undefined') {
	webconsolejs = {};
}
if (typeof webconsolejs['partials/operation/manage/imagerecommendation'] === 'undefined') {
	webconsolejs['partials/operation/manage/imagerecommendation'] = {};
}

// 함수들을 조건부로 등록
if (!webconsolejs['partials/operation/manage/imagerecommendation'].initImageModal) {
	webconsolejs['partials/operation/manage/imagerecommendation'].initImageModal = initImageModal;
}
if (!webconsolejs['partials/operation/manage/imagerecommendation'].getRecommendImageInfo) {
	webconsolejs['partials/operation/manage/imagerecommendation'].getRecommendImageInfo = getRecommendImageInfo;
}
if (!webconsolejs['partials/operation/manage/imagerecommendation'].applyImageInfo) {
	webconsolejs['partials/operation/manage/imagerecommendation'].applyImageInfo = applyImageInfo;
}
if (!webconsolejs['partials/operation/manage/imagerecommendation'].showRecommendImageSetting) {
	webconsolejs['partials/operation/manage/imagerecommendation'].showRecommendImageSetting = showRecommendImageSetting;
}
if (!webconsolejs['partials/operation/manage/imagerecommendation'].filterByProvider) {
	webconsolejs['partials/operation/manage/imagerecommendation'].filterByProvider = filterByProvider;
}
if (!webconsolejs['partials/operation/manage/imagerecommendation'].validateAndOpenImageModal) {
	webconsolejs['partials/operation/manage/imagerecommendation'].validateAndOpenImageModal = validateAndOpenImageModal;
}
if (!webconsolejs['partials/operation/manage/imagerecommendation'].setImageSelectionCallback) {
	webconsolejs['partials/operation/manage/imagerecommendation'].setImageSelectionCallback = setImageSelectionCallback;
}
if (!webconsolejs['partials/operation/manage/imagerecommendation'].toggleOSDropdown) {
	webconsolejs['partials/operation/manage/imagerecommendation'].toggleOSDropdown = toggleOSDropdown;
}
if (!webconsolejs['partials/operation/manage/imagerecommendation'].selectOSType) {
	webconsolejs['partials/operation/manage/imagerecommendation'].selectOSType = selectOSType;
}
if (!webconsolejs['partials/operation/manage/imagerecommendation'].updateGPUStatus) {
	webconsolejs['partials/operation/manage/imagerecommendation'].updateGPUStatus = updateGPUStatus;
} 