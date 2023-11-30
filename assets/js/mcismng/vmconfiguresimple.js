import "bootstrap";
import "jquery.scrollbar";
import { REGION_MAP, VMSPEC_MAP, VMIMAGE_MAP, MYIMAGE_MAP, DATADISK_MAP, VPC_MAP, SECURITYGROUP_MAP, SSHKEY_MAP } from "../util/util";

$.fn.serializeObject = FormSerializer.serializeObject

$(function () {

    mcpjs['util/util'].addSliderInit();
	// available disk assist
	$('#simpleServerConfig .btn_availabledisk').on('click', function () {
		var caller = "VM_SIMPLE";
		var providerId = $("#ss_providerId option:selected" ).val();
    	var regionName = $("#ss_regionName option:selected" ).val();
		var connectionName = $("#ss_connectionName").val();
        // TODO :사용가능한 datadisk 목록 조회로 변경할 것 (vm 없이 조회하는 것으로)
		mcpjs['datadisk/namespaceavailabledatadisk_modal'].setNamespaceAvailableDatadiskAssist(caller, providerId, regionName, connectionName)
	});
	// done 버튼
	$('#simpleServerConfig .btn_done').on('click', function () {
		console.log(".btn_done")
		simpleDone_btn()
	});

    $("#ss_VNetId").on('change', function() {
        mcpjs['mcismng/vmconfiguresimple'].changeMcisSimpleVPC('mciscreatesimple', 'ss_providerId', 'ss_regionName', 'ss_VNetId');
    });
    
});

// Connection 정보가 바뀌면 등록에 필요한 목록들을 다시 가져온다.(config는 ID가아닌 configName을 사용한다.)
// deprecated. connection -> provider + region으로 변경
function changeConnectionInfo(configName) {
	console.log("config name : ", configName)
	if (configName == "") {
		// 0번째면 selectbox들을 초기화한다.(vmInfo, sshKey, image 등)
	}
	getVmiInfo(configName);
	getSecurityInfo(configName);
	getSSHKeyInfo(configName);
	getVnetInfo(configName);
	getSpecInfo(configName);
}

function getVmiInfo(configName) {

    // VmImageList
	console.log("2 : ", configName);
    var caller = "vmconfiguresimple";
    var actionName = "VmImageList";
    var optionParamMap = new Map();
    optionParamMap.set("{securityGroupId}", securityGroupId);
    mcpjs["util/pathfinder"].getCommonData(
        caller,
        actionName,
        optionParamMap,
        mcpjs["mcismng/mcismng"].getVmImageListCallbackSuccess
    );

	// var url = "/settings/resources/vmimage/"
	// // var url = "http://54.248.3.145:1323/tumblebug/lookupImage";				 
	// var html = "";
	// axios.get(url, {
	// 	// headers:{
	// 	// },
	// 	params: {
	// 		connectionName: configName
	// 	}
	// }).then(result => {
	// 	console.log("Image Info : ", result.data)
	// 	data = result.data.VirtualMachineImageList
	// 	if (!data) {
	// 		mcpjs["util/util"].commonAlert("등록된 이미지 정보가 없습니다.")
	// 		// 		 location.href = "/Image/list"
	// 		return;
	// 	}

	// 	html += "<option value=''>Select OS Platform</option>"
	// 	for (var i in data) {
	// 		if (data[i].connectionName == configName) {
	// 			html += '<option value="' + data[i].id + '" >' + data[i].name + '(' + data[i].id + ')</option>';
	// 		}
	// 	}
	// 	$("#ss_imageId").empty();
	// 	$("#ss_imageId").append(html);//which OS

	// 	//  }).catch(function(error){
	// 	// 	console.log(error);        
	// 	// });
	// }).catch((error) => {
	// 	console.warn(error);
	// 	console.log(error.response)
	// 	var errorMessage = error.response.data.error;
	// 	commonErrorAlert(statusCode, errorMessage)
	// });
}

