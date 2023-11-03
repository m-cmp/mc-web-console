package common

type Region struct {
	KeyValueInfoList	[]KeyValue	`json:"keyValueInfoList"`
	ProviderName	string	`json:"providerName"`
	RegionName	string	`json:"regionName"`
}