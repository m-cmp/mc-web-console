package actions

import (
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/self"

	"github.com/gobuffalo/buffalo"
)

func GetmenuTree(c buffalo.Context) error {
	menulist, err := self.GetAllAvailableMenus(c)
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

func CreateMenuResources(c buffalo.Context) error {
	err := self.CreateMenusByLocalMenuYaml(c)
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK("success")
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
