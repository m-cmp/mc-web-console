package actions

import (
	"log"
	"mc_web_console_api/fwmodels/tumblebug/mcis"
	"mc_web_console_api/handler"
	"mc_web_console_api/models"
	"mc_web_console_api/models/views"
	"mc_web_console_api/util"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gofrs/uuid"
)

// namespace의 특정 mcis안에 있는 nlb 목록 조회
func (a actions) NlbList(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Param("mcisId")
	optionParam := c.Params().Get("option")

	if optionParam == "id" {
		nlbList, respStatus := handler.GetNlbIdListByMcisID(namespaceID, mcisID)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"DefaultNameSpaceID": namespaceID,
			"NlbList":            nlbList,
		}))
	} else {
		nlbList, respStatus := handler.GetNlbListByOption(namespaceID, mcisID, optionParam)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"DefaultNameSpaceID": namespaceID,
			"NlbList":            nlbList,
		}))
	}
}

func (a actions) NlbDel(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Param("mcisId")
	nlbID := c.Param("nlbId")

	optionParam := c.Params().Get("option")
	log.Println("nlbId= " + nlbID)

	resultNlbInfo, respStatus := handler.DelNlb(namespaceID, mcisID, nlbID, optionParam)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	// DB 등록 : mapping에 D로 저장할 때 사용된 connection 정보가 필요하여 조회
	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.ResourceType = "nlb"
	connectionMapping.ResourceID = nlbID // CspNlbId 로 해야하나??
	connectionMapping.NamespaceID = namespaceID

	usedConnectionMapping, err := handler.GetUsedConnection(connectionMapping)
	if err != nil {
		// TODO : mapping table에 없을 때, 에러로 처리할 것인가?
		// return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
		// 	"error":  respStatus.Message,
		// 	"status": respStatus.StatusCode,
		// }))
	} else {
		// 삭제 Row 추가
		usedConnectionMapping.Status = "D"
		usedConnectionMapping.ID = uuid.UUID{}
		err = handler.SaveConnectionMapping(usedConnectionMapping, c)
		if err != nil {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":    "success",
		"status":     respStatus.StatusCode,
		"StatusInfo": resultNlbInfo,
	}))
}

func (a actions) AllNlbListOfNamespace(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	//namespaceName := c.Session().Get("current_namespace").(string)

	mcisIdList, respStatus := handler.GetMcisListByID(namespaceID, "", "")
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	totalNlbList := []mcis.TbNLBInfo{}
	for _, mcisID := range mcisIdList {
		nlbList, respStatus := handler.GetNlbListByOption(namespaceID, mcisID, "")
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			continue
		}
		// mcisID set
		for _, nlb := range nlbList {
			nlb.McisID = mcisID
			log.Println("nlb.McisID : ", nlb.McisID)
			totalNlbList = append(totalNlbList, nlb)
		}
		//totalNlbList = append(totalNlbList, nlbList...) // mcisID가 set 안됨.

	}
	return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
		"message":            "success",
		"status":             respStatus.StatusCode,
		"DefaultNameSpaceID": namespaceID,
		"NlbList":            totalNlbList,
	}))

}

func (a actions) NlbReg(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	nlbReq := &mcis.TbNLBReq{}
	if err := c.Bind(nlbReq); err != nil {
		log.Println(err)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "5001",
		}))
	}
	paramViewConnection := views.ViewCloudConnection{}

	paramViewConnection.ProviderID = nlbReq.ProviderID
	paramViewConnection.RegionName = nlbReq.RegionName

	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)

	log.Println("*************nlbReq : ", nlbReq, "|*************namespaceID : ", namespaceID, "|**********viewconnection :", viewConnection, "|*************error : ", err)

	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "there is no available connection",
			"status": "500",
		}))
	}
	nlbReq.ConnectionName = viewConnection.ConnectionName
	mcisID := c.Param("mcisId")

	// // socket의 key 생성 : ns + 구분 + id
	taskKey := namespaceID + "||" + "nlb" + "||" + nlbReq.Name // TODO : 공통 function으로 뺄 것.

	handler.StoreWebsocketMessage(util.TASK_TYPE_MCIS, taskKey, util.MCIS_LIFECYCLE_CREATE, util.TASK_STATUS_REQUEST, c) // session에 작업내용 저장

	// // go routin, channel
	go handler.RegNlbByAsync(namespaceID, mcisID, nlbReq, c) // 오래걸리므로 요청여부만 return, 결과는 notice로 확인
	// 원래는 호출 결과를 return하나 go routine으로 바꾸면서 요청성공으로 return
	log.Println("before return")

	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.Status = "T"
	connectionMapping.ResourceType = "nlb"
	connectionMapping.ResourceID = nlbReq.CspNlbId
	connectionMapping.ResourceName = nlbReq.Name
	connectionMapping.CloudConnectionID = viewConnection.ID
	connectionMapping.CredentialID = viewConnection.CredentialID
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	err = handler.SaveConnectionMapping(connectionMapping, c)
	if err != nil {
		// 실패시 생성한 vpc Resource 제거
		_, respStatus := handler.DelNlb(namespaceID, mcisID, nlbReq.CspNlbId, nlbReq.Name)
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
		"status":  200,
	}))

}

func (a actions) NlbGet(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Param("mcisId")
	nlbID := c.Param("nlbId")
	log.Println("nlbId= " + nlbID)

	resultNlbInfo, respStatus := handler.GetNlbData(namespaceID, mcisID, nlbID)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus.StatusCode,
		"NlbInfo": resultNlbInfo,
	}))

}
