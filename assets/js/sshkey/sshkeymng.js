import "bootstrap";
import "jquery.scrollbar";
//import {client} from '/assets/js/util/util'
/* scroll */

var table;
$(function () {
//   mcpjs['util/pathfinder'].getCommonCloudProviderList("vpcselectbox", "", "", "regProvider")

    initTable();

    getSshKeyList("")
});


function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"Id", field:"id", visible: false},
        {title:"Connection Name", field:"connectionName", visible: false},
        {title:"SshKey Name", field:"name", vertAlign: "middle"},
        {title:"CSP SshKey Name", field:"cspSshKeyName", vertAlign: "middle"},
        {title: "Description", field:"description", vertAlign: "middle", hozAlign: "center", headerSort:false},
    ]
    
    table = mcpjs["util/util"].setTabulator("sshKeyList", tableObjParams, columns)
    
    table.on("rowClick", function(e, row){
        //displaySshKeyInfo("INFO", row.getElement())        
        getSshKeyData(row.getCell("id").getValue(), 'info')
    });

    table.on("rowSelectionChanged", function(data, rows){
    });

    mcpjs['util/util'].displayColumn(table)    
}

// function fnMove(target) {
//     var offset = $("#" + target).offset();
//     console.log("fn move offset : ", offset)
//     $('html, body').animate({
//         scrollTop: offset.top
//     }, 400);
// }

