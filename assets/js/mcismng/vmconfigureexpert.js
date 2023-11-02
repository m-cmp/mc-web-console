import { Modal } from "bootstrap";
$.fn.serializeObject = FormSerializer.serializeObject

$(()=> {
  
  mcpjs['util/util'].addSliderInit();
  //tab menu Server / OS_HW /	Network / Security / Other 위치 표시
  $('.create_tab .nav a').on('click', function () {     
    var idx = $(".create_tab .nav a").index(this);
    console.log(".create_tab .nav a ", idx)
    for (var i = 0; i < $(".create_tab .nav a").length; i++) {
      if (i == idx) {
        $('.config_location > div').removeClass('on');
        $('.config_location > div > span').eq(idx).parent().addClass('on');
      }
    }
  });
  //tab 내용 다음
  $('.create_tab .btn_next').on('click', function () { 
    console.log(".create_tab .btn_next ")
    var $active = $('.create_tab .nav li > .active');
    $active.parent().next().find('.nav-link').removeClass('disabled');
    nextTab($active);
  });

  //tab 내용 이전
  $('.create_tab .btn_prev').on('click', function () {   
    console.log(".create_tab .btn_prev ")
    var $active = $('.create_tab .nav li > a.active');
    prevTab($active);
  });

  
  // TODO : btn_assist가 없음. Deployment_box 도 필요없을 듯. 확인하고 삭제
  $('.btn_assist').on('click', function () {
    console.log("btn_assist click--")
    $("#Deployment_box").modal();
    //$('.scrollbar-inner').scrollbar();
  });

  // vm image assist 클릭 시
  $('#OS_HW .btn_namespace_vm_image').on('click', function () {
    console.log("os_hw image assist ")

    // 현재 mode : mcis expert
    var caller = "MCIS_EXPERT"
    //var deployAlogorithm = $("#placement_algo").val();// OS_HW 나오는 부분이 MCIS의 Expert Mode일 때임
    

    var providerId = $("#es_providerId option:selected").val();
    var regionName = $("#es_regionName option:selected").val();
    var connectionName = $("#e_connectionName").val();    
    mcpjs['vmimage/namespacevmimage_modal'].setNamespaceVmImageAssist(caller, providerId, regionName, connectionName);
  });

  // my image assist 클릭 시
  $('#OS_HW .btn_namespace_myimage').on('click', function () {
    console.log("os_hw image assist ")

    // 현재 mode : mcis expert
    var caller = "MCIS_EXPERT"
    //var deployAlogorithm = $("#placement_algo").val();// OS_HW 나오는 부분이 MCIS의 Expert Mode일 때임    

    var providerId = $("#es_providerId option:selected").val();
    var regionName = $("#es_regionName option:selected").val();
    var connectionName = $("#e_connectionName").val();    
    mcpjs['myimage/namespacemyimage_modal'].setNamespaceMyImageAssist(caller, providerId, regionName, connectionName);
  });

  $('#OS_HW .btn_namespace_vm_spec').on('click', function () {
    console.log("os_hw spec assist ")

    // 현재 mode : mcis expert
    var caller = "MCIS_EXPERT"
    //var deployAlogorithm = $("#placement_algo").val();// OS_HW 나오는 부분이 MCIS의 Expert Mode일 때임
    
    $("#namespaceVmspecAssist").modal("toggle")// 자동으로 뜨지 않아 강제로 띄움. 닫을때도 호출 필요
    console.log("toggle")
    var providerId = $("#es_providerId option:selected").val();
    var regionName = $("#es_regionName option:selected").val();
    var connectionName = $("#e_connectionName").val();    
    mcpjs['vmspec/namespacevmspec_modal'].setNamespaceVmSpecAssist(caller, providerId, regionName, connectionName);
  });

  // image, spec은 해당 popup에서 provider를 선택하지만 vpc, security group, sshkey 등은 provider, region 등 선행값이 있음.
  // 해당 목록을 우선으로 조회시킴.
  $('#Network .btn_network').on('click', function () {
      // provider, region은 선택되어있어야 함. popup으로 전달
      console.log(".btn_network clicked")
      var caller = "MCIS_EXPERT"
      var providerId = $("#es_providerId option:selected").val();
      var regionName = $("#es_regionName option:selected").val();
      var connectionName = $("#e_connectionName").val();
      mcpjs['network/namespacevpc_modal'].setNamespaceVpcAssist(caller, providerId, regionName, connectionName);
  });

  $('#Security .btn_securityGroup').on('click', function () {
    // provider, region, provider는 선택되어있어야 함. popup으로 전달
    console.log(".btn_securityGroup clicked")
    var caller = "MCIS_EXPERT"
    var providerId = $("#es_providerId option:selected").val();
    var regionName = $("#es_regionName option:selected").val();
    var vpcId = $("#e_vNetId").val();// network tab에서 선택 된 vpcId
    console.log("vpcId", vpcId)
    if ( vpcId == ""){
      mcpjs['util/util'].commonAlert("Please Select a vpc first"); return;
    }
    mcpjs['securitygroup/namespacesecuritygroup_modal'].setNamespaceSecurityGroupAssist(caller, providerId, regionName, vpcId);
  });

  $('#Security .btn_sshKey').on('click', function () {
    // provider, region, provider는 선택되어있어야 함. popup으로 전달
    console.log(".btn_sshKey clicked")
    var caller = "MCIS_EXPERT"
    var providerId = $("#es_providerId option:selected").val();
    var regionName = $("#es_regionName option:selected").val();
    var connectionName = $("#e_connectionName").val();
    mcpjs['sshkey/namespacesshkey_modal'].setNamespaceSshKeyAssist(caller, providerId, regionName, connectionName);
  });

  // Region 변경시 발생하는 Event 호출
  $('#es_regionName').on('change', function () {
    var caller = "MCIS_EXPERT"
    var providerObjId = "es_providerId";
    var regionObjId = "es_regionName";    
    changeMcisExpertRegion(caller, providerObjId, regionObjId)
  });

  //Server Configuration clear
  $('.btn_clear').on('click', function () {  
    //$('.svc_ipbox').find('input, textarea').val('');
    $("#es_name").val('');
    $("#es_description").val('');
    $("#es_regConnectionName").val('');
    setConnectionValue("");

    osHardwareClear();
    vnetClear();
    vmSecurityClear();
  });

  //OS_HW - Clear
  $('#OS_HW .btn_clear').on('click', function () {
    osHardwareClear();
  });
  //Network - Clear
  $('#Network .btn_clear').on('click', function () {
    vnetClear();
  });
  //Security - Clear
  $('#Security .btn_clear').on('click', function () {
    vmSecurityClear();
  });  
  //Other - Clear
  $('#Other .btn_clear').on('click', function () {
    $('#Other .tab_ipbox').find('input, textarea').val('');
  });

});

