package actions

import (
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/self"

	"github.com/gobuffalo/buffalo"
)

func GetPlatformRoles(c buffalo.Context) error {
	platformRoles, err := self.GetPlatformRoleList()
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(platformRoles)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func GetIamPlatformRoles(c buffalo.Context) error {
	platformRoles, err := self.GetPlatformRoleList()
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(platformRoles)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func GetWorkspaceRoles(c buffalo.Context) error {
	workspaceRoles, err := self.GetWorkspaceRoleList()
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(workspaceRoles)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func GetIamWorkspaceRoles(c buffalo.Context) error {
	workspaceRoles, err := self.GetWorkspaceRoleList()
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(workspaceRoles)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
