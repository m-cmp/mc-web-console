import {client} from '/assets/js/util/util'
$(document).ready(function() {


})

// Connection이 선택 되면

var SubnetMap = new Map();
export function getVPCListCallbackSuccess(caller, result){
    console.log("vpc list : ",result)
  
        var html = ""
        var data = result.VNetList;
        console.log(data)
        
        html += '<option selected>Select VPC</option>';
        for (var i in data) {// id목록만 있음

            SubnetMap.set(data[i].id, data[i].subnetInfoList)
            html += '<option value="' + data[i].id + '" item="' + i + '">' + data[i].name + '</option>';        
        } 
        console.log("subnet map : ",SubnetMap)       
        $("[id^='regVNetId']").empty()
       
        $("[id^='regVNetId']").append(html)
  
}

export function getSubnetInfoListForSelectbox(vpcKey){
    // var selected_index = $("#"+vpcTargetID).index($("#"+vpcTargetID + "option:selected"));
    // console.log("selected_index : ",selected_index)
    var subnetInfo = SubnetMap.get(vpcKey)
    console.log("subnetInfo : ",subnetInfo);
    var html = "";

    subnetInfo.forEach(item => {
        html += '<option value="' + item.id + '">' + item.name + '</option>';    
    });
    $("#regSubnetId").empty()
    $("#regSubnetId").append(html)

}
export function getSecurityGroupListForSelectbox(vpcId,providerObjId,regionObjId){
    var providerId = $("#" + providerObjId + "  option:selected" ).val();
    var regionName = $("#" + regionObjId + "  option:selected" ).val();
    
    if( providerId == "")return;
    if( regionName == "")return;    
    var actionName = ""
    var optionParam = ""
    var urlParamMap = new Map();    
    var filterKeyValMap =  new Map();
    var caller = "";

    filterKeyValMap.set("filterKey","vNet")
    filterKeyValMap.set("filterValue",vpcId)
   console.log(filterKeyValMap.get("filterValue"))
    var mconParamMap = new Map();   
    mconParamMap.set("is_cb", "N")
    mconParamMap.set("providerId", providerId)
    mconParamMap.set("regionName", regionName)
    mconParamMap.set("vpcId", vpcId)


    // SecurityGroup 조회
    optionParam = ""
    actionName = "SecurityGroupListByProviderRegionZone"
    mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, getSecurityGroupListCallbackSuccess, getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

}
export function getSecurityGroupListCallbackSuccess(caller, result){
    console.log(result)

        var html = ""        
        var data = result.SecurityGroupList;
        console.log(data)
        
      
        for (var i in data) {
            html += '<option value="' + data[i].id + '" item="' + data[i].name + '">' + data[i].name + '</option>';
        }        
        $("#regSecurityGroupId").empty()
        $("#regSecurityGroupId").append(html)

}
export function changePmksRegion(caller, providerObjId, regionObjId){   
    
    var providerId = $("#" + providerObjId + "  option:selected" ).val();
    var regionName = $("#" + regionObjId + "  option:selected" ).val();
    
    if( providerId == "")return;
    if( regionName == "")return;    

    var actionName=""
    var optionParam = ""
    var urlParamMap = new Map();    
    var filterKeyValMap =  new Map();

    // filterKeyValMap.set("filterKey","vNet")
    // filterKeyValMap.set("filterValue",vpcId)

    var mconParamMap = new Map();   
    mconParamMap.set("is_cb", "N")
    mconParamMap.set("providerId", providerId)
    mconParamMap.set("regionName", regionName)

    // VPC는 ID만 조회
    actionName="VPCListByProviderRegionZone"
    optionParam = ""
    var html = "<option>select Subnet</option>";
    $("#regSubnetId").empty()
    $("#regSubnetId").append(html)
    mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, getVPCListCallbackSuccess, getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // // SecurityGroup 조회
    // optionParam = ""
    // actionName = "SecurityGroupListByProviderRegionZone"
    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getSecurityGroupListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // // VmSpec 조회
    // actionName="VmSpecListByProviderRegionZone"
    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getVMSpecListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // // VmImage 조회
    // actionName="VmImageListByProviderRegionZone"
    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getVMImageListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // // SshKeyList 조회
    // optionParam = ""
    // actionName="SshKeyListByProviderRegionZone"
    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getSshKeyListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // // MyImage는 Toggle 할 때 가져온다.
    // //actionName="MyImageListByProviderRegionZone"
    // //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getMyImageListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // // DataDisk 조회
    // actionName="DataDiskListByProviderRegionZone"
    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getDataDiskListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    console.log("selectRegion")
}
// 조회 실패 시 호출되는 callback function
export function getDataCallbackFail(caller, error){
    console.log(caller + " data search failed ", error)
}

