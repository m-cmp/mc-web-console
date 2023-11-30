import { Modal } from "bootstrap";
var table;
$(function () {
//$(document).ready(function () {

    initTable();

    getAllNlbList()    
});

// Table 초기값 설정
function initTable() {
    var tableObjParams = {};

    var columns = [
        { formatter: "rowSelection", titleFormatter: "rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort: false, width: 60,},      
        { title: "Id", field: "id", visible: false },
        { title: "McisId", field: "mcisId", visible: false },
        { title: "System Label", field: "systemLabel", visible: false },
        { title: "Name", field: "name", vertAlign: "middle" },
        { title: "Provider", field: "location.cloudType", formatter: providerFormatter, vertAlign: "middle", headerSort: false, },
        { title: "Mcis", field: "mcisName", vertAlign: "middle" },
        { title: "Scope", field: "scope", vertAlign: "middle" },
        { title: "Type", field: "type", vertAlign: "middle" },
        { title: "Protocol", field: "listener.protocol", vertAlign: "middle" },
        { title: "Port", field: "item.listener.port", vertAlign: "middle" },
        { title: "Destination", field: "targetGroup.protocol", vertAlign: "middle" },
        { title: "Port", field: "targetGroup.port", vertAlign: "middle" },
        { title: "Target", field: "targetGroup.subGroupId", vertAlign: "middle" },
        //{ title: "Total Servers", field: "statusCount.countTotal", vertAlign: "middle", hozAlign: "center", maxWidth: 150,},      


    ];

    table = mcpjs["util/util"].setTabulator("nlbList", tableObjParams, columns);

    table.on("rowClick", function (e, row) {      
        showNlbInfo(row.getCell("mcisId").getValue(), row.getCell("id").getValue());
    });

    // table.on("rowSelectionChanged", function (data, rows) {      
    // });

    mcpjs["util/util"].displayColumn(table);    
}

// provider를 table에서 표시하기 위해 감싸기
function providerFormatter(cell) {
    console.log("providerFormatter", cell)
    // var vmCloudConnectionMap = mcpjs["util/util"].calculateConnectionCount(
    //   cell.getData().vm
    // );
    // var mcisProviderCell = "";
    // vmCloudConnectionMap.forEach((value, key) => {
    //   mcisProviderCell +=
    //     '<img class="provider_icon" src="/assets/images/contents/img_logo_' +
    //     key +
    //     '.png" alt="' +
    //     key +
    //     '"/>';
    // });
  
    // return mcisProviderCell;
  }

// area 표시
export function displayNlbInfo(targetAction) {
    if (targetAction == "REG") {
        $("#nlbCreateBox").toggleClass("active");
        $("#nlbInfoBox").removeClass("view");
        $("#nlbListTable").removeClass("on");
        var offset = $("#nlbCreateBox").offset();

        // form 초기화
        $("#regCspSshKeyName").val("");
        mcpjs['util/common'].goFocus("nlbCreateBox");
    } else if (targetAction == "REG_SUCCESS") {
        $("#nlbCreateBox").removeClass("active");
        $("#nlbInfoBox").removeClass("view");
        $("#nlbListTable").addClass("on");

        // form 초기화
        $("#regCspSshKeyName").val("");
        $("#regProvider").val("");
        $("#regCregConnectionNameidrBlock").val("");

        getAllNlbList();
    } else if (targetAction == "DEL") {
        $("#nlbCreateBox").removeClass("active");
        $("#nlbInfoBox").addClass("view");
        $("#nlbListTable").removeClass("on");

    } else if (targetAction == "DEL_SUCCESS") {
        $("#nlbCreateBox").removeClass("active");
        $("#nlbInfoBox").removeClass("view");
        $("#nlbListTable").addClass("on");

        getAllNlbList();
    } else if (targetAction == "CLOSE") {
        $("#nlbCreateBox").removeClass("active");
        $("#nlbInfoBox").removeClass("view");
        $("#nlbListTable").addClass("on");
    }
}

// region 변경시 vpc 목록을 가져온다.
export function changeNlbRegion(caller, providerObjId, regionObjId){   
    
    var providerId = $("#" + providerObjId + "  option:selected" ).val();
    var regionName = $("#" + regionObjId + "  option:selected" ).val();
    
    if( providerId == "")return;
    if( regionName == "")return;    

    var actionName=""
    var optionParam = ""
    // var urlParamMap = new Map();    
    // var filterKeyValMap =  new Map();

    // // filterKeyValMap.set("filterKey","vNet")
    // // filterKeyValMap.set("filterValue",vpcId)

    // var mconParamMap = new Map();   
    // mconParamMap.set("is_cb", "N")
    // mconParamMap.set("providerId", providerId)
    // mconParamMap.set("regionName", regionName)

    // // VPC는 ID만 조회
    // actionName="VpcListByProviderRegionZone"
    // optionParam = ""
    // var html = "<option>select Subnet</option>";
    // $("#regSubnetId").empty()
    // $("#regSubnetId").append(html)
    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, getVPCListCallbackSuccess, getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    var caller = "nlbmng";
    var actionName="VpcListByRegion";
    var optionParamMap = new Map();    
    optionParamMap.set("is_cb", "N")
    optionParamMap.set("providerId", providerId)
    optionParamMap.set("regionName", regionName)
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['nlb/nlbmng'].getVPCListCallbackSuccess);

    console.log("selectRegion")
}

