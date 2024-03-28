package actions

import (
	"log"
	"mc_web_console_api/echomodel/ladybug"
	"mc_web_console_api/handler"
	"mc_web_console_api/models/views"
	"mc_web_console_api/util"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

// McksmngForm default implementation.
func (a actions) McksMngForm(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("operations/mcksmng/mngform.html"))
}

func (a actions) McksRegForm(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("operations/mcksmng/regform.html"))
}

func (a actions) McksNodeRegForm(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	mcksID := c.Param("mcksId")
	mcksName := c.Param("mcksName")
	mcksInfo, _ := handler.GetClusterData(namespaceID, mcksName)

	c.Set("mcks_id", mcksID)
	c.Set("mcks_name", mcksName)
	c.Set("node_list", mcksInfo.Nodes)
	return c.Render(http.StatusOK, r.HTML("operations/mcksmng/node_regform.html"))
}

// McksmngGet default implementation.
// todo : mcks 가져오는 로직으로 변경할것것
func (a actions) McksGet(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "not implement",
	}))
}

// McksmngList default implementation.
func (a actions) McksList(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	optionParam := c.Params().Get("option")

	if optionParam == "id" {
		mcksList, respStatus := handler.GetClusterListByID(namespaceID)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"DefaultNameSpaceID": namespaceID,
			"McksList":           mcksList,
		}))
	} else {
		mcksList, respStatus := handler.GetClusterList(namespaceID)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"DefaultNameSpaceID": namespaceID,
			"McksList":           mcksList,
		}))
	}
}

