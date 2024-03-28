package actions

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/davecgh/go-spew/spew"
	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
	"github.com/pkg/errors"

	"mc_web_console_api/echomodel"
	"mc_web_console_api/echomodel/spider"
	"mc_web_console_api/echomodel/tumblebug/mcis"
	"mc_web_console_api/handler"
	"mc_web_console_api/models"
	"mc_web_console_api/models/views"
)

// CloudConnectionAllList
//
//	@Summary		모든 connection 조회
//	@Description	[CloudConnectionAllList] 모든 connection을 조회합니다.
//	@Tags			debug
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	models.CloudConnections
//	@Router			/api/test/connection/list/ [GET]
func (a actions) CloudConnectionAllList(c buffalo.Context) error {
	cloudConnections := models.CloudConnections{}
	err := models.DB.All(&cloudConnections)

	if err != nil {
		return errors.WithStack(err)
	}

	spew.Dump("context connection list", cloudConnections)

	ctx := context.WithValue(c, "connection_list", cloudConnections)
	cd := ctx.Value("connection_list").(models.CloudConnections)

	spew.Dump("context connection list", cd)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":             "success",
		"status":              "200",
		"cloudConnectionList": cloudConnections,
	}))
}

// connection 목록 조회
//
//	@Summary		CloudConnection 리스트 조회
//	@Description	[CloudConnectionList] connection 리스트를 조회합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			providerId	query		string	true	"providerId"
//	@Param			regionName	query		string	true	"regionName"
//	@Param			zoneName	query		string	true	"zoneName"
//	@Success		200			{object}	models.CloudConnections
//	@Router			/api/settings/connection/ [GET]
func (a actions) CloudConnectionList(c buffalo.Context) error {
	paramProviderId := c.Params().Get("providerId")
	paramRegionName := c.Params().Get("regionName")
	paramZoneName := c.Params().Get("zoneName")

	cloudConnections, err := handler.GetConnectionList(paramProviderId, paramRegionName, paramZoneName, c)

	if err != nil {
		return errors.WithStack(err)
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":          "success",
		"status":           "200",
		"ConnectionConfig": cloudConnections,
	}))

}

// connection 단건 조회
//
//	@Summary		connection 단건 조회
//	@Description	[CloudConnectionGet] connection 단건 조회합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			connectionId	path		string	true	"connectionId"
//	@Success		200				{object}	models.CloudConnections
//	@Router			/api/settings/connection/id/{connectionId}/ [GET]
func (a actions) CloudConnectionGet(c buffalo.Context) error {
	paramConnectionName := c.Param("connectionId")

	paramViewConnection := views.ViewCloudConnection{}
	paramViewConnection.ConnectionName = paramConnectionName
	cloudConnection, err := handler.GetViewConnection(paramViewConnection)
	if err != nil {
		return errors.WithStack(err)
	}
	return c.Render(http.StatusOK, r.JSON(cloudConnection))
}

// driver 목록 조회
//
//	@Summary		Driver 리스트 조회
//	@Description	[DriverList] driver 리스트 조회합니다. -- swagger TEST 오류 확인함.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Success		200	{array}	models.Driver
//	@Router			/api/settings/connection/driver/ [get]
func (a actions) DriverList(c buffalo.Context) error {
	drivers := []models.Driver{}

	paramDriver := &models.Driver{}
	if err := c.Bind(paramDriver); err != nil {
		return errors.WithStack(err)
	}

	tx := c.Value("tx").(*pop.Connection)
	err := tx.Eager().All(&drivers)
	if err != nil {
		return errors.WithStack(err)
	}

	return c.Render(http.StatusOK, r.JSON(drivers))
}

// driver 삭제
//
//	@Summary		Driver 삭제
//	@Description	[DriverDelete] Driver를 삭제합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			paramDriver	body		models.Driver	true	"models.Driver"
//	@Success		200			{object}	models.Driver
//	@Router			/api/settings/connection/driver/ [delete]
func (a actions) DriverDelete(c buffalo.Context) error {
	paramDriver := &models.Driver{}
	if err := c.Bind(paramDriver); err != nil {
		return errors.WithStack(err)
	}

	tx := c.Value("tx").(*pop.Connection)
	err := tx.Destroy(paramDriver)

	if err != nil {
		return errors.WithStack(err)
	}

	return c.Render(http.StatusOK, r.JSON("success"))
}

