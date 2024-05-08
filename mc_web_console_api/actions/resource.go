package actions

import (
	"mc_web_console_api/handler"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func LoadCommonResource(c buffalo.Context) error {

	commonresourceinfo, webStatus := handler.GetLoadCommonResource()

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"webstatus":          webStatus,
		"commonresourceinfo": commonresourceinfo,
	}))
}

func GetInspectResourcesOverview(c buffalo.Context) error {

	cspResource, webStatus := handler.GetInspectResourcesOverview()

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"webstatus":   webStatus,
		"cspResource": cspResource,
	}))
}
