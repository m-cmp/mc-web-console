import { Modal } from "bootstrap";
var table;
var checked_array = [];
$(()=> {
    
    // search button    
    $('#namespaceVmspecAssist .btn_search_spec').on('click', function () {
        searchSpecsByRange('searchVmSpecAssistAtReg')
    });

    // apply buuton
    $('#namespaceVmspecAssist .btn_apply').on('click', function () {
        applyAssistValidCheck('vmSpecAssist');        
    });


    // spec popup slider settins
    var slider_memory_setting = {
		id: "spec_memory",
		min: 0,
		max: 128,
		step: 1,
		values: [0, 32],
	}

	var slider_cpu_setting = {
		id: "spec_cpu",
		min: 0,
		max: 128,
		step: 1,
		values: [0, 16],
	}
	
	mcpjs['util/util'].rangeSliderInit(slider_memory_setting)
	mcpjs['util/util'].rangeSliderInit(slider_cpu_setting)

    // table 초기 세팅
	var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
		{title: "Spec Id", field:"id", visible: false},
        {title: "Provider", field:"providerId", visible: false},
        {title: "Region", field:"regionName", visible: false},
        {title: "Connection", field:"connectionName", visible: false},
        {title: "Name", field:"name", headerSort:false},
		{title: "Csp Spec Name", field:"cspSpecName", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "Memory (GB)", field:"memGiB", hozAlign: "center", headerHozAlign: "center", headerSort:false},
        {title: "vCPU", field:"numvCPU", headerSort:false, hozAlign: "center",headerHozAlign: "center",  width:80},
        {title: "GPU", field:"numGpu", headerSort:false, hozAlign: "center",headerHozAlign: "center", width:60},
    ]
    
    var isMultiSelect = false;//한개 Row만 선택가능
    table = mcpjs["util/util"].setTabulator("assistNamespaceVmSpecList", tableObjParams, columns, isMultiSelect)

	table.on("rowSelectionChanged", function(data, rows){
		checked_array = data
	});
  
});

// popup이 호출될 때 parent에서 보내주는 param set.
export function setNamespaceVmSpecAssist(caller, providerId, regionName, connectionName){
    console.log("setNamespaceVmSpecAssist", caller)
    console.log("providerId=", providerId)
    console.log("regionName=", regionName)
    console.log("connectionName=", connectionName)    

    $("#parentsNamespaceVmSpecAssist").val(caller)

    if ( providerId != ""){
        // region 목록 설정.
        $("#ans_providerId").val(providerId);
        mcpjs['util/util'].resetRegionListByProvider(providerId, "ans_regionName", regionName)
    }

    if ( connectionName != ""){
        $("#parentsConnectionName").val(connectionName);
        // 해당 connection 정보로 조회
    }
    
}

// table의 row 클릭시 index 저장
export function setAssistValue(index) {
    $("#selectedIndexNamespaceVmSpecAssist").val(index);
}

// Assist Spec filter Search버튼 클릭시
export function searchSpecsByRange(caller) {
	// var specFilter = new Object();

	//var assistSpecConnectionNameVal = $("#assistSpecConnectionName option:selected").val();
    var selectedProviderId = $("#ans_providerId  option:selected").val()
    var selectedProviderName = "";
	var selectedRegionName = $("#ans_regionName  option:selected").val()
    var parentConnectionName = $("#parentsConnectionName").val();

    //if (selectedProviderId != ""){
    //    selectedProviderName = selectedProviderId.toLocaleLowerCase();
    //}
    

	if (caller == 'searchVmSpecAssistAtReg') {

	}
	// if (assistSpecConnectionNameVal) {
	//     specFilter.connectionName = assistSpecConnectionNameVal
	// }

	// storage
	// var storageMin = $("#assist_num_storage_min").val();
	// var storageMax = $("#assist_num_storage_max").val();
	// var storageObj = new Object();
	// storageObj.min = Number(storageMin)
	// storageObj.max = Number(storageMax)

	// Core
	// var coreMin = $("#assist_num_core_min").val();
	// var coreMax = $("#assist_num_core_max").val();
	// var coreObj = new Object();
	// coreObj.min = Number(coreMin)
	// coreObj.max = Number(coreMax)

	// specFilter.numCore = { "min": coreMin, "max": coreMax };

	// vCPU
	var vCpuMin = $("#assist_num_vCPU_min").val();
	var vCpuMax = $("#assist_num_vCPU_max").val();
	var vCpuObj = new Object();
	vCpuObj.min = Number(vCpuMin)
	vCpuObj.max = Number(vCpuMax)
	// specFilter.numvCPU = { "min": vCpuMin, "max": vCpuMax };

	// memory
	var memGiBMin = $("#assist_num_memory_min").val();
	var memGiBMax = $("#assist_num_memory_max").val();
	var memGiBObj = new Object();
	memGiBObj.min = Number(vCpuMin)
	memGiBObj.max = Number(vCpuMax)

    var specFilter = {
		//connectionName: assistSpecConnectionNameVal,
        providerId : selectedProviderId,
        providerName : selectedProviderName,
        //regionName : selectedRegionName,
        
		// maxTotalStorageTiB: storageObj,
		// numCore: coreObj,
		numvCPU: vCpuObj,
		memGib: memGiBObj,

        connectionName : parentConnectionName,
	}
	
    //mcpjs['util/pathfinder'].getCommonFilterVmSpecListByRange(specFilter, caller, mcpjs['vmspec/namespacevmspec_modal'].getCommonFilterVmSpecListCallbackSuccess);
    var controllerKeyName = "FilterVmSpecList";
    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].postCommonData(caller, controllerKeyName, optionParamMap, specFilter, mcpjs['vmspec/namespacevmspec_modal'].filterVmSpecListCallbackSuccess);
}

