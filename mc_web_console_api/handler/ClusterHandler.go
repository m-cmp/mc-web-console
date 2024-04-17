package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"mc_web_console_api/fwmodels"
	tbcommon "mc_web_console_api/fwmodels/tumblebug/common"
	"mc_web_console_api/fwmodels/tumblebug/mcis"

	util "mc_web_console_api/util"
	"net/http"
)

// List all Clusters or Clusters' ID

func ClusterList(nameSpaceID string, optionParam string) ([]mcis.TbClusterInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/cluster"
	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	optionParamVal := ""

	if optionParam == "" {
		optionParam = "status"
	}
	// install, init, cpus, cpum, memR, memW, fioR, fioW, dbR, dbW, rtt, mrtt, clean
	//if optionParam != "" {
	//	optionParamVal = "?option=" + optionParam
	//}
	if optionParam == "all" {
		optionParamVal = "" // all 은 optionParam값이 없는 경우임.
	} else {
		optionParamVal = "?option=" + optionParam
	}

	url := util.TUMBLEBUG + urlParam + optionParamVal
	resp, err := util.CommonHttp(url, nil, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	clusterList := map[string][]mcis.TbClusterInfo{}
	returnStatus := fwmodels.WebStatus{}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		//errorInfo := fwmodels.ErrorInfo{}
		//json.NewDecoder(respBody).Decode(&errorInfo)
		//fmt.Println("respStatus != 200 reason ", errorInfo)
		//returnStatus.Message = errorInfo.Message

		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return nil, fwmodels.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&clusterList)
	fmt.Println(clusterList["items"])

	returnStatus.StatusCode = respStatus
	log.Println(respBody)
	// util.DisplayResponse(resp) // 수신내용 확인

	return clusterList["items"], returnStatus

}

func ClusterIDList(nameSpaceID string) ([]string, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/cluster"
	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam + "?option=id"
	resp, err := util.CommonHttp(url, nil, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	clusterIdList := []string{}
	returnStatus := fwmodels.WebStatus{}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		//errorInfo := fwmodels.ErrorInfo{}
		//json.NewDecoder(respBody).Decode(&errorInfo)
		//fmt.Println("respStatus != 200 reason ", errorInfo)
		//returnStatus.Message = errorInfo.Message

		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return nil, fwmodels.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&clusterIdList)

	returnStatus.StatusCode = respStatus
	log.Println(respBody)
	// util.DisplayResponse(resp) // 수신내용 확인

	return clusterIdList, returnStatus
}

// Create Cluster

func CreateCluster(nameSpaceID string, optionParam string, clusterReq *mcis.TbClusterReq) (*mcis.TbClusterInfo, fwmodels.WebStatus) {

	var originalUrl = "/ns/{nsId}/cluster"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID

	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	if optionParam != "" {
		urlParam += "?option=" + optionParam
	}

	url := util.TUMBLEBUG + urlParam

	pbytes, _ := json.Marshal(clusterReq)
	fmt.Println(string(pbytes))
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	returnClusterInfo := mcis.TbClusterInfo{}
	returnStatus := fwmodels.WebStatus{}

	if err != nil {
		fmt.Println(err)
		return &returnClusterInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		errorInfo := fwmodels.ErrorInfo{}
		json.NewDecoder(respBody).Decode(&errorInfo)
		fmt.Println("respStatus != 200 reason ", errorInfo)
		returnStatus.Message = errorInfo.Message
	} else {
		json.NewDecoder(respBody).Decode(&returnClusterInfo)
		fmt.Println(returnClusterInfo)
	}
	returnStatus.StatusCode = respStatus

	return &returnClusterInfo, returnStatus
}

// Delete Cluster

func DelCluster(nameSpaceID string, clusterName string) (*mcis.StatusInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/cluster/{clusterId}"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{clusterId}"] = clusterName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.TUMBLEBUG + urlParam

	if clusterName == "" {
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: "cluster is required"}
	}

	// 경로안에 parameter가 있어 추가 param없이 호출 함.
	resp, err := util.CommonHttp(url, nil, http.MethodDelete)
	statusInfo := mcis.StatusInfo{}
	if err != nil {
		fmt.Println("delCluster ", err)
		return &statusInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&statusInfo)
	fmt.Println(statusInfo)

	if respStatus != 200 && respStatus != 201 {
		fmt.Println(respBody)
		return &statusInfo, fwmodels.WebStatus{StatusCode: respStatus, Message: statusInfo.Message}
	}
	return &statusInfo, fwmodels.WebStatus{StatusCode: respStatus}
}
