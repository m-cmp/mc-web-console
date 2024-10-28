package actions

import (
	"net/url"
	"os"
)

func init() {
	FRONT_ADDR = os.Getenv("FRONT_ADDR")
	FRONT_PORT = os.Getenv("FRONT_PORT")
	API_ADDR = os.Getenv("API_ADDR")
	API_PORT = os.Getenv("API_PORT")
}

var FRONT_ADDR = "0.0.0.0"
var FRONT_PORT = "3001"
var API_ADDR = "0.0.0.0"
var API_PORT = "3000"

var ApiBaseHost *url.URL
