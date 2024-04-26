package mc_web_console_common_models

type WorkspaceMciamListByUserRequest struct {
	UserId string `json:userId`
}

type WorkspaceMciamListByUserRespose struct {
	Workspaces []Workspace `json:workspaceList`
}
type ProjectListByWorkspaceRequest struct {
	UserId      string `json:userId`
	WorkspaceId string `json:workspaceId`
}

type Workspace struct {
	Id          string "json:id"
	Name        string "json:name"
	Description string "json:description"
}

type WorkspaceProjectForMappingResponse struct {
	Id          string    "json:id"
	Name        string    "json:name"
	Description string    "json:description"
	Projects    []Project "json:projectList"
}
type Project struct {
	Id          string "json:id"
	Name        string "json:nane"
	Description string "json:description"
}
