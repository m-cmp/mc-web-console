package handler

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
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
		// MCIAM_USE=true이면 RegistryCache에서 ActionSpec 조회 시도
		// (mc-iam-manager 레지스트리에만 있고 api.yaml에 없는 action 대응)
		if cfg.MCIAM.Use && cfg.RegistryCache != nil {
			if allSvcs := cfg.RegistryCache.GetAllServices(); allSvcs == nil {
				_ = refreshRegistryCache(cfg, c)
			}
			if cachedSpec := cfg.RegistryCache.GetActionSpec(subsystemName, operationId); cachedSpec != nil {
				if svc, svcErr := cfg.ApiSpec.GetService(subsystemName); svcErr == nil {
					service = svc
					actionSpec = cachedSpec
					err = nil
					log.Printf("[RegistryCache] ActionSpec fallback for %s/%s", subsystemName, operationId)
				}
			}
		}
		if err != nil {
			log.Printf("GetAction error: subsystem=%s operationId=%s err=%v", subsystemName, operationId, err)
			msg := fmt.Sprintf("API not found: %s/%s (%s)", subsystemName, operationId, err.Error())
			return c.JSON(http.StatusNotFound, model.CommonResponseStatusNotFound(msg))
		}
	}

	// MCIAM_USE=true이고 캐시가 비어 있으면 ListMcmpApisServices 자동 갱신
	// (UpdateFrameworkService 후 invalidate된 캐시를 복원)
	if cfg.MCIAM.Use && cfg.RegistryCache != nil {
		if allSvcs := cfg.RegistryCache.GetAllServices(); allSvcs == nil {
			if err := refreshRegistryCache(cfg, c); err != nil {
				log.Printf("[SubsystemAnyController] cache refresh failed: %v", err)
			}
		}
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

	// mc-infra-manager RegisterCredential: 평문 → hybrid encryption 변환
	if strings.ToLower(subsystemName) == "mc-infra-manager" &&
		strings.EqualFold(operationId, "RegisterCredential") {
		encrypted, encErr := encryptCredentialBody(bodyBytes, effectiveBaseURL, service)
		if encErr != nil {
			return errors.NewInternalServerError("credential encryption failed", encErr)
		}
		bodyBytes = encrypted
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

	// mc-infra-manager 전용 헤더 포워딩 (v0.12 x-credential-holder 지원)
	if strings.ToLower(subsystemName) == "mc-infra-manager" {
		// 클라이언트 헤더 우선, 없으면 로그인 사용자 role 사용
		credHolder := c.Request().Header.Get("x-credential-holder")
		if credHolder == "" {
			credHolder, _ = c.Get("role").(string)
		}
		if credHolder != "" {
			httpReq.Header.Set("x-credential-holder", credHolder)
		}
		if reqID := c.Request().Header.Get("x-request-id"); reqID != "" {
			httpReq.Header.Set("x-request-id", reqID)
		}
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

// publicKeyResponse GET /credential/publicKey 응답 구조
type publicKeyResponse struct {
	PublicKey       string `json:"publicKey"`
	PublicKeyTokenId string `json:"publicKeyTokenId"`
}

// plainCredentialRequest 프론트에서 전달하는 평문 credential 요청 구조
type plainCredentialRequest struct {
	CredentialHolder     string              `json:"credentialHolder"`
	ProviderName         string              `json:"providerName"`
	CredentialKeyValueList []credentialKV    `json:"credentialKeyValueList"`
}

type credentialKV struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// encryptedCredentialRequest mc-infra-manager RegisterCredential 암호화된 요청 구조
type encryptedCredentialRequest struct {
	CredentialHolder               string         `json:"credentialHolder"`
	ProviderName                   string         `json:"providerName"`
	CredentialKeyValueList         []credentialKV `json:"credentialKeyValueList"`
	EncryptedClientAesKeyByPublicKey string        `json:"encryptedClientAesKeyByPublicKey"`
	PublicKeyTokenId               string         `json:"publicKeyTokenId"`
}

// encryptCredentialBody 평문 credential payload를 hybrid encryption으로 변환한다.
// 1. GET /credential/publicKey → RSA 공개키 획득
// 2. AES-256-GCM 키 생성, credentialKeyValueList[].value 암호화
// 3. RSA-OAEP(SHA-256)으로 AES 키 암호화 → base64
func encryptCredentialBody(plainBody []byte, baseURL string, service *config.Service) ([]byte, error) {
	// 1. 공개키 조회
	pkURL := baseURL + "/credential/publicKey"
	pkReq, err := http.NewRequest(http.MethodGet, pkURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build publicKey request: %w", err)
	}
	// Basic auth 적용
	if service.Auth.Type == "basic" && service.Auth.Username != "" {
		encoded := base64.StdEncoding.EncodeToString([]byte(service.Auth.Username + ":" + service.Auth.Password))
		pkReq.Header.Set("Authorization", "Basic "+encoded)
	}
	pkResp, err := (&http.Client{}).Do(pkReq)
	if err != nil {
		return nil, fmt.Errorf("get publicKey: %w", err)
	}
	defer pkResp.Body.Close()
	pkBody, _ := io.ReadAll(pkResp.Body)

	var pkData publicKeyResponse
	if err := json.Unmarshal(pkBody, &pkData); err != nil {
		return nil, fmt.Errorf("parse publicKey response: %w", err)
	}
	if pkData.PublicKey == "" {
		return nil, fmt.Errorf("empty publicKey from mc-infra-manager")
	}

	// 2. RSA 공개키 파싱
	block, _ := pem.Decode([]byte(pkData.PublicKey))
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM publicKey")
	}
	pubInterface, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse RSA publicKey: %w", err)
	}
	rsaPub, ok := pubInterface.(*rsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("publicKey is not RSA")
	}

	// 3. 평문 요청 파싱
	var plain plainCredentialRequest
	if err := json.Unmarshal(plainBody, &plain); err != nil {
		return nil, fmt.Errorf("parse plain credential body: %w", err)
	}

	// 4. AES-256 키 생성
	aesKey := make([]byte, 32)
	if _, err := rand.Read(aesKey); err != nil {
		return nil, fmt.Errorf("generate AES key: %w", err)
	}

	// 5. credentialKeyValueList[].value AES-256-GCM 암호화
	encryptedKVList := make([]credentialKV, len(plain.CredentialKeyValueList))
	for i, kv := range plain.CredentialKeyValueList {
		cipherText, err := aesGCMEncrypt(aesKey, []byte(kv.Value))
		if err != nil {
			return nil, fmt.Errorf("encrypt credential value [%s]: %w", kv.Key, err)
		}
		encryptedKVList[i] = credentialKV{
			Key:   kv.Key,
			Value: base64.StdEncoding.EncodeToString(cipherText),
		}
	}

	// 6. AES 키를 RSA-OAEP(SHA-256)으로 암호화
	encAESKey, err := rsa.EncryptOAEP(sha256.New(), rand.Reader, rsaPub, aesKey, nil)
	if err != nil {
		return nil, fmt.Errorf("RSA-OAEP encrypt AES key: %w", err)
	}

	// 7. 암호화된 payload 구성
	encrypted := encryptedCredentialRequest{
		CredentialHolder:                plain.CredentialHolder,
		ProviderName:                    plain.ProviderName,
		CredentialKeyValueList:          encryptedKVList,
		EncryptedClientAesKeyByPublicKey: base64.StdEncoding.EncodeToString(encAESKey),
		PublicKeyTokenId:                pkData.PublicKeyTokenId,
	}
	return json.Marshal(encrypted)
}

// aesGCMEncrypt AES-256-GCM 암호화. 반환값: nonce(12B) + ciphertext
func aesGCMEncrypt(key, plaintext []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return ciphertext, nil
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