export function getVPCListCallbackSuccess(caller, result){
    console.log("getcpnListCallBackSuccess : ",result)

        var html = ""
        var data = result.data.VNetList;
        
        console.log(data)
        
        html += '<option selected>Select VPC</option>';
        for (var i in data) {
            //html += '<option value="' + data[i] + '" item="' + data[i] + '">' + data[i] + '</option>';
            html += '<option value="' + data[i].id + '" item="' + data[i].id + '">' + data[i].name + '</option>';
            mcpjs['util/util'].VPC_MAP.set(data[i].id, data[i])
        }        
        $("#regVNetId").empty()
        $("#regVNetId").append(html)
}

// 해당 namespace의 모든 nlb목록을 가져온다.
function getAllNlbList(){
    var caller = "nlbmng";
    var actionName="AllNlbListOfNamespace";
    var optionParamMap = new Map();    
    //optionParamMap.set("is_cb", "N")
    //optionParamMap.set("providerId", providerId)
    //optionParamMap.set("regionName", regionName)
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['nlb/nlbmng'].getNlbListCallbackSuccess);

    // var url = "/operations/service/nlb";
    // axios
    //     .get(url, {
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //     })
    //     .then((result) => {
    //         console.log("get Nlb Data : ", result.data);
    //         var data = result.data.NlbList; // exception case : if null
    //         var html = "";

    //         if (data.length) {
    //             data.filter((list) => list.name !== "").map((item, index) => (
    //                 html += addNlbListTableRow(item, index))
    //             );                
    //             $("#nlbList").empty();
    //             $("#nlbList").append(html);
    //             ModalDetail();
    //         } else {
    //             html += nodataTableRow(8);
    //             $("#nlbList").empty();
    //             $("#nlbList").append(html);
    //         }            
    //     })
    //     .catch((error) => {
    //         console.warn(error);
    //         console.log(error.response);
    //         var errorMessage = error.response.data.error;
    //         var statusCode = error.response.status;
    //         mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    //     });
}

export function getNlbListCallbackSuccess(caller, result){
    var data = result.data.NlbList;
    table.setData(data);
}

// nodata일 때 row 표시 : colspanCount를 받아 col을 합친다.
// deprecated
// function nodataTableRow(colspanCount){
//     var html = "";
//     html += "<tr>";
//     html += '<td class="overlay hidden" data-th="" colspan="' + colspanCount + '">No Data</td>';
//     html += "</tr>";
//     return html
// }

