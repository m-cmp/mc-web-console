package self

type LookupDiskInfo struct {
	// create disk list
	ProviderID string `json:"providerId"`

	RootDiskType []string `json:"rootdisktype"`

	//
	DataDiskType []string `json:"datadisktype"`

	// disk size range by diskType
	DiskSize []DiskSizeInfo `json:"disksize"`
}

type AvailableDiskType struct {
	// create disk list
	ProviderID string `json:"providerId"`

	RootDiskType []string `json:"rootdisktype"`

	//
	DataDiskType []string `json:"datadisktype"`

	// disk size range by diskType
	DiskSize []DiskSizeInfo `json:"disksize"`
}

type DiskSizeInfo struct {
	DiskType string `json:"diskType"`
	MinSize  string `json:"minSize"`
	MaxSize  string `json:"maxSize"`
	Capacity string `json:"capacity"`
}
