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
		if err != nil {
			log.Println(err.Error())
			return c.Redirect(http.StatusSeeOther, "/auth/unauthorized")
		}

		if cookie == nil || cookie.Expires.After(time.Now()) || cookie.Value == "" {
			errMsg := fmt.Errorf("token is not exist or expired")
			log.Println(errMsg.Error())
			return c.Redirect(http.StatusSeeOther, "/auth/unauthorized")
		}

		return next(c)
	}
}
