package dragonfly

// 멀티 클라우드 인프라 MCIS 온디맨드 모니터링 정보 결과용
type McisMonitoringOnDemandInfoReq struct {
	NameSpaceID string `json:"ns_id"`
	McisID      string `json:"mcis_id"`
	VmID        string `json:"vm_id"`
	AgentIp     string `json:"agent_ip"`
	MetricName  string `json:"metric_name"` // InitDB, ResetDB, CpuM, CpuS, MemR, MemW, FioW, FioR, DBW, DBR, Rtt, Mrtt
}
