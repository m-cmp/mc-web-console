package actions

import (
	"net/url"
	"os"
)

var FRONT_ADDR string
var FRONT_PORT string
var API_ADDR string
var API_PORT string

func init() {
	// Get environment variables with defaults
	FRONT_ADDR = getEnvOrDefault("FRONT_ADDR", "0.0.0.0")
	FRONT_PORT = getEnvOrDefault("FRONT_PORT", "3005")
	API_ADDR = getEnvOrDefault("API_ADDR", "mcmp.dev.cscmzc.com")
	API_PORT = getEnvOrDefault("API_PORT", "3000")
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

var ApiBaseHost *url.URL
