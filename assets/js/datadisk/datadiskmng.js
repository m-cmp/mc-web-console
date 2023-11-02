import "bootstrap";
import "jquery.scrollbar";
//import { DataDiskListComp } from "../component/list";
//import {client} from '/assets/js/util/util'
var table;
$(function () {

    initTable();
    // mcpjs["util/common"].setTableHeightForScroll('dataDiskListTable', 300)
    //mcpjs['util/pathfinder'].getCommonCloudProviderList("datadiskselectbox", "", "", "regProviderName")
    getDataDiskList("name");
});

function initTable() {
    var tableObjParams = {}
  
    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"Id", field:"id", visible: false},
        {title:"Name", field:"name", vertAlign: "middle"},
        {title:"NS", field:"nsId", visible: false, formatter: assoicateNsFormatter},
        {title:"MCIS", field:"mcisId", visible: false, formatter: assoicateMcisFormatter},
        {title:"VM", field:"vmId", visible: false, formatter: assoicateVmFormatter},

        {title:"Connection", field:"connectionName", vertAlign: "middle"},        
        {title:"DiskType", field:"diskType", vertAlign: "middle"},
        {title:"DiskSize", field:"diskSize", vertAlign: "middle", hozAlign: "center", headerSort:false},
        {title:"Status", field:"status", vertAlign: "middle"},        
        {title:"Attached VM", field:"attachedVm", formatter: attachVmFormatter, vertAlign: "middle", headerSort:false, maxWidth: 200},
    ]    
    
    table = mcpjs["util/util"].setTabulator("dataDiskList", tableObjParams, columns)
    
    table.on("rowClick", function(e, row){
        getDataDisk(row.getCell("id").getValue(), 'info')
    });
  
    table.on("rowSelectionChanged", function(data, rows){
    });
  
    mcpjs['util/util'].displayColumn(table)    
}

//
function assoicateNsFormatter(cell) {
    console.log("assoicateNsFormatter ", cell.getData().associatedObjectList)
    var associatedObjectList = cell.getData().associatedObjectList;
    if( associatedObjectList.length > 0){
        var assoObject = associatedObjectList[0];
        var assoParams = assoObject.split("/");
        var assoNs = assoParams[2];        
        return assoNs;
    }

    return ""
}
//
function assoicateMcisFormatter(cell) {
    console.log("assoicateMcisFormatter ", cell.getData().associatedObjectList)
    var associatedObjectList = cell.getData().associatedObjectList;
    if( associatedObjectList.length > 0){
        var assoObject = associatedObjectList[0];
        var assoParams = assoObject.split("/");
        var assoMcis = assoParams[4];        
        return assoMcis;
    }

    return ""
}
//
function assoicateVmFormatter(cell) {
    console.log("assoicateVmFormatter ", cell.getData().associatedObjectList)
    var associatedObjectList = cell.getData().associatedObjectList;
    if( associatedObjectList.length > 0){
        var assoObject = associatedObjectList[0];
        var assoParams = assoObject.split("/");
        var assoVm = assoParams[6];
        return assoVm
    }

    return ""
}

// 연결 된 VM 정보 
function attachVmFormatter(cell) {
    console.log("attachVmFormatter ", cell.getData().associatedObjectList)
    var associatedObjectList = cell.getData().associatedObjectList;
    if( associatedObjectList.length > 0){
        var assoObject = associatedObjectList[0];
        //"/ns/workation/mcis/testvmcis008/vm/testvm012-1"
        var assoParams = assoObject.split("/");
        var assoNs = assoParams[2];
        var assoMcis = assoParams[4];
        var assoVm = assoParams[6];
        var returnVal = "NS : " + assoNs + ", MCIS : " + assoMcis + ", VM : " + assoVm
        console.log("attachVmFormatter ", returnVal);
        return returnVal
    }

    return ""
}

