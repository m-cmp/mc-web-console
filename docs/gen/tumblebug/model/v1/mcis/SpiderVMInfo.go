package mcis

import ( 
	"/tumblebug/common
	"/tumblebug/common
) 
type SpiderVMInfo struct {
	PrivateDNS	string	`json:"privateDNS"`
	PublicIP	string	`json:"publicIP"`
	SshaccessPoint	string	`json:"sshaccessPoint"`
	SubnetIID	IID	`json:"subnetIID"`
	VpcIID	IID	`json:"vpcIID"`
	Vpcname	string	`json:"vpcname"`
	ImageIId	IID	`json:"imageIId"`
	ImageName	string	`json:"imageName"`
	KeyPairName	string	`json:"keyPairName"`
	PrivateIP	string	`json:"privateIP"`
	Region	RegionInfo	`json:"region"`
	Iid	IID	`json:"iid"`
	KeyValueList	[]KeyValue	`json:"keyValueList"`
	Name	string	`json:"name"`
	NetworkInterface	string	`json:"networkInterface"`
	PublicDNS	string	`json:"publicDNS"`
	SecurityGroupIIds	[]IID	`json:"securityGroupIIds"`
	StartTime	string	`json:"startTime"`
	VmblockDisk	string	`json:"vmblockDisk"`
	KeyPairIId	IID	`json:"keyPairIId"`
	VmuserId	string	`json:"vmuserId"`
	VmuserPasswd	string	`json:"vmuserPasswd"`
	VmbootDisk	string	`json:"vmbootDisk"`
	SubnetName	string	`json:"subnetName"`
	VmspecName	string	`json:"vmspecName"`
	SecurityGroupNames	[]string	`json:"securityGroupNames"`
}