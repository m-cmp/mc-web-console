package service

import (
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"

	"mc_web_console_api/internal/config"
)

// RegistryCache mc-iam-manager 서비스 레지스트리 Passive 캐시.
// ListMcmpApisServices 응답을 proxy.go가 통과할 때 저장하고,
// UpdateFrameworkService 성공 시 무효화한다.
// 캐시 유효 시 proxy.go의 GetAction이 api.yaml 대신 이 캐시를 사용한다.
type RegistryCache struct {
	mu       sync.RWMutex
	spec     *config.ApiSpec
	storedAt time.Time
	ttl      time.Duration
}

// NewRegistryCache RegistryCache 생성 (ttl: 캐시 유효 시간)
func NewRegistryCache(ttl time.Duration) *RegistryCache {
	return &RegistryCache{ttl: ttl}
}

// Store ListMcmpApisServices 응답 데이터(responseData)를 ApiSpec으로 변환하여 저장.
// responseData는 proxy.go에서 json.Unmarshal된 interface{} 값이다.
func (rc *RegistryCache) Store(responseData interface{}) {
	spec := convertToApiSpec(responseData)
	if spec == nil {
		return
	}
	rc.mu.Lock()
	rc.spec = spec
	rc.storedAt = time.Now()
	rc.mu.Unlock()
	log.Printf("[RegistryCache] stored %d services from mc-iam-manager registry", len(spec.Services))
}

// Invalidate 캐시 무효화. UpdateFrameworkService 성공 시 호출.
func (rc *RegistryCache) Invalidate() {
	rc.mu.Lock()
	rc.spec = nil
	rc.mu.Unlock()
	log.Printf("[RegistryCache] invalidated")
}

// GetAction 캐시가 유효하고 subsystem이 mc-iam-manager가 아닌 경우 Service + ActionSpec 반환.
// 캐시 없음/만료/mc-iam-manager 자신 요청이면 nil,nil,nil 반환 → api.yaml fallback 유도.
func (rc *RegistryCache) GetAction(subsystem, operationId string) (*config.Service, *config.ActionSpec, error) {
	// mc-iam-manager 자신은 캐시 건너뜀 (순환 참조 방지)
	if strings.EqualFold(subsystem, "mc-iam-manager") {
		return nil, nil, nil
	}

	rc.mu.RLock()
	spec := rc.spec
	storedAt := rc.storedAt
	rc.mu.RUnlock()

	if spec == nil {
		return nil, nil, nil
	}
	if time.Since(storedAt) > rc.ttl {
		log.Printf("[RegistryCache] TTL expired, falling back to api.yaml")
		return nil, nil, nil
	}

	return spec.GetAction(subsystem, operationId)
}

// convertToApiSpec responseData(interface{})를 config.ApiSpec으로 변환.
// McmpApiDefinitions 구조:
//
//	{ "Services": { "name": { "Version", "BaseURL", "Auth": { "Type", "Username", "Password" } } },
//	  "ServiceActions": { "name": { "opId": { "Method", "ResourcePath", "Description" } } } }
func convertToApiSpec(responseData interface{}) *config.ApiSpec {
	// interface{} → JSON → map 재파싱
	b, err := json.Marshal(responseData)
	if err != nil {
		log.Printf("[RegistryCache] marshal error: %v", err)
		return nil
	}

	var raw struct {
		Services map[string]struct {
			Version string `json:"Version"`
			BaseURL string `json:"BaseURL"`
			Auth    struct {
				Type     string `json:"Type"`
				Username string `json:"Username"`
				Password string `json:"Password"`
			} `json:"Auth"`
		} `json:"Services"`
		ServiceActions map[string]map[string]struct {
			Method       string `json:"Method"`
			ResourcePath string `json:"ResourcePath"`
			Description  string `json:"Description"`
		} `json:"ServiceActions"`
	}
	if err := json.Unmarshal(b, &raw); err != nil {
		log.Printf("[RegistryCache] unmarshal error: %v", err)
		return nil
	}

	if len(raw.Services) == 0 {
		log.Printf("[RegistryCache] no Services in response, skip")
		return nil
	}

	spec := &config.ApiSpec{
		Services:       make(map[string]config.Service),
		ServiceActions: make(map[string]map[string]config.ActionSpec),
	}

	for name, svc := range raw.Services {
		spec.Services[name] = config.Service{
			Version: svc.Version,
			BaseURL: svc.BaseURL,
			Auth: config.AuthConfig{
				Type:     svc.Auth.Type,
				Username: svc.Auth.Username,
				Password: svc.Auth.Password,
			},
		}
	}

	for svcName, actions := range raw.ServiceActions {
		spec.ServiceActions[svcName] = make(map[string]config.ActionSpec)
		for opId, action := range actions {
			spec.ServiceActions[svcName][opId] = config.ActionSpec{
				Method:       action.Method,
				ResourcePath: action.ResourcePath,
				Description:  action.Description,
			}
		}
	}

	return spec
}
