package actions

import (
	"net/http"
	"os"
	"strconv"

	"mc_web_console_front/locales"
	"mc_web_console_front/public"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/envy"
	csrf "github.com/gobuffalo/mw-csrf"
	forcessl "github.com/gobuffalo/mw-forcessl"
	i18n "github.com/gobuffalo/mw-i18n/v2"
	paramlogger "github.com/gobuffalo/mw-paramlogger"
	"github.com/unrolled/secure"
)

// ENV is used to help switch settings based on where the
// application is being run. Default is "development".
var ENV = envy.Get("GO_ENV", "development")

var (
	app *buffalo.App
	T   *i18n.Translator
)

// App is where all routes and middleware for buffalo
// should be defined. This is the nerve center of your
// application.
//
// Routing, middleware, groups, etc... are declared TOP -> DOWN.
// This means if you add a middleware to `app` *after* declaring a
// group, that group will NOT have that new middleware. The same
// is true of resource declarations as well.
//
// It also means that routes are checked in the order they are declared.
// `ServeFiles` is a CATCH-ALL route, so it should always be
// placed last in the route declarations, as it will prevent routes
// declared after it to never be called.
func App() *buffalo.App {
	if app == nil {
		app = buffalo.New(buffalo.Options{
			Env:         ENV,
			SessionName: "mc_web_console",
			Addr:        os.Getenv("FRONT_ADDR") + ":" + os.Getenv("FRONT_PORT"),
		})

		app.Use(forceSSL())
		app.Use(paramlogger.ParameterLogger)
		app.Use(csrf.New) // 프론트에서 CSRF 설정이 되어 있음! 백에서 처리할 시 아래 주석 할 것.
		app.Use(translations())

		mciamUse, _ := strconv.ParseBool(os.Getenv("MCIAM_USE"))
		app.ANY("/alive", alive)

		// pages
		app.Redirect(http.StatusSeeOther, "/", RootPathForRedirectString) //home redirect to dash

		pages := app.Group("/webconsole")
		if mciamUse {
			pages.Use(McIamAuthMiddleware)
		}
		pages.GET("/{depth1}/{depth2}/{depth3}", PageController)

		// mciamAuth pages
		if mciamUse {
			auth := app.Group("/auth")
			auth.GET("/login", UserLoginHandler)
			auth.POST("/login", UserLoginHandler)
			auth.GET("/logout", UserLogoutHandler)
			auth.GET("/register", UserRegisterpageHandler)
		}

		// API 호출 Proxy to backend API buffalo
		apiPath := "/api"
		api := app.Group(apiPath)
		api.ANY("/{path:.+}", ApiCaller)

		//////////////// debug section start ////////////////
		// debug 이므로 별도 라우팅 처리... build에 포함되지 않도록 처리 할 것..
		if ENV == "development" {
			debug := app.Group("/debug")
			// common debug
			debug.GET("/", DEBUGRouteHandler)

			// flowchart debug
			debug.GET("/flow", DEBUGWorkflowHandler)

			// tabler debug
			debug.GET("/tabler", DEBUGTablerMainHandler)
			debug.GET("/tabler/{target}", DEBUGTablerHandler)

			// tabulator debug
			debug.GET("/tabulator", DEBUGTabulatorHandler)

			// page sample
			debug.GET("/sample", DEBUGSamplePageHandler)

			// debug call Test
			debug.GET("/apicall", DEBUGApicallPageController)
		}
		//////////////// debug section end ////////////////

		app.ServeFiles("/", http.FS(public.FS()))
	}

	return app
}

// translations will load locale files, set up the translator `actions.T`,
// and will return a middleware to use to load the correct locale for each
// request.
// for more information: https://gobuffalo.io/en/docs/localization
func translations() buffalo.MiddlewareFunc {
	var err error
	if T, err = i18n.New(locales.FS(), "en-US"); err != nil {
		app.Stop(err)
	}
	return T.Middleware()
}

// forceSSL will return a middleware that will redirect an incoming request
// if it is not HTTPS. "http://example.com" => "https://example.com".
// This middleware does **not** enable SSL. for your application. To do that
// we recommend using a proxy: https://gobuffalo.io/en/docs/proxy
// for more information: https://github.com/unrolled/secure/
func forceSSL() buffalo.MiddlewareFunc {
	return forcessl.Middleware(secure.Options{
		SSLRedirect:     ENV == "production",
		SSLProxyHeaders: map[string]string{"X-Forwarded-Proto": "https"},
	})
}

func alive(c buffalo.Context) error {
	return c.Render(200, r.JSON(map[string]interface{}{
		"status": "OK",
		"method": c.Request().Method,
	}))
}
