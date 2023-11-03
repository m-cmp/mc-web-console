package mcis

type TbMcisReq struct {
	Vm	[]TbVmReq	`json:"vm"`
	Description	string	`json:"description"`
	InstallMonAgent	string	`json:"installMonAgent"`
	Label	string	`json:"label"`
	Name	string	`json:"name"`
	PlacementAlgo	string	`json:"placementAlgo"`
	SystemLabel	string	`json:"systemLabel"`
}