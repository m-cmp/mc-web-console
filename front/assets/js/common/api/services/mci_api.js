// MCI API 관련 


// 받아온 project(namespace)로 MciList GET
export async function getMciList(nsId) {

  if (nsId == "") {
    alert("Project has not set")
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
    },
  };

  var controller = "/api/" + "mc-infra-manager/" + "GetAllMci";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  var mciList = response.data.responseData;

  return mciList
}

// 받아온 project(namespace)로 MciList Id Arr GET
// export async function getMciIdList(nsId) {

//   if (nsId == "") {
//     console.log("Project has not set")
//     return;
//   }

//   var data = {
//     pathParams: {
//       nsId: nsId,
//     },
//     queryParams: {
//       option: "id"
//     }
//   };

//   var controller = "/api/" + "mc-infra-manager/" + "GetAllMci";
//   const response = await webconsolejs["common/api/http"].commonAPIPost(
//     controller,
//     data
//   )

//   var mciList = response.data.responseData;

//   return mciList
// }

// mci 단건 조회
export async function getMci(nsId, mciId) {
  if (nsId == "" || nsId == undefined || mciId == undefined || mciId == "") {
    alert(" undefined nsId: " + nsId + " mciId " + mciId);
    return;
  }
  const data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "GetMci";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  // error check를 위해 response를 return
  return response.data
}


// mci vm 단건 조회
export async function getMciVm(nsId, mciId, vmId) {
  if (nsId == "" || nsId == undefined || mciId == undefined || vmId == "" || vmId == undefined || vmId == "") {
    alert(" undefined nsId: " + nsId, + " mciId " + mciId, ", vmId " + vmId);
    return;
  }
  const data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
      vmId: vmId
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "GetMciVm";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  // error check를 위해 response를 return
  return response.data
}