function getSecurityInfo(configName) {
	var configName = configName;
	if (!configName) {
		configName = $("#ss_connectionName option:selected").val();
	}
	
	var url = "/settings/resources" + "/securitygroup"
	var html = "";

	var default_sg = "";
	axios.get(url, {
		//  headers:{
		//  }
	}).then(result => {
		console.log(result)
		data = result.data.SecurityGroupList
		var cnt = 0
		for (var i in data) {
			if (data[i].connectionName == configName) {
				cnt++;
				html += '<option value="' + data[i].id + '" >' + data[i].cspSecurityGroupName + '(' + data[i].id + ')</option>';
				if (cnt == 1) {
					default_sg = data[i].id
				}


			}
		}

		$("#sg").empty();
		$("#sg").append(html);// TODO : 해당 화면에 id=sg 가 없음.
		$("#s_securityGroupIds").val(default_sg)

	})
}
function getSpecInfo(configName) {
	var configName = configName;
	if (!configName) {
		configName = $("#ss_connectionName option:selected").val();
	}

	var url = "/settings/resources/vmspec/"
	var html = "";
	axios.get(url, {
		// headers:{
		// }
	}).then(result => {
		// console.log(result.data)
		var data = result.data.VmSpecList
		console.log("spec result : ", data)
		if (data) {
			html += "<option value=''>Select Spec</option>"
			data.filter(csp => csp.connectionName === configName).map(item => (
				html += '<option value="' + item.id + '">' + item.name + '(' + item.cspSpecName + ')</option>'
			))

		} else {
			html += ""
		}


		$("#ss_spec").empty();
		$("#ss_spec").append(html);

	})
}
function getSSHKeyInfo(configName) {
	//  var configName = configName;
	if (!configName) {
		configName = $("#ss_connectionName option:selected").val();
	}
	var url = "/settings/resources/sshkey/list"
	var html = "";
	axios.get(url, {
		//  headers:{
		//  }
	}).then(result => {
		console.log("sshKeyInfo result :", result)
		data = result.data.SshKeyList
		html += '<option value="">Select SSH Key</option>'
		for (var i in data) {
			if (data[i].connectionName == configName) {
				html += '<option value="' + data[i].id + '" >' + data[i].cspSshKeyName + '(' + data[i].id + ')</option>';
			}
		}
		$("#ss_sshKey").empty();
		$("#ss_sshKey").append(html);

	})
}


// region 변경시 region 에 해당하는 resource 조회
export function changeMcisSimpleRegion(caller, providerObjId, regionObjId){   
    
    var providerId = $("#" + providerObjId + "  option:selected" ).val();
    var regionName = $("#" + regionObjId + "  option:selected" ).val();
    
    if( providerId == "")return;
    if( regionName == "")return;    

    var actionName=""
    var optionParamMap = new Map();
    var optionParam = ""
    var urlParamMap = new Map();
    var filterKeyValMap =  new Map();
    var mconParamMap = new Map();
    mconParamMap.set("is_cb", "N")
    mconParamMap.set("providerId", providerId)
    mconParamMap.set("regionName", regionName)

    // VPC 조회    // subnet 정보가 vnet안에 있으므로 id만 가져오면 안되고 전체를 가져와야 함.
    //actionName="VpcListByProviderRegionZone"
    actionName="VpcListByRegion";
    optionParamMap.set("is_cb", "N")
    optionParamMap.set("providerId", providerId)
    optionParamMap.set("regionName", regionName)
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['mcismng/vmconfiguresimple'].getVPCListCallbackSuccess);
    
    //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/vmconfiguresimple'].getVPCListCallbackSuccess, mcpjs['mcismng/vmconfiguresimple'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)
    
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
    // actionName="MyImageListByProviderRegionZone"
    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/mciscreate'].getMyImageListCallbackSuccess, mcpjs['mcismng/mciscreate'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // DataDisk 조회
    // actionName="DataDiskListByProviderRegionZone"
    // mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/vmconfiguresimple'].getDataDiskListCallbackSuccess, mcpjs['mcismng/vmconfiguresimple'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)


	// 사용가능한 rootDisk의 Type 조회
	mcpjs['util/pathfinder'].getCommonLookupDiskInfo(caller, providerId, regionName, mcpjs['mcismng/vmconfiguresimple'].getCommonLookupDiskInfoSuccess)
	
    console.log("selectRegion")
}

