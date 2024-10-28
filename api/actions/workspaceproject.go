package actions

import (
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/self"

	"github.com/gobuffalo/buffalo"
)

func GetWorkspaceUserRoleMappingByToken(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{
		PathParams: map[string]string{
			"userId": c.Value("UserId").(string),
		},
	}
	commonResponse, _ := handler.SubsystemAnyCaller(c, "mc-iam-manager", "Getworkspaceuserrolemappinglistbyuserid", commonRequest, true)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func GetWPmappingListByWorkspaceId(c buffalo.Context) error {
	res, err := self.GetWPmappingList(c)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(nil)
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	commonRes := handler.CommonResponseStatusOK(res)
	return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
}

func GetWorkspaceUserRoleMappingListByUserId(c buffalo.Context) error {
	res, err := self.GetWorkspaceUserRoleMappingList(c)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(nil)
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	commonRes := handler.CommonResponseStatusOK(res)
	return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
}

func CreateProject(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	err := c.Bind(commonRequest)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(nil)
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	project, err := self.PostNs(c, commonRequest)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(nil)
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	commonRes := handler.CommonResponseStatusOK(project)
	return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
}

func GetProjectById(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	err := c.Bind(commonRequest)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(nil)
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	project, err := self.GetNs(c, commonRequest)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(nil)
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	commonRes := handler.CommonResponseStatusOK(project)
	return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
}

func GetProjectList(c buffalo.Context) error {
	projects, err := self.GetAllNs(c)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(nil)
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	commonRes := handler.CommonResponseStatusOK(projects)
	return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
}

func UpdateProjectById(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	err := c.Bind(commonRequest)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(nil)
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	project, err := self.PutNs(c, commonRequest)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(nil)
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	commonRes := handler.CommonResponseStatusOK(project)
	return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
}

func DeleteProjectById(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	err := c.Bind(commonRequest)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(nil)
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	err = self.DelNs(c, commonRequest)
	if err != nil {
		commonRes := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
	}
	commonRes := handler.CommonResponseStatusOK(nil)
	return c.Render(commonRes.Status.StatusCode, r.JSON(commonRes))
}
