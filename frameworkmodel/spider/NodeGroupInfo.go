package spider

type NodeGroupInfo struct {
	Name            string `json:"Name"`
	ImageName       string `json:"ImageName"`
	VMSpecName      string `json:"VMSpecName"`
	KeyPairName     string `json:"KeyPairName"`
	OnAutoScaling   string `json:"OnAutoScaling"`
	DesiredNodeSize string `json:"DesiredNodeSize"`
	MinNodeSize     string `json:"MinNodeSize"`
	MaxNodeSize     string `json:"MaxNodeSize"`
	RootDiskType    string `json:"RootDiskType"`
	RootDiskSize    string `json:"RootDiskSize"`

	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
