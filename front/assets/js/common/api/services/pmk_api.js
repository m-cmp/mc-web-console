// PMK API 관련 

// 받아온 project(namespace)로 PmkList GET
export async function getClusterList(nsId) {

  if (nsId == "") {
    alert("Project has not set")
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
  // Validation: Check nsId
  if (!nsId || nsId === "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Project Selection Required',
      'Please select a project first before viewing cluster details.'
    );
    return { status: 400, error: 'No project selected' };
  }

  // Validation: Check clusterId
  if (!clusterId || clusterId === "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Cluster Selection Required',
      'Please select a cluster first.'
    );
    return { status: 400, error: 'No cluster selected' };
  }

  // API call with error handling
  try {
    const data = {
      pathParams: {
        nsId: nsId,
        k8sClusterId: clusterId
      }
    };

    var controller = "/api/" + "mc-infra-manager/" + "Getk8scluster";
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    );

    // error check를 위해 response를 return
    return response;
  } catch (error) {
    console.error('Error in getCluster API call:', error);
    // API 호출 실패 시에도 에러 객체 반환
    return {
      status: 500,
      error: 'API call failed: ' + (error.message || 'Unknown error')
    };
  }
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
  if (Create_Cluster_Config_Arr[0].k8sNodeGroupList && Create_Cluster_Config_Arr[0].k8sNodeGroupList.length > 0) {
    obj['k8sNodeGroupList'] = Create_Cluster_Config_Arr[0].k8sNodeGroupList.map(group => ({
      desiredNodeSize: group.desiredNodeSize,
      imageId: group.imageId,
      maxNodeSize: group.maxNodeSize,
      minNodeSize: group.minNodeSize,
      name: group.name,
      onAutoScaling: group.onAutoScaling,
      rootDiskSize: group.rootDiskSize,
      rootDiskType: group.rootDiskType,
      specId: group.specId,
      sshKeyId: group.sshKeyId
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
      "k8sNodeGroupList": obj['k8sNodeGroupList']
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "PostK8sCluster";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  alert("Creation request completed");
  var urlParamMap = new Map();

  // 생성요청했으므로 결과를 기다리지 않고 pmkList로 보냄
  // webconsolejs["common/util"].changePage("PmkMng", urlParamMap)
  window.location = "/webconsole/operations/manage/workloads/pmkwls"
}

export async function getVpcList(connectionName, nsId) {

  if (nsId == "") {
    alert("Project has not set")
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

  var vpcList = response.data.responseData;

  return vpcList

}

export async function getSubnetList(vNetId, nsId) {
  // TODO : getSubnet api로 변경
  // 현재 subnet관련 api 안됨
  if (nsId == "") {
    alert("Project has not set")
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
    alert("Project has not set")
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

  var availablek8sclusterversionList = response.data.responseData;

  return availablek8sclusterversionList

}

export async function vmDynamic(pmkId, nsId, Express_Server_Config_Arr) {

  var obj = {}
  obj = Express_Server_Config_Arr[0]
  const data = {
    pathParams: {
      nsId: nsId,
      pmkId: pmkId,
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


  var controller = "/api/" + "PostPmkVmDynamic";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
}

// export async function pmkRecommendVm(data) {
//   var controller = "/api/" + "RecommendMCISPlan(FilterAndPriority)";
//   const response = await webconsolejs["common/api/http"].commonAPIPost(
//     controller,
//     data
//   );

//   console.log("pmkrecommendvm response ", response.data.responseData)

//   return response.data
// }
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

  let controller = "/api/" + "mc-infra-manager/" + "RetrieveRegionListFromCsp";
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

// pmk내 vm들의 provider별 connection count
export function calculateConnectionCount(clusterList) {

  var clusterCloudConnectionCountMap = new Map();

  for (var clusterIndex in clusterList) {
    var aCluster = clusterList[clusterIndex];
    var location = aCluster.connectionConfig;
    var location = aCluster.provider;
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

export async function createNode(k8sClusterId, nsId, Create_Node_Config_Arr) {
  // 1. 배열 검증
  if (!Create_Node_Config_Arr || Create_Node_Config_Arr.length === 0) {
    console.error('No node configuration provided');
    webconsolejs["common/util"].showToast('No node configuration to create', 'error');
    return;
  }

  var obj = Create_Node_Config_Arr[0];
  
  // 2. 필수 필드 검증
  if (!obj.name || !obj.specId || !obj.imageId || !obj.sshKeyId || !obj.minNodeSize || !obj.maxNodeSize || !obj.onAutoScaling) {
    console.error('Missing required fields:', obj);
    webconsolejs["common/util"].showToast('Missing required fields for node creation', 'error');
    return;
  }

  // 3. 데이터 준비 (기본값 포함)
  const data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
    },
    request: {
      "desiredNodeSize": obj.desiredNodeSize || "1",
      "imageId": obj.imageId,
      "maxNodeSize": obj.maxNodeSize || obj.desiredNodeSize || "1",
      "minNodeSize": obj.minNodeSize || obj.desiredNodeSize || "1",
      "name": obj.name,
      "onAutoScaling": obj.onAutoScaling || "false",
      "rootDiskSize": obj.rootDiskSize || "",
      "rootDiskType": obj.rootDiskType || "",
      "specId": obj.specId,
      "sshKeyId": obj.sshKeyId
    }
  };

  var controller = "/api/" + "mc-infra-manager/" + "Postk8snodegroup";
  
  // 4. API 호출 및 에러 처리
  try {
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    );
    
    // 성공 처리
    if (response && response.status === 200) {
      webconsolejs["common/util"].showToast('Node group creation request completed successfully', 'success');
      return response;
    } else {
      console.error('Node creation failed:', response);
      webconsolejs["common/util"].showToast('Failed to create node group', 'error');
      return response;
    }
  } catch (error) {
    console.error('Error creating node:', error);
    webconsolejs["common/util"].showToast('Error creating node group: ' + (error.message || 'Unknown error'), 'error');
    throw error;
  }
}

export async function getSshKey(nsId) {

  if (nsId == "") {
    alert("Project has not set")
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
    },
  };

  var controller = "/api/" + "mc-infra-manager/" + "Getallsshkey";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  var sshKeyList = response
  return sshKeyList

}

export async function getAvailablek8sClusterNodeImage(providerName, regionName) {

  var data = {
    queryParams: {
      providerName: providerName,
      regionName: regionName
    },
  };

  var controller = "/api/" + "mc-infra-manager/" + "Getavailablek8sclusternodeimage";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  var imageList = response
  return imageList


}

// // MCIS 상태를 UI에서 표현하는 방식으로 변경
export function getPmkStatusFormatter(pmkFullStatus) {
//   console.log("getPmkStatusFormatter " + pmkFullStatus);
//   var statusArr = pmkFullStatus.split("-");
  var returnStatus = pmkFullStatus

//   // if (pmkFullStatus.toLowerCase().indexOf("running") > -1) {
//   if (pmkFullStatus.toLowerCase().indexOf("Active") > -1) {
//     returnStatus = "active";
//   } else if (pmkFullStatus.toLowerCase().indexOf("suspend") > -1) {
//     returnStatus = "stop";
//   } else if (pmkFullStatus.toLowerCase().indexOf("terminate") > -1) {
//     returnStatus = "terminate";
//     // TODO : partial도 있는데... 처리를 어떻게 하지??
//   } else {
//     returnStatus = "terminate";
//   }
//   console.log("after status " + returnStatus);
  return returnStatus;
}

// Pmk 상태를 icon으로 
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

// Pmk에 구성된 vm들의 provider들 imgTag로
export function getPmkInfoProviderNames(pmkData) {

  var pmkProviderNames = "";
  var vmCloudConnectionMap = calculateConnectionCount(
    pmkData.vm
  );
  if (vmCloudConnectionMap) {
    vmCloudConnectionMap.forEach((value, key) => {
      pmkProviderNames +=
        '<img class="img-fluid" class="rounded" width="30" src="/assets/images/common/img_logo_' +
        (key==""?"mcmp":key) +
        '.png" alt="' +
        key +
        '"/>';
    });
  }
  return pmkProviderNames
}


// VM 상태 별로 Style class로 색 설정
export function getVmStatusStyleClass(nodeStatus) {
  var nodeStatusClass = "bg-info";
  if (nodeStatus == "Active") {
    nodeStatusClass = "bg-info"
  } else if (nodeStatus == "Creating") {
    nodeStatusClass = "bg-info"
  } else if (nodeStatus == "Inactive") {
    nodeStatusClass = "bg-red"
  } else if (nodeStatus == "Updating") {
    nodeStatusClass = "bg-red"
  } else if (nodeStatus == "Deleting") {
    nodeStatusClass = "bg-secondary"
  } else {
    nodeStatusClass = "bg-secondary"
  }
  return nodeStatusClass;
}


// 해당 pmk에서 상태값들을 count : 1개 pmk의 상태는 1개만 있으므로 running, stop, terminate 중 1개만 1, 나머지는 0
// dashboard, pmk 에서 사용
export function calculatePmkStatusCount(pmkData) {
  var pmkStatusCountMap = new Map();
  pmkStatusCountMap.set("running", 0);
  pmkStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  pmkStatusCountMap.set("terminate", 0);
  try {
    var pmkStatus = pmkData.status;
    var pmkDispStatus = getPmkStatusFormatter(pmkStatus); // 화면 표시용 status

    if (pmkStatus != "") {
      // pmk status 가 없는 경우는 skip
      if (pmkStatusCountMap.has(pmkDispStatus)) {
        pmkStatusCountMap.set(
          pmkDispStatus,
          pmkStatusCountMap.get(pmkDispStatus) + 1
        );
      }
    }
  } catch (e) {
    console.error("pmk status error", e);
  }
  return pmkStatusCountMap;
}


// vm의 상태별 count
export function calculateVmStatusCount(aPmk) {
  var sumVmCnt = 0;
  var vmStatusCountMap = new Map();
  vmStatusCountMap.set("running", 0);
  vmStatusCountMap.set("stop", 0); // partial 도 stop으로 보고있음.
  vmStatusCountMap.set("terminate", 0);

  try {
    if (aPmk.statusCount) {
      var statusCountObj = aPmk.statusCount;
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
    } else if (aPmk.vm) {
      vmList = aPmk.vm;
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
    console.error("pmk status error", e); // 에러 로그 처리 예시
  }
  return vmStatusCountMap;
}

export function pmkDelete(nsId, k8sClusterId) {
  // API 레벨 Validation (추가 안전장치)
  if (!nsId || nsId === '' || !k8sClusterId || k8sClusterId === '') {
    console.error('Invalid parameters for PMK deletion:', {
      nsId: nsId,
      k8sClusterId: k8sClusterId
    });
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Invalid Parameters',
      'Invalid parameters for PMK deletion. Please try again.'
    );
    return;
  }

  let data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
    },
  };
  let controller = '/api/' + 'mc-infra-manager/' + 'Deletek8scluster';
  let response = webconsolejs['common/api/http'].commonAPIPost(
    controller,
    data
  );
  return response;
}

export function nodeGroupDelete(nsId, k8sClusterId, k8sNodeGroupName) {
  // API 레벨 Validation (추가 안전장치)
  if (!nsId || nsId === '' || 
      !k8sClusterId || k8sClusterId === '' || 
      !k8sNodeGroupName || k8sNodeGroupName === '') {
    console.error('Invalid parameters for NodeGroup deletion:', {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
      k8sNodeGroupName: k8sNodeGroupName
    });
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Invalid Parameters',
      'Invalid parameters for NodeGroup deletion. Please try again.'
    );
    return;
  }

  let data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
      k8sNodeGroupName: k8sNodeGroupName
    },
  };
  let controller = '/api/' + 'mc-infra-manager/' + 'Deletek8snodegroup';
  let response = webconsolejs['common/api/http'].commonAPIPost(
    controller,
    data
  );
  return response;
}