// RegionAllList 전체목록 조회
//
//	@Summary		Region 모든 리스트를 조회
//	@Description	[RegionAllList] Region의 모든 리스트를 조회합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Success		200	{array}	models.Region
//	@Router			/api/settings/connection/region/all [get]
func (a actions) RegionAllList(c buffalo.Context) error {
	regions := []models.Region{}
	paramRegion := &models.Region{}
	if err := c.Bind(paramRegion); err != nil {
		return errors.WithStack(err)
	}
	query := models.DB

	err := query.All(&regions)
	if err != nil {
		return errors.WithStack(err)
	}
	return c.Render(http.StatusOK, r.JSON(regions))
}

// RegionDelete 삭제
//
//	@Summary		Region 삭제
//	@Description	[RegionDelete] Region을 삭제합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			paramRegion	body		models.Region	true	"models.Region"
//	@Success		200			{object}	models.Driver
//	@Router			/api/settings/connection/region/ [delete]
func (a actions) RegionDelete(c buffalo.Context) error {
	paramRegion := &models.Region{}
	if err := c.Bind(paramRegion); err != nil {
		return errors.WithStack(err)
	}

	tx := c.Value("tx").(*pop.Connection)
	err := tx.Destroy(paramRegion)

	if err != nil {
		return errors.WithStack(err)
	}

	return c.Render(http.StatusOK, r.JSON("success"))
}

// credential 삭제
//
//	@Summary		Credential 삭제
//	@Description	[CredentialDelete] Credential 삭제합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			paramCredential	body		models.Credential	true	"models.Credential"
//	@Success		200				{string}	string				"success"
//	@Router			/api/settings/connection/credential/ [delete]
func (a actions) CredentialDelete(c buffalo.Context) error {
	paramCredential := &models.Credential{}
	if err := c.Bind(paramCredential); err != nil {
		return errors.WithStack(err)
	}

	tx := c.Value("tx").(*pop.Connection)
	err := tx.Destroy(paramCredential)

	if err != nil {
		return errors.WithStack(err)
	}

	return c.Render(http.StatusOK, r.JSON("success"))
}

// //////////////SPIDER 조회//////////////////////////
// SPIDER ConnectionList 목록조회
//
//	@Summary		SPIDER ConnectionList 목록조회
//	@Description	[SpiderConnectionList] SPIDER connection 리스트를 조회합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Success		200	{string}	string	{'message':'success','status':'respStatus','ConnectionConfig': 'cloudConnectionConfigList',}
//	@Router			/api/settings/connection/spider/ [GET]
func (a actions) SpiderConnectionList(c buffalo.Context) error {
	cloudConnectionConfigList, respStatus := handler.GetCloudConnectionConfigList()
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":          "success",
		"status":           respStatus,
		"ConnectionConfig": cloudConnectionConfigList,
	}))
}

// SPIDER ConnectionGet 단건조회
//
//	@Summary		SPIDER Connection 단건조회
//	@Description	[SpiderConnectionGet] SPIDER connection 단건을 조회합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			connectionId	path		string	true	"connectionId"
//	@Success		200				{string}	string	{'message':'success','status':'respStatus','ConnectionConfig': 'connectionInfo',}
//	@Router			/api/settings/connection/spider/id/{connectionId}/ [GET]
func (a actions) SpiderConnectionGet(c buffalo.Context) error {
	paramConfigName := c.Param("connectionId")

	connectionInfo, respStatus := handler.GetCloudConnectionConfigData(paramConfigName)

	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":          "success",
		"status":           respStatus,
		"ConnectionConfig": connectionInfo,
	}))
}

