package mcinframanager

import (
	"encoding/base64"
	"mc_web_console_api/handler"
	"net/http"
	"os"

	"github.com/gobuffalo/buffalo"
)

func GetMCISList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCINFRAMANAGER, getMcisList, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func GetMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCINFRAMANAGER, getMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func DelMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, handler.MCINFRAMANAGER, delMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func CreateMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, createMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func CreateDynamicMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, createDynamicMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func GetLoadDefaultResouce(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCINFRAMANAGER, getLoadDefaultResource, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func DelDefaultResouce(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, handler.MCINFRAMANAGER, delDefaultResource, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func MCISRecommendVm(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, mcisRecommendVm, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func MCISDynamicCheckRequest(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, mcisDynamicCheckRequest, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func SendCommandtoMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, sendCommandToMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func ControlLifecycle(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCINFRAMANAGER, controlLifecycle, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func GetImageId(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	// endPoint := "/ns/{nsId}/resources/image/{imageId}"
	// common에 있는 이미지 사용
	// TODO: custom 일 때 처리
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCINFRAMANAGER, getImageId, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func CreateVMDynamic(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	// endPoint := "/ns/{nsId}/resources/image/{imageId}"
	// common에 있는 이미지 사용
	// TODO: custom 일 때 처리
	// endPoint := "/ns/{nsId}/mcis/{mcisId}/vmDynamic"
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, createVMDynamic, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// auth fot mcinframanager
func mcinframanagerAuthentication() string {
	apiusername := os.Getenv("API_USERNAME")
	apipassword := os.Getenv("API_PASSWORD")
	apiUserInfo := apiusername + ":" + apipassword
	encA := base64.StdEncoding.EncodeToString([]byte(apiUserInfo))
	return "Basic " + encA
}
