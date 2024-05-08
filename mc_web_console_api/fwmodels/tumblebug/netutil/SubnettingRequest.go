package netutil


type SubnettingRequest struct {
	CIDRBlock       string           `json:"cidrBlock" example:"192.168.0.0/16"`
	SubnettingRules []SubnettingRule `json:"subnettingRules"`
}
