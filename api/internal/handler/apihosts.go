package handler

import (
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
func refreshRegistryCache(cfg *config.Config, c echo.Context) error {
	service, actionSpec, err := cfg.ApiSpec.GetAction("mc-iam-manager", "ListMcmpApisServices")
	if err != nil {
		return fmt.Errorf("ListMcmpApisServices not found in api.yaml: %w", err)
	}

	targetURL := service.BaseURL + actionSpec.ResourcePath
	req, err := http.NewRequest(strings.ToUpper(actionSpec.Method), targetURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	if authHeader := buildAuthHeader(c, service); authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return fmt.Errorf("ListMcmpApisServices call failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("ListMcmpApisServices returned %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var responseData interface{}
	if err := json.Unmarshal(body, &responseData); err != nil {
		return fmt.Errorf("ListMcmpApisServices response parse failed: %w", err)
	}

	cfg.RegistryCache.Store(responseData)
	return nil
}
