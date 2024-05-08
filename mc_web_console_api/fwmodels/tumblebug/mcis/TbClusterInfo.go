package mcis

import (
	tbcommon "mc_web_console_api/fwmodels/tumblebug/common"
	"time"
)

type TbClusterInfo struct { // Tumblebug
	Id             string `json:"id"`
	Name           string `json:"name"`
	ConnectionName string `json:"connectionName"`

	Version string `json:"version" example:"1.23.3"` // Kubernetes Version, ex) 1.23.3
	Network TbClusterNetworkInfo

	// ---

	NodeGroupList []TbClusterNodeGroupInfo
	AccessInfo    TbClusterAccessInfo
	Addons        TbClusterAddonsInfo

	Status TbClusterStatus `json:"status" example:"Creating"` // Creating, Active, Inactive, Updating, Deleting

	CreatedTime  time.Time             `json:"createdTime" example:"1970-01-01T00:00:00.00Z"`
	KeyValueList []tbcommon.TbKeyValue `json:"keyValueList"`

	Description    string `json:"description"`
	CspClusterId   string `json:"cspClusterId"`
	CspClusterName string `json:"cspClusterName"`

	// Latest system message such as error message
	SystemMessage string `json:"systemMessage" example:"Failed because ..." default:""` // systeam-given string message

	// SystemLabel is for describing the MCIR in a keyword (any string can be used) for special System purpose
	SystemLabel string `json:"systemLabel" example:"Managed by CB-Tumblebug" default:""`
}
