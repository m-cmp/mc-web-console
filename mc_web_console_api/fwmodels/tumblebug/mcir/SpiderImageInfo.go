package mcir

import (
	tbcommon "mc_web_console_api/fwmodels/tumblebug/common"
)

type SpiderImageInfo struct {
	GuestOS      string                `json:"guestOS"`
	IID          tbcommon.TbIID        `json:"iid"`
	KeyValueList []tbcommon.TbKeyValue `json:"keyValueList"`
	Name         string                `json:"name"`
	Status       string                `json:"status"`
}

type SpiderImageInfos []SpiderImageInfo
