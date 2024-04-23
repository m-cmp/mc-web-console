package workspace

import (
	"fmt"
	"mc_web_console_api/fwmodels/webconsole"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/validate"
	"github.com/gobuffalo/validate/validators"
	"github.com/mitchellh/mapstructure"

	mcmodels "mc_web_console_common_models"
)

func WorkspaceMciamListByUser(c buffalo.Context, commonReq *webconsole.CommonRequest) (*webconsole.CommonResponse, error) {
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

	fmt.Println("######################### ", workspaceMciamListByUserRequest)

	return webconsole.CommonResponseStatusOK(workspaceMciamListByUserRequest), nil
}

func ProjectListMciamByWorkspaceId(c buffalo.Context, commonReq *webconsole.CommonRequest) (*webconsole.CommonResponse, error) {
	return webconsole.CommonResponseStatusBadRequest(nil), nil
}
