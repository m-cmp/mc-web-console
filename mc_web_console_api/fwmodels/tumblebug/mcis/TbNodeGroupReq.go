package mcis

// TbNodeGroupReq is a struct to handle requests related to NodeGroup toward CB-Tumblebug.
type TbNodeGroupReq struct {
	Name         string `json:"name"`
	ImageId      string `json:"imageId"`
	SpecId       string `json:"specId"`
	RootDiskType string `json:"rootDiskType" example:"default, TYPE1, ..."`  // "", "default", "TYPE1", AWS: ["standard", "gp2", "gp3"], Azure: ["PremiumSSD", "StandardSSD", "StandardHDD"], GCP: ["pd-standard", "pd-balanced", "pd-ssd", "pd-extreme"], ALIBABA: ["cloud_efficiency", "cloud", "cloud_ssd"], TENCENT: ["CLOUD_PREMIUM", "CLOUD_SSD"]
	RootDiskSize string `json:"rootDiskSize" example:"default, 30, 42, ..."` // "default", Integer (GB): ["50", ..., "1000"]
	SshKeyId     string `json:"sshKeyId"`

	// autoscale config.
	OnAutoScaling   string `json:"onAutoScaling"`
	DesiredNodeSize string `json:"desiredNodeSize"`
	MinNodeSize     string `json:"minNodeSize"`
	MaxNodeSize     string `json:"maxNodeSize"`
}
