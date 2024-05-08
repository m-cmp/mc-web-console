package actions

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"github.com/gobuffalo/buffalo"
)

var (
	apiBaseHost *url.URL
)

func init() {
	apiAddr := os.Getenv("API_ADDR")
	apiPort := os.Getenv("API_PORT")
	apiBaseHost, _ = url.Parse("http://" + apiAddr + ":" + apiPort)
}

type CommonRequest struct {
	PathParams  map[string]string `json:"pathParams"`
	QueryParams map[string]string `json:"queryParams"`
	Request     interface{}       `json:"request"`
}

type CommonResponse struct {
	ResponseData interface{} `json:"responseData"`
	Status       WebStatus   `json:"status"`
}

type WebStatus struct {
	StatusCode int    `json:"code"`
	Message    string `json:"message"`
}

func CommonResponseProvider(status int, responseData interface{}) *CommonResponse {
	webStatus := WebStatus{
		StatusCode: status,
		Message:    http.StatusText(status),
	}
	return &CommonResponse{
		ResponseData: responseData,
		Status:       webStatus,
	}
}

func CommonCaller(callMethod string, endPoint string, commonRequest *CommonRequest, c buffalo.Context) (*CommonResponse, error) {
	pathParamsUrl := mappingUrlPathParams(endPoint, commonRequest)
	queryParamsUrl := mappingQueryParams(pathParamsUrl, commonRequest)
	commonResponse, err := CommonHttpToCommonResponse(apiBaseHost.ResolveReference(&url.URL{Path: queryParamsUrl}).String(), commonRequest, callMethod, c.Session().Get("Authorization").(string))
	return commonResponse, err
}

func CommonCallerWithoutToken(callMethod string, endPoint string, commonRequest *CommonRequest) (*CommonResponse, error) {
	pathParamsUrl := mappingUrlPathParams(endPoint, commonRequest)
	queryParamsUrl := mappingQueryParams(pathParamsUrl, commonRequest)
	commonResponse, err := CommonHttpToCommonResponse(apiBaseHost.ResolveReference(&url.URL{Path: queryParamsUrl}).String(), commonRequest, callMethod, "")
	return commonResponse, err
}

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

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error CommonHttp request:", err)
	}
	defer resp.Body.Close()

	respBody, ioerr := io.ReadAll(resp.Body)
	if ioerr != nil {
		log.Println("Error CommonHttp reading response:", ioerr)
	}

	commonResponse := &CommonResponse{}
	commonResponse.Status.Message = resp.Status
	commonResponse.Status.StatusCode = resp.StatusCode
	if len(respBody) > 0 {
		jsonerr := json.Unmarshal(respBody, &commonResponse)
		if jsonerr != nil {
			log.Println("Error CommonHttp Unmarshal response:", jsonerr.Error())
			return commonResponse, jsonerr
		}
	}
	return commonResponse, nil
}

// func CommonAPIPostWithoutAccessToken(path string, s *CommonRequest) (*http.Response, *CommonResponse, error) {
// 	jsonData, err := json.Marshal(s)
// 	if err != nil {
// 		log.Println("commonPostERR : json.Marshal : ", err.Error())
// 		return nil, nil, err
// 	}

// 	resp, err := http.Post(apiBaseHost.ResolveReference(&url.URL{Path: path}).String(), "application/json", bytes.NewBuffer(jsonData))
// 	if err != nil {
// 		log.Println("commonPostERR : http.Post : ", err.Error())
// 		return resp, nil, err
// 	}

// 	defer resp.Body.Close()

// 	respBody, err := io.ReadAll(resp.Body)
// 	if err != nil {
// 		log.Println("commonPostERR : io.ReadAll : ", err.Error())
// 		return resp, nil, err
// 	}

// 	commonResponse := &CommonResponse{}
// 	jsonerr := json.Unmarshal(respBody, &commonResponse)
// 	if jsonerr != nil {
// 		log.Println(jsonerr.Error())
// 		return resp, commonResponse, nil
// 	}

// 	return resp, commonResponse, nil
// }

