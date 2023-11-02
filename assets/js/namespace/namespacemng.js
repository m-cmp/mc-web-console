import {client} from '/assets/js/util/util'
$(document).ready(function () {

    // css 에 event set
    mcpjs["util/common"].initJavascriptForCss();

    var order_type = "name"
    // getNSList(order_type);-> getNameSpaceList 으로 이름변경. 이미 가져왔음.
    // mcpjs["util/common"].setTableHeightForScroll('nameSpaceList', 300);
})



// commons.js에 정의 됨
// function fnMove(target){
// var offset = $("#" + target).offset();
// console.log("fn move offset : ",offset)
// $('html, body').animate({scrollTop : offset.top}, 400);
// }

export function getNameSpaceListCallbackSuccess(caller, data) {
    var html = ""
    if (data == null) {
        html += '<tr><td class="overlay hidden" data-th="" colspan="8">No Data</td></tr>'

        $("#nsList").empty();
        $("#nsList").append(html);

        ModalDetail()
    } else {
        var sort_type = "Name";//정렬 기본값은 Name 칼럼.  TODO : Data조회시 sortType이 있으면 해당 값으로 sort필요.  tableSort라는 function 있음.
        if (data.length) {
            if (sort_type) {
                data.filter(list => list.name !== "").sort((a, b) => (a[sort_type] < b[sort_type] ? -1 : a[sort_type] > b[sort_type] ? 1 : 0)).map((item, index) => (
                    html += '<tr onclick="showNameSpaceInfo(\'ns_info_' + index + '\');">'
                    + '<td class="overlay hidden column-50px" data-th="">'
                    + '<input type="hidden" id="ns_info_' + index + '" value="' + item.id + '|' + item.name + '|' + item.description + '"/>'
                    + '<input type="checkbox" name="chk" value="' + item.name + '" id="raw_' + index + '" title="" /><label for="td_ch1"></label> <span class="ov off"></span></td>'
                    + '<td class="btn_mtd ovm column-20percent" data-th="Name">' + item.name + '<span class="ov"></span></td>'
                    + '<td class="overlay hidden column-20percent" data-th="ID">' + item.id + '</td>'
                    + '<td class="overlay hidden td_left" data-th="description">' + item.description + '</td>'
                    // +'<td class="overlay hidden column-60px" data-th=""><a href="javascript:void(0);"><img src="/assets/images/contents/icon_link.png" class="icon" alt=""/></a></td>' 
                    + '</tr>'
                ))
            } else {
                data.filter((list) => list.name !== "").map((item, index) => (
                    html += '<tr onclick="showNameSpaceInfo(\'ns_info_' + index + '\');">'
                    + '<td class="overlay hidden column-50px" data-th="">'
                    + '<input type="hidden" id="ns_info_' + index + '" value="' + item.id + '|' + item.name + '|' + item.description + '"/>'
                    + '<input type="checkbox" name="chk" value="' + item.name + '" id="raw_' + index + '" title="" /><label for="td_ch1"></label> <span class="ov off"></span></td>'
                    + '<td class="btn_mtd ovm column-20percent" data-th="Name">' + item.name + '<span class="ov"></span></td>'
                    + '<td class="overlay hidden column-20percent" data-th="ID">' + item.id + '</td>'
                    + '<td class="overlay hidden td_left" data-th="description">' + item.description + '</td>'
                    // +'<td class="overlay hidden column-60px" data-th=""><a href="javascript:void(0);"><img src="/assets/images/contents/icon_link.png" class="icon" alt=""/></a></td>' 
                    + '</tr>'
                ))

            }
            $("#nsList").empty();
            $("#nsList").append(html);

            ModalDetail()
        }//end of data length
    }
}

