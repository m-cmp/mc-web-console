package actions

import (
	"log"
	"mc_web_console_api/fwmodels"
	"mc_web_console_api/fwmodels/tumblebug/mcir"
	"mc_web_console_api/handler"
	"mc_web_console_api/models"
	"mc_web_console_api/models/views"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gofrs/uuid"
)

// VmimageList default implementation.
func VmImageList(c buffalo.Context) error {
	log.Println("GetVirtualMachineImageList : ")
	namespaceID := c.Session().Get("current_namespace_id").(string)

	optionParam := c.Params().Get("option")
	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")

	paramConnectionName := c.Params().Get("connectionName")
	//paramConnectionMap := map[string]string{} // 특정 connection 을 가져오기 위해 사용.
	if !strings.EqualFold(paramConnectionName, "") {
		//paramConnectionMap["connectionName"] = paramConnectionName
		filterKeyParam = "connectionName"
		filterValParam = paramConnectionName
	}

	if optionParam == "id" {
		virtualMachineImageInfoList, respStatus := handler.GetVirtualMachineImageInfoListByID(namespaceID, filterKeyParam, filterValParam)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":                 "success",
			"status":                  respStatus.StatusCode,
			"DefaultNameSpaceID":      namespaceID,
			"VirtualMachineImageList": virtualMachineImageInfoList,
		}))
	} else {
		if !strings.EqualFold(paramConnectionName, "") && strings.EqualFold(filterKeyParam, "") {
			filterKeyParam = "connectionName"
			filterValParam = paramConnectionName
		}

		virtualMachineImageInfoList, respStatus := handler.GetVirtualMachineImageInfoListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":                 "success",
			"status":                  respStatus.StatusCode,
			"DefaultNameSpaceID":      namespaceID,
			"VirtualMachineImageList": virtualMachineImageInfoList,
		}))
	}
}

func VmImageGet(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	paramVirtualMachineImage := c.Param("vmImageId")
	virtualMachineImageInfo, respStatus := handler.GetVirtualMachineImageData(namespaceID, paramVirtualMachineImage)

	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ConnectionName = virtualMachineImageInfo.ConnectionName
	viewConnection, err := handler.GetViewConnection(paramViewConnection)
	if err != nil {
		// cb에서 정보는 가져왔으니 오류로 뱉지는 않기.
	} else {
		virtualMachineImageInfo.ProviderID = viewConnection.ProviderID
		virtualMachineImageInfo.RegionName = viewConnection.RegionName
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":                 "success",
		"status":                  respStatus,
		"VirtualMachineImageInfo": virtualMachineImageInfo,
	}))
}

func VmImageReg(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	respStatus := fwmodels.WebStatus{}

	resultVirtualMachineImageInfo := new(mcir.TbImageInfo)

	virtualMachineImageRegInfo := new(mcir.TbImageInfo)
	virtualMachineImageReqInfo := new(mcir.TbImageReq)

	paramViewConnection := views.ViewCloudConnection{}

	paramVirtualMachineImageRegistType := c.Param("registeringMethod")

	if strings.EqualFold(paramVirtualMachineImageRegistType, "registerWithInfo") {
		if err := c.Bind(virtualMachineImageRegInfo); err != nil {
			log.Println(err)
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error":  "fail",
				"status": "fail",
			}))
		}
		paramViewConnection.ProviderID = virtualMachineImageRegInfo.ProviderID
		paramViewConnection.RegionName = virtualMachineImageRegInfo.RegionName
		paramViewConnection.ZoneName = virtualMachineImageRegInfo.ZoneName

	} else {
		if err := c.Bind(virtualMachineImageReqInfo); err != nil {
			log.Println(err)
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error":  "fail",
				"status": "fail",
			}))
		}
		paramViewConnection.ProviderID = virtualMachineImageReqInfo.ProviderID
		paramViewConnection.RegionName = virtualMachineImageReqInfo.RegionName
		paramViewConnection.ZoneName = virtualMachineImageReqInfo.ZoneName

	}

	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)

	log.Println("*************vmimagereq : ", virtualMachineImageReqInfo, "|*************namespaceID : ", namespaceID, "|**********viewconnection :", viewConnection, "|*************error : ", err)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "there is no available connection",
			"status": "500",
		}))
	}

	if strings.EqualFold(paramVirtualMachineImageRegistType, "registerWithInfo") {
		virtualMachineImageRegInfo.ConnectionName = viewConnection.ConnectionName
		resultVirtualMachineImageInfo, respStatus = handler.RegVirtualMachineImageWithInfo(namespaceID, paramVirtualMachineImageRegistType, virtualMachineImageRegInfo)
	} else {
		virtualMachineImageReqInfo.ConnectionName = viewConnection.ConnectionName
		resultVirtualMachineImageInfo, respStatus = handler.RegVirtualMachineImage(namespaceID, paramVirtualMachineImageRegistType, virtualMachineImageReqInfo)
	}

	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.Status = "C"
	connectionMapping.ResourceType = "vmimage"
	connectionMapping.ResourceID = resultVirtualMachineImageInfo.ID
	connectionMapping.ResourceName = resultVirtualMachineImageInfo.Name
	connectionMapping.CloudConnectionID = viewConnection.ID
	connectionMapping.CredentialID = viewConnection.CredentialID
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	err = handler.SaveConnectionMapping(connectionMapping, c)
	if err != nil {
		// 실패시 생성한 vpc Resource 제거
		_, respStatus := handler.DelVirtualMachineImage(namespaceID, resultVirtualMachineImageInfo.ID)
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
		"message":                 "success",
		"status":                  respStatus,
		"VirtualMachineImageInfo": resultVirtualMachineImageInfo,
	}))
}

