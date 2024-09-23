package actions

var (
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
