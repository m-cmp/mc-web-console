package actions

import (
	"encoding/json"
	"io"
	"mc_web_console_api/util"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

func DebugApiCaller(c buffalo.Context) error {
	targetfw := c.Param("targetfw")

	fwPath := ""
	switch targetfw {
	case "spider":
		fwPath = util.SPIDER
	case "tumblebug":
		fwPath = util.TUMBLEBUG
	default:
		// direct todo
		return c.Render(http.StatusServiceUnavailable, r.JSON(map[string]interface{}{
			"status": http.StatusServiceUnavailable,
			"err":    "target framework err",
		}))
	}

	targetPath := strings.Replace(c.Request().URL.Path, "/api/debug/"+targetfw, "", 1)
	targetPath = targetPath[:len(targetPath)-1]
	fwPath += targetPath

	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable, r.JSON(err.Error()))
	}

	resp, err := util.CommonHttp(fwPath, body, c.Request().Method)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable, r.JSON(err.Error()))
	}

	var data interface{}
	decoderErr := json.NewDecoder(resp.Body).Decode(&data)
	if decoderErr != nil {
		return c.Render(http.StatusServiceUnavailable, r.JSON(decoderErr.Error()))
	}

	return c.Render(http.StatusOK, r.JSON(data))
}
