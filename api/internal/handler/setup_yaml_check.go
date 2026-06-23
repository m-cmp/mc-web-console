// Package handler — FR-CLOUD-ADMIN-006-08 Setup Yaml reachability checker.
//
// 외부 raw YAML URL(MCWEBCONSOLE_MENUYAML / MCADMINCLI_APIYAML)에 대한
// 도달 가능성 + 메타정보(Last-Modified / ETag / Content-Length)를 확인하기 위한
// BFF 전용 endpoint. 프론트가 직접 raw.githubusercontent.com에 호출 시
// 발생하는 CORS 제약과 인증 토큰 노출 문제를 회피한다.
//
// Endpoint  : GET /api/admin/setup-yaml-check?which={menu|api}
// Auth      : middleware.AuthMiddleware (admin 전용 - 라우트 등록 측에서 보강)
// Timeout   : 5s
// Strategy  : 1) HTTP HEAD 시도, 2) 405/Not Implemented면 Range:0-0 GET fallback
package handler

import (
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"mc_web_console_api/internal/config"
	"mc_web_console_api/internal/model"

	"github.com/labstack/echo/v4"
)

// setupYamlCheckTimeout 외부 GitHub raw URL 호출 timeout
const setupYamlCheckTimeout = 5 * time.Second

// SetupYamlCheckResult BFF가 프론트에 반환하는 응답 데이터.
// FR-CLOUD-ADMIN-006-08-DESIGN.md 응답 스키마 기준.
type SetupYamlCheckResult struct {
	Which         string `json:"which"`                   // "menu" | "api"
	URL           string `json:"url"`                     // 검사 대상 raw URL
	Reachable     bool   `json:"reachable"`               // 200~299 응답 여부
	HTTPStatus    int    `json:"httpStatus"`              // 실제 HTTP status
	LastModified  string `json:"lastModified,omitempty"`  // RFC1123
	ETag          string `json:"etag,omitempty"`          // 원본 ETag (양 끝 따옴표 포함)
	ContentLength int64  `json:"contentLength,omitempty"` // -1 = 알 수 없음
	CheckedAt     string `json:"checkedAt"`               // RFC3339
	ErrorMessage  string `json:"errorMessage,omitempty"`  // 네트워크/타임아웃 에러
}

// GetSetupYamlCheck FR-CLOUD-ADMIN-006-08 setup yaml 도달성 확인 핸들러.
// @Summary     Setup YAML reachability check
// @Description Probe external raw YAML URLs (menu or api catalog) for admin setup status
// @Tags        admin
// @Produce     json
// @Param       which query string true "Target YAML" Enums(menu, api)
// @Success     200 {object} model.CommonResponse{responseData=SetupYamlCheckResult}
// @Failure     400 {object} model.CommonResponse
// @Router      /api/admin/setup-yaml-check [get]
func GetSetupYamlCheck(c echo.Context) error {
	which := strings.ToLower(strings.TrimSpace(c.QueryParam("which")))
	if which != "menu" && which != "api" {
		resp := model.CommonResponseStatusBadRequest(
			"invalid query param: which must be one of [menu, api]",
		)
		return c.JSON(resp.ToJSON())
	}

	cfg, ok := c.Get("config").(*config.Config)
	if !ok || cfg == nil {
		resp := model.CommonResponseStatusInternalServerError("config not injected into context")
		return c.JSON(resp.ToJSON())
	}

	url := resolveYamlURL(cfg, which)
	if url == "" {
		resp := model.CommonResponseStatusBadRequest(fmt.Sprintf(
			"environment variable for which=%s is not configured", which,
		))
		return c.JSON(resp.ToJSON())
	}

	result := probeYamlURL(which, url)
	resp := model.CommonResponseStatusOK(result)
	return c.JSON(resp.ToJSON())
}

// resolveYamlURL which 값에 따라 사용할 raw URL을 반환. 미설정이면 빈 문자열.
func resolveYamlURL(cfg *config.Config, which string) string {
	switch which {
	case "menu":
		return cfg.SetupYaml.McWebconsoleMenuYaml
	case "api":
		return cfg.SetupYaml.McAdmincliApiYaml
	default:
		return ""
	}
}

