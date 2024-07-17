// MCIS API 관련 


// 받아온 project(namespace)로 McisList GET
export async function getMcisList(nsId) {

  if (nsId == "") {
    console.log("Project has not set")
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
    },
  };

  var controller = "/api/" + "GetAllMcis";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  var mcisList = response.data.responseData;

  return mcisList
}

// mcis 단건 조회
export async function getMcis(nsId, mcisId) {
  if (nsId == "" || nsId == undefined || mcisId == undefined || mcisId == "") {
    console.log(" undefined nsId: " + nsId + " mcisId " + mcisId);
    return;
  }
  const data = {
    pathParams: {
      nsId: nsId,
      mcisId: mcisId
    }
  }

  var controller = "/api/" + "GetMcis";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  // error check를 위해 response를 return
  return response.data
}

// mcisLifeCycle 제어 option : reboot / suspend / resume / terminate
export function mcisLifeCycle(type, checked_array, nsId) {
  console.log("mcisLifeCycle option : ", type)
  console.log("selected mcis : ", checked_array)

  for (const mcis of checked_array) {
    console.log(mcis.id)
    let data = {
      pathParams: {
        nsId: nsId,
        mcisId: mcis.id,
      },
      queryParams: {
        "action": type
      }
    };
    let controller = "/api/" + "GetControlMcis";
    let response = webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    );
    console.log("mcisLifeCycle response : ", response)
  }
}

// vmLifeCycle 제어 option : reboot / suspend / resume / terminate
export function vmLifeCycle(type, mcisId, nsId, vmid) {

  let data = {
    pathParams: {
      nsId: nsId,
      mcisId: mcisId,
      vmId: vmid
    },
    queryParams: {
      "action": type
    }
  };
  let controller = "/api/" + "GetControlMcisVm";
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  console.log("vmLifeCycle response : ", response)

}

export async function mcisDynamic(mcisName, mcisDesc, Express_Server_Config_Arr, nsId) {

  var obj = {}
  obj['name'] = mcisName
  obj['description'] = mcisDesc
  obj['vm'] = Express_Server_Config_Arr
  const data = {
    pathParams: {
      "nsId": nsId
    },
    Request: {
      "name": obj['name'],
      "description": obj['description'],
      "vm": obj['vm'],
    }
  }

  var controller = "/api/" + "PostMcisDynamic";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  alert("생성요청 완료");
  var urlParamMap = new Map();

  // 생성요청했으므로 결과를 기다리지 않고 mcisList로 보냄
  webconsolejs["common/util"].changePage("McisMng", urlParamMap)

}

export async function vmDynamic(mcisId, nsId, Express_Server_Config_Arr) {

  var obj = {}
  obj = Express_Server_Config_Arr[0]
  const data = {
    pathParams: {
      nsId: nsId,
      mcisId: mcisId,
    },
    request: {
      "commonImage": obj.commonImage,
      "commonSpec": obj.commonSpec,
      "connectionName": obj.connectionName,
      "description": obj.description,
      // "label": "",
      "name": obj.name,
      "subGroupSize": obj.subGroupSize,
      "rootDiskSize": obj.rootDiskSize,
      "rootDiskType": obj.rootDiskType,
    }
  }


  var controller = "/api/" + "PostMcisVmDynamic";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  console.log("create VMdynamic : ", response)
}

export async function mcisRecommendVm(data) {
  var controller = "/api/" + "RecommendMCISPlan(FilterAndPriority)";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  console.log("mcisrecommendvm response ", response.data.responseData)

  return response.data
}
// get all provider

// get all registered region list
export async function getProviderList() {
  
  let controller = "/api/" + "GetProviderList";
  let response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
  );
  console.log("getProviderList response : ", response)

  return response.data.responseData.output
}

export async function getRegionList() {

// let data = {
		// pathParams: {
		//   providerName: "AWS",
		//   regionName: "aws-ca-west-1",
		// }
	//   };
	
  let controller = "/api/" + "GetRegionList";
  let response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    
  );
  console.log("getRegionList response : ", response)

  return response.data.responseData.region
}

