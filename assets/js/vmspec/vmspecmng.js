import "bootstrap";
import "jquery.scrollbar";
import { Modal } from "bootstrap";
//import { VmSpecListComp } from "../component/list";
//import {client} from '/assets/js/util/util'

var table;
$(()=> {

  // mcpjs["util/common"].setTableHeightForScroll('serverSpecList', 300)
  
    $('.btn_assist').on('click', function () {
        showSpecAssistPopup();
        // lookupSpecList()
    });

    initTable();

    getVmSpecList("")
});

function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"Id", field:"id", visible: false},
        {title:"Connection", field:"connectionName", visible: false},
        {title:"Name", field:"name", vertAlign: "middle"},
        {title:"CSP Spec Name", field:"cspSpecName", vertAlign: "middle"},
        {title: "Description", field:"description", vertAlign: "middle", hozAlign: "center", headerSort:false},
    ]
    
    table = mcpjs["util/util"].setTabulator("vmSpecList", tableObjParams, columns)
    
    table.on("rowClick", function(e, row){
        getVmSpecData(row.getCell("id").getValue(), 'info')
    });

    table.on("rowSelectionChanged", function(data, rows){
    });

    mcpjs['util/util'].displayColumn(table)    
}

// function goFocus(target) {
//     console.log(event)
//     event.preventDefault();

//     $("#" + target).focus();
//     fnMove(target)
// }

// function fnMove(target) {
//     var offset = $("#" + target).offset();
//     console.log("fn move offset : ", offset);
//     $('html, body').animate({
//         scrollTop: offset.top
//     }, 400);
// }

