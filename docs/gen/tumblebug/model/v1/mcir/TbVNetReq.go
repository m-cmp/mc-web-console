package mcir

type TbVNetReq struct {
	SubnetInfoList	[]TbSubnetReq	`json:"subnetInfoList"`
	CidrBlock	string	`json:"cidrBlock"`
	ConnectionName	string	`json:"connectionName"`
	Description	string	`json:"description"`
	Name	string	`json:"name"`
}