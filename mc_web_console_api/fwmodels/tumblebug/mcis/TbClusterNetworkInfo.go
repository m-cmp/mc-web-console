package mcis

import tbcommon "mc_web_console_api/fwmodels/tumblebug/common"

type TbClusterNetworkInfo struct {
	VNetId           string   `json:"vNetId"`
	SubnetIds        []string `json:"subnetIds"`
	SecurityGroupIds []string `json:"securityGroupIds"`

	// ---

	KeyValueList []tbcommon.TbKeyValue `json:"keyValueList"`
}