export async function getCloudConnection() {


	// test
  let data = {
    queryParams: {
      "filterVerified": true
    }
  };
	let controller = "/api/" + "GetConnConfigList";
	let response = await webconsolejs["common/api/http"].commonAPIPost(
	  controller,
	  data
	);
	
  return response.data.responseData.connectionconfig
}

// mcis내 vm들의 provider별 connection count
export function calculateConnectionCount(vmList) {

  var vmCloudConnectionCountMap = new Map();

  for (var vmIndex in vmList) {
    var aVm = vmList[vmIndex];
    var location = aVm.connectionConfig;
    if (!webconsolejs["common/util"].isEmpty(location)) {

      var cloudType = location.providerName;
      if (vmCloudConnectionCountMap.has(cloudType)) {

        vmCloudConnectionCountMap.set(
          cloudType,
          vmCloudConnectionCountMap.get(cloudType) + 1
        );
      } else {
        vmCloudConnectionCountMap.set(cloudType, 0);
      }
    }
  }

  return vmCloudConnectionCountMap;
}




// MCIS 상태를 UI에서 표현하는 방식으로 변경
export function getMcisStatusFormatter(mcisFullStatus) {
  console.log("getMcisStatus " + mcisFullStatus);
  var statusArr = mcisFullStatus.split("-");
  var returnStatus = statusArr[0].toLowerCase();

  if (mcisFullStatus.toLowerCase().indexOf("running") > -1) {
    returnStatus = "running";
  } else if (mcisFullStatus.toLowerCase().indexOf("suspend") > -1) {
    returnStatus = "stop";
  } else if (mcisFullStatus.toLowerCase().indexOf("terminate") > -1) {
    returnStatus = "terminate";
    // TODO : partial도 있는데... 처리를 어떻게 하지??
  } else {
    returnStatus = "terminate";
  }
  console.log("after status " + returnStatus);
  return returnStatus;
}

// Mcis 상태를 icon으로 
export function getMcisStatusIconFormatter(mcisDispStatus) {
  var mcisStatusIcon = "";
  if (mcisDispStatus == "running") {
    mcisStatusIcon = "icon_running.svg"
  } else if (mcisDispStatus == "include") {
    mcisStatusIcon = "icon_stop.svg"
  } else if (mcisDispStatus == "suspended") {
    mcisStatusIcon = "icon_stop.svg"
  } else if (mcisDispStatus == "terminate") {
    mcisStatusIcon = "icon_terminate.svg"
  } else {
    mcisStatusIcon = "icon_stop.svg"
  }
  return mcisStatusIcon
}

// Mcis에 구성된 vm들의 provider들 imgTag로
export function getMcisInfoProviderNames(mcisData) {

  var mcisProviderNames = "";
  var vmCloudConnectionMap = calculateConnectionCount(
    mcisData.vm
  );
  console.log("vmCloudConnectionMap", vmCloudConnectionMap)
  if (vmCloudConnectionMap) {
    vmCloudConnectionMap.forEach((value, key) => {
      mcisProviderNames +=
        '<img class="img-fluid" class="rounded" width="30" src="/assets/images/common/img_logo_' +
        key +
        '.png" alt="' +
        key +
        '"/>';
    });
  }
  return mcisProviderNames
}

// VM 상태를 UI에서 표현하는 방식으로 변경
export function getVmStatusFormatter(vmFullStatus) {
  console.log("getVmStatusFormatter " + vmFullStatus);
  var returnVmStatus = vmFullStatus.toLowerCase() // 소문자로 변환

  const VM_STATUS_RUNNING = "running"
  const VM_STATUS_STOPPED = "stop"
  const VM_STATUS_RESUMING = "resuming";
  const VM_STATUS_INCLUDE = "include"
  const VM_STATUS_SUSPENDED = "suspended"
  const VM_STATUS_TERMINATED = "terminated"
  const VM_STATUS_FAILED = "failed"

  if (returnVmStatus == VM_STATUS_RUNNING) {
    returnVmStatus = "running"
  } else if (returnVmStatus == VM_STATUS_TERMINATED) {
    returnVmStatus = "terminate"
  } else if (returnVmStatus == VM_STATUS_FAILED) {
    returnVmStatus = "terminate"
  } else {
    returnVmStatus = "stop"
  }
  return returnVmStatus
}


