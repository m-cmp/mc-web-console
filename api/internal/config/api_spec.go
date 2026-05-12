package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// ApiSpec API 명세 전체 구조
type ApiSpec struct {
	Services       map[string]Service                `mapstructure:"services"`
	ServiceActions map[string]map[string]ActionSpec `mapstructure:"serviceActions"`
}

// Service 백엔드 서비스 정보
type Service struct {
	Version string     `mapstructure:"version"`
	BaseURL string     `mapstructure:"baseurl"`
	Auth    AuthConfig `mapstructure:"auth"`
}

// AuthConfig 인증 설정
type AuthConfig struct {
	Type     string `mapstructure:"type"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
}

// ActionSpec API 액션 스펙
type ActionSpec struct {
	Method        string            `mapstructure:"method"`
	ResourcePath  string            `mapstructure:"resourcePath"`
	Description   string            `mapstructure:"description"`
	RequestCoerce map[string]string `mapstructure:"requestCoerce"` // "fieldName" → "int"|"float"|"bool"
}

// LoadApiSpec conf/api.yaml 파일 로드
func LoadApiSpec(path string) (*ApiSpec, error) {
	v := viper.New()
	v.SetConfigFile(path)
	v.SetConfigType("yaml")

	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read API spec file: %w", err)
	}

	var apiSpec ApiSpec
	if err := v.Unmarshal(&apiSpec); err != nil {
		return nil, fmt.Errorf("failed to unmarshal API spec: %w", err)
	}

	return &apiSpec, nil
}

// GetService subsystem 서비스 정보만 조회 (action 불필요 시 사용)
func (a *ApiSpec) GetService(subsystem string) (*Service, error) {
	subsystemLower := strings.ToLower(subsystem)
	for key, svc := range a.Services {
		if strings.ToLower(key) == subsystemLower {
			s := svc
			return &s, nil
		}
	}
	return nil, fmt.Errorf("service not found: %s", subsystem)
}

// GetAction subsystem과 operationId로 액션 조회
func (a *ApiSpec) GetAction(subsystem, operationId string) (*Service, *ActionSpec, error) {
	// 소문자로 변환하여 매칭 (Buffalo 호환)
	subsystemLower := strings.ToLower(subsystem)
	operationIdLower := strings.ToLower(operationId)

	// 서비스 정보 조회
	var service *Service
	var serviceKey string
	for key, svc := range a.Services {
		if strings.ToLower(key) == subsystemLower {
			s := svc
			service = &s
			serviceKey = key
			break
		}
	}

	if service == nil {
		return nil, nil, fmt.Errorf("service not found: %s", subsystem)
	}

	// 액션 조회
	actions, exists := a.ServiceActions[serviceKey]
	if !exists {
		return nil, nil, fmt.Errorf("no actions found for service: %s", serviceKey)
	}

	var actionSpec *ActionSpec
	for key, spec := range actions {
		if strings.ToLower(key) == operationIdLower {
			s := spec
			actionSpec = &s
			break
		}
	}

	if actionSpec == nil {
		return nil, nil, fmt.Errorf("action not found: %s in service %s", operationId, serviceKey)
	}

	return service, actionSpec, nil
}

// GetServiceBaseURL 서비스 BaseURL 조회
func (a *ApiSpec) GetServiceBaseURL(subsystem string) (string, error) {
	subsystemLower := strings.ToLower(subsystem)

	for key, svc := range a.Services {
		if strings.ToLower(key) == subsystemLower {
			return svc.BaseURL, nil
		}
	}

	return "", fmt.Errorf("service not found: %s", subsystem)
}