// 해당 vpc에 해당하는 resource  조회( securityGroup, vmSpec, vmImage, sshKey, datadisk)
// vpc가 선택되면 해당 vpc의 subnet은 임의로 선택한다.
export function changeMcisSimpleVPC(caller, providerObjId, regionObjId, vpcObjId){   
    
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
    // //mconParamMap.set("is_cb", "N")
    // mconParamMap.set("providerId", providerId)
    // mconParamMap.set("regionName", regionName)
    // mconParamMap.set("vpcId", vpcId)

    // // connection이 필요한 경우 VPC_MAP에서 해당 vpc의 connection을 사용한다.
    // console.log("VPC_MAP", VPC_MAP)
    // var vpcMapKey = providerId+"|"+regionName;
    // console.log("vpcMapKey",vpcMapKey)
    // var regionVPCMap =VPC_MAP.get(vpcMapKey)
    // console.log("regionVPCMap",regionVPCMap)
    // var vpcInfo = regionVPCMap.get(vpcId)
    // console.log("vpcInfo",vpcInfo)
    // mconParamMap.set("connectionName", vpcInfo.connectionName)
    var vpcInfo = VPC_MAP.get(vpcId)
	var subnetInfoList = vpcInfo.subnetInfoList;
    var connectionName = vpcInfo.connectionName;
	var initSubnet = "";// 임의의 subnet 사용
	for (var k in subnetInfoList) {
		initSubnet = subnetInfoList[k].id
		break;
	}
    // connection Set
    $("#ss_connectionName").val(connectionName);
	$("#ss_subnetId").val(initSubnet);
    
    var optionParamMap = new Map();
    optionParamMap.set("is_cb", "N")
    optionParamMap.set("providerId", providerId)
    optionParamMap.set("regionName", regionName)
    optionParamMap.set("vpcId", vpcId)
    optionParamMap.set("connectionName", connectionName)

    // SecurityGroup 조회
    actionName = "SecurityGroupList";

    optionParamMap.set("filterKey", "vnetId")
    optionParamMap.set("filterVal", vpcId)
    //optionParam = ""    
    //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/vmconfiguresimple'].getSecurityGroupListCallbackSuccess, mcpjs['mcismng/vmconfiguresimple'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['mcismng/vmconfiguresimple'].getSecurityGroupListCallbackSuccess);

    // SshKeyList 조회
    //optionParam = ""
    //actionName="SshKeyListByProviderRegionZone"
    actionName="SshKeyList"
    optionParamMap.set("filterKey", "connectionName")
    optionParamMap.set("filterVal", connectionName)
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['mcismng/vmconfiguresimple'].getSshKeyListCallbackSuccess);
    //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/vmconfiguresimple'].getSshKeyListCallbackSuccess, mcpjs['mcismng/vmconfiguresimple'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)



    // VmSpec 조회
    //actionName="VmSpecListByProviderRegionZone"
    //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/vmconfiguresimple'].getVMSpecListCallbackSuccess, mcpjs['mcismng/vmconfiguresimple'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)
    actionName="VmSpecList";// TODO : byRegion으로 만들어야 하나?
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['mcismng/vmconfiguresimple'].getVMSpecListCallbackSuccess);
    //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/vmconfiguresimple'].getVMSpecListCallbackSuccess, mcpjs['mcismng/vmconfiguresimple'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // VmImage 조회
    //actionName="VmImageListByProviderRegionZone"
    actionName="VmImageList"
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['mcismng/vmconfiguresimple'].getVMImageListCallbackSuccess);
    //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/vmconfiguresimple'].getVMImageListCallbackSuccess, mcpjs['mcismng/vmconfiguresimple'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // MyImage는 Toggle 할 때 가져온다.
    //actionName="MyImageListByProviderRegionZone"
    actionName="MyImageList"
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['mcismng/vmconfiguresimple'].getMyImageListCallbackSuccess);
    //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/vmconfiguresimple'].getMyImageListCallbackSuccess, mcpjs['mcismng/vmconfiguresimple'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)

    // DataDisk 조회
    //actionName="DataDiskListByProviderRegionZone"
    actionName="DataDiskListByRegion"
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['mcismng/vmconfiguresimple'].getDataDiskListCallbackSuccess);
    //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/vmconfiguresimple'].getDataDiskListCallbackSuccess, mcpjs['mcismng/vmconfiguresimple'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)
   
    // vmSpecList by Region

    // vmImageList by Region

    // sshkeyList by Region

    // dataDiskList by Region
    //diskTypeListByProviderForSelectBox(providerId, usesType, targetSelectBoxID)
    
    // var selectedVPCInfo = VPC_MAP.get(vpcId);
    // console.log("selectedVPCInfo", selectedVPCInfo)
    // var subnetInfoList = selectedVPCInfo.subnetInfoList;
    // var subnetId = "";
    // console.log(subnetInfoList)
    // for (var i in subnetInfoList) {
    //     subnetId = subnetInfoList[i].id;//임의의 1개 선택.
    //     console.log(subnetInfoList[i])
    //     break;
    // }
    // console.log("subnet ", subnetId)
    // $("#ss_subnetId").val(subnetId)
}

