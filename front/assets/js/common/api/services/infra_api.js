// MCI API 관련 


// 받아온 project(namespace)로 MciList GET
export async function getMciList(nsId) {

  if (nsId == "") {
    console.log("Project has not set")
    return [];
  }

  var data = {
    pathParams: {
      nsId: nsId,
    },
  };

  var controller = "/api/" + "mc-infra-manager/" + "GetAllInfra";

  try {
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    )

    var mciList = response.data.responseData;
    return mciList || [];
  } catch (error) {
    // 404 에러 (데이터가 없는 경우)는 정상적인 상황이므로 빈 배열 반환
    if (error.response && error.response.status === 404) {
      console.log("No MCI data found for namespace:", nsId);
      return [];
    }
    
    // 다른 에러는 그대로 throw
    console.error("Error fetching MCI list:", error);
    throw error;
  }
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
    console.log(" undefined nsId: " + nsId + " mciId " + mciId);
    return null;
  }
  const data = {
    pathParams: {
      nsId: nsId,
      infraId: mciId
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "GetInfra";
  
  try {
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    );

    // error check를 위해 response를 return
    return response.data;
  } catch (error) {
    // 404 에러 (MCI가 없는 경우)는 정상적인 상황이므로 null 반환
    if (error.response && error.response.status === 404) {
      console.log("MCI not found:", mciId, "in namespace:", nsId);
      return null;
    }
    
    // 다른 에러는 그대로 throw
    console.error("Error fetching MCI:", error);
    throw error;
  }
}


// mci vm 단건 조회
export async function getMciVm(nsId, mciId, vmId) {
  if (nsId == "" || nsId == undefined || mciId == undefined || vmId == "" || vmId == undefined || vmId == "") {
    console.log(" undefined nsId: " + nsId, + " mciId " + mciId, ", vmId " + vmId);
    return null;
  }
  const data = {
    pathParams: {
      nsId: nsId,
      infraId: mciId,
      nodeId: vmId
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "GetInfraNode";
  
  try {
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    );

    // error check를 위해 response를 return
    return response.data;
  } catch (error) {
    // 404 에러 (VM이 없는 경우)는 정상적인 상황이므로 null 반환
    if (error.response && error.response.status === 404) {
      console.log("VM not found:", vmId, "in MCI:", mciId, "namespace:", nsId);
      return null;
    }
    
    // 다른 에러는 그대로 throw
    console.error("Error fetching MCI VM:", error);
    throw error;
  }
}

// mciLifeCycle 제어 option : reboot / suspend / resume / terminate
export function mciLifeCycle(type, currentMciId, nsId) {
  let data = {
    pathParams: {
      nsId: nsId,
      infraId: currentMciId,
    },
    queryParams: {
      "action": type,
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "GetControlInfra";
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'GetControlInfra',
    'Infra ' + type + ': ' + currentMciId
  );
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    false,
    tracked.httpOptions
  );
  return response;
}

export function mciDelete(currentMciId, nsId) {

  let data = {
    pathParams: {
      nsId: nsId,
      infraId: currentMciId,
    },
    queryParams: {
      option: "force"
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "DelInfra";
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'DelInfra',
    'Infra delete: ' + currentMciId
  );
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    false,
    tracked.httpOptions
  );
  return response;
}

export function vmDelete(mciId, nsId, vmId) {
  let data = {
    pathParams: {
      nsId: nsId,
      infraId: mciId,
      nodeId: vmId
    },
    queryParams: {
      "option": "force"
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "DelInfraNode";
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'DelInfraNode',
    'Node delete: ' + vmId
  );
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    false,
    tracked.httpOptions
  );
  return response;
}

// vmLifeCycle 제어 option : reboot / suspend / resume / terminate
export function vmLifeCycle(type, mciId, nsId, vmid) {

  let data = {
    pathParams: {
      nsId: nsId,
      infraId: mciId,
      nodeId: vmid
    },
    queryParams: {
      "action": type
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "GetControlInfraNode";
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'GetControlInfraNode',
    'Node ' + type + ': ' + vmid
  );
  let response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    false,
    tracked.httpOptions
  );
  return response;
}

// 노드 스냅샷 → MyImage(customImage) 생성
export function createNodeSnapshot(nsId, infraId, nodeId, name, description) {
  const data = {
    pathParams: {
      nsId: nsId,
      infraId: infraId,
      nodeId: nodeId
    },
    request: {
      name: name,
      ...(description ? { description: description } : {})
    }
  };
  const controller = "/api/" + "mc-infra-manager/" + "PostInfraNodeSnapshot";
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'PostInfraNodeSnapshot',
    'Create MyImage: ' + name + ' (from ' + nodeId + ')'
  );
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    false,
    tracked.httpOptions
  );
  return response;
}

