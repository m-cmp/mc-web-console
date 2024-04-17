package actions

import (
	"fmt"
	"log"
	"mc_web_console_api/fwmodels/dragonfly"
	tbmcis "mc_web_console_api/fwmodels/tumblebug/mcis"
	"mc_web_console_api/fwmodels/webtool"
	"mc_web_console_api/handler"
	"mc_web_console_api/models/views"
	"mc_web_console_api/util"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

// McismngList 목록조회
func McisList(c buffalo.Context) error {

	// namespace
	// namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceID := c.Params().Get("namespaceid")
	optionParam := c.Params().Get("option")
	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")
	if optionParam == "id" {
		mcisIdList, respStatus := handler.GetMcisListByID(namespaceID, filterKeyParam, filterValParam)
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
			"McisList":           mcisIdList,
		}))
	} else {
		mcisList, respStatus := handler.GetMcisListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		providerID := c.Params().Get("providerId")
		connectionName := c.Params().Get("connection")
		vnetID := c.Params().Get("vnet")
		subGroupID := c.Params().Get("subgroup")
		returnMcisList := []tbmcis.TbMcisInfo{}
		if providerID != "" || connectionName != "" || vnetID != "" || subGroupID != "" {
			for _, mcis := range mcisList {
				vmList := mcis.Vm

				returnVmList := []tbmcis.TbVmInfo{}
				fmt.Println(returnVmList)
				for _, vm := range vmList {

					if connectionName != "" && connectionName != vm.ConnectionName {
						continue
					}

					if vnetID != "" && vnetID != vm.VNetID {
						continue
					}

					if subGroupID != "" && subGroupID != vm.SubGroupID {
						continue
					}
					returnVmList = append(returnVmList, vm)
				}

				if len(returnVmList) == 0 {
					continue
				}

				mcis.Vm = returnVmList
				returnMcisList = append(returnMcisList, mcis)
			}
		} else {
			returnMcisList = mcisList
		}
		log.Println(" mcisList return ", returnMcisList)
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":            "success",
			"status":             respStatus.StatusCode,
			"DefaultNameSpaceID": namespaceID,
			"McisList":           returnMcisList,
		}))
	}
}

// McismngGet 단건조회
func McisGet(c buffalo.Context) error {
	//namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceID := c.Param("nsid")
	mcisID := c.Param("mcisid")
	log.Println("mcisId= " + mcisID)
	optionParam := c.Params().Get("option")

	log.Println("optionParam= " + optionParam)

	if optionParam == "id" {
		resultMcisInfo, _ := handler.GetMcisDataByID(namespaceID, mcisID)

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":  "success",
			"status":   200,
			"McisInfo": resultMcisInfo,
		}))

	} else if optionParam == "status" {
		resultMcisStatusInfo, _ := handler.GetMcisDataByStatus(namespaceID, mcisID, optionParam)

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":        "success",
			"status":         200,
			"McisStatusInfo": resultMcisStatusInfo,
		}))
	}

	resultMcisInfo, _ := handler.GetMcisData(namespaceID, mcisID)

	providerIdParam := c.Params().Get("providerId")
	if providerIdParam != "" {

	}

	connectionNameParam := c.Params().Get("connection")
	if connectionNameParam != "" {

	}

	vnetIDParam := c.Params().Get("vnet")
	if vnetIDParam != "" {

	}

	subGroupIDParam := c.Params().Get("subgroup")
	if subGroupIDParam != "" {

	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":  "success",
		"status":   200,
		"McisInfo": resultMcisInfo,
	}))
}

