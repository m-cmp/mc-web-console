package actions

import (
	"net/http/httputil"

	"github.com/gobuffalo/buffalo"
)

var proxy *httputil.ReverseProxy

func init() {
	proxy = httputil.NewSingleHostReverseProxy(APIbaseHost)
}

func ApiCaller(c buffalo.Context) error {
	proxy.ServeHTTP(c.Response(), c.Request())
	return nil
}
