import "bootstrap";
import "jquery.scrollbar";
import {client} from '/assets/js/util/util'
var table
var checked_array = []
$(function () {
    //mcpjs['util/pathfinder'].setLeftMenu();
    initTable();

    getVpcList();
});

function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"Id", field:"id", visible: false},
        {title:"System Label", field:"systemLabel", visible: false},
        {title:"VPC Name", field:"name", vertAlign: "middle"},
        {title: "CIDR Block", field:"cidrBlock", vertAlign: "middle", headerSort:false},
        {title: "Description", field:"description", vertAlign: "middle", hozAlign: "center", headerSort:false},
    ]
    
    table = mcpjs["util/util"].setTabulator("vpcList", tableObjParams, columns)
    
    table.on("rowClick", function(e, row){
        displayVNetInfo("INFO", row.getElement())
        getVpcData(row.getCell("name").getValue(), 'info')
    });

    table.on("rowSelectionChanged", function(data, rows){
       checked_array = data
    });

    mcpjs['util/util'].displayColumn(table)    
}

// VPC 목록 조회
export function getVpcList() {
    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData("vpcmng", "VpcList", optionParamMap, mcpjs['network/vnetmng'].getVpcListCallbackSuccess)    
    
}
// VPC 목록 조회 결과 처리
export function getVpcListCallbackSuccess(caller, result){
    console.log("get VPC List : ");
    console.log(result);
    // var data = result.data.vNet;
    var data = result.data.VNetList;
    console.log(data);
    table.setData(data)
    // ModalDetail()        
}

// VPC 단건 조회
export function getVpcData(currentVPC, mode) {
    console.log("getVpcData : ", currentVPC);
    $('#networkVpcName').text(currentVPC)
    $('#vpcMode').val(mode)

    var optionParamMap = new Map();
    optionParamMap.set("{vpcId}", currentVPC)
    //mcpjs['util/pathfinder'].getCommonData("vpcmng", "VpcData", optionParamMap, mcpjs['network/vnetmng'].getVpcDataCallbackSuccess)
    mcpjs['util/pathfinder'].getCommonData("vpcmng", "VpcGet", optionParamMap, mcpjs['network/vnetmng'].getVpcDataCallbackSuccess)
}

// VPC 단건 조회 결과 처리. getVpcData으로 가져온 값을 setting
// displayMode 에 따라 set하고 보여지는 영역이 다름.
export function getVpcDataCallbackSuccess(caller, result){
    var displayMode = $('#vpcMode').val();

    console.log(result);
    var data = result.data.VNetInfo

    var vpcName = data.name;
    var description = data.description;
    var providerId = data.providerId;
    var regionName = data.regionName;
    var connectionName = data.connectionName;
    var cidrBlock = data.cidrBlock;
    var subnet = "";

    var subList = data.subnetInfoList;
    for (var i in subList) {
        subnet += subList[i].id + " (" + subList[i].ipv4_CIDR + ")";
    }
    console.log("Subnet : ", subnet);

    $("#" + displayMode +"VpcName").empty();
    $("#" + displayMode +"Description").empty();
    $("#" + displayMode +"Provider").empty();
    $("#" + displayMode +"ConnectionName").empty();
    $("#" + displayMode +"CidrBlock").empty();
    $("#" + displayMode +"Subnet").empty();
    
    $("#" + displayMode +"VpcName").val(vpcName);
    $("#" + displayMode +"Description").val(description);
    $("#" + displayMode +"Provider").val(providerId);
    $("#" + displayMode +"RegionName").val(regionName);
    $("#" + displayMode +"ConnectionName").val(connectionName);
    $("#" + displayMode +"CidrBlock").val(cidrBlock);
    $("#" + displayMode +"Subnet").val(subnet);
}

