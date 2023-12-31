package dragonfly

// VM Monitoring 시 parameter 전달용
type VmMonitoringReq struct {
	NameSpaceID        string `json:"nameSpaceID"`
	McisID             string `json:"mcisID"`
	VmID               string `json:"vmID"`
	AgentIp            string `json:"agentIp"`
	Metric             string `json:"metric"`
	PeriodType         string `json:"periodType"`
	StatisticsCriteria string `json:"statisticsCriteria"`
	Duration           string `json:"duration"`
	WatchTime          string `json:"watchTime"`
}