export function deleteDataDisk() {
    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a DataDisk !!");
        return;
    }
    if (selectedRows.length > 1) {
        mcpjs["util/util"].commonAlert("한개만 삭제할 수 있습니다");
        return;
    }

    var selDataDiskId = "";
    selectedRows.forEach(function (row) {
        selDataDiskId = row.getCell("id").getValue();
        var diskStatus = row.getCell("status").getValue();
        if(diskStatus == "attached"){
            mcpjs['util/util'].commonAlert("Disk에 할당된 VM이 있어 삭제 할 수 없습니다.");
            return false;
        }
        if(diskStatus != "Available"){
            mcpjs['util/util'].commonAlert("Delete 할 수 있는 상태가 아닙니다. ", diskStatus);
            return false;
        }
    });

    var caller = "datadiskmng";
    var controllerKeyName = "DataDiskDel";
    var optionParamMap = new Map();
    optionParamMap.set("{dataDiskId}", selDataDiskId);    
    var obj = {}
    mcpjs["util/pathfinder"].deleteCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs["datadisk/datadiskmng"].dataDiskDelCallbackSuccess );
    
    // var dataDiskId = "";
    // var count = 0;
    // var diskStatus = "";
    // $("input[name='chk']:checked").each(function () {
    //     count++;
    //     dataDiskId = dataDiskId + $(this).val() + ",";
    //     diskStatus = $(this).attr("diskStatus")
    //     if(diskStatus == "attached"){
    //         mcpjs['util/util'].commonAlert("Disk에 할당된 VM이 있어 삭제 할 수 없습니다.");
    //         return false;
    //     }
    // });

    // if(diskStatus == "attached"){
    //     var checkBox = document.getElementsByName("chk");
    //     checkBox.forEach(item=>{
    //     item.checked = false;
    //     })
    //     return false;
    // }

    // dataDiskId = dataDiskId.substring(0, dataDiskId.lastIndexOf(","));

    // console.log("dataDiskId : ", dataDiskId);
    // console.log("count : ", count);

    // if (dataDiskId == '') {
    //    mcpjs['util/util'].commonAlert("삭제할 대상을 선택하세요.");
    //     return false;
    // }

    // if (count != 1) {
    //    mcpjs['util/util'].commonAlert("삭제할 대상을 하나만 선택하세요.");
    //     var checkBox = document.getElementsByName("chk");
    //     checkBox.forEach(item=>{
    //     item.checked = false;
    //     })
    //     return false;
    // }

    // var url = "/settings/resources" + "/datadisk/id/" + dataDiskId
    // console.log("del dataDisk url : ", url);
    // var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    // client.delete(url, {
    //     headers: {
    //         'x-csrf-token': csrfToken,
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     var data = result.data;
    //     console.log(result);
    //     console.log(data);
    //     if (result.status == 200 || result.status == 201) {
    //         mcpjs['util/util'].commonAlert(data.message)
    //         displayDataDiskInfo("DEL_SUCCESS")
           
    //     } else {
    //         mcpjs['util/util'].commonAlert(result.data.error)
    //     }
    // }).catch((error) => {
    //     console.warn(error);
    //     console.log(error.response)
    //     var errorMessage = error.response.data.error;
    //     var statusCode = error.response.status;
    //     mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    // });
}

export function dataDiskDelCallbackSuccess(caller, result){
    console.log(result);
    var data = result.data;
    if (result.status == 200 || result.status == 201) {
        mcpjs['util/util'].commonAlert(data.message)
        displayDataDiskInfo("DEL_SUCCESS")        
    } else {
        mcpjs['util/util'].commonAlert(result.data.error)
    }
}

export function chkDiskStatus(attr){
   
}

