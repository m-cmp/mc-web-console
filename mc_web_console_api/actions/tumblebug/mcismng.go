package tumblebug

import (
	"mc_web_console_api/fwmodels/webconsole"
	"mc_web_console_api/util"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func GetMCISList(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/ns/{nsId}/mcis"
	commonResponse, _ := webconsole.CommonCaller(http.MethodGet, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}

func GetMCIS(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/ns/{nsId}/mcis/{mcisId}"
	commonResponse, _ := webconsole.CommonCaller(http.MethodGet, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}

func DelMCIS(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/ns/{nsId}/mcis/{mcisId}"
	commonResponse, _ := webconsole.CommonCaller(http.MethodDelete, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}

func CreateMCIS(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/ns/{nsId}/mcis"
	commonResponse, _ := webconsole.CommonCaller(http.MethodPost, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}

func CreateDynamicMCIS(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/ns/{nsId}/mcisDynamic"
	commonResponse, _ := webconsole.CommonCaller(http.MethodPost, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}

func GetLoadDefaultResouce(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/ns/{nsId}/loadDefaultResource"
	commonResponse, _ := webconsole.CommonCaller(http.MethodGet, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}

func DelDefaultResouce(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/ns/{nsId}/defaultResources"
	commonResponse, _ := webconsole.CommonCaller(http.MethodDelete, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}

func MCISRecommendVm(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/mcisRecommendVm"
	commonResponse, _ := webconsole.CommonCaller(http.MethodPost, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}

func MCISDynamicCheckRequest(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/mcisDynamicCheckRequest"
	commonResponse, _ := webconsole.CommonCaller(http.MethodPost, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}

func SendCommandtoMCIS(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/ns/{nsId}/cmd/mcis/{mcisId}"
	commonResponse, _ := webconsole.CommonCaller(http.MethodPost, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}

func ControlLifecycle(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	endPoint := "/ns/{nsId}/control/mcis/{mcisId}"
	commonResponse, _ := webconsole.CommonCaller(http.MethodGet, util.TUMBLEBUG, endPoint, commonRequest, webconsole.TBAuthentication())
	return commonResponse
}