// VM 상태 별로 Style class로 색 설정
export function getVmStatusStyleClass(vmDispStatus) {
  var vmStatusClass = "bg-info";
  if (vmDispStatus == "running") {
    vmStatusClass = "bg-info"
  } else if (vmDispStatus == "include") {
    vmStatusClass = "bg-red"
  } else if (vmDispStatus == "suspended") {
    vmStatusClass = "bg-red"
  } else if (vmDispStatus == "terminated") {
    vmStatusClass = "bg-secondary"
  } else {
    vmStatusClass = "bg-secondary"
  }
  return vmStatusClass;
}


// 해당 mcis에서 상태값들을 count : 1개 mcis의 상태는 1개만 있으므로 running, stop, terminate 중 1개만 1, 나머지는 0
// dashboard, mcis 에서 사용
export function calculateMcisStatusCount(mcisData) {
  console.log("calculateMcisStatusCount");

  console.log("mcisData : ", mcisData);
  var mcisStatusCountMap = new Map();
  mcisStatusCountMap.set("running", 0);
  mcisStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  mcisStatusCountMap.set("terminate", 0);
  try {
    var mcisStatus = mcisData.status;
    var mcisDispStatus = getMcisStatusFormatter(mcisStatus); // 화면 표시용 status

    if (mcisStatus != "") {
      // mcis status 가 없는 경우는 skip
      if (mcisStatusCountMap.has(mcisDispStatus)) {
        mcisStatusCountMap.set(
          mcisDispStatus,
          mcisStatusCountMap.get(mcisDispStatus) + 1
        );
      }
    }
  } catch (e) {
    console.error("mcis status error", e);
  }
  // console.log(mcisStatusCountMap);
  return mcisStatusCountMap;
}


// vm의 상태별 count
export function calculateVmStatusCount(aMcis) {
  // console.log("calculateVmStatusCount")
  // console.log(vmList)
  var sumVmCnt = 0;
  var vmStatusCountMap = new Map();
  vmStatusCountMap.set("running", 0);
  vmStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  vmStatusCountMap.set("terminate", 0);

  try {
    if (aMcis.statusCount) {
      console.log("statusCount part", aMcis);
      var statusCountObj = aMcis.statusCount;
      console.log(statusCountObj);
      var countCreating = statusCountObj.countCreating;
      var countFailed = statusCountObj.countFailed;
      var countRebooting = statusCountObj.countRebooting;
      var countResuming = statusCountObj.countResuming;
      var countRunning = statusCountObj.countRunning;
      var countSuspended = statusCountObj.countSuspended;
      var countSuspending = statusCountObj.countSuspending;
      var countTerminated = statusCountObj.countTerminated;
      var countTerminating = statusCountObj.countTerminating;
      var countTotal = statusCountObj.countTotal;
      var countUndefined = statusCountObj.countUndefined;

      var sumEtc =
        Number(countCreating) +
        Number(countFailed) +
        Number(countRebooting) +
        Number(countResuming) +
        Number(countSuspending) +
        Number(countTerminated) +
        Number(countTerminating) +
        Number(countUndefined);

      vmStatusCountMap.set("running", Number(countRunning));
      vmStatusCountMap.set("stop", Number(countSuspended)); // partial 도 stop으로 보고있음.
      vmStatusCountMap.set("terminate", sumEtc);
    } else if (aMcis.vm) {
      console.log("statusCount part list part");
      vmList = aMcis.vm;
      for (var vmIndex in vmList) {
        var aVm = vmList[vmIndex];
        var vmStatus = aVm.status;
        var vmDispStatus = getVmStatusFormatter(vmStatus);

        if (vmStatus != "") {
          // vm status 가 없는 경우는 skip
          if (vmStatusCountMap.has(vmDispStatus)) {
            vmStatusCountMap.set(
              vmDispStatus,
              vmStatusCountMap.get(vmDispStatus) + 1
            );
          }
        }
      }
    }
  } catch (e) {
    console.error("mcis status error", e); // 에러 로그 처리 예시
  }
  return vmStatusCountMap;
}

