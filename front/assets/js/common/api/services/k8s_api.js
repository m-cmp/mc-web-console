// PMK API 관련 

// 받아온 project(namespace)로 PmkList GET
export async function getClusterList(nsId, options = {}) {

  if (nsId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Required', 'Please select a project first.')
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
    data,
    false,
    options
  )
  var pmkList = response.data.responseData;

  return pmkList
}

export async function getCluster(nsId, clusterId, options = {}) {
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

    var controller = "/api/" + "mc-infra-manager/" + "GetK8sCluster";
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data,
      false,
      options
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

// CSP-native auth 방식(EKS는 aws-iam-authenticator 등)의 kubeconfig 조회.
// CSP에 따라 미지원일 수 있으므로 모달 없이 에러를 그대로 반환한다 — 호출부에서 N/A 처리.
export async function getClusterKubeconfig(nsId, clusterId, options = {}) {
  if (!nsId || !clusterId) {
    return { status: 400, error: 'Missing nsId or clusterId' };
  }

  try {
    const data = {
      pathParams: {
        nsId: nsId,
        k8sClusterId: clusterId
      }
    };

    var controller = "/api/" + "mc-infra-manager/" + "GetK8sClusterKubeconfig";
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data,
      false,
      options
    );

    return response;
  } catch (error) {
    console.error('Error in getClusterKubeconfig API call:', error);
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
  // description은 배열 자체가 아니라 첫 요소(cluster_form)에 들어 있다
  obj['description'] = (Create_Cluster_Config_Arr[0] && Create_Cluster_Config_Arr[0].description) || "";
  obj['version'] = clusterVersion; // 선택된 Kubernetes 버전
  obj['vNetId'] = selectedVpc; // VPC ID
  obj['subnetIds'] = [selectedSubnet]; // Subnet ID (배열로 전달)
  obj['securityGroupIds'] = [selectedSecurityGroup]; // Security Group ID (배열로 전달)

  // NodeGroupList가 있으면 추가 (조건부로 추가)
  if (Create_Cluster_Config_Arr[0].k8sNodeGroupList && Create_Cluster_Config_Arr[0].k8sNodeGroupList.length > 0) {
    obj['k8sNodeGroupList'] = Create_Cluster_Config_Arr[0].k8sNodeGroupList.map(group => {
      const ng = {
        desiredNodeSize: parseInt(group.desiredNodeSize, 10) || 0,
        imageId: group.imageId,
        maxNodeSize: parseInt(group.maxNodeSize, 10) || 0,
        minNodeSize: parseInt(group.minNodeSize, 10) || 0,
        name: group.name,
        onAutoScaling: String(group.onAutoScaling),
        rootDiskType: group.rootDiskType,
        specId: group.specId,
        sshKeyId: group.sshKeyId
      };
      const rootDiskSize = parseInt(group.rootDiskSize, 10);
      if (!isNaN(rootDiskSize) && rootDiskSize > 0) {
        ng.rootDiskSize = rootDiskSize;
      }
      return ng;
    });
  }

  const data = {
    pathParams: {
      "nsId": selectedNsId
    },
    request: {
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

  // 클러스터 생성은 CSP에 따라 10~20분이 걸린다. 응답을 기다리지 않고 보내되,
  // requestId로 추적해 진행/완료를 toast와 navbar로 알린다 (createK8sClusterDynamic과 동일).
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'PostK8sCluster',
    'K8s create: ' + clusterName
  );
  webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    undefined,
    tracked.httpOptions
  ).catch(function (error) {
    console.error('Failed to send cluster creation request:', error);
    webconsolejs['common/util'].showToast('Failed to send cluster creation request', 'error');
  });

  return { dispatched: true };
}

export async function getVpcList(connectionName, nsId) {

  if (nsId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Required', 'Please select a project first.')
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
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Required', 'Please select a project first.')
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
      vNetId: vNetId,
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "GetVNet"
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
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Required', 'Please select a project first.')
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

  var controller = "/api/" + "mc-infra-manager/" + "GetAllSecurityGroup";
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

  var controller = "/api/" + "mc-infra-manager/" + "GetAvailableK8sVersion";
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

  var desiredNodeSize = parseInt(obj.desiredNodeSize || obj.subGroupSize) || 1

  // K8sNodeGroupDynamicReq: specId/imageId 필수, 노드 수는 desired/min/maxNodeSize 체계
  const data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: pmkId,
    },
    request: {
      "name": obj.name,
      "description": obj.description,
      "specId": obj.specId || obj.commonSpec,
      "imageId": obj.imageId || obj.commonImage,
      "desiredNodeSize": desiredNodeSize,
      "minNodeSize": parseInt(obj.minNodeSize) || desiredNodeSize,
      "maxNodeSize": parseInt(obj.maxNodeSize) || desiredNodeSize,
      "onAutoScaling": obj.onAutoScaling || "false",
      "rootDiskSize": parseInt(obj.rootDiskSize) || 0,
      "rootDiskType": obj.rootDiskType || "",
    }
  }

  var controller = "/api/" + "mc-infra-manager/" + "PostK8sNodeGroupDynamic";
  const ngName = (obj && obj.name) ? obj.name : 'nodegroup';
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'PostK8sNodeGroupDynamic',
    'K8s NG dynamic: ' + ngName
  );
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    false,
    tracked.httpOptions
  );

  return response
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

