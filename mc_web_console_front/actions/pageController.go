package actions

import (
	"log"
	"mc_web_console_front/templates"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

func PageController(c buffalo.Context) error {
	depth1 := c.Param("depth1")
	depth2 := c.Param("depth2")
	depth3 := c.Param("depth3")
	var renderHtmlPath string
	if depth1 != "" && depth2 != "" && depth3 != "" {
		c.Set("depth", [...]string{depth1, depth2, depth3})
		renderHtmlPath = "/pages" + strings.TrimPrefix(c.Request().URL.Path, "/webconsole")
		renderHtmlPath = strings.TrimSuffix(renderHtmlPath, "/") + ".html"
		log.Println("renderHtmlPath : ", renderHtmlPath)
		_, err := templates.FS().Open(strings.TrimPrefix(renderHtmlPath, "/"))
		if err != nil {
			return c.Render(http.StatusNotFound, defaultRender.HTML("error-404.html"))
		}
	}
	return c.Render(http.StatusOK, webconsoleRender.HTML(renderHtmlPath))
}