export function changePmksClusterVPC(caller, providerObjId, regionObjId, vpcObjId){   
    
    var providerId = $("#" + providerObjId + "  option:selected").val();
    var regionName = $("#" + regionObjId + "  option:selected").val();
    var vpcId = $("#" + vpcObjId ).val();
    
    if( providerId == "")return;
    if( regionName == "")return;    
    if( vpcId == "")return;
    console.log("vpcID = ", vpcId)

    var actionName=""
    //var optionParam = "id"
    var optionParam = ""
    var urlParamMap = new Map();    
    var filterKeyValMap =  new Map();
    var mconParamMap = new Map();   
    //mconParamMap.set("is_cb", "N")
    mconParamMap.set("providerId", providerId)
    mconParamMap.set("regionName", regionName)
    mconParamMap.set("vpcId", vpcId)

    // SecurityGroup 조회
    optionParam = ""
    actionName = "SecurityGroupListByProviderRegionZone"
    mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getSecurityGroupListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // VmSpec 조회
    actionName="VmSpecListByProviderRegionZone"
    mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getVMSpecListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // VmImage 조회
    actionName="VmImageListByProviderRegionZone"
    mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getVMImageListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // SshKeyList 조회
    optionParam = ""
    actionName="SshKeyListByProviderRegionZone"
    mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getSshKeyListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // MyImage는 Toggle 할 때 가져온다.
    //actionName="MyImageListByProviderRegionZone"
    //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getMyImageListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // DataDisk 조회
    actionName="DataDiskListByProviderRegionZone"
    mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getDataDiskListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)
   

    actionName="SshKeyListByProviderRegionZone"
    mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getSshKeyListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)


    //getVpcListByRegionForSelectbox(providerObj, regionName, targetSelectBoxID)
    //<input type="hidden" name="vNetId" id="s_vNetId" value="aws-vpc-a"/>

    // vmSpecList by Region

    // vmImageList by Region

    // sshkeyList by Region

    // dataDiskList by Region
    //diskTypeListByProviderForSelectBox(providerId, usesType, targetSelectBoxID)
    console.log("selectRegion")
}
function validateCluster(){
    var clusterName = $("#cluster_info_name").val();

    var regProvider = $("#regProvider").val();
    var regRegionName = $("#regRegionName").val();
    
    var regVNetId = $("#regVNetId").val();
    var regSubnetId = $("#regSubnetId").val();
    var regSecurityGroupId = $("#regSecurityGroupId").val();
    
    if (!clusterName) {        
        mcpjs["util/util"].commonAlert("Please Input Cluster Name");
        $("#cluster_info_name").focus()
        return false;
    }

    if (!regProvider) {
        mcpjs["util/util"].commonAlert("Please Select Provider");
        return false;
    }
    if (!regRegionName) {
        mcpjs["util/util"].commonAlert("Please Select Region");
        return false;
    }
    if (!regVNetId) {
        mcpjs["util/util"].commonAlert("Please Select VPC");
        return false;
    }
    if (!regSubnetId) {
        mcpjs["util/util"].commonAlert("Please Select Subnet");
        return false;
    }
    if (!regSecurityGroupId) {
        mcpjs["util/util"].commonAlert("Please Select Security Group");
        return false;
    }

    var selectedSubnets = [];
    var hasEmptyValue = false;
    $.each($("#regSubnetId option:selected"), function(){   
        if( $(this).val() == ""){            
            hasEmptyValue = true;
            return false;
        }
        selectedSubnets.push($(this).val());
    });
    if( hasEmptyValue){
        mcpjs["util/util"].commonAlert("Please Select Subnet")
        return false;
    }
    if( selectedSubnets.length == 0){
        mcpjs["util/util"].commonAlert("Please Select Subnet")
        return false;
    }
    
    var selectedSecurityGroups = [];
    $.each($("#regSecurityGroupId option:selected"), function(){            
        if( $(this).val() == ""){
            hasEmptyValue = true;
            return false;
        }
        selectedSecurityGroups.push($(this).val());
    });
    if( hasEmptyValue){
        mcpjs["util/util"].commonAlert("Please Select Security Group")
        return false;
    }
    if( selectedSubnets.length == 0){
        mcpjs["util/util"].commonAlert("Please Select Security Group")
        return false;
    }
    
    
    return true;
}

