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
	"github.com/rs/cors"
	"github.com/unrolled/secure"

	// gwa "github.com/gobuffalo/gocraft-work-adapter"

	i18n "github.com/gobuffalo/mw-i18n/v2"
	paramlogger "github.com/gobuffalo/mw-paramlogger"

	// "github.com/gomodule/redigo/redis"

	"mc_web_console_api/locales"
	"mc_web_console_api/models"

	_ "mc_web_console_api/docs" //mcone의 경우

	buffaloSwagger "github.com/swaggo/buffalo-swagger"
	"github.com/swaggo/buffalo-swagger/swaggerFiles"
)

// ENV is used to help switch settings based on where the
// application is being run. Default is "development".
var ENV = envy.Get("GO_ENV", "development")

var (
	app     *buffalo.App
	appOnce sync.Once
	T       *i18n.Translator
	//w       worker.Worker
	//q *amqpw.Adapter
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

// @title			  API
// @version		??
// @description	  API Swagger page
// @contact.name
// @contact.url	https://github.com/
// @contact.email
// @license.name
// @license.url
// @host		localhost:3000
// @BasePath	/
func App() *buffalo.App {
	appOnce.Do(func() {
		app = buffalo.New(buffalo.Options{
			Env:          ENV,
			SessionStore: sessions.Null{},
			PreWares: []buffalo.PreWare{
				cors.Default().Handler,
			},
			SessionName: "_mc_web_console_api_session",
			Addr:        os.Getenv("API_ADDR") + ":" + os.Getenv("API_PORT"),
		})

		// Automatically redirect to SSL
		app.Use(forceSSL())

		// Log request parameters (filters apply).
		app.Use(paramlogger.ParameterLogger)

		// Set the request content type to JSON
		app.Use(contenttype.Set("application/json"))

		// Wraps each request in a transaction.
		//   c.Value("tx").(*pop.Connection)
		// Remove to disable this.
		app.Use(popmw.Transaction(models.DB))

		app.Use(SkipMiddlewareByRoutePath) // 경로에 따라 middleware skip. ( Authorize 도 같이 처리 함.)

		//app.Use(Authorize)
		app.Use(SetCloudProviderList)

		RoutesManager(app)
		app.GET("/swagger/{*docs}", buffaloSwagger.WrapHandler(swaggerFiles.Handler))

		// app.ServeFiles("/", http.FS(public.FS())) // serve files from the public directory

	})

	return app
}

// middleware moved to middleware.go

// translations, forceSSL는 buffalo 에서 정의한 커스텀 미들웨어이므로 이동시키지 않음.

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

// Redirect에 route 정보 전달
func RedirectTool(c buffalo.Context, p string) error {
	routes := app.Routes()
	for _, route := range routes {
		if route.PathName == p {
			return c.Redirect(302, route.Path)
		}
	}
	return c.Redirect(302, "/")
}
