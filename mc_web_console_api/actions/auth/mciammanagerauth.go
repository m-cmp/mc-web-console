package auth

import (
	"log"
	"mc_web_console_api/fwmodels/webconsole"
	"mc_web_console_api/models"
	"mc_web_console_api/util"
	mcmodels "mc_web_console_common_models"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gofrs/uuid"
	"github.com/golang-jwt/jwt/v4"
	"github.com/mitchellh/mapstructure"
)

var (
	getAccesstokenEndPoint     = "/api/auth/login"
	accesstokenRefreshEndPoint = "/api/auth/login/refresh"
	getUserInfoEndPoint        = "/api/auth/userinfo"
	getUserValidateEndPoint    = "/api/auth/validate"
	suspendAccesstokenEndPoint = "/api/auth/logout"
)

func McIamJwtDecode(jwtToken string) jwt.MapClaims {
	claims := jwt.MapClaims{}
	jwt.NewParser().ParseWithClaims(jwtToken, claims, func(token *jwt.Token) (interface{}, error) { return "", nil })
	return claims
}

func AuthMcIamLogin(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse, err := webconsole.CommonCallerWithoutToken(http.MethodPost, util.MCIAMMANAGER, getAccesstokenEndPoint, commonRequest)
	if err != nil {
		log.Println(err)
		return commonResponse
	}

	accessTokenResponse := &mcmodels.AccessTokenResponse{}
	if err := mapstructure.Decode(commonResponse.ResponseData, accessTokenResponse); err != nil {
		return webconsole.CommonResponseStatusInternalServerError(err.Error())
	}

	jwtDecodd := McIamJwtDecode(accessTokenResponse.AccessToken)
	targetSubject, _ := uuid.FromString(jwtDecodd["sub"].(string))
	usersess := &models.Usersession{
		ID:               targetSubject,
		AccessToken:      accessTokenResponse.AccessToken,
		ExpiresIn:        accessTokenResponse.ExpiresIn,
		RefreshToken:     accessTokenResponse.RefreshToken,
		RefreshExpiresIn: accessTokenResponse.RefreshExpiresIn,
	}

	txerr := models.DB.Create(usersess)
	if txerr != nil {
		if strings.Contains(txerr.Error(), "SQLSTATE 23505") { // unique constraint violation catch
			txerr = models.DB.Update(usersess)
			if txerr != nil {
				return webconsole.CommonResponseStatusInternalServerError(txerr)
			}
		} else {
			return webconsole.CommonResponseStatusInternalServerError(txerr)
		}
	}

	return commonResponse
}

func AuthMcIamLogout(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	headerAccessToken := c.Request().Header.Get("Authorization")
	accessToken := strings.TrimPrefix(headerAccessToken, "Bearer ")
	jwtDecoded := McIamJwtDecode(accessToken)
	targetSubject, _ := uuid.FromString(jwtDecoded["sub"].(string))

	usersess := &models.Usersession{}
	txerr := models.DB.Find(usersess, targetSubject)
	if txerr != nil {
		return webconsole.CommonResponseStatusBadRequest(txerr.Error())
	}

	req := &webconsole.CommonRequest{
		Request: &mcmodels.AccessTokenRequest{
			RefreshToken: usersess.RefreshToken,
		},
	}
	commonResponse, err := webconsole.CommonCaller(http.MethodPost, util.MCIAMMANAGER, suspendAccesstokenEndPoint, req, c.Request().Header.Get("Authorization"))
	if err != nil {
		return webconsole.CommonResponseStatusInternalServerError(err.Error())
	}
	txerr = models.DB.Destroy(usersess)
	if txerr != nil {
		return webconsole.CommonResponseStatusInternalServerError(txerr.Error())
	}
	return commonResponse
}

func AuthMcIamGetUserInfo(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse, _ := webconsole.CommonCaller(http.MethodGet, util.MCIAMMANAGER, getUserInfoEndPoint, commonRequest, c.Request().Header.Get("Authorization"))
	return commonResponse
}

func AuthMcIamGetUserValidate(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse, _ := webconsole.CommonCaller(http.MethodGet, util.MCIAMMANAGER, getUserValidateEndPoint, commonRequest, c.Request().Header.Get("Authorization"))
	return commonResponse
}

// // NOT IMPL
// func AuthMcIamRefresh(c buffalo.Context, commonReq *webconsole.CommonRequest) (*webconsole.CommonResponse, error) {
// 	commonResponse := &webconsole.CommonResponse{}
// 	return commonResponse, nil
// }
