import { TabulatorFull as Tabulator } from "tabulator-tables";

var returnFunction;// popup인 경우에는 callback function으로 param을 전달해야 한다.
var recommendImageTable;
var imageSelectionCallback;// 이미지 선택 시 호출될 콜백 함수

var recommendImageListObj = new Object();
var selectedSpecInfo = null; // 선택된 spec 정보

export function initImageRecommendation(callbackfunction) {
	console.log("initImageRecommendation ")

	initRecommendImageTable();

	// return function 정의
	if (callbackfunction != undefined) {
		returnFunction = callbackfunction;
	}
}

// 모달이 열릴 때 테이블 초기화
export function initImageModal() {
	console.log("=== initImageModal START ===");
	console.log("initImageModal - initializing table");
	
	// 모달 이벤트 리스너 추가 (다중 방식으로 시도)
	console.log("Adding modal event listener for #image-search");
	
	// 1. Bootstrap 5 방식
	$('#image-search').on('shown.bs.modal', function () {
		console.log("=== Image modal shown event triggered (Bootstrap 5) ===");
		handleImageModalShown();
	});
	
	// 2. jQuery 방식 (fallback)
	$('#image-search').on('show.bs.modal', function () {
		console.log("=== Image modal show event triggered (jQuery) ===");
		handleImageModalShown();
	});
	
	// 3. 직접 DOM 이벤트 방식 (최종 fallback)
	document.getElementById('image-search').addEventListener('shown.bs.modal', function () {
		console.log("=== Image modal shown event triggered (DOM) ===");
		handleImageModalShown();
	});
	
	// 4. 일반 DOM 이벤트 방식
	document.getElementById('image-search').addEventListener('show', function () {
		console.log("=== Image modal show event triggered (DOM show) ===");
		handleImageModalShown();
	});
	
	console.log("Modal event listener added successfully");
	
	// 초기 테이블 초기화
	setTimeout(function() {
		console.log("Initial table initialization");
		initRecommendImageTable();
	}, 100);
	
	console.log("=== initImageModal END ===");
}

// 모달이 열렸을 때 실행되는 공통 함수
function handleImageModalShown() {
	console.log("=== handleImageModalShown START ===");
	console.log("window.selectedSpecInfo:", window.selectedSpecInfo);
	console.log("window.selectedSpecInfo type:", typeof window.selectedSpecInfo);
	
	if (window.selectedSpecInfo) {
		console.log("selectedSpecInfo.provider:", window.selectedSpecInfo.provider);
		console.log("selectedSpecInfo.regionName:", window.selectedSpecInfo.regionName);
		console.log("selectedSpecInfo.osArchitecture:", window.selectedSpecInfo.osArchitecture);
	}
	
	setTimeout(function() {
		console.log("=== setTimeout callback executed ===");
		initRecommendImageTable();
		
		// 전역 변수에서 spec 정보 확인 및 UI 설정
		if (window.selectedSpecInfo) {
			console.log("Found saved spec info:", window.selectedSpecInfo);
			
			// UI에 정보 설정
			console.log("Setting image-provider to:", window.selectedSpecInfo.provider);
			console.log("Setting image-region to:", window.selectedSpecInfo.regionName);
			console.log("Setting image-os-architecture to:", window.selectedSpecInfo.osArchitecture);
			
			$("#image-provider").val(window.selectedSpecInfo.provider);
			$("#image-region").val(window.selectedSpecInfo.regionName);
			$("#image-os-architecture").val(window.selectedSpecInfo.osArchitecture);
			
			// 설정 후 값 확인
			console.log("After setting - image-provider value:", $("#image-provider").val());
			console.log("After setting - image-region value:", $("#image-region").val());
			console.log("After setting - image-os-architecture value:", $("#image-os-architecture").val());
			
			console.log("Set spec info in image modal - Provider:", window.selectedSpecInfo.provider, "Region:", window.selectedSpecInfo.regionName, "OS Architecture:", window.selectedSpecInfo.osArchitecture);
			
			// 자동 이미지 정보 조회 제거 - 사용자가 검색 버튼을 클릭할 때만 실행되도록 함
			console.log("Image modal opened successfully. Please click the search button to retrieve image information.");
		} else {
			console.log("No selectedSpecInfo found in window object");
			console.log("Available window properties:", Object.keys(window).filter(key => key.includes('selected')));
		}
	}, 100);
	
	console.log("=== handleImageModalShown END ===");
}

// OS Type 드롭다운 토글 함수
export function toggleOSDropdown() {
	console.log("Toggle OS dropdown");
	// Bootstrap 드롭다운이 자동으로 처리하므로 별도 로직 불필요
}

