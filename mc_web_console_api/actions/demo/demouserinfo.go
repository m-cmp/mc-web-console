package demo

// import (
// 	"mc_web_console_api/fwmodels/webconsole"
// 	"mc_web_console_api/util"
// 	"net/http"
// 	"strings"

// 	"github.com/gobuffalo/buffalo"
// 	"github.com/golang-jwt/jwt/v4"
// )

// func mcIamJwtDecode(jwtToken string) jwt.MapClaims {
// 	claims := jwt.MapClaims{}
// 	jwt.NewParser().ParseWithClaims(jwtToken, claims, func(token *jwt.Token) (interface{}, error) { return "", nil })
// 	return claims
// }

// func DemoGetuserinfo(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
// 	commonResponse := &webconsole.CommonResponse{}
// 	headerAccessToken := c.Request().Header.Get("Authorization")
// 	accessToken := strings.TrimPrefix(headerAccessToken, "Bearer ")
// 	jwtDecoded := mcIamJwtDecode(accessToken)

// 	commonResponse.ResponseData = jwtDecoded

// 	return commonResponse
// }

// func DemoGetuserCred(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
// 	commonResponse, _ := webconsole.CommonCaller(http.MethodGet, util.MCIAMMANAGER, "/api/auth/securitykey", commonRequest, c.Request().Header.Get("Authorization"))
// 	return commonResponse
// }
