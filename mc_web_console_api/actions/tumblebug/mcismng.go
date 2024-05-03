package tumblebug

import (
	"mc_web_console_api/fwmodels/webconsole"
	"mc_web_console_api/util"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/mitchellh/mapstructure"
)

// func GetMcisList()

// func GetMcisStatusCountMap()
// func GetMcisData()
// func GetVmData()

// func McisLifeCycleAsync()
// func RegMcisAsync()
// func RegMcisDynamicAsync()
// func GetMcisRecommendVmSpecList()
// func RegVmAsync()
// func RegVmDynamicAsync()
// func GetMcisStatusCountMap()
// func GetSimpleVmWithStatusCountMap()
// func GetAvailableDataDiskListForVM()
// func AttachDetachDataDiskToVMAsync()
// func RegVmSnapshotAsync()
// func CommandMcis()
// func CommandVmOfMcis()
// func DelMcis()
// func DelVM()
// func RegSubGroupAsync()
// func McisSubGroupList()
// func SubGroupVmListByID()
// func ScaleOutSubGroup()

type GetMCISListRequest struct {
	NsId         string            `json:"nsId" mapstructure:"nsId"`
	CommonParams util.CommonParams `json:"commonParams" mapstructure:"commonParams"`
}

func GetMCISList(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	getMCISListRequest := &GetMCISListRequest{}
	if err := mapstructure.Decode(commonReq.RequestData, getMCISListRequest); err != nil {
		return webconsole.CommonResponseStatusBadRequest(err)
	}
	originalUrl := "/ns/{nsId}/mcis"
	commonResponse, err := util.CommonCaller(http.MethodGet, util.TUMBLEBUG, originalUrl, *getMCISListRequest, getMCISListRequest.CommonParams)
	if err != nil {
		return commonResponse
	}

	return commonResponse
}

type DelMCISRequest struct {
	NsId         string            `json:"nsId" mapstructure:"nsId"`
	McisId       string            `json:"mcisId" mapstructure:"mcisId"`
	CommonParams util.CommonParams `json:"commonParams" mapstructure:"commonParams"`
}

func DelMCIS(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	delMCISRequest := &DelMCISRequest{}
	if err := mapstructure.Decode(commonReq.RequestData, delMCISRequest); err != nil {
		return webconsole.CommonResponseStatusBadRequest(err)
	}
	originalUrl := "/ns/{nsId}/mcis/{mcisId}"
	commonResponse, err := util.CommonCaller(http.MethodDelete, util.TUMBLEBUG, originalUrl, *delMCISRequest, delMCISRequest.CommonParams)
	if err != nil {
		return commonResponse
	}

	return commonResponse
}

type ControlMCISLifecycleRequest struct {
	NsId         string            `json:"nsId" mapstructure:"nsId"`
	McisId       string            `json:"mcisId" mapstructure:"mcisId"`
	CommonParams util.CommonParams `json:"commonParams" mapstructure:"commonParams"`
}

func ControlMCISLifecycle(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	controlMCISLifecycleRequest := &ControlMCISLifecycleRequest{}
	if err := mapstructure.Decode(commonReq.RequestData, controlMCISLifecycleRequest); err != nil {
		return webconsole.CommonResponseStatusBadRequest(err)
	}
	originalUrl := "/ns/{nsId}/control/mcis/{mcisId}"
	commonResponse, err := util.CommonCaller(http.MethodGet, util.TUMBLEBUG, originalUrl, *controlMCISLifecycleRequest, controlMCISLifecycleRequest.CommonParams)
	if err != nil {
		return commonResponse
	}

	return commonResponse
}
