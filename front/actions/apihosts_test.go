package actions

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
)

// resetApiHostsCache 각 테스트가 독립적으로 캐시 상태를 제어하도록 초기화한다.
func resetApiHostsCache() {
	apiHostsCache.mu.Lock()
	apiHostsCache.hosts = nil
	apiHostsCache.storedAt = time.Time{}
	apiHostsCache.mu.Unlock()
}

// pointApiToServer 테스트 서버 주소로 API_SCHEME/ADDR/PORT 전역을 임시 변경한다.
func pointApiToServer(t *testing.T, serverURL string) {
	t.Helper()
	parsed, err := url.Parse(serverURL)
	if err != nil {
		t.Fatal(err)
	}
	origScheme, origAddr, origPort := API_SCHEME, API_ADDR, API_PORT
	API_SCHEME = parsed.Scheme
	API_ADDR = parsed.Hostname()
	API_PORT = parsed.Port()
	t.Cleanup(func() {
		API_SCHEME, API_ADDR, API_PORT = origScheme, origAddr, origPort
	})
}

func newTestContext() echo.Context {
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/", nil)
	rec := httptest.NewRecorder()
	return e.NewContext(req, rec)
}

func newGetApiHostsServer(hosts map[string]FrameworkHost, calls *int) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if calls != nil {
			*calls++
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"responseData": hosts,
			"status":       map[string]interface{}{"code": 200, "message": "OK"},
		})
	}))
}

func TestResolveFrameworkFromGetApiHosts(t *testing.T) {
	resetApiHostsCache()
	server := newGetApiHostsServer(map[string]FrameworkHost{
		"mc-infra-manager":       {BaseURL: "http://tumblebug.example:1323/tumblebug", AuthType: "basic"},
		"mc-application-manager": {BaseURL: "http://appmgr.example:18084", AuthType: ""},
		"mc-iam-manager":         {BaseURL: "http://iam.example:5000", AuthType: "bearer"},
	}, nil)
	defer server.Close()
	pointApiToServer(t, server.URL)

	baseURL, authType := ResolveFramework(newTestContext(), "mc-infra-manager", "http://localhost:1323/tumblebug")
	if baseURL != "http://tumblebug.example:1323/tumblebug" || authType != "basic" {
		t.Fatalf("unexpected resolve result: %s %s", baseURL, authType)
	}

	// 타 프레임워크명도 같은 캐시로 조회
	baseURL, authType = ResolveFramework(newTestContext(), "mc-application-manager", "http://fallback")
	if baseURL != "http://appmgr.example:18084" || authType != "" {
		t.Fatalf("unexpected resolve result for application-manager: %s %s", baseURL, authType)
	}
	baseURL, authType = ResolveFramework(newTestContext(), "mc-iam-manager", "http://fallback")
	if baseURL != "http://iam.example:5000" || authType != "bearer" {
		t.Fatalf("unexpected resolve result for iam-manager: %s %s", baseURL, authType)
	}
}

func TestResolveFrameworkEnvOverride(t *testing.T) {
	resetApiHostsCache()
	// env 오버라이드는 getapihosts가 정상이어도 최우선 적용된다 (네트워크 외부 dev 등)
	server := newGetApiHostsServer(map[string]FrameworkHost{
		"mc-infra-manager": {BaseURL: "http://mc-infra-manager:1323/tumblebug", AuthType: "basic"},
	}, nil)
	defer server.Close()
	pointApiToServer(t, server.URL)

	os.Setenv("MC_WEB_CONSOLE_INFRA_MANAGER_URL", "http://env-tumblebug:1323/tumblebug")
	defer os.Unsetenv("MC_WEB_CONSOLE_INFRA_MANAGER_URL")

	baseURL, authType := ResolveFramework(newTestContext(), "mc-infra-manager", "http://localhost:1323/tumblebug")
	if baseURL != "http://env-tumblebug:1323/tumblebug" {
		t.Fatalf("expected env override, got %s", baseURL)
	}
	if authType != "" {
		t.Fatalf("env override must not carry authType, got %s", authType)
	}
}

func TestResolveFrameworkFinalFallback(t *testing.T) {
	resetApiHostsCache()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	pointApiToServer(t, server.URL)
	server.Close()
	os.Unsetenv("MC_WEB_CONSOLE_INFRA_MANAGER_URL")

	baseURL, _ := ResolveFramework(newTestContext(), "mc-infra-manager", "http://localhost:1323/tumblebug")
	if baseURL != "http://localhost:1323/tumblebug" {
		t.Fatalf("expected final fallback, got %s", baseURL)
	}
}

