package mc_web_console_common_models

type WorkspaceMciamListByUserRequest struct {
	UserId string `json:userId`
}

type WorkspaceMciamListByUserRespose struct {
	WorkspaceList []interface{} `json:workspaceList`
}
