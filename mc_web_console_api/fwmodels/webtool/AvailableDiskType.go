package webtool

type AvailableDiskType struct {
	// create disk list
	ProviderID string `json:"providerId"`

	RootDiskType []string `json:"rootdisktype"`

	//
	DataDiskType []string `json:"datadisktype"`

	// disk size range by diskType
	DiskSize []string `json:"disksize"`
}
