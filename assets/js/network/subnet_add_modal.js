$(function () {    

    // subnet popup addRow
    // $('button[name=addSubnet]').on('click', function (e) {
    //     console.log("add subnet clicked")
    //     var subnetNameValue = $("input[name='reg_subnetName']").length;
    //     var trHtml = $("tr[name=tr_Input]:last");
    //     trHtml.after(addStaffText);
    // });

    // $('button[name=delSubnet]').on('click', function (e) {
    //     console.log("del subnet clicked")
    //     var trHtml = $(this).parent().parent();
    //     trHtml.remove();
    // });
});

//var subnetJsonList = "";//저장시 subnet목록을 담을 array 
var addStaffText = '<tr name="tr_Input">'
    + '<td class="btn_mtd column-40percent" data-th="subnet Name"><input type="text" id="regSubnetName" name="reg_subnetName" value="" placeholder="" class="pline" title="" /> <span class="ov up" name="td_ov"]></span></td>'
    + '<td class="overlay" data-th="cidrBlock"><input type="text" id="regSubnetCidrBlock" name="reg_subnetCidrBlock" value="" placeholder="" class="pline" title="" /></td>'
    + '<td class="overlay column-100px">'
    + '<button class="btn btn_add" name="addSubnet" value="">add</button>'
    + '<button class="btn btn_del" name="delSubnet" value="">del</button>'
    + '</td>'
    + '</tr>';

// 동적으로 추가된 element의 event는 document.on 으로 정의한다.
$(document).on("click", "button[name=addSubnet]", function () {
    console.log("add subnet clicked")
    var subnetNameValue = $("input[name='reg_subnetName']").length;
    var trHtml = $("tr[name=tr_Input]:last");
    trHtml.after(addStaffText);
});
$(document).on("click", "button[name=delSubnet]", function () {
    console.log("del subnet clicked")
    var trHtml = $(this).parent().parent();
    trHtml.remove();
});

// 팝업의 subnet을 set
export var subnetJsonList = new Array();//subnet 저장할 array. 전역으로 선언
export function applySubnet() {
    var subnetNameValue = $("input[name='reg_subnetName']").length;
    var subnetCIDRBlockValue = $("input[name='reg_subnetCidrBlock']").length;

    var subnetNameData = new Array(subnetNameValue);
    var subnetCIDRBlockData = new Array(subnetCIDRBlockValue);

    for (var i = 0; i < subnetNameValue; i++) {
        subnetNameData[i] = $("input[name='reg_subnetName']")[i].value;
        console.log("subnetNameData" + [i] + " : ", subnetNameData[i]);
    }
    for (var i = 0; i < subnetCIDRBlockValue; i++) {
        subnetCIDRBlockData[i] = $("input[name='reg_subnetCidrBlock']")[i].value;
        console.log("subnetCIDRBlockData" + [i] + " : ", subnetCIDRBlockData[i]);
    }

    for (var i = 0; i < subnetNameValue; i++) {
        var SNData = "SNData" + i;
        var SNData = new Object();
        SNData.name = subnetNameData[i];
        SNData.ipv4_CIDR = subnetCIDRBlockData[i];
        subnetJsonList.push(SNData);
    }

    var infoshow = "";
    for (var i in subnetJsonList) {
        infoshow += subnetJsonList[i].name + " (" + subnetJsonList[i].ipv4_CIDR + ") ";
    }
    $("#regSubnet").empty();
    $("#regSubnet").val(infoshow);
    $("#btn_subnet_edit").trigger("click");
}