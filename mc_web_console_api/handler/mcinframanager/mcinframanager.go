package mcinframanager

import (
	"encoding/base64"
	"mc_web_console_api/handler"
	"net/http"
	"os"

	"github.com/gobuffalo/buffalo"
)

var MCINFRAMANAGER = os.Getenv("MCINFRAMANAGER")

func InfraGetMcisList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetMcisList, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraGetMcis(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraDeleteMcis(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, MCINFRAMANAGER, DeleteMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraCreateMcis(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, MCINFRAMANAGER, CreateMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraCreateDynamicMcis(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, MCINFRAMANAGER, CreateDynamicMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraGetLoadDefaultResouce(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetLoadDefaultResource, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraDeleteDefaultResouce(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, MCINFRAMANAGER, DelDefaultResource, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraMcisRecommendVm(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, MCINFRAMANAGER, McisRecommendVm, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraMcisDynamicCheckRequest(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, MCINFRAMANAGER, PostMcisDynamicCheckRequest, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraCmdMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, MCINFRAMANAGER, PostCmdMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// MCIS의 lifecycle 제어(suspend, resume, terminate)
func InfraControlMcis(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetControlMcis, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// system-purpose-common-ns 에 import 된 public image 단건조회
func InfraGetPublicImage(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	// endPoint := "/ns/{nsId}/resources/image/{imageId}"
	// common에 있는 이미지 사용
	// TODO: custom 일 때 처리
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, getPublicImage, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraMcisVmDynamic(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	// endPoint := "/ns/{nsId}/resources/image/{imageId}"
	// common에 있는 이미지 사용
	// TODO: custom 일 때 처리
	// endPoint := "/ns/{nsId}/mcis/{mcisId}/vmDynamic"
	commonResponse, _ := handler.CommonCaller(http.MethodPost, MCINFRAMANAGER, PostMcisVmDynamic, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

/////////////////Settings Resources Area //////////////////////

func InfraGetVPCList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetVPCList, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraGetVPC(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetVPC, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraCreateVPC(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, MCINFRAMANAGER, CreateVPC, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraDeleteVPC(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, MCINFRAMANAGER, DeleteVPC, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// Admin only : Delete all vpc
func InfraDeleteAllVPC(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, MCINFRAMANAGER, DeleteAllVPC, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// //
func InfraGetSecurityGroupList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetSGList, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraGetSecurityGroup(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetSG, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraCreateSecurityGroup(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, MCINFRAMANAGER, CreateVPC, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraDeleteSecurityGroup(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, MCINFRAMANAGER, DeleteSG, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// Admin only : Delete all security group
func InfraDeleteAllSecurityGroup(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, MCINFRAMANAGER, DeleteAllSG, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// //
func InfraGetVmSpecList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetSpecList, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraGetVmSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetSpec, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraCreateVmSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodPost, MCINFRAMANAGER, CreateSpec, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraDeleteVmSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, MCINFRAMANAGER, DeleteSpec, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// Admin only : Delete all vm spec
func InfraDeleteAllVmSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodDelete, MCINFRAMANAGER, DeleteAllSpec, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// //
func InfraGetCommonVmSpecList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetCommonSpecList, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraGetCommonVmSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetCommonSpec, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraGetResourceCommonSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetResourceCommonSpec, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraGetConnConfigListByType(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetConnConfigListByType, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// GetResourceList
func InfraGetResourceList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetResourceList, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// GetResource
func InfraGetResource(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetResource, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// InfraGetResourceByConn
func InfraGetResourceByConn(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetResource, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraGetAllResourcesByType(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetAllResourcesByType, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

func InfraGetAllResourcesByConn(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCINFRAMANAGER, GetAllResourcesByConn, commonRequest, mcinframanagerAuthentication())
	return commonResponse
}

// ///////////////Settings Resources Area End //////////////////////
// auth fot mcinframanager
func mcinframanagerAuthentication() string {
	apiusername := os.Getenv("API_USERNAME")
	apipassword := os.Getenv("API_PASSWORD")
	apiUserInfo := apiusername + ":" + apipassword
	encA := base64.StdEncoding.EncodeToString([]byte(apiUserInfo))
	return "Basic " + encA
}
