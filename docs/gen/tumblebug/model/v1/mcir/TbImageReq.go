package mcir

type TbImageReq struct {
	ConnectionName	string	`json:"connectionName"`
	CspImageId	string	`json:"cspImageId"`
	Description	string	`json:"description"`
	Name	string	`json:"name"`
}