package actions

import (
	"log"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/gobuffalo/buffalo"
)

var proxy *httputil.ReverseProxy

func init() {
	APIADDR := os.Getenv("API_ADDR")
	APIPORT := os.Getenv("API_PORT")
	targetURL, err := url.Parse("http://" + APIADDR + ":" + APIPORT)
	if err != nil {
		log.Fatal("Error parsing target URL:", err)
	}
	proxy = httputil.NewSingleHostReverseProxy(targetURL)
}

func ApiCaller(c buffalo.Context) error {
	proxy.ServeHTTP(c.Response(), c.Request())
	return nil
}
