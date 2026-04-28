package model

import "net/http"

// CommonResponse 모든 API 응답의 공통 구조
// Buffalo의 CommonResponse와 동일한 구조 유지
type CommonResponse struct {
	ResponseData interface{} `json:"responseData"`
	Status       Status      `json:"status"`
}

// Status HTTP 상태 정보
type Status struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// NewCommonResponse 새로운 CommonResponse 생성
func NewCommonResponse(statusCode int, message string, data interface{}) *CommonResponse {
	return &CommonResponse{
		ResponseData: data,
		Status: Status{
			Code:    statusCode,
			Message: message,
		},
	}
}

// CommonResponseStatusOK 200 OK 응답 생성
func CommonResponseStatusOK(data interface{}) *CommonResponse {
	return NewCommonResponse(http.StatusOK, "OK", data)
}

// CommonResponseStatusCreated 201 Created 응답 생성
func CommonResponseStatusCreated(data interface{}) *CommonResponse {
	return NewCommonResponse(http.StatusCreated, "Created", data)
}

// CommonResponseStatusBadRequest 400 Bad Request 응답 생성
func CommonResponseStatusBadRequest(message string) *CommonResponse {
	return NewCommonResponse(http.StatusBadRequest, message, nil)
}

// CommonResponseStatusUnauthorized 401 Unauthorized 응답 생성
func CommonResponseStatusUnauthorized(message string) *CommonResponse {
	return NewCommonResponse(http.StatusUnauthorized, message, nil)
}

// CommonResponseStatusForbidden 403 Forbidden 응답 생성
func CommonResponseStatusForbidden(message string) *CommonResponse {
	return NewCommonResponse(http.StatusForbidden, message, nil)
}

// CommonResponseStatusNotFound 404 Not Found 응답 생성
func CommonResponseStatusNotFound(message string) *CommonResponse {
	return NewCommonResponse(http.StatusNotFound, message, nil)
}

// CommonResponseStatusInternalServerError 500 Internal Server Error 응답 생성
func CommonResponseStatusInternalServerError(message string) *CommonResponse {
	return NewCommonResponse(http.StatusInternalServerError, message, nil)
}

// ToJSON JSON 응답으로 변환 (Echo용)
func (r *CommonResponse) ToJSON() (int, interface{}) {
	return r.Status.Code, r
}
