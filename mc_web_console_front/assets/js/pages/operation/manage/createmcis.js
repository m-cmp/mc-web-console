
// 서버 더하기버튼 클릭시 서버정보 입력area 보이기/숨기기
// isExpert의 체크 여부에 따라 바뀜.
// newServers 와 simpleServers가 있음.
export function displayNewServerForm() {

    var div = document.getElementById("server_configuration");
    webconsolejs["partials/layout/navigatePages"].toggleElement(div)


    // var expressServerConfig = $("#expressServerConfig");
    // var deploymentAlgo = $("#placement_algo").val();
    // var simpleServerConfig = $("#simpleServerConfig");
    // var expertServerConfig = $("#expertServerConfig");
    // var importServerConfig = $("#importServerConfig");
    // var expressServerConfig = $("#expressServerConfig");
    // console.log("is import = " + IsImport + " , deploymentAlgo " + deploymentAlgo)
    // // if ($("#isImport").is(":checked")) {
    // if (IsImport) {
    //     simpleServerConfig.removeClass("active");
    //     expertServerConfig.removeClass("active");
    //     importServerConfig.addClass("active");
    //     expressServerConfig.removeClass("active");
    // } else if (deploymentAlgo == "expert") {
    //     simpleServerConfig.removeClass("active");
    //     expertServerConfig.toggleClass("active");//
    //     importServerConfig.removeClass("active");
    //     expressServerConfig.removeClass("active");
    // } else if (deploymentAlgo == "simple") {
    //     simpleServerConfig.toggleClass("active");//
    //     expertServerConfig.removeClass("active");
    //     importServerConfig.removeClass("active");
    //     expressServerConfig.removeClass("active");

    // } else {
    //     //simpleServerConfig        
    //     console.log("exp")
    //     simpleServerConfig.removeClass("active");
    //     expertServerConfig.removeClass("active");
    //     importServerConfig.removeClass("active");
    //     expressServerConfig.toggleClass("active");//        
    // }
}

const Express_Server_Config_Arr = new Array();
var express_data_cnt = 0

// express모드 -> Done버튼 클릭 시
export function expressDone_btn() {

    console.log("hi")

    // express 는 common resource를 하므로 별도로 처리(connection, spec만)
    $("#p_provider").val($("#ep_provider").val())
    $("#p_connectionName").val($("#ep_connectionName").val())
    $("#p_name").val($("#ep_name").val())
    $("#p_description").val($("#ep_description").val())
    $("#p_spec").val($("#ep_spec").val())
    $("#p_subGroupSize").val($("#ep_vm_add_cnt").val() + "")
    $("#p_vm_cnt").val($("#ep_vm_add_cnt").val() + "")


    //var express_form = $("#express_form").serializeObject()
    // commonSpec 으로 set 해야하므로 재설정
    var express_form = {}
    express_form["name"] = $("#p_name").val();
    express_form["connectionName"] = $("#p_connectionName").val();
    express_form["description"] = $("#p_description").val();
    express_form["subGroupSize"] = $("#p_subGroupSize").val();
    express_form["commonImage"] = "ubuntu18.04";
    express_form["commonSpec"] = $("#p_spec").val();

    console.log("express_form form : ", express_form);

    var server_name = express_form.name

    var server_cnt = parseInt(express_form.subGroupSize)

    var add_server_html = "";

    Express_Server_Config_Arr.push(express_form)


    var displayServerCnt = '(' + server_cnt + ')'

    add_server_html += '<li onclick="view_express(\'' + express_data_cnt + '\')">'
        + '<div class="server server_on bgbox_b">'
        + '<div class="icon"></div>'
        + '<div class="txt">' + server_name + displayServerCnt + '</div>'
        + '</div>'
        + '</li>';

    // }
    $(".express_servers_config").removeClass("active");

    console.log("add server html");
    $("#mcis_server_list").prepend(add_server_html)

    $("#plusVmIcon").remove();
    $("#mcis_server_list").prepend(getPlusVm());

    console.log("express btn click and express form data : ", express_form)
    console.log("express data array : ", Express_Server_Config_Arr);
    express_data_cnt++;
    $("#express_form").each(function () {
        this.reset();
    })
    $("#ep_data_disk").val("");

}


