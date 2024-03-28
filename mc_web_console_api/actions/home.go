package actions

import (
	"log"
	"net/http"

	"github.com/gobuffalo/buffalo"
)


func (a actions) HomeForm(c buffalo.Context) error {
	//return c.Render(http.StatusOK, r.HTML("home/index.html"))

	// 임시 main 리다이렉트
	//return c.Render(200, r.HTML("home/index.html", "application_index.html")

	return RedirectTool(c, "mainFormPath")
}


//	@Summary		경로정보
//	@Description	[RouteList] 경로정보를 반환 합니다.
//	@Tags			debug
//	@Produce		html
//	@Success		200	{string}	string	"{'message':'success','status':'200', 'routes': app.Routes()}"
//	@Router			/api/test/routelist/ [get]
func (a actions) RouteList(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  "200",
		"routes":  app.Routes(),
	}))
}

// 특정 help의 route정보 return
func (a actions) GetRoute(c buffalo.Context) error {
	// Get the route name from the UI
	helperName := c.Param("helper")

	// Get the path of the specific route by name
	//routePath := app.RoutePath(helperName)

	routes := app.Routes()
	for _, route := range routes {
		if route.PathName == helperName {
			log.Println(route)
			return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
				"message": "success",
				"status":  "200",
				"route":   route,
			}))
		}
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "Path not found",
		"status":  "301",
	}))
}
