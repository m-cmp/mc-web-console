package mcir

type TbVNetReq struct {
	CidrBlock      string        `json:"cidrBlock"`
	ConnectionName string        `json:"connectionName"`
	CspVNetId      string        `json:"cspVNetId"`
	Description    string        `json:"description"`
	Name           string        `json:"name"`
	SubnetInfoList []TbSubnetReq `json:"subnetInfoList"`

	ProviderID   string `json:"providerId"`
	ProviderName string `json:"providerName"`
	RegionName   string `json:"regionName"`
	ZoneName     string `json:"zoneName"`
}