func (a actions) McksReg(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	clusterReq := &ladybug.ClusterRegReq{}
	if err := c.Bind(clusterReq); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	// ControlPlane 이 사용할 connection 조회
	controlPlaneList := clusterReq.ControlPlane
	connectionMap := map[string]string{}
	for idx, controlPlane := range controlPlaneList {
		useConnectionName := ""
		val, exists := connectionMap[controlPlane.ProviderID+"|"+controlPlane.RegionName]
		if exists {
			useConnectionName = val
		} else {
			// connection 조회 : vm마다 다를 수 있음
			paramViewConnection := views.ViewCloudConnection{}
			paramViewConnection.ProviderID = controlPlane.ProviderID
			paramViewConnection.RegionName = controlPlane.RegionName
			paramViewConnection.ZoneName = controlPlane.ZoneName
			viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
			if err != nil {
				return c.Render(500, r.JSON(map[string]interface{}{
					"error":  "there is no available connection",
					"status": "500",
				}))
			}
			useConnectionName = viewConnection.ConnectionName
			connectionMap[controlPlane.ProviderID+"|"+controlPlane.RegionName] = useConnectionName
		}

		if strings.Compare(useConnectionName, "") == 0 {
			return c.Render(500, r.JSON(map[string]interface{}{
				"error":  "there is no available connection info",
				"status": "500",
			}))
		}

		log.Println("useConnectionName", useConnectionName)
		// 사용할 connection set
		//regVm.ConnectionName = useConnectionName
		controlPlaneList[idx].Connection = useConnectionName
	}

	// Worker들이 사용할 connection 조회
	workerList := clusterReq.Worker
	workerConnectionMap := map[string]string{}
	for idx, worker := range workerList {
		useConnectionName := ""
		val, exists := workerConnectionMap[worker.ProviderID+"|"+worker.RegionName]
		if exists {
			useConnectionName = val
		} else {
			// connection 조회 : vm마다 다를 수 있음
			paramViewConnection := views.ViewCloudConnection{}
			paramViewConnection.ProviderID = worker.ProviderID
			paramViewConnection.RegionName = worker.RegionName
			paramViewConnection.ZoneName = worker.ZoneName
			viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
			if err != nil {
				return c.Render(500, r.JSON(map[string]interface{}{
					"error":  "there is no available connection",
					"status": "500",
				}))
			}
			useConnectionName = viewConnection.ConnectionName
			workerConnectionMap[worker.ProviderID+"|"+worker.RegionName] = useConnectionName
		}

		if strings.Compare(useConnectionName, "") == 0 {
			return c.Render(500, r.JSON(map[string]interface{}{
				"error":  "there is no available connection info",
				"status": "500",
			}))
		}

		log.Println("useConnectionName", useConnectionName)
		// 사용할 connection set
		//regVm.ConnectionName = useConnectionName
		workerList[idx].Connection = useConnectionName
	}

	// Async로 변경
	// taskKey := namespaceID + "||" + "mcks" + "||" + clusterReq.Name                                                      // TODO : 공통 function으로 뺄 것.
	// handler.StoreWebsocketMessage(util.TASK_TYPE_MCKS, taskKey, util.MCKS_LIFECYCLE_CREATE, util.TASK_STATUS_REQUEST, c) // session에 작업내용 저장
	go handler.RegClusterByAsync(namespaceID, clusterReq, c)
	// 원래는 호출 결과를 return하나 go routine으로 바꾸면서 요청성공으로 return
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) McksDel(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	//clusterUID := c.Param("clusterUID")
	mcksName := c.Param("mcksName")
	log.Println("mcksName= " + mcksName)

	taskKey := namespaceID + "||" + "mcks" + "||" + mcksName
	handler.StoreWebsocketMessage(util.TASK_TYPE_MCKS, taskKey, util.MCKS_LIFECYCLE_DELETE, util.TASK_STATUS_REQUEST, c) // session에 작업내용 저장

	go handler.DelClusterByAsync(namespaceID, mcksName, c)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// Node 등록 처리
func (a actions) McksNodeReg(c buffalo.Context) error {

	namespaceID := c.Session().Get("current_namespace_id").(string)

	clusterName := c.Param("mcksName")

	nodeRegReq := &ladybug.NodeRegReq{}
	if err := c.Bind(nodeRegReq); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}

	// Worker들이 사용할 connection 조회
	workerList := nodeRegReq.Worker
	workerConnectionMap := map[string]string{}
	for idx, worker := range workerList {
		useConnectionName := ""
		val, exists := workerConnectionMap[worker.ProviderID+"|"+worker.RegionName]
		if exists {
			useConnectionName = val
		} else {
			// connection 조회 : vm마다 다를 수 있음
			paramViewConnection := views.ViewCloudConnection{}
			paramViewConnection.ProviderID = worker.ProviderID
			paramViewConnection.RegionName = worker.RegionName
			paramViewConnection.ZoneName = worker.ZoneName
			viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
			if err != nil {
				return c.Render(500, r.JSON(map[string]interface{}{
					"error":  "there is no available connection",
					"status": "500",
				}))
			}
			useConnectionName = viewConnection.ConnectionName
			workerConnectionMap[worker.ProviderID+"|"+worker.RegionName] = useConnectionName
		}

		if strings.Compare(useConnectionName, "") == 0 {
			return c.Render(500, r.JSON(map[string]interface{}{
				"error":  "there is no available connection info",
				"status": "500",
			}))
		}

		log.Println("useConnectionName", useConnectionName)
		// 사용할 connection set
		//regVm.ConnectionName = useConnectionName
		workerList[idx].Connection = useConnectionName
	}

	nodeInfo, respStatus := handler.RegNode(namespaceID, clusterName, nodeRegReq)
	log.Println("RegNode service returned")
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":  "success",
		"status":   respStatus.StatusCode,
		"NodeInfo": nodeInfo,
	}))
}

// Node 삭제 처리
func (a actions) McksNodeDel(c buffalo.Context) error {

	namespaceID := c.Session().Get("current_namespace_id").(string)

	//clusterName := c.Param("clusterName")
	mcksName := c.Param("mcksName")
	nodeName := c.Param("nodeName")

	resultStatusInfo, respStatus := handler.DelNode(namespaceID, mcksName, nodeName)
	log.Println("DelMCKS service returned")
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":    "success",
		"status":     respStatus.StatusCode,
		"StatusInfo": resultStatusInfo,
	}))
}
