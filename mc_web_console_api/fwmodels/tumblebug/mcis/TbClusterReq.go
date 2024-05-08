package mcis

// TbClusterReq is a struct to handle 'Create cluster' request toward CB-Tumblebug.
type TbClusterReq struct { // Tumblebug
	//Namespace      string `json:"namespace" validate:"required" example:"ns01"`
	ConnectionName string `json:"connectionName" validate:"required" example:"testcloud01-seoul"`
	Description    string `json:"description"`

	// (1) Cluster Info
	Id      string `json:"id" validate:"required" example:"testcloud01-seoul-cluster"`
	Version string `json:"version" example:"1.23.4"`

	// (2) Network Info
	VNetId           string   `json:"vNetId" validate:"required"`
	SubnetIds        []string `json:"subnetIds" validate:"required"`
	SecurityGroupIds []string `json:"securityGroupIds" validate:"required"`

	// (3) NodeGroupInfo List
	NodeGroupList []TbNodeGroupReq `json:"nodeGroupList"`

	// Fields for "Register existing cluster" feature
	// CspClusterId is required to register a cluster from CSP (option=register)
	CspClusterId string `json:"cspClusterId"`
}