func McisReg(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisReqInfo := &tbmcis.TbMcisReq{}
	if err := c.Bind(mcisReqInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	// vm이 사용할 connection 조회 -> 화면에서 넘기도록 변경함.
	// vmRegList := mcisReqInfo.Vm
	// connectionMap := map[string]string{}
	// for idx, regVm := range vmRegList {
	// 	useConnectionName := ""
	// 	val, exists := connectionMap[regVm.ProviderID+"|"+regVm.RegionName]
	// 	if exists {
	// 		useConnectionName = val
	// 	} else {
	// 		// connection 조회 : vm마다 다를 수 있음
	// 		paramViewConnection := views.ViewCloudConnection{}
	// 		paramViewConnection.ProviderID = regVm.ProviderID
	// 		paramViewConnection.RegionName = regVm.RegionName
	// 		paramViewConnection.ZoneName = regVm.ZoneName
	// 		viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
	// 		if err != nil {
	// 			return c.Render(500, r.JSON(map[string]interface{}{
	// 				"error":  "there is no available connection",
	// 				"status": "500",
	// 			}))
	// 		}
	// 		useConnectionName = viewConnection.ConnectionName
	// 		connectionMap[regVm.ProviderID+"|"+regVm.RegionName] = useConnectionName
	// 	}

	// 	if strings.Compare(useConnectionName, "") == 0 {
	// 		return c.Render(500, r.JSON(map[string]interface{}{
	// 			"error":  "there is no available connection info",
	// 			"status": "500",
	// 		}))
	// 	}

	// 	log.Println("useConnectionName", useConnectionName)
	// 	// 사용할 connection set
	// 	//regVm.ConnectionName = useConnectionName
	// 	vmRegList[idx].ConnectionName = useConnectionName
	// }

	// log.Println("connectionMap", connectionMap)

	// MCIS 생성 시 notification 정보 set
	taskKey := namespaceID + "||" + "mcis" + "||" + mcisReqInfo.Name                                                     // TODO : 공통 function으로 뺄 것.
	handler.StoreWebsocketMessage(util.TASK_TYPE_MCIS, taskKey, util.MCIS_LIFECYCLE_CREATE, util.TASK_STATUS_REQUEST, c) // session에 작업내용 저장

	// 생성 요청 비동기.
	go handler.RegMcisByAsync(namespaceID, mcisReqInfo, c)
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// McisDynamicReg
// /ns/{nsId}/loadDefaultResource 로 해당 namespace에 기본 리소스(vnet, sg, sshkey) 를 가져오는 작업이 선행되어야 함. 없으면 에러
// error message : cannot find the key /ns/workation/resources/vNet/workation-systemdefault-gcp-asia-northeast1
func McisDynamicReg(c buffalo.Context) error {
	log.Println("McisDynamicReg")
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisReqInfo := &tbmcis.TbMcisDynamicReq{}
	if err := c.Bind(mcisReqInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}
	log.Println("mcisReqInfo", mcisReqInfo)

	// MCIS 생성 시 notification 정보 set
	taskKey := namespaceID + "||" + "mcis" + "||" + mcisReqInfo.Name                                                     // TODO : 공통 function으로 뺄 것.
	handler.StoreWebsocketMessage(util.TASK_TYPE_MCIS, taskKey, util.MCIS_LIFECYCLE_CREATE, util.TASK_STATUS_REQUEST, c) // session에 작업내용 저장

	// vm의 connection 정보 추출
	// vm이 사용할 connection 조회
	vmRegList := mcisReqInfo.Vm
	connectionMap := map[string]string{}
	for idx, regVm := range vmRegList {
		useConnectionName := ""
		val, exists := connectionMap[regVm.ProviderID+"|"+regVm.RegionName]
		log.Println("val", val)
		log.Println("exists", exists)
		if exists {
			useConnectionName = val
		} else {
			// connection 조회 : vm마다 다를 수 있음
			paramViewConnection := views.ViewCloudConnection{}
			paramViewConnection.ProviderID = strings.ToUpper(regVm.ProviderID)
			paramViewConnection.RegionName = regVm.RegionName
			paramViewConnection.ZoneName = regVm.ZoneName
			viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
			if err != nil {
				return c.Render(500, r.JSON(map[string]interface{}{
					"error":  "there is no available connection",
					"status": "500",
				}))
			}
			useConnectionName = viewConnection.ConnectionName
			connectionMap[regVm.ProviderID+"|"+regVm.RegionName] = useConnectionName
		}
		log.Println("useConnectionName=", useConnectionName)
		if strings.Compare(useConnectionName, "") == 0 {
			return c.Render(500, r.JSON(map[string]interface{}{
				"error":  "there is no available connection info",
				"status": "500",
			}))
		}

		log.Println("useConnectionName", useConnectionName)
		// 사용할 connection set
		//regVm.ConnectionName = useConnectionName
		//vmRegList[idx].ConnectionName = useConnectionName
		vmRegList[idx].ConnectionName = "" // for the test
	}
	log.Println("before RegMcisDynamicByAsync ")
	// 생성 요청 비동기.
	go handler.RegMcisDynamicByAsync(namespaceID, mcisReqInfo, c)
	log.Println("after RegMcisDynamicByAsync ")
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func McisDel(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Param("mcisId")
	optionParam := c.Params().Get("option")

	log.Println("mcisID= " + mcisID)
	_, respStatus := handler.DelMcis(namespaceID, mcisID, optionParam)
	log.Println("RegMcis service returned")
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus.StatusCode,
	}))
}