// ConnectionReg 등록 후 connection 목록조회
// SpiderConnectionReg -> CloudConnectionCreate로 변경
//
//	@Summary		CloudConnection 생성
//	@Description	[CloudConnectionCreate] ConnectionReg 등록 후 connection 목록조회
//	@Description	---- SpiderConnectionReg -> CloudConnectionCreate로 변경
//	@Description	---- is_cb 가 아니면 connection 등록 후 db 저장하도록 보완할 것.
//	@Description	---- TODO : SpiderCloudConnectionConfigReg 로 변경할 것
//	@Description	---- TODO : cloud_connections 저장 MconRegCloudConnection -> 저장실패시 생성한 connection 삭제하도록
//	@Description	---- TODO : cloud_connections table 조회하도록 변경할 것. : MconCloudConnectionList()
//	@Description	---- TODO : SpiderCloudConnectionConfigList 로 변경할 것.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			is_cb	query		string	true	"is_cb"
//	@Success		200		{string}	string	{'message':'success','status':'respStatus','ConnectionConfig': 'connectionInfo',}
//	@Router			/api/settings/connection/ [post]
func (a actions) CloudConnectionCreate(c buffalo.Context) error {

	is_cb := c.Params().Get("is_cb")

	connectionInfo := new(spider.CloudConnectionConfigInfo)
	if err := c.Bind(connectionInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	if is_cb == "N" {
		// is_cb 가 아니면 connection 등록 후 db 저장하도록 보완할 것.
		respBody, respStatus := handler.RegCloudConnectionConfig(connectionInfo) // TODO : SpiderCloudConnectionConfigReg 로 변경할 것
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"message": respStatus.Message,
				"status":  respStatus.StatusCode,
			}))
		}
		fmt.Println("=============respBody =============", respBody)

		// TODO : cloud_connections 저장 MconRegCloudConnection -> 저장실패시 생성한 connection 삭제하도록

		// 등록 후 목록 조회
		// TODO : cloud_connections table 조회하도록 변경할 것. : MconCloudConnectionList()
		cloudConnectionList, cloudConnectionConfigErr := handler.GetCloudConnectionConfigList() // TODO : SpiderCloudConnectionConfigList 로 변경할 것.
		if cloudConnectionConfigErr.StatusCode != 200 && cloudConnectionConfigErr.StatusCode != 201 {
			return c.Render(cloudConnectionConfigErr.StatusCode, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":          "success",
			"status":           respStatus,
			"ConnectionConfig": cloudConnectionList,
		}))
	}

	respBody, respStatus := handler.RegCloudConnectionConfig(connectionInfo)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message": respStatus.Message,
			"status":  respStatus.StatusCode,
		}))
	}
	fmt.Println("=============respBody =============", respBody)

	cloudConnectionList, cloudConnectionConfigErr := handler.GetCloudConnectionConfigList()
	if cloudConnectionConfigErr.StatusCode != 200 && cloudConnectionConfigErr.StatusCode != 201 {
		return c.Render(cloudConnectionConfigErr.StatusCode, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":          "success",
		"status":           respStatus,
		"ConnectionConfig": cloudConnectionList,
	}))
}

// ConnectionDelete 삭제
// SpiderConnectionDelete -> CloudConnectionDel로 변경
//
//	@Summary		Connection 삭제
//	@Description	[CloudConnectionDelete] Connection을 삭제합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			paramConfigName	path		string	true	"paramConfigName"
//	@Param			is_cb			query		string	true	"is_cb"
//	@Success		200				{string}	string	"success"
//	@Router			/api/settings/connection/id/{configName}/ [delete]
func (a actions) CloudConnectionDelete(c buffalo.Context) error {
	is_cb := c.Params().Get("is_cb")
	paramConfigName := c.Param("configName")

	respBody, respStatus := handler.DelCloudConnectionConfig(paramConfigName)
	fmt.Println("=============respBody =============", respBody)
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	if is_cb == "N" {
		// TODO : DB(cloud_connections)에서 connection 삭제처리
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus,
	}))
}

// SpiderConnectionMod -> CloudConnectionUpdate
//
//	@Summary		Cloud Connection을 업데이트 -- not implementated yet
//	@Description	[CloudConnectionUpdate] Cloud Connection을 수정합니다. -- not implementated yet
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Success		200	{string}	string	"{'message': 'success','status':  'not implementated yet',}"
//	@Router			/api/settings/connection/ [PUT]
func (a actions) CloudConnectionUpdate(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  "not implementated yet",
	}))
}

// SpiderDriverList default implementation.
//
//	@Summary		Spider Driver 리스트 조회
//	@Description	[SpiderDriverList] Spider Driver 리스트를 조회합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Success		200	{string}	string	"{'message': 'success','status': 'respStatus','Driver': 'driverList',}"
//	@Router			/api/settings/connection/driver/spider/ [get]
func (a actions) SpiderDriverList(c buffalo.Context) error {
	driverList, respStatus := handler.GetDriverList()
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus,
		"Driver":  driverList,
	}))
}

