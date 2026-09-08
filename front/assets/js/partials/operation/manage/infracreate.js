import { TabulatorFull as Tabulator } from "tabulator-tables";
import { Dropzone } from "dropzone";
//import { selectedMciObj } from "./mci";
//document.addEventListener("DOMContentLoaded", initMciCreate) // page가 아닌 partials에서는 제거

// 새로운 MCI API 인터페이스에 맞는 데이터 변환 헬퍼 함수
function transformServerConfigToNodeGroups(serverConfigArr) {
  return serverConfigArr.map(config => ({
    specId: config.commonSpec,
    imageId: config.commonImage,
    name: config.name,
    subGroupSize: config.subGroupSize,
    connectionName: config.connectionName,
    description: config.description,
    rootDiskSize: config.rootDiskSize,
    rootDiskType: config.rootDiskType,
    command: config.command
  }));
}

// ─── Data Disk attach at creation time (Create Infra) ──────────────────────
// cb-tumblebug의 Dynamic 생성 API(PostInfraDynamic/PostInfraNodeGroupDynamic)에는
// dataDisk 파라미터가 없어(WEB-TECH-014 ST2 분석) 생성 요청과 attach를 한 번에
// 보낼 수 없다. 대신 생성 요청 후 노드가 Running이 될 때까지 폴링한 뒤, Node
// Detail 탭이 쓰는 것과 동일한 disk_api.js 함수로 attach를 별도 호출한다.
// 1차 범위: NodeGroup Size가 1일 때만 지원(다중 노드는 Node Detail 탭에서 개별 attach).

function _toggleCreateDiskAttachMode() {
	const mode = $("#ep_disk_attach_mode").val();
	$("#ep_disk_attach_existing").toggleClass("d-none", mode !== "existing");
	$("#ep_disk_attach_new").toggleClass("d-none", mode !== "new");
}
$(document).on("change", "#ep_disk_attach_mode", _toggleCreateDiskAttachMode);

// spec 선택(connectionName 확정) 시 호출 — 같은 CSP/리전 후보만 노출(Node Detail 탭과 동일 필터)
async function _populateCreateDiskCandidates(connectionName) {
	const select = document.getElementById("ep_disk_attach_existing_select");
	if (!select) return;
	select.innerHTML = '<option value="">Select</option>';
	if (!connectionName) return;
	try {
		const diskApi = webconsolejs["common/api/services/disk_api"];
		const resp = await diskApi.getAllDataDisk(window.currentNsId);
		const disks = resp?.dataDisk || (Array.isArray(resp) ? resp : []);
		for (const d of disks) {
			if ((d.associatedObjectList || []).length > 0) continue; // 이미 attach된 디스크 제외
			if (d?.connectionName !== connectionName) continue; // 동일 connection(=CSP+리전)만
			const opt = document.createElement("option");
			opt.value = d.id || d.name;
			opt.textContent = d.name || d.id;
			select.appendChild(opt);
		}
	} catch (err) {
		console.error("Data disk 후보 조회 실패:", err);
	}
}

// NodeGroup Size가 1이 아니면 Disk 옵션 비활성화(1차 범위 제한)
function updateDiskAttachAvailability() {
	const size = parseInt($("#ep_vm_add_cnt").val(), 10) || 1;
	const section = document.getElementById("ep_disk_attach_section");
	const modeSelect = document.getElementById("ep_disk_attach_mode");
	const notice = document.getElementById("ep_disk_attach_multinode_notice");
	if (!section || !modeSelect || !notice) return;
	const disabled = size !== 1;
	modeSelect.disabled = disabled;
	notice.classList.toggle("d-none", !disabled);
	if (disabled && modeSelect.value !== "none") {
		modeSelect.value = "none";
		_toggleCreateDiskAttachMode();
	}
}

// Done 클릭 시 폼에서 diskOption 수집 — express_form에 실려 addServerConfigToList로 전달됨
function collectDiskOptionFromForm() {
	const mode = $("#ep_disk_attach_mode").val() || "none";
	if (mode === "existing") {
		const dataDiskId = $("#ep_disk_attach_existing_select").val();
		return dataDiskId ? { mode, dataDiskId } : { mode: "none" };
	}
	if (mode === "new") {
		const name = $("#ep_disk_attach_new_name").val()?.trim();
		const size = parseInt($("#ep_disk_attach_new_size").val(), 10);
		const diskType = $("#ep_disk_attach_new_type").val()?.trim();
		if (!name || !size) return { mode: "none" }; // 미입력 시 attach 생략(필수 검증은 Done 단계에서 별도 처리하지 않음 — 선택 기능)
		const body = { name, diskSize: size };
		if (diskType) body.diskType = diskType;
		return { mode, body };
	}
	return { mode: "none" };
}

function resetDiskAttachSection() {
	$("#ep_disk_attach_mode").val("none");
	$("#ep_disk_attach_existing_select").html('<option value="">Select</option>');
	$("#ep_disk_attach_new_name").val("");
	$("#ep_disk_attach_new_size").val("");
	$("#ep_disk_attach_new_type").val("");
	_toggleCreateDiskAttachMode();
	updateDiskAttachAvailability();
}

// 노드가 Running이 될 때까지 폴링. 타임아웃/삭제 시 null 반환.
async function pollNodeUntilRunning(nsId, infraId, nodeId, { timeoutMs = 15 * 60 * 1000, intervalMs = 5000 } = {}) {
	const mciApi = webconsolejs["common/api/services/infra_api"];
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const resp = await mciApi.getMci(nsId, infraId);
			const node = (resp?.responseData?.node || []).find((n) => n.id === nodeId);
			if (node && node.status === "Running") return node;
			if (node && node.status === "Failed") return null;
		} catch (err) {
			console.error("노드 상태 폴링 실패:", err);
		}
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	return null;
}

// ─── Pending job 영속화 ──────────────────────────────────────────────────
// Add Node(Extend VM) 플로우는 요청 직후 mciworkloads 목록 페이지로 즉시
// window.location 이동하므로, 진행 중이던 폴링이 그대로 끊긴다. sessionStorage에
// pending job을 기록해두고, 이동한 페이지(mci.js)에서 resumePendingDiskAttachJobs()로
// 이어받는다. Create Infra는 같은 페이지에 머무르므로 즉시 실행 + 완료 시 정리로 충분.
const PENDING_DISK_ATTACH_KEY = "mcmp_pending_disk_attach_jobs";

function _readPendingDiskAttachJobs() {
	try {
		return JSON.parse(sessionStorage.getItem(PENDING_DISK_ATTACH_KEY) || "[]");
	} catch {
		return [];
	}
}

function _writePendingDiskAttachJobs(jobs) {
	sessionStorage.setItem(PENDING_DISK_ATTACH_KEY, JSON.stringify(jobs));
}

function _addPendingDiskAttachJob(job) {
	const jobs = _readPendingDiskAttachJobs();
	jobs.push(job);
	_writePendingDiskAttachJobs(jobs);
}

function _removePendingDiskAttachJob(nsId, infraId, nodeId) {
	const jobs = _readPendingDiskAttachJobs().filter(
		(j) => !(j.nsId === nsId && j.infraId === infraId && j.nodeId === nodeId)
	);
	_writePendingDiskAttachJobs(jobs);
}

// 같은 페이지 로드 내에서 동일 job이 중복 실행되는 것을 막는 인메모리 가드.
// (페이지 새로고침 자체는 이 Set을 포함해 JS 컨텍스트 전체를 초기화하므로 크로스
// 리로드 중복은 못 막는다 — 그 경우는 sessionStorage 제거 시점으로 처리한다. 이
// 가드는 같은 페이지에서 resumePendingDiskAttachJobs()가 중복 호출되는 등의
// 케이스만 방어한다.)
const _activeDiskAttachJobKeys = new Set();
function _diskAttachJobKey(nsId, infraId, nodeId) {
	return `${nsId}|${infraId}|${nodeId}`;
}

// 노드 Running 대기 후 attach 실행 — 결과는 토스트로만 통지(알림센터 미연동, ST3 설계 §3.1)
//
// sessionStorage 제거는 반드시 attach 완료(성공/실패/타임아웃) 후에만 한다 — 폴링은
// 최대 15분 걸릴 수 있고 그동안 페이지가 새로고침되면 JS 컨텍스트(및 위 인메모리
// 가드)가 통째로 사라지므로, resumePendingDiskAttachJobs()가 sessionStorage의
// job으로 재개하는 것이 유일한 복구 経로다. 시작 시점에 미리 지우면(과거 시도)
// "새로고침하면 attach가 통째로 유실"되는 훨씬 나쁜 회귀가 생긴다(Playwright로 실측
// 확인, 0건 발송). 반대로 완료 직후~제거 사이의 극히 좁은 창에서 새로고침이 겹치면
// 드물게 attach가 한 번 더 시도될 수 있는데, 이미 attach된 디스크라 CSP가 정상적으로
// 거부(에러 토스트)하는 선에서 끝나는 무해한 경우라 감수한다.
async function _runDiskAttachJob(job) {
	const { nsId, infraId, nodeId, diskOption } = job;
	const key = _diskAttachJobKey(nsId, infraId, nodeId);
	if (_activeDiskAttachJobKeys.has(key)) return; // 같은 페이지에서 이미 진행 중
	_activeDiskAttachJobKeys.add(key);

	try {
		const node = await pollNodeUntilRunning(nsId, infraId, nodeId);
		if (!node) {
			webconsolejs["common/utils/toast"].showToast(
				webconsolejs["common/utils/toast"].TOAST_TYPES.WARNING,
				`${infraId}/${nodeId}: node did not reach Running in time, disk attach skipped`
			);
			return;
		}

		const diskApi = webconsolejs["common/api/services/disk_api"];
		try {
			if (diskOption.mode === "existing") {
				await diskApi.attachDataDisk(nsId, infraId, nodeId, diskOption.dataDiskId);
			} else {
				await diskApi.postNodeDataDisk(nsId, infraId, nodeId, diskOption.body);
			}
			webconsolejs["common/utils/toast"].showToast(
				webconsolejs["common/utils/toast"].TOAST_TYPES.SUCCESS,
				`${infraId}/${nodeId}: disk attach requested`
			);
		} catch (err) {
			console.error("Disk Attach 실패(생성 후 오케스트레이션):", err);
			const msg = err?.response?.data?.responseData?.message || err?.message || String(err);
			webconsolejs["common/utils/toast"].showToast(
				webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR,
				`${infraId}/${nodeId}: disk attach failed — ${msg}`
			);
		}
	} finally {
		_activeDiskAttachJobKeys.delete(key);
		_removePendingDiskAttachJob(nsId, infraId, nodeId);
	}
}

// Deploy/Extend 요청 성공 직후 호출 — 인프라(또는 신규 NodeGroup) 생성 자체는 이미
// 진행 중이므로 여기서는 블로킹 없이 백그라운드로 노드 Running 대기 후 attach한다.
// 페이지 이동으로 끊길 수 있어 sessionStorage에 먼저 기록한 뒤 실행한다.
function scheduleDiskAttachAfterDeploy(nsId, infraId, nodeGroupName, diskOption) {
	if (!diskOption || diskOption.mode === "none") return;
	const nodeId = `${nodeGroupName}-1`; // 1차 범위: NodeGroup Size 1 고정
	const job = { nsId, infraId, nodeId, diskOption };
	_addPendingDiskAttachJob(job);
	_runDiskAttachJob(job);
}

// Deploy 성공 후 diskOption이 설정된 NodeGroup 전부에 대해 오케스트레이션 시작(비동기, 블로킹 없음)
function scheduleDiskAttachForConfigs(nsId, infraId, serverConfigArr) {
	for (const config of serverConfigArr || []) {
		if (config.diskOption && config.diskOption.mode !== "none") {
			scheduleDiskAttachAfterDeploy(nsId, infraId, config.name, config.diskOption);
		}
	}
}

// 페이지 로드 시 이전 페이지(Add Node/Extend VM)에서 남긴 pending job을 이어받아 재개.
// 이미 완료된 job은 _runDiskAttachJob 종료 시 sessionStorage에서 제거되므로 중복 attach 위험은 낮다.
export function resumePendingDiskAttachJobs() {
	const jobs = _readPendingDiskAttachJobs();
	for (const job of jobs) {
		_runDiskAttachJob(job);
	}
}

// create page 가 load 될 때 실행해야 할 것들 정의
export function initMciCreate() {
	// MCI Create 초기화

	// partial init functions

	webconsolejs["partials/operation/manage/serverrecommendation"].initServerRecommendation(webconsolejs["partials/operation/manage/infracreate"].callbackServerRecommendation);// recommend popup에서 사용하는 table 정의.
	
	webconsolejs["partials/operation/manage/imagerecommendation"].initImageModal(); // 이미지 추천 모달 초기화
	
	// 이미지 선택 콜백 함수 설정
	webconsolejs["partials/operation/manage/imagerecommendation"].setImageSelectionCallback(webconsolejs["partials/operation/manage/infracreate"].callbackImageRecommendation);

	initTemplateDeploySelect(); // Deployment Algorithm의 Template 선택 처리
}

