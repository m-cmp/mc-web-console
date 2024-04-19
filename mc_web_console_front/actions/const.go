package actions

import (
	"net/url"
	"os"
)

var (
	APIbaseHost               *url.URL
	APILoginPath              = "/api/authlogin/1234"
	APILoginRefreshPath       = "/api/mciam/auth/login/refresh"
	APILogoutPath             = "/api/mciam/auth/logout"
	APIUserValidatePath       = "/api/mciam/auth/validate"
	APIUserInfoPath           = "/api/mciam/auth/userinfo"
	RootPathForRedirect       map[string]interface{}
	RootPathForRedirectString string
)

func init() {
	APIADDR := os.Getenv("API_ADDR")
	APIPORT := os.Getenv("API_PORT")
	APIbaseHost, _ = url.Parse("http://" + APIADDR + ":" + APIPORT)

	RootPathForRedirect = map[string]interface{}{
		"depth1": "operation",
		"depth2": "dashboard",
		"depth3": "ns",
	}
	RootPathForRedirectString = "/webconsole/operation/dashboard/ns"
}
