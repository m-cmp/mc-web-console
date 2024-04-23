package actions

import (
	"log"
	"mc_web_console_api/actions/workspace"
	"mc_web_console_api/fwmodels/webconsole"
	"mc_web_console_api/util"

	"github.com/gobuffalo/buffalo"
)

// 사용자의 workspace 목록 조회
// mciammamager를 사용하지 않으면 default 를 return
func WorkspaceListByUser(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse := &webconsole.CommonResponse{}
	var err error
	if util.MCIAM_USE {
		commonResponse, err = workspace.WorkspaceMciamListByUser(c, commonReq)
		if err != nil {
			log.Println(err.Error())
			return commonResponse
		}
		return commonResponse
	} else {
		commonResponse.ResponseData = "NO WorkspaceListByUser"
		return webconsole.CommonResponseStatusInternalServerError(commonResponse)
	}
}

// workspace에 할당 된 project 목록 조회
// 미 할당 된 workspace는 default에 있음
// mciammanager를 사용하지 않으면 모든 project는 default workspace에 있다고 간주.
func ProjectListByWorkspaceId(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse := &webconsole.CommonResponse{}
	var err error
	if util.MCIAM_USE {
		commonResponse, err = workspace.ProjectListMciamByWorkspaceId(c, commonReq)
		if err != nil {
			log.Println(err.Error())
			return commonResponse
		}
		return commonResponse
	} else {
		commonResponse.ResponseData = "NO ProjectListByWorkspaceId"
		return webconsole.CommonResponseStatusInternalServerError(commonResponse)
	}
}
