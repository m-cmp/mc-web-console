package actions

import (
	"log"
	"mc_web_console_api/handler"
	"mc_web_console_api/models"
	"mc_web_console_api/models/views"
	"net/http"
	"strings"

	tbmcir "mc_web_console_api/fwmodels/tumblebug/mcir"

	"github.com/gobuffalo/buffalo"
	"github.com/gofrs/uuid"
)

// SecuritygroupList
func (a actions) SecurityGroupList(c buffalo.Context) error {
	log.Println("GetSecirityGroupList : ")
	namespaceID := c.Session().Get("current_namespace_id").(string)

	optionParam := c.Params().Get("option")
	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")

	if optionParam == "id" {
		securityGroupInfoList, respStatus := handler.GetSecurityGroupListByOptionID(namespaceID, optionParam, filterKeyParam, filterValParam)
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
			"SecurityGroupList":  securityGroupInfoList,
		}))
	} else {
		securityGroupInfoList, respStatus := handler.GetSecurityGroupListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
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
			"SecurityGroupList":  securityGroupInfoList,
		}))
	}
}

func (a actions) SecurityGroupListByRegion(c buffalo.Context) error {
	log.Println("SecuritygroupListByRegion : ")
	namespaceID := c.Session().Get("current_namespace_id").(string)

	optionParam := c.Params().Get("option")
	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")
	is_cb := c.Params().Get("is_cb")

	paramProviderID := c.Params().Get("providerId")
	paramRegionName := c.Params().Get("regionName")
	paramZoneName := c.Params().Get("zoneName")
	paramConnectionName := c.Params().Get("connectionName")

	paramVpcID := c.Params().Get("vpcId")
	paramConnectionMap := map[string]string{}
	paramConnectionMap["vpc"] = paramVpcID

	if paramVpcID != "" {
		connectionMapping := &models.CloudConnectionMapping{}
		connectionMapping.NamespaceID = namespaceID
		connectionMapping.ResourceType = "vpc"
		connectionMapping.ResourceID = paramVpcID

		// TODO : 해당 vpc를 사용하는 securityGroup 목록 조회. filter key로 tb 조회하도록 변경할 것.
		usedConnectionMapping, err := handler.GetUsedConnectionTx(connectionMapping, c)
		if err != nil {
			log.Println("err", err)
		}

		log.Println("paramProviderID", paramProviderID)
		log.Println("paramRegionName", paramRegionName)
		log.Println("usedConnectionMapping", usedConnectionMapping)

		// 두단계 아래는 못가져오므로 connectionId로 provider, region정보를 가져옴.--> 필요한가?
		//log.Println("CloudConnection   sss ", usedConnectionMapping.CloudConnection)
		//paramProviderID = usedConnectionMapping.CloudConnection.ProviderID
		//log.Println("Region   sss ", usedConnectionMapping.CloudConnection.Region)
		//paramRegionName = usedConnectionMapping.CloudConnection.Region.RegionName
		//log.Println("paramRegionName", paramRegionName)
	}

	log.Println("is_cb ", is_cb)
	if is_cb == "N" {
		log.Println("is_cb2 ", is_cb)
		securityGroupList, err := handler.ListResourceByType(namespaceID, paramConnectionMap, paramProviderID, paramRegionName, paramZoneName, "securitygroup")
		if err != nil {
			log.Println("VnetListByRegion err", err)

			return c.Render(500, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}

		// ID만 가져오는 경우는 가져온 resource에서 vpcID만 추출하여 return
		if optionParam == "id" {
			returnSecurityGroupIds := []string{}
			for _, item := range securityGroupList {
				returnSecurityGroupIds = append(returnSecurityGroupIds, item.ResourceName)
			}
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"message":           "success",
				"status":            "200",
				"SecurityGroupList": returnSecurityGroupIds, // string 배열 리턴
			}))
		}

		// 상세정보가 필요한 경우는 사용된 connection 정보로 cb-tb 조회하여 연결
		usedConnectionMap := map[string]string{}
		for _, item := range securityGroupList {
			usedConnectionMap[item.ConnectionName] = item.ConnectionName
		}
		log.Println("usedConnectionMap ", usedConnectionMap)
		returnSecurityGroupList := []tbmcir.TbSecurityGroupInfo{}
		for _, val := range usedConnectionMap {
			paramFilterKey := "connectionName"
			paramFilterVal := val
			securityGroupInfoList, respStatus := handler.GetSecurityGroupListByOption(namespaceID, optionParam, paramFilterKey, paramFilterVal)
			if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
				return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
					"error":  respStatus.Message,
					"status": respStatus.StatusCode,
				}))
			}
			returnSecurityGroupList = append(returnSecurityGroupList, securityGroupInfoList...)
		}

		log.Println("VnetListByRegion return ids", returnSecurityGroupList)
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":           "success",
			"status":            "200",
			"SecurityGroupList": returnSecurityGroupList,
		}))

	} else {
		if filterKeyParam == "" && paramVpcID != "" {
			filterKeyParam = "vNetId"
			filterValParam = paramVpcID
		}
		if optionParam == "id" {
			securityGroupInfoList, respStatus := handler.GetSecurityGroupListByOptionID(namespaceID, optionParam, filterKeyParam, filterValParam)
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
				"SecurityGroupList":  securityGroupInfoList,
			}))
		} else {

			if !strings.EqualFold(paramConnectionName, "") && strings.EqualFold(filterKeyParam, "") {
				filterKeyParam = "connectionName"
				filterValParam = paramConnectionName
			}

			securityGroupInfoList, respStatus := handler.GetSecurityGroupListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
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
				"SecurityGroupList":  securityGroupInfoList,
			}))
		}
	}
}