export function attachDataDisk() {
    var dataDiskId = "";
    var count = 0;
    var connectionName = [];
    var connectionDup = false;
    var selectDiskName = [];
    var chkDiskId = [];
    //var diskStatus = "";

    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a DataDisk !!");
        return;
    }
    var selDataDiskId = "";
    var selDataDiskName = "";
    var selDataDiskConnection = "";
    selectedRows.forEach(function (row) {
        selDataDiskId = row.getCell("id").getValue();
        selDataDiskName = row.getCell("name").getValue();
        selDataDiskConnection = row.getCell("connectionName").getValue();
        var diskStatus = row.getCell("status").getValue();
        if(diskStatus == "attached"){
            mcpjs['util/util'].commonAlert("이미 Attach된 Disk 를 선택하셨습니다.");
            return false;
        }
        if(diskStatus != "Available"){
            mcpjs['util/util'].commonAlert("Attach할 수 있는 상태가 아닙니다. ", diskStatus);
            return false;
        }
        
    });

    // $("input[name='chk']:checked").each(function () {
    //     count++;
    //     dataDiskId = dataDiskId + $(this).val() + ",";
    //     var tempConnectionName = $(this).attr("item");
    //     var tempDiskName = $(this).attr("diskName");
    //     var tempDiskId = $(this).val();
    //     diskStatus = $(this).attr("diskStatus")
    //     if(diskStatus == "attached"){
    //        mcpjs['util/util'].commonAlert("이미 Attach된 Disk 를 선택하셨습니다.");
    //         return false;
    //     }
    //     connectionName.push(tempConnectionName);
    //     selectDiskName.push(tempDiskName);
    //     chkDiskId.push(tempDiskId);
        
    // });
    // if(diskStatus == "attached"){
    //     var checkBox = document.getElementsByName("chk");
    //     checkBox.forEach(item=>{
    //     item.checked = false;
    //     })  
    //     return false;
    // }
    //console.log("connectionName arr :",connectionName)
    //console.log("selectDiskName arr :",selectDiskName)
    // 선택된 디스크 이름 가져와서 뿌려주기
    // console.log("datadiskID : ",dataDiskId);
    // var selectDisk = selectDiskName.join(",");
    // var selectDiskId = chkDiskId.join(",")
    // $("#selected_disk").val(selectDisk);
    // $("#selected_disk_id").val(selectDiskId);
    // //connection  다를경우 걸르기
    // connectionName.forEach((item)=>{
    //    if(connectionName[0] == item){

    //    }else{
    //     connectionDup = true
    //    }
    // })

    // if(connectionDup){
    //    mcpjs['util/util'].commonAlert("같은 Connection Name을 선택하세요.")
    //     return false;
    // }else{
    //     connectionName = connectionName[0];
    // }
    
    // dataDiskId = dataDiskId.substring(0, dataDiskId.lastIndexOf(","));

    // console.log("dataDiskId : ", dataDiskId);
    // console.log("count : ", count);

    if (selDataDiskId == '') {
       mcpjs['util/util'].commonAlert("Attach할 대상을 선택하세요.");
        return false;
    }

    //mcpjs['util/pathfinder'].getCommonMcisList("dataDiskMng",true, "", "","connection="+connectionName)
    //mcpjs["util/pathfinder"].getCommonMcisList("dataDiskMng", "&filterKey=connection&filterVal="+connectionName, mcpjs['datadisk/datadiskmng'].getMcisListCallbackSuccess);// 해당 popup에서 수행해야함.
    
    mcpjs['datadisk/vmdiskassist_modal'].setVmDiskAssist("datadiskmng", selDataDiskId, selDataDiskName, selDataDiskConnection)    
    displayDiskAttachModal(true)
}

// disk 분리
export function runDetachDataDisk(command){
    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a DataDisk !!");
        return;
    }
    if (selectedRows.length > 1) {
        mcpjs["util/util"].commonAlert("한개의 DataDisk만 Detach 할 수 있습니다.");
        return;
    }

    var detachDataDiskList = [];
    var selNs = "";
    var selMcis = "";
    var selVm = "";

    selectedRows.forEach(function (row) {
        console.log(row);
        //var rowData = row.getData();
        //console.log("Selected getData: ", getData);
        

        var selDataDiskId = row.getCell("id").getValue();
        var selDataDiskName = row.getCell("name").getValue();
        var selDataDiskConnection = row.getCell("connectionName").getValue();
        var diskStatus = row.getCell("status").getValue();
        console.log("diskStatus", diskStatus)
        if(diskStatus == "attached" || diskStatus == "Attached"){
            detachDataDiskList.push(selDataDiskId);
        } else {
            mcpjs['util/util'].commonAlert("Detach 할 수 있는 상태가 아닙니다. ", diskStatus);
            return false;
        }
        
        //selNs = row.getCell("nsId").getValue();
        //selMcis = row.getCell("mcisId").getValue();
        //selVm = row.getCell("vmId").getValue();    
        selNs = assoicateNsFormatter(row)// formatter로 set하는 column은 get할 때도 formatter로
        selMcis = assoicateMcisFormatter(row)// formatter로 set하는 column은 get할 때도 formatter로
        selVm = assoicateVmFormatter(row)// formatter로 set하는 column은 get할 때도 formatter로
        
        console.log("nsId " , selNs)
        console.log("mcisId " , selMcis)
        console.log("vmId " , selVm)
    });

    if( detachDataDiskList.length == 0){
		mcpjs["util/util"].commonAlert("Please Select a DataDisk !!");
        return;
	}

    var caller = "datadisk";
    var controllerKeyName = "DataDiskMng";
    var optionParamMap = new Map();
	optionParamMap.set("mcisId", selMcis);
	optionParamMap.set("vmId", selVm);
    var obj = {
		detachDataDiskList        
	}
	
    mcpjs["util/pathfinder"].postCommonData(caller,controllerKeyName,optionParamMap,obj, mcpjs['datadisk/datadiskmng'].detachDataDiskMngCallbackSuccess)
    

    // var count = 0;
    // var diskStatus = "";
    // var chk_cnt = $("input[name='chk']:checked").length

    // if(chk_cnt > 1){
    //     var checkBox = document.getElementsByName("chk");
    //     checkBox.forEach(item=>{
    //         item.checked = false;
    //     })
    //    mcpjs['util/util'].commonAlert("한개의 DataDisk만 Detach 할 수 있습니다.");
    //     return false;
    // }else{
    //     //상태 체크
    //     $("input[name='chk']:checked").each(function (index) {
    //         diskStatus = $(this).attr("diskstatus")
    //         if(diskStatus != "attached"){
    //            mcpjs['util/util'].commonAlert("Disk에 할당된 VM이 없어 Detach 할 수 없습니다.");
    //             return false;
    //         }

    //     })
    //     if(diskStatus == "attached" && chk_cnt == 1){
    //         var mcis_id = "";
    //         var vm_id = "";
    //         var dataDiskId = "";
    //         var obj = {};
    //         $("input[name='chk']:checked").each(function (index) {
    //             mcis_id = $(this).attr("mcis_id");
    //             vm_id = $(this).attr("vm_id");
    //             dataDiskId = $(this).val();
                
    //         })
    //         var url = "/operations/manages/mcismng/"+mcis_id+"/vm/"+vm_id+"/datadisk?option="+command;
    //         console.log("datach url : ",url)
    //         obj = {
    //             dataDiskId
    //          }
    //         axios.put(url, obj).then(result=>{
    //             var data = result.data;
    //             console.log(data);
    //             if(data.status == 200 || data.status == 201){
    //                mcpjs['util/util'].commonAlert("Success Detach DataDisk!")
    //                 $("#dataDiskInfoBox").hide();
    //                  // displayDataDiskInfo("MODIFY_SUCCESS");
    //                // location.reload()      
    //                 getDataDiskList("name");
    //             }else{
    //                mcpjs['util/util'].commonAlert("Fail Detach DataDisk : "+ data.message)
    //                 getDataDiskList("name");
    //             }
    //         }).catch(error=>{
    //             console.log(error.response);
    //         })
    //     }
    // }
 }

