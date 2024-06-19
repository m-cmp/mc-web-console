package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func UserLoginHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, defaultRender.HTML("pages/auth/login.html"))
}
