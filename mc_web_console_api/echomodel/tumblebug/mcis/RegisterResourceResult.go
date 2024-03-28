package mcis

import (
	tbcommon "mc_web_console_api/echomodel/tumblebug/common"
)

type RegisterResourceResult struct {
	ConnectionName        string                `json:"connectionName"`
	ElapsedTime           int                   `json:"elapsedTime"`
	RegisterationOutputs  tbcommon.TbIdList     `json:"registerationOutputs"`
	RegisterationOverview RegisterationOverview `json:"registerationOverview"`
	SystemMessage         string                `json:"systemMessage"`
}