//////// Tab Clear //////
function osHardwareClear() {
  $("#tab_vmImageInfo").val("");
  $("#e_imageId").val("");

  $("#tab_vmSpecInfo").val("");
  $("#e_specId").val("");
}

function vnetClear() {
  $("#tab_vNetInfo").val("");
  $("#e_vNetId").val("");
  $("#e_subnetId").val("");
}

function vmSecurityClear() {
  clearCheckbox("securityGroup_chk");
  $("#tab_securityGroupInfo").val("");
  $("#e_securityGroupIds").val("");

  $("#tab_sshKeyInfo").val("");
  $("#e_sshKeyId").val("");

  $("#es_vmUserAccount").val("");
  $("#es_vmUserPassword").val("");

}

// multi 선택되는 checkbox를 한번에 초기화
function clearCheckbox(chkboxName) {
  $('input:checkbox[name="' + chkboxName + '"]').prop('checked', false);
}

// region 변경시 
// vpc, spec, ssh key 등의 resource는 popup을 통해 connection이 선택되면 해당 리소스로 가져옴. 
// disktype목록만 provider, region 필요
export function changeMcisExpertRegion(caller, providerObjId, regionObjId){   
  console.log("changeMcisExpertRegion", caller)
  var providerId = $("#" + providerObjId + "  option:selected" ).val();
  var regionName = $("#" + regionObjId + "  option:selected" ).val();
  
  if( providerId == "")return;
  if( regionName == "")return;    

  // 사용가능한 rootDisk의 Type 조회
  mcpjs['util/pathfinder'].getCommonLookupDiskInfo(caller, providerId, regionName, mcpjs['mcismng/vmconfigureexpert'].getCommonLookupDiskInfoSuccess)

}