export function getNameSpaceListCallbackFail(caller, error) {
    var errorMessage = error.response.data.error;
    var statusCode = error.response.status;
   mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
}
// function getNSList(sort_type){
export function getNameSpaceList(sort_type) {
    clearNamespaceInfo();

    getCommonNameSpaceList("namespacemng")
    // var url = "/setting/namespaces"+"/namespace/list";
    // axios.get(url,{
    //     headers:{
    //         'Content-Type' : "application/json"
    //     }
    // }).then(result=>{
    //     console.log("get NameSpace Data : ",result.data);
    //     // var data = result.data.ns;
    //     var data = result.data;
    //     var html = ""

    //     if(data == null) {
    //         html += '<tr><td class="overlay hidden" data-th="" colspan="8">No Data</td></tr>'

    //         $("#nsList").empty();
    //         $("#nsList").append(html);

    //         ModalDetail() 
    //     } else {
    //         if(data.length){ 
    //             if(sort_type){            
    //                 data.filter(list=> list.name !=="" ).sort((a,b) => ( a[sort_type] < b[sort_type] ? -1 : a[sort_type] > b[sort_type] ? 1 : 0)).map((item,index)=>(
    //                     html +='<tr onclick="showNameSpaceInfo(\'ns_info_'+index+'\');">'
    //                         +'<td class="overlay hidden column-50px" data-th="">'
    //                         +'<input type="hidden" id="ns_info_'+index+'" value="'+item.id+'|'+item.name+'|'+item.description+'"/>'
    //                         +'<input type="checkbox" name="chk" value="'+item.name+'" id="raw_'+index+'" title="" /><label for="td_ch1"></label> <span class="ov off"></span></td>'
    //                         +'<td class="btn_mtd ovm column-20percent" data-th="Name">'+item.name+'<span class="ov"></span></td>'
    //                         +'<td class="overlay hidden column-20percent" data-th="ID">'+item.id+'</td>'
    //                         +'<td class="overlay hidden td_left" data-th="description">'+item.description+'</td>'
    //                         +'<td class="overlay hidden column-60px" data-th=""><a href="javascript:void(0);"><img src="/assets/images/contents/icon_link.png" class="icon" alt=""/></a></td>' 
    //                         +'</tr>' 
    //                 ))
    //             }else{
    //                 data.filter((list)=> list.name !== "" ).map((item,index)=>(
    //                     html +='<tr onclick="showNameSpaceInfo(\'ns_info_'+index+'\');">'
    //                         +'<td class="overlay hidden column-50px" data-th="">'
    //                         +'<input type="hidden" id="ns_info_'+index+'" value="'+item.id+'|'+item.name+'|'+item.description+'"/>'
    //                         +'<input type="checkbox" name="chk" value="'+item.name+'" id="raw_'+index+'" title="" /><label for="td_ch1"></label> <span class="ov off"></span></td>'
    //                         +'<td class="btn_mtd ovm column-20percent" data-th="Name">'+item.name+'<span class="ov"></span></td>'
    //                         +'<td class="overlay hidden column-20percent" data-th="ID">'+item.id+'</td>'
    //                         +'<td class="overlay hidden td_left" data-th="description">'+item.description+'</td>'
    //                         +'<td class="overlay hidden column-60px" data-th=""><a href="javascript:void(0);"><img src="/assets/images/contents/icon_link.png" class="icon" alt=""/></a></td>' 
    //                         +'</tr>'        
    //                 ))

    //             }		
    //             $("#nsList").empty();
    //             $("#nsList").append(html);

    //             ModalDetail()        
    //         }//end of data length
    //     }

    // })
}

// common.js 로 이동
// function goFocus(target){

// console.log(event)
// event.preventDefault()

// $("#"+target).focus();
// fnMove(target)

// }

// function showInfo(target){
export function showNameSpaceInfo(target) {
    console.log("target : ", target);
    var infos = $("#" + target).val()
    infos = infos.split("|")
    $("#infoID").val(infos[0])
    $("#infoName").val(infos[1])
    $("#infoDesc").val(infos[2])

    $("#infoName").focus();

    // 선택한 namespace를 defaultNameSpace 로 지정. -> OK버튼 클릭했을 때 설정 됨
    $("#tempSelectedNameSpaceID").val(infos[0]);
}

// 삭제 처리 후 namespace 상세정보 초기화  TODO : display ... function으로 바꿀 것
export function clearNamespaceInfo() {
    // $("#infoID").val('')
    // $("#infoName").val('')
    // $("#infoDesc").val('')
    $("#regName").val('')
    $("#regDesc").val('')
}

