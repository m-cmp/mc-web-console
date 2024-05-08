package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"strings"

	// "strings"
	"bytes"

	// "math"
	"net/http"
	// "strconv"
	// "sync"
	//"io/ioutil"
	//"github.com/davecgh/go-spew/spew"

	// spider "mc_web_console_api/fwmodels/spider"

	fwmodels "mc_web_console_api/fwmodels"
	"mc_web_console_api/fwmodels/spider"
	"mc_web_console_api/models"
	"mc_web_console_api/models/views"

	tbcommon "mc_web_console_api/fwmodels/tumblebug/common"

	util "mc_web_console_api/util"

	"github.com/davecgh/go-spew/spew"
	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
)

// 목록 : ListData
// 1개 : Data
// 등록 : Reg
// 삭제 : Del

// Cloud Provider 목록
type GVC struct {
	VC views.ViewCloudConnection
}

// Get Framework Health : spider를 호출하여 결과가 있으면 OK
func GetSpiderHealthCheck() fwmodels.WebStatus {
	_, respStatus := GetCloudOSList()

	return respStatus
}

// Get Framework Health
func GetTumblebugHealthCheck() fwmodels.WebStatus {
	var originalUrl = "/health"
	urlParam := util.MappingUrlParameter(originalUrl, nil)
	url := util.TUMBLEBUG + urlParam

	resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode
	log.Println(respBody)

	return fwmodels.WebStatus{StatusCode: respStatus}
}

