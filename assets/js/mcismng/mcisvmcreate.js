import "bootstrap";
import { REGION_MAP, VMSPEC_MAP, VMIMAGE_MAP, VPC_MAP, SECURITYGROUP_MAP, SSHKEY_MAP, tableSort, commonAlert } from "../util/util";
import {client} from '/assets/js/util/util'

$(function () {    
    // 해당 mcis의 vm목록(id만 조회)
    var mcisId = $("#mcis_id").val();  
    //mcpjs['util/pathfinder'].getCommonMcisSubgroupIdList("vmcreate", mcisId, getMcisSubgroupIdListCallbackSuccess)
    var caller = "mcisvmreg";
    var actionName = "McisSubGroupList"
    var optionParamMap = new Map();
    optionParamMap.set("{mcisId}", mcisId)
    optionParamMap.set("option", "id")    
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['mcismng/mcisvmcreate'].getMcisSubgroupListCallbackSuccess)
    
    // vm 추가 form
    $('.server_add').on('click', function () {
        console.log(".server_add")
        displayNewServerForm()
    });

    $('.btn_deploy').on('click', function () {
        console.log(".btn_deploy")
        deployMcisVm()
    });    
    

    // e_vNetListTbody

    // $('#alertResultArea').addEventListener('hidden.bs.modal', function () {// bootstrap 3 또는 4
    //     //$('#alertResultArea').on('hidden', function () {// bootstrap 2.3 이전
    //     let targetUrl = "/operation/manages/mcismng/mngform"
    //     mcpjs['util/util'].changePage(targetUrl)
    // })

    // //OS_HW popup table scrollbar
    // $('#OS_HW .btn_spec').on('click', function () {
    //     console.log("os_hw bpn_spec clicked ** ")
    //     $('#OS_HW_Spec .dtbox.scrollbar-inner').scrollbar();

    //     // connection 정보 set
    //     var esSelectedProviderId = $("#es_regProviderId option:selected").val();
    //     var esSelectedRegionName = $("#es_regRegionName option:selected").val();
    //     var esSelectedConnectionName = $("#es_regConnectionName option:selected").val();

    //     console.log("OS_HW_Spec_Assist click");
    //     if (esSelectedProvider) {
    //         $("#assist_select_provider").val(esSelectedProviderId);
    //     }
    //     if (esSelectedRegion) {
    //         $("#assist_select_resion").val(esSelectedRegionName);
    //     }
    //     if (esSelectedConnectionName) {
    //         $("#assist_select_connectionName").val(esSelectedConnectionName);
    //     }

    //     // 상단 공통 provider, region, connection
    //     console.log("esSelectedProvider = " + esSelectedProviderId + " : " + $("#assist_select_provider").val());
    //     console.log("esSelectedRegion = " + esSelectedRegionName + " : " + $("#assist_select_resion").val());
    //     console.log("esSelectedConnectionName = " + esSelectedConnectionName + " : " + $("#assist_select_connectionName").val());
    // });
    // //Security popup table scrollbar
    // $('#Security .btn_edit').on('click', function () {
    //     $("#security_edit").modal();
    //     $('#security_edit .dtbox.scrollbar-inner').scrollbar();
    // });

    // // image assist popup이 열리면 connection set
    // $('#imageAssist').on('show.bs.modal', function (e) {
    //     setConnectionOfSearchCondition('imageAssist');
    // });

    // // image assist 가 닫힐 때, connection set
    // $('#imageAssist').on('hide.bs.modal', function (e) {
    // });

    // // spec assist popup이 열리면 connection set
    // $('#specAssist').on('show.bs.modal', function (e) {
    //     setConnectionOfSearchCondition('specAssist');
    // });

    // // spec assist 가 닫힐 때, connection set
    // $('#specAssist').on('hide.bs.modal', function (e) {
    // });

    // // vpc assist popup이 열리면 connection set
    // $('#namespaceVpcAssist').on('show.bs.modal', function (e) {
    //     setConnectionOfSearchCondition('namespaceVpcAssist');
    // });

    // // vpc assist 가 닫힐 때, connection set
    // $('#namespaceVpcAssist').on('hide.bs.modal', function (e) {
    // });


    // $('#namespaceSecurityGroupAssist').on('show.bs.modal', function (e) {
    //     setConnectionOfSearchCondition('securityGroupAssist');
    // });

    // // spec assist 가 닫힐 때, connection set
    // $('#namespaceSecurityGroupAssist').on('hide.bs.modal', function (e) {
    // });

    // $('#sshKeyAssist').on('show.bs.modal', function (e) {
    //     setConnectionOfSearchCondition('sshKeyAssist');
    // });

    // // spec assist 가 닫힐 때, connection set
    // $('#sshKeyAssist').on('hide.bs.modal', function (e) {
    // });

});

