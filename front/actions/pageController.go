package actions

import (
	"front/templates"
	"log"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

// 화면 제어
// path에 맞게 호출을 해야 render 와 breadCrumb 가 동작함.
// ex) /webconsole/configuration/workspace/manage" 롤 경로를 주고
//
//	templates/pages 아래에 /configuration/workspace/manage 에 html 파일을 만들면 됨.
func PageController(c buffalo.Context) error {
	renderHtmlPath := "pages" + strings.TrimSuffix(strings.TrimPrefix(c.Request().URL.Path, "/webconsole"), "/") + ".html"
	log.Println("renderHtmlPath : ", renderHtmlPath)
	_, err := templates.FS().Open(renderHtmlPath)
	if err != nil {
		return c.Render(http.StatusNotFound, defaultRender.HTML("error-404.html"))
	}
	return c.Render(http.StatusOK, webconsoleRender.HTML(renderHtmlPath))
}
