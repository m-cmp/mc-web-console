package mcir

import ( 
	"/tumblebug/common
) 
type SpiderSpecInfo struct {
	KeyValueList	[]KeyValue	`json:"keyValueList"`
	Mem	string	`json:"mem"`
	Name	string	`json:"name"`
	Region	string	`json:"region"`
	Vcpu	SpiderVCpuInfo	`json:"vcpu"`
	Gpu	[]SpiderGpuInfo	`json:"gpu"`
}