// list의 1개 row에 대한 html 
// deprecated
// function addNlbListTableRow(item, index) {
//     var html = "";
//     html +=
//         "<tr onclick=\"mcpjs['nlb/nlbmng'].showNlbInfo('" + item.mcisId + "', '"+ item.id + "');\">" 
//         + '<td class="overlay hidden column-50px" data-th="">' 
//         + '<input type="hidden" id="nlb_info_' + index + '" value="' + item.mcisId + "|" + item.name + "|" + item.connectionName + '"/>'
//         + '<input type="checkbox" name="vmchk" value="' + item.mcisId + "|" + item.name + '" id="raw_' + index + '" title="" /><label for="td_ch1"></label> <span class="ov off"></span></td>' 
//         + '<td class="btn_mtd ovm" data-th="provider">' + item.location.cloudType + "</td>" 
//         + '<td class="btn_mtd ovm" data-th="mcis">' + item.mcisId + "</td>" 
//         + '<td class="overlay hidden" data-th="nlbName">' + item.name + "</td>" 
//         + '<td class="overlay hidden" data-th="scope">' + item.scope + "</td>" 
//         + '<td class="overlay hidden" data-th="type">' +  item.type  + "</td>"         
//         //+ '<td class="overlay hidden column-80px" data-th="health">' + item.status + "</td>" 
//         + '<td class="overlay hidden" data-th="listenerInfo">' + item.listener.protocol + " | " + item.listener.port + "</td>" 
//         + '<td class="overlay hidden" data-th="listenerInfo">' + item.targetGroup.protocol + " | " + item.targetGroup.port +"</td>" 
//         + '<td class="overlay hidden" data-th="listenerInfo">' + item.targetGroup.subGroupId + "</td>" 
//         +"</tr>"
        
//     return html
// }

// mcis의 nlb 목록 조회
function getNLBList(mcisId) {
    var caller = "nlbmng";
    var actionName="NlbList";
    var optionParamMap = new Map();    
    optionParamMap.set("{mcisId}", mcisId)
    //optionParamMap.set("option", "id");// id만 가져오는 경우 
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['nlb/nlbmng'].getNlbListCallbackSuccess);

    // console.log("mcisID : ", mcisId);
    // var url = "/operations/service/mcis/" + mcisId + "/nlb/list";
    // axios
    //     .get(url, {
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //     })
    //     .then((result) => {
    //         console.log("get Nlb Data : ", result.data);
    //         var data = result.data.NlbList; // exception case : if null
    //         var html = "";

    //         if (data.length) {
    //             data.filter((list) => list.name !== "").map((item, index) => (
    //                 html += addNlbListTableRow(item, index, mcisId))
    //             );
    //             $("#nlbList").append(html);

    //             ModalDetail();
    //         } else {
    //             html += nodataTableRow(8);
    //             $("#nlbList").empty();
    //             $("#nlbList").append(html);
    //         }            
    //     })
    //     .catch((error) => {
    //         console.warn(error);
    //         console.log(error.response);
    //         var errorMessage = error.response.data.error;
    //         var statusCode = error.response.status;
    //         mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    //     });
}

export function deleteNlb() {
    console.log("deleteNlb!!!");

    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select NLB!!");
        return;
    }

    selectedRows.forEach(function (row) {
        var nlbId = row.getCell("id").getValue();
        var mcisId = row.getCell("mcisId").getValue();
        var caller = "nlbmng";
        var controllerKeyName="NlbDel";
        var optionParamMap = new Map();    
        optionParamMap.set("{nlbId}", nlbId)
        optionParamMap.set("{mcisId}", mcisId)
        var obj = {}    
        //mcpjs["util/pathfinder"].postCommonData(caller,controllerKeyName,optionParamMap, obj, mcpjs['nlb/nlbmng'].nlbDelCallbackSuccess)
        mcpjs["util/pathfinder"].deleteCommonData(caller,controllerKeyName,optionParamMap, obj)
    });    
    
    // var selValues = "";
    // var selMcisId = "";
    // var selNlbId = "";
    // var count = 0;


    // $("input[name='vmchk']:checked").each(function () {
    //     count++;
    //     selValues = selValues + $(this).val() + ",";
    // });
    // console.log("selValues : ", selValues)
    // selValues = selValues.substring(0, selValues.lastIndexOf(","));
    
    // var splitData = selValues.split("|");
    // selMcisId = selMcisId + splitData[0];
    // selNlbId = selNlbId + splitData[1];

    // console.log("selMcisId : ", selMcisId);
    // console.log("nlbId : ", selNlbId);
    // console.log("count : ", count);

    // if (selNlbId == "") {
    //     mcpjs["util/util"].commonAlert("삭제할 대상을 선택하세요.");
    //     return false;
    // }

    // if (count != 1) {
    //     mcpjs["util/util"].commonAlert("삭제할 대상을 하나만 선택하세요.");
    //     return false;
    // }
    // var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    // var url = "/operations/service/nlb/id/"+ selNlbId +  "/mcis/" + selMcisId;
    // axios
    //     .delete(url, {
    //         headers: {
    //             "Content-Type": "application/json",
    //             'x-csrf-token': csrfToken,
    //         },
    //     })
    //     .then((result) => {
    //         var data = result.data;
    //         console.log(data);
    //         if (result.status == 200 || result.status == 201) {
    //             mcpjs['util/util'].commonAlert(data.message);

    //             displayNlbInfo("DEL_SUCCESS");
    //         } else {
    //             mcpjs['util/util'].commonAlert(data.error);
    //         }
    //     })
    //     .catch((error) => {
    //         console.warn(error);
    //         console.log(error.response);
    //         var errorMessage = error.response.data.error;
    //         var statusCode = error.response.status;
    //         mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    //     });
}