// 원래 Connection 선택시 해당 Vnet을 임의로 선택했음.
// Vnet 선택 시 해당 vnet의 subnet 도 임의로 선택했음.
function getVnetInfo(configName) {
	var configName = configName;
	console.log("get vnet INfo config name : ", configName)
	if (!configName) {
		configName = $("#ss_connectionName option:selected").val();
	}
	console.log("get vnet INfo config name : ", configName)
	var url = "/settings/resources/network";

	var html = "";
	var html2 = "";
	axios.get(url, {
		// headers:{
		// }
	}).then(result => {
		data = result.data.VNetList
		// console.log("vNetwork Info : ",result)
		var init_vnet = "";
		var init_subnet = "";
		var v_net_cnt = 0
		var subnet_cnt = 0;
		for (var i in data) {
			if (data[i].connectionName == configName) {
				console.log(data[i].connectionName + " : " + configName);
				console.log(data[i]);
				html += '<option value="' + data[i].id + '" selected>' + data[i].cspVNetName + '(' + data[i].id + ')</option>';
				v_net_cnt++;
				var subnetInfoList = data[i].subnetInfoList
				//if(v_net_cnt == 1){
				init_vnet = data[i].id
				// 	console.log("init_vnet :",init_vnet)
				// }

				for (var k in subnetInfoList) {

					// init_subnet = subnetInfoList[0].IId.NameId
					init_subnet = subnetInfoList[k].id
					// console.log("init_subnet :",init_subnet)

					html2 += '<option value="' + subnetInfoList[k].id + '" >' + subnetInfoList[k].ipv4_CIDR + '</option>';
					// html2 += '<option value="'+subnetInfoList[k].IId.NameId+'" >'+subnetInfoList[k].Ipv4_CIDR+'</option>';
				}
			}
		}
		$("#vnet").empty();
		$("#vnet").append(html);
		$("#subnet").empty();
		$("#subnet").append(html2);

		//setting default
		$("#s_subnetId").val(init_subnet);
		$("#s_vNetId").val(init_vnet);
		console.log("init_vnet=" + init_vnet + ", subnet=" + init_subnet)
	})
}

// vpc 목록 조회 성공 시 호출되는 callback function
export function getVPCListCallbackSuccess(caller, result){
    console.log("vmconfigure simple getVPCListCallbackSuccess")
    console.log(result);
    var data = result.data.VNetList;
    console.log(data)
    for (var i in data) {
        var vpcInfo = data[i];
        // var mapKey = vpcInfo.providerId+"|"+vpcInfo.regionName;// TODO : 해당 정보가 없음. why??
        // if (VPC_MAP.has(mapKey)) {
        //     console.log("vpcInfo map has key ", mapKey)
        //     var vpcRegionMap = VPC_MAP.get(mapKey);
        //     vpcRegionMap.set(vpcInfo.id, vpcInfo)// vpc정보를 id별로 set
        // }else{
        //     console.log("mapKey doesn't have a key", mapKey)
        //     var vpcRegionMap = new Map();
        //     vpcRegionMap.set(vpcInfo.id, vpcInfo)
        //     console.log("vpcRegionMap", vpcRegionMap)
        //     VPC_MAP.set(mapKey, vpcRegionMap);//
        //     console.log("VPC_MAP", VPC_MAP)
        // }
        
        VPC_MAP.set(vpcInfo.id, vpcInfo);// TODO : vpc를 가져온다는 것은 provider를 선택했다는 뜻이겠지?
    }

    if( caller == "mciscreatesimple"){
        var html = ""
        html += '<option selected>Select VPC</option>';
        for (var i in data) {
            var vpcInfo = data[i];            

            //html += '<option value="' + data[i] + '" item="' + data[i] + '">' + data[i] + '</option>';
            html += '<option value="' + vpcInfo.id + '" item="' + vpcInfo.id + '">' + vpcInfo.name + '</option>';            
        }
        console.log("VPC_MAP2=",VPC_MAP)      

        $("[id^='ss_VNetId']").empty()
        $("[id^='ss_VNetId']").append(html)
    }    
}

