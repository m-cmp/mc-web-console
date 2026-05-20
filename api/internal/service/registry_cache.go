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
//
// 캐시 적재: proxy.go가 ListMcmpApisServices 응답 통과 시 자동 저장 (TTL 60s)
// 캐시 무효화: proxy.go가 UpdateFrameworkService 성공 시 자동 무효화
//
// 플로우:
//  1. Bootstrap (캐시 비어있음): api.yaml의 mc-iam-manager 주소로 readyz 체크 (자동 fallback)
//  2. ListMcmpApisServices 응답 수신: BaseURL + ServiceActions 캐시에 저장
//  3. 이후 모든 프록시: 캐시 BaseURL + 캐시 ActionSpec 우선, 없으면 api.yaml fallback
//  4. mc-iam-manager URL 변경 후: cache invalidate → ListMcmpApisServices 재적재 → 갱신
//
// 예외: ListMcmpApisServices, UpdateFrameworkService 는 항상 mc-iam-manager 고정 주소 사용
// (api.yaml의 mc-iam-manager BaseURL = mc-iam-manager 고정/bootstrap 주소)
type RegistryCache struct {
	mu        sync.RWMutex
	services  map[string]config.Service                // serviceName → Service(BaseURL, Auth)
	actions   map[string]map[string]config.ActionSpec  // serviceName → operationId → ActionSpec
	storedAt  time.Time
	ttl       time.Duration
}

// NewRegistryCache RegistryCache 생성 (ttl: 캐시 유효 시간)
func NewRegistryCache(ttl time.Duration) *RegistryCache {
	return &RegistryCache{ttl: ttl}
}

// Store ListMcmpApisServices 응답(McmpApiDefinitions)에서 Services + ServiceActions 저장.
func (rc *RegistryCache) Store(responseData interface{}) {
	services, actions := extractDefinitions(responseData)
	if len(services) == 0 {
		return
	}
	rc.mu.Lock()
	rc.services = services
	rc.actions = actions
	rc.storedAt = time.Now()
	rc.mu.Unlock()
	log.Printf("[RegistryCache] stored %d services (actions: %d)", len(services), len(actions))
}

// GetAllServices 캐시가 유효한 경우 전체 서비스 목록 반환.
// 캐시 없음/만료이면 nil 반환.
func (rc *RegistryCache) GetAllServices() map[string]config.Service {
	rc.mu.RLock()
	services := rc.services
	storedAt := rc.storedAt
	rc.mu.RUnlock()

	if services == nil || rc.isExpired(storedAt) {
		return nil
	}

	result := make(map[string]config.Service, len(services))
	for k, v := range services {
		result[k] = v
	}
	return result
}

// Invalidate 캐시 무효화. UpdateFrameworkService 성공 시 호출.
func (rc *RegistryCache) Invalidate() {
	rc.mu.Lock()
	rc.services = nil
	rc.actions = nil
	rc.mu.Unlock()
	log.Printf("[RegistryCache] invalidated")
}

// GetBaseURL 캐시가 유효한 경우 subsystem의 BaseURL 반환.
// 캐시 없음/만료/미등록이면 "" 반환 → proxy.go가 api.yaml BaseURL 사용.
//
// 예외: mc-iam-manager의 ListMcmpApisServices, UpdateFrameworkService는 "" 반환
// → mc-iam-manager 고정 주소(api.yaml)로 호출하여 캐시 부트스트랩/순환 방지
func (rc *RegistryCache) GetBaseURL(subsystem, operationId string) string {
	if isRegistryManagementAPI(subsystem, operationId) {
		return ""
	}

	rc.mu.RLock()
	services := rc.services
	storedAt := rc.storedAt
	rc.mu.RUnlock()

	if services == nil || rc.isExpired(storedAt) {
		return ""
	}

	subsystemLower := strings.ToLower(subsystem)
	for name, svc := range services {
		if strings.ToLower(name) == subsystemLower {
			return svc.BaseURL
		}
	}
	return ""
}

// GetActionSpec 캐시가 유효한 경우 subsystem/operationId의 ActionSpec 반환.
// 캐시 없음/만료/미등록이면 nil 반환 → proxy.go가 api.yaml ActionSpec 사용.
func (rc *RegistryCache) GetActionSpec(subsystem, operationId string) *config.ActionSpec {
	if isRegistryManagementAPI(subsystem, operationId) {
		return nil
	}

	rc.mu.RLock()
	actions := rc.actions
	storedAt := rc.storedAt
	rc.mu.RUnlock()

	if actions == nil || rc.isExpired(storedAt) {
		return nil
	}

	subsystemLower := strings.ToLower(subsystem)
	operationIdLower := strings.ToLower(operationId)
	for svcName, svcActions := range actions {
		if strings.ToLower(svcName) == subsystemLower {
			for opId, spec := range svcActions {
				if strings.ToLower(opId) == operationIdLower {
					s := spec
					return &s
				}
			}
			return nil // 서비스는 있지만 해당 operationId 없음
		}
	}
	return nil
}

func (rc *RegistryCache) isExpired(storedAt time.Time) bool {
	if time.Since(storedAt) > rc.ttl {
		log.Printf("[RegistryCache] TTL expired, using api.yaml")
		return true
	}
	return false
}

// isRegistryManagementAPI mc-iam-manager의 레지스트리 관리 API 여부 반환.
// 이 API들은 항상 mc-iam-manager 고정 주소로 호출해야 함.
func isRegistryManagementAPI(subsystem, operationId string) bool {
	if !strings.EqualFold(subsystem, "mc-iam-manager") {
		return false
	}
	opLower := strings.ToLower(operationId)
	return opLower == "listmcmpapisservices" || opLower == "updateframeworkservice"
}

// extractDefinitions responseData에서 Services 와 ServiceActions 추출.
func extractDefinitions(responseData interface{}) (map[string]config.Service, map[string]map[string]config.ActionSpec) {
	b, err := json.Marshal(responseData)
	if err != nil {
		log.Printf("[RegistryCache] marshal error: %v", err)
		return nil, nil
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
		return nil, nil
	}

	if len(raw.Services) == 0 {
		return nil, nil
	}

	services := make(map[string]config.Service, len(raw.Services))
	for name, svc := range raw.Services {
		services[name] = config.Service{
			Version: svc.Version,
			BaseURL: svc.BaseURL,
			Auth: config.AuthConfig{
				Type:     svc.Auth.Type,
				Username: svc.Auth.Username,
				Password: svc.Auth.Password,
			},
		}
	}

	actions := make(map[string]map[string]config.ActionSpec, len(raw.ServiceActions))
	for svcName, svcActions := range raw.ServiceActions {
		actions[svcName] = make(map[string]config.ActionSpec, len(svcActions))
		for opId, action := range svcActions {
			actions[svcName][opId] = config.ActionSpec{
				Method:       action.Method,
				ResourcePath: action.ResourcePath,
				Description:  action.Description,
			}
		}
	}

	return services, actions
}
