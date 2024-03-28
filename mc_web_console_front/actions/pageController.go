package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func OperationPageController(c buffalo.Context) error {
	category := c.Param("category")
	page := c.Param("page")
	renderHtml := "/operation/" + category + "/" + page + ".html"

	c.Set("category", category)
	c.Set("page", page)

	return c.Render(http.StatusOK, tr.HTML(renderHtml))
}

func SettingPageController(c buffalo.Context) error {
	category := c.Param("category")
	page := c.Param("page")
	renderHtml := "/setting/" + category + "/" + page + ".html"

	c.Set("category", category)
	c.Set("page", page)

	return c.Render(http.StatusOK, tr.HTML(renderHtml))
}
