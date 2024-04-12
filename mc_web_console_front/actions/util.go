package actions

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
)

func CommonAPIPost(path string, s interface{}) (string, []byte, error) {
	jsonData, err := json.Marshal(s)
	if err != nil {
		log.Println("commonPostERR : json.Marshal : ", err.Error())
		return "", nil, err
	}

	resp, err := http.Post(APIbaseHost.ResolveReference(&url.URL{Path: path}).String(), "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println("commonPostERR : http.Post : ", err.Error())
		return "", nil, err
	}

	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("commonPostERR : io.ReadAll : ", err.Error())
		return "", nil, err
	}

	return resp.Status, respBody, nil
}
