package actions

import (
	//"log"
	//"mc_web_console/handler"
	//"mc_web_console/models"
	//"mc_web_console/models/views"

	"log"
	"mc_web_console/handler"
	"mc_web_console/models"
	"mc_web_console/models/views"
	"net/http"

	tbmcir "mc_web_console/frameworkmodel/tumblebug/mcir"
	"mc_web_console/frameworkmodel/webtool"

	"github.com/gobuffalo/buffalo"
	"github.com/gofrs/uuid"
)

// @Summary		데이터 디스크 화면 렌더링
// @Description	[DataDiskMngForm] 데이터 디스크 화면을 렌더링합니다.
// @Tags			datadisk
// @Produce		html
// @Success		200	{html}	html	"settings/datadisk/mngform.html"
// @Router			/settings/resources/datadisk/mngform/ [get]
func (a actions) DataDiskMngForm(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("settings/datadisk/mngform.html"))
}

// @Summary		DataDisk 생성
// @Description	[DataDiskReg] Data Disk를 생성합니다.
// @Tags			datadisk
// @Accept			json
// @Produce		json
// @Param			dataDiskRegInfo	body		mcir.TbDataDiskReq	true	"tbmcir.TbDataDiskReq"
// @Success		200				{string}	string				"{'message':'success','status':'200',}"
// @Failure		500				{string}	string				"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/resources/datadisk/ [post]
func (a actions) DataDiskReg(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	dataDiskRegInfo := &tbmcir.TbDataDiskReq{}
	if err := c.Bind(dataDiskRegInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	// connection 조회 : namespace와 무관 . 얘도 bind 써도 되나?
	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ProviderID = dataDiskRegInfo.ProviderID
	paramViewConnection.RegionName = dataDiskRegInfo.RegionName
	paramViewConnection.ZoneName = dataDiskRegInfo.ZoneName
	viewConnection, err := handler.GetAvailableConnection(paramViewConnection, c)
	if err != nil {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  "there is no available connection",
			"status": "500",
		}))
	}

	// 사용할 connection set
	dataDiskRegInfo.ConnectionName = viewConnection.ConnectionName

	// TB 등록
	resultDataDiskInfo, respStatus := handler.RegDataDisk(namespaceID, dataDiskRegInfo)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}
	// DB 등록
	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.Status = "C"
	connectionMapping.ResourceType = "datadisk"
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	connectionMapping.ResourceID = resultDataDiskInfo.ID
	connectionMapping.ResourceName = resultDataDiskInfo.Name
	connectionMapping.CloudConnectionID = viewConnection.ID
	connectionMapping.CredentialID = viewConnection.CredentialID
	err = handler.SaveConnectionMapping(connectionMapping, c)
	if err != nil {
		// 실패시 생성한  Resource 제거
		_, respStatus := handler.DelDataDisk(namespaceID, resultDataDiskInfo.ID)
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
		"message":      "success",
		"status":       respStatus.StatusCode,
		"DataDiskInfo": resultDataDiskInfo,
	}))
}

