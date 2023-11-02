var table
var checked_array = []
$(function () {

    // table 초기 세팅	
    initTable();

    //mcpjs["util/pathfinder"].getCommonMcksList("mcks", "")
    // mcis 상태 조회
    var optionParamMap = new Map();
    optionParamMap.set("option", "status");
    mcpjs["util/pathfinder"].getCommonData(
        "mcismng",
        "McksList",
        optionParamMap,
        mcpjs["mcksmng/mcksmng"].getMcksListCallbackSuccess
    );
});

// table 설정
function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"Status", field:"status.phase", formatter: statusFormatter, vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, maxWidth: 100},
        {title:"System Label", field:"systemLabel", visible: false},
        {title:"Name", field:"name", vertAlign: "middle"},
        // {title: "Provider", field:"provider", formatter: providerFormatter, vertAlign: "middle", headerSort:false},
        {title: "Total Infra", field:"total", formatter: countFormater, formatterParams: {total: "total"}, vertAlign: "middle", hozAlign: "center", maxWidth: 150},
        {title: "Control Plane", field:"controlplane", formatter: countFormater, formatterParams: {control: "control-plane"}, vertAlign: "middle", hozAlign: "center", headerHozAlign: "center"},
        {title: "Worker", field:"worker", formatter: countFormater, formatterParams: {worker: "worker"}, vertAlign: "middle", hozAlign: "center", headerHozAlign: "center"},
        {title: "NetworkCni", field:"networkCni", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
        {title: "CpLeader", field:"cpLeader", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false},
        {title: "Connection", field:"mcis", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false}
    ]
    
    table = mcpjs["util/util"].setTabulator("mcksList", tableObjParams, columns)
    
    table.on("rowClick", function(e, row){
        //clickListOfMcks(row.getData())
        clickListOfMcks(row)
    });

    table.on("rowSelectionChanged", function(data, rows){
       console.log("data", data);
       console.log("rows", rows);
    });

    mcpjs['util/util'].displayColumn(table)
}

// TODO : 공통으로 뺄 것. table obj를 같이 넘기도록
export function setTableFilter(keyword) {
    var field = $("#mcksList_field").val()
    table.setFilter(field, "like", keyword)
}

// TODO : 공통으로 뺄 것. table obj, filter obj를 같이 넘기도록
export function clearTableFilter() {
    $("#mcksList_filter_keyword").val("")
    table.clearFilter()
}

// TODO : formater 이름을 바꾸거나 공통으로 빼거나
function statusFormatter(cell) {
    //var mcksStatusCell = '<img title="' + cell.getData().status.phase + '" src="/assets/images/contents/icon_running.png" class="icon" alt="">'
    var mcksStatusCell = cell.getData().status.phase
  
    return mcksStatusCell
  }

// TODO : formater 이름을 바꾸거나 공통으로 빼거나
function countFormater(cell, param) {
    var value =""
    var nodes = cell.getData().nodes
    if (param.hasOwnProperty("total")) {
        value = nodes.length
    } else {
        var count = 0
        var role = "control-plane"
        if (param.hasOwnProperty("worker")) {
            role = "worker"
        }
        nodes.map(node => {
            if(node.role == role) {
                count++
            }
        })

        value = count
    }

    return '<span>' + value + '</span>'
    
}

// TODO : formater 이름을 바꾸거나 공통으로 빼거나
function providerFormatter(cell) {
  var vmCloudConnectionMap = mcpjs['util/util'].calculateConnectionCount(cell.getData().vm);
  var mcisProviderCell = ""
  vmCloudConnectionMap.forEach((value, key) => {
      mcisProviderCell += '<img class="provider_icon" src="/assets/images/contents/img_logo_' + key + '.png" alt="' + key + '"/>'
  })

  return mcisProviderCell
}


export function mcksTotalListExport() {
    var namespace = $("#topboxDefaultNameSpaceName").text()
    table.download("csv", namespace.toUpperCase() + "-MCKS.csv", {delimiter:","})
}

