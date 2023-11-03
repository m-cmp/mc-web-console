package common

type GeoLocation struct {
	NativeRegion	string	`json:"nativeRegion"`
	BriefAddr	string	`json:"briefAddr"`
	CloudType	string	`json:"cloudType"`
	Latitude	string	`json:"latitude"`
	Longitude	string	`json:"longitude"`
}