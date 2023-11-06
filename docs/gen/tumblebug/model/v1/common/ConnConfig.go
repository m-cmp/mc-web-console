package common

type ConnConfig struct {
	DriverName	string	`json:"driverName"`
	Location	GeoLocation	`json:"location"`
	ProviderName	string	`json:"providerName"`
	RegionName	string	`json:"regionName"`
	ConfigName	string	`json:"configName"`
	CredentialName	string	`json:"credentialName"`
}