export function clickListOfMcks(row) {
    console.log("click view mcks data :", row)
    $(".detail_box").addClass("view");

    // List Of MCKS에서 선택한 row 외에는 안보이게
    $("[id^='server_info_tr_']").each(function () {
        var item = $(this).attr("item").split("|")
        console.log(item)
        if (id == item[0]) {
            $(this).addClass("on")
        } else {
            $(this).removeClass("on")
        }
    })

    // MCKS Info area set
    showServerListAndStatusArea(row);
}




// MCKS Info area 안의 Node List 내용 표시
// 해당 MCKS의 모든 Node 표시
// TODO : 클릭했을 때 서버에서 조회하는것으로 변경할 것.
function showServerListAndStatusArea(row) {
    var rowData = row.getData();
    //console.log("rowData", rowData)
    //console.log("row ", row)
    //console.log("getcell ", row.getCell("name"));
    //console.log("getcell value ", row.getCell("name").getValue());
    //var mcisId = row.getCell("mcis").getValue()
    //var mcksName = row.getCell("name").getValue();
    //console.log("mcksName ", mcksName);
    //var mcksStatus = "";//statusFormatter(row.getCell());
    //console.log("getcell clusterConfig ", row.getCell("clusterConfig").getValue());
    //var mcksConfig = row.getCell("clusterConfig").getValue()
    //console.log("getcell nodes ", row.getCell("nodes").getValue());
    //var nodeTotalCountOfMcks = row.getCell("nodes").getValue()

    //console.log("mcksConfig ", rowData.clusterConfig)
    //console.log("nodes ", rowData.nodes)
    //console.log("nodes ", rowData.nodes.length)
    var mcksName = rowData.name;
    var mcksStatus = statusFormatter(row.getCell("status.phase"));
    //console.log("mcksStatus ", mcksStatus)
    var nodeTotalCountOfMcks = rowData.nodes.length;

    // var mcksName = data.name;
    // var mcksStatus = data.status.phase;
    // var mcksConfig = data.clusterConfig;
    // var nodeTotalCountOfMcks = data.nodes.length;

    $(".detail_box").addClass("view")
    $("#mcks_info_txt").text("[ " + mcksName + " ]");
    $("#mcks_server_info_status").empty();
    $("#mcks_server_info_status").append('<strong>Node List </strong>  <span class="stxt">[ ' + mcksName + ' ]</span>  Node(' + nodeTotalCountOfMcks + ')')

    //
    $("#mcks_info_name").val(mcksName)
    $("#mcks_info_Status").val(mcksStatus)
    //$("#mcks_info_cloud_connection").val(mcksConfig)

    $("#mcks_name").val(mcksName)

    var mcksNodes = "";
    var mcksStatusIcon = "";
    rowData.nodes.map(function (node) {
            //console.log("node ", node)
            var nodeName = node.name
            //console.log("nodeName ", nodeName)
            //nodeStatusIcon ="bgbox_g"
            var nodeStatusIcon = "bgbox_b"
            // node 목록 표시
            mcksNodes += '<li class="sel_cr ' + nodeStatusIcon + '"><a href="javascript:void(0);" onclick="mcpjs[\'mcksmng\/mcksmng\'].nodeDetailInfo(\'' + mcksName + '\',\'' + nodeName +'\')"><span class="txt">' + nodeName + '</span></a></li>';
        
    });
    $("#mcks_server_info_box").empty();
    $("#mcks_server_info_box").append(mcksNodes);


    //Manage MCKS Server List on/off : table을 클릭하면 해당 Row 에 active style로 보여주기
    $(".dashboard .ds_cont .area_cont .listbox li.sel_cr").each(function () {
        var $sel_list = $(this);
        var $detail = $(".server_info");
        console.log($sel_list);
        console.log($detail);
        console.log(">>>>>");
        $sel_list.off("click").click(function () {
            $sel_list.addClass("active");
            $sel_list.siblings().removeClass("active");
            $detail.addClass("active");
            $detail.siblings().removeClass("active");
            $sel_list.off("click").click(function () {
                if ($(this).hasClass("active")) {
                    $sel_list.removeClass("active");
                    $detail.removeClass("active");
                } else {
                    $sel_list.addClass("active");
                    $sel_list.siblings().removeClass("active");
                    $detail.addClass("active");
                    $detail.siblings().removeClass("active");
                }
            });
        });
    });
}