// MCIS의 status변경
func McisLifeCycle(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisLifeCycle := &webtool.McisLifeCycle{}
	if err := c.Bind(mcisLifeCycle); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}

	if namespaceID != mcisLifeCycle.NameSpaceID {
		// 변경할 Namespace 정보가 다르므로 변경 불가
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message": "선택된 Namespace가 아닙니다. Namespace를 임의로 변경하여 호출하면 안됨.",
			"status":  "400", // TODO : custom으로 만드는 resultCode 정리 필요
		}))
	}

	taskKey := namespaceID + "||" + "mcis" + "||" + mcisLifeCycle.McisID                                           // TODO : 공통 function으로 뺄 것.
	handler.StoreWebsocketMessage(util.TASK_TYPE_MCIS, taskKey, mcisLifeCycle.Action, util.TASK_STATUS_REQUEST, c) // session에 작업내용 저장

	go handler.McisLifeCycleByAsync(mcisLifeCycle, c)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  "200",
		"action":  mcisLifeCycle.Action,
	}))
}

// VM의 LifeCycle status변경
func McisVmLifeCycle(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	vmLifeCycle := &webtool.VmLifeCycle{}
	if err := c.Bind(vmLifeCycle); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}

	vmLifeCycle.NameSpaceID = namespaceID

	taskKey := namespaceID + "||" + "vm" + "||" + vmLifeCycle.McisID + "||" + vmLifeCycle.VmID
	handler.StoreWebsocketMessage(util.TASK_TYPE_VM, taskKey, vmLifeCycle.Action, util.TASK_STATUS_REQUEST, c)

	go handler.McisVmLifeCycleByAsync(vmLifeCycle, c)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  "200",
		"action":  vmLifeCycle.Action,
	}))
}

// Mcis 내 특정 VM 조회
func McisVmGet(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Param("mcisId")
	vmID := c.Param("vmId")

	returnVmInfo, respStatus := handler.GetVMofMcisData(namespaceID, mcisID, vmID)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	// VM 정보에는 connection 관련정보가 빠져있어 추가로 조회. TODO : 필요없으면 제거할 것.
	connectionName := returnVmInfo.ConnectionName
	cloudConnectionConfigInfo, _ := handler.GetCloudConnectionConfigData(connectionName)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":              respStatus.Message,
		"status":               respStatus.StatusCode,
		"VmInfo":               returnVmInfo,
		"ConnectionConfigInfo": cloudConnectionConfigInfo,
	}))
}

// Mcis 의 subgroup 목록 조회 : id만 return
func McisSubGroupList(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Param("mcisId")

	returnSubgroupList, respStatus := handler.McisSubGroupList(namespaceID, mcisID)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":      respStatus.Message,
		"status":       respStatus.StatusCode,
		"SubgroupList": returnSubgroupList,
	}))
}

// Mcis 의 subgroup 조회 : 해당 subgroup VM 목록 ID 만 반환
func McisSubgroupGet(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Param("mcisId")
	subgroupID := c.Param("subgroupId")

	returnSubgroupVmIdList, respStatus := handler.VmIdListBySubgroupID(namespaceID, mcisID, subgroupID)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":        respStatus.Message,
		"status":         respStatus.StatusCode,
		"McisSubgroupId": returnSubgroupVmIdList,
	}))
}

// Mcis 내 특정 VM 모니터링 조회
func McisVmMonitoring(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace").(string)

	// mcisID := c.Param("mcisID")
	// vmID := c.Param("vmID")

	vmMonitoring := &dragonfly.VmMonitoringReq{}
	if err := c.Bind(vmMonitoring); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}
	vmMonitoring.NameSpaceID = namespaceID

	returnVMMonitoringInfo, respStatus := handler.GetVmMonitoring(vmMonitoring)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":          "success",
		"status":           respStatus.StatusCode,
		"VMMonitoringInfo": returnVMMonitoringInfo[vmMonitoring.Metric],
	}))
}

