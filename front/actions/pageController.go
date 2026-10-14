package actions

import (
	"front/templates"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

// PageController handles dynamic page routing
// path에 맞게 호출을 해야 render 와 breadCrumb 가 동작함.
// ex) "/webconsole/configuration/workspace/manage" 롤 경로를 주고
// templates/pages 아래에 /configuration/workspace/manage 에 html 파일을 만들면 됨.
func PageController(c echo.Context) error {
	path := c.Request().URL.Path
	trimmed := strings.TrimSuffix(strings.TrimPrefix(path, "/webconsole"), "/")

	// WEB-FIX-002: /webconsole/_view/{menuId} → generic iframe shell
	if strings.HasPrefix(trimmed, "/_view/") {
		menuID := strings.Trim(strings.TrimPrefix(trimmed, "/_view/"), "/")
		if menuID == "" || strings.Contains(menuID, "/") {
			return c.HTML(http.StatusNotFound, "<html><body><h1>404 Not Found</h1></body></html>")
		}
		return RenderHTML(c, http.StatusOK, "pages/operation/generic.iframe.html", map[string]interface{}{
			"MenuId": menuID,
		})
	}

	renderHtmlPath := "pages" + trimmed
	suffix := ".html"
	iframeSuffix := ".iframe"

	_, err := templates.FS().Open(renderHtmlPath + suffix)
	if err != nil {
		_, err := templates.FS().Open(renderHtmlPath + iframeSuffix + suffix)
		if err != nil {
			return c.HTML(http.StatusNotFound, "<html><body><h1>404 Not Found</h1></body></html>")
		}
		return RenderHTML(c, http.StatusOK, renderHtmlPath+iframeSuffix+suffix, nil)
	}

	return RenderHTML(c, http.StatusOK, renderHtmlPath+suffix, nil)
}
