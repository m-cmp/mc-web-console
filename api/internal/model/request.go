package model

// CommonRequest 모든 API 요청의 공통 구조
// Buffalo의 CommonRequest와 동일한 구조 유지
type CommonRequest struct {
	PathParams      map[string]string      `json:"pathParams"`
	QueryParams     map[string]string      `json:"queryParams"`
	QueryParamTypes map[string]string      `json:"queryParamTypes,omitempty"` // 필드명 → "int"|"float"|"bool"
	Request         map[string]interface{} `json:"request"`
}

// NewCommonRequest 새로운 CommonRequest 생성
func NewCommonRequest() *CommonRequest {
	return &CommonRequest{
		PathParams:  make(map[string]string),
		QueryParams: make(map[string]string),
		Request:     make(map[string]interface{}),
	}
}

// GetPathParam PathParams에서 값 조회
func (r *CommonRequest) GetPathParam(key string) (string, bool) {
	val, exists := r.PathParams[key]
	return val, exists
}

// GetQueryParam QueryParams에서 값 조회
func (r *CommonRequest) GetQueryParam(key string) (string, bool) {
	val, exists := r.QueryParams[key]
	return val, exists
}

// GetRequestField Request에서 필드 조회
func (r *CommonRequest) GetRequestField(key string) (interface{}, bool) {
	val, exists := r.Request[key]
	return val, exists
}
