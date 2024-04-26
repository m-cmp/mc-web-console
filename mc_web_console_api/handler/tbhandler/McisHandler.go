package tbhandler

// func McisList(request *webconsole.CommonRequest) ([]tbmcis.TbMcisInfo, fwmodels.WebStatus) {
// 	//var originalUrl = "/ns/{nsId}/mcis"
// 	returnMcisList := map[string][]tbmcis.TbMcisInfo{}
// 	returnStatus := fwmodels.WebStatus{}

// 	resp, err := GetFrameworkCall(request)
// 	if err != nil {
// 		fmt.Println(err)
// 		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
// 	}

// 	respBody := resp.Body
// 	respStatus := resp.StatusCode

// 	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
// 		failResultInfo := tbcommon.TbSimpleMsg{}
// 		json.NewDecoder(respBody).Decode(&failResultInfo)
// 		return nil, fwmodels.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
// 	}
// 	json.NewDecoder(respBody).Decode(&returnMcisList)
// 	fmt.Println(returnMcisList["mcis"])

// 	returnStatus.StatusCode = respStatus
// 	log.Println(respBody)

// 	return returnMcisList["mcis"], returnStatus
// }

// func GetFrameworkCall(request *webconsole.CommonRequest) (*http.Response, error) {
// 	var targetUrl = ""

// 	if request.PathParam != nil {
// 		targetUrl = request.OriginalUrl
// 		for key, value := range request.PathParam {
// 			placeholder := "{" + key + "}"
// 			targetUrl = strings.Replace(targetUrl, placeholder, fmt.Sprint(value), -1)
// 		}
// 	}

// 	if request.QueryParam != nil {
// 		query := "?"
// 		for key, value := range request.QueryParam {
// 			query += key + "=" + fmt.Sprint(value) + "&"
// 		}
// 		targetUrl += query
// 	}

// 	url := request.TargetFramework + targetUrl
// 	resp, err := util.CommonHttp(url, nil, http.MethodGet)

// 	return resp, err
// }

// func McisList(pathParam map[string]interface{}, queryParam map[string]interface{})([]tbmcis.TbMcisInfo, fwmodels.WebStatus){
// 	var originalUrl = "/ns/{nsId}/mcis"
// 	var targetUrl = ""
// 	returnMcisList := map[string][]tbmcis.TbMcisInfo{}
// 	returnStatus := fwmodels.WebStatus{}

// 	if pathParam != nil {
// 		for key, value := range pathParam {
// 			placeholder := "{" + key + "}"
// 			targetUrl = strings.Replace(originalUrl, placeholder, fmt.Sprint(value), -1)
// 		}
// 	}

// 	if queryParam != nil {
// 		query := "?"
// 		for key, value := range queryParam {
// 			query += key + "=" + fmt.Sprint(value) + "&"
// 		}
// 		targetUrl += query
// 	}

// 	url := util.TUMBLEBUG + targetUrl
// 	resp, err := util.CommonHttp(url, nil, http.MethodGet)

// 	if err != nil {
// 		fmt.Println(err)
// 		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
// 	}

// 	respBody := resp.Body
// 	respStatus := resp.StatusCode

// 	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
// 		failResultInfo := tbcommon.TbSimpleMsg{}
// 		json.NewDecoder(respBody).Decode(&failResultInfo)
// 		return nil, fwmodels.WebStatus{StatusCode: respStatus, Message: failResultInfo.Message}
// 	}
// 	json.NewDecoder(respBody).Decode(&returnMcisList)
// 	fmt.Println(returnMcisList["mcis"])

// 	returnStatus.StatusCode = respStatus
// 	log.Println(respBody)

// 	return returnMcisList["mcis"], returnStatus
// }
