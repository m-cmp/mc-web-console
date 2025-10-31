export async function getPlugIns() {
  try {
    var controller = "/api/" + "mc-observability/" + "Getplugins";
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
    )
    
    var respMeasurement = response.data.responseData;

    return respMeasurement
  } catch (error) {
    console.error("Error occurred while getting plugins:", error);
    throw error;
  }
}

export async function getMeasurementFields() {
    try {
        var controller = "/api/" + "mc-observability/" + "GetMeasurementFields";
        const response = await webconsolejs["common/api/http"].commonAPIPost(
            controller,
        )

        var respMeasurementFields = response.data.responseData;

        return respMeasurementFields
    } catch (error) {
        console.error("Error occurred while getting measurement fields:", error);
        throw error;
    }
}

export async function getInfluxDBMetrics(measurement, metric, range, period, nsId, mciId, vmId) {
  const data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
      vmId: vmId,
    },
    Request: {
      "measurement": measurement,
      "range": range,
      "group_time": period,
      "group_by": [
        "vm_id"
      ],
      "limit": 20,
      "fields": [
        {
          "function": "mean",
          "field": metric
        }
      ],
      "conditions": [
        // {
        //   "key": "cpu",
        //   "value": "cpu-total"
        // }
      ]
    }
  }

  var controller = "/api/" + "mc-observability/" + "GetMetricsByVMId";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  if (!response || !response.data) { // Return CPU dummy data if not available
    return {
      "responseData": {
        "data": [
          {
            "columns": [
              "timestamp",
              "usage_idle"
            ],
            "name": "cpu",
            "tags": {
              "cpu": "cpu3"
            },
            "values": [
              [
                "2024-10-24T07:00:00Z",
                99.68705397331486
              ],
              [
                "2024-10-24T06:00:00Z",
                99.83203203091615
              ]
            ]
          },
          {
            "columns": [
              "timestamp",
              "usage_idle"
            ],
            "name": "cpu",
            "tags": {
              "cpu": "cpu2"
            },
            "values": [
              [
                "2024-10-24T07:00:00Z",
                99.68281017492095
              ],
              [
                "2024-10-24T06:00:00Z",
                99.81210507573287
              ]
            ]
          },
          {
            "columns": [
              "timestamp",
              "usage_idle"
            ],
            "name": "cpu",
            "tags": {
              "cpu": "cpu1"
            },
            "values": [
              [
                "2024-10-24T07:00:00Z",
                99.71381168104153
              ],
              [
                "2024-10-24T06:00:00Z",
                99.82824513881181
              ]
            ]
          },
          {
            "columns": [
              "timestamp",
              "usage_idle"
            ],
            "name": "cpu",
            "tags": {
              "cpu": "cpu0"
            },
            "values": [
              [
                "2024-10-24T07:00:00Z",
                99.6947330502929
              ],
              [
                "2024-10-24T06:00:00Z",
                99.80079527023894
              ]
            ]
          },
          {
            "columns": [
              "timestamp",
              "usage_idle"
            ],
            "name": "cpu",
            "tags": {
              "cpu": "cpu-total"
            },
            "values": [
              [
                "2024-10-24T07:00:00Z",
                99.69444943604847
              ],
              [
                "2024-10-24T06:00:00Z",
                99.81842505823838
              ]
            ]
          }
        ],
        "error_message": "",
        "rs_code": "0000",
        "rs_msg": "완료되었습니다."
      },
      "status": {
        "code": 200,
        "message": "200 "
      }
    };
  }
  return response.data

}

export async function monitoringPrediction(nsId, mciId, vmId, measurement, startTime, endTime) {
  // 기본값 설정: startTime은 12시간 전, endTime은 7일 후
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - (12 * 60 * 60 * 1000));
  const sevenDaysLater = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  // ISO 8601 형식으로 변환 (YYYY-MM-DDTHH:MM:SSZ)
  const defaultStartTime = twelveHoursAgo.toISOString().split('.')[0] + 'Z';
  const defaultEndTime = sevenDaysLater.toISOString().split('.')[0] + 'Z';
  
  const data = {
    pathParams: {
      "nsId": nsId,
      "mciId": mciId,
      "vmId": vmId
    },
    queryParams: {
      "measurement": measurement,
      "start_time": startTime || defaultStartTime,
      "end_time": endTime || defaultEndTime
    }
  }

  var controller = "/api/" + "mc-observability/" + "GetPredictionVMHistory";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  if (!response || !response.data) {
    return {
      "responseData": {
        "ns_id": nsId,
        "target_id": vmId,
        "measurement": measurement,
        "values": [
          {
            "timestamp": "2024-10-24T07:10:00Z",
            "value": 99.75
          },
          {
            "timestamp": "2024-10-24T08:00:00Z",
            "value": 99.7
          },
          {
            "timestamp": "2024-10-24T09:00:00Z",
            "value": 99.67
          },
          {
            "timestamp": "2024-10-24T10:00:00Z",
            "value": 99.64
          },
          {
            "timestamp": "2024-10-24T11:00:00Z",
            "value": 99.6
          },
          {
            "timestamp": "2024-10-24T12:00:00Z",
            "value": 99.57
          },
          {
            "timestamp": "2024-10-24T13:00:00Z",
            "value": 99.54
          }
        ]
      },
      "rs_code": "200",
      "rs_msg": "Success"
    }
  }
  return response.data
}

