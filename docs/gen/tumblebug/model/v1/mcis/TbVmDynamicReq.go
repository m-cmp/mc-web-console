package mcis

type TbVmDynamicReq struct {
	CommonSpec	string	`json:"commonSpec"`
	Description	string	`json:"description"`
	Label	string	`json:"label"`
	Name	string	`json:"name"`
	VmGroupSize	string	`json:"vmGroupSize"`
	CommonImage	string	`json:"commonImage"`
}