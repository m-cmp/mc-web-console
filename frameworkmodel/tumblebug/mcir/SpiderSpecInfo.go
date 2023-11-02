package mcir

import (
	tbcommon "mc_web_console/frameworkmodel/tumblebug/common"
)

type SpiderSpecInfo struct {
	Gpu          SpiderGpuInfo       `json:"gpu"`
	KeyValueList tbcommon.TbKeyValue `json:"keyValueList"`
	Mem          string              `json:"mem"`
	Name         string              `json:"name"`
	Region       string              `json:"region"`
	Vcpu         SpiderVCpuInfo      `json:"vCpu"`
}

type SpiderSpecInfos []SpiderSpecInfo
