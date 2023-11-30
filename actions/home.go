package actions

import (
	"log"
	"net/http"

	"github.com/gobuffalo/buffalo"
	middleware "mc_web_console/actions/middleware"
)

func (a actions) HomeForm(c buffalo.Context) error {
	//return c.Render(http.StatusOK, r.HTML("home/index.html"))

	// 임시 main 리다이렉트
	//return c.Render(200, r.HTML("home/index.html", "application_index.html")

	return RedirectTool(c, "mainFormPath")
}

// @Summary		경로정보
// @Description	[RouteList] 경로정보를 반환 합니다.
// @Tags			debug
// @Produce		html
// @Success		200	{string}	string	"{'message':'success','status':'200', 'routes': app.Routes()}"
// @Router			/api/test/routelist/ [get]
func (a actions) RouteList(c buffalo.Context) error {
	log.Println("RouteList")
	log.Println(c.Data())
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

func GetGet(c buffalo.Context) error {
	log.Println("GetGet")
	//log.Println(c.Data())
	for k := range c.Data() {
		log.Println(k)
	}

	userSession, err := middleware.GetUserInfoFromSession(c)
	if err != nil {
		log.Println("there is no session")
	}
	c.Set("userSession", userSession)

	//current_user := "hh"
	//current_user := c.Value("current_user").(string)
	//c.Set("user", models.MCUser{})

	// c.Set("current_user", "h")
	// 	c.Set("current_user_id", "hhh")
	// 	c.Set("current_user_level", "hhh")
	// 	c.Set("current_workspace", "hhh")
	// 	c.Set("current_workspace_id", "hhh")
	// 	c.Set("current_namespace", "hh")
	// 	c.Set("current_namespace_id", "hhh")
	// 	c.Set("assigned_ws_list", []interface{}{})
	// 	c.Set("assigned_ns_list", []interface{}{})
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":     "GetGet",
		"status":      "200",
		"userSession": userSession,
	}))
}
