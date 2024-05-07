package workspace

import (
	"mc_web_console_api/fwmodels/webconsole"
	mcmodels "mc_web_console_common_models"

	"github.com/gobuffalo/buffalo"
	"github.com/mitchellh/mapstructure"
)

func WorkspaceDefaultListByUser(c buffalo.Context, commonReq *webconsole.CommonRequest) (*webconsole.CommonResponse, error) {
	// headerAccessToken := c.Request().Header.Get("Authorization")
	// accessToken := strings.TrimPrefix(headerAccessToken, "Bearer ")
	// jwtdecoded := auth.McIamJwtDecode(accessToken)
	// fmt.Println("Request User is", jwtdecoded["name"])
	workspaceDefaultListByUserRespose := &mcmodels.WorkspaceListByUserRespose{}
	workspaceDefaultListByUserRespose.Workspaces = append(workspaceDefaultListByUserRespose.Workspaces, mcmodels.Workspace{
		Id:          "defaultWorkspace",
		Name:        "defaultWorkspace",
		Description: "defaultWorkspace",
	})

	return webconsole.CommonResponseStatusOK(workspaceDefaultListByUserRespose), nil
}

func ProjectListDefaultByWorkspaceId(c buffalo.Context, commonReq *webconsole.CommonRequest) (*webconsole.CommonResponse, error) {
	// headerAccessToken := c.Request().Header.Get("Authorization")
	// accessToken := strings.TrimPrefix(headerAccessToken, "Bearer ")
	// jwtdecoded := auth.McIamJwtDecode(accessToken)
	// fmt.Println("Request User is", jwtdecoded["name"])

	projectListByWorkspaceRequest := &mcmodels.ProjectListByWorkspaceRequest{}
	if err := mapstructure.Decode(commonReq.Request, projectListByWorkspaceRequest); err != nil {
		return webconsole.CommonResponseStatusBadRequest(nil), err
	}

	workspaceProject := &mcmodels.WorkspaceProjectForMapipngResponse{
		Id:          "defaultWorkspace",
		Name:        "defaultWorkspace",
		Description: "defaultWorkspace",
	}
	workspaceProject.Projects = append(workspaceProject.Projects, mcmodels.Project{
		Id:          "defaultProject",
		Name:        "defaultProject",
		Description: "defaultProject",
	})

	return webconsole.CommonResponseStatusOK(workspaceProject), nil
}