// 1. tempConnection에는 값이 set되어 있어야 함.
// 2. 돌면서 connectionName이 다르면 uncheck
function uncheckDifferentConnectionAtSecurityGroup() {
  var tempConnectionNameValue = $("#t_connectionName").val();
  clearCheckboxByConnectionName('securityGroup_chk', tempConnectionNameValue);
  // 체크 된 securityGroup으로 재 설정
  setMuipleValueToFormObj('securityGroup_chk', 'tab_securityGroupInfo', 'e_securityGroupIds');
}

// 체크 된 박스에서 connectionName이 다르면 체크해제
//
function clearCheckboxByConnectionName(chkboxName, connectionName) {

  $('input:checkbox[name="' + chkboxName + '"]').each(function () {
    if (this.checked) {//checked 처리된 항목의 값
      var chkIdArr = $(this).attr('id').split("_");// 0번째와 2번째를 합치면 id 추출가능  ex) securityGroup_Raw_0
      console.log("clearCheckboxByConnectionName = ");
      var securityGroupId = $("#" + chkIdArr[0] + "_id_" + chkIdArr[2]).val()//id="securityGroup_id_{{$securityGroupIndex}}"
      securityGroupConnectionName = $("#" + chkIdArr[0] + "_connectionName_" + chkIdArr[2]).val()
      if (securityGroupConnectionName != connectionName) {
        console.log("체크 해제하자 = ");
        this.checked = false;// 체크 해제
        console.log("체크 해제완료 = ");
      }
    }
  });
}

//next
export function nextTab(elem) {
  $(elem).parent().next().find('a[data-toggle="tab"]').click();
}
//prev
export function prevTab(elem) {
  $(elem).parent().prev().find('a[data-toggle="tab"]').click();
}

// 사용가능한 DiskType 표시 : provider, region에 따라 다름.
export function getCommonLookupDiskInfoSuccess(caller, result){
  console.log(result);
  var diskInfoList = result.data.DiskInfoList;
  console.log(diskInfoList);
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

	$("#tab_others_root_disk_type").empty();
	$("#tab_others_root_disk_type").append(html);
	
}
// 조회 실패 시 호출되는 callback function
export function getDataCallbackFail(caller, error){
    console.log(caller + " data search failed ", error)
}


