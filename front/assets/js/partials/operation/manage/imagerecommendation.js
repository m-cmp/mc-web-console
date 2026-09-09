import { TabulatorFull as Tabulator } from "tabulator-tables";

var returnFunction;// popup인 경우에는 callback function으로 param을 전달해야 한다.
var recommendImageTable;
var imageSelectionCallback;// 이미지 선택 시 호출될 콜백 함수

var recommendImageListObj = new Object();
var selectedSpecInfo = null; // 선택된 spec 정보
var imageSource = 'public'; // 조회 소스: 'public'(SearchImage, ns=system) | 'myimage'(GetAllCustomImage, 선택 ns)

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
		console.error("MCI Image modal element not found!");
		return;
	}
	
	// 초기 테이블 초기화만 수행 (필드 설정은 Apply 시점에 미리 완료됨)
	initRecommendImageTable();

	// 조회 소스를 Public으로 리셋 + 모달이 열릴 때마다 리셋 (항상 기본 소스로 시작)
	resetImageSource();
	if (!imageModal.dataset.sourceResetBound) {
		imageModal.addEventListener('show.bs.modal', function () {
			resetImageSource();
			recommendImageListObj = [];
			safeSetTableData([]);
		});
		imageModal.dataset.sourceResetBound = "true";
	}
}

// 조회 소스 리셋 (Public 기본)
function resetImageSource() {
	imageSource = 'public';
	var publicRadio = document.getElementById('image-source-public');
	if (publicRadio) {
		publicRadio.checked = true;
	}
	togglePublicFilterRow(true);
}

// Public 전용 필터 행(OS Type/GPU/Search) 표시 토글
function togglePublicFilterRow(visible) {
	var filterRow = document.getElementById('image-public-filter-row');
	if (filterRow) {
		filterRow.style.display = visible ? '' : 'none';
	}
}

// 조회 소스 라디오 변경 핸들러
export async function onImageSourceChange(source) {
	imageSource = source;
	togglePublicFilterRow(source === 'public');
	safeSetTableData([]);
	recommendImageListObj = [];
	if (source === 'myimage') {
		await loadMyImageList();
	}
	// public: 기존 Search 버튼 흐름 유지 (사용자가 조건 입력 후 검색)
}

// 워크스페이스 ns의 MyImage(customImage) 목록 로딩
async function loadMyImageList() {
	try {
		var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
		var nsId = selectedWorkspaceProject.nsId;

		var response = await webconsolejs["common/api/services/infra_api"].getCustomImageList(nsId);

		if (!(response.status && response.status.code === 200)) {
			console.error("MyImage list API call failed:", response);
			webconsolejs["common/util"].showToast("Failed to load MyImage list. Switching back to Public Image.", 'warning', 5000);
			fallbackToPublicSource();
			return;
		}

		var imageList = (response.responseData && response.responseData.customImage) || [];

		// spec 매칭 정합: 선택 spec의 connectionName 기준 클라이언트 필터
		var connectionName = window.selectedSpecInfo && window.selectedSpecInfo.connectionName;
		if (connectionName) {
			imageList = imageList.filter(function (image) {
				return image.connectionName === connectionName;
			});
		}

		if (imageList.length === 0) {
			webconsolejs["common/util"].showToast("No MyImage found for the selected connection. Create one from a node first.", 'warning', 5000);
			safeSetTableData([]);
			return;
		}

		var processedImageList = imageList.map(function (image) {
			return mapImageInfoToRow(image);
		});
		recommendImageListObj = processedImageList;
		safeSetTableData(processedImageList);
	} catch (error) {
		console.error("Error in loadMyImageList:", error);
		webconsolejs["common/util"].showToast("Error loading MyImage list. Switching back to Public Image.", 'warning', 5000);
		fallbackToPublicSource();
	}
}

