package mcis

import tbcommon "mc_web_console_api/fwmodels/tumblebug/common"

type TbNLBListenerInfo struct {
	CspID   string `json:"cspID"`
	DnsName string `json:"dnsName"`

	Ip string `json:"ip"`

	Protocol string `json:"protocol"`
	Port     string `json:"port"`

	KeyValueList []tbcommon.TbKeyValue `json:"keyValueList"`
}
