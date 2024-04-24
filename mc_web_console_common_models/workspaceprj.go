package mc_web_console_common_models

type WorkspaceMciamListByUserRequest struct {
	UserId string `json:userId`
}

type WorkspaceMciamListByUserRespose struct {
	Workspaces []Workspace `json:workspaceList`
}

type Workspace struct {
	Id          string "json:id"
	Name        string "json:name"
	Description string "json:description"
}