export async function getRegionList(options = {}) {

  // let data = {
  // pathParams: {
  //   providerName: "AWS",
  //   regionName: "aws-ca-west-1",
  // }
  //   };

  let controller = "/api/" + "mc-infra-manager/" + "RetrieveRegionListFromCsp";
  let response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    undefined,
    false,
    options
  );

  return response.data.responseData.region
}

export async function getCloudConnection(options = {}) {


  // test
  let data = {
    queryParams: {
      "filterVerified": true
    }
  };
  let controller = "/api/" + "mc-infra-manager/" + "GetConnConfigList";
  let response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    false,
    options
  );

  return response.data.responseData.connectionconfig
}

// ---------------------------------------------------------------------------
// Provider / Region / Connection 카탈로그
//
// Connection(ConnConfig)이 provider·region의 유일한 정본이다.
//   configName          : "nhn-kr1"   (= regionZoneInfoName, 기본 credentialHolder 기준)
//   providerName        : "nhn"
//   regionZoneInfoName  : "nhn-kr1"   (= CB-Spider 등록명 = "{provider}-{cspRegion}")
//
// RetrieveRegionListFromCsp 는 zone 단위 항목까지 내려주고(전체의 약 76%가 zone 항목)
// 그 대부분은 대응하는 Connection이 없다. 그래서 Region 목록은 이 API 대신
// Connection에서 파생시킨다 — 목록에 뜨는 Region은 항상 Connection을 하나 갖는다.
// ---------------------------------------------------------------------------

// Region select의 표시/값 포맷 ("[NHN] nhn-kr1")
export function formatRegionOption(providerName, regionZoneInfoName) {
  return "[" + String(providerName || "").toUpperCase() + "] " + regionZoneInfoName;
}

// "[NHN] nhn-kr1" → { provider: "NHN", regionZoneInfoName: "nhn-kr1" }
export function parseRegionOption(optionValue) {
  const m = String(optionValue || "").match(/^\[(.*?)\]\s*(.*)$/);
  if (!m) return { provider: "", regionZoneInfoName: String(optionValue || "").trim() };
  return { provider: m[1], regionZoneInfoName: m[2].trim() };
}

// CSP 고유 region 이름 — GetAvailableK8sVersion 등 CSP 원본 region을 받는 API용.
// "nhn" + "nhn-kr1" → "kr1". NHN은 prefix가 붙은 형태를 거부한다.
export function toCspRegionName(providerName, regionZoneInfoName) {
  const prefix = String(providerName || "").toLowerCase() + "-";
  const region = String(regionZoneInfoName || "");
  return region.toLowerCase().startsWith(prefix) ? region.slice(prefix.length) : region;
}

function matchesProvider(connection, provider) {
  if (!provider) return true;
  return String(connection.providerName || "").toLowerCase() === String(provider).toLowerCase();
}

// 해당 provider가 가진 Region 목록 (중복 제거 + 정렬)
export function listRegionOptions(connectionList, provider) {
  const seen = new Set();
  (connectionList || []).forEach(conn => {
    if (!conn || !conn.regionZoneInfoName) return;
    if (!matchesProvider(conn, provider)) return;
    seen.add(formatRegionOption(conn.providerName, conn.regionZoneInfoName));
  });
  return Array.from(seen).sort();
}