// 워크스페이스 ns의 MyImage(customImage) 목록 조회
export async function getCustomImageList(nsId) {
  const data = {
    pathParams: {
      nsId: nsId
    }
  };
  const controller = "/api/" + "mc-infra-manager/" + "GetAllCustomImage";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  return response.data;
}

export async function mciDynamicReview(mciName, mciDesc, Express_Server_Config_Arr, nsId, labels) {

  // 새로운 인터페이스에 맞게 데이터 변환 (mciDynamic과 동일)
  const nodeGroups = Express_Server_Config_Arr.map(config => ({
    specId: config.commonSpec,
    imageId: config.commonImage,
    name: config.name,
    nodeGroupSize: parseInt(config.subGroupSize) || 1,
    connectionName: config.connectionName,
    description: config.description,
    rootDiskSize: (config.rootDiskSize !== "" && config.rootDiskSize !== undefined) ? parseInt(config.rootDiskSize) : 0,
    rootDiskType: config.rootDiskType,
    ...(config.zone ? { zone: config.zone } : {}),
    ...(config.label && Object.keys(config.label).length > 0 ? { label: config.label } : {}),
    ...(config.vNetTemplateId ? { vNetTemplateId: config.vNetTemplateId } : {}),
    ...(config.sgTemplateId ? { sgTemplateId: config.sgTemplateId } : {})
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
      "label": labels || {},
      "policyOnPartialFailure": "continue",
      // 단일 명령은 phase 1개로 표현 (cb-tumblebug v0.12.29+ postCommands 배열 구조)
      ...(command.length ? {
        "postCommands": [{ "command": command, "userName": "cb-user" }]
      } : {}),
      "nodeGroups": nodeGroups,
      "systemLabel": ""
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "PostInfraDynamicReview";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response;
}

export async function mciDynamic(mciName, mciDesc, Express_Server_Config_Arr, nsId, policyOnPartialFailure, labels) {

  // 새로운 인터페이스에 맞게 데이터 변환
  const nodeGroups = Express_Server_Config_Arr.map(config => ({
    specId: config.commonSpec,
    imageId: config.commonImage,
    name: config.name,
    nodeGroupSize: parseInt(config.subGroupSize) || 1,
    connectionName: config.connectionName,
    description: config.description,
    rootDiskSize: (config.rootDiskSize !== "" && config.rootDiskSize !== undefined) ? parseInt(config.rootDiskSize) : 0,
    rootDiskType: config.rootDiskType,
    ...(config.zone ? { zone: config.zone } : {}),
    ...(config.label && Object.keys(config.label).length > 0 ? { label: config.label } : {}),
    ...(config.vNetTemplateId ? { vNetTemplateId: config.vNetTemplateId } : {}),
    ...(config.sgTemplateId ? { sgTemplateId: config.sgTemplateId } : {})
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
      "label": labels || {},
      "nodeGroups": nodeGroups,
      "policyOnPartialFailure": policyOnPartialFailure,
      // 단일 명령은 phase 1개로 표현 (cb-tumblebug v0.12.29+ postCommands 배열 구조)
      ...(command.length ? {
        "postCommands": [{ "command": command, "userName": "cb-user" }]
      } : {})
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "PostInfraDynamic";
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'PostInfraDynamic',
    'Infra create: ' + mciName
  );
  webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    undefined,
    tracked.httpOptions
  );

  var urlParamMap = new Map();

  // 생성요청했으므로 결과를 기다리지 않고 mciList로 보냄 (상태는 tracker toast로 표시)
  // webconsolejs["common/util"].changePage("MciMng", urlParamMap)
  window.location = "/webconsole/operations/manage/workloads/infraworkloads"
}

// Expert 모드 Create Infra — 비-dynamic PostInfra(model.InfraReq). Spec/Image 자동탐색을 하지
// 않고 vNetId/subnetId/securityGroupIds/sshKeyId를 사용자가 직접 지정한 model.CreateNodeGroupReq를 쓴다.
// dynamic 경로와 달리 nodeUserPassword를 그대로 전송한다(model.CreateNodeGroupReq에 존재하는 필드 —
// WEB-BUG-063이 숨긴 것은 dynamic 전용 model.CreateNodeGroupDynamicReq 쪽이다).
export async function mciStatic(mciName, mciDesc, Express_Server_Config_Arr, nsId, policyOnPartialFailure, labels) {

  const nodeGroups = Express_Server_Config_Arr.map(config => ({
    name: config.name,
    specId: config.commonSpec,
    imageId: config.commonImage,
    connectionName: config.connectionName,
    description: config.description,
    nodeGroupSize: parseInt(config.subGroupSize) || 1,
    rootDiskSize: (config.rootDiskSize !== "" && config.rootDiskSize !== undefined) ? parseInt(config.rootDiskSize) : 0,
    rootDiskType: config.rootDiskType,
    vNetId: config.vNetId,
    subnetId: config.subnetId,
    securityGroupIds: config.securityGroupIds || [],
    sshKeyId: config.sshKeyId,
    ...(config.nodeUserPassword ? { nodeUserPassword: config.nodeUserPassword } : {}),
    ...(config.label && Object.keys(config.label).length > 0 ? { label: config.label } : {})
  }));

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
      "label": labels || {},
      "nodeGroups": nodeGroups,
      "policyOnPartialFailure": policyOnPartialFailure,
      // 단일 명령은 phase 1개로 표현 (cb-tumblebug v0.12.29+ postCommands 배열 구조)
      ...(command.length ? {
        "postCommands": [{ "command": command, "userName": "cb-user" }]
      } : {})
    }
  }

  // PostInfra(비-dynamic)는 PostInfraDynamic과 달리 완전 동기 API다 — 노드 생성이
  // 끝날 때까지 응답하지 않는다(실측 40초 이상). 응답을 직접 기다렸다가 navigate하면
  // 그 시간만큼 화면이 멈춰 있어야 한다. mciDynamic()과 동일하게 fire-and-forget으로
  // 쏘고 즉시 navigate한다 — PostInfra를 ASYNC_TRACK_OPERATION_IDS(front)/
  // AsyncTrackOperationIDs(api) 허용목록에 추가해뒀으므로, api의
  // async_request_poller가 cb-tumblebug의 reqID 기반 진행상황(RequestMap)을
  // 별도로 폴링해 완료를 추적한다. x-request-id를 보내지 않으면(또는 허용목록에
  // 없으면) 이 추적이 동작하지 않으므로 그 경우엔 응답을 직접 기다려야 한다.
  var controller = "/api/" + "mc-infra-manager/" + "PostInfra";
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'PostInfra',
    'Infra create (Expert): ' + mciName
  );
  webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    undefined,
    tracked.httpOptions
  );

  window.location = "/webconsole/operations/manage/workloads/infraworkloads"
}