// 서버 더하기버튼 클릭시 서버정보 입력area 보이기/숨기기
// isExpert의 체크 여부에 따라 바뀜.
// newServers 와 simpleServers가 있음
export function displayNewServerForm() {
    var deploymentAlgo = $("#placement_algo").val();
    var simpleServerConfig = $("#simpleServerConfig");
    var expertServerConfig = $("#expertServerConfig");
    var importServerConfig = $("#importServerConfig");
    var expressServerConfig = $("#expressServerConfig");
    console.log("deploymentAlgo " + deploymentAlgo)
    // if ($("#isImport").is(":checked")) {
    // if (IsImport) {
    //     simpleServerConfig.removeClass("active");
    //     expertServerConfig.removeClass("active");
    //     importServerConfig.addClass("active");
    //     expressServerConfig.removeClass("active");
    // } else 
    if (deploymentAlgo == "expert") {
        simpleServerConfig.removeClass("active");
        expertServerConfig.toggleClass("active");//
        importServerConfig.removeClass("active");
        expressServerConfig.removeClass("active");
    } else if (deploymentAlgo == "simple") {
        simpleServerConfig.toggleClass("active");//
        expertServerConfig.removeClass("active");
        importServerConfig.removeClass("active");
        expressServerConfig.removeClass("active");
    } else {      
        console.log("exp")
        simpleServerConfig.removeClass("active");
        expertServerConfig.removeClass("active");
        importServerConfig.removeClass("active");
        expressServerConfig.toggleClass("active");//        
    }
}
// 모드가 바뀌면 Form을 Clear 한다.
export function closeNewServerForm() {    
    var expressServerConfig = $("#expressServerConfig");
    var simpleServerConfig = $("#simpleServerConfig");    
    var expertServerConfig = $("#expertServerConfig");
    var importServerConfig = $("#importServerConfig");

    expressServerConfig.removeClass("active");
    simpleServerConfig.removeClass("active");
    expertServerConfig.removeClass("active");
    importServerConfig.removeClass("active");
}

// 해당 mcis의 subgroupList 설정. (ID만 들어있음)
export function getMcisSubgroupListCallbackSuccess(caller, result){
    console.log(result)
    var data = result.data.SubgroupList.output;
    console.log("getMcisSubgroupIdListCallbackSuccess", data)
    for (var i in data) {
        console.log("ddd = " + data[i])    
        var appendLi = "";    
        appendLi += '<li><div class="server server_on bgbox_g"><div class="icon"></div><div class="txt">' + data[i] + '</div></li>';
        console.log(appendLi)    
        $("#mcis_server_list").append(appendLi);
    }
}

