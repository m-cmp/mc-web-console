package middleware

import (
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// RequestIDMiddleware Request ID 생성 미들웨어
func RequestIDMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Request ID 생성
		requestID := c.Request().Header.Get(echo.HeaderXRequestID)
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// Context에 설정
		c.Set("request_id", requestID)

		// Response 헤더에 추가
		c.Response().Header().Set(echo.HeaderXRequestID, requestID)

		return next(c)
	}
}

// GetRequestID Context에서 Request ID 조회
func GetRequestID(c echo.Context) string {
	if requestID, ok := c.Get("request_id").(string); ok {
		return requestID
	}
	return ""
}
