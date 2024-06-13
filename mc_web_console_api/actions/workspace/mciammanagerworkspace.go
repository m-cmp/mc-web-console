package workspace

import (
	"mc_web_console_api/actions/auth"
	"mc_web_console_api/fwmodels/webconsole"
	"mc_web_console_api/util"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

// swagger spec 상의 operationId, path 사용
var (
	alive                                       = "/alive"
	login                                       = "/api/auth/login"
	loginrefresh                                = "/api/auth/login/refresh"
	logout                                      = "/api/auth/logout"
	getuserinfo                                 = "/api/auth/userinfo"
	getusevalidate                              = "/api/auth/validate"
	getprojectlist                              = "/api/prj"
	createproject                               = "/api/prj"
	deleteproject                               = "/api/prj/project/{projectId}"
	getproject                                  = "/api/prj/project/{projectId}"
	updateproject                               = "/api/prj/project/{projectId}"
	getrolelist                                 = "/api/role"
	createrole                                  = "/api/role"
	deleterole                                  = "/api/role/{roleId}"
	getrole                                     = "/api/role/{roleId}"
	securitykey                                 = "/api/sts/securitykey"
	getworkspacelist                            = "/api/ws"
	createworkspace                             = "/api/ws"
	deleteworkspace                             = "/api/ws/workspace/{workspaceId}"
	getworkspace                                = "/api/ws/workspace/{workspaceId}"
	updateworkspace                             = "/api/ws/workspace/{workspaceId}"
	getworkspaceprojectmapping                  = "/api/wsprj"
	deleteworkspaceprojectmappingallbyworkspace = "/api/wsprj/workspace/{workspaceId}"
	getworkspaceprojectmappingbyworkspace       = "/api/wsprj/workspace/{workspaceId}"
	createworkspaceprojectmapping               = "/api/wsprj/workspace/{workspaceId}"
	updateworkspaceprojectmapping               = "/api/wsprj/workspace/{workspaceId}"
	deleteworkspaceprojectmapping               = "/api/wsprj/workspace/{workspaceId}/project/{projectId}"
	getworkspaceuserrolemapping                 = "/api/wsuserrole"
	getworkspaceuserrolemappingbyworkspaceuser  = "/api/wsuserrole/user/{userId}"
	deleteworkspaceuserrolemappingall           = "/api/wsuserrole/workspace/{workspaceId}"
	getworkspaceuserrolemappingbyworkspace      = "/api/wsuserrole/workspace/{workspaceId}"
	createworkspaceuserrolemapping              = "/api/wsuserrole/workspace/{workspaceId}"
	deleteworkspaceuserrolemapping              = "/api/wsuserrole/workspace/{workspaceId}/user/{userId}"
	getworkspaceuserrolemappingbyuser           = "/api/wsuserrole/workspace/{workspaceId}/user/{userId}"
	updateworkspaceprojectmapping1              = "/api/wsuserrole/workspace/{workspaceId}/user/{userId}"

	getWorkspaceByUserIdEndPoint = "/api/ws/user/{userid}"
)

// User에게 공유된 workspace목록 조회
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

// workspace 목록 조회
func McIamGetWorkspaceList(c buffalo.Context, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {
	//pathParams := make(map[string]string)

	req := &webconsole.CommonRequest{
		//	PathParams: pathParams,
	}

	commonResponse := getMcIamManagerCaller(c, req)

	return commonResponse
}

// mciam 전용 호출 set.
func getMcIamManagerCaller(c buffalo.Context, apiPath string, commonRequest *webconsole.CommonRequest) *webconsole.CommonResponse {

	commonResponse, err := webconsole.CommonCaller(http.MethodGet, util.MCIAMMANAGER, apiPath, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return webconsole.CommonResponseStatusInternalServerError(err.Error())
	}

	return commonResponse
}
