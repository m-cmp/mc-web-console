package actions

import (
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/self"

	"github.com/gobuffalo/buffalo"
)

func GetmenuTree(c buffalo.Context) error {
	commonResponse := handler.CommonResponseStatusOK(self.CmigMenuTree.Menus)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func GetMCIAMmenuTree(c buffalo.Context) error {
	menulist, err := self.GetAllMCIAMAvailableMenus(c)
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	menuTree, err := self.GetMenuTree(*menulist)
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(menuTree)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func CreateMCIAMMenuResources(c buffalo.Context) error {
	err := self.CreateMCIAMMenusByLocalMenuYaml(c)
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK("success")
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
