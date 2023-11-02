package handler

import (
	"encoding/json"
	"fmt"
	"log"

	// "math"
	"net/http"
	// "strconv"
	// "sync"
	fwmodel "mc_web_console/frameworkmodel"
	tbcommon "mc_web_console/frameworkmodel/tumblebug/common"
	util "mc_web_console/util"
)

func DelAllTbConfig() (tbcommon.TbSimpleMsg, fwmodel.WebStatus) {
	fmt.Println("Delete all configs start")
	var originalUrl = "/config"
	urlParam := util.MappingUrlParameter(originalUrl, nil)

	url := util.TUMBLEBUG + urlParam
	// url := util.TUMBLEBUG + "/ns"

	resp, err := util.CommonHttp(url, nil, http.MethodDelete)
	//body := HttpGetHandler(url)

	resultInfo := tbcommon.TbSimpleMsg{}

	if err != nil {
		return resultInfo, fwmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&resultInfo)
	log.Println(resultInfo)
	log.Println("ResultMessage : " + resultInfo.Message)

	if respStatus != 200 && respStatus != 201 {
		return resultInfo, fwmodel.WebStatus{StatusCode: respStatus, Message: resultInfo.Message}
	}

	return resultInfo, fwmodel.WebStatus{StatusCode: respStatus}
}

func GetAllTbConfig() (tbcommon.TbRestGetAllConfigResponse, fwmodel.WebStatus) {
	fmt.Println("Get all configs list start")
	var originalUrl = "/config"
	urlParam := util.MappingUrlParameter(originalUrl, nil)

	url := util.TUMBLEBUG + urlParam
	// url := util.TUMBLEBUG + "/ns"

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	//body := HttpGetHandler(url)

	resultAllConfigInfo := tbcommon.TbRestGetAllConfigResponse{}

	if err != nil {
		return resultAllConfigInfo, fwmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	// log.Println("ResultMessage : " + resultInfo.Message)

	if respStatus != 200 && respStatus != 201 {
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return resultAllConfigInfo, fwmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&resultAllConfigInfo)
	log.Println(resultAllConfigInfo)

	return resultAllConfigInfo, fwmodel.WebStatus{StatusCode: respStatus}
}

func RegOrUpdateConfig(configReg tbcommon.TbConfigReq) (tbcommon.TbConfigInfo, fwmodel.WebStatus) {
	fmt.Println("Create or Update config ")
	//https://www.javaer101.com/ko/article/5704925.html 참조 : 값이 있는 것만 넘기기
	var originalUrl = "​/config"
	urlParam := util.MappingUrlParameter(originalUrl, nil)
	url := util.TUMBLEBUG + urlParam

	pbytes, _ := json.Marshal(configReg)
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	resultConfigInfo := tbcommon.TbConfigInfo{}

	if err != nil {
		return resultConfigInfo, fwmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if respStatus != 200 && respStatus != 201 {
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return resultConfigInfo, fwmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&resultConfigInfo)
	fmt.Println(resultConfigInfo)

	return resultConfigInfo, fwmodel.WebStatus{StatusCode: respStatus}

}

func DelTbConfig(configID string) (tbcommon.TbConfigInfo, fwmodel.WebStatus) {
	var originalUrl = "/config/{configId}"

	var paramMapper = make(map[string]string)
	paramMapper["{configId}"] = configID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam
	resp, err := util.CommonHttpWithoutParam(url, http.MethodDelete)

	resultConfigInfo := tbcommon.TbConfigInfo{}

	if err != nil {
		return resultConfigInfo, fwmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if respStatus != 200 && respStatus != 201 {
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return resultConfigInfo, fwmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&resultConfigInfo)
	fmt.Println(resultConfigInfo)

	return resultConfigInfo, fwmodel.WebStatus{StatusCode: respStatus}
}

func GetTbConfig(configID string) (tbcommon.TbConfigInfo, fwmodel.WebStatus) {
	var originalUrl = "/config/{configId}"

	var paramMapper = make(map[string]string)
	paramMapper["{configId}"] = configID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam
	resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	resultConfigInfo := tbcommon.TbConfigInfo{}

	if err != nil {
		return resultConfigInfo, fwmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if respStatus != 200 && respStatus != 201 {
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return resultConfigInfo, fwmodel.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&resultConfigInfo)
	fmt.Println(resultConfigInfo)

	return resultConfigInfo, fwmodel.WebStatus{StatusCode: respStatus}
}
