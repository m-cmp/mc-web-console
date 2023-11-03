package mcis

type TbVmInfo struct {
	Label	string	`json:"label"`
	MonAgentStatus	string	`json:"monAgentStatus"`
	PrivateDNS	string	`json:"privateDNS"`
	SpecId	string	`json:"specId"`
	SshKeyId	string	`json:"sshKeyId"`
	TargetAction	string	`json:"targetAction"`
	VmBootDisk	string	`json:"vmBootDisk"`
	Name	string	`json:"name"`
	PrivateIP	string	`json:"privateIP"`
	SecurityGroupIds	[]string	`json:"securityGroupIds"`
	SubnetId	string	`json:"subnetId"`
	TargetStatus	string	`json:"targetStatus"`
	VmGroupId	string	`json:"vmGroupId"`
	VmUserPassword	string	`json:"vmUserPassword"`
	CreatedTime	string	`json:"createdTime"`
	CspViewVmDetail	SpiderVMInfo	`json:"cspViewVmDetail"`
	SshPort	string	`json:"sshPort"`
	SystemMessage	string	`json:"systemMessage"`
	Description	string	`json:"description"`
	Status	string	`json:"status"`
	VmUserAccount	string	`json:"vmUserAccount"`
	ImageId	string	`json:"imageId"`
	PublicDNS	string	`json:"publicDNS"`
	VmBlockDisk	string	`json:"vmBlockDisk"`
	ConnectionName	string	`json:"connectionName"`
	Id	string	`json:"id"`
	Location	GeoLocation	`json:"location"`
	PublicIP	string	`json:"publicIP"`
	Region	RegionInfo	`json:"region"`
	VNetId	string	`json:"vNetId"`
}