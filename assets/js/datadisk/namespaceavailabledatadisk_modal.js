import { Modal } from "bootstrap";
import { DISK_TYPE_SIZE_MAP } from "../util/util";
import {client} from '/assets/js/util/util'
var table;
var checked_array = [];
// vm 에 disk attach, detach 용
$(()=> {
    
	// $('.btn_attach_disk').on('click', function(e){
    //     console.log("attach disk btn clicked")
    //     $("#availableDiskSelectBox").hide();// 자기자신은 hide
    //     displayVmAttachedDisk()
        
    // });

	var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
		{title: "Disk Id", field:"id", visible: false},
        {title: "Disk Name", field:"name", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "Disk Type", field:"diskType", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "Disk Size", field:"diskSize", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
    ]
    
    table = mcpjs["util/util"].setTabulator("availableDiskList", tableObjParams, columns)

	table.on("rowSelectionChanged", function(data, rows){
		console.log(data);
		console.log(rows);
		checked_array = data
	 });

    // // search by enter key
    // $('#keywordAssistVpc').on('keyup', function (key) {
    //     console.log("#namespaceVpcAssist .keywordAssistImage keyup")
    //     if (key.keyCode == 13) {
    //         searchNetworkByKeyword('searchNetworkAssistAtReg')
    //     }
    // });

    // // search button    
    // $('#namespaceVpcAssist .btn_search_image').on('click', function () {
    //     console.log("#namespaceVpcAssist .btn_search_image clicked")
    //     searchNetworkByKeyword('searchNetworkAssistAtReg')
    // });

    // // apply buuton
    // $('#namespaceVpcAssist .btn_apply').on('click', function () {
    //     console.log("#namespaceVpcAssist .btn_apply clicked")
    //     applyAssistValidCheck('namespaceVpcAssist')
    // });
  
});

// popup이 호출될 때 set : 
export function setNamespaceAvailableDatadiskAssist(caller, mcisId, vmId, providerId, regionName){
    console.log("setNamespaceAvailableDatadiskAssist", caller)
    console.log("mcisId=", mcisId)
    console.log("vmId=", vmId)
	console.log("providerId=", providerId)
	console.log("regionName=", regionName)

	if ( mcisId == "" || vmId == ""){
        mcpjs['util/util'].commonAlert("there is something wrong")
        return;
    }

    $("#parentsNamespaceAvailableDiskAssist").val(caller)
	$("#parentsNamespaceAvailableDiskProviderID").val(providerId)
	$("#parentsNamespaceAvailableDiskRegionName").val(regionName)
	$("#parentsNamespaceAvailableDiskMcisID").val(mcisId)
	$("#parentsNamespaceAvailableDiskVmID").val(vmId)
    
    loadAttachedDataDiskList()   
	//displayAvailableDiskByVm(mcisId, vmId)
}

// vm에 추가가능한 datadisk 목록 조회 결과 표시
export function getDataDiskListCallbackSuccess(caller, result){
	console.log("caller", caller)
	var data = result.dataDiskInfoList;
    console.log("data", data)
	var html = ""
	if (data.length == 0) {
		// // nodata
        // //addAvailableDatadiskRow();// 1개 row는 입력받을 수 있게 추가
		// html += '<tr>'
		// 	+ '<td class="overlay hidden" data-th="" colspan="3">No Data</td>'
		// 	+ '</tr>';
		// $("#availableDiskList").empty()
		// $("#availableDiskList").append(html)
    } else {
		table.setData(data)
    }
}

