package actions

var (
	APILoginPath = "/api/authlogin"
	// APILoginRefreshPath       = "/api/mciam/auth/login/refresh"
	APILogoutPath = "/api/authlogout"
	// APIUserValidatePath       = "/api/mciam/auth/validate"
	APIUserInfoPath           = "/api/mciam/auth/userinfo"
	RootPathForRedirect       map[string]interface{}
	RootPathForRedirectString string
)

func init() {
	RootPathForRedirect = map[string]interface{}{
		"depth1": "operation",
		"depth2": "dashboard",
		"depth3": "ns",
	}
	RootPathForRedirectString = "/webconsole/operation/dashboard/ns"
}