// 등록/상세 area 보이기 숨기기
export function displayVmSpecInfo(targetAction) {
    if (targetAction == "REG") {
        $('#vmSpecCreateBox').toggleClass("active");
        $('#vmSpecInfoBox').removeClass("view");
        $('#vmSpecListTable').removeClass("on");
        var offset = $("#vmSpecCreateBox").offset();
        // var offset = $("#" + target+"").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 300);

        // form 초기화
        $("#regSpecName").val('')
        $("#regCspSpecName").val('')
      mcpjs['util/common'].goFocus('vmSpecCreateBox');
    } else if (targetAction == "REG_SUCCESS") {
        $('#vmSpecCreateBox').removeClass("active");
        $('#vmSpecInfoBox').removeClass("view");
        $('#vmSpecListTable').addClass("on");
        var html = '<option selected>Select Configname</option>';
        // form 초기화
        $("#regSpecName").val('');
        $("#regProvider").val('');
        // $("#regConnectionName").empty();
        //$("#regConnectionName").append(html);
        $("#regConnectionName").val('');
        $("#regCspSpecName").val('');

        var offset = $("#vmSpecCreateBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);

        getVmSpecList("name");
    } else if (targetAction == "DEL") {
        $('#vmSpecCreateBox').removeClass("active");
        $('#vmSpecInfoBox').addClass("view");
        $('#vmSpecListTable').removeClass("on");

        var offset = $("#vmSpecInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 300);

    } else if (targetAction == "DEL_SUCCESS") {
        console.log("$$$$$$$$$DelSuccess$$$$$$$$$$$");
        $('#vmSpecCreateBox').removeClass("active");
        $('#vmSpecInfoBox').removeClass("view");
        $('#vmSpecListTable').addClass("on");

        var offset = $("#vmSpecInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);

        getVmSpecList("name");
    } else if (targetAction == "CLOSE") {
        $('#vmSpecCreateBox').removeClass("active");
        $('#vmSpecInfoBox').removeClass("view");
        $('#vmSpecListTable').addClass("on");

        var offset = $("#vmSpecInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);
    }
}

export function getVmSpecList(sort_type) {
    //mcpjs['util/pathfinder'].getCommonVirtualMachineSpecList("virtualmachinespecmng", sort_type);
    
    var caller = "vmspecmng";
    var actionName = "VmSpecList";
    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['vmspec/vmspecmng'].virtualMachineSpecListCallbackSuccess)
}

export function virtualMachineSpecListCallbackSuccess(caller, result) {
//export function virtualMachineSpecListCallbackSuccess(caller, data, sortType) {

    var data = result.data.VmSpecList; // exception case : if null 
    console.log(data);
    table.setData(data);
    
    // if (data == null) {
    //     html += '<tr><td class="overlay hidden" data-th="" colspan="5">No Data</td></tr>'

    //     $("#specList").empty()
    //     $("#specList").append(html)
    // } else {
    //     new VmSpecListComp(document.getElementById("specList"), data)
    // }
}

export function virtualMachineSpecListCallbackFail(error) {
    var errorMessage = error.response.data.error;
    var statusCode = error.response.status;
    mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
}

// vmSpec 단건 조회
function getVmSpecData(vmSpecId, mode){
    $('#vmSpecMode').val(mode)

    var caller = "vmspecmng";
    var actionName = "VmSpecGet";
    var optionParamMap = new Map();
    optionParamMap.set("{vmSpecId}", vmSpecId);
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['vmspec/vmspecmng'].getVmSpecCallbackSuccess);

}

export function getVmSpecCallbackSuccess(caller, result){
    var data = result.data.VmSpec
    console.log("Show Data : ", data);

    var dtlSpecName = data.name;
    var dtlConnectionName = data.connectionName;
    var dtlCspSpecName = data.cspSpecName;
    var dtlProviderId = data.providerId;
    var dtlRegionName = data.regionName;

    $("#dtlSpecName").empty();
    $("#dtlProvider").empty();
    $("#dtlRegionName").empty();
    $("#dtlConnectionName").empty();
    $("#dtlCspSpecName").empty();


    $("#dtlSpecName").val(dtlSpecName);
    $("#dtlConnectionName").val(dtlConnectionName);
    $("#dtlCspSpecName").val(dtlCspSpecName);
    $("#dtlProvider").val(dtlProviderId);
    $("#dtlRegionName").val(dtlRegionName);

    displayVmSpecInfo("DEL")
}

// deprecated
export function showVmSpecInfo(target) {
    console.log("target showVMSpecInfo : ", target);
    // var apiInfo = "{{ .apiInfo}}";
    var vmSpecId = encodeURIComponent(target);

    var url = "/settings/resources" + "/vmspec/id/" + vmSpecId;
    console.log("URL : ", url)

    return axios.get(url, {
        headers: {
            // 'Authorization': apiInfo
        }

    }).then(result => {
        var data = result.data.VmSpec
        console.log("Show Data : ", data);

        var dtlSpecName = data.name;
        var dtlConnectionName = data.connectionName;
        var dtlCspSpecName = data.cspSpecName;
        var dtlProviderId = data.providerId;
        var dtlRegionName = data.regionName;

        $("#dtlSpecName").empty();
        $("#dtlProvider").empty();
        $("#dtlRegionName").empty();
        $("#dtlConnectionName").empty();
        $("#dtlCspSpecName").empty();


        $("#dtlSpecName").val(dtlSpecName);
        $("#dtlConnectionName").val(dtlConnectionName);
        $("#dtlCspSpecName").val(dtlCspSpecName);
        $("#dtlProvider").val(dtlProviderId);
        $("#dtlRegionName").val(dtlRegionName);

        displayVmSpecInfo("DEL")
    })
}


export function createVmSpec() {
    var specId = $("#regSpecName").val();
    var specName = $("#regSpecName").val();
    var regionName = $("#regRegionName").val();
    var providerId = $("#regProvider").val()
    var cspSpecName = $("#regCspSpecName").val();

    if (!specName) {
        alert("Input New Spec Name")
        $("#regSpecName").focus()
        return;
    }

    // var apiInfo = "{{ .apiInfo}}";
    // var url = "/settings/resources" + "/vmspec"
    // console.log("URL : ", url)
    var obj = {
        id: specId,
        name: specName,
        cspSpecName: cspSpecName,
        providerId : providerId,
        regionName : regionName,
        
    }
    console.log("info image obj Data : ", obj);

    if (specName) {
        var caller = "vmspecmng";
        var controllerKeyName = "VmSpecReg";
        var optionParamMap = new Map();
        mcpjs['util/pathfinder'].postCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs['vmspec/vmspecmng'].vmSpecRegCallbackSuccess);

        // client.post(url, obj, {
        //     headers: {
        //         'Content-type': 'application/json',
        //         // 'Authorization': apiInfo,
        //     }
        // }).then(result => {
        //     console.log("result spec : ", result);
        //     var statusCode = result.data.status;
        //     if (statusCode == 200 || statusCode == 201) {
        //         // if (result.status == 200 || result.status == 201) {
        //       mcpjs["util/util"].commonAlert("Success Create Spec!!")
        //         //등록하고 나서 화면을 그냥 고칠 것인가?
        //         displayVmSpecInfo("REG_SUCCESS");
        //         //getVmSpecList("name");
        //         //아니면 화면을 리로딩 시킬것인가?
        //         // location.reload();
        //         // $("#btn_add2").click()
        //         // $("#namespace").val('')
        //         // $("#nsDesc").val('')
        //     } else {
        //         var message = result.data.message;
        //       mcpjs["util/util"].commonAlert("Fail Create Spec : " + message + "(" + statusCode + ")");
        //         // TODO : 이 화면에서 오류날 항목은 CSP Spec Name이 없을 떄이긴 한데.... 중복일때는 알려주는데 ts.micro3(없는 spec)일 때는 어떤오류인지...
        //     }
        //     // }).catch(function(error){
        //     //     console.log("get create error : ");
        //     //     console.log(error);
        //     //   mcpjs["util/util"].commonAlert(error);// TODO : error처리하자.
        //     // });
        // }).catch((error) => {
        //     console.warn(error);
        //     console.log(error.response)
        //     var errorMessage = error.response.data.error;
        //     var statusCode = error.response.status;
        //     mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
        // });
    } else {
        mcpjs["util/util"].commonlert("Input Spec Name")
        $("#regSpecName").focus()
        return;
    }
}

// vmspec reg callback
export function vmSpecRegCallbackSuccess(caller, result){
    console.log("result spec : ", result);
    var statusCode = result.data.status;
    if (statusCode == 200 || statusCode == 201) {
        // if (result.status == 200 || result.status == 201) {
        mcpjs["util/util"].commonAlert("Success Create Spec!!")
        //등록하고 나서 화면을 그냥 고칠 것인가?
        displayVmSpecInfo("REG_SUCCESS");
        //getVmSpecList("name");
        //아니면 화면을 리로딩 시킬것인가?
        // location.reload();
        // $("#btn_add2").click()
        // $("#namespace").val('')
        // $("#nsDesc").val('')
    } else {
        var message = result.data.message;
        mcpjs["util/util"].commonAlert("Fail Create Spec : " + message + "(" + statusCode + ")");
        // TODO : 이 화면에서 오류날 항목은 CSP Spec Name이 없을 떄이긴 한데.... 중복일때는 알려주는데 ts.micro3(없는 spec)일 때는 어떤오류인지...
    }
    
}

export function deleteVmSpec() {
    var selSpecId = "";
    var count = 0;
    // var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    // $("input[name='chk']:checked").each(function () {
    //     count++;
    //     selSpecId = selSpecId + $(this).val() + ",";
    // });
    // selSpecId = selSpecId.substring(0, selSpecId.lastIndexOf(","));

    // console.log("specId : ", selSpecId);
    // console.log("count : ", count);

    // if (selSpecId == '') {
    //     alert("삭제할 대상을 선택하세요.");
    //     return false;
    // }

    // if (count != 1) {
    //     alert("삭제할 대상을 하나만 선택하세요.");
    //     return false;
    // }

    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a VM Spec!!");
        return;
    }

    var selSpecId = "";
    selectedRows.forEach(function (row) {
        selSpecId = row.getCell("id").getValue();
    });

    var caller = "vmspecmng";
    var controllerKeyName = "VmSpecDel";
    var optionParamMap = new Map();
    optionParamMap.set("{vmSpecId}", selSpecId);    
    var obj = {}
    mcpjs["util/pathfinder"].deleteCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs["vmspec/vmspecmng"].vmSpecDelCallbackSuccess );

    // var url = "/settings/resources" + "/vmspec/id/" + selSpecId;
    // console.log("URL : ", url)
    // client.delete(url, {
    //     headers: {
    //         // 'Authorization': "{{ .apiInfo}}",
    //         'Content-Type': "application/json",
    //         "x-csrf-token": csrfToken
    //     }
    // }).then(result => {
    //     var data = result.data;
    //     console.log(data);
    //     // if (result.status == 200 || result.status == 201) {
    //     var statusCode = result.data.status;
    //     if (statusCode == 200 || statusCode == 201) {
    //         // commonAlert("Success Delete Spec.");
    //       mcpjs["util/util"].commonAlert(data.message);
    //         // location.reload(true);
    //         getVmSpecList("name");

    //         displayVmSpecInfo("DEL_SUCCESS")
    //     } else {
    //         var message = data.message;
    //       mcpjs["util/util"].commonAlert("Fail Create Spec : " + message + "(" + statusCode + ")");
    //         // TODO : 이 화면에서 오류날 항목은 CSP Spec Name이 없을 떄이긴 한데.... 중복일때는 알려주는데 ts.micro3(없는 spec)일 때는 어떤오류인지...
    //     }
    // }).catch((error) => {
    //     console.warn(error);
    //     console.log(error.response)
    //     var errorMessage = error.response.data.error;
    //     var statusCode = error.response.status;
    //     mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    // });
}

