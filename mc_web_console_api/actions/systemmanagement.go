package actions

import (
	"log"
	"mc_web_console_api/handler"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func GetTBHealth(c buffalo.Context) error {

	tbStatus, webStatus := handler.GetHealth()

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"webstatus": webStatus,
		"tbStatus":  tbStatus,
	}))
}
func GetObjectThroughTB(c buffalo.Context) error {
	log.Println("getobjectthroutb")

	key := c.Params().Get("key")
	object, webStatus := handler.GetObject(key)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"webstatus": webStatus,
		"object":    object,
	}))
}

// func GetTBHealth(c buffalo.Context) error {

// 	tbStatus, webStatus := handler.GetHealth()

// 	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
// 		"webstatus": webStatus,
// 		"tbStatus":  tbStatus,
// 	}))
// }

// Get value of an object

// List all objects for a given key
func GetObjectListThroughTB(c buffalo.Context) error {
	key := c.Params().Get("key")
	objectList, webStatus := handler.GetObjectList(key)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"webstatus":  webStatus,
		"objectList": objectList,
	}))
}
