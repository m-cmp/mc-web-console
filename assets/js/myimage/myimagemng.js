import "bootstrap";
import "jquery.scrollbar";
//import { MyImageListComp } from "../component/list";

var table;
$(function () {    
    
    initTable();

    getMyImageList("name");
});

function initTable() {
    var tableObjParams = {}
  
    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"Id", field:"id", visible: false},
        {title:"System Label", field:"systemLabel", visible: false},
        {title:"Connection", field:"connectionName", visible: false},
        {title:"Name", field:"name", vertAlign: "middle"},
        {title:"Source VM", field:"sourceVmId", vertAlign: "middle"},
        {title:"Status", field:"status", vertAlign: "middle", hozAlign: "center", headerSort:false},
    ]
    
    table = mcpjs["util/util"].setTabulator("myImageList", tableObjParams, columns)
    
    table.on("rowClick", function(e, row){
        getMyImageData(row.getCell("id").getValue(), 'info')
    });
  
    table.on("rowSelectionChanged", function(data, rows){
    });
  
    mcpjs['util/util'].displayColumn(table)    
  }

// 여러건 삭제
export function deleteMyImageList() {
    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a MyImage !!");
        return;
    }
    if (selectedRows.length > 1) {
        mcpjs["util/util"].commonAlert("한개만 삭제할 수 있습니다");
        return;
    }

    var selMyImageId = "";
    selectedRows.forEach(function (row) {
        selMyImageId = row.getCell("id").getValue();
    });

    var caller = "myimagemng";
    var controllerKeyName = "MyImageDel";
    var optionParamMap = new Map();
    optionParamMap.set("{myImageId}", selMyImageId);    
    var obj = {}
    mcpjs["util/pathfinder"].deleteCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs["myimage/myimagemng"].myImageDelCallbackSuccess );

    // var imageId = "";
    // var count = 0;
    // var chk_length = $("input[name='chk']:checked").length
    // if (chk_length > 1) {
    //     mcpjs["util/util"].commonAlert("한개만 삭제할 수 있습니다.")
    //     return;
    // } else if (chk_length == 1) {
    //     $("input[name='chk']:checked").each(function () {
    //         count++;
    //         imageId = $(this).val();
    //         console.log("image ID : ", imageId);
    //         var url = "/settings/resources/myimage/id/" + imageId;
    //         console.log("del myimageList url : ", url);
    //         client.delete(url, {
    //             headers: {
    //                 'Content-Type': "application/json"
    //             }
    //         }).then(result => {
    //             var data = result.data;
    //             console.log(result);
    //             console.log(data);
    //             if (result.status == 200 || result.status == 201) {
    //                 mcpjs["util/util"].commonAlert(data.message)
    //                 getMyImageList("name")
    //                 $("#myImageInfoBox").hide();

    //             } else {
    //                 mcpjs["util/util"].commonAlert(result.data.error)
    //             }
    //         }).catch((error) => {
    //             console.warn(error);
    //             console.log(error.response)
    //             var errorMessage = error.response.data.error;
    //             var statusCode = error.response.status;
    //             mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    //         });

    //     });
    // }
}

export function deleteMyImage() {
    var selectedRows = table.getSelectedRows();
    if (selectedRows.length == 0) {
        mcpjs["util/util"].commonAlert("Please Select a MyImage !!");
        return;
    }

    var selMyImageId = "";
    selectedRows.forEach(function (row) {
        selMyImageId = row.getCell("id").getValue();
    });

    var caller = "myimagemng";
    var controllerKeyName = "MyImageDel";
    var optionParamMap = new Map();
    optionParamMap.set("{myImageId}", selMyImageId);    
    var obj = {}
    mcpjs["util/pathfinder"].deleteCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs["myimage/myimagemng"].myImageDelCallbackSuccess );

    // var myImageId = $("#dtlMyImageName").val()
    // var url = "/settings/resources/myimage/id/" + myImageId
    // console.log("del dataDisk url : ", url);

    // client.delete(url, {
    //     headers: {
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     var data = result.data;
    //     console.log(result);
    //     console.log(data);
    //     if (result.status == 200 || result.status == 201) {
    //         mcpjs["util/util"].commonAlert(data.message)
    //         getMyImageList("name")
    //         $("#myImageInfoBox").hide();
    //     } else {
    //         mcpjs["util/util"].commonAlert(result.data.error)
    //     }
    // }).catch((error) => {
    //     console.warn(error);
    //     console.log(error.response)
    //     var errorMessage = error.response.data.error;
    //     var statusCode = error.response.status;
    //     mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    // });
}