// @Summary		Driver 단건 조회
// @Description	[DriverGet] Driver를 단건 조회합니다.
// @Tags			connection
// @Accept			json
// @Produce		json
// @Param			driver	path		string	true	"driver"
// @Param			is_cb	query		string	true	"is_cb"
// @Success		200		{string}	string	"{'message': 'success','status': 'respStatus','Driver': 'driverInfo',}"
// @Router			/api/settings/connection/driver/id/{driverId}/ [get]
func (a actions) DriverGet(c buffalo.Context) error {
	is_cb := c.Params().Get("is_cb")
	paramDriver := c.Param("driver")

	if is_cb == "N" {
		mconDriver, err := handler.MconDriverGet(c)
		if err != nil {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": 500,
			}))
		}

		driverInfo := spider.DriverInfo{}
		driverInfo.ProviderName = mconDriver.ProviderID
		driverInfo.DriverName = mconDriver.DriverName
		driverInfo.DriverLibFileName = mconDriver.LibFileName

		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message": "success",
			"status":  "200",
			"Driver":  driverInfo,
		}))

	}

	driverInfo, respStatus := handler.SpiderDriverGet(paramDriver) // TODO : SpiderDriverGet

	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus,
		"Driver":  driverInfo,
	}))
}

// SpiderDriverForm default implementation.
//
//	@Summary		Driver 생성
//	@Description	[DriverCreate] Driver를 생성합니다.
//	@Description	SpiderDriverReg 등록 -> DriverCreate 로 변경 /settings/connection/driver
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			paramdriverInfoDriver	body	spider.DriverInfo	true	"spider.DriverInfo"
//	@Param			is_cb					query	string				true	"is_cb"
//	@Success		200						{json}	{"message": "success","status":  "respStatus",}
//	@Failure		201						{json}	{"error":  respStatus.Message,"status": respStatus.StatusCode,}
//	@Failure		500						{json}	{"error":  err.Error(),"status": 500,}"
//	@Router			/api/settings/connection/driver/ [post]
func (a actions) DriverCreate(c buffalo.Context) error {
	is_cb := c.Params().Get("is_cb")

	driverInfo := new(spider.DriverInfo)
	err := c.Bind(driverInfo)
	if err != nil {
		return errors.WithStack(err)
	}

	log.Println(driverInfo)
	respBody, respStatus := handler.RegDriver(driverInfo) // TODO : SpiderDriverReg 로 변경할 것.
	fmt.Println("=============respBody =============", respBody)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	if is_cb == "N" {
		paramDriver := &models.Driver{}
		paramDriver.Provider.ProviderID = driverInfo.ProviderName
		paramDriver.DriverName = driverInfo.DriverName
		paramDriver.LibFileName = driverInfo.DriverLibFileName

		//if err := c.Bind(paramDriver); err != nil {
		//	return errors.WithStack(err)
		//}

		err := handler.MconDriverCreate(paramDriver, c)
		if err != nil {
			// TODO : 저장실패면 삭제 DelDriver 호출 추가
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": 500,
			}))
		}
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus,
	}))
}

// SpiderDriverDelete 삭제
//
//	@Summary		Spider Driver 삭제
//	@Description	[SpiderDriverDelete] Spider Driver를 삭제합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			driver	path		string	true	"driver"
//	@Success		200		{string}	string	"{'message': 'success','status': 'respStatus'}"
//	@Router			/api/settings/connection/driver/spider/id/{driver}/ [delete]
func (a actions) SpiderDriverDelete(c buffalo.Context) error {
	paramDriver := c.Param("driver")

	respBody, respStatus := handler.DelDriver(paramDriver)
	fmt.Println("=============respBody =============", respBody)
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus,
	}))
}

// @Summary		Credential 리스트 조회
// @Description	[CredentialList] Credential 리스트를 조회합니다.
// @Description	SpiderCredentialList -> CredentialList 으로 변경 GET
// @Tags			connection
// @Accept			json
// @Produce		json
// @Param			is_cb	query	string	true	"is_cb"
// @Success		200		{json}	{"message":"success","status":"200","Credential": credentialList,}
// @Failure		500		{json}	{"error":  err.Error(),"status": "500",}
// @Router			/api/settings/connection/credential/ [get]
func (a actions) CredentialList(c buffalo.Context) error {
	is_cb := c.Params().Get("is_cb")

	if is_cb == "N" {
		paramCredential := &models.Credential{}
		if err := c.Bind(paramCredential); err != nil {
			return errors.WithStack(err)
		}

		credentialList, err := handler.MconCredentialList(paramCredential, c)
		if err != nil {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}
		// TODO : credentialList 를 기존 사용하던 양식에 맞게 형태 변경 필요
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":    "success",
			"status":     "200",
			"Credential": credentialList,
		}))
	}

	credentialList, respStatus := handler.GetCredentialList()
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":    "success",
		"status":     respStatus,
		"Credential": credentialList,
	}))
}