// 현재 설정된 VPC가 있으면 해당 VPC로 filter
// SecurityGroup이 굳이 region별일 필요는 없을 듯.
export function getSecurityGroupListCallbackSuccess(caller, result){
    console.log(result)
    var data = result.data.SecurityGroupList;
    
    for (var i in data) {
        var securityGroupInfo = data[i];
        var mapKey = securityGroupInfo.vNetId;// tb를 직접호출하는 경우 vpcId 가 아닌 vNetId로 옴.
        if (SECURITYGROUP_MAP.has(mapKey)) {
            console.log("SecurityGroup map has key")
            var securityGroupRegionMap = SECURITYGROUP_MAP.get(mapKey);
            securityGroupRegionMap.set(securityGroupInfo.id, securityGroupInfo)// vpc정보를 id별로 set
            SECURITYGROUP_MAP.set(mapKey, securityGroupRegionMap);
        }else{
            console.log("mapKey doesn't have a key", mapKey)
            var securityGroupRegionMap = new Map();
            securityGroupRegionMap.set(securityGroupInfo.id, securityGroupInfo)
            console.log("securityGroupRegionMap", securityGroupRegionMap)
            SECURITYGROUP_MAP.set(mapKey, securityGroupRegionMap);//
            console.log("SECURITYGROUP_MAP", SECURITYGROUP_MAP)
        }
    }

    if( caller == "mciscreatesimple"){
        var vpcId = $("#ss_VNetId").val();
    

        var html = ""        
        var data = result.data.SecurityGroupList;
        console.log(data)
        
        html += '<option selected>Select Security Group</option>';
        for (var i in data) {
            html += '<option value="' + data[i].id + '" item="' + data[i].name + '">' + data[i].name + '</option>';
        }        
        $("[id^='ss_securityGroupId']").empty()
        $("[id^='ss_securityGroupId']").append(html)
    }
}

// 현재 설정된 VPC가 있으면 해당 VPC의 connection으로 filter
export function getVMSpecListCallbackSuccess(caller, result){
    var data = result.data.VmSpecList;
    //var data = result.VmSpecList;
    console.log(data)
    for (var i in data) {
        var vmSpecInfo = data[i];
        var mapKey = vmSpecInfo.id;
        //var mapKey = vmSpecInfo.providerId+"|"+vmSpecInfo.regionName;
        if (VMSPEC_MAP.has(mapKey)) {
            console.log("vmSpecInfo map has key")
            var vmSpecRegionMap = VMSPEC_MAP.get(mapKey);
            vmSpecRegionMap.set(vmSpecInfo.id, vmSpecInfo)// vpc정보를 id별로 set
        }else{
            console.log("mapKey doesn't have a key", mapKey)
            var vmSpecRegionMap = new Map();
            vmSpecRegionMap.set(vmSpecInfo.id, vmSpecInfo)
            console.log("vmSpecRegionMap", vmSpecRegionMap)
            VMSPEC_MAP.set(mapKey, vmSpecRegionMap);//
            console.log("VMSPEC_MAP", VMSPEC_MAP)
        }
    }

    if( caller == "mciscreatesimple"){
        var html = ""
        html += '<option selected>Select Spec</option>';
        for (var i in data) {
            html += '<option value="' + data[i].id + '" item="' + data[i].name + '">' + data[i].name + '</option>';
           // html += '<option value="' + data[i] + '" item="' + data[i] + '">' + data[i] + '</option>';        
        }        
        $("[id^='ss_spec']").empty()
        $("[id^='ss_spec']").append(html)
    }
}

