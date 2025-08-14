package actions

import (
	"net/http"

	"front/middleware"
	"front/public"

	"github.com/gobuffalo/buffalo"
	forcessl "github.com/gobuffalo/mw-forcessl"
	i18n "github.com/gobuffalo/mw-i18n/v2"
	paramlogger "github.com/gobuffalo/mw-paramlogger"
	"github.com/unrolled/secure"
)

// ENV is used to help switch settings based on where the
// application is being run. Default is "development".

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
			SessionName: "mc_web_console",
			Addr:        FRONT_ADDR + ":" + FRONT_PORT,
		})

		app.Use(forceSSL())
		app.Use(paramlogger.ParameterLogger)
		app.Use(middleware.IsTokenExistMiddleware)

		app.Middleware.Skip(middleware.IsTokenExistMiddleware, alive)
		app.GET("/alive", alive)

		auth := app.Group("/auth")
		auth.Middleware.Skip(middleware.IsTokenExistMiddleware, UserLogin, UserLogout, UserUnauthorized)
		auth.GET("/login", UserLogin)
		auth.GET("/logout", UserLogout)
		auth.GET("/unauthorized", UserUnauthorized)

		authapi := app.Group("/api")
		authapi.Middleware.Skip(middleware.IsTokenExistMiddleware, SessionInitializer)
		authapi.POST("/auth/login", SessionInitializer)
		authapi.POST("/auth/refresh", SessionInitializer)
		app.Redirect(http.StatusSeeOther, "/", RootPathForRedirectString) //home redirect to dash

		pages := app.Group("/webconsole")
		pages.GET("/{path:.+}", PageController)

		apiPath := "/api"
		api := app.Group(apiPath)
		api.ANY("/{path:.+}", ApiCaller)

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
		SSLRedirect:     false,
		SSLProxyHeaders: map[string]string{"X-Forwarded-Proto": "https"},
	})
}

func alive(c buffalo.Context) error {
	return c.Render(200, defaultRender.JSON(map[string]interface{}{
		"status": "OK",
	}))
}