export function showNlbInfo(mcisId, nlbId) {
    console.log("target showNlbInfo : ", mcisId);

    var caller = "nlbmng";
    var actionName="NlbGet";
    var optionParamMap = new Map();    
    optionParamMap.set("{nlbId}", nlbId)
    optionParamMap.set("{mcisId}", mcisId)
    //optionParamMap.set("option", "id");// id만 가져오는 경우 
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['nlb/nlbmng'].getNlbCallbackSuccess);

    // NlbGet

    // var url = "/operations/service/nlb/id/"+ nlbId+"/mcis/" + mcisId;
    // console.log("n1lb URL : ", url);

    // return axios
    //     .get(url, {
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //     })
    //     .then((result) => {
    //         var data = result.data.NlbInfo;
    //         console.log("result DT : ", data);
            
    //         var dtlNlbName = data.name;
    //         var dtlDescription = data.description;

    //         var dtlHcThreshold = data.healthChecker.threshold;
    //         var dtlHcInterval = data.healthChecker.interval;
    //         var dtlHcTimeout = data.healthChecker.timeout;

    //         var dtlListenerProtocol = data.listener.protocol;
    //         var dtlListenerPort = data.listener.port;

    //         var dtlProvider = data.location.cloudType;
    //         var dtlConnectionName = data.connectionName;
    //         //var dtlVNetId = data.keyValueList.keyValueList;

    //         var dtlTgVms = data.targetGroup.vms;
    //         var strVms = dtlTgVms.join();
    //         strVms = strVms.replaceAll(",", "\r\n");

    //         var dtlTgProtocol = data.targetGroup.protocol;
    //         var dtlTgPort = data.targetGroup.port;
    //         var dtlTgSubGroupId = data.targetGroup.subGroupId;
            
    //         $("#dtl_nlbName").empty();
    //         $("#dtl_description").empty();
    //         $("#dtl_hc_threshold").empty();
    //         $("#dtl_hc_interval").empty();
    //         $("#dtl_hc_timeout").empty();
    //         $("#dtl_ls_protocol").empty();
    //         $("#dtl_ls_port").empty();
    //         $("#dtl_provider").empty();
    //         $("#dtl_connectionName").empty();
    //         //$("#dtl_vNetId").empty();
    //         $("#dtl_tg_vms").empty();
    //         $("#dtl_tg_protocol").empty();
    //         $("#dtl_tg_port").empty();
    //         $("#dtl_tg_subGroupId").empty();

    //         $("#dtl_nlbName").val(dtlNlbName);
    //         $("#dtl_description").val(dtlDescription);
    //         $("#dtl_hc_threshold").val(dtlHcThreshold);
    //         $("#dtl_hc_interval").val(dtlHcInterval);
    //         $("#dtl_hc_timeout").val(dtlHcTimeout);
    //         $("#dtl_ls_protocol").val(dtlListenerProtocol);
    //         $("#dtl_ls_port").val(dtlListenerPort);
    //         $("#dtl_provider").val(dtlProvider);
    //         $("#dtl_connectionName").val(dtlConnectionName);
    //         //$("#dtl_vNetId").val(dtlVNetId);
    //         $("#dtl_tg_vms").val(strVms);
    //         $("#dtl_tg_protocol").val(dtlTgProtocol);
    //         $("#dtl_tg_port").val(dtlTgPort);
    //         $("#dtl_tg_subGroupId").val(dtlTgSubGroupId);

    //         $("#nlbInfoBox").toggle();
    //     })
    //     .catch((error) => {
    //         console.warn(error);
    //         console.log(error.response);
    //         var errorMessage = error.response.data.error;
    //         var statusCode = error.response.status;
    //         mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    //     });
}

