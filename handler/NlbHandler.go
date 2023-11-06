package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	// "github.com/davecgh/go-spew/spew"

	// "os"
	frameworkmodel "mc_web_console/frameworkmodel"
	tbcommon "mc_web_console/frameworkmodel/tumblebug/common"
	tbmcis "mc_web_console/frameworkmodel/tumblebug/mcis"

	util "mc_web_console/util"

	"github.com/gobuffalo/buffalo"
)

/*
NLB ID만 목록으로 제공
*/
func GetNlbIdListByMcisID(nameSpaceID string, mcisID string) ([]string, frameworkmodel.WebStatus) {
	var originalUrl = "/ns/{nsId}/mcis/{mcisId}/nlb"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	urlParam += "?option=id"
	url := util.TUMBLEBUG + urlParam
	resp, err := util.CommonHttp(url, nil, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	mcisList := tbcommon.TbIdList{}
	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return nil, frameworkmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&mcisList)
	//spew.Dump(body)
	fmt.Println(mcisList.IDList)

	return mcisList.IDList, frameworkmodel.WebStatus{StatusCode: respStatus}
}

/*
NLB 목록을 조회 조건에 따라 검색
*/
func GetNlbListByOption(nameSpaceID string, mcisID string, optionParam string) ([]tbmcis.TbNLBInfo, frameworkmodel.WebStatus) {
	var originalUrl = "/ns/{nsId}/mcis/{mcisId}/nlb"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	if optionParam != "" {
		urlParam += "?option=" + optionParam
	}

	url := util.TUMBLEBUG + urlParam
	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	nlbList := map[string][]tbmcis.TbNLBInfo{}
	returnStatus := frameworkmodel.WebStatus{}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return nil, frameworkmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}
	json.NewDecoder(respBody).Decode(&nlbList)
	fmt.Println(nlbList["nlb"])

	returnStatus.StatusCode = respStatus
	log.Println(respBody)
	// util.DisplayResponse(resp) // 수신내용 확인

	return nlbList["nlb"], returnStatus
}

/*
	NLB 등록
	async로 호출하므로 결과를 받으면 websocket으로 전달
*/
//RegNlbByAsync
func RegNlbByAsync(nameSpaceID string, mcisID string, nlbReq *tbmcis.TbNLBReq, c buffalo.Context) {
	var originalUrl = "/ns/{nsId}/mcis/{mcisId}/nlb"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	// urlParam += "?option=register" // csp에만 있는 resource를 tumblebug에 등록 할 때 option으로 register를 붙임.

	url := util.TUMBLEBUG + urlParam

	pbytes, _ := json.Marshal(nlbReq)
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	respBody := resp.Body
	respStatus := resp.StatusCode

	taskKey := nameSpaceID + "||" + "nlb" + "||" + nlbReq.Name // TODO : 공통 function으로 뺄 것.

	if err != nil {
		fmt.Println(err)
		log.Println("RegNlbByAsync ", err)

		StoreWebsocketMessage(util.TASK_TYPE_NLB, taskKey, util.NLB_LIFECYCLE_CREATE, util.TASK_STATUS_FAIL, c) // session에 작업내용 저장

	}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set

		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		log.Println("RegNlbByAsync ", failResultInfo)
		StoreWebsocketMessage(util.TASK_TYPE_NLB, taskKey, util.NLB_LIFECYCLE_CREATE, util.TASK_STATUS_FAIL, c) // session에 작업내용 저장
	} else {
		StoreWebsocketMessage(util.TASK_TYPE_NLB, taskKey, util.NLB_LIFECYCLE_CREATE, util.TASK_STATUS_COMPLETE, c) // session에 작업내용 저장
	}
}

