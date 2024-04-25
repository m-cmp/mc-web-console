package workspace

import (
	"fmt"
	"mc_web_console_api/actions/auth"
	"mc_web_console_api/fwmodels/webconsole"
	"strings"

	"github.com/gobuffalo/buffalo"

	mcmodels "mc_web_console_common_models"
)

func WorkspaceMciamListByUser(c buffalo.Context, commonReq *webconsole.CommonRequest) (*webconsole.CommonResponse, error) {
	headerAccessToken := c.Request().Header.Get("Authorization")
	accessToken := strings.TrimPrefix(headerAccessToken, "Bearer ")
	jwtdecoded := auth.McIamJwtDecode(accessToken)
	fmt.Println("Request User is", jwtdecoded["name"])

	// workspaceMciamListByUserRequest := &mcmodels.WorkspaceMciamListByUserRequest{}
	// if err := mapstructure.Decode(commonReq.RequestData, workspaceMciamListByUserRequest); err != nil {
	// 	return webconsole.CommonResponseStatusBadRequest(nil), err
	// }

	// validateErr := validate.Validate(
	// 	&validators.StringIsPresent{Field: workspaceMciamListByUserRequest.UserId, Name: "userId"},
	// )
	// if validateErr.HasAny() {
	// 	return webconsole.CommonResponseStatusBadRequest(nil), validateErr
	// }

	workspaceMciamListByUserRespose := &mcmodels.WorkspaceMciamListByUserRespose{}

	// 여기서 더미 데이터 삭제후 workspaceMciamListByUserRespose 에 워크스페이스 리스트 받아 넘길 것

	// TEST Dummy DATA START
	workspaceMciamListByUserRespose.Workspaces = append(workspaceMciamListByUserRespose.Workspaces, mcmodels.Workspace{
		Id:          "testId1",
		Name:        "testWorkspace1",
		Description: "testWorkspace1 Description",
	})

	workspaceMciamListByUserRespose.Workspaces = append(workspaceMciamListByUserRespose.Workspaces, mcmodels.Workspace{
		Id:          "testId2",
		Name:        "testWorkspace2",
		Description: "testWorkspace2 Description",
	})
	// TEST Dummy DATA END

	return webconsole.CommonResponseStatusOK(workspaceMciamListByUserRespose), nil
}

func ProjectListMciamByWorkspaceId(c buffalo.Context, commonReq *webconsole.CommonRequest) (*webconsole.CommonResponse, error) {
	// User가 해당 ws를 사용하는지? 검사
	// ws당 사용하는지 검사 후 해당 ws의 pr을 떨궈준다
	// validate
	// prj 3개 / 2개
	// 웤 + 플 전체 리스트 1 , 워크스페이스 지정 시 프로젝트 리스트 1
	// projects, err := WorkspaceMciamListByUser(c, commonReq)
	// if err != nil {
	// 	return webconsole.CommonResponseStatusInternalServerError(nil), err
	// }

	projectListByWorkspaceRequest := &mcmodels.ProjectListByWorkspaceRequest{}
	if err := mapstructure.Decode(commonReq.RequestData, projectListByWorkspaceRequest); err != nil {
		return webconsole.CommonResponseStatusBadRequest(nil), err
	}
	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: projectListByWorkspaceRequest.UserId, Name: "userId"},
		&validators.StringIsPresent{Field: projectListByWorkspaceRequest.WorkspaceId, Name: "workspaceId"},
	)
	if validateErr.HasAny() {
		return webconsole.CommonResponseStatusBadRequest(nil), validateErr
	}

	// TODO : 사용자가 자신의 Workspace를 사용하는지 여부 확인하는 로직
	workspaceProject := &mcmodels.WorkspaceProjectForMappingResponse{
		Id:          "testprojectId1",
		Name:        "testProject1",
		Description: "testProject1 Description",
	}
	// Test Dummy DATA

	switch projectListByWorkspaceRequest.WorkspaceId {
	case "testId1":
		workspaceProject.Projects = append(workspaceProject.Projects, mcmodels.Project{
			Id:          "testprojectId1",
			Name:        "testProject1",
			Description: "test Description of Project 1",
		})
		workspaceProject.Projects = append(workspaceProject.Projects, mcmodels.Project{
			Id:          "testprojectId2",
			Name:        "testProject2",
			Description: "test Description of Project 2",
		})
		workspaceProject.Projects = append(workspaceProject.Projects, mcmodels.Project{
			Id:          "testprojectId3",
			Name:        "testProject3",
			Description: "test Description of Project 3",
		})
	case "testId2":
		workspaceProject.Projects = append(workspaceProject.Projects, mcmodels.Project{
			Id:          "testprojectId2",
			Name:        "testProject2",
			Description: "test Description of Project 2",
		})
		workspaceProject.Projects = append(workspaceProject.Projects, mcmodels.Project{
			Id:          "testprojectId4",
			Name:        "testProject4",
			Description: "test Description of Project 4",
		})

	}
	return webconsole.CommonResponseStatusOK(workspaceProject), nil
}