//function createNS(){
export function createNameSpace() {
    var namespace = $("#regName").val()
    var desc = $("#regDesc").val()
    if (!namespace) {
      mcpjs["util/util"].commonAlert("Input New NameSpace")
        $("#regName").focus()
        return;
    }

    // var apiInfo = "{ { .apiInfo} }";
    //var url = "/setting/namespaces" + "/namespace/reg/proc";
    var obj = {
        name: namespace,
        description: desc
    }
    if (namespace) {

        var controllerKeyName = "NamespaceReg";
        var optionParamMap = new Map();        
        mcpjs["util/pathfinder"].postCommonData('namespacemng',controllerKeyName,optionParamMap, obj, mcpjs['namespace/namespacemng'].namespaceRegCallbackSuccess)

        // client.post(url, obj, {
        //     headers: {
        //         'Content-type': 'application/json',
        //         // 'Authorization': apiInfo, 
        //     }
        // }).then(result => {
        //     console.log(result);
        //     if (result.status == 200 || result.status == 201) {
        //       mcpjs["util/util"].commonAlert("Namespace creation succeeded");

        //         //등록하고 나서 화면을 그냥 고칠 것인가?
        //         getNameSpaceList();
        //         //clearNamespaceInfo();
        //         displayNameSpaceInfo("REG_SUCCESS");
        //     } else {
        //       mcpjs["util/util"].commonAlert("Namespace creation failed");
        //     }
        // });
    } else {
      mcpjs["util/util"].commonAlert("Input NameSpace")
        $("#regDesc").focus()
        return;
    }
}

// namespace reg callback
export function namespaceRegCallbackSuccess(caller, result){
    console.log(result);
    if (result.status == 200 || result.status == 201) {
      mcpjs["util/util"].commonAlert("Namespace creation succeeded");

        //등록하고 나서 화면을 그냥 고칠 것인가?
        getNameSpaceList();
        //clearNamespaceInfo();
        displayNameSpaceInfo("REG_SUCCESS");
    } else {
      mcpjs["util/util"].commonAlert("Namespace creation failed");
    }
}

// 삭제 : TODO : spider api 확인하여 실제 삭제, 수정작업 되는지 Test 할 것.
export function deleteNameSpace() {
    var nameSpaceID = $("#infoID").val()
    var nameSpaceName = $("#infoName").val()
    var nameSpaceDescription = $("#infoDesc").val()

    // checkbox 선택되어있는지 체크할까?
    if (!nameSpaceID) {
        // alert("select NameSpace")
      mcpjs["util/util"].commonAlert("Please select a namespace.");
        return;
    }

    var url = "/setting/namespaces" + "/namespace/del/" + nameSpaceID;
    if (nameSpaceID) {
        client.delete(url, {}, {
        }).then(result => {
            console.log(result);
            if (result.status == 200 || result.status == 201) {
                // alert("Success delete NameSpace")
              mcpjs["util/util"].commonAlert("Namespace deletion succeeded");
                clearNamespaceInfo()

                //등록하고 나서 화면을 그냥 고칠 것인가?
                getNameSpaceList();

                displayNameSpaceInfo("DEL_SUCCESS")
            } else {
              mcpjs["util/util"].commonAlert("Namespace deletion failed");
            }
            // }).catch(function(error){
            //     console.log("namespace delete error : ",error);        
            // });
        }).catch((error) => {
            console.warn(error);
            console.log(error.response)
            var errorMessage = error.response.data.error;
            var statusCode = error.response.status;
           mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
        });
    } else {
        // alert("Input NameSpace")
      mcpjs["util/util"].commonAlert("Input NameSpace");
        $("#regDesc").focus()
        return;
    }
}

function getNS() {

}

export function displayNameSpaceInfo(targetAction) {
    if (targetAction == "REG") {
        $('#ns_reg').toggleClass("active");
        $('#info_box').removeClass("view");
      mcpjs['util/common'].goFocus('ns_reg');
    } else if (targetAction == "REG_SUCCESS") {
        $('#ns_reg').removeClass("active");
        $('#info_box').removeClass("view");
    } else if (targetAction == "MOD") {
        $('#ns_reg').removeClass("active");
        $('#info_box').toggleClass("view");
    } else if (targetAction == "DEL_SUCCESS") {
        $('#ns_reg').removeClass("active");
        $('#info_box').removeClass("view");
    } else if (targetAction == "CLOSE") {
        $('#ns_reg').removeClass("active");
        $('#info_box').removeClass("view");
    }
}
export function ModalDetail() {
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


