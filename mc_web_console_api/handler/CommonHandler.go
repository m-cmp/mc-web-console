package handler

import (
	// "encoding/base64"
	"fmt"
	// "log"
	// "io"
	// "net/http"
	"os"
	"strconv"
	"time"

	"github.com/gobuffalo/buffalo"
)

var SpiderURL = os.Getenv("SPIDER_URL")
var TumbleBugURL = os.Getenv("TUMBLE_URL")
var DragonFlyURL = os.Getenv("DRAGONFLY_URL")
var LadyBugURL = os.Getenv("LADYBUG_URL")

//	type CredentialInfo struct {
//		Username string
//		Password string
//	}
type CommonURL struct {
	SpiderURL    string
	TumbleBugURL string
	DragonFlyURL string
	LadyBugURL   string
}

func GetCommonURL() CommonURL {
	common_url := CommonURL{
		SpiderURL:    os.Getenv("SPIDER_URL"),
		TumbleBugURL: os.Getenv("TUMBLE_URL"),
		DragonFlyURL: os.Getenv("DRAGONFLY_URL"),
		LadyBugURL:   os.Getenv("LADYBUG_URL"),
	}
	return common_url
}

func GetNameSpaceToString(c buffalo.Context) string {
	fmt.Println("====== GET NAME SPACE ========")

	nsId := c.Session().Get("namespace")

	return nsId.(string)
}

func MakeNameSpace(name string) string {
	now := time.Now()
	nanos := strconv.FormatInt(now.UnixNano(), 10)

	result := name + "-" + nanos
	fmt.Println("makeNameSpace : ", result)
	return result
}