// provider(+region)에 해당하는 Connection 목록.
// region은 regionZoneInfoName 정확 일치로 비교한다 — startsWith로 비교하면
// "azure-eastus"가 "azure-eastus2"까지, "gcp-europe-west1"이 "...west10/12"까지 끌고 온다.
export function listConnectionNames(connectionList, provider, regionZoneInfoName) {
  return (connectionList || [])
    .filter(conn => conn && conn.configName && matchesProvider(conn, provider))
    .filter(conn => !regionZoneInfoName || conn.regionZoneInfoName === regionZoneInfoName)
    .map(conn => conn.configName)
    .sort();
}

// select 요소를 옵션 목록으로 다시 채운다. 기존 선택값이 목록에 남아 있으면 유지한다.
// autoSelectSingle: 후보가 정확히 1건이면 그것을 선택한다. Region을 고르면 Connection이
// 하나로 확정되는데, 목록만 좁히고 선택은 비워두면 사용자가 한 번 더 골라야 하고
// 그 사이 값이 비어 "필수값 누락"으로 막히거나 엉뚱한 값이 남는다.
export function fillSelectOptions(selector, placeholder, values, autoSelectSingle) {
  const $el = $(selector);
  if ($el.length === 0) return;
  const previous = $el.val();
  let html = '<option value="">' + placeholder + "</option>";
  values.forEach(v => {
    html += '<option value="' + v + '">' + v + "</option>";
  });
  $el.empty().append(html);
  if (previous && values.indexOf(previous) !== -1) {
    $el.val(previous);
  } else if (autoSelectSingle && values.length === 1) {
    $el.val(values[0]);
    // 프로그래매틱 .val() 은 change 를 발생시키지 않는다. Connection select 는 인라인
    // onchange 로 VPC/Subnet/SG 목록을 불러오므로, 명시적으로 트리거하지 않으면
    // 자동 선택된 값에 대한 하위 목록이 비어 있게 된다.
    $el.trigger("change");
  }
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

// CSP별 NodeGroup 동시 추가 수용 여부 — 실증으로 확인된 CSP만 true
// (gcp: 2026-07-14 실증 — 3초 간격 2건 요청 모두 201 수용, 둘 다 Active 도달.
//  tumblebug이 클러스터 단위로 직렬 처리하므로 클라이언트는 응답을 기다릴 필요 없음)
// 미실증 CSP는 순차 전송(각 응답 확인 후 다음 전송)으로 동작한다.
var K8S_NODEGROUP_CONCURRENT = {
  "gcp": true,
  "default": false
};

// 동시 dispatch 시 다음 전송까지의 간격 — 전송 직후 즉시 오류(네트워크/즉시 4xx) 감시 창
var NODEGROUP_DISPATCH_DELAY_MS = 3000;

function buildNodeGroupRequest(k8sClusterId, nsId, obj) {
  return {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
    },
    request: {
      "desiredNodeSize": parseInt(obj.desiredNodeSize) || 1,
      "imageId": obj.imageId,
      "maxNodeSize": parseInt(obj.maxNodeSize) || parseInt(obj.desiredNodeSize) || 1,
      "minNodeSize": parseInt(obj.minNodeSize) || parseInt(obj.desiredNodeSize) || 1,
      "name": obj.name,
      "onAutoScaling": obj.onAutoScaling || "false",
      "rootDiskSize": parseInt(obj.rootDiskSize) || 0,
      "rootDiskType": obj.rootDiskType || "",
      "specId": obj.specId,
      "sshKeyId": obj.sshKeyId
    }
  };
}

export async function createNode(k8sClusterId, nsId, Create_Node_Config_Arr, provider) {
  // 1. 배열 검증
  if (!Create_Node_Config_Arr || Create_Node_Config_Arr.length === 0) {
    console.error('No node configuration provided');
    webconsolejs["common/util"].showToast('No node configuration to create', 'error');
    return;
  }

  var controller = "/api/" + "mc-infra-manager/" + "PostK8sNodeGroup";

  // 2. 필수 필드 사전 검증 (min/maxNodeSize는 autoScaling OFF 시 없을 수 있으므로 제외)
  for (var v = 0; v < Create_Node_Config_Arr.length; v++) {
    var chk = Create_Node_Config_Arr[v];
    if (!chk.name || !chk.specId || !chk.imageId) {
      console.error('Missing required fields:', chk);
      webconsolejs["common/util"].showToast('Missing required fields for node creation: ' + (chk.name || '(no name)'), 'error');
      return false;
    }
  }

  var providerKey = (provider || "").toLowerCase();
  var concurrent = K8S_NODEGROUP_CONCURRENT[providerKey];
  if (concurrent === undefined) concurrent = K8S_NODEGROUP_CONCURRENT["default"];

  if (concurrent && Create_Node_Config_Arr.length > 1) {
    return await dispatchNodeGroupsConcurrently(controller, k8sClusterId, nsId, Create_Node_Config_Arr);
  }

  // 순차 전송은 유지하되(tumblebug이 클러스터 단위로 직렬 처리, 비-GCP 동시 수용은 미실증)
  // 그 체인을 기다리지 않는다 — 건당 40~47초를 스피너 없이 붙잡고 있던 원인.
  // 완료 보고와 목록 갱신은 체인 끝에서 수행한다 (동시 전송 경로와 동일한 UX).
  sendNodeGroupsSequentially(controller, k8sClusterId, nsId, Create_Node_Config_Arr);
  webconsolejs["common/util"].showToast(
    'NodeGroup creation requests dispatched (' + Create_Node_Config_Arr.length + ') — processing in background',
    'info'
  );
  return { dispatched: Create_Node_Config_Arr.length };
}