var totalDeployServerCount = 0;
var TotalServerConfigArr = new Array();
export function deployMcisVm() {
    var mcisId = $("#mcis_id").val();  
    var mcisName = $("#mcis_name").val();  
    var deploymentAlgo = $("#placement_algo").val()

    if (!mcisId) {
        mcpjs['util/util'].commonAlert("Please Select MCIS !!!!!")
        return;
    }
    if (deploymentAlgo == "express") {
        createVmDynamic()
    }else{
        totalDeployServerCount = 0;// deploy vm 개수 초기화
        var vm_len = 0;
        var obj = {}// vm이 담길 변수

        // Express 는 별도처리임.
        
        if (mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr) {
            console.log("simple", mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr)
            vm_len = mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr.length;
            for (var i in mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr) {
                TotalServerConfigArr.push(mcpjs['mcismng/vmconfiguresimple'].Simple_Server_Config_Arr[i]);
            }
        }

        if (mcpjs['mcismng/vmconfigureexpert'].Expert_Server_Config_Arr) {
            console.log("expert", mcpjs['mcismng/vmconfigureexpert'].Expert_Server_Config_Arr)
            vm_len = mcpjs['mcismng/vmconfigureexpert'].Expert_Server_Config_Arr.length;
            for (var i in mcpjs['mcismng/vmconfigureexpert'].Expert_Server_Config_Arr) {
                TotalServerConfigArr.push(mcpjs['mcismng/vmconfigureexpert'].Expert_Server_Config_Arr[i]);
            }
        }

        //Import_Server_Config_Arr : import도 같이 추가
        if (mcpjs['mcismng/vmconfigureimport'].Import_Server_Config_Arr) {
            console.log("import", mcpjs['mcismng/vmconfigureimport'].Import_Server_Config_Arr)
            vm_len = mcpjs['mcismng/vmconfigureimport'].Import_Server_Config_Arr.length;
            for (var i in mcpjs['mcismng/vmconfigureimport'].Import_Server_Config_Arr) {
                TotalServerConfigArr.push(mcpjs['mcismng/vmconfigureimport'].Import_Server_Config_Arr[i]);
            }
        }

        if (TotalServerConfigArr) {
            vm_len = TotalServerConfigArr.length;
            console.log("Server_Config_Arr length: ", vm_len);
            obj['vm'] = TotalServerConfigArr;
            console.log("new obj is : ", obj);
        } else {
            mcpjs["util/util"].commonAlert("Please Input Servers");
            $(".simple_servers_config").addClass("active");
            $("#s_name").focus();
        }

        //var url = "/operation/manages/mcismng/" + mcis_id + "/vm/reg/proc"
        // var urlParamMap = new Map();
        // urlParamMap.set(":mcisID", mcisId)
        // var url = mcpjs['util/pathfinder'].setUrlByParam(mcpjs['util/pathfinder'].getWebToolUrl('McisVmListRegProc'), urlParamMap)

        try {
            //var controllerKeyName = "McisAppendVmReg";// vm 1개만 가능
            var controllerKeyName = "McisAppendVmListReg";// vm 여러개 가능
            var optionParamMap = new Map();
            optionParamMap.set("{mcisId}", mcisId)
            mcpjs["util/pathfinder"].postCommonData('mcisvmcreate',controllerKeyName,optionParamMap, obj, mcpjs['mcismng/mcisvmcreate'].appendVmToMcisCallbackSuccess)

            // client.post(url, obj, {
            //     // headers: {
            //     //     'Content-type': "application/json",
            //     // },
            // }).then(result => {
            //     console.log("VM Register data : ", result);
            //     console.log("Result Status : ", result.status);
            //     if (result.status == 201 || result.status == 200) {
            //         mcpjs['util/util'].commonResultAlert("Register Requested")
            //     } else {
            //         mcpjs['util/util'].commonAlert("Register Fail")
            //     }
            // }).catch((error) => {
            //     // console.warn(error);
            //     console.log(error.response)
            //     var errorMessage = error.response.data.error;
            //     var statusCode = error.response.status;
            //     mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
    
            // })
        } catch (error) {
            mcpjs['util/util'].commonAlert(error);
            console.log(error);
        }
    }    
}

// mcis에 vm추가 callback
export function appendVmToMcisCallbackSuccess(caller, result){
    console.log("VM Register data : ", result);
    console.log("Result Status : ", result.status);
    if (result.status == 201 || result.status == 200) {
        mcpjs['util/util'].commonResultAlert("Register Requested")
    } else {
        mcpjs['util/util'].commonAlert("Register Fail")
    }
}

// Import / Export Modal 표시
function btn_ImportExport() {
    // export할 VM을 선택한 후 export 버튼 누르라고...
    $("#VmImportExport").modal();
    $('#VmImportExport .dtbox.scrollbar-inner').scrollbar();
}

// 현재 mcis의 vm 목록 조회 : deploy후 상태볼 때 사용
function getVmList() {

    console.log("getVmList()")
    var mcisId = $("#mcis_id").val();

    // /operation/manages/mcis/:mcisID
    var urlParamMap = new Map();
        urlParamMap.set(":mcisID", mcisId)
    var url = mcpjs['util/pathfinder'].setUrlByParam("McisData", urlParamMap)
    
    axios.get(url, {})
    .then(result => {
        console.log("VM Register data : ", result);
        console.log("Result Status : ", result.status);
        if (result.status == 201 || result.status == 200) {
            mcpjs['util/util'].commonAlert("Register Requested")
        } else {
            mcpjs['util/util'].commonAlert("Register Fail")
        }
    }).catch((error) => {
        // console.warn(error);
        console.log(error.response)
        var errorMessage = error.response.data.error;
        var statusCode = error.response.status;
        mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)

    })
}

// 모든 커넥션 목록
var totalCloudConnectionList = new Array();
export function getCloudConnectionListCallbackSuccess(caller, data, sortType) {
    console.log("connection result: ", data);
    totalCloudConnectionList = data;
}

