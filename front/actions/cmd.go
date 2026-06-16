package actions

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

type cmdPathParams struct {
	NsId    string `json:"nsId"`
	InfraId string `json:"infraId"`
}

type cmdRequest struct {
	Command  interface{} `json:"command"`
	UserName string      `json:"userName"`
}

type cmdCommonRequest struct {
	PathParams  cmdPathParams          `json:"pathParams"`
	QueryParams map[string]interface{} `json:"queryParams"`
	Request     cmdRequest             `json:"Request"`
}

// PostCmdInfraHandler forwards a remote command request to mc-infra-manager.
// The JS sends JSON with pathParams/Request; this handler calls mc-infra-manager
// directly with Basic auth, bypassing the API proxy which lacks this action.
func PostCmdInfraHandler(c echo.Context) error {
	var req cmdCommonRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return respondCmdError(c, http.StatusBadRequest, "invalid request body: "+err.Error())
	}

	nsId := req.PathParams.NsId
	mciId := req.PathParams.InfraId
	if nsId == "" || mciId == "" {
		return respondCmdError(c, http.StatusBadRequest, "nsId and infraId are required")
	}

	// Build mc-infra-manager URL
	targetURL := fmt.Sprintf("%s/ns/%s/cmd/infra/%s", INFRA_MANAGER_URL, nsId, mciId)

	// Forward optional queryParams (subGroupId, vmId, etc.)
	if len(req.QueryParams) > 0 {
		params := []string{}
		for k, v := range req.QueryParams {
			params = append(params, fmt.Sprintf("%s=%v", k, v))
		}
		targetURL += "?" + strings.Join(params, "&")
	}

	// Forward only the Request body to mc-infra-manager
	bodyBytes, err := json.Marshal(req.Request)
	if err != nil {
		return respondCmdError(c, http.StatusInternalServerError, "failed to marshal request: "+err.Error())
	}

	httpReq, err := http.NewRequest(http.MethodPost, targetURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return respondCmdError(c, http.StatusInternalServerError, "failed to build request: "+err.Error())
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.SetBasicAuth(INFRA_MANAGER_USER, INFRA_MANAGER_PASS)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return respondCmdError(c, http.StatusBadGateway, "failed to reach mc-infra-manager: "+err.Error())
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var responseData interface{}
	if jsonErr := json.Unmarshal(respBody, &responseData); jsonErr != nil {
		responseData = strings.TrimSpace(string(respBody))
	}

	return c.JSON(resp.StatusCode, map[string]interface{}{
		"responseData": responseData,
		"status": map[string]interface{}{
			"code":    resp.StatusCode,
			"message": http.StatusText(resp.StatusCode),
		},
	})
}

func respondCmdError(c echo.Context, code int, msg string) error {
	return c.JSON(code, map[string]interface{}{
		"responseData": map[string]string{"message": msg},
		"status":       map[string]interface{}{"code": code, "message": http.StatusText(code)},
	})
}
