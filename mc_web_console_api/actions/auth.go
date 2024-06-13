package actions

import (
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/mciammanager"

	"github.com/gobuffalo/buffalo"
)

func AuthLogin(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mciammanager.McIamLogin(c, commonRequest)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func AuthLogout(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mciammanager.McIamLogout(c, commonRequest)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func AuthGetUserInfo(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mciammanager.McIamGetUserInfo(c, commonRequest)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func AuthGetUserValidate(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mciammanager.McIamGetUserValidate(c, commonRequest)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}