// CredentialGet 단건조회
//
//	@Summary		Credential 단건 조회
//	@Description	[CredentialGet] Credential 단건 조회합니다
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			credential	path		string	true	"iscredential_cb"
//	@Param			is_cb		query		string	true	"is_cb"
//	@Success		200			{string}	string	"{'message':'success','status':'200','Credential': 'credentialInfo',}"
//	@Failure		500			{string}	string	"{'error':  err.Error(),'status': '500',}"
//	@Router			/api/settings/connection/credential/id/{credential}/ [get]
func (a actions) CredentialGet(c buffalo.Context) error {
	is_cb := c.Params().Get("is_cb")
	paramCredential := c.Param("credential")

	if is_cb == "N" {
		paramCredential := &models.Credential{}
		if err := c.Bind(paramCredential); err != nil {
			return errors.WithStack(err)
		}
		credentialInfo, err := handler.MconCredentialGet(paramCredential)
		if err != nil {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}
		// TODO : credentialInfo를 기존에 사용하던 형태로 변경 필요
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message":    "success",
			"status":     "200",
			"Credential": credentialInfo,
		}))
	}

	credentialInfo, respStatus := handler.GetCredentialData(paramCredential)
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":    "success",
		"status":     respStatus,
		"Credential": credentialInfo,
	}))
}

// CredentialCreate 등록
//
//	@Summary		Credential 생성
//	@Description	[CredentialCreate] Credential을 생성합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			credentialInfo	body		spider.CredentialInfo	true	"spider.CredentialInfo"
//	@Success		200				{string}	string					"{'message':'success','status':'200',}"
//	@Failure		500				{string}	string					"{'error':  err.Error(),'status': '500',}"
//	@Router			/api/settings/connection/credential/ [post]
func (a actions) CredentialCreate(c buffalo.Context) error {
	credentialInfo := new(spider.CredentialInfo)
	err := c.Bind(credentialInfo)
	if err != nil {
		return errors.WithStack(err)
	}
	log.Println(credentialInfo)
	respBody, respStatus := handler.RegCredential(credentialInfo) // TODO : SpiderCredentialCreate로 이름 변경할 것
	fmt.Println("=============respBody =============", respBody)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	is_cb := c.Params().Get("is_cb")

	if is_cb == "N" {
		paramCredential := &models.Credential{}
		if err := c.Bind(paramCredential); err != nil {
			return errors.WithStack(err)
		}

		err := handler.MconCredentialCreate(paramCredential, c)
		if err != nil {
			// TODO : 저장 실패면 spiderCredentialDel 로 지우는 것 추가할것.

			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus,
	}))
}

// ProviderRegionList 목록
//
//	@Summary		Region 리스트 조회
//	@Description	[RegionList] Region 리스트를 조회합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			is_cb			query		string	true	"is_cb"
//	@Param			filterKeyParam	query		string	true	"filterKeyParam"
//	@Param			filterValParam	query		string	true	"filterValParam"
//	@Success		200				{string}	string	"{'message':'success','status':'200','Region':'regionList'}"
//	@Failure		500				{string}	string	"{'error':  err.Error(),'status': '500',}"
//	@Router			/api/settings/connection/region/ [get]
func (a actions) RegionList(c buffalo.Context) error {
	is_cb := c.Params().Get("is_cb")
	filterKeyParam := c.Params().Get("filterKey")
	filterValParam := c.Params().Get("filterVal")
	log.Println("filterKeyParam", filterKeyParam)
	log.Println("filterValParam", filterValParam)

	if is_cb == "N" {
		paramRegion := &models.Region{}

		if filterKeyParam == "providerId" {
			paramRegion.ProviderID = filterValParam
		}
		// if err := c.Bind(paramRegion); err != nil {
		// 	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		// 		"error":  err.Error(),
		// 		"status": "500",
		// 	}))
		// }
		regions, err := handler.MconRegionList(paramRegion, c)
		if err != nil {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}

		// 가져온 게 있으면 return 형태를 spider에서 가져온 형태와 맞춰주기
		// 가져온 게 있으면 return 형태를 spider에서 가져온 형태와 맞춰주기
		returnRegionList := []spider.RegionInfo{}
		if len(regions) > 0 {
			for _, region := range regions {
				spiderRegionInfo := spider.RegionInfo{}
				spKeyValueList := spider.SpKeyValueList{}
				regionName := ""
				for _, keyval := range region.RegionKeyValue {
					spiderKeyValue := spider.SpKeyValueInfo{}
					spiderKeyValue.Key = keyval.Key
					spiderKeyValue.Value = keyval.Value
					spKeyValueList = append(spKeyValueList, spiderKeyValue)

					if strings.ToLower(keyval.Key) == "region" || strings.ToLower(keyval.Key) == "location" {
						regionName = keyval.Value
					}
				}
				spiderRegionInfo.ProviderName = region.ProviderID
				//spiderRegionInfo.RegionName = region.RegionName
				spiderRegionInfo.RegionName = regionName
				spiderRegionInfo.KeyValueInfoList = spKeyValueList

				returnRegionList = append(returnRegionList, spiderRegionInfo)
			}
		}
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message": "success",
			"status":  "200",
			"Region":  returnRegionList,
		}))
	}

	//MconRegionList
	regionList, respStatus := handler.GetRegionList() // TODO : SpiderRegionList 로 이름 변경 필요
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus,
		"Region":  regionList,
	}))
}

