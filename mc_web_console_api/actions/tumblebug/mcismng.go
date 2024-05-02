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
	paramMapper := make(map[string]string)
	paramMapper["{nsId}"] = getMCISListRequest.NsId
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	optionParamVal := util.ParamParser(&getMCISListRequest.CommonParams)
	url := util.TUMBLEBUG + urlParam + optionParamVal

	commonResponse, err := util.CommonHttpToCommonResponse(url, nil, http.MethodGet, true)
	if err != nil {
		return webconsole.CommonResponseStatusInternalServerError(err)
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

	originalUrl := "​/ns​/{nsId}​/mcis​/{mcisId}"
	paramMapper := make(map[string]string)
	paramMapper["{nsId}"] = delMCISRequest.NsId
	paramMapper["{mcisId}"] = delMCISRequest.NsId
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	optionParamVal := util.ParamParser(&delMCISRequest.CommonParams)
	url := util.TUMBLEBUG + urlParam + optionParamVal

	commonResponse, err := util.CommonHttpToCommonResponse(url, nil, http.MethodGet, true)
	if err != nil {
		return webconsole.CommonResponseStatusInternalServerError(err)
	}

	return commonResponse
}
