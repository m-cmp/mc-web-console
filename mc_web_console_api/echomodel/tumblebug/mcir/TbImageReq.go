package mcir

type TbImageReq struct {
	ConnectionName string `json:"connectionName"`
	CspImageId     string `json:"cspImageId"`
	Name           string `json:"name"`

	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