// @Summary		Data Disk CRD 한번에
// @Description	[DataDiskMng] Data Disk Mng(CRD) 합니다.
// @Description	Create, Update, Delete가 한번에 일어나는 경우 사용
// @Description	ex) table에 addRow로 추가하고 delet로 삭제한 것들을 한번에 저장할 때.
// @Tags			datadisk
// @Accept			json
// @Produce		json
// @Param			dataDiskRegInfo	body		webtool.DataDiskMngReq	true	"webtool.DataDiskMngReq"
// @Success		200				{string}	string					"{'message':'success','status':'200',}"
// @Failure		500				{string}	string					"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/resources/datadisk/mngdata/ [post]
func (a actions) DataDiskMng(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	log.Println("DataDiskMng in")
	dataDiskRegInfo := &webtool.DataDiskMngReq{}
	if err := c.Bind(dataDiskRegInfo); err != nil {
		log.Println("DataDiskMng err ", err)
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	mcisID := c.Params().Get("mcisId")
	vmID := c.Params().Get("vmId")

	changedResourceCount := 0

	// create data disk list
	if dataDiskRegInfo.CreateDataDiskList != nil {
		for _, createDataDisk := range dataDiskRegInfo.CreateDataDiskList {
			// 생성 후 attach 할 vm이 있으면 attach 한다.
			// disk생성의 경우 delay가 충분히 있어야 한다.
			go handler.AsyncRegDataDisk(namespaceID, &createDataDisk, c)
			changedResourceCount++
		}

	}

	// detach data disk list
	if dataDiskRegInfo.DetachDataDiskList != nil {
		if mcisID != "" && vmID != "" {
			for _, detachDataDisk := range dataDiskRegInfo.DetachDataDiskList {

				// 2. vm에서 detach. optionParam 의 기본값은 attach임. detach라고 하는 항목만 삭제 됨.
				optionParam := "detach"
				attachDetachDataDiskReq := new(tbmcir.TbAttachDetachDataDiskReq)
				attachDetachDataDiskReq.DataDiskId = detachDataDisk

				go handler.AsyncAttachDetachDataDiskToVM(namespaceID, mcisID, vmID, optionParam, attachDetachDataDiskReq, c)
				changedResourceCount++
			}
		}
	}

	// attach data disk list
	if dataDiskRegInfo.AttachDataDiskList != nil {
		if mcisID != "" && vmID != "" {
			for _, attachDataDisk := range dataDiskRegInfo.AttachDataDiskList {
				optionParam := "attach"
				attachDetachDataDiskReq := new(tbmcir.TbAttachDetachDataDiskReq)
				attachDetachDataDiskReq.DataDiskId = attachDataDisk
				go handler.AsyncAttachDetachDataDiskToVM(namespaceID, mcisID, vmID, optionParam, attachDetachDataDiskReq, c)
				changedResourceCount++
			}
		}
	}

	// delete data disk list
	if dataDiskRegInfo.DeleteDataDiskList != nil {
		for _, delDataDisk := range dataDiskRegInfo.DeleteDataDiskList {
			go handler.AsyncDelDataDisk(namespaceID, delDataDisk, c)
			changedResourceCount++
		}
	}

	if changedResourceCount == 0 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message": "failed. No data has been changed.",
			"status":  500,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// @Summary		Data Disk List 조회
// @Description	[DataDiskList] Data Disk List를 조회합니다.
// @Tags			datadisk
// @Accept			json
// @Produce		json
// @Param			option		query		string	true	"option"
// @Param			filterKey	query		string	true	"filterKey"
// @Param			filterVal	query		string	true	"filterVal"
// @Success		200			{string}	string	"{'message':'success','status':'200','defaultNameSpaceID': namespaceID,'status': respStatus.StatusCode,}"
// @Failure		500			{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/resources/datadisk/ [get]
func (a actions) DataDiskList(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	optionParam := c.Params().Get("option")
	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")

	if optionParam == "id" {
		dataDiskInfoList, respStatus := handler.GetDataDiskListByID(namespaceID, filterKeyParam, filterValParam)
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
			"dataDiskInfoList":   dataDiskInfoList,
		}))
	} else {
		dataDiskInfoList, respStatus := handler.GetDataDiskListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
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
			"dataDiskInfoList":   dataDiskInfoList,
		}))
	}
}

// @Summary		Data Disk List 조회 (connection)
// @Description	[DataDiskListByRegion] Data Disk List를 connection으로 조회합니다.
// @Description	해당리전에 등록 된 DataDisk 목록. connection 필요
// @Description	UI 에서 용이하게 쓰기 위함 (콤보 선택용)
// @Tags			datadisk
// @Accept			json
// @Produce		json
// @Param			option			query		string	true	"option"
// @Param			filterValParam	query		string	true	"connectionName"
// @Success		200				{string}	string	"{'message':'success','status':'200','defaultNameSpaceID': namespaceID,'dataDiskInfoList': dataDiskInfoList,}"
// @Failure		500				{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/resources/datadisk/region/ [get]
func (a actions) DataDiskListByRegion(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	optionParam := c.Params().Get("option")
	filterKeyParam := "connectionName"
	filterValParam := c.Params().Get("connectionName")

	dataDiskInfoList, respStatus := handler.GetDataDiskListByOption(namespaceID, optionParam, filterKeyParam, filterValParam)
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
		"dataDiskInfoList":   dataDiskInfoList,
	}))
}

// @Summary		Data Disk 단건 조회
// @Description	[DataDiskGet] Data Disk를 dataDiskId로 조회합니다.
// @Tags			datadisk
// @Accept			json
// @Produce		json
// @Param			dataDiskId			path		string	true	"dataDiskId"
// @Success		200				{string}	string	"{'message':'success','status':'200','dataDiskInfo': dataDiskInfo}"
// @Failure		500				{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/resources/datadisk/id/{dataDiskId}/ [get]
func (a actions) DataDiskGet(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	paramDataDiskId := c.Param("dataDiskId")

	dataDiskInfo, respStatus := handler.DataDiskGet(namespaceID, paramDataDiskId)

	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ConnectionName = dataDiskInfo.ConnectionName
	viewConnection, err := handler.GetViewConnection(paramViewConnection)
	if err != nil {
		// cb에서 정보는 가져왔으니 오류로 뱉지는 않기.
	} else {
		dataDiskInfo.ProviderID = viewConnection.ProviderID
		dataDiskInfo.RegionName = viewConnection.RegionName
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":      "success",
		"status":       respStatus,
		"dataDiskInfo": dataDiskInfo,
	}))
}

