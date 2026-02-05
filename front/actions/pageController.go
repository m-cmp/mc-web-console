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
	// Echo의 /* 와일드카드는 전체 경로를 포함하므로 파라미터에서 추출
	path := c.Request().URL.Path
	renderHtmlPath := "pages" + strings.TrimSuffix(strings.TrimPrefix(path, "/webconsole"), "/")
	suffix := ".html"
	iframefix := ".iframe"

	_, err := templates.FS().Open(renderHtmlPath + suffix)
	if err != nil {
		_, err := templates.FS().Open(renderHtmlPath + iframefix + suffix)
		if err != nil {
			return c.HTML(http.StatusNotFound, "<html><body><h1>404 Not Found</h1></body></html>")
		} else {
			// iFrame 템플릿 렌더링
			return RenderHTML(c, http.StatusOK, renderHtmlPath+iframefix+suffix, nil)
		}
	}

	// 일반 템플릿 렌더링
	return RenderHTML(c, http.StatusOK, renderHtmlPath+suffix, nil)
}
