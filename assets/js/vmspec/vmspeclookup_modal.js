import "bootstrap";
import "jquery.scrollbar";

var table;
$(()=> {

    $('#specLookupAssist .btn_apply').on('click', function () {
        applyAssistValidCheck()
    });

    $('#specLookupAssist .btn_search_spec').on('click', function () {
        lookupSpecList()
    });
    
    initTable();
    
})

export function setVmspecLookupAssist(caller, providerId, regionName){
    $("#parentsVmSpecLookupAssist").val(caller)

    if (providerId) {
        $("#regProvider_lookup_assist").val(providerId);
        // $("#assistImageProviderName option[value=" + configName + "]").prop('selected', true).change();
    }
    if(regionName){
        $("#regRegionName_lookup_assist").val(regionName)
    }
}

function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        
        {title:"Name", field:"name", vertAlign: "middle"},
        {title:"Region", field:"region", vertAlign: "middle"},
        {title:"Memory", field:"mem", vertAlign: "middle"},
        {title:"vCPU", field:"vCpu", vertAlign: "middle"},
        {title:"GPU", field:"GPU", vertAlign: "middle"},
    ]
    
    var isMultiSelect = false;
    table = mcpjs["util/util"].setTabulator("assistLookupSpecList", tableObjParams, columns, isMultiSelect);
    
    //table.on("rowClick", function(e, row){
    //    getVmSpecData(row.getCell("id").getValue(), 'info')
    //});

    table.on("rowSelectionChanged", function(data, rows){
    });

    mcpjs['util/util'].displayColumn(table)    
}

// connection에 등록된 spec목록 조회(공통함수 호출)
export function lookupSpecList() {
    //$("#assistLookupSpecList").empty()
    // var connectionName = $("#assistLookupSpecConnectionName").val();
    // if (!connectionName) {
    //   mcpjs["util/util"].commonAlert("connection name required")
    //     return;
    // }
    //provider , region 
    var providerId = $("#regProvider_lookup_assist").val()
    var regionName = $("#regRegionName_lookup_assist").val()
     if (!providerId) {
      mcpjs["util/util"].commonAlert("Please Select Provider")
        return;
    }
     if (!regionName) {
      mcpjs["util/util"].commonAlert("Please Select Region")
        return;
    }

//    $('.scrollbar-inner').scrollbar();

//     mcpjs['util/pathfinder'].getCommonLookupSpecList("vmspecmng", providerId, regionName);

    var caller = "vmspeclookup";
    var actionName = "VmSpecLookupList";
    var optionParamMap = new Map();
    optionParamMap.set("providerId", providerId);
    optionParamMap.set("regionName", regionName);
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['vmspec/vmspeclookup_modal'].lookupSpecListCallbackSuccess);
}
// 성공 callback
export function lookupSpecListCallbackSuccess(caller, result) {
    console.log(result);
    var data = result.data.CspVmSpecList
    table.setData(data);

    // var html = "";
    // if (data == null) {
    //     html += '<tr><td class="overlay hidden" data-th="" colspan="5">No Data</td></tr>'

    //     $("#assistLookupSpecList").empty()
    //     $("#assistLookupSpecList").append(html)
    // } else {
    //     $.each(data, function (index, item) {
    //         console.log('index:' + index + ' / ' + 'item:' + item);
    //         console.log(item);
    //         var vCpu = item.vCpu;
    //         var vCpuValue = "";
    //         if (vCpu) {
    //             vCpuValue = 'clock : ' + vCpu.clock + '<br/> count :' + vCpu.count
    //         }
    //         var gpu = item.gpu;
    //         var gpuValue = "";
    //         if (gpu) {
    //             gpuValue += 'count : ' + (gpu.count == undefined ? "" : gpu.count);
    //             gpuValue += '<br/> mem :' + (gpu.mem == undefined ? "" : gpu.mem);
    //             gpuValue += '<br/> mfr :' + (gpu.mfr == undefined ? "" : gpu.mfr);
    //             gpuValue += '<br/> model :' + (gpu.model == undefined ? "" : gpu.model);
    //         }

    //         html += '<tr onclick="mcpjs[\'vmspec/vmspeclookup_modal\'].setAssistValue(\'' + index + '\');">'
    //             + '<input type="hidden" id="vmspeclookup_regionName_' + index + '" value="' + item.region + '">'
    //             + '<input type="hidden" id="vmspeclookup_cspSpecName_' + index + '" value="' + item.name + '">'
    //             + '<td class="overlay hidden" data-th="region">' + item.region + '</td>'
    //             + '<td class="btn_mtd ovm" data-th="name ">' + item.name + '<span class="ov"></span></td>'
    //             + '<td class="btn_mtd ovm" data-th="mem ">' + item.mem + '<span class="ov"></span></td>'
    //             + '<td class="overlay hidden" data-th="vcpu">' + vCpuValue + '</td>'
    //             + '<td class="overlay hidden" data-th="gpu">' + gpuValue + '</td>'
    //             + '</tr>'
    //     });


    //     $("#assistLookupSpecList").empty()
    //     $("#assistLookupSpecList").append(html)
    //     $("#lookupSpecCount").text(data.length);
        // displayVmSpecInfo("REG_SUCCESS");
    //}
}

