package actions

import (
	"net/url"
	"os"
)

var (
	LoginPath       = "/auth/login/"
	APIbaseHost     *url.URL
	APILoginPath    = "/api/mciam/auth/login"
	APILogoutPath   = "/api/mciam/auth/logout"
	APIValidatePath = "/api/mciam/auth/validate"
)

func init() {
	APIADDR := os.Getenv("API_ADDR")
	APIPORT := os.Getenv("API_PORT")
	APIbaseHost, _ = url.Parse("http://" + APIADDR + ":" + APIPORT)
}
