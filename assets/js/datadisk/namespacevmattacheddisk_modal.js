import { Modal } from "bootstrap";
import {client} from '/assets/js/util/util'
var table;
var checked_array = [];
$(function () {
    $('.btn_available_disk').on('click', function(e){
        console.log("btn_available_disk btn clicked")
        //$("#attachDiskSelectBox").hide();// 자기자신은 hide
        $('#attachDiskSelectBox').on('hidden.bs.modal', function () {
            displayAvailableDisk()
         });
        
        
    });

    $('.btn_diskdetach').on('click', function(e){
        console.log("btn_diskdetach btn clicked")
        runDetachDiskFromVm('detach')
        
    });

    // table 초기 세팅	
    initTable();

    // mcis 목록은 필요시 setNamespaceVmAttachedDiskAssist에서 호출하도록 한다.
    //mcpjs['util/pathfinder'].getCommonMcisList("mcismngready", true, "", "simple")
    //mcpjs["util/pathfinder"].getCommonMcisList("mcismngready", "simple", mcpjs['datadisk/namespacevmattacheddisk_modal'].getMcisListCallbackSuccess);
});

// table 설정
function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
		{title: "Disk Id", field:"id", visible: false},
        {title: "Disk Name", field:"name", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "Disk Type", field:"diskType", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "Disk Size", field:"diskSize", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
    ]
    
    table = mcpjs["util/util"].setTabulator("attachedDiskList", tableObjParams, columns)

	//table.on("rowSelectionChanged", function(data, rows){
	//	checked_array = data
	//});
}

// popup이 호출될 때 set : 
// mcismng에서 호출시에는 mcisId, vmId, connectionName, attachedDisks 를 보냄.
// availableDataDisk에서 호출시에는 mcisId, vmId만 보냄
export function setNamespaceVmAttachedDiskAssist(caller, mcisId, vmId, connectionName, attachedDisks){
    // 해당 vm에 attached된 disk 조회
    console.log("setNamespaceVmAttachedDiskAssist")
    console.log("mcisId", mcisId)
    console.log("vmId",vmId)
    console.log("connectionName", connectionName)
    console.log("attachedDisks", attachedDisks)

    $("#parentsNamespaceVmAttachedDiskConnectionName").val(connectionName)
    $("#parentsNamespaceVmAttachedDiskMcisID").val(mcisId)
    $("#parentsNamespaceVmAttachedDiskVmID").val(vmId)
        
    // $("#attachedDiskList").empty();

    if (attachedDisks){
        getDataDiskInfoById(attachedDisks);
    }else{
        // vm 조회로 attached datadisk 목록 가져옴
        var optionParamMap = new Map();
        optionParamMap.set("{mcisId}", mcisId)
        optionParamMap.set("{vmId}", vmId)
        //mcpjs['util/pathfinder'].getCommonData("datadisk", "McisVmGet", optionParamMap, mcpjs['datadisk/namespacevmattacheddisk_modal'].getDataDiskMcisVmCallbackSuccess)    
        
        // urlParamMap.set(":mcisID", mcisId)
        // urlParamMap.set(":vmID", vmId)
        // var url = mcpjs['util/pathfinder'].setUrlByParam(mcpjs['util/pathfinder'].getWebToolUrl("McisVmData"), urlParamMap)
        // console.log("url ", url)
        // axios.get(url,{
        //     headers:{ }
        //     }).then(result=>{
        //         console.log(result)
        //         var data = result.data
        //         console.log(data)
        //         var dataDiskArr = data.VmInfo.dataDiskIds;
        //         getDataDiskInfoById(dataDiskArr)
        //     });
    
        // }
    }
}

export function getDataDiskMcisVmCallbackSuccess(caller, result){
    var data = result.data
    console.log(data)
    var dataDiskArr = data.VmInfo.dataDiskIds;
    console.log(dataDiskArr)
    if( dataDiskArr != undefined && dataDiskArr.length > 0){
        getDataDiskInfoById(dataDiskArr)
    }    
}

// disk id 목록을 넘기면 해당 disk 정보 조회 : vm에 attached된 disk는 id만 알 수 있으므로 정보조회 필요
function getDataDiskInfoById(dataDiskArr){
    console.log("getDataDiskInfoById", dataDiskArr)
    if( dataDiskArr ){
        var diskIdArr = new Array();
        if (Array.isArray(dataDiskArr)){
            diskIdArr = dataDiskArr
        }else{
            diskIdArr = dataDiskArr.split(",")
        }
        diskIdArr.forEach(item => {
            if( item == ""){return;}
            var url = "/settings/resources/datadisk/id/" + item;
            console.log("disk get url by id2 : ", url);
            
            axios.get(url).then(result => {                
                getDataDiskCallbackSuccess("setNamespaceVmAttachedDiskAssist", result)
            })
        });        
    }
}

