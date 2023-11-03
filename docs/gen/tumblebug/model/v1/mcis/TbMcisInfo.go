package mcis

type TbMcisInfo struct {
	Vm	[]TbVmInfo	`json:"vm"`
	Description	string	`json:"description"`
	Label	string	`json:"label"`
	PlacementAlgo	string	`json:"placementAlgo"`
	SystemLabel	string	`json:"systemLabel"`
	TargetAction	string	`json:"targetAction"`
	TargetStatus	string	`json:"targetStatus"`
	Id	string	`json:"id"`
	InstallMonAgent	string	`json:"installMonAgent"`
	Name	string	`json:"name"`
	Status	string	`json:"status"`
	StatusCount	StatusCountInfo	`json:"statusCount"`
}