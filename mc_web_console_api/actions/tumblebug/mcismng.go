package tumblebug

import (
	tbhandler "mc_web_console_api/handler/tbhandler"
	tbmcis "mc_web_console_api/fwmodels/tumblebug/mcis"
	fwmodels "mc_web_console_api/fwmodels"
	webtool "mc_web_console_api/fwmodels/webtool"
	util "mc_web_console_api/util"
)
	
// controller

// mcis 목록 조회
func TbMcisList(request *webtool.CommonRequest) ([]tbmcis.TbMcisInfo, fwmodels.WebStatus) {	
	request.TargetFramework = util.TUMBLEBUG// handler에게 자유를 주기 위해 controller에서 설정함.
	mcisList, respStatus := tbhandler.McisList(request)
	
	return mcisList, respStatus
}
