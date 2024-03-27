package handler

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func OperationPageHandler(c buffalo.Context) error {
	category := c.Param("category")
	page := c.Param("page")
	renderHtml := "/operation/" + category + "/" + page + ".html"

	c.Set("pretitle", category)
	c.Set("title", page)

	return c.Render(http.StatusOK, tr.HTML(renderHtml))
}

func SettingPageHandler(c buffalo.Context) error {
	category := c.Param("category")
	page := c.Param("page")
	renderHtml := "/setting/" + category + "/" + page + ".html"

	c.Set("pretitle", category)
	c.Set("title", page)

	return c.Render(http.StatusOK, tr.HTML(renderHtml))
}