function setTotalConnectionList() {
    totalCloudConnectionList
}
// 화면 Load시 가져오나 굳이?
var totalNetworkListByNamespace = new Array();
function getNetworkListCallbackSuccess(caller, data) {
    console.log(data);
    if (data == null || data == undefined || data == "null") {

    } else {// 아직 data가 1건도 없을 수 있음
        setNetworkListToExpertMode(data, caller);        
    }
}
export function getNetworkListCallbackFail(caller, error) {
    // no data
    var html = ""
    html += '<tr>'
        + '<td class="overlay hidden" data-th="" colspan="4">No Data</td>'
        + '</tr>';
    $("#e_vNetListTbody").empty()
    $("#e_vNetListTbody").append(html)
}

// 전체 목록에서 filter
function filterNetworkList(keywords, caller) {
    // provider
    // connection
    var assistProviderName = "";
    var assistConnectionName = "";
    var html = "";
    if (caller == "namespaceVpcAssist") {
        assistProviderName = $("#assistNetworkProviderName option:selected").val();
        assistConnectionName = $("#assistNetworkConnectionName option:selected").val();
    }

    var calNetIndex = 0;
    totalNetworkListByNamespace.forEach(function (vNetItem, vNetIndex) {
        if (assistConnectionName == "" || assistConnectionName == vNetItem.connectionName) {
            // keyword가 있는 것들 중에서
            var keywordExist = false
            var keywordLength = keywords.length
            var findCount = 0;
            keywords.forEach(function (keywordValue, keywordIndex) {
                if (vNetItem.name.indexOf(keywordValue) > -1) {
                    findCount++;
                }
            })
            if (keywordLength != findCount) {
                return true;
            }

            var subnetData = vNetItem.subnetInfoList;
            var addedSubnetIndex = 0;// subnet 이 1개 이상인 경우 subnet 으로 인한 index차이를 계산
            console.log(subnetData)
            subnetData.forEach(function (subnetItem, subnetIndex) {
                console.log(subnetItem)
                // console.log(subnetItem.iid)
                var subnetId = subnetItem.name


                html += '<tr onclick="setAssistValue(' + calNetIndex + ');">'

                    + '        <input type="hidden" name="vNetAssist_id" id="vNetAssist_id_' + calNetIndex + '" value="' + vNetItem.id + '"/>'
                    + '        <input type="hidden" name="vNetAssist_connectionName" id="vNetAssist_connectionName_' + calNetIndex + '" value="' + vNetItem.connectionName + '"/>'
                    + '        <input type="hidden" name="vNetAssist_name" id="vNetAssist_name_' + calNetIndex + '" value="' + vNetItem.name + '"/>'
                    + '        <input type="hidden" name="vNetAssist_description" id="vNetAssist_description_' + calNetIndex + '" value="' + vNetItem.description + '"/>'
                    + '        <input type="hidden" name="vNetAssist_cidrBlock" id="vNetAssist_cidrBlock_' + calNetIndex + '" value="' + vNetItem.cidrBlock + '"/>'
                    + '        <input type="hidden" name="vNetAssist_cspVnetName" id="vNetAssist_cspVnetName_' + calNetIndex + '" value="' + vNetItem.cspVNetName + '"/>'

                    + '        <input type="hidden" name="vNetAssist_subnetId" id="vNetAssist_subnetId_' + calNetIndex + '" value="' + subnetItem.id + '"/>'
                    + '        <input type="hidden" name="vNetAssist_subnetName" id="vNetAssist_subnetName_' + calNetIndex + '" value="' + subnetItem.name + '"/>'

                    + '    <td class="overlay hidden" data-th="Name">' + vNetItem.name + '</td>'
                    + '    <td class="btn_mtd ovm td_left" data-th="CidrBlock">'
                    + '        ' + vNetItem.cidrBlock
                    + '    </td>'
                    + '    <td class="btn_mtd ovm td_left" data-th="SubnetId">' + subnetItem.id + "<br>" + subnetItem.ipv4_CIDR

                    + '    </td>'
                    + '    <td class="overlay hidden" data-th="Description">' + vNetItem.description + '</td>'
                    + '</tr>'

                calNetIndex++;
            });
        }
    });

    if (calNetIndex === 0) {
        html += '<tr><td class="overlay hidden" data-th="" colspan="4">No Data</td></tr>'
    }
    $("#assistVnetList").empty()
    $("#assistVnetList").append(html)

    $("#assistVnetList tr").each(function () {
        $selector = $(this)

        $selector.on("click", function () {

            if ($(this).hasClass("on")) {
                $(this).removeClass("on");
            } else {
                $(this).addClass("on")
                $(this).siblings().removeClass("on");
            }
        })
    })
}

