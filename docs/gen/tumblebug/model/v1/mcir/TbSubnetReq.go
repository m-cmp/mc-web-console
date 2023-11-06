package mcir

import ( 
	"/tumblebug/common
) 
type TbSubnetReq struct {
	Description	string	`json:"description"`
	Ipv4_CIDR	string	`json:"ipv4_CIDR"`
	KeyValueList	[]KeyValue	`json:"keyValueList"`
	Name	string	`json:"name"`
}