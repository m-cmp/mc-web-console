package mcir

type FilterSpecsByRangeRequest struct {
	GpuModel	string	`json:"gpuModel"`
	Id	string	`json:"id"`
	MemGiB	Range	`json:"memGiB"`
	OsType	string	`json:"osType"`
	NumvCPU	Range	`json:"numvCPU"`
	EvaluationScore09	Range	`json:"evaluationScore09"`
	GpuP2p	string	`json:"gpuP2p"`
	MaxNumStorage	Range	`json:"maxNumStorage"`
	Name	string	`json:"name"`
	CspSpecName	string	`json:"cspSpecName"`
	EvaluationScore08	Range	`json:"evaluationScore08"`
	NumStorage	Range	`json:"numStorage"`
	EvaluationStatus	string	`json:"evaluationStatus"`
	EbsBwMbps	Range	`json:"ebsBwMbps"`
	EvaluationScore01	Range	`json:"evaluationScore01"`
	EvaluationScore05	Range	`json:"evaluationScore05"`
	EvaluationScore06	Range	`json:"evaluationScore06"`
	EvaluationScore02	Range	`json:"evaluationScore02"`
	EvaluationScore04	Range	`json:"evaluationScore04"`
	GpuMemGiB	Range	`json:"gpuMemGiB"`
	MaxTotalStorageTiB	Range	`json:"maxTotalStorageTiB"`
	NumGpu	Range	`json:"numGpu"`
	ConnectionName	string	`json:"connectionName"`
	EvaluationScore03	Range	`json:"evaluationScore03"`
	EvaluationScore07	Range	`json:"evaluationScore07"`
	EvaluationScore10	Range	`json:"evaluationScore10"`
	StorageGiB	Range	`json:"storageGiB"`
	CostPerHour	Range	`json:"costPerHour"`
	Description	string	`json:"description"`
	NetBwGbps	Range	`json:"netBwGbps"`
	Numcore	Range	`json:"numcore"`
}