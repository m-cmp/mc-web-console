package service

import "strings"

// AsyncTrackOperationIDs mirrors Front ASYNC_TRACK_OPERATION_IDS (WEB-TECH-017).
var AsyncTrackOperationIDs = map[string]struct{}{
	"PostInfraDynamic":             {},
	"PostInfraDynamicFromTemplate": {},
	"PostK8sClusterDynamic":        {},
	"PostK8sCluster":               {},
	// Expert 모드(WEB-TECH-052) — PostInfra/PostInfraNode는 완전 동기 API라
	// front의 ASYNC_TRACK_OPERATION_IDS와 동일하게 등록해 async_request_poller가
	// cb-tumblebug의 reqID 기반 진행상황을 추적하도록 한다.
	"PostInfra":                          {},
	"PostInfraNode":                      {},
	"PostInfraNodeGroupDynamic":          {},
	"PostInfraNodeGroupScaleOut":         {},
	"PostK8sNodeGroupDynamic":            {},
	"Postk8snodegroup":                   {},
	"PutSetK8sNodeGroupAutoscaling":      {},
	"PutChangeK8sNodeGroupAutoscaleSize": {},
	"GetControlInfra":                    {},
	"GetControlInfraNode":                {},
	"PostInfraNodeSnapshot":              {},
	"DelInfra":                           {},
	"DelInfraNode":                       {},
	"Deletek8scluster":                   {},
	"Deletek8snodegroup":                 {},
}

// IsAsyncTrackOperation reports whether operationId should be persisted.
func IsAsyncTrackOperation(operationID string) bool {
	_, ok := AsyncTrackOperationIDs[operationID]
	if ok {
		return true
	}
	// case-insensitive fallback for yaml casing quirks
	for id := range AsyncTrackOperationIDs {
		if strings.EqualFold(id, operationID) {
			return true
		}
	}
	return false
}