export function createCluster(){
    if ( validateCluster() ){
        var clusterName = $("#cluster_info_name").val();
        var clusterVersion = $("#cluster_info_version").val();

        var regProvider = $("#regProvider").val();
        var regRegionName = $("#regRegionName").val();
       
        var regVNetId = $("#regVNetId").val();
        var regSubnetId = $("#regSubnetId").val();
        var regSecurityGroupId = $("#regSecurityGroupId").val();

        var selectedSubnets = [];
        $.each($("#regSubnetId option:selected"), function(){   
            if( $(this).val() == ""){
                mcpjs["util/util"].commonAlert("Please Select Subnet")
                return false;
            }
            selectedSubnets.push($(this).val());
        });
        var selectedSecurityGroups = [];
        $.each($("#regSecurityGroupId option:selected"), function(){            
            if( $(this).val() == ""){
                mcpjs["util/util"].commonAlert("Please Select Security Group")
                return false;
            }
            selectedSecurityGroups.push($(this).val());
        });

        var new_obj = {}
        var clusterReqInfo = {}
        clusterReqInfo["Name"] = clusterName;
        clusterReqInfo["Version"] = clusterVersion;
        clusterReqInfo["regionName"] = regRegionName;
        clusterReqInfo["providerId"] = regProvider;
        clusterReqInfo["VPCName"] = regVNetId;
        clusterReqInfo["SubnetNames"] = selectedSubnets;
        clusterReqInfo["SecurityGroupNames"] = selectedSecurityGroups;

        //new_obj['ConnectionName'] = regConnectionName
        new_obj['ReqInfo'] = clusterReqInfo
            
        console.log(new_obj)

        var url = mcpjs['util/pathfinder'].getWebToolUrl("PmksClusterRegProc")
        console.log(url)
        try {
            client.post(url, new_obj, {
                // headers: {
                //     'Content-type': "application/json",
                // },
            }).then(result => {
                console.log("PMKS Register data : ", result);
                console.log("Result Status : ", result.status);
                if (result.status == 201 || result.status == 200) {
                    mcpjs["util/util"].commonResultAlert("Register Requested")

                    // 생성요청이 완료되었습니다. 관리화면으로 이동합니다.
                    //changePage("PmksMngForm")
                } else {
                    mcpjs["util/util"].commonAlert("Register Fail")
                }
            }).catch((error) => {
                console.warn(error);
                //console.log(error.response)
                //var errorMessage = error.response.data.error;
                //var statusCode = error.response.status;
                //commonErrorAlert(statusCode, errorMessage)
    
            })
        } catch (error) {
            mcpjs["util/util"].commonAlert(error);
            console.log(error);
        }
    }
}
