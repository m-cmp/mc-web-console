package actions

import (
	"mc_web_console_api/actions/auth"
	webconsole "mc_web_console_api/fwmodels/webconsole"
	util "mc_web_console_api/util"

	"github.com/gobuffalo/buffalo"
)

func AuthLogin(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	if util.MCIAM_USE {
		commonResponse := auth.AuthMcIamLogin(c, commonRequest)
		return commonResponse
	}
	return webconsole.CommonResponseStatusInternalServerError(nil)
}

func AuthLogout(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	if util.MCIAM_USE {
		commonResponse := auth.AuthMcIamLogout(c, commonRequest)
		return commonResponse
	}
	return webconsole.CommonResponseStatusInternalServerError(nil)
}

func AuthGetUserInfo(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	if util.MCIAM_USE {
		commonResponse := auth.AuthMcIamGetUserInfo(c, commonRequest)
		return commonResponse
	}
	return webconsole.CommonResponseStatusInternalServerError(nil)
}

func AuthGetUserValidate(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	if util.MCIAM_USE {
		commonResponse := auth.AuthMcIamGetUserValidate(c, commonRequest)
		return commonResponse
	}
	return webconsole.CommonResponseStatusInternalServerError(nil)
}