export function myImageDelCallbackSuccess(caller, result){
    console.log(result);
    var data = result.data;
    if (result.status == 200 || result.status == 201) {
        mcpjs["util/util"].commonAlert(data.message)
        getMyImageList("name")
        $("#myImageInfoBox").hide();
    } else {
        mcpjs["util/util"].commonAlert(result.data.error)
    }
}

function getMyImageList(sort_type) {
    var caller = "myimagemng";
    var actionName = "MyImageList";
    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['myimage/myimagemng'].myImageListCallbackSuccess)
    // console.log(sort_type);
    // // defaultNameSpace 기준으로 가져온다. (server단 session에서 가져오므로 변경하려면 현재 namesapce를 바꾸고 호출하면 됨)
    // var url = "/settings/resources/myimage";
    // axios.get(url, {
    //     headers: {
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     console.log("get MyImage List : ", result.data);
    //     // var data = result.data.dataDisk;
    //     var data = result.data.myImageInfoList;
    //     if (data == null) {
    //         data = []
    //     }
    //     var html = ""
    //     var cnt = 0;

    //     if (data.length == 0) {
    //         html += '<tr><td class="overlay hidden" data-th="" colspan="5">No Data</td></tr>'

    //         $("#myImageList").empty()
    //         $("#myImageList").append(html)
    //         ModalDetail()
    //     } else {
    //         // if (data.length) {
    //         //     if (sort_type) {
    //         //         cnt++;
    //         //         console.log("check : ", sort_type);
    //         //         data.filter(list => list.Name !== "").sort((a, b) => (a[sort_type] < b[sort_type] ? - 1 : a[sort_type] > b[sort_type] ? 1 : 0)).map((item, index) => (
    //         //             html += addMyImageRow(item, index)
    //         //         ))
    //         //     } else {
    //         //         data.filter((list) => list.Name !== "").map((item, index) => (
    //         //             html += addMyImageRow(item, index)
    //         //         ))
    //         //     }

    //         //     $("#myImageList").empty()
    //         //     $("#myImageList").append(html)

    //         //     ModalDetail()
    //         // }
    //         new MyImageListComp(document.getElementById("myImageList"), data)
    //         ModalDetail()
    //     }
    // }).catch((error) => {
    //     // console.warn(error);
    //     // console.log(error.response)
    //     // var errorMessage = error.response.data.error;
    //     // var statusCode = error.response.status;
    //     // mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    //     mcpjs['util/util'].commonErrorAlert(500, error);
    // });
}

export function myImageListCallbackSuccess(caller, result){
    var data = result.data.myImageInfoList;
    console.log(data);
    table.setData(data);
}

