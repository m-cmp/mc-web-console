// vm 에 disk attach, detach 용
import { Modal } from "bootstrap";
var table;
$(()=> {

    // $('#imageLookupAssist .btn_apply').on('click', function () {
    //     applyAssistValidCheck()
    // });
	// apply buuton
    $('#vmDiskSelectBox .btn_apply').on('click', function () {
        console.log("#vmDiskSelectBox .btn_apply clicked")
        //applyAssistValidCheck('namespaceVpcAssist')
		runAttachDataDisk('attach')
    });

    initTable();
    
})

var ROOT_DISK_MAX_VALUE = 0;
var ROOT_DISK_MIN_VALUE = 0;

//
export function setVmDiskAssist(caller, diskId, diskName, connectionName){
    $("#parentsVmDiskAssist").val(caller)

    $("#selected_disk").val(diskName);
    $("#selected_disk_id").val(diskId)
	$("#selected_connectionName").val(connectionName)
    
	// data 조회
	//mcpjs["util/pathfinder"].getCommonMcisList("dataDiskMng", "&filterKey=connection&filterVal="+connectionName, mcpjs['datadisk/datadiskmng'].getMcisListCallbackSuccess);
	var caller = "vmdiskassist";
	var actionName = "McisList";
	var optionParamMap = new Map();
	optionParamMap.set("filterKey", "connectionName");
	optionParamMap.set("filterVal", connectionName);
	mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['datadisk/vmdiskassist_modal'].mcisListCallbackSuccess)
}

export function mcisListCallbackSuccess(caller, result){
	var data = result.data.McisList;

	var connectionName = $("#selected_connectionName").val();
	var mcisVmArr = new Array();
	data.forEach((mcisItem)=>{
        
        var mcis_name = mcisItem.name;
        var mcis_id = mcisItem.id
		var mcis_label = mcisItem.label
		console.log("mcis_label: ",mcis_label);
		if( mcis_label != "mcks"){
			console.log("vm: ",mcisItem.vm);
			var vm_list = mcisItem.vm;
			
			vm_list.forEach((vmItem, i)=>{

				if( connectionName == vmItem.connectionName){
					var obj = {
						mcisId: mcis_id,
						mcisName: mcis_name,
						vmId: vmItem.id,
						vmName: vmItem.name,
						connectionName: vmItem.connectionName,
					};
					mcisVmArr.push(obj);
				}			
			})
		}// mcks는 attach 불가?
    });

	table.setData(mcisVmArr);    
}

function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
		{title:"MCIS ID", field:"mcisId", vertAlign: "middle", visible: false},
		{title:"VM ID", field:"vmId", vertAlign: "middle", visible: false},
		{title:"Connection", field:"connectionName", vertAlign: "middle", visible: false},

		{title:"MCIS", field:"mcisName", vertAlign: "middle"},
        {title:"VM", field:"vmName", vertAlign: "middle"},		
		
        // {title:"MCIS", field:"name", vertAlign: "middle"},
        // {title:"VM", field:"vmName", mutator: function(value,data){ return data.vm.name;}, vertAlign: "middle"},
		// {title:"VmId", field:"vmId", mutator: function(value,data){ return data.vm.id;}, visible: false},
		// {title:"Connection", field:"connectionName", mutator: function(value,data){ return data.iid.systemId;}, vertAlign: "middle"},
        
    ];
    
    var isMultiSelect = false;
    table = mcpjs["util/util"].setTabulator("vmList", tableObjParams, columns, isMultiSelect);
    
    table.on("rowSelectionChanged", function(data, rows){
    });

    mcpjs['util/util'].displayColumn(table)    
}


// 안쓰는 것 같은데... Disk Type 선택 시 Disk Size Min/Max 설정 > 보완할 것
export function changeDiskSize(type) {
	var disk_size = DISK_SIZE;

	if (disk_size) {
		disk_size.forEach(item => {
			var temp_size = item.split("|")
			var temp_type = temp_size[0];
			if (temp_type == type) {
				ROOT_DISK_MAX_VALUE = temp_size[1]
				ROOT_DISK_MIN_VALUE = temp_size[2]
			}
		})
	}
	console.log("ROOT_DISK_MAX_VALUE : ", ROOT_DISK_MAX_VALUE)
	console.log("ROOT_DISK_MIN_VALUE : ", ROOT_DISK_MIN_VALUE)
	$("#s_rootDiskType").val(type);
	$("#e_rootDiskType").val(type);

}