func VmImageDel(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	paramVmImageId := c.Param("vmImageId")
	log.Println("***********paramVirtualMachineImage : ")
	log.Println(paramVmImageId)

	respMessage, respStatus := handler.DelVirtualMachineImage(namespaceID, paramVmImageId)

	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	connectionMapping.ResourceType = "vmimage"
	connectionMapping.ResourceID = paramVmImageId

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

func LookupCspVirtualMachineImageList(c buffalo.Context) error {

	// paramConnectionName := c.Param("connectionName")

	paramProviderId := c.Params().Get("providerId")
	paramRegionName := c.Params().Get("regionName")
	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ProviderID = paramProviderId
	paramViewConnection.RegionName = paramRegionName
	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "there is no available connection",
			"status": "500",
		}))
	}
	connectionName := viewConnection.ConnectionName
	virtualMachineImageInfoList, respStatus := handler.LookupVirtualMachineImageList(connectionName)

	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":                 "success",
		"status":                  respStatus.StatusCode,
		"VirtualMachineImageList": virtualMachineImageInfoList,
	}))
}

// lookupImage 상세정보
func LookupVirtualMachineImageData(c buffalo.Context) error {
	log.Println("LookupVirtualMachineImageData : ")

	restLookupImageRequest := new(mcir.RestLookupImageRequest)

	paramProviderId := c.Params().Get("providerId")
	paramRegionName := c.Params().Get("regionName")
	log.Println("paramProviderId paramRegionName : ", paramProviderId, paramRegionName)
	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ProviderID = paramProviderId
	paramViewConnection.RegionName = paramRegionName
	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "there is no available connection",
			"status": "500",
		}))
	}
	restLookupImageRequest.ConnectionName = viewConnection.ConnectionName
	if err := c.Bind(restLookupImageRequest); err != nil {
		log.Println(err)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"error":  "fail",
			"status": "fail",
		}))
	}
	// paramVirtualMachineImage := c.Param("imageID")
	// virtualMachineImageInfo, respStatus := service.LookupVirtualMachineImageData(paramVirtualMachineImage)
	virtualMachineImageInfo, respStatus := handler.LookupVirtualMachineImageData(restLookupImageRequest)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":                 "success",
		"status":                  respStatus.StatusCode,
		"VirtualMachineImageList": virtualMachineImageInfo,
	}))
}

// lookupImage 상세정보
func SearchVirtualMachineImageList(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	restSearchImageRequest := new(mcir.RestSearchImageRequest)
	if err := c.Bind(restSearchImageRequest); err != nil {
		log.Println(err)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"error":  "fail",
			"status": "fail",
		}))
	}
	virtualMachineImageInfoList, respStatus := handler.SearchVirtualMachineImageList(namespaceID, restSearchImageRequest)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":                 "success",
		"status":                  respStatus.StatusCode,
		"VirtualMachineImageList": virtualMachineImageInfoList,
	}))
}

// TODO : Fetch 의 의미 파악
func FetchVirtualMachineImageList(c buffalo.Context) error {
	log.Println("FetchVirtualMachineImageList : ")

	namespaceID := c.Session().Get("current_namespace_id").(string)

	virtualMachineImageInfoList, respStatus := handler.FetchVirtualMachineImageList(namespaceID)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":                 "success",
		"status":                  respStatus.StatusCode,
		"VirtualMachineImageList": virtualMachineImageInfoList,
	}))
}
