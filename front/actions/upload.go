package actions

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

// maxUploadFileSize caps a single remote file transfer. mc-infra-manager
// (cb-tumblebug) rejects larger payloads, so reject here before building the
// multipart body. The front-end enforces the same limit before base64 encoding.
const maxUploadFileSize = 10 * 1024 * 1024 // 10MB

type fileUploadPathParams struct {
	NsId    string `json:"nsId"`
	InfraId string `json:"infraId"`
}

type fileUploadFileInfo struct {
	Name string `json:"name"`
	Data string `json:"data"`
	Type string `json:"type"`
}

type fileUploadRequestBody struct {
	Path string             `json:"path"`
	File fileUploadFileInfo `json:"file"`
}

type fileUploadCommonRequest struct {
	PathParams  fileUploadPathParams   `json:"pathParams"`
	QueryParams map[string]interface{} `json:"queryParams"`
	Request     fileUploadRequestBody  `json:"request"`
}

// PostFileToInfraHandler handles file transfer to mc-infra-manager.
// The JS sends JSON with base64-encoded file; this handler converts it to
// multipart/form-data as required by mc-infra-manager's transferFile API.
func PostFileToInfraHandler(c echo.Context) error {
	var req fileUploadCommonRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return respondUploadError(c, http.StatusBadRequest, "invalid request body: "+err.Error())
	}

	nsId := req.PathParams.NsId
	infraId := req.PathParams.InfraId
	if nsId == "" || infraId == "" {
		return respondUploadError(c, http.StatusBadRequest, "nsId and infraId are required")
	}

	targetPath := req.Request.Path
	if targetPath == "" {
		return respondUploadError(c, http.StatusBadRequest, "target path is required")
	}

	// Decode base64 file (supports data URL format: "data:...;base64,<data>")
	rawData := req.Request.File.Data
	if idx := strings.Index(rawData, ","); idx >= 0 {
		rawData = rawData[idx+1:]
	}
	// Normalize base64: remove whitespace, handle URL-safe variant
	rawData = strings.TrimSpace(rawData)
	fileBytes, err := base64.StdEncoding.DecodeString(rawData)
	if err != nil {
		fileBytes, err = base64.URLEncoding.DecodeString(rawData)
		if err != nil {
			return respondUploadError(c, http.StatusBadRequest, "failed to decode file data: "+err.Error())
		}
	}

	if len(fileBytes) > maxUploadFileSize {
		return respondUploadError(c, http.StatusRequestEntityTooLarge,
			fmt.Sprintf("file exceeds the %d MB limit (%d bytes)", maxUploadFileSize/(1024*1024), len(fileBytes)))
	}

	fileName := req.Request.File.Name
	if fileName == "" {
		fileName = "upload"
	}

	// Build multipart/form-data body
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	if err := writer.WriteField("path", targetPath); err != nil {
		return respondUploadError(c, http.StatusInternalServerError, "failed to write form field")
	}

	part, err := writer.CreateFormFile("file", fileName)
	if err != nil {
		return respondUploadError(c, http.StatusInternalServerError, "failed to create form file")
	}
	if _, err := part.Write(fileBytes); err != nil {
		return respondUploadError(c, http.StatusInternalServerError, "failed to write file data")
	}
	writer.Close()

	// Build target URL with path substitution (getapihosts → env → localhost fallback)
	baseURL, authType := ResolveFramework(c, "mc-infra-manager", "http://localhost:1323/tumblebug")
	if authType == "" {
		authType = "basic" // legacy default for mc-infra-manager (cb-tumblebug)
	}
	targetURL := fmt.Sprintf("%s/ns/%s/transferFile/infra/%s", baseURL, nsId, infraId)

	// Forward queryParams as URL query string (e.g. nodeGroupId, nodeId)
	if len(req.QueryParams) > 0 {
		params := []string{}
		for k, v := range req.QueryParams {
			params = append(params, fmt.Sprintf("%s=%v", k, v))
		}
		targetURL += "?" + strings.Join(params, "&")
	}

	httpReq, err := http.NewRequest(http.MethodPost, targetURL, &body)
	if err != nil {
		return respondUploadError(c, http.StatusInternalServerError, "failed to build request: "+err.Error())
	}
	httpReq.Header.Set("Content-Type", writer.FormDataContentType())
	applyFrameworkAuth(httpReq, c, "mc-infra-manager", authType)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return respondUploadError(c, http.StatusBadGateway, "failed to reach mc-infra-manager: "+err.Error())
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

func respondUploadError(c echo.Context, code int, msg string) error {
	return c.JSON(code, map[string]interface{}{
		"responseData": map[string]string{"message": msg},
		"status":       map[string]interface{}{"code": code, "message": http.StatusText(code)},
	})
}
