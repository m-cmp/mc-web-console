package self

import (
	"mc_web_console_api/handler"
	"strings"

	"github.com/gobuffalo/buffalo"
)

// Disk 정보 조회
// Provider, connection 에서 사용가능한 DiskType 조회
// 현재 : spider의 cloudos_meta.yaml 값 사용
// func DiskLookup(providerId string, connectionName string) ([]handler.LookupDiskInfo, error) {
func DiskLookup(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	providerId := strings.ToUpper(commonRequest.QueryParams["provider"])
	connectionName := commonRequest.QueryParams["connectionName"]

	//defaultNameSpaceID := loginInfo.DefaultNameSpaceID
	diskInfoMap := map[string]LookupDiskInfo{}

	// 변환 : 구분자만 빼서 공백 빼고 array로
	awsRootdiskType := "standard / gp2 / gp3"
	awsDiskType := "standard / gp2 / gp3 / io1 / io2 / st1 / sc1"
	awsDiskSize := "standard|1|1024|GB / gp2|1|16384|GB / gp3|1|16384|GB / io1|4|16384|GB / io2|4|16384|GB / st1|125|16384|GB / sc1|125|16384|GB"

	awsDiskInfo := LookupDiskInfo{}
	awsDiskInfo.ProviderID = "AWS"
	awsDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(awsRootdiskType, " ", ""), "/")
	awsDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(awsDiskType, " ", ""), "/")
	awsDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(awsDiskSize, " ", ""), "/")
	diskInfoMap["AWS"] = awsDiskInfo

	gcpRootdiskType := "pd-standard / pd-balanced / pd-ssd / pd-extreme"
	gcpDiskType := "pd-standard / pd-balanced / pd-ssd / pd-extreme"
	gcpDiskSize := "pd-standard|10|65536|GB / pd-balanced|10|65536|GB / pd-ssd|10|65536|GB / pd-extreme|500|65536|GB"

	gcpDiskInfo := LookupDiskInfo{}
	gcpDiskInfo.ProviderID = "GCP"
	gcpDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(gcpRootdiskType, " ", ""), "/")
	gcpDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(gcpDiskType, " ", ""), "/")
	gcpDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(gcpDiskSize, " ", ""), "/")
	diskInfoMap["GCP"] = gcpDiskInfo

	aliRootdiskType := "cloud_essd / cloud_efficiency / cloud / cloud_ssd"
	aliDiskType := "cloud / cloud_efficiency / cloud_ssd / cloud_essd"
	aliDiskSize := "cloud|5|2000|GB / cloud_efficiency|20|32768|GB / cloud_ssd|20|32768|GB / cloud_essd_PL0|40|32768|GB / cloud_essd_PL1|20|32768|GB / cloud_essd_PL2|461|32768|GB / cloud_essd_PL3|1261|32768|GB"

	aliDiskInfo := LookupDiskInfo{}
	aliDiskInfo.ProviderID = "ALIBABA"
	aliDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(aliRootdiskType, " ", ""), "/")
	aliDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(aliDiskType, " ", ""), "/")
	aliDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(aliDiskSize, " ", ""), "/")
	diskInfoMap["ALIBABA"] = aliDiskInfo

	tencentRootdiskType := "CLOUD_PREMIUM / CLOUD_SSD"
	tencentDiskType := "CLOUD_PREMIUM / CLOUD_SSD / CLOUD_HSSD / CLOUD_BASIC / CLOUD_TSSD"
	tencentDiskSize := "CLOUD_PREMIUM|10|32000|GB / CLOUD_SSD|20|32000|GB / CLOUD_HSSD|20|32000|GB / CLOUD_BASIC|10|32000|GB / CLOUD_TSSD|10|32000|GB"

	tencentDiskInfo := LookupDiskInfo{}
	tencentDiskInfo.ProviderID = "TENCENT"
	tencentDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(tencentRootdiskType, " ", ""), "/")
	tencentDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(tencentDiskType, " ", ""), "/")
	tencentDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(tencentDiskSize, " ", ""), "/")
	diskInfoMap["TENCENT"] = tencentDiskInfo

	dataDiskInfoList := []LookupDiskInfo{}
	if providerId != "" {
		// TODO : 해당 connection으로 사용가능한 DISK 정보 조회
		if connectionName != "" { // 현재는 connection으로 filter 하지 않음

		}
		//providerDisk := LookupDiskInfo{}
		providerDisk := diskInfoMap[providerId]
		dataDiskInfoList = append(dataDiskInfoList, providerDisk)
	} else if connectionName != "" {
		// 모든 provider의 datadisk 정보 조회...
		// getConnection 에서 Provider 가져옴
	}

	commonResponse := &handler.CommonResponse{}
	commonResponse.Status.Message = "success"
	commonResponse.Status.StatusCode = 200
	commonResponse.ResponseData = dataDiskInfoList
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