// probeYamlURL HEAD를 1차 시도하고, 405/501 또는 기타 실패 시 GET Range:0-0로 fallback.
// 어떤 실패가 발생해도 SetupYamlCheckResult를 반환 (errorMessage에 사유 기재).
func probeYamlURL(which, url string) SetupYamlCheckResult {
	result := SetupYamlCheckResult{
		Which:         which,
		URL:           url,
		Reachable:     false,
		ContentLength: -1,
		CheckedAt:     time.Now().UTC().Format(time.RFC3339),
	}

	client := &http.Client{Timeout: setupYamlCheckTimeout}

	// 1) HEAD 시도
	headResp, headErr := doRequest(client, http.MethodHead, url, nil)
	if headErr == nil {
		fillResultFromResponse(&result, headResp)
		_ = headResp.Body.Close()
		// HEAD가 명시적으로 거부된 경우에만 GET fallback 시도
		if result.HTTPStatus != http.StatusMethodNotAllowed && result.HTTPStatus != http.StatusNotImplemented {
			return result
		}
	}

	// 2) GET Range:0-0 fallback (HEAD 실패/거부 시)
	getResp, getErr := doRequest(client, http.MethodGet, url, map[string]string{
		"Range": "bytes=0-0",
	})
	if getErr != nil {
		// 두 시도 모두 실패: 마지막 에러를 errorMessage에 기록
		// (HEAD 시도의 메타정보는 이미 채워진 상태일 수 있음)
		if headErr != nil {
			result.ErrorMessage = fmt.Sprintf("HEAD failed: %v; GET fallback failed: %v", headErr, getErr)
		} else {
			result.ErrorMessage = fmt.Sprintf("GET fallback failed: %v", getErr)
		}
		return result
	}
	defer getResp.Body.Close()
	// Range 응답은 보통 206 Partial Content; 일부 서버는 200 그대로 반환
	fillResultFromResponse(&result, getResp)
	if getResp.StatusCode == http.StatusPartialContent {
		result.HTTPStatus = http.StatusPartialContent
		result.Reachable = true
	}
	// body 일부 소비 (connection 재활용 — Range 1바이트라 비용 무시)
	_, _ = io.CopyN(io.Discard, getResp.Body, 1)
	return result
}

// doRequest 단일 HTTP 요청을 보내고 응답 또는 에러 반환. 호출자가 Body.Close 책임.
func doRequest(client *http.Client, method, url string, headers map[string]string) (*http.Response, error) {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "mc-web-console-bff/setup-yaml-check")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	return client.Do(req)
}

// fillResultFromResponse HTTP 응답에서 메타데이터 추출하여 result에 채움.
// 200~299만 reachable=true.
func fillResultFromResponse(result *SetupYamlCheckResult, resp *http.Response) {
	result.HTTPStatus = resp.StatusCode
	result.Reachable = resp.StatusCode >= 200 && resp.StatusCode < 300

	if lm := resp.Header.Get("Last-Modified"); lm != "" {
		result.LastModified = lm
	}
	if etag := resp.Header.Get("ETag"); etag != "" {
		result.ETag = etag
	}
	// HEAD나 일반 GET의 Content-Length 활용 (Range 206은 별도 처리)
	if cl := resp.Header.Get("Content-Length"); cl != "" && resp.StatusCode != http.StatusPartialContent {
		if n, perr := strconv.ParseInt(cl, 10, 64); perr == nil {
			result.ContentLength = n
		}
	}
	// Content-Range 헤더 형식: "bytes 0-0/12345" → 슬래시 뒤 전체 크기 파싱
	if cr := resp.Header.Get("Content-Range"); cr != "" {
		if idx := strings.LastIndex(cr, "/"); idx >= 0 && idx+1 < len(cr) {
			if n, perr := strconv.ParseInt(strings.TrimSpace(cr[idx+1:]), 10, 64); perr == nil {
				result.ContentLength = n
			}
		}
	}
}