// 특정 Namespace의 MCIS 내 모든 NLB 제거
func DelAllNlb(nameSpaceID string, mcisID string) (io.ReadCloser, frameworkmodel.WebStatus) {
	var originalUrl = "/ns/{nsId}/mcis/{mcisId}/nlb"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID

	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	// optionParamVal := ""
	// if optionParam != "" {
	// 	optionParamVal = "?match=" + optionParam
	// }

	// url := util.TUMBLEBUG + urlParam + optionParamVal
	url := util.TUMBLEBUG + urlParam

	if mcisID == "" {
		return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: "MCIS ID is required"}
	}

	// 경로안에 parameter가 있어 추가 param없이 호출 함.
	resp, err := util.CommonHttp(url, nil, http.MethodDelete)
	if err != nil {
		fmt.Println(err)
		return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	respBody := resp.Body
	respStatus := resp.StatusCode

	if respStatus != 200 && respStatus != 201 {
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		log.Println("DelNLB ", failResultInfo)
		return nil, frameworkmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	return respBody, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// DelNlb : nlbId 에 해당하는 nlb 제거
func DelNlb(nameSpaceID string, mcisID string, nlbID string, optionParam string) (io.ReadCloser, frameworkmodel.WebStatus) {
	var originalUrl = "/ns/{nsId}/mcis/{mcisId}/nlb/{nlbId}"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	paramMapper["{nlbId}"] = nlbID

	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam

	if mcisID == "" {
		return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: "MCIS ID is required"}
	}
	if nlbID == "" {
		return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: "NLB ID is required"}
	}

	// 경로안에 parameter가 있어 추가 param없이 호출 함.
	resp, err := util.CommonHttp(url, nil, http.MethodDelete)
	if err != nil {
		fmt.Println(err)
		return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	respBody := resp.Body
	respStatus := resp.StatusCode

	if respStatus != 200 && respStatus != 201 {
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		log.Println("DelNLB ", failResultInfo)
		return nil, frameworkmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	return respBody, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// 특정 NLB 조회
func GetNlbData(nameSpaceID string, mcisID string, nlbID string) (tbmcis.TbNLBInfo, frameworkmodel.WebStatus) {
	var originalUrl = "/ns/{nsId}/mcis/{mcisId}/nlb/{nlbId}"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	paramMapper["{nlbId}"] = nlbID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam
	resp, err := util.CommonHttp(url, nil, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return tbmcis.TbNLBInfo{}, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	nlbInfo := tbmcis.TbNLBInfo{}
	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return tbmcis.TbNLBInfo{}, frameworkmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&nlbInfo)

	return nlbInfo, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// 특정 NLB의 Health
func GetNlbHealth(nameSpaceID string, mcisID string, nlbID string) (tbmcis.TbNLBInfo, frameworkmodel.WebStatus) {
	var originalUrl = "/ns/{nsId}/mcis/{mcisId}/nlb/{nlbId}/healthz"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	paramMapper["{nlbId}"] = nlbID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam
	resp, err := util.CommonHttp(url, nil, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return tbmcis.TbNLBInfo{}, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	nlbInfo := tbmcis.TbNLBInfo{}
	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return tbmcis.TbNLBInfo{}, frameworkmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&nlbInfo)
	fmt.Println(nlbInfo)

	return nlbInfo, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// NLB의 TargetGroup에 VM 추가
func AddVmToNLBTargetGroup(nameSpaceID string, mcisID string, nlbID string, nlbTargetGroupReq *tbmcis.TbNLBAddRemoveVMReq) (*tbmcis.TbNLBInfo, frameworkmodel.WebStatus) {
	var originalUrl = "/ns/{nsId}/mcis/{mcisId}/nlb/{nlbId}/vm"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	paramMapper["{nlbId}"] = nlbID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam

	pbytes, _ := json.Marshal(nlbTargetGroupReq)
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	returnNlbInfo := tbmcis.TbNLBInfo{}
	returnStatus := frameworkmodel.WebStatus{}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if err != nil {
		fmt.Println(err)
		return &returnNlbInfo, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return &returnNlbInfo, frameworkmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&returnNlbInfo)
	fmt.Println(returnNlbInfo)

	returnStatus.StatusCode = respStatus

	return &returnNlbInfo, returnStatus
}

// NLB의 TargetGroup에 VM 제거
func RemoveVmToNLBTargetGroup(nameSpaceID string, mcisID string, nlbID string, nlbTargetGroupReq *tbmcis.TbNLBAddRemoveVMReq) (tbcommon.TbSimpleMsg, frameworkmodel.WebStatus) {
	var originalUrl = "/ns/{nsId}/mcis/{mcisId}/nlb/{nlbId}/vm"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	paramMapper["{nlbId}"] = nlbID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam

	pbytes, _ := json.Marshal(nlbTargetGroupReq)
	resp, err := util.CommonHttp(url, pbytes, http.MethodDelete)

	resultInfo := tbcommon.TbSimpleMsg{}
	returnStatus := frameworkmodel.WebStatus{}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if err != nil {
		fmt.Println(err)
		return resultInfo, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return resultInfo, frameworkmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&resultInfo)
	fmt.Println(resultInfo)

	returnStatus.StatusCode = respStatus

	return resultInfo, returnStatus
}
