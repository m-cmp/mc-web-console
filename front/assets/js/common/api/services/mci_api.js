// MCI API 관련 


// 받아온 project(namespace)로 MciList GET
export async function getMciList(nsId) {

  if (nsId == "") {
    console.log("Project has not set")
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

// mci 단건 조회
export async function getMci(nsId, mciId) {
  if (nsId == "" || nsId == undefined || mciId == undefined || mciId == "") {
    console.log(" undefined nsId: " + nsId + " mciId " + mciId);
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
    console.log(" undefined nsId: " + nsId, + " mciId " + mciId, ", vmId " + vmId);
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
  console.log("mciLifeCycle option : ", type)
  console.log("selected mci : ", currentMciId)

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
    console.log("mciLifeCycle response : ", response)
  }

export function mciDelete(currentMciId, nsId) {
  console.log("mciDeletemciDeletemciDeletemciDelete")
  console.log("mciDeletemciDeletemciDeletemciDelete", currentMciId, nsId)

  // for (const mci of checked_array) {
  //   console.log(mci.id)
    
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
    console.log("mciLifeCycle response : ", response)
  }
// }

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
  console.log("vmLifeCycle response : ", response)

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
  console.log("vmLifeCycle response : ", response)

}

export async function mciDynamic(mciName, mciDesc, Express_Server_Config_Arr, nsId) {

  var obj = {}
  obj['name'] = mciName
  obj['description'] = mciDesc
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

  var controller = "/api/" + "mc-infra-manager/" + "PostMciDynamic";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  alert("생성요청 완료");
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


  var controller = "/api/" + "mc-infra-manager/" + "PostMciVmDynamic";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  console.log("create VMdynamic : ", response)
}

export async function mciRecommendVm(data) {
  var controller = "/api/" + "mc-infra-manager/" + "RecommendVm";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  console.log("mcirecommendvm response ", response.data.responseData)

  return response.data
}
// get all provider

// get all registered region list
export async function getProviderList() {

  let controller = "/api/" + "mc-infra-manager/" + "GetProviderList";
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

  let controller = "/api/" + "mc-infra-manager/" + "GetRegions";
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
  console.log("getMciStatusgetMciStatus", mciFullStatus);

  let returnStatus = mciFullStatus.toLowerCase();

  if (returnStatus.includes("partial")) {
    returnStatus = "partial";
  } else if (returnStatus.includes("running")) {
    returnStatus = "running";
  } else if (returnStatus.includes("suspended")) {
    returnStatus = "suspended";
  } else if (returnStatus.includes("terminated")) {
    returnStatus = "terminated";
  } else if (returnStatus.includes("failed")) {
    returnStatus = "failed";
  }

  return returnStatus;
}

// Mci 상태를 icon으로 
export function getMciStatusIconFormatter(mciDispStatus) {
  var mciStatusIcon = "";
  if (mciDispStatus == "running") {
    mciStatusIcon = "icon_running.svg"
  } else if (mciDispStatus == "include") {
    mciStatusIcon = "icon_stop.svg"
  } else if (mciDispStatus == "suspended") {
    mciStatusIcon = "icon_stop.svg"
  } else if (mciDispStatus == "terminated") {
    mciStatusIcon = "icon_terminate.svg"
  } else {
    mciStatusIcon = "icon_terminate.svg"
  }
  return mciStatusIcon
}

// Mci에 구성된 vm들의 provider들 imgTag로
export function getMciInfoProviderNames(mciData) {

  var mciProviderNames = "";
  var vmCloudConnectionMap = calculateConnectionCount(
    mciData.vm
  );
  console.log("vmCloudConnectionMap", vmCloudConnectionMap)
  if (vmCloudConnectionMap) {
    vmCloudConnectionMap.forEach((value, key) => {
      console.log("provider ", key)
      mciProviderNames +=
        '<img class="img-fluid" width="30" src="/assets/images/common/img_logo_' +
        (key == "" ? "mcmp" : key) +
        '.png" alt="' +
        key +
        '" style="margin-right: 5px;"/>';
    });
  }
  return mciProviderNames
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


// VM 상태 별로 Style class로 색 설정
export function getVmStatusStyleClass(vmDispStatus) {
  var vmStatusClass = "bg-green-lt";
  if (vmDispStatus == "running") {
    vmStatusClass = "bg-green-lt"
  } else if (vmDispStatus == "include") {
    vmStatusClass = "bg-red-lt"
  } else if (vmDispStatus == "suspended") {
    vmStatusClass = "bg-red-lt"
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
  //console.log("calculateMciStatusCount");

  //console.log("mciData : ", mciData);
  var mciStatusCountMap = new Map();
  mciStatusCountMap.set("running", 0);
  mciStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  mciStatusCountMap.set("terminate", 0);
  try {
    var mciStatus = mciData.status;
    var mciDispStatus = getMciStatusFormatter(mciStatus); // 화면 표시용 status

    if (mciStatus != "") {
      // mci status 가 없는 경우는 skip
      if (mciStatusCountMap.has(mciDispStatus)) {
        mciStatusCountMap.set(
          mciDispStatus,
          mciStatusCountMap.get(mciDispStatus) + 1
        );
      }
    }
  } catch (e) {
    console.error("mci status error", e);
  }
  // console.log(mciStatusCountMap);
  return mciStatusCountMap;
}


// vm의 상태별 count
export function calculateVmStatusCount(aMci) {
  // console.log("calculateVmStatusCount")
  // console.log(vmList)
  var sumVmCnt = 0;
  var vmStatusCountMap = new Map();
  vmStatusCountMap.set("running", 0);
  vmStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  vmStatusCountMap.set("terminate", 0);

  try {
    if (aMci.statusCount) {
      //console.log("statusCount part", aMci);
      var statusCountObj = aMci.statusCount;
      //console.log(statusCountObj);
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
    } else if (aMci.vm) {
      // console.log("statusCount part list part");
      vmList = aMci.vm;
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
    console.error("mci status error", e); // 에러 로그 처리 예시
  }
  return vmStatusCountMap;
}

