package actions

import (
	"log"
	"mc_web_console_api/handler"
	"strings"

	"github.com/gobuffalo/buffalo"
)

func AnyController(c buffalo.Context) error {
	log.Println("#### AnyController")
	operationId := strings.ToLower(c.Param("operationId"))
	if operationId == "" {
		commonResponse := handler.CommonResponseStatusNotFound("no operationId is provided")
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	log.Printf("== operationId\t:[ %s ]\n== commonRequest\t:\n%+v\n==\n", operationId, commonRequest)
	commonResponse, _ := handler.AnyCaller(c, operationId, commonRequest, true)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
