package actions

import (
	"net/http/httputil"
	"net/url"

	"github.com/labstack/echo/v4"
)

var proxy *httputil.ReverseProxy

func init() {
	var err error
	ApiBaseHost, err = url.Parse(API_SCHEME + "://" + API_ADDR + ":" + API_PORT)
	if err != nil {
		panic(err)
	}
	proxy = httputil.NewSingleHostReverseProxy(ApiBaseHost)
}

// ApiCaller proxies API requests to the backend
func ApiCaller(c echo.Context) error {
	// Get Authorization from context (set by middleware)
	authorization, _ := c.Get("Authorization").(string)
	if authorization != "" {
		c.Request().Header.Set("Authorization", authorization)
	}

	// Serve the reverse proxy
	proxy.ServeHTTP(c.Response(), c.Request())
	return nil
}
