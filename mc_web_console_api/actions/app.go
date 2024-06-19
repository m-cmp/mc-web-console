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
	"github.com/unrolled/secure"

	i18n "github.com/gobuffalo/mw-i18n/v2"
	paramlogger "github.com/gobuffalo/mw-paramlogger"

	"mc_web_console_api/handler/mciammanager"
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

		app.ANY("/alive", alive)

		apiPath := "/api"

		auth := app.Group(apiPath + "/auth")
		auth.POST("/login", AuthLogin)
		// auth.POST("/login/refresh", AuthLoginRefresh)
		auth.POST("/logout", AuthLogout)
		// auth.GET("/userinfo", AuthGetUserInfo)

		api := app.Group(apiPath)
		api.Use(session(""))
		api.GET("/{targetController}", GetRouteController)
		api.POST("/{targetController}", PostRouteController)

		role := app.Group("/test/role")
		role.Use(session(""))
		role.ANY("/alive", alive)

		admin := app.Group("/test/admin")
		admin.Use(session("admin"))
		admin.ANY("/alive", alive)

		viewer := app.Group("/test/viewer")
		viewer.Use(session("admin"))
		viewer.ANY("/alive", alive)

		operator := app.Group("/test/operator")
		operator.Use(session("admin"))
		operator.ANY("/alive", alive)
	})

	return app
}

func alive(c buffalo.Context) error {
	name := ""
	roles := []string{}
	sub := ""
	upn := ""
	if userName, ok := c.Value("PreferredUsername").(string); ok {
		name = userName
	}
	if userRoles, ok := c.Value("RealmAccessRoles").([]string); ok {
		roles = userRoles
	}
	if userSub, ok := c.Value("Sub").(string); ok {
		sub = userSub
	}
	if userUpn, ok := c.Value("Upn").(string); ok {
		upn = userUpn
	}

	return c.Render(200, r.JSON(map[string]interface{}{
		"status":            "OK",
		"method":            c.Request().Method,
		"preferredUsername": name,
		"realmAccessRoles":  roles,
		"Sub":               sub,
		"Upn":               upn,
	}))
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