// Get Framework Health
func GetDragonflyHealthCheck() fwmodels.WebStatus {
	var originalUrl = "/healthcheck"
	urlParam := util.MappingUrlParameter(originalUrl, nil)
	url := util.DRAGONFLY + urlParam

	resp, err := util.CommonHttpWithoutParam(url, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode
	log.Println(respBody)

	return fwmodels.WebStatus{StatusCode: respStatus}
}

func GetCloudOSList() ([]string, fwmodels.WebStatus) {

	var originalUrl = "/cloudos"
	urlParam := util.MappingUrlParameter(originalUrl, nil)
	url := util.SPIDER + urlParam

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer resp.Close()
	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	cloudOs := map[string][]string{}
	json.NewDecoder(respBody).Decode(&cloudOs)
	fmt.Println(cloudOs["cloudos"])

	return cloudOs["cloudos"], fwmodels.WebStatus{StatusCode: respStatus}
}

// provider 별 connection count, connection 있는 provider 수
func GetCloudConnectionCountMap(cloudConnectionConfigInfoList []spider.CloudConnectionConfigInfo) (map[string]int, int) {
	connectionConfigCountMap := make(map[string]int)
	for _, connectionInfo := range cloudConnectionConfigInfoList {
		count := 0
		val, exists := connectionConfigCountMap[util.GetProviderName(connectionInfo.ProviderName)]
		if !exists {
			count = 1
		} else {
			count = val + 1
		}
		connectionConfigCountMap[util.GetProviderName(connectionInfo.ProviderName)] = count
	}

	providerCount := 0
	for i, _ := range connectionConfigCountMap {
		if i == "" {
		}
		providerCount++
	}
	return connectionConfigCountMap, providerCount
}

// 현재 설정된 connection 목록 GetConnectionConfigListData -> GetCloudConnectionConfigList로 변경
func GetCloudConnectionConfigList() ([]spider.CloudConnectionConfigInfo, fwmodels.WebStatus) {
	var originalUrl = "/connectionconfig"
	urlParam := util.MappingUrlParameter(originalUrl, nil)
	url := util.SPIDER + urlParam

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer body.Close()

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	cloudConnectionConfigInfo := map[string][]spider.CloudConnectionConfigInfo{}
	json.NewDecoder(respBody).Decode(&cloudConnectionConfigInfo)
	fmt.Println(cloudConnectionConfigInfo["connectionconfig"])

	return cloudConnectionConfigInfo["connectionconfig"], fwmodels.WebStatus{StatusCode: respStatus}
}

// Connection 상세
func GetCloudConnectionConfigData(configName string) (spider.CloudConnectionConfigInfo, fwmodels.WebStatus) {
	var originalUrl = "/connectionconfig/{{config_name}}"

	var paramMapper = make(map[string]string)
	paramMapper["{{config_name}}"] = configName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.SPIDER + urlParam

	// url := util.SPIDER + "/connectionconfig/" + configName
	fmt.Println("=========== GetCloudConnectionConfigData : ", configName)
	cloudConnectionConfigInfo := spider.CloudConnectionConfigInfo{}

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer body.Close()

	if err != nil {
		fmt.Println(err)
		return cloudConnectionConfigInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&cloudConnectionConfigInfo)
	fmt.Println(cloudConnectionConfigInfo)
	return cloudConnectionConfigInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

// CloudConnectionConfigInfo 등록
// func RegCloudConnectionConfig(cloudConnectionConfigInfo *fwmodels.CloudConnectionConfigInfo) (io.ReadCloser, fwmodels.WebStatus) {
func RegCloudConnectionConfig(cloudConnectionConfigInfo *spider.CloudConnectionConfigInfo) (*spider.CloudConnectionConfigInfo, fwmodels.WebStatus) {
	var originalUrl = "/connectionconfig"
	urlParam := util.MappingUrlParameter(originalUrl, nil)

	url := util.SPIDER + urlParam
	// buff := bytes.NewBuffer(pbytes)
	// url := util.SPIDER + "/connectionconfig"

	fmt.Println("cloudConnectionConfigInfo : ", cloudConnectionConfigInfo)

	// body, err := util.CommonHttpPost(url, regionInfo)
	pbytes, _ := json.Marshal(cloudConnectionConfigInfo)
	// body, err := util.CommonHttpPost(url, pbytes)
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)
	// if err != nil {
	// 	fmt.Println(err)
	// 	return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	// }

	// respBody := resp.Body
	// respStatus := resp.StatusCode
	//cloudConnectionConfigInfo
	// return respBody, fwmodels.WebStatus{StatusCode: respStatus}

	returnCloudConnectionConfigInfo := spider.CloudConnectionConfigInfo{}
	if err != nil {
		fmt.Println(err)
		return &returnCloudConnectionConfigInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	returnStatus := fwmodels.WebStatus{}
	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		errorInfo := fwmodels.ErrorInfo{}
		json.NewDecoder(respBody).Decode(&errorInfo)
		fmt.Println("respStatus != 200 reason ", errorInfo)
		returnStatus.Message = errorInfo.Message
	} else {
		json.NewDecoder(respBody).Decode(&returnCloudConnectionConfigInfo)
		fmt.Println(returnCloudConnectionConfigInfo)
	}
	returnStatus.StatusCode = respStatus

	return &returnCloudConnectionConfigInfo, returnStatus
}

// CloudConnectionConfigInfo 삭제
func DelCloudConnectionConfig(configName string) (io.ReadCloser, fwmodels.WebStatus) {
	var originalUrl = "/connectionconfig/{{config_name}}"

	var paramMapper = make(map[string]string)
	paramMapper["{{config_name}}"] = configName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.SPIDER + urlParam

	// buff := bytes.NewBuffer(pbytes)
	// url := util.SPIDER + "/connectionconfig/" + configName

	fmt.Println("DelCloudConnectionConfig : ", configName)

	// body, err := util.CommonHttpPost(url, regionInfo)

	pbytes, _ := json.Marshal(configName)
	// body, err := util.CommonHttpDelete(url, pbytes)
	resp, err := util.CommonHttp(url, pbytes, http.MethodDelete)

	if err != nil {
		log.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// return body, err
	respBody := resp.Body
	respStatus := resp.StatusCode

	return respBody, fwmodels.WebStatus{StatusCode: respStatus}
}

// 현재 설정된 region 목록
func GetRegionList() ([]spider.RegionInfo, fwmodels.WebStatus) {
	var originalUrl = "/region"
	urlParam := util.MappingUrlParameter(originalUrl, nil)

	url := util.SPIDER + urlParam

	// url := util.SPIDER + "/region"
	// fmt.Println("=========== GetRegionListData : ", url)

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer body.Close()

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	regionList := map[string][]spider.RegionInfo{}
	json.NewDecoder(respBody).Decode(&regionList)
	//fmt.Println(regionList["region"])

	return regionList["region"], fwmodels.WebStatus{StatusCode: respStatus}
}

func MconRegionList(region *models.Region, c buffalo.Context) ([]models.Region, error) {
	regions := []models.Region{}

	// query := models.DB.Q()
	// // if region.ID.String() != "" {
	// // 	query = query.Where("id = ", region.ID)
	// // }
	// if region.ProviderID != "" {
	// 	query = query.Where("provider_id = ? ", region.ProviderID)
	// }
	// err := query.All(&regions)
	// // err := query.All(&regions)

	tx := c.Value("tx").(*pop.Connection)
	// err := tx.Eager().All(&regions)
	query := tx.Eager().Q()

	query.Where("provider_id = ? ", region.ProviderID)

	err := query.All(&regions)
	if err != nil {
		log.Println("mconRegionList err ", err)
		return regions, err
	}

	return regions, nil
}

func GetRegionData(regionName string) (*tbcommon.TbRegion, fwmodels.WebStatus) {
	var originalUrl = "/region/{regionName}"

	var paramMapper = make(map[string]string)
	paramMapper["{regionName}"] = regionName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.SPIDER + urlParam

	// url := util.SPIDER + "/region/" + regionName
	fmt.Println("=========== GetRegionData : ", regionName)

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer body.Close()
	// regionInfo := spider.RegionInfo{}
	regionInfo := tbcommon.TbRegion{}
	if err != nil {
		fmt.Println(err)
		return &regionInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	// regionList := map[string][]string{}
	// // regionList := map[string][]spider.RegionInfo{}
	// json.NewDecoder(body).Decode(&regionList)
	// fmt.Println(regionList)	// map[KeyValueInfoList:[] ProviderName:[] RegionName:[]]
	// // fmt.Println(regionList["connectionconfig"])

	json.NewDecoder(respBody).Decode(&regionInfo)
	// fmt.Println(regionInfo)
	// fmt.Println(regionInfo.KeyValueInfoList)
	return &regionInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

// region 단건 조회
func MconRegionGet(region *models.Region) (models.Region, error) {
	resultRegion := models.Region{}

	// paramRegion := &models.Region{}
	// if err := c.Bind(paramRegion); err != nil {
	// 	return resultRegion, err
	// }

	//err := models.DB.Find(&resultRegion, region.ID)
	//if err != nil {
	//	return resultRegion, err
	//}

	query := models.DB.Q()
	if region.ID.String() != "00000000-0000-0000-0000-000000000000" {
		query = query.Where(" id = ? ", region.ID)
	}
	if region.ProviderID != "" {
		query = query.Where(" provider_id = ? ", region.ProviderID)
	}
	if region.RegionName != "" {
		query = query.Where(" region_name = ? ", region.RegionName)
	}
	err := query.First(&resultRegion)

	return resultRegion, err
}

// Region 등록
// func RegRegion(regionInfo *spider.RegionInfo) (io.ReadCloser, fwmodels.WebStatus) {
func RegRegion(regionInfo *spider.RegionInfo) (*spider.RegionInfo, fwmodels.WebStatus) {
	var originalUrl = "/region"
	urlParam := util.MappingUrlParameter(originalUrl, nil)

	url := util.SPIDER + urlParam

	// buff := bytes.NewBuffer(pbytes)
	// url := util.SPIDER + "/region"

	fmt.Println("RegRegion : ", regionInfo)

	// body, err := util.CommonHttpPost(url, regionInfo)
	pbytes, _ := json.Marshal(regionInfo)
	// body, err := util.CommonHttpPost(url, pbytes)
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

	// if err != nil {
	// 	fmt.Println(err)
	// 	return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	// }

	// respBody := resp.Body
	// respStatus := resp.StatusCode

	// return respBody, fwmodels.WebStatus{StatusCode: respStatus}
	respBody := resp.Body
	respStatus := resp.StatusCode

	returnRegionInfo := spider.RegionInfo{}
	returnStatus := fwmodels.WebStatus{}

	if err != nil {
		fmt.Println(err)
		return &returnRegionInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		errorInfo := fwmodels.ErrorInfo{}
		json.NewDecoder(respBody).Decode(&errorInfo)
		fmt.Println("respStatus != 200 reason ", errorInfo)
		returnStatus.Message = errorInfo.Message
	} else {
		json.NewDecoder(respBody).Decode(&returnRegionInfo)
		fmt.Println(returnRegionInfo)
	}
	returnStatus.StatusCode = respStatus

	return &returnRegionInfo, returnStatus
}

// region 추가
func MconRegionCreate(region *models.Region, c buffalo.Context) error {
	// paramRegion := &models.Region{}
	// if err := c.Bind(paramRegion); err != nil {
	// 	return errors.WithStack(err)
	// }

	tx := c.Value("tx").(*pop.Connection)

	// validateErr , otherErr
	verrs, err := region.Create(tx)
	if verrs != nil {
		return errors.WithStack(verrs)
	}
	if err != nil {
		return errors.WithStack(err)
	}

	return nil
}

// Region 삭제
func DelRegion(regionName string) (io.ReadCloser, fwmodels.WebStatus) {
	var originalUrl = "/region/{{region_name}}"

	var paramMapper = make(map[string]string)
	paramMapper["{{region_name}}"] = regionName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.SPIDER + urlParam

	// buff := bytes.NewBuffer(pbytes)
	// url := util.SPIDER + "/region/" + regionName

	fmt.Println("DelRegion : ", regionName)

	// body, err := util.CommonHttpPost(url, regionInfo)

	pbytes, _ := json.Marshal(regionName)
	// body, err := util.CommonHttpDelete(url, pbytes)
	resp, err := util.CommonHttp(url, pbytes, http.MethodDelete)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// return body, err
	respBody := resp.Body
	respStatus := resp.StatusCode

	return respBody, fwmodels.WebStatus{StatusCode: respStatus}
}

// 현재 설정된 credential 목록 : 목록에서는 key의 value는 ...으로 표시
func GetCredentialList() ([]spider.CredentialInfo, fwmodels.WebStatus) {
	var originalUrl = "/credential"
	urlParam := util.MappingUrlParameter(originalUrl, nil)

	url := util.SPIDER + urlParam

	// SPIDER == SPIDER
	// url := util.SPIDER + "/credential"
	// fmt.Println("=========== GetRegionListData : ", url)

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer body.Close()

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	credentialList := map[string][]spider.CredentialInfo{}
	json.NewDecoder(respBody).Decode(&credentialList)
	fmt.Println(credentialList["credential"])
	// TODO : key의 value를 "..."로 대체함. 사용자에게 노출시킬 필요가 있을지...
	for _, credentialInfo := range credentialList["credential"] {
		fmt.Println("credentialInfo : ", credentialInfo)
		keyValueInfoList := credentialInfo.KeyValueInfoList
		fmt.Println("before keyValueInfoList : ", keyValueInfoList)
		for _, keyValueInfo := range keyValueInfoList {
			keyValueInfo.Value = "..."
		}
		// fmt.Println("after keyValueInfoList : ", keyValueInfoList)
	}

	return credentialList["credential"], fwmodels.WebStatus{StatusCode: respStatus}
}

// credential 목록 조회
func MconCredentialList(credential *models.Credential, c buffalo.Context) ([]models.Credential, error) {
	crendentials := []models.Credential{}

	// paramCredential := &models.Credential{}
	// if err := c.Bind(paramCredential); err != nil {
	// 	return errors.WithStack(err)
	// }

	// tx := c.Value("tx").(*pop.Connection)
	// query := tx.Eager()
	// if credential.ID.String() != "" {
	// 	query.Where("id = ", credential.ID)
	// }
	// if credential.CredentialName != "" {
	// 	query.Where("driver_name = ", credential.CredentialName)
	// }
	query := models.DB.Q()
	if credential.ID.String() != "" {
		query = query.Where("id = ", credential.ID)
	}
	if credential.CredentialName != "" {
		query = query.Where("credential_name = ", credential.CredentialName)
	}
	err := query.All(&crendentials)
	if err != nil {
		return crendentials, errors.WithStack(err)
	}

	return crendentials, nil
}

// Credential 상세조회
func GetCredentialData(credentialName string) (*spider.CredentialInfo, fwmodels.WebStatus) {
	var originalUrl = "/credential/{{credential_name}}"

	var paramMapper = make(map[string]string)
	paramMapper["{{credential_name}}"] = credentialName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.SPIDER + urlParam

	// url := util.SPIDER + "/credential/" + credentialName
	fmt.Println("=========== GetCredentialData : ", credentialName)

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer body.Close()
	credentialInfo := spider.CredentialInfo{}
	if err != nil {
		fmt.Println(err)
		return &credentialInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&credentialInfo)
	// fmt.Println(credentialInfo)
	// fmt.Println(credentialInfo.KeyValueInfoList)
	return &credentialInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

// credential 단건 조회
func MconCredentialGet(credential *models.Credential) (models.Credential, error) {
	resultCredential := models.Credential{}

	//err := models.DB.Find(&resultCredential, credential.ID)
	//if err != nil {
	//	return resultCredential, errors.WithStack(err)
	//}

	query := models.DB.Q()
	if credential.ID.String() != "00000000-0000-0000-0000-000000000000" {
		query = query.Where(" id = ? ", credential.ID)
	}
	if credential.ProviderID != "" {
		query = query.Where(" provider_id = ? ", credential.ProviderID)
	}
	if credential.CredentialName != "" {
		query = query.Where(" credential_name = ? ", credential.CredentialName)
	}
	err := query.First(&resultCredential)

	return resultCredential, err
}

// Credential 등록
func RegCredential(credentialInfo *spider.CredentialInfo) (*spider.CredentialInfo, fwmodels.WebStatus) {
	var originalUrl = "/credential"
	urlParam := util.MappingUrlParameter(originalUrl, nil)

	url := util.SPIDER + urlParam

	fmt.Println("RegCredential : ", credentialInfo)
	returnCredentialInfo := spider.CredentialInfo{}
	returnStatus := fwmodels.WebStatus{}

	// GCP의 경우 value에 \n 이 포함되어 있기 때문에 이것이 넘어올 때는 \\n 형태로 넘어온다.  이것을 \으로 replace 해야
	//
	var credentialBuffer bytes.Buffer
	if credentialInfo.ProviderName == "GCP" {

		credentialBuffer.WriteString(`{`)
		credentialBuffer.WriteString(`"CredentialName":"` + credentialInfo.CredentialName + `"`)
		credentialBuffer.WriteString(`,"ProviderName":"` + credentialInfo.ProviderName + `"`)
		credentialBuffer.WriteString(`,"KeyValueInfoList":[`)

		for mapIndex, keyValueInfo := range credentialInfo.KeyValueInfoList {
			// for mapIndex, _ := range credentialInfo.KeyValueInfoList {
			gcpKey := keyValueInfo.Key
			gcpValue := keyValueInfo.Value
			// replacedValue := gcpValue
			if mapIndex > 0 {
				credentialBuffer.WriteString(`,`)
			}
			credentialBuffer.WriteString(`{"Key":"` + gcpKey + `","Value":"` + gcpValue + `"}`)
			// if gcpKey == "private_key" {
			// // 	fmt.Println(gcpValue)
			// // 	// fmt.Println(keyValueInfo)
			// // 	fmt.Println("--------- before / after -----------------")
			// 	replacedValue = strings.Replace(gcpValue, "\\n", "\n", -1)
			// 	// replacedValue = strings.Replace(gcpValue, "\n", "\\n", -1)
			// 	// replacedValue = "`" + gcpValue + "`"
			// 	keyValueInfo.Value = replacedValue
			// 	fmt.Println(replacedValue)
			// 	// fmt.Println(keyValueInfo)

			// }
		}
		// fmt.Println("GCP RegCredential : ", credentialInfo)

		credentialBuffer.WriteString(`]`)
		credentialBuffer.WriteString(`}`)
		// fmt.Println("******* ")

		// fmt.Println(credentialBuffer.String())
		resp, err := util.CommonHttpBytes(url, &credentialBuffer, http.MethodPost)

		// pbytes, marshalErr := json.Marshal(credentialInfo)
		// if marshalErr != nil {
		// 	fmt.Println(" ------------------ ")
		// 	fmt.Println(marshalErr)
		// }
		// fmt.Println(string(pbytes))

		// resp, err := util.CommonHttp(url, pbytes, http.MethodPost)
		if err != nil {
			fmt.Println(err)
			return &returnCredentialInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
		}

		respBody := resp.Body
		respStatus := resp.StatusCode

		if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
			errorInfo := fwmodels.ErrorInfo{}
			json.NewDecoder(respBody).Decode(&errorInfo)
			fmt.Println("respStatus != 200 reason ", errorInfo)
			returnStatus.Message = errorInfo.Message
		} else {
			json.NewDecoder(respBody).Decode(&returnCredentialInfo)
			fmt.Println(returnCredentialInfo)
		}
		returnStatus.StatusCode = respStatus
	} else if credentialInfo.ProviderName == "OPENSTACK" {

		credentialBuffer.WriteString(`{`)
		credentialBuffer.WriteString(`"CredentialName":"` + credentialInfo.CredentialName + `"`)
		credentialBuffer.WriteString(`,"ProviderName":"` + credentialInfo.ProviderName + `"`)
		credentialBuffer.WriteString(`,"KeyValueInfoList":[`)

		for mapIndex, keyValueInfo := range credentialInfo.KeyValueInfoList {
			// for mapIndex, _ := range credentialInfo.KeyValueInfoList {
			openstackKey := keyValueInfo.Key
			openstackValue := keyValueInfo.Value
			// replacedValue := gcpValue
			if mapIndex > 0 {
				credentialBuffer.WriteString(`,`)
			}
			credentialBuffer.WriteString(`{"Key":"` + openstackKey + `","Value":"` + openstackValue + `"}`)
			// if gcpKey == "private_key" {
			// // 	fmt.Println(gcpValue)
			// // 	// fmt.Println(keyValueInfo)
			// // 	fmt.Println("--------- before / after -----------------")
			// 	replacedValue = strings.Replace(gcpValue, "\\n", "\n", -1)
			// 	// replacedValue = strings.Replace(gcpValue, "\n", "\\n", -1)
			// 	// replacedValue = "`" + gcpValue + "`"
			// 	keyValueInfo.Value = replacedValue
			// 	fmt.Println(replacedValue)
			// 	// fmt.Println(keyValueInfo)

			// }
		}
		// fmt.Println("GCP RegCredential : ", credentialInfo)

		credentialBuffer.WriteString(`]`)
		credentialBuffer.WriteString(`}`)
		// fmt.Println("******* ")

		// fmt.Println(credentialBuffer.String())
		resp, err := util.CommonHttpBytes(url, &credentialBuffer, http.MethodPost)

		// pbytes, marshalErr := json.Marshal(credentialInfo)
		// if marshalErr != nil {
		// 	fmt.Println(" ------------------ ")
		// 	fmt.Println(marshalErr)
		// }
		// fmt.Println(string(pbytes))

		// resp, err := util.CommonHttp(url, pbytes, http.MethodPost)
		if err != nil {
			fmt.Println(err)
			return &returnCredentialInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
		}

		respBody := resp.Body
		respStatus := resp.StatusCode

		if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
			errorInfo := fwmodels.ErrorInfo{}
			json.NewDecoder(respBody).Decode(&errorInfo)
			fmt.Println("respStatus != 200 reason ", errorInfo)
			returnStatus.Message = errorInfo.Message
		} else {
			json.NewDecoder(respBody).Decode(&returnCredentialInfo)
			fmt.Println(returnCredentialInfo)
		}
		returnStatus.StatusCode = respStatus
	} else {
		// body, err := util.CommonHttpPost(url, regionInfo)

		pbytes, marshalErr := json.Marshal(credentialInfo)
		// pbytes, marshalErr := json.Marshal(credentialInfo)
		if marshalErr != nil {
			fmt.Println(" ------------------ ")
			fmt.Println(marshalErr)
		}
		fmt.Println(string(pbytes))
		resp, err := util.CommonHttp(url, pbytes, http.MethodPost)

		if err != nil {
			fmt.Println(err)
			return &returnCredentialInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
		}

		respBody := resp.Body
		respStatus := resp.StatusCode

		if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
			errorInfo := fwmodels.ErrorInfo{}
			json.NewDecoder(respBody).Decode(&errorInfo)
			fmt.Println("respStatus != 200 reason ", errorInfo)
			returnStatus.Message = errorInfo.Message
		} else {
			json.NewDecoder(respBody).Decode(&returnCredentialInfo)
			fmt.Println(returnCredentialInfo)
		}
		returnStatus.StatusCode = respStatus
	}

	// if err != nil {
	// 	fmt.Println(err)
	// 	return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	// }

	// respBody := resp.Body
	// respStatus := resp.StatusCode

	// // util.DisplayResponse(resp)
	// return respBody, fwmodels.WebStatus{StatusCode: respStatus}

	// respBody := resp.Body
	// respStatus := resp.StatusCode

	// if err != nil {
	// 	fmt.Println(err)
	// 	return &returnCredentialInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	// }

	// if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
	// 	errorInfo := fwmodels.ErrorInfo{}
	// 	json.NewDecoder(respBody).Decode(&errorInfo)
	// 	fmt.Println("respStatus != 200 reason ", errorInfo)
	// 	returnStatus.Message = errorInfo.Message
	// } else {
	// 	json.NewDecoder(respBody).Decode(&returnCredentialInfo)
	// 	fmt.Println(returnCredentialInfo)
	// }
	// returnStatus.StatusCode = respStatus

	return &returnCredentialInfo, returnStatus
}

// credential 추가
func MconCredentialCreate(credential *models.Credential, c buffalo.Context) error {

	tx := c.Value("tx").(*pop.Connection)

	// validateErr , otherErr
	verrs, err := credential.Create(tx)
	if verrs != nil {
		return errors.WithStack(verrs)
	}
	if err != nil {
		return errors.WithStack(err)
	}

	return nil
}

// Credential 삭제
func DelCredential(credentialName string) (fwmodels.WebStatus, fwmodels.WebStatus) {
	webStatus := fwmodels.WebStatus{}

	var originalUrl = "/credential/{{credential_name}}"

	var paramMapper = make(map[string]string)
	paramMapper["{{credential_name}}"] = credentialName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.SPIDER + urlParam
	// buff := bytes.NewBuffer(pbytes)
	// url := util.SPIDER + "/credential/" + credentialName

	fmt.Println("DelCredential : ", credentialName)

	pbytes, _ := json.Marshal(credentialName)
	// body, err := util.CommonHttpDelete(url, pbytes)
	resp, err := util.CommonHttp(url, pbytes, http.MethodDelete)

	if err != nil {
		fmt.Println(err)
		return webStatus, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// return body, err
	respBody := resp.Body
	respStatus := resp.StatusCode
	resultInfo := fwmodels.ResultInfo{}

	json.NewDecoder(respBody).Decode(&resultInfo)
	log.Println(resultInfo)
	log.Println("ResultMessage : " + resultInfo.Message)

	if respStatus != 200 && respStatus != 201 {
		return fwmodels.WebStatus{}, fwmodels.WebStatus{StatusCode: respStatus, Message: resultInfo.Message}
	}
	webStatus.StatusCode = respStatus
	webStatus.Message = resultInfo.Message
	return webStatus, fwmodels.WebStatus{StatusCode: respStatus}
	//return respBody, fwmodels.WebStatus{StatusCode: respStatus}
}

// 현재 설정된 Driver 목록
func GetDriverList() ([]spider.DriverInfo, fwmodels.WebStatus) {
	var originalUrl = "/driver"
	urlParam := util.MappingUrlParameter(originalUrl, nil)

	url := util.SPIDER + urlParam

	// url := util.SPIDER + "/driver"
	fmt.Println("=========== GetDriverListData : ", url)

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer body.Close()

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	driverList := map[string][]spider.DriverInfo{}
	json.NewDecoder(respBody).Decode(&driverList)
	fmt.Println(driverList["driver"])

	return driverList["driver"], fwmodels.WebStatus{StatusCode: respStatus}
}

// Driver 상세조회
func SpiderDriverGet(driverlName string) (*spider.DriverInfo, fwmodels.WebStatus) {
	var originalUrl = "/driver/{{driver_name}}"

	var paramMapper = make(map[string]string)
	paramMapper["{{driver_name}}"] = driverlName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.SPIDER + urlParam

	//url := util.SPIDER + "/driver/" + driverlName
	fmt.Println("=========== GetDriverData : ", url)

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer body.Close()
	driverInfo := spider.DriverInfo{}
	if err != nil {
		fmt.Println(err)
		return &driverInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&driverInfo)
	fmt.Println(driverInfo)
	return &driverInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

// driver 단건 조회
func MconDriverGet(c buffalo.Context) (models.Driver, error) {
	driver := models.Driver{}

	paramDriver := &models.Driver{}
	if err := c.Bind(paramDriver); err != nil {
		return driver, errors.WithStack(err)
	}

	err := models.DB.Find(&driver, paramDriver.ID)
	if err != nil {
		return driver, errors.WithStack(err)
	}

	return driver, nil
}

// Driver 등록
func RegDriver(driverInfo *spider.DriverInfo) (*spider.DriverInfo, fwmodels.WebStatus) {
	var originalUrl = "/driver"
	urlParam := util.MappingUrlParameter(originalUrl, nil)

	url := util.SPIDER + urlParam
	// buff := bytes.NewBuffer(pbytes)
	// url := util.SPIDER + "/driver"

	fmt.Println("driverInfo : ", driverInfo)

	// body, err := util.CommonHttpPost(url, regionInfo)
	pbytes, _ := json.Marshal(driverInfo)
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)
	// if err != nil {
	// 	fmt.Println(err)
	// 	return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	// }

	// respBody := resp.Body
	// respStatus := resp.StatusCode
	// return respBody, fwmodels.WebStatus{StatusCode: respStatus}

	respBody := resp.Body
	respStatus := resp.StatusCode

	returnDriverInfo := spider.DriverInfo{}
	returnStatus := fwmodels.WebStatus{}

	if err != nil {
		fmt.Println(err)
		return &returnDriverInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		errorInfo := fwmodels.ErrorInfo{}
		json.NewDecoder(respBody).Decode(&errorInfo)
		fmt.Println("respStatus != 200 reason ", errorInfo)
		returnStatus.Message = errorInfo.Message
	} else {
		json.NewDecoder(respBody).Decode(&returnDriverInfo)
		fmt.Println(returnDriverInfo)
	}
	returnStatus.StatusCode = respStatus

	return &returnDriverInfo, returnStatus
}

// driver 추가
func MconDriverCreate(driver *models.Driver, c buffalo.Context) error {

	tx := c.Value("tx").(*pop.Connection)

	// validateErr , otherErr
	verrs, err := driver.Create(tx)
	if verrs != nil {
		return errors.WithStack(verrs)
	}
	if err != nil {
		return errors.WithStack(err)
	}

	return nil
}

// Driver 삭제
func DelDriver(driverName string) (io.ReadCloser, fwmodels.WebStatus) {
	var originalUrl = "/driver/{{driver_name}}"

	var paramMapper = make(map[string]string)
	paramMapper["{{driver_name}}"] = driverName
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.SPIDER + urlParam
	// buff := bytes.NewBuffer(pbytes)
	// url := util.SPIDER + "/driver/" + driverName

	fmt.Println("driverName : ", driverName)

	pbytes, _ := json.Marshal(driverName)
	// body, err := util.CommonHttpDelete(url, pbytes)
	resp, err := util.CommonHttp(url, pbytes, http.MethodDelete)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// return body, err
	respBody := resp.Body
	respStatus := resp.StatusCode
	return respBody, fwmodels.WebStatus{StatusCode: respStatus}
}

// /////////// Config
// 현재 설정된 Config 목록  TODO :Spider에서 /config 가 없는 것 같은데.... 나중에 확인해서 안쓰면 제거할 것
func GetConfigList() ([]spider.ConfigInfo, fwmodels.WebStatus) {
	url := util.SPIDER + "/config"
	fmt.Println("=========== GetConfigListData : ", url)

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer body.Close()

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	configList := map[string][]spider.ConfigInfo{}
	json.NewDecoder(respBody).Decode(&configList)
	fmt.Println(configList["config"])

	return configList["config"], fwmodels.WebStatus{StatusCode: respStatus}
}

// Config 상세조회
func GetConfigData(configID string) (*spider.ConfigInfo, fwmodels.WebStatus) {
	url := util.SPIDER + "/config/" + configID
	fmt.Println("=========== GetConfigData : ", url)

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	// defer body.Close()
	configInfo := spider.ConfigInfo{}
	if err != nil {
		fmt.Println(err)
		return &configInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&configInfo)
	fmt.Println(configInfo)
	return &configInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

// Driver 등록
func RegConfig(configInfo *spider.ConfigInfo) (*spider.ConfigInfo, fwmodels.WebStatus) {
	// buff := bytes.NewBuffer(pbytes)
	url := util.SPIDER + "/config"

	fmt.Println("configInfo : ", configInfo)

	// body, err := util.CommonHttpPost(url, regionInfo)
	pbytes, _ := json.Marshal(configInfo)
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)
	// if err != nil {
	// 	fmt.Println(err)
	// 	return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	// }

	// respBody := resp.Body
	// respStatus := resp.StatusCode
	// return respBody, fwmodels.WebStatus{StatusCode: respStatus}
	respBody := resp.Body
	respStatus := resp.StatusCode

	returnConfigInfo := spider.ConfigInfo{}
	returnStatus := fwmodels.WebStatus{}

	if err != nil {
		fmt.Println(err)
		return &returnConfigInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	if respStatus != 200 && respStatus != 201 { // 호출은 정상이나, 가져온 결과값이 200, 201아닌 경우 message에 담겨있는 것을 WebStatus에 set
		errorInfo := fwmodels.ErrorInfo{}
		json.NewDecoder(respBody).Decode(&errorInfo)
		fmt.Println("respStatus != 200 reason ", errorInfo)
		returnStatus.Message = errorInfo.Message
	} else {
		json.NewDecoder(respBody).Decode(&returnConfigInfo)
		fmt.Println(returnConfigInfo)
	}
	returnStatus.StatusCode = respStatus

	return &returnConfigInfo, returnStatus
}

// Driver 삭제
func DelConfig(configID string) (io.ReadCloser, fwmodels.WebStatus) {

	// buff := bytes.NewBuffer(pbytes)
	url := util.SPIDER + "/config/" + configID

	fmt.Println("configID : ", configID)

	pbytes, _ := json.Marshal(configID)
	// body, err := util.CommonHttpDelete(url, pbytes)
	resp, err := util.CommonHttp(url, pbytes, http.MethodDelete)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// return body, err
	respBody := resp.Body
	respStatus := resp.StatusCode
	return respBody, fwmodels.WebStatus{StatusCode: respStatus}
}

////// DB 사용

// Connection이 존재하는지 check
func CheckExistsCloudProvider(providerName string, tx *pop.Connection) bool {
	dr := &models.CloudProvider{}
	q := tx.Where("id = ?", providerName)
	b, err := q.Exists(dr)
	if err != nil {
		errors.WithStack(err)
	}
	return b
}

// Credential이 존재하는지 check
func CheckExistsCredential(providerName string, credentialName string) bool {
	cr := &models.Credential{}
	//q := tx.Where("providerName = ?", providerName).Where("credential_name = ?", credentialName)
	q := models.DB.Where("provider_id = ?", providerName).Where("credential_name = ?", credentialName)
	b, err := q.Exists(cr)
	if err != nil {
		errors.WithStack(err)
	}
	return b
}

// Region이 존재하는지 check
func CheckExistsRegion(providerName string, regionName string) bool {
	rg := &models.Region{}
	//q := tx.Where("providerName = ?", providerName).Where("region_name = ?", regionName)
	q := models.DB.Where("provider_id = ?", providerName).Where("region_name = ?", regionName)
	b, err := q.Exists(rg)
	if err != nil {
		errors.WithStack(err)
	}
	return b
}

// RegionKeyValue가 존재하는지 check
func CheckExistsRegionKeyValue(regionKeyVal models.RegionKeyvalue) bool {
	q := models.DB.Where("region_id = ?", regionKeyVal.RegionID).Where("key = ?", regionKeyVal.Key).Where("value = ?", regionKeyVal.Value)
	b, err := q.Exists(regionKeyVal)
	if err != nil {
		errors.WithStack(err)
	}
	return b
}

// Driver가 존재하는지 check
func CheckExistsDriver(providerName string, driverName string, driverLibFilename string) bool {
	dr := &models.Driver{}
	q := models.DB.Where("driver_name = ?", driverName).Where("lib_file_name = ?", driverLibFilename)
	b, err := q.Exists(dr)
	if err != nil {
		errors.WithStack(err)
	}
	return b
}

// Connection이 존재하는지 check
func CheckExistsCloudConnection(connectionView views.ViewCloudConnection) bool {
	cloudConnection := &views.ViewCloudConnections{}

	query := models.DB.Q()
	//if connectionView.ID.String() != "" {
	//	query = query.Where("id = ?", connectionView.ID.String())
	//}
	if connectionView.ConnectionName != "" {
		query = query.Where("connection_name = ?", connectionView.ConnectionName)
	}
	if connectionView.ProviderID != "" {
		query = query.Where("provider_id = ?", connectionView.ProviderID)
	}
	if connectionView.RegionName != "" {
		query = query.Where("region_name = ?", connectionView.RegionName)
	}
	if connectionView.ZoneName != "" {
		query = query.Where("zone_name = ?", connectionView.ZoneName)
	}
	if connectionView.CredentialName != "" {
		query = query.Where("credential_name = ?", connectionView.CredentialName)
	}
	if connectionView.DriverName != "" {
		query = query.Where("driver_name = ?", connectionView.DriverName)
	}

	//q := models.DB.Where("connection_name = ?", connectionView.)
	b, err := query.Exists(cloudConnection)
	if err != nil {
		log.Println("connection exists", err)
		errors.WithStack(err)
	}
	return b
}

// 해당 user의 provider에서 사용할 credential이 지정되어 있는지
func CheckExistsUserCredential(userId string, providerId string) bool {
	userCredential := &models.UserCredential{}
	query := models.DB.Q()
	query = query.Where("user_id = ?", userId).Where("provider_id = ?", providerId)
	b, err := query.Exists(userCredential)
	if err != nil {
		errors.WithStack(err)
	}
	return b

	// uc := &models.UserCredential{}
	// q := tx.Where("id = ?", providerName)
	// b, err := q.Exists(dr)
	// if err != nil {
	// 	errors.WithStack(err)
	// }
}

// connection정보
func GetUsedConnection(paramConnectionMapping *models.CloudConnectionMapping) (*models.CloudConnectionMapping, error) {
	connectionMapping := &models.CloudConnectionMapping{}

	query := models.DB.Q()
	query = query.Where("namespace_id = ?", paramConnectionMapping.NamespaceID)
	query = query.Where("resource_id = ?", paramConnectionMapping.ResourceID)
	query = query.Where("resource_type = ?", paramConnectionMapping.ResourceType)
	err := query.First(&connectionMapping)

	if err != nil {
		return connectionMapping, err
	}
	return connectionMapping, err
}

// connection정보 등 하위내용이 필요하므로 tx로 호출
func GetUsedConnectionTx(paramConnectionMapping *models.CloudConnectionMapping, c buffalo.Context) (*models.CloudConnectionMapping, error) {
	connectionMapping := &models.CloudConnectionMapping{}

	tx := c.Value("tx").(*pop.Connection)
	err := tx.Eager().Where("resource_id = ?", paramConnectionMapping.ResourceID).Where("resource_type = ?", paramConnectionMapping.ResourceType).First(connectionMapping)

	//err := models.DB.Where("resource_id = ?", paramConnectionMapping.ResourceID).Where("resource_type = ?", paramConnectionMapping.ResourceType).First(connectionMapping)
	if err != nil {
		return connectionMapping, err
	}
	return connectionMapping, err
}

// connection Mapping
// 요 리소스는 이 connection을 사용하며 이 credential을 사용한다.
func SaveConnectionMapping(connectionMapping *models.CloudConnectionMapping, c buffalo.Context) error {

	tx := c.Value("tx").(*pop.Connection)

	vErrors, err := connectionMapping.Create(tx)
	if vErrors.HasAny() {
		log.Println("CloudConnectionMapping vErrors", vErrors.Error())
		return errors.WithStack(vErrors)
	}
	if err != nil {
		log.Println("CloudConnectionMapping err", err)
		return errors.WithStack(err)
	}

	return nil

	// ID        uuid.UUID `json:"id" db:"id"`
	// CreatedAt time.Time `json:"created_at" db:"created_at"`
	// UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	// // vpc, securitygroup, sshkey, vmimage, vmspec, nlb, vm, mckscontrolplane, mcksworkernode, pmks
	// ResourceType string `json:"resource_type" db:"resource_type"`
	// ResourceID   string `json:"resource_id" db:"resource_id"` // 해당 resource의 ID를 string으로

	// ConnectionID    uuid.UUID        `json:"connection_id" db:"connection_id"`
	// CloudConnection *CloudConnection `belongs_to:"cloud_connection"`

	// CredentialID uuid.UUID   `json:"credential_id" db:"credential_id"`
	// Credential   *Credential `belongs_to:"credential"`
}

// provider와 region, zone 으로 해당 유저가 사용가능한 connection 목록 return
// tx로 호출해야 Credential, Driver 등 정보가 채워짐.
func GetConnectionList(providerId string, regionName string, zoneName string, c buffalo.Context) ([]models.CloudConnection, error) {

	connectionList := []models.CloudConnection{}

	// tx := c.Value("tx").(*pop.Connection)
	// query := tx.Eager()
	// if paramConnection.ConnectionName != "" {
	// 	query.Where("connection_name = ", paramConnection.ConnectionName)
	// }
	// err := query.All(&cloudConnections)
	// if err != nil {
	// 	return errors.WithStack(err)
	// }

	tx := c.Value("tx").(*pop.Connection)
	query := tx.Q()
	if providerId != "" {
		query = query.Where("provider_id = ?", providerId)
	}
	err := query.All(&connectionList)
	if err != nil {
		return connectionList, errors.WithStack(err)
	}

	// query := models.DB.Q()
	// if providerId != "" {
	// 	query = query.Where("provider_id = ?", providerId)
	// }
	// err := query.All(&connectionList)
	// if err != nil {
	// 	log.Println("CloudConnectionMapping err", err)
	// 	return connectionList, errors.WithStack(err)
	// }
	return connectionList, nil
}

// 사용자가 등록한 credential 조회
// isDefaultOnly=true 면 default로 설정한 것만 조회
func ListUserCredential(providerId string, userId string, isDefaultOnly bool) ([]models.UserCredential, error) {
	credentials := []models.UserCredential{}
	query := models.DB.Q()
	query = query.Where("user_id = ?", userId)
	if providerId != "" {
		query = query.Where("provider_id = ? ", providerId)
	}
	if isDefaultOnly {
		query = query.Where("is_default = ? ", true)
	}

	err := query.All(&credentials)

	if err != nil {
		return credentials, errors.WithStack(err)
	}
	return credentials, nil
}

// User가 CSP에 default로 설정한 credential : user가 등록한 credential 에서 default 설정은 csp별로 1개만 가능.
func GetDefaultUserCredential(providerId string, userId string) (models.UserCredential, error) {
	credential := models.UserCredential{}

	query := models.DB.Q()
	query = query.Where("user_id = ?", userId)
	query = query.Where("provider_id = ? ", providerId)
	query = query.Where("is_default = ? ", true)
	err := query.First(&credential)

	if err != nil {
		return credential, errors.WithStack(err)
	}
	return credential, nil
}

// 새로 UserCredential 저장
func SaveDefaultUserCredential(userCredential *models.UserCredential, c buffalo.Context) (*models.UserCredential, error) {
	credential := &models.UserCredential{}

	if userCredential.IsDefault {
		// 기존에 isDefault가 있으면 update
		existsCredential := userCredential
		existsCredential.IsDefault = false
		_, err := UpdateDefaultUserCredential(existsCredential, c)
		if err != nil {
			return userCredential, err
		}
	}

	tx := c.Value("tx").(*pop.Connection)

	vErrors, err := userCredential.Create(tx)
	if vErrors.HasAny() {
		log.Println("CloudConnectionMapping vErrors", vErrors.Error())
		return credential, errors.WithStack(vErrors)
	}
	if err != nil {
		log.Println("CloudConnectionMapping err", err)
		return credential, errors.WithStack(err)
	}

	return credential, nil
}

// user credential 수정
// update는 user_id, provider_id 단위로 한다.
func UpdateDefaultUserCredential(userCredential *models.UserCredential, c buffalo.Context) (models.UserCredential, error) {
	credential := models.UserCredential{}

	// userID가 있어야 함
	if userCredential.UserID.IsNil() {
		return credential, errors.New("Known User")
	}
	if userCredential.ProviderID == "" {
		return credential, errors.New("Provider is empty")
	}

	tx := c.Value("tx").(*pop.Connection)

	vErrors, err := userCredential.Update(tx)
	if vErrors.HasAny() {
		log.Println("CloudConnectionMapping vErrors", vErrors.Error())
		return credential, errors.WithStack(vErrors)
	}
	if err != nil {
		log.Println("CloudConnectionMapping err", err)
		return credential, errors.WithStack(err)
	}

	return credential, nil
}

// Credential 목록 조회 : provider와 credential 이름으로 조회. 가능하면 provider는 오면 좋겠는데. 관리자가 생성한것들
func ListPublicCredentialByName(providerId string, credentialName string, c buffalo.Context) ([]models.Credential, error) {

	credentials := []models.Credential{}
	query := models.DB.Q()
	if providerId != "" {
		query = query.Where("provider_id = ? ", providerId)
	}
	if credentialName != "" {
		query = query.Where("credential_name = ?", credentialName)
	}
	query = query.Where("user_level = ? ", "admin")
	err := query.All(&credentials)

	if err != nil {
		return credentials, errors.WithStack(err)
	}
	return credentials, nil
}

// Credentian 조회 : provider와 credential 이름으로 1건조회
func GetCredentialByName(providerId string, credentialName string, c buffalo.Context) (models.Credential, error) {

	credential := models.Credential{}
	/*
		tx := c.Value("tx").(*pop.Connection)
		// if providerName != "" {
		// 	tx.Where("provider_id = ?", providerName)
		// }
		query := tx.Eager()
		//if credentialName != "" {
			query.Where("credential_name = ", credentialName)
		//}
		err := query.All(&credential)

		// 	q := tx.Q()
		// 	q.Join("cloud_providers", "cloud_connections.provider_id = cloud_providers.id")
		// 	q.Join("drivers", "cloud_connections.driver_id = drivers.id")
		// 	q.Join("credentials", "cloud_connections.credential_id = credentials.id")
		// 	q.Join("regions", "cloud_connections.region_id = regions.id")
		// 	if providerName != "" {
		// 		q.Where(`cloud_providers.provider_name like ?`, name)
		// 	}
		// 	if regionName != "" {
		// 		q.Where(`regions.region_name like ?`, regionName)
		// 	}
		// 	q.Paginate(page, perPage)

		// err := q.All(&roles)

		//err := models.DB.Where("provider_id = ?", providerName).All(connectionList)
	*/
	//err := models.DB.Where("credential_name = ?", credentialName).Last(&credential)
	//query := models.DB
	log.Println("asdfasdfasdfasdfasdfasdfasdfasdfasdf&&&&&&&&&&&&&&")
	tx := c.Value("tx").(*pop.Connection)
	query := tx.Eager()
	if credentialName != "" {
		query.Where("provider_id = ", providerId)
		log.Println("provider_id = ", providerId)
	}
	if credentialName != "" {
		query.Where("credential_name = ", credentialName)
		log.Println("credential_name = ", credentialName)
	}

	resultCredentials := &models.Credentials{}
	err := query.All(resultCredentials)
	//err := models.DB.Where("provider_id = ?", providerName)

	// TODO : 이부분을 그냥 사용하는쪽에서 처리하게 할까? method를 단건, 여러건으로 나눌까
	if len(*resultCredentials) == 0 {
		// not found
		return credential, errors.New("Not found connection")
	} else if len(*resultCredentials) > 1 {
		// too many
		return credential, errors.New("Too many connections ")
	} else {
		credential = (*resultCredentials)[0]
	}

	if err != nil {
		log.Println("credential err", err)
		return credential, errors.WithStack(err)
	}
	return credential, nil
}

func GetDriverByName(driverName string, c buffalo.Context) (models.Driver, error) {

	driver := models.Driver{}
	/*
		tx := c.Value("tx").(*pop.Connection)

		query := tx.Eager()
		//if driverName != "" {
		query.Where("driver_name = ", driverName)
		//}
		err := query.All(&driver)
	*/
	err := models.DB.Where("driver_name = ?", driverName).Last(&driver)
	if err != nil {
		log.Println("driver err", err)
		return driver, errors.WithStack(err)
	}
	return driver, nil
}
func GetDriverByProvider(providerId string, c buffalo.Context) (models.Driver, error) {

	driver := models.Driver{}
	err := models.DB.Where("provider_id = ?", providerId).Last(&driver)
	if err != nil {
		log.Println("driver err", err)
		return driver, errors.WithStack(err)
	}
	return driver, nil
}

func GetRegionByName(regionName string, c buffalo.Context) (models.Region, error) {

	region := models.Region{}
	/*
		tx := c.Value("tx").(*pop.Connection)

		query := tx.Eager()
		//if regionName != "" {
		query.Where("region_name = ", regionName)
		//}
		err := query.All(&region)
	*/
	err := models.DB.Where("region_name = ?", regionName).Last(&region)
	if err != nil {
		log.Println("region err", err)
		return region, errors.WithStack(err)
	}
	return region, nil
}

// 해당 connection과 연결된 resource들 확인
// 해당 resource로 사용된 connectionId 가져올 때,
// 해당 credential이 사용된 connectionId 가져올 때,
// 해당 connection이 사용된 resource 가져올 때
func ListConnectionMapping(connectionId string, credentialId string, resourceType string, resourceId string, resourceName string) ([]models.CloudConnectionMapping, error) {
	cm := []models.CloudConnectionMapping{}

	query := models.DB.Q()
	if connectionId != "" {
		query = query.Where("connection_id = ?", connectionId)
	}
	if credentialId != "" {
		query = query.Where("credential_id = ?", credentialId)
	}
	if resourceType != "" {
		query = query.Where("resource_type = ?", resourceType)
	}
	if resourceId != "" {
		query = query.Where("resource_id = ?", resourceId)
	}

	err := query.All(&cm)
	if err != nil {
		log.Println("ListConnectionMapping err", err)
		return cm, errors.WithStack(err)
	}

	return cm, nil
}

// 해당 connection과 연결된 resource들 확인
// 해당 resource로 사용된 connectionId 가져올 때,
// 해당 credential이 사용된 connectionId 가져올 때,
// 해당 connection이 사용된 resource 가져올 때
func GetConnectionMapping(connectionId string, credentialId string, resourceType string, resourceId string, resourceName string) (models.CloudConnectionMapping, error) {
	cm := models.CloudConnectionMapping{}

	query := models.DB.Q()
	if connectionId != "" {
		query = query.Where("connection_id = ?", connectionId)
	}
	if credentialId != "" {
		query = query.Where("credential_id = ?", credentialId)
	}
	if resourceType != "" {
		query = query.Where("resource_type = ?", resourceType)
	}
	if resourceId != "" {
		query = query.Where("resource_id = ?", resourceId)
	}

	err := query.First(&cm)
	if err != nil {
		log.Println("GetConnectionMapping err", err)
		return cm, errors.WithStack(err)
	}

	return cm, nil
}

// provider와 region, zone 으로 해당 유저가 사용가능한 connection 단건 return
// user가 사용할 credential (여러개면 random하게 택1) + provider + region + zone(optional) 로 사용할 connection 조회 ---> 여러개면 random하게 택1
// region 별 connection은 1개만 사용. 여러개중 1개만
func GetAvailableConnection(viewCloudConnection views.ViewCloudConnection, c buffalo.Context) (views.ViewCloudConnection, error) {
	connection := views.ViewCloudConnection{}
	///////////
	// user 정보 가져오기
	//log.Println(c.Session().Get("current_user"))
	//log.Println(c.Session().Get("current_user_id"))
	//user := c.Session().Get("current_user").(*models.User)
	//user := c.Value("current_user").(*models.User)
	userId := c.Session().Get("current_user_id").(uuid.UUID)
	if userId == uuid.Nil {
		return connection, errors.New("failed to get User")
	}

	//userCredentialID := c.Session().Get("current_credential") // user가 수시로 바꿀 수 있으면 session에 set하도록 변경 필요
	// credential 조회 : 해당 provider의 credential에 defautl 설정이 되어 있으면 해당 값 사용.
	//userCredentialID := user.DefaultCredential
	userCredentialID := ""
	credentialExist := CheckExistsUserCredential(userId.String(), viewCloudConnection.ProviderID)
	//
	if credentialExist {
		userDefaultCredential, err := GetDefaultUserCredential(viewCloudConnection.ProviderID, userId.String())
		if err != nil {
			return connection, err
		}
		// default set이 되어있으면 set.
		if userDefaultCredential.IsDefault {
			userCredentialID = userDefaultCredential.CredentialID.String()
		}
	}

	if userCredentialID == "" { // 없으면 가용 user credential 조회
		publicCredentials, err := ListPublicCredentialByName(viewCloudConnection.ProviderID, "", c) // credential이름은 없이, user_level == 'admin' 인것만 조회
		if err != nil {
			return connection, err
		}

		if len(publicCredentials) == 0 {
			return connection, errors.New("failed to get Credential")
		}
		userCredentialID = publicCredentials[0].ID.String()
	}

	// user가 사용가능한 credentialId 1개 조회. 여러개 중 1개
	/*
		if credentialID == "" {
			credential := &models.Credential{}
			credentialQuery := models.DB.Q()
			credentialQuery = credentialQuery.Where("provider_id = ?", providerID).Where("user_level = ?", "admin")
			err := credentialQuery.First(credential)
			if err != nil {
				log.Println("credentialQuery err", err)
				return *connection, errors.WithStack(err)
			}
			credentialID = credential.ID.String()
		}
	*/

	query := models.DB.Q()
	query = query.Where("credential_id = ?", userCredentialID)
	if viewCloudConnection.ProviderID != "" {
		query = query.Where("provider_id = ?", viewCloudConnection.ProviderID)
	}
	if viewCloudConnection.RegionName != "" {
		query = query.Where("region_name = ?", viewCloudConnection.RegionName)
	}
	if viewCloudConnection.ZoneName != "" {
		query = query.Where("zone_name = ?", viewCloudConnection.ZoneName)
	}
	err := query.First(&connection)
	if err != nil {
		log.Println("region err", err)
		return connection, errors.WithStack(err)
	}

	// region/zone ID 조회. 여러 zone이 있으면 여러개 중 1개
	// region := &models.Region{}
	// regionQuery := models.DB
	// if( providerName != "" ){
	// 	regionQuery.Where("provider_id = ?", providerName)
	// }
	// if( regionName != "" ){
	// 	regionQuery.Where("region_name = ?", regionName)
	// }
	// if( zoneName != "" ){
	// 	regionQuery.Where("zone_name = ?", zoneName)
	// }

	/*
	   select cc.provider_id, cc.connection_name, kv.region_id
	   , max(case when kv.key='Region' then kv.value end) as region_name
	   , max(case when kv.key='Zone' then kv.value end) as zone_id
	   from cloud_connections cc
	   join regions rg
	   on cc.region_id = rg.id
	   join region_keyvalues kv
	   on rg.id = kv.region_id
	   where cc.region_id =  '1bb8a5e4-daaa-43ae-a7ed-68b49e97f737'
	   --where rg.region_name like '%ap-hongkong%'
	   group by cc.provider_id, cc.connection_name, kv.region_id
	   --order by rg.provider_id, kv.region_id
	*/

	//err = regionQuery.First(region)
	//if err != nil {
	//	log.Println("region err", err)
	//	return *cc, errors.WithStack(err)
	//}

	// 사용할 connection 중 1개 return. zone 이 조건에 없으면 여러개 중 1개

	/*
		connectionQuery := models.DB.Q()
		connectionQuery = connectionQuery.Where("provider_id = ?", providerID)
		connectionQuery = connectionQuery.Where("credential_id = ?", userCredentialID)
		if regionName != "" {
			connectionQuery.Where(`region_id like ?`, regionName)
		}
		if zoneName != "" {
			connectionQuery.Where(`zone_id like ?`, zoneName)
		}
		err := connectionQuery.First(&connection)
		if err != nil {
			log.Println("connection err", err)
			return connection, errors.WithStack(err)
		}
	*/
	/*
		-- view로 생성함.
		queryStr := ""
		queryStr += " select * "
		queryStr += " from ( "
		queryStr += " 	   select cc.provider_id, cc.connection_name "
		queryStr += "		   , dr.id as driver_id "
		queryStr += "		   , max(dr.driver_name) as driver_name "
		queryStr += "		   , cd.id as credential_id "
		queryStr += "		   , max(cd.credential_name) as credential_name "
		queryStr += "		   , max(rg.region_name) as region_alias "
		queryStr += "		   , kv.region_id "
		queryStr += "		   , max(case when kv.key='Region' then kv.value end) as region_name "
		queryStr += "		   , max(case when kv.key='Zone' then kv.value end) as zone_name "
		queryStr += "		   from cloud_connections cc "
		queryStr += "		   join cloud_providers cp "
		queryStr += "		   on cc.provider_id = cp.id "
		queryStr += "		   join drivers dr "
		queryStr += "		   on cc.driver_id = dr.id "
		queryStr += "		   join credentials cd "
		queryStr += "		   on cc.credential_id = cd.id "
		queryStr += "		   join regions rg "
		queryStr += "		   on cc.region_id = rg.id "
		queryStr += "		   join region_keyvalues kv "
		queryStr += "		   on rg.id = kv.region_id "
		queryStr += "		   where 1 = 1 "
		queryStr += "		   group by cc.provider_id, cc.connection_name "
		queryStr += "			   , dr.id, cd.id, rg.id, kv.region_id "
		queryStr += "	) cloud_connection_mapping "
		queryStr += "	where 1 = 1 "

		q := models.DB.RawQuery(queryStr)
		err := q.First(&connection)
		if err != nil {
			log.Println("connection err", err)
			return connection, errors.WithStack(err)
		}

	*/

	return connection, nil
}

func (gvc GVC) GetAvailableConnection(viewCloudConnection *views.ViewCloudConnection, c buffalo.Context) (views.ViewCloudConnection, error) {
	connection := views.ViewCloudConnection{}
	///////////
	// user 정보 가져오기
	user := c.Value("current_user").(*models.User)
	if user.ID == uuid.Nil {
		return connection, errors.New("failed to get User")
	}

	//userCredentialID := c.Session().Get("current_credential") // user가 수시로 바꿀 수 있으면 session에 set하도록 변경 필요
	// credential 조회 : 해당 provider의 credential에 defautl 설정이 되어 있으면 해당 값 사용.
	//userCredentialID := user.DefaultCredential
	userCredentialID := ""
	credentialExist := CheckExistsUserCredential(user.ID.String(), viewCloudConnection.ProviderID)
	//
	if credentialExist {
		userDefaultCredential, err := GetDefaultUserCredential(viewCloudConnection.ProviderID, user.ID.String())
		if err != nil {
			return connection, err
		}
		// default set이 되어있으면 set.
		if userDefaultCredential.IsDefault {
			userCredentialID = userDefaultCredential.CredentialID.String()
		}
	}

	if userCredentialID == "" { // 없으면 가용 user credential 조회
		publicCredentials, err := ListPublicCredentialByName(viewCloudConnection.ProviderID, "", c) // credential이름은 없이, user_level == 'admin' 인것만 조회
		if err != nil {
			return connection, err
		}

		if len(publicCredentials) == 0 {
			return connection, errors.New("failed to get Credential")
		}
		userCredentialID = publicCredentials[0].ID.String()
	}

	// user가 사용가능한 credentialId 1개 조회. 여러개 중 1개
	/*
		if credentialID == "" {
			credential := &models.Credential{}
			credentialQuery := models.DB.Q()
			credentialQuery = credentialQuery.Where("provider_id = ?", providerID).Where("user_level = ?", "admin")
			err := credentialQuery.First(credential)
			if err != nil {
				log.Println("credentialQuery err", err)
				return *connection, errors.WithStack(err)
			}
			credentialID = credential.ID.String()
		}
	*/

	query := models.DB.Q()
	query = query.Where("credential_id = ?", userCredentialID)
	if viewCloudConnection.ProviderID != "" {
		query = query.Where("provider_id = ?", viewCloudConnection.ProviderID)
	}
	if viewCloudConnection.RegionName != "" {
		query = query.Where("region_name = ?", viewCloudConnection.RegionName)
	}
	if viewCloudConnection.ZoneName != "" {
		query = query.Where("zone_name = ?", viewCloudConnection.ZoneName)
	}
	err := query.First(&connection)
	if err != nil {
		log.Println("region err", err)
		return connection, errors.WithStack(err)
	}

	// region/zone ID 조회. 여러 zone이 있으면 여러개 중 1개
	// region := &models.Region{}
	// regionQuery := models.DB
	// if( providerName != "" ){
	// 	regionQuery.Where("provider_id = ?", providerName)
	// }
	// if( regionName != "" ){
	// 	regionQuery.Where("region_name = ?", regionName)
	// }
	// if( zoneName != "" ){
	// 	regionQuery.Where("zone_name = ?", zoneName)
	// }

	/*
	   select cc.provider_id, cc.connection_name, kv.region_id
	   , max(case when kv.key='Region' then kv.value end) as region_name
	   , max(case when kv.key='Zone' then kv.value end) as zone_id
	   from cloud_connections cc
	   join regions rg
	   on cc.region_id = rg.id
	   join region_keyvalues kv
	   on rg.id = kv.region_id
	   where cc.region_id =  '1bb8a5e4-daaa-43ae-a7ed-68b49e97f737'
	   --where rg.region_name like '%ap-hongkong%'
	   group by cc.provider_id, cc.connection_name, kv.region_id
	   --order by rg.provider_id, kv.region_id
	*/

	//err = regionQuery.First(region)
	//if err != nil {
	//	log.Println("region err", err)
	//	return *cc, errors.WithStack(err)
	//}

	// 사용할 connection 중 1개 return. zone 이 조건에 없으면 여러개 중 1개

	/*
		connectionQuery := models.DB.Q()
		connectionQuery = connectionQuery.Where("provider_id = ?", providerID)
		connectionQuery = connectionQuery.Where("credential_id = ?", userCredentialID)
		if regionName != "" {
			connectionQuery.Where(`region_id like ?`, regionName)
		}
		if zoneName != "" {
			connectionQuery.Where(`zone_id like ?`, zoneName)
		}
		err := connectionQuery.First(&connection)
		if err != nil {
			log.Println("connection err", err)
			return connection, errors.WithStack(err)
		}
	*/
	/*
		-- view로 생성함.
		queryStr := ""
		queryStr += " select * "
		queryStr += " from ( "
		queryStr += " 	   select cc.provider_id, cc.connection_name "
		queryStr += "		   , dr.id as driver_id "
		queryStr += "		   , max(dr.driver_name) as driver_name "
		queryStr += "		   , cd.id as credential_id "
		queryStr += "		   , max(cd.credential_name) as credential_name "
		queryStr += "		   , max(rg.region_name) as region_alias "
		queryStr += "		   , kv.region_id "
		queryStr += "		   , max(case when kv.key='Region' then kv.value end) as region_name "
		queryStr += "		   , max(case when kv.key='Zone' then kv.value end) as zone_name "
		queryStr += "		   from cloud_connections cc "
		queryStr += "		   join cloud_providers cp "
		queryStr += "		   on cc.provider_id = cp.id "
		queryStr += "		   join drivers dr "
		queryStr += "		   on cc.driver_id = dr.id "
		queryStr += "		   join credentials cd "
		queryStr += "		   on cc.credential_id = cd.id "
		queryStr += "		   join regions rg "
		queryStr += "		   on cc.region_id = rg.id "
		queryStr += "		   join region_keyvalues kv "
		queryStr += "		   on rg.id = kv.region_id "
		queryStr += "		   where 1 = 1 "
		queryStr += "		   group by cc.provider_id, cc.connection_name "
		queryStr += "			   , dr.id, cd.id, rg.id, kv.region_id "
		queryStr += "	) cloud_connection_mapping "
		queryStr += "	where 1 = 1 "

		q := models.DB.RawQuery(queryStr)
		err := q.First(&connection)
		if err != nil {
			log.Println("connection err", err)
			return connection, errors.WithStack(err)
		}

	*/

	return connection, nil
}

// provider와 region, zone 으로 해당 유저가 사용가능한 connection 단건 return
// user가 사용할 credential (여러개면 random하게 택1) + provider + region + zone(optional) 로 사용할 connection 조회 ---> 여러개면 random하게 택1
func ListViewConnection(namespace string, viewCloudConnection views.ViewCloudConnection, c buffalo.Context) ([]views.ViewCloudConnection, error) {
	connectionList := []views.ViewCloudConnection{}
	///////////
	// user 정보 가져오기
	user := c.Value("current_user").(*models.User)
	if user.ID == uuid.Nil {
		return connectionList, errors.New("failed to get User")
	}

	//userCredentialID := c.Session().Get("current_credential") // user가 수시로 바꿀 수 있으면 session에 set하도록 변경 필요
	userCredentialID := user.DefaultCredential
	if userCredentialID == "" { // 없으면 가용 user credential 조회
		publicCredentials, err := ListPublicCredentialByName(viewCloudConnection.ProviderID, "", c) // credential이름은 없이, user_level == 'admin' 인것만 조회
		if err != nil {
			return connectionList, err
		}
		userCredentialID = publicCredentials[0].ID.String()
	}

	query := models.DB.Q()
	query = query.Where("credential_id = ?", userCredentialID)
	if viewCloudConnection.ProviderID != "" {
		query = query.Where("provider_id = ?", viewCloudConnection.ProviderID)
	}
	if viewCloudConnection.RegionName != "" {
		query = query.Where("region_name = ?", viewCloudConnection.RegionName)
	}
	if viewCloudConnection.ZoneName != "" {
		query = query.Where("zone_name = ?", viewCloudConnection.ZoneName)
	}
	err := query.All(&connectionList)
	if err != nil {
		log.Println("region err", err)
		return connectionList, errors.WithStack(err)
	}

	return connectionList, nil
}

// 단건조회
func GetViewConnection(viewCloudConnection views.ViewCloudConnection) (views.ViewCloudConnection, error) {
	connection := views.ViewCloudConnection{}
	query := models.DB.Q()

	if viewCloudConnection.ConnectionName != "" {
		query = query.Where("connection_name = ?", viewCloudConnection.ConnectionName)
	}
	if viewCloudConnection.ProviderID != "" {
		query = query.Where("provider_id = ?", viewCloudConnection.ProviderID)
	}
	if viewCloudConnection.RegionName != "" {
		query = query.Where("region_name = ?", viewCloudConnection.RegionName)
	}
	if viewCloudConnection.ZoneName != "" {
		query = query.Where("zone_name = ?", viewCloudConnection.ZoneName)
	}
	err := query.First(&connection)
	if err != nil {
		log.Println("region err", err)
		return connection, errors.New("has not found")
		//return connection, errors.WithStack(err)
	}
	return connection, nil
}

func CheckExistsResourceMapping(resourceType string, resourceId string, tx *pop.Connection) bool {

	cm := &models.CloudConnectionMapping{}
	//q := tx.Where("resource_type = ?", resourceType)
	//q.Where("resource_id = ?", resourceId)
	//b, err := q.Exists(cm)
	b, err := tx.Where("resource_type = ?", resourceType).Where("resource_id = ?", resourceId).Exists(cm)
	if err != nil {
		errors.WithStack(err)
	}
	return b
}

func ListResourceByType(namespace string, connectionParamMap map[string]string, provider string, regionName string, zoneName string, resourceType string) ([]views.ViewCloudResource, error) {
	log.Println("ListResourceByType ")

	ccm := []views.ViewCloudResource{}
	//ccm := []models.CloudConnectionMapping{}
	//addParam := []string{}
	addParam := []interface{}{}

	queryString := ""
	queryString += " select vc.id, vc.connection_name, cc.namespace_name, cc.namespace_id, vc.provider_id, vc.region_id, vc.region_name"
	queryString += " , cc.resource_type, cc.resource_id, cc.resource_name"
	queryString += " from view_cloud_connections vc"
	queryString += " join cloud_connection_mappings cc"
	queryString += " on vc.id = cc.connection_id"
	queryString += " and vc.credential_id = cc.credential_id"
	queryString += " where 1 = 1"
	queryString += " and cc.namespace_name = ?" // resource는 namespace를 가진다.
	queryString += " and cc.resource_type = ?"  // 조회하고자 하는 resource type
	addParam = append(addParam, namespace)
	addParam = append(addParam, resourceType)

	if provider != "" {
		queryString += " and vc.provider_id = ?"
		addParam = append(addParam, provider)
	}
	if regionName != "" {
		queryString += " and vc.region_name = ?"
		addParam = append(addParam, regionName)
	}
	if zoneName != "" {
		queryString += " and vc.zone_name = ?"
		addParam = append(addParam, zoneName)
	}

	queryString += " and cc.updated_at = ( select max(ccm.updated_at) updated_at "
	queryString += "			 	from cloud_connection_mappings ccm"
	queryString += "			 	where ccm.namespace_name = ?"
	queryString += "			 	and ccm.resource_type = ?"
	queryString += "				and ccm.resource_id = cc.resource_id"
	queryString += "			 	group by namespace_id, resource_type, resource_id"
	queryString += "			)"
	addParam = append(addParam, namespace)
	addParam = append(addParam, resourceType)

	// 특정 resource를 사용하는 connection만 거르기
	if len(connectionParamMap) > 0 {
		for connectionParamKey, connectionParamVal := range connectionParamMap {
			// connection 이 직접 주어지면 바로 사용
			if connectionParamKey == "connectionName" {
				queryString += " and vc.connection_name = ?"
				addParam = append(addParam, connectionParamVal)
				break
			} else {
				// resource id가 따로 주어지면 subquery 추가
				queryString += " and vc.id = ("
				queryString += "			 	select connection_id "
				queryString += "			 	from cloud_connection_mappings ccm"
				queryString += "			 	where ccm.namespace_name = ? "
				queryString += "			 	and ccm.resource_type = ? "
				queryString += "			 	and ccm.resource_id = ? "
				queryString += " ) "
				addParam = append(addParam, namespace)
				addParam = append(addParam, connectionParamKey)
				addParam = append(addParam, connectionParamVal)
			}
		}
	}

	log.Println("queryString ", queryString)
	log.Println("addParam ", addParam)
	query := models.DB.RawQuery(queryString, addParam...)
	err := query.All(&ccm)
	if err != nil {
		return ccm, err
	}

	return ccm, nil
}

func SyncCloudProvider(c buffalo.Context) error {
	cspList, status := GetCloudOSList()
	if status.StatusCode == 500 {
		return errors.New(status.Message)
	}
	// 조회 내역 db에 저장
	tx := c.Value("tx").(*pop.Connection)
	for _, csp := range cspList {
		cspId := strings.ToUpper(csp)
		b := CheckExistsCloudProvider(cspId, tx)
		cp := &models.CloudProvider{}
		cp.ProviderID = cspId
		cp.ProviderName = csp
		if !b { // 없으면 create
			verr, err := cp.Create(tx)
			if verr.HasAny() {
				spew.Dump("csp creation succeed ", *cp)
				return errors.WithStack(verr)
			}

			if err != nil {
				spew.Dump("csp creation failed ", cp)
				return errors.WithStack(err)
			}
		} else { // 있으면 update
			verr, err := cp.Update(tx)
			if verr.HasAny() {
				spew.Dump("csp update succeed ", *cp)
				return errors.WithStack(verr)
			}
			if err != nil {
				spew.Dump("csp update failed ", cp)
				return errors.WithStack(err)
			}
		}
	}

	return nil
}

// Driver 동기화
func SyncDriver(c buffalo.Context) error {
	driverList, status := GetDriverList()

	if status.StatusCode == 500 {
		return errors.New(status.Message)
	}

	tx := c.Value("tx").(*pop.Connection)
	for _, driver := range driverList {
		log.Println("checkExistsDriver before ")
		b := CheckExistsDriver(driver.ProviderName, driver.DriverName, driver.DriverLibFileName)
		dr := &models.Driver{}
		//dr.ProviderID = driver.ProviderName
		dr.DriverName = driver.DriverName
		dr.LibFileName = driver.DriverLibFileName
		log.Println("checkExistsDriver result ", b)
		if !b { // 없으면 create
			verr, err := dr.Create(tx)
			if verr.HasAny() {
				spew.Dump("driver creation succeed ", *dr)
				return errors.WithStack(verr)
			}
			if err != nil {
				spew.Dump("driver creation failed ", dr)
				return errors.WithStack(err)
			}
		} else { // 있으면 update
			verr, err := dr.Update(tx)
			if verr.HasAny() {
				spew.Dump("driver update succeed ", *dr)
				return errors.WithStack(verr)
			}
			if err != nil {
				spew.Dump("driver update failed ", dr)
				return errors.WithStack(err)
			}
		}
	}

	log.Println("checkExistsDriver after ")
	return nil

}

// Region 동기화
func SyncRegion(c buffalo.Context) error {
	cbRegionList, status := GetRegionList()
	if status.StatusCode == 500 {
		return errors.New(status.Message)
	}
	// 조회 내역 db에 저장
	tx := c.Value("tx").(*pop.Connection)
	for _, cbRegion := range cbRegionList {
		b := CheckExistsRegion(cbRegion.ProviderName, cbRegion.RegionName)
		rg := &models.Region{}
		rg.ProviderID = cbRegion.ProviderName
		rg.RegionName = cbRegion.RegionName
		log.Println(" result ", b)
		if !b { // 없으면 create
			verr, err := rg.Create(tx)
			log.Println(" Create result ")
			if verr.HasAny() {
				log.Println("verr ", verr)
				spew.Dump("region creation failed ", *rg)
				return errors.WithStack(verr)
			}
			if err != nil {
				log.Println("err ", err)
				spew.Dump("region creation failed ", *rg)
				return errors.WithStack(err)
			}
		} else { // 있으면 skip
			// verr, err := rg.Update(tx)
			// if verr.HasAny() {
			// 	spew.Dump("region update succeed ", *rg)
			// 	return errors.WithStack(verr)
			// }
			// if err != nil {
			// 	spew.Dump("region update failed ", *rg)
			// 	return errors.WithStack(err)
			// }
		}
		// region keyvalue
		// region 조회
		log.Println(" region keyvalue start ", rg)
		regionVals := &models.Region{}
		//err := tx.Find(regionVals, rg.ID)
		err := tx.Where("region_name = ? ", rg.RegionName).Where("provider_id = ?", cbRegion.ProviderName).First(regionVals)
		//err := models.DB.Where("region_name = ? ", rg.RegionName).Where("provider_id = ?", rg.ProviderID).First(regionVals)
		// query := tx.Where("region_name = ? ", rg.RegionName).Where("provider_id = ?", region.ProviderName).First(regionVals)
		// err := query.All(&regionVals)
		if err != nil {
			errors.WithStack(err)
		}
		log.Println("regionKeyVal ", regionVals)
		regionID := regionVals.ID
		for _, regionKeyVal := range cbRegion.KeyValueInfoList {
			log.Println("cbRegion KeyValueInfoList ", regionKeyVal)
			spew.Dump(regionKeyVal)
			rgKeyVal := &models.RegionKeyvalue{}
			rgKeyVal.RegionID = regionID
			rgKeyVal.Key = regionKeyVal.Key
			rgKeyVal.Value = regionKeyVal.Value

			// 존재여부 check. 있으면 continue
			exist := CheckExistsRegionKeyValue(*rgKeyVal)
			if exist {
				log.Println("exist KeyValueInfo ", rgKeyVal)
				continue
			}

			vErrors, err := rgKeyVal.Create(tx)
			if vErrors.HasAny() {
				log.Println("cbRegion KeyValueInfoList vErrors", vErrors.Error())
				return errors.WithStack(vErrors)
			}
			if err != nil {
				log.Println("cbRegion KeyValueInfoList err", err)
				return errors.WithStack(err)
			}
		}
	}
	return nil
}

// Credential 동기화
func SyncCredential(c buffalo.Context) error {
	cbCredentialList, status := GetCredentialList()
	if status.StatusCode == 500 {
		return errors.New(status.Message)
	}
	// 조회 내역 db에 저장
	tx := c.Value("tx").(*pop.Connection)
	for _, cbCredential := range cbCredentialList {
		b := CheckExistsCredential(cbCredential.ProviderName, cbCredential.CredentialName)
		cr := &models.Credential{}
		//cr.ProviderID = cbCredential.ProviderName
		cr.CredentialName = cbCredential.CredentialName
		cr.UserLevel = "admin" // sync는 public으로. 향후 Role 조정하도록
		credentialID := uuid.UUID{}
		log.Println(" result ", b)
		if !b { // 없으면 create
			verr, err := cr.Create(tx)
			log.Println(" Create result ")
			if verr.HasAny() {
				log.Println("verr ", verr)
				spew.Dump("Credential creation failed ", *cr)
				return errors.WithStack(verr)
			}
			if err != nil {
				log.Println("err ", err)
				spew.Dump("Credential creation failed ", *cr)
				return errors.WithStack(err)
			}
			credentialID = cr.ID
		} else { // 있으면 update
			verr, err := cr.Update(tx)
			if verr.HasAny() {
				spew.Dump("Credential update succeed ", *cr)
				return errors.WithStack(verr)
			}
			if err != nil {
				spew.Dump("Credential update failed ", *cr)
				return errors.WithStack(err)
			}
			// Credential 조회
			log.Println(" Credential keyvalue start ", cr)
			credentialVals := &models.Credential{}
			err = tx.Where("credential_name = ? ", cbCredential.CredentialName).Where("provider_id = ?", cbCredential.ProviderName).First(credentialVals)
			//err := tx.Find(credentialVals, cr.ID)// 이미 있는경우 ID는 비어있으므로 사용할 수 없음
			if err != nil {
				errors.WithStack(err)
			}
			log.Println("credentialKeyVal ", credentialVals)
			credentialID = credentialVals.ID
		}
		// Credential keyvalue

		for _, credentialKeyVal := range cbCredential.KeyValueInfoList {
			log.Println("cbCredential KeyValueInfoList ", credentialKeyVal)
			spew.Dump(credentialKeyVal)
			crKeyVal := &models.CredentialKeyvalue{}
			crKeyVal.CredentialID = credentialID
			crKeyVal.Key = credentialKeyVal.Key
			crKeyVal.Value = credentialKeyVal.Value
			vErrors, err := crKeyVal.Create(tx)
			if vErrors.HasAny() {
				log.Println("cbCredential KeyValueInfoList vErrors", vErrors.Error())
				return errors.WithStack(vErrors)
			}
			if err != nil {
				log.Println("cbCredential KeyValueInfoList err", err)
				return errors.WithStack(err)
			}
		}
	}
	return nil
}

// Connection 동기화
func SyncConnection(c buffalo.Context) error {
	// connection 조회
	connectionList, status := GetCloudConnectionConfigList()
	if status.StatusCode == 500 {
		return errors.New(status.Message)
	}
	// 조회 내역 db에 저장
	tx := c.Value("tx").(*pop.Connection)
	for _, connection := range connectionList {

		connectionView := views.ViewCloudConnection{}
		connectionView.ProviderID = connection.ProviderID
		connectionView.ConnectionName = connection.ConfigName
		connectionView.DriverName = connection.DriverName
		b := CheckExistsCloudConnection(connectionView)

		// credentialUUID, err := uuid.FromString(connection.CredentialName)
		log.Println("BEFORE INSERT ===================")
		spew.Dump(connection)
		credential, err := GetCredentialByName(connection.ProviderName, connection.CredentialName, c)
		if err != nil {
			log.Println("credential uuid parsing failed : ", err)
			continue
		}

		driver, err := GetDriverByName(connection.DriverName, c)
		if err != nil {
			log.Println("driver uuid parsing failed : ", driver, err)
			continue
		}

		region, err := GetRegionByName(connection.RegionName, c)
		if err != nil {
			log.Println("region uuid parsing failed : ", err)
			continue
		}

		conn := &models.CloudConnection{}
		conn.ProviderID = connection.ProviderName
		conn.ConnectionName = connection.ConfigName
		//conn.CredentialID = credential.ID// credential uuid parsing failed :  unable to fetch records: expected slice but got struct
		//conn.DriverID = driver.ID
		//conn.RegionID = region.ID
		conn.Credential = &credential
		conn.Driver = &driver
		conn.Region = &region
		//log.Println("region : ", region)
		//log.Println("credential : ", credential)
		//log.Println("driver : ", driver)
		// conn.CloudProvider.ID = connection.ProviderName
		// conn.Credential.ID = credentialUUID// 직접 ID에 할당하면 되는가?
		// conn.Driver.ID = connection.Driver
		// conn.Region = conn.Region
		if !b { // 없으면 create
			verr, err := conn.Create(tx)
			if verr.HasAny() {
				spew.Dump("conn creation succeed ", *conn)
				return errors.WithStack(verr)
			}
			if err != nil {
				spew.Dump("conn creation failed ", conn)
				return errors.WithStack(err)
			}
		} else { // 있으면 update
			verr, err := conn.Update(tx)
			if verr.HasAny() {
				spew.Dump("conn update succeed ", *conn)
				return errors.WithStack(verr)
			}
			if err != nil {
				spew.Dump("conn update failed ", conn)
				return errors.WithStack(err)
			}
		}
	}
	return nil
}

// credential 추가시 호출
// 모든 region에 대해 해당 credential로 connection 생성
func GenerateConnectionsByCredential(paramProviderID string, paramCredentialName string, c buffalo.Context) error {
	// 해당 provider의 driver 조회
	driverInfo, err := GetDriverByProvider(paramProviderID, c)
	if err != nil {
		return err
	}

	// spider의 모든 connection 조회
	connectionList, respStatus := GetCloudConnectionConfigList()
	if respStatus.StatusCode == 500 {
		return errors.New(respStatus.Message)
	}

	// spider의 모든 region 조회
	regionList, respStatus := GetRegionList()
	if respStatus.StatusCode == 500 {
		return errors.New(respStatus.Message)
	}

	// 해당 region에  connection이 있으면 skip 없으면 생성
	for idx, spiderRegion := range regionList {
		if paramProviderID != spiderRegion.ProviderName {
			continue
		}

		keyValueList := spiderRegion.KeyValueInfoList

		regionValue := ""
		zoneValue := ""
		for _, keyValue := range keyValueList {
			if keyValue.Key == "Region" {
				regionValue = keyValue.Value
			}
			if keyValue.Key == "Zone" {
				zoneValue = keyValue.Value
			}
		}

		if regionValue == "" || zoneValue == "" {
			continue
		}

		connectionView := views.ViewCloudConnection{}
		connectionView.ProviderID = paramProviderID
		connectionView.DriverName = driverInfo.DriverName
		connectionView.RegionName = regionValue
		connectionView.ZoneName = zoneValue
		connectionView.CredentialName = paramCredentialName

		log.Println("CheckExistsCloudConnection")
		b := CheckExistsCloudConnection(connectionView) //db에 connection이 있는지 check
		log.Println("CheckExistsCloudConnection result ", b)
		if !b { // 없으면 생성
			// credential 조회 => credentialId
			b := CheckExistsCredential(paramProviderID, paramCredentialName)
			if !b {
				// create Credential
				log.Println("need to reg credential to db ", paramCredentialName)
				cr := &models.Credential{}
				cr.ProviderID = paramProviderID
				cr.CredentialName = paramCredentialName
				cr.UserLevel = "admin" // sync는 public으로. 향후 Role 조정하도록

				tx := c.Value("tx").(*pop.Connection)
				verr, err := cr.Create(tx)
				if err != nil {
					log.Println("cr create err", err)
				}
				if verr != nil {
					log.Println("cr create verr", verr)
				}
				return nil
			}
			credentialInfo, err := MconCredentialGet(&models.Credential{ProviderID: paramProviderID, CredentialName: paramCredentialName})
			if err != nil {
				log.Println("credential err ", err)
				return err
			}
			log.Println("spiderRegion ", spiderRegion)
			// region 조회 => regionId
			regionInfo, err := MconRegionGet(&models.Region{ProviderID: paramProviderID, RegionName: spiderRegion.RegionName})
			if err != nil {
				log.Println("region err ", err)
				return err
			}

			// spider에 connection이 있으면 db에만 저장.
			// var connectionName = paramProviderID + "-" + regionInfo.RegionName
			// spiderConnection, respStatus := GetCloudConnectionConfigData(connectionName)
			// if respStatus.StatusCode == 500 {
			// 	log.Println("GetCloudConnectionConfigData err", respStatus)
			// 	return nil
			// }

			// credential & region으로 connection 찾기
			spiderExistsConnection := false
			spiderConnectionName := ""
			for _, spiderConn := range connectionList {
				spiderProviderId := spiderConn.ProviderID
				spiderProviderName := spiderConn.ProviderName
				spiderRegionName := spiderConn.RegionName
				spiderCredentialName := spiderConn.CredentialName

				log.Println("paramProviderID ", paramProviderID)
				log.Println("spiderProviderId ", spiderProviderId)
				log.Println("spiderProviderName ", spiderProviderName)
				log.Println("regionInfo.RegionName ", regionInfo.RegionName)
				log.Println("spiderRegionName ", spiderRegionName)
				log.Println("paramCredentialName ", paramCredentialName)
				log.Println("spiderCredentialName ", spiderCredentialName)
				// 비교 :
				if strings.EqualFold(paramProviderID, spiderProviderName) && strings.EqualFold(regionInfo.RegionName, spiderRegionName) && strings.EqualFold(paramCredentialName, spiderCredentialName) {
					spiderExistsConnection = true
					spiderConnectionName = spiderConn.ConfigName
					break
				}
			}
			log.Println("spiderConnectionName ", spiderConnectionName)
			log.Println("spiderExistsConnection ", spiderExistsConnection)
			if !spiderExistsConnection {
				spiderConnectionName = regionInfo.RegionName + "-conn" // region명에 -conn을 붙인다(region명에 provider가 포함되어 있음)

				paramConnectionInfo := new(spider.CloudConnectionConfigInfo)
				paramConnectionInfo.ConfigName = spiderConnectionName
				paramConnectionInfo.ProviderID = strings.ToUpper(paramProviderID)
				paramConnectionInfo.ProviderName = strings.ToUpper(paramProviderID)
				paramConnectionInfo.CredentialName = credentialInfo.CredentialName
				paramConnectionInfo.DriverName = driverInfo.DriverName
				paramConnectionInfo.RegionName = regionInfo.RegionName

				_, respStatus := RegCloudConnectionConfig(paramConnectionInfo)
				if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
					log.Println("spider connection reg failed ", respStatus.Message)
					return nil
				}
			}
			//spiderConnection.ConfigName

			conn := &models.CloudConnection{}
			conn.ProviderID = paramProviderID
			conn.ConnectionName = strings.ToLower(spiderConnectionName)
			conn.Credential = &credentialInfo
			conn.Driver = &driverInfo
			conn.Region = &regionInfo

			tx := c.Value("tx").(*pop.Connection)
			verr, err := conn.Create(tx)
			if verr.HasAny() {
				spew.Dump("conn creation succeed ", *conn)
				return errors.WithStack(verr)
			}
			if err != nil {
				spew.Dump("conn creation failed ", conn)
				return errors.WithStack(err)
			}
		} else {
			log.Println("CheckExistsCloudConnection exist ", b)
		}
		log.Println("CheckExistsCloudConnection end ", idx)
	}
	return nil
}
