package mcis

type ResourceOnTumblebug struct {
	ObjectKey	string	`json:"objectKey"`
	Type	string	`json:"type"`
	CspNativeId	string	`json:"cspNativeId"`
	Id	string	`json:"id"`
	McisId	string	`json:"mcisId"`
	NsId	string	`json:"nsId"`
}