// @Summary		Data Disk 변경
// @Description	[DataDiskPut] Data Disk를 변경합니다.
// @Tags			datadisk
// @Accept			json
// @Produce		json
// @Param			dataDiskId			path		string	true	"dataDiskId"
// @Param			dataDiskUpsizeReq	body		mcir.TbDataDiskUpsizeReq	true	"tbmcir.TbDataDiskUpsizeReq"
// @Success		200				{string}	string	"{'message':'success','status':'200','DataDiskInfo': DataDiskInfo}"
// @Failure		500				{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/resources/datadisk/id/{dataDiskId}/ [put]
func (a actions) DataDiskPut(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	paramDataDiskyId := c.Param("dataDiskId")
	dataDiskUpsizeReq := &tbmcir.TbDataDiskUpsizeReq{}
	if err := c.Bind(dataDiskUpsizeReq); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	resultDataDiskInfo, respStatus := handler.DataDiskPut(namespaceID, paramDataDiskyId, dataDiskUpsizeReq)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(respStatus.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":      "success",
		"status":       respStatus.StatusCode,
		"DataDiskInfo": resultDataDiskInfo,
	}))
}

// @Summary		Data Disk 삭제
// @Description	[DataDiskDel] Data Disk를 삭제합니다.
// @Tags			datadisk
// @Accept			json
// @Produce		json
// @Param			dataDiskId			path		string	true	"dataDiskId"
// @Success		200				{string}	string	"{'message':'success','status':'200'}"
// @Failure		500				{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/resources/datadisk/id/{dataDiskId}/ [DELETE]
func (a actions) DataDiskDel(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)
	namespaceName := c.Session().Get("current_namespace").(string)

	paramDataDiskId := c.Param("dataDiskId")

	respMessage, respStatus := handler.DelDataDisk(namespaceID, paramDataDiskId)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(500, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	// DB 등록 : mapping에 D로 저장할 때 사용된 connection 정보가 필요하여 조회
	connectionMapping := &models.CloudConnectionMapping{}
	connectionMapping.ResourceType = "datadisk"
	connectionMapping.NamespaceID = namespaceID
	connectionMapping.NamespaceName = namespaceName
	connectionMapping.ResourceID = paramDataDiskId

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

// @Summary		Available Data Disk List 조회
// @Description	[AvailableDataDiskTypeList] Provider, Region에서 사용가능한 DiskType 조회(DiskLookup)
// @Description	spider의 cloudos_meta.yaml 참조
// @Tags			datadisk
// @Accept			json
// @Produce		json
// @Param			providerId	query		string	true	"providerId"
// @Param			regionName	query		string	true	"regionName"
// @Success		200				{string}	string	"{'message':'success','status':'200','DiskInfoList':availableDiskTypeList}"
// @Failure		500				{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/resources/datadisk/lookup/ [get]
func (a actions) AvailableDataDiskTypeList(c buffalo.Context) error {
	//namespaceID := c.Session().Get("current_namespace_id").(string)

	paramProviderID := c.Params().Get("providerId")
	paramRegionName := c.Params().Get("regionName")

	availableDiskTypeList, err := handler.AvailableDiskTypeByProviderRegion(paramProviderID, paramRegionName)
	if err != nil {

	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":      "success",
		"status":       "success",
		"DiskInfoList": availableDiskTypeList,
	}))
}

// @Summary		Mcis Vm Available Data Disk List 조회
// @Description	[McisVmAvailableDataDiskList] VM 이사용가능한 DataDisk Id 목록 조회
// @Tags			datadisk
// @Accept			json
// @Produce		json
// @Param			mcisId	query		string	true	"mcisId"
// @Param			vmID	query		string	true	"vmID"
// @Success		200				{string}	string	"{'message':'success','status':'200','dataDiskInfoList':dataDiskInfoList}"
// @Failure		500				{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/resources/datadisk/availabledisk/ [get]
func (a actions) McisVmAvailableDataDiskList(c buffalo.Context) error {
	namespaceID := c.Session().Get("current_namespace_id").(string)

	mcisID := c.Params().Get("mcisId")
	vmID := c.Params().Get("vmId")

	//nameSpaceID string, mcisID string, vmID string
	dataDiskList, respStatus := handler.GetAvailableDataDiskListForVM(namespaceID, mcisID, vmID)
	log.Println("GetAvailableDataDiskListForVM result")
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":          "success",
		"status":           200,
		"dataDiskInfoList": dataDiskList,
	}))

}
