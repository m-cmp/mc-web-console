package mcir

type TbSpecReq struct {
	ConnectionName string `json:"connectionName"`
	CspSpecName    string `json:"cspSpecName"`
	Description    string `json:"description"`
	Name           string `json:"name"`

	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