// Data 조회 
export function getDataDiskCallbackSuccess(caller, result){
    
	console.log(result);
    //var data = result.DataDiskList;
	//var diskInfo = result.dataDiskInfoList;    
    var diskInfo = result.data.dataDiskInfo

    table.setData(diskInfo)
   
    $("#parentsNamespaceVmAttachedProviderID").val(diskInfo.providerId);
    $("#parentsNamespaceVmAttachedRegionName").val(diskInfo.regionName);

}

// vm에 attach가능한 available disk 목록 표시
export function displayAvailableDisk(){
    var mcisId = $("#parentsNamespaceVmAttachedDiskMcisID").val();
    var vmId = $("#parentsNamespaceVmAttachedDiskVmID").val();
    var providerId = $("#parentsNamespaceVmAttachedProviderID").val();
    var regionName = $("#parentsNamespaceVmAttachedRegionName").val();
    
    //$("#attachDiskSelectBox")
    //$("#attachDiskSelectBox").hide();
    //$("#availableDiskSelectBox").modal();
    //console.log( $("#availableDiskSelectBox") );
    //$("#availableDiskSelectBox").show();
    $("#availableDiskSelectBox").modal('show');
    mcpjs['datadisk/namespaceavailabledatadisk_modal'].setNamespaceAvailableDatadiskAssist('namespacevmattacheddisk_modal', mcisId, vmId, providerId, regionName)
}

// vm에 선택된 disk를 분리 detach
function runDetachDiskFromVm() {
    var mcisId = $("#parentsNamespaceVmAttachedDiskMcisID").val();
    var vmId = $("#parentsNamespaceVmAttachedDiskVmID").val();

    var tempIds = [];// 선택된 detach disk Id들
    var paramObj = {};

    var selectedRows = table.getSelectedRows();
    selectedRows.forEach(function(row) {
		//console.log(row.getData())
		var idValue = row.getCell("id").getValue();
		tempIds.push(idValue);// id목록만 넘김		
	});

    if ( tempIds.length == 0){
        // 선택된 것이 없음
    }else{
        paramObj = {
            dettachDataDiskList: tempIds
        }
    }

    var controllerKeyName = "DataDiskMng";
	var optionParamMap = new Map();
	optionParamMap.set("mcisId", mcisId)
	optionParamMap.set("vmId", vmId)
    mcpjs['util/pathfinder'].postCommonData("datadiskmng", controllerKeyName, optionParamMap, paramObj, mcpjs['datadisk/namespaceavailabledatadisk_modal'].postDataDiskMngCallbackSuccess);

    // var count = 0;
    // var url = "/settings/resources/datadisk/mngdata";
    // url += "?mcisId=" + mcisId + "&vmId=" + vmId;
    //$("input[name='chk_detach']:checked").each(index => {    
    // $("input[name='chk_detach']:checked").each(function() {    
    //     console.log($(this))
    //     var dataDiskId = $(this).val();
    //     console.log("dataDiskId : ", dataDiskId);
    //     temp_ids.push(dataDiskId)
    // });

    // if ( temp_ids.length == 0){
    //     // 선택된 것이 없음
    // }else{            
    //     obj = {
    //         dettachDataDiskList: temp_ids
    //     }
    //     console.log("temp detach disk ids : ", temp_ids)
    //     client.post(url, obj).then(result => {
    //         var data = result.data;
    //         console.log(data);
    //         if (data.status == 200 || data.status == 201) {
    //             mcpjs['util/util'].commonAlert("DataDisk Detached.")
    //             $("#attachDiskSelectBox").hide();
    //             //$('#attachDiskSelectBox').on('hidden.bs.modal', function () {
    //             //   console.log("hide attachDiskSelectBox")
    //             //});
               
    //         } else {
    //             mcpjs['util/util'].commonAlert("Fail" + command + " DataDisk at " + item + data.message)
    //             showDataDiskInfo(diskId, diskName);
    //         }
    //     }).catch(error => {
    //         console.log(error.response);
    //     })
    // }
}

// 전송결과 처리
export function postDataDiskMngCallbackSuccess(caller, result){
    var data = result.data;
    console.log(data);
    if (data.status == 200 || data.status == 201) {
        mcpjs['util/util'].commonAlert("DataDisk Detached.")
        $("#attachDiskSelectBox").hide();
        //$('#attachDiskSelectBox').on('hidden.bs.modal', function () {
        //   console.log("hide attachDiskSelectBox")
        //});
        
    } else {
        mcpjs['util/util'].commonAlert("Fail" + command + " DataDisk at " + item + data.message)
        showDataDiskInfo(diskId, diskName);
    }
}
// MCIS 목록 조회? why? disk attach를 위해?
//export function getMcisListCallbackSuccess(caller, mcisList) {
//    console.log("getMcisListCallbackSuccess")
//}