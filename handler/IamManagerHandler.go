package handler

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"

	//"strings"
	//"github.com/davecgh/go-spew/spew"
	"net/http"

	frameworkmodel "mc_web_console/frameworkmodel"
	iammanager "mc_web_console/frameworkmodel/iammanager"

	util "mc_web_console/util"
)

type LoginResp struct {
	IamAccessToken string `json:"iamAccessToken"`
}

// 로그인 : 로그인 토큰 받기
func IamManagerLogin(iamLoginInfo iammanager.IamLoginInfo) (string, frameworkmodel.WebStatus) {

	var originalUrl = "/api/v1/login"
	url := util.IAMMANAGER + originalUrl
	fmt.Println("url ", url)
	pbytes, _ := json.Marshal(iamLoginInfo)
	fmt.Println(string(pbytes))

	resp, err := util.CommonIamHttpLogin(url, pbytes, http.MethodPost)
	if err != nil {
		fmt.Println(err)
		return "", frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}

	}

	respBody := resp.Body
	respStatus := resp.StatusCode
	fmt.Println("respStatus ", respStatus)
	fmt.Println("respBody ", respBody)

	// var target interface{}
	// body, _ := ioutil.ReadAll(resp.Body)
	// json.Unmarshal(body, &target)
	// fmt.Println(fmt.Println(target))

	// var loginResp LoginResp
	// json.Unmarshal(body, &loginResp)
	// fmt.Println(loginResp)
	// fmt.Println(loginResp.IamAccessToken)

	//var loginResp LoginResp
	var loginInfo iammanager.IamLoginInfo
	//json.Unmarshal(respBody, &loginResp)
	json.NewDecoder(respBody).Decode(&loginInfo)
	//fmt.Println(loginResp)
	//fmt.Println(loginResp.IamAccessToken)

	//var objmap map[string]interface{}
	//_ = json.Unmarshal(resp, &objmap)

	//mm := map[string][]string{}
	//mm := ""
	//json.NewDecoder(respBody).Decode(&objmap)
	//fmt.Println(objmap)

	if respStatus == 500 {
		webStatus := frameworkmodel.WebStatus{}
		json.NewDecoder(respBody).Decode(&webStatus)
		fmt.Println(webStatus)
		webStatus.StatusCode = respStatus
		return "", webStatus

	}

	// 응답에 생성한 객체값이 옴
	//iamAccessToken := ""
	if loginInfo.AccessToken == "" {
		webStatus := frameworkmodel.WebStatus{}
		webStatus.StatusCode = 500
		webStatus.Message = "failed to access"
		return "", webStatus
	}

	iamAccessToken := loginInfo.AccessToken
	fmt.Println("** iamAccessToken = ", iamAccessToken)
	return iamAccessToken, frameworkmodel.WebStatus{StatusCode: respStatus}

}

