package mcis

type BenchmarkInfo struct {
	Desc	string	`json:"desc"`
	Elapsed	string	`json:"elapsed"`
	Result	string	`json:"result"`
	Resultarray	[]BenchmarkInfo	`json:"resultarray"`
	Specid	string	`json:"specid"`
	Unit	string	`json:"unit"`
}