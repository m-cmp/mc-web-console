package actions

import (
	"fmt"
	"log"
	"mc_web_console_api/handler/self"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/buffalo/render"
)

func DefaultMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		fmt.Println("@@@@@DefaultMiddleware ")
		accessToken := strings.TrimPrefix(c.Request().Header.Get("Authorization"), "Bearer ")
		claims, err := self.GetCmigTokenClaims(accessToken)
		if err != nil {
			log.Println(err.Error())
			return c.Render(http.StatusInternalServerError, render.JSON(map[string]interface{}{"error": err.Error()}))
		}
		c.Set("Authorization", c.Request().Header.Get("Authorization"))
		c.Set("UserId", claims.Upn)
		c.Set("UserName", claims.Name)
		c.Set("Email", claims.Email)
		return next(c)
	}
}
