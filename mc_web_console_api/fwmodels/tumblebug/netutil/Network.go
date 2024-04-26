package netutil

type Network struct {
	CIDRBlock string    `json:"cidrBlock"`
	Name      string    `json:"name,omitempty"`
	Subnets   []Network `json:"subnets,omitempty"`
}