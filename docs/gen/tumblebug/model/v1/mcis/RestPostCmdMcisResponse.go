package mcis

type RestPostCmdMcisResponse struct {
	Result	string	`json:"result"`
	VmId	string	`json:"vmId"`
	VmIp	string	`json:"vmIp"`
	McisId	string	`json:"mcisId"`
}