// expert mode일 때 나타나는 vnetList
function setNetworkListToExpertMode(data, caller) {
    var html = ""
    if (data.length > 0) {
        totalNetworkListByNamespace = data;
        var keywords = new Array();
        filterNetworkList(keywords, caller);
    }
}

// e_specListTbody 없는 애를 호출하고 있음.
// 현재 namespace에 등록된 모든 spec 목록
var totalVmSpecListByNamespace = new Array()
export function getSpecListCallbackSuccess(caller, data) {
    console.log(data);
    totalVmSpecListByNamespace = data

    if (caller == "addedspec") {
        changeCloudConnection()
    }
}

export function getSpecListCallbackFail(caller, error) {
    // no data
    var html = ""
    html += '<tr>'
        + '<td class="overlay hidden" data-th="" colspan="4">No Data</td>'
        + '</tr>';
    $("#e_specListTbody").empty()
    $("#e_specListTbody").append(html)
}

var totalImageListByNamespace = new Array()
function getImageListCallbackSuccess(caller, data) {
    console.log(data);
    totalImageListByNamespace = data
    if (data == null || data == undefined || data == "null") {

    } else {// 아직 data가 1건도 없을 수 있음
        var html = ""
        if (data.length > 0) {
            data.forEach(function (vImageItem, vImageIndex) {

                html += '<tr onclick="setValueToFormObj(\'es_imageList\', \'tab_vmImage\', \'vmImage\',' + vImageIndex + ', \'e_imageId\');">'
                    + '     <input type="hidden" id="vmImage_id_' + vImageIndex + '" value="' + vImageItem.id + '"/>'
                    + '     <input type="hidden" name="vmImage_connectionName" id="vmImage_connectionName_' + vImageIndex + '" value="' + vImageItem.connectionName + '"/>'
                    + '     <input type="hidden" name="vmImage_info" id="vmImage_info_' + vImageIndex + '" value="' + vImageItem.id + '|' + vImageItem.name + '|' + vImageItem.connectionName + '|' + vImageItem.cspImageId + '|' + vImageItem.cspImageName + '|' + vImageItem.guestOS + '|' + vImageItem.description + '"/>'

                    + '<td class="overlay hidden" data-th="Name">' + vImageItem.name + '</td>'
                    + '<td class="btn_mtd ovm td_left" data-th="ConnectionName">'
                    + vImageItem.connectionName
                    + '</td>'
                    + '<td class="overlay hidden" data-th="CspImageId">' + vImageItem.cspImageId + '</td>'
                    + '<td class="overlay hidden" data-th="CspImageName">' + vImageItem.cspImageName + '</td>'
                    + '<td class="overlay hidden" data-th="GuestOS">' + vImageItem.guestOS + '</td>'
                    + '<td class="overlay hidden" data-th="Description">' + vImageItem.description + '</td>'
                    + '</tr>'
            })
            $("#es_imageListTbody").empty()
            $("#es_imageListTbody").append(html)
        }
    }
}
function getImageListCallbackFail(error) {
    // no data
    var html = ""
    html += '<tr>'
        + '<td class="overlay hidden" data-th="" colspan="4">No Data</td>'
        + '</tr>';
    $("#es_imageListTbody").empty()
    $("#es_imageListTbody").append(html)
}