// callback PopupData
export async function callbackServerRecommendation(vmSpec) {
	// MCI Server Recommendation 콜백 함수

	$("#ep_provider").val(vmSpec.provider)
	$("#ep_connectionName").val(vmSpec.connectionName)
	$("#ep_specId").val(vmSpec.specName)
	$("#ep_commonSpecId").val(vmSpec.commonSpecId)
	
	// policy_ep_* 필드들도 함께 설정 (mciworkloads.html용)
	$("#policy_ep_provider").val(vmSpec.provider)
	$("#policy_ep_connectionName").val(vmSpec.connectionName)
	$("#policy_ep_specId").val(vmSpec.specName)
	$("#policy_ep_commonSpecId").val(vmSpec.commonSpecId)
	
	// spec 정보를 전역 변수에 저장 (이미지 선택 시 사용)
	window.selectedSpecInfo = {
		provider: vmSpec.provider,
		connectionName: vmSpec.connectionName,
		regionName: vmSpec.regionName || vmSpec.connectionName.replace(vmSpec.provider + "-", ""),
		osArchitecture: vmSpec.osArchitecture || "x86_64", // 기본값 설정
		specName: vmSpec.specName,
		commonSpecId: vmSpec.commonSpecId
	};
	
	// 이미지 모달의 필드들을 즉시 세팅 (PMK와 동일한 방식)
	$("#image-provider").val(window.selectedSpecInfo.provider);
	$("#image-region").val(window.selectedSpecInfo.regionName);
	$("#image-os-architecture").val(window.selectedSpecInfo.osArchitecture);

	var diskResp = await webconsolejs["common/api/services/disk_api"].getCommonLookupDiskInfo(vmSpec.provider, vmSpec.connectionName)
	getCommonLookupDiskInfoSuccess(vmSpec.provider, diskResp)

	// Expert 모드: connection이 확정된 시점에 vNet/SecurityGroup/SSHKey 후보를 채운다
	if (currentDeployMode() === "expert") {
		await loadExpertResourceOptions(vmSpec.connectionName);
	}

	// Data Disk attach 후보 목록도 connectionName 확정 시점에 함께 갱신
	await _populateCreateDiskCandidates(vmSpec.connectionName);

}

// 이미지 선택 콜백 함수
export function callbackImageRecommendation(selectedImage) {
	// MCI 이미지 선택 콜백 함수

	// 부모 폼의 input 필드에 이미지 정보 설정
	$("#ep_imageId_input").val(selectedImage.name || selectedImage.cspImageName || "");
	$("#ep_imageId").val(selectedImage.id || selectedImage.name || "");
	$("#ep_commonImageId").val(selectedImage.id || selectedImage.name || "");

	// policy_ep_* 필드들도 함께 설정 (mciworkloads.html용)
	$("#policy_ep_imageId_input").val(selectedImage.name || selectedImage.cspImageName || "");
	$("#policy_ep_commonImageId").val(selectedImage.id || selectedImage.name || "");

	// MyImage(customImage) 선택 시 root disk 입력이 서버에서 무시됨을 안내 (입력은 활성 유지)
	var notice = document.getElementById("ep_root_disk_myimage_notice");
	if (notice) {
		notice.style.display = (selectedImage.resourceType === "customImage") ? "" : "none";
	}
}

var DISK_SIZE = [];
function getCommonLookupDiskInfoSuccess(provider, data) {

	var providerId = provider.toUpperCase()
	var root_disk_type = [];
	var res_item = data;
	res_item.forEach(item => {
		var temp_provider = item.providerId
		if (temp_provider == providerId) {
			root_disk_type = item.rootdisktype
			DISK_SIZE = item.disksize
		}
	})
	// var temp_provider = res_item.providerId
	// if(temp_provider == provider){
	// 	root_disk_type = res_item.rootdisktype
	// 	DISK_SIZE = res_item.disksize
	// }

	var html = '<option value="">Select Root Disk Type</option>'
	root_disk_type.forEach(item => {
		html += '<option value="' + item + '">' + item + '</option>'
	})
	//if(caller == "vmexpress"){
	$("#ep_root_disk_type").empty();
	$("#ep_root_disk_type").append(html);
	//}else if(caller == "vmsimple"){
	// $("#ss_root_disk_type").empty();
	// $("#ss_root_disk_type").append(html);
	//}else if(caller == "vmexpert"){
	// $("#tab_others_root_disk_type").empty()
	// $("#tab_others_root_disk_type").append(html)
	//}

	webconsolejs["partials/layout/modal"].modalHide('spec-search')

}


var createMciListObj = new Object();
var isVm = false // mci 생성(false) / vm 추가(true)
var Express_Server_Config_Arr = new Array();
var express_data_cnt = 0
var currentEditingIndex = -1 // 현재 수정 중인 서버의 인덱스 (-1: 신규 추가 모드)

// ─── Expert Mode — 리소스 직접 선택 (WEB-TECH-052) ──────────────────────
// cb-tumblebug 비-dynamic PostInfra/PostInfraNode(model.CreateNodeGroupReq)는
// vNetId/subnetId/securityGroupIds/sshKeyId를 정확한 리소스 ID로 요구한다.
// Spec 선택으로 connection이 정해지면 그 connection으로 네임스페이스 전체 목록을
// 필터해 채운다. VNetInfo/SecurityGroupInfo/SshKeyInfo 모두 connectionName 필드를
// 그대로 가지므로(cb-tumblebug 스키마 공통), 별도 provider/region 유도 없이
// 정확히 일치하는 것만 남긴다.

function currentDeployMode() {
  return $(isVm ? "#vm_deploy_algorithm" : "#mci_deploy_algorithm").val();
}

let expertVNetList = []; // subnetInfoList·zone 조회용 캐시(현재 connection 기준)
let expertSGList = []; // connection 기준 캐시 — SG는 vNetId로 한 번 더 좁혀야 한다(아래 설명)

function fillSelect(selectEl, items, placeholder) {
  selectEl.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = placeholder;
  selectEl.appendChild(ph);
  items.forEach((it) => {
    const opt = document.createElement("option");
    opt.value = it.id;
    opt.textContent = it.cspResourceName ? `${it.name} (${it.cspResourceName})` : it.name;
    selectEl.appendChild(opt);
  });
}

function resetExpertResourceSection() {
  expertVNetList = [];
  const vnet = document.getElementById("ep_expert_vnet");
  const subnet = document.getElementById("ep_expert_subnet");
  const sg = document.getElementById("ep_expert_sg");
  const sshkey = document.getElementById("ep_expert_sshkey");
  const zoneHint = document.getElementById("ep_expert_subnet_zone_hint");
  if (vnet) { vnet.innerHTML = '<option value="">Select Spec/Image first</option>'; vnet.disabled = true; }
  if (subnet) { subnet.innerHTML = '<option value="">Select a VNet first</option>'; subnet.disabled = true; }
  expertSGList = [];
  if (sg) { sg.innerHTML = '<option value="">Select a VNet first</option>'; sg.disabled = true; }
  if (sshkey) { sshkey.innerHTML = '<option value="">Select Spec/Image first</option>'; sshkey.disabled = true; }
  if (zoneHint) zoneHint.textContent = "";
}

// Spec 선택으로 connection이 확정된 시점(callbackServerRecommendation)에 호출된다.
async function loadExpertResourceOptions(connectionName) {
  const vnet = document.getElementById("ep_expert_vnet");
  const sg = document.getElementById("ep_expert_sg");
  const sshkey = document.getElementById("ep_expert_sshkey");
  if (!vnet || !sg || !sshkey) return;

  try {
    const [vNetData, sgData, sshkeyData] = await Promise.all([
      webconsolejs["common/api/services/vpc_api"].getAllVNet(AppStateNs()),
      webconsolejs["common/api/services/securitygroup_api"].list(AppStateNs()),
      webconsolejs["common/api/services/sshkey_api"].list(AppStateNs()),
    ]);
    const rawVNets = vNetData?.vNet || (Array.isArray(vNetData) ? vNetData : []);
    const rawSGs = sgData?.securityGroup || (Array.isArray(sgData) ? sgData : []);
    const rawSshKeys = sshkeyData?.sshKey || (Array.isArray(sshkeyData) ? sshkeyData : []);

    expertVNetList = rawVNets.filter((v) => v.connectionName === connectionName);
    // SG는 connection 기준으로만 우선 캐시한다 — vNetId로 좁히는 건 VNet 선택 이후(onExpertVNetChange)
    expertSGList = rawSGs.filter((s) => s.connectionName === connectionName);
    const filteredSshKeys = rawSshKeys.filter((k) => k.connectionName === connectionName);

    fillSelect(vnet, expertVNetList, expertVNetList.length ? "Select VNet" : "No VNet found for this connection");
    vnet.disabled = expertVNetList.length === 0;

    // SG는 VNet을 고르기 전까지 비활성 — 선택 가능한 SG가 VNet에 종속되기 때문
    sg.innerHTML = '<option value="">Select a VNet first</option>';
    sg.disabled = true;

    fillSelect(sshkey, filteredSshKeys, filteredSshKeys.length ? "Select SSH Key" : "No SSH Key found for this connection");
    sshkey.disabled = filteredSshKeys.length === 0;

    // VNet이 바뀌지 않았어도 Subnet은 항상 VNet 재선택부터 다시 시작
    const subnet = document.getElementById("ep_expert_subnet");
    if (subnet) { subnet.innerHTML = '<option value="">Select a VNet first</option>'; subnet.disabled = true; }
    const zoneHint = document.getElementById("ep_expert_subnet_zone_hint");
    if (zoneHint) zoneHint.textContent = "";
  } catch (e) {
    console.error("Failed to load Expert mode resources:", e);
    webconsolejs["common/utils/toast"]?.showToast?.(
      webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR,
      "Failed to load VNet/SecurityGroup/SSHKey list: " + (e?.message || e)
    );
  }
}

// VNet 선택 변경 시 Subnet 목록을 subnetInfoList에서 채운다 (별도 API 없음)
export function onExpertVNetChange() {
  const vnetSel = document.getElementById("ep_expert_vnet");
  const subnetSel = document.getElementById("ep_expert_subnet");
  const sgSel = document.getElementById("ep_expert_sg");
  const zoneHint = document.getElementById("ep_expert_subnet_zone_hint");
  if (!vnetSel || !subnetSel) return;

  const vNetId = vnetSel.value;
  const vNet = expertVNetList.find((v) => v.id === vNetId);
  const subnets = vNet?.subnetInfoList || [];

  fillSelect(subnetSel, subnets, subnets.length ? "Select Subnet" : "No Subnet found in this VNet");
  subnetSel.disabled = subnets.length === 0;
  if (zoneHint) zoneHint.textContent = "";

  // SG는 model.SecurityGroupInfo.vNetId로 선택한 VNet에 속하는 것만 남긴다.
  // connection만으로 필터하면 다른 VNet 소속 SG가 섞여, 배포 시 cb-tumblebug이
  // "Security group X and subnet Y belong to different networks" 400을 반환한다(실측 확인).
  if (sgSel) {
    const scopedSGs = vNetId ? expertSGList.filter((s) => s.vNetId === vNetId) : [];
    sgSel.innerHTML = "";
    scopedSGs.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.cspResourceName ? `${s.name} (${s.cspResourceName})` : s.name;
      sgSel.appendChild(opt);
    });
    sgSel.disabled = scopedSGs.length === 0;
    if (scopedSGs.length === 0) {
      const ph = document.createElement("option");
      ph.value = "";
      ph.textContent = "No Security Group found in this VNet";
      sgSel.appendChild(ph);
    }
  }
}

// Subnet 선택 변경 시 zone 안내 갱신 (CreateNodeGroupReq에는 zone 필드가 없다 — subnet.zone이 곧 배치 zone)
export function onExpertSubnetChange() {
  const vnetSel = document.getElementById("ep_expert_vnet");
  const subnetSel = document.getElementById("ep_expert_subnet");
  const zoneHint = document.getElementById("ep_expert_subnet_zone_hint");
  if (!vnetSel || !subnetSel || !zoneHint) return;

  const vNet = expertVNetList.find((v) => v.id === vnetSel.value);
  const subnet = (vNet?.subnetInfoList || []).find((s) => s.id === subnetSel.value);
  zoneHint.textContent = subnet?.zone ? `Zone: ${subnet.zone}` : "";
}

function getSelectedExpertSubnetZone() {
  const vnetSel = document.getElementById("ep_expert_vnet");
  const subnetSel = document.getElementById("ep_expert_subnet");
  if (!vnetSel || !subnetSel) return "";
  const vNet = expertVNetList.find((v) => v.id === vnetSel.value);
  const subnet = (vNet?.subnetInfoList || []).find((s) => s.id === subnetSel.value);
  return subnet?.zone || "";
}

function AppStateNs() {
  // 이 모듈은 별도 AppState가 없어 navbar 헬퍼로 매번 조회한다 (다른 호출부와 동일 패턴)
  return window.currentNsId;
}