// 동시 수용 CSP: 응답을 기다리지 않고 3초 간격으로 전송(fire) — 3초 내 즉시 오류만 감시하고
// 전체 결과는 백그라운드에서 수집해 완료 시 토스트로 보고한다 (tumblebug 응답은 건당 40~47초 소요)
async function dispatchNodeGroupsConcurrently(controller, k8sClusterId, nsId, configArr) {
  var pending = [];

  for (var i = 0; i < configArr.length; i++) {
    var obj = configArr[i];
    var data = buildNodeGroupRequest(k8sClusterId, nsId, obj);
    var tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
      'PostK8sNodeGroup',
      'K8s NG create: ' + obj.name
    );

    var reqPromise = webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data,
      undefined,
      tracked.httpOptions
    );
    pending.push({ name: obj.name, promise: reqPromise });

    // 다음 전송 전 3초 대기 — 이 창에서 즉시 오류(네트워크 거부·즉시 4xx)가 나면 실패로 기록하되
    // 나머지 항목 전송은 계속한다
    if (i < configArr.length - 1) {
      var raced = await Promise.race([
        reqPromise.then(function () { return { settled: true }; }, function (e) { return { error: e }; }),
        new Promise(function (resolve) { setTimeout(function () { resolve({ pending: true }); }, NODEGROUP_DISPATCH_DELAY_MS); })
      ]);
      if (raced.error) {
        console.error('Node creation dispatch failed early:', obj.name, raced.error);
      }
    }
  }

  // 전체 결과는 백그라운드 수집 — UI는 붙잡지 않는다
  Promise.allSettled(pending.map(function (p) { return p.promise; })).then(function (results) {
    var failedNames = [];
    for (var r = 0; r < results.length; r++) {
      var res = results[r];
      var ok = res.status === 'fulfilled' && res.value && (res.value.status === 200 || res.value.status === 201);
      if (!ok) failedNames.push(pending[r].name);
    }
    if (failedNames.length === 0) {
      webconsolejs["common/util"].showToast('Node group creation request completed successfully (' + results.length + ')', 'success');
    } else {
      webconsolejs["common/util"].showToast('Failed to create node group: ' + failedNames.join(', '), 'error');
    }
    // 결과 수신 시점에 목록 갱신 (생성 접수 반영)
    if (webconsolejs["pages/operation/manage/k8sworkloads"] &&
        typeof webconsolejs["pages/operation/manage/k8sworkloads"].refreshPmkList === 'function') {
      webconsolejs["pages/operation/manage/k8sworkloads"].refreshPmkList();
    }
  });

  webconsolejs["common/util"].showToast('NodeGroup creation requests dispatched (' + configArr.length + ') — processing in background', 'info');
  return { dispatched: configArr.length };
}

