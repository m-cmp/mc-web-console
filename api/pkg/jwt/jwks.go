package jwt

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// IAMClaims mc-iam-manager(Keycloak)가 발급한 access token의 클레임 중 사용하는 값
type IAMClaims struct {
	PreferredUsername string `json:"preferred_username"`
	Name              string `json:"name"`
	Email             string `json:"email"`
	jwt.RegisteredClaims
}

// UserID 로그인 ID (preferred_username, 없으면 sub)
func (c *IAMClaims) UserID() string {
	if c.PreferredUsername != "" {
		return c.PreferredUsername
	}
	return c.Subject
}

// jwkSet GET /api/auth/certs 응답 (Keycloak JWKS)
type jwkSet struct {
	Keys []struct {
		Kid string `json:"kid"`
		Kty string `json:"kty"`
		Alg string `json:"alg"`
		Use string `json:"use"`
		N   string `json:"n"`
		E   string `json:"e"`
	} `json:"keys"`
}

// minRefetchInterval 모르는 kid로 인한 certs 재조회 최소 간격 (위조 토큰 반복 호출로 IAM에 부하를 주지 않도록)
const minRefetchInterval = 30 * time.Second

// KeySet mc-iam-manager 공개키 캐시. 서명 키 교체(kid 변경) 시 자동 재조회한다.
type KeySet struct {
	certsURL  string
	client    *http.Client
	mu        sync.Mutex
	keys      map[string]*rsa.PublicKey
	fetchedAt time.Time
}

// NewKeySet certsURL 예: http://mc-iam-manager:5000/api/auth/certs
func NewKeySet(certsURL string) *KeySet {
	return &KeySet{
		certsURL: certsURL,
		client:   &http.Client{Timeout: 10 * time.Second},
		keys:     map[string]*rsa.PublicKey{},
	}
}

// URL certs 조회 경로
func (ks *KeySet) URL() string {
	return ks.certsURL
}

func (ks *KeySet) publicKey(kid string) (*rsa.PublicKey, error) {
	ks.mu.Lock()
	defer ks.mu.Unlock()

	if key, ok := ks.keys[kid]; ok {
		return key, nil
	}
	if !ks.fetchedAt.IsZero() && time.Since(ks.fetchedAt) < minRefetchInterval {
		return nil, fmt.Errorf("unknown key id: %s", kid)
	}
	keys, err := ks.fetch()
	ks.fetchedAt = time.Now()
	if err != nil {
		return nil, err
	}
	ks.keys = keys
	if key, ok := ks.keys[kid]; ok {
		return key, nil
	}
	return nil, fmt.Errorf("unknown key id: %s", kid)
}

func (ks *KeySet) fetch() (map[string]*rsa.PublicKey, error) {
	resp, err := ks.client.Get(ks.certsURL)
	if err != nil {
		return nil, fmt.Errorf("fetch certs: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fetch certs: status %d", resp.StatusCode)
	}

	var set jwkSet
	if err := json.Unmarshal(body, &set); err != nil {
		return nil, fmt.Errorf("parse certs: %w", err)
	}

	keys := map[string]*rsa.PublicKey{}
	for _, k := range set.Keys {
		if k.Kty != "RSA" || (k.Use != "" && k.Use != "sig") {
			continue
		}
		n, err := base64.RawURLEncoding.DecodeString(k.N)
		if err != nil {
			continue
		}
		e, err := base64.RawURLEncoding.DecodeString(k.E)
		if err != nil {
			continue
		}
		keys[k.Kid] = &rsa.PublicKey{
			N: new(big.Int).SetBytes(n),
			E: int(new(big.Int).SetBytes(e).Int64()),
		}
	}
	if len(keys) == 0 {
		return nil, fmt.Errorf("no RSA signing keys in certs")
	}
	return keys, nil
}

// ParseIAMToken RS256 서명과 만료를 검증하고 클레임을 반환한다.
func (ks *KeySet) ParseIAMToken(tokenString string) (*IAMClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &IAMClaims{}, func(token *jwt.Token) (interface{}, error) {
		kid, _ := token.Header["kid"].(string)
		if kid == "" {
			return nil, fmt.Errorf("kid header not found")
		}
		return ks.publicKey(kid)
	}, jwt.WithValidMethods([]string{"RS256"}), jwt.WithExpirationRequired())
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*IAMClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}