// 서버 더하기버튼 클릭시 서버정보 입력area 보이기/숨기기
// isExpert의 체크 여부에 따라 바뀜.
// newServers 와 simpleServers가 있음.
export async function displayNewServerForm() {
  // +NodeGroup 버튼 클릭 시 수정 모드 플래그 초기화 (신규 추가 모드)
  currentEditingIndex = -1;
  
  // 화면별 select 참조 — Create MCI는 #mci_deploy_algorithm, Extend VM은 #vm_deploy_algorithm
  var deploymentAlgo = $(isVm ? "#vm_deploy_algorithm" : "#mci_deploy_algorithm").val();

  if (deploymentAlgo == "express" || deploymentAlgo == "expert") {
    // 폼을 열기 전에 추가 초기화 (Express/Expert 공용 — Expert는 같은 폼을 리소스 선택 섹션만 더해 쓴다)
    $("#ep_name").val("");
    $("#ep_description").val("");
    $("#ep_imageId_input").val("");
    $("#ep_root_disk_type").val("");
    $("#ep_root_disk_size").val("");
    $("#ep_vm_add_cnt").val("1"); // 기본값 1로 설정
    $("#ep_data_disk").val("");
    $("#ep_command").val("");
    
    // 모달들 초기화
    resetModals();

    // 신규 모드 — 직전 편집(template li)의 carry-through 값 잔상 제거 (빈 필드로 초기화)
    renderCarryThroughSection(null);
    setNodeLabels(null);
    $("#ep_node_user_password").val("");

    // Expert 전용 UI 노출/숨김 — 삭제가 아니라 게이팅(WEB-BUG-063에서 숨긴 것과 대칭)
    var isExpert = deploymentAlgo == "expert";
    var pwGroup = document.getElementById("ep_node_user_password_group");
    if (pwGroup) pwGroup.style.display = isExpert ? "" : "none";
    var expertSection = document.getElementById("ep_expert_resources_section");
    if (expertSection) expertSection.style.display = isExpert ? "" : "none";
    if (isExpert) resetExpertResourceSection();

    var div = document.getElementById("server_configuration");
    webconsolejs["partials/layout/navigatePages"].toggleSubElement(div)

  } else if (deploymentAlgo == "simple") {
    // var div = document.getElementById("server_configuration");
    // webconsolejs["partials/layout/navigatePages"].toggleElement(div)

  } else {
    console.error(e)
  }


	// var expressServerConfig = $("#expressServerConfig");
	// var deploymentAlgo = $("#placement_algo").val();
	// var simpleServerConfig = $("#simpleServerConfig");
	// var expertServerConfig = $("#expertServerConfig");
	// var importServerConfig = $("#importServerConfig");
	// var expressServerConfig = $("#expressServerConfig");
	// console.log("is import = " + IsImport + " , deploymentAlgo " + deploymentAlgo)
	// // if ($("#isImport").is(":checked")) {
	// if (IsImport) {
	//     simpleServerConfig.removeClass("active");
	//     expertServerConfig.removeClass("active");
	//     importServerConfig.addClass("active");
	//     expressServerConfig.removeClass("active");
	// } else if (deploymentAlgo == "expert") {
	//     simpleServerConfig.removeClass("active");
	//     expertServerConfig.toggleClass("active");//
	//     importServerConfig.removeClass("active");
	//     expressServerConfig.removeClass("active");
	// } else if (deploymentAlgo == "simple") {
	//     simpleServerConfig.toggleClass("active");//
	//     expertServerConfig.removeClass("active");
	//     importServerConfig.removeClass("active");
	//     expressServerConfig.removeClass("active");

	// } else {
	//     //simpleServerConfig        
	//     console.log("exp")
	//     simpleServerConfig.removeClass("active");
	//     expertServerConfig.removeClass("active");
	//     importServerConfig.removeClass("active");
	//     expressServerConfig.toggleClass("active");//        
	// }
}


// express모드 -> Done버튼 클릭 시

export async function expressDone_btn() {
  // 1. 필수 필드 검증
  var requiredFields = [
    { id: '#ep_name', message: 'NodeGroup name is required' },
    { id: '#ep_vm_add_cnt', message: 'Node count is required' },
    { id: '#ep_commonSpecId', message: 'Spec is required' },
    { id: '#ep_commonImageId', message: 'Image is required' }
  ];
  
  for (var field of requiredFields) {
    if (!$(field.id).val() || $(field.id).val().trim() === '') {
      alert(field.message);
      $(field.id).focus();
      return;
    }
  }

  // 1-1. 이름 중복 검증 — precheck(review) 호출 앞에 두어 확정 실패에 네트워크 왕복을 쓰지 않는다.
  // currentEditingIndex 제외가 필수: 이름을 안 바꾼 항목을 다시 Done 하면 자기 자신과 충돌한다.
  var nameErr = checkNodeGroupNameAvailable($("#ep_name").val(), currentEditingIndex);
  if (nameErr) {
    alert(nameErr);
    $("#ep_name").focus();
    return;
  }

  // 2. VM 개수 숫자 검증
  var vmAddCnt = $("#ep_vm_add_cnt").val();
  if (isNaN(vmAddCnt) || parseInt(vmAddCnt) < 1) {
    alert('Node count must be a positive number');
    $("#ep_vm_add_cnt").focus();
    return;
  }
  
  // express 는 common resource를 하므로 별도로 처리(connection, spec만)
  $("#p_provider").val($("#ep_provider").val())
  $("#p_connectionName").val($("#ep_connectionName").val())
  $("#p_name").val($("#ep_name").val())
  $("#p_description").val($("#ep_description").val())
  $("#p_imageId").val($("#ep_imageId").val())
  $("#p_commonImageId").val($("#ep_commonImageId").val())
  $("#ep_imageId_input").val($("#ep_imageId").val()) // 이미지 입력 필드도 업데이트
  $("#p_commonSpecId").val($("#ep_commonSpecId").val())
  $("#p_root_disk_type").val($("#ep_root_disk_type").val())
  $("#p_root_disk_size").val($("#ep_root_disk_size").val())
  $("#p_specId").val($("#ep_specId").val())
  $("#p_command").val($("#ep_command").val())
  // ep_vm_add_cnt가 비어있으면 기본값 1로 설정
  var vmAddCnt = $("#ep_vm_add_cnt").val();
  if (!vmAddCnt || vmAddCnt.trim() === "") {
    vmAddCnt = "1";
  }
  $("#p_subGroupSize").val(vmAddCnt)
  $("#p_vm_cnt").val(vmAddCnt)

  // commonSpec 으로 set 해야하므로 재설정
  var express_form = {}
  express_form["provider"] = $("#ep_provider").val(); // provider 추가
  express_form["connectionName"] = $("#ep_connectionName").val(); // connectionName 추가
  express_form["name"] = $("#p_name").val();
  express_form["description"] = $("#p_description").val();
  express_form["subGroupSize"] = $("#p_subGroupSize").val();
  express_form["rootDiskSize"] = $("#p_root_disk_size").val();
  express_form["rootDiskType"] = $("#p_root_disk_type").val();
  express_form["rootDiskType"] = $("#p_root_disk_type").val();
  express_form["commonSpec"] = $("#p_commonSpecId").val();
  express_form["commonImage"] = $("#p_commonImageId").val();
  express_form["imageId"] = $("#p_imageId").val(); // imageId 추가
  express_form["specId"] = $("#p_specId").val(); // specId 추가
  express_form["command"] = $("#p_command").val();
  // Node Labels 편집기 상태 반영 — 빈 객체면 수정 모드 merge에서 기존 label 제거(사용자가 비운 것) 의도 유지
  express_form["label"] = { ...nodeCustomLabels };
  // Node User Password — 빈 값이면 payload에서 omit, 수정 모드에서 비우면 제거 (trim하지 않음)
  express_form["nodeUserPassword"] = $("#ep_node_user_password").val() || "";
  // Data Disk attach 옵션 — NodeGroup Size 1일 때만 유효(폼에서 이미 disabled 처리됨)
  express_form["diskOption"] = collectDiskOptionFromForm();

  // Expert 모드 — model.CreateNodeGroupReq 필수 리소스(vNetId/subnetId/securityGroupIds/sshKeyId)
  // zone은 별도 입력이 아니라 선택한 Subnet에서 결정된다.
  if (currentDeployMode() === "expert") {
    var expertVNetId = $("#ep_expert_vnet").val();
    var expertSubnetId = $("#ep_expert_subnet").val();
    var expertSgIds = $("#ep_expert_sg").val() || [];
    var expertSshKeyId = $("#ep_expert_sshkey").val();

    if (!expertVNetId || !expertSubnetId || expertSgIds.length === 0 || !expertSshKeyId) {
      alert("Expert mode requires VNet, Subnet, at least one Security Group, and an SSH Key.");
      return;
    }

    express_form["vNetId"] = expertVNetId;
    express_form["subnetId"] = expertSubnetId;
    express_form["securityGroupIds"] = expertSgIds;
    express_form["sshKeyId"] = expertSshKeyId;
    var expertZone = getSelectedExpertSubnetZone();
    if (expertZone) express_form["zone"] = expertZone;
  }

  // 3. Done 시점 NodeGroup 단건 사전 검증 — Error면 목록에 담지 않고 폼 유지 (spec/image 재선택 유도)
  var precheckAllowed = await precheckNodeGroup(express_form);
  if (!precheckAllowed) {
    return;
  }

  addServerConfigToList(express_form);

  // 서버 입력 폼 숨기기
  var div = document.getElementById("server_configuration");
  webconsolejs["partials/layout/navigatePages"].toggleSubElement(div);
  
  // 폼 초기화 - 모든 입력 필드 초기화
  $("#express_form").each(function () {
    this.reset();
  });
  
  // 숨겨진 필드들 초기화
  $("#ep_provider").val("");
  $("#ep_connectionName").val("");
  $("#ep_imageId").val("");
  $("#ep_commonImageId").val("");
  $("#ep_commonSpecId").val("");
  $("#ep_specId").val("");
  
  // 직접 입력 필드들 초기화
  $("#ep_name").val("");
  $("#ep_description").val("");
  $("#ep_imageId_input").val("");
  $("#ep_root_disk_type").val("");
  $("#ep_root_disk_size").val("");
  $("#ep_vm_add_cnt").val("1"); // 기본값 1로 설정
  $("#ep_data_disk").val("");
  $("#ep_command").val("");
  setNodeLabels(null);
  $("#ep_node_user_password").val("");
  resetDiskAttachSection();

  // 모달들 초기화
  resetModals();
}

var isDonePrecheckRunning = false;


// review 사유 목록을 modal용 텍스트로 변환 (white-space: pre-line로 줄바꿈 표시)
function reviewReasonLines(msgs) {
  return (msgs || []).filter(Boolean).map(function (m) { return "- " + m; }).join("\n");
}

// 검증 결과 표시 — workspace 선택 확인(checkWorkspaceSelection)과 동일한
// 공용 모달(partials/layout/_modal.html) 스타일 재사용.
// confirm형(#commonDefaultModal, Cancel/Confirm): resolve(true=Confirm, false=Cancel/닫힘)
function showPrecheckConfirmModal(title, content) {
  return new Promise(function (resolve) {
    var modalEl = document.getElementById("commonDefaultModal");
    if (!modalEl) {
      resolve(confirm(title + "\n\n" + content));
      return;
    }
    document.getElementById("commonDefaultModal-title").innerText = title;
    var contentEl = document.getElementById("commonDefaultModal-content");
    contentEl.style.whiteSpace = "pre-line";
    contentEl.innerText = content;
    var confirmed = false;
    document.getElementById("commonDefaultModal-confirm-btn").onclick = function () { confirmed = true; };
    modalEl.addEventListener("hidden.bs.modal", function () { resolve(confirmed); }, { once: true });
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });
}