// 미실증/제한 CSP: 각 응답 확인 후 다음 전송 (기존 동작 — 한 건 실패해도 나머지는 계속)
async function sendNodeGroupsSequentially(controller, k8sClusterId, nsId, configArr) {
  var responses = [];
  var failedNames = [];

  for (var i = 0; i < configArr.length; i++) {
    var obj = configArr[i];
    var data = buildNodeGroupRequest(k8sClusterId, nsId, obj);
    var tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
      'PostK8sNodeGroup',
      'K8s NG create: ' + obj.name
    );

    try {
      const response = await webconsolejs["common/api/http"].commonAPIPost(
        controller,
        data,
        false,
        tracked.httpOptions
      );

      if (response && (response.status === 200 || response.status === 201)) {
        responses.push(response);
      } else {
        console.error('Node creation failed:', obj.name, response);
        failedNames.push(obj.name);
        responses.push(response);
      }
    } catch (error) {
      // 한 건의 실패가 나머지 NodeGroup 전송을 막지 않도록 계속 진행 (실패 목록은 마지막에 표시)
      console.error('Error creating node:', obj.name, error);
      failedNames.push(obj.name);
      responses.push(null);
    }
  }

  if (failedNames.length === 0) {
    webconsolejs["common/util"].showToast('Node group creation request completed successfully (' + configArr.length + ')', 'success');
  } else {
    webconsolejs["common/util"].showToast('Failed to create node group: ' + failedNames.join(', '), 'error');
  }

  // 결과 수신 시점에 목록 갱신 (생성 접수 반영)
  if (webconsolejs["pages/operation/manage/k8sworkloads"] &&
      typeof webconsolejs["pages/operation/manage/k8sworkloads"].refreshPmkList === 'function') {
    webconsolejs["pages/operation/manage/k8sworkloads"].refreshPmkList();
  }
  return responses;
}

export async function getSshKey(nsId, providerName, connectionName) {

  if (nsId == "") {
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Required', 'Please select a project first.')
    return;
  }

  var data = {
    pathParams: {
      nsId: nsId,
    },
  };

  // Connection 이 정해져 있으면 그걸로 거른다.
  // providerName 필터는 tumblebug 에서 신뢰할 수 없다 — filterVal=nhn 으로 걸러도
  // gcp-asia-northeast3 / tencent-ap-seoul 키까지 섞여 나온다(실측). connectionName 은 정확하다.
  // K8s NodeGroup 의 SSH Key 는 클러스터 Connection 과 일치해야 하므로 connectionName 우선.
  if (connectionName && connectionName !== "") {
    data.queryParams = {
      filterKey: "connectionName",
      filterVal: connectionName
    };
  } else if (providerName && providerName !== "") {
    data.queryParams = {
      filterKey: "providerName",
      filterVal: providerName.toLowerCase()
    };
  }

  var controller = "/api/" + "mc-infra-manager/" + "GetAllSshKey";
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

  var controller = "/api/" + "mc-infra-manager/" + "GetAvailableK8sNodeImage";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  return response.data.responseData


}

// connectionName에 맞는 K8s 노드 spec을 동적 조회 (RecommendK8sNode)
// tumblebug가 connectionName을 서버 사이드 필터로 지원하므로(FilterSpecsByRangeRequest.ConnectionName),
// 클라이언트에서 결과를 사후 필터링하지 않고 요청 단계에서 정확히 필터링한다.
// 일치하는 첫 번째 specId를 반환; 없거나 오류 시 ""
export async function getRecommendedK8sSpecId(connectionName) {
  const data = {
    request: {
      filter: {
        policy: [
          {
            metric: "connectionName",
            condition: [{ operator: "==", operand: connectionName }]
          }
        ]
      },
      limit: 50
    }
  };

  var controller = "/api/" + "mc-infra-manager/" + "RecommendK8sNode";
  try {
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
      data
    );

    if (!response || !response.data || !response.data.responseData) {
      return "";
    }

    const specs = response.data.responseData;
    if (!Array.isArray(specs) || specs.length === 0) return "";

    return specs[0].id || "";
  } catch (e) {
    return "";
  }
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

export function pmkDelete(nsId, k8sClusterId, options = {}) {
  // API 레벨 Validation (추가 안전장치)
  if (!nsId || nsId === '' || !k8sClusterId || k8sClusterId === '') {
    console.error('Invalid parameters for PMK deletion:', {
      nsId: nsId,
      k8sClusterId: k8sClusterId
    });
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Invalid Parameters',
      'Invalid parameters for K8s deletion. Please try again.'
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
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'Deletek8scluster',
    'K8s delete: ' + k8sClusterId
  );
  const mergedOptions = Object.assign({}, options || {}, {
    // tracked request: 강제 none — 페이지/API Processing 로더와 중복 방지
    loaderType: 'none',
    headers: Object.assign({}, (options && options.headers) || {}, tracked.headers),
  });
  let response = webconsolejs['common/api/http'].commonAPIPost(
    controller,
    data,
    false,
    mergedOptions
  );
  return response;
}

