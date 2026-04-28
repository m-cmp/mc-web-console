package middleware

import (
	"fmt"
	"runtime/debug"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// CustomRecoveryConfig Panic recovery 설정
func CustomRecoveryConfig() echo.MiddlewareFunc {
	return middleware.RecoverWithConfig(middleware.RecoverConfig{
		StackSize: 4 << 10, // 4KB
		LogErrorFunc: func(c echo.Context, err error, stack []byte) error {
			c.Logger().Errorf("[PANIC RECOVER] %v\n%s", err, debug.Stack())
			return nil
		},
		DisableStackAll:  false,
		DisablePrintStack: false,
	})
}

// PanicHandler 커스텀 panic 핸들러
func PanicHandler(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		defer func() {
			if r := recover(); r != nil {
				err, ok := r.(error)
				if !ok {
					err = fmt.Errorf("%v", r)
				}
				c.Logger().Errorf("[PANIC] %v\n%s", err, debug.Stack())

				// 500 에러 응답
				c.JSON(500, map[string]interface{}{
					"responseData": nil,
					"status": map[string]interface{}{
						"code":    500,
						"message": "Internal Server Error",
					},
				})
			}
		}()
		return next(c)
	}
}
