package actions

import (
	"log"
	"net/http"
	"os"

	"mc_web_console_front/middleware"
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
		app.Use(csrf.New)

		app.ANY("/alive", alive)
		auth := app.Group("/auth")
		auth.GET("/login", UserLoginHandler)
		auth.GET("/logout", UserLogoutHandler)
		auth.GET("/unauthorized", UserUnauthorizedHandler)

		app.Redirect(http.StatusSeeOther, "/", RootPathForRedirectString) //home redirect to dash

		pages := app.Group("/webconsole")
		pages.Use(session(""))
		pages.ANY("/alive", alive)
		pages.GET("/{depth1}/{depth2}/{depth3}", PageController)

		apiPath := "/api"
		api := app.Group(apiPath)
		api.ANY("/{path:.+}", ApiCaller)

		devpages := app.Group("/dev")
		devpages.Use(session(""))
		devpages.GET("/apicall", Devapicall)

		app.ServeFiles("/", http.FS(public.FS()))
	}

	return app
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
	return c.Render(200, defaultRender.JSON(map[string]interface{}{
		"status": "OK",
		"method": c.Request().Method,
	}))
}

func session(role string) buffalo.MiddlewareFunc {
	if MCIAM_USE {
		return middleware.Middleware(role)
	} else {
		return func(next buffalo.Handler) buffalo.Handler {
			return func(c buffalo.Context) error {
				log.Println("NO SESSION MIDDLEWARE")
				return next(c)
			}
		}
	}
}
