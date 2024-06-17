package mcinframanager

import (
	"encoding/base64"
	"mc_web_console_api/handler"
	"net/http"
	"os"

	"github.com/gobuffalo/buffalo"
)

func GetMCISList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCINFRAMANAGER, GetMcisList, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func GetMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCINFRAMANAGER, GetMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func DelMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, handler.MCINFRAMANAGER, DeleteMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func CreateMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, CreateMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func CreateDynamicMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, CreateDynamicMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func GetLoadDefaultResouce(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCINFRAMANAGER, GetLoadDefaultResource, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func DelDefaultResouce(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, handler.MCINFRAMANAGER, DelDefaultResource, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func MCISRecommendVm(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, McisRecommendVm, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func MCISDynamicCheckRequest(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, PostMcisDynamicCheckRequest, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func SendCommandtoMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, PostCmdMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func ControlLifecycle(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCINFRAMANAGER, GetControlMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func GetImageId(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	// endPoint := "/ns/{nsId}/resources/image/{imageId}"
	// common에 있는 이미지 사용
	// TODO: custom 일 때 처리
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCINFRAMANAGER, getPublicImageId, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func CreateVMDynamic(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	// endPoint := "/ns/{nsId}/resources/image/{imageId}"
	// common에 있는 이미지 사용
	// TODO: custom 일 때 처리
	// endPoint := "/ns/{nsId}/mcis/{mcisId}/vmDynamic"
	commonResponse, _ := handler.CommonCaller(http.MethodPost, handler.MCINFRAMANAGER, PostMcisVmDynamic, commonRequest, mcinframanagerAuthentication())
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