// area 표시
export function displaySshKeyInfo(targetAction) {
    if (targetAction == "REG") {
        $('#sshKeyCreateBox').toggleClass("active");
        $('#sskKeyInfoBox').removeClass("view");
        $('#sshKeyListTable').removeClass("on");
        var offset = $("#sshKeyCreateBox").offset();
        // var offset = $("#" + target+"").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 300);

        // form 초기화
        $("#regCspSshKeyName").val('');
        //$("#regProvider").val('');
        //$("#regCregConnectionNameidrBlock").val('');
      mcpjs['util/common'].goFocus('sshKeyCreateBox');
    } else if (targetAction == "REG_SUCCESS") {
        $('#sshKeyCreateBox').removeClass("active");
        $('#sskKeyInfoBox').removeClass("view");
        $('#sshKeyListTable').addClass("on");

        var offset = $("#sshKeyCreateBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);

        // form 초기화
        $("#regCspSshKeyName").val('');
        $("#regProvider").val('');
        $("#regCregConnectionNameidrBlock").val('');

        getSshKeyList("name");
    } else if (targetAction == "DEL") {
        $('#sshKeyCreateBox').removeClass("active");
        $('#sskKeyInfoBox').addClass("view");
        $('#sshKeyListTable').removeClass("on");

        var offset = $("#sskKeyInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 300);

    } else if (targetAction == "DEL_SUCCESS") {
        $('#sshKeyCreateBox').removeClass("active");
        $('#sskKeyInfoBox').removeClass("view");
        $('#sshKeyListTable').addClass("on");

        var offset = $("#sskKeyInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);

        getSshKeyList("name");
    } else if (targetAction == "CLOSE") {
        $('#sshKeyCreateBox').removeClass("active");
        $('#sskKeyInfoBox').removeClass("view");
        $('#sshKeyListTable').addClass("on");

        var offset = $("#sskKeyInfoBox").offset();
        $("#TopWrap").animate({ scrollTop: offset.top }, 0);
    } 
}

// sshkey 단건 조회
function getSshKeyData(sshKeyId, mode){
    $('#sshKeyMode').val(mode)

    var caller = "sshkeymng";
    var actionName = "SshKeyGet";
    var optionParamMap = new Map();
    optionParamMap.set("{sshKeyId}", sshKeyId);
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['sshkey/sshkeymng'].getSshKeyCallbackSuccess);

}

export function getSshKeyCallbackSuccess(caller, result){
    var data = result.data.SshKeyInfo
    console.log("Show Data : ", data);

    var dtlSshKeyName = data.name;
    var dtlCspSshKeyName = data.cspSshKeyName;
    var dtlDescription = data.description;
    var dtlUserID = data.userID;
    var dtlConnectionName = data.connectionName;
    var dtlPublicKey = data.publicKey;
    var dtlPrivateKey = data.privateKey;
    var dtlFingerprint = data.fingerprint;


    $('#dtlCspSshKeyName').empty();
    $('#dtlSshKeyName').empty();    
    $('#dtlDescription').empty();
    $('#dtlUserID').empty();
    $('#dtlConnectionName').empty();
    $('#dtlPublicKey').empty();
    $('#dtlPrivateKey').empty();
    $('#dtlFingerprint').empty();

    $('#dtlCspSshKeyName').val(dtlCspSshKeyName);
    $('#dtlSshKeyName').val(dtlSshKeyName);
    $('#dtlDescription').val(dtlDescription);
    $('#dtlUserID').val(dtlUserID);
    $('#dtlConnectionName').val(dtlConnectionName);
    $('#dtlPublicKey').val(dtlPublicKey);
    $('#dtlPrivateKey').val(dtlPrivateKey);
    $('#dtlFingerprint').val(dtlFingerprint);

    $(".stxt").html(dtlSshKeyName);

    mcpjs["sshkey/sshkeymng"].displaySshKeyInfo("DEL"); // 상세 area 보여주고 focus이동
}

// SshKey 목록 조회
function getSshKeyList(sort_type) {

    var caller = "sshkeymng";
    var actionName = "SshKeyList";
    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['sshkey/sshkeymng'].getSshKeyListCallbackSuccess)

    //var url = "{{ .comURL.SpiderURL}}" + "/connectionconfig";
    // var url = CommonURL+"/ns/"+NAMESPACE+"/resources/sshKey";
    // var url = "/settings/resources" + "/sshkey?option="+sort_type
    // axios.get(url, {
    //     headers: {
    //         // 'Authorization': "{{ .apiInfo}}",
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     console.log("get SSH Data : ", result.data);
    //     var data = result.data.SshKeyList; // exception case : if null 
    //     var html = ""

    //     if (data == null) {
    //         html += '<tr><td class="overlay hidden" data-th="" colspan="5">No Data</td></tr>'

    //         $("#sList").empty();
    //         $("#sList").append(html);

    //         ModalDetail()
    //     } else {
    //         if (data.length) { // null exception if not exist
    //             if (sort_type) {
    //                 console.log("check : ", sort_type);
    //                 data.filter(list => list.name !== "").sort((a, b) => (a[sort_type] < b[sort_type] ? - 1 : a[sort_type] > b[sort_type] ? 1 : 0)).map((item, index) => (
    //                     //html += '<tr onclick="showSshKeyInfo(\'' + item.cspSshKeyName + '\');">'
    //                     html += '<tr onclick="mcpjs[\'sshkey/sshkeymng\'].showSshKeyInfo(\'' + item.id + '\',\''+item.name+'\');">'
    //                     + '<td class="overlay hidden column-50px" data-th="">'
    //                     + '<input type="hidden" id="ssh_info_' + index + '" value="' + item.name + '|' + item.connectionName + '|' + item.cspSshKeyName + '"/>'
    //                     + '<input type="checkbox" name="chk" value="' + item.name + '" id="raw_' + index + '" title="" /><label for="td_ch1"></label> <span class="ov off"></span></td>'
    //                     + '<td class="btn_mtd ovm" data-th="Name">' + item.id
    //                     // + '<a href="javascript:void(0);"><img src="/assets/images/contents/icon_copy.png" class="td_icon" alt=""/></a> <span class="ov"></span></td>'
    //                     + '</td>'
    //                     + '<td class="overlay hidden" data-th="connectionName">' + item.connectionName + '</td>'
    //                     + '<td class="overlay hidden" data-th="cspSshKeyName">' + item.cspSshKeyName + '</td>'
    //                     // + '<td class="overlay hidden column-60px" data-th=""><a href="javascript:void(0);"><img src="/assets/images/contents/icon_link.png" class="icon" alt=""/></a></td>' 
    //                     + '</tr>'
    //                 ))
    //             } else {
    //                 data.filter((list) => list.name !== "").map((item, index) => (
    //                     //html += '<tr onclick="showSshKeyInfo(\'' + item.cspSshKeyName + '\');">'
    //                     html += '<tr onclick="mcpjs[\'sshkey/sshkeymng\'].showSshKeyInfo(\'' + item.id + '\',\''+item.name+'\');">'
    //                     + '<td class="overlay hidden column-50px" data-th="">'
    //                     + '<input type="hidden" id="ssh_info_' + index + '" value="' + item.name + '"/>'
    //                     + '<input type="checkbox" name="chk" value="' + item.name + '" id="raw_' + index + '" title="" /><label for="td_ch1"></label> <span class="ov off"></span></td>'
    //                     + '<td class="btn_mtd ovm" data-th="id">' + item.id + '<span class="ov"></span></td>'
    //                     + '<td class="overlay hidden" data-th="connectionName">' + item.connectionName + '</td>'
    //                     + '<td class="overlay hidden" data-th="cspSshKeyName">' + item.cspSshKeyName + '</td>'
    //                     // + '<td class="overlay hidden column-60px" data-th=""><a href="javascript:void(0);"><img src="/assets/images/contents/icon_link.png" class="icon" alt=""/></a></td>' 
    //                     + '</tr>'
    //                 ))

    //             }

    //             $("#sList").empty();
    //             $("#sList").append(html);
    //             // mcpjs["util/common"].setTableHeightForScroll('sList', 300)
    //             ModalDetail()

    //         }
    //     }

    //     // }).catch(function(error){
    //     //     console.log("get sshKeyList error : ",error);        
    //     // });
    // }).catch((error) => {
    //     console.warn(error);
    //     console.log(error.response)
    //     var errorMessage = error.response.data.error;
    //     var statusCode = error.response.status;
    //     mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    // });
}

export function getSshKeyListCallbackSuccess(caller, result){
    var data = result.data.SshKeyList; // exception case : if null 
    console.log(data);
    table.setData(data);
}

// function goFocus(target) {

//     console.log(event)
//     event.preventDefault()

//     $("#" + target).focus();
//     fnMove(target)
// }

export function deleteSshKey() {
    // function goDelete() {
    var selSshKeyId = "";
    var count = 0;

    var sshKeyId = "";
    var selectedRows = table.getSelectedRows();
    selectedRows.forEach(function(row) {
        count++;
        sshKeyId = row.getCell("id").getValue();      
    });

    if( count == 0){
        mcpjs["util/util"].commonAlert("삭제할 대상을 선택하세요.");
        return false;
    }
    if (count > 1) {
        mcpjs["util/util"].commonAlert("삭제할 대상을 하나만 선택하세요.");
        return false;
    }

    var caller = "sshkeymng"
    var controllerKeyName = "SshKeyDel";
    var optionParamMap = new Map();
    optionParamMap.set("{sshKeyId}", sshKeyId);
    var obj = {}
    mcpjs["util/pathfinder"].deleteCommonData(caller, controllerKeyName, optionParamMap, obj, mcpjs["sshkey/sshkeymng"].sshKeyDelCallbackSuccess );

    // $("input[name='chk']:checked").each(function () {
    //     count++;
    //     selSshKeyId = selSshKeyId + $(this).val() + ",";
    // });
    // selSshKeyId = selSshKeyId.substring(0, selSshKeyId.lastIndexOf(","));

    // console.log("sshKeyId : ", selSshKeyId);
    // console.log("count : ", count);

    // if (selSshKeyId == '') {
    //     mcpjs["util/util"].commonAlert("삭제할 대상을 선택하세요.");
    //     return false;
    // }

    // if (count != 1) {
    //     mcpjs["util/util"].commonAlert("삭제할 대상을 하나만 선택하세요.");
    //     return false;
    // }

    // // var url = CommonURL + "/ns/" + NAMESPACE + "/resources/sshKey/" + selSshKeyId;
   
    // var url = "/settings/resources" + "/sshkey/id/" + selSshKeyId;
    // client.delete(url, {
    //     headers: {
    //         // 'Authorization': "{{ .apiInfo}}",
    //         'Content-Type': "application/json"
    //     }
    // }).then(result => {
    //     var data = result.data;
    //     console.log(data);
    //     if (result.status == 200 || result.status == 201) {
    //         // commonAlert("Success Delete SSH Key.");
    //       mcpjs["util/util"].commonAlert(data.message);
    //         // location.reload(true);

    //         displaySshKeyInfo("DEL_SUCCESS");
    //         //getSshKeyList("name");

    //         getSshKeyList("name");
    //     } else {
    //       mcpjs["util/util"].commonAlert(data.error);
    //     }
    //     // }).catch(function(error){
    //     //     console.log("get delete error : ",error);        
    //     // });
    // }).catch((error) => {
    //     console.warn(error);
    //     console.log(error.response)
    //     var errorMessage = error.response.data.error;
    //     var statusCode = error.response.status;
    //    mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    // });
}

export function sshKeyDelCallbackSuccess(caller, result){
    var data = result.data;
    console.log(data);
    if (result.status == 200 || result.status == 201) {
        // commonAlert("Success Delete SSH Key.");
        mcpjs["util/util"].commonAlert(data.message);
        displaySshKeyInfo("DEL_SUCCESS");
        getSshKeyList("name");
    } else {
        mcpjs["util/util"].commonAlert(data.error);
    }   
}

// deprecated
export function showSshKeyInfo(sshKeyId,sshKeyName) {
    console.log("target showSshKeyInfo : ", sshKeyId);

    $(".stxt").html(sshKeyName);

    // var sshKeyId = target;
    // var apiInfo = "{{ .apiInfo}}";
    // var url = CommonURL+"/ns/"+NAMESPACE+"/resources/sshKey/"+ sshKeyId;
    var url = "/settings/resources" + "/sshkey/id/" + sshKeyId;
    console.log("ssh key URL : ", url)

    return axios.get(url, {
        headers: {
            // 'Authorization': apiInfo
        }

    }).then(result => {
        var data = result.data.SshKeyInfo
        console.log("Show Data : ", data);

        var dtlCspSshKeyName = data.cspSshKeyName;
        var dtlDescription = data.description;
        var dtlUserID = data.userID;
        var dtlConnectionName = data.connectionName;
        var dtlPublicKey = data.publicKey;
        var dtlPrivateKey = data.privateKey;
        var dtlFingerprint = data.fingerprint;


        $('#dtlCspSshKeyName').empty();
        $('#dtlDescription').empty();
        $('#dtlUserID').empty();
        $('#dtlConnectionName').empty();
        $('#dtlPublicKey').empty();
        $('#dtlPrivateKey').empty();
        $('#dtlFingerprint').empty();

        $('#dtlCspSshKeyName').val(dtlCspSshKeyName);
        $('#dtlDescription').val(dtlDescription);
        $('#dtlUserID').val(dtlUserID);
        $('#dtlConnectionName').val(dtlConnectionName);
        $('#dtlPublicKey').val(dtlPublicKey);
        $('#dtlPrivateKey').val(dtlPrivateKey);
        $('#dtlFingerprint').val(dtlFingerprint);
        // }).catch(function(error){
        //     console.log("get sshKey error : ",error);        
        // });
    }).catch((error) => {
        console.warn(error);
        console.log(error.response)
        var errorMessage = error.response.data.error;
        var statusCode = error.response.status;
        mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
    });
}

export function createSSHKey() {
    var cspSshKeyName = $("#regCspSshKeyName").val()
   // var connectionName = $("#regConnectionName").val()
    var providerId = $("#regProvider").val()
    var regionName = $("#regRegionName").val()
    console.log("info param providerId : ", providerId);
    console.log("info param regionName : ", regionName);

    if (!cspSshKeyName) {
        mcpjs["util/util"].commonAlert("Input New SSH Key Name")
        $("#regCspSshKeyName").focus()
        return;
    }
    if (!regionName) {
        mcpjs["util/util"].commonAlert("Please Select Region")
        $("#regRegionName").focus()
        return;
    }
    if (!providerId) {
        mcpjs["util/util"].commonAlert("Please Select Provider")
        $("#regProvider").focus()
        return;
    }

    
    // var url = "/settings/resources/sshkey"
    // console.log("ssh key URL : ", url)
    var obj = {
        name: cspSshKeyName,
        regionName,
        providerId : providerId
    }

    if (cspSshKeyName) {
        var caller = "sshkeymng";
        var controllerKeyName = "SshKeyReg";
        var optionParamMap = new Map();
        mcpjs["util/pathfinder"].postCommonData(
            caller,
            controllerKeyName,
            optionParamMap,
            obj,
            mcpjs["sshkey/sshkeymng"].sshKeyRegCallbackSuccess
        );
    }

    // console.log("info connectionconfig obj Data : ", obj);
    // if (cspSshKeyName) {
    //     client.post(url, obj, {
    //         headers: {
    //             'Content-type': 'application/json',
    //             // 'Authorization': apiInfo,
    //         }
    //     }).then(result => {
    //         console.log(result);
    //         if (result.status == 200 || result.status == 201) {
    //           mcpjs["util/util"].commonAlert("Success Create SSH Key")
    //             //등록하고 나서 화면을 그냥 고칠 것인가?
    //             displaySshKeyInfo("REG_SUCCESS");
    //             //getSshKeyList("name");
    //             //아니면 화면을 리로딩 시킬것인가?
    //             // location.reload();
    //             // $("#btn_add2").click()
    //             // $("#namespace").val('')
    //             // $("#nsDesc").val('')
    //         } else {
    //           mcpjs["util/util"].commonAlert("Fail Create SSH Key")
    //         }
    //         // }).catch(function(error){
    //         //     console.log("get create error : ",error);        
    //         // });
    //     }).catch((error) => {
    //         console.warn(error);
    //         console.log(error.response)
    //         var errorMessage = error.response.statusText;
    //         var statusCode = error.response.status;
    //         mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    //     });
    // } else {
    //   mcpjs["util/util"].commonAlert("Input SSH Key Name")
    //     $("#regCspSshKeyName").focus()
    //     $("#regCspSshKeyName").on('focus',()=>{

    //     })
    //     return;
    // }
}

export function sshKeyRegCallbackSuccess(caller, result){
    if (result.status == 200 || result.status == 201) {
        mcpjs["util/util"].commonAlert("Success Create SSH Key")
        //등록하고 나서 화면을 그냥 고칠 것인가?
        displaySshKeyInfo("REG_SUCCESS");
        //getSshKeyList("name");
        //아니면 화면을 리로딩 시킬것인가?
        // location.reload();
    } else {
        mcpjs["util/util"].commonAlert("Fail Create SSH Key")
    }
}

// updateSshKey : TODO : update를 위한 form을 만들 것인가 ... 기존 detail에서 enable 시켜서 사용할 것인가
export function updateSSHKey() {
    var sshKeyId = $("#dtlSshKeyId").val()
    var sshKeyName = $("#dtlSshKeyName").val()
    var cspSshKeyId = $("#dtlCspSshKeyId").val()
    var cspSshKeyName = $("#dtlCspSshKeyName").val()
    var description = $("#dtlDescription").val()
    var publicKey = $("#dtlPublicKey").val()
    var privateKey = $("#dtlPrivateKey").val()
    var fingerprint = $("#dtlFingerprint").val()
    var username = $("#dtlUsername").val()
    var verifiedUsername = $("#dtlVerifiedUsername").val()// TODO : 사용자 이름 입력 받아야 함.
    var connectionName = $("#dtlConnectionName").val()

    console.log("info param cspSshKeyName : ", cspSshKeyName);
    console.log("info param connectionName : ", connectionName);

    var url = "/api/settings/resources" + "/sshkey/put/" + sshKeyId
    console.log("ssh key URL : ", url)
    var obj = {
        connectionName : connectionName,
        id : sshKeyId,
        name : sshKeyName,
        cspSshKeyId	: cspSshKeyId,
        cspSshKeyName : cspSshKeyName,
        description	: description,
        privateKey : privateKey,
        publicKey :	publicKey,
        fingerprint	: fingerprint,
        username :	username,
        verifiedUsername :	verifiedUsername
    }
    console.log("info updateSSHKey obj Data : ", obj);
    if (cspSshKeyName) {
        client.post(url, obj, {
            headers: {
                'Content-type': 'application/json',
                // 'Authorization': apiInfo,
            }
        }).then(result => {
            console.log(result);
            if (result.status == 200 || result.status == 201) {
              mcpjs["util/util"].commonAlert(" SSH Key Modification Success")
                //등록하고 나서 화면을 그냥 고칠 것인가?
                displaySshKeyInfo("REG_SUCCESS");// TODO : MODIFY 성공일 때 어떻게 처리 할지 정의해서 보완할 것.
                //getSshKeyList("name");
                //아니면 화면을 리로딩 시킬것인가?
                // location.reload();
                // $("#btn_add2").click()
                // $("#namespace").val('')
                // $("#nsDesc").val('')
            } else {
              mcpjs["util/util"].commonAlert("Fail Create SSH Key")
            }
            // }).catch(function(error){
            //     console.log("get create error : ",error);
            // });
        }).catch((error) => {
            console.warn(error);
            console.log(error.response)
            var errorMessage = error.response.statusText;
            var statusCode = error.response.status;
           mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
        });
    } else {
      mcpjs["util/util"].commonAlert("Input SSH Key Name")
        $("#regCspSshKeyName").focus()
        return;
    }
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
            $(".dashboard.edit_box").removeClass("view");
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
                    $(".dashboard.edit_box").removeClass("view");
                }
            });
        });
    });
}