// 조회 실패 시 Public 소스로 폴백
function fallbackToPublicSource() {
	resetImageSource();
	safeSetTableData([]);
	recommendImageListObj = [];
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
			title: "BASIC",
			field: "isBasicImage",
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
			vertAlign: "middle",
			hozAlign: "center",
			minWidth: 120,
			headerSort: true,
		},
		{
			title: "IMAGE NAME",
			field: "name",
			vertAlign: "middle",
			hozAlign: "left",
			minWidth: 180,
			headerSort: true,
		},
		{
			title: "OS DISTRIBUTION",
			field: "osDistribution",
			vertAlign: "middle",
			hozAlign: "left",
			minWidth: 300,
			tooltip: true,
			headerSort: true,
		},
		{
			title: "STATUS",
			field: "imageStatus",
			vertAlign: "middle",
			hozAlign: "center",
			maxWidth: 110,
			headerSort: true,
		},
		{
			title: "GPU",
			field: "isGPUImage",
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

// tumblebug ImageInfo → 테이블 행 매핑 (Public/MyImage 공용 — 동일 통합 모델)
function mapImageInfoToRow(image, fallback) {
	fallback = fallback || {};
	return {
		namespace: image.namespace || fallback.namespace || "system",
		providerName: image.providerName || fallback.provider || "",
		cspImageName: image.cspImageName || image.name || "",
		regionList: image.regionList || (fallback.region ? [fallback.region] : []),
		id: image.id || image.name || "",
		name: image.name || "",
		connectionName: image.connectionName || fallback.connectionName || "",
		fetchedTime: image.fetchedTime || new Date().toLocaleString(),
		creationDate: image.creationDate || new Date().toISOString(),
		osType: image.osType || fallback.osType || "",
		osArchitecture: image.osArchitecture,
		osPlatform: image.osPlatform || "Linux/UNIX",
		osDistribution: image.osDistribution || "",
		osDiskType: image.osDiskType || "ebs",
		osDiskSizeGB: image.osDiskSizeGB || -1,
		imageStatus: image.imageStatus || "Available",
		description: image.description || image.name,
		isBasicImage: image.isBasicImage || false,
		isGPUImage: image.isGPUImage || false,
		resourceType: image.resourceType || "" // "customImage"면 MyImage — root disk 안내에 사용
	};
}

// recommened Image 조회
export async function getRecommendImageInfo() {

	// 전역 변수에서 spec 정보 확인
	if (!window.selectedSpecInfo) {
		alert("Please select a node specification first.");
		return;
	}

	var osType = $("#assist_os_type").val();
	var isGPUImage = $("#gpu_image_value").val();
	
	// UI 필드에서 값 가져오기
	var provider = $("#image-provider").val() || window.selectedSpecInfo.provider;
	var region = $("#image-region").val() || window.selectedSpecInfo.regionName;
	var osArchitecture = $("#image-os-architecture").val();
	var connectionName = window.selectedSpecInfo.connectionName;
	
	// 디버깅 로그 - 상세 정보
	console.log("=== MCI Image Search Debug ===");
	console.log("Provider:", provider);
	console.log("Region:", region);
	console.log("OS Architecture raw value:", osArchitecture, "| Type:", typeof osArchitecture, "| Length:", osArchitecture ? osArchitecture.length : 0);
	console.log("OS Type raw value:", osType, "| Type:", typeof osType, "| Length:", osType ? osType.length : 0);
	
	// 현재 workspace/project 정보 가져오기
	try {
		var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
		var nsId = selectedWorkspaceProject.nsId;

		// API 호출을 위한 파라미터 구성 - 필수 항목만 포함
		var searchParams = {
			providerName: provider,
			regionName: region,
			maxResults: 100
		};
		
		// 선택적 파라미터 - 값이 있을 때만 추가
		if (osArchitecture && typeof osArchitecture === 'string' && osArchitecture.trim() !== "") {
			console.log("Adding osArchitecture:", osArchitecture);
			searchParams.osArchitecture = osArchitecture.trim();
		} else {
			console.log("Skipping osArchitecture - empty or invalid");
		}
		
		if (osType && typeof osType === 'string' && osType.trim() !== "") {
			console.log("Adding osType:", osType);
			searchParams.osType = osType.trim();
		} else {
			console.log("Skipping osType - empty or invalid");
		}
		
		if (isGPUImage === "true") {
			console.log("Adding isGPUImage: true");
			searchParams.isGPUImage = true;
		}
		
		var matchedSpecId = $("#matched_spec_id").val();
		if (matchedSpecId && typeof matchedSpecId === 'string' && matchedSpecId.trim() !== "") {
			console.log("Adding matchedSpecId:", matchedSpecId);
			searchParams.matchedSpecId = matchedSpecId.trim();
		} else {
			console.log("Skipping matchedSpecId - empty or invalid");
		}
		
		console.log("Final searchParams:", JSON.stringify(searchParams));
		console.log("=== End Debug ===");

		// 이미지 검색 API 호출
		var response = await webconsolejs["common/api/services/infra_api"].searchImage(nsId, searchParams);

		if (response.status && response.status.code === 200) {
			var imageList = response.responseData.imageList || [];
			
			// 이미지가 없는 경우 안내 메시지
			if (imageList.length === 0) {
				console.warn("No images found for the selected spec and OS type");
				webconsolejs["common/util"].showToast("No images found for the selected specification and OS type. Please try different criteria.", 'warning', 5000);
				safeSetTableData([]);
				return;
			}
			
			// API 응답을 테이블 형식에 맞게 변환
			var processedImageList = imageList.map(function(image) {
				return mapImageInfoToRow(image, {
					provider: provider,
					region: region,
					osType: osType,
					connectionName: connectionName
				});
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

	// 준비되지 않은 MyImage(Creating 등)로 배포 시 실패 가능(커버리지 실증: Tencent/NHN) — 안내 후 진행/취소 선택
	if (selectedImage.resourceType === "customImage" &&
		selectedImage.imageStatus && selectedImage.imageStatus !== "Available") {
		var proceed = confirm(
			"This MyImage is not ready yet (status: " + selectedImage.imageStatus + ").\n" +
			"Deploying with an unprepared image may fail.\n" +
			"Continue anyway?"
		);
		if (!proceed) return;
	}

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
		alert("Please select a node specification first before opening the image recommendation modal.");
		// 이벤트 전파 중단 및 기본 동작 방지
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	
	// 전역 변수에서 spec 정보 확인
	if (!window.selectedSpecInfo) {
		console.warn("No spec info in global variable - validation failed");
		alert("Please select a node specification first before opening the image recommendation modal.");
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
		// Spec Information 필드 채우기 (모달 열기 전)
		if (window.selectedSpecInfo) {
			$("#image-provider").val(window.selectedSpecInfo.provider || "");
			$("#image-region").val(window.selectedSpecInfo.regionName || "");
			$("#image-os-architecture").val(window.selectedSpecInfo.osArchitecture || "");
			$("#matched_spec_id").val(window.selectedSpecInfo.commonSpecId || "");
		}
			
			// Bootstrap 5 방식으로 모달 열기
			if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
				var imageModalEl = document.getElementById('image-search');
				if (imageModalEl) {
					var imageModal = new bootstrap.Modal(imageModalEl);
					imageModal.show();
				} else {
					throw new Error("Infra Image modal element not found");
				}
			} else {
				console.error("Bootstrap is not loaded.");
				alert("Bootstrap is not loaded. Cannot open modal.");
			}
			
		} catch (error) {
			console.error("Error opening MCI image modal:", error);
			alert("Error opening Infra image recommendation modal. Please try again.");
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