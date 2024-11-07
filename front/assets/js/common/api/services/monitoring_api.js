export async function getPlugIns() {

  var controller = "/api/" + "mc-observability/" + "Getplugins";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
  )

  var respMeasureMent = response.data.responseData;

  return respMeasureMent
}

export async function getInfluxDBMetrics(measurement, range, vmId) {

  const data = {

    Request: {
      "measurement": measurement,
      // "measurement": "cpu",
      "range": range,
      // "range": "1h",
      "group_time": "3h",
      "group_by": [
        measurement
        // "cpu"
      ],
      "limit": 10,
      "fields": [
        {
          "function": "mean",
          "field": "usage_idle"
        }
      ],
      "conditions": [
        {
          "key": "target_id",
          "value": "vm-1"
          // "value": "g1-1-1"
        }
      ]
    }
  }

  var controller = "/api/" + "mc-observability/" + "GETInfluxDBMetrics";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  if (!response) {
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
//      limit : 가져올 row 갯수 
//      range : ??
//      conditions :
//          key:"tag.ns_id", value:""       -> value는 선택된 nsId
//          key:"tag.mci_id", value:""      -> value는 선택된 mciId
//          key:"tag.target_id", value:""   -> value는 선택된 vmId

//          key:"tail.message", value:""    -> value는 filter하고자 하는 keyword
export async function getMonitoringLog(nsId, mciId, targetId, keyword) {
  //GET_OpensearchLogs

  const data = {}
  let request = {}
  let conditions = new Array();
  if (nsId != "") {
    let aCondition = {}
    aCondition.key = "tag.ns_id";
    aCondition.value = nsId;
    conditions.push(aCondition)
  }
  if (mciId != "") {
    let aCondition = {}
    aCondition.key = "tag.mci_id";
    aCondition.value = mciId;
    conditions.push(aCondition)
  }
  if (targetId != "") {
    let aCondition = {}
    aCondition.key = "tag.target_id";
    aCondition.value = targetId;
    conditions.push(aCondition)
  }
  if (keyword != "") {
    let aCondition = {}
    aCondition.key = "tail.message";
    aCondition.value = keyword
    conditions.push(aCondition)
  }

  //request.range = ""
  request.limit = 100;
  request.conditions = conditions;
  data.request = request;


  var controller = "/api/" + "mc-observability/" + "GETOpensearchLogs";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  console.log("response ", response)
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
  console.log("respDetectionData", respDetectionData)
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
export async function getTargetsNsMci(nsId, mciId) {

  var controller = "/api/" + "mc-observability/" + "GetTargetsNSMCI";
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
  var controller = "/api/" + "mc-observability/" + "PostTarget";
  
  let data = {
    pathParams: {
      nsId: nsId,
      mciId: mciId,
      targetId: vmId,
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
  var controller = "/api/" + "mc-observability/" + "DeleteTarget";
  
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