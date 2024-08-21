package actions

import (
	"log"
	"os"
	"sync"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/buffalo-pop/v3/pop/popmw"
	"github.com/gobuffalo/envy"
	contenttype "github.com/gobuffalo/mw-contenttype"
	forcessl "github.com/gobuffalo/mw-forcessl"
	"github.com/gobuffalo/x/sessions"
	"github.com/rs/cors"
	"github.com/unrolled/secure"

	i18n "github.com/gobuffalo/mw-i18n/v2"
	paramlogger "github.com/gobuffalo/mw-paramlogger"

	"mc_web_console_api/handler/mciammanager"
	"mc_web_console_api/handler/self"
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
			PreWares: []buffalo.PreWare{
				cors.AllowAll().Handler,
			},
			SessionName: "mc_web_console",
			Addr:        os.Getenv("API_ADDR") + ":" + os.Getenv("API_PORT"),
		})

		app.Use(forceSSL())
		app.Use(paramlogger.ParameterLogger)
		app.Use(contenttype.Set("application/json"))
		app.Use(popmw.Transaction(models.DB))

		app.ANY("/readyz", readyz)

		apiPath := "/api"

		auth := app.Group(apiPath + "/auth")
		auth.POST("/login", AuthLogin)
		auth.POST("/refresh", session("")(AuthLoginRefresh))
		auth.POST("/logout", session("")(AuthLogout))

		api := app.Group(apiPath)
		api.Use(session(""))
		api.POST("/disklookup", self.DiskLookup)
		api.POST("/availabledisktypebyproviderregion", self.AvailableDiskTypeByProviderRegion)
		api.POST("/{operationId}", AnyController)
	})

	return app
}

func readyz(c buffalo.Context) error {
	return c.Render(200, r.JSON(map[string]interface{}{"status": "OK"}))
}

func forceSSL() buffalo.MiddlewareFunc {
	return forcessl.Middleware(secure.Options{
		SSLRedirect:     ENV == "production",
		SSLProxyHeaders: map[string]string{"X-Forwarded-Proto": "https"},
	})
}

func session(role string) buffalo.MiddlewareFunc {
	if MCIAM_USE {
		return mciammanager.Middleware(role)
	} else {
		return func(next buffalo.Handler) buffalo.Handler {
			return func(c buffalo.Context) error {
				log.Println("NO SESSION MIDDLEWARE")
				return next(c)
			}
		}
	}
}
