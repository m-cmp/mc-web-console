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

// SubsystemAnyController 는 중복되는 operationId 를 가지는 서브시스템을 호출하기 위해 사용 가능한 handler 입니다.
// subsystemName 과 operationId 를 path parameter 로 전달받아 사용합니다.
// 소문자로 변환한 각각의 값을 conf/api.yaml 에 정의된 subsystem 과 operationId 와 매칭하여 매칭된 api 를 호출합니다.
// AnyController 와 동일한 방식으로 작동합니다.
func SubsystemAnyController(c buffalo.Context) error {
	log.Println("#### SubsystemAnyController")
	subsystemName := strings.ToLower(c.Param("subsystemName"))
	operationId := strings.ToLower(c.Param("operationId"))

	if subsystemName == "" {
		commonResponse := handler.CommonResponseStatusNotFound("no subsystemName is provided")
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	if operationId == "" {
		commonResponse := handler.CommonResponseStatusNotFound("no operationId is provided")
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	log.Printf("==subsystemName\t:[ %s ]\n== operationId\t:[ %s ]\n== commonRequest\t:\n%+v\n==\n", subsystemName, operationId, commonRequest)
	commonResponse, _ := handler.SubsystemAnyCaller(c, subsystemName, operationId, commonRequest, true)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func GetApiHosts(c buffalo.Context) error {
	apiHosts, err := handler.GetApiHosts()
	if err != nil {
		return c.Render(200, r.JSON(map[string]interface{}{"error": err.Error()}))
	}
	commonResponse := handler.CommonResponseStatusOK(apiHosts)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