// Add NodeGroup(Extend VM) Done 시점 단건 사전 검증.
// 핸들러가 infra 존재를 선검증하므로 기존 infra에만 사용 가능 — 신규 Create 플로우는 mciDynamicReview(단건 배열) 사용.
// 응답 responseData는 review 단건 객체(infra 래퍼 없음).
export async function vmDynamicReview(mciId, nsId, config) {
  const data = {
    pathParams: {
      nsId: nsId,
      infraId: mciId,
    },
    request: {
      "imageId": config.commonImage,
      "specId": config.commonSpec,
      "connectionName": config.connectionName,
      "description": config.description,
      "name": config.name,
      "nodeGroupSize": parseInt(config.subGroupSize) || 1,
      "rootDiskSize": (config.rootDiskSize !== "" && config.rootDiskSize !== undefined) ? parseInt(config.rootDiskSize) : 0,
      "rootDiskType": config.rootDiskType,
      ...(config.zone ? { zone: config.zone } : {}),
      ...(config.label && Object.keys(config.label).length > 0 ? { label: config.label } : {}),
      ...(config.vNetTemplateId ? { vNetTemplateId: config.vNetTemplateId } : {}),
      ...(config.sgTemplateId ? { sgTemplateId: config.sgTemplateId } : {})
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "PostInfraDynamicNodeGroupNodeReview";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  return response;
}

export async function vmDynamic(mciId, nsId, Express_Server_Config_Arr) {

  // 서버 body가 단일 CreateNodeGroupDynamicReq이므로 nodeGroup별로 순차 호출
  var controller = "/api/" + "mc-infra-manager/" + "PostInfraNodeGroupDynamic";
  const responses = [];
  for (const obj of Express_Server_Config_Arr) {
    const data = {
      pathParams: {
        nsId: nsId,
        infraId: mciId,
      },
      request: {
        "imageId": obj.commonImage,
        "specId": obj.commonSpec,
        "connectionName": obj.connectionName,
        "description": obj.description,
        "name": obj.name,
        "nodeGroupSize": parseInt(obj.subGroupSize) || 1,
        "rootDiskSize": (obj.rootDiskSize !== "" && obj.rootDiskSize !== undefined) ? parseInt(obj.rootDiskSize) : 0,
        "rootDiskType": obj.rootDiskType,
        ...(obj.zone ? { zone: obj.zone } : {}),
        ...(obj.label && Object.keys(obj.label).length > 0 ? { label: obj.label } : {}),
        ...(obj.vNetTemplateId ? { vNetTemplateId: obj.vNetTemplateId } : {}),
        ...(obj.sgTemplateId ? { sgTemplateId: obj.sgTemplateId } : {})
      }
    }

    const ngName = (obj && obj.name) ? obj.name : 'nodegroup';
    const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
      'PostInfraNodeGroupDynamic',
      'NodeGroup add: ' + ngName
    );
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data,
      false,
      tracked.httpOptions
    );
    responses.push(response);
  }
  return responses;
}

