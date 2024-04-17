package actions

import (
	"mc_web_console_api/handler"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func TbConfig(c buffalo.Context) error {

	configInfo, webStatus := handler.GetAllTbConfig()

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"webstatus":  webStatus,
		"configInfo": configInfo,
	}))
}

func TbConfigbyId(c buffalo.Context) error {
	configId := c.Session().Get("id").(string)
	configInfo, webStatus := handler.GetTbConfig(configId)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"webstatus":  webStatus,
		"configInfo": configInfo,
	}))
}
