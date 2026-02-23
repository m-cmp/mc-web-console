package main

import (
	"fmt"
	"log"
	"mc_web_console_api/internal/config"
	"mc_web_console_api/internal/handler"
	"mc_web_console_api/internal/middleware"
	"mc_web_console_api/internal/model"
	"mc_web_console_api/pkg/errors"
	"mc_web_console_api/pkg/jwt"

	"github.com/labstack/echo/v4"
)

func main() {
	// 설정 로드
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// JWT 시크릿 키 설정 (환경 변수에서 로드, 없으면 기본값)
	jwtSecret := "your-secret-key-change-in-production" // TODO: 환경 변수에서 로드
	jwt.SetSecretKey(jwtSecret)

	// 데이터베이스 초기화 (옵션 - DB 설정 완료 시 활성화)
	/*
	if err := repository.InitDatabase(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer repository.CloseDatabase()

	// 자동 마이그레이션
	if err := repository.AutoMigrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	*/

	// Echo 인스턴스 생성
	e := echo.New()

	// 커스텀 에러 핸들러 설정
	e.HTTPErrorHandler = errors.CustomErrorHandler

	// 미들웨어 설정
	e.Use(middleware.CustomLoggerConfig())
	e.Use(middleware.CustomRecoveryConfig())
	e.Use(middleware.CustomCORSConfig())
	e.Use(middleware.RequestIDMiddleware)
	e.Use(middleware.PanicHandler)

	// Config를 핸들러에서 사용할 수 있도록 context에 주입
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("config", cfg)
			return next(c)
		}
	})

	// Health check 엔드포인트
	e.GET("/readyz", func(c echo.Context) error {
		return c.JSON(200, map[string]interface{}{
			"status":      "OK",
			"framework":   "Echo v4",
			"mciam_use":   cfg.MCIAM.Use,
			"environment": cfg.Server.Env,
		})
	})

	// API 그룹
	api := e.Group("/api")

	// 인증 라우트 (미들웨어 제외)
	auth := api.Group("/auth")
	auth.POST("/login", handler.Login)
	auth.POST("/refresh", handler.Refresh)

	// 보호된 인증 라우트 (인증 필요) - DB 설정 완료 시 활성화
	/*
	authProtected := api.Group("/auth")
	authProtected.Use(middleware.AuthMiddleware)
	authProtected.POST("/validate", handler.Validate)
	authProtected.POST("/logout", handler.Logout)
	authProtected.POST("/userinfo", handler.UserInfo)
	*/

	// 서브시스템 프록시 라우트 (Buffalo SubsystemAnyController 호환)
	// POST /api/:subsystemName/:operationId → conf/api.yaml 기반으로 백엔드 서비스에 프록시
	api.Any("/:subsystemName/:operationId", handler.SubsystemAnyController)

	// 테스트 엔드포인트들
	api.GET("/hello", func(c echo.Context) error {
		requestID := middleware.GetRequestID(c)
		return c.JSON(200, map[string]interface{}{
			"message":    "Hello from Echo API!",
			"version":    "Phase 2 - Authentication System (DB disabled)",
			"request_id": requestID,
		})
	})

	api.GET("/test/response", func(c echo.Context) error {
		resp := model.CommonResponseStatusOK(map[string]interface{}{
			"test":  "data",
			"items": []string{"item1", "item2"},
		})
		return c.JSON(resp.Status.Code, resp)
	})

	// JWT 토큰 생성 테스트
	api.POST("/test/generate-token", func(c echo.Context) error {
		token, err := jwt.GenerateToken("testuser", "Test User", "test@example.com", "user", 3600*1000000000)
		if err != nil {
			return errors.NewInternalServerError("Failed to generate token", err)
		}
		resp := model.CommonResponseStatusOK(map[string]interface{}{
			"token": token,
		})
		return c.JSON(resp.Status.Code, resp)
	})

	// 공개 테스트 엔드포인트 (인증 불필요)
	api.GET("/test/error", func(c echo.Context) error {
		return errors.NewBadRequest("This is a test error")
	})

	// 서버 시작
	address := cfg.GetServerAddress()
	fmt.Printf("\n")
	fmt.Printf("🚀 Echo server starting on %s\n", address)
	fmt.Printf("📝 Environment: %s\n", cfg.Server.Env)
	fmt.Printf("🔐 MCIAM Use: %v\n", cfg.MCIAM.Use)
	fmt.Printf("✅ API Spec loaded: %d services\n", len(cfg.ApiSpec.Services))
	fmt.Printf("🎯 Phase 2: Authentication System Complete (DB disabled for testing)\n")
	fmt.Printf("🔐 JWT Secret: %s\n", jwtSecret[:20]+"...")
	fmt.Printf("⚠️  Note: Database is disabled. Enable it in main.go when DB is ready.\n")
	fmt.Printf("\n")

	if err := e.Start(address); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