// alert형(#commonDefaultModal) — 확인만 받고 진행 여부를 묻지 않는다.
// commonShowDefaultModal은 white-space를 세팅하지 않는데 showPrecheckConfirmModal이 같은
// 엘리먼트에 pre-line을 영구로 남기므로 호출 순서에 의존한다. 여기서 명시 세팅해 의존을 없앤다.
function showAlertModal(title, content) {
  var modalEl = document.getElementById("commonDefaultModal");
  if (!modalEl) {
    alert(title + "\n\n" + content);
    return;
  }
  document.getElementById("commonDefaultModal-title").innerText = title;
  var contentEl = document.getElementById("commonDefaultModal-content");
  contentEl.style.whiteSpace = "pre-line";
  contentEl.innerText = content;
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// 배포 직전 NodeGroup 이름 최종 검증. 통과하면 true, 막으면 false(모달 표시).
function validateNodeGroupNamesBeforeDeploy() {
  if (Express_Server_Config_Arr.length === 0) {
    showAlertModal("NodeGroup Required", "Add at least one NodeGroup before Deploy.");
    return false;
  }

  var missing = [];
  Express_Server_Config_Arr.forEach(function (cfg, i) {
    if (!normalizeNodeGroupName(cfg && cfg.name)) missing.push(i + 1);
  });
  if (missing.length > 0) {
    showAlertModal(
      "NodeGroup Name Required",
      missing.length + " NodeGroup(s) have no name (position: " + missing.join(", ") + ").\n"
      + "Click each item in the NodeGroup list and enter a unique name, then Deploy again."
    );
    return false;
  }

  var seen = new Set();
  var dupes = [];
  Express_Server_Config_Arr.forEach(function (cfg) {
    var key = normalizeNodeGroupName(cfg && cfg.name);
    if (seen.has(key)) dupes.push(String(cfg.name).trim());
    else seen.add(key);
  });
  if (dupes.length > 0) {
    showAlertModal(
      "Duplicate NodeGroup Name",
      "These NodeGroup names are used more than once: " + dupes.join(", ") + ".\n"
      + "NodeGroup names must be unique. Please rename them and Deploy again."
    );
    return false;
  }

  var existing = getExistingNodeGroupNames();
  var clash = Express_Server_Config_Arr
    .filter(function (cfg) { return existing.has(normalizeNodeGroupName(cfg && cfg.name)); })
    .map(function (cfg) { return String(cfg.name).trim(); });
  if (clash.length > 0) {
    showAlertModal(
      "Duplicate NodeGroup Name",
      "These NodeGroup names already exist in this Infra: " + clash.join(", ") + ".\n"
      + "Please rename them and Deploy again."
    );
    return false;
  }

  return true;
}


// ─── Infra 배포 Labels ───
// 기본 label 2종은 배포 시 코드에서 자동 주입 — UI에는 read-only 뱃지로만 표시 (수정·삭제 불가)
var DEFAULT_INFRA_LABELS = { "project": "mcmp", "framework": "mc-web-console" };
var infraCustomLabels = {};

// labelSelector 파싱 예약 문자(, = !)·공백을 배제한 안전 문자셋
var LABEL_TOKEN_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

// label 입력 공통 검증 — 통과 시 null, 실패 시 사유(영문) 반환
function validateLabelInput(key, value, existing, reservedKeys) {
  if (!key || !value) {
    return "Label key and value are required";
  }
  if (!LABEL_TOKEN_RE.test(key) || !LABEL_TOKEN_RE.test(value)) {
    return "Only letters, digits, '-', '_', '.', '/' are allowed (must start with a letter or digit)";
  }
  if (key.indexOf("sys.") === 0) {
    return "'sys.' prefix is reserved for system labels";
  }
  if (reservedKeys && Object.prototype.hasOwnProperty.call(reservedKeys, key)) {
    return "'" + key + "' is a default label and cannot be overridden";
  }
  if (Object.prototype.hasOwnProperty.call(existing, key)) {
    return "Label key '" + key + "' already exists";
  }
  return null;
}

// label 목록 렌더 — textContent 할당(HTML 해석 방지)
function renderLabelList(containerId, labelsObj, removeFn) {
  var list = document.getElementById(containerId);
  if (!list) return;
  list.innerHTML = "";
  Object.keys(labelsObj).forEach(function (key) {
    var row = document.createElement("div");
    row.className = "d-flex align-items-center mb-1";
    var badge = document.createElement("span");
    badge.className = "badge badge-outline text-blue fw-normal me-2";
    badge.textContent = key + "=" + labelsObj[key];
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-sm btn-ghost-danger";
    btn.textContent = "Remove";
    btn.onclick = function () { removeFn(key); };
    row.appendChild(badge);
    row.appendChild(btn);
    list.appendChild(row);
  });
}

export function addInfraLabel() {
  var toast = webconsolejs["common/utils/toast"];
  var key = ($("#mci_label_key").val() || "").trim();
  var value = ($("#mci_label_value").val() || "").trim();

  var err = validateLabelInput(key, value, infraCustomLabels, DEFAULT_INFRA_LABELS);
  if (err) {
    toast.showToast(toast.TOAST_TYPES.ERROR, err);
    return;
  }

  infraCustomLabels[key] = value;
  $("#mci_label_key").val("");
  $("#mci_label_value").val("");
  renderInfraLabelList();
}

export function removeInfraLabel(key) {
  delete infraCustomLabels[key];
  renderInfraLabelList();
}

function renderInfraLabelList() {
  renderLabelList("mci_label_list", infraCustomLabels, removeInfraLabel);
}

// ─── Node(NodeGroup) Labels — express 폼 단위 (Create/Extend 공유) ───
// CreateNodeGroupDynamicReq.label로 전송 — 기본 label 자동 주입은 Infra top-level 전용(여긴 없음)
var nodeCustomLabels = {};

export function addNodeLabel() {
  var toast = webconsolejs["common/utils/toast"];
  var key = ($("#ep_label_key").val() || "").trim();
  var value = ($("#ep_label_value").val() || "").trim();

  var err = validateLabelInput(key, value, nodeCustomLabels, null);
  if (err) {
    toast.showToast(toast.TOAST_TYPES.ERROR, err);
    return;
  }

  nodeCustomLabels[key] = value;
  $("#ep_label_key").val("");
  $("#ep_label_value").val("");
  renderNodeLabelList();
}

export function removeNodeLabel(key) {
  delete nodeCustomLabels[key];
  renderNodeLabelList();
}

function renderNodeLabelList() {
  renderLabelList("ep_label_list", nodeCustomLabels, removeNodeLabel);
}

// 수정 모드 진입 시 기존 label 로드 / 신규·초기화 시 빈 상태
function setNodeLabels(labels) {
  nodeCustomLabels = { ...(labels || {}) };
  renderNodeLabelList();
  $("#ep_label_key").val("");
  $("#ep_label_value").val("");
}

// 배포 페이로드용 label — 사용자 label 위에 기본 label을 마지막으로 merge (기본 키 보존 이중 방어)
function getInfraDeployLabels() {
  return { ...infraCustomLabels, ...DEFAULT_INFRA_LABELS };
}

// Done 시점 NodeGroup 단건 사전 검증. 결과는 공용 모달로 표시.
// Error → alert형 모달 후 차단 / Warning·검증 불능 → confirm형 모달로 추가 여부 사용자 선택.
// Deploy 시점 전체 review는 현행 유지되므로 최종 안전망은 유지된다.
// 반환: true = 목록 추가 진행, false = 차단(폼 유지)
async function precheckNodeGroup(express_form) {
  // Expert 모드는 dynamic review(mciDynamicReview/vmDynamicReview) 대상이 아니다 —
  // spec/image 자동탐색을 하지 않으므로 PostSpecImagePairReview로 조합 호환성만 검증한다.
  if (currentDeployMode() === "expert") {
    return await precheckNodeGroupExpert(express_form);
  }

  if (isDonePrecheckRunning) {
    return false;
  }
  isDonePrecheckRunning = true;

  var btn = document.getElementById("express_done_btn");
  var btnOrigHtml;
  if (btn) {
    btnOrigHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span>Validating...';
  }

  try {
    var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
    var nsId = selectedWorkspaceProject.nsId;

    var review = null;
    if (isVm) {
      // Extend VM(Add NodeGroup): infra 존재를 전제로 하는 단건 review API 사용
      var vmResp = await webconsolejs["common/api/services/infra_api"].vmDynamicReview(window.currentMciId, nsId, express_form);
      var vmData = vmResp && vmResp.status === 200 ? vmResp.data.responseData : null;
      // 응답은 review 단건 객체 — 방어적으로 infra 래퍼(nodeReviews[])도 허용
      review = vmData && vmData.nodeReviews ? (vmData.nodeReviews[0] || null) : vmData;
    } else {
      // Create Infra: 전체 review API를 단건 배열로 호출 (Deploy 시점 review와 계약 동일)
      var mciName = $("#mci_name").val();
      if (!mciName || !mciName.trim()) {
        // 빈 name은 HTTP 400 — 검증용 더미 고유명 사용, name 중복 최종 검사는 Deploy review가 수행
        mciName = "precheck-" + Math.random().toString(36).slice(2, 8);
      }
      var mciDesc = $("#mci_desc").val() || "precheck";
      // labels도 Deploy review와 동일하게 전달 (계약 대칭 — review는 label을 검증하지 않음)
      var mciResp = await webconsolejs["common/api/services/infra_api"].mciDynamicReview(mciName, mciDesc, [express_form], nsId, getInfraDeployLabels());
      var mciData = mciResp && mciResp.status === 200 ? mciResp.data.responseData : null;
      review = mciData && mciData.nodeReviews && mciData.nodeReviews.length > 0 ? mciData.nodeReviews[0] : null;
    }

    if (!review) {
      return await showPrecheckConfirmModal("NodeGroup Validation",
        "NodeGroup validation could not be performed.\nIt will be validated again at Deploy.\n\nAdd to the list anyway?");
    }

    var errors = review.errors || [];
    var warnings = review.warnings || [];

    // Review는 배포를 막는 차단 장치가 아니라 사전 권고 — 사유를 안내하고 진행 여부는 사용자가 선택
    if (review.status === "Error" || review.canCreate === false) {
      return await showPrecheckConfirmModal("NodeGroup Validation Failed",
        reviewReasonLines(errors.length ? errors : [review.message])
        + "\n\nThis check is advisory. Deployment may still succeed if the configuration is correct."
        + "\n\nAdd to the list anyway?");
    }

    if (review.status === "Warning" || warnings.length > 0) {
      return await showPrecheckConfirmModal("NodeGroup Validation Warning",
        reviewReasonLines(warnings.length ? warnings : [review.message])
        + "\n\nAdd to the list anyway?");
    }
    return true;
  } catch (e) {
    console.error("NodeGroup precheck failed:", e);
    return await showPrecheckConfirmModal("NodeGroup Validation",
      "NodeGroup validation could not be performed.\nIt will be validated again at Deploy.\n\nAdd to the list anyway?");
  } finally {
    isDonePrecheckRunning = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btnOrigHtml;
    }
  }
}

// Expert 모드 precheck — PostSpecImagePairReview로 spec+image 조합 호환성만 확인한다.
// vNet/Subnet/SG/SSHKey 정합성(connection 일치·subnet 소속)은 이 API로 검증되지 않으므로
// expressDone_btn()에서 필수값 존재 여부를 먼저 걸러낸 뒤 이 함수가 호출된다.
async function precheckNodeGroupExpert(express_form) {
  if (isDonePrecheckRunning) {
    return false;
  }
  isDonePrecheckRunning = true;

  var btn = document.getElementById("express_done_btn");
  var btnOrigHtml;
  if (btn) {
    btnOrigHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span>Validating...';
  }

  try {
    var resp = await webconsolejs["common/api/services/infra_api"].specImagePairReview(
      express_form.commonSpec, express_form.commonImage, express_form.rootDiskType, express_form.zone
    );
    var review = resp && resp.status === 200 ? resp.data.responseData : null;

    if (!review) {
      return await showPrecheckConfirmModal("NodeGroup Validation",
        "NodeGroup validation could not be performed.\nIt will be validated again at Deploy.\n\nAdd to the list anyway?");
    }

    var errors = review.errors || [];
    var warnings = review.warnings || [];

    // Review는 배포를 막는 차단 장치가 아니라 사전 권고 — Express 모드와 동일한 안내 방식
    if (review.isValid === false || review.status === "Error") {
      return await showPrecheckConfirmModal("NodeGroup Validation Failed",
        reviewReasonLines(errors.length ? errors : [review.message])
        + "\n\nThis check is advisory. Deployment may still succeed if the configuration is correct."
        + "\n\nAdd to the list anyway?");
    }

    if (review.status === "Warning" || warnings.length > 0) {
      return await showPrecheckConfirmModal("NodeGroup Validation Warning",
        reviewReasonLines(warnings.length ? warnings : [review.message])
        + "\n\nAdd to the list anyway?");
    }
    return true;
  } catch (e) {
    console.error("Expert NodeGroup precheck failed:", e);
    return await showPrecheckConfirmModal("NodeGroup Validation",
      "NodeGroup validation could not be performed.\nIt will be validated again at Deploy.\n\nAdd to the list anyway?");
  } finally {
    isDonePrecheckRunning = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btnOrigHtml;
    }
  }
}

// express_form을 Express_Server_Config_Arr에 반영(신규 push 또는 수정 모드 갱신) + <li> 렌더
function addServerConfigToList(express_form) {
  // 이름이 비어 있으면(중복 충돌로 clear된 경우) 클릭 대상을 식별할 수 있도록 placeholder 라벨을 쓴다.
  // btn-info는 "NodeGroup 칩"의 안정적 마커이므로 유지하고, 상태는 별도 클래스로만 표현한다.
  var hasName = !!(express_form.name && String(express_form.name).trim());
  var server_name = hasName ? express_form.name : NO_NAME_LABEL;
  var server_cnt = parseInt(express_form.subGroupSize);

  // 수정 모드인지 신규 추가 모드인지 판단
  if (currentEditingIndex >= 0 && currentEditingIndex < Express_Server_Config_Arr.length) {
    // 수정 모드: 기존 데이터를 업데이트 (폼에 없는 carry-through 필드는 보존)
    Express_Server_Config_Arr[currentEditingIndex] = { ...Express_Server_Config_Arr[currentEditingIndex], ...express_form };

    // 리스트 아이템 텍스트 업데이트
    var vmEleId = "vm";
    if (!isVm) {
      vmEleId = "mci";
    }
    var displayServerCnt = '(' + server_cnt + ')';
    var listItem = $("#" + vmEleId + "_server_list li").eq(currentEditingIndex + 1); // +1은 plusIcon 때문
    listItem.text(server_name + displayServerCnt);
    listItem.toggleClass("nodegroup-name-missing border border-danger", !hasName);

    // 수정 모드 플래그 초기화
    currentEditingIndex = -1;
  } else {
    // 신규 추가 모드: 배열에 추가하고 리스트에 추가
    var add_server_html = "";

    Express_Server_Config_Arr.push(express_form);

    var displayServerCnt = '(' + server_cnt + ')';
    var missingClass = hasName ? '' : ' nodegroup-name-missing border border-danger';
    add_server_html += '<li class="removebullet btn btn-info' + missingClass + '" onclick="webconsolejs[\'partials/operation/manage/infracreate\'].view_express(\'' + express_data_cnt + '\')">'
      + server_name + displayServerCnt
      + '</li>';

    var vmEleId = "vm";
    if (!isVm) {
      vmEleId = "mci";
    }
    $("#" + vmEleId + "_plusVmIcon").remove();
    $("#" + vmEleId + "_server_list").append(add_server_html);
    $("#" + vmEleId + "_server_list").prepend(getPlusVm(vmEleId));

    express_data_cnt++;
  }
}