export function detachDataDiskMngCallbackSuccess(caller, result){
    var data = result.data;
    console.log(data);
    if(data.status == 200 || data.status == 201){
        mcpjs['util/util'].commonAlert("Success Detach DataDisk!")
        $("#dataDiskInfoBox").hide();
            // displayDataDiskInfo("MODIFY_SUCCESS");
        // location.reload()      
        getDataDiskList("name");
    }else{
        mcpjs['util/util'].commonAlert("Fail Detach DataDisk : "+ data.message)
        getDataDiskList("name");
    }    
}



function getDataDiskList(sort_type) {
    var caller = "datadiskmng";
    var actionName = "DataDiskList";
    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['datadisk/datadiskmng'].dataDiskListCallbackSuccess)

    // console.log(sort_type);
    // // defaultNameSpace 기준으로 가져온다. (server단 session에서 가져오므로 변경하려면 현재 namesapce를 바꾸고 호출하면 됨)
    // var url = "/settings/resources/datadisk";
    // axios.get(url, {
    //     headers: {
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     console.log("get DataDisk List : ", result.data);
    //     // var data = result.data.dataDisk;
    //     var data = result.data.dataDiskInfoList;

    //     var html = ""
    //     var cnt = 0;
        
    //     if (data.length == 0) {
    //         html += '<tr><td class="overlay hidden" data-th="" colspan="5">No Data</td></tr>'

    //         $("#dataDiskList").empty()
    //         $("#dataDiskList").append(html)
    //         ModalDetail()
    //     } else {
    //         // if (data.length) {
    //         //     if (sort_type) {
    //         //         cnt++;
    //         //         console.log("check : ", sort_type);
    //         //         data.filter(list => list.Name !== "").sort((a, b) => (a[sort_type] < b[sort_type] ? - 1 : a[sort_type] > b[sort_type] ? 1 : 0)).map((item, index) => (
    //         //             html += addDataDiskRow(item, index)
    //         //         ))
    //         //     } else {
    //         //         data.filter((list) => list.Name !== "").map((item, index) => (
    //         //             html += addDataDiskRow(item, index)
    //         //         ))
    //         //     }

    //         //     $("#dataDiskList").empty()
    //         //     $("#dataDiskList").append(html)

    //         //     ModalDetail()
    //         // }
    //         new DataDiskListComp(document.getElementById("dataDiskList"), data)
    //         ModalDetail();
    //     }
    // }).catch((error) => {
    //     console.warn(error);
    //     console.log(error.response)
    //     var errorMessage = error.response.data.error;
    //     var statusCode = error.response.status;
    //     mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    // });
}

