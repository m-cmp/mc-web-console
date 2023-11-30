package mcir

type TbAttachDetachDataDiskReq struct {
	DataDiskId string `json:"dataDiskId"`

	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
