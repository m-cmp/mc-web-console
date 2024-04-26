package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	// "github.com/davecgh/go-spew/spew"

	// "os"
	"mc_web_console_api/fwmodels"
	tbcommon "mc_web_console_api/fwmodels/tumblebug/common"
	tbnetutil "mc_web_console_api/fwmodels/tumblebug/netutil"

	util "mc_web_console_api/util"

)


/////////// TODO : Network 관련해서 ResourceHandler의 정의된 부분을 이쪽으로 옮길 것 (ex. vpc, subnet ...) /////////////////

// Design a multi-cloud network configuration
// Design a hierarchical network configuration of a VPC network or multi-cloud network consisting of multiple VPC networks
// example
// {
// 	"cidrBlock": "string",
// 	"name": "string",
// 	"subnets": [
// 	  {
// 		"cidrBlock": "string",
// 		"name": "string",
// 		"subnets": [
// 		  null
// 		]
// 	  }
// 	]
//   }
func DesignHierarchicalNetworkConfiguration(subnettingReq tbnetutil.SubnettingRequest)(tbcommon.TbSimpleMsg, fwmodels.WebStatus){
	var originalUrl = "/util/net/design"

	var paramMapper = make(map[string]string)	
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam

	pbytes, _ := json.Marshal(subnettingReq)
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	resultInfo := tbcommon.TbSimpleMsg{}
	returnStatus := fwmodels.WebStatus{}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if err != nil {
		fmt.Println(err)
		return resultInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return resultInfo, fwmodels.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&resultInfo)
	fmt.Println(resultInfo)

	returnStatus.StatusCode = respStatus

	return resultInfo, returnStatus
}


// Validate a hierarchical configuration of a VPC network or multi-cloud network consisting of multiple VPC networks
// example
// {
// 	"networkConfiguration": {
// 	  "cidrBlock": "string",
// 	  "name": "string",
// 	  "subnets": [
// 		null
// 	  ]
// 	}
//   }
func ValidateMultiCloudNetworkConfiguration(networkConfig tbnetutil.NetworkConfig) (tbcommon.TbSimpleMsg, fwmodels.WebStatus){
	var originalUrl = "/util/net/validate"

	var paramMapper = make(map[string]string)	
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam

	pbytes, _ := json.Marshal(networkConfig)
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	resultInfo := tbcommon.TbSimpleMsg{}
	returnStatus := fwmodels.WebStatus{}

	respBody := resp.Body
	respStatus := resp.StatusCode

	if err != nil {
		fmt.Println(err)
		return resultInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		failResultInfo := tbcommon.TbSimpleMsg{}
		json.NewDecoder(respBody).Decode(&failResultInfo)
		return resultInfo, fwmodels.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
	}

	json.NewDecoder(respBody).Decode(&resultInfo)
	fmt.Println(resultInfo)

	returnStatus.StatusCode = respStatus

	return resultInfo, returnStatus
}

