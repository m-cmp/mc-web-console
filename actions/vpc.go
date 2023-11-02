package actions

import (
	"log"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gofrs/uuid"

	tbmcir "mc_web_console/frameworkmodel/tumblebug/mcir"
	"mc_web_console/handler"
	"mc_web_console/models"
	"mc_web_console/models/views"
)

// VnetForm default implementation.
func (a actions) VpcMngForm(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("settings/vnet/mngform.html"))
}

func (a actions) VpcReg(c buffalo.Context) error {
	// 현재 namespace 정보 가져오기
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	vNetRegInfo := &tbmcir.TbVNetReq{}
	if err := c.Bind(vNetRegInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	// connection 조회 : namespace와 무관 . 얘도 bind 써도 되나?
	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ProviderID = vNetRegInfo.ProviderID
	paramViewConnection.RegionName = vNetRegInfo.RegionName
	paramViewConnection.ZoneName = vNetRegInfo.ZoneName
	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			//"error":  "there is no available connection",
			"error":  err.Error(),
			"status": "500",
		}))
	}

	// 사용할 connection set
	vNetRegInfo.ConnectionName = viewConnection.ConnectionName

	// TB 등록 : NS를 ID로 보내고 있어서 에러나고 있음. http://54.180.86.138:1323/tumblebug/ns/g9qligtr8p/resources/vNet
	resultVNetInfo, respStatus := handler.RegVpc(namespaceID, vNetRegInfo)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}
	// DB 등록
	// connectionUUID, err := uuid.FromString(connectionId)
	// if err != nil {
	// 	log.Println("connection uuid parsing failed : ", err)
	// }

	// credentialUUID, err := uuid.FromString(credentialId)
	// if err != nil {
	// 	log.Println("credential uuid parsing failed : ", err)
	// }

	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.Status = "C"
	connectionMapping.ResourceType = "vpc"
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	connectionMapping.ResourceID = resultVNetInfo.ID
	connectionMapping.ResourceName = resultVNetInfo.Name
	connectionMapping.CloudConnectionID = viewConnection.ID
	connectionMapping.CredentialID = viewConnection.CredentialID
	err = handler.SaveConnectionMapping(connectionMapping, c)
	if err != nil {
		// 실패시 생성한 vpc Resource 제거
		_, respStatus := handler.DelVpc(namespaceID, resultVNetInfo.ID)
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
		"message":  "success",
		"status":   respStatus.StatusCode,
		"VNetInfo": resultVNetInfo,
	}))
}

func (a actions) VpcDel(c buffalo.Context) error {
	log.Println("VnetDel")
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	paramVNetID := c.Param("vpcId")

	respMessage, respStatus := handler.DelVpc(namespaceID, paramVNetID)

	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	// Resource Mapping 에서 resource정보 조회(connection, credential)
	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	connectionMapping.ResourceType = "vpc"
	connectionMapping.ResourceID = paramVNetID

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
	log.Println("DelVpc return")
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": respMessage.Message,
		"status":  respMessage.StatusCode,
	}))
}

// 단건 조회 by id
func (a actions) VpcGet(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	paramVNetID := c.Param("vpcId")
	vNetInfo, respStatus := handler.GetVpcData(namespaceID, paramVNetID)

	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ConnectionName = vNetInfo.ConnectionName
	viewConnection, err := handler.GetViewConnection(paramViewConnection)
	if err != nil {
		// cb에서 정보는 가져왔으니 오류로 뱉지는 않기.
	} else {
		vNetInfo.ProviderID = viewConnection.ProviderID
		vNetInfo.ProviderName = viewConnection.ProviderID
		vNetInfo.RegionName = viewConnection.RegionName
	}

	//

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":  "success",
		"status":   respStatus,
		"VNetInfo": vNetInfo,
	}))
}

// VnetList default implementation.
func (a actions) VpcList(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	optionParam := c.Params().Get("option")
	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")
	if optionParam == "id" {
		vNetInfoList, respStatus := handler.GetVnetListByID(namespaceID, filterKeyParam, filterValParam)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"DefaultNameSpaceID": namespaceID,
			"VNetList":           vNetInfoList, // string 배열 리턴
		}))
	} else {
		vNetInfoList, respStatus := handler.GetVnetListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"DefaultNameSpaceID": namespaceID,
			"VNetList":           vNetInfoList, //TbVnetInfo 배열 리턴
		}))
	}
}

