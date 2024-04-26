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
	apiAddr := os.Getenv("API_ADDR")
	apiPort := os.Getenv("API_PORT")
	apiBaseHost, err := url.Parse("http://" + apiAddr + ":" + apiPort)
	if err != nil {
		panic(err)
	}
	log.Println("APIbaseHost", apiBaseHost)
	proxy = httputil.NewSingleHostReverseProxy(apiBaseHost)
}

func ApiCaller(c buffalo.Context) error {
	log.Println("#### IN ApiCaller")
	log.Println("Method", c.Request().Method)
	log.Println("RequestURI", c.Request().RequestURI)
	c.Request().Header.Add("Authorization", c.Session().Get("Authorization").(string))
	proxy.ServeHTTP(c.Response(), c.Request())
	log.Println("#### ServeHTTP Success")
	return nil
}
