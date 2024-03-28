package mcir

type RestSearchImageRequest struct {
	Keywords []string `json:"keywords"`

	// connection 을 provider, regname으로 대체를 위해 추가
	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