function ModalDetail() {
    $(".dashboard .status_list tbody tr").each(function () {
        var $td_list = $(this),
            $status = $(".detail_box"),
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

export function getMyImageData(myImageId, mode){
    $('#myImageMode').val(mode)

    var caller = "myimagemng";
    var actionName = "MyImageGet";
    var optionParamMap = new Map();
    optionParamMap.set("{myImageId}", myImageId);
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['myimage/myimagemng'].getMyImageCallbackSuccess);
}

export function getMyImageCallbackSuccess(caller, result){
    console.log(result);    
    var data = result.data.myImageInfo
    console.log("Show Data : ", data);

    var dtlMyImageId = data.id;
    var dtlMyImageName = data.name;
    var dtlSouceVmId = data.sourceVmId;
    var dtlProviderId = data.providerId
    var dtlRegionName = data.regionName
    var dtlAssoObj = data.associatedObjectList;
    var dtlStatus = data.status;
    //var dtlConnectionName = data.connectionName;
    var dtlCreationDate = data.creationDate;
    var associatedVmId;
    if (dtlAssoObj != null) {
        console.log("dtlAssoObj", dtlAssoObj)
        var parse = dtlAssoObj[0];
        var temp_parse = parse.split("/");
        associatedVmId = temp_parse[6];
    }

    $("#dtlMyImageName").empty();
    $("#dtlSouceVmId").empty();
    $("#dtlAssoObj").empty();
    $("#dtlStatus").empty();
    //$("#dtlConnectionName").empty();
    $("#dtlProvider").empty();
    $("#dtlRegionName").empty();
    $("#dtlCreationDate").empty();
    $("#dtlMyImageName").val(dtlMyImageName);
    $("#dtlSouceVmId").val(dtlSouceVmId);
    $("#dtlAssoObj").val(dtlAssoObj);
    $("#dtlStatus").val(dtlStatus);
    //$("#dtlConnectionName").val(dtlConnectionName);
    $("#dtlProvider").val(dtlProviderId);
    $("#dtlRegionName").val(dtlRegionName);
    $("#dtlCreationDate").val(dtlCreationDate);

    $('#myImageName').text(dtlMyImageName)

    displayMyImageInfo("DEL");    
}

export function displayMyImageInfo(targetAction){
//export function myImageInfo(targetAction) {
    if (targetAction == "DEL") {
        $('#myImageInfoBox').addClass("view");
        $('#myImageListTable').removeClass("on");

        var offset = $("#myImageInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 300);

    } else if (targetAction == "DEL_SUCCESS") {
        $('#myImageInfoBox').removeClass("view");
        $('#myImageListTable').addClass("on");

        var offset = $("#myImageInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);

        getDataDiskList("name");
    } else if (targetAction == "CLOSE") {
        $('#myImageInfoBox').removeClass("view");
        $('#myImageListTable').addClass("on");

        var offset = $("#myImageInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);
    }
}


// deprecated : 선택한 dataDisk의 상세정보 : 이미 가져왔는데 다시 가져올 필요있나?? dataDiskID
// export function showMyImageInfo(myImageId, myImageName) {
//     console.log("showMyImageInfo : ", myImageName);

//     $('#myImageName').text(myImageName)

//     var url = "/settings/resources/myimage/id/" + encodeURIComponent(myImageId);
//     console.log("dataDisk detail URL : ", url)

//     return axios.get(url, {
//     }).then(result => {
//         console.log(result);
//         console.log(result.data);
//         var data = result.data.myImageInfo
//         console.log("Show Data : ", data);

//         var dtlMyImageName = data.name;
//         var dtlSouceVmId = data.sourceVmId;
//         var dtlProviderId = data.providerId
//         var dtlRegionName = data.regionName
//         var dtlAssoObj = data.associatedObjectList;
//         var dtlStatus = data.status;
//         //var dtlConnectionName = data.connectionName;
//         var dtlCreationDate = data.creationDate;
//         var associatedVmId;
//         if (dtlAssoObj != null) {
//             console.log("dtlAssoObj", dtlAssoObj)
//             var parse = dtlAssoObj[0];
//             var temp_parse = parse.split("/");
//             associatedVmId = temp_parse[6];
//         }

//         $("#dtlMyImageName").empty();
//         $("#dtlSouceVmId").empty();
//         $("#dtlAssoObj").empty();
//         $("#dtlStatus").empty();
//         //$("#dtlConnectionName").empty();
//         $("#dtlProvider").empty();
//         $("#dtlRegionName").empty();
//         $("#dtlCreationDate").empty();
//         $("#dtlMyImageName").val(dtlMyImageName);
//         $("#dtlSouceVmId").val(dtlSouceVmId);
//         $("#dtlAssoObj").val(dtlAssoObj);
//         $("#dtlStatus").val(dtlStatus);
//         //$("#dtlConnectionName").val(dtlConnectionName);
//         $("#dtlProvider").val(dtlProviderId);
//         $("#dtlRegionName").val(dtlRegionName);
//         $("#dtlCreationDate").val(dtlCreationDate);

//         ModalDetail()

//     }).catch(function (error) {
//         console.log("Network detail error : ", error);
//     });
// }

