package middleware

import (
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// CustomLoggerConfig 커스텀 로거 설정
func CustomLoggerConfig() echo.MiddlewareFunc {
	return middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "[${time_rfc3339}] ${status} ${method} ${uri} (${latency_human}) ${error}\n",
		CustomTimeFormat: time.RFC3339,
		Output:           nil, // 기본 출력 사용
	})
}
