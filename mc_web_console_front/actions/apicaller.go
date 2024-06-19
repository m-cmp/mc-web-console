package actions

import (
	"log"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"

	"github.com/gobuffalo/buffalo"
)

var proxy *httputil.ReverseProxy
var mciamUse bool

func init() {
	mciamUse, _ = strconv.ParseBool(os.Getenv("MCIAM_USE"))
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
	log.Println("#### IN Api Proxy")
	log.Println("Method", c.Request().Method)
	log.Println("RequestURI", c.Request().RequestURI)
	proxy.ServeHTTP(c.Response(), c.Request())
	log.Println("#### ServeHTTP Success")
	return nil
}
