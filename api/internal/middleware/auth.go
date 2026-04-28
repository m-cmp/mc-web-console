package middleware

import (
	"mc_web_console_api/internal/repository"
	"mc_web_console_api/pkg/errors"
	"mc_web_console_api/pkg/jwt"
	"strings"

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
