package handler

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"mc_web_console_api/internal/config"
	"mc_web_console_api/internal/model"
	"mc_web_console_api/pkg/errors"

	"github.com/labstack/echo/v4"
)

// SubsystemAnyController Buffalo SubsystemAnyController 호환 프록시 핸들러
// POST /api/:subsystemName/:operationId
// conf/api.yaml의 serviceActions를 기반으로 백엔드 서비스에 프록시
func SubsystemAnyController(c echo.Context) error {
	subsystemName := c.Param("subsystemName")
	operationId := c.Param("operationId")

	log.Printf("#### SubsystemAnyController subsystem=%s operationId=%s", subsystemName, operationId)

	if subsystemName == "" {
		return c.JSON(http.StatusNotFound, model.CommonResponseStatusNotFound("no subsystemName is provided"))
	}
	if operationId == "" {
		return c.JSON(http.StatusNotFound, model.CommonResponseStatusNotFound("no operationId is provided"))
	}

	cfg, _ := c.Get("config").(*config.Config)
	if cfg == nil {
		return errors.NewInternalServerError("config not available", fmt.Errorf("config is nil"))
	}

	// api.yaml에서 기본 Service + ActionSpec 조회 (fallback 및 Auth 설정 소스)
	service, actionSpec, err := cfg.ApiSpec.GetAction(subsystemName, operationId)
	if err != nil {
		log.Printf("GetAction error: subsystem=%s operationId=%s err=%v", subsystemName, operationId, err)
		msg := fmt.Sprintf("API not found: %s/%s (%s)", subsystemName, operationId, err.Error())
		return c.JSON(http.StatusNotFound, model.CommonResponseStatusNotFound(msg))
	}

	// BaseURL: 캐시 우선 → 없으면 api.yaml BaseURL (mc-iam-manager 고정 주소)
	effectiveBaseURL := service.BaseURL
	// ActionSpec: 캐시 우선 → 없으면 api.yaml ActionSpec
	effectiveActionSpec := actionSpec
	if cfg.RegistryCache != nil {
		if dynamicURL := cfg.RegistryCache.GetBaseURL(subsystemName, operationId); dynamicURL != "" {
			log.Printf("[RegistryCache] BaseURL override for %s: %s", subsystemName, dynamicURL)
			effectiveBaseURL = dynamicURL
		}
		if cachedSpec := cfg.RegistryCache.GetActionSpec(subsystemName, operationId); cachedSpec != nil {
			effectiveActionSpec = cachedSpec
		}
	}

	// CommonRequest 파싱
	var commonRequest model.CommonRequest
	if err := c.Bind(&commonRequest); err != nil {
		commonRequest = *model.NewCommonRequest()
	}

	// PathParams 치환
	resourcePath := effectiveActionSpec.ResourcePath
	for k, v := range commonRequest.PathParams {
		resourcePath = strings.ReplaceAll(resourcePath, "{"+k+"}", v)
	}

	// QueryParams 추가 (string 또는 []interface{} 배열 모두 처리)
	targetURL := effectiveBaseURL + resourcePath
	if len(commonRequest.QueryParams) > 0 {
		params := []string{}
		for k, v := range commonRequest.QueryParams {
			switch val := v.(type) {
			case string:
				params = append(params, k+"="+val)
			case []interface{}:
				for _, item := range val {
					params = append(params, k+"="+fmt.Sprint(item))
				}
			default:
				params = append(params, k+"="+fmt.Sprint(val))
			}
		}
		targetURL += "?" + strings.Join(params, "&")
	}

	// 요청 바디
	var bodyBytes []byte
	if commonRequest.Request != nil {
		if len(effectiveActionSpec.RequestCoerce) > 0 {
			coerceRequestFields(commonRequest.Request, effectiveActionSpec.RequestCoerce)
		}
		bodyBytes, _ = json.Marshal(commonRequest.Request)
	}

	httpReq, err := http.NewRequest(strings.ToUpper(effectiveActionSpec.Method), targetURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return errors.NewInternalServerError("Failed to build request", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	// Authorization 헤더 설정
	authHeader := buildAuthHeader(c, service)
	if authHeader != "" {
		httpReq.Header.Set("Authorization", authHeader)
	}

	log.Printf("Proxying %s %s", httpReq.Method, targetURL)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return errors.NewInternalServerError("Failed to reach backend service: "+subsystemName, err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var responseData interface{}
	if jsonErr := json.Unmarshal(respBody, &responseData); jsonErr != nil {
		responseData = strings.TrimSpace(string(respBody))
	}

	// RegistryCache 인터셉트
	if cfg.RegistryCache != nil {
		opLower := strings.ToLower(operationId)
		subsysLower := strings.ToLower(subsystemName)
		if subsysLower == "mc-iam-manager" {
			switch opLower {
			case "listmcmpapisservices":
				// ListMcmpApisServices 성공 응답 → 캐시 저장
				if resp.StatusCode == http.StatusOK {
					// responseData는 CommonResponse 래퍼 없이 mc-iam-manager 원본 응답
					cfg.RegistryCache.Store(responseData)
				}
			case "updateframeworkservice":
				// UpdateFrameworkService 성공 → 캐시 무효화
				if resp.StatusCode < 300 {
					cfg.RegistryCache.Invalidate()
				}
			}
		}
	}

	commonResp := model.NewCommonResponse(resp.StatusCode, http.StatusText(resp.StatusCode), responseData)
	return c.JSON(resp.StatusCode, commonResp)
}

// buildAuthHeader api.yaml의 auth 타입에 따라 Authorization 헤더 값 반환
func buildAuthHeader(c echo.Context, service *config.Service) string {
	switch service.Auth.Type {
	case "basic":
		if service.Auth.Username != "" && service.Auth.Password != "" {
			encoded := base64.StdEncoding.EncodeToString([]byte(service.Auth.Username + ":" + service.Auth.Password))
			return "Basic " + encoded
		}
	case "bearer":
		// 클라이언트 요청에서 Authorization 헤더 전달
		authValue := c.Request().Header.Get("Authorization")
		if authValue == "" {
			authValue, _ = c.Get("Authorization").(string)
		}
		if authValue != "" {
			if !strings.HasPrefix(authValue, "Bearer ") {
				return "Bearer " + authValue
			}
			return authValue
		}
	}
	return ""
}

// coerceRequestFields whitelist 방식으로 요청 바디의 특정 필드 타입을 변환한다.
// coerceMap: 필드명 → "int"|"float"|"bool". 선언되지 않은 필드는 건드리지 않는다.
func coerceRequestFields(req map[string]interface{}, coerceMap map[string]string) {
	for key, targetType := range coerceMap {
		val, ok := req[key]
		if !ok {
			continue
		}
		strVal, ok := val.(string)
		if !ok {
			continue
		}
		switch targetType {
		case "int":
			if n, err := strconv.Atoi(strVal); err == nil {
				req[key] = n
			}
		case "float":
			if f, err := strconv.ParseFloat(strVal, 64); err == nil {
				req[key] = f
			}
		case "bool":
			if b, err := strconv.ParseBool(strVal); err == nil {
				req[key] = b
			}
		}
	}
}
