package handler

import (
	"mc_web_console_api/internal/middleware"
	"mc_web_console_api/internal/model"
	"mc_web_console_api/internal/repository"
	"mc_web_console_api/internal/service"
	"mc_web_console_api/pkg/errors"
	"mc_web_console_api/pkg/jwt"

	"github.com/labstack/echo/v4"
)

// LoginRequest 로그인 요청
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse 로그인 응답
type LoginResponse struct {
	AccessToken      string  `json:"access_token"`
	RefreshToken     string  `json:"refresh_token"`
	ExpiresIn        float64 `json:"expires_in"`
	RefreshExpiresIn float64 `json:"refresh_expires_in"`
	UserID           string  `json:"user_id"`
	UserName         string  `json:"user_name"`
	Email            string  `json:"email"`
	Role             string  `json:"role"`
}

// RefreshRequest 토큰 갱신 요청
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Login 로그인 핸들러 (기본 모드)
// POST /api/auth/login
func Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return errors.NewBadRequest("Invalid request body")
	}

	// TODO: 실제 사용자 인증 로직 (DB 조회, 비밀번호 검증 등)
	// 현재는 데모용으로 간단히 처리
	if req.Username == "" || req.Password == "" {
		return errors.NewBadRequest("Username and password are required")
	}

	// 임시: 사용자 정보 설정 (실제로는 DB에서 조회)
	userID := req.Username
	userName := "Demo User"
	email := req.Username + "@example.com"
	role := "user"

	// 세션 생성
	sessionService := service.NewSessionService(
		repository.NewSessionRepository(repository.GetDB()),
	)

	accessExpiresIn := float64(3600)    // 1시간
	refreshExpiresIn := float64(604800) // 7일

	session, err := sessionService.CreateSession(
		userID,
		userName,
		email,
		role,
		accessExpiresIn,
		refreshExpiresIn,
	)
	if err != nil {
		return errors.NewInternalServerError("Failed to create session", err)
	}

	// 응답
	resp := model.CommonResponseStatusOK(&LoginResponse{
		AccessToken:      session.AccessToken,
		RefreshToken:     session.RefreshToken,
		ExpiresIn:        session.ExpiresIn,
		RefreshExpiresIn: session.RefreshExpiresIn,
		UserID:           userID,
		UserName:         userName,
		Email:            email,
		Role:             role,
	})

	return c.JSON(resp.Status.Code, resp)
}

// Refresh 토큰 갱신 핸들러
// POST /api/auth/refresh
func Refresh(c echo.Context) error {
	var req RefreshRequest
	if err := c.Bind(&req); err != nil {
		return errors.NewBadRequest("Invalid request body")
	}

	if req.RefreshToken == "" {
		return errors.NewBadRequest("Refresh token is required")
	}

	// 리프레시 토큰에서 사용자 ID 추출
	userID, err := jwt.ExtractUserID(req.RefreshToken)
	if err != nil {
		return errors.NewUnauthorized("Invalid refresh token")
	}

	// 세션 갱신
	sessionService := service.NewSessionService(
		repository.NewSessionRepository(repository.GetDB()),
	)

	session, err := sessionService.RefreshSession(userID, req.RefreshToken)
	if err != nil {
		return errors.NewUnauthorized("Failed to refresh token")
	}

	// 응답
	resp := model.CommonResponseStatusOK(map[string]interface{}{
		"access_token": session.AccessToken,
		"expires_in":   session.ExpiresIn,
	})

	return c.JSON(resp.Status.Code, resp)
}

// Validate 토큰 검증 핸들러
// POST /api/auth/validate
func Validate(c echo.Context) error {
	// 미들웨어에서 이미 검증되었으므로 Context에서 사용자 정보 조회
	userID := middleware.GetUserID(c)
	if userID == "" {
		return errors.NewUnauthorized("Invalid token")
	}

	// 세션 유효성 검증
	sessionService := service.NewSessionService(
		repository.NewSessionRepository(repository.GetDB()),
	)

	valid, err := sessionService.ValidateSession(userID)
	if err != nil || !valid {
		return errors.NewUnauthorized("Session is not valid")
	}

	// 응답
	resp := model.CommonResponseStatusOK(map[string]interface{}{
		"valid":     true,
		"user_id":   userID,
		"user_name": middleware.GetUserName(c),
		"email":     middleware.GetEmail(c),
		"role":      middleware.GetRole(c),
	})

	return c.JSON(resp.Status.Code, resp)
}

// Logout 로그아웃 핸들러
// POST /api/auth/logout
func Logout(c echo.Context) error {
	// Context에서 사용자 ID 조회
	userID := middleware.GetUserID(c)
	if userID == "" {
		return errors.NewUnauthorized("Not authenticated")
	}

	// 세션 삭제
	sessionService := service.NewSessionService(
		repository.NewSessionRepository(repository.GetDB()),
	)

	if err := sessionService.DeleteSession(userID); err != nil {
		return errors.NewInternalServerError("Failed to logout", err)
	}

	// 응답
	resp := model.CommonResponseStatusOK(map[string]interface{}{
		"message": "Logged out successfully",
	})

	return c.JSON(resp.Status.Code, resp)
}

// UserInfo 사용자 정보 조회 핸들러
// POST /api/auth/userinfo
func UserInfo(c echo.Context) error {
	// Context에서 사용자 정보 조회
	userID := middleware.GetUserID(c)
	if userID == "" {
		return errors.NewUnauthorized("Not authenticated")
	}

	// 응답
	resp := model.CommonResponseStatusOK(map[string]interface{}{
		"user_id":   userID,
		"user_name": middleware.GetUserName(c),
		"email":     middleware.GetEmail(c),
		"role":      middleware.GetRole(c),
	})

	return c.JSON(resp.Status.Code, resp)
}
