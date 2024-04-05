package mcir

import (
	tbcommon "mc_web_console_api/echomodel/tumblebug/common"
)

type TbSubnetReq struct {
	Name          string                `json:"name"`
	Description   string                `json:"description"`
	Ipv4_CIDR     string                `json:"ipv4_CIDR"`
	KeyValueInfos []tbcommon.TbKeyValue `json:"keyValueList"`

	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}

type TbSubnetReqs []TbSubnetReq
