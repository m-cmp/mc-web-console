package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	// "math"
	"net/http"
	// "strconv"
	// "sync"

	//"github.com/davecgh/go-spew/spew"

	// "mc_web_console_api/fwmodels/spider"
	// "mc_web_console_api/fwmodels/tumblebug"
	"mc_web_console_api/fwmodels"
	tbcommon "mc_web_console_api/fwmodels/tumblebug/common"
	tbmcir "mc_web_console_api/fwmodels/tumblebug/mcir"
	"mc_web_console_api/fwmodels/webconsole"

	util "mc_web_console_api/util"

	"github.com/gobuffalo/buffalo"
)

// DataDisk 목록 조회
func GetDataDiskList(nameSpaceID string, optionParam string, filterKeyParam string, filterValParam string) ([]tbmcir.TbDataDiskInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/resources/dataDisk"
	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	if optionParam != "" {
		urlParam += "?option=" + optionParam
	} else {
		urlParam += "?option="
	}
	if filterKeyParam != "" {
		urlParam += "&filterKey=" + filterKeyParam
		urlParam += "&filterVal=" + filterValParam
	}

	url := util.TUMBLEBUG + urlParam

	resp, err := util.CommonHttp(url, nil, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// defer body.Close()
	respBody := resp.Body
	respStatus := resp.StatusCode

	// return respBody, respStatus
	log.Println(respBody)
	dataDiskInfoList := map[string][]tbmcir.TbDataDiskInfo{}
	json.NewDecoder(respBody).Decode(&dataDiskInfoList)
	//spew.Dump(body)
	fmt.Println(dataDiskInfoList["dataDisk"])

	return dataDiskInfoList["dataDisk"], fwmodels.WebStatus{StatusCode: respStatus}
}

func GetDataDiskListByID(nameSpaceID string, filterKeyParam string, filterValParam string) ([]string, fwmodels.WebStatus) {
	fmt.Println("GetDataDiskListByID ************ : ")
	var originalUrl = "/ns/{nsId}/resources/dataDisk"
	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	urlParam += "?option=id"
	if filterKeyParam != "" {
		urlParam += "&filterKey=" + filterKeyParam
		urlParam += "&filterVal=" + filterValParam
	}
	url := util.TUMBLEBUG + urlParam
	resp, err := util.CommonHttp(url, nil, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// defer body.Close()
	respBody := resp.Body
	respStatus := resp.StatusCode

	// return respBody, respStatus
	log.Println(respBody)
	//vNetInfoList := map[string][]string{}
	dataDiskInfoList := tbcommon.TbIdList{}
	json.NewDecoder(respBody).Decode(&dataDiskInfoList)

	return dataDiskInfoList.IDList, fwmodels.WebStatus{StatusCode: respStatus}
}

// List 조회시 optionParam 추가
func GetDataDiskListByOption(nameSpaceID string, optionParam string, filterKeyParam string, filterValParam string) ([]tbmcir.TbDataDiskInfo, fwmodels.WebStatus) {
	fmt.Println("GetDataDiskListByOption ************ : ")
	var originalUrl = "/ns/{nsId}/resources/dataDisk"
	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	if optionParam != "" {
		urlParam += "?option=" + optionParam
	} else {
		urlParam += "?option="
	}
	if filterKeyParam != "" {
		urlParam += "&filterKey=" + filterKeyParam
		urlParam += "&filterVal=" + filterValParam
	}
	url := util.TUMBLEBUG + urlParam

	resp, err := util.CommonHttp(url, nil, http.MethodGet)

	if err != nil {
		fmt.Println(err)
		return nil, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	// defer body.Close()
	respBody := resp.Body
	respStatus := resp.StatusCode

	// return respBody, respStatus
	log.Println(respBody)
	dataDiskInfoList := map[string][]tbmcir.TbDataDiskInfo{}
	json.NewDecoder(respBody).Decode(&dataDiskInfoList)
	//spew.Dump(body)
	fmt.Println(dataDiskInfoList["dataDisk"])

	return dataDiskInfoList["dataDisk"], fwmodels.WebStatus{StatusCode: respStatus}
}

func RegDataDisk(nameSpaceID string, dataDiskReqInfo *tbmcir.TbDataDiskReq) (*tbmcir.TbDataDiskInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/resources/dataDisk"
	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)

	url := util.TUMBLEBUG + urlParam

	fmt.Println("dataDiskReqInfo : ", dataDiskReqInfo)

	pbytes, _ := json.Marshal(dataDiskReqInfo)
	fmt.Println(string(pbytes))
	resp, err := util.CommonHttp(url, pbytes, http.MethodPost)
	resultDataDiskInfo := tbmcir.TbDataDiskInfo{}
	if err != nil {
		fmt.Println(err)
		return &resultDataDiskInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode
	fmt.Println("respStatus ", respStatus)

	if respStatus == 500 {
		webStatus := fwmodels.WebStatus{}
		json.NewDecoder(respBody).Decode(&webStatus)
		fmt.Println(webStatus)
		webStatus.StatusCode = respStatus
		return &resultDataDiskInfo, webStatus
	}
	// 응답에 생성한 객체값이 옴
	json.NewDecoder(respBody).Decode(&resultDataDiskInfo)
	fmt.Println(resultDataDiskInfo)

	return &resultDataDiskInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

// Async로 Disk 생성 : 항목 안에 attached Vm 정보가 있으면 생성 후 attach까지 한다.
func AsyncRegDataDisk(nameSpaceID string, dataDiskReqInfo *webconsole.DataDiskCreateReq, c buffalo.Context) {
	taskKey := nameSpaceID + "||" + "disk" + "||" + dataDiskReqInfo.Name

	// DataDiskCreateReq -> tbmcir.TbDataDiskReq
	tbDataDiskReq := tbmcir.TbDataDiskReq{}
	tbDataDiskReq.Name = dataDiskReqInfo.Name
	tbDataDiskReq.ConnectionName = dataDiskReqInfo.ConnectionName
	tbDataDiskReq.CspDataDiskId = dataDiskReqInfo.CspDataDiskId
	tbDataDiskReq.Description = dataDiskReqInfo.Description
	tbDataDiskReq.DiskSize = dataDiskReqInfo.DiskSize
	tbDataDiskReq.DiskType = dataDiskReqInfo.DiskType

	resultDataDiskInfo, respStatus := RegDataDisk(nameSpaceID, &tbDataDiskReq)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		StoreWebsocketMessage(util.TASK_TYPE_DISK, taskKey, util.DISK_LIFECYCLE_CREATE, util.TASK_STATUS_FAIL, c)
	} else {
		StoreWebsocketMessage(util.TASK_TYPE_DISK, taskKey, util.DISK_LIFECYCLE_CREATE, util.TASK_STATUS_COMPLETE, c)

		// create 성공이고 vm에 attach
		if dataDiskReqInfo.AttachVmID != "" {
			// disk 조회해서 available 상태일 때 attach한다.
			// 1. disk 상태조회 : available까지 1초씩 1분 기다릴까?

			// 2. vm에 attach
			mcisID := dataDiskReqInfo.McisID
			vmID := dataDiskReqInfo.AttachVmID
			optionParam := "attach"
			attachDetachDataDiskReq := new(tbmcir.TbAttachDetachDataDiskReq)
			attachDetachDataDiskReq.DataDiskId = resultDataDiskInfo.ID

			AsyncAttachDetachDataDiskToVM(nameSpaceID, mcisID, vmID, optionParam, attachDetachDataDiskReq, c)
			// _, respStatus := AttachDetachDataDiskToVM(nameSpaceID, mcisID, vmID, optionParam, attachDetachDataDiskReq)
			// if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			// 	StoreWebsocketMessage(util.TASK_TYPE_DISK, taskKey, util.DISK_LIFECYCLE_ATTACHED, util.TASK_STATUS_FAIL, c)
			// } else {
			// 	StoreWebsocketMessage(util.TASK_TYPE_DISK, taskKey, util.DISK_LIFECYCLE_ATTACHED, util.TASK_STATUS_COMPLETE, c)
			// }
		}
	}
}

// Namespace내 모든 DataDisk 삭제
func DelAllDataDisk(nameSpaceID string) (fwmodels.WebStatus, fwmodels.WebStatus) {
	webStatus := fwmodels.WebStatus{}

	var originalUrl = "/ns/{nsId}/resources/dataDisk"
	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.TUMBLEBUG + urlParam + "?match=match"

	resp, err := util.CommonHttp(url, nil, http.MethodDelete)

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
}

// DataDisk 삭제
func DelDataDisk(nameSpaceID string, dataDiskID string) (fwmodels.WebStatus, fwmodels.WebStatus) {
	webStatus := fwmodels.WebStatus{}

	var originalUrl = "/ns/{nsId}/resources/dataDisk/{dataDiskId}"
	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{dataDiskId}"] = dataDiskID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.TUMBLEBUG + urlParam

	resp, err := util.CommonHttp(url, nil, http.MethodDelete)

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
}

func AsyncDelDataDisk(nameSpaceID string, dataDiskID string, c buffalo.Context) {
	taskKey := nameSpaceID + "||" + "disk" + "||" + dataDiskID

	_, respStatus := DelDataDisk(nameSpaceID, dataDiskID)
	if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
		StoreWebsocketMessage(util.TASK_TYPE_DISK, taskKey, util.DISK_LIFECYCLE_DELETE, util.TASK_STATUS_FAIL, c)
	} else {
		StoreWebsocketMessage(util.TASK_TYPE_DISK, taskKey, util.DISK_LIFECYCLE_DELETE, util.TASK_STATUS_COMPLETE, c)
	}
}

// DataDisk 상세 조회
func DataDiskGet(nameSpaceID string, dataDiskID string) (*tbmcir.TbDataDiskInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/resources/dataDisk/{dataDiskId}"
	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{dataDiskId}"] = dataDiskID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.TUMBLEBUG + urlParam

	fmt.Println("nameSpaceID : ", nameSpaceID)

	resp, err := util.CommonHttp(url, nil, http.MethodGet)
	dataDiskInfo := tbmcir.TbDataDiskInfo{}
	if err != nil {
		fmt.Println(err)
		return &dataDiskInfo, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	respBody := resp.Body
	respStatus := resp.StatusCode

	json.NewDecoder(respBody).Decode(&dataDiskInfo)
	fmt.Println(dataDiskInfo)

	return &dataDiskInfo, fwmodels.WebStatus{StatusCode: respStatus}
}

func DataDiskPut(nameSpaceID string, dataDiskID string, dataDiskUpsizeReq *tbmcir.TbDataDiskUpsizeReq) (*tbmcir.TbDataDiskInfo, fwmodels.WebStatus) {
	var originalUrl = "/ns/{nsId}/resources/dataDisk/{dataDiskId}"
	var paramMapper = make(map[string]string)
	paramMapper["{nsId}"] = nameSpaceID
	paramMapper["{dataDiskId}"] = dataDiskID
	urlParam := util.MappingUrlParameter(originalUrl, paramMapper)
	url := util.TUMBLEBUG + urlParam

	pbytes, _ := json.Marshal(dataDiskUpsizeReq)
	fmt.Println(string(pbytes))
	resp, err := util.CommonHttp(url, pbytes, http.MethodPut)
	dataDiskInfoResponse := tbmcir.TbDataDiskInfo{}
	if err != nil {
		fmt.Println(err)
		return &dataDiskInfoResponse, fwmodels.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	log.Println("resp = ", resp)
	respBody := resp.Body
	respStatus := resp.StatusCode
	log.Println("respBody = ", respBody)

	json.NewDecoder(respBody).Decode(&dataDiskInfoResponse)
	fmt.Println(dataDiskInfoResponse)

	return &dataDiskInfoResponse, fwmodels.WebStatus{StatusCode: respStatus}
}

// Disk 정보 조회
// Provider, connection 에서 사용가능한 DiskType 조회
// 현재 : spider의 cloudos_meta.yaml 값 사용
func DiskLookup(providerId string, connectionName string) ([]webconsole.LookupDiskInfo, error) {

	//defaultNameSpaceID := loginInfo.DefaultNameSpaceID
	diskInfoMap := map[string]webconsole.LookupDiskInfo{}

	// 변환 : 구분자만 빼서 공백 빼고 array로
	awsRootdiskType := "standard / gp2 / gp3"
	awsDiskType := "standard / gp2 / gp3 / io1 / io2 / st1 / sc1"
	awsDiskSize := "standard|1|1024|GB / gp2|1|16384|GB / gp3|1|16384|GB / io1|4|16384|GB / io2|4|16384|GB / st1|125|16384|GB / sc1|125|16384|GB"

	awsDiskInfo := webconsole.LookupDiskInfo{}
	awsDiskInfo.ProviderID = "AWS"
	awsDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(awsRootdiskType, " ", ""), "/")
	awsDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(awsDiskType, " ", ""), "/")
	awsDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(awsDiskSize, " ", ""), "/")
	diskInfoMap["AWS"] = awsDiskInfo

	gcpRootdiskType := "pd-standard / pd-balanced / pd-ssd / pd-extreme"
	gcpDiskType := "pd-standard / pd-balanced / pd-ssd / pd-extreme"
	gcpDiskSize := "pd-standard|10|65536|GB / pd-balanced|10|65536|GB / pd-ssd|10|65536|GB / pd-extreme|500|65536|GB"

	gcpDiskInfo := webconsole.LookupDiskInfo{}
	gcpDiskInfo.ProviderID = "GCP"
	gcpDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(gcpRootdiskType, " ", ""), "/")
	gcpDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(gcpDiskType, " ", ""), "/")
	gcpDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(gcpDiskSize, " ", ""), "/")
	diskInfoMap["GCP"] = gcpDiskInfo

	aliRootdiskType := "cloud_essd / cloud_efficiency / cloud / cloud_ssd"
	aliDiskType := "cloud / cloud_efficiency / cloud_ssd / cloud_essd"
	aliDiskSize := "cloud|5|2000|GB / cloud_efficiency|20|32768|GB / cloud_ssd|20|32768|GB / cloud_essd_PL0|40|32768|GB / cloud_essd_PL1|20|32768|GB / cloud_essd_PL2|461|32768|GB / cloud_essd_PL3|1261|32768|GB"

	aliDiskInfo := webconsole.LookupDiskInfo{}
	aliDiskInfo.ProviderID = "ALIBABA"
	aliDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(aliRootdiskType, " ", ""), "/")
	aliDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(aliDiskType, " ", ""), "/")
	aliDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(aliDiskSize, " ", ""), "/")
	diskInfoMap["ALIBABA"] = aliDiskInfo

	tencentRootdiskType := "CLOUD_PREMIUM / CLOUD_SSD"
	tencentDiskType := "CLOUD_PREMIUM / CLOUD_SSD / CLOUD_HSSD / CLOUD_BASIC / CLOUD_TSSD"
	tencentDiskSize := "CLOUD_PREMIUM|10|32000|GB / CLOUD_SSD|20|32000|GB / CLOUD_HSSD|20|32000|GB / CLOUD_BASIC|10|32000|GB / CLOUD_TSSD|10|32000|GB"

	tencentDiskInfo := webconsole.LookupDiskInfo{}
	tencentDiskInfo.ProviderID = "TENCENT"
	tencentDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(tencentRootdiskType, " ", ""), "/")
	tencentDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(tencentDiskType, " ", ""), "/")
	tencentDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(tencentDiskSize, " ", ""), "/")
	diskInfoMap["TENCENT"] = tencentDiskInfo

	dataDiskInfoList := []webconsole.LookupDiskInfo{}
	if providerId != "" {
		// TODO : 해당 connection으로 사용가능한 DISK 정보 조회
		if connectionName != "" { // 현재는 connection으로 filter 하지 않음

		}
		//providerDisk := webconsole.LookupDiskInfo{}
		providerDisk := diskInfoMap[providerId]
		dataDiskInfoList = append(dataDiskInfoList, providerDisk)
	} else if connectionName != "" {
		// 모든 provider의 datadisk 정보 조회...
		// getConnection 에서 Provider 가져옴

	}

	return dataDiskInfoList, nil
}

