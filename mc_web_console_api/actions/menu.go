package actions

import (
	"log"
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/self"
	"os"
	"strconv"

	"github.com/gobuffalo/buffalo"
)

func init() {
	MCIAM_USE, _ := strconv.ParseBool(os.Getenv("MCIAM_USE"))
	if MCIAM_USE {
		err := CreateMenuResource()
		if err != nil {
			log.Fatal("create menu fail : ", err.Error())
		}
	}
}

func CreateMenuResource() error {
	return nil
}

func GetmenuTree(c buffalo.Context) error {
	return c.Render(404, r.JSON(nil))
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
