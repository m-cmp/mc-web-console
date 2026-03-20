package middleware

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
	"net/url"

	"github.com/labstack/echo/v4"
)

// IsTokenExistMiddleware checks if the Authorization token exists in cookies
func IsTokenExistMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Skip auth for specific paths
		if shouldSkipAuth(c.Request().URL.Path) {
			return next(c)
		}

		cookie, err := c.Request().Cookie("Authorization")
		if err != nil && c.Request().RequestURI == "/" {
			log.Println(err.Error())
			return c.Redirect(http.StatusSeeOther, "/auth/login")
		} else if err != nil {
			log.Println(err.Error())
			return c.Redirect(http.StatusSeeOther, "/auth/unauthorized#cookieError")
		}

		if cookie == nil || cookie.Value == "" || cookie.Value == "undefined" {
			errMsg := fmt.Errorf("token is not exist")
			log.Println(errMsg.Error())
			return c.Redirect(http.StatusSeeOther, "/auth/unauthorized#AuthorizationNotExist")
		}

		// JWT는 base64 패딩(=) 포함 가능 → 쿠키 저장 시 encodeURIComponent 적용되어 있으면 디코딩
		tokenValue, _ := url.QueryUnescape(cookie.Value)
		if tokenValue == "" {
			tokenValue = cookie.Value
		}

		// Check cookie expiration (if Expires is set)
		if !cookie.Expires.IsZero() && cookie.Expires.Before(time.Now()) {
			errMsg := fmt.Errorf("cookie token is expired")
			log.Println(errMsg.Error())
			return c.Redirect(http.StatusSeeOther, "/auth/unauthorized#cookieExpired")
		}

		c.Set("Authorization", tokenValue)
		return next(c)
	}
}

// shouldSkipAuth checks if the given path should skip authentication
func shouldSkipAuth(path string) bool {
	// Paths that don't require authentication
	skipPaths := []string{
		"/readyz",
		"/auth/login",
		"/auth/logout",
		"/auth/unauthorized",
		"/auth/signup",
		"/api/auth/login",
		"/api/auth/refresh",
		"/api/auth/signup",
		"/static/",
		"/assets/",
		"/favicon.ico",
	}

	for _, skipPath := range skipPaths {
		if path == skipPath || strings.HasPrefix(path, skipPath) {
			return true
		}
	}

	return false
}
