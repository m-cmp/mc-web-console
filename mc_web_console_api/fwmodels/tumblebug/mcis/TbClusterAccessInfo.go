package mcis

// TbClusterAccessInfo is a struct to handle Cluster Access information from the CB-Tumblebug's REST API response
type TbClusterAccessInfo struct {
	Endpoint   string `json:"endpoint" example:"http://1.2.3.4:6443"`
	Kubeconfig string `json:"kubeconfig"`
}
