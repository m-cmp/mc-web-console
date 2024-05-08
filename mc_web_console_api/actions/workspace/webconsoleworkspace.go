package workspace

import (
	"mc_web_console_api/actions/auth"
	"mc_web_console_api/fwmodels/webconsole"
	"strings"

	"github.com/gobuffalo/buffalo"
)

func WebconsoleGetWorkspaceByUserId(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	headerAccessToken := c.Request().Header.Get("Authorization")
	accessToken := strings.TrimPrefix(headerAccessToken, "Bearer ")
	jwtDecoded := auth.McIamJwtDecode(accessToken)
	userId, _ := jwtDecoded["preferred_username"].(string)

	pathParams := make(map[string]string)
	pathParams["userid"] = userId

	defualtWorkspace := map[string]string{
		"workspaceId":   "00000000-0000-0000-0000-000000000000",
		"workspaceName": "DefaultWorkspace",
		"description":   "DefaultWorkspace",
		"projectList":   "",
	}
	commonResponse := webconsole.CommonResponseStatusOK(defualtWorkspace)

	return commonResponse
}