// OS Type 선택 함수
export function selectOSType(osType) {
	console.log("Selected OS Type:", osType);
	$("#assist_os_type").val(osType);
	
	// 드롭다운 닫기
	var dropdown = document.getElementById('os-type-dropdown');
	if (dropdown) {
		var dropdownInstance = bootstrap.Dropdown.getInstance(dropdown);
		if (dropdownInstance) {
			dropdownInstance.hide();
		}
	}
}

// GPU 토글 상태 업데이트 함수
export function updateGPUStatus() {
	var gpuCheckbox = document.getElementById('assist_gpu_image');
	var gpuValue = document.getElementById('gpu_image_value');
	
	if (gpuCheckbox.checked) {
		gpuValue.value = 'true';
		console.log('GPU Image enabled');
	} else {
		gpuValue.value = 'false';
		console.log('GPU Image disabled');
	}
}

function initRecommendImageTable() {
	console.log("Initializing recommend image table");
	
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
	
	console.log("Image table initialized:", recommendImageTable);

	recommendImageTable.on("rowSelectionChanged", function (data, rows) {
		console.log("data", data)

		updateSelectedImageRows(data)
	});

}

var recommendImages = [];

function updateSelectedImageRows(data) {
	recommendImages = []; // 선택된 행의 데이터를 초기화

	data.forEach(function (rowData) {
		recommendImages.push(rowData);
	});

	console.log("선택된 이미지 데이터:", recommendImages);
}

// spec 정보 설정 - 더 이상 사용하지 않음 (전역 변수 사용)
/*
export function setSpecInfo(specInfo) {
	console.log("Setting spec info:", specInfo);
	selectedSpecInfo = specInfo;
	
	// UI에 spec 정보 표시
	$("#image-provider").val(specInfo.providerName || "");
	$("#image-region").val(specInfo.regionName || "");
	
	// osArchitecture 정보 처리 및 표시
	var osArchitecture = "x86_64"; // 기본값
	if (specInfo.osArchitecture) {
		osArchitecture = specInfo.osArchitecture;
	} else if (specInfo.architecture) {
		osArchitecture = specInfo.architecture;
	}
	$("#image-os-architecture").val(osArchitecture);
	
	console.log("Spec info set - Provider:", specInfo.providerName, "Region:", specInfo.regionName, "OS Architecture:", osArchitecture);
	
	// 테이블 초기화
	initRecommendImageTable();
	
	// spec 정보가 설정되면 자동으로 이미지 정보 조회
	setTimeout(function() {
		getRecommendImageInfo();
	}, 200);
}
*/

// 이미지 선택 콜백 함수 설정
export function setImageSelectionCallback(callback) {
	console.log("Setting image selection callback");
	imageSelectionCallback = callback;
}

// recommened Image 조회
export async function getRecommendImageInfo() {
	console.log("=== getRecommendImageInfo START ===");

	// 전역 변수에서 spec 정보 확인
	if (!window.selectedSpecInfo) {
		console.log("No spec info available");
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
	
	console.log("OS Type:", osType)
	console.log("GPU Image:", isGPUImage)
	console.log("Provider:", provider)
	console.log("Region:", region)
	console.log("OS Architecture:", osArchitecture)

	// 현재 workspace/project 정보 가져오기
	try {
		var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
		var nsId = selectedWorkspaceProject.nsId;
		console.log("Current nsId:", nsId);

		// API 호출을 위한 파라미터 구성
		var searchParams = {
			includeDeprecatedImage: false,
			isGPUImage: isGPUImage === "true",
			isKubernetesImage: false,
			isRegisteredByAsset: false,
			osArchitecture: osArchitecture || "x86_64",
			osType: osType || "ubuntu 22.04",
			providerName: provider.toLowerCase() || "",
			regionName: region || ""
		};

		console.log("Search parameters:", searchParams);

		// 이미지 검색 API 호출
		var response = await webconsolejs["common/api/services/mci_api"].searchImage(nsId, searchParams);
		console.log("Image search API response:", response);

		if (response.status && response.status.code === 200) {
			var imageList = response.responseData.imageList || [];
			console.log("Found images:", imageList.length);

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
			console.log("Image data set successfully");

		} else {
			console.error("API call failed:", response);
			alert("Failed to search images. Please try again.");
		}

	} catch (error) {
		console.error("Error in getRecommendImageInfo:", error);
		alert("Error searching images. Please try again.");
	}

	console.log("=== getRecommendImageInfo END ===");
}

// 모달을 확실하게 닫는 함수
function closeAllModals() {
	console.log("Closing image modal...");
	
	try {
		// 1. Bootstrap 5 방식
		if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
			var imageModal = bootstrap.Modal.getInstance(document.getElementById('image-search'));
			if (imageModal) {
				imageModal.hide();
			}
		}
		
		// 2. jQuery 방식
		if (typeof $ !== 'undefined' && $.fn.modal) {
			$("#image-search").modal('hide');
		}
		
		// 3. 직접 DOM 조작 (최종 fallback)
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
		
		console.log("Image modal closed successfully");
		
	} catch (error) {
		console.error("Error closing image modal:", error);
	}
}