// 현재 설정된 VPC가 있으면 해당 VPC의 connection으로 filter
export function getVMImageListCallbackSuccess(caller, result){
    //var data = result.VirtualMachineImageList;
    var data = result.data.VirtualMachineImageList;
    console.log(data)

    for (var i in data) {
        var vmImageInfo = data[i];
        //var mapKey = vmImageInfo.providerId+"|"+vmImageInfo.regionName;
        var mapKey = vmImageInfo.id;
        if (VMIMAGE_MAP.has(mapKey)) {
            console.log("vmImageInfo map has key")
            var vmImageRegionMap = VMIMAGE_MAP.get(mapKey);
            vmImageRegionMap.set(vmImageInfo.id, vmImageInfo)// vpc정보를 id별로 set
        }else{
            console.log("mapKey doesn't have a key", mapKey)
            var vmImageRegionMap = new Map();
            vmImageRegionMap.set(vmImageInfo.id, vmImageInfo)
            console.log("vmImageRegionMap", vmImageRegionMap)
            VMIMAGE_MAP.set(mapKey, vmImageRegionMap);//
            console.log("VMIMAGE_MAP", VMIMAGE_MAP)
        }
    }
    
    if( caller == "mciscreatesimple"){
        var html = ""
        html += '<option selected>Select Image</option>';
        for (var i in data) {
            html += '<option value="' + data[i].id + '" item="' + data[i].name + '">' + data[i].name + '</option>';
            //html += '<option value="' + data[i] + '" item="' + data[i] + '">' + data[i] + '</option>';        
        }        
        $("[id^='ss_imageId']").empty()
        $("[id^='ss_imageId']").append(html)
    }
}

// by region
export function getSshKeyListCallbackSuccess(caller, result){
    //console.log(result);
    //var data = result.SshKeyList;
    var data = result.data.SshKeyList;
    console.log("getSshKeyListCallbackSuccess", data)

    for (var i in data) {
        var sshKeyInfo = data[i];
        var mapKey = sshKeyInfo.id;
        //var mapKey = sshKeyInfo.providerId+"|"+sshKeyInfo.regionName;
        if (SSHKEY_MAP.has(mapKey)) {
            console.log("sshKeyInfo map has key")
            var sshKeyRegionMap = SSHKEY_MAP.get(mapKey);
            sshKeyRegionMap.set(sshKeyInfo.id, sshKeyInfo)// vpc정보를 id별로 set
        }else{
            console.log("sshKey map doesn't have a key", mapKey)
            var sshKeyRegionMap = new Map();
            sshKeyRegionMap.set(sshKeyInfo.id, sshKeyInfo)
            console.log("sshKeyRegionMap", sshKeyRegionMap)
            SSHKEY_MAP.set(mapKey, sshKeyRegionMap);//
            console.log("SSHKEY_MAP", SSHKEY_MAP)
        }
    }
        
    if( caller == "mciscreatesimple"){
        var html = ""
        html += '<option selected>Select SSH Key</option>';
        for (var i in data) {
            html += '<option value="' + data[i].id + '" item="' + data[i].name + '">' + data[i].name + '</option>';
            //html += '<option value="' + data[i] + '" item="' + data[i] + '">' + data[i] + '</option>';        
        }        
        $("[id^='ss_sshKey']").empty()
        $("[id^='ss_sshKey']").append(html)
    }
}

export function getMyImageListCallbackSuccess(caller, result){
    //var data = result.myImageInfoList;
    var data = result.data.myImageInfoList;
    console.log(data)
    for (var i in data) {
        var myImageInfo = data[i];
        var mapKey = myImageInfo.providerId+"|"+myImageInfo.regionName;
        if (MYIMAGE_MAP.has(mapKey)) {
            console.log("MYIMAGE_MAP has the key")
            var myImageRegionMap = MYIMAGE_MAP.get(mapKey);
            myImageRegionMap.set(myImageInfo.id, myImageInfo)// vpc정보를 id별로 set
        }else{
            console.log("mapKey map doesn't have a key", mapKey)
            var myImageRegionMap = new Map();
            myImageRegionMap.set(myImageInfo.id, myImageInfo)
            console.log("myImageRegionMap", myImageRegionMap)
            MYIMAGE_MAP.set(mapKey, myImageRegionMap);//
            console.log("MYIMAGE_MAP", MYIMAGE_MAP)
        }
    }

    if( caller == "mciscreatesimple"){
        var html = ""
        html += '<option value="" selected>Select MyImage</option>';
        for (var i in data) {
            html += '<option value="' + data[i].id + '" item="' + data[i].name + '">' + data[i].name + '</option>';
            //html += '<option value="' + data[i] + '" item="' + data[i] + '">' + data[i] + '</option>';        
        }        
        $("[id^='ss_myImageId']").empty()
        $("[id^='ss_myImageId']").append(html)
    }
}

