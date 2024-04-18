package webconsole

import (
	"mc_web_console_api/fwmodels"
	"net/http"
)

// 모든 요청을 Post로 하고 CommonRequest에 각 내용을 담아 요청한다.
type CommonRequest struct {
	TargetController string                 `json:"targetController"`
	RequestData      map[string]interface{} `json:"requestData"`
	//RequestData      map[string]interface{} `json:"requestData"`
	PathParam  map[string]interface{} `json:"pathParam"`
	QueryParam map[string]interface{} `json:"queryParam"`

	// 추가로 set
	OriginalUrl     string
	TargetFramework string // env에서 추출
}

// 모든 응답을 CommonResponse로 한다.
type CommonResponse struct {
	ResponseData interface{} `json:"responseData"`
	//ResponseData      map[string]interface{} `json:"responseData"`
	Status fwmodels.WebStatus `json:"status"`
}

func CommonResponseStatusOK(responseData interface{}) CommonResponse {
	webStatus := fwmodels.WebStatus{
		StatusCode: http.StatusOK,
		Message:    http.StatusText(http.StatusOK),
	}
	return CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}

func CommonResponseStatusStatusUnauthorized(responseData interface{}) CommonResponse {
	webStatus := fwmodels.WebStatus{
		StatusCode: http.StatusUnauthorized,
		Message:    http.StatusText(http.StatusUnauthorized),
	}
	return CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}

func CommonResponseStatusBadRequest(responseData interface{}) CommonResponse {
	webStatus := fwmodels.WebStatus{
		StatusCode: http.StatusBadRequest,
		Message:    http.StatusText(http.StatusBadRequest),
	}
	return CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}

func CommonResponseStatusInternalServerError(responseData interface{}) CommonResponse {
	webStatus := fwmodels.WebStatus{
		StatusCode: http.StatusInternalServerError,
		Message:    http.StatusText(http.StatusInternalServerError),
	}
	return CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}