export function getNlbCallbackSuccess(caller, result){
 
    var data = result.data.NlbInfo;
    console.log("result DT : ", data);
    
    var dtlNlbId = data.id;
    var dtlNlbName = data.name;
    var dtlDescription = data.description;

    var dtlHcThreshold = data.healthChecker.threshold;
    var dtlHcInterval = data.healthChecker.interval;
    var dtlHcTimeout = data.healthChecker.timeout;

    var dtlListenerProtocol = data.listener.protocol;
    var dtlListenerPort = data.listener.port;

    var dtlProvider = data.location.cloudType;
    var dtlConnectionName = data.connectionName;
    //var dtlVNetId = data.keyValueList.keyValueList;

    var dtlTgVms = data.targetGroup.vms;
    var strVms = dtlTgVms.join();
    strVms = strVms.replaceAll(",", "\r\n");

    var dtlTgProtocol = data.targetGroup.protocol;
    var dtlTgPort = data.targetGroup.port;
    var dtlTgSubGroupId = data.targetGroup.subGroupId;
    
    $("#dtl_nlbName").empty();
    $("#dtl_description").empty();
    $("#dtl_hc_threshold").empty();
    $("#dtl_hc_interval").empty();
    $("#dtl_hc_timeout").empty();
    $("#dtl_ls_protocol").empty();
    $("#dtl_ls_port").empty();
    $("#dtl_provider").empty();
    $("#dtl_connectionName").empty();
    //$("#dtl_vNetId").empty();
    $("#dtl_tg_vms").empty();
    $("#dtl_tg_protocol").empty();
    $("#dtl_tg_port").empty();
    $("#dtl_tg_subGroupId").empty();

    $("#dtl_nlbName").val(dtlNlbName);
    $("#dtl_description").val(dtlDescription);
    $("#dtl_hc_threshold").val(dtlHcThreshold);
    $("#dtl_hc_interval").val(dtlHcInterval);
    $("#dtl_hc_timeout").val(dtlHcTimeout);
    $("#dtl_ls_protocol").val(dtlListenerProtocol);
    $("#dtl_ls_port").val(dtlListenerPort);
    $("#dtl_provider").val(dtlProvider);
    $("#dtl_connectionName").val(dtlConnectionName);
    //$("#dtl_vNetId").val(dtlVNetId);
    $("#dtl_tg_vms").val(strVms);
    $("#dtl_tg_protocol").val(dtlTgProtocol);
    $("#dtl_tg_port").val(dtlTgPort);
    $("#dtl_tg_subGroupId").val(dtlTgSubGroupId);

    $(".stxt").html(dtlNlbId);

    //$("#nlbInfoBox").toggle();
    displayNlbInfo("DEL")
}



// updateNlb : TODO : update를 위한 form을 만들 것인가 ... 기존 detail에서 enable 시켜서 사용할 것인가
function updateNlb() {
    // 현재 nlb api에는 update 기능이 없음.
    // 단, vmgroup은 확장 가능한 것 같은데...
}

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
                    console.log("reg ok button click");
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

// MCIS 목록 조회 후 화면에 Set
export function getMcisListCallbackSuccess(caller, mcisList) {
    var totalMcisListObj = mcisList;
    console.log("caller:", caller);
    console.log("total mcis:", totalMcisListObj);

    if ((caller == "nlbOnload")) {
        $("#nlbList").empty();
        for (var i = 0; i < mcisList.length; i++) {
            mcisID = mcisList[i];
            getNLBList(mcisID);
        }
        // for문으로 getNLBList 가져오기, mcisList에 있는 mcis id만 추출해서 list 조회
    }
    //mcpjs['util/util'].AjaxLoadingShow(false);
}

export function getMcisListCallbackFail(caller, error) {
    // List table에 no data 표시? 또는 조회 오류를 표시?
    var addMcis = "";
    addMcis += "<tr>";
    addMcis += '<td class="overlay hidden" data-th="" colspan="8">No Data</td>';
    addMcis += "</tr>";
    $("#mcisList").empty();
    $("#mcisList").append(addMcis);
}