// Log 조회.
export async function getMonitoringLog(nsId, mciId, vmId, keyword) {
    var query = "{NS_ID=\"" + nsId + "\", MCI_ID=\"" + mciId + "\", VM_ID=\"" + vmId + "\"} |~ \"(?i)" + keyword + "\""
    const data = {
    queryParams: {
      "query": query,
      "limit": "20",
    },
  }


  var controller = "/api/" + "mc-observability/" + "LogRangeQuery";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response
}

export async function getDetectionHistory(nsId, mciId, vmId, measurement, startTime, endTime) {
  // 기본값 설정: startTime은 12시간 전, endTime은 현재 시간
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - (12 * 60 * 60 * 1000));
  
  // ISO 8601 형식으로 변환 (YYYY-MM-DDTHH:MM:SSZ)
  const defaultStartTime = twelveHoursAgo.toISOString().split('.')[0] + 'Z';
  const defaultEndTime = now.toISOString().split('.')[0] + 'Z';
  
  const data = {
    pathParams: {
      "nsId": nsId,
      "mciId": mciId,
      "vmId": vmId
    },
    queryParams: {
      "measurement": measurement,
      "start_time": startTime || defaultStartTime,
      "end_time": endTime || defaultEndTime
    },
  }

  var controller = "/api/" + "mc-observability/" + "GetAnomalyDetectionVMHistory";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  if (!response || !response.data) {
    return {
      "responseData": {
        "ns_id": nsId,
        "target_id": vmId,
        "measurement": measurement,
        "values": [
          {
            "timestamp": "2024-10-24T06:20:00Z",
            "anomaly_score": 0.85,
            "isAnomaly": 1,
            "value": 99.5
          },
          {
            "timestamp": "2024-10-24T07:00:00Z",
            "anomaly_score": 0.95,
            "isAnomaly": 1,
            "value": 94.2
          },
          {
            "timestamp": "2024-10-24T10:00:00Z",
            "anomaly_score": 0.65,
            "isAnomaly": 1,
            "value": 97.5
          },
        ]
      },
      "rs_code": "200",
      "rs_msg": "Success"
    }
  }

  return response.data

}

// 모니터링 Agent가 설치된 vm 목록 by ns, mci
export async function getVMByNsMci(nsId, mciId) {

  var controller = "/api/" + "mc-observability/" + "GetVMByNsMci";
  let data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
    },
  };

  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )
  // target이 있다는 이야기는 agent가 설치되었다는 뜻으로 보면 되는가? maybe
  var respMeasureMent = response.data.responseData;

  return respMeasureMent
}

export async function InstallMonitoringAgent(nsId, mciId, vmId){
  var controller = "/api/" + "mc-observability/" + "PostVM";
  
  let data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
      vmId: vmId,
    },
    request: {
      name:vmId
    }
  };

  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  return response.data.responseData
  
}

export async function UninstallMonitoringAgent(nsId, mciId, vmId){
  var controller = "/api/" + "mc-observability/" + "DeleteVM";
  
  let data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
      targetId: vmId,
    },
  };

  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  return response.data.responseData
  
}

export async function GetMonitoringVM(nsId, mciId, vmId){
  var controller = "/api/" + "mc-observability/" + "GetVM";
  
  let data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
      vmId: vmId,
    },
  };

  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  return response.data.responseData
  
}

export async function GetMetricitems(nsId, mciId, vmId){
  var controller = "/api/" + "mc-observability/" + "GetMonitoringItems";
  
  let data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
      vmId: vmId,
    },
  };

  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  return response.data.responseData
  
}