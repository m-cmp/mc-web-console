package workspace

import (
	"mc_web_console_api/fwmodels/webconsole"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/validate"
	"github.com/gobuffalo/validate/validators"
	"github.com/mitchellh/mapstructure"

	mcmodels "mc_web_console_common_models"
)

func WorkspaceMciamListByUser(c buffalo.Context, commonReq *webconsole.CommonRequest) (*webconsole.CommonResponse, error) {
	// fmt.Println(c.Request().Header.Get("Authorization"))
	workspaceMciamListByUserRequest := &mcmodels.WorkspaceMciamListByUserRequest{}
	if err := mapstructure.Decode(commonReq.RequestData, workspaceMciamListByUserRequest); err != nil {
		return webconsole.CommonResponseStatusBadRequest(nil), err
	}

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: workspaceMciamListByUserRequest.UserId, Name: "userId"},
	)
	if validateErr.HasAny() {
		return webconsole.CommonResponseStatusBadRequest(nil), validateErr
	}

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
	return webconsole.CommonResponseStatusBadRequest(nil), nil
}
