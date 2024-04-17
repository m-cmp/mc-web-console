package handler

import (
	// "io"
	// "os"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	fwmodels "mc_web_console_api/fwmodels"
	tbcommon "mc_web_console_api/fwmodels/tumblebug/common"

	// spider "mc_web_console_api/fwmodels/spider"
	"mc_web_console_api/fwmodels/ladybug"
	// "mc_web_console_api/fwmodels/tumblebug"

	util "mc_web_console_api/util"

	"github.com/gobuffalo/buffalo"
)

// Health Check
func GetHealthy() fwmodels.WebStatus {
	var originalUrl = "/healthy"
	urlParam := util.MappingUrlParameter(originalUrl, nil)
	url := util.MCKS + urlParam
	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	result := ""
	json.NewDecoder(respBody).Decode(&result)
	log.Println(result)

	return fwmodels.WebStatus{StatusCode: respStatus, Message: result}
}

// Cluster 목록 조회
func GetClusterList(nameSpaceID string) ([]ladybug.ClusterInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{namespace}/clusters"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.MCKS + urlParam
	// url := util.MCKS + "/ns/" + nameSpaceID + "/clusters"
	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode
	// 원래는 items 와 kind 가 들어오는데
	// kind에는 clusterlist 라는 것만 있고 실제로는 items 에 cluster 정보들이 있음.
	// 그래서 굳이 kind까지 처리하지 않고 item만 return
	clusterList := map[string][]ladybug.ClusterInfo{}
	json.NewDecoder(respBody).Decode(&clusterList)
	fmt.Println(clusterList["items"])
	log.Println(respBody)
	// util.DisplayResponse(resp) // 수신내용 확인

	return clusterList["items"], fwmodels.WebStatus{StatusCode: respStatus}
}

func GetClusterListByID(nameSpaceID string) ([]string, fwmodels.WebStatus) {
	var originalUrl = "/ns/{namespace}/clusters"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.MCKS + urlParam + "?option=id"
	// url := util.MCKS + "/ns/" + nameSpaceID + "/clusters"
	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode
	// 원래는 items 와 kind 가 들어오는데
	// kind에는 clusterlist 라는 것만 있고 실제로는 items 에 cluster 정보들이 있음.
	// 그래서 굳이 kind까지 처리하지 않고 item만 return
	clusterIdList := []string{}
	json.NewDecoder(respBody).Decode(&clusterIdList)
	log.Println(respBody)
	// util.DisplayResponse(resp) // 수신내용 확인

	return clusterIdList, fwmodels.WebStatus{StatusCode: respStatus}
}

