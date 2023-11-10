package middleware

import (
	"github.com/gobuffalo/buffalo"
	"log"
)

// type Route struct {
// 	ID      int    `json:"id" db:"id"`
// 	Path    string `json:"path" db:"path"`
// 	Handler string `json:"handler" db:"handler"`
// }

// DynamicRoutes middleware dynamically adds routes based on data from the database.
func DynamicRoutes(next buffalo.Handler) buffalo.Handler {
	log.Println("DynamicRoutes")
	return func(c buffalo.Context) error {
		// Fetch dynamic routes from the database

		//c.App().Routes().GET("/getget/", c.Method("GetGet"))
		//router := c.Value("router").(*buffalo.App).Router()
		currentRouteInfo := c.Value("route_info").(buffalo.RouteInfo)
		log.Println("currentRouteInfo ", currentRouteInfo)
		//router.ANY(route.Path, c.Handler(route.Handler))

		//router.GET("/getget/", c.Handler("GetGet"))
		return next(c)
	}
}