// // Role 목록 조회
func IamManagerRoleList(iamAccessToken string, optionParam string, filterKeyParam string, filterValParam string) ([]iammanager.MCIamRole, frameworkmodel.WebStatus) {
	var originalUrl = "/api/v1/roles"
	var paramMapper = make(map[string]string)
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	if optionParam != "" {
		urlParam += "?option=" + optionParam
	} else {
		urlParam += "?option="
	}
	if filterKeyParam != "" {
		urlParam += "&filterKey=" + filterKeyParam
		urlParam += "&filterVal=" + filterValParam
	}
	url := util.IAMMANAGER + urlParam

	resp, err := util.CommonIamHttp(url, nil, http.MethodGet, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// defer body.Close()
	respBody := resp.Body
	respStatus := resp.StatusCode

	// return respBody, respStatus
	log.Println(respBody)
	//mciamRoleList := map[string][]iammanager.MCIamRole{}
	mciamRoleList := []iammanager.MCIamRole{}
	json.NewDecoder(respBody).Decode(&mciamRoleList)
	//spew.Dump(body)
	//fmt.Println(mciamRoleList["role"])
	fmt.Println(mciamRoleList)

	return mciamRoleList, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// ID로 IAM Role 조회
func GetIamManagerRoleByID(iamAccessToken string, roleId string, optionParam string, filterKeyParam string, filterValParam string) (iammanager.MCIamRole, frameworkmodel.WebStatus) {
	fmt.Println("GetIamManagerRoleByID ************ : ")
	mciamRole := iammanager.MCIamRole{}
	var originalUrl = "/api/v1/roles/id/{roleId}"
	var paramMapper = make(map[string]string)
	paramMapper["{roleId}"] = roleId
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	if optionParam != "" {
		urlParam += "?option=" + optionParam
	} else {
		urlParam += "?option="
	}

	if filterKeyParam != "" {
		urlParam += "&filterKey=" + filterKeyParam
		urlParam += "&filterVal=" + filterValParam
	}
	url := util.IAMMANAGER + urlParam
	resp, err := util.CommonIamHttp(url, nil, http.MethodGet, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return mciamRole, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// defer body.Close()
	respBody := resp.Body
	respStatus := resp.StatusCode

	// return respBody, respStatus
	log.Println(respBody)

	json.NewDecoder(respBody).Decode(&mciamRole)

	return mciamRole, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// 새로운 Role 등록
func RegIamManagerRole(iamAccessToken string, mciamRole iammanager.MCIamRole) frameworkmodel.WebStatus {
	var originalUrl = "/api/v1/roles"
	var paramMapper = make(map[string]string)

	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.IAMMANAGER + urlParam

	fmt.Println("mciamRole : ", mciamRole)

	pbytes, _ := json.Marshal(mciamRole)
	fmt.Println(string(pbytes))
	resp, err := util.CommonIamHttp(url, pbytes, http.MethodPost, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	fmt.Println(resp)
	return frameworkmodel.WebStatus{StatusCode: 200, Message: "success"}
}

// Role 정보 Update
func UpdateIamManagerRole(iamAccessToken string, mciamRole iammanager.MCIamRole) frameworkmodel.WebStatus {
	var originalUrl = "/api/v1/roles/id/{roleId}"
	var paramMapper = make(map[string]string)
	paramMapper["{roleId}"] = mciamRole.ID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.IAMMANAGER + urlParam

	fmt.Println("mciamRole : ", mciamRole)

	pbytes, _ := json.Marshal(mciamRole)
	fmt.Println(string(pbytes))
	resp, err := util.CommonIamHttp(url, pbytes, http.MethodPost, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode
	fmt.Println("respStatus ", respStatus)

	if respStatus == 500 {
		webStatus := frameworkmodel.WebStatus{}
		json.NewDecoder(respBody).Decode(&webStatus)
		fmt.Println(webStatus)
		webStatus.StatusCode = respStatus
		return webStatus
	}

	return frameworkmodel.WebStatus{StatusCode: respStatus}
}

// MCIAM Role 삭제
func DelIamManagerRole(iamAccessToken string, mciamRoleId string) (frameworkmodel.WebStatus, frameworkmodel.WebStatus) {
	webStatus := frameworkmodel.WebStatus{}

	var originalUrl = "/api/v1/roles/id/{roleId}"
	var paramMapper = make(map[string]string)
	paramMapper["{roleId}"] = mciamRoleId
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.IAMMANAGER + urlParam

	resp, err := util.CommonIamHttp(url, nil, http.MethodDelete, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return webStatus, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// return body, err
	respBody := resp.Body
	respStatus := resp.StatusCode
	resultInfo := frameworkmodel.ResultInfo{}

	json.NewDecoder(respBody).Decode(&resultInfo)
	log.Println(resultInfo)
	log.Println("ResultMessage : " + resultInfo.Message)

	if respStatus != 200 && respStatus != 201 {
		return frameworkmodel.WebStatus{}, frameworkmodel.WebStatus{StatusCode: respStatus, Message: resultInfo.Message}
	}
	webStatus.StatusCode = respStatus
	webStatus.Message = resultInfo.Message
	return webStatus, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// Workspace 조회
func IamManagerWorkspaceList(iamAccessToken string) ([]iammanager.MCIamWorkspace, frameworkmodel.WebStatus) {
	workspaceList := []iammanager.MCIamWorkspace{}

	var originalUrl = "/api/v1/workspace"

	url := util.IAMMANAGER + originalUrl

	resp, err := util.CommonIamHttp(url, nil, http.MethodGet, iamAccessToken)
	if err != nil {
		fmt.Println(err)
		return workspaceList, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	// defer body.Close()
	respBody := resp.Body
	respStatus := resp.StatusCode

	body, _ := ioutil.ReadAll(respBody)
	json.Unmarshal(body, &workspaceList)

	// 오류인데도 200을 반환함. 수정 필요.
	if len(workspaceList) == 0 {
		//var target interface{}
		var target map[string]interface{}
		json.Unmarshal(body, &target)
		fmt.Println(fmt.Println(target))
		fmt.Println(target["err"])
		fmt.Println("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
		if target["err"] != nil {
			return workspaceList, frameworkmodel.WebStatus{StatusCode: 500, Message: target["err"].(string)}
		}
	}

	log.Println(" workspace resp 111111111111111111")
	log.Println(workspaceList)
	// fmt.Println(dataDiskInfoList["dataDisk"])

	return workspaceList, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// id로 workspace 조회
func GetIamManagerWorkspaceByID(iamAccessToken string, workspaceId string) (iammanager.MCIamWorkspace, frameworkmodel.WebStatus) {
	fmt.Println("GetIamManagerRoleByID ************ : ")
	mciamWorkspace := iammanager.MCIamWorkspace{}
	var originalUrl = "/api/v1/workspace/id/{workspaceId}"
	var paramMapper = make(map[string]string)
	paramMapper["{workspaceId}"] = workspaceId
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.IAMMANAGER + urlParam
	resp, err := util.CommonIamHttp(url, nil, http.MethodGet, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return mciamWorkspace, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// defer body.Close()
	respBody := resp.Body
	respStatus := resp.StatusCode

	// return respBody, respStatus
	log.Println(respBody)

	json.NewDecoder(respBody).Decode(&mciamWorkspace)

	return mciamWorkspace, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// workspace 등록
func RegIamManagerWorkspace(iamAccessToken string, mciamWorkspace iammanager.MCIamWorkspace) frameworkmodel.WebStatus {
	var originalUrl = "/api/v1/workspace"
	var paramMapper = make(map[string]string)

	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.IAMMANAGER + urlParam

	fmt.Println("mciamWorkspace : ", mciamWorkspace)

	pbytes, _ := json.Marshal(mciamWorkspace)
	fmt.Println(string(pbytes))
	resp, err := util.CommonIamHttp(url, pbytes, http.MethodPost, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	fmt.Println(resp)
	return frameworkmodel.WebStatus{StatusCode: 200, Message: "success"}
}

// workspace update
func UpdateIamManagerWorkspace(iamAccessToken string, mciamWorkspace iammanager.MCIamWorkspace) frameworkmodel.WebStatus {
	var originalUrl = "/api/v1/workspace/id/{workspaceId}"
	var paramMapper = make(map[string]string)
	paramMapper["{workspaceId}"] = mciamWorkspace.ID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.IAMMANAGER + urlParam

	fmt.Println("mciamWorkspace : ", mciamWorkspace)

	pbytes, _ := json.Marshal(mciamWorkspace)
	fmt.Println(string(pbytes))
	resp, err := util.CommonIamHttp(url, pbytes, http.MethodPost, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode
	fmt.Println("respStatus ", respStatus)

	if respStatus == 500 {
		webStatus := frameworkmodel.WebStatus{}
		json.NewDecoder(respBody).Decode(&webStatus)
		fmt.Println(webStatus)
		webStatus.StatusCode = respStatus
		return webStatus
	}

	return frameworkmodel.WebStatus{StatusCode: respStatus}
}

// workspace Delete
func DelIamManagerWorkspace(iamAccessToken string, mciamWorkspaceId string) (frameworkmodel.WebStatus, frameworkmodel.WebStatus) {
	webStatus := frameworkmodel.WebStatus{}

	var originalUrl = "/api/v1/workspace/id/{workspaceId}"
	var paramMapper = make(map[string]string)
	paramMapper["{workspaceId}"] = mciamWorkspaceId
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.IAMMANAGER + urlParam

	resp, err := util.CommonIamHttp(url, nil, http.MethodDelete, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return webStatus, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// return body, err
	respBody := resp.Body
	respStatus := resp.StatusCode
	resultInfo := frameworkmodel.ResultInfo{}

	json.NewDecoder(respBody).Decode(&resultInfo)
	log.Println(resultInfo)
	log.Println("ResultMessage : " + resultInfo.Message)

	if respStatus != 200 && respStatus != 201 {
		return frameworkmodel.WebStatus{}, frameworkmodel.WebStatus{StatusCode: respStatus, Message: resultInfo.Message}
	}
	webStatus.StatusCode = respStatus
	webStatus.Message = resultInfo.Message
	return webStatus, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// Iam의 Workspace내 Namespace 조회
func IamManagerProjectList(iamAccessToken string, workspaceId string) ([]iammanager.MCIamProject, frameworkmodel.WebStatus) {
	fmt.Println("IamManagerNamespaceList ************ : ")
	mciamProjectList := []iammanager.MCIamProject{}
	var originalUrl = "/api/v1/workspace/id/{workspaceId}/namespace/"
	var paramMapper = make(map[string]string)
	paramMapper["{workspaceId}"] = workspaceId
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.IAMMANAGER + urlParam
	resp, err := util.CommonIamHttp(url, nil, http.MethodGet, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return mciamProjectList, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// defer body.Close()
	respBody := resp.Body
	respStatus := resp.StatusCode

	body, _ := ioutil.ReadAll(respBody)
	json.Unmarshal(body, &mciamProjectList)

	// return respBody, respStatus
	log.Println(respBody)
	//json.NewDecoder(respBody).Decode(&mciamNamespaceList)

	return mciamProjectList, frameworkmodel.WebStatus{StatusCode: respStatus}
}

// Iam의 Namespace 조회
func GetIamManagerProject(iamAccessToken string, workspaceId string, projectId string) (iammanager.MCIamProject, frameworkmodel.WebStatus) {
	fmt.Println("GetIamManagerRoleByID ************ : ")
	mciamProject := iammanager.MCIamProject{}
	var originalUrl = "/api/v1/workspace/id/{workspaceId}/project/id/{projectId}"
	var paramMapper = make(map[string]string)
	paramMapper["{workspaceId}"] = workspaceId
	paramMapper["{projectId}"] = projectId
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.IAMMANAGER + urlParam
	resp, err := util.CommonIamHttp(url, nil, http.MethodGet, iamAccessToken)

	if err != nil {
		fmt.Println(err)
		return mciamProject, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// defer body.Close()
	respBody := resp.Body
	respStatus := resp.StatusCode

	// return respBody, respStatus
	log.Println(respBody)

	json.NewDecoder(respBody).Decode(&mciamProject)

	return mciamProject, frameworkmodel.WebStatus{StatusCode: respStatus}
}
