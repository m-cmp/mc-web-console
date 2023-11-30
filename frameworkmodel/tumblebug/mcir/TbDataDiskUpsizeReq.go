package mcir

type TbDataDiskUpsizeReq struct {
	Description string `json:"description"`
	DiskSize    string `json:"diskSize"`

	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
