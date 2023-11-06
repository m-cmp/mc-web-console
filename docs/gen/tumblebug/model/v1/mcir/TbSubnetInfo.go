package mcir

import ( 
	"/tumblebug/common
) 
type TbSubnetInfo struct {
	Description	string	`json:"description"`
	Id	string	`json:"id"`
	Ipv4_CIDR	string	`json:"ipv4_CIDR"`
	KeyValueList	[]KeyValue	`json:"keyValueList"`
	Name	string	`json:"name"`
}