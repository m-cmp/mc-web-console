package actions

import (
	"github.com/gobuffalo/buffalo"
)

func ApiCaller(c buffalo.Context) error {
	return c.Render(200, r.JSON(map[string]interface{}{
		"status": "OK",
		"method": c.Request().Method,
	}))
}