// ProviderRegionList 목록
//
//	@Summary		Region 단건 조회
//	@Description	[RegionGet] Region 단건 조회합니다.
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Param			paramRegion	path		string	true	"paramRegion"
//	@Param			is_cb		query		string	true	"is_cb"
//	@Success		200			{string}	string	"{'message':'success','status':'respStatus','Region':'resionInfo'}"
//	@Failure		500			{string}	string	"{'error':  err.Error(),'status': '500',}"
//	@Router			/api/settings/connection/region/id/{paramRegion}/ [get]
func (a actions) RegionGet(c buffalo.Context) error {
	is_cb := c.Params().Get("is_cb")
	paramRegion := c.Param("region")

	if is_cb == "N" {
		paramRegion := &models.Region{}
		if err := c.Bind(paramRegion); err != nil {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}
		region, err := handler.MconRegionGet(paramRegion)
		if err != nil {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}

		// TODO : region 을 사용하는 형태로 추출 필요
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message": "success",
			"status":  "200",
			"Region":  region,
		}))
	}

	resionInfo, respStatus := handler.GetRegionData(paramRegion) // TODO : SpiderRegionGet 으로 변경할 것

	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus,
		"Region":  resionInfo,
	}))
}

// @Summary		Region 생성
// @Description	[RegionCreate] Region을 생성합니다.
// @Tags			connection
// @Accept			json
// @Produce		json
// @Param			regionInfo	body		spider.RegionInfo	true	"spider.RegionInfo"
// @Param			is_cb		query		string				true	"is_cb"
// @Success		200			{string}	string				"{'message':'success','status':'200',}"
// @Failure		500			{string}	string				"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/connection/region/ [post]
func (a actions) RegionCreate(c buffalo.Context) error {
	is_cb := c.Params().Get("is_cb")
	regionInfo := new(spider.RegionInfo)
	err := c.Bind(regionInfo)
	if err != nil {
		return errors.WithStack(err)
	}
	log.Println(regionInfo)
	respBody, respStatus := handler.RegRegion(regionInfo) // TODO : SpiderRegionReg 로 이름 변경할 것
	fmt.Println("=============respBody =============", respBody)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	if is_cb == "N" {
		paramRegion := &models.Region{}
		if err := c.Bind(paramRegion); err != nil {
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}

		err := handler.MconRegionCreate(paramRegion, c)
		if err != nil {
			// TODO : 저장 실패시 region 삭제 호출 필요
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": "500",
			}))
		}
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  respStatus,
	}))
}

// CloudProviderList 목록
//
//	@Summary		Cloud Provider 리스트 조회
//	@Description	[CloudProviderList] Cloud Provider 리스트를 조회합니다.
//	@Description	DB에서 가져오게 할 것인가?
//	@Description	SpiderProviderList 삭제 함 23.07.06
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Success		200	{string}	string	"{'message':'success','status':'respStatus','Region':'resionInfo'}"
//	@Failure		500	{string}	string	"{'error':  err.Error(),'status': '500',}"
//	@Router			/api/settings/connection/providers/ [get]
func (a actions) CloudProviderList(c buffalo.Context) error {
	cloudOsList, respStatus := handler.GetCloudOSList()
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(respStatus))
	}

	return c.Render(http.StatusOK, r.JSON(cloudOsList))
}

