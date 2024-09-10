package actions

import (
	"net/url"
	"os"
	"strconv"
)

func init() {
	MCIAM_USE, _ = strconv.ParseBool(os.Getenv("MCIAM_USE"))
	FRONT_CSRF_USE, _ = strconv.ParseBool(os.Getenv("FRONT_CSRF_USE"))

	FRONT_ADDR = os.Getenv("FRONT_ADDR")
	FRONT_PORT = os.Getenv("FRONT_PORT")

	API_ADDR = os.Getenv("API_ADDR")
	API_PORT = os.Getenv("API_PORT")

	SESSION_SECRET = os.Getenv("SESSION_SECRET")
}

var FRONT_ADDR = "0.0.0.0"
var FRONT_PORT = "3001"

var API_ADDR = "0.0.0.0"
var API_PORT = "3000"

var SESSION_SECRET string

var MCIAM_USE = false // MC-IAM-MANAGER 사용여부, init 에서 재정의
var FRONT_CSRF_USE = false

var ApiBaseHost *url.URL
