


$(document).ready(function () {

	console.log("start!! " + Date.now());
	// namespace  caller, isCallback, targetObjId, searchOption
	mcpjs['util/pathfinder'].getCommonNameSpaceList("mainnamespace", true, '', "id")
	console.log("getCommonNameSpaceList!! " + Date.now());
	// connection
	// credential
	mcpjs['util/pathfinder'].getCommonCredentialList("maincredential", "id");
	console.log("getCommonCredentialList!! " + Date.now());
	// region
	mcpjs['util/pathfinder'].getCommonRegionList("mainregion", "id");
	console.log("getCommonRegionList!! " + Date.now());
	// driver
	mcpjs['util/pathfinder'].getCommonDriverList("maindriver", "id");
	console.log("getCommonDriverList!! " + Date.now());
	// resource
	// network(vnet)
	mcpjs['util/pathfinder'].getCommonNetworkList("mainnetwork", "id")
	console.log("getCommonNetworkList!! " + Date.now());
	// securitygroup
	mcpjs['util/pathfinder'].getCommonSecurityGroupList("mainsecuritygroup", "", "id")
	console.log("mcpjs['util/pathfinder'].getCommonSecurityGroupList!! " + Date.now());
	// sshkey
	mcpjs['util/pathfinder'].getCommonSshKeyList("mainsshkey", "id")
	console.log("getCommonSshKeyList!! " + Date.now());
	
	// image
	mcpjs['util/pathfinder'].getCommonVirtualMachineImageList("mainimage", "", "id")

	// spec
	mcpjs['util/pathfinder'].getCommonVirtualMachineSpecList("mainspec", "", "id")

	//mcpjs['util/pathfinder'].getCommonMcisList("mainmcis", true, "", "id")
	mcpjs["util/pathfinder"].getCommonMcisList("mainmcis", "id", mcpjs['auth/userguide'].getMcisListCallbackSuccess);

	mcpjs['util/pathfinder'].getCommonMcksList("mainmcks", "id")
	//$("#guideArea").modal();
});                   

let guideMap = new Map();
// TODO : 가져온 결과로 어떻게 처리할 것인지
export function processMap(caller){
	console.log("GUIDE---------- " + caller)
	console.log(guideMap)
	try{
	var keyValue = guideMap.get(caller);
	if( keyValue > 0){
		$("#goto" + caller).html("")
		$("#goto" + caller).html("생성완료")
	}else{
		console.log("-- goto" + caller)
		document.getElementById("goto" + caller).style.display = "";
		if( caller.indexOf("credential") > -1
			|| caller.indexOf("driver") > -1
			|| caller.indexOf("region") > -1
			|| caller.indexOf("mcis") > -1 ){
			console.log("guide area modal ")
			$("#guideArea").modal();
		}
	}
}catch(e){console.log(e)}
	console.log("goto" + caller)
}

export function getNameSpaceListCallbackSuccess(caller, data){
	console.log(data);
	if ( data == null || data == undefined || data == "null"){
		guideMap.set(caller, 0)
	}else{// 아직 data가 1건도 없을 수 있음
		if( data.length > 0){
			guideMap.set(caller, 1)
		}
	}
	// console.log(data);
	processMap(caller);
}
export function getNameSpaceListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}

export function getCredentialListCallbackSuccess(caller, data){
	console.log(data);
	if ( data == null || data == undefined || data == "null"){
		guideMap.set(caller, 0)
	}else{// 아직 data가 1건도 없을 수 있음
		if( data.length > 0){
			guideMap.set(caller, 1)
		}
	}
	// console.log(data);
	processMap(caller);
}
export function getCredentialListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}

export function getRegionListCallbackSuccess(caller, data){
	console.log(data);
	if ( data == null || data == undefined || data == "null"){
		guideMap.set(caller, 0)
	}else{// 아직 data가 1건도 없을 수 있음
		if( data.length > 0){
			guideMap.set(caller, 1)
		}
	}
	// console.log(data);
	processMap(caller);
}
export function getRegionListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}

export function getDriverListCallbackSuccess(caller, data){
	console.log(data);
	if ( data == null || data == undefined || data == "null"){
		guideMap.set(caller, 0)		
	}else{// 아직 data가 1건도 없을 수 있음
		if( data.length > 0){
			guideMap.set(caller, 1)
		}
	}
	// console.log(data);
	processMap(caller);
}
export function getDriverListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}

export function getNetworkListCallbackSuccess(caller, data){
	console.log(data);
	if ( data == null || data == undefined || data == "null"){
		guideMap.set(caller, 0)
	}else{// 아직 data가 1건도 없을 수 있음
		if( data.length > 0){
			guideMap.set(caller, 1)
		}
	}
	// console.log(data);
	processMap(caller);
}
export function getNetworkListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}

export function getSecurityGroupListCallbackSuccess(caller, data){
	console.log(data);
	if ( data == null || data == undefined || data == "null"){
		guideMap.set(caller, 0)
	}else{// 아직 data가 1건도 없을 수 있음
		if( data.length > 0){
			guideMap.set(caller, 1)
		}
	}
	// console.log(data);
	processMap(caller);
}
export function getSecurityGroupListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}

export function getSshKeyListCallbackSuccess(caller, data){
	console.log(data);
	if ( data == null || data == undefined || data == "null"){
		guideMap.set(caller, 0)
	}else{// 아직 data가 1건도 없을 수 있음
		if( data.length > 0){
			guideMap.set(caller, 1)
		}
	}
	// console.log(data);
	processMap(caller);
}
export function getSshKeyListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}

//getCommonVirtualMachineImageList
export function getImageListCallbackSuccess(caller, data){
	console.log(data);
	if ( data == null || data == undefined || data == "null"){
		guideMap.set(caller, 0)
	}else{// 아직 data가 1건도 없을 수 있음
		if( data.length > 0){
			guideMap.set(caller, 1)
		}
	}
	// console.log(data);
	processMap(caller);
}

export function getImageListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}

export function getSpecListCallbackSuccess(caller, data){
	console.log(data);
	if ( data == null || data == undefined || data == "null"){
		guideMap.set(caller, 0)
	}else{// 아직 data가 1건도 없을 수 있음
		if( data.length > 0){
			guideMap.set(caller, 1)
		}
	}
	// console.log(data);
	processMap(caller);
}

export function getSpecListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}

export function getMcisListCallbackSuccess(caller, data){
	console.log(data);
	if ( data == null || data == undefined || data == "null"){
		guideMap.set(caller, 0)
	}else{// 아직 data가 1건도 없을 수 있음
		if( data.length > 0){
			guideMap.set(caller, 1)
		}
	}
	// console.log(data);
	processMap(caller);
}

export function getMcisListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}


// export function getMcksListCallbackSuccess(caller, data){
// 	console.log("getMcksListCallbackSuccess--" + caller);
// 	console.log(data);
// 	if ( data == null || data == undefined || data == "null"){
// 		guideMap.set(caller, 0)
// 	}else{// 아직 data가 1건도 없을 수 있음
// 		if( data.length > 0){
// 			guideMap.set(caller, 1)
// 		}
// 	}
// 	// console.log(data);
// 	processMap(caller);
// }

export function getMcksListCallbackFail(caller, error){
	guideMap.set(caller, 0)
	processMap(caller);
}