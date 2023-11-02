import { Modal } from "bootstrap";

var table;
var checked_array = [];// table에서 체크된 row 
$(()=> {
    // apply button
    $('#firewallRegisterBox .btn_apply').on('click', function () {
        console.log("#firewallRegisterBox .btn_apply clicked")
        applyFirewallRuleSet();
    });

    //console.log("firewall init")
    initTable();
});

function initTable(){
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title: "id",           field:"id",          vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, visible:false},
		{title: "IP Protocol",  field:"ipProtocol",  editor: "list",     editable: editCheck, editorParams: { values: ["TCP", "UDP", "All"] },  vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},        
        {title: "Direction",    field:"direction",   editor: "list",     editable: editCheck, editorParams: { values: [ "inbound","outbound" ] },  vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
        {title: "From Port",    field:"fromPort",    editor: "input",    editable: editCheck, vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
		{title: "To Port",      field:"toPort",      editor: "input",    editable: editCheck, vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
        {title: "CIDR",         field:"cidr",        editor: "input",    editable: editCheck, vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
        
    ]

    table = mcpjs["util/util"].setTabulator("firewallRulesetList", tableObjParams, columns)

    table.on("rowSelectionChanged", function(rowdata, rows){
        console.log(" rowSelectionChanged ")
        console.log(rowdata)
		checked_array = rowdata
	});
}

var editCheck = function(cell){
    return !cell.getData()['id'] 
}

// add Row
$(document).on("click", "button[name=btn_add_firewallrules]", function () {    
    console.log("firewallrule btn add clicked");

    // var columns = [
    //     {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
	// 	{title: "IP Protocol", field:"ipProtocol", editor: "select", editorParams: { values: { "tcp": "TCP", "udp": "UDP", "all": "All" } }, editable: true, vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
    //     {title: "Direction", field:"direction", editor: "select", editorParams: { values: { "inbound": "INBOUND", "outbound": "OUTBOUND" } }, editable: true, vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
    //     {title: "From Port", field:"fromPort", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
	// 	{title: "To Port", field:"toPort", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
    //     {title: "CIDR", field:"cidr", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
    // ]
    
    //var newRowData = { ipProtocol: "all", editor: "select", editorParams: { values: [ {"tcp": "TCP"}, {"udp": "UDP"}, {"all": "All"} ] }, editable: true }; // 기본값 "all" 설정
    //var newRowData = {ipProtocol: "ALL", {direction:"OUTBOUND", editable: true}, fromPort:"8", };
    //var newRowData = {ipProtocol: "ALL", direction:"OUTBOUND", editable: true, fromPort:"8", };
    //table.addRow(newRowData);    
    table.addRow({});
    console.log("firewallrule row added");
});

// delete Row : checked_array에 값을 넣고 한번에 삭제
$(document).on("click", "button[name=btn_delete_firewallrules]", function () {    
    console.log("firewallrule btn delete clicked");
    console.log(checked_array);
    // 
});

// var fwrsJsonList = "";// firewallRuleSet 담을 array
// function getStaffText() {
//     var addStaffText =
//         '<tr class="ip" name="tr_Input">' +
//         '<td class="btn_mtd column-16percent" data-th="fromPort"><input type="text" name="fromport" value="" placeholder="" class="pline" title="" /> <span class="ov up" name="td_ov"]></span></td>' +
//         '<td class="overlay column-16percent" data-th="toPort"><input type="text" name="toport" value="" placeholder="" class="pline" title="" /></td>' +
//         '<td class="overlay column-16percent" data-th="ipProtocol">' +
//         '<select class="selectbox white pline" name="ipprotocol">' +
//         '<option value="tcp">TCP</option>' +
//         '<option value="udp">UDP</option>' +
//         '<option value="*">ALL</option>' +
//         '</select>' +
//         '</td>' +
//         '<td class="overlay" data-th="direction">' +
//         '<select class="selectbox white pline" name="direction">' +
//         '<option value="inbound">Inbound</option>' +
//         '<option value="outbound">Outbound</option>' +
//         '</select>' +
//         '</td>' +
//         '<td class="btn_mtd column-16percent" data-th="cidr">' +
//         '<input type="text" value="" name="cidr" placeholder="" class="pline" title="" /> ' +
//         '<span class="ov off"></span>' +
//         '</td>' +
//         '<td class="overlay column-80px">' +
//         '<button class="btn btn_add" name="btn_add" value="">add</button>' +
//         '<button class="btn btn_del" name="delInput" value="">del</button>' +
//         '</td>' +
//         '</tr>';
//     return addStaffText;
// }

//table row add
// $(document).on("click", "button[name=btn_add]", function () {    
//     var trHtml = $("tr[name=tr_Input]:last");
//     trHtml.after(getStaffText());
// });
// $('.dataTable .btn.btn_add').on("click", function() {
//     // trHtml.after(addStaffText);
//     var trHtml = $( "tr[name=tr_Input]:last" );
//     trHtml.after(getStaffText());
// });

// // tabulator 사용으로 변경
// $(document).on("click", "button[name=delInput]", function () {
//     var trHtml = $(this).parent().parent();
//     trHtml.remove();
// });

// // tabulator 사용으로 변경
// $(document).on("click", "span[name=td_ov]", function () {
//     var trHtml = $(this).parent().parent();
//     trHtml.find(".btn_mtd").toggleClass("over");
//     trHtml.find(".overlay").toggleClass("hidden");
// });

// parent에 firewallRule 정보를 넘겨 줌
export function applyFirewallRuleSet() {

    var parentsSecurityGroupAssist = $("#parentsSecurityGroupAssist").val();
    console.log("parentsSecurityGroupAssist", parentsSecurityGroupAssist)

    var fwrsList = new Array();
    var allRows = table.getData();
    allRows.forEach(function(row) {// 모든 row 대상
        var ruleSetData = new Object();
        ruleSetData.direction = row.direction;
        ruleSetData.ipProtocol = row.ipProtocol;
        ruleSetData.fromPort = row.fromPort;
        ruleSetData.toPort = row.toPort;
        ruleSetData.cidr = row.cidr;

        fwrsList.push(ruleSetData);
    });
    //var selectedRows = table.getSelectedRows();
    //selectedRows.forEach(function(row) {
        // var ruleSetData = new Object();
        // ruleSetData.direction = row.getCell("direction").getValue();
        // ruleSetData.ipProtocol = row.getCell("ipProtocol").getValue();
        // ruleSetData.fromPort = row.getCell("fromPort").getValue();        
        // ruleSetData.toPort = row.getCell("toPort").getValue();
        // ruleSetData.cidr = row.getCell("cidr").getValue();

    //     fwrsList.push(ruleSetData);
    // });
    // 여러군데에서 띄우는 경우 parentsSecurityGroupAssist 값으로 구분할 것
    mcpjs['securitygroup/securitygroupmng'].setValuesFromAssist("FirewallRuleSetAssist", fwrsList);// parent로 값 전달    
    $("#firewallRegisterBox").modal("hide");

    // var providerId = $("#regProvider option:selected").val();
    // var fromPortValue = $("input[name='fromport']").length;
    // var toPortValue = $("input[name='toport']").length;
    // var ipprotocolValue = $("select[name='ipprotocol']").length;
    // var directionValue = $("select[name='direction']").length;
    // var cidrValue = $("input[name='cidr']").length;
    // var isSameDirection = true;// direction이 하나만 선택해야하는 경우 사용
    // var isSameCidr = true;// cidr을 하나만 사용할 수 있는 경우 사용

    // var fromPortData = new Array(fromPortValue);
    // var toPortData = new Array(toPortValue);
    // var ipprotocolData = new Array(ipprotocolValue);
    // var directionData = new Array(directionValue);
    // var cidrData = new Array(cidrValue);

    // for (var i = 0; i < fromPortValue; i++) {
    //     fromPortData[i] = $("input[name='fromport']")[i].value;
    //     console.log("fromPortData" + [i] + " : ", fromPortData[i]);
    // }
    // for (var i = 0; i < toPortValue; i++) {
    //     toPortData[i] = $("input[name='toport']")[i].value;
    //     console.log("toPortData" + [i] + " : ", toPortData[i]);
    // }
    // for (var i = 0; i < ipprotocolValue; i++) {
    //     ipprotocolData[i] = $("select[name='ipprotocol']")[i].value;
    //     console.log("ipprotocolData" + [i] + " : ", ipprotocolData[i]);
    // }
    // var firstDirectionValue = $("select[name='direction']")[0].value;
    // for (var i = 0; i < directionValue; i++) {
    //     directionData[i] = $("select[name='direction']")[i].value;
    //     console.log("directionData" + [i] + " : ", directionData[i]);
    //     if (firstDirectionValue != directionData[i]) {
    //         isSameDirection = false;
    //     }
    // }

    // var firstCidrValue = $("input[name='cidr']")[0].value;
    // for (var i = 0; i < cidrValue; i++) {
    //     cidrData[i] = $("input[name='cidr']")[i].value;
    //     console.log("firstCidrValue : " + firstCidrValue + " : ", cidrData[i]);
    //     if (firstCidrValue != cidrData[i]) {
    //         isSameCidr = false;
    //     }
    // }

    // if (providerId == "GCP") {
    //     if (isSameDirection == false) {
    //       mcpjs["util/util"].commonAlert("GCP allows only one direction");
    //         return;
    //     }
    //     if (isSameCidr == false) {
    //       mcpjs["util/util"].commonAlert("GCP CIDR Blocks must all be same");
    //         return;
    //     }

    //     var cidrSize = $("input[name='cidr']").length;
    //     if (cidrSize == 1) {
    //         var cidrValue = $("input[name='cidr']")[0].value;
    //         if (!cidrValue) {
    //           mcpjs["util/util"].commonAlert("GCP requires CIDR Block");
    //             return;
    //         }
    //     } else {
    //         for (var i = 0; i < cidrValue; i++) {
    //             cidrData[i] = $("input[name='cidr']")[i].value;
    //             console.log("cidrData" + [i] + " : ", cidrData[i]);
    //             if (!cidrData[i]) {
    //               mcpjs["util/util"].commonAlert("GCP requires CIDR Block");
    //                 return;
    //             }
    //         }
    //     }

    // }

    // fwrsJsonList = new Array();

    // for (var i = 0; i < fromPortValue; i++) {
    //     var RSData = "RSData" + i;
    //     var RSData = new Object();
    //     RSData.ipProtocol = ipprotocolData[i];
    //     RSData.direction = directionData[i];
    //     RSData.fromPort = fromPortData[i];        
    //     RSData.toPort = toPortData[i];
    //     RSData.cidr = cidrData[i];

    //     fwrsJsonList.push(RSData);
    // }

    // var inbound = "";
    // var outbound = "";
    // for (var i in fwrsJsonList) {
    //     console.log(fwrsJsonList[i]);
    //     if (fwrsJsonList[i].direction == "inbound") {
    //         inbound += fwrsJsonList[i].ipProtocol
    //             + ' ' + fwrsJsonList[i].fromPort + '~' + fwrsJsonList[i].toPort + ' '
    //     } else if (fwrsJsonList[i].direction == "outbound") {
    //         outbound += fwrsJsonList[i].ipProtocol
    //             + ' ' + fwrsJsonList[i].fromPort + '~' + fwrsJsonList[i].toPort + ' '
    //     }
    // }
    // console.log("ininin : ", inbound);
    // console.log("outoutout : ", outbound);

    // $("#regInbound").empty();
    // $("#regOutbound").empty();
    // $("#regInbound").append(inbound);
    // $("#regOutbound").append(outbound);

    //$("#firewallRegisterBox").modal("hide");
}


// data를 넘겨받아 table에 set
// export function displayFirewallRulePop(caller, data){
//     try{
//         console.log("d")
//         console.log("displayFirewallRulePop ", data)
//         console.log("f")
//         //console.log("table ", table)
//         $("#firewallRegisterBox").modal("show");

//         // if (data.length == 0) {		
//         //     console.log("data length == 0")
//         // } else {
//         //     console.log("data length ", data.length)
//         //     console.log(table)
//         //     table.setData(data)
//         //     console.log("end of setData ")
//         //     console.log(table)
//         // }

//         setTimeout(function() {
//             console.log(" delay 1second")
//             // 딜레이 이후 실행될 코드
//             table.setData(data)
//         }, 1000);
//     }catch(e){
//         console.log(e)
//     }
// }

// 팝업 보여주고 Data 조회하여 Set.
export function displayFirewallRulePop(caller, data){
    return new Promise(function(resolve) {
        // 모달이 완전히 표시된 후에 parameter를 설정
        $('#firewallRegisterBox').on('shown.bs.modal', function() {          
            console.log("modal loading completed", data);
            table.setData(data)
            resolve(); // Promise가 완료됨을 알림
        });
    
        $('#firewallRegisterBox').modal('show');
        console.log("modal show");
      });
}