// 해당 mcks에 node 추가
// mcks가 경로에 들어가야 함. node 등록 form으로 이동
export function addNewNode() {
    //var clusterId = $("#mcks_uid").val(); // mcks id 값이 없음
    var clusterName = checked_array[0].name;

    if (clusterId == "") {
      mcpjs["util/util"].commonAlert("MCKS 정보가 올바르지 않습니다.");
        return;
    }
    var url = "/operations/mcksmng/name/" + clusterName + "/node/regform";
    location.href = url;
}

// MCKS 삭제
export function deleteMCKS() {
    var mcksName = "";
    var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

    if (checked_array.length == 0) {
      mcpjs["util/util"].commonAlert("Please Select MCKS!!")
        return;
    } else if (checked_array.length > 1) {
      mcpjs["util/util"].commonAlert("Please Select One MCKS at a time")
        return;
    }

    mcksName = checked_array[0].name

    // TODO : 삭제 호출부분 function으로 뺼까?
    //var url = "/ns/{namespace}/clusters/{cluster}"
    var url = "/operations/mcksmng/name/" + mcksName;
    client.delete(url, {
        headers: {
           
            'Content-Type': "application/json",
            'x-csrf-token': csrfToken
        }
    })
        .then(result => {
            console.log("get  Data : ", result.data);
            //StatusInfo.code
            //StatusInfo.kind
            //StatusInfo.message
            var statusCode = result.data.status;
            var message = result.data.message;

            if (statusCode != 200 && statusCode != 201) {
              mcpjs["util/util"].commonAlert(message + "(" + statusCode + ")");
                return;
            } else {
              mcpjs["util/util"].commonAlert(message);
                // TODO : MCKS List 조회
                //location.reload();
            }

        }).catch((error) => {
            console.warn(error);
            console.log(error.response)
            var errorMessage = error.response.data.error;
            var statusCode = error.response.status;
           mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
        });

}

// MCKS의 NODE 삭제
export function deleteNodeOfMcks() {
    // worker만 삭제
    // 1개씩 삭제

    var selectedMcksUid = $("#mcks_uid").val();
    var selectedMcksName = $("#mcks_name").val();
    var selectedNodeUid = $("#node_uid").val();
    var selectedNodeName = $("#node_name").val();
    var selectedNodeRole = $("#mcks_node_role").val();

    if (selectedNodeRole.toLowerCase() != "worker") {
      mcpjs["util/util"].commonAlert("Only worker node can be deleted")
        return;
    }
    
    var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    var orgUrl = "/operations/mcksmng/name/:mcksName/node/:nodeName";
    var urlParamMap = new Map();
    //urlParamMap.set(":clusteruID", selectedMcksUid)
    urlParamMap.set(":mcksName", selectedMcksName)
    //urlParamMap.set(":nodeID", selectedNodeUid)
    urlParamMap.set(":nodeName", selectedNodeName)
    var url = mcpjs['util/pathfinder'].setUrlByParam(orgUrl, urlParamMap)
    console.log("URL : ", url)
    client.delete(url, {        
        headers: {            
            'Content-Type': "application/json",
            "x-csrf-token": csrfToken
        }
    }).then(result => {
        // var data = result.data;
        // if (result.status == 200 || result.status == 201) {
        var statusCode = result.data.status;
        if (statusCode == 200 || statusCode == 201) {
          mcpjs["util/util"].commonAlert("Success Delete Node.");

        } else {
            var message = result.data.message;
          mcpjs["util/util"].commonAlert("Fail Delete Node : " + message + "(" + statusCode + ")");

        }
    }).catch((error) => {
        console.warn(error);
        console.log(error.response)
        var errorMessage = error.response.data.error;
        var statusCode = error.response.status;
       mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    });
}

