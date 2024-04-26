package mcis

import tbcommon "mc_web_console_api/fwmodels/tumblebug/common"

// TbClusterAddonsInfo is a struct to handle Cluster Addons information from the CB-Tumblebug's REST API response
type TbClusterAddonsInfo struct {
	KeyValueList []tbcommon.TbKeyValue `json:"keyValueList"`
}
