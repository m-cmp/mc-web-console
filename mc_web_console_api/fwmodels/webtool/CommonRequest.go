package webtool

import (
	"mc_web_console_api/fwmodels"
)

// 모든 요청을 Post로 하고 CommonRequest에 각 내용을 담아 요청한다.
type CommonRequest struct {
	TargetController string      `json:"targetController"`
    RequestData      map[string]interface{} `json:"requestData"`
	//RequestData      map[string]interface{} `json:"requestData"`
    PathParam        map[string]interface{} `json:"pathParam"`
    QueryParam       map[string]interface{} `json:"queryParam"`
	
	// 추가로 set
	OriginalUrl string
	TargetFramework string// env에서 추출
}

// 모든 응답을 CommonResponse로 한다.
type CommonResponse struct {
	ResponseData interface{} `json:"responseData"`
	//ResponseData      map[string]interface{} `json:"responseData"`
	Status fwmodels.WebStatus `json:"status"`
}