export const Expert_Server_Config_Arr = new Array();
var expert_data_cnt = 0
const expertServerCloneObj = obj => JSON.parse(JSON.stringify(obj))
export function expertDone_btn() {
  console.log("expert Done")
  // TODO : 원래는 같은 VM 을 여러개 만들 때 vmGroupSize를 set 하는 것 같은데... for문으로 돌리고 있음.... 고칠까?
  // $("#e_vmGroupSize").val( $("#es_vm_add_cnt").val() )
  // validation check 
  if ($("#e_name").val() == "") { mcpjs['util/util'].commonAlert("VM Name is required"); return; }
  //if ($("#e_connectionName").val() == "") { mcpjs['util/util'].commonAlert("Connection is required"); return; }
  if ($("#e_vNetId").val() == "") { mcpjs['util/util'].commonAlert("vNet is required"); return; }
  if ($("#e_subnetId").val() == "") { mcpjs['util/util'].commonAlert("Subnet is required"); return; }
  if ($("#e_securityGroupIds").val() == "") { mcpjs['util/util'].commonAlert("SecurityGroup is required"); return; }
  if ($("#e_sshKeyId").val() == "") { mcpjs['util/util'].commonAlert("SSH Key is required"); return; }
  if ($("#e_imageId").val() == "") { mcpjs['util/util'].commonAlert("VM Image is required"); return; }
  if ($("#e_specId").val() == "") { mcpjs['util/util'].commonAlert("VM Spec is required"); return; }


  $("#e_vm_add_cnt").val($("#es_vm_add_cnt").val());// 추가수량 값을 form에 추가.

  // expertForm에는 vm생성에 필요한 값들만 있음.
  var expert_form = $("#expert_form").serializeObject()
  var server_name = expert_form.name
  var server_cnt = parseInt(expert_form.vmAddCount) // expert
  console.log('server_cnt : ', server_cnt)
  var add_server_html = "";

  if (server_cnt > 1) {
    for (var i = 1; i <= server_cnt; i++) {
      var new_vm_name = server_name + "-" + i;
      var object = cloneObj(expert_form)
      object.name = new_vm_name

      add_server_html += '<li onclick="view_simple(\'' + expert_data_cnt + '\')">'
        + '<div class="server server_on bgbox_b">'
        + '<div class="icon"></div>'
        + '<div class="txt">' + new_vm_name + '</div>'
        + '</div>'
        + '</li>';
      Expert_Server_Config_Arr.push(object)
      console.log(i + "번째 Expert form data 입니다. : ", object);
    }
  } else {
    Expert_Server_Config_Arr.push(expert_form)
    add_server_html += '<li onclick="view_simple(\'' + expert_data_cnt + '\')">'
      + '<div class="server server_on bgbox_b">'
      + '<div class="icon"></div>'
      + '<div class="txt">' + server_name + '</div>'
      + '</div>'
      + '</li>';

  }
  $(".expert_servers_config").removeClass("active");
  $("#mcis_server_list").prepend(add_server_html)
  // $("#mcis_server_list").append(add_server_html)
  $("#plusVmIcon").remove();
  $("#mcis_server_list").prepend(mcpjs['util/common'].getPlusVm ());
  console.log("expert btn click and expert form data : ", expert_form)
  console.log("expert data array : ", Expert_Server_Config_Arr);
  expert_data_cnt++;
  $("#expert_form").each(function () {
    this.reset();
  })
}



// 조회조건인 connection 변경시 호출.
// TODO : 실제 connectionVal이 바뀌는것이 아니라. 다른 것들의 조회 조건 filter의 기본값으로 set.
function setConnectionValue(connName) {
  console.log(" connection change")
  var connectionObj = $("#e_connectionName");
  var tempConnectionObj = $("#t_connectionName");
  if (connName == "") {
    connectionObj.val(connName);
    tempConnectionObj.val(connName);
    return;
  }

  if (connectionObj.val() == "") {// 비어있으면 그냥 set
    console.log(" initial connName")
    connectionObj.val(connName);
  } else if (connectionObj.val() != connName) {
    console.log(" diff connName " + connName + " : " + connectionObj.val())
    tempConnectionObj.val(connName);
    commonConfirmOpen("DifferentConnection")
  } else {

  }
}

// 다른 connectinName으로 set 할 때 기존에 있던 것들 중 connectionName이 다른 것들은 초기화
function setAndClearByDifferentConnectionName(caller) {
  var tempConnectionName = $("#t_connectionName").val();
  console.log("setAndClearByDifferentConnectionName " + tempConnectionName);
  //$("#expert_form").reset();// 이거하면 싹 날아가므로 connectionName이 다른 항목들만 초기화.

  $("#e_connectionName").val(tempConnectionName);

  if ($("#tab_vmImageConnectionName").val() != tempConnectionName) {
    console.log("clear tab_vmImageConnectionName " + $("#tab_vmImageConnectionName").val());
    $("#e_imageId").val("");
    $("#tab_vmImageInfo").val("")
    $("#tab_vmImageConnectionName").val("")
  }
  if ($("#tab_vmSpecConnectionName").val() != tempConnectionName) {
    console.log("clear tab_vmSpecConnectionName " + $("#tab_vmSpecConnectionName").val());
    $("#e_specId").val("");
    $("#tab_vmSpecInfo").val("");
    $("#tab_vmSpecConnectionName").val("")
  }
  // vnet
  // if( $("#tab_securityGroupConnectionName").val() != tempConnectionName ){
  //   console.log("clear tab_vmImageConnectionName " + $("#tab_securityGroupConnectionName").val());
  //   $("#e_securityGroupIds").val("");
  //   $("#tab_securityGroupConnectionName").val("")
  // }

  if ($("#tab_securityGroupConnectionName").val() != tempConnectionName) {
    console.log("clear tab_securityGroupConnectionName " + $("#tab_securityGroupConnectionName").val());
    $("#e_securityGroupIds").val("");
    $("#tab_securityGroupInfo").val("")
    $("#tab_securityGroupConnectionName").val("")
  }
  if ($("#tab_sshKeyConnectionName").val() != tempConnectionName) {
    console.log("clear tab_sshKeyConnectionName " + $("#tab_sshKeyConnectionName").val());
    $("#e_sshKeyId").val("");
    $("#tab_sshKeyInfo").val("")
    $("#tab_sshKeyConnectionName").val("")
  }
}

