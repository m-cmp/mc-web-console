package config

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
)

// Config 전체 애플리케이션 설정
type Config struct {
	Server          ServerConfig
	Database        DatabaseConfig
	MCIAM           MCIAMConfig
	ApiSpec         *ApiSpec
	RegistryCache   RegistryCacheInterface
	SetupYaml       SetupYamlConfig
}

// SetupYamlConfig FR-CLOUD-ADMIN-006-08용 raw yaml 도달성 확인 설정
type SetupYamlConfig struct {
	// MCWEBCONSOLE_MENUYAML mc-web-console 메뉴 정의 yaml의 raw URL
	McWebconsoleMenuYaml string
	// MCADMINCLI_APIYAML mc-admin-cli api 카탈로그 yaml의 raw URL
	McAdmincliApiYaml string
}

// RegistryCacheInterface proxy.go가 의존하는 캐시 인터페이스 (순환 import 방지).
// BaseURL + ActionSpec(path/method) 모두 캐시 우선, 없으면 api.yaml fallback.
type RegistryCacheInterface interface {
	// GetBaseURL 캐시의 Services에서 BaseURL 반환. "" 이면 api.yaml BaseURL 사용.
	GetBaseURL(subsystem, operationId string) string
	// GetActionSpec 캐시의 ServiceActions에서 ActionSpec 반환. nil 이면 api.yaml ActionSpec 사용.
	GetActionSpec(subsystem, operationId string) *ActionSpec
	Store(responseData interface{})
	Invalidate()
}

// ServerConfig 서버 설정
type ServerConfig struct {
	Port    string
	Address string
	Env     string
}

// DatabaseConfig 데이터베이스 설정
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// MCIAMConfig MC-IAM 설정
type MCIAMConfig struct {
	Use       bool
	TicketUse bool
}

// Load 설정 로드
func Load() (*Config, error) {
	// 환경 변수 우선
	viper.AutomaticEnv()

	cfg := &Config{
		Server: ServerConfig{
			Port:    getEnv("API_PORT", "3001"),
			Address: getEnv("API_ADDR", ""),
			Env:     getEnv("GO_ENV", "development"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "mc_web_console"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		MCIAM: MCIAMConfig{
			Use:       getEnv("MCIAM_USE", "false") == "true",
			TicketUse: getEnv("MCIAM_TICKET_USE", "false") == "true",
		},
		SetupYaml: SetupYamlConfig{
			McWebconsoleMenuYaml: getEnv("MCWEBCONSOLE_MENUYAML", ""),
			McAdmincliApiYaml:    getEnv("MCADMINCLI_APIYAML", ""),
		},
	}

	// API 스펙 로드
	apiSpec, err := LoadApiSpec("../conf/api.yaml")
	if err != nil {
		return nil, fmt.Errorf("failed to load API spec: %w", err)
	}
	cfg.ApiSpec = apiSpec

	return cfg, nil
}

// getEnv 환경 변수 또는 기본값 반환
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// GetServerAddress 서버 주소 반환
func (c *Config) GetServerAddress() string {
	if c.Server.Address != "" {
		return c.Server.Address + ":" + c.Server.Port
	}
	return ":" + c.Server.Port
}

// GetDatabaseDSN 데이터베이스 DSN 반환
func (c *Config) GetDatabaseDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.DBName,
		c.Database.SSLMode,
	)
}
