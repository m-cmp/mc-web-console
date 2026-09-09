// DISK API — lookup helpers + DataDisk CRUD

export async function getAllDataDisk(nsId) {
  const controller = '/api/mc-infra-manager/GetAllDataDisk';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId }
  });
  return response?.data?.responseData;
}

export async function getDataDisk(nsId, dataDiskId) {
  const controller = '/api/mc-infra-manager/GetDataDisk';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, dataDiskId }
  });
  return response?.data?.responseData;
}

export async function postDataDisk(nsId, body) {
  const controller = '/api/mc-infra-manager/PostDataDisk';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId },
    request: body
  });
  return response?.data;
}

export async function delDataDisk(nsId, dataDiskId) {
  const controller = '/api/mc-infra-manager/DelDataDisk';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, dataDiskId }
  });
  return response?.data;
}

// 해당 provider, connection 으로 사용가능한 Disk의 Type 정보(type, min, max ) 조회
// ex) AWS -> standard|1|1024, gp2|1|16384
export async function getCommonLookupDiskInfo(provider, connectionName) {
  const data = {
    queryParams: {
      provider: provider,
      connectionName: connectionName
    }
  };

  const controller = '/api/disklookup';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, data);
  return response.data.responseData;
}

// 기존 DataDisk를 노드에 Attach/Detach — option: 'attach' | 'detach', force: 'true' | 'false' (선택)
// 응답은 model.NodeInfo(갱신된 노드 전체, dataDiskIds 포함)
export async function putNodeDataDisk(nsId, infraId, nodeId, dataDiskId, option, force) {
  const controller = '/api/mc-infra-manager/PutNodeDataDisk';
  const queryParams = { option };
  if (force !== undefined) queryParams.force = String(force);
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, infraId, nodeId },
    queryParams,
    request: { dataDiskId }
  });
  return response?.data?.responseData;
}

export async function attachDataDisk(nsId, infraId, nodeId, dataDiskId, force) {
  return putNodeDataDisk(nsId, infraId, nodeId, dataDiskId, 'attach', force);
}

export async function detachDataDisk(nsId, infraId, nodeId, dataDiskId, force) {
  return putNodeDataDisk(nsId, infraId, nodeId, dataDiskId, 'detach', force);
}

// 신규 디스크를 생성과 동시에 노드에 Attach (Infra Node 화면의 "Create New" 흐름 전용).
// model.DataDiskNodeReq: { name(필수), diskSize(필수, GB), diskType?, description? } / 응답은 갱신된 NodeInfo
export async function postNodeDataDisk(nsId, infraId, nodeId, body) {
  const controller = '/api/mc-infra-manager/PostNodeDataDisk';
  const response = await webconsolejs['common/api/http'].commonAPIPost(controller, {
    pathParams: { nsId, infraId, nodeId },
    request: body
  });
  return response?.data?.responseData;
}