// 전체 목록에서 filter
function filterSecurityGroupList(keywords, caller) {
    // provider
    // connection
    var assistProviderName = "";
    var assistConnectionName = "";
    var rowCount = 0;
    var html = "";
    // if( caller == "searchSecurityGroupAssistAtReg"){
    //     assistProviderName = $("#assistSecurityGroupProviderName option:selected").val();
    //     assistConnectionName = $("#assistSecurityGroupConnectionName option:selected").val();
    // }
    var selectedConnectionName = $("#assistSecurityGroupConnectionName option:selected").val();
    if (selectedConnectionName) {
        assistConnectionName = selectedConnectionName;
    }
    console.log("assistConnectionName=" + assistConnectionName)
    totalSecurityGroupListByNamespace.forEach(function (vSecurityGroupItem, vSecurityGroupIndex) {
        if (assistConnectionName == "" || assistConnectionName == vSecurityGroupItem.connectionName) {
            // keyword가 있는 것들 중에서
            var keywordExist = false
            var keywordLength = keywords.length
            var findCount = 0;
            keywords.forEach(function (keywordValue, keywordIndex) {
                if (vSecurityGroupItem.name.indexOf(keywordValue) > -1) {
                    findCount++;
                }
            })
            if (keywordLength != findCount) {
                return true;
            }

            var firewallRulesArr = vSecurityGroupItem.firewallRules;
            var firewallRules = firewallRulesArr[0];
            console.log("firewallRules");
            console.log(firewallRules);
            rowCount++;
            html += '<tr>'

                + '<td class="overlay hidden column-50px" data-th="">'
                + '     <input type="checkbox" name="securityGroupAssist_chk" id="securityGroupAssist_Raw_' + vSecurityGroupIndex + '" title="" />'
                + '     <input type="hidden" name="securityGroupAssist_id" id="securityGroupAssist_id_' + vSecurityGroupIndex + '" value="' + vSecurityGroupItem.id + '"/>'
                + '     <input type="hidden" name="securityGroupAssist_name" id="securityGroupAssist_name_' + vSecurityGroupIndex + '" value="' + vSecurityGroupItem.name + '"/>'
                + '     <input type="hidden" name="securityGroupAssist_vNetId" id="securityGroupAssist_vNetId_' + vSecurityGroupIndex + '" value="' + vSecurityGroupItem.vNetId + '"/>'

                + '     <input type="hidden" name="securityGroupAssist_connectionName" id="securityGroupAssist_connectionName_' + vSecurityGroupIndex + '" value="' + vSecurityGroupItem.connectionName + '"/>'
                + '     <input type="hidden" name="securityGroupAssist_description" id="securityGroupAssist_description_' + vSecurityGroupIndex + '" value="' + vSecurityGroupItem.description + '"/>'

                + '     <input type="hidden" name="securityGroupAssist_cspSecurityGroupId" id="securityGroupAssist_cspSecurityGroupId_' + vSecurityGroupIndex + '" value="' + vSecurityGroupItem.cspSecurityGroupId + '"/>'
                + '     <input type="hidden" name="securityGroupAssist_cspSecurityGroupName" id="securityGroupAssist_cspSecurityGroupName_' + vSecurityGroupIndex + '" value="' + vSecurityGroupItem.cspSecurityGroupName + '"/>'
                + '     <input type="hidden" name="securityGroupAssist_firewallRules_cidr" id="securityGroupAssist_firewallRules_cidr_' + vSecurityGroupIndex + '" value="' + firewallRules.cidr + '"/>'
                + '     <input type="hidden" name="securityGroupAssist_firewallRules_direction" id="securityGroupAssist_firewallRules_direction_' + vSecurityGroupIndex + '" value="' + firewallRules.direction + '"/>'

                + '     <input type="hidden" name="securityGroup_firewallRules_fromPort" id="securityGroup_firewallRules_fromPort_' + vSecurityGroupIndex + '" value="' + firewallRules.fromPort + '"/>'
                + '     <input type="hidden" name="securityGroup_firewallRules_toPort" id="securityGroup_firewallRules_toPort_' + vSecurityGroupIndex + '" value="' + firewallRules.toPort + '"/>'
                + '     <input type="hidden" name="securityGroup_firewallRules_ipProtocol" id="securityGroup_firewallRules_ipProtocol_' + vSecurityGroupIndex + '" value="' + firewallRules.ipProtocol + '"/>'

                + '     <label for="td_ch1"></label> <span class="ov off"></span>'
                + '</td>'
                + '<td class="btn_mtd ovm td_left" data-th="Name">'
                + vSecurityGroupItem.name
                + '</td>'
                + '<td class="btn_mtd ovm td_left" data-th="ConnectionName">'
                + vSecurityGroupItem.vNetId
                + '</td>'
                + '<td class="overlay hidden" data-th="Description">' + vSecurityGroupItem.description + '</td>'

                + '</tr>'
        }
    });
    if (rowCount === 0) {
        html += '<tr><td class="overlay hidden" data-th="" colspan="4">No Data</td></tr>'
    }
    $("#assistSecurityGroupList").empty()
    $("#assistSecurityGroupList").append(html)

}
var totalSecurityGroupListByNamespace = new Array();
function getSecurityGroupListCallbackSuccess(caller, data) {
    // expert에서 사용할 securityGroup
    if (data == null || data == undefined || data == "null") {

    } else {// 아직 data가 1건도 없을 수 있음
        if (caller == "vmcreate") {
            var html = ""
            if (data.length > 0) {
                totalSecurityGroupListByNamespace = data;
                var keywords = new Array();
                filterSecurityGroupList(keywords, caller)                
            }
        }
    }
}

function getSecurityGroupListCallbackFail(error) {

}

var totalSshKeyListByNamespace = new Array();
function getSshKeyListCallbackSuccess(caller, data) {
    // expert에서 사용할 sshkey
    if (data == null || data == undefined || data == "null") {

    } else {// 아직 data가 1건도 없을 수 있음
        var html = ""
        if (data.length > 0) {
            totalSshKeyListByNamespace = data;
            var keywords = new Array();
            filterSshKeyList(keywords, caller)            
        }
    }
}

