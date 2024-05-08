package mcis

import tbcommon "mc_web_console_api/fwmodels/tumblebug/common"

type TbClusterNodeGroupInfo struct {
	Id string `json:"id"`
	//Name string `json:"name"`

	// VM config.
	ImageId      string `json:"imageId"`
	SpecId       string `json:"specId"`
	RootDiskType string `json:"rootDiskType"`
	RootDiskSize string `json:"rootDiskSize"`
	SshKeyId     string `json:"sshKeyId"`

	// Scaling config.
	OnAutoScaling   bool `json:"onAutoScaling"`
	DesiredNodeSize int  `json:"desiredNodeSize"`
	MinNodeSize     int  `json:"minNodeSize"`
	MaxNodeSize     int  `json:"maxNodeSize"`

	// ---
	Status NodeGroupStatus `json:"status" example:"Creating"` // Creating, Active, Inactive, Updating, Deleting
	Nodes  []string        `json:"nodes"`                     // id for nodes

	KeyValueList []tbcommon.TbKeyValue `json:"keyValueList"`
}
