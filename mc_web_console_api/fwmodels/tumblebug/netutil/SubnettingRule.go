package netutil

// type SubnettingRule struct {
// 	Type  SubnettingRuleType `json:"type" example:"minSubnets" enum:"minSubnets,minHosts"`
// 	Value int                `json:"value" example:"2"`
// }
type SubnettingRule struct {
	SubnettingRuleType  string `json:"type" example:"minSubnets" enum:"minSubnets,minHosts"`
	Value int                `json:"value" example:"2"`
}

// SubnettingRuleType defines the type for subnetting rules.
type SubnettingRuleType string