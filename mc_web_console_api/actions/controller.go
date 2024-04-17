package actions

import (
	"net/http"

	"mc_web_console_api/actions/tumblebug"

	webtool "mc_web_console_api/fwmodels/webtool"

	"github.com/gobuffalo/buffalo"
)
// TODO: RouteInfo 로 옮길까?

// ------------------------//
// Client에서 전송되는 data type은 POST 임 //
// case문에서 controller이름 추출하여 controller 호출
func CommonController(c buffalo.Context) error {
	// param 종류( pathParam, queryParam)
	// target controller 이름.

	commonResponse := &webtool.CommonResponse{}
	commonRequest := &webtool.CommonRequest{}

	if err := c.Bind(commonRequest); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	// 권한 check??? 
	// 1차 메뉴 권한
	// 2차 project 권한 체크 -- middle ware
	// 3차 resource 권한 체크 -- middle ware ( 추후. not now)
	// case
	switch commonRequest.TargetController {
	case "McisList":// Get Type
		// 
		mcisList, respStatus := tumblebug.TbMcisList(commonRequest)
		commonResponse.ResponseData = mcisList
		commonResponse.Status = respStatus
	case "McisReg":// Post Type
		// namespaceID := c.Params().Get("namespaceid")
		// optionParam := c.Params().Get("option")
		// filterKeyParam := c.Params().Get("filterKey")
		// filterValParam := c.Params().Get("filterVal")
		
		// responseData, err := McisReg(dataObj, pathParam, queryParam)

	//defaut :
		// TODO : a action를 찾아 실행하도록 
	}

	if commonResponse.Status.StatusCode != 200 && commonResponse.Status.StatusCode != 201 {
		return c.Render(commonResponse.Status.StatusCode, r.JSON(map[string]interface{}{
			"responseData":  commonResponse.ResponseData,
			"status": commonResponse.Status,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"responseData":  commonResponse.ResponseData,
		"status": commonResponse.Status,
	}))
}