// 특정 Cluster 조회
func GetClusterData(nameSpaceID string, cluster string) (*ladybug.ClusterInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{namespace}/clusters/{cluster}"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	paramMapper["{cluster}"] = cluster
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.MCKS + urlParam

	// resp, err := util.CommonHttp(url, nil, http.MethodGet)
	resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	// defer body.Close()
	clusterInfo := ladybug.ClusterInfo{}
	if err != nil {
		fmt.Println(err)
		return &clusterInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// util.DisplayResponse(resp) // 수신내용 확인

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&clusterInfo)
	fmt.Println(clusterInfo)

	return &clusterInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

// Cluster 생성
func RegCluster(nameSpaceID string, clusterReq *ladybug.ClusterRegReq) (*ladybug.ClusterInfo, fwmodels.WebStatus) {

	var originalUrl = "/ns/{namespace}/clusters"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.MCKS + urlParam

	pbytes, _ := json.Marshal(clusterReq)
	fmt.Println(string(pbytes))
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	returnClusterInfo := ladybug.ClusterInfo{}
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

// Cluster 생성
func RegClusterByAsync(nameSpaceID string, clusterReq *ladybug.ClusterRegReq, c buffalo.Context) {

	var originalUrl = "/ns/{namespace}/clusters"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.MCKS + urlParam

	pbytes, _ := json.Marshal(clusterReq)
	fmt.Println(string(pbytes))
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	taskKey := nameSpaceID + "||" + "mcks" + "||" + clusterReq.Name // TODO : 공통 function으로 뺄 것.

	if err != nil {
		fmt.Println(err)
		StoreWebsocketMessage(util.TASK_TYPE_MCKS, taskKey, util.MCKS_LIFECYCLE_CREATE, util.TASK_STATUS_FAIL, c) // session에 작업내용 저장
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		//errorInfo := fwmodels.ErrorInfo{}
		//json.NewDecoder(respBody).Decode(&errorInfo)
		//fmt.Println("respStatus != 200 reason ", errorInfo)
		//returnStatus.Message = errorInfo.Message
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		log.Println("RegMcksByAsync ", failResultInfo)
		StoreWebsocketMessage(util.TASK_TYPE_MCKS, taskKey, util.MCKS_LIFECYCLE_CREATE, util.TASK_STATUS_FAIL, c) // session에 작업내용 저장

	} else {
		returnClusterInfo := ladybug.ClusterInfo{}
		json.NewDecoder(respBody).Decode(&returnClusterInfo)
		fmt.Println(returnClusterInfo)
		StoreWebsocketMessage(util.TASK_TYPE_MCKS, taskKey, util.MCKS_LIFECYCLE_CREATE, util.TASK_STATUS_COMPLETE, c) // session에 작업내용 저장
	}

}

// Cluster 삭제
func DelClusters(nameSpaceID string, clusterName string) (*ladybug.StatusInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{namespace}/clusters/{cluster}"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	paramMapper["{cluster}"] = clusterName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.MCKS + urlParam

	if clusterName == "" {
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: "cluster is required"}
	}

	// 경로안에 parameter가 있어 추가 param없이 호출 함.
	resp, err := util.CommonHttp(url, nil, http.MethodDelete)
	statusInfo := ladybug.StatusInfo{}
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

// Cluster 삭제 비동기 처리
func DelClusterByAsync(nameSpaceID string, clusterName string, c buffalo.Context) {
	var originalUrl = "/ns/{namespace}/clusters/{cluster}"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	paramMapper["{cluster}"] = clusterName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.MCKS + urlParam

	//if clusterName == "" {
	//	return nil, fwmodels.WebStatus{StatusCode: 500, Message: "cluster is required"}
	//}

	// 경로안에 parameter가 있어 추가 param없이 호출 함.
	resp, err := util.CommonHttp(url, nil, http.MethodDelete)

	//statusInfo := ladybug.StatusInfo{}
	//if err != nil {
	//	fmt.Println("delCluster ", err)
	//	return &statusInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	//}

	//respBody := resp.Body
	//respStatus := resp.StatusCode
	//
	//json.NewDecoder(respBody).Decode(&statusInfo)
	//fmt.Println(statusInfo)

	taskKey := nameSpaceID + "||" + "mcks" + "||" + clusterName

	if err != nil {
		fmt.Println(err)
		StoreWebsocketMessage(util.TASK_TYPE_MCKS, taskKey, util.MCKS_LIFECYCLE_DELETE, util.TASK_STATUS_FAIL, c) // session에 작업내용 저장
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		//errorInfo := fwmodels.ErrorInfo{}
		//json.NewDecoder(respBody).Decode(&errorInfo)
		//fmt.Println("respStatus != 200 reason ", errorInfo)
		//returnStatus.Message = errorInfo.Message
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		log.Println("DelMcksByAsync ", failResultInfo)
		StoreWebsocketMessage(util.TASK_TYPE_MCKS, taskKey, util.MCKS_LIFECYCLE_DELETE, util.TASK_STATUS_FAIL, c) // session에 작업내용 저장

	} else {
		returnClusterInfo := ladybug.ClusterInfo{}
		json.NewDecoder(respBody).Decode(&returnClusterInfo)
		fmt.Println(returnClusterInfo)
		StoreWebsocketMessage(util.TASK_TYPE_MCKS, taskKey, util.MCKS_LIFECYCLE_DELETE, util.TASK_STATUS_COMPLETE, c) // session에 작업내용 저장
	}
}

// MCKS의 상태값 숫자로 표시
func GetMcksStatusCountMap(clusterList []ladybug.ClusterInfo) map[string]int {
	mcksStatusRunning := 0
	mcksStatusStopped := 0
	mcksStatusTerminated := 0

	for _, clusterInfo := range clusterList {
		mcksStatus := util.GetMcksStatus(clusterInfo.Status.Phase)
		if mcksStatus == util.MCKS_STATUS_RUNNING {
			mcksStatusRunning++
		} else if mcksStatus == util.MCKS_STATUS_TERMINATED {
			mcksStatusTerminated++
		} else {
			mcksStatusStopped++
		}
	}

	mcksStatusMap := make(map[string]int)
	mcksStatusMap["RUNNING"] = mcksStatusRunning
	mcksStatusMap["STOPPED"] = mcksStatusStopped
	mcksStatusMap["TERMINATED"] = mcksStatusTerminated
	mcksStatusMap["TOTAL"] = mcksStatusRunning + mcksStatusStopped + mcksStatusTerminated

	return mcksStatusMap
}

// Node의 간단정보(credential 제외) + kind별 node 갯수 return
func GetSimpleNodeCountMap(cluster ladybug.ClusterInfo) ([]ladybug.NodeSimpleInfo, map[string]int) {
	var nodeSimpleList []ladybug.NodeSimpleInfo
	nodeRoleCountMap := map[string]int{}
	for nodeIndex, nodeInfo := range cluster.Nodes {
		nodeSimpleObj := ladybug.NodeSimpleInfo{
			NodeIndex:    nodeIndex,
			NodeName:     nodeInfo.Name,
			NodeKind:     nodeInfo.Kind, // Node냐 cluster냐
			NodeCsp:      nodeInfo.Csp,
			NodePublicIp: nodeInfo.PublicIp,
			NodeRole:     nodeInfo.Role, // Control-plane냐, Worker냐
			NodeSpec:     nodeInfo.Spec,
		}
		nodeSimpleList = append(nodeSimpleList, nodeSimpleObj)

		_, exists := nodeRoleCountMap[nodeInfo.Role]
		if !exists {
			nodeRoleCountMap[nodeInfo.Role] = 0
		}
		nodeRoleCountMap[nodeInfo.Role] += 1
	}
	log.Println("nodeRoleCountMap")
	log.Println(nodeRoleCountMap)
	return nodeSimpleList, nodeRoleCountMap
}

////////

// Node 목록 조회
func GetNodeList(nameSpaceID string, clusterName string) (ladybug.NodeList, fwmodels.WebStatus) {
	var originalUrl = "/ns/{namespace}/clusters/{cluster}/nodes"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	paramMapper["{cluster}"] = clusterName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.MCKS + urlParam

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	nodeList := ladybug.NodeList{} // 이름은 List이나 1개의 객체임
	if err != nil {
		fmt.Println(err)
		return nodeList, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&nodeList)
	fmt.Println(nodeList)
	log.Println(respBody)
	// util.DisplayResponse(resp) // 수신내용 확인

	return nodeList, fwmodels.WebStatus{StatusCode: respStatus}
}

// 특정 Cluster 조회
func GetNodeData(nameSpaceID string, clusterName string, node string) (*ladybug.NodeInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{namespace}/clusters/{cluster}/nodes/{node}"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	paramMapper["{cluster}"] = clusterName
	paramMapper["{node}"] = node
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.MCKS + urlParam

	// resp, err := util.CommonHttp(url, nil, http.MethodGet)
	resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	// defer body.Close()
	nodeInfo := ladybug.NodeInfo{}
	if err != nil {
		fmt.Println(err)
		return &nodeInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// util.DisplayResponse(resp) // 수신내용 확인

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&nodeInfo)
	fmt.Println(nodeInfo)

	return &nodeInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

// Node 생성
func RegNode(nameSpaceID string, clusterName string, nodeRegReq *ladybug.NodeRegReq) (*ladybug.NodeInfo, fwmodels.WebStatus) {

	var originalUrl = "/ns/{namespace}/clusters/{cluster}/nodes"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	paramMapper["{cluster}"] = clusterName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.MCKS + urlParam

	pbytes, _ := json.Marshal(nodeRegReq)
	fmt.Println(string(pbytes))
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	returnNodeInfo := ladybug.NodeInfo{}
	returnStatus := fwmodels.WebStatus{}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if err != nil {
		fmt.Println(err)
		return &returnNodeInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		errorInfo := fwmodels.ErrorInfo{}
		json.NewDecoder(respBody).Decode(&errorInfo)
		fmt.Println("respStatus != 200 reason ", errorInfo)
		returnStatus.Message = errorInfo.Message
	} else {
		json.NewDecoder(respBody).Decode(&returnNodeInfo)
		fmt.Println(returnNodeInfo)
	}
	returnStatus.StatusCode = respStatus

	return &returnNodeInfo, returnStatus
}

// Node 삭제
func DelNode(nameSpaceID string, clusterName string, node string) (*ladybug.StatusInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{namespace}/clusters/{cluster}/nodes/{node}"

	var paramMapper = make(map[string]string)
	paramMapper["{namespace}"] = nameSpaceID
	paramMapper["{cluster}"] = clusterName
	paramMapper["{node}"] = node
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.MCKS + urlParam

	if clusterName == "" {
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: "cluster is required"}
	}
	if node == "" {
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: "node is required"}
	}

	// 경로안에 parameter가 있어 추가 param없이 호출 함.
	resp, err := util.CommonHttp(url, nil, http.MethodDelete)
	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	statusInfo := ladybug.StatusInfo{}
	if err != nil {
		fmt.Println(err)
		return &statusInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// util.DisplayResponse(resp) // 수신내용 확인

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&statusInfo)
	fmt.Println(statusInfo)

	return &statusInfo, fwmodels.WebStatus{StatusCode: respStatus}
}
