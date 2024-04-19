package actions

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	mcmodels "mc_web_console_common_models"
	"net/http"
	"net/url"

	"github.com/gobuffalo/buffalo"
)

func CommonAPIPostWithoutAccessToken(path string, s *mcmodels.CommonRequest) (*http.Response, *mcmodels.CommonResponse, error) {
	jsonData, err := json.Marshal(s)
	if err != nil {
		log.Println("commonPostERR : json.Marshal : ", err.Error())
		return nil, nil, err
	}

	fmt.Printf("jsonData %s", jsonData)

	resp, err := http.Post(APIbaseHost.ResolveReference(&url.URL{Path: path}).String(), "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println("commonPostERR : http.Post : ", err.Error())
		return resp, nil, err
	}

	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("commonPostERR : io.ReadAll : ", err.Error())
		return resp, nil, err
	}

	commonResponse := &mcmodels.CommonResponse{}
	jsonerr := json.Unmarshal(respBody, &commonResponse)
	if jsonerr != nil {
		log.Println(jsonerr.Error())
		return resp, commonResponse, nil
	}

	return resp, commonResponse, nil
}

func CommonAPIPost(path string, s *mcmodels.CommonRequest, c buffalo.Context) (*http.Response, *mcmodels.CommonResponse, error) {
	jsonData, err := json.Marshal(s)
	if err != nil {
		log.Println("CommonAPIPostWithAccesstoken ERR : json.Marshal : ", err.Error())
		return nil, nil, err
	}

	accessToken := c.Session().Get("Authorization")
	accessTokenHeader := "Bearer " + accessToken.(string)

	req, err := http.NewRequest("POST", APIbaseHost.ResolveReference(&url.URL{Path: path}).String(), bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println("CommonAPIPostWithAccesstoken ERR : http.NewRequest : ", err.Error())
		return nil, nil, err
	}

	req.Header.Set("Authorization", accessTokenHeader)
	req.Header.Set("Content-Type", "application/json") // Content-Type 설정

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		log.Println("CommonAPIPostWithAccesstoken ERR : client.Do : ", err.Error())
		return resp, nil, err
	}

	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("CommonAPIPostWithAccesstoken ERR : io.ReadAll : ", err.Error())
		return resp, nil, err
	}

	commonResponse := &mcmodels.CommonResponse{}
	jsonerr := json.Unmarshal(respBody, &commonResponse)
	if jsonerr != nil {
		log.Println(jsonerr.Error())
		return resp, commonResponse, nil
	}

	return resp, commonResponse, nil
}

func CommonAPIGetWithoutAccessToken(path string) (*http.Response, *mcmodels.CommonResponse, error) {
	resp, err := http.Get(APIbaseHost.ResolveReference(&url.URL{Path: path}).String())
	if err != nil {
		log.Println("commonPostERR : http.Post : ", err.Error())
		return resp, nil, err
	}

	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("commonPostERR : io.ReadAll : ", err.Error())
		return resp, nil, err
	}

	commonResponse := &mcmodels.CommonResponse{}
	jsonerr := json.Unmarshal(respBody, &commonResponse)
	if jsonerr != nil {
		log.Println(jsonerr.Error())
		return resp, commonResponse, nil
	}

	return resp, commonResponse, nil
}

func CommonAPIGet(path string, c buffalo.Context) (*http.Response, *mcmodels.CommonResponse, error) {
	accessToken := c.Session().Get("Authorization").(string)

	req, err := http.NewRequest("GET", APIbaseHost.ResolveReference(&url.URL{Path: path}).String(), nil)
	if err != nil {
		log.Println("CommonAPIGetWithAccesstoken ERR : http.NewRequest : ", err.Error())
		return nil, nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		log.Println("CommonAPIGetWithAccesstoken ERR : client.Do : ", err.Error())
		return resp, nil, err
	}

	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("CommonAPIGetWithAccesstoken ERR : io.ReadAll : ", err.Error())
		return resp, nil, err
	}

	commonResponse := &mcmodels.CommonResponse{}
	jsonerr := json.Unmarshal(respBody, &commonResponse)
	if jsonerr != nil {
		log.Println(jsonerr.Error())
		return resp, commonResponse, nil
	}

	return resp, commonResponse, nil
}