// 조회 실패
export function lookupSpecListCallbackFail(error) {
    var errorMessage = error.response.data.error;
    var statusCode = error.response.status;
    mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
}

export function getSpecListCallbackFail(caller, error) {
    // no data
    var html = ""
    html += '<tr>'
        + '<td class="overlay hidden" data-th="" colspan="4">No Data</td>'
        + '</tr>';
    $("#specList").empty()
    $("#specList").append(html)
}


export function clearLookupAssistSpecList(targetTableList) {
    $("#" + targetTableList).empty()
}

export function setAssistValue(index) {
    $("#assistVmSpecLookupSelectedIndex").val(index);
}

// 
export function applyAssistValidCheck(cspSpecName) {
    var caller = $("#parentsVmSpecLookupAssist").val()

    var selectedIndex = $("#assistVmSpecLookupSelectedIndex").val();// row을 클릭하면 해당 index를 저장
    
    // 선택한 provider, region check : 이미 선택된 provider, region이 있을 때 비교하여 다른 provider, region이면 confirm을 띄우고 OK면 초기화 시키고 set
    //var selectedProviderId = "";
    var selectedProviderId = $("#regProvider_lookup_assist").val();
    var selectedRegionName = "";
    var selectedCspSpecName = "";

    //var orgPrefix = "vmspeclookup_";    
    //var selectedProviderId = $("#" + orgPrefix + "providerId_" + selectedIndex).val();
    // var selectedRegionName = $("#" + orgPrefix + "regionName_" + selectedIndex).val();
    // var selectedCspSpecName = $("#" + orgPrefix + "cspSpecName_" + selectedIndex).val();
    // //assistVmSpecLookupSelectedIndex
    
    // var selectedProviderId = $("#regProvider_lookup_assist").val();
    //var selectedRegionName = $("#regRegionName_lookup_assist").val();
    //var selectedCspSpecName = cspSpecName;

    var selectedRows = table.getSelectedRows();
    selectedRows.forEach(function(row) {
        selectedCspSpecName = row.getCell("name").getValue();      
        selectedRegionName = row.getCell("region").getValue();
    });

    console.log("select_provider : ",selectedProviderId)
    console.log("selectedRegionName : ",selectedRegionName)
    console.log("selectedCspSpecName : ",selectedCspSpecName)

    let vmSpecMap = new Map();
    vmSpecMap.set("providerId", selectedProviderId);
    vmSpecMap.set("regionName", selectedRegionName);
    vmSpecMap.set("cspSpecName", selectedCspSpecName);
    
    mcpjs['vmspec/vmspecmng'].setValuesFromAssist(caller, vmSpecMap);

    $("#specLookupAssist").modal("hide");
}