// VPC 추가
export function createVpcData() {
    var vpcName = $("#regVpcName").val();
    var description = $("#regDescription").val();
    var connectionName = $("#regConnectionName").val();
    var providerId = $("#regProviderName").val();
    var regionName = $("#regRegionName").val();
    
    
    var cidrBlock = $("#regCidrBlock").val();
    if (!vpcName) {
        mcpjs['util/util'].commonAlert("Input New VPC Name")
        $("#regVpcName").trigger("focus")
        return;
    }
    console.log(mcpjs['network/subnet_add_modal'].subnetJsonList);

    //var url = "/settings/resources/vnet";
    //console.log("vNet Reg URL : ", url)
    var obj = {
        CidrBlock: cidrBlock,
        ConnectionName: connectionName,
        Description: description,
        Name: vpcName,
        SubnetInfoList: mcpjs['network/subnet_add_modal'].subnetJsonList,
        ProviderID: providerId,
        RegionName: regionName
    }
    console.log("info vNet obj Data : ", obj);

    if (vpcName) {

        var controllerKeyName = "VpcReg";
        var optionParamMap = new Map();        
        mcpjs["util/pathfinder"].postCommonData('vpcmng',controllerKeyName,optionParamMap, obj, mcpjs['network/vnetmng'].vpcRegCallbackSuccess)
        
        // client.post(url, obj, {
        //     headers: {
        //         'Content-type': 'application/json',
        //     }
        // }).then(result => {
        //     console.log("result vNet : ", result);
        //     var data = result.data;
        //     console.log(data);
        //     if (data.status == 200 || data.status == 201) {
        //         mcpjs['util/util'].commonAlert("Success Create Network(VPC)!!")
        //         displayVNetInfo("REG_SUCCESS")
        //     } else {
        //         mcpjs['util/util'].commonAlert("Fail Create Network(VPC) " + data.message)
        //     }
    
        // }).catch((error) => {
        //     console.log(error.response)
        //     var errorMessage = error.response.data.error;
        //     var statusCode = error.response.status;
        //     mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
        // });
    } else {
        mcpjs['util/util'].commonAlert("Input VPC Name")
        $("#regVpcName").trigger("focus")
        return;
    }
}

// vpc reg callback
export function vpcRegCallbackSuccess(caller, result){
    console.log("result vNet : ", result);
    var data = result.data;
    console.log(data);
    if (data.status == 200 || data.status == 201) {
        mcpjs['util/util'].commonAlert("Success Create Network(VPC)!!")
        displayVNetInfo("REG_SUCCESS")
    } else {
        mcpjs['util/util'].commonAlert("Fail Create Network(VPC) " + data.message)
    }
}

// VPC 삭제
export function deleteVpcData() {
    var vNetId = "";
    var count = 0;

    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("삭제할 대상을 선택하세요.");
        return;
    }

    selectedRows.forEach(function (row) {
        count++;
        if( count > 1){
            mcpjs['util/util'].commonAlert("삭제할 대상을 하나만 선택하세요.");
            return false;
        }
        var vpcId = row.getCell("id").getValue();
        //var name = row.getCell("name").getValue();

        var caller = "vpcmng";
        var controllerKeyName = "VpcDel";
        var optionParamMap = new Map();
        optionParamMap.set("{vpcId}", vpcId);
        var obj = {}
        mcpjs["util/pathfinder"].deleteCommonData(caller,controllerKeyName,optionParamMap, obj, mcpjs['network/vnetmng'].vpcDelCallbackSuccess)
    });
    
    //var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

    // $("input[name='chk']:checked").each(function () {
    //     count++;
    //     vNetId = vNetId + $(this).val() + ",";
    // });
    // vNetId = vNetId.substring(0, vNetId.lastIndexOf(","));

    // console.log("vNetId : ", vNetId);
    // console.log("count : ", count);

    // if (vNetId == '') {
    //     mcpjs['util/util'].commonAlert("삭제할 대상을 선택하세요.");
    //     return false;
    // }

    // if (count != 1) {
    //     mcpjs['util/util'].commonAlert("삭제할 대상을 하나만 선택하세요.");
    //     return false;
    // }

    
    // var url = "/settings/resources/vnet/id/" + vNetId
    // console.log("del vnet url : ", url);

    // client.delete(url, {
    //     headers: {
           
    //         'Content-Type': "application/json",
    //         'x-csrf-token': csrfToken
    //     }
    // }).then(result => {
    //     var data = result.data;
    //     console.log(result);
    //     console.log(data);
    //     if (result.status == 200 || result.status == 201) {
            
    //         mcpjs['util/util'].commonAlert(data.message)
    //         displayVNetInfo("DEL_SUCCESS")
        
    //     } else {
    //         mcpjs['util/util'].commonAlert(result.data.error)
    //     }
      
    // }).catch((error) => {
    //     console.warn(error);
    //     console.log(error.response)
    //     var errorMessage = error.response.data.error;
    //     var statusCode = error.response.status;
    //    mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    // });
}

export function vpcDelCallbackSuccess(caller, result){
    var data = result.data;
    console.log(result);
    console.log(data);
    if (result.status == 200 || result.status == 201) {
        
        mcpjs['util/util'].commonAlert(data.message)
        displayVNetInfo("DEL_SUCCESS")
    
    } else {
        mcpjs['util/util'].commonAlert(result.data.error)
    }
}