// Popup에서 Apply버튼 클릭 시 받을 data function
// assistMap이 key, value 형태의 map일 수도 있고 key, array 형태일 수도 있어서 caller에 따라 달리 처리한다.
export function setValuesFromAssist(caller, assistMap){
  console.log("setValuesFromAssist", caller)
  console.log("assistMap", assistMap)

  // 해당 값 set
  if (caller == "NamespaceVmImageAssist" || caller == "NamespaceMyImageAssist" ){
    var targetPrefix = "tab_vmImage_";

    console.log("vmImageAssist----")
    console.log(targetPrefix + "cspImageId")

    var connectionName = assistMap.get("connectionName")
    
    $("#" + targetPrefix + "id").val(assistMap.get("id"));
    $("#" + targetPrefix + "name").val(assistMap.get("name"));
    $("#" + targetPrefix + "cspImageId").val(assistMap.get("cspImageId"));
    $("#" + targetPrefix + "cspImageName").val(assistMap.get("cspImageName"));
    $("#" + targetPrefix + "guestOS").val(assistMap.get("guestOS"));
    $("#" + targetPrefix + "description").val(assistMap.get("description"));
    $("#" + targetPrefix + "connectionName").val(connectionName);

    //$("#namespaceVmImageAssist").modal("toggle");
    $("#namespaceVmImageAssist").modal("hide");
    
    console.log($("#namespaceVmImageAssist"));

    $("#e_imageId").val(assistMap.get("id"));

    // 지정된 connection 이 없으면 해당 connection으로 set
    if ($("#e_connectionName").val() == "") {
      $("#e_connectionName").val(connectionName);
      
      // TODO : 굳이 connection정보를 갱신해야할까? 주석처리 함.
      //mcpjs['util/util'].getCommonConnectionInfo(caller, connectionName, mcpjs['mcismng/vmconfigureexpert'].setProviderRegionByConnectionValue);
    }else if ( $("#e_connectionName").val() != connectionName){
      // connection이 다름... 어쩔??
      console.log($("#e_connectionName").val() + " : " + connectionName)
      mcpjs['util/util'].commonAlert("connection이 다름");// confirm해서 수락하면 기존값 초기화 하고 set.
      return
    }

  }else if (caller == "NamespaceVmSpecAssist"){
    var targetPrefix = "tab_vmSpec_";

    console.log("vmSpecAssist----")
    console.log(targetPrefix + "cspVmSpecId")
    
    $("#" + targetPrefix + "id").val(assistMap.get("id"));
    $("#" + targetPrefix + "name").val(assistMap.get("name"));
    $("#" + targetPrefix + "cspSpecId").val(assistMap.get("cspSpecId"));
    $("#" + targetPrefix + "cspSpecName").val(assistMap.get("cspSpecName"));
    $("#" + targetPrefix + "memGiB").val(assistMap.get("memGiB"));
    $("#" + targetPrefix + "numvCPU").val(assistMap.get("numvCPU"));
    $("#" + targetPrefix + "numGpu").val(assistMap.get("numGpu"));
    $("#" + targetPrefix + "providerId").val(assistMap.get("providerId"));
    $("#" + targetPrefix + "regionName").val(assistMap.get("regionName"));
    $("#" + targetPrefix + "connectionName").val(assistMap.get("connectionName"));

    $("#namespaceVmspecAssist").modal("toggle")// 자동으로 닫히지 않아 강제로 닫음
    //$("#namespaceVmSpecAssist").modal("hide");
    console.log($("#namespaceVmSpecAssist"))
    $("#e_specId").val(assistMap.get("id"));
    
    // 지정된 connection 이 없으면 해당 connection으로 set  
    if ($("#e_connectionName").val() == "") {
      $("#e_connectionName").val(assistMap.get("connectionName"));
    }else if ( $("#e_connectionName").val() != assistMap.get("connectionName")){
      // connection이 다름... 어쩔??
      console.log($("#e_connectionName").val() + " : " + assistMap.get("connectionName"))
      mcpjs['util/util'].commonAlert("connection이 다름");
      return
    }
  }else if (caller == "NamespaceVpcAssist") {
    // VPC의 subnet은 1개만 가능
    var targetPrefix = "tab_vNet_";

    $("#" + targetPrefix + "id").val(assistMap.get("id"));
    $("#" + targetPrefix + "name").val(assistMap.get("name"));
    $("#" + targetPrefix + "description").val(assistMap.get("description"));
    $("#" + targetPrefix + "cidrBlock").val(assistMap.get("cidrBlock"));
    $("#" + targetPrefix + "cspVnetName").val(assistMap.get("cspVnetName"));
    $("#" + targetPrefix + "subnetId").val(assistMap.get("subnetId"));
    $("#" + targetPrefix + "subnetName").val(assistMap.get("subnetName"));
    $("#" + targetPrefix + "connectionName").val(assistMap.get("connectionName"));

    // 전체 정보에 set : tab_vNet_subnetId
    $("#e_vNetId").val($("#" + targetPrefix + "id").val());
    $("#e_subnetId").val($("#" + targetPrefix + "subnetId").val());

    // 지정된 connection 이 없으면 해당 connection으로 set  
    if ($("#e_connectionName").val() == "") {
      $("#e_connectionName").val(assistMap.get("connectionName"));
    }else if ( $("#e_connectionName").val() != assistMap.get("connectionName")){
      // connection이 다름... 어쩔??
      console.log($("#e_connectionName").val() + " : " + assistMap.get("connectionName"))
      mcpjs['util/util'].commonAlert("connection이 다름");
      return
    }
    
  }else if (caller == "NamespaceSecurityGroupAssist") {
    // Security Group은 여러개 가능
    var targetPrefix = "tab_securityGroup_";
    var targetSubPrefix = "tab_securityGroup_firewallRules_"
    var securityGroupIdList = new Array();
    var securityGroupConnection = "";
    
    for (let securityGroupMapKey of assistMap.keys()) {
      var securityGroupMap = assistMap.get(securityGroupMapKey);
      console.log("securityGroupMapKey = ", securityGroupMapKey)
      console.log("securityGroupMap = ", securityGroupMap)
      securityGroupIdList.push(securityGroupMap.get("id"))

      securityGroupConnection = securityGroupMap.get("connectionName")

      $("#" + targetPrefix + "id").val(securityGroupMap.get("id"));
      $("#" + targetPrefix + "name").val(securityGroupMap.get("name"));
      $("#" + targetPrefix + "vpcId").val(securityGroupMap.get("vpcId"));
      $("#" + targetPrefix + "description").val(securityGroupMap.get("description"));
      $("#" + targetPrefix + "connectionName").val(securityGroupMap.get("connectionName"));

      // firewall 도 여러개 가능한데 popup에서 1개만 set
      var firewallRules = securityGroupMap.get("firewallRules")
      console.log(firewallRules)
      var firewallRule = firewallRules[0];
      console.log(firewallRule);
      $("#" + targetSubPrefix + "direction").val(firewallRule.direction);
      $("#" + targetSubPrefix + "fromPort").val(firewallRule.fromPort);
      $("#" + targetSubPrefix + "toPort").val(firewallRule.toPort);
      $("#" + targetSubPrefix + "ipProtocol").val(firewallRule.ipProtocol);
      $("#" + targetSubPrefix + "cidr").val(firewallRule.cidr);

      //tab_securityGroup_firewallRules_direction
      //$("#" + targetSubPrefix + "direction").val(securityGroupMap.get("firewall_direction"));
      //$("#" + targetSubPrefix + "fromPort").val(securityGroupMap.get("firewall_fromPort"));
      //$("#" + targetSubPrefix + "toPort").val(securityGroupMap.get("firewall_toPort"));
      //$("#" + targetSubPrefix + "ipProtocol").val(securityGroupMap.get("firewall_ipProtocol"));
      //$("#" + targetSubPrefix + "cidr").val(securityGroupMap.get("firewall_cidr"));
    }    
    // 전체 정보에 set
    $("#e_securityGroupIds").val(securityGroupIdList);

    // 지정된 connection 이 없으면 해당 connection으로 set  
    // SecurityGroup은 여러개 지정 가능하므로 List형태임
    
    if ($("#e_connectionName").val() == "") {
      $("#e_connectionName").val(securityGroupConnection);
    }else if ( $("#e_connectionName").val() != securityGroupConnection){
      // connection이 다름... 어쩔??
      console.log($("#e_connectionName").val() + " : " + securityGroupConnection)
      mcpjs['util/util'].commonAlert("connection이 다름");
      return
    }

  }else if (caller == "NamespaceSshKeyAssist") {
    var targetPrefix = "tab_sshKey_";

    $("#" + targetPrefix + "id").val(assistMap.get("id"));
    $("#" + targetPrefix + "name").val(assistMap.get("name"));
    $("#" + targetPrefix + "description").val(assistMap.get("description"));
    $("#" + targetPrefix + "connectionName").val(assistMap.get("connectionName"));

    // 전체 정보에 set
    $("#e_sshKeyId").val($("#" + targetPrefix + "id").val());

    // 지정된 connection 이 없으면 해당 connection으로 set  
    if ($("#e_connectionName").val() == "") {
      $("#e_connectionName").val(assistMap.get("connectionName"));
    }else if ( $("#e_connectionName").val() != assistMap.get("connectionName")){
      // connection이 다름... 어쩔??
      console.log($("#e_connectionName").val() + " : " + assistMap.get("connectionName"))
      mcpjs['util/util'].commonAlert("connection이 다름");
      return
    }
  }
}

