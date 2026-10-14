package actions

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
)

// FrameworkHost getapihosts가 내려주는 프레임워크별 접속 정보.
// credential은 API 서버가 노출하지 않으므로 BaseURL과 AuthType만 갖는다.
type FrameworkHost struct {
	BaseURL  string `json:"BaseURL"`
	AuthType string `json:"AuthType"`
}

// apiHostsCache getapihosts 응답 전체 맵의 인메모리 캐시.
// TTL 이후 재조회하므로 레지스트리(USE_REGISTRY_URL) 주소 변경도 추종한다.
var apiHostsCache = struct {
	mu       sync.Mutex
	hosts    map[string]FrameworkHost
	storedAt time.Time
}{}

const apiHostsCacheTTL = 60 * time.Second

// getApiHostsURL front가 이미 아는 API 서버 주소로 getapihosts 엔드포인트를 조립한다.
// (ApiCaller 리버스 프록시와 동일한 주소 조합 — 신규 설정 불필요)
func getApiHostsURL() string {
	return API_SCHEME + "://" + API_ADDR + ":" + API_PORT + "/api/getapihosts"
}

// fetchApiHosts POST /api/getapihosts 를 호출해 전체 프레임워크 맵을 반환한다.
// 캐시가 유효하면 원격 호출 없이 캐시를 반환한다.
func fetchApiHosts(c echo.Context) (map[string]FrameworkHost, error) {
	apiHostsCache.mu.Lock()
	if apiHostsCache.hosts != nil && time.Since(apiHostsCache.storedAt) < apiHostsCacheTTL {
		hosts := apiHostsCache.hosts
		apiHostsCache.mu.Unlock()
		return hosts, nil
	}
	apiHostsCache.mu.Unlock()

	req, err := http.NewRequest(http.MethodPost, getApiHostsURL(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	// 레지스트리 캐시 갱신 경로가 사용자 토큰/쿠키를 쓸 수 있으므로 원 요청 인증 정보를 전달
	if c != nil {
		if authorization, _ := c.Get("Authorization").(string); authorization != "" {
			req.Header.Set("Authorization", authorization)
		} else if authHeader := c.Request().Header.Get("Authorization"); authHeader != "" {
			req.Header.Set("Authorization", authHeader)
		}
		for _, cookie := range c.Request().Cookies() {
			req.AddCookie(cookie)
		}
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("getapihosts returned %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed struct {
		ResponseData map[string]FrameworkHost `json:"responseData"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, err
	}
	if len(parsed.ResponseData) == 0 {
		return nil, fmt.Errorf("getapihosts returned empty host map")
	}

	apiHostsCache.mu.Lock()
	apiHostsCache.hosts = parsed.ResponseData
	apiHostsCache.storedAt = time.Now()
	apiHostsCache.mu.Unlock()

	return parsed.ResponseData, nil
}

// frameworkEnvKey 프레임워크명에서 env 키를 유도한다.
// mc-infra-manager → MC_WEB_CONSOLE_INFRA_MANAGER (기존 변수명과 호환)
func frameworkEnvKey(framework string) string {
	name := strings.TrimPrefix(strings.ToLower(framework), "mc-")
	name = strings.ToUpper(strings.ReplaceAll(name, "-", "_"))
	return "MC_WEB_CONSOLE_" + name
}

// ResolveFramework 프레임워크의 BaseURL과 인증 방식을 해석한다.
// 우선순위: MC_WEB_CONSOLE_{NAME}_URL env(명시 오버라이드 — 설정된 경우만)
//   → getapihosts(캐시)  ← 일반 경로. 레지스트리의 backend 주소는 docker 네트워크명이므로
//     front가 같은 네트워크에 있으면 그대로 도달. 네트워크 밖(로컬 개발 등)에서는 env로 오버라이드
//   → fallbackURL(+경고 로그)
func ResolveFramework(c echo.Context, framework, fallbackURL string) (string, string) {
	if envURL := getEnvOrDefault(frameworkEnvKey(framework)+"_URL", ""); validFrameworkURL(envURL) {
		return envURL, ""
	}

	if hosts, err := fetchApiHosts(c); err == nil {
		if host, ok := hosts[framework]; ok && validFrameworkURL(host.BaseURL) {
			return host.BaseURL, host.AuthType
		}
		log.Printf("[ResolveFramework] %s not found in getapihosts response", framework)
	} else {
		log.Printf("[ResolveFramework] getapihosts failed: %v", err)
	}

	log.Printf("[ResolveFramework] WARNING: falling back to default URL for %s: %s — check API server or set %s_URL",
		framework, fallbackURL, frameworkEnvKey(framework))
	return fallbackURL, ""
}

// validFrameworkURL 토큰/요청을 내보낼 대상 URL의 스킴을 방어적으로 검증한다.
func validFrameworkURL(rawURL string) bool {
	return strings.HasPrefix(rawURL, "http://") || strings.HasPrefix(rawURL, "https://")
}

// applyFrameworkAuth 프레임워크가 요구하는 인증 방식에 맞춰 요청에 인증을 부착한다.
//   - basic: MC_WEB_CONSOLE_{NAME}_USER/PASS env 계정 (기본 default/default)
//   - bearer: 원 요청(사용자)의 Authorization 헤더 전달 (basic 대상에는 절대 미전송)
//   - 그 외: 인증 미부착
func applyFrameworkAuth(req *http.Request, c echo.Context, framework, authType string) {
	switch strings.ToLower(authType) {
	case "basic":
		user := getEnvOrDefault(frameworkEnvKey(framework)+"_USER", "default")
		pass := getEnvOrDefault(frameworkEnvKey(framework)+"_PASS", "default")
		req.SetBasicAuth(user, pass)
	case "bearer":
		authorization, _ := c.Get("Authorization").(string)
		if authorization == "" {
			authorization = c.Request().Header.Get("Authorization")
		}
		if authorization != "" {
			if !strings.HasPrefix(authorization, "Bearer ") {
				authorization = "Bearer " + authorization
			}
			req.Header.Set("Authorization", authorization)
		}
	}
}
