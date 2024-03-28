package actions

import (
	"log"
	"mc_web_console_api/handler"
	"mc_web_console_api/models"
	"mc_web_console_api/models/views"
	"net/http"

	tbmcir "mc_web_console_api/echomodel/tumblebug/mcir"
	tbmcis "mc_web_console_api/echomodel/tumblebug/mcis"

	"github.com/gobuffalo/buffalo"
	"github.com/gofrs/uuid"
)

func (a actions) MyImageMngForm(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("settings/myimage/mngform.html"))
}

// 이미지 생성은 Vm 으로만 할 것.
// TODO :
// 현재 VM 이미지 생성은 MCIS에서 VM 을 선택한뒤 스냅샷 기능으로만 만들고 있음
// 추후에 RegForm 필요할 것을 예상됨.
func (a actions) MyImageRegForm(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("settings/myimage/mngform.html"))
}

func (a actions) MyImageReg(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	myImageRegInfo := &tbmcir.TbCustomImageReq{}
	if err := c.Bind(myImageRegInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	// connection 조회 : namespace와 무관 . 얘도 bind 써도 되나?
	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ProviderID = myImageRegInfo.ProviderID
	paramViewConnection.RegionName = myImageRegInfo.RegionName
	paramViewConnection.ZoneName = myImageRegInfo.ZoneName
	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "there is no available connection",
			"status": "500",
		}))
	}
	// 사용할 connection set
	myImageRegInfo.ConnectionName = viewConnection.ConnectionName

	resultMyImageInfo, respStatus := handler.RegCspCustomImageToMyImage(namespaceID, myImageRegInfo)
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
	connectionMapping.ResourceType = "myimage"
	connectionMapping.ResourceID = resultMyImageInfo.ID
	connectionMapping.ResourceName = resultMyImageInfo.Name
	connectionMapping.CloudConnectionID = viewConnection.ID
	connectionMapping.CredentialID = viewConnection.CredentialID
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	err = handler.SaveConnectionMapping(connectionMapping, c)
	if err != nil {
		// 실패시 생성한 vpc Resource 제거
		_, respStatus := handler.DelMyImage(namespaceID, resultMyImageInfo.ID)
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
		"message":     "success",
		"status":      respStatus.StatusCode,
		"MyImageInfo": resultMyImageInfo,
	}))
}

func (a actions) MyImageList(c buffalo.Context) error {
	log.Println("MyImageList : ")
	namespaceID := c.Session().Get("current_namespace_id").(string)
	// TODO : defaultNameSpaceID 가 없으면 설정화면으로 보낼 것
	log.Println("session get namespace id : ", namespaceID)
	optionParam := c.Params().Get("option")
	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")

	if optionParam == "id" {
		log.Println("option param : id")
		myImageInfoList, respStatus := handler.GetMyImageListByID(namespaceID, filterKeyParam, filterValParam)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"defaultNameSpaceID": namespaceID,
			"myImageInfoList":    myImageInfoList,
		}))
	} else {
		myImageInfoList, respStatus := handler.GetMyImageListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
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
			"myImageInfoList":    myImageInfoList,
		}))
	}
}

func (a actions) MyImageGet(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	myImageID := c.Param("myImageId")

	myImageInfo, respStatus := handler.MyImageGet(namespaceID, myImageID)

	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ConnectionName = myImageInfo.ConnectionName
	viewConnection, err := handler.GetViewConnection(paramViewConnection)
	if err != nil {
		// cb에서 정보는 가져왔으니 오류로 뱉지는 않기.
	} else {
		myImageInfo.ProviderID = viewConnection.ProviderID
		myImageInfo.RegionName = viewConnection.RegionName
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":     "success",
		"status":      respStatus,
		"myImageInfo": myImageInfo,
	}))
}

func (a actions) MyImageDel(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	paramMyImageID := c.Param("myImageId")

	respMessage, respStatus := handler.DelMyImage(namespaceID, paramMyImageID)

	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	// DB 등록 : mapping에 D로 저장할 때 사용된 connection 정보가 필요하여 조회
	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.ResourceType = "myimage"
	connectionMapping.ResourceID = paramMyImageID
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName

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
		"message": respMessage.Message,
		"status":  respMessage.StatusCode,
	}))
}

func (a actions) VmSnapshotReg(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	vmSnapshotReq := new(tbmcis.TbVmSnapshotReq)
	if err := c.Bind(vmSnapshotReq); err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "failed to create vm snapshot",
			"status": "500",
		}))
	}

	mcisID := c.Param("mcisId")
	vmID := c.Param("vmId")
	go handler.AsyncRegVmSnapshot(namespaceID, mcisID, vmID, vmSnapshotReq, c)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  "200",
	}))
}
