package workspace

import (
	"mc_web_console_api/actions/auth"
	"mc_web_console_api/fwmodels/webconsole"
	"mc_web_console_api/util"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

var (
	getWorkspaceByUserIdEndPoint = "/api/ws/user/{userid}"
)

func McIamGetWorkspaceByUserId(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	headerAccessToken := c.Request().Header.Get("Authorization")
	accessToken := strings.TrimPrefix(headerAccessToken, "Bearer ")
	jwtDecoded := auth.McIamJwtDecode(accessToken)
	userId, _ := jwtDecoded["preferred_username"].(string)

	pathParams := make(map[string]string)
	pathParams["userid"] = userId

	req := &webconsole.CommonRequest{
		PathParams: pathParams,
	}

	commonResponse, err := webconsole.CommonCaller(http.MethodGet, util.MCIAMMANAGER, getWorkspaceByUserIdEndPoint, req, c.Request().Header.Get("Authorization"))
	if err != nil {
		return webconsole.CommonResponseStatusInternalServerError(err.Error())
	}

	return commonResponse
}
