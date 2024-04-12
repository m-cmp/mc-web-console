package handler

import (
	// "encoding/base64"
	"fmt"
	"log"

	// "log"
	// "io"
	// "net/http"

	"github.com/gobuffalo/buffalo"

	"mc_web_console_api/fwmodels"
	"mc_web_console_api/fwmodels/spider"

	// "mc_web_console_api/fwmodels/tumblebug"
	tbcommon "mc_web_console_api/fwmodels/tumblebug/common"
	// tbmcir "mc_web_console_api/fwmodels/tumblebug/mcir"
	// tbmcis "mc_web_console_api/fwmodels/tumblebug/mcis"

	util "mc_web_console_api/util"
)

// 로그인할 때, NameSpace 저장(Create, Delete, Update) 외에는 이 funtion 사용
// 없으면 tb 조회
func GetStoredNameSpaceList(c buffalo.Context) ([]tbcommon.TbNsInfo, fwmodels.WebStatus) {
	fmt.Println("====== GET STORED NAME SPACE ========")
	nameSpaceList := []tbcommon.TbNsInfo{}
	nameSpaceErr := fwmodels.WebStatus{}

	if storedNameSpaceList := c.Session().Get(util.STORE_NAMESPACELIST); storedNameSpaceList != nil { // 존재하지 않으면 TB 조회
		log.Println(storedNameSpaceList)
		nameSpaceList = storedNameSpaceList.([]tbcommon.TbNsInfo)
		nameSpaceErr.StatusCode = 200
	} else {
		nameSpaceList, nameSpaceErr = GetNameSpaceList()
		setError := SetStoreNameSpaceList(c, nameSpaceList)
		if setError != nil {
			log.Println("Set Namespace failed")
			nameSpaceErr.StatusCode = 4000
		}
	}
	return nameSpaceList, nameSpaceErr
}

func SetStoreNameSpaceList(c buffalo.Context, nameSpaceList []tbcommon.TbNsInfo) error {
	fmt.Println("====== SET NAME SPACE ========")
	c.Session().Set(util.STORE_NAMESPACELIST, nameSpaceList)
	err := c.Session().Save()
	return err
}

// GetCloudOSList
func GetStoredCloudOSList(c buffalo.Context) ([]string, fwmodels.WebStatus) {
	fmt.Println("====== GET STORED CloudOS ========")
	cloudOSList := []string{}
	cloudOsErr := fwmodels.WebStatus{}

	if storedCloudOSList := c.Session().Get(util.STORE_CLOUDOSLIST); storedCloudOSList != nil { // 존재하지 않으면 TB 조회
		log.Println(storedCloudOSList)
		cloudOSList = storedCloudOSList.([]string)
		cloudOsErr.StatusCode = 200
	} else {
		cloudOSList, cloudOsErr = GetCloudOSList()
		setError := SetStoreCloudOSList(c, cloudOSList)
		if setError != nil {
			log.Println("Set cloudOS failed")
		}

	}
	return cloudOSList, cloudOsErr
}

func SetStoreCloudOSList(c buffalo.Context, cloudOSList []string) error {
	fmt.Println("====== SET cloudOS ========")
	c.Session().Set(util.STORE_CLOUDOSLIST, cloudOSList)
	err := c.Session().Save()
	return err
}

// GetRegionList
func GetStoredRegionList(c buffalo.Context) ([]spider.RegionInfo, fwmodels.WebStatus) {
	fmt.Println("====== GET STORED Region ========")
	regionList := []spider.RegionInfo{}
	regionErr := fwmodels.WebStatus{}

	if storedRegionList := c.Session().Get(util.STORE_REGIONLIST); storedRegionList != nil { // 존재하지 않으면 TB 조회
		log.Println(storedRegionList)
		regionList = storedRegionList.([]spider.RegionInfo)
		regionErr.StatusCode = 200
	} else {
		regionList, regionErr = GetRegionList()
		setError := SetStoreRegionList(c, regionList)
		if setError != nil {
			log.Println("Set Region failed")
		}
	}
	return regionList, regionErr
}

