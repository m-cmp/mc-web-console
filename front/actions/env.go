package actions

import (
	"net/url"
	"os"
)

var FRONT_ADDR string
var FRONT_PORT string
var API_SCHEME string
var API_ADDR string
var API_PORT string
var SESSION_SECRET string

func init() {
	// Get environment variables with defaults
	FRONT_ADDR = getEnvOrDefault("MC_WEB_CONSOLE_FRONT_ADDR", "0.0.0.0")
	FRONT_PORT = getEnvOrDefault("MC_WEB_CONSOLE_FRONT_PORT", "3001")
	API_SCHEME = getEnvOrDefault("MC_WEB_CONSOLE_API_SCHEME", "http")
	API_ADDR = getEnvOrDefault("MC_WEB_CONSOLE_API_ADDR", "localhost")
	API_PORT = getEnvOrDefault("MC_WEB_CONSOLE_API_PORT", "3000")
	SESSION_SECRET = getEnvOrDefault("MC_WEB_CONSOLE_SESSION_SECRET", "mc-web-console-secret-key")
	// mc-infra-manager 접속 정보는 apihosts.go의 ResolveFramework/applyFrameworkAuth가
	// getapihosts(+MC_WEB_CONSOLE_INFRA_MANAGER_URL/_USER/_PASS env 폴백)로 해석한다.
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

var ApiBaseHost *url.URL