// attach는 vmdiskassist_modal.js의 runAttachDataDisk에서 처리

export function dataDiskListCallbackSuccess(caller, result){
    var data = result.data.dataDiskInfoList;
    console.log(data);
    table.setData(data);    
}

// deprecated : dataDisk목록에 Item 추가
// function addDataDiskRow(item, index) {
//     console.log("addDataDiskRow " + index);
//     console.log(item)
//     //Disk Attach 여부 확인
//     var assoObjList = item.associatedObjectList;
//     var diskStatus = ""; //disk Attach 여부 상태. 1) attach되어 있을경우 attached 그렇지 않으면 빈값; 
//     var ns = "";
//     var mcis_id = "";
//     var vm_id = "";
//     if(assoObjList.length > 0){
//         var tempAssoObjList = assoObjList[0];
//         var parse = tempAssoObjList.split("/")
//         ns = parse[2];
//         mcis_id = parse[4];
//         vm_id = parse[6];
//         diskStatus = "attached"
//     }

//     var html = ""
//     html += '<tr onclick="showDataDiskInfo(\'' + item.id + '\',\'' + item.name + '\');">'
//         + '<td class="overlay hidden column-50px" data-th="">'
//         + '<input type="hidden" id="dataDisk_info_' + index + '" value="' + item.name + '"/>'
//         + '<input type="checkbox" name="chk" value="' + item.id + '" id="raw_' + index + '" title="" item="'+item.connectionName+'" diskname="'+item.name+'" diskstatus="'+diskStatus+'" mcis_id="'+mcis_id+'" vm_id="'+vm_id+'" /><label for="td_ch1"></label> <span class="ov off"></span>'

//         + '</td>'
//         + '<td class="btn_mtd ovm" data-th="name">' + item.name + '<span class="ov"></span></td>'
//         + '<td class="overlay hidden" data-th="diskType">' + item.diskType + '</td>'
//         + '<td class="overlay hidden" data-th="diskSize">' + item.diskSize + '</td>'
//         + '<td class="overlay hidden" data-th="attachedVm">' + vm_id + '</td>'
//         + '<td class="overlay hidden" data-th="connectionName">' + item.connectionName + '</td>'
//         + '<td class="overlay hidden" data-th="description">' + item.description + '</td>'
//         + '</tr>'
//     return html;
// }

function ModalDetail() {
    $(".dashboard .status_list tbody tr").each(function () {
        var $td_list = $(this),
            $status = $(".server_status"),
            $detail = $(".server_info");
        $td_list.off("click").click(function () {
            $td_list.addClass("on");
            $td_list.siblings().removeClass("on");
            $status.addClass("view");
            $status.siblings().removeClass("on");
            $(".dashboard.register_cont").removeClass("active");
            $td_list.off("click").click(function () {
                if ($(this).hasClass("on")) {
                    console.log("reg ok button click")
                    $td_list.removeClass("on");
                    $status.removeClass("view");
                    $detail.removeClass("active");
                } else {
                    $td_list.addClass("on");
                    $td_list.siblings().removeClass("on");
                    $status.addClass("view");

                    $status.siblings().removeClass("view");
                    $(".dashboard.register_cont").removeClass("active");
                }
            });
        });
    });
}

