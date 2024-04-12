package actions

import (
	"log"
	tbmcir "mc_web_console_api/fwmodels/tumblebug/mcir"
	"mc_web_console_api/handler"
	"mc_web_console_api/models"
	"mc_web_console_api/models/views"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gofrs/uuid"
)

// SshkeyList default implementation.
func (a actions) SshKeyList(c buffalo.Context) error {
	log.Println("GetSshKeyList : ")
	namespaceID := c.Session().Get("current_namespace_id").(string)
	// TODO : defaultNameSpaceID 가 없으면 설정화면으로 보낼 것
	log.Println("session get namespace id : ", namespaceID)
	optionParam := c.Params().Get("option")
	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")

	if optionParam == "id" {
		log.Println("option param : id")
		sshKeyInfoList, respStatus := handler.GetSshKeyInfoListByID(namespaceID, filterKeyParam, filterValParam)
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
			"SshKeyList":         sshKeyInfoList,
		}))
	} else {
		sshKeyInfoList, respStatus := handler.GetSshKeyInfoListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
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
			"SshKeyList":         sshKeyInfoList,
		}))
	}
}

func (a actions) SshKeyListByRegion(c buffalo.Context) error {
	log.Println("SshKeyListByRegion : ")
	namespaceID := c.Session().Get("current_namespace_id").(string)

	optionParam := c.Params().Get("option")
	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")
	is_cb := c.Params().Get("is_cb")

	paramProviderID := c.Params().Get("providerId")
	paramRegionName := c.Params().Get("regionName")
	paramZoneName := c.Params().Get("zoneName")
	paramConnectionName := c.Params().Get("connectionName")

	paramConnectionMap := map[string]string{} // 특정 connection 을 가져오기 위해 사용.
	if !strings.EqualFold(paramConnectionName, "") {
		paramConnectionMap["connectionName"] = paramConnectionName
	}

	log.Println("is_cb", is_cb)
	///
	if is_cb == "N" {
		log.Println("is_cb ", is_cb)
		sshkeyList, err := handler.ListResourceByType(namespaceID, paramConnectionMap, paramProviderID, paramRegionName, paramZoneName, "sshkey")
		if err != nil {
			log.Println("SshKeyListByRegion err", err)

			return c.Render(500, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}

		// 상세정보가 필요한 경우는 사용된 connection 정보로 cb-tb 조회하여 연결
		usedConnectionMap := map[string]string{}
		for _, item := range sshkeyList {
			usedConnectionMap[item.ConnectionName] = item.ConnectionName
		}
		log.Println("usedConnectionMap ", usedConnectionMap)
		returnSshKeyList := []tbmcir.TbSshKeyInfo{}
		for _, val := range usedConnectionMap {
			paramFilterKey := "connectionName"
			paramFilterVal := val
			sshKeyInfoList, respStatus := handler.GetSshKeyInfoListByOption(namespaceID, optionParam, paramFilterKey, paramFilterVal)
			if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
				return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
					"error":  respStatus.Message,
					"status": respStatus.StatusCode,
				}))
			}

			for _, item := range sshKeyInfoList {
				item.ProviderID = paramProviderID
				item.RegionName = paramRegionName
				returnSshKeyList = append(returnSshKeyList, item)
			}
			//returnSshKeyList = append(returnSshKeyList, sshKeyInfoList...)
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":    "success",
			"status":     "200",
			"SshKeyList": returnSshKeyList,
		}))

	} else {
		returnSshKeyList := []tbmcir.TbSshKeyInfo{}

		if !strings.EqualFold(paramConnectionName, "") && strings.EqualFold(filterKeyParam, "") {
			filterKeyParam = "connectionName"
			filterValParam = paramConnectionName
		}
		sshKeyInfoList, respStatus := handler.GetSshKeyInfoListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		for _, item := range sshKeyInfoList {
			item.ProviderID = paramProviderID
			item.RegionName = paramRegionName
			returnSshKeyList = append(returnSshKeyList, item)
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"DefaultNameSpaceID": namespaceID,
			"SshKeyList":         returnSshKeyList,
		}))
	}
}
func (a actions) SshKeyGet(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	paramSshKeyId := c.Param("sshKeyId")

	resultSshKeyInfo, respStatus := handler.GetSshKeyData(namespaceID, paramSshKeyId)

	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ConnectionName = resultSshKeyInfo.ConnectionName
	viewConnection, err := handler.GetViewConnection(paramViewConnection)
	if err != nil {
		// cb에서 정보는 가져왔으니 오류로 뱉지는 않기.
	} else {
		resultSshKeyInfo.ProviderID = viewConnection.ProviderID
		resultSshKeyInfo.ProviderName = viewConnection.ProviderID
		resultSshKeyInfo.RegionName = viewConnection.RegionName
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":    "success",
		"status":     respStatus.StatusCode,
		"SshKeyInfo": resultSshKeyInfo,
	}))
}

func (a actions) SshKeyReg(c buffalo.Context) error {
	// 현재 namespace 정보 가져오기
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	sshKeyReq := &tbmcir.TbSshKeyReq{}
	if err := c.Bind(sshKeyReq); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	// connection 조회 : namespace와 무관 . 얘도 bind 써도 되나?
	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ProviderID = sshKeyReq.ProviderID
	paramViewConnection.RegionName = sshKeyReq.RegionName
	paramViewConnection.ZoneName = sshKeyReq.ZoneName
	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
	log.Println("*************sshkeyreq : ", sshKeyReq, "|*************namespaceID : ", namespaceID, "|**********viewconnection :", viewConnection, "|*************error : ", err)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "there is no available connection",
			"status": "500",
		}))
	}
	// 사용할 connection set
	sshKeyReq.ConnectionName = viewConnection.ConnectionName

	resultSshKeyInfo, respStatus := handler.RegSshKey(namespaceID, sshKeyReq)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}
	// db setting sshkey status: C
	//namespace ID add
	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.Status = "C"
	connectionMapping.ResourceType = "sshkey"
	connectionMapping.ResourceID = resultSshKeyInfo.ID
	connectionMapping.ResourceName = resultSshKeyInfo.Name
	connectionMapping.CloudConnectionID = viewConnection.ID
	connectionMapping.CredentialID = viewConnection.CredentialID
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	err = handler.SaveConnectionMapping(connectionMapping, c)
	if err != nil {
		// 실패시 생성한 vpc Resource 제거
		_, respStatus := handler.DelSshKey(namespaceID, resultSshKeyInfo.ID)
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
		"message":    "success",
		"status":     respStatus.StatusCode,
		"SshKeyInfo": resultSshKeyInfo,
	}))
}

func (a actions) SshKeyDel(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	paramSshKeyId := c.Param("sshKeyId")

	respMessage, respStatus := handler.DelSshKey(namespaceID, paramSshKeyId)

	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	connectionMapping.ResourceType = "sshkey"
	connectionMapping.ResourceID = paramSshKeyId

	usedConnectionMapping, err := handler.GetUsedConnection(connectionMapping)
	if err != nil {
		// TODO : mapping table에 없을 때, 에러로 처리할 것인가?
		// return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
		// 	"error":  respStatus.Message,
		// 	"status": respStatus.StatusCode,
		// }))
	} else {
		// 삭제 Row 추가
		usedConnectionMapping.ID = uuid.UUID{}
		usedConnectionMapping.Status = "D"
		err = handler.SaveConnectionMapping(usedConnectionMapping, c)
		if err != nil {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": respMessage.Message,
		"status":  respMessage.StatusCode,
	}))
}