// 모달들 초기화 함수
function resetModals() {
	// Spec Search 모달 초기화
	if (typeof webconsolejs !== 'undefined' && webconsolejs['partials/operation/manage/serverrecommendation']) {
		// Spec 모달의 테이블 초기화
		if (window.recommendTable) {
			window.recommendTable.clearData();
		}
		// Spec 모달의 선택 상태 초기화
		$("#spec-search input[type='checkbox']").prop('checked', false);
		$("#spec-search .form-control").val("");
		// Cloud Provider Filter 드롭다운 초기화
		$("#spec-provider-filter").val("");
		// Region 드롭다운 초기화
		$("#assistRecommendSpecConnectionName").val("");
	}
	
	// Image Search 모달 초기화
	if (typeof webconsolejs !== 'undefined' && webconsolejs['partials/operation/manage/imagerecommendation']) {
		// Image 모달의 테이블 초기화
		if (window.recommendImageTable) {
			window.recommendImageTable.clearData();
		}
		// Image 모달의 선택 상태 초기화
		$("#image-search input[type='checkbox']").prop('checked', false);
		$("#image-search .form-control").val("");
		$("#assist_os_type").val("");
		$("#gpu_image_value").val("false");
		$("#assist_gpu_image").prop('checked', false);
	}
}

export function view_express(cnt) {
  // NodeGroup 리스트 아이템 클릭 시 해당 서버 정보를 폼에 채워서 수정 모드로 전환
  
  currentEditingIndex = parseInt(cnt); // 수정 모드 플래그 설정
  
  if (currentEditingIndex < 0 || currentEditingIndex >= Express_Server_Config_Arr.length) {
    console.error('Invalid server index:', currentEditingIndex);
    return;
  }
  
  var select_form_data = Express_Server_Config_Arr[currentEditingIndex];
  
  // 폼 필드에 기존 데이터 채우기
  $("#ep_name").val(select_form_data.name || "");
  $("#ep_description").val(select_form_data.description || "");
  $("#ep_vm_add_cnt").val(select_form_data.subGroupSize || "1");
  $("#ep_root_disk_type").val(select_form_data.rootDiskType || "");
  $("#ep_root_disk_size").val(select_form_data.rootDiskSize || "");
  $("#ep_command").val(select_form_data.command || "");
  
  // 숨겨진 필드들 (commonSpec, connectionName 등)
  $("#ep_provider").val(select_form_data.provider || "");
  $("#ep_connectionName").val(select_form_data.connectionName || "");
  $("#ep_commonSpecId").val(select_form_data.commonSpec || "");
  $("#ep_specId").val(select_form_data.specId || "");
  $("#ep_commonImageId").val(select_form_data.commonImage || "");
  $("#ep_imageId").val(select_form_data.imageId || "");
  $("#ep_imageId_input").val(select_form_data.commonImage || select_form_data.imageId || "");
  
  // p_* 필드들도 함께 설정 (호환성)
  $("#p_provider").val(select_form_data.provider || "");
  $("#p_connectionName").val(select_form_data.connectionName || "");
  $("#p_name").val(select_form_data.name || "");
  $("#p_description").val(select_form_data.description || "");
  $("#p_imageId").val(select_form_data.imageId || "");
  $("#p_commonImageId").val(select_form_data.commonImage || "");
  $("#p_commonSpecId").val(select_form_data.commonSpec || "");
  $("#p_root_disk_type").val(select_form_data.rootDiskType || "");
  $("#p_root_disk_size").val(select_form_data.rootDiskSize || "");
  $("#p_specId").val(select_form_data.specId || "");
  $("#p_command").val(select_form_data.command || "");
  $("#p_subGroupSize").val(select_form_data.subGroupSize || "1");
  $("#p_vm_cnt").val(select_form_data.subGroupSize || "1");
  
  // 기존 label을 Node Labels 편집기로 로드 (template carry-through label 포함 — 편집 가능)
  setNodeLabels(select_form_data.label);
  // Node User Password 로드 — password 타입 입력으로 마스킹 표시
  $("#ep_node_user_password").val(select_form_data.nodeUserPassword || "");

  // template carry-through 필드 read-only 표시 (값 없으면 빈 칸 — label은 편집기로 이동)
  renderCarryThroughSection(select_form_data);

  // 서버 입력 폼 표시
  var div = document.getElementById("server_configuration");
  if (!div.classList.contains("active")) {
    webconsolejs["partials/layout/navigatePages"].toggleSubElement(div);
  }
}

// template Add NodeGroup carry-through 필드(zone/vNetTemplateId/sgTemplateId)를
// 편집 폼에 read-only로 표시 — template 유래 값이 하나라도 있을 때만 섹션 표시.
// nodeUserPassword·label은 일반 입력(모든 모드)으로 전환되어 여기서 제외.
function renderCarryThroughSection(data) {
  var section = document.getElementById("carry_through_section");
  var fields = document.getElementById("carry_through_fields");
  if (!section || !fields) return;

  var items = [
    ["zone", "Zone", (data && data.zone) || ""],
    ["vNetTemplateId", "vNet Template ID", (data && data.vNetTemplateId) || ""],
    ["sgTemplateId", "SG Template ID", (data && data.sgTemplateId) || ""],
  ];

  // template 유래 값이 없으면(express 직접 생성 등) 섹션 숨김
  var hasValue = items.some(function (item) { return item[2] !== ""; });
  if (!hasValue) {
    fields.innerHTML = "";
    section.classList.add("d-none");
    return;
  }

  fields.innerHTML = "";
  items.forEach(function (item) {
    var col = document.createElement("div");
    col.className = "col-md-6";
    var label = document.createElement("label");
    label.className = "form-label";
    label.textContent = item[1];
    var input = document.createElement("input");
    input.type = "text";
    input.className = "form-control carry-through-readonly";
    input.readOnly = true;
    input.setAttribute("data-carry-field", item[0]);
    input.value = item[2]; // DOM value 할당 — template 값의 HTML 해석(XSS) 방지
    col.appendChild(label);
    col.appendChild(input);
    fields.appendChild(col);
  });
  section.classList.remove("d-none");
}


// Assist spec 클릭 시
// 공통으로 뺄 것

var ROOT_DISK_MAX_VALUE = 0;
var ROOT_DISK_MIN_VALUE = 0;

// Disk Type 선택 시 Disk Size Min/Max 설정 > 보완할 것
export function changeDiskSize(type) {
	var disk_size = DISK_SIZE;

	if (disk_size && Array.isArray(disk_size)) {
		disk_size.forEach(item => {
			// item이 문자열인지 확인 후 split 실행
			if (typeof item === 'string' && item.includes('|')) {
				var temp_size = item.split("|")
				var temp_type = temp_size[0];
				if (temp_type == type) {
					ROOT_DISK_MAX_VALUE = temp_size[1]
					ROOT_DISK_MIN_VALUE = temp_size[2]
				}
			}
		})
	}
	$("#s_rootDiskType").val(type);
	$("#e_rootDiskType").val(type);

}




// plus 버튼을 추가
function getPlusVm(vmElementId) {

	var append = "";
	append = append + '<li class="removebullet btn btn-secondary-lt" id="' + vmElementId + '_plusVmIcon" onClick="webconsolejs[\'partials/operation/manage/infracreate\'].displayNewServerForm()">';
	append = append + "+ NodeGroup"
	append = append + '</li>';
	return append;
}
// 서버정보 입력 area에서 'DONE'버튼 클릭시 array에 담고 form을 초기화

var totalDeployServerCount = 0;
var TotalServerConfigArr = new Array();// 최종 생성할 서버 목록
// deploy 버튼 클릭시 등록한 서버목록을 배포.
// function btn_deploy(){
export function deployMci() {
	createMciDynamic()
	// express 는 express 만, simple + expert + import 는 합쳐서
	// 두개의 mci는 만들어 질 수 없으므로 
	// var deploymentAlgo = $("#placement_algo").val()
	// if (deploymentAlgo == "express") {
	// 	createMciDynamic()
	// }
	// else{
	//     var mci_name = $("#mci_name").val();
	//     if (!mci_name) {
	//         commonAlert("Please Input MCIS Name!!!!!")
	//         return;
	//     }
	//     var mci_desc = $("#mci_desc").val();
	//     var placement_algo = $("#placement_algo").val();
	//     var installMonAgent = $("#installMonAgent").val();

	//     var new_obj = {}

	//     var vm_len = 0;

	//     if (IsImport) {
	//         // ImportedMciScript.name = mci_name;
	//         // ImportedMciScript.description = mci_desc;
	//         // ImportedMciScript.installMonAgent = installMonAgent;
	//         // console.log(ImportedMciScript);
	//         //var theJson = jQuery.parseJSON($(this).val())
	//         //$("#mciImportScriptPretty").val(fmt);	
	//         new_obj = $("#mciImportScriptPretty").val();
	//         new_obj.id = "";// id는 비워준다.
	//     } else {
	//         //         console.log(Simple_Server_Config_Arr)

	//         // mci 생성이므로 mciID가 없음
	//         new_obj['name'] = mci_name
	//         new_obj['description'] = mci_desc
	//         new_obj['installMonAgent'] = installMonAgent

	//         // Express_Server_Config_Arr 은 별도처리


	//         if (Simple_Server_Config_Arr) {
	//             vm_len = Simple_Server_Config_Arr.length;
	//             for (var i in Simple_Server_Config_Arr) {
	//                 TotalServerConfigArr.push(Simple_Server_Config_Arr[i]);
	//             }
	//         }

	//         if (Expert_Server_Config_Arr) {
	//             vm_len = Expert_Server_Config_Arr.length;
	//             for (var i in Expert_Server_Config_Arr) {
	//                 TotalServerConfigArr.push(Expert_Server_Config_Arr[i]);
	//             }
	//         }

	//         if (TotalServerConfigArr) {
	//             vm_len = TotalServerConfigArr.length;
	//             console.log("Server_Config_Arr length: ", vm_len);
	//             new_obj['vm'] = TotalServerConfigArr;
	//             console.log("new obj is : ", new_obj);
	//         } else {
	//             commonAlert("Please Input Nodes");
	//             $(".simple_servers_config").addClass("active");
	//             $("#s_name").focus();
	//         }
	//     }

	//     var url = getWebToolUrl("MciRegProc")
	//     try {
	//         axios.post(url, new_obj, {
	//             // headers: {
	//             //     'Content-type': "application/json",
	//             // },
	//         }).then(result => {
	//             console.log("MCIR Register data : ", result);
	//             console.log("Result Status : ", result.status);
	//             if (result.status == 201 || result.status == 200) {
	//                 commonResultAlert("Register Requested")
	//             } else {
	//                 commonAlert("Register Fail")
	//             }
	//         }).catch((error) => {
	//             // console.warn(error);
	//             console.log(error.response)
	//             var errorMessage = error.response.data.error;
	//             var statusCode = error.response.status;
	//             commonErrorAlert(statusCode, errorMessage)

	//         })
	//     } catch (error) {
	//         commonAlert(error);
	//         console.log(error);
	//     }
	// }    
}
export async function createMciDynamic() {
	// Expert 모드는 PostInfra(비-dynamic)를 쓴다 — 전 nodeGroup이 이미 Done 시점에
	// PostSpecImagePairReview로 개별 precheck을 마쳤으므로, 여기서는 infra 단위 review 없이 바로 배포한다
	// (dynamic처럼 spec/image 자동탐색을 하지 않아 동일한 infra-level review API가 없다).
	if (currentDeployMode() === "expert") {
		return await createMciStatic();
	}

	// 이름 검증은 review 호출보다 앞에 둔다 — 확정 실패에 네트워크 왕복을 낭비하지 않는다.
	if (!validateNodeGroupNamesBeforeDeploy()) return;

	// var namespace = webconsolejs["common/api/services/workspace_api"].getCurrentProject()
	// nsid = namespace.Name
	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

	var selectedNsId = selectedWorkspaceProject.nsId;
	var projectId = $("#select-current-project").text()
	var projectName = $('#select-current-project').find('option:selected').text();
	var nsId = projectName;

	var mciName = $("#mci_name").val()
	var mciDesc = $("#mci_desc").val()
	var policyOnPartialFailure = $("#mci_policy_on_partial_failure").val()


	
	if (!mciName) {
		alert("Please Input Infra Name!!!!!")
		return;
	}

	if (!mciDesc) {
		mciDesc = "Made in CB-TB"
	}

	// 기본 label 자동 주입 + 사용자 label merge — review/deploy 동일 객체 전송
	const deployLabels = getInfraDeployLabels();

	// MCI 생성 전 검증 API 호출
	try {
		const validationResult = await webconsolejs["common/api/services/infra_api"].mciDynamicReview(
			mciName, mciDesc, Express_Server_Config_Arr, selectedNsId, deployLabels
		);
		
		
		if (validationResult && validationResult.status === 200) {
			const reviewData = validationResult.data.responseData;
			
			// Review는 배포를 막는 차단 장치가 아니라 사전 권고(배포 API는 review를 호출하지 않음) —
			// Error/Warning 모두 사유를 안내하고 진행 여부는 사용자가 선택한다.
			if (reviewData.overallStatus === "Error" || !reviewData.creationViable) {
				// 노드별 오류 상세 수집 — 배포 백엔드 계약은 nodeReviews[]/nodeName/nodeGroupSize
				var errorLines = [reviewData.overallMessage || "Infra review reported errors"];

				if (reviewData.nodeReviews && reviewData.nodeReviews.length > 0) {
					reviewData.nodeReviews.forEach(node => {
						if (node.status === "Error" && node.errors) {
							var head = "Node: " + node.nodeName + " (NodeGroup Size: " + node.nodeGroupSize + ")";
							if (node.providerName) head += " / Provider: " + node.providerName;
							if (node.regionName) head += " / Region: " + node.regionName;
							if (node.imageValidation && node.imageValidation.resourceId) {
								head += " / Image: " + node.imageValidation.resourceId;
							}
							errorLines.push(head);
							node.errors.forEach(err => {
								errorLines.push("- " + err);
							});
						}
					});
				}

				const proceedOnError = await showPrecheckConfirmModal("Infra Deployment Warning",
					errorLines.join("\n")
					+ "\n\nThis check is advisory. Deployment may still succeed if the configuration is correct."
					+ "\n\nDeploy anyway?");
				if (!proceedOnError) {
					return;
				}
			} else if (reviewData.overallStatus === "Warning") {
				// 경고가 있지만 생성 가능 - 사용자 확인 후 진행
				const proceedOnWarning = await showPrecheckConfirmModal("Infra Deployment Warning",
					(reviewData.overallMessage || "Infra review reported warnings")
					+ (reviewData.estimatedCost ? "\n\nEstimated cost: " + reviewData.estimatedCost : "")
					+ "\n\nDeploy anyway?");
				if (!proceedOnWarning) {
					return;
				}
			}

			// Ready / 사용자가 확인한 Error·Warning → 배포 진행
			webconsolejs["common/api/services/infra_api"].mciDynamic(mciName, mciDesc, Express_Server_Config_Arr, selectedNsId, policyOnPartialFailure, deployLabels);
			scheduleDiskAttachForConfigs(selectedNsId, mciName, Express_Server_Config_Arr);
		} else {
			// API 호출 실패
			console.error("Infra review API call failed:", validationResult);
			alert("An error occurred while validating the Infra creation request.");
		}
	} catch (error) {
		console.error("Infra review error:", error);
		alert("An error occurred while validating the Infra: " + error.message);
	}
}

