package mcis

import (
	tbcommon "mc_web_console/frameworkmodel/tumblebug/common"
)

type RegisterResourceResult struct {
	ConnectionName        string                `json:"connectionName"`
	ElapsedTime           int                   `json:"elapsedTime"`
	RegisterationOutputs  tbcommon.TbIdList     `json:"registerationOutputs"`
	RegisterationOverview RegisterationOverview `json:"registerationOverview"`
	SystemMessage         string                `json:"systemMessage"`
}
