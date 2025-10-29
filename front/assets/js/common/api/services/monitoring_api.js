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
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  if (!response) { // Return CPU dummy data if not available
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
  return response

}

export async function monitoringPrediction() {

  const data = {
    pathParams: {
      "nsId": "ns01",
      "targetId": "vm-1"
    },
    Request: {
      "target_type": "vm",
      "measurement": "cpu",
      "prediction_range": "3h"
    }
    // Request: {
    //   "measurement": "cpu",
    //   "range": "1h",
    //   "group_time": "1h",
    //   "group_by": [
    //     "cpu"
    //   ],
    //   "limit": 10,
    //   "fields": [
    //     {
    //       "function": "mean",
    //       "field": "usage_idle"
    //     }
    //   ],
    //   "conditions": [
    //     {
    //       "key": "target_id",
    //       "value": "vm-1"
    //     }
    //   ]
    // }
  }

  var controller = "/api/" + "mc-observability/" + "Postprediction";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  if (!response) {
    return {
      "data": {
        "responseData": {
          "data": {
            "measurement": "cpu",
            "ns_id": "ns01",
            "target_id": "vm-1",
            "target_type": "vm",
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
        },
        "status": {
          "code": 200,
          "message": "200 "
        }
      },
      "status": 200,
      "statusText": "OK",
      "headers": {
        "access-control-allow-origin": "*",
        "content-length": "490",
        "content-type": "application/json; charset=utf-8",
        "date": "Thu, 24 Oct 2024 07:31:23 GMT",
        "vary": "Origin"
      },
      "config": {
        "transitional": {
          "silentJSONParsing": true,
          "forcedJSONParsing": true,
          "clarifyTimeoutError": false
        },
        "adapter": [
          "xhr",
          "http"
        ],
        "transformRequest": [
          null
        ],
        "transformResponse": [
          null
        ],
        "timeout": 0,
        "xsrfCookieName": "XSRF-TOKEN",
        "xsrfHeaderName": "X-XSRF-TOKEN",
        "maxContentLength": -1,
        "maxBodyLength": -1,
        "env": {},
        "headers": {
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json"
        },
        "method": "post",
        "url": "/api/mc-observability/Postprediction",
        "data": "{\"pathParams\":{\"nsId\":\"ns01\",\"targetId\":\"vm-1\"},\"Request\":{\"target_type\":\"vm\",\"measurement\":\"cpu\",\"prediction_range\":\"6h\"}}"
      },
      "request": {}
    }
  }
  return response
  // return mock
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

export async function getDetectionHistory() {
  const data = {
    pathParams: {
      "nsId": "ns01",
      "targetId": "vm-1"
    },
    queryParams: {
      "measurement": "cpu",
      // "measurement": "mem",
      "start_time": "2024-10-29T12:31:00Z",
      // "end_time": "2002-07-02T06:49:28.605Z"
    },
  }

  var controller = "/api/" + "mc-observability/" + "Getanomalydetectionhistory";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  )

  var respDetectionData = response.data.responseData;
  if (!respDetectionData) {
    return {
      "data": {
        "ns_id": "ns01",
        "target_id": "vm-1",
        "measurement": "cpu",
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

  return respDetectionData

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