// Expert 모드 Create Infra — PostInfra(model.InfraReq) 직접 배포.
// mciStatic()이 fire-and-forget으로 요청을 쏘고 자체적으로 navigate하므로 여기서는 await하지 않는다
// (dynamic 경로의 createMciDynamic()이 mciDynamic()을 호출하는 방식과 동일).
// Disk Attach 오케스트레이션(scheduleDiskAttachForConfigs)은 dataDiskIds 미지원 범위라 호출하지 않는다.
async function createMciStatic() {
	if (!validateNodeGroupNamesBeforeDeploy()) return;

	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
	var selectedNsId = selectedWorkspaceProject.nsId;

	var mciName = $("#mci_name").val();
	var mciDesc = $("#mci_desc").val();
	var policyOnPartialFailure = $("#mci_policy_on_partial_failure").val();

	if (!mciName) {
		alert("Please Input Infra Name!!!!!");
		return;
	}
	if (!mciDesc) {
		mciDesc = "Made in CB-TB";
	}

	const deployLabels = getInfraDeployLabels();

	webconsolejs["common/api/services/infra_api"].mciStatic(
		mciName, mciDesc, Express_Server_Config_Arr, selectedNsId, policyOnPartialFailure, deployLabels
	);
}

export async function createVmDynamic() {
    // Expert 모드는 PostInfraNode(비-dynamic)를 쓴다 — dataDiskIds 미지원 범위라
    // Disk Attach 오케스트레이션은 생략한다.
    if (currentDeployMode() === "expert") {
        return await createVmStatic();
    }

    // vmDynamic 호출 전에 막아야 scheduleDiskAttachForConfigs·완료 alert·페이지 이동이 실행되지 않는다.
    if (!validateNodeGroupNamesBeforeDeploy()) return;

    var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
    var selectedNsId = selectedWorkspaceProject.nsId;
    var mciId = window.currentMciId;

    await webconsolejs["common/api/services/infra_api"].vmDynamic(mciId, selectedNsId, Express_Server_Config_Arr)
    // Data Disk attach 오케스트레이션 시작 — window.location 이동으로 끊기지 않도록
    // sessionStorage에 먼저 기록됨(scheduleDiskAttachAfterDeploy 내부), mciworkloads
    // 페이지 로드 시 resumePendingDiskAttachJobs()가 이어받는다.
    scheduleDiskAttachForConfigs(selectedNsId, mciId, Express_Server_Config_Arr);

    alert("Node creation request completed")
    window.location = `/webconsole/operations/manage/workloads/infraworkloads`;
}

async function createVmStatic() {
    if (!validateNodeGroupNamesBeforeDeploy()) return;

    var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
    var selectedNsId = selectedWorkspaceProject.nsId;
    var mciId = window.currentMciId;

    await webconsolejs["common/api/services/infra_api"].vmStatic(mciId, selectedNsId, Express_Server_Config_Arr)

    alert("Node creation request completed")
    window.location = `/webconsole/operations/manage/workloads/infraworkloads`;
}

export function addNewMci() {
	isVm = false
	Express_Server_Config_Arr = new Array();
	// Labels 입력 상태 초기화 (기본 label은 상수 — UI 뱃지 고정)
	infraCustomLabels = {};
	renderInfraLabelList();
	$("#mci_label_key").val("");
	$("#mci_label_value").val("");
}

// ////////////// VM Handling ///////////
export function addNewVirtualMachine() {
	Express_Server_Config_Arr = new Array();

	// window.currentMciId로 직접 접근
	var selectedMciId = window.currentMciId;
	console.log("selectedMciId", selectedMciId);
	
	// MCI 데이터에서 실제 name과 description 가져오기
	var mci_name = selectedMciId; // 기본값으로 ID 사용
	var mci_desc = "";
	
	if (selectedMciId && window.totalMciListObj) {
		var mciData = window.totalMciListObj.find(mci => mci.id === selectedMciId);
		if (mciData) {
			mci_name = mciData.name || selectedMciId;
			mci_desc = mciData.description || "";
		}
	}

	$("#extend_mci_name").val(mci_name)
	$("#extend_mci_desc").val(mci_desc)
	console.log("mci_name:", mci_name, "mci_desc:", mci_desc)

	isVm = true
}

export async function deployVm() {
	// var deploymentAlgo = $("#placement_algo").val()
	// if (deploymentAlgo == "express") {
	await createVmDynamic()
	// }else{

	//     var mci_name = $("#mci_name").val();
	//     var mci_id = $("#mci_id").val();
	//     if (!mci_id) {
	//         commonAlert("Please Select MCIS !!!!!")
	//         return;
	//     }
	//     totalDeployServerCount = 0;// deploy vm 개수 초기화
	//     var new_obj = {}// vm이 담길 변수

	//     // Express 는 별도처리임.

	//     if (Simple_Server_Config_Arr) {
	//         vm_len = Simple_Server_Config_Arr.length;
	//         for (var i in Simple_Server_Config_Arr) {
	//             TotalServerConfigArr.push(Simple_Server_Config_Arr[i]);
	//         }
	//     }

	//     if (Expert_Server_Config_Arr) {
	//         vm_len = Expert_Server_Config_Arr.length;
	//         for (var i in Expert_Server_Config_Arr) {
	//             TotalServerConfigArr.push(Expert_Server_Config_Arr[i]);
	//         }
	//     }

	//     //Import_Server_Config_Arr : import도 같이 추가
	//     if (Import_Server_Config_Arr) {
	//         vm_len = Import_Server_Config_Arr.length;
	//         for (var i in Import_Server_Config_Arr) {
	//             TotalServerConfigArr.push(Import_Server_Config_Arr[i]);
	//         }
	//     }

	//     if (TotalServerConfigArr) {
	//         vm_len = TotalServerConfigArr.length;
	//         console.log("Server_Config_Arr length: ", vm_len);
	//         new_obj['vm'] = TotalServerConfigArr;
	//         console.log("new obj is : ", new_obj);
	//     } else {
	//         commonAlert("Please Input Nodes");
	//         $(".simple_servers_config").addClass("active");
	//         $("#s_name").focus();
	//     }

	//     //var url = "/operation/manages/mcimng/" + mci_id + "/vm/reg/proc"
	//     var urlParamMap = new Map();
	//     urlParamMap.set(":mciID", mci_id)
	//     var url = setUrlByParam("MciVmListRegProc", urlParamMap)
	//     //var url = getWebToolUrl("MciVmRegProc")
	//     try {
	//         axios.post(url, new_obj, {
	//             // headers: {
	//             //     'Content-type': "application/json",
	//             // },
	//         }).then(result => {
	//             console.log("VM Register data : ", result);
	//             console.log("Result Status : ", result.status);
	//             if (result.status == 201 || result.status == 200) {
	//                 commonResultAlert("Register Requested")
	//             } else {
	//                 commonAlert("Register Fail")
	//             }
	//         }).catch((error) => {
	//             // console.warn(error);
	//             console.log(error.response)
	//             var errorMessage = error.response.data.error;
	//             var statusCode = error.response.status;
	//             commonErrorAlert(statusCode, errorMessage)

	//         })
	//     } catch (error) {
	//         commonAlert(error);
	//         console.log(error);
	//     }
	// }
}

// {
// 	"commonImage": "ubuntu18.04",
// 	"commonSpec": "aws+ap-northeast-2+t2.small",
// 	"connectionName": "string",
// 	"description": "Description",
// 	"label": "DynamicVM",
// 	"name": "g1-1",
// 	"rootDiskSize": "default, 30, 42, ...",
// 	"rootDiskType": "default, TYPE1, ...",
// 	"subGroupSize": "3",
// 	"vmUserPassword": "string"
//   }



///



// vm 생성 결과 표시
// 여러개의 vm이 생성될 수 있으므로 각각 결과를 표시
var resultVmCreateMap = new Map();

function vmCreateCallback(resultVmKey, resultStatus) {
	resultVmCreateMap.set(resultVmKey, resultStatus)
	var resultText = "";
	var createdServer = 0;
	for (let key of resultVmCreateMap.keys()) {
		resultText += key + " = " + resultVmCreateMap.get(resultVmKey) + ","
		//totalDeployServerCount--
		createdServer++;
	}

	// $("#serverRegistResult").text(resultText);

	if (resultStatus != "Success") {
		// add된 항목 제거 해야 함.

		// array는 초기화
		Simple_Server_Config_Arr.length = 0;
		simple_data_cnt = 0
		// TODO : expert 추가하면 주석 제거할 것
		Expert_Server_Config_Arr.length = 0;
		expert_data_cnt = 0
		Import_Server_Config_Arr.length = 0;
		import_data_cnt = 0
	}

	if (createdServer === totalDeployServerCount) { //모두 성공
		//getVmList();
		//commonResultAlert($("#serverRegistResult").text());

	} else if (createdServer < totalDeployServerCount) { //일부 성공
		// commonResultAlert($("#serverRegistResult").text());

	} else if (createdServer = 0) { //모두 실패
		//commonResultAlert($("#serverRegistResult").text());
	}
	commonResultAlert("Node creation request completed");
}

// NodeGroup Size
(function () {
	// ep_vm_add_cnt 처리 (PMK 스타일 input-number-container)
	const input = document.getElementById('ep_vm_add_cnt');
	if (input) {
		const container = input.parentElement; // .input-number-container
		const btnDec = container.querySelector('.input-number-decrement');
		const btnInc = container.querySelector('.input-number-increment');

		const minValue = 1;

		btnDec.addEventListener('click', function (e) {
			e.preventDefault();
			let val = parseInt(input.value, 10) || minValue;
			if (val > minValue) input.value = val - 1;
			updateDiskAttachAvailability();
		});

		btnInc.addEventListener('click', function (e) {
			e.preventDefault();
			let val = parseInt(input.value, 10) || minValue;
			input.value = val + 1; // maxValue 제한 제거
			updateDiskAttachAvailability();
		});

		input.addEventListener('input', updateDiskAttachAvailability);
	}

	// policy_ep_vm_add_cnt 처리 (mciworkloads.html용)
	const policyInput = document.getElementById('policy_ep_vm_add_cnt');
	if (policyInput) {
		const policyContainer = policyInput.parentElement; // .d-flex.align-items-center
		const [policyBtnDec, policyBtnInc] = policyContainer.querySelectorAll('button');

		const minValue = 1;
		const maxValue = Number(policyInput.getAttribute('max')) || Infinity;

		policyBtnDec.addEventListener('click', function (e) {
			e.preventDefault();
			let val = parseInt(policyInput.value, 10) || minValue;
			if (val > minValue) policyInput.value = val - 1;
		});

		policyBtnInc.addEventListener('click', function (e) {
			e.preventDefault();
			let val = parseInt(policyInput.value, 10) || minValue;
			if (val < maxValue) policyInput.value = val + 1;
		});
	}
})();

