package mcir

type TbCustomImageReq struct {
	ConnectionName   string `json:"connectionName"`
	CspCustomImageId string `json:"cspCustomImageId"`

	Description string `json:"description"`
	Name        string `json:"name"`

	SourceVmID string `json:"sourceVmId"`

	// connection 을 provider, regname으로 대체를 위해 추가
	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