// 선택한 Node의 상세정보 표시. TODO : Node 정보 조회하여 보여지도록 변경할 것.
export function nodeDetailInfo(mcksName, nodeName) {
    console.log(mcksName + ", " + nodeName)

    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        return;
    }

    //var mcksName = "";
    //var nodeName = "";
    var nodeKind = "";
    var nodeRole = "";
    var mcksStatus = "";
    selectedRows.forEach(function (row) {
        console.log("row ", row)
        //mcksName = row.name;
        //mcksStatus = statusFormatter(row.getCell("status.phase"));
        var rowData = row.getData();
        //mcksName = rowData.name;
        console.log(rowData)
        var nodes = rowData.nodes;
        console.log(nodes)
        nodes.forEach(function (node) {
            console.log(node)
            if( nodeName == node.name ){
                nodeName = node.name;
                nodeKind = node.kind;
                nodeRole = node.role;
                return;
            }
        });
    });

    
    //var mcksName = rowData.name;
    //var mcksStatus = statusFormatter(row.getCell("status.phase"));
    //console.log("mcksStatus ", mcksStatus)
    

//export function nodeDetailInfo(mcksIndex, nodeIndex) {
    // var nodeUID = $("#mcksNodeUID_" + mcksIndex + "_" + nodeIndex).val();
    // var nodeName = $("#mcksNodeName_" + mcksIndex + "_" + nodeIndex).val();
    // var nodeKind = $("#mcksNodeKind_" + mcksIndex + "_" + nodeIndex).val();
    // var nodeRole = $("#mcksNodeRole_" + mcksIndex + "_" + nodeIndex).val();

    // hidden 값 setting. 삭제 등에서 사용
    //$("#node_uid").val(nodeUID);
    $("#node_name").val(nodeName);

    $("#mcks_node_txt").text(nodeName);

    $("#mcks_node_name").val(nodeName);
    $("#mcks_node_kind").val(nodeKind);
    $("#mcks_node_role").val(nodeRole);

    $("#mcks_node_detail").css("display", "block");

}

export function getMcksListCallbackSuccess(caller, result){
//export function getMcksListCallbackSuccess(caller, data){
    var data = result.data.McksList;
	// displayMcksListTable(data)
    table.setData(data)
}

// deprecated
function displayMcksListTable(totalMcksListObj) {


    if (!mcpjs['util/util'].isEmpty(totalMcksListObj) && totalMcksListObj.length > 0) {

        var addMcks = "";
        for (var mcksIndex in totalMcksListObj) {
            var aMcks = totalMcksListObj[mcksIndex]
            if (aMcks.name != "") {
                addMcks += setMcksListTableRow(aMcks, mcksIndex);
            }
        }// end of mcis loop
        $("#mcksList").empty();
        $("#mcksList").append(addMcks);

    } else {
        var addMcks = "";
        addMcks += '<tr>'
        addMcks += '<td class="overlay hidden" data-th="" colspan="8">No Data</td>'
        addMcks += '</tr>'
        $("#mcksList").empty();
        $("#mcksList").append(addMcks);
    }
}