// 단건조회
func (a actions) SecurityGroupGet(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	paramSecurityGroupID := c.Param("securityGroupId")
	securityGroupInfo, respStatus := handler.GetSecurityGroupData(namespaceID, paramSecurityGroupID)
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ConnectionName = securityGroupInfo.ConnectionName
	viewConnection, err := handler.GetViewConnection(paramViewConnection)
	if err != nil {
		// cb에서 정보는 가져왔으니 오류로 뱉지는 않기.
	} else {
		securityGroupInfo.ProviderID = viewConnection.ProviderID
		securityGroupInfo.ProviderName = viewConnection.ProviderID
		securityGroupInfo.RegionName = viewConnection.RegionName
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":           "success",
		"status":            respStatus,
		"SecurityGroupInfo": securityGroupInfo,
	}))
}

func (a actions) SecurityGroupReg(c buffalo.Context) error {
	// 현재 namespace 정보 가져오기

	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	securityGroupRegInfo := &tbmcir.TbSecurityGroupReq{}
	if err := c.Bind(securityGroupRegInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}
	log.Println("securityGroupRegInfo ", securityGroupRegInfo)
	// connection 조회 : namespace와 무관 . 얘도 bind 써도 되나?
	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ProviderID = securityGroupRegInfo.ProviderID
	paramViewConnection.RegionName = securityGroupRegInfo.RegionName
	paramViewConnection.ZoneName = securityGroupRegInfo.ZoneName
	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "there is no available connection",
			"status": "500",
		}))
	}

	// 사용할 connection set
	securityGroupRegInfo.ConnectionName = viewConnection.ConnectionName

	// TB 등록
	resultSecurityGroupInfo, respStatus := handler.RegSecurityGroup(namespaceID, securityGroupRegInfo)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}
	// DB 등록
	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.Status = "C"
	connectionMapping.ResourceType = "securitygroup"
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	connectionMapping.ResourceID = resultSecurityGroupInfo.ID
	connectionMapping.ResourceName = resultSecurityGroupInfo.Name
	connectionMapping.CloudConnectionID = viewConnection.ID
	connectionMapping.CredentialID = viewConnection.CredentialID
	log.Println(connectionMapping)
	err = handler.SaveConnectionMapping(connectionMapping, c)
	if err != nil {
		// 실패시 생성한 vpc Resource 제거
		_, respStatus := handler.DelVpc(namespaceID, resultSecurityGroupInfo.ID)
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
		"message":           "success",
		"status":            respStatus.StatusCode,
		"SecurityGroupInfo": resultSecurityGroupInfo,
	}))
}

func (a actions) SecurityGroupDel(c buffalo.Context) error {

	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	paramSecurityGroupID := c.Param("securityGroupId")

	respMessage, respStatus := handler.DelSecurityGroup(namespaceID, paramSecurityGroupID)

	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	// DB 등록 : mapping에 D로 저장할 때 사용된 connection 정보가 필요하여 조회
	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	connectionMapping.ResourceType = "securitygroup"
	connectionMapping.ResourceID = paramSecurityGroupID

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

// security group rule 추가
// firewall 은 connection과 상관없이 sg에 종속이므로 별도로 mapping table에서 관리하지 않음
func (a actions) FirewallRuleReg(c buffalo.Context) error {
	// 현재 namespace 정보 가져오기
	namespaceID := c.Session().Get("current_namespace_id").(string)

	paramSecurityGroupID := c.Param("securityGroupID")
	firewallRuleReqList := &tbmcir.TbFirewallRulesWrapper{}
	if err := c.Bind(firewallRuleReqList); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	// TB 등록
	resultSecurityGroupInfo, respStatus := handler.RegFirewallRules(namespaceID, paramSecurityGroupID, firewallRuleReqList)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":           "success",
		"status":            respStatus.StatusCode,
		"SecurityGroupInfo": resultSecurityGroupInfo,
	}))
}

// firewall rule 삭제 :
func (a actions) FirewallRuleDel(c buffalo.Context) error {

	namespaceID := c.Session().Get("current_namespace_id").(string)

	paramSecurityGroupID := c.Param("securityGroupID")

	firewallRuleReqList := &tbmcir.TbFirewallRulesWrapper{}
	if err := c.Bind(firewallRuleReqList); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	resultSecurityGroupInfo, respStatus := handler.DelFirewallRules(namespaceID, paramSecurityGroupID, firewallRuleReqList)

	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":           "success",
		"status":            respStatus.StatusCode,
		"securityGroupInfo": resultSecurityGroupInfo,
	}))
}
