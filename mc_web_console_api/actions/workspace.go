package actions

import (
	"mc_web_console_api/actions/workspace"
	"mc_web_console_api/fwmodels/webconsole"
	util "mc_web_console_api/util"

	"github.com/gobuffalo/buffalo"
)

// 사용자의 workspace 목록 조회
// mciammamager를 사용하지 않으면 default 를 return
func GetWorkspaceByUserId(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	if util.MCIAM_USE {
		commonResponse := workspace.McIamGetWorkspaceByUserId(c, commonRequest)
		return commonResponse
	} else {
		commonResponse := workspace.WebconsoleGetWorkspaceByUserId(c, commonRequest)
		return commonResponse
	}
}
