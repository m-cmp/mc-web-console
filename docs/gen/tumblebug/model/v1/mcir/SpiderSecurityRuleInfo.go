package mcir

type SpiderSecurityRuleInfo struct {
	Cidr	string	`json:"cidr"`
	Direction	string	`json:"direction"`
	FromPort	string	`json:"fromPort"`
	Ipprotocol	string	`json:"ipprotocol"`
	ToPort	string	`json:"toPort"`
}