function getSshKeyListCallbackFail(caller, error) {

}

// 등록된 spec조회 성공 시 table에 뿌려주고, 클릭시 spec 내용 set.
function getCommonFilterVmSpecListCallbackSuccess(caller, vmSpecList) {
    // function getCommonFilterVmImageListCallbackSuccess(caller, vmSpecList){
    console.log(vmSpecList);
    if (vmSpecList == null || vmSpecList == undefined || vmSpecList == "null") {

    } else {// 아직 data가 1건도 없을 수 있음
        if (vmSpecList.length > 0) {
            table.setData(vmSpecList)
        }

        if (rowCount === 0) {
            // TO DO: data가 없을 때 표시할 방법
        }  
    }
}

// 전체 목록에서 filter
function filterSshKeyList(keywords, caller) {
    // provider
    // connection
    var assistProviderName = "";
    var assistConnectionName = "";
    var html = "";
    console.log("filter " + caller);
    // if( caller == "searchSshKeyAssistAtReg"){
    //     assistProviderName = $("#assistSshKeyProviderName option:selected").val();
    //     assistConnectionName = $("#assistSshKeyConnectionName option:selected").val();
    // }
    var selectedConnectionName = $("#assistSecurityGroupConnectionName option:selected").val();
    if (selectedConnectionName) {
        assistConnectionName = selectedConnectionName;
    }

    var rowCount = 0;
    totalSshKeyListByNamespace.forEach(function (vSshKeyItem, vSshKeyIndex) {
        if (assistConnectionName == "" || assistConnectionName == vSshKeyItem.connectionName) {
            // keyword가 있는 것들 중에서
            var keywordExist = false
            var keywordLength = keywords.length
            var findCount = 0;
            keywords.forEach(function (keywordValue, keywordIndex) {
                if (vSshKeyItem.name.indexOf(keywordValue) > -1) {
                    findCount++;
                }
            })
            if (keywordLength != findCount) {
                return true;
            }

            rowCount++;
            html += '<tr onclick="setAssistValue(' + vSshKeyIndex + ');">'
                + '     <input type="hidden" id="sshKeyAssist_id_' + vSshKeyIndex + '" value="' + vSshKeyItem.id + '"/>'
                + '     <input type="hidden" id="sshKeyAssist_name_' + vSshKeyIndex + '" value="' + vSshKeyItem.name + '"/>'
                + '     <input type="hidden" id="sshKeyAssist_connectionName_' + vSshKeyIndex + '" value="' + vSshKeyItem.connectionName + '"/>'
                + '     <input type="hidden" id="sshKeyAssist_description_' + vSshKeyIndex + '" value="' + vSshKeyItem.description + '"/>'
                + '<td class="overlay hidden" data-th="Name">' + vSshKeyItem.name + '</td>'
                + '<td class="overlay hidden" data-th="ConnectionName">' + vSshKeyItem.connectionName + '</td>'
                + '<td class="overlay hidden" data-th="Description">' + vSshKeyItem.description + '</td>'
                + '</td>'
                + '</tr>'
        }
    });

    if (rowCount === 0) {
        html += '<tr><td class="overlay hidden" data-th="" colspan="3">No Data</td></tr>'
    }
    $("#assistSshKeyList").empty()
    $("#assistSshKeyList").append(html)

    $("#assistSshKeyList tr").each(function () {
        $selector = $(this)

        $selector.on("click", function () {

            if ($(this).hasClass("on")) {
                $(this).removeClass("on");
            } else {
                $(this).addClass("on")
                $(this).siblings().removeClass("on");
            }
        })
    })
}