// connection정보 조회 후 set.
export function setProviderRegionByConnectionValue(caller, connectionInfo){
  console.log("caller", caller)
  console.log("connectionInfo", connectionInfo)
  $("#es_providerId").val(connectionInfo.provider_id);

  mcpjs['util/util'].getRegionListByProviderForSelectbox(connectionInfo.provider_id, "es_regionName", connectionInfo.region_name)
  //$("#es_regionName").val(connectionInfo.region_name)
}

// assist를 통해 선택한 spec 정보를 받음.
export function setAssistSpecForExpert(specInfo){
	console.log("setAssistSpecForExpert", specInfo)
	var specName = specInfo.SpecName;
	var providerId = specInfo.ProviderId;
	var regionName = specInfo.RegionName;
	
	$("#es_providerId").val(providerId)
	$("#es_regionName").val(regionName)
	
  //$("#es_spec").val(specName)// TODO : spec이 원하는 spec이 아닐텐데... ns의 spec일텐데
	//recommendVmAssist_cspSpec_
	console.log("setAssist", specInfo)

}

// provider 와 region이 바뀌면 -> connection이 다르면 이전값들을 초기화 한다.
//    -> 로직 수정 필요. spec, image가 depencency가 아니라 호환되는 방법. 
//        csp resource를 선택하게 하고 선택한 리소스가 해당 connection에 없으면 추가하도록
// resource가 선택되면 이후로는 해당 connection의 리소스 목록을 가져온다.
// popup에서는 parent에서 선택한 providerId, regionName 을 setting한다.
// popup에서 connection이 있으면 해당 connection 리소스로 filter한다.
// popup에서 apply를 하면 parent의 setValuesFromAssist 에 map형태로 값을 set하여 전달한다.


