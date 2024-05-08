package actions

import (
	"log"

	"github.com/gobuffalo/buffalo"
	"github.com/golang-jwt/jwt/v4"

	"mc_web_console_api/actions/auth"
	"mc_web_console_api/fwmodels/webconsole"
	util "mc_web_console_api/util"
)

func AuthLogin(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse := &webconsole.CommonResponse{}
	var err error
	if util.MCIAM_USE {
		commonResponse, err = auth.AuthMcIamLogin(c, commonReq)
		if err != nil {
			log.Println(err.Error())
			return commonResponse
		}
		return commonResponse
	}
	return webconsole.CommonResponseStatusInternalServerError(nil)
}

func AuthLogout(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse := &webconsole.CommonResponse{}
	var err error
	if util.MCIAM_USE {
		commonResponse, err = auth.AuthMcIamLogout(c, commonReq)
		if err != nil {
			log.Println(err.Error())
			return commonResponse
		}
		return commonResponse
	}
	return webconsole.CommonResponseStatusInternalServerError(nil)
}

func AuthGetUserInfo(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse := &webconsole.CommonResponse{}
	var err error
	if util.MCIAM_USE {
		// commonResponse, err = xxx.XXXXXXXXX(c, commonReq)
		if err != nil {
			log.Println(err.Error())
			return commonResponse
		}
		return commonResponse
	} else {
		commonResponse.ResponseData = "NO AuthGetUserInfo"
		return webconsole.CommonResponseStatusInternalServerError(commonResponse)
	}
}

func AuthGetUserValidate(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse := &webconsole.CommonResponse{}
	var err error
	if util.MCIAM_USE {
		// commonResponse, err = xxx.XXXXXXXXX(c, commonReq)
		if err != nil {
			log.Println(err.Error())
			return commonResponse
		}
		return commonResponse
	} else {
		commonResponse.ResponseData = "NO AuthGetUserValidate"
		return webconsole.CommonResponseStatusInternalServerError(commonResponse)
	}
}

func AuthMiddleware(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse := &webconsole.CommonResponse{}
	var err error
	if util.MCIAM_USE {
		commonResponse, err = auth.AuthMcIamMiddleware(c)
		if err != nil {
			log.Println(err.Error())
			return commonResponse
		}
		return commonResponse
	} else {
		commonResponse.ResponseData = "NO AuthMiddleware"
		return webconsole.CommonResponseStatusInternalServerError(commonResponse)
	}
}

func JwtDecode(jwtToken string) jwt.MapClaims {
	claims := jwt.MapClaims{}
	jwt.ParseWithClaims(jwtToken, claims, func(token *jwt.Token) (interface{}, error) { return "", nil })
	return claims
}
