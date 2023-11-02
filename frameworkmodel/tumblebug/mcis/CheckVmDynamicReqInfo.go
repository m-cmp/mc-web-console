package mcis

import (
	tbcommon "mc_web_console/frameworkmodel/tumblebug/common"
	tbmcir "mc_web_console/frameworkmodel/tumblebug/mcir"
)

type CheckVmDynamicReqInfo struct {
	ConnectionConfigCandidates []string          `json:"connectionConfigCandidates"`
	Region                     tbcommon.TbRegion `json:"region"`
	SystemMessage              string            `json:"systemMessage"`
	VmSpec                     tbmcir.TbSpecInfo `json:"vmSpec"`
}
