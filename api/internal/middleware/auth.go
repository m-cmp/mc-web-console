package middleware

import (
	"log"
	"mc_web_console_api/internal/config"
	"mc_web_console_api/internal/repository"
	"mc_web_console_api/pkg/errors"
	"mc_web_console_api/pkg/jwt"
	"strings"
	"sync"

	"github.com/labstack/echo/v4"
)

// AuthMiddleware 인증 미들웨어 (기본 모드)
func AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Authorization 헤더에서 토큰 추출
		token := extractToken(c)
		if token == "" {
			return errors.NewUnauthorized("Missing authorization token")
		}

		// JWT 토큰 파싱 및 검증
		claims, err := jwt.ParseToken(token)
		if err != nil {
			return errors.NewUnauthorized("Invalid token")
		}

		// DB에서 세션 확인 (DB 사용 가능 시)
		if db := repository.GetDB(); db != nil {
			sessionRepo := repository.NewSessionRepository(db)
			exists, err := sessionRepo.Exists(claims.UserID)
			if err != nil || !exists {
				return errors.NewUnauthorized("Session not found")
			}
		}

		// Context에 사용자 정보 설정
		c.Set("userId", claims.UserID)
		c.Set("userName", claims.UserName)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("Authorization", c.Request().Header.Get("Authorization"))

		return next(c)
	}
}

var (
	iamKeySetMu sync.Mutex
	iamKeySet   *jwt.KeySet
)

// getIAMKeySet mc-iam-manager 공개키 캐시 (api.yaml의 mc-iam-manager Getcerts 경로 기준)
func getIAMKeySet(cfg *config.Config) (*jwt.KeySet, error) {
	service, action, err := cfg.ApiSpec.GetAction("mc-iam-manager", "Getcerts")
	if err != nil {
		return nil, err
	}
	certsURL := service.BaseURL + action.ResourcePath

	iamKeySetMu.Lock()
	defer iamKeySetMu.Unlock()
	if iamKeySet == nil || iamKeySet.URL() != certsURL {
		iamKeySet = jwt.NewKeySet(certsURL)
	}
	return iamKeySet, nil
}

// ProxyAuthMiddleware 서브시스템 프록시·BFF 라우트 인증 미들웨어
// - MC_WEB_CONSOLE_USE_IAM=true: mc-iam-manager 발급 토큰(RS256)을 /api/auth/certs 공개키로 검증
// - false: 로컬 발급 토큰(HS256) 검증 + DB 세션 확인 (AuthMiddleware와 동일)
// front(ApiCaller)는 쿠키 토큰을 "Bearer " 없이 Authorization 헤더에 싣으므로 두 형식 모두 허용한다.
// 프록시가 role로 x-credential-holder를 정하므로 role은 컨텍스트에 설정하지 않는다 (기존 동작 유지).
func ProxyAuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		token := proxyToken(c)
		if token == "" {
			return errors.NewUnauthorized("Missing authorization token")
		}

		cfg, _ := c.Get("config").(*config.Config)
		if cfg != nil && cfg.MCIAM.Use {
			keySet, err := getIAMKeySet(cfg)
			if err != nil {
				return errors.NewInternalServerError("MCIAM certs config not found", err)
			}
			claims, err := keySet.ParseIAMToken(token)
			if err != nil {
				log.Printf("ProxyAuthMiddleware: %s %s rejected: %v", c.Request().Method, c.Request().URL.Path, err)
				return errors.NewUnauthorized("Invalid token")
			}
			c.Set("userId", claims.UserID())
			c.Set("userName", claims.Name)
			c.Set("email", claims.Email)
		} else {
			claims, err := jwt.ParseToken(token)
			if err != nil {
				return errors.NewUnauthorized("Invalid token")
			}
			if db := repository.GetDB(); db != nil {
				sessionRepo := repository.NewSessionRepository(db)
				exists, err := sessionRepo.Exists(claims.UserID)
				if err != nil || !exists {
					return errors.NewUnauthorized("Session not found")
				}
			}
			c.Set("userId", claims.UserID)
			c.Set("userName", claims.UserName)
			c.Set("email", claims.Email)
		}

		return next(c)
	}
}

// proxyToken "Bearer <token>" 또는 토큰 원문 형식의 Authorization 헤더에서 토큰 추출
func proxyToken(c echo.Context) string {
	authHeader := strings.TrimSpace(c.Request().Header.Get("Authorization"))
	if authHeader == "" {
		return ""
	}
	parts := strings.Fields(authHeader)
	switch {
	case len(parts) == 2 && parts[0] == "Bearer":
		return parts[1]
	case len(parts) == 1:
		return parts[0]
	}
	return ""
}

// extractToken Authorization 헤더에서 토큰 추출
func extractToken(c echo.Context) string {
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	// "Bearer <token>" 형식에서 토큰 추출
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}

// GetUserID Context에서 사용자 ID 조회
func GetUserID(c echo.Context) string {
	if userID, ok := c.Get("userId").(string); ok {
		return userID
	}
	return ""
}

// GetUserName Context에서 사용자 이름 조회
func GetUserName(c echo.Context) string {
	if userName, ok := c.Get("userName").(string); ok {
		return userName
	}
	return ""
}

// GetEmail Context에서 이메일 조회
func GetEmail(c echo.Context) string {
	if email, ok := c.Get("email").(string); ok {
		return email
	}
	return ""
}

// GetRole Context에서 역할 조회
func GetRole(c echo.Context) string {
	if role, ok := c.Get("role").(string); ok {
		return role
	}
	return ""
}

// OptionalAuthMiddleware 선택적 인증 미들웨어 (토큰 있으면 검증, 없어도 통과)
func OptionalAuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		token := extractToken(c)
		if token != "" {
			claims, err := jwt.ParseToken(token)
			if err == nil {
				c.Set("userId", claims.UserID)
				c.Set("userName", claims.UserName)
				c.Set("email", claims.Email)
				c.Set("role", claims.Role)
			}
		}
		return next(c)
	}
}
