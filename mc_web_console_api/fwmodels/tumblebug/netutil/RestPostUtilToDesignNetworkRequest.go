package netutil

type RestPostUtilToDesignNetworkRequest struct {
	//SubnettingRequest
	SubnettingRequest SubnettingRequest `json:"subnettingRequest"`
}

type RestPostUtilToDesignNetworkReponse struct {
	//Network
	Network Network `json:"setwork"`
}