// Assis spec 클릭 시
// 공통으로 뺄 것

var ROOT_DISK_MAX_VALUE = 0;
var ROOT_DISK_MIN_VALUE = 0;

// Disk Type 선택 시 Disk Size Min/Max 설정 > 보완할 것
export function changeDiskSize(type) {
	var disk_size = DISK_SIZE;

	if (disk_size) {
		disk_size.forEach(item => {
			var temp_size = item.split("|")
			var temp_type = temp_size[0];
			if (temp_type == type) {
				ROOT_DISK_MAX_VALUE = temp_size[1]
				ROOT_DISK_MIN_VALUE = temp_size[2]
			}
		})
	}
	console.log("ROOT_DISK_MAX_VALUE : ", ROOT_DISK_MAX_VALUE)
	console.log("ROOT_DISK_MIN_VALUE : ", ROOT_DISK_MIN_VALUE)
	$("#s_rootDiskType").val(type);
	$("#e_rootDiskType").val(type);

}

export function getRecommendVmInfo() {
    console.log("hihi")
	// var max_cpu = $("#num_vCPU_max").val()
	// var min_cpu = $("#num_vCPU_min").val()
	// var max_mem = $("#num_memory_max").val()
	// var min_mem = $("#num_memory_min").val()
	// var max_cost = $("#num_cost_max").val()
	// var min_cost = $("#num_cost_min").val()
	// var limit = $("#recommendVmLimit").val()
	// var lon = $("#longitude").val()
	// var lat = $("#latitude").val()

	// console.log(" lon " + lon + ", lat " + lat)
	// if (lon == "" || lat == "") {
	// 	commonAlert(" 지도에서 위치를 선택하세요 ")
	// 	return;
	// }
	// var url = "/operation/manages/mcismng/mcisrecommendvm/list"
	// var obj = {
	// 	"filter": {
	// 		"policy": [
	// 			{
	// 				"condition": [
	// 					{
	// 						"operand": max_cpu,
	// 						"operator": "<="
	// 					},
	// 					{
	// 						"operand": min_cpu,
	// 						"operator": ">="
	// 					}
	// 				],
	// 				"metric": "cpu"
	// 			},
	// 			{
	// 				"condition": [
	// 					{
	// 						"operand": max_mem,
	// 						"operator": "<="
	// 					},
	// 					{
	// 						"operand": min_mem,
	// 						"operator": ">="
	// 					}
	// 				],
	// 				"metric": "memory"
	// 			},
	// 			{
	// 				"condition": [
	// 					{
	// 						"operand": max_cost,
	// 						"operator": "<="
	// 					},
	// 					{
	// 						"operand": min_cost,
	// 						"operator": ">="
	// 					}
	// 				],
	// 				"metric": "cost"
	// 			}
	// 		]
	// 	},
	// 	"limit": limit,
	// 	"priority": {
	// 		"policy": [
	// 			{
	// 				"metric": "location",
	// 				"parameter": [
	// 					{
	// 						"key": "coordinateClose",
	// 						"val": [
	// 							lon + "/" + lat
	// 						]
	// 					}
	// 				],
	// 				"weight": "0.3"
	// 			}
	// 		]
	// 	}
	// }
	// axios.post(url, obj, {

	// 	headers: {
	// 		//'Content-type': 'application/json',
	// 	}

	// }).then(result => {
	// 	console.log("result spec : ", result);
	// 	var statusCode = result.data.status;
	// 	if (statusCode == 200 || statusCode == 201) {

	// 		console.log("recommend vm result: ", result.data);
	// 		recommendVmSpecListCallbackSuccess(result.data.VmSpecList)

	// 	} else {
	// 		var message = result.data.message;
	// 		commonAlert("Fail Create Spec : " + message + "(" + statusCode + ")");

	// 	}

	// }).catch((error) => {
	// 	console.warn(error);
	// 	console.log(error.response)
	// 	var errorMessage = error.response.data.error;
	// 	var statusCode = error.response.status;
	// 	commonErrorAlert(statusCode, errorMessage);
	// });
}
