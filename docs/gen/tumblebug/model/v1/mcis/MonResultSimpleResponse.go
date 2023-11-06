package mcis

type MonResultSimpleResponse struct {
	McisId	string	`json:"mcisId"`
	McisMonitoring	[]MonResultSimple	`json:"mcisMonitoring"`
	NsId	string	`json:"nsId"`
}