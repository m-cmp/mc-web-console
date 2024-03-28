package mcir

type TbDataDiskReq struct {
	ConnectionName string `json:"connectionName"`
	CspDataDiskId  string `json:"cspDataDiskId"`
	Description    string `json:"description"`
	DiskSize       string `json:"diskSize"`
	DiskType       string `json:"diskType"`

	Name string `json:"name"`

	// connection 을 provider, regname으로 대체를 위해 추가
	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