// PMK용 Spec 추천 API
export async function getPmkRecommendSpec(data) {
  var controller = "/api/" + "RecommendMCISPlan(FilterAndPriority)";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response.data
}

// PMK용 Spec 목록 API
export async function getPmkSpecList(connectionName, nsId) {
  if (nsId == "") {
    alert("Project has not set")
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

  var controller = "/api/" + "mc-infra-manager/" + "GetAllVMSpec";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  var specList = response.data.responseData;

  return specList
}

// PMK용 Image 목록 API
export async function getPmkImageList(connectionName, nsId) {
  if (nsId == "") {
    alert("Project has not set")
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

  var controller = "/api/" + "mc-infra-manager/" + "GetAllVMImage";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  var imageList = response.data.responseData;

  return imageList
}

// 동적 클러스터 생성 사전 검증 API
export async function checkK8sClusterDynamic(nsId, commonSpec) {
  if (!nsId || !commonSpec) {
    return;
  }

  const data = {
    pathParams: {
      nsId: nsId
    },
    Request: {
      specId: [commonSpec]
    }
  };

  var controller = "/api/" + "mc-infra-manager/" + "Postk8sclusterdynamiccheckrequest";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response;
}

// 동적 클러스터 생성 API
export async function createK8sClusterDynamic(nsId, clusterData) {
  if (!nsId || !clusterData) {
    return;
  }

  // commonImage가 없으면 "default"로 설정
  if (!clusterData.imageId || clusterData.imageId === "") {
    clusterData.imageId = "default";
  }

  const data = {
    pathParams: {
      nsId: nsId
    },
    Request: clusterData
  };

  var controller = "/api/" + "mc-infra-manager/" + "Postk8sclusterdynamic";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response;
}