// 등록된 spec조회 성공 시 table에 뿌려주고, 클릭시 spec 내용 set.
export function filterVmSpecListCallbackSuccess(caller, result) {
    //export function getCommonFilterVmSpecListCallbackSuccess(caller, vmSpecList) {
    console.log(result);
    var vmSpecList = result.data.VmSpecList;
    console.log(vmSpecList);
    if (vmSpecList == null || vmSpecList == undefined || vmSpecList == "null") {

    } else {// 아직 data가 1건도 없을 수 있음        
        
        if (vmSpecList.length > 0) {
            table.setData(vmSpecList)
        }else{
           // TO DO: data가 0건 일때 보여줄 방법
        }
    }
}

// apply button을 눌렀을 때 값 set.
// parent에 전달해서 처리하는게 맞지 않나???
export function applyAssistValidCheck(caller) {
    var selectedIndex = $("#selectedIndexNamespaceVmSpecAssist").val();
   
    var orgPrefix = "vmSpecAssist_";
    //selectedConnectionName = $("#" + orgPrefix + "connectionName_" + selectedIndex).val();
    var selectedProviderId = $("#" + orgPrefix + "providerId_" + selectedIndex).val();
    var selectedRegionName = $("#" + orgPrefix + "regionName_" + selectedIndex).val();

    var eRegionName = $("#e_regionName").val()

    console.log("caller=" + caller)
    console.log("selectedRegionName=" + selectedRegionName)
    //$("#t_connectionName").val(selectedConnectionName);
    $("#t_providerId").val(selectedProviderId);
    if ( eRegionName != "" && eRegionName != selectedRegionName) {
    //if ($("#e_connectionName").val() != "" && $("#e_connectionName").val() != selectedConnectionName) {
        mcpjs['util/util'].commonConfirmOpen("DifferentConnectionAtAssistPopup", caller)
    } else {
        var selectedRows = table.getSelectedRows();
        selectedRows.forEach(function(row) {
        });
        var checked_row = checked_array[0];
        console.log("checked_row ", checked_row);

        let vmSpecMap = new Map();
        vmSpecMap.set("id", checked_row.id);
        vmSpecMap.set("name", checked_row.name);
        vmSpecMap.set("cspSpecId", checked_row.cspSpecId);
        vmSpecMap.set("cspSpecName", checked_row.cspSpecName);
        vmSpecMap.set("memGiB", checked_row.memGiB);
        vmSpecMap.set("numvCPU", checked_row.numvCPU);
        vmSpecMap.set("numGpu", checked_row.numGpu);
        vmSpecMap.set("providerId", checked_row.providerId);
        vmSpecMap.set("regionName", checked_row.regionName);
        vmSpecMap.set("connectionName", checked_row.connectionName);

        // vmSpecMap.set("id", $("#" + orgPrefix + "id_" + selectedIndex).val());
        // vmSpecMap.set("name", $("#" + orgPrefix + "name_" + selectedIndex).val());
        // vmSpecMap.set("cspSpecId", $("#" + orgPrefix + "cspSpecId_" + selectedIndex).val());
        // vmSpecMap.set("cspSpecName", $("#" + orgPrefix + "cspSpecName_" + selectedIndex).val());
        // vmSpecMap.set("memGiB", $("#" + orgPrefix + "memGiB_" + selectedIndex).val());
        // vmSpecMap.set("numvCPU", $("#" + orgPrefix + "numvCPU_" + selectedIndex).val());
        // vmSpecMap.set("numGpu", $("#" + orgPrefix + "numGpu_" + selectedIndex).val());
        // vmSpecMap.set("providerId", $("#" + orgPrefix + "providerId_" + selectedIndex).val());
        // vmSpecMap.set("regionName", $("#" + orgPrefix + "regionName_" + selectedIndex).val());
        // vmSpecMap.set("connectionName", $("#" + orgPrefix + "connectionName_" + selectedIndex).val());

        //applyAssistValues(caller)
        mcpjs['mcismng/vmconfigureexpert'].setValuesFromAssist("NamespaceVmSpecAssist", vmSpecMap);
    }
  }