package ladybug

type NodeSetReq struct {
	Connection string       `json:"connection"`
	Count      int          `json:"count"`
	Spec       string       `json:"spec"`
	RootDisk   RootDiskInfo `json:"rootDisk"`

	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
