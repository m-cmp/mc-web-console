// PMK API 관련 

// 받아온 project(namespace)로 MciList GET
export async function getClusterList(nsId) {

  if (nsId == "") {
    console.log("Project has not set")
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
    },
  };

  var controller = "/api/" + "mc-infra-manager/" + "GetAllK8sCluster";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  var pmkList = response.data.responseData;

  return pmkList
}

export async function getCluster(nsId, clusterId) {
  if (nsId == "" || nsId == undefined || clusterId == undefined || clusterId == "") {
    console.log(" undefined nsId: " + nsId + " clusterId " + clusterId);
    return;
  }
  const data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: clusterId
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "GetK8sCluster";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  // error check를 위해 response를 return
  return response
}

export async function CreateCluster(clusterName, selectedConnection, clusterVersion, selectedVpc, selectedSubnet, selectedSecurityGroup, Create_Cluster_Config_Arr, selectedNsId) {

  var obj = {}

  obj['connectionName'] = selectedConnection; // 선택된 Connection
  obj['name'] = clusterName; // 클러스터 이름
  obj['description'] = Create_Cluster_Config_Arr.description || ""; // 설명 (옵션)
  obj['version'] = clusterVersion; // 선택된 Kubernetes 버전
  obj['vNetId'] = selectedVpc; // VPC ID
  obj['subnetIds'] = [selectedSubnet]; // Subnet ID (배열로 전달)
  obj['securityGroupIds'] = [selectedSecurityGroup]; // Security Group ID (배열로 전달)

  // NodeGroupList가 있으면 추가 (조건부로 추가)
  if (Create_Cluster_Config_Arr.k8sNodeGroupList && Create_Cluster_Config_Arr.k8sNodeGroupList.length > 0) {
    obj['k8sNodeGroupList'] = Create_Cluster_Config_Arr.k8sNodeGroupList.map(group => ({
      desiredNodeSize: group.desiredNodeSize || "1",
      imageId: group.imageId || "",
      maxNodeSize: group.maxNodeSize || "3",
      minNodeSize: group.minNodeSize || "1",
      name: group.name || "ng-01",
      onAutoScaling: group.onAutoScaling || "false",
      rootDiskSize: group.rootDiskSize || "40",
      rootDiskType: group.rootDiskType || "cloud_essd",
      specId: group.specId || "",
      sshKeyId: group.sshKeyId || ""
    }));
  }

  const data = {
    pathParams: {
      "nsId": selectedNsId
    },
    Request: {
      "connectionName": obj['connectionName'],
      "name": obj['name'],
      "description": obj['description'],
      "version": obj['version'],
      "vNetId": obj['vNetId'],
      "subnetIds": obj['subnetIds'],
      "securityGroupIds": obj['securityGroupIds'],
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "PostK8sCluster";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  alert("생성요청 완료");
  var urlParamMap = new Map();

  // 생성요청했으므로 결과를 기다리지 않고 mciList로 보냄
  // webconsolejs["common/util"].changePage("MciMng", urlParamMap)

}

export async function getVpcList(connectionName, nsId) {

  if (nsId == "") {
    console.log("Project has not set")
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
    },
    queryParams: {
      filterKey: "cspResourceName",
      filterVal: connectionName
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "GetAllVNet";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  console.log("vpcList : ", response)
  var vpcList = response.data.responseData;

  return vpcList

}

export async function getSubnetList(vNetId, nsId) {
  // TODO : getSubnet api로 변경
  // 현재 subnet관련 api 안됨
  if (nsId == "") {
    console.log("Project has not set")
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
      vNetId: vNetId,
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "Getvnet"
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  console.log("subnetList : ", response.data.responseData.subnetInfoList)
  var subnetList = response.data.responseData.subnetInfoList

  return subnetList

  // var data = {
  //   pathParams: {
  //     nsId: nsId,
  //     vNetId: vNetId,
  //   }
  // }

  // var controller = "/api/" + "mc-infra-manager/" + "Getallsubnet";
  // const response = await webconsolejs["common/api/http"].commonAPIPost(
  //   controller,
  //   data
  // )

  // console.log("subnetList : ", response)
  // var subnetList = response.data.responseData;

  // return subnetList

}

export async function getSecurityGroupList(vNetId, nsId) {

  if (nsId == "") {
    console.log("Project has not set")
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
    },
    queryParams: {
      filterKey: "vNetId",
      filterVal: vNetId
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "Getallsecuritygroup";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  console.log("securityGroupList : ", response.data.responseData)
  var securityGroupList = response.data.responseData;

  return securityGroupList

}

export async function getAvailableK8sClusterVersion(providerName, regionName) {
  var data = {
    queryParams: {
      providerName: providerName,
      regionName: regionName
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "Getavailablek8sclusterversion";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  console.log("availablek8sclusterversion : ", response)
  var availablek8sclusterversionList = response.data.responseData;

  return availablek8sclusterversionList

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


  var controller = "/api/" + "PostMciVmDynamic";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  console.log("create VMdynamic : ", response)
}

export async function mciRecommendVm(data) {
  var controller = "/api/" + "RecommendMCISPlan(FilterAndPriority)";
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

  let controller = "/api/" + "mc-infra-manager/" + "RetrieveRegionListFromCsp";
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
export function calculateConnectionCount(clusterList) {

  var clusterCloudConnectionCountMap = new Map();

  for (var vmIndex in clusterList) {
    var aCluster = clusterList[vmIndex];
    var location = aCluster.connectionConfig;
    if (!webconsolejs["common/util"].isEmpty(location)) {

      var cloudType = location.providerName;
      if (clusterCloudConnectionCountMap.has(cloudType)) {

        clusterCloudConnectionCountMap.set(
          cloudType,
          clusterCloudConnectionCountMap.get(cloudType) + 1
        );
      } else {
        clusterCloudConnectionCountMap.set(cloudType, 0);
      }
    }
  }

  return clusterCloudConnectionCountMap;
}




// MCIS 상태를 UI에서 표현하는 방식으로 변경
export function getPmkStatusFormatter(pmkFullStatus) {
  console.log("getMciStatus " + pmkFullStatus);
  var statusArr = pmkFullStatus.split("-");
  var returnStatus = statusArr[0].toLowerCase();

  if (pmkFullStatus.toLowerCase().indexOf("running") > -1) {
    returnStatus = "running";
  } else if (pmkFullStatus.toLowerCase().indexOf("suspend") > -1) {
    returnStatus = "stop";
  } else if (pmkFullStatus.toLowerCase().indexOf("terminate") > -1) {
    returnStatus = "terminate";
    // TODO : partial도 있는데... 처리를 어떻게 하지??
  } else {
    returnStatus = "terminate";
  }
  console.log("after status " + returnStatus);
  return returnStatus;
}

// Mci 상태를 icon으로 
export function getPmkStatusIconFormatter(pmkDispStatus) {
  var pmkStatusIcon = "";
  if (pmkStatusIcon == "running") {
    pmkStatusIcon = "icon_running.svg"
  } else if (pmkStatusIcon == "include") {
    pmkStatusIcon = "icon_stop.svg"
  } else if (pmkStatusIcon == "suspended") {
    pmkStatusIcon = "icon_stop.svg"
  } else if (pmkStatusIcon == "terminate") {
    pmkStatusIcon = "icon_terminate.svg"
  } else {
    pmkStatusIcon = "icon_stop.svg"
  }
  return pmkStatusIcon
}

// Mci에 구성된 vm들의 provider들 imgTag로
export function getPmkInfoProviderNames(pmkData) {

  var pmkProviderNames = "";
  var vmCloudConnectionMap = calculateConnectionCount(
    pmkData.vm
  );
  console.log("vmCloudConnectionMap", vmCloudConnectionMap)
  if (vmCloudConnectionMap) {
    vmCloudConnectionMap.forEach((value, key) => {
      pmkProviderNames +=
        '<img class="img-fluid" class="rounded" width="30" src="/assets/images/common/img_logo_' +
        key +
        '.png" alt="' +
        key +
        '"/>';
    });
  }
  return pmkProviderNames
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


// 해당 mci에서 상태값들을 count : 1개 mci의 상태는 1개만 있으므로 running, stop, terminate 중 1개만 1, 나머지는 0
// dashboard, mci 에서 사용
export function calculatePmkStatusCount(mciData) {
  console.log("calculateMciStatusCount");

  console.log("mciData : ", mciData);
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
      console.log("statusCount part", aMci);
      var statusCountObj = aMci.statusCount;
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
    } else if (aMci.vm) {
      console.log("statusCount part list part");
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