// Provider, Region 에서 사용가능한 DiskType 조회
// 현재 : spider의 cloudos_meta.yaml 값 사용
// Region 값에 따라 달라지는게 있으면 추가할 것.c buffalo.Context, commonRequest *handler.CommonRequest
func AvailableDiskTypeByProviderRegion(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	providerId := strings.ToUpper(commonRequest.QueryParams["provider"])
	regionName := commonRequest.QueryParams["regionName"]

	diskInfoMap := map[string]AvailableDiskType{}

	// 변환 : 구분자만 빼서 공백 빼고 array로
	awsRootdiskType := "standard / gp2 / gp3"
	awsDiskType := "standard / gp2 / gp3 / io1 / io2 / st1 / sc1"
	awsDiskSize := "standard|1|1024|GB / gp2|1|16384|GB / gp3|1|16384|GB / io1|4|16384|GB / io2|4|16384|GB / st1|125|16384|GB / sc1|125|16384|GB"

	awsDiskInfo := AvailableDiskType{}
	awsDiskInfo.ProviderID = "AWS"
	awsDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(awsRootdiskType, " ", ""), "/")
	awsDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(awsDiskType, " ", ""), "/")
	awsDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(awsDiskSize, " ", ""), "/")
	diskInfoMap["AWS"] = awsDiskInfo

	gcpRootdiskType := "pd-standard / pd-balanced / pd-ssd / pd-extreme"
	gcpDiskType := "pd-standard / pd-balanced / pd-ssd / pd-extreme"
	gcpDiskSize := "pd-standard|10|65536|GB / pd-balanced|10|65536|GB / pd-ssd|10|65536|GB / pd-extreme|500|65536|GB"

	gcpDiskInfo := AvailableDiskType{}
	gcpDiskInfo.ProviderID = "GCP"
	gcpDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(gcpRootdiskType, " ", ""), "/")
	gcpDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(gcpDiskType, " ", ""), "/")
	gcpDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(gcpDiskSize, " ", ""), "/")
	diskInfoMap["GCP"] = gcpDiskInfo

	aliRootdiskType := "cloud_essd / cloud_efficiency / cloud / cloud_ssd"
	aliDiskType := "cloud / cloud_efficiency / cloud_ssd / cloud_essd"
	aliDiskSize := "cloud|5|2000|GB / cloud_efficiency|20|32768|GB / cloud_ssd|20|32768|GB / cloud_essd_PL0|40|32768|GB / cloud_essd_PL1|20|32768|GB / cloud_essd_PL2|461|32768|GB / cloud_essd_PL3|1261|32768|GB"

	aliDiskInfo := AvailableDiskType{}
	aliDiskInfo.ProviderID = "ALIBABA"
	aliDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(aliRootdiskType, " ", ""), "/")
	aliDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(aliDiskType, " ", ""), "/")
	aliDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(aliDiskSize, " ", ""), "/")
	diskInfoMap["ALIBABA"] = aliDiskInfo

	tencentRootdiskType := "CLOUD_PREMIUM / CLOUD_SSD"
	tencentDiskType := "CLOUD_PREMIUM / CLOUD_SSD / CLOUD_HSSD / CLOUD_BASIC / CLOUD_TSSD"
	tencentDiskSize := "CLOUD_PREMIUM|10|32000|GB / CLOUD_SSD|20|32000|GB / CLOUD_HSSD|20|32000|GB / CLOUD_BASIC|10|32000|GB / CLOUD_TSSD|10|32000|GB"

	tencentDiskInfo := AvailableDiskType{}
	tencentDiskInfo.ProviderID = "TENCENT"
	tencentDiskInfo.RootDiskType = strings.Split(strings.ReplaceAll(tencentRootdiskType, " ", ""), "/")
	tencentDiskInfo.DataDiskType = strings.Split(strings.ReplaceAll(tencentDiskType, " ", ""), "/")
	tencentDiskInfo.DiskSize = strings.Split(strings.ReplaceAll(tencentDiskSize, " ", ""), "/")
	diskInfoMap["TENCENT"] = tencentDiskInfo

	dataDiskInfoList := []AvailableDiskType{}
	if providerId != "" {
		if regionName != "" { // TODO : Region에 따라 달라지면 보완할 것

		}
		providerDisk := diskInfoMap[strings.ToUpper(providerId)]
		dataDiskInfoList = append(dataDiskInfoList, providerDisk)
	}

	commonResponse := handler.CommonResponseStatusOK(dataDiskInfoList)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