export function nodeGroupDelete(nsId, k8sClusterId, k8sNodeGroupName, options = {}) {
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
  let controller = '/api/' + 'mc-infra-manager/' + 'DeleteK8sNodeGroup';
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'DeleteK8sNodeGroup',
    'K8s NG delete: ' + k8sNodeGroupName
  );
  const mergedOptions = Object.assign({}, options || {}, {
    loaderType: 'none',
    headers: Object.assign({}, (options && options.headers) || {}, tracked.headers),
  });
  let response = webconsolejs['common/api/http'].commonAPIPost(
    controller,
    data,
    false,
    mergedOptions
  );
  return response;
}

// NodeGroup의 Autoscaling On/Off 설정
export function setNodeGroupAutoscaling(nsId, k8sClusterId, k8sNodeGroupName, onAutoScaling, options = {}) {
  if (!nsId || nsId === '' ||
      !k8sClusterId || k8sClusterId === '' ||
      !k8sNodeGroupName || k8sNodeGroupName === '') {
    console.error('Invalid parameters for NodeGroup autoscaling:', {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
      k8sNodeGroupName: k8sNodeGroupName
    });
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Invalid Parameters',
      'Invalid parameters for setting autoscaling. Please try again.'
    );
    return;
  }

  let data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
      k8sNodeGroupName: k8sNodeGroupName
    },
    request: {
      // tumblebug은 문자열 "true"/"false"를 받는다 (model.SetK8sNodeGroupAutoscalingReq)
      onAutoScaling: String(onAutoScaling) === 'true' ? 'true' : 'false'
    }
  };
  let controller = '/api/' + 'mc-infra-manager/' + 'PutSetK8sNodeGroupAutoscaling';
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'PutSetK8sNodeGroupAutoscaling',
    'K8s NG autoscaling: ' + k8sNodeGroupName
  );
  const mergedOptions = Object.assign({}, options || {}, {
    loaderType: 'none',
    headers: Object.assign({}, (options && options.headers) || {}, tracked.headers),
  });
  let response = webconsolejs['common/api/http'].commonAPIPost(
    controller,
    data,
    false,
    mergedOptions
  );
  return response;
}

// NodeGroup의 Autoscale Size(desired/min/max) 변경
export function changeNodeGroupAutoscaleSize(nsId, k8sClusterId, k8sNodeGroupName, sizes, options = {}) {
  if (!nsId || nsId === '' ||
      !k8sClusterId || k8sClusterId === '' ||
      !k8sNodeGroupName || k8sNodeGroupName === '') {
    console.error('Invalid parameters for NodeGroup autoscale size:', {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
      k8sNodeGroupName: k8sNodeGroupName
    });
    webconsolejs['partials/layout/modal'].commonShowDefaultModal(
      'Invalid Parameters',
      'Invalid parameters for changing autoscale size. Please try again.'
    );
    return;
  }

  let data = {
    pathParams: {
      nsId: nsId,
      k8sClusterId: k8sClusterId,
      k8sNodeGroupName: k8sNodeGroupName
    },
    request: {
      desiredNodeSize: parseInt(sizes.desiredNodeSize) || 1,
      minNodeSize: parseInt(sizes.minNodeSize) || 1,
      maxNodeSize: parseInt(sizes.maxNodeSize) || parseInt(sizes.desiredNodeSize) || 1
    }
  };
  let controller = '/api/' + 'mc-infra-manager/' + 'PutChangeK8sNodeGroupAutoscaleSize';
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'PutChangeK8sNodeGroupAutoscaleSize',
    'K8s NG autoscale size: ' + k8sNodeGroupName
  );
  const mergedOptions = Object.assign({}, options || {}, {
    loaderType: 'none',
    headers: Object.assign({}, (options && options.headers) || {}, tracked.headers),
  });
  let response = webconsolejs['common/api/http'].commonAPIPost(
    controller,
    data,
    false,
    mergedOptions
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
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Required', 'Please select a project first.')
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
    webconsolejs['partials/layout/modal'].commonShowDefaultModal('Project Selection Required', 'Please select a project first.')
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

  var controller = "/api/" + "mc-infra-manager/" + "PostK8sClusterDynamicCheckRequest";
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

  var controller = "/api/" + "mc-infra-manager/" + "PostK8sClusterDynamic";
  const clusterName = (clusterData && clusterData.name) ? clusterData.name : 'cluster';
  const tracked = webconsolejs['common/api/requestId'].beginTrackedRequest(
    'PostK8sClusterDynamic',
    'K8s create: ' + clusterName
  );
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data,
    undefined,
    tracked.httpOptions
  );

  return response;
}