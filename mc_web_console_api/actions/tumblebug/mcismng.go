package tumblebug

//tbmcis "mc_web_console_api/fwmodels/tumblebug/mcis"
//fwmodels "mc_web_console_api/fwmodels"

// controller

// mcis 목록 조회
// func TbMcisList(c buffalo.Context, request *webconsole.CommonRequest) *webconsole.CommonResponse {
// 	//func TbMcisList(request *webtool.CommonRequest) ([]tbmcis.TbMcisInfo, fwmodels.WebStatus) {
// 	request.TargetFramework = util.TUMBLEBUG // handler에게 자유를 주기 위해 controller에서 설정함.
// 	mcisList, respStatus := tbhandler.McisList(request)

// 	commonResponse := &webconsole.CommonResponse{}
// 	commonResponse.ResponseData = mcisList
// 	commonResponse.Status = respStatus
// 	//return mcisList, respStatus
// 	return commonResponse
// }