// 해당 namespace의 Region내 vnet 목록 조회
func (a actions) VpcListByRegion(c buffalo.Context) error {
	log.Println("VnetListByRegion")
	namespaceID := c.Session().Get("current_namespace_id").(string)

	//optionParam := c.Param("option")
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

	// 1. 해당 region에 등록 된 connection을 바탕으로 vpc목록을 cb-tb에 조회한 결과들을 붙여 return 할 것인가
	// 2. resourceMaping에 등록된 vpc 목록을 return할 것인가
	// 상세정보가 필요하면 1. 이름만 필요하면 2.
	if is_cb == "N" {
		//ListResourceByType : 해당 Resource의 connection 찾기 : views.ViewCloudConnection
		vpcList, err := handler.ListResourceByType(namespaceID, paramConnectionMap, paramProviderID, paramRegionName, paramZoneName, "vpc")
		if err != nil {
			log.Println("VnetListByRegion err", err)

			return c.Render(500, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}

		// // ID만 가져오는 경우는 가져온 resource에서 vpcID만 추출하여 return
		// if optionParam == "id" {
		// 	returnVnetIds := []string{}
		// 	for _, vpc := range vpcList {
		// 		returnVnetIds = append(returnVnetIds, vpc.ResourceName)
		// 	}
		// 	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		// 		"message":            "success",
		// 		"status":             "200",
		// 		"DefaultNameSpaceID": namespaceID,
		// 		"VNetList":           returnVnetIds, // string 배열 리턴
		// 	}))
		// }

		// 상세정보가 필요한 경우는 사용된 connection 정보로 cb-tb 조회하여 연결
		usedConnectionMap := map[string]string{}
		if paramConnectionName != "" {
			usedConnectionMap[paramConnectionName] = paramConnectionName
		} else {
			for _, vpc := range vpcList {
				usedConnectionMap[vpc.ConnectionName] = vpc.ConnectionName
			}
		}
		returnVpcList := []tbmcir.TbVNetInfo{}
		for _, val := range usedConnectionMap {
			paramFilterKey := "connectionName"
			paramFilterVal := val
			vNetInfoList, respStatus := handler.GetVnetListByOption(namespaceID, optionParam, paramFilterKey, paramFilterVal)
			if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
				return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
					"error":  respStatus.Message,
					"status": respStatus.StatusCode,
				}))
			}

			for _, item := range vNetInfoList {
				item.ProviderID = paramProviderID
				item.RegionName = paramRegionName
				returnVpcList = append(returnVpcList, item)
			}
			//returnVpcList = append(returnVpcList, vNetInfoList...)
		}

		log.Println("VnetListByRegion return ", returnVpcList)
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             "200",
			"DefaultNameSpaceID": namespaceID,
			"VNetList":           returnVpcList,
		}))
	}

	log.Println("VnetListByRegion optionParam ", optionParam)
	// is_cb=Y(default) cb-tb를 바로 호출하는 경우
	if optionParam == "id" {
		vNetInfoList, respStatus := handler.GetVnetListByID(namespaceID, filterKeyParam, filterValParam) // TODO : GetVnetIdList 같은걸로 이름변경할 것 byID가 아니라 ID만 가져오는 기능임.
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"DefaultNameSpaceID": namespaceID,
			"VNetList":           vNetInfoList, // string 배열 리턴
		}))
	} else {
		log.Println("GetVnetListByOption")
		if !strings.EqualFold(paramConnectionName, "") && strings.EqualFold(filterKeyParam, "") {
			filterKeyParam = "connectionName"
			filterValParam = paramConnectionName
		}
		vNetInfoList, respStatus := handler.GetVnetListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"DefaultNameSpaceID": namespaceID,
			"VNetList":           vNetInfoList, //TbVnetInfo 배열 리턴
		}))
	}

}