// 특정 resource를 사용하는 mcis와 그안의 vm 들을 filter 하여 return
func McisListByResource(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")

	mcisIdList, respStatus := handler.GetMcisListByID(namespaceID, "", "")

	returnMcisList := []tbmcis.TbMcisInfo{}
	for _, mcisId := range mcisIdList {
		mcisInfo, _ := handler.GetMcisData(namespaceID, mcisId)
		vmList := mcisInfo.Vm

		returnVmList := []tbmcis.TbVmInfo{}
		fmt.Println(returnVmList)
		for _, vm := range vmList {
			if strings.EqualFold("vpc", filterKeyParam) {
				if filterValParam != "" && filterValParam != vm.VNetID {
					continue
				}
			}
			// security group은 배열이라
			// if strings.EqualFold("securitygroup", filterKeyParam){
			// 	if filterValParam != "" && filterValParam != vm.SecurityGroupIDs[] {
			// 		continue
			// 	}
			// }
			returnVmList = append(returnVmList, vm)
		}

		if len(returnVmList) == 0 {
			continue
		}

		mcisInfo.Vm = returnVmList
		returnMcisList = append(returnMcisList, *mcisInfo)

	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":  respStatus.Message,
		"status":   respStatus.StatusCode,
		"McisList": returnMcisList,
	}))
}

// MCIS의 특정 vnet을 사용하는 vm 들만 추출
func McisVmListByVnet(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	// TODO : post로 넘어오면 bind 해야하는지 확인 필요
	mcisID := c.Param("mcisID")
	vnetID := c.Param("vnetID")

	resultMcisInfo, respStatus := handler.GetMcisData(namespaceID, mcisID)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	vmList := resultMcisInfo.Vm
	resultVmList := []tbmcis.TbVmInfo{}
	for _, vm := range vmList {
		if vm.VNetID == vnetID {
			resultVmList = append(resultVmList, vm)
		}
	}
	resultMcisInfo.Vm = resultVmList

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":  respStatus.Message,
		"status":   respStatus.StatusCode,
		"McisInfo": resultMcisInfo,
	}))
}

// MCIS에 VM 목록으로 추가 등록
func McisAppendVmListReg(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Param("mcisId")

	mcisReqInfo := &tbmcis.TbMcisReq{}
	if err := c.Bind(mcisReqInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}

	vms := mcisReqInfo.Vm
	for _, vmInfo := range vms {
		//taskKey := namespaceID + "||" + "vm" + "||" + mcisID + "||" + vmInfo.Name
		//handler.StoreWebsocketMessage(util.TASK_TYPE_VM, taskKey, util.VM_LIFECYCLE_CREATE, util.TASK_STATUS_REQUEST, c)

		// go 루틴 호출 : return 값은 session에 저장
		go handler.AsyncRegVm(namespaceID, mcisID, &vmInfo, c)
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// MCIS에 VM 추가 등록
func McisAppendVmReg(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Param("mcisId")

	vmInfo := &tbmcis.TbVmReq{}
	if err := c.Bind(vmInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}

	// taskKey := namespaceID + "||" + "vm" + "||" + mcisID + "||" + vmInfo.Name
	// handler.StoreWebsocketMessage(util.TASK_TYPE_VM, taskKey, util.VM_LIFECYCLE_CREATE, util.TASK_STATUS_REQUEST, c)

	// go 루틴 호출 : return 값은 session에 저장
	go handler.AsyncRegVm(namespaceID, mcisID, vmInfo, c)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// 등록되지 않은 CSP의 VM을 system에 등록. namespace 지정 필요
func RegisterCspVm(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisReq := &tbmcis.TbMcisReq{}
	if err := c.Bind(mcisReq); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}

	resultMcisInfo, respStatus := handler.RegCspVm(namespaceID, mcisReq)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":  "success",
		"status":   200,
		"McisInfo": resultMcisInfo,
	}))
}

// VmDynamicReg
func McisVmDynamicReg(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Param("mcisId")

	mcisReqInfo := &tbmcis.TbMcisDynamicReq{}
	if err := c.Bind(mcisReqInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	vmReqList := mcisReqInfo.Vm
	for _, vmReqInfo := range vmReqList {
		taskKey := namespaceID + "||" + "vm" + "||" + vmReqInfo.Name // TODO : 공통 function으로 뺄 것.
		// VM 생성 시 notification 정보 set
		handler.StoreWebsocketMessage(util.TASK_TYPE_MCIS, taskKey, util.MCIS_LIFECYCLE_CREATE, util.TASK_STATUS_REQUEST, c)
		go handler.RegVmDynamicByAsync(namespaceID, mcisID, &vmReqInfo, c)
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// GetMcisRecommendVmSpecList
// TODO : spec 조회 부분이니 spec으로 옮겨야 하나
// GetMcisRecommendVmSpecList move to RecommendVmSpecList in vmspec.go
