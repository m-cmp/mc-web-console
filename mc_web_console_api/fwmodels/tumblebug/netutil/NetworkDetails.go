package netutil

type NetworkDetails struct {
//	Network
	Network   Network `json:"network"`
	NetworkAddress   string `json:"networkAddress,omitempty"`
	BroadcastAddress string `json:"broadcastAddress,omitempty"`
	Prefix           int    `json:"prefix,omitempty"`
	Netmask          string `json:"netmask,omitempty"`
	HostCapacity     int    `json:"hostCapacity,omitempty"`
}