package actions

import (
	"log"
	"mc_web_console_api/fwmodels/dragonfly"
	"mc_web_console_api/handler"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

// Monitoring Config 정책 조회
func (a actions) MonitoringConfigPolicyData(c buffalo.Context) error {

	//MonitoringConfig
	monitoringConfig, respStatus := handler.GetMonitoringConfig()
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":          "success",
		"status":           respStatus.StatusCode,
		"MonitoringConfig": monitoringConfig,
	}))
}

// Monitoring Config 정책 수정
func (a actions) MonitoringConfigPolicyUpdate(c buffalo.Context) error {

	monitoringConfigRegInfo := &dragonfly.MonitoringConfigReg{}
	if err := c.Bind(monitoringConfigRegInfo); err != nil {
		log.Println(err)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": err.Error(),
			"status":  "5001",
		}))
	}

	resultMonitoringConfigInfo, respStatus := handler.PutMonigoringConfig(monitoringConfigRegInfo)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":          "success",
		"status":           respStatus.StatusCode,
		"MonitoringConfig": resultMonitoringConfigInfo,
	}))
}

// Monitoring alert 임계치 등록 처리
func (a actions) MonitoringAlertPolicyReg(c buffalo.Context) error {
	log.Println("MonitoringAlertPolicyReg : ")

	monitoringAlertRegInfo := &dragonfly.VmMonitoringAlertInfo{}
	if err := c.Bind(monitoringAlertRegInfo); err != nil {
		log.Println(err)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "5001",
		}))
	}
	log.Println(monitoringAlertRegInfo)

	resultMonitoringAlertInfo, respStatus := handler.RegMonitoringAlert(monitoringAlertRegInfo)
	log.Println("MonitoringAlertPolicyReg service returned")
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":          "success",
		"status":           respStatus.StatusCode,
		"MonitoringConfig": resultMonitoringAlertInfo,
	}))
}

// Monitoring alert 임계치 설정 목록
func (a actions) MonitoringAlertPolicyList(c buffalo.Context) error {

	// alarm 설정 목록 조회
	monitoringAlertPolicyList, respStatus := handler.GetMonitoringAlertList()
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	// 등록된 eventHandler 목록조회. 현재는 smtp, slack만 등록 가능(생성화면에서 추가로 등록해야 목록으로 조회 됨)
	monitoringAlertEventHandlerList, _ := handler.GetMonitoringAlertEventHandlerList()

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":                         "success",
		"status":                          respStatus.StatusCode,
		"MonitoringAlertPolicyList":       monitoringAlertPolicyList,
		"MonitoringAlertEventHandlerList": monitoringAlertEventHandlerList,
	}))
}

func (a actions) MonitoringAlertPolicyData(c buffalo.Context) error {

	monitoringAlertId := c.Param("monitoringAlertId")

	// 알람 설정 값 조회
	monitoringAlertPolicyInfo, respStatus := handler.GetMonitoringAlertData(monitoringAlertId)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	// 알람 발생 이력 조회
	paramLevel := "critical"
	monitoringAlertLogList, respStatus := handler.GetMonitoringAlertLogList(monitoringAlertId, paramLevel)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":                   "success",
		"status":                    respStatus.StatusCode,
		"MonitoringAlertPolicyInfo": monitoringAlertPolicyInfo,
		"MonitoringAlertLogList":    monitoringAlertLogList,
	}))
}

func (a actions) MonitoringAlertPolicyDel(c buffalo.Context) error {
	log.Println("MonitoringAlertPolicyDelProc : ")

	paramMonitoringAlertID := c.Param("monitoringAlertId")

	// 글로벌한 설정이라 namespace 없이 호출
	respBody, respStatus := handler.DelMonitoringAlert(paramMonitoringAlertID)
	log.Println("=============respBody =============", respBody)

	// if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
	// 	return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
	// 		"error":  respStatus.Message,
	// 		"status": respStatus.StatusCode,
	// 	}))
	// }

	return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
		"error":  respStatus.Message,
		"status": respStatus.StatusCode,
	}))
}

// alarm 발생이력 조회
// 설정한 alarm, 조회할 level(ok, warning, critical)
func (a actions) MonitoringAlertLogList(c buffalo.Context) error {
	//namespaceID := c.Session().Get("current_namespace_id").(string)

	monitoringAlertId := c.Param("monitoringAlertId")
	paramLevel := c.Param("level")

	monitoringAlertLogList, respStatus := handler.GetMonitoringAlertLogList(monitoringAlertId, paramLevel)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":                "success",
		"status":                 respStatus.StatusCode,
		"MonitoringAlertLogList": monitoringAlertLogList,
	}))
}

// Monitoring alert 를 전송할 매체 목록(smtp, slack)
func (a actions) MonitoringAlertEventHandlerList(c buffalo.Context) error {
	log.Println("GetMonitoringAlertEventHandlerList ************ : ")

	// Monitoring Alert Event Handler 호출
	monitoringAlertEventHandlerList, respStatus := handler.GetMonitoringAlertEventHandlerList()
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
		"message":                         "success",
		"status":                          respStatus.StatusCode,
		"MonitoringAlertEventHandlerList": monitoringAlertEventHandlerList,
	}))
}

// Monitoring Alert Event-Handler 등록 처리
func (a actions) MonitoringAlertEventHandlerReg(c buffalo.Context) error {
	log.Println("MonitoringAlertEventHandlerRegProc : ")

	monitoringAlertEventHandlerRegInfo := &dragonfly.VmMonitoringAlertEventHandlerInfoReg{}
	if err := c.Bind(monitoringAlertEventHandlerRegInfo); err != nil {
		log.Println(err)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "5001",
		}))
	}
	log.Println(monitoringAlertEventHandlerRegInfo)
	resultMonitoringAlertEventHandlerInfo, respStatus := handler.RegMonitoringAlertEventHandler(monitoringAlertEventHandlerRegInfo)
	log.Println("MonitoringAlertEventHandlerReg service returned")
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}
	return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
		"message":                "success",
		"status":                 respStatus.StatusCode,
		"MonitoringEventHandler": resultMonitoringAlertEventHandlerInfo,
	}))
}

func (a actions) MonitoringAlertEventHandlerDel(c buffalo.Context) error {
	log.Println("MonitoringAlertEventHandlerDelProc : ")

	paramMonitoringAlertEvantHandlerType := c.Param("handlerType")
	paramMonitoringAlertEvantHandlerName := c.Param("eventName")

	// 글로벌한 설정이라 namespace 없이 호출
	respBody, respStatus := handler.DelMonitoringAlertEventHandler(paramMonitoringAlertEvantHandlerType, paramMonitoringAlertEvantHandlerName)
	log.Println("=============respBody =============", respBody)

	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus.StatusCode,
	}))
}
