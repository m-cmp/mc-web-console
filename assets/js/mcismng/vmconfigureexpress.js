
$(()=> {
	mcpjs['util/util'].addSliderInit()
	$('.btn_recommend_vmspec').on('click', function () {
	  // deploy aligorithm 에 따라 simple/express/export

	  var caller = "MCIS_EXPRESS"
	  var providerId = "";
	  var regionName = "";    
	  var deployAlogorithm = $("#placement_algo").val();	  
	  if( deployAlogorithm == "express"){
		caller = "MCIS_EXPRESS"
		providerId = $("#p_providerId").val();
		regionName = $("#p_regionName").val();    		
	  }else if( deployAlogorithm == "simple"){
		caller = "MCIS_SIMPLE"
		providerId = $("#ss_providerId option:selected").val();
		regionName = $("#ss_regionName option:selected").val();
	  }
	  mcpjs['vmspec/vmspecrecommendassist_modal'].setVmSpecRecommendAssist(caller, providerId, regionName);
	});
  
	//expressDone_btn btn_done
	$('#expressServerConfig .btn_done').on('click', function () {
		expressDone_btn();
	});  
  
  });

// assist를 통해 선택한 spec 정보를 받음
export function setAssistSpecForExpress(specInfo){
	console.log("setAssistSpecForExpress", specInfo)
	var specName = specInfo.SpecName;
	var providerId = specInfo.ProviderId;
	var regionName = specInfo.RegionName;
	//var connectionName = specInfo.ConnectionName;
	
	$("#ep_providerId").val(providerId)
	$("#ep_regionName").val(regionName)
	//$("#ep_connectionName").val(connectionName)
	$("#ep_spec").val(specName)
	$("#ep_imageId").val("ubuntu18.04")
	console.log("setAssist", specInfo)

	// 사용가능한 rootDisk의 Type 조회
	var caller = "MCIS_EXPRESS"
	var controllerKeyName = "AvailableDataDiskTypeList";
	var optionParamMap = new Map();
	optionParamMap.set("providerId", providerId);
	optionParamMap.set("regionName", regionName);
	mcpjs['util/pathfinder'].getCommonData(caller, controllerKeyName, optionParamMap, mcpjs['mcismng/vmconfigureexpress'].getCommonLookupDiskInfoSuccess  );
	//mcpjs['util/pathfinder'].getCommonLookupDiskInfo(caller, providerId, regionName, mcpjs['mcismng/vmconfigureexpress'].getCommonLookupDiskInfoSuccess)
}

// 조회 성공시 callback function
export function getCommonLookupDiskInfoSuccess(caller, result) {
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

	$("#ep_root_disk_type").empty();
	$("#ep_root_disk_type").append(html);

}

// sshkey 목록 조회 성공 시 
function getSshKeyListCallbackSuccessForExpress(caller,data){
	console.log(data);
	var html = ""
	//data = data.SshKeyList
	html += '<option value="">Select SSH Key</option>'
	for (var i in data) {
		html += '<option value="' + data[i].id + '" >' + data[i].cspSshKeyName + '(' + data[i].id + ')</option>';
	}
	$("#ep_sshKey").empty();
	$("#ep_sshKey").append(html);
}

export const Express_Server_Config_Arr = new Array();
var express_data_cnt = 0
function expressDone_btn() {
	// express 는 common resource를 하므로 별도로 처리(connection, spec만)
	//$("#p_provider").val($("#ep_provider").val())
	$("#p_providerId").val($("#ep_providerId").val())
	$("#p_regionName").val($("#ep_regionName").val())
	//$("#p_connectionName").val($("#ep_connectionName").val())
	$("#p_name").val($("#ep_name").val())
	$("#p_description").val($("#ep_description").val())
	$("#p_spec").val($("#ep_spec").val())
	$("#p_subGroupSize").val($("#ep_vm_add_cnt").val() + "")
	$("#p_vm_cnt").val($("#ep_vm_add_cnt").val() + "")

	//var express_form = $("#express_form").serializeObject()
	// commonSpec 으로 set 해야하므로 재설정
	var express_form = {}
	express_form["name"] = $("#p_name").val();
	//express_form["connectionName"] = $("#p_connectionName").val();
	express_form["providerId"] = $("#p_providerId").val();
	//express_form["regionName"] = $("#p_regionName").val();
	express_form["regionName"] = "ap-northeast-1";// for the test
	express_form["description"] = $("#p_description").val();
	express_form["subGroupSize"] = $("#p_subGroupSize").val();
	express_form["commonImage"] = "ubuntu18.04";// 현재 사용가능한 image는 ubuntu18.04뿐.
	//express_form["commonSpec"] = $("#p_spec").val();
	express_form["commonSpec"] = "aws-ap-northeast-1-t2-small";// for the test
	

	console.log("express_form form : ", express_form);

	var server_name = express_form.name
	
	var server_cnt = parseInt(express_form.subGroupSize)
	
	var add_server_html = "";

	Express_Server_Config_Arr.push(express_form)


	var displayServerCnt = '(' + server_cnt + ')'

	add_server_html += '<li onclick="mcpjs[\'mcismng/vmconfigureexpress\'].view_express(\'' + express_data_cnt + '\')">'
		+ '<div class="server server_on bgbox_b">'
		+ '<div class="icon"></div>'
		+ '<div class="txt">' + server_name + displayServerCnt + '</div>'
		+ '</div>'
		+ '</li>';

	// }
	$(".express_servers_config").removeClass("active");

	console.log("add server html");
	$("#mcis_server_list").append(add_server_html)

	//$("#mcis_server_list").prepend(add_server_html)	
	//$("#plusVmIcon").remove();
	//$("#mcis_server_list").prepend(mcpjs['util/common'].getPlusVm ());

	console.log("express btn click and express form data : ", express_form)
	console.log("express data array : ", Express_Server_Config_Arr);
	express_data_cnt++;
	$("#express_form").each(function () {
		this.reset();
	})
	$("#ep_data_disk").val("");

}

function view_express(cnt) {
	console.log('view simple cnt : ', cnt);
	var select_form_data = Simple_Server_Config_Arr[cnt]
	console.log('select_form_data : ', select_form_data);
	$(".express_servers_config").addClass("active")
	$(".simple_servers_config").removeClass("active")
	$(".expert_servers_config").removeClass("active")
	$(".import_servers_config").removeClass("active")

}