export function getDataDiskListCallbackSuccess(caller, result){
	console.log(result);
    var data = result.data.dataDiskInfoList;
    //var data = result.DataDiskList;
	//var data = result.dataDiskInfoList;
    console.log(data)
    for (var i in data) {
        var dataDiskInfo = data[i];
        var mapKey = dataDiskInfo.providerId+"|"+dataDiskInfo.regionName;
        if (DATADISK_MAP.has(mapKey)) {
            console.log("DATADISK_MAP has the key")
            var dataDiskRegionMap = DATADISK_MAP.get(mapKey);
            dataDiskRegionMap.set(dataDiskInfo.id, dataDiskInfo)// vpc정보를 id별로 set
        }else{
            console.log("mapKey map doesn't have a key", mapKey)
            var dataDiskRegionMap = new Map();
            dataDiskRegionMap.set(dataDiskInfo.id, dataDiskInfo)
            console.log("dataDiskRegionMap", dataDiskRegionMap)
            DATADISK_MAP.set(mapKey, dataDiskRegionMap);//
            console.log("DATADISK_MAP", DATADISK_MAP)
        }
    }
    
    // attach가능한 datadisk 목록 표시
    if( caller == "mciscreatesimple"){
        var html = ""
        html += '<option selected>Select DataDisk</option>';
        for (var i in data) {
            html += '<option value="' + data[i].id + '" item="' + data[i].name + '">' + data[i].name + '</option>';
            //html += '<option value="' + data[i] + '" item="' + data[i] + '">' + data[i] + '</option>';        
        }        
        $("[id^='ss_data_disk']").empty()
        $("[id^='ss_data_disk']").append(html)
    }
}

// 사용가능한 DiskType 표시 : provider, region에 따라 다름.
export function getCommonLookupDiskInfoSuccess(caller, result){
    console.log(result);
    var diskInfoList = result.data.DiskInfoList;
	// rootdisk 의 disktype
	var html = '<option value="">Select Root Disk Type</option>'
	var root_disk_type = [];
	diskInfoList.forEach(item => {
		console.log("item : ", item);
		root_disk_type = item.rootdisktype
		
	})

	root_disk_type.forEach(item => {
		html += '<option value="' + item + '">' + item + '</option>'
	})		

	$("#ss_root_disk_type").empty();
	$("#ss_root_disk_type").append(html);
	
}
// 조회 실패 시 호출되는 callback function
export function getDataCallbackFail(caller, error){
    console.log(caller + " data search failed ", error)
}


// simple의 imageId 나 myImage의 id를 set
export function setSimpleImageId(value) {
    $("#s_imageId").val(value);
}
// simple에서 image와 myImage 항목 보이기/안보이기  TODO : vpc변경시 myImage까지 가져오는데 가져올 필요 없나?
export function toggleMyImage() {
    var providerId = $("#ss_providerId option:selected").val();
    var regionName = $("#ss_regionName option:selected").val();
    //var configName = $("#ss_connectionName").val();
    //if (configName) {
    if( providerId != "" && regionName != ""){
        var toggle_status = $("#ss_vmimage_toggle_status").val();
        console.log("toggle status : ", toggle_status);
        if (toggle_status == "toggle_off") {

            //getVmMyiInfo(configName);
            var caller = "mciscreatesimple"
            var actionName="MyImageList"
            //var actionName="MyImageListByProviderRegionZone"
            var optionParam = ""
            var urlParamMap = new Map();    
            var filterKeyValMap =  new Map();
            var mconParamMap = new Map();
            mconParamMap.set("providerId", providerId)
            mconParamMap.set("regionName", regionName)
            //mcpjs['util/pathfinder'].getCommonResourceList(caller, actionName, mcpjs['mcismng/vmconfiguresimple'].getMyImageListCallbackSuccess, mcpjs['mcismng/vmconfiguresimple'].getDataCallbackFail, urlParamMap, optionParam, filterKeyValMap, mconParamMap)    

            var optionParamMap = new Map();
            optionParamMap.set("is_cb", "N")
            optionParamMap.set("providerId", providerId)
            optionParamMap.set("regionName", regionName)            
            mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['mcismng/vmconfiguresimple'].getMyImageListCallbackSuccess);

            $("#ss_imageId").hide();
            $("#ss_myImageId").show();
            $("#ss_vmimage_toggle_status").val("toggle_on");
            $("#s_imageId").val("");
            $("#ss_imageId").find("option").removeAttr("selected")
        } else {
            $("#ss_vmimage_toggle_status").val("toggle_off");
            $("#ss_imageId").removeAttr("selected")
            $("#ss_imageId").show();
            $("#ss_myImageId").hide();
            $("#s_imageId").val("");
        }
    } else {
        mcpjs["util/util"].commonAlert("Please Select Connection Name");
        return;
    }
}