export function displayDataDiskInfo(targetAction) {
    if (targetAction == "REG") {
        $('#dataDiskCreateBox').toggleClass("active");
        $('#dataDiskInfoBox').removeClass("view");
        $('#dataDiskListTable').removeClass("on");
        var offset = $("#dataDiskCreateBox").offset();
        // var offset = $("#" + target+"").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 300);

        // form 초기화
        $("#regDataDiskName").val('')
        $("#regDataDiskSize").val('')
        $("#regDataDiskType").val('')
        $("#regDescription").val('')
        mcpjs['util/common'].goFocus('dataDiskCreateBox');
    } else if (targetAction == "REG_SUCCESS") {
        $('#dataDiskCreateBox').removeClass("active");
        $('#dataDiskInfoBox').removeClass("view");
        $('#dataDiskListTable').addClass("on");

        var offset = $("#dataDiskCreateBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);

        // form 초기화
        $("#regDataDiskName").val('')
        $("#regDataDiskSize").val('')
        $("#regDataDiskType").val('')
        $("#regDescription").val('')
        getDataDiskList("name");
    }  else if (targetAction == "MODIFY_SUCCESS") {
        
        getDataDiskList("name");
    } else if (targetAction == "DEL") {
        $('#dataDiskCreateBox').removeClass("active");
        $('#dataDiskInfoBox').addClass("view");
        $('#dataDiskListTable').removeClass("on");

        var offset = $("#dataDiskInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 300);

    } else if (targetAction == "DEL_SUCCESS") {
        $('#dataDiskCreateBox').removeClass("active");
        $('#dataDiskInfoBox').removeClass("view");
        $('#dataDiskListTable').addClass("on");

        var offset = $("#dataDiskInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);

        getDataDiskList("name");
    } else if (targetAction == "CLOSE") {
        $('#dataDiskCreateBox').removeClass("active");
        $('#dataDiskInfoBox').removeClass("view");
        $('#dataDiskListTable').addClass("on");

        var offset = $("#dataDiskInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);
    }else if(targetAction == "Attach"){
        $("#vmDiskSelectBox").modal("toggle");
        attachDataDisk();
    }
}

// provider에 등록 된 connection 목록 표시
function getConnectionInfo(providerId) {
    var url = "/setting/connections/cloudconnectionconfig/" + "list"
    var html = "";
    axios.get(url, {
        headers: {
        }
    }).then(result => {
        console.log('getConnectionConfig result: ', result)
        var data = result.data.ConnectionConfig
        console.log("connection data : ", data);
        var count = 0;
        var configName = "";
        var confArr = new Array();
        for (var i in data) {
            if (providerId == data[i].ProviderName) {
                count++;
                html += '<option value="' + data[i].ConfigName + '" item="' + data[i].ProviderName + '">' + data[i].ConfigName + '</option>';
                configName = data[i].ConfigName
                confArr.push(data[i].ConfigName)
            }
        }
        if (count == 0) {
           mcpjs['util/util'].commonAlert("해당 Provider에 등록된 Connection 정보가 없습니다.")
            html += '<option selected>Select Configname</option>';
        }
        if (confArr.length > 1) {
            configName = confArr[0];
        }
        $("#regConnectionName").empty();
        $("#regConnectionName").append(html);

    }).catch((error) => {
        console.warn(error);
        console.log(error.response)
    });
}

export function createDataDisk() {
    var diskName = $("#regDataDiskName").val();
    var diskSize = $("#regDataDiskSize").val();
    var diskType = $("#regDataDiskType").val();
    var description = $("#regDescription").val();
    var providerId = $("#regProviderId").val();
    var regionName = $("#regRegionName").val();
    //var connectionName = $("#regConnectionName").val();
    
    var url = "/settings/resources/datadisk/"
    console.log("dataDisk Reg URL : ", url)
    var obj = {
        connectionName,
        description,
        name: diskName,
        diskSize,
        diskType,
        providerId,
        regionName,
    }
    console.log("info dataDisk obj Data : ", obj);    

    if (diskName) {
        var optionParamMap = new Map();
        mcpjs["util/pathfinder"].postCommonData('diskmng','DataDiskReg',optionParamMap,obj, mcpjs['datadisk/datadiskmng'].dataDiskRegCallbackSuccess)

        // client.post(url, obj, {
        //     // headers: {
        //     //     'Content-type': 'application/json',
        //     // }
        // }).then(result => {
        //     console.log("result dataDisk : ", result);
        //     var data = result.data;
        //     console.log(data);
        //     if (data.status == 200 || data.status == 201) {
        //         mcpjs["util/util"].commonAlert("Success Create DataDisk!")

        //         displayDataDiskInfo("REG_SUCCESS")
             
        //     } else {
        //         mcpjs["util/util"]. commonAlert("Fail Create DataDisk " + data.message)
        //     }
        // }).catch((error) => {
        //     console.log(error.response)
        //     // var errorMessage = error.response.data.error;
        //     // var statusCode = error.response.status;
        //     // mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage)
        // });
    } else {
       mcpjs['util/util'].commonAlert("Input Disk Name")
        $("#regDataDiskName").focus()
        return;
    }
}


// 저장 성공시 호출되는 callback function
export function dataDiskRegCallbackSuccess(caller, result){
    console.log("result dataDisk : ", result);
    var data = result.data;
    console.log(data);
    if (data.status == 200 || data.status == 201) {
        mcpjs["util/util"].commonAlert("Success Create DataDisk!")

        displayDataDiskInfo("REG_SUCCESS")
     
    } else {
        mcpjs["util/util"]. commonAlert("Fail Create DataDisk " + data.message)
    }    
}

export function getDataDisk(dataDiskId, mode){
    $('#dataDiskMode').val(mode)

    var caller = "datadiskmng";
    var actionName = "DataDiskGet";
    var optionParamMap = new Map();
    optionParamMap.set("{dataDiskId}", dataDiskId);
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['datadisk/datadiskmng'].getDataDiskCallbackSuccess);
}

export function getDataDiskCallbackSuccess(caller, result){
    var data = result.data.dataDiskInfo
    console.log("Show Data : ", data);

    var dtlDiskName = data.name;
    var dtlDescription = data.description;
    var dtlDiskType = data.diskType;
    var dtlDiskSize = data.diskSize;
    var dtlConnectionName = data.connectionName;
    var dtlDiskId = data.id;
    var dtlPreDiskSize = data.diskSize;
    var dtlAssoObj = data.associatedObjectList;
    var associatedObjId = "";
    if(dtlAssoObj.length > 0){
        console.log("dtlAssoObj", dtlAssoObj)
        var parse = dtlAssoObj[0];
        var temp_parse = parse.split("/");
        associatedObjId = temp_parse[6];
    }
   
    $("#dtlDiskName").empty();
    $("#dtlDiskType").empty();
    $("#dtlDiskSize").empty();
    $("#dtlDescription").empty();
    $("#dtlConnectionName").empty();
    $("#dtlPreDiskSize").empty();
    $("#dtlDiskId").empty();
    $("#dtlAssoObj").empty();


    $("#dtlDiskName").val(dtlDiskName);
    $("#dtlDiskType").val(dtlDiskType);
    $("#dtlDiskSize").val(dtlDiskSize);
    $("#dtlDescription").val(dtlDescription);
    $("#dtlConnectionName").val(dtlConnectionName);
    $("#dtlDiskId").val(dtlDiskId);
    $("#dtlPreDiskSize").val(dtlPreDiskSize);
    $("#dtlAssoObj").val(associatedObjId);

    $('#dataDiskName').text(dtlDiskName)

    displayDataDiskInfo("DEL");
}

// 선택한 dataDisk의 상세정보 : 이미 가져왔는데 다시 가져올 필요있나?? dataDiskID
export function showDataDiskInfo(dataDiskId, dataDiskName) {
    console.log("showDataDiskInfo : ", dataDiskName);
    
    $('#dataDiskName').text(dataDiskName)

    var url = "/settings/resources/datadisk/id/" + encodeURIComponent(dataDiskId);
    console.log("dataDisk detail URL : ", url)

    return axios.get(url, {
    }).then(result => {
        console.log(result);
        console.log(result.data);
        var data = result.data.dataDiskInfo
        console.log("Show Data : ", data);

        var dtlDiskName = data.name;
        var dtlDescription = data.description;
        var dtlDiskType = data.diskType;
        var dtlDiskSize = data.diskSize;
        var dtlConnectionName = data.connectionName;
        var dtlDiskId = data.id;
        var dtlPreDiskSize = data.diskSize;
        var dtlAssoObj = data.associatedObjectList;
        var associatedObjId = "";
        if(dtlAssoObj.length > 0){
            console.log("dtlAssoObj", dtlAssoObj)
            var parse = dtlAssoObj[0];
            var temp_parse = parse.split("/");
            associatedObjId = temp_parse[6];
        }
       
      
        // var subList = data.subnetInfoList;
        // for (var i in subList) {
        //     dtlSubnet += subList[i].id + " (" + subList[i].ipv4_CIDR + ")";
        // }
        // console.log("dtlSubnet : ", dtlSubnet);

        $("#dtlDiskName").empty();
        $("#dtlDiskType").empty();
        $("#dtlDiskSize").empty();
        $("#dtlDescription").empty();
        $("#dtlConnectionName").empty();
        $("#dtlPreDiskSize").empty();
        $("#dtlDiskId").empty();
        $("#dtlAssoObj").empty();


        $("#dtlDiskName").val(dtlDiskName);
        $("#dtlDiskType").val(dtlDiskType);
        $("#dtlDiskSize").val(dtlDiskSize);
        $("#dtlDescription").val(dtlDescription);
        $("#dtlConnectionName").val(dtlConnectionName);
        $("#dtlDiskId").val(dtlDiskId);
        $("#dtlPreDiskSize").val(dtlPreDiskSize)
        $("#dtlAssoObj").val(associatedObjId)

        if (dtlConnectionName == '' || dtlConnectionName == undefined) {
           mcpjs['util/util'].commonAlert("ConnectionName is empty")
        } else {
            //mcpjs['util/util'].getProviderNameByConnection(dtlConnectionName, 'dtlProvider')// provider는 connection 정보에서 가져옴            
        }

    }).catch(function (error) {
        console.log("Network detail error : ", error);
    });
}

export function putDataDisk(){
    var diskId = $("#dtlDiskId").val();
    var preDiskSize = $("#dtlPreDiskSize").val();
    var diskSize = $("#dtlDiskSize").val();
    var diskName = $("#dtlDiskName").val();
    var description = $("#dtlDescription").val();

    console.log("preDiskSize : ", preDiskSize)
    console.log("diskSize : ", diskSize)
    if(preDiskSize >= diskSize){
       mcpjs['util/util'].commonAlert("변경할 디스크 사이즈는 기존 디스크 사이즈 보다 커야 합니다.")
        $("#dtlDiskSize").focus();
        return;
    }
    var url = "/settings/resources/datadisk/id/" + encodeURIComponent(diskId);
    
    if(diskId){
        console.log("disk id : ",diskId)
        console.log("disk modify by put url :",url);
        //put
        var obj = {
            description,
            diskSize
        }
        console.log("modify disk info : ",obj);
        axios.put(url, obj, {
            // headers: {
            //     'Content-type': 'application/json',
            //     // 'Authorization': apiInfo,
            // }
        }).then(result=>{
            var data = result.data;
            console.log(data);
            if(data.status == 200 || data.status == 201){
                mcpjs['util/util'].commonAlert("Success Modify DataDisk!")
                mcpjs['datadisk/datadiskmng'].displayDataDiskInfo("MODIFY_SUCCESS");
                mcpjs['datadisk/datadiskmng'].showDataDiskInfo(diskId, diskName);

            }else{
                mcpjs['util/util'].commonAlert("Fail Create DataDisk " + data.message)
                mcpjs['datadisk/datadiskmng'].showDataDiskInfo(diskId, diskName);
            }
        }).catch(error=>{
            console.log(error.response);
        })
    }else{
        mcpjs['util/util'].commonAlert("Disk ID is empty")
        return;
    }
}

export function displayDiskAttachModal(isShow) {
    if (isShow) {
        $("#vmDiskSelectBox").modal();
        $('.scrollbar-inner').scrollbar();
    } else {
        $("#vnetCreateBox").toggleClass("active");
    }
}

function getMcisListCallbackSuccess(caller, data){
    console.log("getMcis List data : ",data);
    var html = "";
    data.forEach((item)=>{

        console.log("vm: ",item.vm);
        vm_list = item.vm;
        var mcis_name = item.name;
        var mcis_id = item.id
        
        vm_list.forEach((item, i)=>{
            console.log()
            html += '<tr>'
            + '<td class="overlay hidden column-50px" data-th="">'
            + '<input type="hidden" id="vm_info_' + i + '" value="' + item.name + '"/>'
            + '<input type="checkbox" name="vmChk" value="' + item.id + '" title="" diskId="'+item.id+'" mcisId="'+mcis_id+'" onclick="checkOnlyOne(this,\''+mcis_id+'\',\''+item.id+'\')"/><label for="td_ch1"></label> <span class="ov off"></span>'
    
            + '</td>'
            + '<td class="btn_mtd ovm" data-th="name">' + mcis_name + '<span class="ov"></span></td>'
            + '<td class="btn_mtd ovm" data-th="name">' + item.name + '<span class="ov"></span></td>'
            + '<td class="overlay hidden" data-th="diskType">' + item.connectionName + '</td>'
            + '</tr>'
        })
       

    })
    console.log(html)
    $("#vmList").empty()
    $("#vmList").append(html)
    displayDiskAttachModal(true)
}

function checkOnlyOne(element, mcis_id, vm_id){
    var checkBox = document.getElementsByName("vmChk");
    checkBox.forEach(item=>{
        item.checked = false;
    })
    element.checked = true;
    $("#attach_mcis_id").val(mcis_id);
    $("#attach_vm_id").val(vm_id);

}

// 팝업이 닫힐 때 부모로 전달되는 function
export function setAssistDataDisk(){
    // Attach가 성공하면 disk목록 조회
    getDataDiskList("name");
}