// 추가된 DataDisk 목록 조회
export function loadAttachedDataDiskList(){
	
	var providerId = $("#parentsNamespaceAvailableDiskProviderID").val()
	var regionName = $("#parentsNamespaceAvailableDiskRegionName").val()
	var mcisId = $("#parentsNamespaceAvailableDiskMcisID").val()
	var vmId = $("#parentsNamespaceAvailableDiskVmID").val()

    if ( mcisId == "" || vmId == ""){
        mcpjs['util/util'].commonAlert("there is something wrong")
        return;
    }
    var caller = "namespaceavailabledatadisk"    
    var actionName="McisVmAvailableDataDiskList"
    var optionParam = ""
    var urlParamMap = new Map();
	
    var filterKeyValMap =  new Map();
    var mconParamMap = new Map();    
	mconParamMap.set("mcisId", mcisId)
	mconParamMap.set("vmId", vmId)
    mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['datadisk/namespaceavailabledatadisk_modal'].getDataDiskListCallbackSuccess, '', urlParamMap, optionParam, filterKeyValMap, mconParamMap)

	// 추가로 필요한 data 조회 
    // 사용가능한 Disk의 Type 조회
    var caller="mcismng"
    mcpjs['util/pathfinder'].getCommonLookupDiskInfo(caller, providerId, regionName, mcpjs['util/util'].getCommonLookupDiskInfoSuccess)
}

// 설정된 값을 parent로 전달
export function applyAssistValidCheck(caller){
    //dataDiskIds
    var parentsNamespaceSecurityGroupAssist = $("#parentsNamespaceSecurityGroupAssist").val();
    console.log("parentsNamespaceSecurityGroupAssist", parentsNamespaceSecurityGroupAssist)
}

var DATA_DISK_MAX_VALUE = 0;
var DATA_DISK_MIN_VALUE = 0;
// Disk Type 선택 시 Disk Size Min/Max 설정 > TODO : 보완할 것 ( Common으로 보내자.)
export function changeDiskSize(type) {
	// var disk_size = DISK_SIZE;

	// if (disk_size) {
	// 	disk_size.forEach(item => {
	// 		var temp_size = item.split("|")
	// 		var temp_type = temp_size[0];
	// 		if (temp_type == type) {
	// 			DATA_DISK_MAX_VALUE = temp_size[1]
	// 			DATA_DISK_MIN_VALUE = temp_size[2]
	// 		}
	// 	})
	// }
	// console.log("DATA_DISK_MAX_VALUE : ", DATA_DISK_MAX_VALUE)
	// console.log("DATA_DISK_MIN_VALUE : ", DATA_DISK_MIN_VALUE)
	// //$("#s_rootDiskType").val(type);
	// //$("#e_rootDiskType").val(type);

}

// vmId 해당하는 disk 목록 조회
// todo : McisVmAvailableDataDiskList 조회를 load할때도 하는 것 같은데 보완할 것.
export function displayAvailableDiskByVm(mcisId, vmId) {    
	var actionName = "McisVmAvailableDataDiskList"
	var urlParamMap = new Map();    
	urlParamMap.set("mcisId", mcisId)
	urlParamMap.set("vmId", vmId)

	// var url = mcpjs['util/pathfinder'].getWebToolUrl(actionName);   
    // url = mcpjs['util/pathfinder'].setUrlByParam(url, urlParamMap);// path paremeter : 경로에 parameter가 있는 경우 replace

	// console.log("check disk list : ", url);
	// axios.get(url).then(result => {
	// 	console.log("get result : ", result);
	// 	var data = result.data.dataDiskInfoList;
	// 	var html = "";
	// 	console.log("get available disk : ", data);
	// 	if (data != null || data.length > 0) {
	// 		var avDiskCnt = 0
	// 		data.forEach(item => {
	// 			//console.log("get available disk : ", item);
	// 			html += '<tr>'
	// 				+ '<td class="overlay hidden column-50px" data-th="">'
	// 				+ '<input type="checkbox" name="chk_attach" value="' + item.id + '"  title=""  /><label for="td_ch1"></label> <span class="ov off"></span>'

	// 				+ '</td>'
	// 				+ '<td class="btn_mtd ovm" data-th="name">' + item.name + '<span class="ov"></span></td>'
	// 				+ '<td class="overlay hidden" data-th="diskType">'
	// 				+ item.diskType
	// 				+ '</td>'
	// 				+ '<td class="overlay hidden" data-th="diskSize">'
	// 				+ item.diskSize
	// 				+ '/GB</td>'
	// 				+ '</tr>';
	// 			avDiskCnt++;
	// 		})
	// 		$("#availableDiskCnt").val(avDiskCnt)
	// 		$("#availableDiskList").empty()
	// 		$("#availableDiskList").append(html)
	// 	} else {
	// 		//commonAlert("해당 VM에 Attach 가능한 DISK가 없습니다");
	// 		addRow();
	// 		$("#availableDiskCnt").val(0)
	// 		return;
	// 	}

	// 	$("#availableDiskSelectBox").modal();
	// 	$('.dtbox.scrollbar-inner').scrollbar();
	// })
}

