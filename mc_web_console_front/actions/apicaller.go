package actions

import (
	"log"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/gobuffalo/buffalo"
)

var proxy *httputil.ReverseProxy
var ApiBaseHost *url.URL

func init() {
	apiAddr := os.Getenv("API_ADDR")
	apiPort := os.Getenv("API_PORT")
	var err error
	ApiBaseHost, err = url.Parse("http://" + apiAddr + ":" + apiPort)
	if err != nil {
		panic(err)
	}
	log.Println("APIbaseHost", ApiBaseHost)
	proxy = httputil.NewSingleHostReverseProxy(ApiBaseHost)
}

func ApiCaller(c buffalo.Context) error {
	log.Println("#### IN Api Proxy")
	log.Println("Method", c.Request().Method)
	log.Println("RequestURI", c.Request().RequestURI)
	if c.Request().RequestURI == "/api/auth/login" {
		return SessionInitializer(c)
	} else {
		c.Request().Header.Add("Authorization", c.Session().Get("Authorization").(string))
		proxy.ServeHTTP(c.Response(), c.Request())
	}
	log.Println("#### ServeHTTP Success")
	return nil
}
