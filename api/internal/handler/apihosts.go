package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	// "regexp"
	"strings"

	"mc_web_console_api/internal/config"
	"mc_web_console_api/internal/model"

	"github.com/labstack/echo/v4"
)

// ServiceNoAuth Auth 정보를 제외한 서비스 호스트 정보 (Buffalo ServiceNoAuth 호환)
type ServiceNoAuth struct {
	BaseURL string `json:"BaseURL"`
}

// GetApiHosts POST /api/getapihosts
// MCIAM_USE=false: api.yaml Services에서 추출
// MCIAM_USE=true:  RegistryCache 우선, 미적재 시 ListMcmpApisServices 호출 후 반환
// IFRAME_TARGET_IS_HOST=true: BaseURL을 :port/path 형식으로 변환
func GetApiHosts(c echo.Context) error {
	cfg, _ := c.Get("config").(*config.Config)
	if cfg == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{"error": "config not available"})
	}

	apiHosts := make(map[string]ServiceNoAuth)

	// api.yaml을 기본값으로 사용 (레지스트리 미등록 서비스도 포함)
	for k, v := range cfg.ApiSpec.Services {
		apiHosts[k] = ServiceNoAuth{BaseURL: v.BaseURL}
	}

	if cfg.MCIAM.Use && cfg.RegistryCache != nil {
		cached := cfg.RegistryCache.GetAllServices()
		if cached == nil {
			// 캐시 미적재 → ListMcmpApisServices 직접 호출하여 채워넣기
			if err := refreshRegistryCache(cfg, c); err != nil {
				log.Printf("[GetApiHosts] cache refresh failed: %v", err)
			}
			cached = cfg.RegistryCache.GetAllServices()
		}
		// 레지스트리 값으로 override (BaseURL이 있는 경우만)
		for k, v := range cached {
			if v.BaseURL != "" {
				apiHosts[k] = ServiceNoAuth{BaseURL: v.BaseURL}
			}
		}
	}

	commonResponse := model.CommonResponseStatusOK(apiHosts)

	// IFRAME_TARGET_IS_HOST=true 시 :port/path 형식으로 변환하는 로직.
	// HTTPS(HSTS) 환경에서 브라우저 protocol이 강제되어 http 서비스 접근 불가 문제로 비활성화.
	// DB에 외부 접근 가능한 full URL을 그대로 저장하고 전달하는 방식으로 변경.
	// if cfg.IframeTargetIsHost {
	// 	re := regexp.MustCompile(`:(\d+.*)`)
	// 	for fw, host := range apiHosts {
	// 		if portURLStr := re.FindString(host.BaseURL); portURLStr != "" {
	// 			host.BaseURL = portURLStr
	// 			apiHosts[fw] = host
	// 		}
	// 	}
	// 	commonResponse = model.CommonResponseStatusOK(apiHosts)
	// }

	return c.JSON(commonResponse.Status.Code, commonResponse)
}

// refreshRegistryCache mc-iam-manager의 ListMcmpApisServices를 직접 호출하여 RegistryCache 갱신.
// buildAuthHeader는 proxy.go에서 공유 (같은 handler 패키지).
// 401 응답 시 RefreshToken 쿠키로 액세스 토큰을 자동 갱신 후 재시도한다.
func refreshRegistryCache(cfg *config.Config, c echo.Context) error {
	service, actionSpec, err := cfg.ApiSpec.GetAction("mc-iam-manager", "ListMcmpApisServices")
	if err != nil {
		return fmt.Errorf("ListMcmpApisServices not found in api.yaml: %w", err)
	}

	targetURL := service.BaseURL + actionSpec.ResourcePath
	authHeader := buildAuthHeader(c, service)

	body, err := doListMcmpApisServices(cfg, c, targetURL, actionSpec.Method, authHeader)
	if err != nil {
		return err
	}

	var responseData interface{}
	if err := json.Unmarshal(body, &responseData); err != nil {
		return fmt.Errorf("ListMcmpApisServices response parse failed: %w", err)
	}

	cfg.RegistryCache.Store(responseData)
	return nil
}

// doListMcmpApisServices ListMcmpApisServices HTTP 호출.
// 401 수신 시 RefreshToken 쿠키로 액세스 토큰 갱신 후 1회 재시도한다.
func doListMcmpApisServices(cfg *config.Config, c echo.Context, targetURL, method, authHeader string) ([]byte, error) {
	resp, err := callHTTP(strings.ToUpper(method), targetURL, authHeader)
	if err != nil {
		return nil, fmt.Errorf("ListMcmpApisServices call failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		newToken, refreshErr := refreshUserAccessToken(cfg, c)
		if refreshErr != nil {
			return nil, fmt.Errorf("ListMcmpApisServices 401, token refresh failed: %w", refreshErr)
		}
		log.Printf("[RegistryCache] token refreshed, retrying ListMcmpApisServices")
		resp2, err2 := callHTTP(strings.ToUpper(method), targetURL, "Bearer "+newToken)
		if err2 != nil {
			return nil, fmt.Errorf("ListMcmpApisServices retry failed: %w", err2)
		}
		defer resp2.Body.Close()
		if resp2.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("ListMcmpApisServices retry returned %d", resp2.StatusCode)
		}
		return io.ReadAll(resp2.Body)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ListMcmpApisServices returned %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

// callHTTP method/url/authHeader로 단순 HTTP 요청을 실행한다.
func callHTTP(method, url, authHeader string) (*http.Response, error) {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	return (&http.Client{}).Do(req)
}

// refreshUserAccessToken RefreshToken 쿠키를 이용해 mc-iam-manager에서 새 access_token 발급.
func refreshUserAccessToken(cfg *config.Config, c echo.Context) (string, error) {
	refreshCookie, err := c.Cookie("RefreshToken")
	if err != nil || refreshCookie.Value == "" {
		return "", fmt.Errorf("RefreshToken cookie not found")
	}

	service, actionSpec, err := cfg.ApiSpec.GetAction("mc-iam-manager", "loginrefresh")
	if err != nil {
		return "", fmt.Errorf("loginrefresh not found in api.yaml: %w", err)
	}

	targetURL := service.BaseURL + actionSpec.ResourcePath

	body, _ := json.Marshal(map[string]string{"refresh_token": refreshCookie.Value})
	req, err := http.NewRequest(http.MethodPost, targetURL, bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return "", fmt.Errorf("loginrefresh call failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("loginrefresh returned %d", resp.StatusCode)
	}

	respBody, _ := io.ReadAll(resp.Body)
	var data map[string]interface{}
	if err := json.Unmarshal(respBody, &data); err != nil {
		return "", fmt.Errorf("loginrefresh response parse failed: %w", err)
	}

	accessToken, ok := data["access_token"].(string)
	if !ok || accessToken == "" {
		return "", fmt.Errorf("access_token not found in loginrefresh response")
	}
	return accessToken, nil
}
