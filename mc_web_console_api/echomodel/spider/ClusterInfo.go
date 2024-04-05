package spider

type ClusterInfo struct {
	Name               string          `json:"Name"`
	Version            string          `json:"Version"`
	VPCName            string          `json:"VPCName"`
	SubnetNames        []string        `json:"SubnetNames"`
	SecurityGroupNames []string        `json:"SecurityGroupNames"`
	NodeGroupList      []NodeGroupInfo `json:"NodeGroupList"`

	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
