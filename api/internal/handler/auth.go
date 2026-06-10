package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"mc_web_console_api/internal/config"
	"mc_web_console_api/internal/middleware"
	"mc_web_console_api/internal/model"
	"mc_web_console_api/internal/repository"
	"mc_web_console_api/pkg/errors"
	"mc_web_console_api/pkg/jwt"

	"github.com/labstack/echo/v4"
)

// LoginRequestBody id/password 페이로드
type LoginRequestBody struct {
	ID       string `json:"id"`
	Password string `json:"password"`
}

// LoginRequest Buffalo CommonRequest 호환 래퍼
type LoginRequest struct {
	Request LoginRequestBody `json:"request"`
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

// RefreshRequest 토큰 갱신 요청 (flat 형식)
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// RefreshRequestWrapper CommonRequest 래퍼 형식 (authcookie.js 호환)
type RefreshRequestWrapper struct {
	Request RefreshRequest `json:"request"`
}

// Login 로그인 핸들러
// POST /api/auth/login
// MCIAM_USE=true : mc-iam-manager로 프록시
// MCIAM_USE=false: 로컬 JWT 발급
func Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return errors.NewBadRequest("Invalid request body")
	}

	if req.Request.ID == "" || req.Request.Password == "" {
		return errors.NewBadRequest("ID and password are required")
	}

	cfg, _ := c.Get("config").(*config.Config)
	if cfg != nil && cfg.MCIAM.Use {
		return loginViaMCIAM(c, req.Request.ID, req.Request.Password, cfg)
	}
	return loginLocal(c, req.Request.ID, req.Request.Password)
}