export const Simple_Server_Config_Arr = new Array();
var simple_data_cnt = 0
const cloneObj = obj => JSON.parse(JSON.stringify(obj))
export function simpleDone_btn() {

    // todo : validate logic 추가할 것
    
	$("#s_providerId").val($("#ss_providerId").val())
	$("#s_regionName").val($("#ss_regionName").val())
	$("#s_name").val($("#ss_name").val())
	$("#s_description").val($("#ss_description").val())
	$("#s_connectionName").val($("#ss_connectionName").val())
	$("#s_vNetId").val($("#ss_VNetId").val())
	$("#s_subnetId").val($("#ss_subnetId").val())
	$("#s_securityGroupIds").val($("#ss_securityGroupId").val())
	
	$("#s_spec").val($("#ss_spec").val())
    
    var toggle_status = $("#ss_vmimage_toggle_status").val();
    if (toggle_status == "toggle_off") {
        $("#s_imageId").val($("#ss_imageId").val())
        $("#s_imageType").val("PublicImage")
    }else{
        $("#s_imageId").val($("#ss_myImageId").val())
        $("#s_imageType").val("MyImage")
        
    }

	
	$("#s_sshKey").val($("#ss_sshKey").val())
	$("#s_vm_cnt").val($("#ss_vm_add_cnt").val() + "")

	// test code
	//var sg = ["aws-sg-c"]
	//$("#s_securityGroupIds").val(sg)

	console.log($("#s_imageId").val());
	console.log($("#ss_imageId").val());
	console.log( $("#simple_form"));
	
	var simple_form = $("#simple_form").serializeObject()
	console.log(simple_form);

	var server_name = simple_form.name
	var server_cnt = parseInt(simple_form.subGroupSize)
	console.log('server_cnt : ', server_cnt)
	var add_server_html = "";

	Simple_Server_Config_Arr.push(simple_form)
	var displayServerCnt = ""
	if (server_cnt > 1) {
		displayServerCnt = '(' + server_cnt + ')'
	}
	add_server_html += '<li onclick="view_simple(\'' + simple_data_cnt + '\')">'
		+ '<div class="server server_on bgbox_b">'
		+ '<div class="icon"></div>'
		+ '<div class="txt">' + server_name + displayServerCnt + '</div>'
		+ '</div>'
		+ '</li>';

	// }
	$(".simple_servers_config").removeClass("active");
	console.log("add server html");
	$("#mcis_server_list").append(add_server_html)
	//$("#mcis_server_list").prepend(add_server_html)	
	//$("#plusVmIcon").remove();// remove 후 prepend하면 script의 event가 안먹음
	//$("#mcis_server_list").prepend(mcpjs['util/common'].getPlusVm ());

	console.log("simple btn click and simple form data : ", simple_form)
	console.log("simple data array : ", Simple_Server_Config_Arr);
	simple_data_cnt++;
	$("#simple_form").each(function () {
		this.reset();
	})
}
function view_simple(cnt) {
	console.log('view simple cnt : ', cnt);
	var select_form_data = Simple_Server_Config_Arr[cnt]
	console.log('select_form_data : ', select_form_data);
	$(".simple_servers_config").addClass("active")
	$(".expert_servers_config").removeClass("active")
	$(".import_servers_config").removeClass("active")

}



// Provider변경시 connection 정보 filter
// function getConnectionListFilterForSimpleSelectbox(referenceObj, targetConnectionObj) {
// 	var referenceVal = $('#' + referenceObj).val();
// 	//var regionValue = region.substring(region.indexOf("]") ).trim();  
// 	// console.log(region + ", regionValue = " + regionValue);
// 	selectBoxFilterByText(targetConnectionObj, referenceVal)


// 	// $("#" + targetConnectionObj + " option:eq(0)").attr("selected", "selected");
// 	$("#es_regConnectionName").val("");
// 	setConnectionValue("");// val("")을 했을 때 자동으로 설정이 안되어서 setConnectionValue("")으로 값 set.

// }

