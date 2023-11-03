package mcis

type AutoAction struct {
	PostCommand	McisCmdReq	`json:"postCommand"`
	Vm	TbVmInfo	`json:"vm"`
	ActionType	string	`json:"actionType"`
	PlacementAlgo	string	`json:"placementAlgo"`
}