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