// Clear 버튼 함수 추가
export function clearExpressForm() {
	// 1. 모든 입력 필드 초기화
	$("#express_form")[0].reset();
	
	// 2. 숨겨진 필드들 초기화
	$("#ep_provider").val("");
	$("#ep_connectionName").val("");
	$("#ep_imageId").val("");
	$("#ep_commonImageId").val("");
	$("#ep_commonSpecId").val("");
	$("#ep_specId").val("");
	
	// 3. 직접 입력 필드들 초기화
	$("#ep_name").val("");
	$("#ep_description").val("");
	$("#ep_imageId_input").val("");
	$("#ep_root_disk_type").val("");
	$("#ep_root_disk_size").val("");
	$("#ep_vm_add_cnt").val("1"); // 기본값 1로 설정
	$("#ep_data_disk").val("");
	$("#ep_command").val("");
	setNodeLabels(null);
	$("#ep_node_user_password").val("");

	// 4. 수정 모드 플래그 초기화
	window.currentEditIndex = undefined;
	
	// 5. 폼은 그대로 유지 (토글하지 않음)
}


// ─── Infra Template으로 MCI 배포 ─────────────────────────────────────────

let templateSelectTable = null;
// Create MCI(#mci_deploy_algorithm)와 Extend VM(#vm_deploy_algorithm) 두 select가 template 모달을 공유한다
let deployAlgorithmPrev = { mci_deploy_algorithm: "express", vm_deploy_algorithm: "express" };
let templateModalSourceSelectId = "mci_deploy_algorithm"; // 모달을 연 select — 닫힐 때 이 select만 되돌린다
let templateDeploySucceeded = false;
let templateDeployInFlight = false;

const MODAL_DEPLOY_ALGORITHM_VALUES = ["template", "import_json"]; // 별도 모달을 여는 select 값 — 모달 트리거일 뿐 실제 배포 알고리즘이 아님

function revertDeployAlgorithmSelect() {
	const sel = document.getElementById(templateModalSourceSelectId);
	if (sel && MODAL_DEPLOY_ALGORITHM_VALUES.includes(sel.value)) sel.value = deployAlgorithmPrev[templateModalSourceSelectId] || "express";
}

// 템플릿 미리보기 초기화 (선택 없음 → 안내문구 표시)
function resetTemplateSelectDetail() {
	const hint = document.getElementById("template-select-detail-hint");
	const content = document.getElementById("template-select-detail-content");
	if (hint) hint.classList.remove("d-none");
	if (content) content.classList.add("d-none");
}

// 선택한 템플릿 내용을 읽기 전용으로 렌더링
function renderTemplateSelectDetail(template) {
	const hint = document.getElementById("template-select-detail-hint");
	const content = document.getElementById("template-select-detail-content");
	if (!content) return;
	if (hint) hint.classList.add("d-none");
	content.classList.remove("d-none");

	const req = template.infraDynamicReq || {};
	document.getElementById("template-select-detail-desc").textContent = template.description || "-";

	const tbody = document.getElementById("template-select-nodegroup-rows");
	tbody.innerHTML = "";
	const groups = req.nodeGroups || [];
	if (groups.length === 0) {
		const tr = document.createElement("tr");
		const td = document.createElement("td");
		td.colSpan = 7;
		td.className = "text-muted";
		td.textContent = "-";
		tr.appendChild(td);
		tbody.appendChild(tr);
	} else {
		groups.forEach(g => {
			const tr = document.createElement("tr");
			const rootDisk = [g.rootDiskType, g.rootDiskSize].filter(v => v !== undefined && v !== "" && v !== 0).join(" / ");
			[g.name, g.specId, g.imageId, g.nodeGroupSize, g.connectionName, rootDisk, g.zone].forEach(val => {
				const td = document.createElement("td");
				td.textContent = (val === undefined || val === null || val === "") ? "-" : String(val);
				tr.appendChild(td);
			});
			tbody.appendChild(tr);
		});
	}

	const block = document.getElementById("template-select-postcommand-block");
	// postCommands는 다단계 phase 배열(cb-tumblebug v0.12.29+) — 전 phase를 순서대로 이어붙인다.
	const commands = (req.postCommands || []).flatMap(pc => pc.command || []);
	if (commands.length > 0) {
		block.classList.remove("d-none");
		document.getElementById("template-select-postcommand").textContent = commands.join("\n");
	} else {
		block.classList.add("d-none");
	}
}

function initTemplateDeploySelect() {
	["mci_deploy_algorithm", "vm_deploy_algorithm"].forEach(function (selId) {
		const sel = document.getElementById(selId);
		if (!sel) return;
		deployAlgorithmPrev[selId] = sel.value;
		sel.addEventListener("change", async function () {
			if (!MODAL_DEPLOY_ALGORITHM_VALUES.includes(this.value)) {
				deployAlgorithmPrev[selId] = this.value;
				return;
			}
			// Create MCI 경로만 MCI Name 선입력 필수 — Extend VM은 기존 MCI 대상이라 불필요
			if (selId === "mci_deploy_algorithm") {
				const mciName = ($("#mci_name").val() || "").trim();
				if (!mciName) {
					webconsolejs["common/utils/toast"].showToast(webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR, "Please input Infra Name first");
					this.value = "express";
					deployAlgorithmPrev[selId] = "express";
					return;
				}
			}
			templateModalSourceSelectId = selId;
			if (this.value === "import_json") {
				openImportJsonModal();
			} else {
				await openTemplateSelectModal();
			}
		});
	});
}

export async function openTemplateSelectModal() {
	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
	var nsId = selectedWorkspaceProject.nsId;
	if (!nsId) {
		webconsolejs["common/utils/toast"].showToast(webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR, "Please select a project first");
		revertDeployAlgorithmSelect();
		return;
	}

	let templates = [];
	try {
		const data = await webconsolejs["common/api/services/infratemplate_api"].list(nsId);
		templates = data?.templates || [];
	} catch (e) {
		if (e?.response?.status !== 404) console.error("Failed to load infra templates", e);
	}

	if (templateSelectTable) {
		templateSelectTable.replaceData(templates);
		templateSelectTable.deselectRow();
	} else {
		templateSelectTable = new Tabulator("#template-select-table", {
			data: templates,
			layout: "fitColumns",
			placeholder: "No infra templates found.",
			selectableRows: 1,
			columns: [
				{ title: "Name", field: "name", sorter: "string" },
				{ title: "Description", field: "description", sorter: "string" },
				{
					title: "NodeGroups", field: "infraDynamicReq", headerSort: false,
					formatter: function (cell) {
						const groups = cell.getValue()?.nodeGroups || [];
						const total = groups.reduce((sum, g) => sum + (Number(g.nodeGroupSize) || 0), 0);
						return `${groups.length} group(s) / ${total} node(s)`;
					}
				},
				{ title: "Created", field: "createdAt", sorter: "string", width: 180 }
			]
		});

		// 선택 변경 시 템플릿 미리보기 갱신
		templateSelectTable.on("rowSelectionChanged", function (data) {
			if (data.length > 0) renderTemplateSelectDetail(data[0]);
			else resetTemplateSelectDetail();
		});
	}

	const modalEl = document.getElementById("infra-template-select-modal");
	modalEl.addEventListener("shown.bs.modal", function () {
		if (templateSelectTable) templateSelectTable.redraw(true);
	}, { once: true });
	// 배포 없이 닫히면 Deployment Algorithm을 이전 값으로 되돌린다
	// (displayNewServerForm이 select 값으로 분기하므로 'template'으로 남겨두지 않음)
	templateDeploySucceeded = false;
	modalEl.addEventListener("hidden.bs.modal", function () {
		if (!templateDeploySucceeded) revertDeployAlgorithmSelect();
	}, { once: true });
	// Extend VM 경로에서는 새 MCI를 배포하는 [Deploy from Template] 버튼을 숨긴다 (Add NodeGroup만)
	const deployFromTplBtn = document.getElementById("btn-deploy-from-template");
	if (deployFromTplBtn) deployFromTplBtn.classList.toggle("d-none", templateModalSourceSelectId === "vm_deploy_algorithm");
	resetTemplateSelectDetail();
	new bootstrap.Modal(modalEl).show();
}

export async function deployFromSelectedTemplate() {
	if (templateDeployInFlight) return; // 요청 진행 중 중복 호출 방지

	const selected = templateSelectTable ? templateSelectTable.getSelectedData() : [];
	if (selected.length === 0) {
		webconsolejs["common/utils/toast"].showToast(webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR, "Please select a template");
		return;
	}
	const template = selected[0];

	var selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
	var nsId = selectedWorkspaceProject.nsId;

	var mciName = ($("#mci_name").val() || "").trim();
	var mciDesc = $("#mci_desc").val();

	if (!mciName) {
		webconsolejs["common/utils/toast"].showToast(webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR, "Infra Name is required");
		return;
	}

	const applyReq = { name: mciName };
	if (mciDesc) applyReq.description = mciDesc;

	const deployBtn = document.getElementById("btn-deploy-from-template");
	templateDeployInFlight = true;
	if (deployBtn) deployBtn.disabled = true;

	try {
		// requestId toast로 상태 표시 — 생성 요청만 보내고 결과를 기다리지 않는다
		webconsolejs["common/api/services/infratemplate_api"]
			.deployFromTemplate(nsId, template.id, applyReq, undefined, { loaderType: "none" })
			.catch(() => {});
		templateDeploySucceeded = true;
		bootstrap.Modal.getInstance(document.getElementById("infra-template-select-modal"))?.hide();
		// Toast가 보이도록 잠시 후 이동 (진행/완료는 asyncRequestTracker)
		setTimeout(() => { window.location.href = "/webconsole/operations/manage/workloads/infraworkloads"; }, 1500);
	} catch (e) {
		templateDeployInFlight = false;
		if (deployBtn) deployBtn.disabled = false;
		webconsolejs["common/utils/toast"].showToast(webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR, "Failed to deploy from template: " + (e?.message || e));
	}
}

// nodeGroups[] 원소(InfraDynamicReq 스키마, template/JSON import 공용) → express_form 매핑.
// req는 상위 InfraDynamicReq(postCommands[].command를 idx===0에만 carry-through하기 위해 필요), idx는 groups.forEach의 인덱스.
function mapNodeGroupToExpressForm(g, req, idx) {
	var express_form = {};
	express_form["provider"] = (g.specId || "").split("+")[0];
	express_form["connectionName"] = g.connectionName || "";
	express_form["name"] = g.name || "";
	express_form["description"] = g.description || "";
	express_form["subGroupSize"] = String(g.nodeGroupSize != null ? g.nodeGroupSize : 1);
	express_form["rootDiskSize"] = g.rootDiskSize;
	express_form["rootDiskType"] = g.rootDiskType || "";
	express_form["commonSpec"] = g.specId || "";
	express_form["commonImage"] = g.imageId || "";
	express_form["imageId"] = g.imageId || "";
	express_form["specId"] = g.specId || "";
	// infra 단위 postCommands는 첫 NodeGroup에만 반영(기존 command 처리 관례와 동일).
	// 다단계 phase 배열이므로 전 phase의 command를 순서대로 이어붙인다.
	express_form["command"] = idx === 0
		? (req?.postCommands || []).flatMap(pc => pc.command || []).join("\n")
		: "";

	// 정식 매핑 승격 5필드(CreateNodeGroupDynamicReq) — 값이 있을 때만 carry-through
	if (g.zone) express_form["zone"] = g.zone;
	if (g.nodeUserPassword) express_form["nodeUserPassword"] = g.nodeUserPassword;
	if (g.label && Object.keys(g.label).length > 0) express_form["label"] = g.label;
	if (g.vNetTemplateId) express_form["vNetTemplateId"] = g.vNetTemplateId;
	if (g.sgTemplateId) express_form["sgTemplateId"] = g.sgTemplateId;

	return express_form;
}

// ─── NodeGroup 이름 중복 검사 ─────────────────────────────────────────────
// Tumblebug이 리소스 id를 정규화하므로 g1/G1은 서버에서 충돌한다 → 대소문자 무시 비교.
const NO_NAME_LABEL = "(name required)";

function normalizeNodeGroupName(n) {
	return String(n == null ? "" : n).trim().toLowerCase();
}

// Add Node 경로에서 대상 Infra에 이미 존재하는 NodeGroup 이름 집합.
// Create Infra 경로(대상 Infra 없음)에서는 빈 Set.
// 조회 실패는 "기존 이름 없음"으로 취급하고 차단하지 않는다 — 최종 안전망은 백엔드다.
function getExistingNodeGroupNames() {
	const names = new Set();
	if (!isVm) return names;
	const infra = (window.totalMciListObj || []).find(m => m.id === window.currentMciId);
	((infra && infra.node) || []).forEach(function (n) {
		if (n && n.nodeGroupId) names.add(normalizeNodeGroupName(n.nodeGroupId));
	});
	return names;
}

