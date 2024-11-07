package actions

import (
	"log"
	"net/http/httputil"
	"net/url"

	"github.com/gobuffalo/buffalo"
)

var proxy *httputil.ReverseProxy

func init() {
	var err error
	ApiBaseHost, err = url.Parse("http://" + API_ADDR + ":" + API_PORT)
	if err != nil {
		panic(err)
	}
	log.Println("API baseHost is ", ApiBaseHost)
	proxy = httputil.NewSingleHostReverseProxy(ApiBaseHost)
}

func ApiCaller(c buffalo.Context) error {
	log.Println("#### IN Api Proxy")
	log.Println("Method", c.Request().Method)
	log.Println("RequestURI", ApiBaseHost.String()+c.Request().RequestURI)

	authorization := c.Value("Authorization").(string)
	c.Request().Header.Add("Authorization", authorization)

	proxy.ServeHTTP(c.Response(), c.Request())

	log.Println("#### ServeHTTP Success")
	return nil
}
