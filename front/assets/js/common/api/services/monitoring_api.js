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
      "group_time": "1h",
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
          // "value": "vm-1"
          "value": "g1-1-1"
        }
      ]
    }
  }

  var controller = "/api/" + "mc-observability/" + "GETInfluxDBMetrics";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response

}

export async function monitoringPrediction() {

  const data = {
    pathParams: {
      "nsId": "ns01",
      "targetId": "g1-1-1"
    },
    Request: {
      "target_type": "vm",
      "measurement": "cpu",
      "prediction_range": "6h"
    }
  }

  var controller = "/api/" + "mc-observability/" + "Postprediction";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  return response
}

// Log 조회.
//      limit : 가져올 row 갯수 
//      range : ??
//      conditions :
//          key:"tag.ns_id", value:""       -> value는 선택된 nsId
//          key:"tag.mci_id", value:""      -> value는 선택된 mciId
//          key:"tag.target_id", value:""   -> value는 선택된 vmId

//          key:"tail.message", value:""    -> value는 filter하고자 하는 keyword
export async function getMonitoringLog(nsId, mciId, targetId, keyword){
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
    

  var controller = "/api/" + "mc-observability/" + "GET_OpensearchLogs";
  const response = await webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );

  console.log("response ", response)
  return response
}