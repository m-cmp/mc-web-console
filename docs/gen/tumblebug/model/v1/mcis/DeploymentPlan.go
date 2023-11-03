package mcis

type DeploymentPlan struct {
	Priority	PriorityInfo	`json:"priority"`
	Filter	FilterInfo	`json:"filter"`
	Limit	string	`json:"limit"`
}