// 현재 시점에 점유된 이름 집합(기존 Infra ∪ 폼에 쌓인 것). skipIndex는 수정 모드에서 자기 자신 제외용.
function collectTakenNodeGroupNames(skipIndex) {
	const taken = getExistingNodeGroupNames();
	Express_Server_Config_Arr.forEach(function (cfg, i) {
		if (i === skipIndex) return;
		const key = normalizeNodeGroupName(cfg && cfg.name);
		if (key) taken.add(key);
	});
	return taken;
}

// 사용 가능하면 null, 아니면 영문 사유 문자열
function checkNodeGroupNameAvailable(name, selfIndex) {
	const key = normalizeNodeGroupName(name);
	if (!key) return null; // 빈 값은 필수항목 검증이 따로 처리
	if (getExistingNodeGroupNames().has(key)) {
		return "NodeGroup name '" + String(name).trim() + "' already exists in this Infra. Please use a different name.";
	}
	const dup = Express_Server_Config_Arr.some(function (cfg, i) {
		return i !== selfIndex && normalizeNodeGroupName(cfg && cfg.name) === key;
	});
	if (dup) {
		return "NodeGroup name '" + String(name).trim() + "' is already used by another NodeGroup in this list. Please use a different name.";
	}
	return null;
}

// import 대상 nodeGroups의 충돌 여부를 미리 계산(표시 전용). 반환: boolean[] (행 순서 그대로)
function detectNodeGroupNameConflicts(groups) {
	const taken = collectTakenNodeGroupNames(-1);
	return (groups || []).map(function (g) {
		const key = normalizeNodeGroupName(g && g.name);
		if (!key) return false;
		if (taken.has(key)) return true;
		taken.add(key); // 파일 내부 중복도 두 번째부터 충돌로 잡는다
		return false;
	});
}

// nodeGroups[] 전체를 폼에 append(항상 신규 추가 모드) — template/JSON import 공용
// 이름이 이미 점유돼 있으면 비워서 넣는다. 필수항목이므로 사용자가 직접 입력해야 Deploy가 통과한다.
function appendNodeGroupsToForm(req) {
	const groups = req?.nodeGroups || [];
	// 항상 append 모드로 동작 — 모달 오픈 시점에 편집 중이던 상태가 남아있지 않도록 방어
	currentEditingIndex = -1;
	const taken = collectTakenNodeGroupNames(-1);
	let cleared = 0;
	groups.forEach(function (g, idx) {
		const express_form = mapNodeGroupToExpressForm(g, req, idx);
		const key = normalizeNodeGroupName(express_form.name);
		if (key && taken.has(key)) {
			express_form.name = "";
			cleared++;
		} else if (key) {
			taken.add(key);
		}
		addServerConfigToList(express_form);
	});
	return { added: groups.length, cleared: cleared };
}

// 선택한 template의 nodeGroups를 기존 NodeGroup 목록에 추가(append) — 수정 후 배포용 프리필
// infra 단위 값(description/policyOnPartialFailure/installMonAgent/sgTemplateId/vNetTemplateId/postCommands[0].userName·timeoutMinutes)은
// 이 모듈 상태에 보관만 하고, 실제 배포 payload 병합은 WEB-TECH-019(FR-05-02)에서 처리한다.
let templatePrefillInfraState = null;

export function addTemplateToForm() {
	const selected = templateSelectTable ? templateSelectTable.getSelectedData() : [];
	if (selected.length === 0) {
		webconsolejs["common/utils/toast"].showToast(webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR, "Please select a template");
		return;
	}
	const template = selected[0];
	const req = template.infraDynamicReq || {};

	appendNodeGroupsToForm(req);

	templatePrefillInfraState = {
		description: req.description || "",
		policyOnPartialFailure: req.policyOnPartialFailure || "",
		installMonAgent: req.installMonAgent || "",
		vNetTemplateId: req.vNetTemplateId || "",
		sgTemplateId: req.sgTemplateId || "",
		// postCommands는 다단계 phase 배열 — 첫 phase 기준으로 이관(model.PostCommandReq에 두 필드 모두 존재)
		postCommandUserName: req.postCommands?.[0]?.userName || "",
		postCommandTimeoutMinutes: req.postCommands?.[0]?.timeoutMinutes
	};
	// Create MCI 경로에서만 — Extend VM은 기존 MCI의 description을 유지한다
	if (!isVm && !$("#mci_desc").val() && templatePrefillInfraState.description) {
		$("#mci_desc").val(templatePrefillInfraState.description);
	}

	bootstrap.Modal.getInstance(document.getElementById("infra-template-select-modal"))?.hide();
}

// ─── JSON 파일로 NodeGroup Import ───────────────────────────────────────
// "진짜 Node Import" — export한 JSON(InfraDynamicReq 형상, mci.js exportInfraAsJson()이 만드는 것과 동일 포맷)을
// 읽어 Add Node 폼을 채운다. addTemplateToForm()과 동일하게 항상 "폼에 NodeGroup 추가" 경로로만 동작하고
// (JSON을 직접 받는 배포 전용 백엔드 엔드포인트가 없음), 실제 배포는 기존 Deploy 버튼으로 제출한다.

let importedNodeGroupsReq = null;
let importJsonDropzone = null;
// 드롭존과 파일선택 input을 동기화할 때 removedfile 핸들러가 미리보기를 지우지 않도록 막는 플래그
let isSyncingImportSources = false;

function resetImportJsonPreview() {
	const hint = document.getElementById("import-json-preview-hint");
	const content = document.getElementById("import-json-preview-content");
	if (hint) hint.classList.remove("d-none");
	if (content) content.classList.add("d-none");
	const warnEl = document.getElementById("import-json-conflict-warning");
	if (warnEl) {
		warnEl.textContent = "";
		warnEl.classList.add("d-none");
	}
	const btn = document.getElementById("btn-add-imported-nodegroups");
	if (btn) btn.disabled = true;
}

function renderImportJsonPreview(req, conflicts) {
	const hint = document.getElementById("import-json-preview-hint");
	const content = document.getElementById("import-json-preview-content");
	if (!content) return;
	if (hint) hint.classList.add("d-none");
	content.classList.remove("d-none");

	const groups = req.nodeGroups || [];
	const flags = conflicts || [];
	const conflictCount = flags.filter(Boolean).length;

	// 충돌 경고 배너 — 이름이 비워진 채 추가된다는 사실을 Add 누르기 전에 알린다
	const warnEl = document.getElementById("import-json-conflict-warning");
	if (warnEl) {
		if (conflictCount > 0) {
			warnEl.textContent = conflictCount + " NodeGroup name(s) are already in use. "
				+ "Their names will be cleared — enter a unique name for each before Deploy.";
			warnEl.classList.remove("d-none");
		} else {
			warnEl.textContent = "";
			warnEl.classList.add("d-none");
		}
	}

	const tbody = document.getElementById("import-json-nodegroup-rows");
	tbody.innerHTML = "";
	groups.forEach((g, idx) => {
		const tr = document.createElement("tr");
		const rootDisk = [g.rootDiskType, g.rootDiskSize].filter(v => v !== undefined && v !== "" && v !== 0).join(" / ");
		[g.name, g.specId, g.imageId, g.nodeGroupSize, g.connectionName, rootDisk, g.zone].forEach((val, col) => {
			const td = document.createElement("td");
			td.textContent = (val === undefined || val === null || val === "") ? "-" : String(val);
			// Name 컬럼(col 0)이 충돌이면 강조 + 배지. textContent 패턴을 깨지 않도록 배지만 append.
			if (col === 0 && flags[idx]) {
				td.classList.add("text-danger");
				const badge = document.createElement("span");
				badge.className = "badge bg-orange-lt ms-1";
				badge.textContent = "Duplicate";
				td.appendChild(badge);
			}
			tr.appendChild(td);
		});
		tbody.appendChild(tr);
	});
}

export function openImportJsonModal() {
	const fileInput = document.getElementById("import-nodegroups-json-file");
	if (fileInput) fileInput.value = "";
	importedNodeGroupsReq = null;
	resetImportJsonPreview();

	const modalEl = document.getElementById("import-nodegroups-json-modal");
	templateDeploySucceeded = false;
	// 트랜지션 완료 후 초기화 — setTimeout 추측값 대신 shown 이벤트를 쓴다(fade 150ms)
	modalEl.addEventListener("shown.bs.modal", initImportJsonDropzone, { once: true });
	modalEl.addEventListener("hidden.bs.modal", function () {
		clearImportJsonDropzoneFiles();
		if (!templateDeploySucceeded) revertDeployAlgorithmSelect();
	}, { once: true });
	bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// 드롭존에 쌓인 파일 비우기 — 미리보기를 지우는 removedfile 핸들러가 재진입하지 않도록 플래그로 감싼다
function clearImportJsonDropzoneFiles() {
	if (!importJsonDropzone) return;
	isSyncingImportSources = true;
	try { importJsonDropzone.removeAllFiles(true); } finally { isSyncingImportSources = false; }
}

function initImportJsonDropzone() {
	const el = document.getElementById("import-json-dropzone");
	if (!el) return;
	// 중복 초기화 가드 — Dropzone은 이미 붙은 엘리먼트에 다시 붙이면 예외를 던진다
	if (el.dropzone) {
		importJsonDropzone = el.dropzone;
		clearImportJsonDropzoneFiles();
		return;
	}
	importJsonDropzone = new Dropzone(el, {
		// <div> 기반이라 form action이 없다 — autoProcessQueue:false여도 url은 필수다
		url: "/",
		autoProcessQueue: false,
		maxFiles: 1,
		acceptedFiles: ".json,application/json",
		maxFilesize: 10,
		addRemoveLinks: true,
		clickable: true,
		dictDefaultMessage: "Drop a JSON file here or click to browse",
		init: function () {
			const dz = this;
			dz.on("addedfile", async function (file) {
				// maxFiles:1 — 새 파일이 이전 것을 대체한다
				if (dz.files.length > 1) {
					isSyncingImportSources = true;
					try { dz.removeFile(dz.files[0]); } finally { isSyncingImportSources = false; }
				}
				// 두 진입점(드롭/파일선택)의 상태가 어긋나지 않도록 input을 비운다
				const inp = document.getElementById("import-nodegroups-json-file");
				if (inp) inp.value = "";
				await loadImportJsonFile(file);
			});
			dz.on("removedfile", function () {
				if (isSyncingImportSources) return; // 프로그램적 제거는 미리보기를 지우지 않는다
				importedNodeGroupsReq = null;
				resetImportJsonPreview();
			});
			dz.on("error", function (file, msg) {
				dz.removeFile(file);
				webconsolejs["common/utils/toast"].showToast(
					webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR,
					typeof msg === "string" ? msg : "Invalid file"
				);
			});
		}
	});
}

// onchange 어댑터 — 시그니처와 export 이름을 유지해 HTML 인라인 핸들러를 그대로 둔다
export async function handleImportJsonFileChange(input) {
	const file = input.files && input.files[0];
	if (file) clearImportJsonDropzoneFiles();
	await loadImportJsonFile(file);
}

// 파싱·검증·미리보기 — 드롭존과 파일선택이 공유하는 실제 진입점
export async function loadImportJsonFile(file) {
	if (!file) {
		importedNodeGroupsReq = null;
		resetImportJsonPreview();
		return;
	}
	try {
		const text = await file.text();
		const parsed = JSON.parse(text);
		// { infraDynamicReq: { nodeGroups: [...] } } 래핑 형태와 { nodeGroups: [...] } 형태 둘 다 허용
		const req = parsed.infraDynamicReq || parsed;
		const groups = req.nodeGroups;
		if (!Array.isArray(groups) || groups.length === 0) {
			throw new Error("JSON must contain a non-empty 'nodeGroups' array (optionally wrapped in 'infraDynamicReq').");
		}
		const REQUIRED_FIELDS = ["name", "specId", "imageId", "nodeGroupSize", "connectionName"];
		groups.forEach(function (g, i) {
			const missing = REQUIRED_FIELDS.filter(k => g[k] === undefined || g[k] === null || g[k] === "");
			if (missing.length > 0) {
				throw new Error("nodeGroups[" + i + "] is missing required field(s): " + missing.join(", "));
			}
		});

		importedNodeGroupsReq = req;
		renderImportJsonPreview(req, detectNodeGroupNameConflicts(groups));
		const btn = document.getElementById("btn-add-imported-nodegroups");
		if (btn) btn.disabled = false;
	} catch (e) {
		importedNodeGroupsReq = null;
		resetImportJsonPreview();
		webconsolejs["common/utils/toast"].showToast(webconsolejs["common/utils/toast"].TOAST_TYPES.ERROR, "Invalid JSON file: " + (e?.message || e));
	}
}

export function applyImportedNodeGroups() {
	if (!importedNodeGroupsReq) return;
	const result = appendNodeGroupsToForm(importedNodeGroupsReq);
	const msg = result.cleared > 0
		? result.added + " NodeGroup(s) added from JSON. " + result.cleared
			+ " name(s) were already in use and have been cleared — enter a unique name for each before Deploy."
		: result.added + " NodeGroup(s) added from JSON.";
	webconsolejs["common/utils/toast"].showToast(
		result.cleared > 0
			? webconsolejs["common/utils/toast"].TOAST_TYPES.WARNING
			: webconsolejs["common/utils/toast"].TOAST_TYPES.SUCCESS,
		msg
	);
	bootstrap.Modal.getInstance(document.getElementById("import-nodegroups-json-modal"))?.hide();
}
