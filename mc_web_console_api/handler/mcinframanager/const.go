package mcinframanager

var (
	getMcisList             = "/ns/{nsId}/mcis"
	getMcis                 = "/ns/{nsId}/mcis/{mcisId}"
	delMcis                 = "/ns/{nsId}/mcis/{mcisId}"
	createMcis              = "/ns/{nsId}/mcis"
	createDynamicMcis       = "/ns/{nsId}/mcisDynamic"
	getLoadDefaultResource  = "/ns/{nsId}/loadDefaultResource"
	delDefaultResource      = "/ns/{nsId}/defaultResources"
	mcisRecommendVm         = "/mcisRecommendVm"
	mcisDynamicCheckRequest = "/mcisDynamicCheckRequest"
	sendCommandToMcis       = "/ns/{nsId}/cmd/mcis/{mcisId}"
	controlLifecycle        = "/ns/{nsId}/control/mcis/{mcisId}"
	getImageId              = "/ns/system-purpose-common-ns/resources/image/{imageId}"
)
