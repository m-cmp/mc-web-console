package actions

import (
	"encoding/json"
	"fmt"
	"mc_web_console_api/iammodels"
	"mc_web_console_api/util"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

// var SPIDER = os.Getenv("SPIDER_URL")
// var TUMBLEBUG = os.Getenv("TUMBLE_URL")
// var DRAGONFLY = os.Getenv("DRAGONFLY_URL")
// var LADYBUG = os.Getenv("LADYBUG_URL")
// var MCKS = os.Getenv("MCKS_URL")

// CommonHttp(url string, json []byte, httpMethod string) (*http.Response, error) {

func DebugFwCaller(c buffalo.Context) error {
	targetfw := c.Param("targetfw")

	targetPath := strings.Replace(c.Request().URL.Path, "/debug/fwcall/"+targetfw, "", -1)
	targetPath = targetPath[:len(targetPath)-1] // buffalo proxy 설정으로 마지막 "/" 를 제거.

	user := &iammodels.UserLogin{}
	user.Id = c.Request().FormValue("id")
	user.Password = c.Request().FormValue("password")

	test1 := c.Request().PostForm.Encode()
	fmt.Println("test1test1test1", test1)
	test2 := c.Request().PostFormValue("id")
	fmt.Println("test1test1test1", test2)

	switch targetfw {
	case "spider":
		resp, err := util.CommonHttpWithoutParam(util.SPIDER+targetPath, c.Request().Method)
		if err != nil {
			return c.Render(http.StatusInternalServerError, r.JSON(err.Error()))
		}
		return c.Render(http.StatusOK, r.JSON(resp))

	case "tumblebug":
		fmt.Println(util.TUMBLEBUG + targetPath)
		tbPath := util.TUMBLEBUG + targetPath
		resp, err := util.CommonHttp(tbPath, nil, c.Request().Method)
		if err != nil {
			return c.Render(http.StatusInternalServerError, r.JSON(err.Error()))
		}

		var data interface{}
		decoderErr := json.NewDecoder(resp.Body).Decode(&data)
		if decoderErr != nil {
			return c.Render(http.StatusInternalServerError, r.JSON(decoderErr.Error()))
		}

		return c.Render(http.StatusOK, r.JSON(data))

	case "direct":
		return c.Render(http.StatusOK, r.JSON("direct"))

	default:
		return c.Render(http.StatusServiceUnavailable, r.JSON(map[string]interface{}{
			"status": http.StatusServiceUnavailable,
			"err":    "target framework err",
		}))
	}
}