func SetStoreRegionList(c buffalo.Context, regionList []spider.RegionInfo) error {
	fmt.Println("====== SET Region ========")
	c.Session().Set(util.STORE_REGIONLIST, regionList)
	err := c.Session().Save()
	return err
}

// GetCredentialList
func GetStoredCredentialList(c buffalo.Context) ([]spider.CredentialInfo, fwmodels.WebStatus) {
	fmt.Println("====== GET STORED Region ========")
	credentialList := []spider.CredentialInfo{}
	credentialErr := fwmodels.WebStatus{}

	if storedCredentialList := c.Session().Get(util.STORE_CREDENTIALLIST); storedCredentialList != nil { // 존재하지 않으면 TB 조회
		log.Println(storedCredentialList)
		credentialList = storedCredentialList.([]spider.CredentialInfo)
		credentialErr.StatusCode = 200
	} else {
		credentialList, credentialErr = GetCredentialList()
		setError := SetStoreCredentialList(c, credentialList)
		if setError != nil {
			log.Println("Set Credential failed")
		}
	}
	return credentialList, credentialErr
}

func SetStoreCredentialList(c buffalo.Context, credentialList []spider.CredentialInfo) error {
	fmt.Println("====== SET Credential ========")
	c.Session().Set(util.STORE_CREDENTIALLIST, credentialList)
	err := c.Session().Save()
	return err
}

// GetDriverList
func GetStoredDriverList(c buffalo.Context) ([]spider.DriverInfo, fwmodels.WebStatus) {
	fmt.Println("====== GET STORED Driver ========")
	driverList := []spider.DriverInfo{}
	driverErr := fwmodels.WebStatus{}

	if storedDriverList := c.Session().Get(util.STORE_DRIVERLIST); storedDriverList != nil { // 존재하지 않으면 TB 조회
		log.Println(storedDriverList)
		driverList = storedDriverList.([]spider.DriverInfo)
		driverErr.StatusCode = 200
	} else {
		driverList, driverErr = GetDriverList()
		setError := SetStoreDriverList(c, driverList)
		if setError != nil {
			log.Println("Set Driver failed")
		}

	}
	return driverList, driverErr
}

func SetStoreDriverList(c buffalo.Context, driverList []spider.DriverInfo) error {
	fmt.Println("====== SET Driver ========")
	c.Session().Set(util.STORE_DRIVERLIST, driverList)
	err := c.Session().Save()
	return err
}

// GetCloudConnectionConfigList
func GetStoredCloudConnectionConfigList(c buffalo.Context) ([]spider.CloudConnectionConfigInfo, fwmodels.WebStatus) {
	fmt.Println("====== GET STORED CloudConnectionConfigList ========")
	connectionConfigList := []spider.CloudConnectionConfigInfo{}
	connectionConfigErr := fwmodels.WebStatus{}

	if storedConnectionConfigList := c.Session().Get(util.STORE_CLOUDCONNECTIONCONFIGLIST); storedConnectionConfigList != nil { // 존재하지 않으면 TB 조회
		log.Println(storedConnectionConfigList)
		connectionConfigList = storedConnectionConfigList.([]spider.CloudConnectionConfigInfo)
		connectionConfigErr.StatusCode = 200
	} else {
		connectionConfigList, connectionConfigErr = GetCloudConnectionConfigList()
		setError := SetStoreCloudConnectionConfigList(c, connectionConfigList)
		if setError != nil {
			log.Println("Set ConnectionConfigList failed")
		}
	}
	return connectionConfigList, connectionConfigErr
}

func SetStoreCloudConnectionConfigList(c buffalo.Context, connectionConfigList []spider.CloudConnectionConfigInfo) error {
	fmt.Println("====== SET CloudConnectionConfigList ========")
	c.Session().Set(util.STORE_CLOUDCONNECTIONCONFIGLIST, connectionConfigList)
	err := c.Session().Save()
	return err
}