// Expert 모드 Extend Node — 비-dynamic PostInfraNode(model.CreateNodeGroupReq).
// vmDynamic()과 동일하게 nodeGroup별로 순차 호출한다(PostInfraNode는 단건 API).
export async function vmStatic(mciId, nsId, Express_Server_Config_Arr) {

  var controller = "/api/" + "mc-infra-manager/" + "PostInfraNode";
  const responses = [];
  for (const obj of Express_Server_Config_Arr) {
    const data = {
      pathParams: {
        nsId: nsId,
        infraId: mciId,
      },
      request: {
        "name": obj.name,
        "specId": obj.commonSpec,
        "imageId": obj.commonImage,
        "connectionName": obj.connectionName,
        "description": obj.description,
        "nodeGroupSize": parseInt(obj.subGroupSize) || 1,
        "rootDiskSize": (obj.rootDiskSize !== "" && obj.rootDiskSize !== undefined) ? parseInt(obj.rootDiskSize) : 0,
        "rootDiskType": obj.rootDiskType,
        "vNetId": obj.vNetId,
        "subnetId": obj.subnetId,
        "securityGroupIds": obj.securityGroupIds || [],
        "sshKeyId": obj.sshKeyId,
        ...(obj.nodeUserPassword ? { nodeUserPassword: obj.nodeUserPassword } : {}),
        ...(obj.label && Object.keys(obj.label).length > 0 ? { label: obj.label } : {})
      }
    }

    const ngName = (obj && obj.name) ? obj.name : 'nodegroup';
    const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
      'PostInfraNode',
      'NodeGroup add (Expert): ' + ngName
    );
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data,
      false,
      tracked.httpOptions
    );
    responses.push(response);
  }
  return responses;
}

