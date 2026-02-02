package errors

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
)

// CustomErrorHandler Echo 커스텀 에러 핸들러
func CustomErrorHandler(err error, c echo.Context) {
	// 이미 응답이 전송되었으면 무시
	if c.Response().Committed {
		return
	}

	// AppError 타입 체크
	if appErr, ok := IsAppError(err); ok {
		c.JSON(appErr.Code, map[string]interface{}{
			"responseData": nil,
			"status": map[string]interface{}{
				"code":    appErr.Code,
				"message": appErr.Message,
			},
		})
		return
	}

	// Echo HTTP Error 처리
	if he, ok := err.(*echo.HTTPError); ok {
		code := he.Code
		message := fmt.Sprintf("%v", he.Message)

		c.JSON(code, map[string]interface{}{
			"responseData": nil,
			"status": map[string]interface{}{
				"code":    code,
				"message": message,
			},
		})
		return
	}

	// 기본 에러 처리 (500)
	c.Logger().Error(err)
	c.JSON(http.StatusInternalServerError, map[string]interface{}{
		"responseData": nil,
		"status": map[string]interface{}{
			"code":    http.StatusInternalServerError,
			"message": "Internal Server Error",
		},
	})
}

// WrapError 일반 에러를 AppError로 변환
func WrapError(err error) *AppError {
	if err == nil {
		return nil
	}

	if appErr, ok := IsAppError(err); ok {
		return appErr
	}

	return NewInternalServerError("Internal Server Error", err)
}