export async function applyImageInfo() {
	console.log("in applyImageInfo")

	if (recommendImages.length === 0) {
		console.warn("No image selected");
		alert("Please select an image first.");
		// 이벤트 전파 중단 및 기본 동작 방지
		event.preventDefault();
		event.stopPropagation();
		return;
	}

	var selectedImage = recommendImages[0]; // 첫 번째 선택된 이미지 사용

	// 콜백 함수가 설정되어 있으면 먼저 호출
	if (imageSelectionCallback) {
		imageSelectionCallback(selectedImage);
	} else {
		console.log("No callback function set for image selection");
	}

	console.log("Applied image info:", selectedImage);

	// 모달 닫기
	setTimeout(function() {
		closeAllModals();
	}, 100);
}

export function showRecommendImageSetting(value) {
	console.log("showRecommendImageSetting:", value)
	
	// TODO: 지역 선택에 따른 설정 로직 구현
	if (value) {
		// 지역별 이미지 목록 업데이트 로직
		console.log("Region selected:", value);
	}
}

// 프로바이더별 필터링 기능
export function filterByProvider(provider) {
	console.log("Filtering images by provider:", provider);
	
	if (!recommendImageListObj || recommendImageListObj.length === 0) {
		console.log("No image data to filter - no search results available");
		return;
	}
	
	if (provider === "") {
		// 모든 프로바이더 표시
		console.log("Showing all image providers");
		safeSetTableData(recommendImageListObj);
	} else {
		// 선택된 프로바이더만 필터링
		var filteredData = recommendImageListObj.filter(function(item) {
			return item.providerName && item.providerName.toLowerCase() === provider.toLowerCase();
		});
		console.log("Filtered image data for", provider + ":", filteredData.length, "items");
		safeSetTableData(filteredData);
	}
}

// 전역 객체에 함수 등록
if (typeof webconsolejs === 'undefined') {
	webconsolejs = {};
}

// 기존 객체가 있는지 확인하고, 있으면 삭제 후 새로 생성
if (webconsolejs['partials/operation/manage/imagerecommendation']) {
	delete webconsolejs['partials/operation/manage/imagerecommendation'];
}

webconsolejs['partials/operation/manage/imagerecommendation'] = {};

// 함수들을 등록
webconsolejs['partials/operation/manage/imagerecommendation'].initImageRecommendation = initImageRecommendation;
webconsolejs['partials/operation/manage/imagerecommendation'].getRecommendImageInfo = getRecommendImageInfo;
webconsolejs['partials/operation/manage/imagerecommendation'].applyImageInfo = applyImageInfo;
webconsolejs['partials/operation/manage/imagerecommendation'].showRecommendImageSetting = showRecommendImageSetting;
webconsolejs['partials/operation/manage/imagerecommendation'].setImageSelectionCallback = setImageSelectionCallback;
webconsolejs['partials/operation/manage/imagerecommendation'].filterByProvider = filterByProvider;
webconsolejs['partials/operation/manage/imagerecommendation'].initImageModal = initImageModal;
webconsolejs['partials/operation/manage/imagerecommendation'].closeAllModals = closeAllModals;
webconsolejs['partials/operation/manage/imagerecommendation'].validateAndOpenImageModal = validateAndOpenImageModal;
webconsolejs['partials/operation/manage/imagerecommendation'].updateGPUStatus = updateGPUStatus;
webconsolejs['partials/operation/manage/imagerecommendation'].toggleOSDropdown = toggleOSDropdown;
webconsolejs['partials/operation/manage/imagerecommendation'].selectOSType = selectOSType;
console.log("Image recommendation functions registered successfully");