// Expert 모드 precheck — spec+image 조합 호환성만 검증한다(Expert는 dynamic review 대상이 아님).
export async function specImagePairReview(specId, imageId, rootDiskType, zone) {
  const data = {
    Request: {
      "specId": specId,
      "imageId": imageId,
      ...(rootDiskType ? { rootDiskType } : {}),
      ...(zone ? { zone } : {})
    }
  };

  var controller = "/api/" + "mc-infra-manager/" + "PostSpecImagePairReview";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  return response;
}

export async function mciRecommendVm(data) {
  var controller = "/api/" + "mc-infra-manager/" + "RecommendSpec";
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
    request: searchParams
  };

  var controller = "/api/" + "mc-infra-manager/" + "SearchImage";
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
  var vmCloudConnectionMap = calculateConnectionCount(mciData.node);

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
export async function postScaleOutNodeGroup(nsId, mciId, nodegroupId, numVMsToAdd) {
  if (nsId == "") {
    alert("Project has not set")
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
      infraId: mciId,
      nodegroupId: nodegroupId
    },
    queryParams: {
      async: "true"
    },
    Request: {
      "numNodesToAdd": numVMsToAdd,
    }
  };

  var controller = "/api/" + "mc-infra-manager/" + "PostInfraNodeGroupScaleOut";
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'PostInfraNodeGroupScaleOut',
    'ScaleOut: ' + nodegroupId + ' +' + numVMsToAdd
  );
  webconsolejs["common/api/http"].commonAPIPost(controller, data, false, tracked.httpOptions)
    .catch(err => console.error("ScaleOut background error:", err));
  return { status: "requested" };

}

// Policy API 관련 
export async function getPolicyList(nsId) {

  if (nsId == "") {
    console.log("Project has not set")
    return [];
  }

  var data = {
    pathParams: {
      nsId: nsId,
    },
  };

  var controller = "/api/" + "mc-infra-manager/" + "GetAllInfraPolicy";
  
  try {
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    )

    var policyList = response.data.responseData;
    return policyList || [];
  } catch (error) {
    // 404 에러 (정책이 없는 경우)는 정상적인 상황이므로 빈 배열 반환
    if (error.response && error.response.status === 404) {
      console.log("No policy data found for namespace:", nsId);
      return [];
    }
    
    // 다른 에러는 그대로 throw
    console.error("Error fetching policy list:", error);
    throw error;
  }
}

export async function deletePolicy(nsId, mciId) {
  if (nsId == "") {
    alert("Project has not set")
    return;
  }

  let data = {
    pathParams: {
      nsId: nsId,
      infraId: mciId,
    },
    queryParams: {
      option: "force"
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "DelInfraPolicy";
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
      infraId: mciId,
    },
    Request: {
      policy: policy
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "PostInfraPolicy";
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

  const controller = "/api/" + "mc-infra-manager/" + "CreateOrUpdateLabel";
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

  const controller = "/api/" + "mc-infra-manager/" + "GetLabels";
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

  const controller = "/api/" + "mc-infra-manager/" + "RemoveLabel";
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

  const controller = "/api/mc-infra-manager/GetResourcesByLabelSelector";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  
  return response;
}