// func CommonAPIPost(path string, s *CommonRequest, c buffalo.Context) (*http.Response, *CommonResponse, error) {
// 	jsonData, err := json.Marshal(s)
// 	if err != nil {
// 		log.Println("CommonAPIPostWithAccesstoken ERR : json.Marshal : ", err.Error())
// 		return nil, nil, err
// 	}

// 	accessToken := c.Session().Get("Authorization")
// 	accessTokenHeader := "Bearer " + accessToken.(string)

// 	req, err := http.NewRequest("POST", apiBaseHost.ResolveReference(&url.URL{Path: path}).String(), bytes.NewBuffer(jsonData))
// 	if err != nil {
// 		log.Println("CommonAPIPostWithAccesstoken ERR : http.NewRequest : ", err.Error())
// 		return nil, nil, err
// 	}

// 	req.Header.Set("Authorization", accessTokenHeader)
// 	req.Header.Set("Content-Type", "application/json") // Content-Type 설정

// 	client := &http.Client{}

// 	resp, err := client.Do(req)
// 	if err != nil {
// 		log.Println("CommonAPIPostWithAccesstoken ERR : client.Do : ", err.Error())
// 		return resp, nil, err
// 	}

// 	defer resp.Body.Close()

// 	respBody, err := io.ReadAll(resp.Body)
// 	if err != nil {
// 		log.Println("CommonAPIPostWithAccesstoken ERR : io.ReadAll : ", err.Error())
// 		return resp, nil, err
// 	}

// 	commonResponse := &CommonResponse{}
// 	jsonerr := json.Unmarshal(respBody, &commonResponse)
// 	if jsonerr != nil {
// 		log.Println(jsonerr.Error())
// 		return resp, commonResponse, nil
// 	}

// 	return resp, commonResponse, nil
// }

// func CommonAPIGetWithoutAccessToken(path string) (*http.Response, *CommonResponse, error) {
// 	resp, err := http.Get(apiBaseHost.ResolveReference(&url.URL{Path: path}).String())
// 	if err != nil {
// 		log.Println("commonPostERR : http.Post : ", err.Error())
// 		return resp, nil, err
// 	}

// 	defer resp.Body.Close()

// 	respBody, err := io.ReadAll(resp.Body)
// 	if err != nil {
// 		log.Println("commonPostERR : io.ReadAll : ", err.Error())
// 		return resp, nil, err
// 	}

// 	commonResponse := &CommonResponse{}
// 	jsonerr := json.Unmarshal(respBody, &commonResponse)
// 	if jsonerr != nil {
// 		log.Println(jsonerr.Error())
// 		return resp, commonResponse, nil
// 	}

// 	return resp, commonResponse, nil
// }

// func CommonAPIGet(path string, c buffalo.Context) (*http.Response, *CommonResponse, error) {
// 	accessToken := c.Session().Get("Authorization").(string)

// 	req, err := http.NewRequest("GET", apiBaseHost.ResolveReference(&url.URL{Path: path}).String(), nil)
// 	if err != nil {
// 		log.Println("CommonAPIGetWithAccesstoken ERR : http.NewRequest : ", err.Error())
// 		return nil, nil, err
// 	}

// 	req.Header.Set("Authorization", "Bearer "+accessToken)

// 	client := &http.Client{}

// 	resp, err := client.Do(req)
// 	if err != nil {
// 		log.Println("CommonAPIGetWithAccesstoken ERR : client.Do : ", err.Error())
// 		return resp, nil, err
// 	}

// 	defer resp.Body.Close()

// 	respBody, err := io.ReadAll(resp.Body)
// 	if err != nil {
// 		log.Println("CommonAPIGetWithAccesstoken ERR : io.ReadAll : ", err.Error())
// 		return resp, nil, err
// 	}

// 	commonResponse := &CommonResponse{}
// 	jsonerr := json.Unmarshal(respBody, &commonResponse)
// 	if jsonerr != nil {
// 		log.Println(jsonerr.Error())
// 		return resp, commonResponse, nil
// 	}

// 	return resp, commonResponse, nil
// }
