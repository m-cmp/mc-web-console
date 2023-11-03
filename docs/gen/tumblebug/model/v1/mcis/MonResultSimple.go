package mcis

type MonResultSimple struct {
	Metric	string	`json:"metric"`
	Value	string	`json:"value"`
	VmId	string	`json:"vmId"`
	Err	string	`json:"err"`
}