// VNet목록에 Item 추가
function addVNetRow(item, index) {
    console.log("addVnetRow " + index);
    console.log(item)
    var html = ""
    html += `<tr onclick="mcpjs['network/vnetmng'].detailVpc(${item.name}, 'dtl');">
        <td class="overlay hidden column-50px" data-th="">
        <input type="hidden" id="sg_info_${index}" value=${item.name}/>
        <input type="checkbox" name="chk" value=${item.name} id="raw_${index}" title="" /><label for="td_ch1"></label> <span class="ov off"></span>
        <input type="hidden" value=${item.systemLabel}/>
        </td>
        <td class="btn_mtd ovm" data-th="name">${item.name}<span class="ov"></span></td>
        <td class="overlay hidden" data-th="cidrBlock">${item.cidrBlock}</td>
        <td class="overlay hidden" data-th="description">${item.description}</td>
        </tr>`
    return html;
}

// VPC 상세내역 표시 : TODO : Edit도 있을 것이므로 function명 적절한 것으로 변경 및 보완 필요
export function displayVNetInfo(targetAction, row_object) {
   if (targetAction == "INFO") {
        var $current_row = $(row_object) // 선택된 row element
        if ($current_row.hasClass("on")) { // 이미 info box가 열려있으면
            $current_row.removeClass("on"); 
            $('#vNetInfoBox').removeClass("view");// 닫는다
        } else {
            $current_row.addClass("on");
            $current_row.siblings().removeClass("on");
            if (!$('#vNetInfoBox').hasClass("view")) { // 이전에 다른 row를 클릭해서 info box가 이미 열려있는지 확인
                $('#vNetInfoBox').addClass("view");
            }
            $('#vNetCreateBox').removeClass("active");
            $('#vNetEditBox').removeClass("view");
        }
   }
   if (targetAction == "REG") {
        $('#vNetCreateBox').toggleClass("active");
        $('#vNetInfoBox').removeClass("view");
        $('#vNetListTable').removeClass("on");
        var offset = $("#vNetCreateBox").offset();
        // var offset = $("#" + target+"").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 300);

        // form 초기화
        $("#regVpcName").val('')
        $("#regDescription").val('')
        $("#regCidrBlock").val('')
        $("#regSubnet").val('')
        mcpjs['util/common'].goFocus('vNetCreateBox');
    } else if (targetAction == "REG_SUCCESS") {
        $('#vNetCreateBox').removeClass("active");
        $('#vNetEditBox').removeClass("view");
        $('#vNetInfoBox').removeClass("view");
        $('#vNetListTable').addClass("on");

        var offset = $("#vNetCreateBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);

        // form 초기화
        $("#regVpcName").val('')
        $("#regDescription").val('')
        $("#regCidrBlock").val('')
        $("#regSubnet").val('')
        getVpcList("name");
    } else if (targetAction == "EDIT") { 
        $('#vNetEditBox').toggleClass("view");
        $('#vNetInfoBox').removeClass("view");
        $('#vNetListTable').removeClass("on");
    } else if (targetAction == "DEL") {
        $('#vNetCreateBox').removeClass("active");
        $('#vNetInfoBox').addClass("view");
        $('#vNetListTable').removeClass("on");

        var offset = $("#vNetInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 300);

    } else if (targetAction == "DEL_SUCCESS") {
        $('#vNetCreateBox').removeClass("active");
        $('#vNetEditBox').removeClass("view");
        $('#vNetInfoBox').removeClass("view");
        $('#vNetListTable').addClass("on");

        var offset = $("#vNetInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);

        getVpcList("name");
    } else if (targetAction == "CLOSE") {
        $('#vNetCreateBox').removeClass("active");
        $('#vNetInfoBox').removeClass("view");
        $('#vNetListTable').addClass("on");

        var offset = $("#vNetInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);
    }
}

// List에서 Row 클릭시 vpc를 조회하여 내용을 해당 영역에 표시.(dtl, edit)
export function detailVpc(vpcId, mode) {  
    if( mode == "edit"){
        editVpc()
    }else{
        getVpcData(vpcId, mode);
    }
}

// 수정영역 표시. 체크한 VPC정보를 조회하여 수정영역에 표시
// 표 바깥에서 조회하므로 직접 vpcID를 받지 않음.
export function editVpc() {
    var vpcId = "";
    var count = 0;
    
    $("input[name='chk']:checked").each(function () {
        count++;
        vpcId = vpcId + $(this).val() + ",";
    });
    vpcId = vpcId.substring(0, vpcId.lastIndexOf(","));

    console.log("vpcId : ", vpcId);
    console.log("count : ", count);

    if (vpcId == '') {
        mcpjs['util/util'].commonAlert("수정할 대상을 선택하세요.");
        return false;
    }

    if (count != 1) {
        mcpjs['util/util'].commonAlert("수정할 대상을 하나만 선택하세요.");
        return false;
    }

   getVpcData(vpcId, "edit");
   displayVNetInfo("EDIT")
}