// loginViaMCIAM MCIAM 서버에 로그인 요청을 프록시
func loginViaMCIAM(c echo.Context, id, password string, cfg *config.Config) error {
	service, actionSpec, err := cfg.ApiSpec.GetAction("mc-iam-manager", "login")
	if err != nil {
		return errors.NewInternalServerError("MCIAM login config not found", err)
	}

	targetURL := service.BaseURL + actionSpec.ResourcePath

	body, _ := json.Marshal(map[string]string{
		"id":       id,
		"password": password,
	})

	httpReq, err := http.NewRequest(http.MethodPost, targetURL, bytes.NewBuffer(body))
	if err != nil {
		return errors.NewInternalServerError("Failed to build MCIAM request", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return errors.NewInternalServerError("Failed to reach MCIAM server", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return errors.NewInternalServerError("Failed to read MCIAM response", err)
	}

	// MCIAM 응답을 그대로 클라이언트에 전달
	var data interface{}
	if err := json.Unmarshal(respBody, &data); err != nil {
		return errors.NewInternalServerError("Invalid MCIAM response", err)
	}

	// DB가 활성화된 경우 세션 저장 (MCIAM 응답에서 토큰 추출 시도)
	if resp.StatusCode == http.StatusOK {
		var loginResp LoginResponse
		if jsonErr := json.Unmarshal(respBody, &loginResp); jsonErr == nil && loginResp.AccessToken != "" && loginResp.UserID != "" {
			storeSession(loginResp.UserID, loginResp.AccessToken, loginResp.ExpiresIn, loginResp.RefreshToken, loginResp.RefreshExpiresIn)
		}
	}

	return c.JSON(resp.StatusCode, data)
}

// loginLocal DB 비활성 상태에서의 로컬 JWT 발급 (MCIAM_USE=false 용)
func loginLocal(c echo.Context, id, password string) error {
	accessExpiresIn := time.Duration(3600) * time.Second
	refreshExpiresIn := time.Duration(604800) * time.Second

	userName := "Demo User"
	email := id + "@example.com"
	role := "user"

	accessToken, err := jwt.GenerateToken(id, userName, email, role, accessExpiresIn)
	if err != nil {
		return errors.NewInternalServerError("Failed to generate access token", err)
	}
	refreshToken, err := jwt.GenerateToken(id, userName, email, role, refreshExpiresIn)
	if err != nil {
		return errors.NewInternalServerError("Failed to generate refresh token", err)
	}

	// DB가 활성화된 경우 세션 저장
	storeSession(id, accessToken, accessExpiresIn.Seconds(), refreshToken, refreshExpiresIn.Seconds())

	resp := model.CommonResponseStatusOK(&LoginResponse{
		AccessToken:      accessToken,
		RefreshToken:     refreshToken,
		ExpiresIn:        accessExpiresIn.Seconds(),
		RefreshExpiresIn: refreshExpiresIn.Seconds(),
		UserID:           id,
		UserName:         userName,
		Email:            email,
		Role:             role,
	})
	return c.JSON(resp.Status.Code, resp)
}

// Refresh 토큰 갱신 핸들러
// POST /api/auth/refresh
// {"refresh_token": "..."} 또는 {"request": {"refresh_token": "..."}} 형식 모두 지원
func Refresh(c echo.Context) error {
	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return errors.NewBadRequest("Invalid request body")
	}

	var refreshToken string

	// request 래퍼 형식 시도
	var wrapper RefreshRequestWrapper
	if jsonErr := json.Unmarshal(body, &wrapper); jsonErr == nil && wrapper.Request.RefreshToken != "" {
		refreshToken = wrapper.Request.RefreshToken
	} else {
		// flat 형식 시도
		var req RefreshRequest
		if jsonErr := json.Unmarshal(body, &req); jsonErr == nil {
			refreshToken = req.RefreshToken
		}
	}

	if refreshToken == "" {
		return errors.NewBadRequest("Refresh token is required")
	}

	cfg, _ := c.Get("config").(*config.Config)
	if cfg != nil && cfg.MCIAM.Use {
		return refreshViaMCIAM(c, refreshToken, cfg)
	}

	// 로컬 모드: refresh token으로 새 access token 발급
	userID, err := jwt.ExtractUserID(refreshToken)
	if err != nil {
		return errors.NewUnauthorized("Invalid refresh token")
	}

	newToken, err := jwt.GenerateToken(userID, "Demo User", userID+"@example.com", "user", time.Duration(3600)*time.Second)
	if err != nil {
		return errors.NewInternalServerError("Failed to generate token", err)
	}

	resp := model.CommonResponseStatusOK(map[string]interface{}{
		"access_token": newToken,
		"expires_in":   float64(3600),
	})
	return c.JSON(resp.Status.Code, resp)
}

// refreshViaMCIAM MCIAM 서버에 토큰 갱신 요청 프록시
func refreshViaMCIAM(c echo.Context, refreshToken string, cfg *config.Config) error {
	service, actionSpec, err := cfg.ApiSpec.GetAction("mc-iam-manager", "loginrefresh")
	if err != nil {
		return errors.NewInternalServerError("MCIAM refresh config not found", err)
	}

	targetURL := service.BaseURL + actionSpec.ResourcePath

	body, _ := json.Marshal(map[string]string{
		"refresh_token": refreshToken,
	})

	httpReq, err := http.NewRequest(http.MethodPost, targetURL, bytes.NewBuffer(body))
	if err != nil {
		return errors.NewInternalServerError("Failed to build MCIAM request", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return errors.NewInternalServerError("Failed to reach MCIAM server", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var data interface{}
	json.Unmarshal(respBody, &data)
	return c.JSON(resp.StatusCode, data)
}

// SignupRequestBody 회원가입 페이로드
type SignupRequestBody struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	FirstName    string `json:"firstName"`
	LastName     string `json:"lastName"`
	Organization string `json:"organization,omitempty"`
}

// SignupRequest Buffalo CommonRequest 호환 래퍼
type SignupRequest struct {
	Request SignupRequestBody `json:"request"`
}

// Signup 회원가입 핸들러
// POST /api/auth/signup
// MCIAM_USE=true : mc-iam-manager로 프록시
// MCIAM_USE=false: 미지원 안내 반환
func Signup(c echo.Context) error {
	var req SignupRequest
	if err := c.Bind(&req); err != nil {
		return errors.NewBadRequest("Invalid request body")
	}

	if req.Request.Email == "" || req.Request.Password == "" || req.Request.FirstName == "" || req.Request.LastName == "" {
		return errors.NewBadRequest("email, password, firstName, lastName are required")
	}

	cfg, _ := c.Get("config").(*config.Config)
	if cfg != nil && cfg.MCIAM.Use {
		return signupViaMCIAM(c, req.Request, cfg)
	}

	// 로컬 모드에서는 회원가입 미지원
	return c.JSON(http.StatusServiceUnavailable, map[string]interface{}{
		"error": "Sign-up is not supported in this environment.",
	})
}

// signupViaMCIAM mc-iam-manager에 회원가입 요청을 프록시
func signupViaMCIAM(c echo.Context, req SignupRequestBody, cfg *config.Config) error {
	service, actionSpec, err := cfg.ApiSpec.GetAction("mc-iam-manager", "signup")
	if err != nil {
		return errors.NewInternalServerError("MCIAM signup config not found", err)
	}

	targetURL := service.BaseURL + actionSpec.ResourcePath

	bodyMap := map[string]interface{}{
		"email":     req.Email,
		"password":  req.Password,
		"firstName": req.FirstName,
		"lastName":  req.LastName,
	}
	if req.Organization != "" {
		bodyMap["organization"] = req.Organization
	}

	body, _ := json.Marshal(bodyMap)

	httpReq, err := http.NewRequest(http.MethodPost, targetURL, bytes.NewBuffer(body))
	if err != nil {
		return errors.NewInternalServerError("Failed to build MCIAM request", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return errors.NewInternalServerError("Failed to reach MCIAM server", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return errors.NewInternalServerError("Failed to read MCIAM response", err)
	}

	var data interface{}
	if err := json.Unmarshal(respBody, &data); err != nil {
		return errors.NewInternalServerError("Invalid MCIAM response", err)
	}

	return c.JSON(resp.StatusCode, data)
}

// Validate 토큰 검증 핸들러
// POST /api/auth/validate
func Validate(c echo.Context) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return errors.NewUnauthorized("Invalid token")
	}

	resp := model.CommonResponseStatusOK(map[string]interface{}{
		"valid":     true,
		"user_id":   userID,
		"user_name": middleware.GetUserName(c),
		"email":     middleware.GetEmail(c),
		"role":      middleware.GetRole(c),
	})
	return c.JSON(resp.Status.Code, resp)
}

// storeSession DB가 활성화된 경우 세션을 저장한다. 기존 세션은 교체된다.
func storeSession(userID, accessToken string, expiresIn float64, refreshToken string, refreshExpiresIn float64) {
	db := repository.GetDB()
	if db == nil {
		return
	}
	sessionRepo := repository.NewSessionRepository(db)
	session := &model.UserSession{
		UserID:           userID,
		AccessToken:      accessToken,
		ExpiresIn:        expiresIn,
		RefreshToken:     refreshToken,
		RefreshExpiresIn: refreshExpiresIn,
	}
	if err := sessionRepo.Delete(userID); err != nil {
		log.Printf("storeSession: delete old session error (userID=%s): %v", userID, err)
	}
	if err := sessionRepo.Create(session); err != nil {
		log.Printf("storeSession: create session error (userID=%s): %v", userID, err)
	}
}

// Logout 로그아웃 핸들러
// POST /api/auth/logout
func Logout(c echo.Context) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return errors.NewUnauthorized("Not authenticated")
	}

	// DB 세션 삭제
	if db := repository.GetDB(); db != nil {
		sessionRepo := repository.NewSessionRepository(db)
		if err := sessionRepo.Delete(userID); err != nil {
			log.Printf("Logout: delete session error (userID=%s): %v", userID, err)
		}
	}

	resp := model.CommonResponseStatusOK(map[string]interface{}{
		"message": "Logged out successfully",
	})
	return c.JSON(resp.Status.Code, resp)
}

// UserInfo 사용자 정보 조회 핸들러
// POST /api/auth/userinfo
func UserInfo(c echo.Context) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return errors.NewUnauthorized("Not authenticated")
	}

	resp := model.CommonResponseStatusOK(map[string]interface{}{
		"user_id":   userID,
		"user_name": middleware.GetUserName(c),
		"email":     middleware.GetEmail(c),
		"role":      middleware.GetRole(c),
	})
	return c.JSON(resp.Status.Code, resp)
}