// deprecated
function setMcksListTableRow(mcksData, mcksIndex) {
    var mcksTableRow = "";
    var nodesInfo = ""
    var controlCount = 0
    var workerCount = 0
    var totalNodeCount = 0

    mcksData.nodes.map((node, index) => {
        if (node.role === "control-plane") {
            controlCount++
        } else if (node.role === "worker") {
            workerCount++
        } else {
            console.log("role is invalid: ", node.role);
        }

        nodesInfo += "<input type='hidden' name='nodeName' id='mcksNodeName_" + mcksIndex + "_" + index +"' value='" + node.name + "' />"
        nodesInfo += "<input type='hidden' name='nodeKind' id='mcksNodeKind_" + mcksIndex + "_" + index +"' value='" + node.kind + "' />"
        nodesInfo += "<input type='hidden' name='nodeRole' id='mcksNodeRole_" + mcksIndex + "_" + index +"' value='" + node.role + "' />"
    })

    totalNodeCount = controlCount + workerCount

    try {
            mcksTableRow += `<tr onclick="mcpjs['mcksmng/mcksmng'].clickListOfMcks('`+ mcksData.name + "'," + mcksIndex + `)" id='node_info_tr_" + mcksIndex + "' item='" + mcksData + "'|'" + mcksIndex + "'>`
			mcksTableRow +=	"<td class='overlay hidden column-80px' data-th='Status'>"
			mcksTableRow +=	"<img src='/assets/images/contents/icon_running.png' class='icon' alt='' />"+ mcksData.status.phase +"<span class='ov off'></span>"
			mcksTableRow +=	"</td>"
			mcksTableRow +=	"<td class='btn_mtd ovm' data-th='Name'>" + mcksData.name + "<span class='ov'></span></td>"
            mcksTableRow +=	"<td class='btn_mtd ovm' data-th='TotalNodeCount'>"+ totalNodeCount
            mcksTableRow +=	"<span class='ov'></span>"
            mcksTableRow +=	"</td>"
            mcksTableRow +=	"<td class='btn_mtd ovm' data-th='TotalInfra'> control-plane ( " + controlCount + " ) <br/> worker ( " + workerCount + " )"
            mcksTableRow +=	"<span class='ov'></span>"
            mcksTableRow +=	"</td>"
			mcksTableRow +=	"<td class='btn_mtd ovm' data-th='NetworkCni'>" + mcksData.networkCni + "<span class='ov'></span></td>"
            mcksTableRow +=	"<td class='btn_mtd ovm' data-th='CpLeader'>" + mcksData.cpLeader + "<span class='ov'></span>"
			mcksTableRow +=	"</td>"
			mcksTableRow +=	"<td class='overlay hidden' data-th='Cloud Connection'>MCIS : " + mcksData.mcis
            mcksTableRow +=	"</td>"
            mcksTableRow +=	"<td class='overlay hidden column-50px' data-th=''>"
			mcksTableRow +=	"<input type='checkbox' name='chk' value='" + mcksIndex + "' id='td_ch_" + mcksIndex + "' title='' />"
			mcksTableRow +=	"<label for='td_ch_" + mcksIndex + "'></label>"
            mcksTableRow +=	"<input type='hidden' name='mcksID' value='" + mcksData.name + "'id='mcksID" + mcksIndex + "' />"
			mcksTableRow +=	"<input type='hidden' name='mcksName' value='" + mcksData.name + "' id='mcksName" + mcksIndex + "' />"
			mcksTableRow +=	"<input type='hidden' name='mcksStatus' value='" + mcksData.status.phase + "' id='mcksStatus" + mcksIndex + "' />"
			mcksTableRow += "<input type='hidden' name='mcksConfig' value='" + mcksData.clusterConfig + "' id='mcksConfig" + mcksIndex + "' />"
            mcksTableRow += "<input type='hidden' name='mcksNodeTotalCount' value=" + totalNodeCount + " id='mcksNodeTotalCount" + mcksIndex + "' />"
			mcksTableRow +=	"</td>"
            mcksTableRow += nodesInfo
            mcksTableRow +=	"</tr>"
            

    } catch (e) {
        console.log("list of mcks error")
        mcksTableRow = '<tr>'
        mcksTableRow += '<td class="overlay hidden" data-th="" colspan="8">No Data</td>'
        mcksTableRow += '</tr>'
    }
    return mcksTableRow;
}