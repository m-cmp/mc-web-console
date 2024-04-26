package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	// "os"

	// "mc_web_console_api/fwmodels/spider"

	fwmodels "mc_web_console_api/fwmodels"
	tbcommon "mc_web_console_api/fwmodels/tumblebug/common"

	// tbmcir "mc_web_console_api/fwmodels/tumblebug/mcir"
	tbmcis "mc_web_console_api/fwmodels/tumblebug/mcis"

	util "mc_web_console_api/util"
)

// List all MCIS Policys
func GetMcisPolicyList(nameSpaceID string) ([]tbmcis.RestGetAllMcisPolicyResponse, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/policy/mcis"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam
	// url := util.TUMBLEBUG + "/ns/" + nameSpaceID + "/policy/mcis"

	// resp, err := util.CommonHttp(url, nil, http.MethodGet)
	resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	mcisPolicyList := map[string][]tbmcis.RestGetAllMcisPolicyResponse{}
	json.NewDecoder(respBody).Decode(&mcisPolicyList)
	fmt.Println(mcisPolicyList["mcisPolicy"])
	log.Println(respBody)
	util.DisplayResponse(resp) // 수신내용 확인

	return mcisPolicyList["mcisPolicy"], fwmodels.WebStatus{StatusCode: respStatus}
}

// Get McisPolish Data
func GetMcisPolicyInfoData(nameSpaceID string, mcisID string) (*tbmcis.RestGetAllMcisPolicyResponse, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/policy/mcis/{mcisId}"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam
	// url := util.TUMBLEBUG + "/ns/" + nameSpaceID + "/policy/mcis/" + mcisID

	resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	// defer body.Close()
	mcisPolicyInfo := tbmcis.RestGetAllMcisPolicyResponse{}
	if err != nil {
		fmt.Println(err)
		return &mcisPolicyInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// util.DisplayResponse(resp) // 수신내용 확인

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&mcisPolicyInfo)
	fmt.Println(mcisPolicyInfo)

	return &mcisPolicyInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

func RegMcisPolicy(nameSpaceID string, mcisID string, mcisPolicyInfo *tbmcis.McisPolicyInfo) (*tbmcis.McisPolicyInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/policy/mcis/{mcisId}"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam
	// url := util.TUMBLEBUG + "/ns/" + nameSpaceID + "/policy/mcis" + mcisID

	pbytes, _ := json.Marshal(mcisPolicyInfo)
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	returnMcisPolicyInfo := tbmcis.McisPolicyInfo{}
	returnStatus := fwmodels.WebStatus{}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if err != nil {
		fmt.Println(err)
		return &returnMcisPolicyInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		errorInfo := fwmodels.ErrorInfo{}
		json.NewDecoder(respBody).Decode(&errorInfo)
		fmt.Println("respStatus != 200 reason ", errorInfo)
		returnStatus.Message = errorInfo.Message
	} else {
		json.NewDecoder(respBody).Decode(&returnMcisPolicyInfo)
		fmt.Println(returnMcisPolicyInfo)
	}
	returnStatus.StatusCode = respStatus

	return &returnMcisPolicyInfo, returnStatus
}

func DelAllMcisPolicy(nameSpaceID string) (tbcommon.TbSimpleMsg, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/policy/mcis"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam

	resp, err := util.CommonHttpWithoutParam(url, http.MethodDelete)

	resultInfo := tbcommon.TbSimpleMsg{}

	if err != nil {
		return resultInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&resultInfo)
	log.Println(resultInfo)
	log.Println("ResultMessage : " + resultInfo.Message)

	if respStatus != 200 && respStatus != 201 {
		return resultInfo, fwmodels.WebStatus{StatusCode: respStatus, Message: resultInfo.Message}
	}

	return resultInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

func DelMcisPolicy(nameSpaceID string, mcisID string) (io.ReadCloser, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/policy/mcis/{mcisId}"

	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{mcisId}"] = mcisID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam
	// url := util.TUMBLEBUG + "/ns/" + nameSpaceID + "/policy/mcis/" + mcisID

	if mcisID == "" {
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: "MCIS ID is required"}
	}

	// 경로안에 parameter가 있어 추가 param없이 호출 함.
	resp, err := util.CommonHttp(url, nil, http.MethodDelete)
	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode
	return respBody, fwmodels.WebStatus{StatusCode: respStatus}
}