// Provider, Region 에서 사용가능한 DiskType 조회
// 현재 : spider의 cloudos_meta.yaml 값 사용
// Region 값에 따라 달라지는게 있으면 추가할 것.
func AvailableDiskTypeByProviderRegion(providerId string, regionName string) ([]webconsole.AvailableDiskType, error) {

	diskInfoMap := map[string]webconsole.AvailableDiskType{}

	// 변환 : 구분자만 빼서 공백 빼고 array로
	awsRootdiskType := "standard / gp2 / gp3"
	awsDiskType := "standard / gp2 / gp3 / io1 / io2 / st1 / sc1"
	awsDiskSize := "standard|1|1024|GB / gp2|1|16384|GB / gp3|1|16384|GB / io1|4|16384|GB / io2|4|16384|GB / st1|125|16384|GB / sc1|125|16384|GB"

	awsDiskInfo := webconsole.AvailableDiskType{}
	awsDiskInfo.ProviderID = "AWS"
	awsDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(awsRootdiskType, " ", ""), "/")
	awsDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(awsDiskType, " ", ""), "/")
	awsDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(awsDiskSize, " ", ""), "/")
	diskInfoMap["AWS"] = awsDiskInfo

	gcpRootdiskType := "pd-standard / pd-balanced / pd-ssd / pd-extreme"
	gcpDiskType := "pd-standard / pd-balanced / pd-ssd / pd-extreme"
	gcpDiskSize := "pd-standard|10|65536|GB / pd-balanced|10|65536|GB / pd-ssd|10|65536|GB / pd-extreme|500|65536|GB"

	gcpDiskInfo := webconsole.AvailableDiskType{}
	gcpDiskInfo.ProviderID = "GCP"
	gcpDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(gcpRootdiskType, " ", ""), "/")
	gcpDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(gcpDiskType, " ", ""), "/")
	gcpDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(gcpDiskSize, " ", ""), "/")
	diskInfoMap["GCP"] = gcpDiskInfo

	aliRootdiskType := "cloud_essd / cloud_efficiency / cloud / cloud_ssd"
	aliDiskType := "cloud / cloud_efficiency / cloud_ssd / cloud_essd"
	aliDiskSize := "cloud|5|2000|GB / cloud_efficiency|20|32768|GB / cloud_ssd|20|32768|GB / cloud_essd_PL0|40|32768|GB / cloud_essd_PL1|20|32768|GB / cloud_essd_PL2|461|32768|GB / cloud_essd_PL3|1261|32768|GB"

	aliDiskInfo := webconsole.AvailableDiskType{}
	aliDiskInfo.ProviderID = "ALIBABA"
	aliDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(aliRootdiskType, " ", ""), "/")
	aliDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(aliDiskType, " ", ""), "/")
	aliDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(aliDiskSize, " ", ""), "/")
	diskInfoMap["ALIBABA"] = aliDiskInfo

	tencentRootdiskType := "CLOUD_PREMIUM / CLOUD_SSD"
	tencentDiskType := "CLOUD_PREMIUM / CLOUD_SSD / CLOUD_HSSD / CLOUD_BASIC / CLOUD_TSSD"
	tencentDiskSize := "CLOUD_PREMIUM|10|32000|GB / CLOUD_SSD|20|32000|GB / CLOUD_HSSD|20|32000|GB / CLOUD_BASIC|10|32000|GB / CLOUD_TSSD|10|32000|GB"

	tencentDiskInfo := webconsole.AvailableDiskType{}
	tencentDiskInfo.ProviderID = "TENCENT"
	tencentDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(tencentRootdiskType, " ", ""), "/")
	tencentDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(tencentDiskType, " ", ""), "/")
	tencentDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(tencentDiskSize, " ", ""), "/")
	diskInfoMap["TENCENT"] = tencentDiskInfo

	dataDiskInfoList := []webconsole.AvailableDiskType{}
	if providerId != "" {
		if regionName != "" { // TODO : Region에 따라 달라지면 보완할 것

		}
		providerDisk := diskInfoMap[strings.ToUpper(providerId)]
		dataDiskInfoList = append(dataDiskInfoList, providerDisk)
	}

	return dataDiskInfoList, nil
}
