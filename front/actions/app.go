package actions

import (
	"net/http"

	"front/middleware"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/unrolled/secure"
)

var (
	app *echo.Echo
)

// App is where all routes and middleware for Echo should be defined.
// This is the nerve center of your application.
func App() *echo.Echo {
	if app == nil {
		app = echo.New()

		// Hide Echo banner
		app.HideBanner = true

		// Session middleware (using Gorilla sessions)
		store := sessions.NewCookieStore([]byte("mc-web-console-secret-key")) // TODO: 환경 변수에서 읽기
		store.Options = &sessions.Options{
			Path:     "/",
			MaxAge:   86400 * 7, // 7 days
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		}
		app.Use(session.Middleware(store))

		// Security middleware (forceSSL)
		app.Use(forceSSL())

		// Logger middleware
		app.Use(echomiddleware.Logger())

		// Recover middleware
		app.Use(echomiddleware.Recover())

		// Custom auth middleware (applied globally, skipped for specific routes)
		app.Use(middleware.IsTokenExistMiddleware)

		// Health check endpoint (no auth required)
		app.GET("/readyz", readyz)

		// Auth routes (no auth required)
		auth := app.Group("/auth")
		auth.GET("/login", UserLogin)
		auth.GET("/logout", UserLogout)
		auth.GET("/unauthorized", UserUnauthorized)
		auth.GET("/signup", UserSignup)

		// API auth endpoints (no auth required)
		authapi := app.Group("/api")
		authapi.POST("/auth/login", SessionInitializer)
		authapi.POST("/auth/refresh", SessionInitializer)
		authapi.POST("/auth/signup", SignupProxy)

		// Root redirect
		app.GET("/", func(c echo.Context) error {
			return c.Redirect(http.StatusSeeOther, RootPathForRedirectString)
		})

		// Page controller for webconsole (wildcard routing)
		pages := app.Group("/webconsole")
		pages.GET("/*", PageController)

		// API proxy (wildcard routing)
		api := app.Group("/api")
		api.Any("/*", ApiCaller)

		// Static file serving - serve webpack build output from public directory
		app.Static("/assets", "public/assets")
		app.Static("/static", "public/assets/static")

		// Fallback to source assets if not found in public
		app.Static("/css", "assets/css")
		app.Static("/js", "assets/js")

		app.GET("/favicon.ico", func(c echo.Context) error {
			return c.File("public/assets/favicon.ico")
		})
	}

	return app
}

// forceSSL returns a middleware that adds security headers
func forceSSL() echo.MiddlewareFunc {
	secureMiddleware := secure.New(secure.Options{
		SSLRedirect:     false,
		SSLProxyHeaders: map[string]string{"X-Forwarded-Proto": "https"},
	})

	return echo.WrapMiddleware(secureMiddleware.Handler)
}

// readyz is a health check endpoint
func readyz(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "OK",
	})
}
