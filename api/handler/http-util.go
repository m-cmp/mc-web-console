package handler

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/spf13/viper"
)

// ////////////////////////////////////////////////////////////////
type CommonRequest struct {
	PathParams  map[string]string `json:"pathParams"`
	QueryParams map[string]string `json:"queryParams"`
	Request     interface{}       `json:"request"`
}

// 모든 응답을 CommonResponse로 한다.
type CommonResponse struct {
	ResponseData interface{} `json:"responseData"`
	Status       WebStatus   `json:"status"`
}

type WebStatus struct {
	StatusCode int    `json:"code"`
	Message    string `json:"message"`
}

// ////////////////////////////////////////////////////////////////

type Auth struct {
	Type     string `mapstructure:"type"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
}

type Service struct {
	BaseURL string `mapstructure:"baseurl"`
	Auth    Auth   `mapstructure:"auth"`
}

type Spec struct {
	Method       string `mapstructure:"method"`
	ResourcePath string `mapstructure:"resourcePath"`
	Description  string `mapstructure:"description"`
}

type ApiYaml struct {
	CLISpecVersion string                     `mapstructure:"cliSpecVersion"`
	Services       map[string]Service         `mapstructure:"services"`
	ServiceActions map[string]map[string]Spec `mapstructure:"serviceActions"`
}

// ////////////////////////////////////////////////////////////////

var (
	ApiYamlSet ApiYaml
)

func init() {
	viper.SetConfigName("api")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("conf")

	if err := viper.ReadInConfig(); err != nil {
		panic(fmt.Errorf("fatal error reading actions/conf/api.yaml file: %s", err))
	}

	if err := viper.Unmarshal(&ApiYamlSet); err != nil {
		panic(fmt.Errorf("unable to decode into struct: %v", err))
	}
}

// AnyCaller는 buffalo.Context, operationId, commonRequest, auth유무 를 받아 conf/api.yaml 정보를 바탕으로 commonCaller를 호출합니다.
// 모든 error 는 기본적으로 commonResponse 에 담아져 반환됩니다.
func AnyCaller(c buffalo.Context, operationId string, commonRequest *CommonRequest, auth bool) (*CommonResponse, error) {
	_, targetFrameworkInfo, targetApiSpec, err := GetApiSpec(strings.ToLower(operationId))
	if (err != nil || targetFrameworkInfo == Service{} || targetApiSpec == Spec{}) {
		commonResponse := CommonResponseStatusNotFound(operationId + "-" + err.Error())
		return commonResponse, err
	}

	var authString string
	if auth {
		authString, err = getAuth(c, targetFrameworkInfo)
		if err != nil {
			commonResponse := CommonResponseStatusBadRequest(err.Error())
			return commonResponse, err
		}
	} else {
		authString = ""
	}

	commonResponse, err := CommonCaller(strings.ToUpper(targetApiSpec.Method), targetFrameworkInfo.BaseURL, targetApiSpec.ResourcePath, commonRequest, authString)
	if err != nil {
		return commonResponse, err
	}
	return commonResponse, err
}

// getApiSpec은 OpertinoId를 받아 conf/api.yaml에 정의된 Service, Spec 을 반환합니다.
// 없을경우 not found error를 반환합니다.
func GetApiSpec(requestOpertinoId string) (string, Service, Spec, error) {
	for framework, api := range ApiYamlSet.ServiceActions {
		for opertinoId, spec := range api {
			if opertinoId == strings.ToLower(requestOpertinoId) {
				return framework, ApiYamlSet.Services[framework], spec, nil
			}
		}
	}
	return "", Service{}, Spec{}, fmt.Errorf("getApiSpec not found")
}

// getAuth는 컨텍스트 및 대상 서비스 정보를 받아, 옳바른 Authorization 값을 반환합니다.
// 오류의 경우 각 경우, 해당하는 오류가 반환됩니다.
// Auth 방식이 없을경우, 아무것도 반환되지 않습니다.
func getAuth(c buffalo.Context, service Service) (string, error) {
	switch service.Auth.Type {
	case "basic":
		if apiUserInfo := service.Auth.Username + ":" + service.Auth.Password; service.Auth.Username != "" && service.Auth.Password != "" {
			encA := base64.StdEncoding.EncodeToString([]byte(apiUserInfo))
			return "Basic " + encA, nil
		} else {
			return "", fmt.Errorf("username or password is empty")
		}

	case "bearer":
		if authValue, ok := c.Value("Authorization").(string); ok {
			return authValue, nil
		} else {
			return "", fmt.Errorf("authorization key does not exist or is not a string")
		}

	default:
		return "", nil
	}
}

////////////////////////////////////////////////////////////////

func CommonCaller(callMethod string, targetFwUrl string, endPoint string, commonRequest *CommonRequest, auth string) (*CommonResponse, error) {
	pathParamsUrl := mappingUrlPathParams(endPoint, commonRequest)
	queryParamsUrl := mappingQueryParams(pathParamsUrl, commonRequest)
	requestUrl := targetFwUrl + queryParamsUrl
	commonResponse, err := CommonHttpToCommonResponse(requestUrl, commonRequest.Request, callMethod, auth)
	return commonResponse, err
}

func CommonCallerWithoutToken(callMethod string, targetFwUrl string, endPoint string, commonRequest *CommonRequest) (*CommonResponse, error) {
	pathParamsUrl := mappingUrlPathParams(endPoint, commonRequest)
	queryParamsUrl := mappingQueryParams(pathParamsUrl, commonRequest)
	requestUrl := targetFwUrl + queryParamsUrl
	commonResponse, err := CommonHttpToCommonResponse(requestUrl, commonRequest.Request, callMethod, "")
	return commonResponse, err
}

////////////////////////////////////////////////////////////////

func mappingUrlPathParams(endPoint string, commonRequest *CommonRequest) string {
	u := endPoint
	for k, r := range commonRequest.PathParams {
		u = strings.Replace(u, "{"+k+"}", r, -1)
	}
	return u
}

func mappingQueryParams(targeturl string, commonRequest *CommonRequest) string {
	u, err := url.Parse(targeturl)
	if err != nil {
		return ""
	}
	q := u.Query()
	for k, v := range commonRequest.QueryParams {
		q.Set(string(k), v)
	}
	u.RawQuery = q.Encode()
	return u.String()
}

func CommonHttpToCommonResponse(url string, s interface{}, httpMethod string, auth string) (*CommonResponse, error) {
	log.Println("CommonHttp - METHOD:" + httpMethod + " => url:" + url)
	log.Println("isauth:", auth)

	jsonData, err := json.Marshal(s)
	if err != nil {
		log.Println("commonPostERR : json.Marshal : ", err.Error())
		return nil, err
	}

	req, err := http.NewRequest(httpMethod, url, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println("Error CommonHttp creating request:", err)
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if auth != "" {
		req.Header.Add("Authorization", auth)
	}

	requestDump, err := httputil.DumpRequest(req, true)
	if err != nil {
		log.Println("Error CommonHttp creating httputil.DumpRequest:", err)
	}
	log.Println("\n", string(requestDump))

	// TODO : TLSClientConfig InsecureSkipVerify 해제 v0.2.0 이후 작업예정
	customTransport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: customTransport}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error CommonHttp request:", err)
		return CommonResponseStatusInternalServerError(err), err
	}
	defer resp.Body.Close()

	respBody, ioerr := io.ReadAll(resp.Body)
	if ioerr != nil {
		log.Println("Error CommonHttp reading response:", ioerr)
	}

	commonResponse := &CommonResponse{}
	commonResponse.Status.Message = resp.Status
	commonResponse.Status.StatusCode = resp.StatusCode

	jsonerr := json.Unmarshal(respBody, &commonResponse.ResponseData)
	if jsonerr != nil {
		commonResponse.ResponseData = strings.TrimSpace(string(respBody))
		return commonResponse, nil
	}

	return commonResponse, nil
}

func isJSONResponse(body []byte) bool {
	var js map[string]interface{}
	return json.Unmarshal(body, &js) == nil
}

////////////////////////////////////////////////////////////////

func CommonResponseStatusOK(responseData interface{}) *CommonResponse {
	webStatus := WebStatus{
		StatusCode: http.StatusOK,
		Message:    http.StatusText(http.StatusOK),
	}
	return &CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}

func CommonResponseStatusNoContent(responseData interface{}) *CommonResponse {
	webStatus := WebStatus{
		StatusCode: http.StatusNoContent,
		Message:    http.StatusText(http.StatusNoContent),
	}
	return &CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}

func CommonResponseStatusNotFound(responseData interface{}) *CommonResponse {
	webStatus := WebStatus{
		StatusCode: http.StatusNotFound,
		Message:    http.StatusText(http.StatusNotFound),
	}
	return &CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}

func CommonResponseStatusStatusUnauthorized(responseData interface{}) *CommonResponse {
	webStatus := WebStatus{
		StatusCode: http.StatusUnauthorized,
		Message:    http.StatusText(http.StatusUnauthorized),
	}
	return &CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}

func CommonResponseStatusBadRequest(responseData interface{}) *CommonResponse {
	webStatus := WebStatus{
		StatusCode: http.StatusBadRequest,
		Message:    http.StatusText(http.StatusBadRequest),
	}
	return &CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}

func CommonResponseStatusInternalServerError(responseData interface{}) *CommonResponse {
	webStatus := WebStatus{
		StatusCode: http.StatusInternalServerError,
		Message:    http.StatusText(http.StatusInternalServerError),
	}
	return &CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}