export function vmSpecDelCallbackSuccess(caller, result){
    console.log("del result ", result);
    var data = result.data;
    
    // if (result.status == 200 || result.status == 201) {
    var statusCode = data.status;
    if (statusCode == 200 || statusCode == 201) {
        mcpjs["util/util"].commonAlert(data.message);
        getVmSpecList("name");

        displayVmSpecInfo("DEL_SUCCESS")
    } else {
        var message = data.message;
        mcpjs["util/util"].commonAlert("Fail Create Spec : " + message + "(" + statusCode + ")");
    }
}

export function clearCspSpecInfo() {
    $("#regSpecName").val();
    $("#regCspSpecName").val();
}

// spec Assist popup에 parameter 전달
export function showSpecAssistPopup() {
    console.log("showSpecAssistPopup")
    $("#specLookupAssist").modal("toggle");

    var caller = "vmspecmng";
    var providerId = $("#regProvider").val();
    var regionName = $("#regRegionName").val();
    mcpjs['vmspec/vmspeclookup_modal'].setVmspecLookupAssist(caller, providerId, regionName);
}

// popup에서 main의 txtbox로 specName set
// export function setCspSpecName(cspSpecName) {
//     $("#regCspSpecName").val(cspSpecName);
   
//     var selectedProviderId = $("#regProvider_lookup_assist").val();
//     var selectedRegionName = $("#regRegionName_lookup_assist").val();
//     console.log("select_provider : ",selectedProviderId)
//     console.log("selectedRegionName : ",selectedRegionName)

//     $("#regProvider").val(selectedProviderId);
//     $("#regRegionName").val(selectedRegionName);


//     $("#specLookupAssist").modal("hide");
// }

// popup에서 가져온 data set.
export function setValuesFromAssist(caller, assistMap){
    console.log("setValuesFromAssist", caller)
    console.log("assistMap", assistMap)    

    var assistProviderId = assistMap.get("providerId");
    var assistRegionName = assistMap.get("regionName");
    var assistCspSpecName = assistMap.get("cspSpecName");

    var providerId = $("#regProvider").val();
    var regionName = $("#regRegionName").val();
    console.log(providerId + " : " + assistProviderId)
    if( providerId != assistProviderId){
        $("#regProvider").val(assistProviderId);
    }
    console.log(regionName + " : " + assistRegionName)
    if( regionName != assistRegionName){
        $("#regRegionName").val(assistRegionName);
    }

    $("#regCspSpecName").val(assistCspSpecName);
}