// 안쓰는 것 같은데...
export function displayAvailableDisk() {

	var configName = $("#ss_regConnectionName").val()
	var url = "/settings/resources/datadisk/"
	url += "?filterKey=connectionName&filterVal=" + configName
	console.log("check disk list : ", url);
	axios.get(url).then(result => {
		console.log("get result : ", result);
		var data = result.data.dataDiskInfoList;
		var html = "";
		console.log("get available disk : ", data);
		if (data != null || data.length > 0) {
			var avDiskCnt = 0
			data.forEach(item => {
				//console.log("get available disk : ", item);
				html += '<tr>'
					+ '<td class="overlay hidden column-50px" data-th="">'
					+ '<input type="checkbox" name="chk_attach" value="' + item.id + '"  title=""  /><label for="td_ch1"></label> <span class="ov off"></span>'

					+ '</td>'
					+ '<td class="btn_mtd ovm" data-th="name">' + item.name + '<span class="ov"></span></td>'
					+ '<td class="overlay hidden" data-th="diskType">'
					+ item.diskType
					+ '</td>'
					+ '<td class="overlay hidden" data-th="diskSize">'
					+ item.diskSize
					+ '/GB</td>'
					+ '</tr>';
				avDiskCnt++;
			})
			$("#availableDiskCnt").val(avDiskCnt)
			$("#availableDiskList").empty()
			$("#availableDiskList").append(html)
		} else {
			//commonAlert("해당 VM에 Attach 가능한 DISK가 없습니다");
			addRow();
			$("#availableDiskCnt").val(0)
			return;
		}

		$("#availableDiskSelectBox").modal();
		$('.dtbox.scrollbar-inner').scrollbar();

	})


}

// DataDiskMng 에 attach, detach 두가지를 object안에 함께 보냄
// TB에서 처리는 PUT으로 하나, UI에서는 편의상 POST로 처리함.
export function runAttachDataDisk(command) {
	var attachDataDiskList = [];
    var selMcisId = "";
	var selVmId = "";
	var selDataDiskId = "";

	selDataDiskId = $("#selected_disk_id").val();

    // var mcis_id = $("#attach_mcis_id").val();
    // var vm_id = $("#attach_vm_id").val();
    // var dataDiskId = $("#selected_disk").val()
    // var diskId = dataDiskId.split(",");
    // console.log("disk Ids arr : ",diskId);
    //var url = "/settings/resources/datadisk/mngdata?mcisID="+mcis_id+"&vmID="+vm_id;
    //    console.log("attach url = ",url);

	// Multi Select일 때
	// var selectedRows = table.getSelectedRows();
    // if (selectedRows.length == 0) {
    //     mcpjs["util/util"].commonAlert("Please Select a DataDisk !!");
    //     return;
    // }
    // if (selectedRows.length > 1) {
    //     mcpjs["util/util"].commonAlert("한개만 삭제할 수 있습니다");
    //     return;
    // }
	
    // selectedRows.forEach(function (row) {
    //     selDataDiskId = row.getCell("id").getValue();		
	// 	selMcisId = row.getCell("mcisId").getValue();
	// 	selVmId = row.getCell("vmId").getValue();

    //     var diskStatus = row.getCell("status").getValue();
    //     if(diskStatus == "attached"){
    //         mcpjs['util/util'].commonAlert("Disk에 할당된 VM이 있어 삭제 할 수 없습니다.");
    //         return false;
    //     }
	// 	attachDataDiskList.push(selDataDiskId);
    // });

	// 단일 Select일 때
	var selectedRows = table.getSelectedData();
	if (selectedRows.length > 0) {
		console.log(selectedRows);
		selMcisId = selectedRows[0].mcisId;
		selVmId = selectedRows[0].vmId;
		var diskStatus = selectedRows[0].status;
		
		if(diskStatus == "attached"){
            mcpjs['util/util'].commonAlert("Disk에 할당된 VM이 있어 삭제 할 수 없습니다.");
            return false;
        }
		attachDataDiskList.push(selDataDiskId);// 팝업창에 set 된 diskId
	} else {
		mcpjs["util/util"].commonAlert("Please Select a DataDisk !!");
        return;
	}

	if( attachDataDiskList.length == 0){
		mcpjs["util/util"].commonAlert("Please Select a DataDisk !!");
        return;
	}

    //
	var caller = "vmdiskassist_modal";
    var controllerKeyName = "DataDiskMng";
    var optionParamMap = new Map();
	optionParamMap.set("mcisId", selMcisId);
	optionParamMap.set("vmId", selVmId);
	var obj = {
        attachDataDiskList
    }
    mcpjs["util/pathfinder"].postCommonData(caller,controllerKeyName,optionParamMap,obj, mcpjs['datadisk/vmdiskassist_modal'].dataDiskMngCallbackSuccess)

}
// Datadisk mng save success
export function dataDiskMngCallbackSuccess(caller, result){
    var data = result.data;
    console.log(data);
    if(data.status == 200 || data.status == 201){
        mcpjs['util/util'].commonAlert("Success Attach DataDisk!")
		mcpjs['datadisk/datadiskmng'].setAssistDataDisk();
        $("#vmDiskSelectBox").modal("hide");
    }else{
		mcpjs['util/util'].commonAlert("Fail attach DataDisk at "+item + data.message)       
		mcpjs['datadisk/datadiskmng'].setAssistDataDisk();
		$("#vmDiskSelectBox").modal("hide");
    }    
}