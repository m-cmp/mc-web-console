package mcis

type RestGetAllMcisStatusResponse struct {
	Mcis	[]McisStatusInfo	`json:"mcis"`
}