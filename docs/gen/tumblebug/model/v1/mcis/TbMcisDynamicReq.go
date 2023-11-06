package mcis

type TbMcisDynamicReq struct {
	SystemLabel	string	`json:"systemLabel"`
	Vm	[]TbVmDynamicReq	`json:"vm"`
	Description	string	`json:"description"`
	InstallMonAgent	string	`json:"installMonAgent"`
	Label	string	`json:"label"`
	Name	string	`json:"name"`
}