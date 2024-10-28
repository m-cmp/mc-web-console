package middleware

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gobuffalo/buffalo"
)

func IsTokenExistMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		cookie, err := c.Request().Cookie("Authorization")
		if err != nil && c.Request().RequestURI == "/" {
			log.Println(err.Error())
			return c.Redirect(http.StatusSeeOther, "/auth/login")
		} else if err != nil {
			log.Println(err.Error())
			return c.Redirect(http.StatusSeeOther, "/auth/unauthorized#cookieError")
		}

		if cookie == nil || cookie.Value == "" || cookie.Value == "undefined" {
			errMsg := fmt.Errorf("token is not exist")
			log.Println(errMsg.Error())
			return c.Redirect(http.StatusSeeOther, "/auth/unauthorized#AuthorizationNotExist")
		}

		if cookie.Expires.After(time.Now()) {
			errMsg := fmt.Errorf("cookie token is expired")
			log.Println(errMsg.Error())
			return c.Redirect(http.StatusSeeOther, "/auth/unauthorized#cookieExpired")
		}

		c.Set("Authorization", cookie.Value)
		return next(c)
	}
}