// TODO : util에서 호출하는데 mcis생성으로 할 지 vm생성으로 할 지 확인필요
function createRecommendSpec(recSpecName) {
    console.log(recSpecName);

    var specId = recSpecName
    var specName = recSpecName
    var connectionName = $("#t_regRecommendConn").val()
    var cspSpecName = $("#t_regRecommendCspSpec").val()

    if (!specName) {
        mcpjs['util/util'].commonAlert("Input New Spec Name")
        return;
    }

    //var url = "/settings/resources/vmspec"
    console.log("URL : ", url)
    var obj = {
        id: specId,
        name: specName,
        connectionName: connectionName,
        cspSpecName: cspSpecName
    }
    console.log("info image obj Data : ", obj);

    if (specName) {
        var controllerKeyName = "VmSpecReg";
        var optionParamMap = new Map();
        mcpjs["util/pathfinder"].postCommonData('specReg',controllerKeyName,optionParamMap, obj, mcpjs['mcismng/mcisvmcreate'].vmSpecRegCallbackSuccess)

        // client.post(url, obj, {
        //     headers: {
        //         'Content-type': 'application/json',
        //         // 'Authorization': apiInfo,
        //     }
        // }).then(result => {
        //     console.log("result spec : ", result);
        //     var statusCode = result.data.status;
        //     if (statusCode == 200 || statusCode == 201) {
        //         $("#t_regConnectionName").val(connectionName)
        //         $("#t_spec").val(specName)
        //         getCommonVirtualMachineSpecList('addedspec')
        //         mcpjs['util/util'].commonAlert("Success Create Spec!!")
        //         $("#connectionAssist").modal("hide");
        //         $("#recommendVmAssist").modal("hide");

        //     } else {
        //         var message = result.data.message;
        //         mcpjs['util/util'].commonAlert("Fail Create Spec : " + message + "(" + statusCode + ")");
        //     }

        // }).catch((error) => {
        //     console.warn(error);
        //     console.log(error.response)
        //     var errorMessage = error.response.data.error;
        //     var statusCode = error.response.status;
        //    mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
        // });
    } else {
        mcpjs['util/util'].commonlert("Input Spec Name")

        return;
    }
}

// vmSpec 등록 결과 callback
export function vmSpecRegCallbackSuccess(caller, result){
    console.log("result spec : ", result);
    var statusCode = result.data.status;
    if (statusCode == 200 || statusCode == 201) {
        $("#t_regConnectionName").val(connectionName)
        $("#t_spec").val(specName)
        getCommonVirtualMachineSpecList('addedspec')
        mcpjs['util/util'].commonAlert("Success Create Spec!!")
        $("#connectionAssist").modal("hide");
        $("#recommendVmAssist").modal("hide");

    } else {
        var message = result.data.message;
        mcpjs['util/util'].commonAlert("Fail Create Spec : " + message + "(" + statusCode + ")");
    }
}






function clearAssistSpecList(targetTableList) {
    $("#" + targetTableList).empty()
}

function createVmDynamic() {
    var mcis_name = $("#mcis_name").val();
    var mcis_id = $("#mcis_id").val();
    if (!mcis_id) {
        mcpjs["util/util"].commonAlert("Please Select MCIS !!!!!")
        return;
    }

    //var urlParamMap = new Map();
    //    urlParamMap.set(":mcisID", mcis_id)
    //var url = mcpjs['util/pathfinder'].setUrlByParam(mcpjs['util/pathfinder'].getWebToolUrl('McisVmRegDynamicProc'), urlParamMap)
    //var url = "/operation/manages/mcismng/:mcisID/vmdynamic/proc"

    var obj = {}
    obj['name'] = mcis_id;
    //obj['description'] = mcisDesc
    obj['vm'] = mcpjs['mcismng/vmconfigureexpress'].Express_Server_Config_Arr;

    try {
        var controllerKeyName = "McisVmDynamicReg";
        var optionParamMap = new Map();
        optionParamMap.set("{mcisId}", mcis_id)
        mcpjs["util/pathfinder"].postCommonData('vmcreate',controllerKeyName,optionParamMap, obj, mcpjs['mcismng/mcisvmcreate'].mcisVmDynamicRegCallbackSuccess)

        // client.post(url, obj, {

        //     headers: {
        //         //'Content-type': "application/json",
        //     },

        // }).then(result => {
        //     console.log("MCIR Register data : ", result)
        //     console.log("Result Status : ", result.status)
        //     if (result.status == 201 || result.status == 200) {
        //         commonResultAlert("Register requested")
        //     } else {
        //         commonAlert("Register Fail")
        //     }
        // }).catch((error) => {
        //     console.log(error.response)
        //     var errorMessage = error.response.data.error;
        //     var statusCode = error.response.status;
        //     commonErrorAlert(statusCode, errorMessage)

        // })
    } catch (error) {
        mcpjs["util/util"].commonAlert(error);
        console.log(error);
    }
}

// VM Dynamic 생성 callback
export function mcisVmDynamicRegCallbackSuccess(caller, result){
    console.log("MCIR Register data : ", result)
            console.log("Result Status : ", result.status)
            if (result.status == 201 || result.status == 200) {
                mcpjs["util/util"].commonResultAlert("Register requested")
            } else {
                mcpjs["util/util"].commonAlert("Register Fail")
            }
}