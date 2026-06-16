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
var INFRA_MANAGER_URL string
var INFRA_MANAGER_USER string
var INFRA_MANAGER_PASS string

func init() {
	// Get environment variables with defaults
	FRONT_ADDR = getEnvOrDefault("MC_WEB_CONSOLE_FRONT_ADDR", "0.0.0.0")
	FRONT_PORT = getEnvOrDefault("MC_WEB_CONSOLE_FRONT_PORT", "3001")
	API_SCHEME = getEnvOrDefault("MC_WEB_CONSOLE_API_SCHEME", "http")
	API_ADDR = getEnvOrDefault("MC_WEB_CONSOLE_API_ADDR", "localhost")
	API_PORT = getEnvOrDefault("MC_WEB_CONSOLE_API_PORT", "3000")
	SESSION_SECRET = getEnvOrDefault("MC_WEB_CONSOLE_SESSION_SECRET", "mc-web-console-secret-key")
	INFRA_MANAGER_URL = getEnvOrDefault("MC_WEB_CONSOLE_INFRA_MANAGER_URL", "http://localhost:1323/tumblebug")
	INFRA_MANAGER_USER = getEnvOrDefault("MC_WEB_CONSOLE_INFRA_MANAGER_USER", "default")
	INFRA_MANAGER_PASS = getEnvOrDefault("MC_WEB_CONSOLE_INFRA_MANAGER_PASS", "default")
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

var ApiBaseHost *url.URL
