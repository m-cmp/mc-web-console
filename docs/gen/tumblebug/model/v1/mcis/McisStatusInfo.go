package mcis

type McisStatusInfo struct {
	TargetAction	string	`json:"targetAction"`
	TargetStatus	string	`json:"targetStatus"`
	Vm	[]TbVmStatusInfo	`json:"vm"`
	Id	string	`json:"id"`
	MasterSSHPort	string	`json:"masterSSHPort"`
	MasterVmId	string	`json:"masterVmId"`
	Name	string	`json:"name"`
	SystemLabel	string	`json:"systemLabel"`
	InstallMonAgent	string	`json:"installMonAgent"`
	Label	string	`json:"label"`
	MasterIp	string	`json:"masterIp"`
	Status	string	`json:"status"`
	StatusCount	StatusCountInfo	`json:"statusCount"`
}