package mcir

type TbFirewallRulesWrapper struct {
	FirewallRules []TbFirewallRuleInfo `json:"firewallRules"`

	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
