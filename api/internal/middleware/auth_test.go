package middleware

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"mc_web_console_api/internal/config"
	"mc_web_console_api/pkg/errors"
	pkgjwt "mc_web_console_api/pkg/jwt"

	gojwt "github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

const testKid = "test-kid"

func newCertsServer(t *testing.T, key *rsa.PublicKey) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/auth/certs" {
			http.NotFound(w, r)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"keys": []map[string]string{{
				"kid": testKid,
				"kty": "RSA",
				"alg": "RS256",
				"use": "sig",
				"n":   base64.RawURLEncoding.EncodeToString(key.N.Bytes()),
				"e":   base64.RawURLEncoding.EncodeToString(big.NewInt(int64(key.E)).Bytes()),
			}},
		})
	}))
	t.Cleanup(srv.Close)
	return srv
}

func iamConfig(baseURL string) *config.Config {
	return &config.Config{
		MCIAM: config.MCIAMConfig{Use: true},
		ApiSpec: &config.ApiSpec{
			Services: map[string]config.Service{
				"mc-iam-manager": {BaseURL: baseURL, Auth: config.AuthConfig{Type: "bearer"}},
			},
			ServiceActions: map[string]map[string]config.ActionSpec{
				"mc-iam-manager": {"Getcerts": {Method: "get", ResourcePath: "/api/auth/certs"}},
			},
		},
	}
}

func signRS256(t *testing.T, key *rsa.PrivateKey, kid string, exp time.Time) string {
	t.Helper()
	tok := gojwt.NewWithClaims(gojwt.SigningMethodRS256, gojwt.MapClaims{
		"preferred_username": "mzc-noh",
		"email":              "noh@example.com",
		"exp":                exp.Unix(),
	})
	tok.Header["kid"] = kid
	s, err := tok.SignedString(key)
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	return s
}

// runProxyAuth 미들웨어를 통과하면 200과 userId, 거부되면 AppError 코드를 반환한다.
func runProxyAuth(t *testing.T, cfg *config.Config, authHeader string) (int, string) {
	t.Helper()
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/mc-infra-manager/GetCredentialHolderList", nil)
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set("config", cfg)

	var userID string
	err := ProxyAuthMiddleware(func(c echo.Context) error {
		userID, _ = c.Get("userId").(string)
		return c.NoContent(http.StatusOK)
	})(c)
	if err != nil {
		appErr, ok := err.(*errors.AppError)
		if !ok {
			t.Fatalf("unexpected error type %T: %v", err, err)
		}
		return appErr.Code, ""
	}
	return rec.Code, userID
}

func TestProxyAuthMiddleware_IAMMode(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	otherKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	srv := newCertsServer(t, &key.PublicKey)
	cfg := iamConfig(srv.URL)

	valid := signRS256(t, key, testKid, time.Now().Add(time.Hour))

	cases := []struct {
		name     string
		header   string
		wantCode int
	}{
		{"no token", "", http.StatusUnauthorized},
		{"malformed token", "Bearer abc.def.ghi", http.StatusUnauthorized},
		{"signed by other key", "Bearer " + signRS256(t, otherKey, testKid, time.Now().Add(time.Hour)), http.StatusUnauthorized},
		{"expired", "Bearer " + signRS256(t, key, testKid, time.Now().Add(-time.Minute)), http.StatusUnauthorized},
		{"local HS256 token", "Bearer " + mustLocalToken(t), http.StatusUnauthorized},
		{"valid bearer", "Bearer " + valid, http.StatusOK},
		{"valid raw (front ApiCaller format)", valid, http.StatusOK},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			code, userID := runProxyAuth(t, cfg, tc.header)
			if code != tc.wantCode {
				t.Fatalf("code = %d, want %d", code, tc.wantCode)
			}
			if tc.wantCode == http.StatusOK && userID != "mzc-noh" {
				t.Fatalf("userId = %q, want mzc-noh", userID)
			}
		})
	}
}

func mustLocalToken(t *testing.T) string {
	t.Helper()
	tok, err := pkgjwt.GenerateToken("local", "Local", "local@example.com", "user", time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	return tok
}

func TestProxyAuthMiddleware_LocalMode(t *testing.T) {
	cfg := &config.Config{MCIAM: config.MCIAMConfig{Use: false}}

	if code, _ := runProxyAuth(t, cfg, ""); code != http.StatusUnauthorized {
		t.Fatalf("no token: code = %d, want 401", code)
	}
	if code, _ := runProxyAuth(t, cfg, "Bearer abc.def.ghi"); code != http.StatusUnauthorized {
		t.Fatalf("forged token: code = %d, want 401", code)
	}
	code, userID := runProxyAuth(t, cfg, "Bearer "+mustLocalToken(t))
	if code != http.StatusOK || userID != "local" {
		t.Fatalf("valid local token: code = %d userId = %q", code, userID)
	}
}
