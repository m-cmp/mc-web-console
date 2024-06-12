package actions

import (
	"os"
	"sync"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/buffalo-pop/v3/pop/popmw"
	"github.com/gobuffalo/envy"
	contenttype "github.com/gobuffalo/mw-contenttype"
	forcessl "github.com/gobuffalo/mw-forcessl"
	"github.com/gobuffalo/x/sessions"
	"github.com/unrolled/secure"

	i18n "github.com/gobuffalo/mw-i18n/v2"
	paramlogger "github.com/gobuffalo/mw-paramlogger"

	"mc_web_console_api/models"
)

var ENV = envy.Get("GO_ENV", "development")

var (
	app     *buffalo.App
	appOnce sync.Once
	T       *i18n.Translator
)

func App() *buffalo.App {
	appOnce.Do(func() {
		app = buffalo.New(buffalo.Options{
			Env:          ENV,
			SessionStore: sessions.Null{},
			PreWares:     []buffalo.PreWare{},
			SessionName:  "mc_web_console",
			Addr:         os.Getenv("API_ADDR") + ":" + os.Getenv("API_PORT"),
		})

		app.Use(forceSSL())
		app.Use(paramlogger.ParameterLogger)
		app.Use(contenttype.Set("application/json"))
		app.Use(popmw.Transaction(models.DB))

		apiPath := "/api"
		api := app.Group(apiPath)
		// mcimw.AuthMethod = mcimw.EnvKeycloak
		// mcimw.GrantedRoleList = []string{}
		// api.Use(mcimw.BuffaloMcimw)
		api.GET("/{targetController}", GetRouteController)
		api.POST("/{targetController}", PostRouteController)

		// DEBUG START //
		if ENV == "development" {
			debug := app.Group(apiPath + "/debug")
			debug.ANY("/{targetfw}/{path:.+}", DebugApiCaller)
		}
		//  DEBUG END  //

	})

	return app
}

func forceSSL() buffalo.MiddlewareFunc {
	return forcessl.Middleware(secure.Options{
		SSLRedirect:     ENV == "production",
		SSLProxyHeaders: map[string]string{"X-Forwarded-Proto": "https"},
	})
}
