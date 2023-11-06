package mcis

type TbVmReq struct {
	ImageId	string	`json:"imageId"`
	Label	string	`json:"label"`
	Name	string	`json:"name"`
	SshKeyId	string	`json:"sshKeyId"`
	SubnetId	string	`json:"subnetId"`
	VNetId	string	`json:"vNetId"`
	VmUserAccount	string	`json:"vmUserAccount"`
	Description	string	`json:"description"`
	VmUserPassword	string	`json:"vmUserPassword"`
	SecurityGroupIds	[]string	`json:"securityGroupIds"`
	SpecId	string	`json:"specId"`
	VmGroupSize	string	`json:"vmGroupSize"`
	ConnectionName	string	`json:"connectionName"`
}