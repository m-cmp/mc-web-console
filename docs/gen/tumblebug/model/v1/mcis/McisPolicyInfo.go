package mcis

type McisPolicyInfo struct {
	Id	string	`json:"Id"`
	Name	string	`json:"Name"`
	ActionLog	string	`json:"actionLog"`
	Description	string	`json:"description"`
	Policy	[]Policy	`json:"policy"`
}