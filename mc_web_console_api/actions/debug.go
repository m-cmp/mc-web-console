package actions

import (
	"encoding/json"
	"fmt"
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

func DebugApiCaller(c buffalo.Context) error {
	targetfw := c.Param("targetfw")
	// JSON 본문을 []byte로 읽어옴
	body := c.Request().Body

	// []byte를 파싱하여 구조체로 변환
	var jsonData map[string]interface{}
	if err := json.NewDecoder(body).Decode(&jsonData); err != nil {
		return err
	}

	fmt.Println(targetfw)
	fmt.Println(jsonData)

	return c.Render(http.StatusOK, r.JSON(jsonData))
}

func DebugFwCaller(c buffalo.Context) error {
	targetfw := c.Param("targetfw")

	targetPath := strings.Replace(c.Request().URL.Path, "/debug/fwcall/"+targetfw, "", -1)
	targetPath = targetPath[:len(targetPath)-1] // buffalo proxy 설정으로 마지막 "/" 를 제거.

	formData := c.Request().Form

	fmt.Println(c.Request().Method)
	fmt.Println(c.Request().Form)

	// 가져온 폼 데이터를 순회하면서 모든 키-값 쌍을 출력합니다.
	for key, values := range formData {
		for _, value := range values {
			fmt.Printf("Key: %s, Value: %s", key, value)
		}
	}

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
		resp, err := util.CommonHttp(tbPath, []byte(formData.Encode()), c.Request().Method)
		if err != nil {
			return c.Render(200, r.JSON(err.Error()))
		}

		var data interface{}
		decoderErr := json.NewDecoder(resp.Body).Decode(&data)
		if decoderErr != nil {
			return c.Render(200, r.JSON(decoderErr.Error()))
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