// mciLifeCycle 제어 option : reboot / suspend / resume / terminate
export function mciLifeCycle(type, currentMciId, nsId) {
  let data = {
    pathParams: {
      nsId: nsId,
      mciId: currentMciId,
    },
    queryParams: {
      "action": type,
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "GetControlMci";
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  return response;
}

export function mciDelete(currentMciId, nsId) {

  let data = {
    pathParams: {
      nsId: nsId,
      mciId: currentMciId,
    },
    queryParams: {
      option: "force"
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "Delmci";
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  return response;
}

export function vmDelete(mciId, nsId, vmId) {
  let data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
      vmId: vmId
    },
    queryParams: {
      "option": "force"
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "Delmcivm";
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  return response;
}

// vmLifeCycle 제어 option : reboot / suspend / resume / terminate
export function vmLifeCycle(type, mciId, nsId, vmid) {

  let data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
      vmId: vmid
    },
    queryParams: {
      "action": type
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "GetControlMciVm";
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  return response;
}

export async function mciDynamicReview(mciName, mciDesc, Express_Server_Config_Arr, nsId) {

  // 새로운 인터페이스에 맞게 데이터 변환 (mciDynamic과 동일)
  const subGroups = Express_Server_Config_Arr.map(config => ({
    specId: config.commonSpec,
    imageId: config.commonImage,
    name: config.name,
    subGroupSize: config.subGroupSize,
    connectionName: config.connectionName,
    description: config.description,
    rootDiskSize: config.rootDiskSize,
    rootDiskType: config.rootDiskType,
    label: config.label || {},
    vmUserPassword: config.vmUserPassword || ""
  }));

  // command 처리 - 첫 번째 서버의 command를 사용 (모든 서버가 동일한 command를 사용한다고 가정)
  const command = Express_Server_Config_Arr.length > 0 && Express_Server_Config_Arr[0].command 
    ? Express_Server_Config_Arr[0].command.split('\n').filter(cmd => cmd.trim() !== '')
    : [];

  const data = {
    pathParams: {
      "nsId": nsId
    },
    Request: {
      "name": mciName,
      "description": mciDesc,
      "installMonAgent": "no",
      "label": {},
      "policyOnPartialFailure": "continue",
      "postCommand": {
        "command": command,
        "userName": "cb-user"
      },
      "subGroups": subGroups,
      "systemLabel": ""
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "PostMciDynamicReview";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response;
}

export async function mciDynamic(mciName, mciDesc, Express_Server_Config_Arr, nsId, policyOnPartialFailure) {

  // 새로운 인터페이스에 맞게 데이터 변환
  const subGroups = Express_Server_Config_Arr.map(config => ({
    specId: config.commonSpec,
    imageId: config.commonImage,
    name: config.name,
    subGroupSize: config.subGroupSize,
    connectionName: config.connectionName,
    description: config.description,
    rootDiskSize: config.rootDiskSize,
    rootDiskType: config.rootDiskType
  }));

  // command 처리 - 첫 번째 서버의 command를 사용 (모든 서버가 동일한 command를 사용한다고 가정)
  const command = Express_Server_Config_Arr.length > 0 && Express_Server_Config_Arr[0].command 
    ? Express_Server_Config_Arr[0].command.split('\n').filter(cmd => cmd.trim() !== '')
    : [];

  const data = {
    pathParams: {
      "nsId": nsId
    },
    Request: {
      "name": mciName,
      "description": mciDesc,
      "subGroups": subGroups,
      "policyOnPartialFailure": policyOnPartialFailure,
      "postCommand": {
        "command": command,
        "userName": "cb-user"
      }
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "PostMciDynamic";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  alert("Creation request completed");
  var urlParamMap = new Map();

  // 생성요청했으므로 결과를 기다리지 않고 mciList로 보냄
  // webconsolejs["common/util"].changePage("MciMng", urlParamMap)
  window.location = "/webconsole/operations/manage/workloads/mciworkloads"
}

export async function vmDynamic(mciId, nsId, Express_Server_Config_Arr) {

  var obj = {}
  obj = Express_Server_Config_Arr[0]
  const data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
    },
    request: {
      "imageId": obj.commonImage,
      "specId": obj.commonSpec,
      "connectionName": obj.connectionName,
      "description": obj.description,
      // "label": "",
      "name": obj.name,
      "subGroupSize": obj.subGroupSize,
      "rootDiskSize": obj.rootDiskSize,
      "rootDiskType": obj.rootDiskType,
    }
  }


  var controller = "/api/" + "mc-infra-manager/" + "PostMciSubGroupDynamic";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
}

export async function mciRecommendVm(data) {
  var controller = "/api/" + "mc-infra-manager/" + "recommendSpec";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response.data
}

// 이미지 검색 API
export async function searchImage(nsId, searchParams) {
  const data = {
    pathParams: {
      nsId: "system"
    },
    request: {
      includeDeprecatedImage: searchParams.includeDeprecatedImage || false,
      isGPUImage: searchParams.isGPUImage || false,
      isKubernetesImage: searchParams.isKubernetesImage || false,
      // isRegisteredByAsset: searchParams.isRegisteredByAsset || false,
      osArchitecture: searchParams.osArchitecture || "x86_64",
      osType: searchParams.osType || "ubuntu 22.04",
      providerName: searchParams.providerName || "",
      regionName: searchParams.regionName || ""
    }
  };

  var controller = "/api/" + "mc-infra-manager/" + "Searchimage";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response.data;
}

// get all provider

// get all registered region list
export async function getProviderList() {

  let controller = "/api/" + "mc-infra-manager/" + "GetProviderList";
  let response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
  );

  return response.data.responseData.output
}

export async function getRegionList() {

  // let data = {
  // pathParams: {
  //   providerName: "AWS",
  //   regionName: "aws-ca-west-1",
  // }
  //   };

  let controller = "/api/" + "mc-infra-manager/" + "GetRegions";
  let response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,

  );

  return response.data.responseData.region
}

export async function getCloudConnection() {


  // test
  let data = {
    queryParams: {
      "filterVerified": true
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "GetConnConfigList";
  let response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response.data.responseData.connectionconfig
}

// mci내 vm들의 provider별 connection count
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




// MCI 상태를 UI에서 표현하는 방식으로 변경
export function getMciStatusFormatter(mciFullStatus) {
  if (!mciFullStatus || typeof mciFullStatus !== "string") {
    return "etc";
  }

  const lowerStatus = mciFullStatus.toLowerCase();

  // Partial 상태 처리
  if (lowerStatus.includes("partial")) {
    return "etc";
  }

  // Running 관련 상태 처리
  if (lowerStatus.includes("running")) {
    return "running";
  } else if (lowerStatus.includes("creating") || lowerStatus.includes("rebooting") || lowerStatus.includes("resuming")) {
    return "running-ing";
  }

  // Stopped 관련 상태 처리
  if (lowerStatus.includes("suspended")) {
    return "stopped";
  } else if (lowerStatus.includes("suspending")) {
    return "stopped-ing";
  }

  // Terminated 관련 상태 처리
  if (lowerStatus.includes("terminated")) {
    return "terminated";
  } else if (lowerStatus.includes("terminating")) {
    return "terminated-ing";
  }

  // Failed 상태 처리
  if (lowerStatus.includes("failed")) {
    return "failed";
  }

  // 기타
  return "etc";
}

// Mci 상태를 icon으로 
export function getMciStatusIconFormatter(mciDispStatus) {
  var mciStatusIcon = "";
  if (mciDispStatus == "running") {
    // mciStatusIcon = "icon_running.svg"
    mciStatusIcon = "server_running.svg"
  } else if (mciDispStatus == "include") {
    // mciStatusIcon = "icon_stop.svg"
    mciStatusIcon = "server_stop.svg"
  } else if (mciDispStatus == "stopped") {
    // mciStatusIcon = "icon_stop.svg"
    mciStatusIcon = "server_stop.svg"
  } else if (mciDispStatus == "terminated") {
    // mciStatusIcon = "icon_terminate.svg"
    mciStatusIcon = "server_off.svg"
  } else {
    // mciStatusIcon = "icon_terminate.svg"
    mciStatusIcon = "server_off.svg"
  }
  return mciStatusIcon
}

// Mci에 구성된 vm들의 provider들 imgTag로ㅋ
export function getMciInfoProviderNames(mciData) {
  var mciProviderNames = "";
  var vmCloudConnectionMap = calculateConnectionCount(mciData.vm);

  if (vmCloudConnectionMap) {
    vmCloudConnectionMap.forEach((value, key) => {
      mciProviderNames +=
        '<img class="img-fluid" width="60" src="/assets/images/common/img_logo_' +
        (key == "" ? "mcmp" : key) +
        '.png" alt="' +
        key +
        '" style="margin: 0;"/>';
    });
  }
  return mciProviderNames;
}

// VM 상태를 UI에서 표현하는 방식으로 변경
export function getVmStatusFormatter(vmFullStatus) {
  //console.log("getVmStatusFormatter " + vmFullStatus);
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
  } else if (returnVmStatus === VM_STATUS_SUSPENDED) { // suspended 상태 확인
    return "suspended";
  } else if (returnVmStatus == VM_STATUS_TERMINATED) {
    returnVmStatus = "terminate"
  } else if (returnVmStatus == VM_STATUS_FAILED) {
    returnVmStatus = "terminate"
  } else {
    returnVmStatus = "stop"
  }
  return returnVmStatus
}

export function getVmGroupStatusFormatter(vmGroupFullStatus) {
  const lowers = vmGroupFullStatus.map(vm => vm.status.toLowerCase());

  if (lowers.some(s => s.includes("partial"))) {
    return "etc";
  }

  if (lowers.every(s => s.includes("running"))) {
    return "running";
  }
  if (lowers.some(s =>
    s.includes("creating") ||
    s.includes("rebooting") ||
    s.includes("resuming")
  )) {
    return "running-ing";
  }

  if (lowers.every(s => s.includes("suspended"))) {
    return "stopped";
  }
  if (lowers.some(s => s.includes("suspending"))) {
    return "stopped-ing";
  }

  if (lowers.every(s => s.includes("terminated"))) {
    return "terminated";
  }
  if (lowers.some(s => s.includes("terminating"))) {
    return "terminated-ing";
  }

  if (lowers.some(s => s.includes("failed"))) {
    return "failed";
  }

  return "etc";
}


// VM 상태 별로 Style class로 색 설정
export function getVmStatusStyleClass(vmDispStatus) {
  var vmStatusClass = "bg-green-lt";
  if (vmDispStatus == "running") {
    vmStatusClass = "bg-green-lt"
  } else if (vmDispStatus == "failed") {
    vmStatusClass = "bg-red-lt"
  } else if (vmDispStatus == "suspended") {
    vmStatusClass = "bg-yellow-lt"
  } else if (vmDispStatus == "terminated") {
    vmStatusClass = "bg-muted-lt"
  } else {
    vmStatusClass = "bg-muted-lt"
  }
  return vmStatusClass;
}

export function getVmGroupStatusStyleClass(vmDispStatus) {
  var vmStatusClass = "bg-green-lt";
  if (vmDispStatus == "running") {
    vmStatusClass = "bg-green-lt"
  } else if (vmDispStatus == "failed") {
    vmStatusClass = "bg-red-lt"
  } else if (vmDispStatus == "suspended") {
    vmStatusClass = "bg-yellow-lt"
  } else if (vmDispStatus == "terminated") {
    vmStatusClass = "bg-muted-lt"
  } else {
    vmStatusClass = "bg-muted-lt"
  }
  return vmStatusClass;
}


// 해당 mci에서 상태값들을 count : 1개 mci의 상태는 1개만 있으므로 running, stop, terminate 중 1개만 1, 나머지는 0
// dashboard, mci 에서 사용
export function calculateMciStatusCount(mciData) {
  // 초기 상태 카운트 맵 정의
  const mciStatusCountMap = new Map([
    ["running", 0],
    ["running-ing", 0],
    ["stopped", 0],
    ["stopped-ing", 0],
    ["terminated", 0],
    ["terminated-ing", 0],
    ["failed", 0],
    ["etc", 0],
  ]);

  try {
    // mciData와 status 유효성 검사
    if (!mciData || !mciData.status) {
      console.error("Invalid mciData or missing status");
      return mciStatusCountMap; // 초기값 반환
    }

    const mciStatus = mciData.status; // 원본 상태
    const mciDispStatus = getMciStatusFormatter(mciStatus); // 화면 표시용 상태

    // 상태 카운트 증가
    if (mciStatusCountMap.has(mciDispStatus)) {
      mciStatusCountMap.set(
        mciDispStatus,
        mciStatusCountMap.get(mciDispStatus) + 1
      );
    } else {
      console.warn(`Unknown status: ${mciDispStatus}`);
    }
  } catch (e) {
    console.error("mci status error", e);
  }

  return mciStatusCountMap;
}

// vm의 상태별 count
export function calculateVmStatusCount(aMci) {
  const vmStatusCountMap = new Map([
    ["running", 0],
    ["running-ing", 0],
    ["suspended", 0],
    ["stopped-ing", 0],
    ["terminated", 0],
    ["terminated-ing", 0],
    ["etc", 0],
  ]);
  try {
    if (aMci.statusCount) {
      const statusCountObj = aMci.statusCount;

      vmStatusCountMap.set("running", Number(statusCountObj.countRunning || 0));
      vmStatusCountMap.set("running-ing", Number(
        (statusCountObj.countCreating || 0) +
        (statusCountObj.countRebooting || 0) +
        (statusCountObj.countResuming || 0)
      ));
      vmStatusCountMap.set("suspended", Number(statusCountObj.countSuspended || 0));
      vmStatusCountMap.set("stopped-ing", Number(statusCountObj.countSuspending || 0));
      vmStatusCountMap.set("terminated", Number(statusCountObj.countTerminated || 0));
      vmStatusCountMap.set("terminated-ing", Number(statusCountObj.countTerminating || 0));
      vmStatusCountMap.set("etc", Number(
        (statusCountObj.countFailed || 0) +
        (statusCountObj.countUndefined || 0)
      ));
    }
  } catch (e) {
    console.error("Error calculating VM status count:", e);
  }

  return vmStatusCountMap;
}

// ScaleOut API 관련
export async function postScaleOutSubGroup(nsId, mciId, subgroupId, numVMsToAdd) {
  if (nsId == "") {
    alert("Project has not set")
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
      subgroupId: subgroupId
    },
    Request: {
      "numVMsToAdd": numVMsToAdd,
    }
  };

  var controller = "/api/" + "mc-infra-manager/" + "Postmcisubgroupscaleout";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  alert("Creation request completed");
  window.location = "/webconsole/operations/manage/workloads/mciworkloads"

}

// Policy API 관련 
export async function getPolicyList(nsId) {

  if (nsId == "") {
    alert("Project has not set")
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
    },
  };

  var controller = "/api/" + "mc-infra-manager/" + "Getallmcipolicy";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  var policyList = response.data.responseData;

  return policyList
}

export async function deletePolicy(nsId, mciId) {
  if (nsId == "") {
    alert("Project has not set")
    return;
  }

  let data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
    },
    queryParams: {
      option: "force"
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "Delmcipolicy";
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
}

export async function createPolicy(nsId, mciId, policy) {
  if (nsId == "") {
    alert("Project has not set")
    return;
  }
  let data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
    },
    Request: {
      policy: policy
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "Postmcipolicy";
  let response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  return response
}

// Label 관련 API 함수들

// Label 생성/수정
export async function createOrUpdateLabel(labelType, uid, labels) {
  if (!labelType || !uid || !labels) {
    alert("Missing required parameters for createOrUpdateLabel");
    return;
  }

  const data = {
    pathParams: {
      labelType: labelType,
      uid: uid
    },
    Request: {
      labels: labels
    }
  };

  const controller = "/api/" + "mc-infra-manager/" + "Createorupdatelabel";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  
  return response;
}

// Label 조회
export async function getLabels(labelType, uid) {
  if (!labelType || !uid) {
    alert("Missing required parameters for getLabels");
    return;
  }

  const data = {
    pathParams: {
      labelType: labelType,
      uid: uid
    }
  };

  const controller = "/api/" + "mc-infra-manager/" + "Getlabels";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  
  return response;
}

// Label 삭제
export async function removeLabel(labelType, uid, key) {
  if (!labelType || !uid || !key) {
    alert("Missing required parameters for removeLabel");
    return;
  }

  const data = {
    pathParams: {
      labelType: labelType,
      uid: uid,
      key: key
    }
  };

  const controller = "/api/" + "mc-infra-manager/" + "Removelabel";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  
  return response;
}

// Label Selector로 MCI 리소스 조회 (기존 API 패턴 따름)
export async function getResourcesByLabelSelector(labelSelector) {
  const data = {
    pathParams: {
      labelType: "mci"
    },
    queryParams: {
      labelSelector: labelSelector
    }
  };

  const controller = "/api/mc-infra-manager/Getresourcesbylabelselector";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  
  return response;
}
