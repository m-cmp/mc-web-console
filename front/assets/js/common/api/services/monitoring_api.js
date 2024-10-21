export async function getPlugIns() {
  
    var controller = "/api/" + "mc-observability/" + "GET_plugins";
    const response = await webconsolejs["common/api/http"].commonAPIPost(
      controller,
    )
  
    var respMeasureMent = response.data.responseData;
  
    return respMeasureMent
  }

export async function getInfluxDBMetrics(measurement, range, vmId) {

  const data = {

    Request: {
      // "measurement": measurement,
      "measurement": "cpu",
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
          "value": "vm-1"
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
      "prediction_range": "24h"
    }
  }

  var controller = "/api/" + "mc-observability/" + "PredictMetrics";
  const response = webconsolejs["common/api/http"].commonAPIPost(
    controller,
    data
  );
  
  return response

}
