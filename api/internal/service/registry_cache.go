package service

import (
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"
)

// RegistryCache mc-iam-manager 서비스 레지스트리 Passive 캐시.
// ListMcmpApisServices 응답을 proxy.go가 통과할 때 저장하고,
// UpdateFrameworkService 성공 시 무효화한다.
//
// 역할: BaseURL만 캐싱. ActionSpec(path/method)은 항상 api.yaml 사용.
// 이유: mc-iam-manager ServiceActions에 모든 operationId가 등록되지 않을 수 있음.
type RegistryCache struct {
	mu        sync.RWMutex
	baseURLs  map[string]string // serviceName → BaseURL
	storedAt  time.Time
	ttl       time.Duration
}

// NewRegistryCache RegistryCache 생성 (ttl: 캐시 유효 시간)
func NewRegistryCache(ttl time.Duration) *RegistryCache {
	return &RegistryCache{ttl: ttl}
}

// Store ListMcmpApisServices 응답 데이터(responseData)에서 Services의 BaseURL만 저장.
// responseData는 proxy.go에서 json.Unmarshal된 interface{} 값이다.
func (rc *RegistryCache) Store(responseData interface{}) {
	baseURLs := extractBaseURLs(responseData)
	if len(baseURLs) == 0 {
		return
	}
	rc.mu.Lock()
	rc.baseURLs = baseURLs
	rc.storedAt = time.Now()
	rc.mu.Unlock()
	log.Printf("[RegistryCache] stored BaseURLs for %d services", len(baseURLs))
}

// Invalidate 캐시 무효화. UpdateFrameworkService 성공 시 호출.
func (rc *RegistryCache) Invalidate() {
	rc.mu.Lock()
	rc.baseURLs = nil
	rc.mu.Unlock()
	log.Printf("[RegistryCache] invalidated")
}

// GetBaseURL 캐시가 유효한 경우 subsystem의 BaseURL 반환.
// 캐시 없음/만료/미등록이면 "" 반환 → api.yaml BaseURL 사용 유도.
// mc-iam-manager의 레지스트리 관리 API 2개는 항상 api.yaml 사용:
//   - ListMcmpApisServices: 이 API로 캐시를 적재하므로 api.yaml 필요
//   - UpdateFrameworkService: 캐시 BaseURL이 잘못돼도 URL 변경은 가능해야 함
func (rc *RegistryCache) GetBaseURL(subsystem, operationId string) string {
	// 레지스트리 관리 API는 api.yaml BaseURL 강제 (부트스트랩/순환 방지)
	if strings.EqualFold(subsystem, "mc-iam-manager") {
		opLower := strings.ToLower(operationId)
		if opLower == "listmcmpapisservices" || opLower == "updateframeworkservice" {
			return ""
		}
	}

	rc.mu.RLock()
	urls := rc.baseURLs
	storedAt := rc.storedAt
	rc.mu.RUnlock()

	if urls == nil {
		return ""
	}
	if time.Since(storedAt) > rc.ttl {
		log.Printf("[RegistryCache] TTL expired, using api.yaml BaseURL")
		return ""
	}

	// 대소문자 무관 매칭
	subsystemLower := strings.ToLower(subsystem)
	for name, url := range urls {
		if strings.ToLower(name) == subsystemLower {
			return url
		}
	}
	return ""
}

// extractBaseURLs responseData에서 Services 맵의 serviceName → BaseURL 추출.
func extractBaseURLs(responseData interface{}) map[string]string {
	b, err := json.Marshal(responseData)
	if err != nil {
		log.Printf("[RegistryCache] marshal error: %v", err)
		return nil
	}

	var raw struct {
		Services map[string]struct {
			BaseURL string `json:"BaseURL"`
		} `json:"Services"`
	}
	if err := json.Unmarshal(b, &raw); err != nil {
		log.Printf("[RegistryCache] unmarshal error: %v", err)
		return nil
	}

	if len(raw.Services) == 0 {
		return nil
	}

	result := make(map[string]string, len(raw.Services))
	for name, svc := range raw.Services {
		if svc.BaseURL != "" {
			result[name] = svc.BaseURL
		}
	}
	return result
}