// 검증 에러 메시지 표시 함수
function showValidationError(message) {
	console.log("Validation error:", message);
	
	// Bootstrap toast나 alert를 사용하여 메시지 표시
	if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
		// Bootstrap toast 사용
		var toastHtml = `
			<div class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
				<div class="d-flex">
					<div class="toast-body">
						${message}
					</div>
					<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
				</div>
			</div>
		`;
		
		// 기존 toast 제거
		var existingToast = document.querySelector('.toast');
		if (existingToast) {
			existingToast.remove();
		}
		
		// 새로운 toast 추가
		var toastContainer = document.getElementById('toast-container') || createToastContainer();
		toastContainer.innerHTML = toastHtml;
		
		var toastElement = toastContainer.querySelector('.toast');
		var toast = new bootstrap.Toast(toastElement);
		toast.show();
		
		// 3초 후 자동으로 숨김
		setTimeout(function() {
			toast.hide();
		}, 3000);
		
	} else {
		// Bootstrap이 없는 경우 간단한 div 메시지
		var messageDiv = document.createElement('div');
		messageDiv.className = 'validation-error-message';
		messageDiv.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background-color: #dc3545;
			color: white;
			padding: 15px 20px;
			border-radius: 5px;
			z-index: 9999;
			max-width: 400px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
		`;
		messageDiv.textContent = message;
		
		document.body.appendChild(messageDiv);
		
		// 3초 후 자동으로 제거
		setTimeout(function() {
			if (messageDiv.parentNode) {
				messageDiv.parentNode.removeChild(messageDiv);
			}
		}, 3000);
	}
}

// Toast 컨테이너 생성 함수
function createToastContainer() {
	var container = document.createElement('div');
	container.id = 'toast-container';
	container.className = 'toast-container position-fixed top-0 end-0 p-3';
	container.style.cssText = 'z-index: 9999;';
	document.body.appendChild(container);
	return container;
}

// 스펙 검증 및 이미지 모달 열기 함수
export function validateAndOpenImageModal(event) {
	console.log("=== validateAndOpenImageModal START ===");
	
	// 스펙 입력 필드 값 확인
	var specValue = $("#ep_specId").val();
	console.log("Spec value:", specValue);
	
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
	
	console.log("Spec validation passed - opening image modal");
	
	// 이벤트 전파 중단 및 기본 동작 방지 (모달 열기 전에 먼저 실행)
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}
	
	// 비동기적으로 모달 열기 (페이지 이동 방지)
	setTimeout(function() {
		try {
			console.log("Attempting to open image modal...");
			
			// 1. Bootstrap 5 방식 (가장 안전한 방법)
			if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
				console.log("Using Bootstrap 5 method");
				var imageModalEl = document.getElementById('image-search');
				if (imageModalEl) {
					var imageModal = new bootstrap.Modal(imageModalEl, {
						backdrop: 'static',
						keyboard: false
					});
					imageModal.show();
					console.log("Bootstrap 5 modal opened successfully");
				} else {
					console.error("Image modal element not found");
					throw new Error("Modal element not found");
				}
			} 
			// 2. jQuery 방식 (fallback)
			else if (typeof $ !== 'undefined' && $.fn.modal) {
				console.log("Using jQuery method");
				$("#image-search").modal({
					backdrop: 'static',
					keyboard: false
				});
				console.log("jQuery modal opened successfully");
			}
			// 3. 직접 DOM 조작 (최종 fallback)
			else {
				console.log("Using direct DOM manipulation");
				var imageModalEl = document.getElementById('image-search');
				if (imageModalEl) {
					imageModalEl.style.display = 'block';
					imageModalEl.classList.add('show');
					imageModalEl.setAttribute('aria-hidden', 'false');
					
					// backdrop 추가
					var backdrop = document.createElement('div');
					backdrop.className = 'modal-backdrop fade show';
					document.body.appendChild(backdrop);
					
					// body에 modal-open 클래스 추가
					document.body.classList.add('modal-open');
					
					console.log("Direct DOM modal opened successfully");
				} else {
					console.error("Image modal element not found");
					throw new Error("Modal element not found");
				}
			}
			
			console.log("Image modal opened successfully");
			
		} catch (error) {
			console.error("Error opening image modal:", error);
			alert("Error opening image recommendation modal. Please try again.");
		}
	}, 100); // 100ms 지연으로 이벤트 처리 완료 후 모달 열기
	
	return true;
}

// 안전한 테이블 데이터 설정 함수
function safeSetTableData(data) {
	if (recommendImageTable && typeof recommendImageTable.setData === 'function') {
		try {
			recommendImageTable.setData(data);
			console.log("Table data set successfully");
		} catch (error) {
			console.error("Error setting table data:", error);
			// 테이블 재초기화 시도
			setTimeout(function() {
				try {
					initRecommendImageTable();
					if (recommendImageTable && typeof recommendImageTable.setData === 'function') {
						recommendImageTable.setData(data);
						console.log("Table data set after reinitialization");
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
					console.log("Table data set after reinitialization");
				}
			} catch (reinitError) {
				console.error("Error reinitializing table:", reinitError);
			}
		}, 100);
	}
} 