// connection에 해당하는 disk 목록 조회
export function displayAvailableDisk(connectionName) {    
	var url = "/settings/resources/datadisk"
	if(connectionName){
		url += "?filterKey=connectionName&filterVal=" + connectionName
	}
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

// 체크된 disk를 vm에 attach
// 기 생성된 disk는 attach, 미생성된 disk는 생성 후 attach 하도록 한다.
export function attachSelectedDataDiskToVM() {

	var connectionName = $("#server_connection_view_connection_name").val();
	var mcisId = $("#parentsNamespaceAvailableDiskMcisID").val();
	var vmId = $("#parentsNamespaceAvailableDiskVmID").val();
	var attachDataDiskList = [];
	var createDataDiskList = [];

	$("input[name='chk_attach']:checked").each(function () {

		var item = $(this).attr("item");
		console.log("item : ", item);
		if (item == "add_new") {
			var row_index = $(this).attr("row_index");
			var disk_name = $("#addDiskName_" + row_index).val();
			var disk_type = $("#addDiskType_" + row_index).val();
			var disk_size = $("#addDiskSize_" + row_index).val();
			var disk_obj = {
				name: disk_name,
				diskSize: disk_size,
				diskType: disk_type,
				mcisId: mcisId,
				attachVmId: vmId,
				connectionName
			}
			createDataDiskList.push(disk_obj)
		} else {
			var dataDiskId = $(this).val();
			attachDataDiskList.push(dataDiskId);
		}
	});

	console.log("attachDataDiskList : ", attachDataDiskList);
	console.log("CreateDataDiskList : ", createDataDiskList);
	var obj = {
		attachDataDiskList,
		createDataDiskList
	}
	console.log("runAttachDataDisk obj: ", obj);
	if (attachDataDiskList) {
		var join_attach_disk = attachDataDiskList.join(",");
		$("#ss_data_disk").val(join_attach_disk);;
		$("#availableDiskSelectBox").modal('hide');
	}

	var caller = "availabledatadisk_modal"
	var controllerKeyName = "DataDiskMng";
    var optionParamMap = new Map();
	optionParamMap.set("mcisId", mcisId)
	optionParamMap.set("vmId", vmId)
	
    mcpjs["util/pathfinder"].postCommonData(caller,controllerKeyName,optionParamMap, obj, mcpjs['datadisk/namespaceavailabledatadisk_modal'].dataDiskMngCallbackSuccess)

	// var url = "/settings/resources/datadisk/mngdata"
	// url += "?mcisId=" + mcisId + "&vmId=" + vmId;
	// console.log("attach url = ", url);
	// client.post(url, obj, {
	// 	headers: {
	// 		'Content-type': 'application/json',
	// 	}
	// }).then(result => {
	// 	console.log("result attach disk : ", result);
	// 	var data = result.data;
    //     console.log(data);
    //     if(data.status == 200 || data.status == 201){
    //         mcpjs['util/util'].commonAlert("Attach DataDisk Requested!")
	// 		loadAttachedDataDiskList();// attached List 조회            
	// 		//displayAvailableDiskByVm(mcisId, vmId)
    //     }else{
    //         mcpjs['util/util'].commonAlert(data.message)
           
    //     }
	// }).catch((error) => {
	// 	console.log(error);
	// 	console.log(error.message)
	// 	var errorMessage = error.message;
	// 	mcpjs['util/util'].commonErrorAlert(error.code, errorMessage) 
	// })
}

// DataDisk 추가, Attach, Detach 결과 
export function dataDiskMngCallbackSuccess(caller, result){
	console.log("result attach disk : ", result);
	var data = result.data;
	console.log(data);
	if(data.status == 200 || data.status == 201){
		mcpjs['util/util'].commonAlert("Attach DataDisk Requested!")
		loadAttachedDataDiskList();// attached List 조회            
	}else{
		mcpjs['util/util'].commonAlert(data.message)
	   
	}
}

// attache disk list 표시
$(document).on("click", "button[name=btn_goto_attach_disk]", function () {
	console.log("attach disk btn clicked")
	$("#availableDiskSelectBox").hide();// 자기자신은 hide
	displayVmAttachedDisk();
	
	// $('#availableDiskSelectBox').on('hidden.bs.modal', function () {
	// 	console.log(" 자기자신은 hide ");
	// 	// 원하는 동작 수행
	// 	displayVmAttachedDisk();
	// });
	//$('#availableDiskSelectBox').on('hide', function () {
	//	console.log(" 자기자신은 hide2 ");
		// 원하는 동작 수행
	//	displayVmAttachedDisk();
	//});
	
});
var add_row_cnt = 0
// 가용 datadisk 추가
// export function addAvailableDatadiskRow() {
// 	table.addRow({});// TODO : 입력받는 Row는 수정가능하게 변경할 것 

// 	// add_row_cnt++;
// 	// var providerId = $("#parentsNamespaceAvailableDiskProviderID").val();
// 	// console.log("selected provider at add row : ", providerId);							
// 	// //var addHtml = diskType(providerId);

// 	// //console.log("DISK_TYPE_SIZE_MAP ", DISK_TYPE_SIZE_MAP)
// 	// var diskTypeHtml = "";
// 	// console.log("DISK_TYPE_SIZE_MAP2 ", mcpjs['util/util'].DISK_TYPE_SIZE_MAP)
// 	// if( !mcpjs['util/util'].DISK_TYPE_SIZE_MAP.has(providerId) ){
// 	// 	console.log("there is no disk", providerId)
// 	// 	// commonAlert(" disk type 없음")
// 	// 	return;
// 	// }else{
// 	// 	var diskTypeSize = mcpjs['util/util'].DISK_TYPE_SIZE_MAP.get(providerId)
// 	// 	console.log("diskTypeSize ", diskTypeSize)
// 	// 	var diskTypeArr = diskTypeSize.datadisktype;
// 	// 	diskTypeArr.forEach((item) => {
// 	// 		diskTypeHtml += '<option value="' + item + '">'	+ item + '</option>'
// 	// 	});
// 	// }
// 	// console.log(diskTypeHtml)
	
    
// 	// var html = "";
// 	// html += '<tr>'
// 	// 	+ '<td class="overlay hidden column-50px" data-th="">'
// 	// 	+ '<input type="checkbox" name="chk_attach"  item="add_new" value="" '
// 	// 	+ 'row_index="'
// 	// 	+ add_row_cnt
// 	// 	+ '" title=""  /><label for="td_ch1"></label> <span class="ov off"></span>'
// 	// 	+ '</td>'
// 	// 	+ '<td class="btn_mtd ovm" data-th="name">'
// 	// 	+ '<input type="text" class="pline" style="width:100px;height:50px;" name="addDiskName" id="addDiskName_' + add_row_cnt + '" placeholder="Disk Name" value =""/>'
// 	// 	+ '<span class="ov"></span></td>'
// 	// 	+ '<td class="overlay hidden" data-th="diskType">'
// 	// 	+ '<select name="addDiskType" id="addDiskType_' + add_row_cnt + '"class="selectbox white pline w_ip1" style="width:108px;">'
// 	// 	+ diskTypeHtml
// 	// 	+ '</select>'
// 	// 	+ '</td>'
// 	// 	+ '<td class="overlay hidden" data-th="diskSize">'
// 	// 	+ '<input type="text" class="pline" style="width:100px;height:50px;" placeholder="Disk Size /GB" name="addDiskSize" id="addDiskSize_' + add_row_cnt + '"value =""/>'
// 	// 	+ '</select>'
// 	// 	+ '</td>'
// 	// 	+ '</tr>';

// 	// console.log(html)
// 	// $("#availableDiskList").append(html);
// 	// $("#add_row_cnt").val(add_row_cnt);
// 	// console.log("function ended")
// }

// 가용 datadisk 추가
$(document).on("click", "button[name=btn_add_availabledisk]", function () {    
    table.addRow({});// TODO : 입력받는 Row는 수정가능하게 변경할 것     
    // 
});

// 가용 datadisk 삭제
$(document).on("click", "button[name=btn_delete_availabledisk]", function () {    
	var delArray = [];
	var selectedRows = table.getSelectedRows();
    selectedRows.forEach(function(row) {
		//console.log(row.getData())
		var idValue = row.getCell("id").getValue();
		
		if (idValue == undefined) {
			row.delete();
		} else {
			var rowData = row.getData();			
			delArray.push(rowData);
			
		}
	});

	if (delArray.length > 0){
		// 이미 저장된 값은 삭제하지 않음.: TODO 정책필요. 기존로직은 addRow만 삭제하는 것임
	}
    //console.log(checked_array);
    // 
});

// 체크된 disk를 vm에 attach
// 기 생성된 disk는 attach, 미생성된 disk는 생성 후 attach 하도록 한다.
$(document).on("click", "button[name=btn_apply_availabledisk]", function () {    
	var attachDataDiskList = [];
	var createDataDiskList = [];
	var mcisId = $("#parentsNamespaceAvailableDiskMcisID").val();
	var vmId = $("#parentsNamespaceAvailableDiskVmID").val();

    var selectedRows = table.getSelectedRows();
    selectedRows.forEach(function(row) {
		var idValue = row.getCell("id").getValue();
		var disk_obj = {
			name: row.getCell("name").getValue(),
			diskSize: row.getCell("diskSize").getValue(),
			diskType: row.getCell("diskType").getValue(),
			mcisId: mcisId,
			attachVmId: vmId,
		}
		if (idValue == undefined) {
			

			createDataDiskList.push(disk_obj)
		} else {
			//var rowData = row.getData();			
			attachDataDiskList.push(idValue);
			
		}
	});

	var paramObj = {
		attachDataDiskList,
		createDataDiskList
	}

	var caller = "availabledatadisk_modal";
	var controllerKeyName = "DataDiskMng";
	var optionParamMap = new Map();
	optionParamMap.set("mcisId", mcisId)
	optionParamMap.set("vmId", vmId)
	mcpjs['util/pathfinder'].postCommonData(caller, controllerKeyName, optionParamMap, paramObj, mcpjs['datadisk/namespaceavailabledatadisk_modal'].dataDiskMngCallbackSuccess);
	
});


// add 버튼으로 table에 추가된 row(저장되지 않은) 제거임.
// disk의 삭제가 아님.
// export function deleteAvailableDatadiskRow() {
// 	var availableDiskCnt = $("#availableDiskCnt").val();
// 	var addRowCnt = $("#add_row_cnt").val()
// 	var totalRowCnt = parseInt(availableDiskCnt) + parseInt(addRowCnt);
// 	console.log("totalRowCnt : ", totalRowCnt);
// 	if (addRowCnt > 0) {
// 		addRowCnt--;
// 		$("#add_row_cnt").val(addRowCnt);
// 		$("#availableDiskList").children('tr:last').remove();
// 	}
// }

// vm에 attach된 disk 목록 popup 표시
export function displayVmAttachedDisk(){
	var mcisId = $("#parentsNamespaceAvailableDiskMcisID").val()
	var vmId = $("#parentsNamespaceAvailableDiskVmID").val()	
    $("#attachDiskSelectBox").modal('show');
    mcpjs['datadisk/namespacevmattacheddisk_modal'].setNamespaceVmAttachedDiskAssist('namespaceavailabledatadisk_modal', mcisId, vmId)
}