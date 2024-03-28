package actions

import (
	"log"
	"mc_web_console_api/echomodel/spider"
	"mc_web_console_api/handler"
	"mc_web_console_api/models"
	"mc_web_console_api/models/views"
	"mc_web_console_api/util"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

func (a actions) PmksRegProc(c buffalo.Context) error {

	clusterReqInfo := &spider.ClusterReqInfo{}
	if err := c.Bind(clusterReqInfo); err != nil {
		log.Println(err)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}
	log.Println(clusterReqInfo)

	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)
	clusterReqInfo.NameSpace = namespaceID

	paramViewConnection := views.ViewCloudConnection{}

	reqRegion := clusterReqInfo.ReqInfo.RegionName
	reqProviderID := clusterReqInfo.ReqInfo.ProviderID

	paramViewConnection.ProviderID = reqProviderID
	paramViewConnection.RegionName = reqRegion

	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "there is no available connection",
			"status": "500",
		}))
	}
	clusterReqInfo.ConnectionName = viewConnection.ConnectionName

	taskKey := namespaceID + "||" + "pmks" + "||" + clusterReqInfo.ReqInfo.Name                                          // TODO : 공통 function으로 뺄 것.
	handler.StoreWebsocketMessage(util.TASK_TYPE_PMKS, taskKey, util.PMKS_LIFECYCLE_CREATE, util.TASK_STATUS_REQUEST, c) // session에 작업내용 저장
	go handler.RegPmksClusterByAsync(clusterReqInfo, c)
	// 원래는 호출 결과를 return하나 go routine으로 바꾸면서 요청성공으로 return
	log.Println("before return")
	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.Status = "T" //T : temporary 비동기는 T
	connectionMapping.ResourceType = "pmkscluster"
	//connectionMapping.ResourceID = resultVmSpecInfo.ID
	connectionMapping.ResourceName = clusterReqInfo.ReqInfo.Name
	connectionMapping.CloudConnectionID = viewConnection.ID
	connectionMapping.CredentialID = viewConnection.CredentialID
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	err = handler.SaveConnectionMapping(connectionMapping, c)
	if err != nil {
		// 실패시 생성한 omks 제거
		_, respStatus := handler.DelPmksCluster(clusterReqInfo.ReqInfo.Name, *clusterReqInfo)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  err.Error(),
			"status": "500",
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  http.StatusOK,
	}))
}

func (a actions) PmksNodeGroupRegProc(c buffalo.Context) error {
	log.Println("PmksNodeGroupRegProc : ")

	nodeGroupReqInfo := new(spider.NodeGroupReqInfo)
	if err := c.Bind(nodeGroupReqInfo); err != nil {
		log.Println(err)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}
	clusterID := c.Param("clusterID")

	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	nodeGroupReqInfo.NameSpace = namespaceID

	paramViewConnection := views.ViewCloudConnection{}

	reqRegion := nodeGroupReqInfo.ReqInfo.RegionName
	reqProviderID := nodeGroupReqInfo.ReqInfo.ProviderID

	paramViewConnection.ProviderID = reqProviderID
	paramViewConnection.RegionName = reqRegion

	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "there is no available connection",
			"status": "500",
		}))
	}

	nodeGroupReqInfo.ConnectionName = viewConnection.ConnectionName

	nodeInfo, respStatus := handler.RegPmksNodeGroup(clusterID, nodeGroupReqInfo)

	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.Status = "C" //T : temporary 비동기는 T
	connectionMapping.ResourceType = "pmksnodegroup"
	connectionMapping.ResourceID = nodeInfo.Name
	connectionMapping.ResourceName = nodeGroupReqInfo.ReqInfo.Name
	connectionMapping.CloudConnectionID = viewConnection.ID
	connectionMapping.CredentialID = viewConnection.CredentialID
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	err = handler.SaveConnectionMapping(connectionMapping, c)

	if err != nil {
		// 실패시 생성한 omks 제거
		_, respStatus := handler.DelPmksNodeGroup(clusterID, nodeGroupReqInfo.ReqInfo.Name, nodeGroupReqInfo)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  err.Error(),
			"status": "500",
		}))
	}

	log.Println("RegNodeGroup service returned")

	return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
		"error":    respStatus.Message,
		"status":   respStatus.StatusCode,
		"NodeInfo": nodeInfo,
	}))
}

func (a actions) PmksListOfNamespace(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	clusterReqInfo := spider.AllClusterReqInfo{}
	clusterReqInfo.NameSpace = namespaceID

	// ","를 구분자로 하는 connectionNames 잘라서 다시 string 배열에 넣고 써야 함.
	connectionNames := c.Params().Get("connectionNames")
	if connectionNames != "" {
		connNameArr := strings.Split(connectionNames, ",")
		for _, connName := range connNameArr {
			clusterReqInfo.ConnectionNames = append(clusterReqInfo.ConnectionNames, connName)
		}
	}

	// 임시 코드
	clusterReqInfo.ConnectionNames = append(clusterReqInfo.ConnectionNames, "ten-cortado-con")

	pmksList, respStatus := handler.GetPmksNamespaceClusterList(clusterReqInfo)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": respStatus.Message,
			"status":  "fail",
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":            "success",
		"status":             200,
		"DefaultNameSpaceID": namespaceID,
		"PmksList":           pmksList,
	}))
}

// PmksmngList default implementation.
func (a actions) PmksMngList(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	optionParam := c.Params().Get("option")

	if optionParam == "id" {
		pmksList, respStatus := handler.GetClusterListByID(namespaceID)
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
			"PmksList":           pmksList,
		}))
	} else {
		pmksList, respStatus := handler.GetClusterList(namespaceID)
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
			"PmksList":           pmksList,
		}))
	}
}

func (a actions) GetPmksInfoData(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	paramClusterID := c.Param("clusterId")
	log.Println("***********************************")
	log.Println("clusterID= " + paramClusterID)
	log.Println("***********************************")
	paramConnectionName := c.Param("connectionName")
	log.Println("***********************************")
	log.Println("connectionName= " + paramConnectionName)
	log.Println("***********************************")
	clusterReqInfo := spider.ClusterReqInfo{}
	clusterReqInfo.NameSpace = namespaceID
	clusterReqInfo.ConnectionName = paramConnectionName
	resultPmksInfo, _ := handler.GetPmksClusterData(paramClusterID, clusterReqInfo)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":  "success",
		"status":   200,
		"PmksInfo": resultPmksInfo,
	}))
}