// 사용가능한 connection config 목록 조회
// Check avaiable ConnectionConfig list for creating MCIS Dynamically
//
//	@Summary		사용가능한 Cloud Connection 리스트 조회
//	@Description	[AvailableCloudConnectionList] 사용가능한 Cloud Connection  목록을 조회합니다. Check avaiable ConnectionConfig list for creating MCIS Dynamically
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Success		200	{string}	string	"{'message':'success','status':'respStatus'}"
//	@Failure		500	{string}	string	"{'error':  err.Error(),'status': '500',}"
//	@Router			/api/settings/connection/available/ [get]
func (a actions) AvailableCloudConnectionList(c buffalo.Context) error {
	mcisReq := new(mcis.McisConnectionConfigCandidatesReq)
	checkMcisDynamicReqInfo, respStatus := handler.GetMcisDynamicCheckList(mcisReq)
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(respStatus))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":         respStatus.Message,
		"status":          respStatus.StatusCode,
		"mcisDynamicInfo": checkMcisDynamicReqInfo,
	}))
}

// @Summary		credential로 가능한 Connection 조회
// @Description	[TestCloudConnection] credential로 가능한 Connection 조회합니다.
// @Tags			debug
// @Accept			json
// @Produce		json
// @Param			credential	body		models.Credentials	true	"models.Credentials"
// @Success		200			{string}	string				"{'message':'success','status':'respStatus'}"
// @Failure		500			{string}	string				"{'error':  err.Error(),'status': '500',}"
// @Router			/api/test/connection/list/bycred [post]
func (a actions) TestCloudConnection(c buffalo.Context) error {
	tx := c.Value("tx").(*pop.Connection)
	credential := &models.Credentials{}
	err := tx.Eager().All(credential)
	spew.Dump("======credential=======")
	spew.Dump(credential)
	spew.Dump("======credential=======")

	if err != nil {
		return err
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// CB 조회내역을 DB 에 저장
//
//	@Summary		CloudProvider 동기화
//	@Description	[SyncCloudProvider] CB 조회내역을 DB 에 저장합니다. CloudProvider 동기화[handler.SyncCloudProvider(c)]
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Success		200	{string}	string	"{'message':'success','status':'respStatus'}"
//	@Failure		500	{string}	string	"{'error':  err.Error(),'status': '500',}"
//	@Router			/api/settings/connection/provider/sync/ [get]
func (a actions) SyncCloudProvider(c buffalo.Context) error {
	err := handler.SyncCloudProvider(c)
	if err != nil {
		return err
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// @Summary		Driver 동기화
// @Description	[SyncDriver] CB 조회내역을 DB 에 저장합니다. Driver 동기화[handler.SyncDriver(c)]
// @Tags			connection
// @Accept			json
// @Produce		json
// @Success		200	{string}	string	"{'message':'success','status':'respStatus'}"
// @Failure		500	{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/connection/driver/sync/ [get]
func (a actions) SyncDriver(c buffalo.Context) error {
	err := handler.SyncDriver(c)
	if err != nil {
		return err
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// @Summary		Region 동기화
// @Description	[SyncRegion] CB 조회내역을 DB 에 저장합니다. Region 동기화[handler.SyncRegion(c)]
// @Tags			connection
// @Accept			json
// @Produce		json
// @Success		200	{string}	string	"{'message':'success','status':'respStatus'}"
// @Failure		500	{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/connection/region/sync/ [get]
func (a actions) SyncRegion(c buffalo.Context) error {
	err := handler.SyncRegion(c)
	if err != nil {
		return err
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// @Summary		Credential 동기화
// @Description	[SyncCredential] CB 조회내역을 DB 에 저장합니다. Credential 동기화[handler.SyncCredential(c)]
// @Tags			connection
// @Accept			json
// @Produce		json
// @Success		200	{string}	string	"{'message':'success','status':'respStatus'}"
// @Failure		500	{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/connection/credential/sync/ [get]
func (a actions) SyncCredential(c buffalo.Context) error {
	err := handler.SyncCredential(c)
	if err != nil {
		return err
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// @Summary		Connection 동기화
// @Description	[SyncConnection] CB 조회내역을 DB 에 저장합니다. Connection 동기화[handler.SyncConnection(c)]
// @Tags			connection
// @Accept			json
// @Produce		json
// @Success		200	{string}	string	"{'message':'success','status':'respStatus'}"
// @Failure		500	{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/connection/sync/ [get]
func (a actions) SyncConnection(c buffalo.Context) error {
	err := handler.SyncConnection(c)
	if err != nil {
		return err
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// @Summary		credential 별 지정 Provider 모든 region 생성
// @Description	[GenerateConnectionsByCredential] credential 별로 지정 Provider의 모든 region에 대해 connection 생성.
// @Tags			connection
// @Accept			json
// @Produce		json
// @Param			providerId		query		string	true	"providerId"
// @Param			credentialName	query		string	true	"credentialName"
// @Success		200				{string}	string	"{'message':'success','status':'respStatus'}"
// @Failure		500				{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/connection/generate/bycredential [get]
func (a actions) GenerateConnectionsByCredential(c buffalo.Context) error {
	paramProviderID := c.Params().Get("providerId")
	paramCredentialName := c.Params().Get("credentialName")

	log.Println(c.Params())
	log.Println("paramProviderID ", paramProviderID)
	log.Println("paramCredentialName ", paramCredentialName)
	err := handler.GenerateConnectionsByCredential(paramProviderID, paramCredentialName, c)
	if err != nil {
		return err
	}
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// @Summary		credential 별 모든 region connection 생성
// @Description	[GenerateConnectionsByAllCredential] credential 별로 지정 Provider의 모든 region에 대해 connection 생성.
// @Description	- 모든 credential에 대해 connection 생성 genconnection
// @Description	- handler.GetCredentialList()
// @Description	- (현재 설정된 credential 목록 : 목록에서는 key의 value는 ...으로 표시)
// @Tags			connection
// @Accept			json
// @Produce		json
// @Success		200	{string}	string	"{'message':'success','status':'respStatus'}"
// @Failure		500	{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/connection/generate/all/bycredential [get]
func (a actions) GenerateConnectionsByAllCredential(c buffalo.Context) error {

	credentialList, respStatus := handler.GetCredentialList()
	if respStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}
	for _, credential := range credentialList {

		err := handler.GenerateConnectionsByCredential(credential.ProviderName, credential.CredentialName, c)
		if err != nil {
			log.Println("credential", credential)
			log.Println("Connection Create failed", err)
		}
		break
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// @Summary		Framework Health Check
// @Description	[FrameworkHealthCheck] 프레임워크 헬스체크
// @Description	- c.Params().Get("framework")
// @Description	- DF의 response 에서 return결과가 ""으로 들어와 204를 return 함.
// @Description	- DF에서 정상적인 message 보내라고 할 것.
// @Tags			connection
// @Accept			json
// @Produce		json
// @Success		200	{string}	string	"{'message':'success','status':'respStatus'}"
// @Failure		500	{string}	string	"{'error':  err.Error(),'status': '500',}"
// @Router			/api/settings/connection/healthcheck/framework/ [get]
func (a actions) FrameworkHealthCheck(c buffalo.Context) error {
	framework := c.Params().Get("framework")

	respStatus := echomodel.WebStatus{}

	if strings.EqualFold(framework, "SPIDER") {
		respStatus = handler.GetSpiderHealthCheck()
	} else if strings.EqualFold(framework, "TUMBLEBUG") {
		respStatus = handler.GetTumblebugHealthCheck()
	} else if strings.EqualFold(framework, "LADYBUG") {
	} else if strings.EqualFold(framework, "DRAGONFLY") {
		respStatus = handler.GetDragonflyHealthCheck()
	}

	// DF의 response 에서 return결과가 ""으로 들어와 204를 return 함. -> DF에서 정상적인 message 보내라고 할 것.
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 && respStatus.StatusCode != 204 {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  framework + respStatus.Message,
			"status": respStatus.StatusCode,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": framework + " success",
		"status":  respStatus.StatusCode,
	}))
}

// MCIS 또는 VM 에 agent 상태 확인
//
//	@Summary		Agent Health Check -- TODO
//	@Description	[AgentHealthCheck] MCIS 또는 VM 에 agent 상태 확인
//	@Tags			connection
//	@Accept			json
//	@Produce		json
//	@Success		200	{string}	string	"{'message':'success','status':'respStatus'}"
//	@Failure		500	{string}	string	"{'error':  err.Error(),'status': '500',}"
//	@Router			/api/settings/connection/healthcheck/agent/ [get]
func (a actions) AgentHealthCheck(c buffalo.Context) error {
	// MCIS / MCKS

	//namespaceID := c.Session().Get("current_namespace_id").(string)

	//serviceType := c.Param("serviceType")
	//serviceId := c.Param("serviceId")
	//log.Println("mcisId= " + mcisID)
	//optionParam := c.Params().Get("option")
	serviceType := c.Params().Get("serviceType")
	//serviceId := c.Params().Get("serviceId")

	//TB: benchmark agent, DF :monitoring agent(port:8888)

	//handler.GetAgentStatus(namespaceID, serviceType, serviceId)
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": serviceType + " success",
		"status":  "200",
	}))
}