func TestFetchApiHostsCacheTTL(t *testing.T) {
	resetApiHostsCache()
	calls := 0
	server := newGetApiHostsServer(map[string]FrameworkHost{
		"mc-infra-manager": {BaseURL: "http://tumblebug.example:1323/tumblebug", AuthType: "basic"},
	}, &calls)
	defer server.Close()
	pointApiToServer(t, server.URL)

	for i := 0; i < 3; i++ {
		if _, err := fetchApiHosts(newTestContext()); err != nil {
			t.Fatal(err)
		}
	}
	if calls != 1 {
		t.Fatalf("expected 1 remote call within TTL, got %d", calls)
	}

	// TTL 만료 시 재조회
	apiHostsCache.mu.Lock()
	apiHostsCache.storedAt = time.Now().Add(-2 * apiHostsCacheTTL)
	apiHostsCache.mu.Unlock()
	if _, err := fetchApiHosts(newTestContext()); err != nil {
		t.Fatal(err)
	}
	if calls != 2 {
		t.Fatalf("expected refetch after TTL, got %d calls", calls)
	}
}

func TestApplyFrameworkAuth(t *testing.T) {
	// basic: env 계정(기본 default/default)
	req, _ := http.NewRequest(http.MethodPost, "http://target", nil)
	applyFrameworkAuth(req, newTestContext(), "mc-infra-manager", "basic")
	user, pass, ok := req.BasicAuth()
	if !ok || user != "default" || pass != "default" {
		t.Fatalf("expected default basic auth, got %s/%s ok=%v", user, pass, ok)
	}

	// basic: env 계정 오버라이드
	os.Setenv("MC_WEB_CONSOLE_INFRA_MANAGER_USER", "opuser")
	os.Setenv("MC_WEB_CONSOLE_INFRA_MANAGER_PASS", "oppass")
	defer os.Unsetenv("MC_WEB_CONSOLE_INFRA_MANAGER_USER")
	defer os.Unsetenv("MC_WEB_CONSOLE_INFRA_MANAGER_PASS")
	req, _ = http.NewRequest(http.MethodPost, "http://target", nil)
	applyFrameworkAuth(req, newTestContext(), "mc-infra-manager", "basic")
	if user, pass, _ = req.BasicAuth(); user != "opuser" || pass != "oppass" {
		t.Fatalf("expected env basic auth override, got %s/%s", user, pass)
	}

	// bearer: 원 요청 Authorization 전달
	c := newTestContext()
	c.Request().Header.Set("Authorization", "Bearer user-token")
	req, _ = http.NewRequest(http.MethodPost, "http://target", nil)
	applyFrameworkAuth(req, c, "mc-infra-manager", "bearer")
	if got := req.Header.Get("Authorization"); got != "Bearer user-token" {
		t.Fatalf("expected bearer forwarding, got %q", got)
	}

	// 인증 없음: 아무것도 부착하지 않음 (basic 대상 외 Bearer 미전송 규칙 포함)
	c = newTestContext()
	c.Request().Header.Set("Authorization", "Bearer user-token")
	req, _ = http.NewRequest(http.MethodPost, "http://target", nil)
	applyFrameworkAuth(req, c, "mc-application-manager", "")
	if got := req.Header.Get("Authorization"); got != "" {
		t.Fatalf("expected no auth header, got %q", got)
	}
}

func TestFrameworkEnvKey(t *testing.T) {
	cases := map[string]string{
		"mc-infra-manager":       "MC_WEB_CONSOLE_INFRA_MANAGER",
		"mc-application-manager": "MC_WEB_CONSOLE_APPLICATION_MANAGER",
		"mc-data-manager":        "MC_WEB_CONSOLE_DATA_MANAGER",
	}
	for in, want := range cases {
		if got := frameworkEnvKey(in); got != want {
			t.Fatalf("frameworkEnvKey(%s) = %s, want %s", in, got, want)
		}
	}
}

// TestValidFrameworkURL 스킴 방어 검증 (토큰 전송 대상 한정)
func TestValidFrameworkURL(t *testing.T) {
	valid := []string{"http://a", "https://a"}
	invalid := []string{"", "ftp://a", "a.example.com", "//a"}
	for _, u := range valid {
		if !validFrameworkURL(u) {
			t.Fatalf("expected valid: %s", u)
		}
	}
	for _, u := range invalid {
		if validFrameworkURL(u) {
			t.Fatalf("expected invalid: %s", u)
		}
	}
}
