package mcis

type TbVmStatusInfo struct {
	Id	string	`json:"id"`
	MonAgentStatus	string	`json:"monAgentStatus"`
	Location	GeoLocation	`json:"location"`
	NativeStatus	string	`json:"nativeStatus"`
	SshPort	string	`json:"sshPort"`
	TargetAction	string	`json:"targetAction"`
	TargetStatus	string	`json:"targetStatus"`
	PrivateIp	string	`json:"privateIp"`
	PublicIp	string	`json:"publicIp"`
	Status	string	`json:"status"`
	SystemMessage	string	`json:"systemMessage"`
	CreatedTime	string	`json:"createdTime"`
	CspVmId	string	`json:"cspVmId"`
	Name	string	`json:"name"`
}